/* @flow */
"use strict";
// [2020-01-16] ok

import { Node, isNode, log } from "../../../src";

describe("Testing Node.toString()", () => {
  test("Node.toString() no label, no property", () => {
    const node = new Node();
    const result = node.toString("no hash");
    const expected = ``;
    expect(result).toEqual(expected);
  });

  test("Node.toString() one label", () => {
    const node = new Node({ labels: ["Country"] });
    const result = node.toString("no hash");
    const expected = `:Country`;
    expect(result).toEqual(expected);
  });

  test("Node.toString() one label one property", () => {
    const node = new Node({ labels: ["Country"], properties: { name: "UK" } });
    const result = node.toString("no hash");
    const expected = `:Country {name: 'UK'}`;
    expect(result).toEqual(expected);
  });

  test("Node.toString() one label many properties", () => {
    const node = new Node({
      labels: ["Person"],
      properties: {
        name: "Jon",
        surname: "Doe",
        nickname: "lm",
        from_date: "01/01/2000",
        to_date: "now",
      },
    });
    const result = node.toString("no hash");
    const expected = `:Person {name: 'Jon', surname: 'Doe', nickname: 'lm', from_date: '01/01/2000', to_date: 'now'}`;
    expect(result).toEqual(expected);
  });

  test("Node.toString() with integer and boolean", () => {
    const node = new Node({
      labels: ["PowerOfAttorney"],
      properties: {
        name: "poa_1",
        duration: 3,
        from_date: "13/09/2017",
        to_date: "13/09/2020",
        apostille: true,
        link: "xxx",
      },
    });
    const result = node.toString("no hash");
    const expected = `:PowerOfAttorney {name: 'poa_1', duration: 3, from_date: '13/09/2017', to_date: '13/09/2020', apostille: true, link: 'xxx'}`;
    expect(result).toEqual(expected);
  });

  test("Node.toString() with low letter in label", () => {
    const node = new Node({
      labels: ["powerOfAttorney"],
      properties: {
        name: "poa_1",
        duration: 3,
        from_date: "13/09/2017",
        to_date: "13/09/2020",
        apostille: true,
        link: "xxx",
      },
    });
    const result = node.toString("no hash");
    const expected = `:PowerOfAttorney {name: 'poa_1', duration: 3, from_date: '13/09/2017', to_date: '13/09/2020', apostille: true, link: 'xxx'}`;
    expect(result).toEqual(expected);
  });

  test("Node.toString() stringifies timeArrays", () => {
    const node = new Node({
      labels: ["Transaction"],
      properties: { date: [2018, 8, 27] },
    });
    const result = node.toString("no hash");
    const expected = `:Transaction {date: [2018, 8, 27]}`;
    expect(result).toEqual(expected);
  });

  test("Node.toString() stringifies long timeArrays", () => {
    const node = new Node({
      labels: ["Transaction"],
      properties: { date: [2018, 8, 27, 1] },
    });
    const result = node.toString("no hash");
    const expected = `:Transaction {date: [2018, 8, 27, 1]}`;
    expect(result).toEqual(expected);
  });

  test("Node should allow for any number of Labels 0", () => {
    const node = new Node({
      labels: [],
      properties: {
        name: "Jon",
        surname: "Doe",
        nickname: "lm",
        from_date: "01/01/2000",
        to_date: "now",
      },
    });
    const result = node.toString("no hash");
    const expected = ` {name: 'Jon', surname: 'Doe', nickname: 'lm', from_date: '01/01/2000', to_date: 'now'}`;
    expect(result).toEqual(expected);
  });

  test("Node should allow for any number of Labels 0", () => {
    const node = new Node({
      labels: [""],
      properties: {
        name: "Jon",
        surname: "Doe",
        nickname: "lm",
        from_date: "01/01/2000",
        to_date: "now",
      },
    });
    const result = node.toString("no hash");
    const expected = ` {name: 'Jon', surname: 'Doe', nickname: 'lm', from_date: '01/01/2000', to_date: 'now'}`;
    expect(result).toEqual(expected);
  });

  test("Node should allow for any number of Labels 1", () => {
    const node = new Node({
      labels: ["Person"],
      properties: {
        name: "Jon",
        surname: "Doe",
        nickname: "lm",
        from_date: "01/01/2000",
        to_date: "now",
      },
    });
    const result = node.toString("no hash");
    const expected = `:Person {name: 'Jon', surname: 'Doe', nickname: 'lm', from_date: '01/01/2000', to_date: 'now'}`;
    expect(result).toEqual(expected);
  });

  test("Node should allow for any number of Labels 3", () => {
    const node = new Node({
      labels: ["Person", "Director", "Signatory"],
      properties: {
        NAME: "Lol",
        SURNAME: "Haha",
        nickname: "boo",
        from_date: "11/12/2012",
        to_date: "now",
      },
    });
    const result = node.toString("no hash");
    const expected = `:Person:Director:Signatory {NAME: 'Lol', SURNAME: 'Haha', nickname: 'boo', from_date: '11/12/2012', to_date: 'now'}`;
    expect(result).toEqual(expected);
  });

  test("Node may have a known id, which is not stringified", () => {
    const node = new Node({
      labels: ["Person"],
      properties: { NAME: "Jon", SURNAME: "Doe" },
      identity: 186,
    });
    const result = node.toString();
    const expected = `:Person {NAME: 'Jon', SURNAME: 'Doe'}`;
    expect(result).toEqual(expected);
  });

  test("Node may have a property which value is [string, number], must return string[]", () => {
    const node = new Node({
      labels: ["Person"],
      properties: { ABC: ["a", 2] },
    });
    const result = node.toString();
    const expected = `:Person {ABC: ['a', '2']}`;
    expect(result).toEqual(expected);
  });

  test("Node may have a property which value is [string, number], must return string[]", () => {
    const node = new Node({
      labels: ["Person"],
      properties: { ABC: ["a", 2] },
    });
    const result = node.toString("properties");
    const expected = `{ABC: ['a', '2']}`;
    expect(result).toEqual(expected);
  });
});

