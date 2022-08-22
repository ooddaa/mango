/* @flow */

import { Node, isNode } from "./Node";
import { Success, Failure } from "../../Result";
import { log, isMissing, isPresent, not, decomposeProps } from "../../utils";
import { Relationship, isRelationship } from "./Relationship";

import has from "lodash/has";
import keys from "lodash/keys";
import values from "lodash/values";
import uniqBy from "lodash/uniqBy";
import remove from "lodash/remove";
import isArray from "lodash/isArray";
import flatten from "lodash/flatten";
import isEmpty from "lodash/isEmpty";
import isString from "lodash/isString";
import cloneDeep from "lodash/cloneDeep";
import flattenDeep from "lodash/flattenDeep";

/**
 * Takes care of EnhancedNode's Relationships based on node's
 * properties.
 * @param {nodeLikeObject??} node
 */
const relationshipsTemplate = (node) => {
  const inbound = [],
    outbound = [];
  return { inbound, outbound };
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
class EnhancedNode extends Node {
  labels: string[];
  properties: Object;
  identity: number | string | null;
  relationships: Object;
  createRelationships: Function;
  getAllRelationships: Function;
  getAllRelationshipsAsObject: Function;
  getAllRelationshipsAsArray: Function;
  getAllRelationshipsLabels: Function;
  getInboundRelationships: Function;
  getAllRelationshipsLabels: Function;
  getOutboundRelationships: Function;
  getExcludedRelationshipsAsArray: Function;
  getExcludedRelationships: Function;
  getRelationshipsByLabel: Function;
  hasPositiveRelationships: Function;
  hasExcludedRelationships: Function;
  hasAnyRelationships: Function;
  getParticipatingNodes: Function;
  findParticipatingNodes: Function;
  identifyParticipatingNodes: Function;
  getParticipatingRelationships: Function;
  getParticipatingRelationshipsByLabel: Function;
  identifyParticipatingRelationships: Function;
  addRelationships: Function;
  addAllRelationships: Function;
  addOutboundRelationships: Function;
  addInboundRelationships: Function;
  isWritable: Function;
  deepen: Function;
  isCurrent: Function;
  markAsUpdated: Function;
  hasBeenUpdated: Function;
  getNextNodeHash: Function;
  getPreviousNodeHash: Function;
  constructor(
    obj: {
      labels?: string[],
      properties?: Object,
      identity?: number | string | null,
      relationships?: { inbound: Relationship[], outbound: Relationship[] },
    } = {}
  ) {
    let { labels, properties, identity } = obj;
    super({ labels, properties, identity });

    this.relationships = obj.relationships || { inbound: [], outbound: [] };
    /* each Relationship will be complete with startNode and endNode */
    this.addThisNodeToRelationships();
  }
  /**
   * Adds this enode as Node (so that we don't drag enode everywhere) to
   * inbound ? endNode : startNode
   */
  addThisNodeToRelationships() {
    this.relationships.inbound.forEach((rel) => {
      rel.endNode = this.toNode();
    });
    this.relationships.outbound.forEach((rel) => {
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
function createRelationships(node: Node): Object {
  const rels = relationshipsTemplate(node);
  this.relationships = rels;
  return rels;
}
EnhancedNode.prototype.createRelationships = createRelationships;

function getAllRelationships(
  obj: {
    byLabel: string | typeof undefined,
  } = {
      byLabel: undefined,
    }
): Object | Relationship[] {
  if (obj.byLabel && obj.byLabel.length) {
    return this.getAllRelationshipsAsArray().filter((rel) =>
      rel.labels.includes(obj.byLabel)
    );
  }
  return this.relationships;
}
EnhancedNode.prototype.getAllRelationships = getAllRelationships;

function getAllRelationshipsAsObject(): Object {
  return this.relationships;
}
EnhancedNode.prototype.getAllRelationshipsAsObject = getAllRelationshipsAsObject;

/**
 * Used by Engine.mergeEnhancedNodes.ensure_relationships.
 * Simply returns enode's own relationships.
 */
function getAllRelationshipsAsArray(): Relationship[] {
  return this.relationships.inbound.concat(this.relationships.outbound);
}
EnhancedNode.prototype.getAllRelationshipsAsArray = getAllRelationshipsAsArray;

function getAllRelationshipsLabels(): string[] {
  return flatten(
    this.getAllRelationshipsAsArray().map((rel) => rel.getLabels())
  );
}
EnhancedNode.prototype.getAllRelationshipsLabels = getAllRelationshipsLabels;

function getInboundRelationships(): Relationship[] {
  return this.relationships.inbound;
}
EnhancedNode.prototype.getInboundRelationships = getInboundRelationships;

function getOutboundRelationships(): Relationship[] {
  return this.relationships.outbound;
}
EnhancedNode.prototype.getOutboundRelationships = getOutboundRelationships;

function getExcludedRelationshipsAsArray(): Relationship[] {
  return this.getExcludedRelationships.inbound.concat(
    this.getExcludedRelationships.outbound
  );
}
EnhancedNode.prototype.getExcludedRelationshipsAsArray = getExcludedRelationshipsAsArray;

function getExcludedRelationships(): Relationship[] {
  return (
    has(this, "excludedRelationships") &&
    has(this.excludedRelationships, "outbound") &&
    has(this.excludedRelationships, "inbound") &&
    isArray(this.excludedRelationships.outbound) &&
    isArray(this.excludedRelationships.inbound) &&
    this.excludedRelationships
  );
}
EnhancedNode.prototype.getExcludedRelationships = getExcludedRelationships;

function getRelationshipsByLabel(label): Relationship[] {
  /* hhhhhhhhhhhhhhhhhhhhhhh HHHHHHHH hhhhhh H h H hHHHHhhhhhh
    
    */
  return this.getAllRelationshipsAsArray().filter((rel) =>
    rel.getLabels().includes(label)
  );
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
function hasPositiveRelationships(): boolean {
  return this.getAllRelationshipsAsArray().length !== 0;
}
EnhancedNode.prototype.hasPositiveRelationships = hasPositiveRelationships;

function hasExcludedRelationships(): boolean {
  return (
    has(this, "excludedRelationships") &&
    has(this.excludedRelationships, "outbound") &&
    has(this.excludedRelationships, "inbound") &&
    isArray(this.excludedRelationships.outbound) &&
    isArray(this.excludedRelationships.inbound) &&
    this.getExcludedRelationshipsAsArray().length !== 0
  );
}
EnhancedNode.prototype.hasExcludedRelationships = hasExcludedRelationships;

function hasAnyRelationships(): boolean {
  return this.hasPositiveRelationships() || this.hasExcludedRelationships();
}
EnhancedNode.prototype.hasAnyRelationships = hasAnyRelationships;

/**
 * I want to gather all Nodes and be able to merger them as part of Engine.mergeEnhancedNodes.
 * @param {*} obj
 */
function getParticipatingNodes(
  obj: { asHashMap: boolean } = { asHashMap: false }
): Node[] | Object {
  const current = [
    this.toNode(),
    ...this.getInboundRelationships().map((rel) => rel.getStartNode()),
    ...this.getOutboundRelationships().map((rel) => rel.getEndNode()),
  ];
  const final = current.reduce((acc, node) => {
    if (isEnhancedNode(node)) {
      acc.push(...node.getParticipatingNodes());
      return acc;
    } else if (isNode(node)) {
      /**
       * @bugfix 220822 - check if node with same hash already exists
       * if so, check who has more properties - there might be optional ones
       * that we do not want to skip
       */

      const matched = acc.filter(({ properties: { _hash } }) => _hash === node.properties._hash)

      if (matched.length) {
        /**
         * @todo x.length > 1 ??, sort and pick one with most properties
         */

        const existingKeys = keys(matched[0].properties)
        const newKeys = keys(node.properties)
        /* already exists, no new props are offered, skip */
        if (existingKeys.length > newKeys.length) return acc
      }

      acc.push(node);
      return acc;
    } else {
      throw new Error(
        `EnhancedNode.getParticipatingNodes: something is wrong!.\nnode: ${JSON.stringify(
          node,
          null,
          4
        )}`
      );
    }
  }, []);
  // remove duplicates, prefer onces with more properties
  const hashMap = _toHashMap(final)
  // log(values(final).filter(node => node.properties.NAME === 'child0'))
  // return obj.asHashMap ? _toHashMap(final) : final;
  return obj.asHashMap ? hashMap : values(final);
}
EnhancedNode.prototype.getParticipatingNodes = getParticipatingNodes;

/**
 * Use to quickly retrieve interesting Nodes from EnhancedNode.
 * Can search by first label and/or properties.
 * @todo match whole labels' array as we do with whole properties object.
 * @param {Object} obj
 * @returns {Node[] | EnhancedNode[]}
 * 
 * @example
 * enode.findParticipatingNodes({ properties: { NAME: "child3" } })) // [ Node { properties: { NAME: "child3",.. } }]
 */
function findParticipatingNodes(
  obj: { labels: String[], properties: Object } = {}
): Node[] | EnhancedNode[] {
  /* validations */
  if (isMissing(obj.labels) && isMissing(obj.properties)) {
    throw new Error(
      `EnhancedNode.findParticipatingNodes: supply either labels and/or properties to search.\nlabels: ${JSON.stringify(
        obj.labels
      )}\nproperties: ${JSON.stringify(obj.properties)}`
    );
  }
  if (isArray(obj.labels) && isMissing(obj.labels[0])) {
    throw new Error(
      `EnhancedNode.findParticipatingNodes: missing labels to search.\nlabels: ${JSON.stringify(
        obj.labels
      )}`
    );
  }
  if (isMissing(obj.labels) && isEmpty(obj.properties)) {
    throw new Error(
      `EnhancedNode.findParticipatingNodes: attempted to search by properties, but they are empty.\nproperties: ${JSON.stringify(
        obj.properties
      )}`
    );
  }
  /* !validations */

  const participatingNodes = this.getParticipatingNodes();
  const result = participatingNodes.filter(findNode);
  return result;

  ////////// FUN //////////
  function findNode(node: Node): Node | boolean {
    /**
     * @bug I need to account for plural labels, so that if any node's label matches any obj.label
     * AND I should set { strict: true } if I want ALL labels to match.
     */
    if (isArray(obj.labels) && isPresent(obj.labels[0])) {
      if (node.getLabels()[0] == obj.labels[0]) {
        /* check if we should match by properties */
        if (isPresent(obj.properties)) {
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
    let result = false;
    for (let prop in propsB) {
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
 *  @note 220822 - returned Relationships might still show stale data -
 * Neo4j's state might be misrepresented to the client, so here 
 * we want to update the returned Enode's relationships with:
 *  - Neo4j's identifications
 *  - any optional Node properties (we assume REQUIRED properties weren't
 *    changed as _hash'es would have changed) - dealing with 
 *    Mango.simplifiedDeepEnhancedNode functionality here.
 * 
 * @param {{ string: Node }} node_hashMap - must be { _hash: Node }
 */
function identifyParticipatingNodes(node_hashMap: Object): /* this */ EnhancedNode {
  const node = node_hashMap[this.getHash()]
  this.addProperty("_uuid", node.getProperty("_uuid"));
  this.setIdentity(node.identity);

  /* add optionals if any */
  const { optionalProps } = decomposeProps(node.getProperties())
  // log(optionalProps)
  if (keys(optionalProps).length) {
    this.properties = {
      ...this.properties,
      ...optionalProps,
    }
  }

  this.getAllRelationshipsAsArray().forEach((rel) => {
    /* do recursively on participatingNodes */
    const pn = rel.getPartnerNode();
    if (isEnhancedNode(pn)) {
      pn.identifyParticipatingNodes(node_hashMap);
    } else {
      const pnode = node_hashMap[pn.getHash()]
      pn.addProperty("_uuid", pnode.getProperty("_uuid"));
      pn.setIdentity(pnode.identity);
      const { optionalProps } = decomposeProps(pnode.getProperties())
      if (keys(optionalProps).length) {
        pn.properties = {
          ...pn.properties,
          ...optionalProps,
        }
      }
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
function setIdentity(val): /* this */ EnhancedNode {
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
 * @param {import("lodash").Object} obj
 * @returns {Relationship[]|Object}
 */
function getParticipatingRelationships(
  obj: {
    asHashMap: boolean,
    short: boolean,
  } = {
      asHashMap: false,
      short: false,
    },
  node: Node | EnhancedNode
): Relationship[] | Object {
  /**
   * Gather all Relationships recursively.
   */
  // log(this)
  const { asHashMap, short } = obj;
  const final = this.getAllRelationshipsAsArray().reduce((acc, rel) => {
    const partnerNode = rel.getPartnerNode();
    acc.push(short ? rel.shorten() : rel);
    if (isEnhancedNode(partnerNode)) {
      acc.push(...partnerNode.getParticipatingRelationships({ short }));
    }
    return acc;
  }, []);

  if (asHashMap) {
    return short ? _toHashMap(final.map(shorten)) : _toHashMap(final);
  } else {
    return short ? final.map(shorten) : final;
  }

  /////////////// FUN ///////////////
  function shorten(val) {
    return val.shorten();
  }
  /////////////// END ///////////////
}
EnhancedNode.prototype.getParticipatingRelationships = getParticipatingRelationships;

/**
 * @todo implement!
 * @param {string} label
 */
function getParticipatingRelationshipsByLabel(label: string): Relationship[] { }
EnhancedNode.prototype.getParticipatingRelationshipsByLabel = getParticipatingRelationshipsByLabel;

/**
 * This gets called by Engine.mergeEnhancedNodes when we have merged Relationships and
 * now want to update the original Enode's Relationships with Neo4j identifications.
 * @todo should really be re-named updateParticipatingRelationships
 * 
 * @param {object} ids - hash map with Neo4j identifications. Actually it looks as
 * 'relationship1_hash': Relationship ??
 * @param {EnhancedNode} enode
 */
function identifyParticipatingRelationships(
  ids: Object,
  enode?: EnhancedNode
): /* this */ EnhancedNode {
  const current =
    this
      .getAllRelationshipsAsArray()
      .forEach((rel) => {
        const ided = ids[rel.getHash()];
        if (!ided) {
          throw new Error(
            `EnhancedNode.identifyParticipatingRelationships: was not provided an identified relationship (no ided) for _hash: ${rel.getHash()}.\nids:\n${JSON.stringify(
              ids
            )}`
          );
        }
        /* copy Neo4j's identity */
        rel.setIdentity(ided.identity);

        if (has(ided, "properties") && has(ided.properties, "_uuid")) {
          rel.addProperty(
            "_uuid",
            isRelationship(ided) // I'm not sure I will use Relationships here
              ? ided.getProperty("_uuid")
              : ided.properties._uuid
          );
        }

        /* do recursively on participating Enodes */
        const pn = rel.getPartnerNode();
        if (isEnhancedNode(pn)) pn.identifyParticipatingRelationships(ids);
      });
  return this;
}
EnhancedNode.prototype.identifyParticipatingRelationships = identifyParticipatingRelationships;

/**
 * Use to flatten structures.
 */
function toNode(): Node {
  return new Node({
    labels: this.labels,
    properties: this.properties,
    identity: this.identity,
  });
}
EnhancedNode.prototype.toNode = toNode;

/**
 * This simply adds existing Relationships to the owner EnhancedNode.
 * @usedby Engine when it has [startNode, relationship, endNode] returned from Neo4j.
 * @param {Relationship[]} rels
 */
function addRelationships(rels: Relationship[]): void {
  rels.forEach((rel) => {
    // need to understand direction
    // match startNode with this by _hash
    let direction = "";
    if (rel.getStartNode().getHash() == this.getHash()) {
      direction = "outbound";
    } else if (rel.getEndNode().getHash() == this.getHash()) {
      direction = "inbound";
    } else {
      throw new Error(`EnhancedNode.addRelationships: this relationship does not belong to this EnhancedNode, hashes do not match.
            \nEnhancedNode: ${JSON.stringify(this.toNode())}
            \nrel: ${JSON.stringify(rel)}`);
    }
    rel.direction = direction;
    this.relationships[direction].push(rel);
  });
}
EnhancedNode.prototype.addRelationships = addRelationships;

function addAllRelationships(relationships: {
  inbound: Relationship[],
  outbound: Relationship[],
}): void {
  let inbounds, outbounds;
  if (
    isMissing(relationships) ||
    not(has(relationships, "inbound")) ||
    not(isArray(relationships.inbound))
  ) {
    inbounds = [];
  } else {
    inbounds = relationships.inbound;
  }
  if (
    isMissing(relationships) ||
    not(has(relationships, "outbound")) ||
    not(isArray(relationships.outbound))
  ) {
    outbounds = [];
  } else {
    outbounds = relationships.outbound;
  }

  if (
    not(isMissing(this.relationships)) &&
    isArray(this.relationships.inbound)
  ) {
    this.relationships.inbound = [...this.relationships.inbound, ...inbounds];
  } else {
    this.relationships.inbound = [];
  }
  if (
    not(isMissing(this.relationships)) &&
    isArray(this.relationships.outbound)
  ) {
    this.relationships.outbound = [
      ...this.relationships.outbound,
      ...outbounds,
    ];
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
function addOutboundRelationships(relationships: Relationship[]): void {
  this.relationships.outbound.push(
    ...relationships.map((rel) => {
      rel.startNode = this;
      /* set _hash */
      rel.setHash();
      return rel;
    })
  );
}
EnhancedNode.prototype.addOutboundRelationships = addOutboundRelationships;

/**
 * this does too many things. cannot use in addRelationships.
 * @horribleName Must be renamed addNewInboundRelationships?
 * @param {*} relationships
 */
function addInboundRelationships(relationships: Relationship[]): void {
  this.relationships.inbound.push(
    ...relationships.map((rel) => {
      rel.endNode = this;
      /* set _hash */
      rel.setHash();
      return rel;
    })
  );
}
EnhancedNode.prototype.addInboundRelationships = addInboundRelationships;

/**
 * This method checks if this EnhancedNode in its present state
 * has all IDs and _hashes - itself, all participating Nodes/Enodes/Relationships.
 */
function isWritable(): boolean {
  return this.getAllRelationshipsAsArray().every((rel) => rel.isWritable());
}
EnhancedNode.prototype.isWritable = isWritable;

/**
 * Checks all requied hashes exist +
 * all Ids exist == enode has been written into Neo4j.
 * @todo add _uuid check?
 */
function isWritten(): boolean {
  return !!(
    this.getHash() &&
    isPresent(this.getId()) &&
    this.getAllRelationshipsAsArray().every((rel) => rel.isWritten())
  );
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
function deepen(_rels: Relationship[]): EnhancedNode {
  const rels = cloneDeep(_rels);
  const uniqRels = uniqBy(rels, getHash);
  const nodes = uniqRels.reduce((acc, rel) => {
    acc.push(...rel.getNodes());
    return acc;
  }, []);
  const uniqNodes = uniqBy(nodes, getHash);
  const uniqNodesHashes = uniqNodes.map(getHash);
  const [enode] = uniqNodes.filter((n) => {
    return n.getHash() === this.getHash();
  });
  if (!enode || !isEnhancedNode(enode)) {
    // throw new Error(`EnhancedNode.deepen: couldn't match first enode.\nenode: ${JSON.stringify(enode)}\nrels: ${JSON.stringify(rels)}`)
    return this;
  }

  const result = traverser(enode, uniqRels);
  return result;

  /////////////// FUN ///////////////
  function traverser(parentNode: EnhancedNode, box: Relationship[]) {
    if (!isEnhancedNode(parentNode)) {
      throw new Error(
        `EnhancedNode.deepen.traverser: expect parentNode to be EnhancedNode.\nparentNode: ${JSON.stringify(
          parentNode
        )}`
      );
    }
    if (!box.length) {
      return parentNode;
    }

    /* save parentNode hash */
    const parentNodeHash = parentNode.getHash();
    // console.log('parentNodeHash: ', parentNodeHash, 'isIncluded: ', uniqNodesHashes.includes(parentNodeHash), 'uniqNodesHashes: ', uniqNodesHashes.length)
    if (!parentNodeHash || !isString(parentNodeHash)) {
      throw new Error(
        `EnhancedNode.deepen.traverser: parentNode have a string hash.\nparentNode: ${JSON.stringify(
          parentNode
        )}`
      );
    }
    /* are there any relevant unattended Relationships in the box? */
    function relMatcher(rel) {
      return [rel.getStartNodeHash(), rel.getEndNodeHash()].includes(
        parentNodeHash
      );
    }

    /* remove relevantRels from the box, mutates box. */
    const relevantRels = remove(box, relMatcher);

    if (!relevantRels.length) {
      return parentNode;
    } // nothing to do here

    /* at this point we have some unattributed rels relevant to this parentNode. attribute 'em */
    relevantRels.forEach((rel) => {
      /* check direction */
      if (rel.getStartNodeHash() === parentNodeHash) {
        rel.setDirection("outbound");
        parentNode.relationships.outbound.push(rel);
      } else if (rel.getEndNodeHash() === parentNodeHash) {
        rel.setDirection("inbound");
        parentNode.relationships.inbound.push(rel);
      } else {
        throw new Error(
          `EnhancedNode.deepen.traverser: something went wrong, coundn't detect direction.\nparentNode: ${JSON.stringify(
            parentNode
          )}\nrel: ${JSON.stringify(rel)}`
        );
      }
    });

    /* now time to go through these rels and treat each partnerNode as parentNode until box is empty */
    /* start going through rels */
    parentNode.getAllRelationshipsAsArray().forEach((rel) => {
      let parentNode = rel.getPartnerNode();
      parentNode = traverser(parentNode, box);
    });
    return parentNode;
  }

  function getHash(val: Node | Relationship) {
    return val.getHash();
  }
  /////////////// END ///////////////
}
EnhancedNode.prototype.deepen = deepen;

function isCurrent(): boolean {
  return this.properties._isCurrent;
}
EnhancedNode.prototype.isCurrent = isCurrent;

function markAsUpdated(): void { }
EnhancedNode.prototype.markAsUpdated = markAsUpdated;

function hasBeenUpdated(): boolean {
  return this.properties._hasBeenUpdated;
}
EnhancedNode.prototype.hasBeenUpdated = hasBeenUpdated;

function getNextNodeHash(): string | null {
  return this.properties._nextNodeHash;
}
EnhancedNode.prototype.getNextNodeHash = getNextNodeHash;

function getPreviousNodeHash(): string | null {
  return this.properties._previousNodeHash;
}
EnhancedNode.prototype.getPreviousNodeHash = getPreviousNodeHash;

function isEnhancedNode(val: any): boolean {
  return val instanceof EnhancedNode;
}
function isNotEnhancedNode(val: any): boolean {
  return !isEnhancedNode(val);
}
function _toHashMap(arr: (Node | EnhancedNode | Relationship)[]): Object {
  // log(arr)
  return arr.reduce((acc, node) => {
    // log(node)
    if (!node || !node.properties || !node.getHash()) {
      throw new Error(
        `EnhancedNode._toHashMap: cannot locate _hash (!node || !node.properties || !node.properties._hash).\nnode: ${JSON.stringify(
          node
        )}`
      );
    }
    /**
     * @bugfix 220822 - same as in getParticipatingNodes - check if node with same hash already exists
     * if so, check who has more properties - there might be optional ones
     * that we do not want to skip
     */
    if (node.properties._hash in acc) {
      const existingKeys = keys(acc[node.getHash()].getProperties())
      const newKeys = keys(node.getProperties())
      if (existingKeys.length > newKeys.length) return acc
    }

    acc[node.getHash()] = node;
    return acc;
  }, {});
}
function isWrittenEnode(enode: EnhancedNode): boolean {
  if (isNotEnhancedNode(enode)) {
    throw new Error(
      `isWrittenEnode: enode must be EnhancedNode.\nenode: ${JSON.stringify(
        enode
      )}`
    );
  }
  return enode.isWritten();
}

export { EnhancedNode, isEnhancedNode, isNotEnhancedNode, isWrittenEnode };
