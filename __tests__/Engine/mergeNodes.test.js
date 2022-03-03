/* @flow */
import { engine } from "../../start";
import {
  Builder,
  Node,
  Result,
  Success,
  Failure,
  log,
  NodeCandidate,
  isSuccess,
  isEnhancedNode,
  getResultData,
  EnhancedNode,
} from "../../src";

const _date_created = [
    expect.any(Number),
    expect.any(Number),
    expect.any(Number),
    expect.any(Number),
    expect.any(Number),
  ],
  _uuid = expect.any(String),
  _hash = expect.any(String),
  identity = { low: expect.any(Number), high: 0 };
const builder = new Builder();

beforeEach(async () => {
  await engine.cleanDB();
});

afterAll(async (done) => {
  engine.closeAllSessions();
  engine.closeDriver();
  done();
});

describe("validations", () => {
  test("Failure if not a Node.", async () => {
    const e = engine;
    const nodes = [
      {
        labels: ["Node"],
        properties: {
          A: 1,
          _hash: "123",
        },
      },
    ];
    const result = await e.mergeNodes(nodes);

    expect(isSuccess(result)).toEqual(false);
    expect(result.reason).toEqual(
      `Engine.mergeNodes(): Validation error: First argument must be Node[].`
    );
  });
  test("Failure if Node does not have a label + _hash combination.", async () => {
    /* Which may happen if it is not built via Builder. */
    const e = engine;
    const nodes = [
      new Node({
        labels: [],
        properties: {},
      }),
      new Node({
        labels: [""],
        properties: {},
      }),
      new Node({
        labels: ["Node"],
        properties: {},
      }),
      new Node({
        labels: ["Node"],
        properties: {
          A: 1,
        },
      }),
    ];
    const result = await e.mergeNodes(nodes);

    expect(result).toBeInstanceOf(Failure);
    expect(result.reason).toEqual(
      `Engine.mergeNodes: Each Node must have label and _hash.`
    );
  });
  test("Success if Node has a label + _hash combination.", async () => {
    const e = engine;
    const nodes = [
      new Node({
        labels: ["Node"],
        properties: {
          A: 1,
          _hash: "123",
        },
      }),
    ];
    const result = await e.mergeNodes(nodes);

    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toBeInstanceOf(Success);
    // I guess I should stop wrapping any Node as an EnhancedNode in transformer.
    // expect(result[0].getData()).toBeInstanceOf(EnhancedNode)
    expect(isEnhancedNode(result[0].getData())).toEqual(true);
  });
});
describe("use cases", () => {
  const candidates = [
    new NodeCandidate({
      labels: ["Node1"],
      properties: {
        required: { B: "b1" },
      },
    }),
    new NodeCandidate({
      labels: ["Node2"],
      properties: {
        required: { B: "b2" },
      },
    }),
    new NodeCandidate({
      labels: ["Node3"],
      properties: {
        required: { B: "b3" },
      },
    }),
    new NodeCandidate({
      labels: ["Node4"],
      properties: {
        required: { B: "b4" },
      },
    }),
  ];
  test("GDB clean, merges all, Success", async () => {
    /* make nodes */
    let nodes: Result[] = await new Builder().buildNodes(candidates);
    /* extract Nodes */
    nodes = nodes.map((result) => result.getData()); // L1, L2
    const level1: Result[] = await engine.mergeNodes(nodes);

    expect(level1).toBeInstanceOf(Array);
    expect(level1.every(isSuccess)).toEqual(true);

    let [enode1, enode2, enode3, enode4] = level1.map((r) => r.getData());

    /* enode1 */
    expect([enode1, enode2, enode3, enode4].every(isEnhancedNode)).toEqual(
      true
    );

    expect(enode1).toMatchObject({
      labels: ["Node1"],
      properties: {
        _label: "Node1",
        _uuid,
        _date_created,
        _hash,
        B: "b1",
      },
      identity,
    });
  });

  test("Copies exist, merges all, Success", async () => {
    // GBP clean
    // build Nodes
    let [
      node1,
      node2,
      node3,
      node4,
    ] = await new Builder().buildNodes(candidates, { extract: true });

    // first merging
    // each node is written sequentially since they have diff labels.
    const first_run = await engine.mergeNodes([node1, node2]);

    expect(first_run).toBeInstanceOf(Array);
    expect(first_run.every(isSuccess)).toEqual(true);
    expect(first_run[0].summary.counters._stats.nodesCreated).toEqual(1);
    expect(first_run[1].summary.counters._stats.nodesCreated).toEqual(1);
    // log(first_run[0].summary.counters._stats.nodesCreated)
    /* 
    {
              nodesCreated: 1,
              nodesDeleted: 0,
              relationshipsCreated: 0,
              relationshipsDeleted: 0,
              propertiesSet: 6,
              labelsAdded: 1,
              labelsRemoved: 0,
              indexesAdded: 0,
              indexesRemoved: 0,
              constraintsAdded: 0,
              constraintsRemoved: 0
            }
    */

    /* second_run - need to check statistics and ensure that 0 nodes were created */
    const second_run = await engine.mergeNodes([node1, node2, node3, node4]);

    expect(second_run).toBeInstanceOf(Array);
    expect(second_run.every(isSuccess)).toEqual(true);
    const [result1_2, result2_2, result3_1, result4_1] = second_run;

    // check actual DB writes
    expect(result1_2.summary.counters._stats.nodesCreated).toEqual(0);
    expect(result2_2.summary.counters._stats.nodesCreated).toEqual(0);
    expect(result3_1.summary.counters._stats.nodesCreated).toEqual(1);
    expect(result4_1.summary.counters._stats.nodesCreated).toEqual(1);

    /* node1 */
    const node1_ = result1_2.getData();
    expect(node1_).toMatchObject({
      labels: ["Node1"],
      properties: {
        B: "b1",
        _uuid,
        _hash:
          "31e8ceb9deab99ce71f80823d1738aa9974880bbf939482ed6189f5f83c56dee",
        _label: "Node1",
        _date_created,
      },
      identity,
    });

    /* node1 is unique */
    const nodes1: Result[] = await engine.matchNodes([node1]);
    expect(nodes1.length).toEqual(1);

    const node1_matched = nodes1[0].getData()[0];
    expect(node1_).toEqual(node1_matched);

    /* node2 */
    const node2_ = result2_2.getData();
    expect(node2_).toMatchObject({
      labels: ["Node2"],
      properties: {
        _uuid: expect.any(String),
        B: "b2",
      },
    });

    /* node2 is unique */
    const nodes2: Result[] = await engine.matchNodes([node2]);
    expect(nodes2.length).toEqual(1);

    const node2_matched = nodes2[0].getData()[0];
    expect(node2_).toEqual(node2_matched);

    /* _uuids are unique */
    const node1_uuid = node1_.properties._uuid;
    const node2_uuid = node2_.properties._uuid;
    expect(node1_uuid !== node2_uuid).toEqual(true);
  });

  test("Adding 1392 nodes", async () => {
    let nodes = [];

    /* create some nodeLikeObjects */
    let labels = ["BJJ", "JUDO", "MMA", "WRESTLING"];
    labels.forEach((label) => {
      let A = 1,
        B = 1,
        C = 1;
      for (let month = 1; month < 13; month++) {
        for (let day = 1; day < 30; day++) {
          nodes.push(
            new NodeCandidate({
              labels: [label],
              properties: {
                required: {
                  DATE_SENT: [2018, month, day, 1, 123],
                  A: A++,
                  B: B++,
                  C: C++,
                },
              },
            })
          );
        }
      }
    });
    const length = 1392; // month 13 day 30
    expect(nodes.length).toEqual(length);

    /* make Nodes */
    nodes = await builder.buildNodes(nodes);
    nodes = nodes.map(getResultData);
    expect(nodes).toBeInstanceOf(Array);
    expect(nodes.length).toEqual(length);

    /* save Nodes to GDB */
    const result: Result[] = await engine.mergeNodes(nodes);
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toEqual(length);
    expect(result.every(isSuccess)).toEqual(true);

    const enode1_ = result[0].getData();
    expect(isEnhancedNode(enode1_)).toEqual(true);
    expect(enode1_).toMatchObject({
      labels: ["BJJ"],
      properties: {
        DATE_SENT: [
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
        ],
        A: expect.any(Number),
        B: expect.any(Number),
        C: expect.any(Number),
        _date_created: [
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
        ],

        _uuid: expect.any(String),
        _hash: expect.any(String),
        _label: "BJJ",
      },
      identity: {
        low: expect.any(Number),
        high: expect.any(Number),
      },
    });
  });

  test("_uuid is unique", async () => {
    const r: Result[] = await new Builder().buildNodes(candidates);

    const [node1, node2, ...rest] = r.map(getResultData);

    const result: Result[] = await engine.mergeNodes([node1, node2]);

    expect(result).toBeInstanceOf(Array);
    expect(result.every(isSuccess)).toEqual(true);

    const [node1_, node2_] = result.map((r) => r.getData());

    /* _uuids are unique */
    const node1_uuid = node1_.properties._uuid;
    const node2_uuid = node2_.properties._uuid;
    expect(node1_uuid !== node2_uuid).toEqual(true);
  });

  test("node with multiple labels", async () => {
    /// db setup
    await engine.cleanDB();
    /// !db setup

    const labels = ["Label1", "Label2"];
    const [node]: Node = builder.buildNodes(
      [
        new NodeCandidate({
          labels,
          properties: {
            required: { B: "b1" },
          },
        }),
      ],
      { extract: true }
    );
    // log(node);
    const rv: Result[] = await engine.mergeNodes([node]);

    expect(rv[0]).toBeInstanceOf(Success);
    const enode = rv[0].getData();
    expect(enode).toBeInstanceOf(EnhancedNode);
    expect(enode.getLabels()).toEqual(labels);
    expect(enode.getProperty("_labels")).toEqual(labels);
  });
});