describe('toString("all", parameterObject)', () => {
  const node = new Node({
    labels: ["Person"],
    properties: {
      NAME: "Jon",
      SURNAME: "Doe",
      toys: "cars",
      food: ["beer", "meat"],
      _uuid: "123abc",
    },
    identity: 123,
  });
  // no hash const hash = `_hash: '0f1a3629d6f8330931f73432e734586e784c3dcd89f8085ddc9be2144f8e5071'`

  test("toString() will stringify all labels + props", () => {
    const result = node.toString();
    expect(result).toEqual(
      `:Person {NAME: 'Jon', SURNAME: 'Doe', toys: 'cars', food: ['beer', 'meat'], _uuid: '123abc'}`
    );
  });
  test("toString(`all`) will stringify all labels + props", () => {
    const result = node.toString(`all`);
    expect(result).toEqual(
      `:Person {NAME: 'Jon', SURNAME: 'Doe', toys: 'cars', food: ['beer', 'meat'], _uuid: '123abc'}`
    );
  });
  test("toString(`all`, {REQUIRED: true}) will stringify labels + only REQUIRED props", () => {
    const result = node.toString(`all`, { REQUIRED: true });
    expect(result).toEqual(`:Person {NAME: 'Jon', SURNAME: 'Doe'}`);
  });
  test("toString(`all`, {optional: true}) will stringify labels + only optional props", () => {
    const result = node.toString(`all`, { optional: true });
    expect(result).toEqual(`:Person {toys: 'cars', food: ['beer', 'meat']}`);
  });
  test("toString(`all`, {_private: true}) will stringify only _private props", () => {
    const result = node.toString(`all`, { _private: true });
    expect(result).toEqual(`:Person {_uuid: '123abc'}`);
  });
});

