/* @flow */
import { engine } from "../../start";
import { Mango, Builder, log, Result, Success, EnhancedNode } from "../../src";

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
  test("partner node build with builder", async () => {
    /// db setup
    await engine.cleanDB();
    /// !db setup

    // (Product1)-[:HAS_SUPPLEMENT]->(Product2)
    let product1: EnhancedNode = builder.makeEnhancedNode(
      builder.makeNode(["Product1"], { NAME: "Bedrocan" }),
      [
        builder.makeRelationshipCandidate(
          ["HAS_SUPPLEMENT"],
          builder.makeNode(["Product2"], { NAME: "Bediol" })
        ),
      ]
    );
    // log(product1);
    expect(product1).toBeInstanceOf(EnhancedNode);

    const rv: EnhancedNode = await mango.mergeEnhancedNode(product1);
    expect(rv).toBeInstanceOf(EnhancedNode);
    expect(rv.isWritten()).toEqual(true);
  });
  test("partner node built with mango.buildAndMergeNode", async () => {
    /// db setup
    await engine.cleanDB();
    /// !db setup

    // (Product1)-[:HAS_SUPPLEMENT]->(Product2)
    let product1: EnhancedNode = builder.makeEnhancedNode(
      builder.makeNode(["Product1"], { NAME: "Bedrocan" }),
      [
        builder.makeRelationshipCandidate(
          ["HAS_SUPPLEMENT"],
          await mango.buildAndMergeNode(["Product2"], { NAME: "Bediol" })
        ),
      ]
    );
    // log(product1);
    expect(product1).toBeInstanceOf(EnhancedNode);

    const rv: EnhancedNode = await mango.mergeEnhancedNode(product1);
    expect(rv).toBeInstanceOf(EnhancedNode);
    expect(rv.isWritten()).toEqual(true);
  });
});
