/* @flow */
'use strict';
// [2020-01-16] ok

import {
    Node,
    EnhancedNode,
    EnhancedNodeCandidate,
    NodeCandidate,
    isNodeCandidate,
    Relationship,
    RelationshipCandidate,
    log,
    Builder,
    Success, isSuccess
} from '../../../src'

describe('constructor', () => {
    test('coreNode is NodeCandidate | Node | Failure', () => {
        expect(() => {
            return new EnhancedNodeCandidate({})
        }).toThrow(`EnhancedNodeCandidate.constructor: coreNode must be NodeCandidate | Node | Failure.`)
    })
    test('coreNode is NodeCandidate', () => {
        const enc = new EnhancedNodeCandidate(new NodeCandidate())
        expect(enc).toMatchObject( /* EnhancedNodeCandidate */ {
            coreNode: /* NodeCandidate */ { coreNode: undefined },
            requiredRelationships: [],
            optionalRelationships: []
        })
    })
    test('adds coreNode: NodeCandidate|Node to all RelationshipCandidates', () => {
        const startNode = new NodeCandidate({
            labels: ['startNode'],
            properties: {
                required: { B: 2 }
            },
        })
        const endNode = new NodeCandidate({
            labels: ['endNode'],
            properties: {
                required: { C: 3 }
            },
        })
        const required = [
            new RelationshipCandidate({
                labels: ['in_rel'],
                properties: { rel_prop: 1 },
                direction: 'inbound',
                startNode
            }),
            new RelationshipCandidate({
                labels: ['out_rel'],
                properties: { rel_prop: 2 },
                direction: 'outbound',
                endNode
            }),
        ]
        const candidate_ok = new EnhancedNodeCandidate(new NodeCandidate({
            labels: ['enode_core'],
            properties: {
                required: { A: 1 }
            },
        }), { required })

        expect(candidate_ok).toMatchObject(/* EnhancedNodeCandidate */ {
            coreNode:
             /* NodeCandidate */ {
                coreNode:
                    { labels: ['enode_core'], properties: { required: { A: 1 } } }
            },
            requiredRelationships:
                [ /* RelationshipCandidate */ {
                    labels: ['in_rel'],
                    properties: { rel_prop: 1 },
                    direction: 'inbound',
                    startNode:
                        [ /* NodeCandidate */ {
                            coreNode:
                                { labels: ['startNode'], properties: { required: { B: 2 } } }
                        }],
                    endNode: [
                        /* NodeCandidate */ {
                            coreNode:
                                { labels: ['enode_core'], properties: { required: { A: 1 } } }
                        }
                    ],
                    partnerNode:
                        [ /* NodeCandidate */ {
                            coreNode:
                                { labels: ['startNode'], properties: { required: { B: 2 } } }
                        }],
                    mainNode: [
                        /* NodeCandidate */ {
                            coreNode:
                                { labels: ['enode_core'], properties: { required: { A: 1 } } }
                        }
                    ]
                },
               /* RelationshipCandidate */ {
                    labels: ['out_rel'],
                    properties: { rel_prop: 2 },
                    direction: 'outbound',
                    startNode: [
                        /* NodeCandidate */ {
                            coreNode:
                                { labels: ['enode_core'], properties: { required: { A: 1 } } }
                        }
                    ],
                    endNode:
                        [ /* NodeCandidate */ {
                            coreNode:
                                { labels: ['endNode'], properties: { required: { C: 3 } } }
                        }],
                    partnerNode:
                        [ /* NodeCandidate */ {
                            coreNode:
                                { labels: ['endNode'], properties: { required: { C: 3 } } }
                        }],
                    mainNode: [/* NodeCandidate */ {
                        coreNode:
                            { labels: ['enode_core'], properties: { required: { A: 1 } } }
                    }
                    ]
                }],
            optionalRelationships: []
        })
    })

})

