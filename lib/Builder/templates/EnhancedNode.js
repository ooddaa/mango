"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EnhancedNode = void 0;
exports.isEnhancedNode = isEnhancedNode;
exports.isNotEnhancedNode = isNotEnhancedNode;
exports.isWrittenEnode = isWrittenEnode;

var _Node = require("./Node");

var _Result = require("../../Result");

var _utils = require("../../utils");

var _Relationship = require("./Relationship");

var _has = _interopRequireDefault(require("lodash/has"));

var _uniqBy = _interopRequireDefault(require("lodash/uniqBy"));

var _remove = _interopRequireDefault(require("lodash/remove"));

var _isArray = _interopRequireDefault(require("lodash/isArray"));

var _flatten = _interopRequireDefault(require("lodash/flatten"));

var _isEmpty = _interopRequireDefault(require("lodash/isEmpty"));

var _isString = _interopRequireDefault(require("lodash/isString"));

var _cloneDeep = _interopRequireDefault(require("lodash/cloneDeep"));

var _flattenDeep = _interopRequireDefault(require("lodash/flattenDeep"));

/**
 * Takes care of EnhancedNode's Relationships based on node's
 * properties.
 * @param {nodeLikeObject??} node
 */
var relationshipsTemplate = node => {
  var inbound = [],
      outbound = [];
  return {
    inbound,
    outbound
  };
};
/**
 * EnhancedNode is a data structure that represents a Node + n * Relationship where n >= 0.
 * It is the most basic and versatile building block of a Knowledge Graph.
 * Akin to a triangle in graphics, any KG can be composed of EnhancedNodes.
 *
 * @public
 * @class
 * @param {labels} labels - Array for all labels.
 * @param {properties} properties - Map with node properties.
 * @param {identity} identity - Unique identity provided by Neo4j.
 * @param {Object} relationships - {inbound, outbound} map with inbound/outbound Relationship[].
 */


class EnhancedNode extends _Node.Node {
  constructor() {
    var obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var {
      labels,
      properties,
      identity
    } = obj;
    super({
      labels,
      properties,
      identity
    });
    this.relationships = obj.relationships || {
      inbound: [],
      outbound: []
    };
    /* each Relationship will be complete with startNode and endNode */

    this.addThisNodeToRelationships();
  }
  /**
   * Adds this enode as Node (so that we don't drag enode everywhere) to
   * inbound ? endNode : startNode
   */


  addThisNodeToRelationships() {
    this.relationships.inbound.forEach(rel => {
      rel.endNode = this.toNode();
    });
    this.relationships.outbound.forEach(rel => {
      rel.startNode = this.toNode();
    });
  }

}
/**
 * Gets called by Builder when we need to dynamically
 * create Relationships based on given node's properties
 * as per set templating rules.
 * @param {Node} node
 */


exports.EnhancedNode = EnhancedNode;

function createRelationships(node) {
  var rels = relationshipsTemplate(node);
  this.relationships = rels;
  return rels;
}

EnhancedNode.prototype.createRelationships = createRelationships;

function getAllRelationships() {
  var obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
    byLabel: undefined
  };

  if (obj.byLabel && obj.byLabel.length) {
    return this.getAllRelationshipsAsArray().filter(rel => rel.labels.includes(obj.byLabel));
  }

  return this.relationships;
}

EnhancedNode.prototype.getAllRelationships = getAllRelationships;

function getAllRelationshipsAsObject() {
  return this.relationships;
}

EnhancedNode.prototype.getAllRelationshipsAsObject = getAllRelationshipsAsObject;
/**
 * Used by Engine.mergeEnhancedNodes.ensure_relationships.
 * Simply returns enode's own relationships.
 */

function getAllRelationshipsAsArray() {
  return this.relationships.inbound.concat(this.relationships.outbound);
}

EnhancedNode.prototype.getAllRelationshipsAsArray = getAllRelationshipsAsArray;

function getAllRelationshipsLabels() {
  return (0, _flatten.default)(this.getAllRelationshipsAsArray().map(rel => rel.getLabels()));
}

