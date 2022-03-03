/* @flow */
import { engine } from "../../start";
import {
  Builder,
  getResultData,
  log,
  Node,
  NodeCandidate,
  EnhancedNode,
  EnhancedNodeCandidate,
  Relationship,
  RelationshipCandidate,
  isWrittenRelationship,
  Result,
  isSuccess,
  isFailure,
} from "../../src";

import isArray from "lodash/isArray";
import flatten from "lodash/flatten";

const builder = new Builder();

const pete = new Node({
  labels: ["Person"],
  properties: {
    // _uuid: 'fe0a1e50-73c1-430c-aee1-f8994bd81f45',
    _hash: "6661b5fb7ed89de9f9ad37608a209c713ea318a2e35dd32853114d7bef002895",
    _date_created: [2020, 5, 6, 3, 1588760891365],
    _label: "Person",
    NAME: "Pete",
  },
});
const newPete = new Node({
  labels: ["NotAPerson"],
  properties: {
    // _uuid: 'fe0a1e50-73c1-430c-aee1-f8994bd81f45',
    _hash: "newPeteHash",
    _date_created: [2020, 5, 6, 3, 1588760891365],
    _label: "NotAPerson",
    NAME: "newPete",
  },
});

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

afterAll(async (done) => {
  engine.closeAllSessions();
  engine.closeDriver();
  done();
});

describe("validations", () => {});

