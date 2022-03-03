/* @flow */

import {
  Builder,
  Node,
  EnhancedNode,
  EnhancedNodeCandidate,
  Relationship,
  isRelationship,
  RelationshipCandidate,
  IdArray,
  Result,
  Success,
  Failure,
  log,
  NodeCandidate,
  isSuccess,
  isFailure,
  isEnhancedNode,
} from "../../src";

import keys from "lodash/keys";
import isArray from "lodash/isArray";
import clondeDeep from "lodash/cloneDeep";
import { Transaction } from "../../src/Builder/templates/Transaction";

const builder = new Builder();
const candidate_ok = new EnhancedNodeCandidate(
  new NodeCandidate({
    labels: ["Transaction"],
    properties: {
      required: {
        DATE_SENT: [2018, 8, 27, 1, 123],
        PROJECT: "testTest",
        TOTAL_AMOUNT: 1000,
        SUM_AMOUNT: 900,
        FEES_AMOUNT: 100,
        CURRENCY: "USD",
        BANK: new IdArray(["EFG", "123", "_hash"]),
        PAYOR: new IdArray(["Best Ltd", "123", "_hash"]),
        PAYEE: new IdArray(["All Stars LLC", "123", "_hash"]),
        PAYOR_TYPE: "LegalPerson",
        PAYEE_TYPE: "LegalPerson",
        PAYMENT_REFERENCE: "abc",
      },
      optional: {
        notes: "such and such transaction",
        date_received: [2018, 8, 30, 4, 123],
      },
    },
  })
);
const candidate_not_ok = new EnhancedNodeCandidate(
  new NodeCandidate({
    labels: ["Transaction"],
    properties: {
      required: {
        DATE_SENT: [2018, 8, 27, 1, 123],
        // PROJECT: 'testTest',
        TOTAL_AMOUNT: 1000,
        SUM_AMOUNT: 900,
        FEES_AMOUNT: 100,
        CURRENCY: "USD",
        BANK: new IdArray(["EFG", "123", "_hash"]),
        PAYOR: new IdArray(["Best Ltd", "123", "_hash"]),
        PAYEE: new IdArray(["All Stars LLC", "123", "_hash"]),
        // PAYMENT_REFERENCE: 'abc'
      },
      optional: {
        notes: "such and such transaction",
        date_received: [2018, 8, 30, 4, 123],
      },
    },
  })
);
const candidate2_not_ok = new EnhancedNodeCandidate(
  new NodeCandidate({
    labels: ["Transaction"],
    properties: {
      required: {
        DATE_SENT: [2020, 8, 27, 1, 456],
        // PROJECT: 'testTest',
        TOTAL_AMOUNT: 456,
        SUM_AMOUNT: 455,
        FEES_AMOUNT: 1,
        CURRENCY: "EUR",
        BANK: new IdArray(["UBS", "456", "_hash2"]),
        PAYOR: new IdArray(["LOL Ltd", "456", "_hash2"]),
        PAYEE: new IdArray(["Real Madrid", "456", "_hash2"]),
      },
      optional: {
        notes: "also such and such transaction",
        date_received: [2020, 8, 27, 1, 123],
      },
    },
  })
);
const candidate_values_not_ok = new EnhancedNodeCandidate(
  new NodeCandidate({
    labels: ["Transaction"],
    properties: {
      required: {
        DATE_SENT: [2018, 8, 27, 1, 123],
        PROJECT: "testTest",
        TOTAL_AMOUNT: undefined,
        SUM_AMOUNT: 900,
        FEES_AMOUNT: 100,
        CURRENCY: "USD",
        BANK: new IdArray(["EFG", "123", "_hash"]),
        PAYOR: new IdArray(["Best Ltd", "123", "_hash"]),
        PAYEE: new IdArray(["All Stars LLC", "123", "_hash"]),
        PAYOR_TYPE: "LegalPerson",
        PAYEE_TYPE: "LegalPerson",
        PAYMENT_REFERENCE: "abc",
      },
      optional: {
        notes: "such and such transaction",
        date_received: [2018, 8, 30, 4, 123],
      },
    },
  })
);
const candidate_keys_and_values_not_ok = new EnhancedNodeCandidate(
  new NodeCandidate({
    labels: ["Transaction"],
    properties: {
      required: {
        DATE_SENT: [2018, 8, 27, 1, 123],
        // PROJECT: 'testTest',
        TOTAL_AMOUNT: undefined,
        SUM_AMOUNT: "900",
        FEES_AMOUNT: 100,
        CURRENCY: "USD",
        BANK: new IdArray(["EFG", "123", "_hash"]),
        PAYOR: new IdArray(["Best Ltd", "123", "_hash"]),
        PAYEE: new IdArray(["All Stars LLC", "123", "_hash"]),
        PAYOR_TYPE: "LegalPerson",
        PAYEE_TYPE: "LegalPerson",
        // PAYMENT_REFERENCE: 'abc'
      },
      optional: {
        notes: "such and such transaction",
        date_received: [2018, 8, 30, 4, 123],
      },
    },
  })
);
const candidate_misspelled_key = new EnhancedNodeCandidate(
  new NodeCandidate({
    labels: ["Transaction"],
    properties: {
      required: {
        DATE_SEND: [2018, 8, 27, 1, 123], // legendary bug! DATE_SENT -> DATE_SEND
        // DATE_SENT: [2018, 8, 27, 1, 123],
        PROJECT: "testTest",
        TOTAL_AMOUNT: 1000,
        SUM_AMOUNT: 900,
        FEES_AMOUNT: 100,
        CURRENCY: "USD",
        BANK: new IdArray(["EFG", "123", "_hash"]),
        PAYOR: new IdArray(["Best Ltd", "123", "_hash"]),
        PAYEE: new IdArray(["All Stars LLC", "123", "_hash"]),
        PAYOR_TYPE: "LegalPerson",
        PAYEE_TYPE: "LegalPerson",
        PAYMENT_REFERENCE: "abc",
      },
      optional: {
        notes: "such and such transaction",
        date_received: [2018, 8, 30, 4, 123],
      },
    },
  })
);
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

