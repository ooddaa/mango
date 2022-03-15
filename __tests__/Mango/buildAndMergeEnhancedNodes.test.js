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
  test("multiple deep enodes", async () => {
    /// db setup
    await engine.cleanDB();
    /// !db setup

    let products: EnhancedNode[] = await mango.buildAndMergeEnhancedNodes([
      {
        labels: ["Product1"],
        properties: { NAME: "Coca-cola" },
        relationships: [
          {
            labels: ["HAS_SUPPLEMENT"],
            partnerNode: {
              labels: ["Product2"],
              properties: { NAME: "Pepsi" },
              relationships: [
                {
                  labels: ["HAS_PRICE"],
                  partnerNode: {
                    labels: ["Price"],
                    properties: { VALUE: 123 },
                  },
                },
              ],
            },
          },
        ],
      },
      {
        labels: ["Product2"],
        properties: { NAME: "Pepsi" },
        relationships: [
          {
            labels: ["HAS_COMPLIMENT"],
            partnerNode: {
              labels: ["Product3"],
              properties: { NAME: "Coca-cola lite" },
              relationships: [
                {
                  labels: ["HAS_PRICE"],
                  partnerNode: {
                    labels: ["Price"],
                    properties: { VALUE: 456 },
                  },
                },
              ],
            },
          },
        ],
      },
    ]);
    // log(products);
    expect(products).toBeInstanceOf(Array);
    expect(products[0]).toBeInstanceOf(EnhancedNode);
    expect(products[0].isWritten()).toEqual(true);
    expect(products[1]).toBeInstanceOf(EnhancedNode);
    expect(products[1].isWritten()).toEqual(true);

    expect(products[0].getParticipatingRelationships()).toHaveLength(2);
    expect(products[1].getParticipatingRelationships()).toHaveLength(2);
  });
  test("example1 flat", async () => {
    // Merge a pattern to Neo4j:
    // (:Person { NAME: "SpongeBob" })-[:HAS_FRIEND]->(:Person { NAME: "Patrick" })
    // (:TVSeries { NAME: "SpongeBob SquarePants" })-[:HAS_WIKIPAGE]->(:Webpage { URL: "https://en.wikipedia.org/wiki/SpongeBob_SquarePants" })
    /// db setup
    await engine.cleanDB();
    /// !db setup
    let spongeBob = { labels: ["Person"], properties: { NAME: "SpongeBob" } };
    let bikiniBottom = {
      labels: ["City"],
      properties: {
        NAME: "Bikini Bottom",
      },
    };
    let enodes: EnhancedNode[] = await mango.buildAndMergeEnhancedNodes([
      {
        // (:Person { NAME: "SpongeBob" })
        ...spongeBob,
        relationships: [
          {
            // -[:HAS_FRIEND]->
            labels: ["HAS_FRIEND"],
            partnerNode: {
              // (:Person { NAME: "Patrick" })
              labels: ["Person"],
              properties: { NAME: "Patrick" },
            },
          },
        ],
      },
      {
        // (:TVSeries { NAME: "SpongeBob SquarePants" })
        labels: ["TVSeries"],
        properties: { NAME: "SpongeBob SquarePants" },
        relationships: [
          {
            // -[:HAS_WIKIPAGE]->
            labels: ["HAS_WIKIPAGE"],
            partnerNode: {
              // (:Webpage { URL: "https://en.wikipedia.org/wiki/SpongeBob_SquarePants" })
              labels: ["Webpage"],
              properties: {
                URL: "https://en.wikipedia.org/wiki/SpongeBob_SquarePants",
              },
            },
          },
          {
            labels: ["ABOUT"],
            partnerNode: {
              labels: ["Person"],
              properties: { NAME: "SpongeBob" },
            },
          },
        ],
      },
      bikiniBottom,
      {
        ...spongeBob,
        relationships: [
          {
            labels: ["LIVES_IN"],
            properties: { since: "forever" },
            partnerNode: bikiniBottom,
          },
        ],
      },
    ]);

    expect(enodes).toBeInstanceOf(Array);
    expect(enodes.every((enode) => enode.isWritten())).toEqual(true);
  });
  test("example2 deep enodes", async () => {
    // Merge a pattern to Neo4j:
    // (:Person { NAME: "SpongeBob" })-[:HAS_FRIEND]->(:Person { NAME: "Patrick" })
    // (:TVSeries { NAME: "SpongeBob SquarePants", YEAR: 1999 })-[:HAS_WIKIPAGE]->(:Webpage { URL: "https://en.wikipedia.org/wiki/SpongeBob_SquarePants" })
    /// db setup
    await engine.cleanDB();
    /// !db setup
    let spongeBob = { labels: ["Person"], properties: { NAME: "SpongeBob" } };
    let bikiniBottom = {
      labels: ["City"],
      properties: {
        NAME: "Bikini Bottom",
      },
    };
    let enodes: EnhancedNode[] = await mango.buildAndMergeEnhancedNodes([
      {
        // (:Person { NAME: "SpongeBob" })
        ...spongeBob,
        relationships: [
          {
            // -[:HAS_FRIEND]->
            labels: ["HAS_FRIEND"],
            partnerNode: {
              // (:Person { NAME: "Patrick" })
              labels: ["Person"],
              properties: { NAME: "Patrick" },
            },
          },
        ],
      },
      {
        // (:TVSeries { NAME: "SpongeBob SquarePants" })
        labels: ["TVSeries"],
        properties: { NAME: "SpongeBob SquarePants", YEAR: 1999 },
        relationships: [
          {
            // -[:HAS_WIKIPAGE]->
            labels: ["HAS_WIKIPAGE"],
            properties: { isTooLong: true },
            partnerNode: {
              // (:Webpage { URL: "https://en.wikipedia.org/wiki/SpongeBob_SquarePants" })
              labels: ["Webpage"],
              properties: {
                URL: "https://en.wikipedia.org/wiki/SpongeBob_SquarePants",
              },
              //
              // deep enode
              //
              relationships: [
                {
                  labels: ["MENTIONS"],
                  partnerNode: bikiniBottom,
                },
              ],
            },
          },
          {
            labels: ["ABOUT"],
            partnerNode: {
              labels: ["Person"],
              properties: { NAME: "SpongeBob" },
            },
          },
        ],
      },
      bikiniBottom,
      {
        ...spongeBob,
        relationships: [
          {
            labels: ["LIVES_IN"],
            properties: { since: "forever" },
            partnerNode: bikiniBottom,
          },
        ],
      },
    ]);

    expect(enodes).toBeInstanceOf(Array);
    expect(enodes.every((enode) => enode.isWritten())).toEqual(true);
  });
});
