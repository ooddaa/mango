/* @flow */
'use strict';
// [2020-01-16] ok

import {
    Node,
    RelationshipCandidate,
    EnhancedNode,
    EnhancedNodeCandidate,
    NodeCandidate,
    Relationship,
    log
} from '../../../src'

const startNode = new NodeCandidate({
    labels: ['startNode'],
    properties: {
        required: { A: 1 }
    },
})
const endNode = new NodeCandidate({
    labels: ['endNode'],
    properties: {
        required: { B: 2 }
    },
})
const rCand = new RelationshipCandidate({
    labels: ['in_rel'],
    properties: { rel_prop: 1 },
    direction: 'inbound',
    startNode
})

const _date_created = [
    expect.any(Number),
    expect.any(Number),
    expect.any(Number),
    expect.any(Number),
    expect.any(Number)],
    _uuid = expect.any(String),
    _hash = expect.any(String),
    identity = { low: expect.any(Number), high: 0 }

describe('constructor', () => {
    test('basic, no direction', () => {
        const rc = new RelationshipCandidate({
            necessity: 'optional',
            startNode: new Node({ labels: ['startNode'] }),
            endNode: new Node({ labels: ['endNode'] }),
        })
        // log(rc)
        expect(rc).toMatchObject(/* RelationshipCandidate */ {
            labels: [],
            properties: {
                _isCurrent: true,
                _hasBeenUpdated: false,
                _dateUpdated: null,
                _userUpdated: null,
                _newRelationshipHash: null
            },
            direction: null,
            startNode: [ /* Node */ { labels: ['startNode'], properties: {}, identity: null }],
            endNode: [ /* Node */ { labels: ['endNode'], properties: {}, identity: null }],
            necessity: 'optional',
            mainNode: null,
            partnerNode: null,
        })
    })
    test('basic, no direction, endNode missing', () => {
        const rc = new RelationshipCandidate({
            labels: [],
            necessity: 'optional',
            direction: null,
            startNode: new Node({ labels: ['startNode'] }),
            // endNode: new Node({ labels: ['endNode'] }),
        })
        expect(rc).toMatchObject(/* RelationshipCandidate */ {
            labels: [],
            properties: {},
            direction: null,
            startNode: [ /* Node */ { labels: ['startNode'], properties: {}, identity: null }],
            endNode: null,
            necessity: 'optional',
            mainNode: null,
            partnerNode: null
        })
    })
    describe('necessity parameter', () => {
        test('necessity is null', () => {
            const rc = new RelationshipCandidate({
                labels: ['in_rel'],
                properties: { rel_prop: 1 },
                direction: 'inbound',
                // necessity: 'required',
                startNode: new NodeCandidate({
                    labels: ['startNode'],
                    properties: {
                        required: { A: 1 }
                    },
                })
            })
            expect(rc).toMatchObject(/* RelationshipCandidate */ {
                labels: ['in_rel'],
                properties: { rel_prop: 1 },
                direction: 'inbound',
                startNode:
                    [ /* NodeCandidate */ {
                        coreNode:
                            { labels: ['startNode'], properties: { required: { A: 1 } } }
                    }],
                endNode: null,
                necessity: 'optional',
                mainNode: null,
                partnerNode:
                    [ /* NodeCandidate */ {
                        coreNode:
                            { labels: ['startNode'], properties: { required: { A: 1 } } }
                    }]
            })
        })
    })
    describe("if there's direction, there must be partnerNode", () => {
        test('inbound, endNode missing', () => {
            const rc = new RelationshipCandidate({
                labels: [],
                necessity: 'optional',
                direction: 'inbound',
                startNode: new Node({ labels: ['startNode'] }),
                // endNode: new Node({ labels: ['endNode'] }),
            })

            expect(rc).toMatchObject(/* RelationshipCandidate */ {
                labels: [],
                properties: {},
                direction: 'inbound',
                startNode: [ /* Node */ { labels: ['startNode'], properties: {}, identity: null }],
                endNode: null,
                necessity: 'optional',
                mainNode: null,
                partnerNode: [ /* Node */ { labels: ['startNode'], properties: {}, identity: null }]
            })
        })
        test('inbound, startNode missing', () => {
            expect(() => {
                return new RelationshipCandidate({
                    labels: [],
                    // necessity: 'optional',
                    direction: 'inbound',
                    // startNode: new Node({ labels: ['startNode'] }),
                    endNode: new Node({ labels: ['endNode'] }),
                })
            }).toThrow(`RelationshipCandidate.constructor: must have startNode for inbound direction.`)
        })
        test('outbound, startNode missing', () => {
            const rc = new RelationshipCandidate({
                labels: [],
                necessity: 'optional',
                direction: 'outbound',
                // startNode: new Node({ labels: ['startNode'] }),
                endNode: new Node({ labels: ['endNode'] }),
            })

            expect(rc).toMatchObject(/* RelationshipCandidate */ {
                labels: [],
                properties: {},
                direction: 'outbound',
                startNode: null,
                endNode: [ /* Node */ { labels: ['endNode'], properties: {}, identity: null }],
                necessity: 'optional',
                mainNode: null,
                partnerNode: [ /* Node */ { labels: ['endNode'], properties: {}, identity: null }]
            })
        })
        test('outbound, endNode missing', () => {
            expect(() => {
                return new RelationshipCandidate({
                    labels: [],
                    // necessity: 'optional',
                    direction: 'outbound',
                    startNode: new Node({ labels: ['startNode'] }),
                    // endNode: new Node({ labels: ['endNode'] }),
                })
            }).toThrow(`RelationshipCandidate.constructor: must have endNode for outbound direction.`)
        })
        test('inbound, direction sets main & partner nodes', () => {
            const rc = new RelationshipCandidate({
                labels: [],
                necessity: 'optional',
                direction: 'inbound',
                startNode: new Node({ labels: ['startNode'] }),
                endNode: new Node({ labels: ['endNode'] }),
            })

            expect(rc).toMatchObject(/* RelationshipCandidate */ {
                labels: [],
                properties: {},
                direction: 'inbound',
                startNode: [ /* Node */ { labels: ['startNode'], properties: {}, identity: null }],
                endNode: [ /* Node */ { labels: ['endNode'], properties: {}, identity: null }],
                necessity: 'optional',
                mainNode: [ /* Node */ { labels: ['endNode'], properties: {}, identity: null }],
                partnerNode: [ /* Node */ { labels: ['startNode'], properties: {}, identity: null }]
            })

        })
        test('outbound, direction sets main & partner nodes', () => {
            const rc = new RelationshipCandidate({
                labels: [],
                necessity: 'optional',
                direction: 'outbound',
                startNode: new Node({ labels: ['startNode'] }),
                endNode: new Node({ labels: ['endNode'] }),
            })

            expect(rc).toMatchObject(/* RelationshipCandidate */ {
                labels: [],
                properties: {},
                direction: 'outbound',
                startNode: [ /* Node */ { labels: ['startNode'], properties: {}, identity: null }],
                endNode: [ /* Node */ { labels: ['endNode'], properties: {}, identity: null }],
                necessity: 'optional',
                mainNode: [ /* Node */ { labels: ['startNode'], properties: {}, identity: null }],
                partnerNode: [ /* Node */ { labels: ['endNode'], properties: {}, identity: null }]
            })

        })
    })
    describe('participating nodes are Nodes|NodeCandidates', () => {
        test('there must be inbound startNode', () => {
            expect(() => {
                return new RelationshipCandidate({
                    labels: ['in_rel'],
                    properties: { rel_prop: 1 },
                    direction: 'inbound',
                    endNode: null,
                    // startNode
                })
            }).toThrow(`RelationshipCandidate.constructor: must have startNode for inbound direction.`)
        })
        test('there must be outbound endNode', () => {
            expect(() => {
                return new RelationshipCandidate({
                    labels: ['in_rel'],
                    properties: { rel_prop: 1 },
                    direction: 'outbound',
                    startNode: null,
                    // endNode
                })
            }).toThrow(`RelationshipCandidate.constructor: must have endNode for outbound direction.`)
        })
    })
    describe('participating nodes are Enodes|EnodeCandidates', () => {
        test('EnhancedNode', () => {
            const rc = new RelationshipCandidate({
                labels: [],
                necessity: 'optional',
                direction: 'outbound',
                startNode: new EnhancedNode({ labels: ['startNode'] }),
                endNode: new EnhancedNode({ labels: ['endNode'] }),
            })
            expect(rc).toMatchObject(/* RelationshipCandidate */ {
                labels: [],
                properties: {},
                direction: 'outbound',
                startNode:
                    [ /* EnhancedNode */ {
                        labels: ['startNode'],
                        properties: {},
                        identity: null,
                        relationships: { inbound: [], outbound: [] }
                    }],
                endNode:
                    [ /* EnhancedNode */ {
                        labels: ['endNode'],
                        properties: {},
                        identity: null,
                        relationships: { inbound: [], outbound: [] }
                    }],
                necessity: 'optional',
                mainNode:
                    [ /* EnhancedNode */ {
                        labels: ['startNode'],
                        properties: {},
                        identity: null,
                        relationships: { inbound: [], outbound: [] }
                    }],
                partnerNode:
                    [ /* EnhancedNode */ {
                        labels: ['endNode'],
                        properties: {},
                        identity: null,
                        relationships: { inbound: [], outbound: [] }
                    }]
            })
        })
        test('EnhancedNodeCandidate', () => {
            // const rel_enode_1 = new EnhancedNodeCandidate(new NodeCandidate({ labels: ['rel_enode_1'] }))
            const rc = new RelationshipCandidate({
                labels: [],
                necessity: 'optional',
                direction: 'outbound',
                startNode: new EnhancedNodeCandidate(new NodeCandidate({ labels: ['startEnode'] })),
                endNode: new EnhancedNodeCandidate(new NodeCandidate({ labels: ['endEnode'] }),
                    {
                        required: [
                            new RelationshipCandidate({
                                labels: [],
                                necessity: 'required',
                                direction: 'outbound',
                                // startNode: // must be "endEnode" ooooh
                                endNode: 'itself' // special case to make a recursive relationship
                            })
                        ]
                    }),
            })
            expect(rc).toMatchObject(/* RelationshipCandidate */ {
                labels: [],
                properties: {},
                direction: 'outbound',
                startNode:
                    [ /* EnhancedNodeCandidate */ {
                        coreNode: /* NodeCandidate */ { coreNode: { labels: ['startEnode'] } },
                        requiredRelationships: [],
                        optionalRelationships: []
                    }],
                endNode:
                    [ /* EnhancedNodeCandidate */ {
                        coreNode: /* NodeCandidate */ { coreNode: { labels: ['endEnode'] } },
                        requiredRelationships:
                            [ /* RelationshipCandidate */ {
                                labels: [],
                                properties: {},
                                direction: 'outbound',
                                startNode: [ /* NodeCandidate */ { coreNode: { labels: ['endEnode'] } }],
                                endNode: [ /* NodeCandidate */ { coreNode: { labels: ['endEnode'] } }],
                                necessity: 'required',
                                mainNode: [ /* NodeCandidate */ { coreNode: { labels: ['endEnode'] } }],
                                partnerNode: [ /* NodeCandidate */ { coreNode: { labels: ['endEnode'] } }]
                            }],
                        optionalRelationships: []
                    }],
                necessity: 'optional',
                mainNode:
                    [ /* EnhancedNodeCandidate */ {
                        coreNode: /* NodeCandidate */ { coreNode: { labels: ['startEnode'] } },
                        requiredRelationships: [],
                        optionalRelationships: []
                    }],
                partnerNode:
                    [ /* EnhancedNodeCandidate */ {
                        coreNode: /* NodeCandidate */ { coreNode: { labels: ['endEnode'] } },
                        requiredRelationships:
                            [ /* RelationshipCandidate */ {
                                labels: [],
                                properties: {},
                                direction: 'outbound',
                                startNode: [/* NodeCandidate */ { coreNode: { labels: ['endEnode'] } }],
                                endNode: [/* NodeCandidate */ { coreNode: { labels: ['endEnode'] } }],
                                necessity: 'required',
                                mainNode: [/* NodeCandidate */ { coreNode: { labels: ['endEnode'] } }],
                                partnerNode: [/* NodeCandidate */ { coreNode: { labels: ['endEnode'] } }]
                            }],
                        optionalRelationships: []
                    }]
            })
        })
    })
    describe('setting main/partnerNode sets respective start/endNode', () => { })
})

