/* @flow */

import { engine } from "../../start";

import {
  Builder,
  Node,
  NodeCandidate,
  EnhancedNode,
  EnhancedNodeCandidate,
  isEnhancedNode,
  PartialNode,
  Relationship,
  RelationshipCandidate,
  Result,
  Success,
  Failure,
  isSuccess,
  getResultData,
  log,
  getRandomFromArray,
  isRelationship,
  isWritten,
} from "../../src";

import uniq from "lodash/uniq";
import range from "lodash/range";
import flatten from "lodash/flatten";
import isArray from "lodash/isArray";

const builder = new Builder();
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

const enodes = {};

beforeAll(async () => {
  /// db setup
  await engine.cleanDB();

  const nodes: Result[] = await builder.buildNodes([
    new NodeCandidate({
      labels: ["Node1"],
      properties: {
        required: {
          A: 1,
          NAME: "Node1",
        },
      },
    }),
    new NodeCandidate({
      labels: ["Node2"],
      properties: {
        required: {
          A: 2,
          B: 3,
          NAME: "Node2",
        },
      },
    }),
    new NodeCandidate({
      labels: ["Node1"],
      properties: {
        required: {
          A: 1,
          C: 4,
          NAME: "Node1",
        },
      },
    }),
  ]);
  expect(nodes).toBeInstanceOf(Array);
  expect(nodes.every(isSuccess)).toEqual(true);

  const [node1, node2, node3] = nodes.map(getResultData);

  await engine.mergeNodes([node1, node2, node3]);
  /// !db setup
});

afterAll(async (done) => {
  engine.closeAllSessions();
  engine.closeDriver();
  done();
});

describe("validations", () => {
  test("first arg not PartialNodes[]", async () => {
    const result = await engine.matchPartialNodes([{}]);
    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toBeInstanceOf(Failure);
    expect(result[0]).toMatchObject({
      reason:
        "matchPartialNodes(): Validation error: only instances of PartialNode can be matched.\narr: [{}]",
    });
  });
});

describe("simple match", () => {
  /**
   * @FFS ALWAYS put db state description here!
   */

  /**
   * DB DESCRIPTION
   *
   * (Node1) { A: 1, NAME: 'Node1' }
   * (Node1) { A: 1, C: 4, NAME: 'Node1' }
   * (Node2) { A: 2, B: 3, NAME: 'Node2' }
   */
  test("label only", async () => {
    const pnodes: PartialNode[] = await builder.buildPartialNodes(
      [
        {
          labels: ["Node1"],
          properties: {},
        },
      ],
      { extract: true }
    );
    const enodes_: EnhancedNode[] = await engine.matchPartialNodes(pnodes, {
      extract: true,
      flatten: true,
    });
    expect(enodes_).toHaveLength(2);
  });
  test("matches node1 and node2", async () => {
    const pnodes: PartialNode[] = builder.buildPartialNodes(
      [
        {
          labels: ["Node1"], // 2 matches - node1 node3
          properties: {
            A: {
              key: "A",
              value: [1],
            },
          },
        },
        {
          labels: ["Node2"], // 1 match - node2 only
          properties: {
            A: {
              key: "A",
              value: [2],
            },
            B: {
              key: "B",
              value: [3],
            },
          },
        },
        {
          labels: ["Node666"], // doesn't exist
          properties: {
            X: {
              key: "X",
              value: [0],
            },
            Y: {
              key: "Y",
              value: [0],
            },
          },
        },
      ],
      { extract: true }
    );
    // log(pnodes)
    const results: Result[] = await engine.matchPartialNodes(pnodes);
    // log(results)
    expect(results.every(isSuccess)).toEqual(true);
    const [firsts, seconds, thirds]: EnhancedNode[][] = results.map((res) =>
      res.getData()
    );
    // log(firsts)

    // firsts - 2 matches
    expect(isArray(firsts)).toEqual(true);
    expect(firsts).toHaveLength(2);
    expect(firsts.every(isEnhancedNode)).toEqual(true);

    // seconds - 1 match
    expect(isArray(seconds)).toEqual(true);
    expect(seconds).toHaveLength(1);
    expect(seconds.every(isEnhancedNode)).toEqual(true);

    // thirds - no matches
    expect(isArray(thirds)).toEqual(true);
    expect(thirds).toHaveLength(0);
  });
});

