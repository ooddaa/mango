/* @flow */
'use strict';
// [2020-01-16] ok

import {
  Validator,
  Transaction /* transactionObject as tr, */,
  IdArray,
  Success,
  Failure,
  log
} from "../src";

import cloneDeep from "lodash/cloneDeep";

const tr = {
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
      PAYOR: new IdArray(["Best Ltd", "123", "_hash"]), // at first do (Tr)-[:PAYOR]->(Beneficiary_Type), then (Tr)-[:from_account]->(BankAccount)-[:BENEFICIARY]->(Beneficiary_Type)
      PAYEE: new IdArray(["All Stars LLC", "123", "_hash"]), // at first do (Tr)-[:PAYEE]->(Beneficiary_Type), then (Tr)-[:to_account]->(BankAccount)-[:BENEFICIARY]->(Beneficiary_Type)
      PAYMENT_REFERENCE: "abc",
      PAYOR_TYPE: "LegalPerson",
      PAYEE_TYPE: "LegalPerson"
    },
    optional: {
      notes: "such and such transaction",
      date_received: [2018, 8, 27, 1, 123]
      // from_account: [], // (Tr)-[:FROM_ACCOUNT]->(Account) ideally IBAN, for K2 == NICKNAME
      // to_account: [] // (Tr)-[:TO_ACCOUNT]->(Account)
    }
    // _private: {
    //   _source: '_authoritative_source' // for data linage tracing as per BCBS 239
    // }
  }
};

