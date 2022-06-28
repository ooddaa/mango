"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EnhancedNodeCandidate = void 0;
exports.isEnhancedNodeCandidate = isEnhancedNodeCandidate;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _Node = require("./Node");

var _EnhancedNode = require("./EnhancedNode");

var _Relationship = require("./Relationship");

var _NodeCandidate = require("./NodeCandidate");

var _RelationshipCandidate = require("./RelationshipCandidate");

var _Result = require("../../Result");

var _utils = require("../../utils");

var _curry = _interopRequireDefault(require("lodash/curry"));

var _flatten = _interopRequireDefault(require("lodash/flatten"));

var _cloneDeep = _interopRequireDefault(require("lodash/cloneDeep"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function isNotFailure(val) {
  return !(0, _Result.isFailure)(val);
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
  constructor(coreNode) {
    var relationships = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (!((0, _NodeCandidate.isNodeCandidate)(coreNode) || (0, _Node.isNode)(coreNode) || (0, _Result.isFailure)(coreNode))) {
      throw new Error("EnhancedNodeCandidate.constructor: coreNode must be NodeCandidate | Node | Failure.\ncoreNode: ".concat(JSON.stringify(coreNode), "."));
    }

    this.coreNode = (0, _NodeCandidate.isNodeCandidate)(coreNode) || (0, _Node.isNode)(coreNode) || (0, _Result.isFailure)(coreNode) ? coreNode : new _NodeCandidate.NodeCandidate(coreNode);
    this.requiredRelationships = relationships ? relationships.required || [] : [];
    this.optionalRelationships = relationships ? relationships.optional || [] : [];
    this.addCoreNodeToRelationships();
  }
  /**
   * Adds this.coreNode to
   * inbound ? endNode : startNode
   */


  addCoreNodeToRelationships() {
    // pss dude, want some curry-magic?
    var _magic = (0, _curry.default)(_inner_magic)(this);

    function _inner_magic(ctx, rel) {
      if ((0, _RelationshipCandidate.isRelationshipCandidate)(rel)) {
        rel.setMainNode(ctx.coreNode); // allow shortcut for recursive relationships

        var pn = rel.getPartnerNode();

        if (pn !== null && pn[0] === 'itself') {
          rel.setPartnerNode(ctx.coreNode);
        }
      } else if ((0, _Relationship.isRelationship)(rel) && (0, _Node.isNode)(ctx.coreNode)) {
        // wait a sec, a Relationship can only have Node | EnhancedNode for start/endNode!
        rel.getDirection() === 'inbound' ? rel.setEndNode(ctx.coreNode) : rel.setStartNode(ctx.coreNode);
      }
    }

    this.requiredRelationships.forEach(_magic);
    this.optionalRelationships.forEach(_magic);
  }

}
/**
 * Gives immutable access to coreNode. 
 * @public
 */


exports.EnhancedNodeCandidate = EnhancedNodeCandidate;

function getCoreNode() {
  return this.coreNode;
}

EnhancedNodeCandidate.prototype.getCoreNode = getCoreNode;
/**
 * Sets coreNode. 
 * Useful for buildEnhancedNodes, as I cannot just mutate 
 * object returned by getCoreNode, unless it's wrapped in []
 * @public
 */

function setCoreNode(newCoreNode) {
  this.coreNode = (0, _Node.isNode)(newCoreNode) || (0, _NodeCandidate.isNodeCandidate)(newCoreNode) || (0, _Result.isFailure)(newCoreNode) ? newCoreNode : new _NodeCandidate.NodeCandidate(newCoreNode); // propagate coreNode to Relationships    

  this.addCoreNodeToRelationships();
}

EnhancedNodeCandidate.prototype.setCoreNode = setCoreNode;
/**
 * Gives access to all relationships for mutation.
 * @todo must return Array<Relationship> !
 * @public
 */

function getAllRelationships() {
  return this.requiredRelationships.concat(this.optionalRelationships); // !!! this creates new array!!
}

EnhancedNodeCandidate.prototype.getAllRelationships = getAllRelationships;

function getAllRelationshipCandidates() {
  var result = this.getAllRelationships().map(rel => {
    if (!(0, _RelationshipCandidate.isRelationshipCandidate)(rel)) {
      return null;
    }

    return rel;
  }).filter(rel => !!rel); // log(result)

  return result;
}

EnhancedNodeCandidate.prototype.getAllRelationshipCandidates = getAllRelationshipCandidates;
/**
 * Gives access to required relationships for mutation.
 * Useful for buildEnhancedNodes. 
 * @public
 */

function getRequiredRelationships() {
  return this.requiredRelationships;
}

EnhancedNodeCandidate.prototype.getRequiredRelationships = getRequiredRelationships;

function setRequiredRelationships(arr) {
  this.requiredRelationships = arr;
}

EnhancedNodeCandidate.prototype.setRequiredRelationships = setRequiredRelationships;
/**
 * Gives access to optional relationships for mutation.
 * Useful for buildEnhancedNodes. 
 * @public
 */

function getOptionalRelationships() {
  return this.optionalRelationships;
}

EnhancedNodeCandidate.prototype.getOptionalRelationships = getOptionalRelationships;

function setOptionalRelationships(arr) {
  this.optionalRelationships = arr;
}

EnhancedNodeCandidate.prototype.setOptionalRelationships = setOptionalRelationships;
/**
 * Returns references to relationship nodes.
 * Allows mutable access to relationship nodes.
 */

function getAllRelationshipNodeCandidates() {
  return this.getAllRelationships().map(rel => {
    if (!(0, _RelationshipCandidate.isRelationshipCandidate)(rel)) {
      return null;
    }

    var {
      startNode,
      endNode,
      direction
    } = rel;

    if (direction == undefined || direction == null) {
      throw new Error("getAllRelationshipNodeCandidates(): RelationshipCandidate has no direction.\n".concat(JSON.stringify(rel)));
    }

    if (direction == 'inbound') {
      // return startNode
      return (0, _cloneDeep.default)(startNode);
    }

    if (direction == 'outbound') {
      // return endNode
      return (0, _cloneDeep.default)(endNode);
    }
  }).filter(rel => rel != null);
}

EnhancedNodeCandidate.prototype.getAllRelationshipNodeCandidates = getAllRelationshipNodeCandidates;
/**
 * Used to add/set RCs after the ENC was instantiated.
 * @param {*} arr 
 */

function setRequiredRelationshipCandidates(arr) {
  if (!arr.every(_RelationshipCandidate.isRelationshipCandidate)) {
    throw new Error("EnhancedNodeCandidate.setRequiredRelationshipCandidates(): first argument must be RelationshipCandidate[].\n\nReceived:\n".concat(JSON.stringify(arr)));
  }

  this.requiredRelationships = arr;
}

EnhancedNodeCandidate.prototype.setRequiredRelationshipCandidates = setRequiredRelationshipCandidates;
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

function isEnhanceable() {
  var obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
    mini_bikini: false
  };
  var mini = false;
  var isCoreNodeOk = (0, _Node.isNode)(this.getCoreNode()); // console.log(this.getAllRelationships())

  var areRelsOk = this.getAllRelationships().reduce((acc, rel) => {
    // console.log(rel.isWritable())

    /* had a case where rel == rcs, so rel.isWritable is not even a function */
    acc = (0, _Relationship.isRelationship)(rel) && rel.isWritable();
    return acc;
  }, true); // console.log(this)
  // console.log('isCoreNodeOk', isCoreNodeOk)
  // console.log('areRelsOk', areRelsOk)
  // console.log('isCoreNodeOk && areRelsOk', isCoreNodeOk && areRelsOk)

  return isCoreNodeOk && areRelsOk;
}

EnhancedNodeCandidate.prototype.isEnhanceable = isEnhanceable;
/**
 * Important method that promotes ENC to Enode! Enodes should only be created via this method.
 */

function toEnhancedNode() {
  /* Should I check first what is it that I want to enhance? */
  if (!this.isEnhanceable()) {
    throw new Error("EnhancedNodeCandidate.toEnhancedNode: this ENC is not enhanceable yet.\n\n".concat(JSON.stringify(this)));
  }

  var inbound = [...this.getRequiredRelationships().filter(rel => rel.direction === 'inbound'), ...this.getOptionalRelationships().filter(rel => rel.direction === 'inbound')];
  var outbound = [...this.getRequiredRelationships().filter(rel => rel.direction === 'outbound'), ...this.getOptionalRelationships().filter(rel => rel.direction === 'outbound')];
  var enode = new _EnhancedNode.EnhancedNode(_objectSpread(_objectSpread({}, this.getCoreNode()), {}, {
    relationships: {
      inbound,
      outbound
    }
  }));
  return enode;
}

EnhancedNodeCandidate.prototype.toEnhancedNode = toEnhancedNode;

function isEnhancedNodeCandidate(val) {
  return val instanceof EnhancedNodeCandidate;
}