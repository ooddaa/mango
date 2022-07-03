/* @flow */

import { IdArray, isIdArray } from "../../IdArray";
import {
  isMissing,
  isPresent,
  isNeo4jId,
  not,
  int,
  toNumber,
  log,
  getRequiredProperties,
  getOptionalProperties,
  getPrivateProperties,
  stringify,
} from "../..";

import util from "util";
import crypto from "crypto";

import has from "lodash/has";
import keys from "lodash/keys";
import isArray from "lodash/isArray";
import isObject from "lodash/isObject";
import isString from 'lodash/isString';
import isNumber from 'lodash/isNumber';

import type { properties, identity, Integer } from "../../types";
import { isNull } from "lodash";

/**
 * @todo make .toString() return without ':' - then we could run CQL without named variables.
 */
class Node {
  /**
   * @constructor
   * @param {labels} labels - Array for all labels
   * @param {properties} properties - Map with node properties
   * @param {identity} identity - Unique identity
   */
  labels: string[];
  properties: Object;
  identity: number | string | null | Object;
  getId: Function
  getLabels: Function
  getProperty: Function
  getProperties: Function
  getRequiredProperties: Function
  getOptionalProperties: Function
  getPrivateProperties: Function
  createHash: Function
  getHash: Function
  setHash: () => void
  setLabels: Function
  addLabel: Function
  setProperties: Function
  addProperty: Function
  setIdentity: Function
  toString: Function
  toObject: Function
  propertiesToNumber: Function
  firstLetterUp: Function
  stringifyLabel: Function
  stringifyProperties: Function
  convertIntegerToNumber: Function
  hasher: Function
  isComplete: Function
  toNode: Function
  toNodeObj: Function
  toUpdateById: Function
  isWritten: Function
  constructor(
    obj: {
      labels?: string[],
      properties?: Object,
      identity?: number | string | null
    } = {}
  ) {
    this.labels = obj.labels || [];
    this.properties = obj.properties || {};
    this.identity = obj.identity || null;
  }

  getRequiredProperties() {
    return getRequiredProperties(this.properties)
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
    return getOptionalProperties(this.properties)
  }
  getPrivateProperties() {
    return getPrivateProperties(this.properties)
  }
}

function getId(param?: string): number | null {
  //let id
  if (param === 'asNumber') { return Number(this.identity.low) }
  if (this.identity === null) return null;
  if (typeof this.identity === "string") return Number(this.identity);
  if (typeof this.identity === "object") return Number(this.identity.low);
  return this.identity; // a string when retreived from Neo4j
}
Node.prototype.getId = getId

function getLabels(): string[] {
  return this.labels;
}
Node.prototype.getLabels = getLabels

function getProperties(parameter: string = "number"): Object {
  if (parameter === "number" || parameter === "numbers") {
    const properties = keys(this.properties).reduce((acc, key) => {
      const prop = this.properties[key];
      if (isIdArray(prop)) {
        acc[key] = prop.toArray();
        return acc;
      } else if (prop instanceof Array) {
        if (prop.every(elm => typeof elm === "object")) {
          acc[key] = prop.map(this.convertIntegerToNumber);
          return acc;
        }
      }
      if (typeof prop === "object") {
        acc[key] = this.convertIntegerToNumber(prop);
        return acc;
      }
      acc[key] = prop;
      return acc;
    }, {});
    return properties;
  }
  // return 'Node.getProperties() failed'
  throw new Error(`Node.getProperties() failed.`);
}
Node.prototype.getProperties = getProperties

function getProperty(prop: string): any {
  return this.properties[prop];
}
Node.prototype.getProperty = getProperty

function hasher(data: string): string {
  const hash = crypto.createHash("sha256");
  hash.update(data);
  const result = hash.digest("hex");
  return result;
}
Node.prototype.hasher = hasher

/**
 * @to_be_depricated as useless - use this.hasher instead
 * @param {*} data_to_hash 
 */
function createHash(data): string {
  const hash = this.hasher(data);
  return hash;
}
Node.prototype.createHash = createHash

