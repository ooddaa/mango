import { engine } from "../../start";
import {
  Mango,
  Builder,
  log,
  Result,
  Success,
  Relationship,
  EnhancedNode,
  isEnhancedNode,
} from "../../src";

const builder = new Builder();
const mango = new Mango({ builder, engine });
const dbProps = {
  properties: {
    timeArray: [
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
    ],
    _uuid: expect.any(String),
    _hash: expect.any(String),
  },
  identity: { low: expect.any(Number), high: 0 },
};

describe("deletes Nodes and its Relationships", () => {
  test("return Node", async () => {
    /// db setup
    await engine.cleanDB();

    const startNode: Node = await mango.buildAndMergeNode(["Product"], {
      NAME: "Bediol",
    });
    const endNode: Node = await mango.buildAndMergeNode(["Manufacturer"], {
      NAME: "Bedrocan",
    });
    const relationship: Relationship = await mango.buildAndMergeRelationship(
      startNode,
      [["MADE_BY"], "required", { REL_PROP: 1 }],
      endNode
    );
    expect(relationship).toBeInstanceOf(Relationship);
    /// !db setup
    const result: Result = await mango.deleteNode(startNode, {
      returnResult: true,
    });
    // log(result);
    expect(result).toBeInstanceOf(Result);

    /* as we are expecting to delete one Node|Enode */
    /* we want easy access to it */
    const [enode] = result.getData();
    expect(enode).toBeInstanceOf(EnhancedNode);

    // returned EnhancedNode is marked as deleted for the user
    expect(enode.getProperties()["_hasBeenDeleted"]).toEqual(true);
    expect(enode.getProperties()["_whenWasDeleted"]).toEqual(
      dbProps.properties.timeArray
    );
    /* was deleted permanently, not archived */
    expect(enode.getProperties()["_isArchived"]).toEqual(false);

    /* then we can check which Relationhsips were deleted */
    /* we had only one */
    expect(enode.relationships.outbound).toHaveLength(1);

    const outRel = enode.relationships.outbound[0];
    expect(outRel).toBeInstanceOf(Relationship);
    expect(outRel.getProperties()["_hasBeenDeleted"]).toEqual(true);
    expect(outRel.getProperties()["_whenWasDeleted"]).toEqual(
      dbProps.properties.timeArray
    );
    /* was deleted permanently, not archived */
    expect(outRel.getProperties()["_isArchived"]).toEqual(false);

    /* Relationship contains its PartnerNode for reference (in this case it's an EndNode) */
    expect(outRel.getEndNode()).toBeInstanceOf(EnhancedNode);
  });
  test("documentation example", async () => {
    /// db setup
    await engine.cleanDB();

    let bob: EnhancedNode = await mango.buildAndMergeNode(["Person"], {
      NAME: "SpongeBob SquarePants",
    });
    [bob] /* : EnhancedNode[] */ = await mango.findNode(["Person"], {
      NAME: "SpongeBob SquarePants",
    });

    const result: EnhancedNode = await mango.deleteNode(bob);
    expect(result.getProperty("_hasBeenDeleted")).toEqual(true);
    /* [year, month, day, weekday, timestamp] */
    expect(result.getProperty("_whenWasDeleted")).toEqual([
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
    ]);
    expect(result.getProperty("_isArchived")).toEqual(false);
  });
});