describe("use cases", () => {
  describe("simple", () => {
    test("simple - db clean, merge one rel", async () => {
      await engine.cleanDB();
      const relc: RelationshipCandidate = new RelationshipCandidate({
        labels: ["SIMPLE_REL"],
        properties: { val: 123 },
        direction: "outbound",
        necessity: "required",
        startNode: pete,
        endNode: newPete,
      });
      const rel: Relationship[] = (
        await builder.buildRelationships([relc])
      ).map(getResultData);
      const results: Result[] = await engine.mergeRelationships(rel);
      expect(results).toBeInstanceOf(Array);
      // log(results)
      expect(results.every(isSuccess)).toEqual(true);
      const result = results[0].getData()[0];
      expect(result).toBeInstanceOf(Relationship);
      // // log(result)
      expect(result.isWritten()).toEqual(true);
    });
  });
  describe("complex", () => {
    beforeAll(async () => {
      /* drop DB */
      await engine.cleanDB();
      /*
            Pete -[EXECUTE]-> Trade1 -[ON_DATE]-> Day1
            Pete -[EXECUTE]-> Trade2 -[ON_DATE]-> Day2
            Joe -[EXECUTE]-> Trade3 -[ON_DATE]-> Day1
            ====== later ======
            Trade3b -[PREVIOUS]-> Trade3
            Trade3b -[NEXT]-> Trade3
            ===================
            0. Mary (no rels)
            1. Pete -[EXECUTE]-> Trade1 (1 hop)
            2. Pete -[EXECUTE]-> Trade1 -[ON_DATE]-> Day1 (2 hops)
            3. Pete -[EXECUTE]-> Trade2 -[ON_DATE]-> Day2 <-[ON_DATE]- Trade2 (3 hops)
            4. Pete -[EXECUTE]-> Trade1 -[ON_DATE]-> Day1 <-[ON_DATE]- Trade3 <-[EXECUTE]- Joe (4 hops)
            */
      const [pete, joe, mary] = await builder.buildEnhancedNodes(
        [
          new EnhancedNodeCandidate(
            new NodeCandidate({
              labels: ["Person"],
              properties: {
                required: {
                  NAME: "Pete",
                },
              },
            }),
            {
              required: [
                new RelationshipCandidate({
                  labels: ["EXECUTE"],
                  properties: { valid: true },
                  endNode: new EnhancedNodeCandidate(
                    new NodeCandidate({
                      labels: ["Trade"],
                      properties: {
                        required: {
                          TRADE_NUM: 1,
                        },
                      },
                    }),
                    {
                      required: [
                        new RelationshipCandidate({
                          labels: ["ON_DATE"],
                          properties: { valid: true },
                          endNode: new NodeCandidate({
                            labels: ["DAY"],
                            properties: {
                              required: {
                                DAY: 1,
                              },
                            },
                          }),
                          direction: "outbound",
                          necessity: "required",
                        }),
                      ],
                    }
                  ),
                  direction: "outbound",
                  necessity: "required",
                }),
                new RelationshipCandidate({
                  labels: ["EXECUTE"],
                  properties: { valid: true },
                  endNode: new EnhancedNodeCandidate(
                    new NodeCandidate({
                      labels: ["Trade"],
                      properties: {
                        required: {
                          TRADE_NUM: 2,
                        },
                      },
                    }),
                    {
                      required: [
                        new RelationshipCandidate({
                          labels: ["ON_DATE"],
                          properties: { valid: true },
                          endNode: new NodeCandidate({
                            labels: ["DAY"],
                            properties: {
                              required: {
                                DAY: 2,
                              },
                            },
                          }),
                          direction: "outbound",
                          necessity: "required",
                        }),
                      ],
                    }
                  ),
                  direction: "outbound",
                  necessity: "required",
                }),
              ],
            }
          ),
          new EnhancedNodeCandidate(
            new NodeCandidate({
              labels: ["Person"],
              properties: {
                required: {
                  NAME: "Joe",
                },
              },
            }),
            {
              required: [
                new RelationshipCandidate({
                  labels: ["EXECUTE"],
                  properties: { valid: true },
                  endNode: new EnhancedNodeCandidate(
                    new NodeCandidate({
                      labels: ["Trade"],
                      properties: {
                        required: {
                          TRADE_NUM: 3,
                        },
                      },
                    }),
                    {
                      required: [
                        new RelationshipCandidate({
                          labels: ["ON_DATE"],
                          properties: { valid: true },
                          endNode: new NodeCandidate({
                            labels: ["DAY"],
                            properties: {
                              required: {
                                DAY: 1,
                              },
                            },
                          }),
                          direction: "outbound",
                          necessity: "required",
                        }),
                      ],
                    }
                  ),
                  direction: "outbound",
                  necessity: "required",
                }),
              ],
            }
          ),
          new EnhancedNodeCandidate(
            new NodeCandidate({
              labels: ["Person"],
              properties: {
                required: {
                  NAME: "Mary",
                },
              },
            })
          ),
        ],
        { extract: true }
      );
      await engine.mergeEnhancedNodes([pete, joe, mary]);
    });
    test("should merge Relationships with new and existing nodes", async () => {
      /**
       * I want to test if I can merge a Relationship that has both an existing Node
       * (trade1 and trade2) and a newly created Node (newPete) (not yet existing in Neo4j).
       *
       * The point is that I want to see if merging a Relationship works as well as merging an EnhancedNode. That in the end we have the same DB result.
       */
      // get all Pete's K1 nearest relationships
      const [oldPete_enode]: EnhancedNode = flatten(
        (await engine.enhanceNodes([pete])).map(getResultData)
      );
      // log(oldPete_enode)
      const oldNode: Node = oldPete_enode.toNode();
      const newNode = newPete;
      /* create newRel to merge */
      const oldRels: Relationship[] = oldPete_enode.getAllRelationshipsAsArray();
      const rcs: RelationshipCandidate[] = oldRels.map((oldRel) => {
        const isOldNodeStartNode =
          oldRel.getStartNodeHash() === oldNode.getHash();
        const isOldNodeEndNode = oldRel.getEndNodeHash() === oldNode.getHash();
        if (!isOldNodeStartNode && !isOldNodeEndNode) {
          throw new Error(
            `Engine.mergeRelationships test: cannot understand oldNode's role in this Relationship.\noldNode: ${JSON.stringify(
              oldNode
            )}\noldRel: ${JSON.stringify(oldRel)}`
          );
        }
        const newStartNode = isOldNodeStartNode
          ? newNode
          : oldRel.getStartNode().toNode();
        const newEndNode = isOldNodeEndNode
          ? newNode
          : oldRel.getEndNode().toNode();
        return new RelationshipCandidate({
          labels: oldRel.getLabels(),
          properties: {
            ...oldRel.getRequiredProperties(),
          },
          direction: oldRel.getDirection(),
          necessity: oldRel.getNecessity(),
          startNode: newStartNode,
          endNode: newEndNode,
        });
      });
      const newRels: Result[] = await builder.buildRelationships(rcs);
      // log(newRels)
      if (!newRels.every(isSuccess)) {
        throw new Error(
          `Engine.mergeRelationships test: failed to build all new Relationships.\newRels: ${JSON.stringify(
            newRels
          )}`
        );
      }
      // return newRels
      const relsToMerge: Relationship[] = newRels.map(getResultData);
      // log(relsToMerge)
      const result: Result[] = await engine.mergeRelationships(relsToMerge);
      // log(result)
      expect(result).toBeInstanceOf(Array);
      expect(result.every(isSuccess)).toEqual(true);
      const [newRel1, newRel2]: Relationship[] = result.map(
        (result) => result.getData()[0]
      );
      expect([newRel1, newRel2].every(isWrittenRelationship)).toEqual(true);
    });
  });
});