describe('methods', () => {
    test('toObject', () => {
        const result = rCand.toObject()
        expect(result).toMatchObject({
            labels: ['in_rel'],
            properties: {
                rel_prop: 1,
                _isCurrent: true,
                _hasBeenUpdated: false,
                _dateUpdated: null,
                _userUpdated: null,
                _newRelationshipHash: null
            },
            direction: 'inbound',
            endNode: null,
            startNode
        })
    })
    test('getPartnerNode', () => {
        const result = rCand.getPartnerNode()
        expect(result).toEqual([startNode])
    })
    test('getStartNode', () => {
        const result = rCand.getStartNode()
        expect(result).toEqual([startNode])
    })
    test('getStartNode allows mutation', () => {
        // allows mutation
        const result = rCand.getStartNode()
        result[0] = 'lol'
        expect(rCand.toObject()).toMatchObject({
            startNode: 'lol'
        })
    })
    test('getEndNode', () => {
        const result = rCand.getEndNode()
        expect(result).toEqual(null)
    })
    test('getDirection', () => {
        const result = rCand.getDirection()
        expect(result).toEqual('inbound')
    })
    test('toRelationship', () => {
        const rc = new RelationshipCandidate({
            labels: ['in_rel'],
            properties: { rel_prop: 1 },
            direction: 'inbound',
            necessity: 'required',
            startNode: new Node({
                labels: ['startNode'],
                properties:
                {
                    A: 1,
                    _label: 'startNode',
                    _necessity: 'required',
                    _date_created: [2020, 2, 14, 5, 1581695167162],
                    _hash:
                        '1f0bf4c43d298df991a9fbc5dbc1d743b8471cb954d7913d655c29679704d2d0'
                },
                identity: null
            }),
            endNode: new Node({
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
        })
        const rel = rc.toRelationship()
        expect(rel).toBeInstanceOf(Relationship)
        expect(rel).toMatchObject(/* Relationship */ {
            labels: ['in_rel'],
            properties:
            {
                rel_prop: 1,
                _hash,
                _date_created,
                _necessity: 'required'
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
            necessity: 'required'
        })
    })
})