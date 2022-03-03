/* @flow */
import { engine } from '../../start';
import {
  Builder,
  Node,
  Relationship,
  Result, Success, Failure,
  log,
  getResultData,
  isRelationship,
  isSuccess,
  isFailure,
} from '../../src';

import flatten from 'lodash/flatten';
import isNumber from 'lodash/isNumber';

afterAll(async (done) => {
  engine.closeAllSessions()
  engine.closeDriver()
  done()
})

describe('validations', () => {
  test('[Failure] first arg not array', async () => {
    const result = await engine.matchRelationships()
    expect(result).toBeInstanceOf(Array)
    expect(result[0]).toBeInstanceOf(Failure)
    expect(result[0]).toMatchObject({
      reason: 'Engine.matchRelationships: Validation error: first argument must be array.\nfirst argument: undefined'
    })
  })
  test('[Failure] if given empty array', async () => {
    const result = await engine.matchRelationships([])
    expect(result).toBeInstanceOf(Array)
    expect(result[0]).toBeInstanceOf(Failure)
    expect(result[0]).toMatchObject({
      reason: 'Engine.matchRelationships: Validation error: first argument must be non-empty array.\nfirst argument: []'
    })
  })
  test('first argument must be Relationship[]', async () => {
    const result = await engine.matchRelationships(['something'])
    expect(result).toBeInstanceOf(Array)
    expect(result[0]).toBeInstanceOf(Failure)
    expect(result[0]).toMatchObject({
      reason: 'Engine.matchRelationships: Validation error: first argument must be Relationship[].\nfirst argument: [false]'
    })
  })
})
describe('use cases', () => {
  const [node1, node2] = [
    new Node({
      labels: ['Node1'],
      properties:
      {
        A: 'a1',
        _label: 'Node1',
        _date_created: [2020, 5, 1, 5, 1588353878818],
        _hash:
          '72f3216eee30223b4e67ba3ee8f550c4b5f56a622ef360f87feba62ba9614a9c'
      },
      identity: null
    }),
    new Node({
      labels: ['Node2'],
      properties:
      {
        A: 'a2',
        _label: 'Node2',
        _date_created: [2020, 5, 1, 5, 1588353878820],
        _hash:
          '175344f8445a5492c2cc6ff1a2556dcafc7913bec8ccd421731c8d61c92e199a'
      },
      identity: null
    }),
  ]
  const [rel1a, rel1b, rel2, rel3] = [
    new Relationship({
      labels: ['REL_TYPE_1'],
      properties:
      {
        prop: 1,
        _hash:
          '69e5171670241e8d58640e027700c7142233a9f22fc236f49689815a757878ae',
        _date_created: [2020, 5, 1, 5, 1588353878824],
        _necessity: 'optional'
      },
      startNode: node1,
      endNode: node2,
      identity: null,
      direction: null,
      necessity: 'optional'
    }),
    new Relationship({
      labels: ['REL_TYPE_1'],
      properties:
      {
        prop: 2,
        _hash:
          'a68098b05dc7ebc4a0bee6e69c57b6fb7222063c78eee2390541989c9614cdcc',
        _date_created: [2020, 5, 1, 5, 1588353878824],
        _necessity: 'optional'
      },
      startNode: node1,
      endNode: node2,
      identity: null,
      direction: null,
      necessity: 'optional'
    }),
    new Relationship({
      labels: ['REL_TYPE_2'],
      properties:
      {
        _hash:
          '91cb6aace35fbb3254ca117d96119cda32c4b8b22c2f92b48fd37fb10f282c5a',
        _date_created: [2020, 5, 1, 5, 1588353878825],
        _necessity: 'optional'
      },
      startNode: node2,
      endNode: node1,
      identity: null,
      direction: null,
      necessity: 'optional'
    }),
    new Relationship({
      labels: ['REL_TYPE_3'],
      properties:
      {
        _hash:
          '4d58c86de004b916ebab7652020415e41f0fa9e8d3e32076ddd6ad7f97939737',
        _date_created: [2020, 5, 1, 5, 1588353878825],
        _necessity: 'optional'
      },
      startNode: node2,
      endNode: node1,
      identity: null,
      direction: null,
      necessity: 'optional'
    })
  ]
  beforeAll(async () => {
    await engine.cleanDB();
    await engine.mergeNodes([node1, node2]);

    /* will add all but REL_TYPE_3 */
    await engine.addSingleRelationship(rel1a, 'all')
    await engine.addSingleRelationship(rel1b, 'all')
    await engine.addSingleRelationship(rel2, 'all')
    // await engine.mergeRelationships([rel1a, rel1b, rel2])
  })
  function isWritten(rel) { return rel.isWritten() }

  test('By labels. Success if rel matched.', async () => {
    let result: Result[] =
      await engine.matchRelationships([rel1a, rel1b, rel2], 'labels')

    expect(result).toBeInstanceOf(Array)
    expect(result.every(isSuccess)).toEqual(true)

    /* since we are matching by Label, there will be two matches for rel1a && rel1b */
    expect(result[0].data).toHaveLength(2)
    expect(result[1].data).toHaveLength(2)
    expect(result[2].data).toHaveLength(1)

    result = flatten(result.map(getResultData))
    expect(result.every(isRelationship)).toEqual(true)
    expect(result.every(isWritten)).toEqual(true)
  })
  test('By labels. Failure if rel not matched.', async () => {
    let result: Relationship[][] =
      await engine.matchRelationships([rel3], 'labels')

    expect(result).toBeInstanceOf(Array)
    expect(result).toHaveLength(1)
    expect(isFailure(result[0])).toEqual(true)
    expect(result[0]).toMatchObject({
      reason: 'Neo4j returned null.',
      parameters: { rel: rel3 },
      data: [],
    })
  })
  test('By props.', async () => {
    /* Cannot use *props* here, as Relationships must always be matched by Label in Neo4j */
    let result: Relationship[][] =
      await engine.matchRelationships([rel1a, rel1b, rel2], 'all')

    expect(result).toBeInstanceOf(Array)
    expect(result.every(isSuccess)).toEqual(true)

    /* since we are matching by Label + prop, there will be one match for rel1a && rel1b */
    expect(result[0].data).toHaveLength(1)
    expect(result[1].data).toHaveLength(1)
    expect(result[2].data).toHaveLength(1)

    result = flatten(result.map(getResultData))
    expect(result.every(isRelationship)).toEqual(true)
    expect(result.every(isWritten)).toEqual(true)
  })
  test('Should remove Neo4j Integers', async () => {
    const result: Relationship[][] =
      await engine.matchRelationships([rel1a], 'all')

    const rel = result[0].data[0]
    // log(result)
    /* _date_created & prop should be Number */
    const { _date_created, prop } = rel.properties

    expect(_date_created.every(isNumber)).toEqual(true)
    expect(_date_created).toEqual(rel1a.properties._date_created)
    expect(prop).toEqual(1)
  })
})