/* @flow */
"use strict";
// [2020-01-16] ok

/**
 * @todo Must test that NodeCandidate's properties: { required: {}, optional?: {}}
 */
import { Node, NodeCandidate, Relationship, log } from "../../../src";

describe("methods", () => {
  test("getCoreNode", () => {
    const coreNode = "whatever";
    const nc = new NodeCandidate(coreNode);
    expect(nc.getCoreNode()).toEqual(coreNode);
  });
  test("setCoreNode", () => {
    const nc = new NodeCandidate("whatever");

    nc.setCoreNode("whatever and ever");
    expect(nc.getCoreNode()).toEqual("whatever and ever");
  });
  describe("toNode", () => {
    test("coreNode == not a nodeObj", () => {
      expect(() => {
        return new NodeCandidate().toNode();
      }).toThrow(`NodeCandidate.toNode: this NC is not a NodeObject.`);
    });
    test("coreNode == nodeObj", () => {
      const nc = new NodeCandidate({
        labels: ["nodeObj"],
        properties: {
          required: {},
        },
      }).toNode();
      expect(nc).toBeInstanceOf(Node);
      expect(nc).toMatchObject(
        /* Node */ {
          labels: ["nodeObj"],
          properties: {
            _label: "nodeObj",
            _hash: expect.any(String),
            _date_created: [
              expect.any(Number),
              expect.any(Number),
              expect.any(Number),
              expect.any(Number),
              expect.any(Number),
            ],
          },
          identity: null,
        }
      );
    });
    test("coreNode == nodeObj", () => {
      const nc = new NodeCandidate({
        labels: ["nodeObj"],
        properties: {
          required: {},
          optional: {
            a: 1,
          },
        },
      }).toNode();
      expect(nc).toBeInstanceOf(Node);
      expect(nc).toMatchObject(
        /* Node */ {
          labels: ["nodeObj"],
          properties: {
            a: 1,
            _label: "nodeObj",
            _hash: expect.any(String),
            _date_created: [
              expect.any(Number),
              expect.any(Number),
              expect.any(Number),
              expect.any(Number),
              expect.any(Number),
            ],
          },
          identity: null,
        }
      );
    });
    test("coreNode == Node", () => {
      const nc = new NodeCandidate(
        new Node({
          labels: ["nodeObj"],
          properties: {
            A: 1,
            b: 2,
            _label: "nodeObj",
            _hash: "nodeObj_hash",
            _date_created: [1, 2, 3, 4, 5],
          },
        })
      ).toNode();
      expect(nc).toBeInstanceOf(Node);
      expect(nc).toMatchObject(
        /* Node */ {
          labels: ["nodeObj"],
          properties: {
            A: 1,
            b: 2,
            _label: "nodeObj",
            _hash: expect.any(String),
            _date_created: [
              expect.any(Number),
              expect.any(Number),
              expect.any(Number),
              expect.any(Number),
              expect.any(Number),
            ],
          },
          identity: null,
        }
      );
    });
    test("with _private props", () => {
      const nc = new NodeCandidate({
        labels: ["TestNc"],
        properties: {
          required: { REQ: 1 },
          optional: { opt: 2 },
          _private: { _private: 3 },
        },
      });

      expect(nc).toMatchObject(
        /* NodeCandidate */ {
          coreNode: {
            labels: ["TestNc"],
            properties: {
              required: { REQ: 1 },
              optional: { opt: 2 },
              _private: { _private: 3 },
            },
          },
        }
      );
    });
  });
});
