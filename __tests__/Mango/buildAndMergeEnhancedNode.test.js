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

describe("flat enode", () => {
  test("partner node built with mango.buildAndMergeNode", async () => {
    /// db setup
    await engine.cleanDB();
    /// !db setup

    let product1: EnhancedNode = await mango.buildAndMergeEnhancedNode({
      labels: ["Product1"],
      properties: { NAME: "Bedrocan" },
      relationships: [
        {
          labels: ["HAS_SUPPLEMENT"],
          partnerNode: { labels: ["Product2"], properties: { NAME: "Bediol" } },
        },
      ],
    });
    // log(product1);
    expect(product1).toBeInstanceOf(EnhancedNode);
    expect(product1.isWritten()).toEqual(true);
  });
});
describe("deep enode", () => {
  test("recursive 1", async () => {
    /// db setup
    await engine.cleanDB();
    /// !db setup
    /* (:Product1)-[:HAS_SUPPLEMENT]->(:Product2)-[:HAS_PRICE]->(:Price) */
    let product1: EnhancedNode = await mango.buildAndMergeEnhancedNode({
      labels: ["Product1"],
      properties: { NAME: "Bedrocan" },
      relationships: [
        {
          labels: ["HAS_SUPPLEMENT"],
          partnerNode: {
            labels: ["Product2"],
            properties: { NAME: "Bediol" },
            relationships: [
              {
                labels: ["HAS_PRICE"],
                partnerNode: { labels: ["Price"], properties: { VALUE: 123 } },
              },
            ],
          },
        },
      ],
    });
    expect(product1).toBeInstanceOf(EnhancedNode);
    expect(product1.isWritten()).toEqual(true);
    expect(product1.getParticipatingRelationships()).toHaveLength(2);
  });
  test("recursive 2", async () => {
    /// db setup
    await engine.cleanDB();
    /// !db setup
    /* (:Product1)-[:HAS_SUPPLEMENT]->(:Product2)-[:HAS_PRICE]->(:Price) */
    let product1: EnhancedNode = await mango.buildAndMergeEnhancedNode({
      labels: ["Product1"],
      properties: { NAME: "Bedrocan" },
      relationships: [
        {
          labels: ["HAS_SUPPLEMENT"],
          partnerNode: {
            labels: ["Product2"],
            properties: { NAME: "Bediol" },
            relationships: [
              {
                labels: ["HAS_PRICE"],
                partnerNode: { labels: ["Price"], properties: { VALUE: 123 } },
              },
              {
                labels: ["AT_DISPENSARY"],
                partnerNode: {
                  labels: ["Dispensary"],
                  properties: { VALUE: "Magic" },
                  relationships: [
                    {
                      labels: ["LOCATED_AT"],
                      properties: { dateFrom: [2022, 3, 15] },
                      partnerNode: {
                        labels: ["City"],
                        properties: { NAME: "London" },
                      },
                    },
                    {
                      labels: ["AT_DISPENSARY"],
                      direction: "inbound",
                      partnerNode: {
                        labels: ["Product1"],
                        properties: { NAME: "Bedrocan" },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    });
    expect(product1).toBeInstanceOf(EnhancedNode);
    expect(product1.isWritten()).toEqual(true);
    expect(product1.getParticipatingRelationships()).toHaveLength(5);
  });
});

// describe("Node exists, no copies created", () => {
//   test("return Node", async () => {
//     /// db setup
//     await engine.cleanDB();

//     const node = builder.makeNode(["Product"], {
//       NAME: "Bedrocan",
//     });
//     const mergedNode = await engine.mergeNodes([node]);
//     expect(mergedNode[0]).toBeInstanceOf(Success);

//     let product1 /* : Node */ = await mango.buildAndMergeNode(["Product"], {
//       NAME: "Bedrocan",
//     });
//     expect(product1).toMatchObject({
//       labels: ["Product"],
//       properties: {
//         NAME: "Bedrocan",
//       },
//       ...dbProps,
//     });

//     /* ID is the same, ie no copies */
//     expect(mergedNode[0].getData().getId()).toEqual(product1.getId());
//   });
// });
