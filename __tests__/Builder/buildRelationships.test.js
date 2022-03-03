/* @flow */

import {
  Builder,
  Node,
  EnhancedNode,
  Relationship,
  RelationshipCandidate,
  isRelationship,
  Success, Failure,
  isSuccess,
  log,
  NodeCandidate
} from '../../src'

import cloneDeep from 'lodash/cloneDeep'

const builder = new Builder()
const _date_created = [
  expect.any(Number),
  expect.any(Number),
  expect.any(Number),
  expect.any(Number),
  expect.any(Number)],
  _uuid = expect.any(String),
  _hash = expect.any(String),
  identity = { low: expect.any(Number), high: 0 }

describe('validations', () => {
  test('returns [Failure] if validations not passed', async () => { })
})
describe('takes RelationshipCandidate[] as input', () => {
  test('all ok', async () => {
    const startNode = new Node({
      labels: ['startNode'],
      properties:
      {
        A: 1,
        _label: 'startNode',
        _date_created: [2020, 2, 14, 5, 1581695167162],
        _hash:
          '1f0bf4c43d298df991a9fbc5dbc1d743b8471cb954d7913d655c29679704d2d0'
      },
      identity: null
    })
    const endNode = new Node({
      labels: ['endNode'],
      properties:
      {
        B: 2,
        _label: 'endNode',
        _date_created: [2020, 2, 14, 5, 1581697228527],
        _hash:
          '35c74dcb55fb78e333521ae0c39e364b917da668108b9d65aea2bcc77d07838e'
      },
      identity: null
    })
    const rel = new RelationshipCandidate({
      labels: ['in_rel'],
      properties: { rel_prop: 1 },
      direction: 'inbound',
      startNode,
      endNode
    })

    const result =
      await builder.buildRelationships([rel])

    expect(result).toBeInstanceOf(Array)
    expect(result[0]).toBeInstanceOf(Success)
    expect(result[0].data).toBeInstanceOf(Relationship)

    expect(result[0].data).toMatchObject(/* Relationship */ {
      labels: ['in_rel'],
      properties:
      {
        rel_prop: 1,
        _hash,
        _date_created,
        _necessity: 'optional'
      },
      startNode:
       /* Node */ {
        labels: ['startNode'],
        properties:
        {
          A: 1,
          _label: 'startNode',
          _date_created,
          _hash
        },
        identity: null
      },
      endNode:
       /* Node */ {
        labels: ['endNode'],
        properties:
        {
          B: 2,
          _label: 'endNode',
          _date_created,
          _hash
        },
        identity: null
      },
      identity: null,
      direction: 'inbound',
      necessity: 'optional'
    })
  })
  test('all ok, extract true', async () => {
    const startNode = new Node({
      labels: ['startNode'],
      properties:
      {
        A: 1,
        _label: 'startNode',
        _date_created: [2020, 2, 14, 5, 1581695167162],
        _hash:
          '1f0bf4c43d298df991a9fbc5dbc1d743b8471cb954d7913d655c29679704d2d0'
      },
      identity: null
    })
    const endNode = new Node({
      labels: ['endNode'],
      properties:
      {
        B: 2,
        _label: 'endNode',
        _date_created: [2020, 2, 14, 5, 1581697228527],
        _hash:
          '35c74dcb55fb78e333521ae0c39e364b917da668108b9d65aea2bcc77d07838e'
      },
      identity: null
    })
    const rc = new RelationshipCandidate({
      labels: ['in_rel'],
      properties: { rel_prop: 1 },
      direction: 'inbound',
      startNode,
      endNode
    })
    const [rel]: Relationship =
      await builder.buildRelationships([rc], { extract: true })

    expect(isRelationship(rel)).toEqual(true)
  })
  test('missing endNode, throws', async () => {
    const startNode = new Node({
      labels: ['startNode'],
      properties:
      {
        A: 1,
        _label: 'startNode',
        _date_created: [2020, 2, 14, 5, 1581695167162],
        _hash:
          '1f0bf4c43d298df991a9fbc5dbc1d743b8471cb954d7913d655c29679704d2d0'
      },
      identity: null
    })
    const rel = new RelationshipCandidate({
      labels: ['in_rel'],
      properties: { rel_prop: 1 },
      direction: 'inbound',
      startNode,
      // endNode
    })
    const result = await builder.buildRelationships([rel])
    expect(result).toBeInstanceOf(Array)
    expect(result[0]).toBeInstanceOf(Failure)
    expect(result[0].reason).toEqual(`Builder.buildRelationships(): Logic error: cannot access endNode.`)

  })
  test('could have EnhancedNodeCandidate for start/endNode', async () => {
    builder

    /**
     * [2020-03-12] So I'm having troubles creating 3*4*4*1 DNN
     * where middle layers are enodes and have relationships.
     * Just wanted to make sure that we can have 
     * Relationships where participating nodes == EnhancedNode.
     */
    const node_0 = new Node({
      labels: ['node_0'],
      properties:
      {
        A: 1,
        _label: 'node_0',
        _date_created: [2020, 2, 14, 5, 1581695167162],
        _hash:
          '1'
      },
      identity: null
    })

    const node_3 = new Node({
      labels: ['node_3'],
      properties:
      {
        A: 3,
        _label: 'node_3',
        _date_created: [2020, 2, 14, 5, 1581695167162],
        _hash:
          '3'
      },
      identity: null
    })

    const enode_1 = /* EnhancedNode */ new EnhancedNode({
      labels: ['candidate_ok'],
      properties:
      {
        A: 1,
        _label: 'candidate_ok',
        _date_created: [2020, 3, 12, 4, 1584030537698],
        _hash:
          '7d5edc56943b093d130bfecfaad2e7e6d32649612bbaa1ee974e126c1c85d4b8'
      },
      identity: null,
      relationships:
      {
        inbound:
          [ /* Relationship */
            // {
            //   labels: [ 'in_rel' ],
            //   properties:
            //    { rel_prop: 1,
            //      _hash:
            //       'd8b796711c0a6a2fa11aa71c9c677d3ddcaf9a0cd9894a3d803be127b5325c77',
            //      _date_created: [ 2020, 3, 12, 4, 1584030537733 ] },     
            //   startNode:
            //    /* Node */ {
            //      labels: [ 'startNode' ],
            //      properties:
            //       { A: 1,
            //         _label: 'startNode',
            //         _date_created: [ 2020, 3, 12, 4, 1584030537703 ],    
            //         _hash:
            //          '1f0bf4c43d298df991a9fbc5dbc1d743b8471cb954d7913d655c29679704d2d0' },
            //      identity: null },
            //   endNode:
            //    /* Node */ {
            //      labels: [ 'candidate_ok' ],
            //      properties:
            //       { A: 1,
            //         _label: 'candidate_ok',
            //         _date_created: [ 2020, 3, 12, 4, 1584030537698 ],    
            //         _hash:
            //          '7d5edc56943b093d130bfecfaad2e7e6d32649612bbaa1ee974e126c1c85d4b8' },
            //      identity: null },
            //   identity: null,
            //   direction: 'inbound' } 
          ],
        outbound:
          [ /* Relationship */
            // {
            //   labels: [ 'out_rel' ],
            //   properties:
            //    { rel_prop: 2,
            //      _hash:
            //       'a59767e195a568c19f23edcde2b29296fa33c0de159f5e950a6f0315be3a5d9e',
            //      _date_created: [ 2020, 3, 12, 4, 1584030537749 ] },     
            //   startNode:
            //    /* Node */ {
            //      labels: [ 'candidate_ok' ],
            //      properties:
            //       { A: 1,
            //         _label: 'candidate_ok',
            //         _date_created: [ 2020, 3, 12, 4, 1584030537698 ],    
            //         _hash:
            //          '7d5edc56943b093d130bfecfaad2e7e6d32649612bbaa1ee974e126c1c85d4b8' },
            //      identity: null },
            //   endNode:
            //    /* Node */ {
            //      labels: [ 'endNode' ],
            //      properties:
            //       { B: 2,
            //         _label: 'endNode',
            //         _date_created: [ 2020, 3, 12, 4, 1584030537703 ],    
            //         _hash:
            //          '35c74dcb55fb78e333521ae0c39e364b917da668108b9d65aea2bcc77d07838e' },
            //      identity: null },
            //   identity: null,
            //   direction: 'outbound' } 
          ]
      }
    })

    const w_0 = new RelationshipCandidate({
      labels: ['w_0'],
      properties: { weight: 0 },
      startNode: node_0,
      endNode: enode_1,
      direction: 'inbound',
    })


    const result = await new Builder().buildRelationships([w_0])
    // log(result)
    expect(result.every(isSuccess)).toEqual(true)
    expect(result[0].data).toBeInstanceOf(Relationship)
    expect(result[0].data.endNode).toBeInstanceOf(EnhancedNode)
  })
  test('could have NodeCandidate for start/endNode', async () => {

    /**
     * [2021-08-02] I am having troubles with updateNodes, where I simply want 
     * to add a new relationship to an EnahncedNode. buildRelationships does not 
     * accept NodeCandidate as a startNode because it has no _hash yet.
     */
    const oldNode = new NodeCandidate({
      labels: ['oldNode'],
      properties: {
        required: { NAME: 'oldNode' }
      }
    })
    const newNode = new NodeCandidate({
      labels: ['newNode'],
      properties: {
        required: { NAME: 'newNode' }
      }
    })

    const [has_update_rel]: Relationship = await builder.buildRelationships([
      new RelationshipCandidate({
        labels: ["HAS_UPDATE"],
        properties: { REQ_PROP: "(oldNode)-[:HAS_UPDATE]->(newNode)" },
        startNode: oldNode,
        endNode: newNode
      })
    ], { extract: true })

    expect(isRelationship(has_update_rel)).toEqual(true)
  })
})