describe("use cases", () => {
  test("ERROR, no arguments", () => {
    expect(() => {
      new Validator().validate()
    })
      // .toThrowError(new Error(`TypeError: Template is not a constructor`))
      .toThrow()
  })
  test("ERROR, no node", () => {
    expect(() => {
      new Validator(undefined, Transaction).validate()
    })
      .toThrowError(new Error(
        `Validator._createValidationArray(): (!node || !node.properties || !node.properties.required) - cannot reach required properties.\nnode: undefined`))
  })
  test("required prop missing - PROJECT", () => {
    const transaction = cloneDeep(tr);
    delete transaction.properties.required.PROJECT;

    const result = new Validator(
      transaction,
      Transaction
    ).getValidationArray();
    expect(result).toBeInstanceOf(Failure);
    expect(result.data).toEqual(
      expect.arrayContaining([
        [
          {
            valid: true,
            expected: "DATE_SENT",
            received: "DATE_SENT",
            type: "required"
          },
          {
            valid: true,
            expected: { constructor: "Array", example: [2018, 8, 27, 1, 123] },
            received: { constructor: "Array", value: [2018, 8, 27, 1, 123] }
          }
        ],
        [
          {
            valid: false,
            expected: "PROJECT",
            received: "",
            type: "required"
          },
          {
            valid: false,
            expected: { constructor: "String", example: "testTest" },
            received: { constructor: undefined, value: undefined }
          }
        ]
      ])
    );
  });
  test("wrong value - SUM_AMOUNT", () => {
    const transaction = cloneDeep(tr);
    transaction.properties.required.SUM_AMOUNT = "abc";

    const result = new Validator(
      transaction,
      Transaction
    ).getValidationArray();

    expect(result).toBeInstanceOf(Failure);
    expect(result.data).toEqual(
      expect.arrayContaining([
        [
          {
            valid: true,
            expected: "SUM_AMOUNT",
            received: "SUM_AMOUNT",
            type: "required"
          },
          {
            valid: false,
            expected: { constructor: "Number", example: 900 },
            received: { constructor: "String", value: "abc" }
          }
        ]
      ])
    );
  });
  test("wrong value - TOTAL_AMOUNT is undefined", () => {
    const transaction = cloneDeep(tr);
    transaction.properties.required.TOTAL_AMOUNT = undefined;

    const result = new Validator(
      transaction,
      Transaction
    ).getValidationArray();

    expect(result).toBeInstanceOf(Failure);
    expect(result.data).toEqual(
      expect.arrayContaining([
        [
          {
            valid: true,
            expected: "TOTAL_AMOUNT",
            received: "TOTAL_AMOUNT",
            type: "required"
          },
          {
            valid: false,
            expected: { constructor: "Number", example: 1000 },
            received: { constructor: undefined, value: undefined }
          }
        ]
      ])
    );
  });
  test("wrong value - TOTAL_AMOUNT is NaN", () => {
    const transaction = cloneDeep(tr);
    transaction.properties.required.TOTAL_AMOUNT = NaN;

    const result = new Validator(
      transaction,
      Transaction
    ).getValidationArray();

    expect(result).toBeInstanceOf(Failure);
    expect(result.data).toEqual(
      expect.arrayContaining([
        [
          {
            valid: true,
            expected: "TOTAL_AMOUNT",
            received: "TOTAL_AMOUNT",
            type: "required"
          },
          {
            valid: false,
            expected: { constructor: "Number", example: 1000 },
            received: { constructor: "Number", value: NaN }
          }
        ]
      ])
    );
  });
  test("wrong value - TOTAL_AMOUNT is null", () => {
    const transaction = cloneDeep(tr);
    transaction.properties.required.TOTAL_AMOUNT = null;

    const result = new Validator(
      transaction,
      Transaction
    ).getValidationArray();

    expect(result).toBeInstanceOf(Failure);
    expect(result.data).toEqual(
      expect.arrayContaining([
        [
          {
            valid: true,
            expected: "TOTAL_AMOUNT",
            received: "TOTAL_AMOUNT",
            type: "required"
          },
          {
            valid: false,
            expected: { constructor: "Number", example: 1000 },
            received: { constructor: "Object", value: null }
          }
        ]
      ])
    );
  });
  test("extra required prop", () => {
    const transaction = cloneDeep(tr);
    transaction.properties.required.EXTRA = "extra";

    const result = new Validator(
      transaction,
      Transaction
    ).getValidationArray();

    expect(result).toBeInstanceOf(Failure);
    expect(result.data).toEqual(
      expect.arrayContaining([
        [
          {
            valid: true,
            expected: "DATE_SENT",
            received: "DATE_SENT",
            type: "required"
          },
          {
            valid: true,
            expected: { constructor: "Array", example: [2018, 8, 27, 1, 123] },
            received: { constructor: "Array", value: [2018, 8, 27, 1, 123] }
          }
        ],
        [
          {
            valid: true,
            expected: "PROJECT",
            received: "PROJECT",
            type: "required"
          },
          {
            valid: true,
            expected: { constructor: "String", example: "testTest" },
            received: { constructor: "String", value: "testTest" }
          }
        ],
        [
          {
            valid: true,
            expected: "TOTAL_AMOUNT",
            received: "TOTAL_AMOUNT",
            type: "required"
          },
          {
            valid: true,
            expected: { constructor: "Number", example: 1000 },
            received: { constructor: "Number", value: 1000 }
          }
        ],
        [
          {
            valid: true,
            expected: "SUM_AMOUNT",
            received: "SUM_AMOUNT",
            type: "required"
          },
          {
            valid: true,
            expected: { constructor: "Number", example: 900 },
            received: { constructor: "Number", value: 900 }
          }
        ],
        [
          {
            valid: true,
            expected: "FEES_AMOUNT",
            received: "FEES_AMOUNT",
            type: "required"
          },
          {
            valid: true,
            expected: { constructor: "Number", example: 100 },
            received: { constructor: "Number", value: 100 }
          }
        ],
        [
          {
            valid: true,
            expected: "CURRENCY",
            received: "CURRENCY",
            type: "required"
          },
          {
            valid: true,
            expected: { constructor: "String", example: "USD" },
            received: { constructor: "String", value: "USD" }
          }
        ],
        [
          {
            valid: true,
            expected: "BANK",
            received: "BANK",
            type: "required"
          },
          {
            valid: true,
            expected: {
              constructor: "IdArray",
              example: ["Bank_A", "123", "_hash"]
            },
            received: { constructor: "IdArray", value: ["EFG", "123", "_hash"] }
          }
        ],
        [
          {
            valid: true,
            expected: "PAYOR",
            received: "PAYOR",
            type: "required"
          },
          {
            valid: true,
            expected: {
              constructor: "IdArray",
              example: ["Payor_A", "123", "_hash"]
            },
            received: {
              constructor: "IdArray",
              value: ["Best Ltd", "123", "_hash"]
            }
          }
        ],
        [
          {
            valid: true,
            expected: "PAYEE",
            received: "PAYEE",
            type: "required"
          },
          {
            valid: true,
            expected: {
              constructor: "IdArray",
              example: ["Payee_A", "123", "_hash"]
            },
            received: {
              constructor: "IdArray",
              value: ["All Stars LLC", "123", "_hash"]
            }
          }
        ],
        [
          {
            valid: true,
            expected: "PAYMENT_REFERENCE",
            received: "PAYMENT_REFERENCE",
            type: "required"
          },
          {
            valid: true,
            expected: { constructor: "String", example: "abc" },
            received: { constructor: "String", value: "abc" }
          }
        ],
        [
          {
            valid: true,
            expected: "PAYOR_TYPE",
            received: "PAYOR_TYPE",
            type: "required"
          },
          {
            valid: true,
            expected: { constructor: "String", example: "Person" },
            received: { constructor: "String", value: "LegalPerson" }
          }
        ],
        [
          {
            valid: true,
            expected: "PAYEE_TYPE",
            received: "PAYEE_TYPE",
            type: "required"
          },
          {
            valid: true,
            expected: { constructor: "String", example: "Person" },
            received: { constructor: "String", value: "LegalPerson" }
          }
        ],
        [
          {
            valid: false,
            expected: "",
            received: "EXTRA",
            type: "not_required"
          },
          {
            valid: false,
            expected: { constructor: undefined, example: undefined },
            received: { constructor: "String", value: "extra" }
          }
        ]
      ])
    );
  });
  test("mix req prop missing/wrong values/extra keys", () => {
    const transaction = cloneDeep(tr);
    delete transaction.properties.required.PROJECT;
    transaction.properties.required.SUM_AMOUNT = "abc";
    transaction.properties.required.TOTAL_AMOUNT = undefined;
    transaction.properties.required.EXTRA = "extra";

    const result = new Validator(
      transaction,
      Transaction
    ).getValidationArray();

    expect(result).toBeInstanceOf(Failure);
    expect(result.data).toEqual(
      expect.arrayContaining([
        [
          {
            valid: true,
            expected: "DATE_SENT",
            received: "DATE_SENT",
            type: "required"
          },
          {
            valid: true,
            expected: { constructor: "Array", example: [2018, 8, 27, 1, 123] },
            received: { constructor: "Array", value: [2018, 8, 27, 1, 123] }
          }
        ],
        [
          {
            valid: false,
            expected: "PROJECT",
            received: "",
            type: "required"
          },
          {
            valid: false,
            expected: { constructor: "String", example: "testTest" },
            received: { constructor: undefined, value: undefined }
          }
        ],
        [
          {
            valid: true,
            expected: "TOTAL_AMOUNT",
            received: "TOTAL_AMOUNT",
            type: "required"
          },
          {
            valid: false,
            expected: { constructor: "Number", example: 1000 },
            received: { constructor: undefined, value: undefined }
          }
        ],
        [
          {
            valid: true,
            expected: "SUM_AMOUNT",
            received: "SUM_AMOUNT",
            type: "required"
          },
          {
            valid: false,
            expected: { constructor: "Number", example: 900 },
            received: { constructor: "String", value: "abc" }
          }
        ],
        [
          {
            valid: true,
            expected: "FEES_AMOUNT",
            received: "FEES_AMOUNT",
            type: "required"
          },
          {
            valid: true,
            expected: { constructor: "Number", example: 100 },
            received: { constructor: "Number", value: 100 }
          }
        ],
        [
          {
            valid: true,
            expected: "CURRENCY",
            received: "CURRENCY",
            type: "required"
          },
          {
            valid: true,
            expected: { constructor: "String", example: "USD" },
            received: { constructor: "String", value: "USD" }
          }
        ],
        [
          {
            valid: true,
            expected: "BANK",
            received: "BANK",
            type: "required"
          },
          {
            valid: true,
            expected: {
              constructor: "IdArray",
              example: ["Bank_A", "123", "_hash"]
            },
            received: { constructor: "IdArray", value: ["EFG", "123", "_hash"] }
          }
        ],
        [
          {
            valid: true,
            expected: "PAYOR",
            received: "PAYOR",
            type: "required"
          },
          {
            valid: true,
            expected: {
              constructor: "IdArray",
              example: ["Payor_A", "123", "_hash"]
            },
            received: {
              constructor: "IdArray",
              value: ["Best Ltd", "123", "_hash"]
            }
          }
        ],
        [
          {
            valid: true,
            expected: "PAYEE",
            received: "PAYEE",
            type: "required"
          },
          {
            valid: true,
            expected: {
              constructor: "IdArray",
              example: ["Payee_A", "123", "_hash"]
            },
            received: {
              constructor: "IdArray",
              value: ["All Stars LLC", "123", "_hash"]
            }
          }
        ],
        [
          {
            valid: true,
            expected: "PAYMENT_REFERENCE",
            received: "PAYMENT_REFERENCE",
            type: "required"
          },
          {
            valid: true,
            expected: { constructor: "String", example: "abc" },
            received: { constructor: "String", value: "abc" }
          }
        ],
        [
          {
            valid: true,
            expected: "PAYOR_TYPE",
            received: "PAYOR_TYPE",
            type: "required"
          },
          {
            valid: true,
            expected: { constructor: "String", example: "Person" },
            received: { constructor: "String", value: "LegalPerson" }
          }
        ],
        [
          {
            valid: true,
            expected: "PAYEE_TYPE",
            received: "PAYEE_TYPE",
            type: "required"
          },
          {
            valid: true,
            expected: { constructor: "String", example: "Person" },
            received: { constructor: "String", value: "LegalPerson" }
          }
        ],
        [
          {
            valid: false,
            expected: "",
            received: "EXTRA",
            type: "not_required"
          },
          {
            valid: false,
            expected: { constructor: undefined, example: undefined },
            received: { constructor: "String", value: "extra" }
          }
        ]
      ])
    );
  });
});
describe("methods", () => {
  // [2020-01-08] ok
  test("getValidationArray", () => {
    const transaction = cloneDeep(tr);
    const result = new Validator(
      transaction,
      Transaction
    ).getValidationArray();

    // validation is successful
    expect(result).toBeInstanceOf(Success);

    // original node is available in Result.parameters
    expect(result.parameters.node).toMatchObject(transaction);

    // validationArray is available in Result.data
    expect(result.data).toEqual(
      expect.arrayContaining([
        [
          {
            expected: "DATE_SENT",
            received: "DATE_SENT",
            type: "required",
            valid: true
          },
          {
            expected: { constructor: "Array", example: [2018, 8, 27, 1, 123] },
            received: { constructor: "Array", value: [2018, 8, 27, 1, 123] },
            valid: true
          }
        ],
        [
          {
            expected: "PROJECT",
            received: "PROJECT",
            type: "required",
            valid: true
          },
          {
            expected: { constructor: "String", example: "testTest" },
            received: { constructor: "String", value: "testTest" },
            valid: true
          }
        ],
        [
          {
            expected: "TOTAL_AMOUNT",
            received: "TOTAL_AMOUNT",
            type: "required",
            valid: true
          },
          {
            expected: { constructor: "Number", example: 1000 },
            received: {
              constructor: "Number",
              value: 1000
            },
            valid: true
          }
        ],
        [
          {
            expected: "SUM_AMOUNT",
            received: "SUM_AMOUNT",
            type: "required",
            valid: true
          },
          {
            expected: { constructor: "Number", example: 900 },
            received: { constructor: "Number", value: 900 },
            valid: true
          }
        ],
        [
          {
            expected: "FEES_AMOUNT",
            received: "FEES_AMOUNT",
            type: "required",
            valid: true
          },
          {
            expected: { constructor: "Number", example: 100 },
            received: { constructor: "Number", value: 100 },
            valid: true
          }
        ],
        [
          {
            expected: "CURRENCY",
            received: "CURRENCY",
            type: "required",
            valid: true
          },
          {
            expected: { constructor: "String", example: "USD" },
            received: { constructor: "String", value: "USD" },
            valid: true
          }
        ],
        [
          { expected: "BANK", received: "BANK", type: "required", valid: true },
          {
            expected: {
              constructor: "IdArray",
              example: ["Bank_A", "123", "_hash"]
            },
            received: {
              constructor: "IdArray",
              value: ["EFG", "123", "_hash"]
            },
            valid: true
          }
        ],
        [
          {
            expected: "PAYOR",
            received: "PAYOR",
            type: "required",
            valid: true
          },
          {
            expected: {
              constructor: "IdArray",
              example: ["Payor_A", "123", "_hash"]
            },
            received: {
              constructor: "IdArray",
              value: ["Best Ltd", "123", "_hash"]
            },
            valid: true
          }
        ],
        [
          {
            expected: "PAYEE",
            received: "PAYEE",
            type: "required",
            valid: true
          },
          {
            expected: {
              constructor: "IdArray",
              example: ["Payee_A", "123", "_hash"]
            },
            received: {
              constructor: "IdArray",
              value: ["All Stars LLC", "123", "_hash"]
            },
            valid: true
          }
        ],
        [
          {
            expected: "PAYMENT_REFERENCE",
            received: "PAYMENT_REFERENCE",
            type: "required",
            valid: true
          },
          {
            expected: {
              constructor: "String",
              example: "abc"
            },
            received: { constructor: "String", value: "abc" },
            valid: true
          }
        ],
        [
          {
            expected: "PAYOR_TYPE",
            received: "PAYOR_TYPE",
            type: "required",
            valid: true
          },
          {
            expected: { constructor: "String", example: "Person" },
            received: { constructor: "String", value: "LegalPerson" },
            valid: true
          }
        ],
        [
          {
            expected: "PAYEE_TYPE",
            received: "PAYEE_TYPE",
            type: "required",
            valid: true
          },
          {
            expected: { constructor: "String", example: "Person" },
            received: { constructor: "String", value: "LegalPerson" },
            valid: true
          }
        ]
      ])
    );
  });
  test("toObject", () => {
    /* Returns Frankenstein object */
    const transaction = cloneDeep(tr);

    // delete majority of required properties, leaving just two
    transaction.properties.required = {
      TOTAL_AMOUNT: 1000,
      PROJECT: "LOL"
    };

    const data = new Validator(transaction, Transaction),
      result = data.toObject();

    expect(result).toMatchObject({
      labels: ["Transaction"],
      properties: {
        required: {
          DATE_SENT: ["Number", "Number", "Number", "Number", "Number"],
          PROJECT: "LOL",
          TOTAL_AMOUNT: 1000,
          SUM_AMOUNT: "Number",
          FEES_AMOUNT: "Number",
          CURRENCY: "String",
          BANK: "IdArray",
          PAYOR: "IdArray",
          PAYEE: "IdArray",
          PAYMENT_REFERENCE: "String",
          PAYOR_TYPE: "String",
          PAYEE_TYPE: "String"
        },
        optional: {}
      }
    });

    /* keke */
    expect(data.toFrankensteinObject()).toEqual(result);
  });
  test("getPassedValidations", () => {
    const transaction = cloneDeep(tr);
    transaction.properties.required = {
      TOTAL_AMOUNT: 1000
    };
    const result = new Validator(
      transaction,
      Transaction
    ).getPassedValidations();
    expect(result).toHaveLength(1);

    expect(result).toEqual(
      /* expect.arrayContaining( */[
        [
          {
            valid: true,
            expected: "TOTAL_AMOUNT",
            received: "TOTAL_AMOUNT",
            type: "required"
          },
          {
            valid: true,
            expected: { constructor: "Number", example: 1000 },
            received: { constructor: "Number", value: 1000 }
          }
        ]
      ]
      /* ) */
    );
  });
  test("getFailedValidations", () => {
    const transaction = cloneDeep(tr);
    delete transaction.properties.required.TOTAL_AMOUNT;
    transaction.properties.required.PROJECT = 1;

    const result = new Validator(
      transaction,
      Transaction
    ).getFailedValidations();
    expect(result).toHaveLength(2);

    expect(result).toEqual([
      [
        {
          valid: true,
          expected: "PROJECT",
          received: "PROJECT",
          type: "required"
        },
        {
          valid: false,
          expected: { constructor: "String", example: "testTest" },
          received: { constructor: "Number", value: 1 }
        }
      ],
      [
        {
          valid: false,
          expected: "TOTAL_AMOUNT",
          received: "",
          type: "required"
        },
        {
          valid: false,
          expected: { constructor: "Number", example: 1000 },
          received: { constructor: undefined, value: undefined }
        }
      ]
    ]);
  });
});