describe("dates", () => {
  beforeAll(async () => {
    //// db setup
    await engine.cleanDB();
    /// [2018,1,1] - JUDO A1, BJJ A2
    /// [2018,1,2] - MMA B1,
    /// [2019,1,1] - JUDO A2,
    const [
      judo_2018_1_1,
      judo_2019_1_1,
      bjj_2018_1_1,
      mma_2018_8_2,
    ]: EnhancedNode = await builder.buildEnhancedNodes(
      [
        new EnhancedNodeCandidate(
          new NodeCandidate({
            labels: ["JUDO"],
            properties: {
              required: {
                A: 1,
                DAY: [2018, 1, 1, 1, 1],
              },
            },
          })
        ),
        new EnhancedNodeCandidate(
          new NodeCandidate({
            labels: ["JUDO"],
            properties: {
              required: {
                A: 2,
                DAY: [2019, 1, 1, 1, 3],
              },
            },
          })
        ),
        new EnhancedNodeCandidate(
          new NodeCandidate({
            labels: ["BJJ"],
            properties: {
              required: {
                A: 2,
                DAY: [2018, 1, 1, 1, 1],
              },
            },
          })
        ),
        new EnhancedNodeCandidate(
          new NodeCandidate({
            labels: ["MMA"],
            properties: {
              required: {
                B: 1,
                DAY: [2018, 1, 2, 2, 2],
              },
            },
          })
        ),
      ],
      { extract: true }
    );
    const results: Result[] = await engine.mergeEnhancedNodes([
      judo_2018_1_1,
      bjj_2018_1_1,
      mma_2018_8_2,
      judo_2019_1_1,
    ]);
    enodes["judo_2018_1_1"] = judo_2018_1_1;
    enodes["judo_2019_1_1"] = judo_2019_1_1;
    enodes["bjj_2018_1_1"] = bjj_2018_1_1;
    enodes["mma_2018_8_2"] = mma_2018_8_2;

    expect(results.every(isSuccess)).toEqual(true);
    expect(
      results.every((result) => result.firstDataElement.isWritten())
    ).toEqual(true);
    //// !db setup
  });
  test("one date, one label - should return one", async () => {
    /// '\n        MATCH (x:JUDO)\n        \n        RETURN x' not good
    const [judo_2018_1_1_pnode]: PartialNode = await builder.buildPartialNodes(
      [
        {
          labels: ["JUDO"], // 1 copy
          properties: {
            required: {
              DAY: {
                isDate: true,
                type: "DAY",
                key: "DAY",
                value: [2018, 1, 1, 1, 123],
              },
            },
          },
        },
      ],
      { extract: true }
    );

    /// find judo_2018_1_1
    const results: Result[] = await engine.matchPartialNodes([
      judo_2018_1_1_pnode,
    ]);

    expect(results.every(isSuccess)).toEqual(true);
    expect(results[0].getData()).toHaveLength(1);
    expect(results[0].firstDataElement).toMatchObject({
      labels: enodes["judo_2018_1_1"].getLabels(),
      properties: {
        ...enodes["judo_2018_1_1"].properties,
        _uuid,
        _hash,
        _date_created,
      },
      identity,
    });
  });
  /* ============================================================== */
  test("one date, no label - should return 2", async () => {
    //// We want to match judo_2018_1_1_pnode, bjj_2018_1_1_pnode
    const [judo_2018_1_1_pnode]: PartialNode = await builder.buildPartialNodes(
      [
        {
          labels: [], // @todo matchPartialNodes cannot create PartialNode without labels.
          properties: {
            required: {
              DAY: {
                isDate: true,
                type: "DAY",
                key: "DAY",
                value: [2018, 1, 1, 1, 1],
              },
            },
          },
        },
      ],
      { extract: true }
    );

    /// finds judo_2018_1_1, bjj_2018_1_1
    const results: Result[] = await engine.matchPartialNodes([
      judo_2018_1_1_pnode,
    ]);
    expect(results.every(isSuccess)).toEqual(true);
    expect(results[0].getData()).toHaveLength(2);
    //   expect(results[0].getData()).toEqual(expect.arrayContaining([
    //     {
    //     labels: ['JUDO'],
    //     properties: {
    //         A: 1,
    //         DAY: [2018, 1, 1, 1, 123],
    //         _uuid,
    //         _hash,
    //         _date_created,
    //     },
    //     identity
    //   },
    //     {
    //     labels: ['BJJ'],
    //     properties: {
    //         A: 2,
    //         DAY: [2018, 1, 1, 1, 123],
    //         _uuid,
    //         _hash,
    //         _date_created,
    //     },
    //     identity
    //   },
    // ])
  });
  /* ============================================================== */
  test("one date range", async () => {
    /**
     * DB holds:
     * [2018-1-1] JUDO A1
     * [2018-1-1] BJJ A2
     * [2018-1-2] MMA B1
     * [2019-1-1] JUDO A2
     */
    const pnodes: PartialNode[] = await builder.buildPartialNodes(
      [
        {
          labels: [""], // 4 matches
          properties: {
            DAY: {
              isDate: true,
              isRange: true,
              type: "DAY",
              key: "DAY",
              value: [
                {
                  from: [2018, 1, 1, 1, 1],
                  to: [2019, 1, 2, 1, 3],
                },
              ],
            },
          },
        },
      ],
      { extract: true }
    );

    const enodes: EnhancedNode[] = await engine.matchPartialNodes(pnodes, {
      extract: true,
      flatten: true,
    });

    expect(enodes.length).toEqual(4); // day range
    expect(enodes.every(isEnhancedNode)).toEqual(true);
  });
});