EnhancedNode.prototype.getAllRelationshipsLabels = getAllRelationshipsLabels;

function getInboundRelationships() {
  return this.relationships.inbound;
}

EnhancedNode.prototype.getInboundRelationships = getInboundRelationships;

function getOutboundRelationships() {
  return this.relationships.outbound;
}

EnhancedNode.prototype.getOutboundRelationships = getOutboundRelationships;

function getExcludedRelationshipsAsArray() {
  return this.getExcludedRelationships.inbound.concat(this.getExcludedRelationships.outbound);
}

EnhancedNode.prototype.getExcludedRelationshipsAsArray = getExcludedRelationshipsAsArray;

function getExcludedRelationships() {
  return (0, _has.default)(this, "excludedRelationships") && (0, _has.default)(this.excludedRelationships, "outbound") && (0, _has.default)(this.excludedRelationships, "inbound") && (0, _isArray.default)(this.excludedRelationships.outbound) && (0, _isArray.default)(this.excludedRelationships.inbound) && this.excludedRelationships;
}

EnhancedNode.prototype.getExcludedRelationships = getExcludedRelationships;

function getRelationshipsByLabel(label) {
  /* hhhhhhhhhhhhhhhhhhhhhhh HHHHHHHH hhhhhh H h H hHHHHhhhhhh
    
    */
  return this.getAllRelationshipsAsArray().filter(rel => rel.getLabels().includes(label));
}

EnhancedNode.prototype.getRelationshipsByLabel = getRelationshipsByLabel;
/**
 * While working on updateNodes, it turns out that we need to specify which
 * Relationships the Enode does not want to have, needs not to have, must
 * exclude - excluded. They are "negative" relationships, as opposed to
 * "positive" = outbound/inbound.
 * @todo I probably need to align positive & negative descriptions - both
 * should be outbound/inbound. Just for the sake of coherence, it just seems
 * right, and may reduce butthurt later on.
 * @returns
 */

function hasPositiveRelationships() {
  return this.getAllRelationshipsAsArray().length !== 0;
}

EnhancedNode.prototype.hasPositiveRelationships = hasPositiveRelationships;

function hasExcludedRelationships() {
  return (0, _has.default)(this, "excludedRelationships") && (0, _has.default)(this.excludedRelationships, "outbound") && (0, _has.default)(this.excludedRelationships, "inbound") && (0, _isArray.default)(this.excludedRelationships.outbound) && (0, _isArray.default)(this.excludedRelationships.inbound) && this.getExcludedRelationshipsAsArray().length !== 0;
}

EnhancedNode.prototype.hasExcludedRelationships = hasExcludedRelationships;

function hasAnyRelationships() {
  return this.hasPositiveRelationships() || this.hasExcludedRelationships();
}

EnhancedNode.prototype.hasAnyRelationships = hasAnyRelationships;
/**
 * I want to gather all Nodes and be able to merger them as part of Engine.mergeEnhancedNodes.
 * @param {*} obj
 */

function getParticipatingNodes() {
  var obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
    asHashMap: false
  };
  var current = [this.toNode(), ...this.getInboundRelationships().map(rel => rel.getStartNode()), ...this.getOutboundRelationships().map(rel => rel.getEndNode())];
  var final = current.reduce((acc, val) => {
    if (isEnhancedNode(val)) {
      // log(`Enode: ${val.getLabels()[0]}`)
      acc.push(...val.getParticipatingNodes()); // aaa was val.getParticipatingNodes1() !!

      return acc;
    } else if ((0, _Node.isNode)(val)) {
      // log(`Node: ${val.getLabels()[0]}`)
      acc.push(val);
      return acc;
    } else {
      throw new Error("EnhancedNode.getParticipatingNodes: something is wrong!.\nval: ".concat(JSON.stringify(val, null, 4)));
    }
  }, []);
  return obj.asHashMap ? _toHashMap(final) : final;
}