describe("validations: takes EnhancedNodeCandidate as input", () => {
  test("empty", () => {
    const result = builder.buildEnhancedNodes();
    expect(isArray(result)).toEqual(true);
    expect(isFailure(result[0])).toEqual(true);

    expect(result[0].reason).toEqual(
      `Builder.buildEnhancedNodes: Validation Error:\n. Missing first argument. See parameters.`
    );
  });
  test("first argument not Array", () => {
    const result = builder.buildEnhancedNodes("lol");
    expect(isArray(result)).toEqual(true);
    expect(isFailure(result[0])).toEqual(true);

    expect(result[0].reason).toEqual(
      `Builder.buildEnhancedNodes: Validation Error:\nFirst argument was not an Array. See parameters.`
    );
  });
  test("first argument is empty Array", () => {
    const result = builder.buildEnhancedNodes([]);
    expect(isArray(result)).toEqual(true);
    expect(isFailure(result[0])).toEqual(true);

    expect(result[0].reason).toEqual(
      `Builder.buildEnhancedNodes: Validation Error:\nFirst argument was an empty Array. Nothing to work with. See parameters.`
    );
  });
  test("must be EnhancedNodeCandidate", () => {
    const result = builder.buildEnhancedNodes([{}]);
    expect(isArray(result)).toEqual(true);
    expect(isFailure(result[0])).toEqual(true);

    expect(result[0].reason).toEqual(
      `Builder.buildEnhancedNodes: Validation Error:\nFirst argument must be EnhancedNodeCandidate[]. See parameters.`
    );
  });
});
describe("output", () => {
  describe("stopAfterCoreNodes", () => {
    test("all ok", async () => {
      const [cand1, cand2]: [
        EnhancedNodeCandidate,
        EnhancedNodeCandidate
      ] = builder.buildEnhancedNodes([candidate_ok, candidate_ok], {
        stopAfterCoreNodes: true,
      });

      expect(cand1).toBeInstanceOf(EnhancedNodeCandidate);
      expect(cand1.getCoreNode()).toBeInstanceOf(Node);

      expect(cand2).toBeInstanceOf(EnhancedNodeCandidate);
      expect(cand2.getCoreNode()).toBeInstanceOf(Node);
    });
    test("bad candidate", async () => {
      const [cand1, cand2]: [EnhancedNodeCandidate, EnhancedNodeCandidate] =
        // builder.buildEnhancedNodes([candidate_not_ok, candidate_not_ok], { // Interesting, this won't work even if we const arr = cloneDeep(arr_) in buildEnhancedNodes
        builder.buildEnhancedNodes(
          [candidate_not_ok, clondeDeep(candidate_not_ok)],
          {
            stopAfterCoreNodes: true,
            template: "Transaction",
          }
        );

      expect(cand1).toBeInstanceOf(EnhancedNodeCandidate);
      expect(cand1.getCoreNode()).toBeInstanceOf(Failure);
      expect(cand1.getCoreNode().reason).toEqual(
        "Validator.validate: Missing required properties."
      );

      // Failure's parameters contain NC as node, its template (Transaction)
      expect(keys(cand1.getCoreNode().parameters)).toEqual([
        "node",
        "template",
      ]);
      expect(cand1.getCoreNode().parameters.template).toBeInstanceOf(
        Transaction
      );
      // @todo Failure.data = ValidationResult[] @todo

      expect(cand2).toBeInstanceOf(EnhancedNodeCandidate);
      expect(cand2.getCoreNode()).toBeInstanceOf(Failure);
      expect(cand2.getCoreNode().reason).toEqual(
        "Validator.validate: Missing required properties."
      );
    });
    test("mixed case", () => {
      const [cand1, cand2]: [
        EnhancedNodeCandidate,
        EnhancedNodeCandidate
      ] = builder.buildEnhancedNodes([candidate_ok, candidate_not_ok], {
        stopAfterCoreNodes: true,
        template: "Transaction",
      });

      expect(cand1).toBeInstanceOf(EnhancedNodeCandidate);
      expect(cand1.getCoreNode()).toBeInstanceOf(Node);

      expect(cand2).toBeInstanceOf(EnhancedNodeCandidate);
      expect(cand2.getCoreNode()).toBeInstanceOf(Failure);
    });
  });
  describe("stopAfterRelNodes", () => {
    test("all ok, one ENC, default template", () => {
      const startNode = new NodeCandidate({
        labels: ["startNode"],
        properties: {
          required: { A: 1 },
        },
      });
      const endNode = new NodeCandidate({
        labels: ["endNode"],
        properties: {
          required: { B: 2 },
        },
      });
      const required = [
        new RelationshipCandidate({
          labels: ["in_rel"],
          properties: { rel_prop: 1 },
          direction: "inbound",
          necessity: "required",
          startNode,
          // endNode: clondeDeep(candidate_ok)
        }),
        new RelationshipCandidate({
          labels: ["out_rel"],
          properties: { rel_prop: 2 },
          direction: "outbound",
          necessity: "required",
          // startNode: clondeDeep(candidate_ok),
          endNode,
        }),
      ];
      const candidate_ok = new EnhancedNodeCandidate(
        new NodeCandidate({
          labels: ["candidate_ok"],
          properties: {
            required: { A: 1 },
          },
        }),
        { required }
      );

      const [cand1]: EnhancedNodeCandidate = builder.buildEnhancedNodes(
        [candidate_ok],
        {
          stopAfterRelNodes: true,
        }
      );

      expect(cand1).toBeInstanceOf(EnhancedNodeCandidate);

      const [[relNode1], [relNode2]] = cand1.getAllRelationshipNodeCandidates();
      expect(relNode1).toBeInstanceOf(Node);
      expect(relNode2).toBeInstanceOf(Node);
    });
    test("all ok, many ENCs, default template", () => {
      const startNode = new NodeCandidate({
        labels: ["startNode"],
        properties: {
          required: { A: 1 },
        },
      });
      const endNode = new NodeCandidate({
        labels: ["endNode"],
        properties: {
          required: { B: 2 },
        },
      });
      const candidate1 = new EnhancedNodeCandidate(
        new NodeCandidate({
          labels: ["default"],
          properties: {
            required: { A: 1 },
          },
        })
      );
      const req_cand1 = [
        new RelationshipCandidate({
          labels: ["in_rel"],
          properties: { rel_prop: 1 },
          direction: "inbound",
          necessity: "required",
          startNode,
          endNode: candidate1,
        }),
        new RelationshipCandidate({
          labels: ["out_rel"],
          properties: { rel_prop: 2 },
          direction: "outbound",
          necessity: "required",
          startNode: candidate1,
          endNode,
        }),
      ];
      // alternative way to add RelationshipCandidates
      candidate1.setRequiredRelationshipCandidates(req_cand1);

      const candidate2 = new EnhancedNodeCandidate(
        new NodeCandidate({
          labels: ["default"],
          properties: {
            required: { A: 2 },
          },
        }),
        {
          required: [
            new RelationshipCandidate({
              labels: ["in_rel"],
              properties: { rel_prop: 1 },
              direction: "inbound",
              necessity: "required",
              startNode,
            }),
            new RelationshipCandidate({
              labels: ["out_rel"],
              properties: { rel_prop: 2 },
              direction: "outbound",
              necessity: "required",
              endNode,
            }),
          ],
        }
      );

      const [cand1, cand2]: EnhancedNodeCandidate = builder.buildEnhancedNodes(
        [candidate1, candidate2],
        {
          stopAfterRelNodes: true,
        }
      );
      // log(cand1)
      expect(cand1).toBeInstanceOf(EnhancedNodeCandidate);
      expect(cand2).toBeInstanceOf(EnhancedNodeCandidate);

      const [[relNode1], [relNode2]] = cand1.getAllRelationshipNodeCandidates();

      expect(relNode1).toBeInstanceOf(Node);
      expect(relNode2).toBeInstanceOf(Node);

      const [[relNode3], [relNode4]] = cand2.getAllRelationshipNodeCandidates();

      expect(relNode3).toBeInstanceOf(Node);
      expect(relNode4).toBeInstanceOf(Node);
      // log(candidate1)
    });
  });
  describe("stopAfterRelationships", () => {
    test("all ok, one ENC, default template", () => {
      const startNode = new NodeCandidate({
        labels: ["startNode"],
        properties: {
          required: { A: 1 },
        },
      });
      const endNode = new NodeCandidate({
        labels: ["endNode"],
        properties: {
          required: { B: 2 },
        },
      });
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
              startNode,
            }),
            new RelationshipCandidate({
              labels: ["out_rel"],
              properties: { rel_prop: 2 },
              direction: "outbound",
              endNode,
            }),
          ],
        }
      );
      const [cand1]: [EnhancedNodeCandidate] = builder.buildEnhancedNodes(
        [candidate_ok],
        { stopAfterRelationships: true }
      );

      expect(cand1).toBeInstanceOf(EnhancedNodeCandidate);
      expect(cand1.getCoreNode()).toBeInstanceOf(Node);

      expect(cand1.getAllRelationships()).toBeInstanceOf(Array);
      expect(
        cand1
          .getAllRelationships()
          .every((rel) => isRelationship(rel) || isFailure(rel))
      ).toEqual(true);
      // log(cand1)
    });
  });
  describe("enode", () => {
    describe("required rels only", () => {
      test("default template, partnerNodes == NodeCandidates", () => {
        const node_3 = new NodeCandidate({
          labels: ["node_3"],
          properties: {
            required: { INPUT: 1 },
          },
        });

        const enode_2 = new EnhancedNodeCandidate(
          new NodeCandidate({
            labels: ["enode_2"],
            properties: {
              required: { INPUT: 0 },
            },
          }),
          {
            required: [
              new RelationshipCandidate({
                labels: ["w_1_0"],
                properties: { weight: 0 },
                startNode: node_3,
                direction: "inbound",
                necessity: "required",
              }),
              new RelationshipCandidate({
                labels: ["w_1_1"],
                properties: { weight: 0 },
                endNode: node_3,
                direction: "outbound",
                necessity: "required",
              }),
            ],
          }
        );

        const e_results: Result[] = builder.buildEnhancedNodes([
          /* enode_1, */ enode_2,
        ]);
        // log(e_results)
        expect(e_results.every(isSuccess)).toEqual(true);
        const enode = e_results[0].getData();
        expect(isEnhancedNode(enode)).toEqual(true);
        expect(enode).toMatchObject(
          /* EnhancedNode */ {
            labels: ["enode_2"],
            properties: {
              INPUT: 0,
              _label: "enode_2",
              _date_created,
              _hash,
            },
            identity: null,
            relationships: {
              inbound: [
                /* Relationship */ {
                  labels: ["w_1_0"],
                  properties: {
                    weight: 0,
                    _hash,
                    _date_created,
                  },
                  startNode: /* Node */ {
                    labels: ["node_3"],
                    properties: {
                      INPUT: 1,
                      _label: "node_3",
                      _date_created,
                      _hash,
                    },
                    identity: null,
                  },
                  endNode: /* Node */ {
                    labels: ["enode_2"],
                    properties: {
                      INPUT: 0,
                      _label: "enode_2",
                      _date_created,
                      _hash,
                    },
                    identity: null,
                  },
                  identity: null,
                  direction: "inbound",
                },
              ],
              outbound: [
                /* Relationship */ {
                  labels: ["w_1_1"],
                  properties: {
                    weight: 0,
                    _hash,
                    _date_created,
                  },
                  startNode: /* Node */ {
                    labels: ["enode_2"],
                    properties: {
                      INPUT: 0,
                      _label: "enode_2",
                      _date_created,
                      _hash,
                    },
                    identity: null,
                  },
                  endNode: /* Node */ {
                    labels: ["node_3"],
                    properties: {
                      INPUT: 1,
                      _label: "node_3",
                      _date_created,
                      _hash,
                    },
                    identity: null,
                  },
                  identity: null,
                  direction: "outbound",
                },
              ],
            },
          }
        );
      });
      test("default template, partnerNodes == EnhancedNodeCandidates, required rels only", () => {
        const node_0 = new NodeCandidate({
          labels: ["node_0"],
          properties: {
            required: { INPUT: 1 }, // omg dont forget to UpperCase, otherwise it will be treated as optional and absence of any required props, _hash won't get generated.
          },
        });

        const enode_1 = new EnhancedNodeCandidate(
          new NodeCandidate({
            labels: ["enode_1"],
            properties: {
              required: { INPUT: 0 },
            },
          }),
          {
            required: [
              new RelationshipCandidate({
                labels: ["w_0"],
                properties: { weight: 0 },
                startNode: node_0,
                direction: "inbound",
                necessity: "required",
              }),
            ],
          }
        );

        const enode_2 = new EnhancedNodeCandidate(
          new NodeCandidate({
            labels: ["enode_2"],
            properties: {
              required: { INPUT: 0 },
            },
          }),
          {
            required: [
              new RelationshipCandidate({
                labels: ["w_1_0"],
                properties: { weight: 0 },
                startNode: enode_1,
                direction: "inbound",
                necessity: "required",
              }),
            ],
          }
        );

        const e_results: Result[] = builder.buildEnhancedNodes([
          /* enode_1, */ enode_2,
        ]);
        // log(e_results)
        expect(e_results.every(isSuccess)).toEqual(true);
        expect(e_results[0].getData()).toMatchObject(
          /* EnhancedNode */ {
            labels: ["enode_2"],
            properties: {
              INPUT: 0,
              _label: "enode_2",
              _date_created,
              _hash,
            },
            identity: null,
            relationships: {
              inbound: [
                /* Relationship */ {
                  labels: ["w_1_0"],
                  properties: {
                    weight: 0,
                    _hash,
                    _date_created,
                  },
                  startNode: /* EnhancedNode */ {
                    labels: ["enode_1"],
                    properties: {
                      INPUT: 0,
                      _label: "enode_1",
                      _date_created,
                      _hash,
                    },
                    identity: null,
                    relationships: {
                      inbound: [
                        /* Relationship */ {
                          labels: ["w_0"],
                          properties: {
                            weight: 0,
                            _hash,
                            _date_created,
                          },
                          startNode: /* Node */ {
                            labels: ["node_0"],
                            properties: {
                              INPUT: 1,
                              _label: "node_0",
                              _date_created,
                              _hash,
                            },
                            identity: null,
                          },
                          endNode: /* Node */ {
                            labels: ["enode_1"],
                            properties: {
                              INPUT: 0,
                              _label: "enode_1",
                              _date_created,
                              _hash,
                            },
                            identity: null,
                          },
                          identity: null,
                          direction: "inbound",
                        },
                      ],
                      outbound: [],
                    },
                  },
                  endNode: /* Node */ {
                    labels: ["enode_2"],
                    properties: {
                      INPUT: 0,
                      _label: "enode_2",
                      _date_created,
                      _hash,
                    },
                    identity: null,
                  },
                  identity: null,
                  direction: "inbound",
                },
              ],
              outbound: [],
            },
          }
        );
      });
    });
    describe("add optional rels", () => {
      test("partnerNodes == NodeCandidates, optional rels only", () => {
        const node_3 = new NodeCandidate({
          labels: ["node_3"],
          properties: {
            required: { INPUT: 1 },
          },
        });

        const enode_2 = new EnhancedNodeCandidate(
          new NodeCandidate({
            labels: ["enode_2"],
            properties: {
              required: { INPUT: 0 },
            },
          }),
          {
            optional: [
              new RelationshipCandidate({
                labels: ["w_1_0"],
                properties: { weight: 0 },
                startNode: node_3,
                direction: "inbound",
                necessity: "optional",
              }),
              new RelationshipCandidate({
                labels: ["w_1_1"],
                properties: { weight: 0 },
                endNode: node_3,
                direction: "outbound",
                necessity: "optional",
              }),
            ],
          }
        );

        const e_results: Result[] = builder.buildEnhancedNodes([
          /* enode_1, */ enode_2,
        ]);

        expect(e_results.every(isSuccess)).toEqual(true);
        expect(e_results[0].getData()).toMatchObject(
          /* EnhancedNode */ {
            labels: ["enode_2"],
            properties: {
              INPUT: 0,
              _label: "enode_2",
              _date_created,
              _hash,
            },
            identity: null,
            relationships: {
              inbound: [
                /* Relationship */ {
                  labels: ["w_1_0"],
                  properties: {
                    weight: 0,
                    _necessity: "optional",
                    _hash,
                    _date_created,
                  },
                  startNode: /* Node */ {
                    labels: ["node_3"],
                    properties: {
                      INPUT: 1,
                      _label: "node_3",
                      _date_created,
                      _hash,
                    },
                    identity: null,
                  },
                  endNode: /* Node */ {
                    labels: ["enode_2"],
                    properties: {
                      INPUT: 0,
                      _label: "enode_2",
                      _date_created,
                      _hash,
                    },
                    identity: null,
                  },
                  identity: null,
                  direction: "inbound",
                },
              ],
              outbound: [
                /* Relationship */ {
                  labels: ["w_1_1"],
                  properties: {
                    weight: 0,
                    _necessity: "optional",
                    _hash,
                    _date_created,
                  },
                  startNode: /* Node */ {
                    labels: ["enode_2"],
                    properties: {
                      INPUT: 0,
                      _label: "enode_2",
                      _date_created,
                      _hash,
                    },
                    identity: null,
                  },
                  endNode: /* Node */ {
                    labels: ["node_3"],
                    properties: {
                      INPUT: 1,
                      _label: "node_3",
                      _date_created,
                      _hash,
                    },
                    identity: null,
                  },
                  identity: null,
                  direction: "outbound",
                },
              ],
            },
          }
        );
      });
      test("partnerNodes == EnhancedNodeCandidates, required & optional rels", () => {
        const node_0 = new NodeCandidate({
          labels: ["node_0"],
          properties: {
            required: { INPUT: 1 }, // omg dont forget to UpperCase, otherwise it will be treated as optional and absence of any required props, _hash won't get generated.
          },
        });

        const enode_1 = new EnhancedNodeCandidate(
          new NodeCandidate({
            labels: ["enode_1"],
            properties: {
              required: { INPUT: 0 },
            },
          }),
          {
            optional: [
              new RelationshipCandidate({
                labels: ["w_0"],
                properties: { weight: 0 },
                startNode: node_0,
                direction: "inbound",
                necessity: "optional",
              }),
            ],
          }
        );

        const enode_2 = new EnhancedNodeCandidate(
          new NodeCandidate({
            labels: ["enode_2"],
            properties: {
              required: { INPUT: 0 },
            },
          }),
          {
            required: [
              new RelationshipCandidate({
                labels: ["w_1_0"],
                properties: { weight: 0 },
                startNode: enode_1,
                direction: "inbound",
                necessity: "required",
              }),
            ],
          }
        );

        const e_results: Result[] = builder.buildEnhancedNodes([
          /* enode_1, */ enode_2,
        ]);
        // log(e_results)
        expect(e_results.every(isSuccess)).toEqual(true);
        expect(e_results[0].getData()).toMatchObject(
          /* EnhancedNode */ {
            labels: ["enode_2"],
            properties: {
              INPUT: 0,
              _label: "enode_2",
              _date_created,
              _hash,
            },
            identity: null,
            relationships: {
              inbound: [
                /* Relationship */ {
                  labels: ["w_1_0"],
                  properties: {
                    weight: 0,
                    _necessity: "required",
                    _hash,
                    _date_created,
                  },
                  startNode: /* EnhancedNode */ {
                    labels: ["enode_1"],
                    properties: {
                      INPUT: 0,
                      _label: "enode_1",
                      _date_created,
                      _hash,
                    },
                    identity: null,
                    relationships: {
                      inbound: [
                        /* Relationship */ {
                          labels: ["w_0"],
                          properties: {
                            weight: 0,
                            _necessity: "optional",
                            _hash,
                            _date_created,
                          },
                          startNode: /* Node */ {
                            labels: ["node_0"],
                            properties: {
                              INPUT: 1,
                              _label: "node_0",
                              _date_created,
                              _hash,
                            },
                            identity: null,
                          },
                          endNode: /* Node */ {
                            labels: ["enode_1"],
                            properties: {
                              INPUT: 0,
                              _label: "enode_1",
                              _date_created,
                              _hash,
                            },
                            identity: null,
                          },
                          identity: null,
                          direction: "inbound",
                        },
                      ],
                      outbound: [],
                    },
                  },
                  endNode: /* Node */ {
                    labels: ["enode_2"],
                    properties: {
                      INPUT: 0,
                      _label: "enode_2",
                      _date_created,
                      _hash,
                    },
                    identity: null,
                  },
                  identity: null,
                  direction: "inbound",
                },
              ],
              outbound: [],
            },
          }
        );
      });
    });
    describe("should always return Result[]", () => {
      test("unable to build enode - Failure[]", () => {
        // const candidate = new Enha
      });
    });
    describe("both rels", () => {});
  });
});
describe("edge cases", () => {
  test("accidently passed enc.isEnhanceable() == true", () => {
    const hash =
        "7d5edc56943b093d130bfecfaad2e7e6d32649612bbaa1ee974e126c1c85d4b8",
      date_created = [2020, 2, 19, 3, 1582124221818];
    const enc = new EnhancedNodeCandidate(
      new Node({
        labels: ["candidate_ok"],
        properties: {
          A: 1,
          _label: "candidate_ok",
          _date_created: date_created,
          _hash: hash,
        },
        identity: null,
      }),
      {
        required: [
          new Relationship({
            labels: ["in_rel"],
            properties: {
              rel_prop: 1,
              _hash:
                "d8b796711c0a6a2fa11aa71c9c677d3ddcaf9a0cd9894a3d803be127b5325c77",
              _date_created: [2020, 2, 19, 3, 1582124221824],
            },
            startNode: new Node({
              labels: ["startNode"],
              properties: {
                A: 1,
                _label: "startNode",
                _date_created: [2020, 2, 19, 3, 1582124221823],
                _hash:
                  "1f0bf4c43d298df991a9fbc5dbc1d743b8471cb954d7913d655c29679704d2d0",
              },
              identity: null,
            }),
            endNode: new Node({
              labels: ["candidate_ok"],
              properties: {
                A: 1,
                _label: "candidate_ok",
                _date_created: [2020, 2, 19, 3, 1582124221818],
                _hash:
                  "7d5edc56943b093d130bfecfaad2e7e6d32649612bbaa1ee974e126c1c85d4b8",
              },
              identity: null,
            }),
            identity: null,
            direction: "inbound",
          }),
          new Relationship({
            labels: ["out_rel"],
            properties: {
              rel_prop: 2,
              _hash:
                "a59767e195a568c19f23edcde2b29296fa33c0de159f5e950a6f0315be3a5d9e",
              _date_created: [2020, 2, 19, 3, 1582124221824],
            },
            startNode: new Node({
              labels: ["candidate_ok"],
              properties: {
                A: 1,
                _label: "candidate_ok",
                _date_created: [2020, 2, 19, 3, 1582124221818],
                _hash:
                  "7d5edc56943b093d130bfecfaad2e7e6d32649612bbaa1ee974e126c1c85d4b8",
              },
              identity: null,
            }),
            endNode: new Node({
              labels: ["endNode"],
              properties: {
                B: 2,
                _label: "endNode",
                _date_created: [2020, 2, 19, 3, 1582124221823],
                _hash:
                  "35c74dcb55fb78e333521ae0c39e364b917da668108b9d65aea2bcc77d07838e",
              },
              identity: null,
            }),
            identity: null,
            direction: "outbound",
          }),
        ],
      }
    );
    const result: Result[] = builder.buildEnhancedNodes([enc]);
    const enode = result[0].getData();
    expect(enode).toBeInstanceOf(EnhancedNode);

    // Node was not mutated.
    expect(enode.getHash()).toEqual(hash);
    expect(enode.getProperty("_date_created")).toEqual(date_created);
  });
  test("what happens if ENC has empty relationships", () => {
    /* It's ok. It becomes a EN with 0 relationships =) */
    const candidate_ok = new EnhancedNodeCandidate(
      new NodeCandidate({
        labels: ["candidate_ok"],
        properties: {
          required: { A: 1 },
        },
      })
    );
    const [cand1]: [EnhancedNodeCandidate] = builder.buildEnhancedNodes([
      candidate_ok,
    ]);
    expect(cand1).toBeInstanceOf(Success);
    expect(cand1.getData()).toBeInstanceOf(EnhancedNode);
  });
  // test('some spanners into works', async () => {})
});
