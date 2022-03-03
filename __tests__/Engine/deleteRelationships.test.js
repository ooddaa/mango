/* @flow */
import { engine } from "../../start";
import {
  Builder,
  log,
  NodeCandidate,
  EnhancedNode,
  EnhancedNodeCandidate,
  Relationship,
  RelationshipCandidate,
  isRelationship,
  isSuccess,
  isEnhancedNode,
  getResultData,
  isArray,
} from "../../src";
import isNumber from "lodash/isNumber";

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
const builder = new Builder();

afterAll(async (done) => {
  engine.closeAllSessions();
  engine.closeDriver();
  done();
});

describe("validations", () => {});
describe("use cases", () => {
  const [node1, node2, node3, node4] = [
    new NodeCandidate({
      labels: ["Node1"],
      properties: {
        required: { B: "b1" },
      },
    }),
    new NodeCandidate({
      labels: ["Node2"],
      properties: {
        required: { B: "b2" },
      },
    }),
    new NodeCandidate({
      labels: ["Node3"],
      properties: {
        required: { B: "b3" },
      },
    }),
    new NodeCandidate({
      labels: ["Node4"],
      properties: {
        required: { B: "b4" },
      },
    }),
  ];
  test("GDB clean, deletes one rel", async () => {
    //// We merge 2 rels, and try to delete 3 rels. In the end, all three results are
    //// Success because we focus on what Neo4j looks like after we run this function.
    //// db setup
    await engine.cleanDB();
    /// (node1)-[REL1]->(node2)
    /// (node1)-[REL2]->(node3)
    const [rel1, rel2, rel3]: Relationship = await builder.buildRelationships(
      [
        new RelationshipCandidate({
          labels: ["REL1"],
          properties: { REL1_REQ_PROP: "(node1)-[REL1]->(node2)" },
          direction: "outbound",
          startNode: node1,
          endNode: node2,
        }),
        new RelationshipCandidate({
          labels: ["REL2"],
          properties: { REL2_REQ_PROP: "(node1)-[REL2]->(node3)" },
          direction: "outbound",
          startNode: node1,
          endNode: node3,
        }),
        new RelationshipCandidate({
          labels: ["REL3"],
          properties: { REL2_REQ_PROP: "(node2)-[REL3]->(node4)" },
          direction: "outbound",
          startNode: node2,
          endNode: node4,
        }),
      ],
      { extract: true }
    );

    // we won't merge rel2
    const mergedRels: Result[] = await engine.mergeRelationships([
      rel1,
      /* rel2, */ rel3,
    ]);
    expect(mergedRels.every(isSuccess)).toEqual(true);
    //// !db setup

    /// try deleting all three rels
    const results: Result[] = await engine.deleteRelationships(
      [rel1, rel2, rel3] /* , { extract: true } */
    ); // extract: true also works as [ [Rel], [], [Rel] ]
    // log(results)
    /// all three should be Success - meaning that Neo4j does not have such Rels any more
    /// even that rel2 never existed. User wants rel2 not to exist, it doesnt, success.
    /// Corner case - what if it's the act of deleting of a rel that's important for the user?
    /// Is he a psycho? Then he should first check whether it exists, right? If it does,
    /// then it will get deleted. Result is the same either way.
    expect(results.every(isSuccess)).toEqual(true);

    // rel1 data exists
    // log(results[0].firstDataElement);
    expect(isRelationship(results[0].firstDataElement)).toEqual(true);
    expect(results[1].firstDataElement == undefined).toEqual(true);
    expect(isRelationship(results[2].firstDataElement)).toEqual(true);
  });
});