test("should merge 2 rels with same label, diff _hashes", async () => {
  //// db setup
  await engine.cleanDB();
  //// !db setup
  // (node1)-[REL_TYPE_1 { prop: 1 }]->(node2)
  // (node1)<-[REL_TYPE_1 { prop: 2 }]-(node2)
  // (node1)-[REL_TYPE_2]->(node2)
  //// (node1)<-[REL_TYPE_3]-(node2)
  const [node1, node2] = [
    new Node({
      labels: ["Node1"],
      properties: {
        A: "a1",
        _label: "Node1",
        _date_created: [2020, 5, 1, 5, 1588353878818],
        _hash:
          "72f3216eee30223b4e67ba3ee8f550c4b5f56a622ef360f87feba62ba9614a9c",
      },
      identity: null,
    }),
    new Node({
      labels: ["Node2"],
      properties: {
        A: "a2",
        _label: "Node2",
        _date_created: [2020, 5, 1, 5, 1588353878820],
        _hash:
          "175344f8445a5492c2cc6ff1a2556dcafc7913bec8ccd421731c8d61c92e199a",
      },
      identity: null,
    }),
  ];

  const [rel1a, rel1b, rel2, rel3] = [
    new Relationship({
      labels: ["REL_TYPE_1"],
      properties: {
        prop: 1,
        _hash:
          "69e5171670241e8d58640e027700c7142233a9f22fc236f49689815a757878ae",
        _date_created: [2020, 5, 1, 5, 1588353878824],
        _necessity: "optional",
      },
      startNode: node1,
      endNode: node2,
      identity: null,
      direction: null,
      necessity: "optional",
    }),
    new Relationship({
      labels: ["REL_TYPE_1"],
      properties: {
        prop: 2,
        _hash:
          "a68098b05dc7ebc4a0bee6e69c57b6fb7222063c78eee2390541989c9614cdcc",
        _date_created: [2020, 5, 1, 5, 1588353878824],
        _necessity: "optional",
      },
      startNode: node2,
      endNode: node1,
      identity: null,
      direction: null,
      necessity: "optional",
    }),
    new Relationship({
      labels: ["REL_TYPE_2"],
      properties: {
        _hash:
          "91cb6aace35fbb3254ca117d96119cda32c4b8b22c2f92b48fd37fb10f282c5a",
        _date_created: [2020, 5, 1, 5, 1588353878825],
        _necessity: "optional",
      },
      startNode: node1,
      endNode: node2,
      identity: null,
      direction: null,
      necessity: "optional",
    }),
    new Relationship({
      labels: ["REL_TYPE_3"],
      properties: {
        _hash:
          "4d58c86de004b916ebab7652020415e41f0fa9e8d3e32076ddd6ad7f97939737",
        _date_created: [2020, 5, 1, 5, 1588353878825],
        _necessity: "optional",
      },
      startNode: node2,
      endNode: node1,
      identity: null,
      direction: null,
      necessity: "optional",
    }),
  ];
  const results: Result[] = await engine.mergeRelationships([
    rel1a,
    rel1b,
    rel2 /* , rel3 */,
  ]);

  expect(isArray(results)).toEqual(true);
  expect(results.every(isSuccess)).toEqual(true);
  expect(results.map((result) => result.getData()[0].isWritten())).toEqual([
    true,
    true,
    true,
  ]);
});

test("example", async () => {
  /// db setup
  await engine.cleanDB();
  /// !db setup

  const [relationship]: Relationship = builder.buildRelationships(
    [
      new RelationshipCandidate({
        labels: ["HAS_FRIEND"],
        startNode: builder.makeNode(["Person"], { NAME: "SpongeBob" }),
        endNode: builder.makeNode(["Person"], { NAME: "Patrick" }),
      }),
    ],
    { extract: true }
  );
  const results: Result[] = await engine.mergeRelationships([relationship]);
  expect(results[0].getData()[0].isWritten()).toEqual(true);
});