function getHash(): string | typeof undefined {
  return this.properties._hash;
}
Node.prototype.getHash = getHash

/**
 * Hash formula is
 * Labels[0] + all required properties.
 * IdArrays return only first element, NICKNAME.
 * @todo how do we _hash 
 */
function setHash(): void {
  const props = this.getRequiredProperties();
  /* in case we don't have any required properties, we'll hash by first label only */
  if (!keys(props).length) {
    /* USE ONLY FIRST LABEL FOR HASH! */
    const hash = this.createHash(
      this.toString({ 
        parameter: "labels", 
        firstLabelOnly: true 
      })
    );
    this.properties._hash = hash
    return
  }
  /* hmm something somewhere will break =) hello, bug! */

  this.properties._hash = this.createHash(
    this.toString({ 
      parameter: "all", 
      requiredPropsOnly: true, 
      firstLabelOnly: true 
    })
  );
}
Node.prototype.setHash = setHash

function setLabels(val: string[]): Node {
  if (isMissing(val) || not(isArray(val)) || not(val.every(isString))) {
    throw new Error(`Node.setLabels: val should be string[].\nval: ${stringify(val)}`)
  }
  this.labels = val
  return this
}
Node.prototype.setLabels = setLabels

function addLabel(val: string): void {
  if (not(isString(val))) {
    throw new Error(`Node.addLabel: val should be a string.\nval: ${stringify(val)}`)
  }
  this.labels.push(val)
}
Node.prototype.addLabel = addLabel

function setProperties(val: Object): void {
  /**
   *  @todo add val check, no nested objects, no heterogenous arrays as Neo4j cannot handle those
   */
  this.properties = val
}
Node.prototype.setProperties = setProperties

function addProperty(propName: string, propVal: string): Node {
  if (not(isString(propName)) || not(isString(propVal))) {
    throw new Error(`Node.addProperty: propName & propVal should be strings.\npropName: ${stringify(propName)}.\npropVal ${stringify(propVal)}`)
  }
  this.properties[propName] = propVal;
  return this
}
Node.prototype.addProperty = addProperty

interface Neo4jIdentityObj {
    low: number,
    high: number
}
// function setIdentity(val: number | string | null): Node {
function setIdentity(val: Neo4jIdentityObj): Node {
  if (not(isNeo4jId(val))) {
    throw new Error(`Node.setIdentity: val should be Neo4jIdentityObj { low: number, high: number }.\nval: ${stringify(val)}`)
  }
  this.identity = val
  return this
}
Node.prototype.setIdentity = setIdentity

/**
 * Only first label is used for stringification. 
 * @param {Object} config  
 * @returns {string}
 */
function toString(
  config: { 
    parameter: "all"|"labels"|"properties"|"no hash",
    firstLabelOnly: boolean, 
    required: boolean, 
    requiredPropsOnly: boolean,
    optional: boolean, 
    optionalPropsOnly: boolean,
    _private: boolean,
    _privatePropsOnly: boolean
  } = {}
): string {
  let parameter = config.parameter || "all"
  let firstLabelOnly = config.firstLabelOnly || false;
  let required = config.required || config.requiredPropsOnly || false;
  let optional = config.optional || config.optionalPropsOnly || false;
  let _private = config._private || config._privatePropsOnly || false;
  
  if (parameter === "labels") {
    return `${this.stringifyLabel(firstLabelOnly ? this.getLabels()[0] : this.getLabels())}`;
  }
  if (parameter === "all") {
    if (required)
      return `${this.stringifyLabel(firstLabelOnly ? this.getLabels()[0] : this.getLabels())}${this.stringifyProperties(
        this.getRequiredProperties()
      )}`;
    if (optional)
      return `${this.stringifyLabel(firstLabelOnly ? this.getLabels()[0] : this.getLabels())}${this.stringifyProperties(
        this.getOptionalProperties()
      )}`;
    if (_private)
      return `${this.stringifyLabel(firstLabelOnly ? this.getLabels()[0] : this.getLabels())}${this.stringifyProperties(
        this.getPrivateProperties()
      )}`;
    return `${this.stringifyLabel(firstLabelOnly ? this.getLabels()[0] : this.getLabels())}${this.stringifyProperties(
      this.properties
    )}`;
  }
  if (parameter === "properties") {
    if (required)
      return `${this.stringifyProperties(
        this.getRequiredProperties()
      )}`.slice(1);
    if (optional)
      return `${this.stringifyProperties(
        this.getOptionalProperties()
      )}`.slice(1);
    if (_private)
      return `${this.stringifyProperties(this.getPrivateProperties())}`.slice(
        1
      );
    return `${this.stringifyProperties(this.properties)}`.slice(1);
  }
  if (parameter === "no hash") {
    const { _hash, ...rest } = this.properties;
    return `${this.stringifyLabel(firstLabelOnly ? this.getLabels()[0] : this.getLabels())}${this.stringifyProperties(
      rest
    )}`;
  }
  return `${this.stringifyLabel(firstLabelOnly ? this.getLabels()[0] : this.getLabels())}${this.stringifyProperties(
    this.properties
  )}`;
}
Node.prototype.toString = toString

