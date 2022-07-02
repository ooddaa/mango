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

describe("documentation examples", () => {
  test("simple", async () => {
    /* (:Person { NAME: "SpongeBob" })-[:HAS_FRIEND]->(:Person { NAME: "Patrick" }) */
    /// db setup
    await engine.cleanDB();
    /// !db setup
    let spongeBob: EnhancedNode = await mango.buildAndMergeEnhancedNode({
      labels: ["Person"],
      properties: { NAME: "SpongeBob" },
      relationships: [
        {
          labels: ["HAS_FRIEND"],
          partnerNode: {
            labels: ["Person"],
            properties: { NAME: "Patrick" },
          },
        },
      ],
    });
    expect(spongeBob).toBeInstanceOf(EnhancedNode);
    expect(spongeBob.isWritten()).toEqual(true);
    expect(spongeBob.getParticipatingRelationships()).toHaveLength(1);
  });
  test("complex", async () => {
    /* (:City { NAME: "Bikini Bottom" })-[:LIVES_IN]->(:Person { NAME: "SpongeBob" })-[:HAS_FRIEND]->(:Person { NAME: "Patrick" })<-[:LIVES_IN]-(:City { NAME: "Bikini Bottom" }) */
    /// db setup
    await engine.cleanDB();
    /// !db setup

    let bikiniBottom = {
      labels: ["City"],
      properties: { NAME: "Bikini Bottom" },
    };
    let spongeBob: EnhancedNode = await mango.buildAndMergeEnhancedNode({
      labels: ["Person"],
      properties: { NAME: "SpongeBob" },
      relationships: [
        {
          labels: ["LIVES_IN"],
          partnerNode: bikiniBottom,
        },
        {
          labels: ["HAS_FRIEND"],
          partnerNode: {
            labels: ["Person"],
            properties: { NAME: "Patrick" },
            relationships: [
              {
                labels: ["LIVES_IN"],
                partnerNode: bikiniBottom,
              },
            ],
          },
        },
      ],
    });

    expect(spongeBob).toBeInstanceOf(EnhancedNode);
    expect(spongeBob.isWritten()).toEqual(true);
    expect(spongeBob.getParticipatingRelationships()).toHaveLength(3);
  });
});

describe("use cases", () => {
  const verificationEvent = {

  }
  test("VerificationEvent", async () => {
    /**
     * We have
     * verifivationRequest: Relationship = (Attribute)-[:HAS_VERIFICATION_REQUEST]->(VerificationRequest)
     * 
     * We want 
     * (VerificationRequest)<-[:IN_RESPONSE_TO]-(VerificationEvent)<-[:ISSUED]-(Verifier { USER_ID: verifierCredentials })
     * 
     * verifivationRequest is passed back as 
     * 
     * VerificationEvent {
     *    available: true
          result: true
          verifierCredentials: 'oda'
          verificationRequestHash: "1828b73a1021e783f5b4b4f81c8d93295006b21b1ff97707097a07c438992237"
          verificationRequest: {
            direction: null
            endNode: {labels: Array(1), properties: {…}, identity: {…}, relationships: {…}}
            identity: {low: 17, high: 0}
            labels: ['HAS_VERIFICATION_REQUEST']
            necessity: "required"
            properties: {_date_created: Array(5), _hash: 'fe00375332c1cb781f9c3285e8cd3b6c063115be80858aa0f9b5345f2f845201', _type: 'HAS_VERIFICATION_REQUEST', _necessity: 'required', _uuid: '3b026516-45f2-47ff-894d-2bdaf226a3c2', …}
            startNode: {labels: Array(1), properties: {…}, identity: {…}, relationships: {…}}
     * }

     * we want to find VR and merge it back as an EnhancedNode
     */

    //// db setup
    await engine.cleanDB();
    const result: EnhancedNode = await mango.buildAndMergeEnhancedNode({
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
                        properties: {
                          NAME: "London",
                          ATTRIBUTE_HASH: '7b554e5e0edbcca47c425f776274630686db3ea4cf03d95c3d3a44635409c06c',
                          TIMELIMIT: false
                        },
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
    //// !db setup

    /**
     * now take London node, create a POJO and buildAndMergeEnhancedNode with it
     */
    const London: Node[] = result.findParticipatingNodes({ labels: ['City'] })
    const londonPOJO = {
      labels: London[0].labels,
      properties: London[0].properties,
      identity: London[0].identity,
      relationships: { inbound: [], outbound: [] } // found the bug!!
    }

    /* now use londonPOJO as partnerNode in (London)-[:IS_CAPITAL_OF]->(GreatBritain) */
    const rv = await mango.buildAndMergeEnhancedNode({
      labels: ['Country'],
      properties: {
        NAME: 'GreatBritain',
      },
      relationships: [
        {
          labels: ['IS_CAPITAL_OF'],
          properties: { someProp: 123 },
          partnerNode: londonPOJO
        }
      ]
    })

    // log(rv)


  })
})
