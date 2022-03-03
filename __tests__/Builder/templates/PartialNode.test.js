/* @flow */
'use strict';
// [2020-01-16] ok

import {
    Engine,
    // TimeTree,
    Builder,
    isNodeObj,
    isRelationshipObject,
    Node,
    PartialNode,
    EnhancedNode,
    Relationship,
    db, driver, session,
    Success, Failure,
    log
} from '../../../src'

test('partialNode not needed', () => { })
test('use case for templates', async () => {
    const [pnode] = await new Builder().buildPartialNodes([{
        type: 'PartialNode',
        labels: ['Lol'],
        properties: {
            required: {
                NICKNAME: {
                    isDate: false,
                    isRange: false,
                    isCondition: false,
                    type: 'property',
                    key: 'NICKNAME',
                    value: [`foo`]
                }
            }
        }
    }], { extract: true })

    expect(pnode).toBeInstanceOf(PartialNode)
    expect(pnode).toEqual(expect.not.objectContaining({ type: 'PartialNode' }))
    expect(pnode).toEqual(expect.not.objectContaining({ createRelationships: expect.any(Function) }))
})
test('creates _hash', async () => {
    const [pnode] = await new Builder().buildPartialNodes([{
        type: 'PartialNode',
        labels: ['Lol'],
        properties: {
            required: {
                NICKNAME: {
                    isDate: false,
                    isRange: false,
                    isCondition: false,
                    type: 'property',
                    key: 'NICKNAME',
                    value: [`foo`],
                }
            }
        }
    }], { extract: true })
    const hash = 'b96f5990a6f3ced5d7b48ab2c2c0878df355c91b9c3900fb61688cc00f390f7d'
    expect(pnode).toBeInstanceOf(PartialNode)
    expect(pnode.getHash()).toEqual(hash)
})
test('toObject', async () => {
    const [pnode] = await new Builder().buildPartialNodes([{
        type: 'PartialNode',
        labels: ['Lol'],
        properties: {
            required: {
                NICKNAME: {
                    isDate: false,
                    isRange: false,
                    isCondition: false,
                    type: 'property',
                    key: 'NICKNAME',
                    value: [`foo`]
                }
            }
        }
    }], { extract: true })

    const result = pnode.toObject()
    expect(result).toMatchObject({
        labels: ['Lol'],
        properties: {
            NICKNAME: 'foo'
        }
    })
})
test('toNodeObject', async () => {
    const [pnode] = await new Builder().buildPartialNodes([{
        type: 'PartialNode',
        labels: ['Lol'],
        properties: {
            required: {
                NICKNAME: {
                    isDate: false,
                    isRange: false,
                    isCondition: false,
                    type: 'property',
                    key: 'NICKNAME',
                    value: [`foo`]
                }
            }
        }
    }], { extract: true })
    const result = pnode.toNodeObject()
    expect(result).toMatchObject({
        labels: ['Lol'],
        properties: {
            required: { NICKNAME: 'foo' }
        }
    })
})