function toObject(): Object {
  return {
    identity: this.identity,
    labels: this.labels,
    properties: this.properties
  };
}
Node.prototype.toObject = toObject

/**
 * For compatibility. EnhancedNode has its own toNode method.
 */
function toNode(): Node {
  return this
}
Node.prototype.toNode = toNode

/**
 * Converts Node back to 'half-backed-Node-candidate' with
 * {
 * labels,
 * properties: {
 *  required,
 *  optional,
 *  _private
 *  },
 * identity
 * }
 * structure. These are consumed by Builder.
 * Frontend obj -> Node wrapper -> Node.toNodeObj() -> to Builder
 * so that we can ascertain that whatever Frontend sent is worthy
 * of being saved in Neo4j.
 */
function toNodeObj(): Object {
  return convert_Node_to_nodeObj(this);
  function convert_Node_to_nodeObj(node) {
    // log('convert_Node_to_nodeObj node is')
    // log(node)
    const obj = {
      labels: node.labels,
      properties: {
        required: {},
        optional: {},
        _private: {}
      },
      identity: node.identity || null
    };
    const result = keys(node.properties).reduce((acc, key) => {
      if (key[0] === "_") {
        acc.properties._private[key] = node.properties[key];
        return acc;
      } else if (key[0] === key[0].toUpperCase()) {
        acc.properties.required[key] = node.properties[key];
        return acc;
      } else if (key[0] !== key[0].toUpperCase()) {
        acc.properties.optional[key] = node.properties[key];
        return acc;
      } else {
        // return 'convert_Node_to_nodeObj: Error: something wroong!'
        throw new Error(`Node.toNodeObj(): something went wrong!\n${stringify(obj)}`);
      }
    }, obj);
    return result;
  }
}
Node.prototype.toNodeObj = toNodeObj

/**
 * @shit_method da fuk is this for? makes no sense
 */
function propertiesToNumber(): Node {
  this.properties = this.getProperties("number");
  return this;
}
Node.prototype.propertiesToNumber = propertiesToNumber

function firstLetterUp(str: string): string {
  return str.substr(0, 1).toUpperCase() + str.substr(1);
}
Node.prototype.firstLetterUp = firstLetterUp

function stringifyLabel(labels: string[] | string): string {
  // log(labels)
  if (isMissing(labels) || labels.length == 0) {
    return ``;
  }
  if (typeof labels === "string" && labels.length)
    return `:${this.firstLetterUp(labels)}`;
  if (labels instanceof Array) {
    return labels.map(each => this.stringifyLabel(each)).join("");
  }
  return labels.toString(); // what shall we do here? what's the default
  //behavior? we will only have either str or [str1, str2]
}
Node.prototype.stringifyLabel = stringifyLabel