EnhancedNode.prototype.getParticipatingNodes = getParticipatingNodes;
/**
 * Use to quickly retrieve interesting Nodes from EnhancedNode.
 * Can search by first label and/or properties.
 * @todo match whole labels' array as we do with whole properties object.
 * @param {Object} obj
 * @returns {Node[] | EnhancedNode[]}
 */

function findParticipatingNodes() {
  var obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  /* validations */
  if ((0, _utils.isMissing)(obj.labels) && (0, _utils.isMissing)(obj.properties)) {
    throw new Error("EnhancedNode.findParticipatingNodes: supply either labels and/or properties to search.\nlabels: ".concat(JSON.stringify(obj.labels), "\nproperties: ").concat(JSON.stringify(obj.properties)));
  }

  if ((0, _isArray.default)(obj.labels) && (0, _utils.isMissing)(obj.labels[0])) {
    throw new Error("EnhancedNode.findParticipatingNodes: missing labels to search.\nlabels: ".concat(JSON.stringify(obj.labels)));
  }

  if ((0, _utils.isMissing)(obj.labels) && (0, _isEmpty.default)(obj.properties)) {
    throw new Error("EnhancedNode.findParticipatingNodes: attempted to search by properties, but they are empty.\nproperties: ".concat(JSON.stringify(obj.properties)));
  }
  /* !validations */


  var participatingNodes = this.getParticipatingNodes();
  var result = participatingNodes.filter(findNode);
  return result; ////////// FUN //////////

  function findNode(node) {
    /**
     * @bug I need to account for plural labels, so that if any node's label matches any obj.label
     * AND I should set { strict: true } if I want ALL labels to match.
     */
    if ((0, _isArray.default)(obj.labels) && (0, _utils.isPresent)(obj.labels[0])) {
      if (node.getLabels()[0] == obj.labels[0]) {
        /* check if we should match by properties */
        if ((0, _utils.isPresent)(obj.properties)) {
          if (allPropsMatch(node.getProperties(), obj.properties)) {
            return node;
          }
        } else {
          /* we matched by label */
          return node;
        }
      }
    } else if (allPropsMatch(node.getProperties(), obj.properties)) {
      return node;
    }

    return false;
  }

  function allPropsMatch(propsA, propsB) {
    /* propsA must include all propsB's key:value pairs */
    var result = false;

    for (var prop in propsB) {
      // result = propsA[prop] == propsB[prop] || false;
      // if () {
      //   result = true;
      // } else {
      //   result = false;
      // }
      if (propsA[prop] == propsB[prop]) {
        result = true;
      } else {
        result = false;
      }
    }

    return result;
  }
}

EnhancedNode.prototype.findParticipatingNodes = findParticipatingNodes;
/**
 * This gets called when we have received ids after merging to Neo4j.
 * Now we will walk this Enode and update participatingNodes with identities by _hash.
 * @param {Object} ids - must be { _hash: Node }
 */

function identifyParticipatingNodes(ids) {
  this.addProperty("_uuid", ids[this.getHash()].getProperty("_uuid"));
  this.setIdentity(ids[this.getHash()].identity);
  this.getAllRelationshipsAsArray().forEach(rel => {
    // do recursively on participatingNodes
    var pn = rel.getPartnerNode();

    if (isEnhancedNode(pn)) {
      pn.identifyParticipatingNodes(ids);
    } else {
      pn.addProperty("_uuid", ids[pn.getHash()].getProperty("_uuid"));
      pn.setIdentity(ids[pn.getHash()].identity);
    }
  });
  return this;
}

EnhancedNode.prototype.identifyParticipatingNodes = identifyParticipatingNodes;
/**
 * Case - when we have ids for the Enode - we must traverse relationships and set same ids
 * on each copy (?) of main Enode.
 * @param {*} val
 */

function setIdentity(val) {
  this.identity = val;
  this.addThisNodeToRelationships();
  return this;
}

EnhancedNode.prototype.setIdentity = setIdentity;
/**
 * @important MUTATES this.relationships!
 * I want to gather all Relationships, featured in this enode (all levels deep).
 * Will use by Engine.mergeEnhancedNodes.
 * Short form == Relationship - startNode/endNode.
 * I need this to add identifications, don't  need to drag startNode/endNode around.
 * @param {*} obj
 */

