/* @flow */
"use strict";

import { Node, isNode } from './Node';
import { NodeCandidate } from './NodeCandidate';
import { Relationship } from './Relationship';
import { Failure, isFailure, Success, isSuccess } from '../../Result';
import { log, setDateCreated, isMissing } from '../../'

import cloneDeep from 'lodash/cloneDeep';
import isNull from 'lodash/isNull'
import { EnhancedNode } from './EnhancedNode';

import type { timeArray } from '../..types'

/**
 * This class represents an object that purpots to become a Relationship. 
 * Consumed by:
 *  buildRelationships;
 *  buildEnhancedNodes (via EnhancedNodeCandidate);
 * 
 * The main principle here - it must be self-sufficient (we might want to pass it around) ie 
 * it must contain both partner nodes (start/endNodes) and the direction description ("sufficiency").
 * 
 * At the same time we want to create RelationshipCandidate in a convinient way. 
 * For which supply of only "the other partner" + "direction" would suffice ("convinience").
 * 
 * The Builder.buildRelationship function will build a full Relationship from RelationshipCandidate.
 * 
 * So I'll choose "convenience" over "sufficiency".
 * 
 * 
 * Another key functionality of RelationshipCandidate is to provide access to start/endNode 
 * for their mutation. I use it to simplify buildEnhancedNodes, where I collect references
 * for all participating nodes via EnhancedNodeCandidate.getAllParticipatingNodes and update
 * them with new results.
 * 
 * @todo add methods so we can set main/participatingNode
 * @todo add EnhancedNodeCandidate[] as possible arguments to partnerNode & mainNode and test
 */
class RelationshipCandidate {
    labels: string[];
    properties: Object;
    direction: "inbound" | "outbound" | null;
    startNode: NodeCandidate[] | Node[] | EnhancedNodeCandidate[] | EnhancedNode[] | null;
    endNode: NodeCandidate[] | Node[] | EnhancedNodeCandidate[] | EnhancedNode[] | null;
    necessity: "required" | "optional" | "_private" | null;
    partnerNode: NodeCandidate[] | Node[] | EnhancedNode[] | Failure[];
    mainNode: null | NodeCandidate[] | Node[] | EnhancedNode[] | Failure[];
    _isCurrent: boolean;
    _hasBeenUpdated: boolean;
    _dateUpdated: timeArray | null;
    _userUpdated: string | null;
    _newRelationshipHash: string | null;
    _oldRelationshipHash: string | null;

    constructor(obj: {
        labels: string[],
        properties: Object,
        direction?: "inbound" | "outbound" | null,
        startNode: NodeCandidate | Node | EnhancedNode | EnhancedNodeCandidate | null,
        endNode: NodeCandidate | Node | EnhancedNode | EnhancedNodeCandidate | null,
        necessity?: "required" | "optional" | "_private" | null,
        _isCurrent?: boolean;
        _hasBeenUpdated?: boolean;
        _dateUpdated?: timeArray | null;
        _userUpdated?: string | null;
        _newRelationshipHash?: string | null;
        _oldRelationshipHash?: string | null;
    }) {
        if (!obj.direction && (isMissing(obj.startNode) && isMissing(obj.endNode))) {
            throw new Error(`RelationshipCandidate.constructor: both startNode == null && endNode == null. No direction. \nobj: ${JSON.stringify(obj)}.`)
        }
        if (obj.direction === 'inbound' && isMissing(obj.startNode)) {
            throw new Error(`RelationshipCandidate.constructor: must have startNode for inbound direction. \nobj: ${JSON.stringify(obj)}.`)
        }
        if (obj.direction === 'outbound' && isMissing(obj.endNode)) {
            throw new Error(`RelationshipCandidate.constructor: must have endNode for outbound direction. \nobj: ${JSON.stringify(obj)}.`)
        }
        this.labels = obj.labels || []
        this.properties = obj.properties || {}
        this.direction = obj.direction || null
        this.startNode = obj.startNode == undefined ? null : [obj.startNode]
        this.endNode = obj.endNode == undefined ? null : [obj.endNode]
        this.necessity = obj.necessity || "optional"
        this._isCurrent = isMissing(obj._isCurrent) ? true : obj._isCurrent /** @todo WHICH DEFAULT TO SET?? */
        this._hasBeenUpdated = isMissing(obj._hasBeenUpdated) ? false : obj._hasBeenUpdated /** @todo WHICH DEFAULT TO SET?? */
        this._dateUpdated = obj._dateUpdated || null
        this._userUpdated = obj._userUpdated || null
        this._newRelationshipHash = obj._newRelationshipHash || null
        this._oldRelationshipHash = obj._oldRelationshipHash || null
        this.setMainNode()
        this.setPartnerNode()
        this.setDefaultPrivateProps()
    }

