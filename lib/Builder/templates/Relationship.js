"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Relationship = void 0;
exports.isNotRelationship = isNotRelationship;
exports.isRelationship = isRelationship;
exports.isWritten = isWritten;
exports.isWrittenRelationship = isWrittenRelationship;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _Node = require("./Node");

var _ = require("../../");

var _EnhancedNode = require("./EnhancedNode");

var _uuid2 = require("uuid");

var _crypto = _interopRequireDefault(require("crypto"));

var _keys = _interopRequireDefault(require("lodash/keys"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

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

  /* Methods */
  constructor() {
    var obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var {
      labels,
      startNode,
      endNode,
      properties,
      direction,
      necessity,
      identity,
      dev
    } = obj; // there are some constructor/methods tests which I want to run without creating a full Relationship

    if ((0, _.not)(dev)) {
      // enforce strict rule: start/endNode === Node | EnhancedNode
      // mainNode may be missing, as it will be set later, what's important is to have the partnerNode
      if (!((0, _Node.isNode)(startNode) || (0, _.isNeo4jId)(startNode) || direction === "outbound" && startNode === undefined)) {
        throw new Error("Relationship.constructor: startNode must be Node | EnhancedNode | Neo4jId.\n\nstartNode: ".concat(JSON.stringify(startNode), "."));
      }

      if (!((0, _Node.isNode)(endNode) || (0, _.isNeo4jId)(endNode) || direction === "inbound" && endNode === undefined)) {
        throw new Error("Relationship.constructor: endNode must be Node | EnhancedNode | Neo4jId.\n\nendNode: ".concat(JSON.stringify(endNode), "."));
      }
    }

    this.labels = labels || [];
    this.properties = properties || {};
    this.startNode = startNode || null;
    this.endNode = endNode || null;
    this.identity = identity || null;
    this.direction = direction || null;
    this.necessity = necessity || null;
    this.properties._hash = this.properties._hash ? this.properties._hash : this.makeHash("all");
  }
  /**
   * @important Relationship's _hash will consist of startNode + endNode hashes + Rel's label
   * @todo what about Rels' properties? ?!??! ?! !? I need to add those to the mix once
   * I create PropertyObject - that knows about { REQUIRED, optional & _private } interface
   * [2021-08-12] hehe just had bumped into exactly this bug! need to add Relationships's
   * required properties to the makeHash
   */


  makeHash() {
    var hashType = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "label";
    var s_hash = this.getStartNodeHash(),
        e_hash = this.getEndNodeHash();
    if (!s_hash || !e_hash) return undefined;
    var data = "";

    if (["all"].includes(hashType)) {
      // use JSON.stringify here? or leave control to this.stringifyProperties() ?
      // unlikely that JSON.stringify() gets changed.
      data = "".concat(this.getLabels().join(""), " ").concat(this.stringifyProperties(this.getRequiredProperties()), " ").concat(s_hash, " ").concat(e_hash);
    } else {
      data = "".concat(this.getLabels().join(""), " ").concat(s_hash, " ").concat(e_hash);
    }

    return this.hasher(data);
  }

  getRequiredProperties() {
    return (0, _.getRequiredProperties)(this.properties);
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
    return (0, _.getOptionalProperties)(this.properties);
  }

  getPrivateProperties() {
    return (0, _.getPrivateProperties)(this.properties);
  }

}

exports.Relationship = Relationship;

function getId() {
  //let id
  if (this.identity === null) return null;
  if (typeof this.identity === "string") return Number(this.identity);
  if (typeof this.identity === "object") return Number(this.identity.low);
  return this.identity; // a string when retrieved from Neo4j
}

Relationship.prototype.getId = getId;

function copyIdentity() {
  return this.identity;
}

Relationship.prototype.copyIdentity = copyIdentity;

function getStartNodeId() {
  return this.getStartNode().getId();
}

Relationship.prototype.getStartNodeId = getStartNodeId;

function getEndNodeId() {
  return this.getEndNode().getId();
}

Relationship.prototype.getEndNodeId = getEndNodeId;

function getStartNode() {
  return this.startNode;
}

Relationship.prototype.getStartNode = getStartNode;

function getEndNode() {
  return this.endNode;
}

Relationship.prototype.getEndNode = getEndNode;

function getNodes() {
  return [this.getStartNode(), this.getEndNode()];
}

Relationship.prototype.getNodes = getNodes;

function getLabels() {
  return this.labels;
}

Relationship.prototype.getLabels = getLabels;

function getProperties() {
  return this.properties;
}

Relationship.prototype.getProperties = getProperties;

function getProperty(prop) {
  return this.properties[prop];
}

Relationship.prototype.getProperty = getProperty;

function getStartNodeHash() {
  var startNode = this.getStartNode();

  if (startNode && (0, _Node.isNode)(startNode) && startNode.getHash()) {
    return startNode.getHash();
  }

  return undefined;
}

Relationship.prototype.getStartNodeHash = getStartNodeHash;

function getEndNodeHash() {
  var endNode = this.getEndNode();

  if (endNode && (0, _Node.isNode)(endNode) && endNode.getHash()) {
    return endNode.getHash();
  }

  return undefined;
}

Relationship.prototype.getEndNodeHash = getEndNodeHash;

function getDirection() {
  return this.direction;
}

Relationship.prototype.getDirection = getDirection;

function getNecessity() {
  return this.necessity;
}

Relationship.prototype.getNecessity = getNecessity;

function hasProperty(prop) {
  return Object.keys(this.properties).includes(prop);
}

Relationship.prototype.hasProperty = hasProperty;

function addProperty(propName, propVal) {
  this.properties[propName] = propVal;
  return this;
}

Relationship.prototype.addProperty = addProperty;

function setProperties(val) {
  /**
   *  @todo add val check
   */
  this.properties = val;
}

Relationship.prototype.setProperties = setProperties;

function setIdentity(val) {
  this.identity = val;
  return this;
}

Relationship.prototype.setIdentity = setIdentity;

function setDirection(direction) {
  if (!direction) {
    throw new Error("Relationship.setDirection: direction not supplied.\ndirection: ".concat(JSON.stringify(direction))); // attemtp to self discover
    // that would involve checking if this Relationship is placed as
    // part of an EnhancedNode...
  }

  this.direction = direction;
}

Relationship.prototype.setDirection = setDirection;

function setStartNode(node) {
  this.startNode = node;
}

Relationship.prototype.setStartNode = setStartNode;

function setEndNode(node) {
  this.endNode = node;
}

Relationship.prototype.setEndNode = setEndNode;

function setStartNodeId(identity) {
  if (this.startNode.identity === null) {
    this.startNode.identity = identity; // identity.low ??
  }
}

Relationship.prototype.setStartNodeId = setStartNodeId;

function setEndNodeId(identity) {
  if (this.endNode.identity === null) {
    this.endNode.identity = identity; // identity.low ??
  }
}

Relationship.prototype.setEndNodeId = setEndNodeId;

function setStartNode_uuid(_uuid) {
  if (!this.startNode.properties._uuid || typeof this.startNode.properties.uuid !== "string") {
    this.startNode.properties._uuid = _uuid;
  }
}

Relationship.prototype.setStartNode_uuid = setStartNode_uuid;

function setEndNode_uuid(_uuid) {
  if (!this.endNode.properties._uuid || typeof this.endNode.properties.uuid !== "string") this.endNode.properties._uuid = _uuid;
}

Relationship.prototype.setEndNode_uuid = setEndNode_uuid;

function toString() {
  var parameter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "all";
  if (["labels", "label", "lable", "lables"].includes(parameter)) return "".concat(this.stringifyLabel(this.labels));

  if (["properties", "props"].includes(parameter)) {
    return "".concat(this.stringifyProperties(this.properties)).slice(1);
  }

  if (["_hash", "hash"].includes(parameter)) {
    return "".concat(this.stringifyLabel(this.labels)).concat(this.stringifyProperties({
      _hash: this.getHash()
    }));
  }
  /**
   * @todo Why dont' include _hash here?? In tests I have _hash: undefined everywhere.
   */


  var props
  /* exlude _private */
  = _objectSpread(_objectSpread(_objectSpread({}, this.getRequiredProperties()), this.getOptionalProperties()), {}, {
    _hash: this.getHash()
  });

  return "".concat(this.stringifyLabel(this.labels)).concat(this.stringifyProperties(props));
}

Relationship.prototype.toString = toString;

function toObject() {
  return {
    identity: this.identity,
    labels: this.labels,
    properties: this.properties,
    startNode: this.startNode,
    endNode: this.endNode,
    direction: this.direction
  };
}

Relationship.prototype.toObject = toObject;

function allLettersUp(str) {
  return str.toUpperCase();
}

Relationship.prototype.allLettersUp = allLettersUp;

function stringifyLabel(labels) {
  if (typeof labels === "string" && labels.length) return ":".concat(this.allLettersUp(labels));
  if (labels instanceof Array) return labels.map(each => this.stringifyLabel(each)).join("");
  return labels.toString(); // what shall we do here? what's the default
  //behavior? we will only have either str or [str1, str2]
}

Relationship.prototype.stringifyLabel = stringifyLabel;

function stringifyProperties(properties) {
  if (!properties) return "";
  var array = Object.entries(properties);
  if (!array.length) return "";

  var stringifyPerType = val => {
    if (typeof val === "undefined") return "'undefined'";
    if (typeof val === "string") return "'".concat(String(val), "'");
    if (typeof val === "number") return "".concat(val);
    if (typeof val === "boolean") return !!val ? "true" : "false";

    if (val instanceof Array) {
      var _result = val.reduce((acc, elm) => {
        acc += "".concat(elm, ", "); // stringifyPerType(elm) ?!?!?!

        return acc;
      }, "");

      return "[".concat(_result.substr(0, _result.length - 2), "]");
    }

    return "";
  };

  var result = array.reduce((acc, element) => {
    var [key, value] = element;
    acc += "".concat(key, ": ").concat(stringifyPerType(value), ", ");
    return acc;
  }, "");
  return " {".concat(result.substr(0, result.length - 2), "}");
}

Relationship.prototype.stringifyProperties = stringifyProperties;

function hasher(data) {
  var hash = _crypto.default.createHash("sha256");

  hash.update(data);
  var result = hash.digest("hex");
  return result;
}

Relationship.prototype.hasher = hasher;

function getHash() {
  return this.properties._hash;
}

Relationship.prototype.getHash = getHash;

function setHash() {
  var hashType = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "label";
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

function isWritable() {
  var startNode = this.getStartNode(),
      endNode = this.getEndNode();
  return Boolean(this.getHash() && (0, _Node.isNode)(startNode) && startNode.getHash() && (0, _Node.isNode)(endNode) && endNode.getHash());
}

Relationship.prototype.isWritable = isWritable;
/**
 * This to be used when we mergeEnhancedNodes and have already identified all Nodes.
 */

function areParticipatingNodesIdentified() {
  return !!(this.getStartNode().getId() && this.getStartNode().getProperty("_uuid") && this.getEndNode().getId() && this.getEndNode().getProperty("_uuid"));
}

Relationship.prototype.areParticipatingNodesIdentified = areParticipatingNodesIdentified;
/**
 * Checks if
 * this Relationship, its start and end Nodes each has been assigned:
 *  i. _hash (built successfully by Builder)
 *  i. Id (written successfully to Neo4j)
 * @todo add _uuid check?
 */

function _isWritten() {
  var relHashOk = (0, _.isPresent)(this.getHash()) && (0, _.isString)(this.getHash());
  var relIdOk = (0, _.isPresent)(this.getId()) && (0, _.isNumber)(this.getId());
  var startNodeHashOk = (0, _.isPresent)(this.getStartNode().getHash()) && (0, _.isString)(this.getStartNode().getHash());
  var startNodeIdOk = (0, _.isPresent)(this.getStartNode().getId()) && (0, _.isNumber)(this.getStartNode().getId());
  var endNodeHashOk = (0, _.isPresent)(this.getEndNode().getHash()) && (0, _.isString)(this.getEndNode().getHash());
  var endNodeIdOk = (0, _.isPresent)(this.getEndNode().getId()) && (0, _.isNumber)(this.getEndNode().getId());
  return !!(relHashOk && relIdOk && startNodeHashOk && startNodeIdOk && endNodeHashOk && endNodeIdOk);
}

Relationship.prototype.isWritten = _isWritten;
/**
 * Will use to return flat Relationships - where participatingNodes == Nodes ONLY!
 * So that it's easy to merge into Neo4j them one by one.
 */

function shorten() {
  this.startNode = this.startNode.toNode();
  this.endNode = this.endNode.toNode();
  return this;
}

Relationship.prototype.shorten = shorten;
/**
 * Gives immutable access to "the other node" (from EnhancedNode's point of view).
 * @public
 */

function getPartnerNode() {
  return this.direction === "inbound" ? this.startNode : this.endNode;
}

Relationship.prototype.getPartnerNode = getPartnerNode;
/**
 * Transform Relationship into a parameters object that Cypher expects.
 */

function toCypherParameterObj() {
  var startNode = this.getStartNode(),
      endNode = this.getEndNode();
  return {
    startNode_id: this.getStartNodeId(),
    startNode_hash: this.getStartNodeHash(),
    startNodeProperties: {
      all: _objectSpread(_objectSpread(_objectSpread({}, this.startNode.getRequiredProperties()), this.startNode.getOptionalProperties()), this.startNode.getPrivateProperties()),
      nonPrivate: _objectSpread(_objectSpread({}, this.startNode.getRequiredProperties()), this.startNode.getOptionalProperties()),
      required: this.startNode.getRequiredProperties(),
      optional: this.startNode.getOptionalProperties(),
      private: this.startNode.getPrivateProperties()
    },
    endNodeProperties: {
      all: _objectSpread(_objectSpread(_objectSpread({}, this.endNode.getRequiredProperties()), this.endNode.getOptionalProperties()), this.endNode.getPrivateProperties()),
      nonPrivate: _objectSpread(_objectSpread({}, this.endNode.getRequiredProperties()), this.endNode.getOptionalProperties()),
      required: this.endNode.getRequiredProperties(),
      optional: this.endNode.getOptionalProperties(),
      private: this.endNode.getPrivateProperties()
    },
    endNode_id: this.getEndNodeId(),
    endNode_hash: this.getEndNodeHash(),
    properties: _objectSpread(_objectSpread({}, this.getProperties()), {}, {
      _type: this.getLabels()[0]
      /**@potential_bug as in future we'll use multiple labels */

    })
  };
}

Relationship.prototype.toCypherParameterObj = toCypherParameterObj;

function markAsEdited(_dateUpdated, _userUpdated, _newRelationshipHash) {
  if (!_dateUpdated) {
    throw new Error("Relationship.markAsEdited: no _dateUpdated given.\n_dateUpdated: ".concat(JSON.stringify(_dateUpdated)));
  }

  if (!(0, _.isTimeArray)(_dateUpdated)) {
    throw new Error("Relationship.markAsEdited: _dateUpdated must be a timeArray.\n_dateUpdated: ".concat(JSON.stringify(_dateUpdated)));
  }

  if (!_userUpdated) {
    throw new Error("Relationship.markAsEdited: no _userUpdated given.\n_userUpdated: ".concat(JSON.stringify(_userUpdated)));
  }

  if (!(0, _.isString)(_userUpdated)) {
    throw new Error("Relationship.markAsEdited: _userUpdated must be String.\n_userUpdated: ".concat(JSON.stringify(_userUpdated)));
  }

  this.properties._isCurrent = false;
  this.properties._hasBeenUpdated = true;
  this.properties._dateUpdated = _dateUpdated;

  if (_newRelationshipHash && (0, _.isString)(_newRelationshipHash)) {
    this.properties._newRelationshipHash = _newRelationshipHash;
  }
}

Relationship.prototype.markAsEdited = markAsEdited;

function isCurrent() {
  return this.properties._isCurrent;
}

Relationship.prototype.isCurrent = isCurrent;

function hasBeenUpdated() {
  return this.properties._hasBeenUpdated;
}

Relationship.prototype.hasBeenUpdated = hasBeenUpdated;

function isRelationship(val) {
  return val instanceof Relationship;
}

function isNotRelationship(val) {
  return !(val instanceof Relationship);
}

function isWritten(rel) {
  if (!isRelationship(rel)) {
    throw new Error("isWritten: rel is not a Relationship.\nrel: ".concat(JSON.stringify(rel)));
  }

  return rel.isWritten();
}

function isWrittenRelationship(rel) {
  if (!isRelationship(rel)) {
    throw new Error("isWritten: rel is not a Relationship.\nrel: ".concat(JSON.stringify(rel)));
  }

  return rel.isWritten();
}