function getParticipatingRelationships() {
  var obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
    asHashMap: false,
    short: false
  };
  var node = arguments.length > 1 ? arguments[1] : undefined;

  /**
   * Gather all Relationships recursively.
   */
  // log(this)
  var {
    asHashMap,
    short
  } = obj;
  var final = this.getAllRelationshipsAsArray().reduce((acc, rel) => {
    var partnerNode = rel.getPartnerNode();
    acc.push(short ? rel.shorten() : rel);

    if (isEnhancedNode(partnerNode)) {
      acc.push(...partnerNode.getParticipatingRelationships({
        short
      }));
    }

    return acc;
  }, []);

  if (asHashMap) {
    return short ? _toHashMap(final.map(shorten)) : _toHashMap(final);
  } else {
    return short ? final.map(shorten) : final;
  } /////////////// FUN ///////////////


  function shorten(val) {
    return val.shorten();
  } /////////////// END ///////////////

}

EnhancedNode.prototype.getParticipatingRelationships = getParticipatingRelationships;

function getParticipatingRelationshipsByLabel(label) {}

EnhancedNode.prototype.getParticipatingRelationshipsByLabel = getParticipatingRelationshipsByLabel;
/**
 * This gets called by Engine.mergeEnhancedNodes when we have merged Relationships and
 * now want to update the original Enode's Relationships with Neo4j identifications.
 * @param {object} ids - hash map with Neo4j identifications. Actually it looks as
 * 'relationship1_hash': Relationship ??
 * @param {EnhancedNode} enode
 */

function identifyParticipatingRelationships(ids, enode) {
  var current = this.getAllRelationshipsAsArray().forEach(rel => {
    var ided = ids[rel.getHash()];

    if (!ided) {
      throw new Error("EnhancedNode.identifyParticipatingRelationships: was not provided an identified relationship (no ided) for _hash: ".concat(rel.getHash(), ".\nids:\n").concat(JSON.stringify(ids)));
    }
    /* copy Neo4j's identity */


    rel.setIdentity(ided.identity);

    if ((0, _has.default)(ided, "properties") && (0, _has.default)(ided.properties, "_uuid")) {
      rel.addProperty("_uuid", (0, _Relationship.isRelationship)(ided) // I'm not sure I will use Relationships here
      ? ided.getProperty("_uuid") : ided.properties._uuid);
    }
    /* do recursively on participating Enodes */


    var pn = rel.getPartnerNode();
    if (isEnhancedNode(pn)) pn.identifyParticipatingRelationships(ids);
  });
  return this;
}

EnhancedNode.prototype.identifyParticipatingRelationships = identifyParticipatingRelationships;
/**
 * Use to flatten structures.
 */

function toNode() {
  return new _Node.Node({
    labels: this.labels,
    properties: this.properties,
    identity: this.identity
  });
}

EnhancedNode.prototype.toNode = toNode;
/**
 * This simply adds existing Relationships to the owner EnhancedNode.
 * @usedby Engine when it has [startNode, relationship, endNode] returned from Neo4j.
 * @param {Relationship[]} rels
 */

function addRelationships(rels) {
  rels.forEach(rel => {
    // need to understand direction
    // match startNode with this by _hash
    var direction = "";

    if (rel.getStartNode().getHash() == this.getHash()) {
      direction = "outbound";
    } else if (rel.getEndNode().getHash() == this.getHash()) {
      direction = "inbound";
    } else {
      throw new Error("EnhancedNode.addRelationships: this relationship does not belong to this EnhancedNode, hashes do not match.\n            \nEnhancedNode: ".concat(JSON.stringify(this.toNode()), "\n            \nrel: ").concat(JSON.stringify(rel)));
    }

    rel.direction = direction;
    this.relationships[direction].push(rel);
  });
}

EnhancedNode.prototype.addRelationships = addRelationships;

