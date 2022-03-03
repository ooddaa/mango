/* @flow */

import { Node, isNode } from "./Node";
import {
  isNeo4jId,
  isIdArray,
  isTimeArray,
  isString,
  isNumber,
  not,
  log,
  isPresent,
  getRequiredProperties,
  getOptionalProperties,
  getPrivateProperties,
} from "../../";
import { EnhancedNode, isEnhancedNode } from "./EnhancedNode";

import { v4 as uuid } from "uuid";
import crypto from "crypto";
import keys from "lodash/keys";

import type { properties, identity, timeArray } from "../../types";
declare type Neo4jId = { low: number, high: number };

/**
 * @todo I need a PropertiesObject that is common between Node/Enode/Relationship
 */
class Relationship {
  /**
   * @todo should not be possible to create Relationship without start/end numbers
   * Is there any use case for a Relationship without a Label at least? Any Relationship
   * must have at least a (Label || one property) to be identifiable on its own.
   * This requirement enforced on Engine level (addSingleRelationship()).
   * @todo CAREFUL with dev option - need to rely on environmental var and be available only in DEV mode
   * @constructor
   * @param {string[]} labels - Array of labels
   * @param {Node} startNode - startNode of relationship
   * @param {Node} endNode - endNode of end node of relationship
   * @param {Object} properties - Map with relationship properties
   * @param {number | string | null} identity - Unique identity
   */
  labels: string[];
  startNode: Node | EnhancedNode | null;
  endNode: Node | EnhancedNode | null;
  properties: Object;
  identity: identity;
  direction: "inbound" | "outbound" | null;
  necessity: "required" | "optional" | "_private" | null;
  dev: boolean;

  /* Methods */
  getId: Function;
  copyIdentity: Function;
  getStartNodeId: Function;
  getEndNodeId: Function;
  getStartNode: Function;
  getEndNode: Function;
  getNodes: Function;
  getLabels: Function;
  getProperties: Function;
  getRequiredProperties: Function;
  getOptionalProperties: Function;
  getPrivateProperties: Function;
  getStartNodeHash: Function;
  getEndNodeHash: Function;
  getDirection: Function;
  getNecessity: Function;
  hasProperty: Function;
  addProperty: Function;
  setProperties: Function;
  setIdentity: Function;
  setStartNode: Function;
  setEndNode: Function;
  setStartNodeId: Function;
  setEndNodeId: Function;
  setStartNode_uuid: Function;
  toString: Function;
  toObject: Function;
  allLettersUp: Function;
  stringifyLabel: Function;
  hasher: Function;
  getHash: Function;
  setHash: Function;
  isWritable: Function;
  areParticipatingNodesIdentified: Function;
  isWritten: Function;
  isWritable: Function;
  shorten: Function;
  getPartnerNode: Function;
  toCypherParameterObj: Function;
  markAsEdited: Function;
  isCurrent: Function;
  hasBeenUpdated: Function;
  constructor(
    obj: {
      labels: string[],
      startNode: Node | EnhancedNode | null,
      endNode: Node | EnhancedNode | null,
      properties?: Object,
      identity?: identity,
      direction: "inbound" | "outbound" | null,
      necessity?: "required" | "optional" | "_private" | null,
      dev?: boolean,
    } = {}
  ) {
    const {
      labels,
      startNode,
      endNode,
      properties,
      direction,
      necessity,
      identity,
      dev,
    } = obj;

    // there are some constructor/methods tests which I want to run without creating a full Relationship
    if (not(dev)) {
      // enforce strict rule: start/endNode === Node | EnhancedNode
      // mainNode may be missing, as it will be set later, what's important is to have the partnerNode
      if (
        !(
          isNode(startNode) ||
          isNeo4jId(startNode) ||
          (direction === "outbound" && startNode === undefined)
        )
      ) {
        throw new Error(
          `Relationship.constructor: startNode must be Node | EnhancedNode | Neo4jId.\n\nstartNode: ${JSON.stringify(
            startNode
          )}.`
        );
      }
      if (
        !(
          isNode(endNode) ||
          isNeo4jId(endNode) ||
          (direction === "inbound" && endNode === undefined)
        )
      ) {
        throw new Error(
          `Relationship.constructor: endNode must be Node | EnhancedNode | Neo4jId.\n\nendNode: ${JSON.stringify(
            endNode
          )}.`
        );
      }
    }

    this.labels = labels || [];
    this.properties = properties || {};
    this.startNode = startNode || null;
    this.endNode = endNode || null;
    this.identity = identity || null;
    this.direction = direction || null;
    this.necessity = necessity || null;
    this.properties._hash = this.properties._hash
      ? this.properties._hash
      : this.makeHash("all");
  }

