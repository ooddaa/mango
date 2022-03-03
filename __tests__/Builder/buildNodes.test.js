/* @flow */

import {
  Builder,
  Node,
  NodeCandidate,
  isNode,
  IdArray,
  Result,
  Success,
  Failure,
  log,
} from "../../src";

import cloneDeep from "lodash/cloneDeep";

const builder = new Builder();

describe("buildNodes()", () => {
  describe("validations", () => {
    test("no argument", async () => {
      const result = builder.buildNodes();
      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toBeInstanceOf(Failure);
      expect(result[0]).toMatchObject({
        reason: `Builder.buildNodes: Validation Error:\n. Falsy first argument. See parameters.`,
      });
    });
    test("argument not array", async () => {
      const result = builder.buildNodes({});
      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toBeInstanceOf(Failure);
      expect(result[0]).toMatchObject({
        reason: `Builder.buildNodes: Validation Error:\nFirst argument was not an Array. See parameters.`,
        parameters: { firstArgument: {} },
      });
    });
    test("only NodeCandidate[] are allowed", async () => {
      const result = builder.buildNodes([1, "2", null, true]);
      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toBeInstanceOf(Failure);
      expect(result[0]).toMatchObject({
        data: undefined,
        parameters: {
          firstArgument: [1, "2", null, true],
        },
        reason: `Builder.buildNodes: Validation Error:\nFirst argument must be NodeCandidate[] || EnhancedNodeCandidate[]. See parameters.`,
      });
    });
  });

  describe("implicit/explicit templates", () => {
    test("no template supplied, should default to Node", async () => {
      const nodeObj = new NodeCandidate({
        labels: ["nonexisting"],
        properties: {
          required: {
            NAME: "Jon",
            SURNAME: "Doe",
          },
          optional: {
            toys: "cars",
          },
          _private: {
            _uuid: "123abc",
          },
        },
        identity: 186,
      });
      /* must apply appropriate template and return Result */
      const [result, ...rest]: [Result, Result[]] = builder.buildNodes([
        nodeObj,
      ]);

      expect(result).toBeInstanceOf(Success);
      expect(result.data).toMatchObject({
        labels: ["nonexisting"],
        properties: {
          NAME: "Jon",
          SURNAME: "Doe",
          toys: "cars",
          _uuid: "123abc",
          _label: "nonexisting",
          _hash: expect.any(String),
        },
      });
    });
    test("should keep user supplied labels and indicate _template", async () => {
      const nodeObj = new NodeCandidate({
        labels: ["nonexisting"],
        properties: {
          required: {
            NAME: "Jon",
            SURNAME: "Doe",
            SEX: "Male",
          },
          optional: {
            toys: "cars",
          },
          _private: {
            _uuid: "123abc",
          },
        },
        identity: 186,
      });
      /* must apply appropriate template and return Result */
      const [result]: Result = builder.buildNodes([nodeObj], {
        template: "TestNode",
      });

      expect(result).toBeInstanceOf(Success);
      expect(result.data).toMatchObject({
        labels: ["nonexisting"], // shows that TestNode template has been used
        properties: {
          NAME: "Jon",
          SURNAME: "Doe",
          SEX: "Male",
          toys: "cars",
          _template: "TestNode",
          _uuid: "123abc",
          _label: "nonexisting",
          _hash: expect.any(String),
        },
      });
    });
    test("default template - Node, no labels", async () => {
      const nodeObj = new NodeCandidate({
        labels: [],
        properties: {
          required: {
            NAME: "Jon",
            SURNAME: "Doe",
            SEX: "Male",
          },
          optional: {
            toys: "cars",
          },
          _private: {
            _uuid: "123abc",
          },
        },
        identity: 186,
      });
      /* must apply appropriate template and return Result */
      const [result]: Result = builder.buildNodes([nodeObj]);

      expect(result).toBeInstanceOf(Success);
      expect(result.data).toMatchObject({
        labels: [],
        properties: {
          NAME: "Jon",
          SURNAME: "Doe",
          SEX: "Male",
          toys: "cars",
          _uuid: "123abc",
          _label: null,
          _hash: expect.any(String),
        },
      });
    });
  });

  describe("TestNode", async () => {
    const nodeObj = new NodeCandidate({
      labels: ["TestNode"],
      properties: {
        required: {
          NAME: "Jon",
          SURNAME: "Doe",
          SEX: "Male",
        },
        optional: {
          toys: "cars",
        },
        _private: {
          _uuid: "123abc",
        },
      },
      identity: 186,
    });
    test("buildNodes() all props/values ok", async () => {
      const [result]: Result = builder.buildNodes([nodeObj]);

      expect(result).toBeInstanceOf(Success);
      expect(result.data).toMatchObject({
        labels: ["TestNode"],
        properties: {
          NAME: "Jon",
          SURNAME: "Doe",
          SEX: "Male",
          toys: "cars",
          _uuid: "123abc",
          _label: "TestNode",
          _hash: expect.any(String),
        },
      });
    });
    test("buildNodes() one req prop missing", async () => {
      const nodeObj_ = nodeObj.getCoreNode();
      delete nodeObj_.properties.required.SEX;
      const nodeObj_mp = new NodeCandidate(nodeObj_);
      // log(nodeObj_mp)
      const [result, ...rest]: [Result, Result[]] = builder.buildNodes(
        [nodeObj_mp],
        { template: "TestNode" }
      );

      expect(result).toBeInstanceOf(Failure);
      expect(result.data).toEqual(
        expect.arrayContaining([
          [
            {
              valid: true,
              expected: "NAME",
              received: "NAME",
              type: "required",
            },
            {
              valid: true,
              expected: { constructor: "String", example: "Jon" },
              received: { constructor: "String", value: "Jon" },
            },
          ],
          [
            {
              valid: true,
              expected: "SURNAME",
              received: "SURNAME",
              type: "required",
            },
            {
              valid: true,
              expected: { constructor: "String", example: "Doe" },
              received: { constructor: "String", value: "Doe" },
            },
          ],
          [
            { valid: false, expected: "SEX", received: "", type: "required" },
            {
              valid: false,
              expected: { constructor: "String", example: "Male" },
              received: { constructor: undefined, value: undefined },
            },
          ],
        ])
      );
    });
  });

  describe("Transaction", () => {
    /* someObject comes from user */
    const candidate_ok = new NodeCandidate({
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
    });
    const candidate_not_ok = new NodeCandidate({
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
          PAYOR_TYPE: "LegalPerson",
          PAYEE_TYPE: "LegalPerson",
          // PAYMENT_REFERENCE: 'abc'
        },
        optional: {
          notes: "such and such transaction",
          date_received: [2018, 8, 30, 4, 123],
        },
      },
    });
    const candidate_values_not_ok = new NodeCandidate({
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
    });
    const candidate_keys_and_values_not_ok = new NodeCandidate({
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
    });
    test("buildNodes() properties not ok", async () => {
      /* must apply appropriate template and return Result */
      const [result]: Result = builder.buildNodes([candidate_not_ok], {
        validateOptionals: true,
        template: "Transaction",
      });
      // log(result)
      expect(result).toBeInstanceOf(Failure);

      expect(result.reason).toEqual(
        `Validator.validate: Missing required properties.`
      );
      expect(result.data).toEqual(
        expect.arrayContaining([
          [
            {
              valid: false,
              expected: "PROJECT",
              received: "",
              type: "required",
            },
            {
              valid: false,
              expected: { constructor: "String", example: "testTest" },
              received: { constructor: undefined, value: undefined },
            },
          ],
          [
            {
              valid: false,
              expected: "PAYMENT_REFERENCE",
              received: "",
              type: "required",
            },
            {
              valid: false,
              expected: { constructor: "String", example: "abc" },
              received: { constructor: undefined, value: undefined },
            },
          ],
        ])
      );
    });
    test("buildNodes() values not ok", async () => {
      /* must apply appropriate template and return Result */
      const [result]: Result = builder.buildNodes([candidate_values_not_ok], {
        validateOptionals: true,
        template: "Transaction",
      });

      expect(result).toBeInstanceOf(Failure);

      /* failure */
      expect(result.data).toEqual(
        expect.arrayContaining([
          [
            {
              valid: true,
              expected: "TOTAL_AMOUNT",
              received: "TOTAL_AMOUNT",
              type: "required",
            },
            {
              valid: false,
              expected: { constructor: "Number", example: 1000 },
              received: { constructor: undefined, value: undefined },
            },
          ],
        ])
      );
    });
    test("buildNodes() properties and values not ok", async () => {
      /* must apply appropriate template and return Result */
      const [result]: Result = builder.buildNodes(
        [candidate_keys_and_values_not_ok],
        { validateOptionals: false, template: "Transaction" }
      );

      expect(result).toBeInstanceOf(Failure);

      expect(result.reason).toEqual(
        "Validator.validate: Missing required properties. Validator.validate: Values are not validated."
      );
      expect(result.data).toEqual(
        expect.arrayContaining([
          [
            {
              valid: true,
              expected: "DATE_SENT",
              received: "DATE_SENT",
              type: "required",
            },
            {
              valid: true,
              expected: {
                constructor: "Array",
                example: [2018, 8, 27, 1, 123],
              },
              received: { constructor: "Array", value: [2018, 8, 27, 1, 123] },
            },
          ],
          [
            {
              valid: false,
              expected: "PROJECT",
              received: "",
              type: "required",
            },
            {
              valid: false,
              expected: { constructor: "String", example: "testTest" },
              received: { constructor: undefined, value: undefined },
            },
          ],
          [
            {
              valid: true,
              expected: "TOTAL_AMOUNT",
              received: "TOTAL_AMOUNT",
              type: "required",
            },
            {
              valid: false,
              expected: { constructor: "Number", example: 1000 },
              received: { constructor: undefined, value: undefined },
            },
          ],
          [
            {
              valid: true,
              expected: "SUM_AMOUNT",
              received: "SUM_AMOUNT",
              type: "required",
            },
            {
              valid: false,
              expected: { constructor: "Number", example: 900 },
              received: { constructor: "String", value: "900" },
            },
          ],
          [
            {
              valid: true,
              expected: "FEES_AMOUNT",
              received: "FEES_AMOUNT",
              type: "required",
            },
            {
              valid: true,
              expected: { constructor: "Number", example: 100 },
              received: { constructor: "Number", value: 100 },
            },
          ],
          [
            {
              valid: true,
              expected: "CURRENCY",
              received: "CURRENCY",
              type: "required",
            },
            {
              valid: true,
              expected: { constructor: "String", example: "USD" },
              received: { constructor: "String", value: "USD" },
            },
          ],
          [
            {
              valid: true,
              expected: "BANK",
              received: "BANK",
              type: "required",
            },
            {
              valid: true,
              expected: {
                constructor: "IdArray",
                example: ["Bank_A", "123", "_hash"],
              },
              received: {
                constructor: "IdArray",
                value: ["EFG", "123", "_hash"],
              },
            },
          ],
          [
            {
              valid: true,
              expected: "PAYOR",
              received: "PAYOR",
              type: "required",
            },
            {
              valid: true,
              expected: {
                constructor: "IdArray",
                example: ["Payor_A", "123", "_hash"],
              },
              received: {
                constructor: "IdArray",
                value: ["Best Ltd", "123", "_hash"],
              },
            },
          ],
          [
            {
              valid: true,
              expected: "PAYEE",
              received: "PAYEE",
              type: "required",
            },
            {
              valid: true,
              expected: {
                constructor: "IdArray",
                example: ["Payee_A", "123", "_hash"],
              },
              received: {
                constructor: "IdArray",
                value: ["All Stars LLC", "123", "_hash"],
              },
            },
          ],
          [
            {
              valid: false,
              expected: "PAYMENT_REFERENCE",
              received: "",
              type: "required",
            },
            {
              valid: false,
              expected: { constructor: "String", example: "abc" },
              received: { constructor: undefined, value: undefined },
            },
          ],
          [
            {
              valid: true,
              expected: "PAYOR_TYPE",
              received: "PAYOR_TYPE",
              type: "required",
            },
            {
              valid: true,
              expected: { constructor: "String", example: "Person" },
              received: { constructor: "String", value: "LegalPerson" },
            },
          ],
          [
            {
              valid: true,
              expected: "PAYEE_TYPE",
              received: "PAYEE_TYPE",
              type: "required",
            },
            {
              valid: true,
              expected: { constructor: "String", example: "Person" },
              received: { constructor: "String", value: "LegalPerson" },
            },
          ],
        ])
      );
    });
    test("buildNodes() properties and values all ok", async () => {
      /* must apply appropriate template and return Result */
      const [result]: Result = builder.buildNodes([candidate_ok], {
        template: "Transaction",
      });

      expect(result).toBeInstanceOf(Success);

      /* success */
      const node_ok = result.data;
      expect(node_ok).toBeInstanceOf(Node);
      expect(node_ok).toMatchObject({
        labels: [/* '_UPDATED', '_COMPLETE', '_UNVERIFIED',  */ "Transaction"],
        properties: {
          ...candidate_ok.getCoreNode().properties.required,
          ...candidate_ok.getCoreNode().properties.optional,
          _date_created: [
            expect.any(Number),
            expect.any(Number),
            expect.any(Number),
            expect.any(Number),
            expect.any(Number),
          ],
          _hash: expect.any(String),
          _label: "Transaction",
          notes: "such and such transaction",
        },
      });
    });
    test("buildNodes() multiple nodes, mixed Results", async () => {
      /* must apply appropriate template and return Result[] */
      const [first, second, third, fourth]: Result[] = builder.buildNodes(
        [
          candidate_ok,
          candidate_not_ok,
          candidate_values_not_ok,
          candidate_keys_and_values_not_ok,
        ],
        { template: "Transaction" }
      );

      /* first */
      expect(first).toBeInstanceOf(Success);
      expect(first.data).toMatchObject({
        labels: ["Transaction"],
        properties: {
          ...candidate_ok.getCoreNode().properties.required,
          ...candidate_ok.getCoreNode().properties.optional,
          _date_created: [
            expect.any(Number),
            expect.any(Number),
            expect.any(Number),
            expect.any(Number),
            expect.any(Number),
          ],
          _hash: expect.any(String),
          _label: "Transaction",
          notes: "such and such transaction",
        },
      });

      /* second */
      expect(second).toBeInstanceOf(Failure);

      /* third */
      expect(third).toBeInstanceOf(Failure);

      /* fourth */
      expect(fourth).toBeInstanceOf(Failure);
    });
  });

  describe("nodes with multiple labels", () => {
    const labels = ["Label1", "Label2"];
    const nodeObj = new NodeCandidate({
      labels,
      properties: {
        required: {
          NAME: "Jon",
          SURNAME: "Doe",
          SEX: "Male",
        },
        optional: {
          toys: "cars",
        },
        _private: {
          _uuid: "123abc",
        },
      },
      identity: 186,
    });

    test("two labels", () => {
      const rv: Result[] = builder.buildNodes([nodeObj]);
      const node = rv[0].getData();

      // labels
      expect(node.getLabels()).toEqual(labels);

      // _label
      expect(node.getProperty("_label")).toEqual(labels.join("|"));

      // _labels
      expect(node.getProperty("_labels")).toEqual(labels);
    });
  });
});

test("should not add _uuid", async () => {
  const results: Result[] = builder.buildNodes([
    new NodeCandidate({
      labels: ["A"],
      properties: {
        required: {
          NAME: "A",
          VALUE: 1,
        },
      },
    }),
  ]);
  const node = results[0].getData();
  expect(isNode(node)).toEqual(true);
  expect(node.properties._uuid).toEqual(undefined);
});
