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
  test("return Node", async () => {
    /// db setup
    await engine.cleanDB();
    /// !db setup

    let product1 /* : Node */ = await mango.buildAndMergeNode(["Product"], {
      NAME: "Bedrocan",
    });
    expect(product1).toMatchObject({
      labels: ["Product"],
      properties: {
        NAME: "Bedrocan",
      },
      ...dbProps,
    });
  });

  test("return Result", async () => {
    /// db setup
    await engine.cleanDB();
    /// !db setup

    let product1 /* : Result */ = await mango.buildAndMergeNode(
      ["Product"],
      {
        NAME: "Bedrocan",
      },
      { returnResult: true }
    );
    expect(product1).toBeInstanceOf(Success);
  });

  test("node with multiple labels", async () => {
    /// db setup
    await engine.cleanDB();
    /// !db setup
    const labels = ["Label1", "Label2"];
    const rv: EnhancedNode = await mango.buildAndMergeNode(labels, {
      NAME: "Bedrocan",
    });
    // log(rv);
    expect(rv).toBeInstanceOf(EnhancedNode);
    expect(rv.getLabels()).toEqual([labels[0]]);
  });
});

describe("Node exists, no copies created", () => {
  test("one label", async () => {
    /// db setup
    await engine.cleanDB();

    const node = builder.makeNode(["Product"], {
      NAME: "Bedrocan",
    });
    const mergedNode = await engine.mergeNodes([node]);
    expect(mergedNode[0]).toBeInstanceOf(Success);

    let product1 /* : Node */ = await mango.buildAndMergeNode(["Product"], {
      NAME: "Bedrocan",
    });
    expect(product1).toMatchObject({
      labels: ["Product"],
      properties: {
        NAME: "Bedrocan",
      },
      ...dbProps,
    });

    /* ID is the same, ie no copies */
    expect(mergedNode[0].getData().getId()).toEqual(product1.getId());
  });
  test("multiple labels", async () => {
    /// db setup
    await engine.cleanDB();

    const node = builder.makeNode(["Product"], {
      NAME: "Bedrocan",
    });
    const mergedNode = await engine.mergeNodes([node]);
    expect(mergedNode[0]).toBeInstanceOf(Success);

    let rv: EnhancedNode = await mango.buildAndMergeNode(["Product", "SomethingElse"], {
      NAME: "Bedrocan",
    });
    
    expect(rv).toMatchObject({
      labels: ["Product"],
      properties: {
        NAME: "Bedrocan",
        _label: 'Product',
        _labels: ['Product', "SomethingElse"],
      },
      ...dbProps,
    });

    /* ID is the same, ie no copies */
    expect(mergedNode[0].getData().getId()).toEqual(rv.getId());
  });
});
