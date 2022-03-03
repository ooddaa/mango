debugger;

import { engine } from "../../start";
import {
  Builder,
  Node,
  NodeCandidate,
  EnhancedNode,
  EnhancedNodeCandidate,
  RelationshipCandidate,
  Result,
  isSuccess,
  getResultData,
  log,
  isEnhancedNode,
  Relationship,
} from "../../src";

import { UpdatingPair, UpdatedPair } from "../../src/types";

import uniqBy from "lodash/uniqBy";
import remove from "lodash/remove";
import isArray from "lodash/isArray";
import flatten from "lodash/flatten";
import isString from "lodash/isString";
import cloneDeep from "lodash/cloneDeep";
import flattenDeep from "lodash/flattenDeep";

const builder = new Builder();

const remainingProp = "optional_prop";
const nodes = {};
const _date_created = [
  expect.any(Number),
  expect.any(Number),
  expect.any(Number),
  expect.any(Number),
  expect.any(Number),
];

afterAll(async (done) => {
  engine.closeAllSessions();
  engine.closeDriver();
  done();
});

describe("validations", async () => {
  test("first arg must be UpdatingPairs[]", async () => {
    await engine.updateNodes({}).catch((e) => {
      expect(e.message).toEqual(
        `Engine.updateNodes validations: first argument must be UpdatingPair[]. UpdatingPair == { updatee: Node|EnhancedNode, updater: Node|EnhancedNode }`
      );
    });
  });
  test("missing updatee", async () => {
    await engine.updateNodes([{}]).catch((e) => {
      expect(e.message).toEqual(
        "Engine.updateNodes validations: updatee is missing:\npair: {}"
      );
    });
  });
  test("missing updater", async () => {
    await engine.updateNodes([{ updatee: null }]).catch((e) => {
      expect(e.message).toEqual(
        'Engine.updateNodes validations: updater is missing:\npair: {"updatee":null}'
      );
    });
  });
  test("each UpdatingPair must be complete: updatee && updater", async () => {
    await engine.updateNodes([{ updatee: null, updater: null }]).catch((e) => {
      expect(e.message).toEqual(
        'Engine.updateNodes validations: this pair is not complete:\npair: {"updatee":null,"updater":null}'
      );
    });
  });
  test("both need to be Nodes", async () => {
    await engine
      .updateNodes([{ updatee: "smthElse", updater: 123 }])
      .catch((e) => {
        expect(e.message).toEqual(
          'Engine.updateNodes validations: this pair does not qualify, both need to be Node|EnhancedNode:\npair: {"updatee":"smthElse","updater":123}'
        );
      });
  });
  test("all updatees must be written in Neo4j", async () => {
    await engine
      .updateNodes([
        {
          updatee: new Node({ labels: ["OldNode"], properties: { A: 1 } }),
          updater: new Node({ labels: ["NewNode"], properties: { A: 2 } }),
        },
      ])
      .catch((e) => {
        expect(e.message).toEqual(
          `Engine.updateNodes validations: this pair's updatee has not been written to Neo4j yet. Each updatee must be written in Neo4j and have identifications:\npair: {"updatee":{"labels":["OldNode"],"properties":{"A":1},"identity":null},"updater":{"labels":["NewNode"],"properties":{"A":2},"identity":null}}`
        );
      });
  });
});
describe("simple cases", async () => {
  beforeAll(async () => {
    const [_oldNode]: Node = await builder.buildNodes(
      [
        new NodeCandidate({
          labels: ["OldNode"],
          properties: {
            required: {
              NAME: "OldNode",
            },
            optional: {
              remainingProp,
              removedProp: 666,
            },
          },
        }),
      ],
      { extract: true }
    );
    nodes["_oldNode"] = _oldNode;
  });
  test("no rels involved", async () => {
    //// simplest case. oldNode gets updated by newNode. no rels involved
    /// setup
    await engine.cleanDB();
    const [oldNode] = await engine.mergeNodes([nodes["_oldNode"]], {
      extract: true,
    });
    const [_newNode]: Node = await builder.buildNodes(
      [
        new NodeCandidate({
          labels: ["newNode"],
          properties: {
            required: {
              NAME: "newNode",
            },
            optional: {
              remainingProp,
              prop: "optional_prop", // doubles oldNode's prop
            },
          },
        }),
      ],
      { extract: true }
    );
    /// !setup

    const result: UpdatedPair[] = await engine.updateNodes(
      [{ updatee: oldNode, updater: _newNode }],
      { enhanceOnReturn: true }
    );
    // log(result);
    // updateNodes should return [{ updatee: EnhancedNode, updater: EnhancedNode }]
    expect(isEnhancedNode(result[0].updatee)).toEqual(true);
    expect(isEnhancedNode(result[0].updater)).toEqual(true);

    expect(result[0].updatee.isWritten()).toEqual(true);
    expect(result[0].updater.isWritten()).toEqual(true);

    const has_update_rel: Relationship[] = result[0].updater.getRelationshipsByLabel(
      "HAS_UPDATE"
    );
    expect(has_update_rel.length === 1).toEqual(true);
    expect(has_update_rel[0].isWritten()).toEqual(true);

    //// oldNode must be marked as updated
    expect(result[0].updatee.getProperties()).toMatchObject({
      _dateUpdated: _date_created,
      _updateeNodeHash: expect.any(String),
      _userUpdated: expect.any(String),
      _hash: expect.any(String),
      _date_created: _date_created,
      _uuid: expect.any(String),
      _isCurrent: false,
      _toDate: _date_created,
      _hasBeenUpdated: true,
    });
  });
  test("newEnode rels involved", async () => {
    //// oldNode gets updated by newENode. newEnode rels involved
    //// newEnode has not been written to Neo4j
    /// setup
    await engine.cleanDB();
    const [oldNode]: EnhancedNode = await engine.mergeNodes(
      [nodes["_oldNode"]],
      { extract: true }
    );
    const [_newEnode]: EnhancedNode = await builder.buildEnhancedNodes(
      [
        new EnhancedNodeCandidate(
          new NodeCandidate({
            labels: ["newEnode"],
            properties: {
              required: {
                NAME: "newEnode",
              },
              optional: {
                remainingProp,
                prop: "optional_prop", // doubles oldNode's prop
              },
            },
          }),
          {
            required: [
              new RelationshipCandidate({
                labels: ["C"],
                properties: { REQ_PROP: "(newEnode)-[:C]->(Z)" },
                direction: "outbound",
                // _isCurrent: true,
                // _isValid: true
                endNode: new NodeCandidate({
                  labels: ["Z"],
                  properties: {
                    required: { Z_REQ_PROP: "Z_REQ_PROP" },
                  },
                }),
              }),
            ],
          }
        ),
      ],
      { extract: true }
    );
    /// !setup
    // log(_newEnode)
    const result: UpdatedPair[] = await engine.updateNodes(
      [{ updatee: oldNode, updater: _newEnode }],
      { enhanceOnReturn: true }
    );
    // log(result)
    // updateNodes should return [{ updatee: EnhancedNode, updater: EnhancedNode }]
    expect(isEnhancedNode(result[0].updatee)).toEqual(true);
    expect(isEnhancedNode(result[0].updater)).toEqual(true);

    expect(result[0].updatee.isWritten()).toEqual(true);
    expect(result[0].updater.isWritten()).toEqual(true);

    const has_update_rel: Relationship[] = result[0].updater.getRelationshipsByLabel(
      "HAS_UPDATE"
    );
    expect(has_update_rel.length === 1).toEqual(true);
    expect(has_update_rel[0].isWritten()).toEqual(true);
    expect(has_update_rel[0].getStartNode().getHash()).toEqual(
      oldNode.getHash()
    );
    expect(has_update_rel[0].getEndNode().getHash()).toEqual(
      _newEnode.getHash()
    );

    const has_C_rel: Relationship[] = result[0].updater.getRelationshipsByLabel(
      "C"
    );
    expect(has_C_rel.length === 1).toEqual(true);
    expect(has_C_rel[0].isWritten()).toEqual(true);

    //// oldNode must be marked as updated
    expect(result[0].updatee.getProperties()).toMatchObject({
      _dateUpdated: _date_created,
      _updateeNodeHash: expect.any(String),
      _userUpdated: expect.any(String),
      _hash: expect.any(String),
      _date_created: _date_created,
      _uuid: expect.any(String),
      _isCurrent: false,
      _toDate: _date_created,
      _hasBeenUpdated: true,
    });
  });
});
describe("complex cases", async () => {
  test("oldEnode has rels", async () => {
    //// oldEnode has rels, keeps it as _isCurrent: false
    //// newEnode has no rels. No rels are switched
    //// -[HAS_UPDATE]-> is set
    /// setup
    await engine.cleanDB();
    const [
      _oldEnode,
      _newEnode,
    ]: EnhancedNode = await builder.buildEnhancedNodes(
      [
        new EnhancedNodeCandidate(
          new NodeCandidate({
            labels: ["oldEnode"],
            properties: {
              required: {
                NAME: "oldEnode",
                PROP: 123,
              },
              optional: {
                remainingProp,
                prop: "optional_prop",
              },
            },
          }),
          {
            required: [
              new RelationshipCandidate({
                labels: ["A"],
                properties: { REQ_PROP: "(oldEnode)-[:A]->(X)" },
                direction: "outbound",
                // _isCurrent: true,
                // _isValid: true
                endNode: new NodeCandidate({
                  labels: ["X"],
                  properties: {
                    required: { X_REQ_PROP: "X_REQ_PROP" },
                  },
                }),
              }),
              new RelationshipCandidate({
                labels: ["B"],
                properties: { REQ_PROP: "(oldEnode)-[:B]->(Y)" },
                direction: "outbound",
                // _isCurrent: true,
                // _isValid: true
                endNode: new NodeCandidate({
                  labels: ["Y"],
                  properties: {
                    required: { Y_REQ_PROP: "Y_REQ_PROP" },
                  },
                }),
              }),
            ],
          }
        ),
        // newEnode
        new EnhancedNodeCandidate(
          new NodeCandidate({
            labels: ["newEnode"],
            properties: {
              required: {
                NAME: "newEnode",
                PROP: 123,
              },
              optional: {
                remainingProp,
                prop: "optional_prop",
              },
            },
          })
        ),
      ],
      { extract: true }
    );
    // console.log(_oldEnode, _newEnode)
    const [oldEnode]: EnhancedNode = await engine.mergeEnhancedNodes(
      [_oldEnode],
      { extract: true }
    );
    // log(oldEnode)
    /// !setup

    const result: UpdatedPair[] = await engine.updateNodes(
      [{ updatee: oldEnode, updater: _newEnode }],
      { enhanceOnReturn: true }
    );
    // log(result)

    //// updateNodes should return [{ updatee: EnhancedNode, updater: EnhancedNode }]
    expect(isEnhancedNode(result[0].updatee)).toEqual(true);
    expect(isEnhancedNode(result[0].updater)).toEqual(true);

    expect(result[0].updatee.isWritten()).toEqual(true);
    expect(result[0].updater.isWritten()).toEqual(true);

    //// check (updatee)-[:HAS_UPDATE]->(updater)
    const has_update_rel: Relationship[] = result[0].updater.getRelationshipsByLabel(
      "HAS_UPDATE"
    );
    expect(has_update_rel.length === 1).toEqual(true);
    expect(has_update_rel[0].isWritten()).toEqual(true);
    expect(has_update_rel[0].getStartNode().getHash()).toEqual(
      _oldEnode.getHash()
    );
    expect(has_update_rel[0].getEndNode().getHash()).toEqual(
      _newEnode.getHash()
    );

    //// check oldEnode's rels must be _isCurrent: false
    result[0].updatee
      .getAllRelationshipsAsArray()
      .filter((rel) => rel.getLabels()[0] !== "HAS_UPDATE")
      .forEach((rel) => {
        expect(rel.properties._isCurrent).toEqual(false);
      });

    //// oldNode must be marked as updated
    expect(result[0].updatee.getProperties()).toMatchObject({
      _dateUpdated: _date_created,
      _updateeNodeHash: expect.any(String),
      _userUpdated: expect.any(String),
      _hash: expect.any(String),
      _date_created: _date_created,
      _uuid: expect.any(String),
      _isCurrent: false,
      _toDate: _date_created,
      _hasBeenUpdated: true,
    });
  });
  test("oldEnode & newEnode have rels", async () => {
    //// oldEnode has rels, keeps it as _isCurrent: false
    //// newEnode has rels. No rels are switched
    //// -[HAS_UPDATE]-> is set
    /// setup
    await engine.cleanDB();
    const [
      _oldEnode,
      _newEnode,
    ]: EnhancedNode = await builder.buildEnhancedNodes(
      [
        new EnhancedNodeCandidate(
          new NodeCandidate({
            labels: ["oldEnode"],
            properties: {
              required: {
                NAME: "oldEnode",
                PROP: 123,
              },
              optional: {
                remainingProp,
                prop: "optional_prop",
              },
            },
          }),
          {
            required: [
              new RelationshipCandidate({
                labels: ["A"],
                properties: { REQ_PROP: "(oldEnode)-[:A]->(X)" },
                direction: "outbound",
                // _isCurrent: true,
                // _isValid: true
                endNode: new NodeCandidate({
                  labels: ["X"],
                  properties: {
                    required: { X_REQ_PROP: "X_REQ_PROP" },
                  },
                }),
              }),
              new RelationshipCandidate({
                labels: ["B"],
                properties: { REQ_PROP: "(oldEnode)-[:B]->(Y)" },
                direction: "outbound",
                // _isCurrent: true,
                // _isValid: true
                endNode: new NodeCandidate({
                  labels: ["Y"],
                  properties: {
                    required: { Y_REQ_PROP: "Y_REQ_PROP" },
                  },
                }),
              }),
            ],
          }
        ),
        // newEnode
        new EnhancedNodeCandidate(
          new NodeCandidate({
            labels: ["newEnode"],
            properties: {
              required: {
                NAME: "newEnode",
                PROP: 123,
              },
              optional: {
                remainingProp,
                prop: "optional_prop",
              },
            },
          }),
          {
            required: [
              new RelationshipCandidate({
                labels: ["C"],
                properties: { REQ_PROP: "(newEnode)-[:C]->(X)" },
                direction: "outbound",
                // to same (X) as oldNode
                endNode: new NodeCandidate({
                  labels: ["X"],
                  properties: {
                    required: { X_REQ_PROP: "X_REQ_PROP" },
                  },
                }),
              }),
              new RelationshipCandidate({
                labels: ["D"],
                properties: { REQ_PROP: "(newEnode)<-[:D]-(Z)" },
                direction: "inbound",
                startNode: new NodeCandidate({
                  labels: ["Z"],
                  properties: {
                    required: { Z_REQ_PROP: "Z_REQ_PROP" },
                  },
                }),
              }),
            ],
          }
        ),
      ],
      { extract: true }
    );
    // console.log(_oldEnode, _newEnode)
    const [oldEnode]: EnhancedNode = await engine.mergeEnhancedNodes(
      [_oldEnode],
      { extract: true }
    );
    // log(oldEnode)
    /// !setup

    const result: UpdatedPair[] = await engine.updateNodes(
      [{ updatee: oldEnode, updater: _newEnode }],
      { enhanceOnReturn: true }
    );
    // log(result)

    // updateNodes should return [{ updatee: EnhancedNode, updater: EnhancedNode }]
    expect(isEnhancedNode(result[0].updatee)).toEqual(true);
    expect(isEnhancedNode(result[0].updater)).toEqual(true);

    expect(result[0].updatee.isWritten()).toEqual(true);
    expect(result[0].updater.isWritten()).toEqual(true);

    //// check (updatee)-[:HAS_UPDATE]->(updater)
    const has_update_rel: Relationship[] = result[0].updater.getRelationshipsByLabel(
      "HAS_UPDATE"
    );
    expect(has_update_rel.length === 1).toEqual(true);
    expect(has_update_rel[0].isWritten()).toEqual(true);
    expect(has_update_rel[0].getStartNode().getHash()).toEqual(
      _oldEnode.getHash()
    );
    expect(has_update_rel[0].getEndNode().getHash()).toEqual(
      _newEnode.getHash()
    );

    //// check oldEnode's rels must be _isCurrent: false
    result[0].updatee
      .getAllRelationshipsAsArray()
      .filter((rel) => rel.getLabels()[0] !== "HAS_UPDATE")
      .forEach((rel) => {
        expect(rel.properties._isCurrent).toEqual(false);
      });

    //// check newEnode's rels must be _isCurrent: true
    result[0].updater
      .getAllRelationshipsAsArray()
      .filter((rel) => rel.getLabels()[0] !== "HAS_UPDATE")
      .forEach((rel) => {
        expect(rel.properties._isCurrent).toEqual(true);
      });

    //// check there is only one (X) == oldEnode and newEnode point to same (X)
    /// A rel for updatee
    /// C rel for updater
    expect(
      result[0].updatee
        .getRelationshipsByLabel("A")[0]
        .getEndNode()
        .getHash()
    ).toEqual(
      result[0].updater
        .getRelationshipsByLabel("C")[0]
        .getEndNode()
        .getHash()
    );

    //// oldNode must be marked as updated
    expect(result[0].updatee.getProperties()).toMatchObject({
      _dateUpdated: _date_created,
      _updateeNodeHash: expect.any(String),
      _userUpdated: expect.any(String),
      _hash: expect.any(String),
      _date_created: _date_created,
      _uuid: expect.any(String),
      _isCurrent: false,
      _toDate: _date_created,
      _hasBeenUpdated: true,
    });
  });
  test("newEnode is a deep Enode", async () => {
    //// oldEnode has rels, keeps it as _isCurrent: false
    //// newEnode is a deep Enode with 2 layers. No rels are switched
    //// -[HAS_UPDATE]-> is set
    /// setup
    await engine.cleanDB();
    const [
      _oldEnode,
      _newEnode,
    ]: EnhancedNode = await builder.buildEnhancedNodes(
      [
        new EnhancedNodeCandidate(
          new NodeCandidate({
            labels: ["oldEnode"],
            properties: {
              required: {
                NAME: "oldEnode",
                PROP: 123,
              },
              optional: {
                remainingProp,
                prop: "optional_prop",
              },
            },
          }),
          {
            required: [
              new RelationshipCandidate({
                labels: ["A"],
                properties: { REQ_PROP: "(oldEnode)-[:A]->(X)" },
                direction: "outbound",
                endNode: new NodeCandidate({
                  labels: ["X"],
                  properties: {
                    required: { X_REQ_PROP: "X_REQ_PROP" },
                  },
                }),
              }),
              new RelationshipCandidate({
                labels: ["B"],
                properties: { REQ_PROP: "(oldEnode)-[:B]->(Y)" },
                direction: "outbound",
                endNode: new NodeCandidate({
                  labels: ["Y"],
                  properties: {
                    required: { Y_REQ_PROP: "Y_REQ_PROP" },
                  },
                }),
              }),
            ],
          }
        ),
        // newEnode
        new EnhancedNodeCandidate(
          new NodeCandidate({
            labels: ["newEnode"],
            properties: {
              required: {
                NAME: "newEnode",
                PROP: 123,
              },
              optional: {
                remainingProp,
                prop: "optional_prop",
              },
            },
          }),
          {
            required: [
              new RelationshipCandidate({
                labels: ["C"],
                properties: { REQ_PROP: "(newEnode)-[:C]->(X)" },
                direction: "outbound",
                // to same (X) as oldNode
                endNode: new NodeCandidate({
                  labels: ["X"],
                  properties: {
                    required: { X_REQ_PROP: "X_REQ_PROP" },
                  },
                }),
              }),
              new RelationshipCandidate({
                labels: ["D"],
                properties: { REQ_PROP: "(newEnode)<-[:D]-(Zenode)" },
                direction: "inbound",
                startNode: new EnhancedNodeCandidate(
                  new NodeCandidate({
                    labels: ["Zenode"],
                    properties: {
                      required: { Zenode_REQ_PROP: "Zenode_REQ_PROP" },
                    },
                  }),
                  {
                    required: [
                      new RelationshipCandidate({
                        labels: ["E"],
                        properties: { REQ_PROP: "(Zenode)-[:E]->(W)" },
                        direction: "outbound",
                        endNode: new NodeCandidate({
                          labels: ["W"],
                          properties: {
                            required: { W_REQ_PROP: "W_REQ_PROP" },
                          },
                        }),
                      }),
                      // to same (X) as oldNode
                      new RelationshipCandidate({
                        labels: ["F"],
                        properties: { REQ_PROP: "(Zenode)-[:F]->(X)" },
                        direction: "outbound",
                        endNode: new NodeCandidate({
                          labels: ["X"],
                          properties: {
                            required: { X_REQ_PROP: "X_REQ_PROP" },
                          },
                        }),
                      }),
                    ],
                  }
                ),
              }),
            ],
          }
        ),
      ],
      { extract: true }
    );
    // console.log(_oldEnode, _newEnode)
    const [oldEnode]: EnhancedNode = await engine.mergeEnhancedNodes(
      [_oldEnode],
      { extract: true }
    );
    // log(_newEnode)
    /// !setup

    const result: UpdatedPair[] = await engine.updateNodes(
      [{ updatee: oldEnode, updater: _newEnode }],
      { enhanceOnReturn: true }
    );
    // log(result)

    // updateNodes should return [{ updatee: EnhancedNode, updater: EnhancedNode }]
    expect(isEnhancedNode(result[0].updatee)).toEqual(true);
    expect(isEnhancedNode(result[0].updater)).toEqual(true);

    expect(result[0].updatee.isWritten()).toEqual(true);
    expect(result[0].updater.isWritten()).toEqual(true);

    //// check (updatee)-[:HAS_UPDATE]->(updater)
    const has_update_rel: Relationship[] = result[0].updater.getRelationshipsByLabel(
      "HAS_UPDATE"
    );
    expect(has_update_rel.length === 1).toEqual(true);
    expect(has_update_rel[0].isWritten()).toEqual(true);
    expect(has_update_rel[0].getStartNode().getHash()).toEqual(
      _oldEnode.getHash()
    );
    expect(has_update_rel[0].getEndNode().getHash()).toEqual(
      _newEnode.getHash()
    );

    //// check oldEnode's rels must be _isCurrent: false
    result[0].updatee
      .getAllRelationshipsAsArray()
      .filter((rel) => rel.getLabels()[0] !== "HAS_UPDATE")
      .forEach((rel) => {
        expect(rel.properties._isCurrent).toEqual(false);
      });

    //// check newEnode's rels must be _isCurrent: true
    result[0].updater
      .getAllRelationshipsAsArray()
      .filter((rel) => rel.getLabels()[0] !== "HAS_UPDATE")
      .forEach((rel) => {
        expect(rel.properties._isCurrent).toEqual(true);
      });

    //// check there is only one (X) == oldEnode, newEnode, zEnode point to same (X)
    /// A rel for updatee
    /// C rel for updater
    /// F rel for zEnode - to get 2 level (2 hops) I need to enhance
    const a_x = result[0].updatee
      .getRelationshipsByLabel("A")[0]
      .getEndNode()
      .getHash();
    const c_x = result[0].updater
      .getRelationshipsByLabel("C")[0]
      .getEndNode()
      .getHash();

    // get zEnode from DB
    const [zEnode]: EnhancedNode = await engine.enhanceNodes(
      [
        // zEnode is (newEnode)<-[:D]-(Zenode)
        result[0].updater
          .getRelationshipsByLabel("D")[0]
          .getStartNode()
          .toNode(),
      ],
      { hops: 2, extract: true }
    );
    const f_x = zEnode
      .getRelationshipsByLabel("F")[0]
      .getEndNode()
      .getHash();
    expect(a_x === c_x && c_x === f_x).toEqual(true);

    //// oldNode must be marked as updated
    expect(result[0].updatee.getProperties()).toMatchObject({
      _dateUpdated: _date_created,
      _updateeNodeHash: expect.any(String),
      _userUpdated: expect.any(String),
      _hash: expect.any(String),
      _date_created: _date_created,
      _uuid: expect.any(String),
      _isCurrent: false,
      _toDate: _date_created,
      _hasBeenUpdated: true,
    });
  });
});
describe("refactoring", async () => {
  // We might need to delete erroneous Nodes & Rels and
  // substitute them with correct ones.
  // Case for Products names used as the name of the Manufacturer
  // (a:Product)-[:MADE_BY]->(A:Manufacturer { NAME: "X_manufacturer's_product_name1" })
  // (b:Product)-[:MADE_BY]->(B:Manufacturer { NAME: "X_manufacturer's_product_name2" })
  // (c:Product)-[:MADE_BY]->(C:Manufacturer { NAME: "X_manufacturer's_product_name3" })
  // must be
  // (a:Product)-[:MADE_BY]->(X:Manufacturer { NAME: "X" })
  // (b:Product)-[:MADE_BY]->(X:Manufacturer { NAME: "X" })
  // (c:Product)-[:MADE_BY]->(X:Manufacturer { NAME: "X" })
  // and
  // Nodes A,B,C and their rels should be deleted
  test("preserveUpdatee: false", async () => {
    await engine.cleanDB();
    const [
      _oldEnode,
      _newEnode,
    ]: EnhancedNode = await builder.buildEnhancedNodes(
      [
        // oldEnode == updatee
        new EnhancedNodeCandidate(
          new NodeCandidate({
            labels: ["oldEnode"],
            properties: {
              required: {
                NAME: "oldEnode",
                PROP: 123,
              },
              optional: {
                remainingProp,
                prop: "optional_prop",
              },
            },
          }),
          {
            required: [
              new RelationshipCandidate({
                labels: ["A"],
                properties: { REQ_PROP: "(oldEnode)-[:A]->(X)" },
                direction: "outbound",
                endNode: new NodeCandidate({
                  labels: ["X"],
                  properties: {
                    required: { X_REQ_PROP: "X_REQ_PROP" },
                  },
                }),
              }),
              new RelationshipCandidate({
                labels: ["B"],
                properties: { REQ_PROP: "(oldEnode)-[:B]->(Y)" },
                direction: "outbound",
                endNode: new NodeCandidate({
                  labels: ["Y"],
                  properties: {
                    required: { Y_REQ_PROP: "Y_REQ_PROP" },
                  },
                }),
              }),
            ],
          }
        ),
        // newEnode == updater
        new EnhancedNodeCandidate(
          new NodeCandidate({
            labels: ["newEnode"],
            properties: {
              required: {
                NAME: "newEnode",
                PROP: 123,
              },
              optional: {
                remainingProp,
                prop: "optional_prop",
              },
            },
          }),
          {
            required: [
              new RelationshipCandidate({
                labels: ["C"],
                properties: { REQ_PROP: "(newEnode)-[:C]->(X)" },
                direction: "outbound",
                endNode: new NodeCandidate({
                  labels: ["X"],
                  properties: {
                    required: { X_REQ_PROP: "X_REQ_PROP" },
                  },
                }),
              }),
              new RelationshipCandidate({
                labels: ["D"],
                properties: { REQ_PROP: "(newEnode)-[:D]->(Y)" },
                direction: "outbound",
                endNode: new NodeCandidate({
                  labels: ["Y"],
                  properties: {
                    required: { Y_REQ_PROP: "Y_REQ_PROP" },
                  },
                }),
              }),
            ],
          }
        ),
      ],
      { extract: true }
    );
    // console.log(_oldEnode, _newEnode)
    const [oldEnode]: EnhancedNode = await engine.mergeEnhancedNodes(
      [_oldEnode],
      { extract: true }
    );

    // const result: UpdatedPair[] = await engine.updateNodes(
    //   [{ updatee: oldEnode, updater: _newEnode }],
    //   { preserveUpdatee: false }
    // );
  });
});
