/* @flow */
'use strict'

import {
  parameters_to_string_array,
  isIdentificationArray,
  convert_Node_to_nodeObj,
  log,
  chunkEvery,
  buildTreeFromArray,
} from "../src/";
import fs from "fs";


test("parameters_to_string_array test", () => {
  // const param = {'A': 'A', 'B': 2, 'C': true, 'D': [], 'F': ['a', 'b', 'c'], 'G': [1,2,3]}
  // const result = parameters_to_string_array(param)
  // expect(result).toMatchObject
  expect(1).toEqual(1);
});
test("isIdentificationArray", () => {
  const correct = [
    ["Jon", "", ""],
    ["", "123", ""],
    ["", "", "abc123"],
    ["Jon", "", "abc123"],
    ["", "123", "abc123"],
    ["Jon", "123", ""],
    ["Jon", "123", "abc123"]
  ];
  const incorrect = [
    [],
    [""],
    [undefined],
    ["", 123],
    ["", "123"],
    ["", "123", undefined],
    ["", "", ""],
    ["", "123", null],
    ["Jon", "ID", "abc123"] // ID must not be NaN
  ];
  const correct_checked = correct.map(isIdentificationArray);
  const incorrect_checked = incorrect.map(isIdentificationArray);
  expect(correct_checked.every(result => result.success === true)).toEqual(
    true
  );
  expect(incorrect_checked.every(result => result.success === false)).toEqual(
    true
  );
});
test("convert_Node_to_nodeObj", () => {
  const node = {
    labels: ["HTransaction"],
    properties: {
      CURRENCY: "GBP",
      SUBCATEGORY: "TRANSPORT",
      DATE: [2018, 7, 3, 2],
      ACCOUNT: "TESCO",
      DEBIT: true,
      OWNER: "KM",
      DESCRIPTION: "TFL.GOV.UK/CP",
      AMOUNT: 1231230,
      CATEGORY: "TRANSPORT",
      _date_created: [2019, 4, 29, 1, 1556547090658],
      _hash:
        "9742b9ea10af025156bf489b15cac4bd79674b31498f72934a9d9ef1574fed74",
      _uuid: "273ae8c4-e1af-42b3-979e-2462af85312d",
      _label: "HTransaction",
      id: 1
    },
    identity: null
  };
  const nodeObj = {
    labels: ["HTransaction"],
    properties: {
      required: {
        CURRENCY: "GBP",
        SUBCATEGORY: "TRANSPORT",
        DATE: [2018, 7, 3, 2],
        ACCOUNT: "TESCO",
        DEBIT: true,
        OWNER: "KM",
        DESCRIPTION: "TFL.GOV.UK/CP",
        AMOUNT: 1231230,
        CATEGORY: "TRANSPORT"
      },
      optional: {
        id: 1
      },
      _private: {
        _date_created: [2019, 4, 29, 1, 1556547090658],
        _hash:
          "9742b9ea10af025156bf489b15cac4bd79674b31498f72934a9d9ef1574fed74",
        _uuid: "273ae8c4-e1af-42b3-979e-2462af85312d",
        _label: "HTransaction"
      }
    },
    identity: null
  };
  const result = convert_Node_to_nodeObj(node);
  expect(result).toEqual(nodeObj);
});

describe('chunkEvery', () => {
  test('simple', () => {
    expect(chunkEvery([1, 2, 3, 4], 1)).toEqual([[1], [2], [3], [4]])
    expect(chunkEvery([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]])
    expect(chunkEvery([1, 2, 'foo', 'bar'], 2)).toEqual([[1, 2], ['foo', 'bar']])
    expect(chunkEvery([1, 2, 3, 4], 3)).toEqual([[1, 2, 3], [4]])
    expect(chunkEvery([1, 2, 3, 4], 4)).toEqual([[1, 2, 3, 4]])

    expect(chunkEvery([1, 2, 3, 4], 5)).toEqual([[1, 2, 3, 4]])
  })
  test('with steps', () => {
    expect(chunkEvery([1, 2, 3, 4], 2, 1)).toEqual([[1, 2], [2, 3], [3, 4]])
    expect(chunkEvery([1, 2, 3, 4, 5], 2, 1)).toEqual([[1, 2], [2, 3], [3, 4], [4, 5]])

    expect(chunkEvery([1, 2, 3, 4], 2, 2)).toEqual([[1, 2], [3, 4]])
    expect(chunkEvery([1, 2, 3, 4, 5], 2, 2)).toEqual([[1, 2], [3, 4], [5]])
    expect(chunkEvery([1, 2, 3, 'foo', 'bar'], 2, 2)).toEqual([[1, 2], [3, 'foo'], ['bar']])
    expect(chunkEvery([1, 2, 3, 4], 2, 3)).toEqual([[1, 2], [4]])
  })
})

describe("buildTree", () => {
  const tree = {
    name: "root",
    value: 0,
    children: [
      {
        name: "child1",
        value: 1,
        children: [
          {
            name: "child2",
            value: 2,
            children: [
              {
                name: "child3",
                value: 3,
                children: []
              }
            ]
          }
        ]
      }
    ]
  }

  test("first", () => {
    const arr = [
      {
        name: "root",
        value: 0,
      },
      {
        name: "child1",
        value: 1,
      },
      {
        name: "child2",
        value: 2,
      },
      {
        name: "child3",
        value: 3,
      },
    ]
    const rv = buildTreeFromArray(arr)
    // log('result', rv)
    expect(rv).toMatchObject(tree)
  })


});

