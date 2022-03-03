/* @flow */
import { engine } from "../../start";
import {
  Builder,
  getResultData,
  Node,
  Relationship,
  RelationshipCandidate,
  NodeCandidate,
  EnhancedNodeCandidate,
  Result,
  isSuccess,
  log,
  EnhancedNode,
} from "../../src";
import has from "lodash/has";
import flatten from "lodash/flatten";

const builder = new Builder();

const pete = new Node({
  labels: ["Person"],
  properties: {
    // _uuid: 'fe0a1e50-73c1-430c-aee1-f8994bd81f45',
    _hash: "6661b5fb7ed89de9f9ad37608a209c713ea318a2e35dd32853114d7bef002895",
    _date_created: [2020, 5, 6, 3, 1588760891365],
    _label: "Person",
    NAME: "Pete",
  },
});
const newPete = new Node({
  labels: ["NotAPerson"],
  properties: {
    // _uuid: 'fe0a1e50-73c1-430c-aee1-f8994bd81f45',
    _hash: "newPeteHash",
    _date_created: [2020, 5, 6, 3, 1588760891365],
    _label: "NotAPerson",
    NAME: "newPete",
  },
});

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

beforeAll(async () => {
  /* drop DB */
  await engine.cleanDB();
  /// Add a (pete)-[:SIMPLE_REL]->(newPete)
  const rcs: RelationshipCandidate = new RelationshipCandidate({
    labels: ["SIMPLE_REL"],
    properties: { val: 123 },
    direction: "outbound",
    necessity: "required",
    startNode: pete,
    endNode: newPete,
  });
  const rc: Relationship[] = (await builder.buildRelationships([rcs])).map(
    getResultData
  );
  await engine.mergeRelationships(rc);
});
afterAll(async (done) => {
  engine.closeAllSessions();
  engine.closeDriver();
  done();
});

describe("validations", () => {});

describe("simple", () => {
  test("one rel, edit properties only", async () => {
    // I need to get those Relationships somehow
    /**
     * @todo I need matchPartialRelationships to be able to match by label/property only
     */
    // for now I'll just get via enode

    const [enode] = await engine.enhanceNodes([newPete], { extract: true });

    const oldRels = enode
      .getAllRelationshipsAsArray()
      .filter((rel) => rel.getLabels()[0] === "SIMPLE_REL");
    // log(oldRels)
    const rc = new RelationshipCandidate({
      labels: ["NEW_REL"],
      properties: { val: 666, SOMENEWSTUFF: "yea" },
      direction: "outbound",
      necessity: "required",
      startNode: pete,
      endNode: newPete,
    });

    const newRels: Relationship[] = (
      await builder.buildRelationships([rc])
    ).map(getResultData);

    const result: Result[] = await engine.editRelationships(oldRels, newRels);
    // log(result)
    expect(result).toBeInstanceOf(Array);
    expect(result.every(isSuccess)).toEqual(true);

    const updatedRel = result[0].getData();
    expect(updatedRel).toBeInstanceOf(Relationship);
    expect(updatedRel.isWritten()).toEqual(true);

    /* props are updated */
    expect(updatedRel.getProperties().val).toEqual(666);
    expect(updatedRel.getProperties().SOMENEWSTUFF).toEqual("yea");

    /* oldRel & newRel are in parameters */
    expect(result[0].parameters.oldRel).toEqual(oldRels[0]);
    expect(result[0].parameters.newRel).toEqual(newRels[0]);

    /* rel's ID hasn't changed */
    expect(oldRels[0].getId()).toEqual(updatedRel.getId());
  });
});

