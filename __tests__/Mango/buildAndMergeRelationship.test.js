/* @flow */
import { engine } from "../../start";
import { Mango, Builder, log, Result, Success, Relationship } from "../../src";

const builder = new Builder();
const mango = new Mango({ builder, engine });
const dbProps = {
  properties: {
    _date_created: [
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

describe("clean DB", () => {
  test("relationship == array, return Relationship", async () => {
    /// db setup
    await engine.cleanDB();
    /// !db setup

    const startNode: Node = await mango.buildAndMergeNode(["Product"], {
      NAME: "Bediol",
    });
    const endNode: Node = await mango.buildAndMergeNode(["Manufacturer"], {
      NAME: "Bedrocan",
    });
    const result: Relationship = await mango.buildAndMergeRelationship(
      startNode,
      [["MADE_BY"], "required", { REL_PROP: 1 }],
      endNode
    );
    expect(result).toBeInstanceOf(Relationship);
  });
  test("relationship == Object, return Result", async () => {
    /// db setup
    await engine.cleanDB();
    /// !db setup
    const startNode: Node = await mango.buildAndMergeNode(["Product"], {
      NAME: "Bediol",
    });
    const endNode: Node = await mango.buildAndMergeNode(["Manufacturer"], {
      NAME: "Bedrocan",
    });
    const result: Result = await mango.buildAndMergeRelationship(
      startNode,
      {
        labels: ["MADE_BY"],
        necessity: "required",
        properties: { REL_PROP: 1 },
      },
      endNode,
      {
        returnResult: true,
      }
    );
    expect(result).toBeInstanceOf(Result);
    expect(result).toBeInstanceOf(Success);
    expect(result.getData()[0]).toBeInstanceOf(Relationship);
    expect(result.getData()[0].isWritten()).toEqual(true);
  });
  test("start/endNode made by builder, return Result", async () => {
    /// db setup
    await engine.cleanDB();
    /// !db setup
    const result: Result = await mango.buildAndMergeRelationship(
      builder.makeNode(["Product"], {
        NAME: "Bediol",
      }),
      {
        labels: ["MADE_BY"],
        necessity: "required",
        properties: { REL_PROP: 1 },
      },
      builder.makeNode(["Manufacturer"], {
        NAME: "Bedrocan",
      }),
      {
        returnResult: true,
      }
    );
    expect(result).toBeInstanceOf(Result);
    expect(result).toBeInstanceOf(Success);
    expect(result.getData()[0]).toBeInstanceOf(Relationship);
    expect(result.getData()[0].isWritten()).toEqual(true);
  });
  test("start/endNode as simple arrays, return Result", async () => {
    /// db setup
    await engine.cleanDB();
    /// !db setup
    const result: Result = await mango.buildAndMergeRelationship(
      [["Product"], { NAME: "Bediol" }],
      [["MADE_BY"], "required", { REL_PROP: 1 }],
      [["Manufacturer"], { NAME: "Bedrocan" }],
      { returnResult: true }
    );
    expect(result).toBeInstanceOf(Result);
    expect(result).toBeInstanceOf(Success);
    expect(result.getData()[0]).toBeInstanceOf(Relationship);
    expect(result.getData()[0].isWritten()).toEqual(true);
  });
});

describe("Relationship exists, no copies created", () => {
  /**@TODO make it optional - mb user wants to have multiple copies of the same rel?? */
  test("return Result", async () => {
    /// db setup
    await engine.cleanDB();

    const startNode: Node = await mango.buildAndMergeNode(["Product"], {
      NAME: "Bediol",
    });
    const endNode: Node = await mango.buildAndMergeNode(["Manufacturer"], {
      NAME: "Bedrocan",
    });
    const rel1: Relationship = await mango.buildAndMergeRelationship(
      startNode,
      [["MADE_BY"], "required", { REL_PROP: 1 }],
      endNode
    );

    /* rel1 is written */
    expect(rel1).toBeInstanceOf(Relationship);
    expect(rel1.isWritten()).toEqual(true);

    /* attempt to make a copy relationship */
    const rel2: Relationship = await mango.buildAndMergeRelationship(
      startNode,
      [["MADE_BY"], "required", { REL_PROP: 1 }],
      endNode
    );

    /* rel2 is written */
    expect(rel2).toBeInstanceOf(Relationship);
    expect(rel2.isWritten()).toEqual(true);

    /* IDs are the same, ie no copies */
    expect(rel1.getId()).toEqual(rel2.getId());
  });
});