  /**
   * @important Relationship's _hash will consist of startNode + endNode hashes + Rel's label
   * @todo what about Rels' properties? ?!??! ?! !? I need to add those to the mix once
   * I create PropertyObject - that knows about { REQUIRED, optional & _private } interface
   * [2021-08-12] hehe just had bumped into exactly this bug! need to add Relationships's
   * required properties to the makeHash
   */
  makeHash(hashType: string = "label"): string | typeof undefined {
    const s_hash = this.getStartNodeHash(),
      e_hash = this.getEndNodeHash();

    if (!s_hash || !e_hash) return undefined;

    let data = "";

    if (["all"].includes(hashType)) {
      // use JSON.stringify here? or leave control to this.stringifyProperties() ?
      // unlikely that JSON.stringify() gets changed.
      data = `${this.getLabels().join("")} ${this.stringifyProperties(
        this.getRequiredProperties()
      )} ${s_hash} ${e_hash}`;
    } else {
      data = `${this.getLabels().join("")} ${s_hash} ${e_hash}`;
    }
    return this.hasher(data);
  }

  getRequiredProperties() {
    return getRequiredProperties(this.properties);
    /**@bug if dealing with ID Arrays - no good test for it yet.
     * Just gonna keep old code here.
     */
    // function getRequiredProperties(): Object {
    //   const REQUIRED = keys(this.properties).filter(
    //     word => word[0] !== "_" && word[0] === word[0].toUpperCase()
    //   );
    //   return REQUIRED.reduce((acc, key) => {
    //     acc[key] = isIdArray(this.properties[key]) ?
    //       this.properties[key].getHashableValue() : this.properties[key]
    //     return acc;
    //   }, {});
    // }
  }
  getOptionalProperties() {
    return getOptionalProperties(this.properties);
  }
  getPrivateProperties() {
    return getPrivateProperties(this.properties);
  }
}

function getId(): number | null {
  //let id
  if (this.identity === null) return null;
  if (typeof this.identity === "string") return Number(this.identity);
  if (typeof this.identity === "object") return Number(this.identity.low);
  return this.identity; // a string when retrieved from Neo4j
}
Relationship.prototype.getId = getId;

function copyIdentity(): Object | null {
  return this.identity;
}
Relationship.prototype.copyIdentity = copyIdentity;

function getStartNodeId(): number | null {
  return this.getStartNode().getId();
}
Relationship.prototype.getStartNodeId = getStartNodeId;

function getEndNodeId(): number | null {
  return this.getEndNode().getId();
}
Relationship.prototype.getEndNodeId = getEndNodeId;

function getStartNode(): Node | EnhancedNode {
  return this.startNode;
}
Relationship.prototype.getStartNode = getStartNode;

function getEndNode(): Node | EnhancedNode {
  return this.endNode;
}
Relationship.prototype.getEndNode = getEndNode;

function getNodes(): (Node | EnhancedNode)[] {
  return [this.getStartNode(), this.getEndNode()];
}
Relationship.prototype.getNodes = getNodes;

function getLabels(): string[] {
  return this.labels;
}
Relationship.prototype.getLabels = getLabels;

function getProperties(): Object {
  return this.properties;
}
Relationship.prototype.getProperties = getProperties;

function getProperty(prop: string): any {
  return this.properties[prop];
}
Relationship.prototype.getProperty = getProperty;

function getStartNodeHash(): string | typeof undefined {
  const startNode = this.getStartNode();
  if (startNode && isNode(startNode) && startNode.getHash()) {
    return startNode.getHash();
  }
  return undefined;
}
Relationship.prototype.getStartNodeHash = getStartNodeHash;

function getEndNodeHash(): string | typeof undefined {
  const endNode = this.getEndNode();
  if (endNode && isNode(endNode) && endNode.getHash()) {
    return endNode.getHash();
  }
  return undefined;
}
Relationship.prototype.getEndNodeHash = getEndNodeHash;

