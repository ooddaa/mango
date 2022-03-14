/* @flow */
import { engine } from "../../start";
import {
  Builder,
  Node,
  NodeCandidate,
  EnhancedNode,
  isEnhancedNode,
  EnhancedNodeCandidate,
  Relationship,
  RelationshipCandidate,
  Result,
  Success,
  Failure,
  isSuccess,
  log,
  isFailure,
  getResultData,
  Engine,
} from "../../src";

import range from "lodash/range";
import keys from "lodash/keys";
import flatten from "lodash/flatten";
import isArray from "lodash/isArray";

beforeAll(async () => {
  await engine.cleanDB();
});

afterAll(async (done) => {
  // console.log('engine.sessionPool 1', keys(engine.sessionPool))
  engine.closeAllSessions();
  engine.closeDriver();
  // console.log('engine.sessionPool 2', keys(engine.sessionPool))
  done();
});

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

describe("validations", () => {
  test("fail, empty enodes", async () => {
    const result = await engine.mergeEnhancedNodes([]);
    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toBeInstanceOf(Failure);
    expect(result[0].reason).toEqual(
      `Engine.mergeEnhancedNodes(): Validation error: enodes.length === 0.`
    );
  });
  test("fail, some are not ENs", async () => {
    const result = await engine.mergeEnhancedNodes([{}]);
    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toBeInstanceOf(Failure);
    expect(result[0].reason).toEqual(
      `Engine.mergeNodes(): Validation error: First argument must contain only EnhancedNodes. Found something else, aborting.`
    );
  });
});
describe("use cases", () => {
  describe("separate enodes", () => {
    test("empty enode, no parameters, no rels", async () => {
      await engine.cleanDB();
      /**
       * @since { 2021-07-30 } I want to assertain if merging an empty
       * Enode works. It didn't, but I decided that it should as this will
       * allow more simplicity and make EnhancedNode a flexible building
       * block for KG.
       */
      const candidate_ok = new EnhancedNodeCandidate(
        new NodeCandidate({
          labels: ["candidate_ok"],
          properties: {
            required: { A: 666 },
          },
        })
      );
      const [enode]: Result[] = await builder.buildEnhancedNodes(
        [candidate_ok],
        { extract: true }
      );

      /* result */
      const result: Result[] = await engine.mergeEnhancedNodes([enode], {
        wrap: true,
        transform: false,
      });
      // log(result)
      expect(isSuccess(result[0])).toEqual(true);
      expect(result[0].firstDataElement.isWritten()).toEqual(true);

      // result has query & summary
      expect(result[0].query).toEqual(expect.any(String));
      expect(result[0].summary.counters._stats).toMatchObject({
        nodesCreated: 1,
        nodesDeleted: 0,
        relationshipsCreated: 0,
        relationshipsDeleted: 0,
        propertiesSet: 8,
        labelsAdded: 1,
        labelsRemoved: 0,
        indexesAdded: 0,
        indexesRemoved: 0,
        constraintsAdded: 0,
        constraintsRemoved: 0,
      });
    });
    test("build enode and merge, db clean, all ok", async () => {
      await engine.cleanDB();
      const candidate_ok = new EnhancedNodeCandidate(
        new NodeCandidate({
          labels: ["candidate_ok"],
          properties: {
            required: { A: 1 },
          },
        }),
        {
          required: [
            new RelationshipCandidate({
              labels: ["in_rel"],
              properties: { rel_prop: 1 },
              direction: "inbound",
              necessity: "required",
              startNode: new NodeCandidate({
                labels: ["startNode"],
                properties: {
                  required: { A: 1 },
                },
              }),
            }),
            new RelationshipCandidate({
              labels: ["out_rel"],
              properties: { rel_prop: 2 },
              direction: "outbound",
              necessity: "required",
              endNode: new NodeCandidate({
                labels: ["endNode"],
                properties: {
                  required: { B: 2 },
                },
              }),
            }),
          ],
        }
      );
      const [enode]: Result[] = await builder.buildEnhancedNodes([
        candidate_ok,
      ]);

      /* result */
      const result: Result[] = await engine.mergeEnhancedNodes([
        enode.getData(),
      ]);
      expect(result).toBeInstanceOf(Array);
      expect(isSuccess(result[0])).toEqual(true);

      /* enode merged correctly */
      const enode1_ = result[0].firstDataElement;
      expect(enode1_).toBeInstanceOf(EnhancedNode);

      /* here is how it looks */
      // log(enode1_.properties._uuid)
      expect(enode1_).toMatchObject(
        new EnhancedNode({
          labels: ["candidate_ok"],
          properties: {
            A: 1,
            _label: "candidate_ok",
            _date_created,
            _hash:
              "7d5edc56943b093d130bfecfaad2e7e6d32649612bbaa1ee974e126c1c85d4b8",
            _uuid,
          },
          identity,
          relationships: {
            inbound: [
              new Relationship({
                labels: ["in_rel"],
                properties: {
                  rel_prop: 1,
                  _hash: expect.any(String),
                  _necessity: "required",
                  _date_created,
                  _uuid,
                },
                startNode: new Node({
                  labels: ["startNode"],
                  properties: {
                    A: 1,
                    _label: "startNode",
                    _date_created,
                    _hash:
                      "1f0bf4c43d298df991a9fbc5dbc1d743b8471cb954d7913d655c29679704d2d0",
                    _uuid,
                  },
                  identity,
                }),
                endNode: new Node({
                  labels: ["candidate_ok"],
                  properties: {
                    A: 1,
                    _label: "candidate_ok",
                    _date_created,
                    _hash:
                      "7d5edc56943b093d130bfecfaad2e7e6d32649612bbaa1ee974e126c1c85d4b8",
                    _uuid,
                  },
                  identity,
                }),
                identity,
                direction: "inbound",
                necessity: "required",
              }),
            ],
            outbound: [
              new Relationship({
                labels: ["out_rel"],
                properties: {
                  rel_prop: 2,
                  _hash: expect.any(String),
                  _necessity: "required",
                  _date_created,
                  _uuid,
                },
                startNode: new Node({
                  labels: ["candidate_ok"],
                  properties: {
                    A: 1,
                    _label: "candidate_ok",
                    _date_created,
                    _hash:
                      "7d5edc56943b093d130bfecfaad2e7e6d32649612bbaa1ee974e126c1c85d4b8",
                    _uuid,
                  },
                  identity,
                }),
                endNode: new Node({
                  labels: ["endNode"],
                  properties: {
                    B: 2,
                    _label: "endNode",
                    _date_created,
                    _hash:
                      "35c74dcb55fb78e333521ae0c39e364b917da668108b9d65aea2bcc77d07838e",
                    _uuid,
                  },
                  identity,
                }),
                identity,
                direction: "outbound",
                necessity: "required",
              }),
            ],
          },
        })
      );

      // correct identites of coreNode
      expect(enode1_.identity).toEqual(
        enode1_.relationships.inbound[0].endNode.identity
      );
      expect(enode1_.identity).toEqual(
        enode1_.relationships.outbound[0].startNode.identity
      );
    });
    test("_uuid must persist, no rels", async () => {
      await engine.cleanDB();
      //// [2021-08-11] I discovered that Neo4j's _uuid is different from what
      //// mergeEnhancedNodes return! Must of course be the same.
      // keep all transactions in same session

      // const mySession = engine.useSpecialSession();
      // await engine.cleanDB();

      const candidate_ok = new EnhancedNodeCandidate(
        new NodeCandidate({
          labels: ["candidate_ok"],
          properties: {
            required: { A: 1 },
          },
        })
      );
      const [enode]: EnhancedNode = await builder.buildEnhancedNodes(
        [candidate_ok],
        { extract: true }
      );

      // does not have _uuid as had not been merged into Neo4j
      expect(enode.properties._uuid).toEqual(undefined);

      const results: Result[] = await engine.mergeEnhancedNodes([enode]);
      expect(isArray(results)).toEqual(true);

      const merged_enode: EnhancedNode = results[0].firstDataElement;
      // log(results)
      expect(isEnhancedNode(merged_enode)).toEqual(true);

      /// now we should be able to pick same enode by its _uuid
      const merged_enode_uuid = merged_enode.properties._uuid;
      // log(merged_enode_uuid)
      const query = `MATCH (x) WHERE x._uuid = '${merged_enode_uuid}' RETURN x`;
      // log(query)
      const check = await engine.runQuery({ query });
      // log(check)
      expect(check.data[0][0].properties._uuid).toEqual(merged_enode_uuid);
    });
    test("_uuid must persist, after adding rels!!", async () => {
      await engine.cleanDB();
      //// [2021-08-11] I discovered that Neo4j's _uuid is different from what
      //// mergeEnhancedNodes return! Must of course be the same.
      // await engine.cleanDB();
      const A = new EnhancedNodeCandidate(
        new NodeCandidate({
          labels: ["A"],
          properties: {
            required: { A: 1 },
          },
        })
      );
      const [enode]: EnhancedNode = await builder.buildEnhancedNodes([A], {
        extract: true,
      });

      // does not have _uuid as had not been merged into Neo4j
      expect(enode.properties._uuid).toEqual(undefined);

      const results: Result[] = await engine.mergeEnhancedNodes([enode]);
      expect(isArray(results)).toEqual(true);
      const merged_enode: EnhancedNode = results[0].firstDataElement;
      // log(results)
      expect(isEnhancedNode(merged_enode)).toEqual(true);

      /// now we should be able to pick same enode by its _uuid
      const merged_enode_uuid = merged_enode.properties._uuid;
      const query = `MATCH (x) WHERE x._uuid = '${merged_enode_uuid}' RETURN x`;
      // log(query)
      const check = await engine.runQuery({ query });
      // log(check)
      expect(check.data[0][0].properties._uuid).toEqual(merged_enode_uuid);

      //// now we add a subgraph based on A node
      //// (A)-[:REL1]->(B)
      const [rel]: Relationship = await builder.buildRelationships(
        [
          new RelationshipCandidate({
            labels: ["REL1"],
            properties: { REL1_prop: "(A)-[:REL1]->(B)" },
            startNode: enode,
            endNode: new NodeCandidate({
              labels: ["B"],
              properties: {
                required: {
                  B_PROP: "B_PROP",
                },
              },
            }),
            necessity: "required",
          }),
        ],
        { extract: true }
      );
      // log(rel)

      /// add to enode
      enode.addRelationships([rel]);
      // log(enode)

      /// merge and make sure that A's uuid hasn't changed
      const results2: Result[] = await engine.mergeEnhancedNodes([enode]);
      expect(isArray(results2)).toEqual(true);
      const merged_enode2: EnhancedNode = results2[0].firstDataElement;
      // log(results2)
      expect(isEnhancedNode(merged_enode2)).toEqual(true);

      // compare old and new uuid should be same
      expect(merged_enode_uuid).toEqual(merged_enode2.getProperties()._uuid);
    });
    test("build 2 enodes and merge, db clean, all ok", async () => {
      await engine.cleanDB();
      const candidate_ok_1 = new EnhancedNodeCandidate(
        new NodeCandidate({
          labels: ["candidate_ok_1"],
          properties: {
            required: { A: 1 },
          },
        }),
        {
          required: [
            new RelationshipCandidate({
              labels: ["in_rel_1"],
              properties: { rel_prop: 1 },
              direction: "inbound",
              startNode: new NodeCandidate({
                labels: ["startNode_1"],
                properties: {
                  required: { A: 1 },
                },
              }),
            }),
            new RelationshipCandidate({
              labels: ["out_rel_1"],
              properties: { rel_prop: 2 },
              direction: "outbound",
              endNode: new NodeCandidate({
                labels: ["endNode_1"],
                properties: {
                  required: { B: 2 },
                },
              }),
            }),
          ],
        }
      );
      const candidate_ok_2 = new EnhancedNodeCandidate(
        new NodeCandidate({
          labels: ["candidate_ok_2"],
          properties: {
            required: { A: 1 },
          },
        }),
        {
          required: [
            new RelationshipCandidate({
              labels: ["in_rel"],
              properties: { rel_prop: 1 },
              direction: "inbound",
              startNode: new NodeCandidate({
                labels: ["startNode_2"],
                properties: {
                  required: { A: 1 },
                },
              }),
            }),
            new RelationshipCandidate({
              labels: ["out_rel_2"],
              properties: { rel_prop: 2 },
              direction: "outbound",
              endNode: new NodeCandidate({
                labels: ["endNode_2"],
                properties: {
                  required: { B: 2 },
                },
              }),
            }),
          ],
        }
      );
      const [r1, r2]: Result[] = await builder.buildEnhancedNodes([
        candidate_ok_1,
        candidate_ok_2,
      ]);

      /* result */
      const result: Result[] = await engine.mergeEnhancedNodes([
        r1.getData(),
        r2.getData(),
      ]);

      expect(result).toBeInstanceOf(Array);
      expect(result.every(isSuccess)).toEqual(true);

      const [enode1_, enode2_] = [
        result[0].firstDataElement,
        result[1].firstDataElement,
      ];

      /* enode merged correctly */
      expect([enode1_, enode2_].every(isEnhancedNode)).toEqual(true);

      expect(enode1_.isWritten()).toEqual(true);
      expect(enode2_.isWritten()).toEqual(true);
    });
  });
  describe("enode-[rel]->enode", () => {
    test("enode-[rel]->itself", async () => {
      /**
       * Checking if a recursive relationship works.
       */
      const enode = new EnhancedNode({
        labels: ["enode1"],
        properties: {
          INPUT: 0,
          _label: "enode1",
          _date_created: [2020, 3, 13, 5, 1584110723519],
          _hash: "enode1_hash",
          // _uuid: 'enode1_uuid'
        },
        identity: null,
        relationships: {
          inbound: [],
          outbound: [
            new Relationship({
              labels: ["relationship1"],
              properties: {
                weight: 4,
                _hash: "relationship1_hash",
                _date_created: [2020, 3, 13, 5, 1584110723525],
              },
              endNode: new Node({
                labels: ["enode1"],
                properties: {
                  INPUT: 0,
                  _label: "enode1",
                  _date_created: [2020, 3, 13, 5, 1584110723519],
                  _hash: "enode1_hash",
                },
                identity: null,
              }),
              identity: null,
              direction: "outbound",
            }),
          ],
        },
      });

      const result: Result[] = await engine.mergeEnhancedNodes([enode]);

      expect(result).toBeInstanceOf(Array);
      expect(result.every(isSuccess)).toEqual(true);
      expect(result[0].firstDataElement).toBeInstanceOf(EnhancedNode);
      expect(result[0].firstDataElement).toMatchObject(
        new EnhancedNode({
          labels: ["enode1"],
          properties: {
            INPUT: 0,
            _label: "enode1",
            _date_created,
            _hash: "enode1_hash",
            _uuid,
          },
          identity,
          relationships: {
            inbound: [],
            outbound: [
              new Relationship({
                labels: ["relationship1"],
                properties: {
                  weight: 4,
                  _hash: "relationship1_hash",
                  _date_created,
                },
                startNode: new Node({
                  labels: ["enode1"],
                  properties: {
                    INPUT: 0,
                    _label: "enode1",
                    _date_created,
                    _hash: "enode1_hash",
                    _uuid,
                  },
                  identity,
                }),
                endNode: new Node({
                  labels: ["enode1"],
                  properties: {
                    INPUT: 0,
                    _label: "enode1",
                    _date_created,
                    _hash: "enode1_hash",
                    _uuid,
                  },
                  identity,
                }),
                identity,
                direction: "outbound",
              }),
            ],
          },
        })
      );
    });
    test("enode1-[rel]->enode2. rel specified once outbound", async () => {
      /**
       * Checking if a recursive relationship works.
       */
      const enode = new EnhancedNode({
        labels: ["enode1"],
        properties: {
          INPUT: 0,
          _label: "enode1",
          _date_created: [2020, 3, 13, 5, 1584110723519],
          _hash: "enode1_hash",
        },
        identity: null,
        relationships: {
          inbound: [],
          outbound: [
            new Relationship({
              labels: ["relationship1"],
              properties: {
                weight: 4,
                _hash: "relationship1_hash",
                _date_created: [2020, 3, 13, 5, 1584110723525],
              },
              endNode: new EnhancedNode({
                labels: ["enode2"],
                properties: {
                  INPUT: 0,
                  _label: "enode2",
                  _date_created: [2020, 3, 13, 5, 1584110723519],
                  _hash: "enode2_hash",
                },
                identity: null,
                relationships: {
                  inbound: [],
                  outbound: [],
                },
              }),
              identity: null,
              direction: "outbound",
            }),
          ],
        },
      });

      const result: Result[] = await engine.mergeEnhancedNodes([enode]);

      expect(result).toBeInstanceOf(Array);
      expect(result.every(isSuccess)).toEqual(true);
      expect(result[0].firstDataElement).toBeInstanceOf(EnhancedNode);
      expect(result[0].firstDataElement).toMatchObject(
        new EnhancedNode({
          labels: ["enode1"],
          properties: {
            INPUT: 0,
            _label: "enode1",
            _date_created,
            _hash: "enode1_hash",
            _uuid,
          },
          identity,
          relationships: {
            inbound: [],
            outbound: [
              new Relationship({
                labels: ["relationship1"],
                properties: {
                  weight: 4,
                  _hash: "relationship1_hash",
                  _date_created,
                },
                startNode: new Node({
                  labels: ["enode1"],
                  properties: {
                    INPUT: 0,
                    _label: "enode1",
                    _date_created,
                    _hash: "enode1_hash",
                    _uuid,
                  },
                  identity,
                }),
                endNode: new /* EnhancedNode */ Node({
                  labels: ["enode2"],
                  properties: {
                    INPUT: 0,
                    _label: "enode2",
                    _date_created: [2020, 3, 13, 5, 1584110723519],
                    _hash: "enode2_hash",
                    _uuid,
                  },
                  identity,
                  // relationships: {
                  //   inbound: [],
                  //   outbound: []
                  // }
                }),
                identity,
                direction: "outbound",
              }),
            ],
          },
        })
      );
    });
    test("enode1-[rel]->enode2-[rel]->enode1 both enodes own 1 outbound rel", async () => {
      /**
       * Checking if a recursive relationship works.
       */
      const enode = new EnhancedNode({
        labels: ["enode1"],
        properties: {
          INPUT: 0,
          _label: "enode1",
          _date_created: [2020, 3, 13, 5, 1584110723519],
          _hash: "enode1_hash",
        },
        identity: null,
        relationships: {
          inbound: [],
          outbound: [
            new Relationship({
              labels: ["relationship1"],
              properties: {
                weight: 4,
                _hash: "relationship1_hash",
                _date_created: [2020, 3, 13, 5, 1584110723525],
              },
              endNode: new EnhancedNode({
                labels: ["enode2"],
                properties: {
                  INPUT: 0,
                  _label: "enode2",
                  _date_created: [2020, 3, 13, 5, 1584110723519],
                  _hash: "enode2_hash",
                },
                identity: null,
                relationships: {
                  inbound: [],
                  outbound: [
                    new Relationship({
                      labels: ["relationship2"],
                      properties: {
                        weight: 4,
                        _hash: "relationship2_hash",
                        _date_created: [2020, 3, 13, 5, 1584110723525],
                      },
                      endNode: new Node({
                        labels: ["enode1"],
                        properties: {
                          INPUT: 0,
                          _label: "enode1",
                          _date_created: [2020, 3, 13, 5, 1584110723519],
                          _hash: "enode1_hash",
                        },
                        identity: null,
                      }),
                      identity: null,
                      direction: "outbound",
                    }),
                  ],
                },
              }),
              identity: null,
              direction: "outbound",
            }),
          ],
        },
      });

      const result: Result[] = await engine.mergeEnhancedNodes([enode]);

      expect(result).toBeInstanceOf(Array);
      expect(result.every(isSuccess)).toEqual(true);
      expect(result[0].firstDataElement).toBeInstanceOf(EnhancedNode);
      // log(result[0].firstDataElement)
      expect(result[0].firstDataElement).toMatchObject(
        new EnhancedNode({
          labels: ["enode1"],
          properties: {
            INPUT: 0,
            _label: "enode1",
            _date_created,
            _hash: "enode1_hash",
            _uuid,
          },
          identity,
          relationships: {
            inbound: [],
            outbound: [
              new Relationship({
                labels: ["relationship1"],
                properties: {
                  weight: 4,
                  _hash: "relationship1_hash",
                  _date_created,
                  _uuid,
                },
                // just to make the rel complete.
                // we don't want to pass circular reference here
                startNode: new Node({
                  labels: ["enode1"],
                  properties: {
                    INPUT: 0,
                    _label: "enode1",
                    _date_created,
                    _hash: "enode1_hash",
                    _uuid,
                  },
                  identity,
                }),
                endNode: new EnhancedNode({
                  labels: ["enode2"],
                  properties: {
                    INPUT: 0,
                    _label: "enode2",
                    _date_created,
                    _hash: "enode2_hash",
                    _uuid,
                  },
                  identity,
                  relationships: {
                    inbound: [],
                    outbound: [
                      new Relationship({
                        labels: ["relationship2"],
                        properties: {
                          weight: 4,
                          _hash: "relationship2_hash",
                          _date_created,
                          _uuid,
                        },
                        startNode: new Node({
                          labels: ["enode2"],
                          properties: {
                            INPUT: 0,
                            _label: "enode2",
                            _date_created,
                            _hash: "enode2_hash",
                            _uuid,
                          },
                          identity,
                        }),
                        endNode: new Node({
                          labels: ["enode1"],
                          properties: {
                            INPUT: 0,
                            _label: "enode1",
                            _date_created,
                            _hash: "enode1_hash",
                            _uuid,
                          },
                          identity,
                        }),
                        identity,
                        direction: "outbound",
                      }),
                    ],
                  },
                }),
                identity,
                direction: "outbound",
              }),
            ],
          },
        })
      );
    });
  });
  describe("networks of enodes", () => {
    test("build 1 layer of 4 enodes and merge, db clean, all ok", async () => {
      // await engine.runQuery('MATCH (x) DETACH DELETE x')
      /**
       * Simple DNN. 3*4*1. Layer_1 (middle layer, hiddens) are enodes.
       */
      function add_w_0_1(inputs, label, direction, i = 0) {
        return Array.from(Array(inputs.length)).map((val, idx) => {
          return new RelationshipCandidate({
            labels: [label],
            properties: { weight: i++ },
            startNode: inputs[idx],
            direction,
          });
        });
      }
      const layer_0 = [
        new NodeCandidate({
          labels: ["l_0_0"],
          properties: {
            required: { INPUT: 1 }, // omg dont forget to UpperCase, otherwise it will be treated as optional and absence of any required props, _hash won't get generated.
          },
        }),
        new NodeCandidate({
          labels: ["l_0_1"],
          properties: {
            required: { INPUT: 2 },
          },
        }),
        new NodeCandidate({
          labels: ["l_0_2"],
          properties: {
            required: { INPUT: 3 },
          },
        }),
      ];
      const layer_2 = [
        new NodeCandidate({
          labels: ["l_2"],
          properties: {
            required: { OUTPUT: 0 },
          },
        }),
      ];
      const layer_1 = [
        new EnhancedNodeCandidate(
          new NodeCandidate({
            labels: ["l_1_0"],
            properties: {
              required: { INPUT: 0 },
            },
          }),
          {
            required: [
              ...add_w_0_1(layer_0, "w_0_1", "inbound"),
              new RelationshipCandidate({
                labels: ["w_1_2"],
                properties: { weight: 1 },
                direction: "outbound",
                endNode: layer_2[0],
              }),
            ],
          }
        ),
        new EnhancedNodeCandidate(
          new NodeCandidate({
            labels: ["l_1_1"],
            properties: {
              required: { INPUT: 1 },
            },
          }),
          {
            required: [
              ...add_w_0_1(layer_0, "w_0_1", "inbound"),
              new RelationshipCandidate({
                labels: ["w_1_2"],
                properties: { weight: 1 },
                direction: "outbound",
                endNode: layer_2[0],
              }),
            ],
          }
        ),
        new EnhancedNodeCandidate(
          new NodeCandidate({
            labels: ["l_1_2"],
            properties: {
              required: { INPUT: 2 },
            },
          }),
          {
            required: [
              ...add_w_0_1(layer_0, "w_0_1", "inbound"),
              new RelationshipCandidate({
                labels: ["w_1_2"],
                properties: { weight: 1 },
                direction: "outbound",
                endNode: layer_2[0],
              }),
            ],
          }
        ),
        new EnhancedNodeCandidate(
          new NodeCandidate({
            labels: ["l_1_3"],
            properties: {
              required: { INPUT: 3 },
            },
          }),
          {
            required: [
              ...add_w_0_1(layer_0, "w_0_1", "inbound"),
              new RelationshipCandidate({
                labels: ["w_1_2"],
                properties: { weight: 1 },
                direction: "outbound",
                endNode: layer_2[0],
              }),
            ],
          }
        ),
      ];

      const e_results: Result[] = await builder.buildEnhancedNodes(layer_1);

      // log(e_results)
      /* result */
      const result: Result[] = await engine.mergeEnhancedNodes(
        e_results.map((r) => r.getSingleDatum())
      );

      expect(result).toBeInstanceOf(Array);
      expect(result.every(isSuccess)).toEqual(true);

      const [enode1_, enode2_] = [
        result[0].firstDataElement,
        result[1].firstDataElement,
      ];

      /* enode merged correctly */
      expect([enode1_, enode2_].every(isEnhancedNode)).toEqual(true);
      expect(enode1_.isWritten()).toEqual(true);
      expect(enode2_.isWritten()).toEqual(true);
    });
    test("build 2 layers of 1 enodes each and merge, db clean, all ok", async () => {
      /**
       * DNN 1*1*1*1. layer_1 & layer_2 are enodes.
       * layer_1 has w_0 as weights (inbound rels)
       * layer_2 has w_1 (inbound from layer_1) & w_2 (outbound to layer_3)
       */
      const layer_0 = [
        new Node({
          labels: ["l_0_0"],
          properties: {
            INPUT: 0,
            _label: "l_0_0",
            _date_created: [2020, 3, 13, 5, 1584110723519],
            _hash: "l_0_0_hash",
          },
          identity: null,
        }),
      ];

      const layer_1 = [
        new EnhancedNode({
          labels: ["l_1_0"],
          properties: {
            INPUT: 1,
            _label: "l_1_0",
            _date_created: [2020, 3, 13, 5, 1584110723519],
            _hash: "l_1_0_hash",
          },
          identity: null,
          relationships: {
            inbound: [
              new Relationship({
                labels: ["w0__l_0_0__l_1_0"],
                properties: {
                  weight: 1,
                  _hash: "w0__l_0_0__l_1_0_hash",
                  _necessity: "required",
                  _date_created: [2020, 3, 13, 5, 1584110723525],
                },
                identity: null,
                necessity: "required",
                direction: "inbound",
                startNode: layer_0[0],
              }),
            ],
            outbound: [],
          },
        }),
      ];

      const layer_3 = [
        new Node({
          labels: ["l_3_0"],
          properties: {
            INPUT: 0,
            _label: "l_3_0",
            _date_created: [2020, 3, 13, 5, 1584110723519],
            _hash: "l_3_0_hash",
          },
          identity: null,
        }),
      ];

      const layer_2 = [
        new EnhancedNode({
          labels: ["l_2_0"],
          properties: {
            INPUT: 1,
            _label: "l_2_0",
            _date_created: [2020, 3, 13, 5, 1584110723519],
            _hash: "l_2_0_hash",
          },
          identity: null,
          relationships: {
            inbound: [
              new Relationship({
                labels: ["w1__l_1_0__l_2_0"],
                properties: {
                  weight: 1,
                  _hash: "w1__l_1_0__l_2_0_hash",
                  _necessity: "required",
                  _date_created: [2020, 3, 13, 5, 1584110723525],
                },
                identity: null,
                necessity: "required",
                direction: "inbound",
                startNode: layer_1[0],
              }),
            ],
            outbound: [
              new Relationship({
                labels: ["w2__l_2_0__l_3_0"],
                properties: {
                  weight: 1,
                  _hash: "w2__l_2_0__l_3_0_hash",
                  _necessity: "required",
                  _date_created: [2020, 3, 13, 5, 1584110723525],
                },
                identity: null,
                necessity: "required",
                direction: "outbound",
                endNode: layer_3[0],
              }),
            ],
          },
        }),
      ];

      /* result */
      const result: Result[] = await engine.mergeEnhancedNodes([
        /* ...layer_1, */ ...layer_2,
      ]); // works either way
      // log(result)
      expect(result).toBeInstanceOf(Array);
      expect(result.every(isSuccess)).toEqual(true);

      function _unwrap(acc = [], res) {
        acc.push(res.firstDataElement);
        return acc;
      }
      const enodes = result.reduce(_unwrap, []);

      /* enode merged correctly */

      expect(enodes.every((enode) => enode.isWritten())).toEqual(true);
      // log(enodes)
      expect(enodes).toEqual(
        expect.arrayContaining([
          new EnhancedNode({
            labels: ["l_2_0"],
            properties: {
              INPUT: 1,
              _label: "l_2_0",
              _date_created,
              _hash: "l_2_0_hash",
              _uuid,
            },
            identity,
            relationships: {
              inbound: [
                new Relationship({
                  labels: ["w1__l_1_0__l_2_0"],
                  properties: {
                    weight: 1,
                    _hash: "w1__l_1_0__l_2_0_hash",
                    _necessity: "required",
                    _date_created,
                    _uuid,
                  },
                  startNode: new EnhancedNode({
                    labels: ["l_1_0"],
                    properties: {
                      INPUT: 1,
                      _label: "l_1_0",
                      _date_created,
                      _hash: "l_1_0_hash",
                      _uuid,
                    },
                    identity,
                    relationships: {
                      inbound: [
                        new Relationship({
                          labels: ["w0__l_0_0__l_1_0"],
                          properties: {
                            weight: 1,
                            _hash: "w0__l_0_0__l_1_0_hash",
                            _necessity: "required",
                            _date_created,
                            _uuid,
                          },
                          startNode: new Node({
                            labels: ["l_0_0"],
                            properties: {
                              INPUT: 0,
                              _label: "l_0_0",
                              _date_created,
                              _hash: "l_0_0_hash",
                              _uuid,
                            },
                            identity,
                          }),
                          endNode: new Node({
                            labels: ["l_1_0"],
                            properties: {
                              INPUT: 1,
                              _label: "l_1_0",
                              _date_created,
                              _hash: "l_1_0_hash",
                              _uuid,
                            },
                            identity,
                          }),
                          identity,
                          direction: "inbound",
                          necessity: "required",
                        }),
                      ],
                      outbound: [],
                    },
                  }),
                  endNode: new Node({
                    labels: ["l_2_0"],
                    properties: {
                      INPUT: 1,
                      _label: "l_2_0",
                      _date_created,
                      _hash: "l_2_0_hash",
                      _uuid,
                    },
                    identity,
                  }),
                  identity,
                  direction: "inbound",
                  necessity: "required",
                }),
              ],
              outbound: [
                new Relationship({
                  labels: ["w2__l_2_0__l_3_0"],
                  properties: {
                    weight: 1,
                    _hash: "w2__l_2_0__l_3_0_hash",
                    _necessity: "required",
                    _date_created,
                    _uuid,
                  },
                  startNode: new Node({
                    labels: ["l_2_0"],
                    properties: {
                      INPUT: 1,
                      _label: "l_2_0",
                      _date_created,
                      _hash: "l_2_0_hash",
                      _uuid,
                    },
                    identity,
                  }),
                  endNode: new Node({
                    labels: ["l_3_0"],
                    properties: {
                      INPUT: 0,
                      _label: "l_3_0",
                      _date_created,
                      _hash: "l_3_0_hash",
                      _uuid,
                    },
                    identity,
                  }),
                  identity,
                  direction: "outbound",
                  necessity: "required",
                }),
              ],
            },
          }),
        ])
      );
    });
    test("build DNN 3*4*4*1 hidden enodes layers, db clean, all ok", async () => {
      /**
       * DNN 3*4*4*1. layer_1 + layer_2 are enodes.
       * layer_1 has w_0 as weights (inbound rels)
       * layer_2 has w_1 (inbound from layer_1) & w_2 (outbound to layer_3)
       */
      function add_weights(
        inputs,
        label,
        rel_label_prefix,
        direction,
        mainNode
      ) {
        return /* Array.from(Array(inputs.length)) */ inputs.map(
          (inputNode, idx) => {
            // log(inputNode.labels[0])
            let inputNodeLabel /* (inputNode.labels[0][4] = String(idx)) */ = inputNode.labels[0].split(
              "_"
            );
            inputNodeLabel.pop();
            inputNodeLabel.push(String(idx));
            inputNodeLabel = inputNodeLabel.join("_");
            // log(inputNodeLabel)
            const rel = new Relationship({
              labels:
                direction === "inbound"
                  ? [`${rel_label_prefix}__${inputNodeLabel}__${label}`]
                  : [`${rel_label_prefix}__${label}__${inputNodeLabel}`],
              properties: {
                weight: 1,
                _hash:
                  direction === "inbound"
                    ? [`${rel_label_prefix}__${inputNodeLabel}__${label}_hash`]
                    : [`${rel_label_prefix}__${label}__${inputNodeLabel}_hash`],
                _necessity: "required",
                _date_created: [2020, 3, 13, 5, 1584110723525],
              },
              identity: null,
              direction,
              necessity: "required",
              startNode: direction === "inbound" ? inputNode : undefined,
              endNode: direction === "inbound" ? undefined : inputNode,
            });

            // direction === 'inbound' ? rel.setStartNode(inputNode) : rel.setEndNode(inputNode)
            // log(rel)
            return rel;
          }
        );
      }
      const layer_0 = [
        new Node({
          labels: ["l_0_0"],
          properties: {
            INPUT: 0,
            _label: "l_0_0",
            _date_created: [2020, 3, 13, 5, 1584110723519],
            _hash: "l_0_0_hash",
          },
          identity: null,
        }),
        new Node({
          labels: ["l_0_1"],
          properties: {
            INPUT: 0,
            _label: "l_0_1",
            _date_created: [2020, 3, 13, 5, 1584110723519],
            _hash: "l_0_1_hash",
          },
          identity: null,
        }),
        new Node({
          labels: ["l_0_2"],
          properties: {
            INPUT: 0,
            _label: "l_0_2",
            _date_created: [2020, 3, 13, 5, 1584110723519],
            _hash: "l_0_2_hash",
          },
          identity: null,
        }),
      ];

      const layer_1 = [
        new EnhancedNode({
          labels: ["l_1_0"],
          properties: {
            INPUT: 1,
            _label: "l_1_0",
            _date_created: [2020, 3, 13, 5, 1584110723519],
            _hash: "l_1_0_hash",
          },
          identity: null,
          relationships: {
            inbound: [...add_weights(layer_0, "l_1_0", "w0", "inbound", this)],
            outbound: [],
          },
        }),
        new EnhancedNode({
          labels: ["l_1_1"],
          properties: {
            INPUT: 1,
            _label: "l_1_1",
            _date_created: [2020, 3, 13, 5, 1584110723519],
            _hash: "l_1_1_hash",
          },
          identity: null,
          relationships: {
            inbound: [...add_weights(layer_0, "l_1_1", "w0", "inbound", this)],
            outbound: [],
          },
        }),
        new EnhancedNode({
          labels: ["l_1_2"],
          properties: {
            INPUT: 1,
            _label: "l_1_2",
            _date_created: [2020, 3, 13, 5, 1584110723519],
            _hash: "l_1_2_hash",
          },
          identity: null,
          relationships: {
            inbound: [...add_weights(layer_0, "l_1_2", "w0", "inbound", this)],
            outbound: [],
          },
        }),
        new EnhancedNode({
          labels: ["l_1_3"],
          properties: {
            INPUT: 1,
            _label: "l_1_3",
            _date_created: [2020, 3, 13, 5, 1584110723519],
            _hash: "l_1_3_hash",
          },
          identity: null,
          relationships: {
            inbound: [...add_weights(layer_0, "l_1_3", "w0", "inbound", this)],
            outbound: [],
          },
        }),
      ];

      const layer_3 = [
        new Node({
          labels: ["l_3_0"],
          properties: {
            INPUT: 0,
            _label: "l_3_0",
            _date_created: [2020, 3, 13, 5, 1584110723519],
            _hash: "l_3_0_hash",
          },
          identity: null,
        }),
      ];

      const layer_2 = [
        new EnhancedNode({
          labels: ["l_2_0"],
          properties: {
            INPUT: 1,
            _label: "l_2_0",
            _date_created: [2020, 3, 13, 5, 1584110723519],
            _hash: "l_2_0_hash",
          },
          identity: null,
          relationships: {
            inbound: [...add_weights(layer_1, "l_2_0", "w1", "inbound", this)],
            outbound: [
              new Relationship({
                labels: ["w2__l_2_0__l_3_0"],
                properties: {
                  weight: 1,
                  _hash: "w2__l_2_0__l_3_0_hash",
                  _necessity: "required",
                  _date_created: [2020, 3, 13, 5, 1584110723525],
                },
                identity: null,
                direction: "outbound",
                necessity: "required",
                endNode: layer_3[0],
              }),
            ],
          },
        }),
        new EnhancedNode({
          labels: ["l_2_1"],
          properties: {
            INPUT: 1,
            _label: "l_2_1",
            _date_created: [2020, 3, 13, 5, 1584110723519],
            _hash: "l_2_1_hash",
          },
          identity: null,
          relationships: {
            inbound: [...add_weights(layer_1, "l_2_1", "w1", "inbound", this)],
            outbound: [
              new Relationship({
                labels: ["w2__l_2_1__l_3_0"],
                properties: {
                  weight: 1,
                  _hash: "w2__l_2_1__l_3_0_hash",
                  _necessity: "required",
                  _date_created: [2020, 3, 13, 5, 1584110723525],
                },
                identity: null,
                direction: "outbound",
                necessity: "required",
                endNode: layer_3[0],
              }),
            ],
          },
        }),
        new EnhancedNode({
          labels: ["l_2_2"],
          properties: {
            INPUT: 1,
            _label: "l_2_2",
            _date_created: [2020, 3, 13, 5, 1584110723519],
            _hash: "l_2_2_hash",
          },
          identity: null,
          relationships: {
            inbound: [...add_weights(layer_1, "l_2_2", "w1", "inbound", this)],
            outbound: [
              new Relationship({
                labels: ["w2__l_2_2__l_3_0"],
                properties: {
                  weight: 1,
                  _hash: "w2__l_2_2__l_3_0_hash",
                  _necessity: "required",
                  _date_created: [2020, 3, 13, 5, 1584110723525],
                },
                identity: null,
                direction: "outbound",
                necessity: "required",
                endNode: layer_3[0],
              }),
            ],
          },
        }),
        new EnhancedNode({
          labels: ["l_2_3"],
          properties: {
            INPUT: 1,
            _label: "l_2_3",
            _date_created: [2020, 3, 13, 5, 1584110723519],
            _hash: "l_2_3_hash",
          },
          identity: null,
          relationships: {
            inbound: [...add_weights(layer_1, "l_2_3", "w1", "inbound", this)],
            outbound: [
              new Relationship({
                labels: ["w2__l_2_3__l_3_0"],
                properties: {
                  weight: 1,
                  _hash: "w2__l_2_3__l_3_0_hash",
                  _necessity: "required",
                  _date_created: [2020, 3, 13, 5, 1584110723525],
                },
                identity: null,
                direction: "outbound",
                necessity: "required",
                endNode: layer_3[0],
              }),
            ],
          },
        }),
      ];

      /* result */
      const results: Result[] = await engine.mergeEnhancedNodes([
        /* ...layer_1, */ ...layer_2,
      ]); // works either way

      expect(results).toBeInstanceOf(Array);

      // no failures
      const fails = results.filter(isFailure);
      expect(fails.length).toEqual(0);
      expect(results.every(isSuccess)).toEqual(true);

      function _unwrap(acc = [], res) {
        acc.push(res.firstDataElement);
        return acc;
      }
      const enodes = results.reduce(_unwrap, []);

      /* enode merged correctly */

      expect(enodes.every((enode) => enode.isWritten())).toEqual(true);
    });
  });

  /**
   * Testing if we can handle deep EnhancedNodes
   */
  describe("enode of arbitrary depth exists", () => {
    test("three hops", async () => {
      await engine.cleanDB();
      /* (A)-[r1]->(B)-[r2]->(C)-[r3]->(D) */
      const D = new NodeCandidate({
        labels: ["NodeD"],
      });

      const C = new EnhancedNodeCandidate(
        new NodeCandidate({
          labels: ["NodeC"],
        }),
        {
          required: [
            new RelationshipCandidate({
              labels: ["r3"],
              endNode: D,
              direction: "outbound",
            }),
          ],
        }
      );

      const B = new EnhancedNodeCandidate(
        new NodeCandidate({
          labels: ["NodeB"],
        }),
        {
          required: [
            new RelationshipCandidate({
              labels: ["r2"],
              endNode: C,
              direction: "outbound",
            }),
          ],
        }
      );

      const A = new EnhancedNodeCandidate(
        new NodeCandidate({
          labels: ["NodeA"],
        }),
        {
          required: [
            new RelationshipCandidate({
              labels: ["r1"],
              endNode: B,
              direction: "outbound",
            }),
          ],
        }
      );

      const Aenode: EnhancedNode[] = (
        await new Builder().buildEnhancedNodes([A])
      ).map(getResultData);

      const result: Result[] = await engine.mergeEnhancedNodes(Aenode);

      expect(result).toBeInstanceOf(Array);
      expect(result.every(isSuccess)).toEqual(true);
      const enode = result[0].firstDataElement;
      expect(enode).toBeInstanceOf(EnhancedNode);
      expect(enode.getParticipatingRelationships()).toHaveLength(3);
    });
    test("circular", async () => {
      await engine.cleanDB();
      /* (A)-[r1]->(B)-[r2]->(C)-[r3]->(A) */

      const C = new EnhancedNodeCandidate(
        new NodeCandidate({
          labels: ["NodeC"],
        }),
        {
          required: [
            new RelationshipCandidate({
              labels: ["r3"],
              endNode: new NodeCandidate({
                labels: ["NodeA"],
              }),
              direction: "outbound",
            }),
          ],
        }
      );

      const B = new EnhancedNodeCandidate(
        new NodeCandidate({
          labels: ["NodeB"],
        }),
        {
          required: [
            new RelationshipCandidate({
              labels: ["r2"],
              endNode: C,
              direction: "outbound",
            }),
          ],
        }
      );

      const A = new EnhancedNodeCandidate(
        new NodeCandidate({
          labels: ["NodeA"],
        }),
        {
          required: [
            new RelationshipCandidate({
              labels: ["r1"],
              endNode: B,
              direction: "outbound",
            }),
          ],
        }
      );

      const Aenode: EnhancedNode[] = (
        await new Builder().buildEnhancedNodes([A])
      ).map(getResultData);

      const result: Result[] = await engine.mergeEnhancedNodes(Aenode);

      expect(result).toBeInstanceOf(Array);
      expect(result.every(isSuccess)).toEqual(true);
      const enode = result[0].firstDataElement;
      expect(enode).toBeInstanceOf(EnhancedNode);
      expect(enode.getParticipatingRelationships()).toHaveLength(3);
    });
  });
});