function stringifyProperties(properties: Object): string {
  if (!properties) return ``;
  const array = Object.entries(properties);
  if (!array.length) return ``;
  const stringifyPerType = (val: any): string => {
    if (typeof val === "string") return `'${String(val)}'`;
    if (typeof val === "number") return `${val}`;
    if (typeof val === "boolean") return !!val ? "true" : "false";
    if (val instanceof Array) {
      let result;
      if (val.every(elm => typeof elm === "number")) {
        result = val.reduce((acc, elm) => {
          acc += `${elm}, `;
          return acc;
        }, ``);
        return `[${result.substr(0, result.length - 2)}]`;
      }
      result = val.reduce((acc, elm): String => {
        if (typeof elm === "number") return (acc += `'${elm}', `);
        if (typeof elm === "string") return (acc += `'${elm}', `);
        acc += `${elm}, `;
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
Node.prototype.stringifyProperties = stringifyProperties

function convertIntegerToNumber(object: Integer): number | Integer {
  if (
    keys(object).includes("low") &&
    keys(object).includes("high")
  ) {
    return toNumber(object);
  }
  return object;
}
Node.prototype.convertIntegerToNumber = convertIntegerToNumber

/**
 * Checks if Node has _hash, which is interpreted as this Node having passed Validator
 * and Builder ==> is fit/complete to be written to Neo4j.
 */
function isComplete(): boolean {
  return !!this.properties._hash;
}
Node.prototype.isComplete = isComplete

/**
 * Used by home.updateHTransactions (wrapper around engine.updateNodesById).
 */
function toUpdateById(): Object {
  // [{ id: 123, properties: {a:1, b:2}}]
  // const properties = {
  //   ...this.getRequiredProperties(),
  //   ...this.getOptionalProperties()
  // }
  return {
    // id: this.getId(),
    id: this.properties._neo4j_identity,
    properties: this.getProperties()
  };
}
Node.prototype.toUpdateById = toUpdateById

/**
 * Checks if Node has all proper identifications.
 */
function isWritten(): boolean {
  const result = !!(this.getHash() && this.getId() && this.getProperty('_uuid'))
  return result
}
Node.prototype.isWritten = isWritten

function isNode(val: any): boolean {
  return val instanceof Node
}

/**
 * Checks if value is for all intends and purposes, a Node
 * has 
 * labels: string[]
 * identity: { low: number, high: number }
 * properties: { _hash: string, _uuid: string }
 * 
 * @param {any} val 
 */
function isNodeLike(value: any): boolean {
  let hasValidLabels = false;
  let hasValidIdentity = false;
  let hasValidProperties = false;
  if (has(value, 'labels') && isArray(value.labels) && value.labels.every(isString)) {
    hasValidLabels = true
  }
  if (has(value, 'identity') && isObject(value.identity) && (isNumber(value.identity.low) && isNumber(value.identity.high))) {
    hasValidIdentity = true
  }
  if (has(value, 'properties') && isObject(value.properties) 
  && (has(value.properties, '_hash') && isString(value.properties._hash))
  && (has(value.properties, '_uuid') && isString(value.properties._uuid))) {
    hasValidProperties = true
  }
  return hasValidLabels && hasValidIdentity && hasValidProperties
}

/**
 * Function to check if supplied node satisfies Node constructor requirements.
 * Minimal nodeObject configuration: 
 *  {
 *    labels: [],
 *    properties: { required: {} }
 *  }
 * @param {any} node 
 */
function isNodeObj(node: any): boolean {
  if (!node) return false;
  if (not(isObject(node))) return false;
  if (has(node, "labels") && has(node, "properties")) {
    if (not(isArray(node.labels))) return false;
    if (
      has(node.properties, "required") &&
      isObject(node.properties.required)
    )
      return true;

    return false;
  }
  return false;
}

function isWrittenNode(node: Node): boolean {
  if (!isNode(node)) {
    throw new Error(`isWrittenNode: node must be a Node.\nnode: ${JSON.stringify(node)}`)
  }
  return node.isWritten()
}

function isSameNode(nodeA: Node, nodeB: Node): boolean {
  return Boolean((nodeA.getHash() === nodeB.getHash()) && (nodeA.getId() === nodeB.getId()))
}

export { Node, isNode, isNodeLike, isNodeObj, isWrittenNode, isSameNode };
