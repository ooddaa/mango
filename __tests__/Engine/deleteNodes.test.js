/* @flow */
import { engine } from "../../start";
import {
  Builder,
  log,
  NodeCandidate,
  isSuccess,
  isEnhancedNode,
  getResultData,
  EnhancedNode,
} from "../../src";
import isNumber from "lodash/isNumber";

const timeArray = [
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
  const candidates = [
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
  test("GDB clean, deletes 2 nodes, no rels", async () => {
    //// db setup
    await engine.cleanDB();
    //// !db setup
    /* make nodes */
    let nodes: Result[] = await builder.buildNodes(candidates, {
      extract: true,
    });

    /* extract Nodes */
    const level1: Result[] = await engine.mergeNodes(nodes);

    expect(level1).toBeInstanceOf(Array);
    expect(level1.every(isSuccess)).toEqual(true);

    let [node1, node2, node3, node4] = level1.map(getResultData);

    expect([node1, node2, node3, node4].every(isEnhancedNode)).toEqual(true);
    // log(level1);

    /* DELETE */
    /**
     * @TODO - we need to inform user about which Nodes/Relationships
     * were deleted. As a user I prefer to have a "receipt" with the
     * latest snapshot of data that no longer exists in Neo4j.
     */
    const results: Result[] = await engine.deleteNodes(
      [node1.toNode(), node2.toNode()],
      { deletePermanently: true }
    );

    expect(results).toBeInstanceOf(Array);
    expect(results.every(isSuccess)).toEqual(true);

    /* returns node1 as parameters.nodeToDelete */
    const node1Result: Result = results[0];
    expect(node1Result.parameters["nodeToDelete"]).toEqual(node1.toNode());

    /* check Returned EnhancedNode composition. */
    expect(node1Result.getData()).toBeInstanceOf(Array);
    expect(node1Result.getData()[0]).toBeInstanceOf(EnhancedNode);

    const enode = node1Result.getData()[0];

    // log(enode);

    /* enode shows all labels/properties */
    expect(enode.properties).toMatchObject({
      /* retained all deleted Node's properties */
      ...node1.properties,
      /* is marked as deleted */
      _hasBeenDeleted: true,
      _whenWasDeleted: timeArray,
      _isArchived: false,
    });

    /* Neo4j identity is present */
    expect(enode.identity).toMatchObject({
      low: node1.getId(),
      high: 0,
    });
  });

  test("GDB clean, deletes 1 node, and 1 rel", async () => {
    //// db setup
    await engine.cleanDB();
    //// !db setup
    /* make nodes */
    let [node1, node2, node3] = [candidates[0], candidates[1], candidates[2]];
    let enode1: Result[] = await builder.makeEnhancedNode(node1, [
      builder.makeRelationshipCandidate(
        ["REL1"],
        node2,
        { DESCR: "(enode1)-[:REL1]->(node2)" },
        "outbound"
      ),
      builder.makeRelationshipCandidate(
        ["REL2"],
        node3,
        { DESCR: "(enode1)<-[:REL2]-(node3)" },
        "inbound"
      ),
    ]);

    /* extract Nodes */
    const mergeResults: Result[] = await engine.mergeEnhancedNodes([enode1]);

    expect(mergeResults).toBeInstanceOf(Array);
    expect(mergeResults.every(isSuccess)).toEqual(true);

    let [enode1Written] = mergeResults.map(getResultData)[0];
    expect(enode1Written).toBeInstanceOf(EnhancedNode);
    expect(enode1Written.isWritten()).toEqual(true);

    /* DELETE */
    /**
     * @TODO - we need to inform user about which Nodes/Relationships
     * were deleted. As a user I prefer to have a "receipt" with the
     * latest snapshot of data that no longer exists in Neo4j.
     */
    const results: Result[] = await engine.deleteNodes([enode1.toNode()], {
      deletePermanently: true,
    });

    /**@TODO done in previous test, but this time extract it with enode? */
    expect(results).toBeInstanceOf(Array);
    expect(results.every(isSuccess)).toEqual(true);

    /* check Returned EnhancedNode composition. */
    const node1Result: Result = results[0];
    expect(node1Result.getData()).toBeInstanceOf(Array);
    const enode = node1Result.getData()[0];
    expect(enode).toBeInstanceOf(EnhancedNode);

    /* check relationship */
    const { outbound, inbound } = enode.relationships;
    // log(outbound);
    expect(outbound).toHaveLength(1);
    expect(inbound).toHaveLength(1);

    /* check all Enodes and Relationships are marked as deleted */

    expect(enode.properties).toMatchObject({
      /* retained all deleted Node's properties */
      ...enode1.properties,
      /* is marked as deleted */
      _hasBeenDeleted: true,
      _whenWasDeleted: timeArray,
      _isArchived: false,
    });

    expect(outbound[0].properties["_hasBeenDeleted"]).toEqual(true);
    expect(outbound[0].properties["_whenWasDeleted"]).toEqual(timeArray);
    expect(outbound[0].properties["_isArchived"]).toEqual(false);
    expect(inbound[0].properties["_hasBeenDeleted"]).toEqual(true);
    expect(inbound[0].properties["_whenWasDeleted"]).toEqual(timeArray);
    expect(inbound[0].properties["_isArchived"]).toEqual(false);

    // /* Neo4j identity is present */
    // expect(enode.identity).toMatchObject({
    //   low: enode1Written.getId(),
    //   high: 0,
    // });
  });
});
