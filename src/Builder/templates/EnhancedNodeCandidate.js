/* @flow */
"use strict";

import { Node, isNode } from './Node';
import { EnhancedNode } from './EnhancedNode';
import { Relationship, isRelationship } from './Relationship';
import { NodeCandidate, isNodeCandidate } from './NodeCandidate';
import {
    RelationshipCandidate,
    isRelationshipCandidate
} from './RelationshipCandidate';
import { Failure, isFailure } from '../../Result';
import { log } from '../../utils';

import curry from 'lodash/curry';
import flatten from 'lodash/flatten';
import cloneDeep from 'lodash/cloneDeep';


function isNotFailure(val) {
    return !isFailure(val)
}

/**
 * The reason for this class is to unify input material into 
 * Builder.buildEnhancedNodes. As the process of building an 
 * EnhancedNode could take several iterations btw backend and user
 * I'd like a steady structure to represent an unfinished attempt. 
 * 
 * This structure may be gradually completed untill all requirements
 * are satisfied, at which point it's turned into EnhancedNode. 
 * 
 * For this reason, the coreNode normally starts as a NodeCandidate,
 * but throughout its life may become a Node or Failure.
 * 
 * User does not bother with wrapping whatever they pass as coreNode
 * in NodeCandidate.
 * 
 * @todo check that what user is passing as coreNode is acctually a
 * nodeObj!!
 */
class EnhancedNodeCandidate {
    coreNode: NodeCandidate | Node | Failure
    requiredRelationships: Array<RelationshipCandidate | Relationship | Failure>
    optionalRelationships: Array<RelationshipCandidate | Relationship | Failure>
    constructor(coreNode: NodeCandidate | Node | Failure,
        relationships: {
            required: Array<RelationshipCandidate | Relationship | Failure>,
            optional: Array<RelationshipCandidate | Relationship | Failure>
        } = {}
    ) {
        if (!(isNodeCandidate(coreNode) || isNode(coreNode) || isFailure(coreNode))) {
            throw new Error(`EnhancedNodeCandidate.constructor: coreNode must be NodeCandidate | Node | Failure.\ncoreNode: ${JSON.stringify(coreNode)}.`)
        }
        this.coreNode = isNodeCandidate(coreNode) || isNode(coreNode) || isFailure(coreNode) ?
            coreNode : new NodeCandidate(coreNode)
        this.requiredRelationships = relationships ?
            relationships.required || [] : []
        this.optionalRelationships = relationships ?
            relationships.optional || [] : []
        this.addCoreNodeToRelationships()
    }

    /**
     * Adds this.coreNode to
     * inbound ? endNode : startNode
     */
    addCoreNodeToRelationships() {
        // pss dude, want some curry-magic?
        const _magic = curry(_inner_magic)(this)

        function _inner_magic(ctx, rel) {
            if (isRelationshipCandidate(rel)) {
                rel.setMainNode(ctx.coreNode)

                // allow shortcut for recursive relationships
                const pn = rel.getPartnerNode()
                if (pn !== null && pn[0] === 'itself') {
                    rel.setPartnerNode(ctx.coreNode)
                }
            } else if (isRelationship(rel) && isNode(ctx.coreNode)) {
                // wait a sec, a Relationship can only have Node | EnhancedNode for start/endNode!
                rel.getDirection() === 'inbound' ?
                    rel.setEndNode(ctx.coreNode) : rel.setStartNode(ctx.coreNode)
            }
        }
        this.requiredRelationships.forEach(_magic)
        this.optionalRelationships.forEach(_magic)
    }
}

/**
 * Gives immutable access to coreNode. 
 * @public
 */
function getCoreNode(): NodeCandidate | Node | Failure {
    return this.coreNode
}
EnhancedNodeCandidate.prototype.getCoreNode = getCoreNode

/**
 * Sets coreNode. 
 * Useful for buildEnhancedNodes, as I cannot just mutate 
 * object returned by getCoreNode, unless it's wrapped in []
 * @public
 */
function setCoreNode(newCoreNode: NodeCandidate | Node | Failure): void {
    this.coreNode = isNode(newCoreNode) || isNodeCandidate(newCoreNode) || isFailure(newCoreNode) ?
        newCoreNode : new NodeCandidate(newCoreNode)

    // propagate coreNode to Relationships    
    this.addCoreNodeToRelationships()
}
EnhancedNodeCandidate.prototype.setCoreNode = setCoreNode

/**
 * Gives access to all relationships for mutation.
 * @todo must return Array<Relationship> !
 * @public
 */
function getAllRelationships(): Array<RelationshipCandidate | Relationship | Failure> {
    return this.requiredRelationships.concat(this.optionalRelationships) // !!! this creates new array!!
}
EnhancedNodeCandidate.prototype.getAllRelationships = getAllRelationships

function getAllRelationshipCandidates(): Array<RelationshipCandidate> {
    const result = this.getAllRelationships()
        .map(rel => {
            if (!isRelationshipCandidate(rel)) {
                return null
            }
            return rel
        }).filter(rel => !!rel)
    // log(result)
    return result
}
EnhancedNodeCandidate.prototype.getAllRelationshipCandidates = getAllRelationshipCandidates

/**
 * Gives access to required relationships for mutation.
 * Useful for buildEnhancedNodes. 
 * @public
 */