describe("conditions", () => {
  beforeAll(async () => {
    /// db setup
    await engine.cleanDB();

    /**
     * DB DESCRIPTION
     *
     * (Node1) A1
     * (Node1) A1 B1
     * (Node1) A2
     * (Node1) A2 B1 C1
     *
     * (Node2) A1
     * (Node2) A1 B1
     * (Node2) A2    C1
     * (Node2) A2 B2 C2
     *
     * (Node3) NAME: Alice  LAST_NAME: One
     * (Node3) NAME: Alice  LAST_NAME: Two
     * (Node3) NAME: Bob    LAST_NAME: Three
     * (Node3) NAME: Claire LAST_NAME: Four
     * (Node3) NAME: Duncan LAST_NAME: Five
     * (Node3) NAME: Duncan LAST_NAME: Six
     * (Node3) NAME: Elena  LAST_NAME: Seven
     * (Node3) NAME: Elena  LAST_NAME: Eight
     *
     * (Node4) FRIDGE: ['meat']
     * (Node4) FRIDGE: ['meat', 'beer']
     * (Node4) FRIDGE: ['meat', 'beer', 'oranges']
     * (Node4) FRIDGE: ['milk', 'beer']
     * (Node4) FRIDGE: ['poultry', 'wine']
     * (Node4) FRIDGE: ['poultry', 'wine', 'oranges']
     *
     * 22 nodes
     */
    let nodes: Result[] = builder.buildNodes([
      new NodeCandidate({
        labels: ["Node1"],
        properties: {
          required: {
            A: 1,
            NAME: "Node1",
          },
        },
      }),
      new NodeCandidate({
        labels: ["Node1"],
        properties: {
          required: {
            A: 1,
            B: 1,
            NAME: "Node1",
          },
        },
      }),
      new NodeCandidate({
        labels: ["Node1"],
        properties: {
          required: {
            A: 2,
            NAME: "Node1",
          },
        },
      }),
      new NodeCandidate({
        labels: ["Node1"],
        properties: {
          required: {
            A: 2,
            B: 1,
            C: 1,
            NAME: "Node1",
          },
        },
      }),

      new NodeCandidate({
        labels: ["Node2"],
        properties: {
          required: {
            A: 1,
            NAME: "Node2",
          },
        },
      }),
      new NodeCandidate({
        labels: ["Node2"],
        properties: {
          required: {
            A: 1,
            B: 1,
            NAME: "Node2",
          },
        },
      }),
      new NodeCandidate({
        labels: ["Node2"],
        properties: {
          required: {
            A: 2,
            C: 1,
            NAME: "Node2",
          },
        },
      }),
      new NodeCandidate({
        labels: ["Node2"],
        properties: {
          required: {
            A: 2,
            B: 2,
            C: 2,
            NAME: "Node2",
          },
        },
      }),

      new NodeCandidate({
        labels: ["Node3"],
        properties: {
          required: {
            NAME: "Alice",
            LAST_NAME: "One",
          },
        },
      }),
      new NodeCandidate({
        labels: ["Node3"],
        properties: {
          required: {
            NAME: "Alice",
            LAST_NAME: "Two",
          },
        },
      }),
      new NodeCandidate({
        labels: ["Node3"],
        properties: {
          required: {
            NAME: "Bob",
            LAST_NAME: "Three",
          },
        },
      }),
      new NodeCandidate({
        labels: ["Node3"],
        properties: {
          required: {
            NAME: "Claire",
            LAST_NAME: "Four",
          },
        },
      }),
      new NodeCandidate({
        labels: ["Node3"],
        properties: {
          required: {
            NAME: "Duncan",
            LAST_NAME: "Five",
          },
        },
      }),
      new NodeCandidate({
        labels: ["Node3"],
        properties: {
          required: {
            NAME: "Duncan",
            LAST_NAME: "Six",
          },
        },
      }),
      new NodeCandidate({
        labels: ["Node3"],
        properties: {
          required: {
            NAME: "Elena",
            LAST_NAME: "Seven",
          },
        },
      }),
      new NodeCandidate({
        labels: ["Node3"],
        properties: {
          required: {
            NAME: "Elena",
            LAST_NAME: "Eight",
          },
        },
      }),

      new NodeCandidate({
        labels: ["Node4"],
        properties: {
          required: {
            FRIDGE: ["meat"],
          },
        },
      }),
      new NodeCandidate({
        labels: ["Node4"],
        properties: {
          required: {
            FRIDGE: ["meat", "beer"],
          },
        },
      }),
      new NodeCandidate({
        labels: ["Node4"],
        properties: {
          required: {
            FRIDGE: ["meat", "beer", "oranges"],
          },
        },
      }),
      new NodeCandidate({
        labels: ["Node4"],
        properties: {
          required: {
            FRIDGE: ["milk", "beer"],
          },
        },
      }),
      new NodeCandidate({
        labels: ["Node4"],
        properties: {
          required: {
            FRIDGE: ["poultry", "wine"],
          },
        },
      }),
      new NodeCandidate({
        labels: ["Node4"],
        properties: {
          required: {
            FRIDGE: ["poultry", "wine", "oranges"],
          },
        },
      }),
    ]);
    expect(nodes).toBeInstanceOf(Array);
    expect(nodes.every(isSuccess)).toEqual(true);

    nodes = nodes.map(getResultData);

    await engine.mergeNodes(nodes);
    /// !db setup
  });
  /* ============================================================== */
  test("e && =", async () => {
    /**
     * Checking equals value, both designations.
     */

    const pnodes: PartialNode[] = builder.buildPartialNodes(
      [
        {
          labels: [],
          properties: {
            A: {
              isCondition: true,
              type: "property",
              key: "A",
              value: [
                {
                  e: 1, // total of 4
                },
              ],
            },
          },
        },
      ],
      { extract: true }
    );

    const results: Result[] = await engine.matchPartialNodes(pnodes);

    const enodes: EnhancedNode[] = results[0].getData();

    expect(enodes.length).toEqual(4);
  });
  /* ============================================================== */
  test("ne && <>", async () => {
    /**
     * Checking not equals value, both designations.
     */

    const pnodes: PartialNode[] = builder.buildPartialNodes(
      [
        {
          labels: [],
          properties: {
            A: {
              isCondition: true,
              type: "property",
              key: "A",
              value: [
                {
                  ne: 2, // picks A1 - 4
                },
                {
                  "<>": 3, // picks A1 - 4
                },
              ],
            },
          },
        },
      ],
      { extract: true }
    );

    const results: Result[] = await engine.matchPartialNodes(pnodes);
    const enodes: EnhancedNode[] = results[0].getData();

    expect(enodes.length).toEqual(4);
  });
  /* ============================================================== */
  test("gt && >", async () => {
    /**
     * Checking greater than, both designations.
     *
     * Matching Node2 A2 * 2 times
     */

    const pnodes: PartialNode[] = builder.buildPartialNodes(
      [
        {
          labels: ["Node2"],
          properties: {
            A: {
              isCondition: true,
              type: "property",
              key: "A",
              value: [
                {
                  gt: 1, // 2
                },
              ],
            },
          },
        },
      ],
      { extract: true }
    );

    const results: Result[] = await engine.matchPartialNodes(pnodes);
    const enodes: EnhancedNode[] = results[0].getData();

    expect(enodes.length).toEqual(2);
  });
  /* ============================================================== */
  test("get && >=", async () => {
    /**
     * Checking greater or equal than, both designations.
     *
     * Matching Node2 A1 * 2 times + A2 * 2 times = 4 matches
     */
    const pnodes: PartialNode[] = builder.buildPartialNodes(
      [
        {
          labels: ["Node2"],
          properties: {
            required: {
              A: {
                isCondition: true,
                type: "property",
                key: "A",
                value: [
                  {
                    get: 1, // 4
                  },
                ],
              },
            },
          },
        },
      ],
      { extract: true }
    );

    const results: Result[] = await engine.matchPartialNodes(pnodes);
    const enodes: EnhancedNode[] = results[0].getData();

    expect(enodes.length).toEqual(4);
  });
  /* ============================================================== */
  test("lt && <", async () => {
    /**
     * Checking less than, both designations.
     *
     * Matching Node1 A1 * 2 times = 2 matches
     * Matching Node1 A1 * 2 times + Node2 A1 * 2 times = 4 matches
     */

    const pnodes: PartialNode[] = builder.buildPartialNodes(
      [
        {
          labels: ["Node1"],
          properties: {
            A: {
              isCondition: true,
              type: "property",
              key: "A",
              value: [
                {
                  lt: 2, // 2
                },
              ],
            },
          },
        },
        {
          labels: [],
          properties: {
            A: {
              isCondition: true,
              type: "property",
              key: "A",
              value: [
                {
                  "<": 2, // 4
                },
              ],
            },
          },
        },
      ],
      { extract: true }
    );

    const results: Result[] = await engine.matchPartialNodes(pnodes);
    const enodes1: EnhancedNode[] = results[0].getData();
    const enodes2: EnhancedNode[] = results[1].getData();

    expect(enodes1.length).toEqual(2);
    expect(enodes2.length).toEqual(4);
  });
  /* ============================================================== */
  test("let && <=", async () => {
    /**
     * Checking less or equal than, both designations.
     *
     * Matching Node1 A1 * 2 times + A2 * 2 times = 4 matches
     * Matching Node1 A1 & A2 * 4 times + Node2 A1 & A2 * 4 times = 8 matches
     */
    const pnodes: PartialNode[] = builder.buildPartialNodes(
      [
        {
          labels: ["Node1"],
          properties: {
            required: {
              A: {
                isCondition: true,
                type: "property",
                key: "A",
                value: [
                  {
                    let: 2, // 4
                  },
                ],
              },
            },
          },
        },
        {
          labels: [],
          properties: {
            required: {
              A: {
                isCondition: true,
                type: "property",
                key: "A",
                value: [
                  {
                    "<=": 2, // 8
                  },
                ],
              },
            },
          },
        },
      ],
      { extract: true }
    );

    const results: Result[] = await engine.matchPartialNodes(pnodes);
    const enodes1: EnhancedNode[] = results[0].getData();
    const enodes2: EnhancedNode[] = results[1].getData();

    expect(enodes1.length).toEqual(4);
    expect(enodes2.length).toEqual(8);
  });
  /* ============================================================== */
  test("in && IN", async () => {
    /**
     * Checking `in`, used for checking value in a list, both designations.
     * Use when we need to collect a set of nodes, each having a string property
     * (like a name) and we provide a list of names to match by.
     *
     * (Node3) NAME: Alice  LAST_NAME: One
     * (Node3) NAME: Alice  LAST_NAME: Two
     * (Node3) NAME: Bob    LAST_NAME: Three
     * (Node3) NAME: Claire LAST_NAME: Four
     * (Node3) NAME: Duncan LAST_NAME: Five
     * (Node3) NAME: Duncan LAST_NAME: Six
     * (Node3) NAME: Elena  LAST_NAME: Seven
     * (Node3) NAME: Elena  LAST_NAME: Eight
     */
    const pnodes: PartialNode[] = builder.buildPartialNodes(
      [
        {
          labels: ["Node3"],
          properties: {
            NAME: {
              isCondition: true,
              type: "string",
              key: "NAME",
              value: [
                {
                  in: ["Alice", "Bob"], // 3 - Alice One, Alice Two, Bob Three
                },
              ],
            },
          },
        },
      ],
      { extract: true }
    );

    const results: Result[] = await engine.matchPartialNodes(pnodes);
    const enodes: EnhancedNode[] = results[0].getData();

    expect(enodes.length).toEqual(3);
  });
  /* ============================================================== */
  test("nin && NIN", async () => {
    /**
     * Checking `not in`, used for checking a value not being in a list.
     */
    const pnodes: PartialNode[] = builder.buildPartialNodes(
      [
        {
          labels: ["Node3"],
          properties: {
            NAME: {
              isCondition: true,
              type: "string",
              key: "NAME",
              value: [
                {
                  NIN: ["Alice", "Bob"], // 5 matches
                },
              ],
            },
          },
        },
        {
          labels: [],
          properties: {
            A: {
              isCondition: true,
              type: "number",
              key: "A",
              value: [
                {
                  nin: [1, 3], // 4
                },
              ],
            },
          },
        },
      ],
      { extract: true }
    );

    const results: Result[] = await engine.matchPartialNodes(pnodes);
    const enodes1: EnhancedNode[] = results[0].getData();
    const enodes2: EnhancedNode[] = results[1].getData();

    expect(enodes1.length).toEqual(5);
    expect(enodes2.length).toEqual(4);
  });
  /* ============================================================== */
  test("not && NOT", async () => {
    /**
     * Checking `not`, used for checking value not being in a list, both designations.
     */
    const pnodes: PartialNode[] = builder.buildPartialNodes(
      [
        {
          labels: [],
          properties: {
            B: {
              isCondition: true,
              type: "number",
              key: "B",
              value: [
                {
                  NOT: [2, 3, 4], // 3 matches
                },
              ],
            },
          },
        },
      ],
      { extract: true }
    );

    const results: Result[] = await engine.matchPartialNodes(pnodes);
    const enodes: EnhancedNode[] = results[0].getData();

    expect(enodes.length).toEqual(3);
  });
  /* ============================================================== */
  test("containsall && CONTAINSALL", async () => {
    /**
     * Checking `containsall`, used for checking value presence in a list.
     * Used when we have a string[] or number[] property and we want to collect nodes
     * whose property contain all of the elements that we provide.
     *
     * 1 (Node4) FRIDGE: ['meat']
     * 2 (Node4) FRIDGE: ['meat', 'beer']
     * 3 (Node4) FRIDGE: ['meat', 'beer', 'oranges']
     * 4 (Node4) FRIDGE: ['milk', 'beer']
     * 5 (Node4) FRIDGE: ['poultry', 'wine']
     * 6 (Node4) FRIDGE: ['poultry', 'wine', 'oranges']
     *
     * ie we provide ['poultry', 'oranges'] == matches 6
     * ie we provide ['meat', 'beer'] == matches 2 3
     *
     */
    const pnodes: PartialNode[] = builder.buildPartialNodes(
      [
        {
          labels: ["Node4"],
          properties: {
            FRIDGE: {
              isCondition: true,
              type: "string[]",
              key: "FRIDGE",
              value: [
                {
                  containsall: ["poultry", "oranges"], // 1
                },
              ],
            },
          },
        },
        {
          labels: ["Node4"],
          properties: {
            FRIDGE: {
              isCondition: true,
              type: "string[]",
              key: "FRIDGE",
              value: [
                {
                  containsall: ["meat", "beer"], // 2
                },
              ],
            },
          },
        },
      ],
      { extract: true }
    );

    const results: Result[] = await engine.matchPartialNodes(pnodes);
    const enodes1: EnhancedNode[] = results[0].getData();
    const enodes2: EnhancedNode[] = results[1].getData();

    expect(enodes1.length).toEqual(1);
    expect(enodes2.length).toEqual(2);
  });
  /* ============================================================== */
  test("containsany && CONTAINSANY", async () => {
    /**
     * Checking `containsany`, used for checking value presence in a list.
     * Used when we have a string[] or number[] property and we want to collect nodes
     * whose property contain at least one of the elements that we provide.
     *
     * 1 (Node4) FRIDGE: ['meat']
     * 2 (Node4) FRIDGE: ['meat', 'beer']
     * 3 (Node4) FRIDGE: ['meat', 'beer', 'oranges']
     * 4 (Node4) FRIDGE: ['milk', 'beer']
     * 5 (Node4) FRIDGE: ['poultry', 'wine']
     * 6 (Node4) FRIDGE: ['poultry', 'wine', 'oranges']
     *
     * ['milk', 'oranges'] will match 3 4 6
     */
    const pnodes: PartialNode[] = builder.buildPartialNodes(
      [
        {
          labels: ["Node4"],
          properties: {
            FRIDGE: {
              isCondition: true,
              type: "string[]",
              key: "FRIDGE",
              value: [
                {
                  containsany: ["milk", "oranges"], // 3
                },
              ],
            },
          },
        },
      ],
      { extract: true }
    );

    const results: Result[] = await engine.matchPartialNodes(pnodes);
    const enodes: EnhancedNode[] = results[0].getData();

    expect(enodes.length).toEqual(3);
  });
  /* ============================================================== */
  test("contains && CONTAINS", async () => {
    /**
     * Checking `contains`, used for fuzzy matching on strings.
     * 
     * Going to fuzzy match Claire as Clai
     *
     new NodeCandidate({
        labels: ["Node3"],
        properties: {
          required: {
            NAME: "Claire",
            LAST_NAME: "Four",
          },
        },
      }),
     *
     */
    const pnodes: PartialNode[] = builder.buildPartialNodes(
      [
        {
          labels: ["Node3"],
          properties: {
            NAME: {
              isCondition: true,
              type: "string",
              key: "NAME",
              value: [
                {
                  contains: ["Clai"], // matches Claire
                  // contains: "Clai", // also matches Claire
                },
              ],
            },
          },
        },
      ],
      { extract: true }
    );

    const results: Result[] = await engine.matchPartialNodes(pnodes);
    const enodes: EnhancedNode[] = results[0].getData();
    // log(enodes)
    expect(enodes.length).toEqual(1);
  });
});