function getDirection(): string | null {
  return this.direction;
}
Relationship.prototype.getDirection = getDirection;

function getNecessity(): string | null {
  return this.necessity;
}
Relationship.prototype.getNecessity = getNecessity;

function hasProperty(prop: string): boolean {
  return Object.keys(this.properties).includes(prop);
}
Relationship.prototype.hasProperty = hasProperty;

function addProperty(propName: string, propVal: any): Relationship {
  this.properties[propName] = propVal;
  return this;
}
Relationship.prototype.addProperty = addProperty;

function setProperties(val: Object): void {
  /**
   *  @todo add val check
   */
  this.properties = val;
}
Relationship.prototype.setProperties = setProperties;

function setIdentity(val: identity): Relationship {
  this.identity = val;
  return this;
}
Relationship.prototype.setIdentity = setIdentity;

function setDirection(direction: "inbound" | "outbound"): void {
  if (!direction) {
    throw new Error(
      `Relationship.setDirection: direction not supplied.\ndirection: ${JSON.stringify(
        direction
      )}`
    );
    // attemtp to self discover
    // that would involve checking if this Relationship is placed as
    // part of an EnhancedNode...
  }
  this.direction = direction;
}
Relationship.prototype.setDirection = setDirection;

function setStartNode(node: Node | EnhancedNode): void {
  this.startNode = node;
}
Relationship.prototype.setStartNode = setStartNode;

function setEndNode(node: Node): void {
  this.endNode = node;
}
Relationship.prototype.setEndNode = setEndNode;

function setStartNodeId(identity: Neo4jId): void {
  if (this.startNode.identity === null) {
    this.startNode.identity = identity; // identity.low ??
  }
}
Relationship.prototype.setStartNodeId = setStartNodeId;

function setEndNodeId(identity: Neo4jId): void {
  if (this.endNode.identity === null) {
    this.endNode.identity = identity; // identity.low ??
  }
}
Relationship.prototype.setEndNodeId = setEndNodeId;

function setStartNode_uuid(_uuid: string): void {
  if (
    !this.startNode.properties._uuid ||
    typeof this.startNode.properties.uuid !== "string"
  ) {
    this.startNode.properties._uuid = _uuid;
  }
}
Relationship.prototype.setStartNode_uuid = setStartNode_uuid;

function setEndNode_uuid(_uuid: string): void {
  if (
    !this.endNode.properties._uuid ||
    typeof this.endNode.properties.uuid !== "string"
  )
    this.endNode.properties._uuid = _uuid;
}
Relationship.prototype.setEndNode_uuid = setEndNode_uuid;

function toString(parameter: string = "all"): string {
  if (["labels", "label", "lable", "lables"].includes(parameter))
    return `${this.stringifyLabel(this.labels)}`;
  if (["properties", "props"].includes(parameter)) {
    return `${this.stringifyProperties(this.properties)}`.slice(1);
  }
  if (["_hash", "hash"].includes(parameter)) {
    return `${this.stringifyLabel(this.labels)}${this.stringifyProperties({
      _hash: this.getHash(),
    })}`;
  }
  /**
   * @todo Why dont' include _hash here?? In tests I have _hash: undefined everywhere.
   */
  const props /* exlude _private */ = {
    ...this.getRequiredProperties(),
    ...this.getOptionalProperties(),
    _hash: this.getHash(),
  };
  return `${this.stringifyLabel(this.labels)}${this.stringifyProperties(
    props
  )}`;
}
Relationship.prototype.toString = toString;

function toObject(): Object {
  return {
    identity: this.identity,
    labels: this.labels,
    properties: this.properties,
    startNode: this.startNode,
    endNode: this.endNode,
    direction: this.direction,
  };
}
Relationship.prototype.toObject = toObject;

function allLettersUp(str: string): string {
  return str.toUpperCase();
}
Relationship.prototype.allLettersUp = allLettersUp;

function stringifyLabel(labels: string[] | string): string {
  if (typeof labels === "string" && labels.length)
    return `:${this.allLettersUp(labels)}`;
  if (labels instanceof Array)
    return labels.map((each) => this.stringifyLabel(each)).join("");
  return labels.toString(); // what shall we do here? what's the default
  //behavior? we will only have either str or [str1, str2]
}
Relationship.prototype.stringifyLabel = stringifyLabel;