describe('methods', () => {
    test('getCoreNode', () => {
        const coreNode = new NodeCandidate()
        const enodec = new EnhancedNodeCandidate(coreNode)
        expect(enodec.getCoreNode())
            .toBeInstanceOf(NodeCandidate)
        expect(enodec.getCoreNode().getCoreNode())
            .toEqual(undefined)
    })
    test('setCoreNode', () => {
        const enodec = new EnhancedNodeCandidate(new NodeCandidate("whatever"))
        enodec.setCoreNode(new NodeCandidate("whatever and ever"))

        expect(enodec.getCoreNode())
            .toBeInstanceOf(NodeCandidate)
        expect(enodec.getCoreNode().getCoreNode())
            .toEqual("whatever and ever")
    })
    const coreNode = new NodeCandidate("whatever"),
        requiredRelationships = [
            new RelationshipCandidate({
                labels: ['a'],
                // properties: 
                direction: 'inbound',
                startNode: new NodeCandidate(),
                // endNode: new NodeCandidate(),
            })
        ],
        optionalRelationships = [
            new RelationshipCandidate({
                labels: ['b'],
                // properties: 
                direction: 'outbound',
                endNode: new NodeCandidate()
            })
        ]
    const enodec = new EnhancedNodeCandidate(coreNode, {
        required: requiredRelationships,
        optional: optionalRelationships
    })
    test('getAllRelationships', () => {
        expect(enodec.getAllRelationships())
            .toEqual([...requiredRelationships, ...optionalRelationships])
    })
    test('getRequiredRelationships allows mutation', () => {
        const requiredRelationships = [{ A: 1 }, 'b', 'c']
        const enc = new EnhancedNodeCandidate(coreNode, {
            required: requiredRelationships
        })
        let rels = enc.getRequiredRelationships()
        expect(rels).toEqual(requiredRelationships)

        // try to mutate
        rels[0].A = 'aasdaf'
        // works!
        expect(enc.getRequiredRelationships())
            .toEqual([{ A: 'aasdaf' }, 'b', 'c'])
    })
    test('getOptionalRelationships', () => {
        expect(enodec.getOptionalRelationships())
            .toEqual(optionalRelationships)
    })
    describe('getAllRelationshipNodeCandidates', () => {

    })
    describe('isEnhanceable', () => {
        test('all ok', async () => {
            const enc = new EnhancedNodeCandidate(new Node({
                labels: ['candidate_ok'],
                properties:
                {
                    A: 1,
                    _label: 'candidate_ok',
                    _date_created: [2020, 2, 19, 3, 1582124221818],
                    _hash:
                        '7d5edc56943b093d130bfecfaad2e7e6d32649612bbaa1ee974e126c1c85d4b8'
                },
                identity: null
            }), {
                required: [new Relationship({
                    labels: ['in_rel'],
                    properties:
                    {
                        rel_prop: 1,
                        _hash:
                            'd8b796711c0a6a2fa11aa71c9c677d3ddcaf9a0cd9894a3d803be127b5325c77',
                        _date_created: [2020, 2, 19, 3, 1582124221824]
                    },
                    startNode:
                        new Node({
                            labels: ['startNode'],
                            properties:
                            {
                                A: 1,
                                _label: 'startNode',
                                _date_created: [2020, 2, 19, 3, 1582124221823],
                                _hash:
                                    '1f0bf4c43d298df991a9fbc5dbc1d743b8471cb954d7913d655c29679704d2d0'
                            },
                            identity: null
                        }),
                    endNode:
                        new Node({
                            labels: ['candidate_ok'],
                            properties:
                            {
                                A: 1,
                                _label: 'candidate_ok',
                                _date_created: [2020, 2, 19, 3, 1582124221818],
                                _hash:
                                    '7d5edc56943b093d130bfecfaad2e7e6d32649612bbaa1ee974e126c1c85d4b8'
                            },
                            identity: null
                        }),
                    identity: null,
                    direction: 'inbound'
                }),
                new Relationship({
                    labels: ['out_rel'],
                    properties:
                    {
                        rel_prop: 2,
                        _hash:
                            'a59767e195a568c19f23edcde2b29296fa33c0de159f5e950a6f0315be3a5d9e',
                        _date_created: [2020, 2, 19, 3, 1582124221824]
                    },
                    startNode:
                        new Node({
                            labels: ['candidate_ok'],
                            properties:
                            {
                                A: 1,
                                _label: 'candidate_ok',
                                _date_created: [2020, 2, 19, 3, 1582124221818],
                                _hash:
                                    '7d5edc56943b093d130bfecfaad2e7e6d32649612bbaa1ee974e126c1c85d4b8'
                            },
                            identity: null
                        }),
                    endNode:
                        new Node({
                            labels: ['endNode'],
                            properties:
                            {
                                B: 2,
                                _label: 'endNode',
                                _date_created: [2020, 2, 19, 3, 1582124221823],
                                _hash:
                                    '35c74dcb55fb78e333521ae0c39e364b917da668108b9d65aea2bcc77d07838e'
                            },
                            identity: null
                        }),
                    identity: null,
                    direction: 'outbound'
                })]
            })

            expect(enc.isEnhanceable()).toEqual(true)

            const results: Result[] = await new Builder().buildEnhancedNodes([enc])

            expect(results[0]).toBeInstanceOf(Success)
            expect(results[0].getData()).toBeInstanceOf(EnhancedNode)
        })
        test('fail, missing one _hash', () => {
            const enc = new EnhancedNodeCandidate(new Node({
                labels: ['candidate_ok'],
                properties:
                {
                    A: 1,
                    _label: 'candidate_ok',
                    _date_created: [2020, 2, 19, 3, 1582124221818],
                    _hash:
                        '7d5edc56943b093d130bfecfaad2e7e6d32649612bbaa1ee974e126c1c85d4b8'
                },
                identity: null
            }), {
                required: [new Relationship({
                    labels: ['in_rel'],
                    properties:
                    {
                        rel_prop: 1,
                        _hash:
                            'd8b796711c0a6a2fa11aa71c9c677d3ddcaf9a0cd9894a3d803be127b5325c77',
                        _date_created: [2020, 2, 19, 3, 1582124221824]
                    },
                    startNode:
                        new Node({
                            labels: ['startNode'],
                            properties:
                            {
                                A: 1,
                                _label: 'startNode',
                                _date_created: [2020, 2, 19, 3, 1582124221823],
                                _hash:
                                    '1f0bf4c43d298df991a9fbc5dbc1d743b8471cb954d7913d655c29679704d2d0'
                            },
                            identity: null
                        }),
                    endNode:
                        new Node({
                            labels: ['candidate_ok'],
                            properties:
                            {
                                A: 1,
                                _label: 'candidate_ok',
                                _date_created: [2020, 2, 19, 3, 1582124221818],
                                _hash:
                                    '7d5edc56943b093d130bfecfaad2e7e6d32649612bbaa1ee974e126c1c85d4b8'
                            },
                            identity: null
                        }),
                    identity: null,
                    direction: 'inbound'
                }),
                new Relationship({
                    labels: ['out_rel'],
                    properties:
                    {
                        rel_prop: 2,
                        _hash:
                            'a59767e195a568c19f23edcde2b29296fa33c0de159f5e950a6f0315be3a5d9e',
                        _date_created: [2020, 2, 19, 3, 1582124221824]
                    },
                    startNode:
                        new Node({
                            labels: ['candidate_ok'],
                            properties:
                            {
                                A: 1,
                                _label: 'candidate_ok',
                                _date_created: [2020, 2, 19, 3, 1582124221818],
                                _hash:
                                    '7d5edc56943b093d130bfecfaad2e7e6d32649612bbaa1ee974e126c1c85d4b8'
                            },
                            identity: null
                        }),
                    endNode:
                        new Node({
                            labels: ['endNode'],
                            properties:
                            {
                                B: 2,
                                _label: 'endNode',
                                _date_created: [2020, 2, 19, 3, 1582124221823],
                                // _hash:
                                //     '35c74dcb55fb78e333521ae0c39e364b917da668108b9d65aea2bcc77d07838e'
                            },
                            identity: null
                        }),
                    identity: null,
                    direction: 'outbound'
                })]
            })

            const result = enc.isEnhanceable()
            // missing one _hash in last endNode
            expect(result).toEqual(false)
        })
    })
})
