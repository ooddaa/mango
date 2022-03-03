/* @flow */

import {
    wrapper,
    Node,
    EnhancedNode,
    Relationship,
    Result, Success, Failure,
    log,
    isRelationship,
    isWritten
} from '../../src';

import flatten from 'lodash/flatten';
import flattenDeep from 'lodash/flattenDeep';

const _date_created = [
    expect.any(Number),
    expect.any(Number),
    expect.any(Number),
    expect.any(Number),
    expect.any(Number)],
    _uuid = expect.any(String),
    _hash = expect.any(String),
    identity = { low: expect.any(Number), high: 0 };

test('Wraps node from N4j in Node', () => {
    const node = {
        records: [{
            _fields: [
                {
                    "identity": { "high": 0, "low": 8199 },
                    "labels": ["Transaction"],
                    "properties": {
                        "BANK": "EFG",
                        "CURRENCY": "USD", "DATE_SENT": [{ "high": 0, "low": 2018 }, { "high": 0, "low": 8 }, { "high": 0, "low": 27 }, { "high": 0, "low": 1 }, { "high": 0, "low": 123 }], "FEES_AMOUNT": { "high": 0, "low": 100 }, "PAYEE": "All Stars LLC", "PAYMENT_REFERENCE": "abc", "PAYOR": "Best Ltd", "PROJECT": "testTest", "SUM_AMOUNT": { "high": 0, "low": 900 }, "TOTAL_AMOUNT": { "high": 0, "low": 1000 }, "_date_created": [{ "high": 0, "low": 2018 }, { "high": 0, "low": 8 }, { "high": 0, "low": 27 }, { "high": 0, "low": 1 }, { "high": 0, "low": 123 }]
                    }
                }
            ]
        }]
    }


    const result = wrapper(node)
    const [enode] = flatten(result.data)
    expect(enode).toBeInstanceOf(EnhancedNode)
    expect(enode.getLabels()).toEqual(['Transaction'])

    /* All Integers must be converted into numbers */
    expect(enode.properties).toMatchObject({
        DATE_SENT: [2018, 8, 27, 1, 123],
        FEES_AMOUNT: 100,
        SUM_AMOUNT: 900,
        TOTAL_AMOUNT: 1000

    })

})
test('Wraps relationship in Relationship - one relationship', async () => {
    const node = {
        records: [
            {
                "keys": [
                    "startNode",
                    "relationship",
                    "endNode"
                ],
                "length": 3,
                "_fields": [
                    // startNode
                    {
                        "identity": {
                            "low": 14652,
                            "high": 0
                        },
                        "labels": [
                            "EnhancedNode"
                        ],
                        "properties": {
                            "a": "a",
                            "_uuid": "674b3e80-086f-4a0a-bbf3-5e3ea67fe375"
                        }
                    },
                    // relationship
                    {
                        "identity": {
                            "low": 26058,
                            "high": 0
                        },
                        "start": {
                            "low": 14652,
                            "high": 0
                        },
                        "end": {
                            "low": 14656,
                            "high": 0
                        },
                        "type": "RELATIONSHIP_OUT_5",
                        "properties": {}
                    },
                    // endNode
                    {
                        "identity": {
                            "low": 14656,
                            "high": 0
                        },
                        "labels": [
                            "Node4"
                        ],
                        "properties": {
                            "b": "b4",
                            "_uuid": "25f3e628-7d75-4a16-b866-52144edd5289"
                        }
                    }
                ],
                "_fieldLookup": {
                    "startNode": 0,
                    "relationship": 1,
                    "endNode": 2
                }
            }
        ]
    }
    const result = wrapper(node)
    // log(result)
    // const rels = flatten(result.data).filter(isRelationship)
    const [startNode, relationship, endNode] = flatten(result.data)
    expect(startNode).toBeInstanceOf(EnhancedNode)

    /* relationship */
    expect(relationship).toBeInstanceOf(Relationship)
    expect(relationship.getStartNode()).toEqual(startNode)
    expect(relationship.getEndNode()).toEqual(endNode)

    expect(endNode).toBeInstanceOf(EnhancedNode)
})
test('Wraps relationships in Relationship - multiple relationships', async () => {
    const node = {
        records: [
            {
                "keys": [
                    "startNode",
                    "relationship",
                    "endNode"
                ],
                "length": 3,
                "_fields": [
                    {
                        "identity": {
                            "low": 14652,
                            "high": 0
                        },
                        "labels": [
                            "EnhancedNode"
                        ],
                        "properties": {
                            "a": "a",
                            "_uuid": "674b3e80-086f-4a0a-bbf3-5e3ea67fe375"
                        }
                    },
                    {
                        "identity": {
                            "low": 26058,
                            "high": 0
                        },
                        "start": {
                            "low": 14652,
                            "high": 0
                        },
                        "end": {
                            "low": 14656,
                            "high": 0
                        },
                        "type": "RELATIONSHIP_OUT_5",
                        "properties": {}
                    },
                    {
                        "identity": {
                            "low": 14656,
                            "high": 0
                        },
                        "labels": [
                            "Node4"
                        ],
                        "properties": {
                            "b": "b4",
                            "_uuid": "25f3e628-7d75-4a16-b866-52144edd5289"
                        }
                    }
                ],
                "_fieldLookup": {
                    "startNode": 0,
                    "relationship": 1,
                    "endNode": 2
                }
            },
            {
                "keys": [
                    "startNode",
                    "relationship",
                    "endNode"
                ],
                "length": 3,
                "_fields": [
                    {
                        "identity": {
                            "low": 14652,
                            "high": 0
                        },
                        "labels": [
                            "EnhancedNode"
                        ],
                        "properties": {
                            "a": "a",
                            "_uuid": "674b3e80-086f-4a0a-bbf3-5e3ea67fe375"
                        }
                    },
                    {
                        "identity": {
                            "low": 26039,
                            "high": 0
                        },
                        "start": {
                            "low": 14652,
                            "high": 0
                        },
                        "end": {
                            "low": 14656,
                            "high": 0
                        },
                        "type": "RELATIONSHIP_OUT_4",
                        "properties": {
                            "c": "c4"
                        }
                    },
                    {
                        "identity": {
                            "low": 14656,
                            "high": 0
                        },
                        "labels": [
                            "Node4"
                        ],
                        "properties": {
                            "b": "b4",
                            "_uuid": "25f3e628-7d75-4a16-b866-52144edd5289"
                        }
                    }
                ],
                "_fieldLookup": {
                    "startNode": 0,
                    "relationship": 1,
                    "endNode": 2
                }
            },
            {
                "keys": [
                    "startNode",
                    "relationship",
                    "endNode"
                ],
                "length": 3,
                "_fields": [
                    {
                        "identity": {
                            "low": 14652,
                            "high": 0
                        },
                        "labels": [
                            "EnhancedNode"
                        ],
                        "properties": {
                            "a": "a",
                            "_uuid": "674b3e80-086f-4a0a-bbf3-5e3ea67fe375"
                        }
                    },
                    {
                        "identity": {
                            "low": 26038,
                            "high": 0
                        },
                        "start": {
                            "low": 14652,
                            "high": 0
                        },
                        "end": {
                            "low": 14655,
                            "high": 0
                        },
                        "type": "RELATIONSHIP_OUT_3",
                        "properties": {
                            "c": "c3"
                        }
                    },
                    {
                        "identity": {
                            "low": 14655,
                            "high": 0
                        },
                        "labels": [
                            "Node3"
                        ],
                        "properties": {
                            "b": "b3",
                            "_uuid": "a1211cfd-c9bf-4846-8218-843e413f30c5"
                        }
                    }
                ],
                "_fieldLookup": {
                    "startNode": 0,
                    "relationship": 1,
                    "endNode": 2
                }
            }
        ]
    }
    const result = wrapper(node)
    // log(result)
    const rels = flatten(result.data).filter(isRelationship)
    expect(rels.length).toEqual(3)

    const [rel1, rel2, rel3] = rels

    /* rel1 */
    expect(rel1.getStartNode()).toBeInstanceOf(Node)
    expect(rel1.getEndNode()).toBeInstanceOf(Node)

    /* rel2 */
    expect(rel2.getStartNode()).toBeInstanceOf(Node)
    expect(rel2.getEndNode()).toBeInstanceOf(Node)

    /* rel3 */
    expect(rel3.getStartNode()).toBeInstanceOf(Node)
    expect(rel3.getEndNode()).toBeInstanceOf(Node)
})
test('enhanceNode 2 hops test', async () => {
    const neo4jdata = {
        records: [ /* Record */ {
            keys: ['startNode', 'relationship', 'endNode'],
            length: 3,
            _fields:
                [ /* Node */ {
                    identity: /* Integer */ { low: 4370, high: 0 },
                    labels: ['Trade'],
                    properties:
                    {
                        _uuid: 'b1ed24fd-cff0-43af-9188-4405a2fbad35',
                        _hash:
                            '4b77cea6394496537b342eb2b9f2cb441f2fe257af4db2df2481ba911f7bf3ae',
                        _date_created: [2020, 5, 6, 3, 1588769317354],
                        _label: 'Trade',
                        TRADE_NUM: 1
                    }
                },
                [ /* Relationship */ {
                    identity: /* Integer */ { low: 7929, high: 0 },
                    start: /* Integer */ { low: 4367, high: 0 },
                    end: /* Integer */ { low: 4370, high: 0 },
                    type: 'EXECUTE',
                    properties:
                    {
                        valid: true,
                        _necessity: 'required',
                        _uuid: '2e9ac205-13fd-4b27-b306-b2d605663a04',
                        _hash:
                            'd024e49e94197d11d6e4de9f97f6709330677151ad93ccdbb69343054d3860f4',
                        _date_created: [2020, 5, 6, 3, 1588769317359]
                    }
                }],
                   /* Node */ {
                    identity: /* Integer */ { low: 4367, high: 0 },
                    labels: ['Person'],
                    properties:
                    {
                        _uuid: 'fdcdae41-4815-4e45-b65c-79c25fb4ee33',
                        _hash:
                            '6661b5fb7ed89de9f9ad37608a209c713ea318a2e35dd32853114d7bef002895',
                        _date_created: [2020, 5, 6, 3, 1588769317350],
                        _label: 'Person',
                        NAME: 'Pete'
                    }
                }],
            _fieldLookup: { startNode: 0, relationship: 1, endNode: 2 }
        },
              /* Record */ {
            keys: ['startNode', 'relationship', 'endNode'],
            length: 3,
            _fields:
                [ /* Node */ {
                    identity: /* Integer */ { low: 4373, high: 0 },
                    labels: ['DAY'],
                    properties:
                    {
                        _uuid: '37c1414c-0d56-409c-a51f-af630e0222d3',
                        DAY: 1,
                        _hash:
                            'a6276104d489efb41808ef52fffa39d2e19b6c6dd3700162eb6b72fcf8d774ac',
                        _date_created: [2020, 5, 6, 3, 1588769317356],
                        _label: 'DAY'
                    }
                },
                [ /* Relationship */ {
                    identity: /* Integer */ { low: 7929, high: 0 },
                    start: /* Integer */ { low: 4367, high: 0 },
                    end: /* Integer */ { low: 4370, high: 0 },
                    type: 'EXECUTE',
                    properties:
                    {
                        valid: true,
                        _necessity: 'required',
                        _uuid: '2e9ac205-13fd-4b27-b306-b2d605663a04',
                        _hash:
                            'd024e49e94197d11d6e4de9f97f6709330677151ad93ccdbb69343054d3860f4',
                        _date_created: [2020, 5, 6, 3, 1588769317359]
                    }
                },
                     /* Relationship */ {
                    identity: /* Integer */ { low: 7932, high: 0 },
                    start: /* Integer */ { low: 4370, high: 0 },
                    end: /* Integer */ { low: 4373, high: 0 },
                    type: 'ON_DATE',
                    properties:
                    {
                        valid: true,
                        _necessity: 'required',
                        _uuid: 'f0b3f154-de1f-45bc-9c3c-5b719c810d95',
                        _hash:
                            'ed9a74632bd67f7000d3c5ce4616c9152543e3f36c975a36e6c472a32af6c3ab',
                        _date_created: [2020, 5, 6, 3, 1588769317357]
                    }
                }],
                   /* Node */ {
                    identity: /* Integer */ { low: 4367, high: 0 },
                    labels: ['Person'],
                    properties:
                    {
                        _uuid: 'fdcdae41-4815-4e45-b65c-79c25fb4ee33',
                        _hash:
                            '6661b5fb7ed89de9f9ad37608a209c713ea318a2e35dd32853114d7bef002895',
                        _date_created: [2020, 5, 6, 3, 1588769317350],
                        _label: 'Person',
                        NAME: 'Pete'
                    }
                }],
            _fieldLookup: { startNode: 0, relationship: 1, endNode: 2 }
        },
              /* Record */ {
            keys: ['startNode', 'relationship', 'endNode'],
            length: 3,
            _fields:
                [ /* Node */ {
                    identity: /* Integer */ { low: 4371, high: 0 },
                    labels: ['Trade'],
                    properties:
                    {
                        _uuid: '38dc4050-c911-4482-847e-802cc1e2841a',
                        _hash:
                            '6c695d9c0601d9fbdc359c6c998cf08ce9a48d9984c93a993fe6d1bb89184a3f',
                        _date_created: [2020, 5, 6, 3, 1588769317354],
                        _label: 'Trade',
                        TRADE_NUM: 2
                    }
                },
                [ /* Relationship */ {
                    identity: /* Integer */ { low: 7930, high: 0 },
                    start: /* Integer */ { low: 4367, high: 0 },
                    end: /* Integer */ { low: 4371, high: 0 },
                    type: 'EXECUTE',
                    properties:
                    {
                        valid: true,
                        _necessity: 'required',
                        _uuid: '8579dcd0-4b9c-4be2-9d18-6bd8c4423074',
                        _hash:
                            'f95161ec8be1dd3ae40d62b2c02e8b5129a110a6843e99cb22ef3b7133767c2f',
                        _date_created: [2020, 5, 6, 3, 1588769317359]
                    }
                }],
                   /* Node */ {
                    identity: /* Integer */ { low: 4367, high: 0 },
                    labels: ['Person'],
                    properties:
                    {
                        _uuid: 'fdcdae41-4815-4e45-b65c-79c25fb4ee33',
                        _hash:
                            '6661b5fb7ed89de9f9ad37608a209c713ea318a2e35dd32853114d7bef002895',
                        _date_created: [2020, 5, 6, 3, 1588769317350],
                        _label: 'Person',
                        NAME: 'Pete'
                    }
                }],
            _fieldLookup: { startNode: 0, relationship: 1, endNode: 2 }
        },
              /* Record */ {
            keys: ['startNode', 'relationship', 'endNode'],
            length: 3,
            _fields:
                [ /* Node */ {
                    identity: /* Integer */ { low: 4374, high: 0 },
                    labels: ['DAY'],
                    properties:
                    {
                        _uuid: '012fbe7f-3a3c-4269-8d9f-8b90d0d77b3d',
                        DAY: 2,
                        _hash:
                            '2861374334a630b700b1f973889cae260e036614cf860f135292bf458808871f',
                        _date_created: [2020, 5, 6, 3, 1588769317356],
                        _label: 'DAY'
                    }
                },
                [ /* Relationship */ {
                    identity: /* Integer */ { low: 7930, high: 0 },
                    start: /* Integer */ { low: 4367, high: 0 },
                    end: /* Integer */ { low: 4371, high: 0 },
                    type: 'EXECUTE',
                    properties:
                    {
                        valid: true,
                        _necessity: 'required',
                        _uuid: '8579dcd0-4b9c-4be2-9d18-6bd8c4423074',
                        _hash:
                            'f95161ec8be1dd3ae40d62b2c02e8b5129a110a6843e99cb22ef3b7133767c2f',
                        _date_created: [2020, 5, 6, 3, 1588769317359]
                    }
                },
                     /* Relationship */ {
                    identity: /* Integer */ { low: 7933, high: 0 },
                    start: /* Integer */ { low: 4371, high: 0 },
                    end: /* Integer */ { low: 4374, high: 0 },
                    type: 'ON_DATE',
                    properties:
                    {
                        valid: true,
                        _necessity: 'required',
                        _uuid: '93adef68-d156-4c3d-810d-06e6c3b8db55',
                        _hash:
                            'd1b0c3eec6af894440ec85dbca2376a1a29928f4fa29d0836ef586aba1ee9992',
                        _date_created: [2020, 5, 6, 3, 1588769317358]
                    }
                }],
                   /* Node */ {
                    identity: /* Integer */ { low: 4367, high: 0 },
                    labels: ['Person'],
                    properties:
                    {
                        _uuid: 'fdcdae41-4815-4e45-b65c-79c25fb4ee33',
                        _hash:
                            '6661b5fb7ed89de9f9ad37608a209c713ea318a2e35dd32853114d7bef002895',
                        _date_created: [2020, 5, 6, 3, 1588769317350],
                        _label: 'Person',
                        NAME: 'Pete'
                    }
                }],
            _fieldLookup: { startNode: 0, relationship: 1, endNode: 2 }
        }]
    }
    const result = wrapper(neo4jdata)
    // log(result)
    // log(flattenDeep(result.data))
    const rels = flattenDeep(result.data).filter(isRelationship)
    // log(rels)
    expect(rels.length).toEqual(6)
    expect(rels.every(isWritten)).toEqual(true)
})
test('mergeRelationships case', () => {
    const neo4jdata = {
        records:
            [ /* Record */ {
                keys: ['startNode', 'relationship', 'endNode'],
                length: 3,
                _fields:
                    [ /* Node */ {
                        identity: /* Integer */ { low: 4869, high: 0 },
                        labels: ['Person'],
                        properties:
                        {
                            _hash:
                                '6661b5fb7ed89de9f9ad37608a209c713ea318a2e35dd32853114d7bef002895',
                            _uuid: 'relUUID',
                            _date_created: [2020, 5, 23, 6, 1590246569946],
                            _label: 'Person',
                            NAME: 'Pete'
                        }
                    },
               /* Relationship */ {
                        identity: /* Integer */ { low: 7096, high: 0 },
                        start: /* Integer */ { low: 4869, high: 0 },
                        end: /* Integer */ { low: 4870, high: 0 },
                        type: 'SIMPLE_REL',
                        properties:
                        {
                            val: 123,
                            _necessity: 'required',
                            _direction: 'outbound',
                            _uuid: 'b9c3a424-d92b-4121-a16c-3d43d45f7152',
                            _hash:
                                '5dd896950a3466293e2c0ffd3b4276c46a420e16f69b1a07784a9fcee228bf43',
                            _date_created: [2020, 5, 23, 6, 1590246569946]
                        },
                        // direction: 'outbound',
                        // necessity: 'required'
                    },
               /* Node */ {
                        identity: /* Integer */ { low: 4870, high: 0 },
                        labels: ['Person'],
                        properties: {
                            NAME: 'newPete',
                            _hash: 'newPeteHash',
                            _uuid: 'newPeteUUID',
                            _label: 'Person',
                            _date_created: [2020, 5, 23, 6, 1590246569946]
                        }
                    }],
                _fieldLookup: { startNode: 0, relationship: 1, endNode: 2 }
            }]
    }
    const { data, summary } /* {data,summary} */ = wrapper(neo4jdata)
    // log(data)
    const rels = flattenDeep(data).filter(isRelationship)
    expect(rels.length).toEqual(1)
    expect(rels[0]).toMatchObject({
        labels: ['SIMPLE_REL'],
        properties:
        {
            _date_created,
            val: 123,
            _necessity: 'required',
            _direction: 'outbound',
            _uuid,
            _hash
        },
        startNode:
         /* Node */ {
            labels: ['Person'],
            properties:
            {
                _hash,
                _uuid,
                _label: 'Person',
                NAME: 'Pete'
            },
            identity
        },
        endNode:
         /* Node */ {
            labels: ['Person'],
            properties: {
                _hash,
                _uuid,
                _label: 'Person',
                NAME: 'newPete'
            },
            identity
        },
        identity,
        direction: 'outbound',
        necessity: 'required'
    })
})
