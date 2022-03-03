/* @flow */
import { engine } from "../../start";
import {
  Builder,
  Node,
  NodeCandidate,
  EnhancedNode,
  EnhancedNodeCandidate,
  RelationshipCandidate,
  isRelationship,
  isSuccess,
  getResultData,
  log,
} from "../../src";

import uniqBy from "lodash/uniqBy";
import remove from "lodash/remove";
import flatten from "lodash/flatten";
import isString from "lodash/isString";
import cloneDeep from "lodash/cloneDeep";
import flattenDeep from "lodash/flattenDeep";

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
  await engine.mergeEnhancedNodes([pete, joe, mary]);
});
afterAll(async (done) => {
  engine.closeAllSessions();
  engine.closeDriver();
  done();
});

const builder = new Builder();

const pete = new Node({
  labels: ["Person"],
  properties: {
    // _uuid: 'fe0a1e50-73c1-430c-aee1-f8994bd81f45',
    _hash: "6661b5fb7ed89de9f9ad37608a209c713ea318a2e35dd32853114d7bef002895",
    // _date_created: [2020, 5, 6, 3, 1588760891365],
    _label: "Person",
    NAME: "Pete",
  },
});
const joe = new Node({
  labels: ["Person"],
  properties: {
    _uuid: "df2af059-d278-4c2e-8913-25ad1887d7ab",
    _hash: "3968591eb4ab429cb79acf8f95178ce9089a81758bf62cacf1dc446d5f3062de",
    _date_created: [2020, 5, 6, 3, 1588760891367],
    _label: "Person",
    NAME: "Joe",
  },
});
const mary = new Node({
  labels: ["Person"],
  properties: {
    NAME: "Mary",
    _label: "Person",
    _date_created: [2020, 5, 6, 3, 1588763501564],
    _hash: "95e09d1c20f9564fc67d6a80a138bdbe7f4a404aff135fa93a3f19fc449934a2",
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

describe("validations", () => {});
describe("use cases", async () => {
  test("no relationships", async () => {
    const result: Result[] = await engine.enhanceNodes([mary]);

    expect(result).toBeInstanceOf(Array);
    expect(result.every(isSuccess)).toEqual(true);

    const [mary_enode] = flatten(result.map(getResultData));

    /* pete 2 relationships */
    expect(mary_enode.getAllRelationshipsAsArray()).toHaveLength(0);
  });
  test("1 hop", async () => {
    const result: Result[] = await engine.enhanceNodes([pete, joe]);
    // log(result)
    expect(result).toBeInstanceOf(Array);
    expect(result.every(isSuccess)).toEqual(true);

    const [pete_enode, joe_enode] = flatten(result.map(getResultData));

    /* pete 2 relationships */
    expect(pete_enode.getAllRelationshipsAsArray()).toHaveLength(2);

    /* joe 1 relationship */
    expect(joe_enode.getAllRelationshipsAsArray()).toHaveLength(1);
  });
  test("2 hops", async () => {
    const result: Result[] = await engine.enhanceNodes([pete /* , joe */], {
      hops: 2,
    });

    expect(result).toBeInstanceOf(Array);
    expect(result.every(isSuccess)).toEqual(true);

    const [pete_enode /* , joe_enode */] = flatten(result.map(getResultData));

    expect(pete_enode).toBeInstanceOf(EnhancedNode);
    const pete_enode_copy = cloneDeep(pete_enode);

    /* pete 4 relationships */
    const rels = pete_enode.getParticipatingRelationships();
    expect(rels).toHaveLength(4);

    /* check inner enodes' relationships */
    const trade1_enode = pete_enode.relationships.outbound[0].getEndNode();
    expect(trade1_enode.getParticipatingRelationships()).toHaveLength(1);

    const trade2_enode = pete_enode.relationships.outbound[1].getEndNode();
    expect(trade2_enode.getParticipatingRelationships()).toHaveLength(1);

    /* no mutation */
    expect(pete_enode).toEqual(pete_enode_copy);
  });
});
