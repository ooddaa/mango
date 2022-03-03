debugger;

import { engine } from '../../start';

import {
    Builder,
    Node,
    NodeCandidate,
    EnhancedNode,
    EnhancedNodeCandidate,
    RelationshipCandidate,
    Result,
    isSuccess,
    getResultData,
    log,
    isEnhancedNode,
    Relationship,
} from '../../src';
import { UpdatingPair, UpdatedPair } from '../../src/types';

import uniqBy from 'lodash/uniqBy';
import remove from 'lodash/remove';
import flatten from 'lodash/flatten';
import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import cloneDeep from 'lodash/cloneDeep';
import flattenDeep from 'lodash/flattenDeep';


const builder = new Builder();
const remainingProp = 'optional_prop';
const _date_created = [
    expect.any(Number),
    expect.any(Number),
    expect.any(Number),
    expect.any(Number),
    expect.any(Number)];
const nodes = {};

afterAll(async (done) => {
    engine.closeAllSessions()
    engine.closeDriver()
    done()
})

describe('simple cases', async () => {

    beforeAll(async () => {
        /**
         * I need updatee in DB. I actually don't even need updater in DB,
         * I just need its properties. I want to check that updatee is marked 
         * as updated and compare hashes
         */
        const [updatee, updater]: Node[] = await builder.buildNodes([
            new NodeCandidate({
                labels: ['OldNode'],
                properties: {
                    required: {
                        NAME: 'OldNode',
                    },
                    optional: {
                        remainingProp,
                        removedProp: 666
                    }
                }
            }),
            new NodeCandidate({
                labels: ['newNode'],
                properties: {
                    required: {
                        NAME: 'newNode',
                    },
                    optional: {
                        remainingProp,
                        prop: 'optional_prop' // doubles oldNode's prop
                    }
                }
            })
        ], { extract: true })
        nodes['updatee'] = updatee
        nodes['updater'] = updater
    })

    test('no rels involved', async () => {
        /// setup
        await engine.cleanDB();
        const enodes: EnhancedNode[] =
            await engine.mergeNodes([nodes['updatee'], nodes['updater']], { extract: true })
        // log(enodes)
        expect(isEnhancedNode(enodes[0])).toEqual(true)
        /// !setup


        // const result: Result[] = await engine.markNodesAsUpdated([enodes[0]], [enodes[1]], { extract: true })
        const result: EnhancedNode[] = await engine.markNodesAsUpdated([{ updatee: enodes[0], updater: enodes[1] }], { extract: true })
        // log(result)

        expect(isEnhancedNode(result[0])).toEqual(true)
        expect(result[0].properties).toMatchObject({
            _dateUpdated: _date_created,
            _updateeNodeHash: expect.any(String),
            _userUpdated: expect.any(String),
            _hash: expect.any(String),
            _date_created: _date_created,
            _uuid: expect.any(String),
            _isCurrent: false,
            _label: 'OldNode',
            NAME: 'OldNode',
            remainingProp: 'optional_prop',
            removedProp: 666,
            _toDate: _date_created,
            _hasBeenUpdated: true
        })
    })
})