function addAllRelationships(relationships) {
  var inbounds, outbounds;

  if ((0, _utils.isMissing)(relationships) || (0, _utils.not)((0, _has.default)(relationships, "inbound")) || (0, _utils.not)((0, _isArray.default)(relationships.inbound))) {
    inbounds = [];
  } else {
    inbounds = relationships.inbound;
  }

  if ((0, _utils.isMissing)(relationships) || (0, _utils.not)((0, _has.default)(relationships, "outbound")) || (0, _utils.not)((0, _isArray.default)(relationships.outbound))) {
    outbounds = [];
  } else {
    outbounds = relationships.outbound;
  }

  if ((0, _utils.not)((0, _utils.isMissing)(this.relationships)) && (0, _isArray.default)(this.relationships.inbound)) {
    this.relationships.inbound = [...this.relationships.inbound, ...inbounds];
  } else {
    this.relationships.inbound = [];
  }

  if ((0, _utils.not)((0, _utils.isMissing)(this.relationships)) && (0, _isArray.default)(this.relationships.outbound)) {
    this.relationships.outbound = [...this.relationships.outbound, ...outbounds];
  } else {
    this.relationships.outbound = [];
  }
}

EnhancedNode.prototype.addAllRelationships = addAllRelationships;
/**
 * this does too many things. cannot use in addRelationships.
 * @horribleName Must be renamed addNewOutboundRelationships?
 * @param {*} relationships
 */

function addOutboundRelationships(relationships) {
  this.relationships.outbound.push(...relationships.map(rel => {
    rel.startNode = this;
    /* set _hash */

    rel.setHash();
    return rel;
  }));
}

EnhancedNode.prototype.addOutboundRelationships = addOutboundRelationships;
/**
 * this does too many things. cannot use in addRelationships.
 * @horribleName Must be renamed addNewInboundRelationships?
 * @param {*} relationships
 */

function addInboundRelationships(relationships) {
  this.relationships.inbound.push(...relationships.map(rel => {
    rel.endNode = this;
    /* set _hash */

    rel.setHash();
    return rel;
  }));
}

EnhancedNode.prototype.addInboundRelationships = addInboundRelationships;
/**
 * This method checks if this EnhancedNode in its present state
 * has all IDs and _hashes - itself, all participating Nodes/Enodes/Relationships.
 */

function isWritable() {
  return this.getAllRelationshipsAsArray().every(rel => rel.isWritable());
}

EnhancedNode.prototype.isWritable = isWritable;
/**
 * Checks all requied hashes exist +
 * all Ids exist == enode has been written into Neo4j.
 * @todo add _uuid check?
 */

function isWritten() {
  return !!(this.getHash() && (0, _utils.isPresent)(this.getId()) && this.getAllRelationshipsAsArray().every(rel => rel.isWritten()));
}

EnhancedNode.prototype.isWritten = isWritten;
/**
 * I can pass Relationship[] and build a deep EnhancedNode -
 * ie a graph with this enode as the parent node.
 * @description Builds a deep EnhancedNode out of a set of Relationships
 *  Expects all Relationships[] to have at least one connection (however remote)
 *  to the main EnhancedNode
 * @param {*} rels
 */