describe('toString("properties", parameter)', () => {
  const node = new Node({
    labels: ["Person"],
    properties: {
      NAME: "Jon",
      SURNAME: "Doe",
      toys: "cars",
      food: ["beer", "meat"],
      _uuid: "123abc",
    },
    identity: 123,
  });
  // const hash = `_hash: '0f1a3629d6f8330931f73432e734586e784c3dcd89f8085ddc9be2144f8e5071'`

  test("toString(`properties`) will stringify all props only, no labels", () => {
    const result = node.toString(`properties`);
    expect(result).toEqual(
      `{NAME: 'Jon', SURNAME: 'Doe', toys: 'cars', food: ['beer', 'meat'], _uuid: '123abc'}`
    );
  });
  test("toString(`properties`, {REQUIRED: true}) will stringify only REQUIRED props", () => {
    const result = node.toString(`properties`, { REQUIRED: true });
    expect(result).toEqual(`{NAME: 'Jon', SURNAME: 'Doe'}`);
  });
  test("toString(`properties`, {optional: true}) will stringify only optional props", () => {
    const result = node.toString(`properties`, { optional: true });
    expect(result).toEqual(`{toys: 'cars', food: ['beer', 'meat']}`);
  });
  test("toString(`properties`, {_private: true}) will stringify only _private props", () => {
    const result = node.toString(`properties`, { _private: true });
    expect(result).toEqual(`{_uuid: '123abc'}`);
  });
  test("engine use case", () => {
    /* 
        MERGE (x:Person {NAME: 'Jon', SURNAME: 'Doe'}) 
        ON MATCH SET x = {NAME: 'Jon', SURNAME: 'Doe', toys: 'cars', food: ['beer', 'meat'], _uuid: '123abc'}
        ON CREATE SET x = {NAME: 'Jon', SURNAME: 'Doe', toys: 'cars', food: ['beer', 'meat'], _uuid: '123abc'}
        RETURN *
        */
    const query = `MERGE (x:Person {NAME: 'Jon', SURNAME: 'Doe'}) ON MATCH SET x = {NAME: 'Jon', SURNAME: 'Doe', toys: 'cars', food: ['beer', 'meat'], _uuid: '123abc'} ON CREATE SET x = {NAME: 'Jon', SURNAME: 'Doe', toys: 'cars', food: ['beer', 'meat'], _uuid: '123abc'} RETURN *`;
    const result = `MERGE (x${node.toString("all", {
      REQUIRED: true,
    })}) ON MATCH SET x = ${node.toString(
      "properties"
    )} ON CREATE SET x = ${node.toString("properties")} RETURN *`;
    expect(result).toEqual(query);
  });
});

describe("Testing labels stringification", () => {
  test("Stringify Labels only to build relationships 1", () => {
    const node = new Node({
      labels: ["Person"],
      properties: { abc: ["a", 2] },
    });
    const result = node.toString("labels");
    const expected = `:Person`;
    expect(result).toEqual(expected);
  });
  test("Stringify Labels only to build relationships 1+", () => {
    const node = new Node({
      labels: ["Jose", "Raul", "Capablanca", "y", "Graupera"],
      properties: { abc: ["a", 2] },
    });
    const result = node.toString("labels");
    const expected = `:Jose:Raul:Capablanca:Y:Graupera`;
    expect(result).toEqual(expected);
  });
});