describe("complex", () => {
  beforeAll(async () => {
    /* drop DB */
    await engine.cleanDB();
    /* 
        Pete -[EXECUTE]-> Trade1 -[ON_DATE]-> Day1 
        Pete -[EXECUTE]-> Trade2 -[ON_DATE]-> Day2
        
        Joe -[EXECUTE]-> Trade3 -[ON_DATE]-> Day1
        
        ====== later ======
        Trade3b -[PREVIOUS]-> Trade3
        Trade3b -[NEXT]-> Trade3
        ===================
        
        0. Mary (no rels)
        1. Pete -[EXECUTE]-> Trade1 (1 hop)
        2. Pete -[EXECUTE]-> Trade1 -[ON_DATE]-> Day (2 hops)
        3. Pete -[EXECUTE]-> Trade1 -[ON_DATE]-> Day <-[ON_DATE]- Trade2 (3 hops)
        4. Pete -[EXECUTE]-> Trade1 -[ON_DATE]-> Day <-[ON_DATE]- Trade2 <-[EXECUTE]- Joe (4 hops)
        */
    const [pete, joe, mary] = await builder.buildEnhancedNodes(
      [
        new EnhancedNodeCandidate(
          new NodeCandidate({
            labels: ["Person"],
            properties: {
              required: {
                NAME: "Pete",
              },
            },
          }),
          {
            required: [
              new RelationshipCandidate({
                labels: ["EXECUTE"],
                properties: { valid: true },
                endNode: new EnhancedNodeCandidate(
                  new NodeCandidate({
                    labels: ["Trade"],
                    properties: {
                      required: {
                        TRADE_NUM: 1,
                      },
                    },
                  }),
                  {
                    required: [
                      new RelationshipCandidate({
                        labels: ["ON_DATE"],
                        properties: { valid: true },
                        endNode: new NodeCandidate({
                          labels: ["DAY"],
                          properties: {
                            required: {
                              DAY: 1,
                            },
                          },
                        }),
                        direction: "outbound",
                        necessity: "required",
                      }),
                    ],
                  }
                ),
                direction: "outbound",
                necessity: "required",
              }),
              new RelationshipCandidate({
                labels: ["EXECUTE"],
                properties: { valid: true },
                endNode: new EnhancedNodeCandidate(
                  new NodeCandidate({
                    labels: ["Trade"],
                    properties: {
                      required: {
                        TRADE_NUM: 2,
                      },
                    },
                  }),
                  {
                    required: [
                      new RelationshipCandidate({
                        labels: ["ON_DATE"],
                        properties: { valid: true },
                        endNode: new NodeCandidate({
                          labels: ["DAY"],
                          properties: {
                            required: {
                              DAY: 2,
                            },
                          },
                        }),
                        direction: "outbound",
                        necessity: "required",
                      }),
                    ],
                  }
                ),
                direction: "outbound",
                necessity: "required",
              }),
            ],
          }
        ),
        new EnhancedNodeCandidate(
          new NodeCandidate({
            labels: ["Person"],
            properties: {
              required: {
                NAME: "Joe",
              },
            },
          }),
          {
            required: [
              new RelationshipCandidate({
                labels: ["EXECUTE"],
                properties: { valid: true },
                endNode: new EnhancedNodeCandidate(
                  new NodeCandidate({
                    labels: ["Trade"],
                    properties: {
                      required: {
                        TRADE_NUM: 3,
                      },
                    },
                  }),
                  {
                    required: [
                      new RelationshipCandidate({
                        labels: ["ON_DATE"],
                        properties: { valid: true },
                        endNode: new NodeCandidate({
                          labels: ["DAY"],
                          properties: {
                            required: {
                              DAY: 1,
                            },
                          },
                        }),
                        direction: "outbound",
                        necessity: "required",
                      }),
                    ],
                  }
                ),
                direction: "outbound",
                necessity: "required",
              }),
            ],
          }
        ),
        new EnhancedNodeCandidate(
          new NodeCandidate({
            labels: ["Person"],
            properties: {
              required: {
                NAME: "Mary",
              },
            },
          })
        ),
      ],
      { extract: true }
    );
    // log(pete)
    await engine.mergeEnhancedNodes([pete, joe, mary]);
  });
  test("multiple rels, edit properties only", async () => {
    /**
     * total 6 rels
     * I'll take Pete with 4 hops and edit all rels, keeping them _isCurrent
     */
    let [pete_enode]: EnhancedNode = flatten(
      (await engine.enhanceNodes([pete], { hops: 4 })).map(getResultData)
    );

    let oldRels: Relationship[] = pete_enode.getParticipatingRelationships();
    expect(oldRels.length).toEqual(6);

    /* now edit all */
    const newRels: Relationship[] = oldRels.map((oldRel) => {
      oldRel.addProperty("newProp", 100);
      oldRel.addProperty("newArray", [100, 200, 300]);
      return oldRel;
    });
    const result: Result[] = (// log(result)

    /* check */
    (await engine.editRelationships(oldRels, newRels))[pete_enode] = (
      await engine.enhanceNodes([pete], { hops: 4 })
    ).map(getResultData));

    const updatedRels: Relationship[] = pete_enode.getParticipatingRelationships();
    expect(updatedRels.length).toEqual(6);
    expect(
      updatedRels.every(({ properties }) => {
        return (
          has(properties, "newProp") &&
          properties["newProp"] == 100 &&
          has(properties, "newArray") &&
          properties["newArray"].length === 3 &&
          properties["newArray"][0] === 100 &&
          properties["newArray"][1] === 200 &&
          properties["newArray"][2] === 300
        );
      })
    ).toEqual(true);
  });
});