function deepen(_rels) {
  var rels = (0, _cloneDeep.default)(_rels);
  var uniqRels = (0, _uniqBy.default)(rels, getHash);
  var nodes = uniqRels.reduce((acc, rel) => {
    acc.push(...rel.getNodes());
    return acc;
  }, []);
  var uniqNodes = (0, _uniqBy.default)(nodes, getHash);
  var uniqNodesHashes = uniqNodes.map(getHash);
  var [enode] = uniqNodes.filter(n => {
    return n.getHash() === this.getHash();
  });

  if (!enode || !isEnhancedNode(enode)) {
    // throw new Error(`EnhancedNode.deepen: couldn't match first enode.\nenode: ${JSON.stringify(enode)}\nrels: ${JSON.stringify(rels)}`)
    return this;
  }

  var result = traverser(enode, uniqRels);
  return result; /////////////// FUN ///////////////

  function traverser(parentNode, box) {
    if (!isEnhancedNode(parentNode)) {
      throw new Error("EnhancedNode.deepen.traverser: expect parentNode to be EnhancedNode.\nparentNode: ".concat(JSON.stringify(parentNode)));
    }

    if (!box.length) {
      return parentNode;
    }
    /* save parentNode hash */


    var parentNodeHash = parentNode.getHash(); // console.log('parentNodeHash: ', parentNodeHash, 'isIncluded: ', uniqNodesHashes.includes(parentNodeHash), 'uniqNodesHashes: ', uniqNodesHashes.length)

    if (!parentNodeHash || !(0, _isString.default)(parentNodeHash)) {
      throw new Error("EnhancedNode.deepen.traverser: parentNode have a string hash.\nparentNode: ".concat(JSON.stringify(parentNode)));
    }
    /* are there any relevant unattended Relationships in the box? */


    function relMatcher(rel) {
      return [rel.getStartNodeHash(), rel.getEndNodeHash()].includes(parentNodeHash);
    }
    /* remove relevantRels from the box, mutates box. */


    var relevantRels = (0, _remove.default)(box, relMatcher);

    if (!relevantRels.length) {
      return parentNode;
    } // nothing to do here

    /* at this point we have some unattributed rels relevant to this parentNode. attribute 'em */


    relevantRels.forEach(rel => {
      /* check direction */
      if (rel.getStartNodeHash() === parentNodeHash) {
        rel.setDirection("outbound");
        parentNode.relationships.outbound.push(rel);
      } else if (rel.getEndNodeHash() === parentNodeHash) {
        rel.setDirection("inbound");
        parentNode.relationships.inbound.push(rel);
      } else {
        throw new Error("EnhancedNode.deepen.traverser: something went wrong, coundn't detect direction.\nparentNode: ".concat(JSON.stringify(parentNode), "\nrel: ").concat(JSON.stringify(rel)));
      }
    });
    /* now time to go through these rels and treat each partnerNode as parentNode until box is empty */

    /* start going through rels */

    parentNode.getAllRelationshipsAsArray().forEach(rel => {
      var parentNode = rel.getPartnerNode();
      parentNode = traverser(parentNode, box);
    });
    return parentNode;
  }

  function getHash(val) {
    return val.getHash();
  } /////////////// END ///////////////

}

EnhancedNode.prototype.deepen = deepen;

function isCurrent() {
  return this.properties._isCurrent;
}

EnhancedNode.prototype.isCurrent = isCurrent;

function markAsUpdated() {}

EnhancedNode.prototype.markAsUpdated = markAsUpdated;

function hasBeenUpdated() {
  return this.properties._hasBeenUpdated;
}

EnhancedNode.prototype.hasBeenUpdated = hasBeenUpdated;

function getNextNodeHash() {
  return this.properties._nextNodeHash;
}

EnhancedNode.prototype.getNextNodeHash = getNextNodeHash;

function getPreviousNodeHash() {
  return this.properties._previousNodeHash;
}

EnhancedNode.prototype.getPreviousNodeHash = getPreviousNodeHash;

function isEnhancedNode(val) {
  return val instanceof EnhancedNode;
}

function isNotEnhancedNode(val) {
  return !isEnhancedNode(val);
}

function _toHashMap(arr) {
  // log(arr)
  return arr.reduce((acc, val) => {
    // if (!isNode(val) || !isEnhancedNode(val) || !isRelationship(val)) {
    //     throw new Error(`EnhancedNode._toHashMap: val must be Node | EnhancedNode | Relationship.'\n${JSON.stringify(val)}`)
    // }
    if (!val || !val.properties || !val.getHash()) {
      throw new Error("EnhancedNode._toHashMap: cannot locate _hash (!val || !val.properties || !val.properties._hash).\nval: ".concat(JSON.stringify(val)));
    }

    acc[val.getHash()] = val;
    return acc;
  }, {});
}

function isWrittenEnode(enode) {
  if (isNotEnhancedNode(enode)) {
    throw new Error("isWrittenEnode: enode must be EnhancedNode.\nenode: ".concat(JSON.stringify(enode)));
  }

  return enode.isWritten();
}