    /**
     * We are setting the missing node (the Enode, mainNode whatever you call it).
     * Doubling up. As the result we have two pairs of nodes 
     * 
     * startNode - endNode <= this entails direction
     * mainNode - partnerNode <= this entails POV (point of view)
     * @param {*} newMainNode 
     */
    setMainNode(newMainNode: NodeCandidate | Node | EnhancedNode): void {
        if (this.direction == 'inbound') {
            const node = newMainNode || (this.getEndNode() !== null ? this.getEndNode()[0] : null)
            this.setEndNode(node)
            this.mainNode = node !== null ? [node] : null
        } else if (this.direction == 'outbound') {
            const node = newMainNode || (this.getStartNode() !== null ? this.getStartNode()[0] : null)
            this.setStartNode(node)
            this.mainNode = node !== null ? [node] : null
        } else {
            this.mainNode = null
        }
    }

    /**
     * Allows setting specific node as a Partner Node which
     * automatically sets the corresponding start/endNode. 
     * 
     * Or it figures it out based on direction (default behaviour).
     * 
     * @param {*} newPartnerNode 
     */
    setPartnerNode(newPartnerNode: NodeCandidate | Node | EnhancedNode): void {
        if (this.direction == 'inbound') {
            const node = newPartnerNode || (this.getStartNode() !== null ? this.getStartNode()[0] : null)
            this.setStartNode(node)
            this.partnerNode = node !== null ? [node] : null
        } else if (this.direction == 'outbound') {
            const node = newPartnerNode || (this.getEndNode() !== null ? this.getEndNode()[0] : null)
            this.setEndNode(node)
            this.partnerNode = node !== null ? [node] : null
        } else {
            this.partnerNode = null
        }
    }
}

function getLabels(): string[] {
    return this.labels;
}
RelationshipCandidate.prototype.getLabels = getLabels

function toObject(): Object {
    return {
        labels: this.labels,
        properties: this.properties,
        direction: this.direction,
        necessity: this.necessity,
        startNode: this.startNode == null ? null : this.startNode[0],
        endNode: this.endNode == null ? null : this.endNode[0],
        partnerNode: this.partnerNode == null ? null : this.partnerNode[0],
        mainNode: this.mainNode == null ? null : this.mainNode[0],
    }
}
RelationshipCandidate.prototype.toObject = toObject

/**
 * Gives mutable!! access to startNode. 
 * @public
 */
function getStartNode(): NodeCandidate[] | null {
    return this.startNode
}
RelationshipCandidate.prototype.getStartNode = getStartNode

/**
 * Gives mutable!! access to endNode. 
 * @public
 */
function getEndNode(): NodeCandidate[] | null {
    return this.endNode
}
RelationshipCandidate.prototype.getEndNode = getEndNode

/**
 * Gives direction. 
 * @public
 */
function getDirection(): string | null {
    return this.direction
}
RelationshipCandidate.prototype.getDirection = getDirection

/**
 * Gives mutable!! access to "the other node" (from EnhancedNode's point of view). 
 * @public
 */
function getPartnerNode(): NodeCandidate[] {
    return this.partnerNode
}
RelationshipCandidate.prototype.getPartnerNode = getPartnerNode

function getNecessity(): string | null {
    return this.necessity
}
RelationshipCandidate.prototype.getNecessity = getNecessity

/**
 * @todo [2020-04-04] I need to automate necessity specification. 
 * user supplies ENC == { relationships: { required: [], optional: [] }}
 * this method should discover in which array this is located.
 * @param {*} val 
 */
function setNecessity(val: 'required' | 'optional'): void {
    this.necessity = val
}
RelationshipCandidate.prototype.setNecessity = setNecessity

function setStartNode(newStartNode: NodeCandidate | Node | EnhancedNode): void {
    this.startNode = newStartNode !== null ? [newStartNode] : null
}
RelationshipCandidate.prototype.setStartNode = setStartNode