function getRequiredRelationships(): Array<RelationshipCandidate | Relationship | Failure> {
    return this.requiredRelationships
}
EnhancedNodeCandidate.prototype.getRequiredRelationships = getRequiredRelationships

function setRequiredRelationships(arr: Array<Failure | Relationship>): void {
    this.requiredRelationships = arr
}
EnhancedNodeCandidate.prototype.setRequiredRelationships = setRequiredRelationships

/**
 * Gives access to optional relationships for mutation.
 * Useful for buildEnhancedNodes. 
 * @public
 */
function getOptionalRelationships(): Array<RelationshipCandidate | Relationship | Failure> {
    return this.optionalRelationships
}
EnhancedNodeCandidate.prototype.getOptionalRelationships = getOptionalRelationships

function setOptionalRelationships(arr: Array<Failure | Relationship>): void {
    this.optionalRelationships = arr
}
EnhancedNodeCandidate.prototype.setOptionalRelationships = setOptionalRelationships

/**
 * Returns references to relationship nodes.
 * Allows mutable access to relationship nodes.
 */
function getAllRelationshipNodeCandidates(): Array<(NodeCandidate | EnhancedNodeCandidate)[]> {
    return this.getAllRelationships()
        .map(rel => {
            if (!isRelationshipCandidate(rel)) {
                return null
            }
            let { startNode, endNode, direction } = rel
            if (direction == undefined || direction == null) {
                throw new Error(`getAllRelationshipNodeCandidates(): RelationshipCandidate has no direction.\n${JSON.stringify(rel)}`)
            }
            if (direction == 'inbound') {
                // return startNode
                return cloneDeep(startNode)
            }
            if (direction == 'outbound') {
                // return endNode
                return cloneDeep(endNode)
            }
        }).filter(rel => rel != null)
}
EnhancedNodeCandidate.prototype.getAllRelationshipNodeCandidates = getAllRelationshipNodeCandidates

/**
 * Used to add/set RCs after the ENC was instantiated.
 * @param {*} arr 
 */
function setRequiredRelationshipCandidates(arr: RelationshipCandidate[]): void {
    if (!arr.every(isRelationshipCandidate)) {
        throw new Error(`EnhancedNodeCandidate.setRequiredRelationshipCandidates(): first argument must be RelationshipCandidate[].\n\nReceived:\n${JSON.stringify(arr)}`)
    }
    this.requiredRelationships = arr
}
EnhancedNodeCandidate.prototype.setRequiredRelationshipCandidates = setRequiredRelationshipCandidates

/**
 * Use when I need to check if this ENC has reached EN level (analogue of isWritable for Relationship):
 * 1. coreNode == Node
 * 2. if it has any relationships: ??? MUST HAVE AT LEAST ONE RELATIONSHIP ???
 *      a. are all of them == Relationship ?
 *      b. are all RelationshipNodes == Node | EnhancedNode. If EN -> recursively run isEnhanceable() on them. 
 *      c. are all Relationships writable?
 *      EN - is a structure that does not contain xxxCandidates OR Failures etc, only Node, EN, Relationships. 
 * 
 * @deprecated If a minimal EN can be created out of ENC, allow to create it (enc.enhance({ mini_bikini: true }))
 * only EN as per user's requirest must be retured as Success.
 */
function isEnhanceable(obj: { mini_bikini: boolean } = { mini_bikini: false }): boolean {
    const mini = false;

    const isCoreNodeOk = isNode(this.getCoreNode())
    // console.log(this.getAllRelationships())
    const areRelsOk =
        this.getAllRelationships()
            .reduce((acc, rel) => {
                // console.log(rel.isWritable())
                /* had a case where rel == rcs, so rel.isWritable is not even a function */
                acc = isRelationship(rel) && rel.isWritable()
                return acc
            }, true)
    // console.log(this)
    // console.log('isCoreNodeOk', isCoreNodeOk)
    // console.log('areRelsOk', areRelsOk)
    // console.log('isCoreNodeOk && areRelsOk', isCoreNodeOk && areRelsOk)
    return isCoreNodeOk && areRelsOk
}
EnhancedNodeCandidate.prototype.isEnhanceable = isEnhanceable

/**
 * Important method that promotes ENC to Enode! Enodes should only be created via this method.
 */
function toEnhancedNode(): EnhancedNode {
    /* Should I check first what is it that I want to enhance? */
    if (!this.isEnhanceable(/* { mini_bikini: true } */)) {
        throw new Error(`EnhancedNodeCandidate.toEnhancedNode: this ENC is not enhanceable yet.\n\n${JSON.stringify(this)}`)
    }
    const inbound = [
        ...this.getRequiredRelationships().filter(rel => rel.direction === 'inbound'),
        ...this.getOptionalRelationships().filter(rel => rel.direction === 'inbound'),
    ]
    const outbound = [
        ...this.getRequiredRelationships().filter(rel => rel.direction === 'outbound'),
        ...this.getOptionalRelationships().filter(rel => rel.direction === 'outbound'),
    ]
    const enode = new EnhancedNode({
        ...this.getCoreNode(),
        relationships: {
            inbound,
            outbound
        }
    })
    return enode
}
EnhancedNodeCandidate.prototype.toEnhancedNode = toEnhancedNode

function isEnhancedNodeCandidate(val: any): boolean {
    return val instanceof EnhancedNodeCandidate
}

export { EnhancedNodeCandidate, isEnhancedNodeCandidate }