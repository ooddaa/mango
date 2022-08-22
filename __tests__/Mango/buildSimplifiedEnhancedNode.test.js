/* @flow */
import { engine } from "../../start";
import { Mango, Builder, log, Result, Success, EnhancedNode, chunkEvery, isEnhancedNode } from "../../src";

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

describe("build and merge deep EnhancedNode from SimplifiedNode[]", () => {
  const arr = [
    {
      labels: ["Node"],
      properties: {
        NAME: "child0",
        value: 0,
      },
    },
    {
      labels: ["Node"],
      properties: {
        NAME: "child1",
        value: 1,
      },
    },
    {
      labels: ["Node"],
      properties: {
        NAME: "child2",
        value: 2,
      },
    },
    {
      labels: ["Node"],
      properties: {
        NAME: "child3",
        value: 3,
      },
    },
  ]
  test("default rels -[NEXT]->", async () => {
    /// db setup
    await engine.cleanDB();
    /// !db setup
    
    const enode = mango.buildDeepSimplifiedEnhancedNode(arr)
    const rv = await mango.buildAndMergeEnhancedNode(enode)
    // log(rv)
    expect(isEnhancedNode(rv)).toEqual(true)
    expect(rv.isWritten()).toEqual(true)
    expect(rv.getParticipatingRelationships()).toHaveLength(3)
    expect(rv.getParticipatingNodes()).toHaveLength(4) // includes parent
  })
  test("custom rels", async () => {
    /// db setup
    await engine.cleanDB();
    /// !db setup
    const labels = ["LIKES"]
    const prop = `(${arr[0].properties.NAME})-[LIKES]->(${arr[1].properties.NAME})`

    function fn(start, end) {
      if (start.properties.NAME === 'child0') {
        return {
          labels,
          properties: { prop }
        }
      } 
      return {
        labels: ["NEXT"],
      }
    }
    
    const enode = mango.buildDeepSimplifiedEnhancedNode(arr, fn)
    const rv = await mango.buildAndMergeEnhancedNode(enode)

    expect(isEnhancedNode(rv)).toEqual(true)
    expect(rv.isWritten()).toEqual(true)
    expect(rv.getParticipatingRelationships()[0].labels).toEqual(labels)
    expect(rv.getParticipatingRelationships()[0].properties).toMatchObject({ prop }) // has custom prop
    expect(rv.getParticipatingRelationships()[1].properties.prop).toBeUndefined() // does not have custom prop
  })
  test("custom rels based on startNode label", async () => {
    /// db setup
    await engine.cleanDB();
    /// !db setup
    const labels = ["LIKES"]
    const prop = `(${arr[0].properties.NAME})-[LIKES]->(${arr[1].properties.NAME})`

    function fn(start, end) {
      if (start.properties.NAME === 'child0') {
        return {
          labels,
          properties: { prop }
        }
      } 
      return {
        labels: ["NEXT"],
      }
    }
    
    const enode = mango.buildDeepSimplifiedEnhancedNode(arr, fn)
    const rv = await mango.buildAndMergeEnhancedNode(enode)

    expect(isEnhancedNode(rv)).toEqual(true)
    expect(rv.isWritten()).toEqual(true)
    expect(rv.getParticipatingRelationships()[0].labels).toEqual(labels)
    expect(rv.getParticipatingRelationships()[0].properties).toMatchObject({ prop }) // has custom prop
    expect(rv.getParticipatingRelationships()[1].properties.prop).toBeUndefined() // does not have custom prop
  })
  test("use EnhancedNode", async () => {
    /// db setup
    await engine.cleanDB();
    const simpleNode0_ = mango.buildDeepSimplifiedEnhancedNode([
      {
        labels: ["Node0"],
        properties: {
          NAME: "Zero",
          value: 0,
        },
      },
    ])
    const node0 = await mango.buildAndMergeEnhancedNode(simpleNode0_)
    /// !db setup
    
    /* either will work */
    const enode = mango.buildDeepSimplifiedEnhancedNode([node0, ...arr])
    // const enode = mango.buildDeepSimplifiedEnhancedNode([...arr, node0])
    // const enode = mango.buildDeepSimplifiedEnhancedNode([simpleNode0_, ...arr])
    const rv = await mango.buildAndMergeEnhancedNode(enode)

    expect(isEnhancedNode(rv)).toEqual(true)
    expect(rv.isWritten()).toEqual(true)
  })
  test("add branches", async () => {
    /// db setup
    await engine.cleanDB();
    const NAME = "Zero"
    const value = 0
    const LEMMA = `${NAME}_${value}`
    const simpleNode0_ = mango.buildDeepSimplifiedEnhancedNode([
      {
        labels: ["Node0"],
        properties: {
          NAME,
          value,
        },
        // want to add branches
        relationships: [
          {
            labels: ["HAS_LEMMA"],
            partnerNode: {
              labels: ["Lemma"],
              properties: { LEMMA }
            }
          }
        ]
      },
    ])

    /// !db setup
    
    const dse = mango.buildDeepSimplifiedEnhancedNode([simpleNode0_, ...arr])
    // log(dse)
    const rv = await mango.buildAndMergeEnhancedNode(dse)
    // log(rv)
    expect(isEnhancedNode(rv)).toEqual(true)
    expect(rv.isWritten()).toEqual(true)
    expect(rv.getAllRelationshipsLabels().includes('HAS_LEMMA')).toEqual(true)

  })
  test("should match existing Node and merge with it", async () => {
    /// db setup
    await engine.cleanDB();
    /// !db setup

    const NAME = "Zero"
    const value = 0
    const LEMMA = `${NAME}_${value}`
    const simpleNode0_ = mango.buildDeepSimplifiedEnhancedNode([
      {
        labels: ["Node0"],
        properties: {
          NAME,
          value,
        },
        // want to add branches
        relationships: [
          {
            labels: ["HAS_LEMMA"],
            partnerNode: {
              labels: ["Lemma"],
              properties: { LEMMA }
            }
          }, 
          /* should link to child3 */
          {
            labels: ["DEPENDS_ON"],
            partnerNode: {
              labels: ["Node"],
              properties: { NAME: 'child3' } // should preserve optional props!
            }
          },
        ]
      },
    ])

    
    
    const dse = mango.buildDeepSimplifiedEnhancedNode([simpleNode0_, ...arr])
    // log(dse)
    const rv = await mango.buildAndMergeEnhancedNode(dse)
    
    // log(rv)
    expect(isEnhancedNode(rv)).toEqual(true)
    expect(rv.isWritten()).toEqual(true)
    expect(rv.getAllRelationshipsLabels().includes('HAS_LEMMA')).toEqual(true)

    /* check that { value: 3 } is preserved on child3 */
    const child3 = rv.findParticipatingNodes({ properties: { NAME: "child3" } })
    expect(child3).toHaveLength(2)
    expect(child3.every(({ properties: { value }}) => value === 3)).toEqual(true)
  })
  test.skip("should match existing Nodes and merge with them", async () => {
    /// db setup
    await engine.cleanDB();
    /// !db setup

    const NAME = "Zero"
    const value = 0
    const LEMMA = `${NAME}_${value}`
    const simpleNode0_ = mango.buildDeepSimplifiedEnhancedNode([
      {
        labels: ["Node0"],
        properties: {
          NAME,
          value,
        },
        // want to add branches
        relationships: [
          {
            labels: ["HAS_LEMMA"],
            partnerNode: {
              labels: ["Lemma"],
              properties: { LEMMA }
            }
          }, 
          /* should link to child3 */
          {
            labels: ["DEPENDS_ON"],
            partnerNode: {
              labels: ["Node"],
              properties: { NAME: 'child3' } 
            }
          },
        ]
      },
    ])

    const nodes = arr.map((node, i) => {
      const relationships = []
      /* if it's not the first 'root' node */
      if (i) {
        relationships.push({
          labels: ["DEPENDS_ON"],
          partnerNode: {
            labels: ["Node"],
            properties: { NAME: `child${i-1}` } // shall depend on previous child
          }
        })
      }
      return ({
        ...node,
        relationships
      })
    })
    
    const dse = mango.buildDeepSimplifiedEnhancedNode([simpleNode0_, ...nodes])
    // log(dse)
    const rv = await mango.buildAndMergeEnhancedNode(dse)
    
    // log(rv)
    expect(isEnhancedNode(rv)).toEqual(true)
    expect(rv.isWritten()).toEqual(true)
    expect(rv.getAllRelationshipsLabels().includes('HAS_LEMMA')).toEqual(true)

    /* check that { value: 0 } is preserved on child0 */
    const child0 = rv.findParticipatingNodes({ properties: { NAME: "child0" } })
    // log(child0)
    // expect(child0).toHaveLength(1)
    expect(child0.every(({ properties: { value }}) => value === 0)).toEqual(true)
  })
})

