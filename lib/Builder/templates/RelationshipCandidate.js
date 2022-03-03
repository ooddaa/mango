"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RelationshipCandidate = void 0;
exports.isRelationshipCandidate = isRelationshipCandidate;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _Node = require("./Node");

var _NodeCandidate = require("./NodeCandidate");

var _Relationship = require("./Relationship");

var _Result = require("../../Result");

var _ = require("../../");

var _cloneDeep = _interopRequireDefault(require("lodash/cloneDeep"));

var _isNull = _interopRequireDefault(require("lodash/isNull"));

var _EnhancedNode = require("./EnhancedNode");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

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
  constructor(obj) {
    if (!obj.direction && (0, _.isMissing)(obj.startNode) && (0, _.isMissing)(obj.endNode)) {
      throw new Error("RelationshipCandidate.constructor: both startNode == null && endNode == null. No direction. \nobj: ".concat(JSON.stringify(obj), "."));
    }

    if (obj.direction === 'inbound' && (0, _.isMissing)(obj.startNode)) {
      throw new Error("RelationshipCandidate.constructor: must have startNode for inbound direction. \nobj: ".concat(JSON.stringify(obj), "."));
    }

    if (obj.direction === 'outbound' && (0, _.isMissing)(obj.endNode)) {
      throw new Error("RelationshipCandidate.constructor: must have endNode for outbound direction. \nobj: ".concat(JSON.stringify(obj), "."));
    }

    this.labels = obj.labels || [];
    this.properties = obj.properties || {};
    this.direction = obj.direction || null;
    this.startNode = obj.startNode == undefined ? null : [obj.startNode];
    this.endNode = obj.endNode == undefined ? null : [obj.endNode];
    this.necessity = obj.necessity || "optional";
    this._isCurrent = (0, _.isMissing)(obj._isCurrent) ? true : obj._isCurrent;
    /** @todo WHICH DEFAULT TO SET?? */

    this._hasBeenUpdated = (0, _.isMissing)(obj._hasBeenUpdated) ? false : obj._hasBeenUpdated;
    /** @todo WHICH DEFAULT TO SET?? */

    this._dateUpdated = obj._dateUpdated || null;
    this._userUpdated = obj._userUpdated || null;
    this._newRelationshipHash = obj._newRelationshipHash || null;
    this._oldRelationshipHash = obj._oldRelationshipHash || null;
    this.setMainNode();
    this.setPartnerNode();
    this.setDefaultPrivateProps();
  }
  /**
   * We are setting the missing node (the Enode, mainNode whatever you call it).
   * Doubling up. As the result we have two pairs of nodes 
   * 
   * startNode - endNode <= this entails direction
   * mainNode - partnerNode <= this entails POV (point of view)
   * @param {*} newMainNode 
   */


  setMainNode(newMainNode) {
    if (this.direction == 'inbound') {
      var node = newMainNode || (this.getEndNode() !== null ? this.getEndNode()[0] : null);
      this.setEndNode(node);
      this.mainNode = node !== null ? [node] : null;
    } else if (this.direction == 'outbound') {
      var _node = newMainNode || (this.getStartNode() !== null ? this.getStartNode()[0] : null);

      this.setStartNode(_node);
      this.mainNode = _node !== null ? [_node] : null;
    } else {
      this.mainNode = null;
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


  setPartnerNode(newPartnerNode) {
    if (this.direction == 'inbound') {
      var node = newPartnerNode || (this.getStartNode() !== null ? this.getStartNode()[0] : null);
      this.setStartNode(node);
      this.partnerNode = node !== null ? [node] : null;
    } else if (this.direction == 'outbound') {
      var _node2 = newPartnerNode || (this.getEndNode() !== null ? this.getEndNode()[0] : null);

      this.setEndNode(_node2);
      this.partnerNode = _node2 !== null ? [_node2] : null;
    } else {
      this.partnerNode = null;
    }
  }

}

exports.RelationshipCandidate = RelationshipCandidate;

function getLabels() {
  return this.labels;
}

RelationshipCandidate.prototype.getLabels = getLabels;

function toObject() {
  return {
    labels: this.labels,
    properties: this.properties,
    direction: this.direction,
    necessity: this.necessity,
    startNode: this.startNode == null ? null : this.startNode[0],
    endNode: this.endNode == null ? null : this.endNode[0],
    partnerNode: this.partnerNode == null ? null : this.partnerNode[0],
    mainNode: this.mainNode == null ? null : this.mainNode[0]
  };
}

RelationshipCandidate.prototype.toObject = toObject;
/**
 * Gives mutable!! access to startNode. 
 * @public
 */

function getStartNode() {
  return this.startNode;
}

RelationshipCandidate.prototype.getStartNode = getStartNode;
/**
 * Gives mutable!! access to endNode. 
 * @public
 */

function getEndNode() {
  return this.endNode;
}

RelationshipCandidate.prototype.getEndNode = getEndNode;
/**
 * Gives direction. 
 * @public
 */

function getDirection() {
  return this.direction;
}

RelationshipCandidate.prototype.getDirection = getDirection;
/**
 * Gives mutable!! access to "the other node" (from EnhancedNode's point of view). 
 * @public
 */

function getPartnerNode() {
  return this.partnerNode;
}

RelationshipCandidate.prototype.getPartnerNode = getPartnerNode;

function getNecessity() {
  return this.necessity;
}

RelationshipCandidate.prototype.getNecessity = getNecessity;
/**
 * @todo [2020-04-04] I need to automate necessity specification. 
 * user supplies ENC == { relationships: { required: [], optional: [] }}
 * this method should discover in which array this is located.
 * @param {*} val 
 */

function setNecessity(val) {
  this.necessity = val;
}

RelationshipCandidate.prototype.setNecessity = setNecessity;

function setStartNode(newStartNode) {
  this.startNode = newStartNode !== null ? [newStartNode] : null;
}

RelationshipCandidate.prototype.setStartNode = setStartNode;

function setEndNode(newEndNode) {
  this.endNode = newEndNode !== null ? [newEndNode] : null;
}

RelationshipCandidate.prototype.setEndNode = setEndNode;
/**
 * Adds _isCurrent, etc to this.properties
 */

function setDefaultPrivateProps() {
  this.properties = _objectSpread(_objectSpread({}, this.properties), {}, {
    _isCurrent: this._isCurrent,
    _hasBeenUpdated: this._hasBeenUpdated,
    _dateUpdated: this._dateUpdated,
    _userUpdated: this._userUpdated,
    _newRelationshipHash: this._newRelationshipHash,
    _oldRelationshipHash: this._oldRelationshipHash
  });
}

RelationshipCandidate.prototype.setDefaultPrivateProps = setDefaultPrivateProps;
/**
 * Checks is this RC is ready to become a Relationship.
 * @returns a Result, with detailed reasons if unsuccessful. 
 */

function isPromotable() {
  // must have a non-empty label
  var labels = this.getLabels();

  if (!labels.length || !labels[0].length) {
    return new _Result.Failure({
      reason: "RelationshipCandidate.isPromotable: no valid labels.\n\nLabels: ".concat(JSON.stringify(labels)),
      data: this
    });
  } // must have direction


  var direction = this.getDirection();

  if ((!'inbound', 'outbound').includes(direction)) {
    return new _Result.Failure({
      reason: "RelationshipCandidate.isPromotable:: direction must be 'inbound' || 'outbound'.\n\nDirection: ".concat(JSON.stringify(direction)),
      data: this
    });
  } // must specify necessity


  var necessity = this.getNecessity();

  if (!['required', 'optional', '_private'].includes(necessity)) {
    return new _Result.Failure({
      reason: "RelationshipCandidate.isPromotable: necessity must be 'required' || 'optional' || '_private'.\n\nNecessity: ".concat(JSON.stringify(necessity)),
      data: this
    });
  } // must have both nodes


  var [startNode, endNode] = [this.getStartNode(), this.getEndNode()];

  if (startNode == null || endNode == null) {
    return new _Result.Failure({
      reason: "RelationshipCandidate.isPromotable: must have non-null startNode && endNode.\n\nstartNode: ".concat(JSON.stringify(startNode), "\n\nendNode: ").concat(JSON.stringify(endNode)),
      data: this
    });
  } // both nodes must be Node | EnhancedNode


  if (!((0, _Node.isNode)(startNode[0]) && (0, _Node.isNode)(endNode[0]))) {
    return new _Result.Failure({
      reason: "RelationshipCandidate.isPromotable: both nodes must be Node | EnhancedNode.\n\nstartNode: ".concat(JSON.stringify(startNode), "\n\nendNode: ").concat(JSON.stringify(endNode)),
      data: this
    });
  } // _hash is settable


  if (!(Boolean(startNode[0].getHash()) && Boolean(endNode[0].getHash()))) {
    return new _Result.Failure({
      reason: "RelationshipCandidate.isPromotable: both nodes must have _hash.\n\nstartNode: ".concat(JSON.stringify(startNode), "\n\nendNode: ").concat(JSON.stringify(endNode)),
      data: this
    });
  }
}

RelationshipCandidate.prototype.isPromotable = isPromotable;
/**
 * @todo [2020-04-04] implement and amend Builder.buildRelationships
 * Important method that promotes RC to Relationship! 
 * Relationships should only be created via this method.
 */

function toRelationship() {
  var promotion = this.isPromotable();

  if ((0, _Result.isFailure)(promotion)) {
    throw new Error("RelationshipCandidate.toRelationship: this RC is not promotable.\n\nReason: ".concat(JSON.stringify(promotion.reason), "\n\nRC: ").concat(JSON.stringify(this)));
  }

  var newRel = new _Relationship.Relationship(_objectSpread({}, this.toObject()));
  newRel.properties._necessity = this.getNecessity();
  newRel.properties._date_created = (0, _.setDateCreated)();
  newRel.properties._isCurrent = this._isCurrent;
  newRel.properties._hasBeenUpdated = this._hasBeenUpdated;
  newRel.properties._dateUpdated = this._dateUpdated;
  newRel.properties._userUpdated = this._userUpdated;
  newRel.properties._newRelationshipHash = this._newRelationshipHash;
  newRel.properties._oldRelationshipHash = this._oldRelationshipHash;
  newRel.setHash();
  return newRel;
}

RelationshipCandidate.prototype.toRelationship = toRelationship;

function isRelationshipCandidate(val) {
  return val instanceof RelationshipCandidate;
}