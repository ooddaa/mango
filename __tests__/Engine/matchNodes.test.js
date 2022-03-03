/* @flow */
import { engine } from "../../start";

import {
  Builder,
  Node,
  NodeCandidate,
  EnhancedNode,
  EnhancedNodeCandidate,
  Relationship,
  RelationshipCandidate,
  Result,
  Success,
  Failure,
  getResultData,
  log,
  isSuccess,
  isResult,
  isNode,
  isEnhancedNode,
} from "../../src";
import { isArray } from "util";
import { flatten as _flatten } from "lodash";

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

afterAll(async (done) => {
  engine.closeAllSessions();
  engine.closeDriver();
  done();
});

describe("validations", () => {
  test("Failure if given empty array", async () => {
    const result: Result[] = await engine.matchNodes([]);
    expect(result[0]).toBeInstanceOf(Failure);
    expect(result[0]).toMatchObject({
      reason: `Engine.matchNodes: automat: must receive a non-empty array.`,
    });
  });
  test("Failure if no Nodes supplied", async () => {
    const result: Result[] = await engine.matchNodes([0, {}]);
    expect(result[0]).toBeInstanceOf(Failure);
    expect(result[0]).toMatchObject({
      reason: `Engine.matchNodes: nothingToQuery: need at least one decent Node to search for.`,
    });
  });
  test("Failure if node is not Node", async () => {
    const result: Result[] = await engine.matchNodes([{}, 123]);
    expect(result[0]).toBeInstanceOf(Failure);
    expect(result[0]).toMatchObject({
      reason: `Engine.matchNodes: nothingToQuery: need at least one decent Node to search for.`,
    });

    const [first, second] = result[0].getData();
    expect(first).toBeInstanceOf(Failure);
    expect(first).toMatchObject({
      reason: `Engine.matchNodes: automat: only instances of Node can be matched.`,
    });
  });
  test("Failure if no lables/no properties", async () => {
    const result: Result[] = await engine.matchNodes([new Node()]);

    expect(result[0]).toBeInstanceOf(Failure);
    expect(result[0]).toMatchObject({
      reason: `Engine.matchNodes: nothingToQuery: need at least one decent Node to search for.`,
    });

    const [first, second] = result[0].getData();
    expect(first).toBeInstanceOf(Failure);
    expect(first).toMatchObject({
      reason: `Engine.matchNodes: automat: a Node must have at least one label or one property.`,
    });
  });
  test("Failure if no Node + no lables/no properties.", async () => {
    const result: Result[] = await engine.matchNodes([new Node(), 123]);

    expect(result[0]).toBeInstanceOf(Failure);
    expect(result[0]).toMatchObject({
      reason: `Engine.matchNodes: nothingToQuery: need at least one decent Node to search for.`,
    });

    const [first, second] = result[0].getData();
    expect(first).toBeInstanceOf(Failure);
    expect(first).toMatchObject({
      reason: `Engine.matchNodes: automat: a Node must have at least one label or one property.`,
    });

    expect(second).toBeInstanceOf(Failure);
    expect(second).toMatchObject({
      reason: `Engine.matchNodes: automat: only instances of Node can be matched.`,
    });
  });
});
// test("config.extract = true", async () => {

// })
describe("use cases", () => {
  test("Node is matched on empty DB, should be S.data = []", async () => {
    /// db setup
    await engine.cleanDB();
    /// !db setup
    const [node]: Node = await new Builder().buildNodes(
      [
        new NodeCandidate({
          labels: ["Node1"],
          properties: {
            required: {
              A: 1,
            },
          },
        }),
      ],
      { extract: true }
    );

    expect(isNode(node)).toEqual(true);

    const result = await engine.matchNodes([node]);
    expect(isSuccess(result[0].data)).toEqual(false);
    expect(result[0].reason).toEqual("Neo4j returned null.");
  });
  test("Node is matched by _hash or identity", async () => {
    /// db setup
    await engine.cleanDB();

    const nodes: Result[] = await new Builder().buildNodes([
      new NodeCandidate({
        labels: ["Node1"],
        properties: {
          required: {
            A: 1,
          },
        },
      }),
      new NodeCandidate({
        labels: ["Node1"],
        properties: {
          required: {
            A: 2,
            B: 3,
          },
        },
      }),
      new NodeCandidate({
        labels: ["Node1"],
        properties: {
          required: {
            A: 1,
            C: 4,
          },
        },
      }),
    ]);
    expect(nodes).toBeInstanceOf(Array);
    expect(nodes.every(isSuccess)).toEqual(true);

    const [node1, node2, node3] = nodes.map(getResultData);

    await engine.mergeNodes([node1, node2 /* , node3 */]);
    /// !db setup

    /**
     * Test that we can match 2 nodes, 3rd will be undefined.
     * This will ALWAYS either return 1 100% matched node or undefined!
     */
    expect(node1).toBeInstanceOf(Node);
    const results: Result[] = await engine.matchNodes([node1, node2, node3], {
      extract: false,
    });

    /// returns Result[]
    expect(results.every(isResult)).toEqual(true);
    /// nodes are matched
    const [node1_, node2_, node3_]: EnhancedNode = _flatten(
      results.map(getResultData)
    );

    expect(node1_).toMatchObject({
      labels: node1.labels,
      properties: {
        ...node1.properties,
        _uuid,
      },
      identity,
    });

    /// except thrid node which was not in Neo4j
    expect(node3_).toEqual(undefined);
  });
  test("Should match EnhancedNode", async () => {
    /// db setup
    await engine.cleanDB();
    /// (A)-[REL1]->(B)-[REL2]->(C)
    const nodes = await builder.buildNodes([
      new NodeCandidate({
        labels: ["A"],
        properties: {
          required: {
            NAME: "A",
            VALUE: 1,
          },
        },
      }),
      new NodeCandidate({
        labels: ["B"],
        properties: {
          required: {
            NAME: "B",
            VALUE: 2,
          },
        },
      }),
      new NodeCandidate({
        labels: ["C"],
        properties: {
          required: {
            NAME: "C",
            VALUE: 3,
          },
        },
      }),
    ]);
    const [a, b, c] = nodes.map(getResultData);
    const [enodeA, enodeB] = await builder.buildEnhancedNodes(
      [
        new EnhancedNodeCandidate(a, {
          required: [
            new RelationshipCandidate({
              labels: ["REL1"],
              properties: { rel1_prop: 1 },
              direction: "outbound",
              endNode: b,
              necessity: "required",
            }),
          ],
        }),
        new EnhancedNodeCandidate(b, {
          required: [
            new RelationshipCandidate({
              labels: ["REL2"],
              properties: { rel2_prop: 2 },
              direction: "outbound",
              endNode: c,
              necessity: "required",
            }),
          ],
        }),
      ],
      { extract: true }
    );
    /// merge EnhancedNodes
    const [enodeA_, enodeB_]: [
      EnhancedNode,
      EnhancedNode,
      EnhancedNode
    ] = await engine.mergeEnhancedNodes([enodeA, enodeB], { extract: true });
    /// !db setup

    // const results: Resul[] = await engine.matchNodes([enodeA])
    const results: Resul[] = await engine.matchNodes([enodeA_]);
    // // log(results)

    expect(isArray(results)).toEqual(true);
    expect(results.every(isSuccess)).toEqual(true);

    // S.data= [matched enodeA]
    const matched_enodeA = results[0].getData()[0];
    expect(isEnhancedNode(matched_enodeA)).toEqual(true);
    expect(results[0].getData()[0].getHash()).toEqual(
      results[0].parameters.originalNode.getHash()
    );
  });
});