function setEndNode(newEndNode: NodeCandidate | Node | EnhancedNode): void {
    this.endNode = newEndNode !== null ? [newEndNode] : null
}
RelationshipCandidate.prototype.setEndNode = setEndNode

/**
 * Adds _isCurrent, etc to this.properties
 */
function setDefaultPrivateProps(): void {
    this.properties = {
        ...this.properties,
        _isCurrent: this._isCurrent,
        _hasBeenUpdated: this._hasBeenUpdated,
        _dateUpdated: this._dateUpdated,
        _userUpdated: this._userUpdated,
        _newRelationshipHash: this._newRelationshipHash,
        _oldRelationshipHash: this._oldRelationshipHash
    }
}
RelationshipCandidate.prototype.setDefaultPrivateProps = setDefaultPrivateProps

/**
 * Checks is this RC is ready to become a Relationship.
 * @returns a Result, with detailed reasons if unsuccessful. 
 */
function isPromotable(): Result {
    // must have a non-empty label
    const labels = this.getLabels()
    if (!labels.length || !labels[0].length) {
        return new Failure({
            reason: `RelationshipCandidate.isPromotable: no valid labels.\n\nLabels: ${JSON.stringify(labels)}`,
            data: this
        })
    }

    // must have direction
    const direction = this.getDirection()

    if ((!'inbound', 'outbound').includes(direction)) {
        return new Failure({
            reason: `RelationshipCandidate.isPromotable:: direction must be 'inbound' || 'outbound'.\n\nDirection: ${JSON.stringify(direction)}`,
            data: this
        })
    }

    // must specify necessity
    const necessity = this.getNecessity()
    if (!['required', 'optional', '_private'].includes(necessity)) {
        return new Failure({
            reason: `RelationshipCandidate.isPromotable: necessity must be 'required' || 'optional' || '_private'.\n\nNecessity: ${JSON.stringify(necessity)}`,
            data: this
        })
    }

    // must have both nodes
    const [startNode, endNode] = [this.getStartNode(), this.getEndNode()]
    if (startNode == null || endNode == null) {
        return new Failure({
            reason: `RelationshipCandidate.isPromotable: must have non-null startNode && endNode.\n\nstartNode: ${JSON.stringify(startNode)}\n\nendNode: ${JSON.stringify(endNode)}`,
            data: this
        })
    }
    // both nodes must be Node | EnhancedNode
    if (!(isNode(startNode[0]) && isNode(endNode[0]))) {
        return new Failure({
            reason: `RelationshipCandidate.isPromotable: both nodes must be Node | EnhancedNode.\n\nstartNode: ${JSON.stringify(startNode)}\n\nendNode: ${JSON.stringify(endNode)}`,
            data: this
        })
    }

    // _hash is settable
    if (!(Boolean(startNode[0].getHash()) && Boolean(endNode[0].getHash()))) {
        return new Failure({
            reason: `RelationshipCandidate.isPromotable: both nodes must have _hash.\n\nstartNode: ${JSON.stringify(startNode)}\n\nendNode: ${JSON.stringify(endNode)}`,
            data: this
        })
    }
}
RelationshipCandidate.prototype.isPromotable = isPromotable

/**
 * @todo [2020-04-04] implement and amend Builder.buildRelationships
 * Important method that promotes RC to Relationship! 
 * Relationships should only be created via this method.
 */
function toRelationship(): Relationship {
    const promotion = this.isPromotable()
    if (isFailure(promotion)) {
        throw new Error(`RelationshipCandidate.toRelationship: this RC is not promotable.\n\nReason: ${JSON.stringify(promotion.reason)}\n\nRC: ${JSON.stringify(this)}`)
    }
    const newRel = new Relationship({
        ...this.toObject(),
    })
    newRel.properties._necessity = this.getNecessity()
    newRel.properties._date_created = setDateCreated()

    newRel.properties._isCurrent = this._isCurrent
    newRel.properties._hasBeenUpdated = this._hasBeenUpdated
    newRel.properties._dateUpdated = this._dateUpdated
    newRel.properties._userUpdated = this._userUpdated
    newRel.properties._newRelationshipHash = this._newRelationshipHash
    newRel.properties._oldRelationshipHash = this._oldRelationshipHash

    newRel.setHash()
    return newRel
}
RelationshipCandidate.prototype.toRelationship = toRelationship

function isRelationshipCandidate(val: any): boolean {
    return val instanceof RelationshipCandidate
}

export { RelationshipCandidate, isRelationshipCandidate }