function stringifyProperties(properties: Object): string {
  if (!properties) return ``;
  const array = Object.entries(properties);
  if (!array.length) return ``;
  const stringifyPerType = (val: any): string => {
    if (typeof val === "undefined") return `'undefined'`;
    if (typeof val === "string") return `'${String(val)}'`;
    if (typeof val === "number") return `${val}`;
    if (typeof val === "boolean") return !!val ? "true" : "false";
    if (val instanceof Array) {
      const result = val.reduce((acc, elm) => {
        acc += `${elm}, `; // stringifyPerType(elm) ?!?!?!
        return acc;
      }, ``);
      return `[${result.substr(0, result.length - 2)}]`;
    }
    return ``;
  };
  const result = array.reduce((acc, element) => {
    let [key, value] = element;
    acc += `${key}: ${stringifyPerType(value)}, `;
    return acc;
  }, "");
  return ` {${result.substr(0, result.length - 2)}}`;
}
Relationship.prototype.stringifyProperties = stringifyProperties;

function hasher(data: string): string {
  const hash = crypto.createHash("sha256");
  hash.update(data);
  const result = hash.digest("hex");
  return result;
}
Relationship.prototype.hasher = hasher;

function getHash(): string | typeof undefined {
  return this.properties._hash;
}
Relationship.prototype.getHash = getHash;

function setHash(hashType: string = "label"): void {
  this.properties._hash = this.makeHash(hashType);
}
Relationship.prototype.setHash = setHash;

/**
 * A Relationship is writable when:
 * 1. It has a _hash (meaning all participatingNodes have _hashes and can be merged).
 *
 * Checks all required _hashes exist. Means we can merge this into DB via mergeRelationships.
 * hm it turns out ([2020-03-13]) I don't have an Engine.mergeRelationships =)
 * Any Relationship merging is done in _ensure_relationships of Engine.mergeEnhancedNodes
 * For which isWritable should check IDs !!
 *
 */
function isWritable(): boolean {
  const startNode = this.getStartNode(),
    endNode = this.getEndNode();

  return Boolean(
    this.getHash() &&
      isNode(startNode) &&
      startNode.getHash() &&
      isNode(endNode) &&
      endNode.getHash()
  );
}
Relationship.prototype.isWritable = isWritable;

/**
 * This to be used when we mergeEnhancedNodes and have already identified all Nodes.
 */
function areParticipatingNodesIdentified(): boolean {
  return !!(
    this.getStartNode().getId() &&
    this.getStartNode().getProperty("_uuid") &&
    this.getEndNode().getId() &&
    this.getEndNode().getProperty("_uuid")
  );
}
Relationship.prototype.areParticipatingNodesIdentified = areParticipatingNodesIdentified;

/**
 * Checks if
 * this Relationship, its start and end Nodes each has been assigned:
 *  i. _hash (built successfully by Builder)
 *  i. Id (written successfully to Neo4j)
 * @todo add _uuid check?
 */
function _isWritten(): boolean {
  const relHashOk = isPresent(this.getHash()) && isString(this.getHash());
  const relIdOk = isPresent(this.getId()) && isNumber(this.getId());
  const startNodeHashOk =
    isPresent(this.getStartNode().getHash()) &&
    isString(this.getStartNode().getHash());
  const startNodeIdOk =
    isPresent(this.getStartNode().getId()) &&
    isNumber(this.getStartNode().getId());
  const endNodeHashOk =
    isPresent(this.getEndNode().getHash()) &&
    isString(this.getEndNode().getHash());
  const endNodeIdOk =
    isPresent(this.getEndNode().getId()) && isNumber(this.getEndNode().getId());
  return !!(
    relHashOk &&
    relIdOk &&
    startNodeHashOk &&
    startNodeIdOk &&
    endNodeHashOk &&
    endNodeIdOk
  );
}
Relationship.prototype.isWritten = _isWritten;

/**
 * Will use to return flat Relationships - where participatingNodes == Nodes ONLY!
 * So that it's easy to merge into Neo4j them one by one.
 */
function shorten(): Relationship {
  this.startNode = this.startNode.toNode();
  this.endNode = this.endNode.toNode();
  return this;
}
Relationship.prototype.shorten = shorten;

/**
 * Gives immutable access to "the other node" (from EnhancedNode's point of view).
 * @public
 */