describe("Testing Node methods", () => {
  test("Node.getId() returns id", () => {
    const node = new Node({
      labels: ["Person"],
      properties: { name: "Jon", surname: "Doe" },
      identity: 186,
    });
    const result = node.getId();
    const expected = 186;
    expect(result).toEqual(expected);
  });
  test("Node.toObject() returns object", () => {
    const node = new Node({
      labels: ["Person"],
      properties: { name: "Jon", surname: "Doe" },
      identity: 186,
    });
    const result = node.toObject();
    expect(result).toMatchObject({
      identity: 186,
      labels: ["Person"],
      properties: { name: "Jon", surname: "Doe" },
    });
  });
  test("Node.getRequiredProperties() returns object with required props", () => {
    /* all REQUIRED properties are UpperCased */
    const node = new Node({
      labels: ["Person"],
      properties: {
        NAME: "Jon",
        SURNAME: "Doe",
        SEX: "Male",
        toys: "cars",
        _uuid: "123abc",
      },
      identity: 186,
    });
    const result = node.getRequiredProperties();
    expect(result).toMatchObject({ NAME: "Jon", SURNAME: "Doe", SEX: "Male" });
  });
  test("Node.getOptionalProperties() returns object with required props", () => {
    /* all optional properties are LowerCased */
    const node = new Node({
      labels: ["Person"],
      properties: {
        NAME: "Jon",
        SURNAME: "Doe",
        SEX: "Male",
        toys: "cars",
        _uuid: "123abc",
      },
      identity: 186,
    });
    const result = node.getOptionalProperties();
    expect(result).toMatchObject({ toys: "cars" });
  });
  test("Node.getPrivateProperties() returns object with private props", () => {
    /* all optional properties are LowerCased */
    const node = new Node({
      labels: ["Person"],
      properties: {
        NAME: "Jon",
        SURNAME: "Doe",
        SEX: "Male",
        toys: "cars",
        _uuid: "123abc",
      },
      identity: 186,
    });
    const result = node.getPrivateProperties();
    expect(result).toMatchObject({ _uuid: "123abc" });
  });
  describe("Node.getProperties()", () => {
    test("Node.getProperties() returns object with required props", () => {
      /* all optional properties are LowerCased */
      const node = new Node({
        labels: ["Person"],
        properties: {
          NAME: "Jon",
          SURNAME: "Doe",
          SEX: "Male",
          toys: "cars",
          _uuid: "123abc",
        },
        identity: 186,
      });
      const result = node.getProperties();
      expect(result).toMatchObject({
        NAME: "Jon",
        SURNAME: "Doe",
        SEX: "Male",
        toys: "cars",
        _uuid: "123abc",
      });
    });
    test("Node.getProperties(`number`) returns object with all numerical values as numbers", () => {
      const node = new Node({
        labels: ["Person"],
        properties: {
          NAME: "Jon",
          SURNAME: "Doe",
          SEX: "Male",
          toys: "cars",
          food: ["beer", "meat"],
          _uuid: "123abc",
          _date: [
            { low: 2018, high: 0 },
            { low: 8, high: 0 },
            { low: 27, high: 0 },
            { low: 1, high: 0 },
            { low: 123, high: 0 },
          ],
        },
        identity: { low: 1, high: 0 },
      });
      const result = node.getProperties(`number`);
      expect(result).toMatchObject({
        NAME: "Jon",
        SURNAME: "Doe",
        SEX: "Male",
        toys: "cars",
        _uuid: "123abc",
        _date: [2018, 8, 27, 1, 123],
      });
    });
    test("Node.getProperty(propName: string) - gets the named property or undefined", () => {
      const node = new Node({
        labels: ["Person"],
        properties: {
          NAME: "Jon",
          SURNAME: "Doe",
          SEX: "Male",
          toys: "cars",
          _uuid: "123abc",
        },
        identity: 186,
      });
      const rv = node.getProperty("NAME");
      expect(rv).toEqual("Jon");
    });
  });
});

describe("Testing standalone tools", () => {
  test("isNode", () => {
    expect(isNode(new Node())).toEqual(true);
  });
});

test("no _uuid is added by constructor", () => {
  const node = new Node({
    labels: ["Person"],
    properties: { NAME: "Jon", SURNAME: "Doe", SEX: "Male", toys: "cars" },
    identity: 186,
  });
  const result = node.getPrivateProperties();
  expect(result).toMatchObject({});
});

describe("Node has multiple labels", () => {
  const labels = ["Person", "Sponge"];
  const node = new Node({
    labels,
    properties: { NAME: "Bob" },
  });

  test("two labels", () => {
    expect(node.getLabels()).toEqual(labels);
  });
  test("multiple labels stringify correctly to Cypher", () => {
    expect(node.toString("labels")).toEqual(":Person:Sponge");
  });
  test("everything works as expected", () => {
    expect(node.toString()).toEqual(":Person:Sponge {NAME: 'Bob'}");
  });
});
