/* @flow */
"use strict";

import {
  Builder,
  Node,
  NodeCandidate,
  EnhancedNode,
  EnhancedNodeCandidate,
  isEnhancedNode,
  Relationship,
  RelationshipCandidate,
  isRelationship,
  Result,
  Success,
  Failure,
  isSuccess,
  getResultData,
  log,
} from "../../../src";

import uniqBy from "lodash/uniqBy";
import remove from "lodash/remove";
import isString from "lodash/isString";
import cloneDeep from "lodash/cloneDeep";
import flattenDeep from "lodash/flattenDeep";

const builder = new Builder();

describe("constructor", () => {
  test("enode ok no rels", () => {
    const result = new EnhancedNode({});
  });
  test("Must contain relationships", () => {
    const startNode = new Node({
        labels: ["StartNode"],
        properties: { a: "a" },
      }),
      endNode = new Node({
        labels: ["EndNode"],
        properties: { b: "b" },
      });
    const rel_out = new Relationship({
        labels: ["RELATIONSHIP_OUT"],
        properties: { c: "c" },
        startNode,
        endNode,
      }),
      rel_in = new Relationship({
        labels: ["RELATIONSHIP_IN"],
        properties: { d: "d" },
        startNode: endNode,
        endNode: startNode,
      });
    const enode = new EnhancedNode({
      labels: ["EnhancedNode"],
      properties: { xyz: "xyz" },
      relationships: {
        inbound: [rel_in],
        outbound: [rel_out],
      },
    });
    expect(enode.getAllRelationships()).toMatchObject({
      inbound: [rel_in],
      outbound: [rel_out],
    });
    expect(enode.getInboundRelationships()).toEqual([rel_in]);
    expect(enode.getOutboundRelationships()).toEqual([rel_out]);
  });
  test("Must contain relationships 2", () => {
    const enode = new EnhancedNode({
        labels: ["enode"],
        properties: { a: "a" },
      }),
      node = new Node({
        labels: ["Node"],
        properties: { b: "b" },
      });
    const rel_out = new Relationship({
        labels: ["RELATIONSHIP_OUT"],
        properties: { c: "c" },
        startNode: enode,
        endNode: node,
      }),
      rel_in = new Relationship({
        labels: ["RELATIONSHIP_IN"],
        properties: { d: "d" },
        startNode: node,
        endNode: enode,
      });

    enode.addAllRelationships({
      inbound: [rel_in],
      outbound: [rel_out],
    });

    expect(enode.getAllRelationships()).toMatchObject({
      inbound: [rel_in],
      outbound: [rel_out],
    });
    expect(enode.getInboundRelationships()).toEqual([rel_in]);
    expect(enode.getOutboundRelationships()).toEqual([rel_out]);
  });
});
describe("methods", () => {
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
      inbound: [
        new Relationship({
          labels: ["relationship1"],
          properties: {
            weight: 1,
            _hash: "relationship1_hash",
            _necessity: "required",
            _date_created: [2020, 3, 13, 5, 1584110723525],
          },
          startNode: new EnhancedNode({
            labels: ["enode2"],
            properties: {
              INPUT: 2,
              _label: "enode2",
              _date_created: [2020, 3, 13, 5, 1584110723523],
              _hash: "enode2_hash",
              // _uuid: 'enode2_uuid'
            },
            relationships: {
              inbound: [
                new Relationship({
                  labels: ["relationship2"],
                  properties: {
                    weight: 1,
                    _hash: "relationship2_hash",
                    _necessity: "required",
                    _date_created: [2020, 3, 13, 5, 1584110723525],
                  },
                  startNode: new Node({
                    labels: ["node2"],
                    properties: {
                      INPUT: 0,
                      _label: "node2",
                      _date_created: [2020, 3, 13, 5, 1584110723519],
                      _hash: "node2_hash",
                      // _uuid: 'node2_uuid'
                    },
                    identity: null,
                  }),
                  identity: null,
                  direction: "inbound",
                  necessity: "required",
                }),
              ],
              outbound: [],
            },
            identity: null,
          }),
          endNode: this,
          identity: null,
          necessity: "required",
          direction: "inbound",
        }),
      ],
      outbound: [],
    },
  });
  test("addOutboundRelationships", () => {
    const enode = new EnhancedNode({
      labels: ["enode"],
      properties: { a: "a" },
    });
    const node = new Node({
      labels: ["Node"],
      properties: { b: "b" },
    });
    const rel_out_1 = new Relationship({
        labels: ["RELATIONSHIP_OUT_1"],
        properties: { c: "c" },
        direction: "outbound",
        endNode: node,
      }),
      rel_out_2 = new Relationship({
        labels: ["RELATIONSHIP_OUT_2"],
        properties: { d: "d" },
        direction: "outbound",
        endNode: node,
      });

    enode.addOutboundRelationships([rel_out_1, rel_out_2]);
    expect(enode.relationships.outbound.length).toEqual(2);
    const [rel_out_1_, rel_out_2_] = enode.getOutboundRelationships();
    expect(rel_out_1_.getStartNode()).toEqual(enode);
    expect(rel_out_2_.getStartNode()).toEqual(enode);
  });
  test("addInboundRelationships", () => {
    const enode = new EnhancedNode({
      labels: ["enode"],
      properties: { a: "a" },
    });
    const node = new Node({
      labels: ["Node"],
      properties: { b: "b" },
    });
    const rel_in_1 = new Relationship({
        labels: ["RELATIONSHIP_IN_1"],
        properties: { c: "c" },
        direction: "inbound",
        startNode: node,
      }),
      rel_in_2 = new Relationship({
        labels: ["RELATIONSHIP_IN_2"],
        properties: { d: "d" },
        direction: "inbound",
        startNode: node,
      });

    enode.addInboundRelationships([rel_in_1, rel_in_2]);
    expect(enode.relationships.inbound.length).toEqual(2);
    const [rel_in_1_, rel_in_2_] = enode.getInboundRelationships();
    expect(rel_in_1_.getEndNode()).toEqual(enode);
    expect(rel_in_2_.getEndNode()).toEqual(enode);
  });
  test("addRelationships", async () => {
    /**
     * While writing updateNodes I found it convenient to be able to
     * add new relationships to EnhancedNode. So EnhancedNode.addRelationships
     * should accept Relationship[], not RelationshipCandidate[] - keep it simple.
     */
    /// setup
    const [newEnode]: EnhancedNode = await builder.buildEnhancedNodes(
      [
        new EnhancedNodeCandidate(
          new NodeCandidate({
            labels: ["newEnode"],
            properties: {
              required: {
                NAME: "newEnode",
              },
              optional: {
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
    const [has_update_rel]: Relationship = await builder.buildRelationships(
      [
        new RelationshipCandidate({
          labels: ["HAS_UPDATE"],
          properties: { REQ_PROP: "(oldNode)-[:HAS_UPDATE]->(newEnode)" },
          startNode: new NodeCandidate({
            labels: ["oldNode"],
            properties: {
              required: { NAME: "oldNode" },
            },
          }),
          endNode: newEnode,
        }),
      ],
      { extract: true }
    );
    /// !setup

    // add
    newEnode.addRelationships([has_update_rel]);

    expect(isEnhancedNode(newEnode)).toEqual(true);

    // must have 2 rels
    expect(newEnode.getAllRelationshipsAsArray().length).toEqual(2);

    // must have HAS_UPDATE
    const added_rel: Relationship[] = newEnode.getRelationshipsByLabel(
      "HAS_UPDATE"
    );
    expect(added_rel.length).toEqual(1);
    expect(added_rel[0].isWritable()).toEqual(true);

    expect(added_rel[0].getEndNode().getHash()).toEqual(newEnode.getHash());
  });
  describe("work with participating Nodes", () => {
    test("simple Enode all pNodes are Nodes", () => {
      const enode = new EnhancedNode({
        labels: ["enode"],
        properties: { A: 1, _hash: 'A1' },
      });
      enode.addAllRelationships({
        inbound: [
          new Relationship({
            labels: ["Rel_in"],
            properties: {},
            direction: "inbound",
            startNode: new Node({
              labels: ["Rel_in_startNode"],
              properties: { B: 2, _hash: 'B2' },
            }),
          }),
        ],
        outbound: [
          new Relationship({
            labels: ["Rel_out"],
            properties: {},
            direction: "outbound",
            endNode: new Node({
              labels: ["Rel_out_endNode"],
              properties: { E: 5, _hash: 'E5' },
            }),
          }),
        ],
      });
      // log(enode)
      const result = enode.getParticipatingNodes();
      expect(result.length).toEqual(3);
    });
    describe("complex Enode, pNodes are Enodes", () => {
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
          inbound: [
            new Relationship({
              labels: ["relationship1"],
              properties: {
                weight: 1,
                _hash: "relationship1_hash",
                _date_created: [2020, 3, 13, 5, 1584110723525],
              },
              startNode: new EnhancedNode({
                labels: ["enode2"],
                properties: {
                  INPUT: 2,
                  _label: "enode2",
                  _date_created: [2020, 3, 13, 5, 1584110723523],
                  _hash: "enode2_hash",
                  // _uuid: 'enode2_uuid'
                },
                relationships: {
                  inbound: [
                    new Relationship({
                      labels: ["relationship2"],
                      properties: {
                        weight: 1,
                        _hash: "relationship2_hash",
                        _date_created: [2020, 3, 13, 5, 1584110723525],
                      },
                      startNode: new Node({
                        labels: ["node2"],
                        properties: {
                          INPUT: 0,
                          optionalProp: 2,
                          _label: "node2",
                          _date_created: [2020, 3, 13, 5, 1584110723519],
                          _hash: "node2_hash",
                          // _uuid: 'node2_uuid'
                        },
                        identity: null,
                      }),
                      identity: null,
                      direction: "inbound",
                    }),
                  ],
                  outbound: [
                    new Relationship({
                      labels: ["relationship3"],
                      properties: {
                        weight: 3,
                        _hash: "relationship3_hash",
                        _date_created: [2020, 3, 13, 5, 1584110723525],
                      },
                      endNode: new Node({
                        labels: ["node4"],
                        properties: {
                          INPUT: 0,
                          _label: "node4",
                          _date_created: [2020, 3, 13, 5, 1584110723519],
                          _hash: "node4_hash",
                          // _uuid: 'node4_uuid'
                        },
                        identity: null,
                      }),
                      identity: null,
                      direction: "outbound",
                    }),
                  ],
                },
                identity: null,
              }),
              // endNode: this,
              identity: null,
              direction: "inbound",
            }),
          ],
          outbound: [
            new Relationship({
              labels: ["relationship4"],
              properties: {
                weight: 4,
                _hash: "relationship4_hash",
                _date_created: [2020, 3, 13, 5, 1584110723525],
              },
              endNode: new Node({
                labels: ["node3"],
                properties: {
                  INPUT: 0,
                  _label: "node3",
                  _date_created: [2020, 3, 13, 5, 1584110723519],
                  _hash: "node3_hash",
                  // _uuid: 'node2_uuid'
                },
                identity: null,
              }),
              identity: null,
              direction: "outbound",
            }),
          ],
        },
      });
      test("getParticipatingNodes asHashMap: true", () => {
        /* asHashMap = true, hashMap */
        const result_map = cloneDeep(enode).getParticipatingNodes({
          asHashMap: true,
        });
        // log(result_map)
        expect(result_map).toMatchObject({
          enode1_hash: {
            labels: ["enode1"],
            properties: {
              INPUT: 0,
              _label: "enode1",
              _date_created: [2020, 3, 13, 5, 1584110723519],
              _hash: "enode1_hash",
              // _uuid: 'enode1_uuid'
            },
            identity: null,
          },
          enode2_hash: {
            labels: ["enode2"],
            properties: {
              INPUT: 2,
              _label: "enode2",
              _date_created: [2020, 3, 13, 5, 1584110723523],
              _hash: "enode2_hash",
              // _uuid: 'enode2_uuid'
            },
            identity: null,
          },
          node2_hash: {
            labels: ["node2"],
            properties: {
              INPUT: 0,
              optionalProp: 2,
              _label: "node2",
              _date_created: [2020, 3, 13, 5, 1584110723519],
              _hash: "node2_hash",
              // _uuid: 'node2_uuid'
            },
            identity: null,
          },
          node4_hash: {
            labels: ["node4"],
            properties: {
              INPUT: 0,
              _label: "node4",
              _date_created: [2020, 3, 13, 5, 1584110723519],
              _hash: "node4_hash",
            },
            identity: null,
          },
          node3_hash: {
            labels: ["node3"],
            properties: {
              INPUT: 0,
              _label: "node3",
              _date_created: [2020, 3, 13, 5, 1584110723519],
              _hash: "node3_hash",
            },
            identity: null,
          },
        });
      });
      test("getParticipatingNodes asHashMap: false", () => {
        /* asHashMap = false, array */
        const result_arr = cloneDeep(enode).getParticipatingNodes();
        expect(result_arr.length).toEqual(5);
        expect(result_arr).toEqual(
          expect.arrayContaining([
            /* Node */ {
              labels: ["enode1"],
              properties: {
                INPUT: 0,
                _label: "enode1",
                _date_created: [2020, 3, 13, 5, 1584110723519],
                _hash: "enode1_hash",
                // _uuid: 'enode1_uuid'
              },
              identity: null,
            },
            /* Node */ {
              labels: ["enode2"],
              properties: {
                INPUT: 2,
                _label: "enode2",
                _date_created: [2020, 3, 13, 5, 1584110723523],
                _hash: "enode2_hash",
                // _uuid: 'enode2_uuid'
              },
              identity: null,
            },
            /* Node2 */ {
              labels: ["node2"],
              properties: {
                INPUT: 0,
                optionalProp: 2,
                _label: "node2",
                _date_created: [2020, 3, 13, 5, 1584110723519],
                _hash: "node2_hash",
                // _uuid: 'node2_uuid'
              },
              identity: null,
            },
            {
              labels: ["node4"],
              properties: {
                INPUT: 0,
                _label: "node4",
                _date_created: [2020, 3, 13, 5, 1584110723519],
                _hash: "node4_hash",
              },
              identity: null,
            },
            {
              labels: ["node3"],
              properties: {
                INPUT: 0,
                _label: "node3",
                _date_created: [2020, 3, 13, 5, 1584110723519],
                _hash: "node3_hash",
              },
              identity: null,
            },
          ])
        );
      });
      describe("updating enode with identifications", () => {
        test("pnodes via _hashMap - doesnt work", () => {
          /**
           * !!Identity does not update!!
           */
          const enode_ = cloneDeep(enode);
          const result_map = enode_.getParticipatingNodes({ asHashMap: true });
          result_map["enode1_hash"].properties._uuid = "new uuid";
          result_map["enode1_hash"].setIdentity({ low: 1, high: 0 });

          expect(enode_.properties._uuid).toEqual("new uuid");
          expect(enode_.identity).toEqual(null);
        });
        test("pnodes via array - doesnt work", () => {
          /**
           * !!Identity does not update!!
           */
          const enode_ = cloneDeep(enode);
          const result_arr = enode_.getParticipatingNodes({ asHashMap: false });
          result_arr[0].properties._uuid = "new uuid";
          result_arr[0].setIdentity({ low: 1, high: 0 });

          expect(enode_.properties._uuid).toEqual("new uuid");
          expect(enode_.identity).toEqual(null);
        });
        test("pnodes via identifyParticipatingNodes - ok", () => {
          /**
           * I want to take Enode and, after merging all ParticipatingNodes into Neo4j,
           * update Enode with Neo4j's identity + _uuid.
           */
          const enode_ = cloneDeep(enode);
          const _pnode_hash_map_with_ids = {
            // should be Nodes ?
            enode1_hash: new Node({
              labels: ["enode1"],
              properties: {
                INPUT: 0,
                _label: "enode1",
                _date_created: [2020, 3, 13, 5, 1584110723519],
                _hash: "enode1_hash",
                _uuid: "enode1_uuid",
              },
              identity: { low: 1, high: 0 },
            }),
            enode2_hash: new Node({
              labels: ["enode2"],
              properties: {
                INPUT: 2,
                _label: "enode2",
                _date_created: [2020, 3, 13, 5, 1584110723523],
                _hash: "enode2_hash",
                _uuid: "enode2_uuid",
              },
              identity: { low: 2, high: 0 },
            }),

            node2_hash: new Node({
              labels: ["node2"],
              properties: {
                INPUT: 0,
                optionalProp: 2,
                _label: "node2",
                _date_created: [2020, 3, 13, 5, 1584110723519],
                _hash: "node2_hash",
                _uuid: "node2_uuid",
              },
              identity: { low: 3, high: 0 },
            }),

            node3_hash: new Node({
              labels: ["node3"],
              properties: {
                INPUT: 0,
                _label: "node3",
                _date_created: [2020, 3, 13, 5, 1584110723519],
                _hash: "node3_hash",
                _uuid: "node3_uuid",
              },
              identity: { low: 4, high: 0 },
            }),
            node4_hash: new Node({
              labels: ["node4"],
              properties: {
                INPUT: 0,
                _label: "node4",
                _date_created: [2020, 3, 13, 5, 1584110723519],
                _hash: "node4_hash",
                _uuid: "node4_uuid",
              },
              identity: { low: 5, high: 0 },
            }),
          };
          const result = enode_.identifyParticipatingNodes(
            _pnode_hash_map_with_ids
          );
          // log(result)
          const result_arr = enode_.getParticipatingNodes({ asHashMap: false });

          expect(result_arr.every((node) => node.isWritten())).toEqual(true);
          expect(result_arr).toEqual(
            expect.arrayContaining([
              new Node({
                labels: ["enode1"],
                properties: {
                  INPUT: 0,
                  _label: "enode1",
                  _date_created: [2020, 3, 13, 5, 1584110723519],
                  _hash: "enode1_hash",
                  _uuid: "enode1_uuid",
                },
                identity: { low: 1, high: 0 },
              }),
              new Node({
                labels: ["enode2"],
                properties: {
                  INPUT: 2,
                  _label: "enode2",
                  _date_created: [2020, 3, 13, 5, 1584110723523],
                  _hash: "enode2_hash",
                  _uuid: "enode2_uuid",
                },
                identity: { low: 2, high: 0 },
              }),
              new Node({
                labels: ["node2"],
                properties: {
                  INPUT: 0,
                  optionalProp: 2,
                  _label: "node2",
                  _date_created: [2020, 3, 13, 5, 1584110723519],
                  _hash: "node2_hash",
                  _uuid: "node2_uuid",
                },
                identity: { low: 3, high: 0 },
              }),
              new Node({
                labels: ["node3"],
                properties: {
                  INPUT: 0,
                  _label: "node3",
                  _date_created: [2020, 3, 13, 5, 1584110723519],
                  _hash: "node3_hash",
                  _uuid: "node3_uuid",
                },
                identity: { low: 4, high: 0 },
              }),
              new Node({
                labels: ["node4"],
                properties: {
                  INPUT: 0,
                  _label: "node4",
                  _date_created: [2020, 3, 13, 5, 1584110723519],
                  _hash: "node4_hash",
                  _uuid: "node4_uuid",
                },
                identity: { low: 5, high: 0 },
              }),
            ])
          );
        });
      });
    });
  });
  describe("work with participating Relationships", () => {
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
        inbound: [
          new Relationship({
            labels: ["relationship1"],
            properties: {
              weight: 1,
              _hash: "relationship1_hash",
              _date_created: [2020, 3, 13, 5, 1584110723525],
              _necessity: "required",
            },
            startNode: new EnhancedNode({
              labels: ["enode2"],
              properties: {
                INPUT: 2,
                _label: "enode2",
                _date_created: [2020, 3, 13, 5, 1584110723523],
                _hash: "enode2_hash",
                // _uuid: 'enode2_uuid'
              },
              relationships: {
                inbound: [
                  new Relationship({
                    labels: ["relationship2"],
                    properties: {
                      weight: 1,
                      _hash: "relationship2_hash",
                      _date_created: [2020, 3, 13, 5, 1584110723525],
                      _necessity: "required",
                    },
                    startNode: new Node({
                      labels: ["node2"],
                      properties: {
                        INPUT: 0,
                        _label: "node2",
                        _date_created: [2020, 3, 13, 5, 1584110723519],
                        _hash: "node2_hash",
                        // _uuid: 'node2_uuid'
                      },
                      identity: null,
                    }),
                    identity: null,
                    direction: "inbound",
                    necessity: "required",
                  }),
                ],
                outbound: [
                  new Relationship({
                    labels: ["relationship3"],
                    properties: {
                      weight: 3,
                      _hash: "relationship3_hash",
                      _date_created: [2020, 3, 13, 5, 1584110723525],
                      _necessity: "required",
                    },
                    endNode: new Node({
                      labels: ["node4"],
                      properties: {
                        INPUT: 0,
                        _label: "node4",
                        _date_created: [2020, 3, 13, 5, 1584110723519],
                        _hash: "node4_hash",
                        // _uuid: 'node4_uuid'
                      },
                      identity: null,
                    }),
                    identity: null,
                    direction: "outbound",
                    necessity: "required",
                  }),
                ],
              },
              identity: null,
            }),
            // endNode: this,
            identity: null,
            direction: "inbound",
            necessity: "required",
          }),
        ],
        outbound: [
          new Relationship({
            labels: ["relationship4"],
            properties: {
              weight: 4,
              _hash: "relationship4_hash",
              _date_created: [2020, 3, 13, 5, 1584110723525],
              _necessity: "required",
            },
            endNode: new Node({
              labels: ["node3"],
              properties: {
                INPUT: 0,
                _label: "node3",
                _date_created: [2020, 3, 13, 5, 1584110723519],
                _hash: "node3_hash",
                // _uuid: 'node2_uuid'
              },
              identity: null,
            }),
            identity: null,
            direction: "outbound",
            necessity: "required",
          }),
        ],
      },
    });
    describe("getParticipatingRelationships", () => {
      test("asHashMap: true, short: true", () => {
        const result = cloneDeep(enode).getParticipatingRelationships({
          asHashMap: true,
          short: true,
        });

        expect(result).toMatchObject({
          relationship1_hash: new Relationship({
            labels: ["relationship1"],
            properties: {
              weight: 1,
              _hash: "relationship1_hash",
              _necessity: "required",
              _date_created: [2020, 3, 13, 5, 1584110723525],
            },
            startNode: new Node({
              labels: ["enode2"],
              properties: {
                INPUT: 2,
                _label: "enode2",
                _date_created: [2020, 3, 13, 5, 1584110723523],
                _hash: "enode2_hash",
              },
              identity: null,
            }),
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
            direction: "inbound",
            necessity: "required",
          }),
          relationship2_hash: new Relationship({
            labels: ["relationship2"],
            properties: {
              weight: 1,
              _hash: "relationship2_hash",
              _necessity: "required",
              _date_created: [2020, 3, 13, 5, 1584110723525],
            },
            startNode: new Node({
              labels: ["node2"],
              properties: {
                INPUT: 0,
                _label: "node2",
                _date_created: [2020, 3, 13, 5, 1584110723519],
                _hash: "node2_hash",
              },
              identity: null,
            }),
            endNode: new Node({
              labels: ["enode2"],
              properties: {
                INPUT: 2,
                _label: "enode2",
                _date_created: [2020, 3, 13, 5, 1584110723523],
                _hash: "enode2_hash",
              },
              identity: null,
            }),
            identity: null,
            direction: "inbound",
            necessity: "required",
          }),
          relationship3_hash: new Relationship({
            labels: ["relationship3"],
            properties: {
              weight: 3,
              _hash: "relationship3_hash",
              _necessity: "required",
              _date_created: [2020, 3, 13, 5, 1584110723525],
            },
            startNode: new Node({
              labels: ["enode2"],
              properties: {
                INPUT: 2,
                _label: "enode2",
                _date_created: [2020, 3, 13, 5, 1584110723523],
                _hash: "enode2_hash",
              },
              identity: null,
            }),
            endNode: new Node({
              labels: ["node4"],
              properties: {
                INPUT: 0,
                _label: "node4",
                _date_created: [2020, 3, 13, 5, 1584110723519],
                _hash: "node4_hash",
              },
              identity: null,
            }),
            identity: null,
            direction: "outbound",
            necessity: "required",
          }),
          relationship4_hash: new Relationship({
            labels: ["relationship4"],
            properties: {
              weight: 4,
              _hash: "relationship4_hash",
              _necessity: "required",
              _date_created: [2020, 3, 13, 5, 1584110723525],
            },
            startNode: new Node({
              labels: ["enode1"],
              properties: {
                INPUT: 0,
                _label: "enode1",
                _date_created: [2020, 3, 13, 5, 1584110723519],
                _hash: "enode1_hash",
              },
              identity: null,
            }),
            endNode: new Node({
              labels: ["node3"],
              properties: {
                INPUT: 0,
                _label: "node3",
                _date_created: [2020, 3, 13, 5, 1584110723519],
                _hash: "node3_hash",
              },
              identity: null,
            }),
            identity: null,
            direction: "outbound",
            necessity: "required",
          }),
        });
      });
      test("asHashMap: false, short: true", () => {
        const result = cloneDeep(enode).getParticipatingRelationships({
          asHashMap: false,
          short: true,
        });

        expect(result).toEqual(
          expect.arrayContaining([
            new Relationship({
              labels: ["relationship1"],
              properties: {
                weight: 1,
                _hash: "relationship1_hash",
                _necessity: "required",
                _date_created: [2020, 3, 13, 5, 1584110723525],
              },
              startNode: new Node({
                labels: ["enode2"],
                properties: {
                  INPUT: 2,
                  _label: "enode2",
                  _date_created: [2020, 3, 13, 5, 1584110723523],
                  _hash: "enode2_hash",
                },
                identity: null,
              }),
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
              direction: "inbound",
              necessity: "required",
            }),
            new Relationship({
              labels: ["relationship2"],
              properties: {
                weight: 1,
                _hash: "relationship2_hash",
                _necessity: "required",
                _date_created: [2020, 3, 13, 5, 1584110723525],
              },
              startNode: new Node({
                labels: ["node2"],
                properties: {
                  INPUT: 0,
                  _label: "node2",
                  _date_created: [2020, 3, 13, 5, 1584110723519],
                  _hash: "node2_hash",
                },
                identity: null,
              }),
              endNode: new Node({
                labels: ["enode2"],
                properties: {
                  INPUT: 2,
                  _label: "enode2",
                  _date_created: [2020, 3, 13, 5, 1584110723523],
                  _hash: "enode2_hash",
                },
                identity: null,
              }),
              identity: null,
              direction: "inbound",
              necessity: "required",
            }),
            new Relationship({
              labels: ["relationship3"],
              properties: {
                weight: 3,
                _hash: "relationship3_hash",
                _necessity: "required",
                _date_created: [2020, 3, 13, 5, 1584110723525],
              },
              startNode: new Node({
                labels: ["enode2"],
                properties: {
                  INPUT: 2,
                  _label: "enode2",
                  _date_created: [2020, 3, 13, 5, 1584110723523],
                  _hash: "enode2_hash",
                },
                identity: null,
              }),
              endNode: new Node({
                labels: ["node4"],
                properties: {
                  INPUT: 0,
                  _label: "node4",
                  _date_created: [2020, 3, 13, 5, 1584110723519],
                  _hash: "node4_hash",
                },
                identity: null,
              }),
              identity: null,
              direction: "outbound",
              necessity: "required",
            }),
            new Relationship({
              labels: ["relationship4"],
              properties: {
                weight: 4,
                _hash: "relationship4_hash",
                _necessity: "required",
                _date_created: [2020, 3, 13, 5, 1584110723525],
              },
              startNode: new Node({
                labels: ["enode1"],
                properties: {
                  INPUT: 0,
                  _label: "enode1",
                  _date_created: [2020, 3, 13, 5, 1584110723519],
                  _hash: "enode1_hash",
                },
                identity: null,
              }),
              endNode: new Node({
                labels: ["node3"],
                properties: {
                  INPUT: 0,
                  _label: "node3",
                  _date_created: [2020, 3, 13, 5, 1584110723519],
                  _hash: "node3_hash",
                },
                identity: null,
              }),
              identity: null,
              direction: "outbound",
              necessity: "required",
            }),
          ])
        );
      });
      test("bug - was missing mainNode identity", () => {
        /**
         * for some reason when I add a property to top enode - it gets carried forward to
         * to all instances of it mentioned in Relationships.
         * But when I setIdentity - it is not carried forward.
         * SOLVED - I run a handy method this.addThisNodeToRelationships() as part of
         * setIdentity()
         */
        const _enode = cloneDeep(enode);
        _enode.properties._uuid = "enode1_uuid";
        _enode.setIdentity({ low: 1, high: 0 });
        const result = _enode.getParticipatingRelationships({
          asHashMap: false,
          short: true,
        });
        // log(result)
        expect(result).toEqual(
          expect.arrayContaining([
            new Relationship({
              labels: ["relationship1"],
              properties: {
                weight: 1,
                _hash: "relationship1_hash",
                _necessity: "required",
                _date_created: [2020, 3, 13, 5, 1584110723525],
              },
              startNode: new Node({
                labels: ["enode2"],
                properties: {
                  INPUT: 2,
                  _label: "enode2",
                  _date_created: [2020, 3, 13, 5, 1584110723523],
                  _hash: "enode2_hash",
                },
                identity: null,
              }),
              endNode: new Node({
                labels: ["enode1"],
                properties: {
                  INPUT: 0,
                  _label: "enode1",
                  _date_created: [2020, 3, 13, 5, 1584110723519],
                  _hash: "enode1_hash",
                  _uuid: "enode1_uuid",
                },
                identity: { low: 1, high: 0 },
                // identity: null
              }),
              identity: null,
              direction: "inbound",
              necessity: "required",
            }),
            new Relationship({
              labels: ["relationship2"],
              properties: {
                weight: 1,
                _hash: "relationship2_hash",
                _necessity: "required",
                _date_created: [2020, 3, 13, 5, 1584110723525],
              },
              startNode: new Node({
                labels: ["node2"],
                properties: {
                  INPUT: 0,
                  _label: "node2",
                  _date_created: [2020, 3, 13, 5, 1584110723519],
                  _hash: "node2_hash",
                },
                identity: null,
              }),
              endNode: new Node({
                labels: ["enode2"],
                properties: {
                  INPUT: 2,
                  _label: "enode2",
                  _date_created: [2020, 3, 13, 5, 1584110723523],
                  _hash: "enode2_hash",
                },
                identity: null,
              }),
              identity: null,
              direction: "inbound",
              necessity: "required",
            }),
            new Relationship({
              labels: ["relationship3"],
              properties: {
                weight: 3,
                _hash: "relationship3_hash",
                _necessity: "required",
                _date_created: [2020, 3, 13, 5, 1584110723525],
              },
              startNode: new Node({
                labels: ["enode2"],
                properties: {
                  INPUT: 2,
                  _label: "enode2",
                  _date_created: [2020, 3, 13, 5, 1584110723523],
                  _hash: "enode2_hash",
                },
                identity: null,
              }),
              endNode: new Node({
                labels: ["node4"],
                properties: {
                  INPUT: 0,
                  _label: "node4",
                  _date_created: [2020, 3, 13, 5, 1584110723519],
                  _hash: "node4_hash",
                },
                identity: null,
              }),
              identity: null,
              direction: "outbound",
              necessity: "required",
            }),
            new Relationship({
              labels: ["relationship4"],
              properties: {
                weight: 4,
                _hash: "relationship4_hash",
                _necessity: "required",
                _date_created: [2020, 3, 13, 5, 1584110723525],
              },
              startNode: new Node({
                labels: ["enode1"],
                properties: {
                  INPUT: 0,
                  _label: "enode1",
                  _date_created: [2020, 3, 13, 5, 1584110723519],
                  _hash: "enode1_hash",
                  _uuid: "enode1_uuid",
                },
                identity: { low: 1, high: 0 },
              }),
              endNode: new Node({
                labels: ["node3"],
                properties: {
                  INPUT: 0,
                  _label: "node3",
                  _date_created: [2020, 3, 13, 5, 1584110723519],
                  _hash: "node3_hash",
                },
                identity: null,
              }),
              identity: null,
              direction: "outbound",
              necessity: "required",
            }),
          ])
        );
      });
    });

    test("updating prels via identifyParticipatingRelationships", () => {
      const enode_ = cloneDeep(enode);
      const _rel_hash_map_with_ids = {
        relationship1_hash:
          // new Relationship({
          //   labels: ['relationship1'],
          //   properties:
          //   {
          //     weight: 1,
          //     _hash: 'relationship1_hash',
          //     _date_created: [2020, 3, 13, 5, 1584110723525],
          //     _uuid: 'relationship1_uuid'
          //   },
          //   identity: { low: 101, high: 0 },
          //   direction: 'inbound'
          // }),
          {
            labels: ["relationship1"],
            properties: {
              weight: 1,
              _hash: "relationship1_hash",
              _necessity: "required",
              _date_created: [2020, 3, 13, 5, 1584110723525],
              _uuid: "relationship1_uuid",
            },
            identity: { low: 101, high: 0 },
            direction: "inbound",
            necessity: "required",
          },
        relationship2_hash:
          // new Relationship({
          //   labels: ['relationship2'],
          //   properties:
          //   {
          //     weight: 1,
          //     _hash: 'relationship2_hash',
          //     _date_created: [2020, 3, 13, 5, 1584110723525],
          //     _uuid: 'relationship2_uuid'
          //   },
          //   identity: { low: 102, high: 0 },
          //   direction: 'inbound'
          // }),
          {
            labels: ["relationship2"],
            properties: {
              weight: 1,
              _hash: "relationship2_hash",
              _date_created: [2020, 3, 13, 5, 1584110723525],
              _uuid: "relationship2_uuid",
              _necessity: "required",
            },
            identity: { low: 102, high: 0 },
            direction: "inbound",
            necessity: "required",
          },
        relationship3_hash:
          // new Relationship({
          //   labels: ['relationship3'],
          //   properties:
          //   {
          //     weight: 3,
          //     _hash: 'relationship3_hash',
          //     _date_created: [2020, 3, 13, 5, 1584110723525]
          //   },
          //   identity: { low: 103, high: 0 },
          //   direction: 'outbound'
          // }),
          {
            labels: ["relationship3"],
            properties: {
              weight: 3,
              _hash: "relationship3_hash",
              _date_created: [2020, 3, 13, 5, 1584110723525],
              _necessity: "required",
            },
            identity: { low: 103, high: 0 },
            direction: "outbound",
            necessity: "required",
          },
        relationship4_hash:
          // new Relationship({
          //   labels: ['relationship4'],
          //   properties:
          //   {
          //     weight: 4,
          //     _hash: 'relationship4_hash',
          //     _date_created: [2020, 3, 13, 5, 1584110723525]
          //   },
          //   identity: { low: 104, high: 0 },
          //   direction: 'outbound'
          // })
          {
            labels: ["relationship4"],
            properties: {
              weight: 4,
              _hash: "relationship4_hash",
              _date_created: [2020, 3, 13, 5, 1584110723525],
              _necessity: "required",
            },
            identity: { low: 104, high: 0 },
            direction: "outbound",
            necessity: "required",
          },
      };
      /* const result =  */ enode_.identifyParticipatingRelationships(
        _rel_hash_map_with_ids
      );
      const rels = enode_.getParticipatingRelationships({
        asHashMap: true,
        short: true,
      });
      // I'm not doing .toMatchObject(_rel_hash_map_with_ids), coz I am not sure if my
      // _rel_hash_map_with_ids will be formed like this. Mb I'll cut it to { _hash: string, _uuid: string, identity: { low: number, high: number }}
      expect(rels).toMatchObject({
        relationship1_hash: new Relationship({
          labels: ["relationship1"],
          properties: {
            weight: 1,
            _hash: "relationship1_hash",
            _necessity: "required",
            _date_created: [2020, 3, 13, 5, 1584110723525],
            // _uuid: 'relationship1_uuid'
          },
          startNode: new Node({
            labels: ["enode2"],
            properties: {
              INPUT: 2,
              _label: "enode2",
              _date_created: [2020, 3, 13, 5, 1584110723523],
              _hash: "enode2_hash",
            },
            identity: null,
          }),
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
          identity: { low: 101, high: 0 },
          direction: "inbound",
          necessity: "required",
        }),
        relationship2_hash: new Relationship({
          labels: ["relationship2"],
          properties: {
            weight: 1,
            _hash: "relationship2_hash",
            _necessity: "required",
            _date_created: [2020, 3, 13, 5, 1584110723525],
            // _uuid: 'relationship2_uuid'
          },
          startNode: new Node({
            labels: ["node2"],
            properties: {
              INPUT: 0,
              _label: "node2",
              _date_created: [2020, 3, 13, 5, 1584110723519],
              _hash: "node2_hash",
            },
            identity: null,
          }),
          endNode: new Node({
            labels: ["enode2"],
            properties: {
              INPUT: 2,
              _label: "enode2",
              _date_created: [2020, 3, 13, 5, 1584110723523],
              _hash: "enode2_hash",
            },
            identity: null,
          }),
          identity: { low: 102, high: 0 },
          direction: "inbound",
          necessity: "required",
        }),
      });
    });
  });
  describe("isWritten", () => {
    test("edge case - identity { low: 0 }", () => {
      const enode = new EnhancedNode({
        labels: ["candidate_ok"],
        properties: {
          A: 666,
          _label: "candidate_ok",
          _template: "Node",
          _date_created: [2021, 9, 30, 4, 1633018309070],
          _hash:
            "1c000a97a35a24e8c86992e3c94f56d39815e1d6c613b207f8866509bb892e70",
          _uuid: "5bd6bc4c-0004-4560-a30c-44b82f052df7",
        },
        identity: /* Integer */ { low: 0, high: 0 },
        relationships: { inbound: [], outbound: [] },
      });
      expect(enode.isWritten()).toEqual(true);
    });
    test("standard case", async () => {
      const enode = new EnhancedNode({
        labels: ["l_1_0"],
        properties: {
          INPUT: 0,
          _label: "l_1_0",
          _date_created: [2020, 3, 13, 5, 1584110723519],
          _hash:
            "98d4eacdda3010054abefc35a7c3881dc56bc1f8e86808189a03c34377043e82",
          _uuid: "d83d8a55-255c-4d8f-b5c2-2f1524c12225",
        },
        identity: /* Integer */ { low: 20, high: 0 },
        relationships: {
          inbound: [
            new Relationship({
              labels: ["w_0_1"],
              properties: {
                weight: 0,
                _hash:
                  "dc69436d4faa311426ca3f06c5066432fb54f8eb6e4632d6975b23fab2d3a8ab",
                _date_created: [2020, 3, 13, 5, 1584110723525],
              },
              startNode: new Node({
                labels: ["l_0_0"],
                properties: {
                  INPUT: 1,
                  _label: "l_0_0",
                  _date_created: [2020, 3, 13, 5, 1584110723523],
                  _hash:
                    "69da7135a1f9104513d2196eefd96f3e2a4646bbbc48280416ddb5f6636be0a5",
                  _uuid: "849733a4-bb65-4221-8fa5-92bf1820b0ec",
                },
                identity: /* Integer */ { low: 21, high: 0 },
              }),
              endNode: new Node({
                labels: ["l_1_0"],
                properties: {
                  INPUT: 0,
                  _label: "l_1_0",
                  _date_created: [2020, 3, 13, 5, 1584110723519],
                  _hash:
                    "98d4eacdda3010054abefc35a7c3881dc56bc1f8e86808189a03c34377043e82",
                  _uuid: "d83d8a55-255c-4d8f-b5c2-2f1524c12225",
                },
                identity: /* Integer */ { low: 20, high: 0 },
              }),
              identity: /* Integer */ { low: 100, high: 0 },
              direction: "inbound",
            }),
            new Relationship({
              labels: ["w_0_1"],
              properties: {
                weight: 1,
                _hash:
                  "65f195f34ea959ff7e5ab3d3fa79b54c88a05c9c77bc88341a852e50e5279749",
                _date_created: [2020, 3, 13, 5, 1584110723525],
              },
              startNode: new Node({
                labels: ["l_0_1"],
                properties: {
                  INPUT: 2,
                  _label: "l_0_1",
                  _date_created: [2020, 3, 13, 5, 1584110723523],
                  _hash:
                    "e7bb347a8733b73f212f8dfba9782c5f7bcb1d55160df2c2fcab1cf43c54b0cb",
                  _uuid: "e47952db-4b42-4463-916a-86785f9bfaa8",
                },
                identity: /* Integer */ { low: 22, high: 0 },
              }),
              endNode: new Node({
                labels: ["l_1_0"],
                properties: {
                  INPUT: 0,
                  _label: "l_1_0",
                  _date_created: [2020, 3, 13, 5, 1584110723519],
                  _hash:
                    "98d4eacdda3010054abefc35a7c3881dc56bc1f8e86808189a03c34377043e82",
                  _uuid: "d83d8a55-255c-4d8f-b5c2-2f1524c12225",
                },
                identity: /* Integer */ { low: 20, high: 0 },
              }),
              identity: /* Integer */ { low: 101, high: 0 },
              direction: "inbound",
            }),
            new Relationship({
              labels: ["w_0_1"],
              properties: {
                weight: 2,
                _hash:
                  "c70401efbcaeb7530ad4128119ea5cd7fcd83142b829bda4d424c7efbb14bfab",
                _date_created: [2020, 3, 13, 5, 1584110723525],
              },
              startNode: new Node({
                labels: ["l_0_2"],
                properties: {
                  INPUT: 3,
                  _label: "l_0_2",
                  _date_created: [2020, 3, 13, 5, 1584110723523],
                  _hash:
                    "93cff2a5d0835392b94225f3658d88bd018fc59baeedb7ec5af47c62bf8f121c",
                  _uuid: "bf966791-7ba5-4348-9b7f-1974f4f365b1",
                },
                identity: /* Integer */ { low: 23, high: 0 },
              }),
              endNode: new Node({
                labels: ["l_1_0"],
                properties: {
                  INPUT: 0,
                  _label: "l_1_0",
                  _date_created: [2020, 3, 13, 5, 1584110723519],
                  _hash:
                    "98d4eacdda3010054abefc35a7c3881dc56bc1f8e86808189a03c34377043e82",
                  _uuid: "d83d8a55-255c-4d8f-b5c2-2f1524c12225",
                },
                identity: /* Integer */ { low: 20, high: 0 },
              }),
              identity: /* Integer */ { low: 102, high: 0 },
              direction: "inbound",
            }),
          ],
          outbound: [],
        },
      });

      expect(enode.isWritten()).toEqual(true);

      enode.relationships.inbound[0].identity = null;
      expect(enode.isWritten()).toEqual(false);
    });
  });
  describe("deepen", () => {
    const pete = new Node({
      labels: ["Person"],
      properties: {
        // _uuid: 'fe0a1e50-73c1-430c-aee1-f8994bd81f45',
        _hash:
          "6661b5fb7ed89de9f9ad37608a209c713ea318a2e35dd32853114d7bef002895",
        // _date_created: [2020, 5, 6, 3, 1588760891365],
        _label: "Person",
        NAME: "Pete",
      },
    });
    const data = new Success({
      success: true,
      reason: "",
      parameters: {},
      data: [
        [
          new EnhancedNode({
            labels: ["Trade"],
            properties: {
              _uuid: "b1ed24fd-cff0-43af-9188-4405a2fbad35",
              _hash:
                "4b77cea6394496537b342eb2b9f2cb441f2fe257af4db2df2481ba911f7bf3ae",
              _date_created: [2020, 5, 6, 3, 1588769317354],
              _label: "Trade",
              TRADE_NUM: 1,
            },
            identity: /* Integer */ { low: 4370, high: 0 },
            relationships: { inbound: [], outbound: [] },
          }),
          [
            new Relationship({
              labels: ["EXECUTE"],
              properties: {
                _date_created: [2020, 5, 6, 3, 1588769317359],
                valid: true,
                _necessity: "required",
                _uuid: "2e9ac205-13fd-4b27-b306-b2d605663a04",
                _hash:
                  "d024e49e94197d11d6e4de9f97f6709330677151ad93ccdbb69343054d3860f4",
              },
              startNode: new EnhancedNode({
                labels: ["Person"],
                properties: {
                  _uuid: "fdcdae41-4815-4e45-b65c-79c25fb4ee33",
                  _hash:
                    "6661b5fb7ed89de9f9ad37608a209c713ea318a2e35dd32853114d7bef002895",
                  _date_created: [2020, 5, 6, 3, 1588769317350],
                  _label: "Person",
                  NAME: "Pete",
                },
                identity: /* Integer */ { low: 4367, high: 0 },
                relationships: { inbound: [], outbound: [] },
              }),
              endNode: new EnhancedNode({
                labels: ["Trade"],
                properties: {
                  _uuid: "b1ed24fd-cff0-43af-9188-4405a2fbad35",
                  _hash:
                    "4b77cea6394496537b342eb2b9f2cb441f2fe257af4db2df2481ba911f7bf3ae",
                  _date_created: [2020, 5, 6, 3, 1588769317354],
                  _label: "Trade",
                  TRADE_NUM: 1,
                },
                identity: /* Integer */ { low: 4370, high: 0 },
                relationships: { inbound: [], outbound: [] },
              }),
              identity: /* Integer */ { low: 7929, high: 0 },
              direction: null,
              necessity: "required",
            }),
          ],
          new EnhancedNode({
            labels: ["Person"],
            properties: {
              _uuid: "fdcdae41-4815-4e45-b65c-79c25fb4ee33",
              _hash:
                "6661b5fb7ed89de9f9ad37608a209c713ea318a2e35dd32853114d7bef002895",
              _date_created: [2020, 5, 6, 3, 1588769317350],
              _label: "Person",
              NAME: "Pete",
            },
            identity: /* Integer */ { low: 4367, high: 0 },
            relationships: { inbound: [], outbound: [] },
          }),
        ],
        [
          new EnhancedNode({
            labels: ["DAY"],
            properties: {
              _uuid: "37c1414c-0d56-409c-a51f-af630e0222d3",
              DAY: 1,
              _hash:
                "a6276104d489efb41808ef52fffa39d2e19b6c6dd3700162eb6b72fcf8d774ac",
              _date_created: [2020, 5, 6, 3, 1588769317356],
              _label: "DAY",
            },
            identity: /* Integer */ { low: 4373, high: 0 },
            relationships: { inbound: [], outbound: [] },
          }),
          [
            new Relationship({
              labels: ["EXECUTE"],
              properties: {
                _date_created: [2020, 5, 6, 3, 1588769317359],
                valid: true,
                _necessity: "required",
                _uuid: "2e9ac205-13fd-4b27-b306-b2d605663a04",
                _hash:
                  "d024e49e94197d11d6e4de9f97f6709330677151ad93ccdbb69343054d3860f4",
              },
              startNode: new EnhancedNode({
                labels: ["Person"],
                properties: {
                  _uuid: "fdcdae41-4815-4e45-b65c-79c25fb4ee33",
                  _hash:
                    "6661b5fb7ed89de9f9ad37608a209c713ea318a2e35dd32853114d7bef002895",
                  _date_created: [2020, 5, 6, 3, 1588769317350],
                  _label: "Person",
                  NAME: "Pete",
                },
                identity: /* Integer */ { low: 4367, high: 0 },
                relationships: { inbound: [], outbound: [] },
              }),
              endNode: new EnhancedNode({
                labels: ["Trade"],
                properties: {
                  _uuid: "b1ed24fd-cff0-43af-9188-4405a2fbad35",
                  _hash:
                    "4b77cea6394496537b342eb2b9f2cb441f2fe257af4db2df2481ba911f7bf3ae",
                  _date_created: [2020, 5, 6, 3, 1588769317354],
                  _label: "Trade",
                  TRADE_NUM: 1,
                },
                identity: /* Integer */ { low: 4370, high: 0 },
                relationships: { inbound: [], outbound: [] },
              }),
              identity: /* Integer */ { low: 7929, high: 0 },
              direction: null,
              necessity: "required",
            }),
            new Relationship({
              labels: ["ON_DATE"],
              properties: {
                _date_created: [2020, 5, 6, 3, 1588769317357],
                valid: true,
                _necessity: "required",
                _uuid: "f0b3f154-de1f-45bc-9c3c-5b719c810d95",
                _hash:
                  "ed9a74632bd67f7000d3c5ce4616c9152543e3f36c975a36e6c472a32af6c3ab",
              },
              startNode: new EnhancedNode({
                labels: ["Trade"],
                properties: {
                  _uuid: "b1ed24fd-cff0-43af-9188-4405a2fbad35",
                  _hash:
                    "4b77cea6394496537b342eb2b9f2cb441f2fe257af4db2df2481ba911f7bf3ae",
                  _date_created: [2020, 5, 6, 3, 1588769317354],
                  _label: "Trade",
                  TRADE_NUM: 1,
                },
                identity: /* Integer */ { low: 4370, high: 0 },
                relationships: { inbound: [], outbound: [] },
              }),
              endNode: new EnhancedNode({
                labels: ["DAY"],
                properties: {
                  _uuid: "37c1414c-0d56-409c-a51f-af630e0222d3",
                  DAY: 1,
                  _hash:
                    "a6276104d489efb41808ef52fffa39d2e19b6c6dd3700162eb6b72fcf8d774ac",
                  _date_created: [2020, 5, 6, 3, 1588769317356],
                  _label: "DAY",
                },
                identity: /* Integer */ { low: 4373, high: 0 },
                relationships: { inbound: [], outbound: [] },
              }),
              identity: /* Integer */ { low: 7932, high: 0 },
              direction: null,
              necessity: "required",
            }),
          ],
          new EnhancedNode({
            labels: ["Person"],
            properties: {
              _uuid: "fdcdae41-4815-4e45-b65c-79c25fb4ee33",
              _hash:
                "6661b5fb7ed89de9f9ad37608a209c713ea318a2e35dd32853114d7bef002895",
              _date_created: [2020, 5, 6, 3, 1588769317350],
              _label: "Person",
              NAME: "Pete",
            },
            identity: /* Integer */ { low: 4367, high: 0 },
            relationships: { inbound: [], outbound: [] },
          }),
        ],
        [
          new EnhancedNode({
            labels: ["Trade"],
            properties: {
              _uuid: "38dc4050-c911-4482-847e-802cc1e2841a",
              _hash:
                "6c695d9c0601d9fbdc359c6c998cf08ce9a48d9984c93a993fe6d1bb89184a3f",
              _date_created: [2020, 5, 6, 3, 1588769317354],
              _label: "Trade",
              TRADE_NUM: 2,
            },
            identity: /* Integer */ { low: 4371, high: 0 },
            relationships: { inbound: [], outbound: [] },
          }),
          [
            new Relationship({
              labels: ["EXECUTE"],
              properties: {
                _date_created: [2020, 5, 6, 3, 1588769317359],
                valid: true,
                _necessity: "required",
                _uuid: "8579dcd0-4b9c-4be2-9d18-6bd8c4423074",
                _hash:
                  "f95161ec8be1dd3ae40d62b2c02e8b5129a110a6843e99cb22ef3b7133767c2f",
              },
              startNode: new EnhancedNode({
                labels: ["Person"],
                properties: {
                  _uuid: "fdcdae41-4815-4e45-b65c-79c25fb4ee33",
                  _hash:
                    "6661b5fb7ed89de9f9ad37608a209c713ea318a2e35dd32853114d7bef002895",
                  _date_created: [2020, 5, 6, 3, 1588769317350],
                  _label: "Person",
                  NAME: "Pete",
                },
                identity: /* Integer */ { low: 4367, high: 0 },
                relationships: { inbound: [], outbound: [] },
              }),
              endNode: new EnhancedNode({
                labels: ["Trade"],
                properties: {
                  _uuid: "38dc4050-c911-4482-847e-802cc1e2841a",
                  _hash:
                    "6c695d9c0601d9fbdc359c6c998cf08ce9a48d9984c93a993fe6d1bb89184a3f",
                  _date_created: [2020, 5, 6, 3, 1588769317354],
                  _label: "Trade",
                  TRADE_NUM: 2,
                },
                identity: /* Integer */ { low: 4371, high: 0 },
                relationships: { inbound: [], outbound: [] },
              }),
              identity: /* Integer */ { low: 7930, high: 0 },
              direction: null,
              necessity: "required",
            }),
          ],
          new EnhancedNode({
            labels: ["Person"],
            properties: {
              _uuid: "fdcdae41-4815-4e45-b65c-79c25fb4ee33",
              _hash:
                "6661b5fb7ed89de9f9ad37608a209c713ea318a2e35dd32853114d7bef002895",
              _date_created: [2020, 5, 6, 3, 1588769317350],
              _label: "Person",
              NAME: "Pete",
            },
            identity: /* Integer */ { low: 4367, high: 0 },
            relationships: { inbound: [], outbound: [] },
          }),
        ],
        [
          new EnhancedNode({
            labels: ["DAY"],
            properties: {
              _uuid: "012fbe7f-3a3c-4269-8d9f-8b90d0d77b3d",
              DAY: 2,
              _hash:
                "2861374334a630b700b1f973889cae260e036614cf860f135292bf458808871f",
              _date_created: [2020, 5, 6, 3, 1588769317356],
              _label: "DAY",
            },
            identity: /* Integer */ { low: 4374, high: 0 },
            relationships: { inbound: [], outbound: [] },
          }),
          [
            new Relationship({
              labels: ["EXECUTE"],
              properties: {
                _date_created: [2020, 5, 6, 3, 1588769317359],
                valid: true,
                _necessity: "required",
                _uuid: "8579dcd0-4b9c-4be2-9d18-6bd8c4423074",
                _hash:
                  "f95161ec8be1dd3ae40d62b2c02e8b5129a110a6843e99cb22ef3b7133767c2f",
              },
              startNode: new EnhancedNode({
                labels: ["Person"],
                properties: {
                  _uuid: "fdcdae41-4815-4e45-b65c-79c25fb4ee33",
                  _hash:
                    "6661b5fb7ed89de9f9ad37608a209c713ea318a2e35dd32853114d7bef002895",
                  _date_created: [2020, 5, 6, 3, 1588769317350],
                  _label: "Person",
                  NAME: "Pete",
                },
                identity: /* Integer */ { low: 4367, high: 0 },
                relationships: { inbound: [], outbound: [] },
              }),
              endNode: new EnhancedNode({
                labels: ["Trade"],
                properties: {
                  _uuid: "38dc4050-c911-4482-847e-802cc1e2841a",
                  _hash:
                    "6c695d9c0601d9fbdc359c6c998cf08ce9a48d9984c93a993fe6d1bb89184a3f",
                  _date_created: [2020, 5, 6, 3, 1588769317354],
                  _label: "Trade",
                  TRADE_NUM: 2,
                },
                identity: /* Integer */ { low: 4371, high: 0 },
                relationships: { inbound: [], outbound: [] },
              }),
              identity: /* Integer */ { low: 7930, high: 0 },
              direction: null,
              necessity: "required",
            }),
            new Relationship({
              labels: ["ON_DATE"],
              properties: {
                _date_created: [2020, 5, 6, 3, 1588769317358],
                valid: true,
                _necessity: "required",
                _uuid: "93adef68-d156-4c3d-810d-06e6c3b8db55",
                _hash:
                  "d1b0c3eec6af894440ec85dbca2376a1a29928f4fa29d0836ef586aba1ee9992",
              },
              startNode: new EnhancedNode({
                labels: ["Trade"],
                properties: {
                  _uuid: "38dc4050-c911-4482-847e-802cc1e2841a",
                  _hash:
                    "6c695d9c0601d9fbdc359c6c998cf08ce9a48d9984c93a993fe6d1bb89184a3f",
                  _date_created: [2020, 5, 6, 3, 1588769317354],
                  _label: "Trade",
                  TRADE_NUM: 2,
                },
                identity: /* Integer */ { low: 4371, high: 0 },
                relationships: { inbound: [], outbound: [] },
              }),
              endNode: new EnhancedNode({
                labels: ["DAY"],
                properties: {
                  _uuid: "012fbe7f-3a3c-4269-8d9f-8b90d0d77b3d",
                  DAY: 2,
                  _hash:
                    "2861374334a630b700b1f973889cae260e036614cf860f135292bf458808871f",
                  _date_created: [2020, 5, 6, 3, 1588769317356],
                  _label: "DAY",
                },
                identity: /* Integer */ { low: 4374, high: 0 },
                relationships: { inbound: [], outbound: [] },
              }),
              identity: /* Integer */ { low: 7933, high: 0 },
              direction: null,
              necessity: "required",
            }),
          ],
          new EnhancedNode({
            labels: ["Person"],
            properties: {
              _uuid: "fdcdae41-4815-4e45-b65c-79c25fb4ee33",
              _hash:
                "6661b5fb7ed89de9f9ad37608a209c713ea318a2e35dd32853114d7bef002895",
              _date_created: [2020, 5, 6, 3, 1588769317350],
              _label: "Person",
              NAME: "Pete",
            },
            identity: /* Integer */ { low: 4367, high: 0 },
            relationships: { inbound: [], outbound: [] },
          }),
        ],
      ],
      query: "",
      summary: {},
    });
    const rels = flattenDeep(data.data).filter(isRelationship);
    const result = new EnhancedNode({
      labels: ["Person"],
      properties: {
        _uuid: "fdcdae41-4815-4e45-b65c-79c25fb4ee33",
        _hash:
          "6661b5fb7ed89de9f9ad37608a209c713ea318a2e35dd32853114d7bef002895",
        _date_created: [2020, 5, 6, 3, 1588769317350],
        _label: "Person",
        NAME: "Pete",
      },
      identity: { low: 4367, high: 0 },
      relationships: {
        inbound: [],
        outbound: [
          new Relationship({
            labels: ["EXECUTE"],
            properties: {
              _date_created: [2020, 5, 6, 3, 1588769317359],
              valid: true,
              _necessity: "required",
              _uuid: "2e9ac205-13fd-4b27-b306-b2d605663a04",
              _hash:
                "d024e49e94197d11d6e4de9f97f6709330677151ad93ccdbb69343054d3860f4",
            },
            startNode: new EnhancedNode({
              labels: ["Person"],
              properties: {
                _uuid: "fdcdae41-4815-4e45-b65c-79c25fb4ee33",
                _hash:
                  "6661b5fb7ed89de9f9ad37608a209c713ea318a2e35dd32853114d7bef002895",
                _date_created: [2020, 5, 6, 3, 1588769317350],
                _label: "Person",
                NAME: "Pete",
              },
              identity: /* Integer */ { low: 4367, high: 0 },
              relationships: { inbound: [], outbound: [] },
            }),
            endNode: new EnhancedNode({
              labels: ["Trade"],
              properties: {
                _uuid: "b1ed24fd-cff0-43af-9188-4405a2fbad35",
                _hash:
                  "4b77cea6394496537b342eb2b9f2cb441f2fe257af4db2df2481ba911f7bf3ae",
                _date_created: [2020, 5, 6, 3, 1588769317354],
                _label: "Trade",
                TRADE_NUM: 1,
              },
              identity: /* Integer */ { low: 4370, high: 0 },
              relationships: {
                inbound: [],
                outbound: [
                  new Relationship({
                    labels: ["ON_DATE"],
                    properties: {
                      _date_created: [2020, 5, 6, 3, 1588769317357],
                      valid: true,
                      _necessity: "required",
                      _uuid: "f0b3f154-de1f-45bc-9c3c-5b719c810d95",
                      _hash:
                        "ed9a74632bd67f7000d3c5ce4616c9152543e3f36c975a36e6c472a32af6c3ab",
                    },
                    startNode: new EnhancedNode({
                      labels: ["Trade"],
                      properties: {
                        _uuid: "b1ed24fd-cff0-43af-9188-4405a2fbad35",
                        _hash:
                          "4b77cea6394496537b342eb2b9f2cb441f2fe257af4db2df2481ba911f7bf3ae",
                        _date_created: [2020, 5, 6, 3, 1588769317354],
                        _label: "Trade",
                        TRADE_NUM: 1,
                      },
                      identity: /* Integer */ { low: 4370, high: 0 },
                      relationships: { inbound: [], outbound: [] },
                    }),
                    endNode: new EnhancedNode({
                      labels: ["DAY"],
                      properties: {
                        _uuid: "37c1414c-0d56-409c-a51f-af630e0222d3",
                        DAY: 1,
                        _hash:
                          "a6276104d489efb41808ef52fffa39d2e19b6c6dd3700162eb6b72fcf8d774ac",
                        _date_created: [2020, 5, 6, 3, 1588769317356],
                        _label: "DAY",
                      },
                      identity: /* Integer */ { low: 4373, high: 0 },
                      relationships: { inbound: [], outbound: [] },
                    }),
                    identity: /* Integer */ { low: 7932, high: 0 },
                    direction: "outbound",
                    necessity: "required",
                  }),
                ],
              },
            }),
            identity: /* Integer */ { low: 7929, high: 0 },
            direction: "outbound",
            necessity: "required",
          }),
          new Relationship({
            labels: ["EXECUTE"],
            properties: {
              _date_created: [2020, 5, 6, 3, 1588769317359],
              valid: true,
              _necessity: "required",
              _uuid: "8579dcd0-4b9c-4be2-9d18-6bd8c4423074",
              _hash:
                "f95161ec8be1dd3ae40d62b2c02e8b5129a110a6843e99cb22ef3b7133767c2f",
            },
            startNode: new EnhancedNode({
              labels: ["Person"],
              properties: {
                _uuid: "fdcdae41-4815-4e45-b65c-79c25fb4ee33",
                _hash:
                  "6661b5fb7ed89de9f9ad37608a209c713ea318a2e35dd32853114d7bef002895",
                _date_created: [2020, 5, 6, 3, 1588769317350],
                _label: "Person",
                NAME: "Pete",
              },
              identity: /* Integer */ { low: 4367, high: 0 },
              relationships: { inbound: [], outbound: [] },
            }),
            endNode: new EnhancedNode({
              labels: ["Trade"],
              properties: {
                _uuid: "38dc4050-c911-4482-847e-802cc1e2841a",
                _hash:
                  "6c695d9c0601d9fbdc359c6c998cf08ce9a48d9984c93a993fe6d1bb89184a3f",
                _date_created: [2020, 5, 6, 3, 1588769317354],
                _label: "Trade",
                TRADE_NUM: 2,
              },
              identity: /* Integer */ { low: 4371, high: 0 },
              relationships: {
                inbound: [],
                outbound: [
                  new Relationship({
                    labels: ["ON_DATE"],
                    properties: {
                      _date_created: [2020, 5, 6, 3, 1588769317358],
                      valid: true,
                      _necessity: "required",
                      _uuid: "93adef68-d156-4c3d-810d-06e6c3b8db55",
                      _hash:
                        "d1b0c3eec6af894440ec85dbca2376a1a29928f4fa29d0836ef586aba1ee9992",
                    },
                    startNode: new EnhancedNode({
                      labels: ["Trade"],
                      properties: {
                        _uuid: "38dc4050-c911-4482-847e-802cc1e2841a",
                        _hash:
                          "6c695d9c0601d9fbdc359c6c998cf08ce9a48d9984c93a993fe6d1bb89184a3f",
                        _date_created: [2020, 5, 6, 3, 1588769317354],
                        _label: "Trade",
                        TRADE_NUM: 2,
                      },
                      identity: /* Integer */ { low: 4371, high: 0 },
                      relationships: { inbound: [], outbound: [] },
                    }),
                    endNode: new EnhancedNode({
                      labels: ["DAY"],
                      properties: {
                        _uuid: "012fbe7f-3a3c-4269-8d9f-8b90d0d77b3d",
                        DAY: 2,
                        _hash:
                          "2861374334a630b700b1f973889cae260e036614cf860f135292bf458808871f",
                        _date_created: [2020, 5, 6, 3, 1588769317356],
                        _label: "DAY",
                      },
                      identity: /* Integer */ { low: 4374, high: 0 },
                      relationships: { inbound: [], outbound: [] },
                    }),
                    identity: /* Integer */ { low: 7933, high: 0 },
                    direction: "outbound",
                    necessity: "required",
                  }),
                ],
              },
            }),
            identity: /* Integer */ { low: 7930, high: 0 },
            direction: "outbound",
            necessity: "required",
          }),
        ],
      },
    });
    test("build deep EnhancedNode, first standalone function", async () => {
      function getHash(val: Node | Relationship) {
        return val.getHash();
      } // 6
      function dataToEnode(node: Node, _rels: Relationship[]): EnhancedNode {
        const rels = cloneDeep(_rels);
        const uniqRels = uniqBy(rels, getHash);
        const nodes = uniqRels.reduce((acc, rel) => {
          acc.push(...rel.getNodes());
          return acc;
        }, []);
        const uniqNodes = uniqBy(nodes, getHash);
        const uniqNodesHashes = uniqNodes.map(getHash);
        const [enode] = uniqNodes.filter((n) => {
          return n.getHash() === node.getHash();
        });
        if (!enode || !isEnhancedNode(enode)) {
          throw new Error(
            `dataToEnode: couldn't match first enode.\nenode: ${JSON.stringify(
              enode
            )}\ndata: ${JSON.stringify(data)}`
          );
        }

        const result = traverser(enode, uniqRels);
        // log(result)
        return result;

        function traverser(parentNode: EnhancedNode, box: Relationship[]) {
          if (!isEnhancedNode(parentNode)) {
            throw new Error(
              `dataToEnode.traverser: expect parentNode to be EnhancedNode.\nparentNode: ${JSON.stringify(
                parentNode
              )}`
            );
          }
          if (!box.length) {
            return parentNode;
          }

          /* save parentNode hash */
          const parentNodeHash = parentNode.getHash();
          // console.log('parentNodeHash: ', parentNodeHash, 'isIncluded: ', uniqNodesHashes.includes(parentNodeHash), 'uniqNodesHashes: ', uniqNodesHashes.length)
          if (!parentNodeHash || !isString(parentNodeHash)) {
            throw new Error(
              `dataToEnode.traverser: parentNode have a string hash.\nparentNode: ${JSON.stringify(
                parentNode
              )}`
            );
          }
          /* are there any relevant unattended Relationships in the box? */
          function relMatcher(rel) {
            return [rel.getStartNodeHash(), rel.getEndNodeHash()].includes(
              parentNodeHash
            );
          }
          const relevantRels = box.filter(relMatcher);
          // log('relevantRels: ', relevantRels)
          if (!relevantRels.length) {
            return parentNode;
          } // nothing to do here

          /* at this point we have some unattributed rels relevant to this parentNode. attribute 'em */
          relevantRels.forEach((rel) => {
            /* check direction */
            // let direction = ''
            if (rel.getStartNodeHash() === parentNodeHash) {
              rel.setDirection("outbound");
              parentNode.relationships.outbound.push(rel);
            } else if (rel.getEndNodeHash() === parentNodeHash) {
              rel.setDirection("inbound");
              parentNode.relationships.inbound.push(rel);
            } else {
              throw new Error(
                `dataToEnode.traverser: something went wrong, coundn't devise direction.\nparentNode: ${JSON.stringify(
                  parentNode
                )}\nrel: ${JSON.stringify(rel)}`
              );
            }
          });
          /* remove relevantRels from the box, mutates box. Will move this up, get rid of filter */
          remove(box, relMatcher);
          // log(box)
          /* now time to go through these rels and treat each partnerNode as parentNode until box is empty */
          /* start going through rels */
          const rels = parentNode.getAllRelationshipsAsArray();

          rels.forEach((rel) => {
            let parentNode = rel.getPartnerNode();
            parentNode = traverser(parentNode, box);
          });
          return parentNode;
        }
      }
      const rels = flattenDeep(data.data).filter(isRelationship);
      const final = dataToEnode(pete, rels);
      // log(final)
      expect(final).toBeInstanceOf(EnhancedNode);
      expect(final).toMatchObject(result);
    });
    test("via EnhancedNode.deepen", async () => {
      const enode = new EnhancedNode({ ...pete });
      const rels = flattenDeep(data.data).filter(isRelationship);
      const final = enode.deepen(rels);
      expect(final).toBeInstanceOf(EnhancedNode);
      expect(final).toMatchObject(result);
    });
    test("rels contains irrelevant rels", async () => {
      const enode1 = new EnhancedNode({
          labels: ["extraEnode"],
          properties: {
            _uuid: "extraEnode_1_uuid",
            VALUE: 1,
            _hash: "extraEnode_1_hash",
            _date_created: [2020, 5, 6, 3, 1588769317356],
            _label: "extraEnode",
          },
          identity: /* Integer */ { low: 1000, high: 0 },
          relationships: { inbound: [], outbound: [] },
        }),
        enode2 = new EnhancedNode({
          labels: ["extraEnode"],
          properties: {
            _uuid: "extraEnode_2_uuid",
            VALUE: 2,
            _hash: "extraEnode_2_hash",
            _date_created: [2020, 5, 6, 3, 1588769317356],
            _label: "extraEnode",
          },
          identity: /* Integer */ { low: 1001, high: 0 },
          relationships: { inbound: [], outbound: [] },
        }),
        enode3 = new EnhancedNode({
          labels: ["extraEnode"],
          properties: {
            _uuid: "extraEnode_3_uuid",
            VALUE: 3,
            _hash: "extraEnode_3_hash",
            _date_created: [2020, 5, 6, 3, 1588769317356],
            _label: "extraEnode",
          },
          identity: /* Integer */ { low: 1002, high: 0 },
          relationships: { inbound: [], outbound: [] },
        });
      const unrelated = [
        enode1,
        [
          new Relationship({
            labels: ["EXTRA_REL"],
            properties: {
              _date_created: [2020, 5, 6, 3, 1588769317359],
              valid: true,
              _necessity: "required",
              _uuid: "EXTRA_REL_1_uuid",
              _hash: "EXTRA_REL_1_hash",
            },
            startNode: enode1,
            endNode: enode2,
            identity: /* Integer */ { low: 1003, high: 0 },
            direction: null,
            necessity: "required",
          }),
          new Relationship({
            labels: ["EXTRA_REL"],
            properties: {
              _date_created: [2020, 5, 6, 3, 1588769317358],
              valid: true,
              _necessity: "required",
              _uuid: "EXTRA_REL_2_uuid",
              _hash: "EXTRA_REL_2_hash",
            },
            startNode: enode2,
            endNode: enode3,
            identity: /* Integer */ { low: 1004, high: 0 },
            direction: null,
            necessity: "required",
          }),
        ],
        enode3,
      ];

      data.data.push(unrelated);

      const rels = flattenDeep(data.data).filter(isRelationship);
      const enode = new EnhancedNode({ ...pete });
      const final = enode.deepen(rels);
      expect(final).toBeInstanceOf(EnhancedNode);
      expect(final).toMatchObject(result);
    });
    test("rels only contains irrelevant rels", async () => {
      const enode1 = new EnhancedNode({
          labels: ["extraEnode"],
          properties: {
            _uuid: "extraEnode_1_uuid",
            VALUE: 1,
            _hash: "extraEnode_1_hash",
            _date_created: [2020, 5, 6, 3, 1588769317356],
            _label: "extraEnode",
          },
          identity: /* Integer */ { low: 1000, high: 0 },
          relationships: { inbound: [], outbound: [] },
        }),
        enode2 = new EnhancedNode({
          labels: ["extraEnode"],
          properties: {
            _uuid: "extraEnode_2_uuid",
            VALUE: 2,
            _hash: "extraEnode_2_hash",
            _date_created: [2020, 5, 6, 3, 1588769317356],
            _label: "extraEnode",
          },
          identity: /* Integer */ { low: 1001, high: 0 },
          relationships: { inbound: [], outbound: [] },
        }),
        enode3 = new EnhancedNode({
          labels: ["extraEnode"],
          properties: {
            _uuid: "extraEnode_3_uuid",
            VALUE: 3,
            _hash: "extraEnode_3_hash",
            _date_created: [2020, 5, 6, 3, 1588769317356],
            _label: "extraEnode",
          },
          identity: /* Integer */ { low: 1002, high: 0 },
          relationships: { inbound: [], outbound: [] },
        });
      const unrelated = [
        enode1,
        [
          new Relationship({
            labels: ["EXTRA_REL"],
            properties: {
              _date_created: [2020, 5, 6, 3, 1588769317359],
              valid: true,
              _necessity: "required",
              _uuid: "EXTRA_REL_1_uuid",
              _hash: "EXTRA_REL_1_hash",
            },
            startNode: enode1,
            endNode: enode2,
            identity: /* Integer */ { low: 1003, high: 0 },
            direction: null,
            necessity: "required",
          }),
          new Relationship({
            labels: ["EXTRA_REL"],
            properties: {
              _date_created: [2020, 5, 6, 3, 1588769317358],
              valid: true,
              _necessity: "required",
              _uuid: "EXTRA_REL_2_uuid",
              _hash: "EXTRA_REL_2_hash",
            },
            startNode: enode2,
            endNode: enode3,
            identity: /* Integer */ { low: 1004, high: 0 },
            direction: null,
            necessity: "required",
          }),
        ],
        enode3,
      ];

      data.data = [unrelated];

      const rels = flattenDeep(data.data).filter(isRelationship);
      const enode = new EnhancedNode({ ...pete });
      const final = enode.deepen(rels);
      expect(final).toBeInstanceOf(EnhancedNode);
      expect(final).toMatchObject(enode);
    });
  });
  describe("findParticipatingNodes", () => {
    const enode = new EnhancedNode({
      labels: ["Person"],
      properties: {
        NAME: "DV",
        _positionX: 433.5,
        _positionY: 50,
        _arrowsId: "n1",
        _caption: "",
        _label: "Person",
        _template: "Node",
        _date_created: [2021, 10, 22, 5, 1634928542950],
        _hash:
          "cbb0acd6d9f572007b33247444ba2ec61646af236eba18e8154af0b9826d66ba",
        _uuid: "98589125-def8-4faa-b036-2300025e92ef",
      },
      identity: /* Integer */ { low: 77, high: 0 },
      relationships: {
        inbound: [],
        outbound: [
          new Relationship({
            labels: ["OWNS"],
            properties: {
              fromDate: "2012-01-01",
              SHARE: "[1,1]",
              _fromId: "n1",
              _toId: "n0",
              _arrowsId: "n0",
              _isCurrent: true,
              _hasBeenUpdated: false,
              _dateUpdated: null,
              _userUpdated: null,
              _newRelationshipHash: null,
              _oldRelationshipHash: null,
              _hash:
                "71bd9c4691e1a1df38198bf501fbbab19ae80256e2bd37dd976d4e878badab68",
              _date_created: [2021, 10, 22, 5, 1634928542951],
              _necessity: "optional",
              _uuid: "19e5f8e1-1c0d-40dd-b01d-0d23b5952c50",
            },
            startNode: new Node({
              labels: ["Person"],
              properties: {
                NAME: "DV",
                _positionX: 433.5,
                _positionY: 50,
                _arrowsId: "n1",
                _caption: "",
                _label: "Person",
                _template: "Node",
                _date_created: [2021, 10, 22, 5, 1634928542950],
                _hash:
                  "cbb0acd6d9f572007b33247444ba2ec61646af236eba18e8154af0b9826d66ba",
                _uuid: "98589125-def8-4faa-b036-2300025e92ef",
              },
              identity: /* Integer */ { low: 77, high: 0 },
            }),
            endNode: new Node({
              labels: ["Company"],
              properties: {
                NAME: "Company A",
                INCORPORATION_DATE: "2012-01-01",
                _positionX: 75,
                _positionY: 50,
                _arrowsId: "n0",
                _caption: "",
                _label: "Company",
                _template: "Node",
                _date_created: [2021, 10, 22, 5, 1634928542950],
                _hash:
                  "0d6123c44b81878d7d58f478fbb707dd606a2f53307c1b2f407d86ae934e6780",
                _uuid: "063e05ac-cf1f-4616-a0e9-8baf120268f3",
              },
              identity: /* Integer */ { low: 78, high: 0 },
            }),
            identity: /* Integer */ { low: 73, high: 0 },
            direction: "outbound",
            necessity: "optional",
          }),
        ],
      },
    });
    test("with labels and props", () => {
      const result: Node[] = enode.findParticipatingNodes({
        labels: ["Company"],
        properties: { NAME: "Company A" },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        labels: ["Company"],
        properties: {
          NAME: "Company A",
          INCORPORATION_DATE: "2012-01-01",
          _positionX: 75,
          _positionY: 50,
          _arrowsId: "n0",
          _caption: "",
          _label: "Company",
          _template: "Node",
          _date_created: [2021, 10, 22, 5, 1634928542950],
          _hash:
            "0d6123c44b81878d7d58f478fbb707dd606a2f53307c1b2f407d86ae934e6780",
          _uuid: "063e05ac-cf1f-4616-a0e9-8baf120268f3",
        },
        identity: /* Integer */ { low: 78, high: 0 },
      });
    });
    test("with labels only", () => {
      const result: Node[] = enode.findParticipatingNodes({
        labels: ["Company"],
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        labels: ["Company"],
        properties: {
          NAME: "Company A",
          INCORPORATION_DATE: "2012-01-01",
          _positionX: 75,
          _positionY: 50,
          _arrowsId: "n0",
          _caption: "",
          _label: "Company",
          _template: "Node",
          _date_created: [2021, 10, 22, 5, 1634928542950],
          _hash:
            "0d6123c44b81878d7d58f478fbb707dd606a2f53307c1b2f407d86ae934e6780",
          _uuid: "063e05ac-cf1f-4616-a0e9-8baf120268f3",
        },
        identity: /* Integer */ { low: 78, high: 0 },
      });
    });
    test("with props only", () => {
      const result: Node[] = enode.findParticipatingNodes({
        properties: { NAME: "Company A", INCORPORATION_DATE: "2012-01-01" },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        labels: ["Company"],
        properties: {
          NAME: "Company A",
          INCORPORATION_DATE: "2012-01-01",
          _positionX: 75,
          _positionY: 50,
          _arrowsId: "n0",
          _caption: "",
          _label: "Company",
          _template: "Node",
          _date_created: [2021, 10, 22, 5, 1634928542950],
          _hash:
            "0d6123c44b81878d7d58f478fbb707dd606a2f53307c1b2f407d86ae934e6780",
          _uuid: "063e05ac-cf1f-4616-a0e9-8baf120268f3",
        },
        identity: /* Integer */ { low: 78, high: 0 },
      });
    });
  });
});