function getPartnerNode(): NodeCandidate[] {
  return this.direction === "inbound" ? this.startNode : this.endNode;
}
Relationship.prototype.getPartnerNode = getPartnerNode;

/**
 * Transform Relationship into a parameters object that Cypher expects.
 */
function toCypherParameterObj(): Object {
  const startNode = this.getStartNode(),
    endNode = this.getEndNode();
  return {
    startNode_id: this.getStartNodeId(),
    startNode_hash: this.getStartNodeHash(),
    startNodeProperties: {
      all: {
        ...this.startNode.getRequiredProperties(),
        ...this.startNode.getOptionalProperties(),
        ...this.startNode.getPrivateProperties(),
      },
      nonPrivate: {
        ...this.startNode.getRequiredProperties(),
        ...this.startNode.getOptionalProperties(),
      },
      required: this.startNode.getRequiredProperties(),
      optional: this.startNode.getOptionalProperties(),
      private: this.startNode.getPrivateProperties(),
    },
    endNodeProperties: {
      all: {
        ...this.endNode.getRequiredProperties(),
        ...this.endNode.getOptionalProperties(),
        ...this.endNode.getPrivateProperties(),
      },
      nonPrivate: {
        ...this.endNode.getRequiredProperties(),
        ...this.endNode.getOptionalProperties(),
      },
      required: this.endNode.getRequiredProperties(),
      optional: this.endNode.getOptionalProperties(),
      private: this.endNode.getPrivateProperties(),
    },
    endNode_id: this.getEndNodeId(),
    endNode_hash: this.getEndNodeHash(),
    properties: {
      ...this.getProperties(),
      _type: this.getLabels()[0] /**@potential_bug as in future we'll use multiple labels */,
    },
  };
}
Relationship.prototype.toCypherParameterObj = toCypherParameterObj;

function markAsEdited(
  _dateUpdated: timeArray,
  _userUpdated: string,
  _newRelationshipHash?: string
): void {
  if (!_dateUpdated) {
    throw new Error(
      `Relationship.markAsEdited: no _dateUpdated given.\n_dateUpdated: ${JSON.stringify(
        _dateUpdated
      )}`
    );
  }
  if (!isTimeArray(_dateUpdated)) {
    throw new Error(
      `Relationship.markAsEdited: _dateUpdated must be a timeArray.\n_dateUpdated: ${JSON.stringify(
        _dateUpdated
      )}`
    );
  }
  if (!_userUpdated) {
    throw new Error(
      `Relationship.markAsEdited: no _userUpdated given.\n_userUpdated: ${JSON.stringify(
        _userUpdated
      )}`
    );
  }
  if (!isString(_userUpdated)) {
    throw new Error(
      `Relationship.markAsEdited: _userUpdated must be String.\n_userUpdated: ${JSON.stringify(
        _userUpdated
      )}`
    );
  }

  this.properties._isCurrent = false;
  this.properties._hasBeenUpdated = true;
  this.properties._dateUpdated = _dateUpdated;
  if (_newRelationshipHash && isString(_newRelationshipHash)) {
    this.properties._newRelationshipHash = _newRelationshipHash;
  }
}
Relationship.prototype.markAsEdited = markAsEdited;

function isCurrent(): boolean {
  return this.properties._isCurrent;
}
Relationship.prototype.isCurrent = isCurrent;

function hasBeenUpdated(): boolean {
  return this.properties._hasBeenUpdated;
}
Relationship.prototype.hasBeenUpdated = hasBeenUpdated;

function isRelationship(val: any): boolean {
  return val instanceof Relationship;
}
function isNotRelationship(val: any): boolean {
  return !(val instanceof Relationship);
}
function isWritten(rel: Relationship): boolean {
  if (!isRelationship(rel)) {
    throw new Error(
      `isWritten: rel is not a Relationship.\nrel: ${JSON.stringify(rel)}`
    );
  }
  return rel.isWritten();
}
function isWrittenRelationship(rel: Relationship): boolean {
  if (!isRelationship(rel)) {
    throw new Error(
      `isWritten: rel is not a Relationship.\nrel: ${JSON.stringify(rel)}`
    );
  }
  return rel.isWritten();
}
export {
  Relationship,
  isRelationship,
  isNotRelationship,
  isWritten,
  isWrittenRelationship,
};
