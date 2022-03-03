/* @flow */

import { engine } from '../../start';

import {
  Builder,
  Node,
  isNode,
  EnhancedNode,
  isEnhancedNode,
  NodeCandidate,
  Success,
  isSuccess,
  isFailure,
  log,
} from '../../src';

import isNull from 'lodash/isNull';

const builder = new Builder();
const _date_created = [
  expect.any(Number),
  expect.any(Number),
  expect.any(Number),
  expect.any(Number),
  expect.any(Number)],
  _uuid = expect.any(String),
  _hash = expect.any(String),
  identity = { low: expect.any(Number), high: 0 };

const nodes = {}, nodeIds = {};

afterAll(async (done) => {
  engine.closeAllSessions()
  engine.closeDriver()
  done()
})

describe('validations', () => {
  test('Should return a Failure{} no arguments.', async () => {
    const result = await engine.matchNodesById()
    expect(result).toBeInstanceOf(Array)
    expect(isSuccess(result[0])).toEqual(false)
    expect(result[0]).toMatchObject({
      reason: 'matchNodesById(): nothing was passed as an argument.',
      parameters: {},
      data: undefined
    })
  })
  test('Should return a Failure{} if argument is anything but Array.', async () => {

    const result = await engine.matchNodesById(123)
    expect(result).toBeInstanceOf(Array)
    expect(isSuccess(result[0])).toEqual(false)
    expect(result[0]).toMatchObject({
      reason: 'matchNodesById(): only accepts number[].',
      parameters: { IDs: 123 }
    })
  })
  test('Should return a Failure{} if empty IDs.', async () => {

    const result = await engine.matchNodesById([])
    expect(result).toBeInstanceOf(Array)
    expect(isSuccess(result[0])).toEqual(false)
    expect(result[0]).toMatchObject({
      reason: 'matchNodesById(): IDs array is empty.',
      parameters: { IDs: [] },
    })
  })
  test('Should contain at least one number', async () => {

    const result = await engine.matchNodesById([undefined])
    expect(result).toBeInstanceOf(Array)
    expect(isSuccess(result[0])).toEqual(false)
    expect(result[0]).toMatchObject({
      reason: 'matchNodesById(): IDs must contain at least one number.',
      parameters: { IDs: [undefined] },
    })
  })
  test('Should return a Failure{} if IDs contain something other then numbers.', async () => {

    const ids1 = [1, 2, '3']
    const result1 = await engine.matchNodesById(ids1)
    expect(result1).toBeInstanceOf(Array)
    expect(isSuccess(result1[0])).toEqual(false)
    expect(result1[0]).toMatchObject({
      reason: 'matchNodesById(): IDs array must be numbers only.',
      parameters: { IDs: ids1 },
    })

    const ids2 = [1, 2, undefined]
    const result2 = await engine.matchNodesById(ids2)
    expect(result2).toBeInstanceOf(Array)
    expect(isSuccess(result2[0])).toEqual(false)
    expect(result2[0]).toMatchObject({
      reason: 'matchNodesById(): IDs array must be numbers only.',
      parameters: { IDs: ids2 },
      data: undefined
    })

    const ids3 = [null, 2, true]
    const result3 = await engine.matchNodesById(ids3)
    expect(result3).toBeInstanceOf(Array)
    expect(isSuccess(result3[0])).toEqual(false)
    expect(result3[0]).toMatchObject({
      reason: 'matchNodesById(): IDs array must be numbers only.',
      parameters: { IDs: ids3 },
    })
  })
  test('IDs array must be numbers only.', async () => {
    //// Didn't pass validations, so data == undefined, as we
    //// did not reach the stage when we need to prepare a data container
    const [id1, id2, id3] = [1, 2, null]
    const result: Result[] = await engine.matchNodesById([id1, id2, id3])

    expect(result).toBeInstanceOf(Array)
    expect(result.length).toEqual(1)
    expect(isFailure(result[0])).toEqual(true)
    expect(result[0]).toMatchObject({
      reason: 'matchNodesById(): IDs array must be numbers only.',
      parameters: { IDs: [1, 2, null] },
      data: undefined
    })
  })
})
describe('use cases', () => {
  beforeAll(async () => {
    //// db setup
    await engine.cleanDB();
    //// !db setup
    //// build Nodes
    const [node1, node2]: Node[] = await builder.buildNodes([
      new NodeCandidate({ labels: ['Node1'], properties: { required: { A: 1 } } }),
      new NodeCandidate({ labels: ['Node2'], properties: { required: { A: 2, B: 3 } } })
    ], { extract: true })
    nodes['node1'] = node1
    nodes['node2'] = node2
    //// merge Nodes
    const [node1_, node2_]: EnhancedNode[] = await engine.mergeNodes([node1, node2], { extract: true })

    const [node1_id, node2_id, node3_id] = [node1_.getId(), node2_.getId(), 0]
    nodeIds['node1_id'] = node1_.getId()
    nodeIds['node2_id'] = node2_.getId()
    nodeIds['node3_id'] = 0
  })
  test('Every ID is matched, should return a Result[].', async () => {
    //// match by Id, both exist
    const result: Result[] = await engine.matchNodesById([nodeIds['node1_id'], nodeIds['node2_id']])

    expect(result).toBeInstanceOf(Array)
    expect(result.length).toEqual(2)

    const [first, second] = result

    /* first exists */
    expect(isSuccess(first)).toEqual(true)
    expect(first).toMatchObject({
      parameters: { id: nodeIds['node1_id'] },
      data: [expect.any(EnhancedNode)]
    })
    expect(isEnhancedNode(first.getData()[0])).toEqual(true)
    /* quite often node1_id and first's id differ by 1 
    ok this is because of unsorted result
    */
    if (first.getData()[0].getId() !== nodeIds['node1_id']) {
      console.log(`node1_id ${nodeIds['node1_id']} first.getId() ${first.getData()[0].getId()}`)
      console.log(`node2_id ${nodeIds['node2_id']} second.getId() ${second.getData()[0].getId()}`)
    }
    expect(first.getData()[0].getId()).toEqual(nodeIds['node1_id'])

    /* second exists */
    expect(isSuccess(second)).toEqual(true)
    expect(second).toMatchObject({
      parameters: { id: nodeIds['node2_id'] },
      data: [expect.any(EnhancedNode)]
    })
    expect(isEnhancedNode(second.getData()[0])).toEqual(true)
    expect(second.getData()[0].getId()).toEqual(nodeIds['node2_id'])
  })
  test('Some IDs are matched, should return a Result[].', async () => {
    //// match by Id, third one does not exist
    const result: Result[] = await engine.matchNodesById([nodeIds['node1_id'], nodeIds['node2_id'], nodeIds['node3_id']])

    expect(result).toBeInstanceOf(Array)
    expect(result.length).toEqual(3)

    const [first, second, third]: [Success, Success, Failure] = result

    /* first exists */
    expect(isSuccess(first)).toEqual(true)
    expect(first).toMatchObject({
      parameters: { id: nodeIds['node1_id'] },
      data: [expect.any(EnhancedNode)]
    })
    expect(isEnhancedNode(first.getData()[0])).toEqual(true)
    expect(first.getData()[0].getId()).toEqual(nodeIds['node1_id'])

    /* second exists */
    expect(isSuccess(second)).toEqual(true)
    expect(second).toMatchObject({
      parameters: { id: nodeIds['node2_id'] },
      data: [expect.any(EnhancedNode)]
    })
    expect(isEnhancedNode(second.getData()[0])).toEqual(true)
    expect(second.getData()[0].getId()).toEqual(nodeIds['node2_id'])

    /* third does not exist */
    expect(isSuccess(third)).toEqual(false)
    expect(third).toMatchObject({
      reason: `Node was not matched`,
      parameters: { id: nodeIds['node3_id'] },
      data: []
    })
  })
  test('Some IDs are matched, extract should return a [enode, enode, null].', async () => {
    const result: Result[] = await engine.matchNodesById([nodeIds['node1_id'], nodeIds['node2_id'], nodeIds['node3_id']], { extract: true })

    expect(result).toBeInstanceOf(Array)
    expect(result.length).toEqual(3)

    const [first, second, third]: [EnhancedNode, EnhancedNode, null] = result
    expect(isEnhancedNode(first)).toEqual(true)
    expect(isEnhancedNode(second)).toEqual(true)
    expect(isNull(third)).toEqual(true)
  })
})

