/**
 * @module Builder
 */
import {
  Node,
  isNode,
  isNodeObj,
  NodeCandidate,
  isNodeCandidate,
  EnhancedNode,
  isEnhancedNode,
  EnhancedNodeCandidate,
  isEnhancedNodeCandidate,
  PartialNode,
  Relationship,
  RelationshipCandidate,
  isRelationshipCandidate,
  isRelationship,
  NodeTemplate,
  Template,
} from ".";

import { Validator } from "../";
import {
  Result,
  Success,
  Failure,
  isResult,
  isSuccess,
  isFailure,
  getResultData,
} from "../Result";

import templates from "./templates";
import {
  superlog,
  isIdentifiedNodeObj,
  isRelationshipObject,
  reduceAsync,
  setDateCreated,
  generateTimeArray,
  get,
  not,
  log,
  isMissing,
  isPresent,
  isTrue,
  isFalse,
  decomposeProps,
  stringify,
} from "../utils";

import type {
  nodeObj,
  enhancedNodeObj,
  relationshipsTemplate,
  SimplifiedRelationship,
  SimplifiedNode,
  SimplifiedEnhancedNode,
} from "../types";

import {
  has,
  keys,
  entries,
  isObject,
  isArray,
  isString,
  flatten,
  cloneDeep,
  values,
  every,
} from "lodash";

/**
 * @class
 *
 * Attempt at implementing a **Creational Design Pattern**.
 *
 * @accepts
 * NodeCandidate | EnhancedNodeCandidate | RelationshipCandidate
 *
 * Builder is using Engine (read only to gather info) as it is concerned with
 * building unique Nodes from their Candidates by checking for copies with Neo4j.
 *
 * We want to ensure that Neo4j only contains validated, state-of-the-art knowledge.
 * We achieve this by creating the following 'first-class citizens' (fcs):
 *
 * Nodes
 * EnhancedNodes
 * Relationships
 *
 * + PartialNodes, which is used as a QueryNode (rename???) and not a fcs.
 *
 * by validating and, if successfuul, wrapping corresponding Candidate
 * (see below in @argument) into an appropriate Class.
 *
 * These classes are considered fcs, because they have undergone
 * a screening (by being validated against their corresponding Template).
 *
 * Nodes and Relationships could be  be built as per a Template specified by user,
 * which either matches Candidates's label (implicit) or is supplied explicitly.
 *
 *
 * @arguments
 * * NodeCandidate
 * * EnhancedNodeCandidate
 * * RelationshipCandidate
 * * partialNodeObj *** PartialNodes don't have their Candidates as they are not
 *                      to be part of Neo4j
 *
 *
 * @returns
 * * Node - base class, may or may not have all required properties.
 * * EnhancedNode - FullNode + FullRelationships (at least one).
 * * Relationship - base class, may or may not have Full/EnhancedNodes as start/endNode.
 * * PartialNode - a Node with search specifications attached to properties.
 */
class Builder {
  collection: Object;
  templateStore: Object;
  partialNodeStore: Object;
  partialNodeStoreArray: Array<any>;
  constructor() {
    this.collection = {}; // cache for processed nodes & relationships
    this.templateStore = {};
    this.partialNodeStore = {};
    this.partialNodeStoreArray = [];
  }

  /**
   * @public
   *
   * @idea Builder.buildNodes must return same data structure,
   * as was given to it as argument - Array. In our case, it takes
   * NodeCandidate[] | EnhancedNodeCandidate[] (ie candidates to become
   * first-class Nodes and be stored in Neo4j) and returns Result for each
   * Candidate, together - Result[].
   *
   * Each Result.data stores whatever end product materialized - either
   * shiny Nodes or a validationResult (validationArray?) with reasons for failure and
   * original Candidate as parameter for reference.
   *
   * @param {NodeCandidate[] | EnhancedNodeCandidate[]} arr - Candidates to become
   *  first-class Nodes in Neo4j.
   * @returns {Promise<Result[]>} - Success.data = [Node]
   *
   * Failure.data = [NodeCandidate] that has a ValidationResult for any Nodes that
   * failed the building process.
   *
   * @todo should return Result[] where S.data = [node]
   *
   * @example
   * import { Result, Builder } from 'mango';
   * const [success, failure]: Result[] =
   *  await new Builder().buildNodes([ok_nodeCandidate, dodgy_nodeCandidate]);
   *
   * // Check
   * console.log(success.getData());  // Node made from ok_nodeObj
   * console.log(failure.getData());  // ValidationResult for dodgy_nodeCandidate
   *                                  // explaining what went wrong
   */
  buildNodes(
    arr: NodeCandidate[] | EnhancedNodeCandidate[],
    obj: {
      extract?: boolean,
      validateOptionals?: boolean,
      template?: Template | typeof undefined,
    } = {
      extract: false,
      validateOptionals: false,
      template: undefined,
    }
  ): Result[] {
    const { extract, validateOptionals, template } = obj;
    /* validations */
    let validationResult: Result = _validateBuildNodesArguments(arr);
    if (isFailure(validationResult)) {
      // since this is Failure, we cannot do array destruction on buildNodes ((
      return [validationResult];
    }
    /* !validations */

    /**
     * Logic.
     */
    const data: Result[] = arr.map(function _attemptBuildingANode(candidate) {
      /**
       * If we accidently passed a Node, just return it.
       */

      if (isNode(candidate) || isEnhancedNode(candidate)) {
        return new Success({
          data: candidate,
          parameters: { candidate },
        });
      }

      /**
       * 1. Find out which template must be used.
       * @tested
       */
      const node = isNodeCandidate(candidate.getCoreNode())
        ? candidate.getCoreNode().getCoreNode()
        : candidate.getCoreNode();

      // Make user specify template explicitly or default to Node
      const Template = templates[template] || templates["Node"];

      /**
       * 2. The reason for all of us to gather here tonight - do
       * the validations!!!
       */
      if (isNode(node)) {
        return new Success({
          data: node,
          parameters: { node },
        });
      }
      // log(Template)
      const validations: Result = new Validator(node, Template).validate({
        validateOptionals,
      });

      if (isFailure(validations)) {
        // return validationResult instead of candidate
        return validations;
      }

      /**
       * 3. If nodeObj successfully passed validations -
       * stuff the newNode with all good stuff (no pun...).
       */
      const newNode: Object = _composeNewNode(node);

      /**
       * 4. Final touch.
       */
      /* set labels */
      /**
       * Labels are important as they affect the Node's _hash: 
       * _hash = labels[0] + stringified(REQUIRED_PROPERTIES)
       * 
       * labels[0] - we will use only the first supplied label as the Node's label,
       * although Neo4j allows multiple labels per Node. The reason being:
       * One vs Many. Having one lable will ensure that adding any other labels on
       * top of that won't affect the Node's _hash. 
       * 
       * For example we have a 
       * 
       * (:Person { NAME: "Bob", _hash: 123, _label: 'Person', _labels: ['Person'] }) written in Neo4j.
       * 
       * Later we come up with supplying the same Bob, from a different dataset (someone's 
       * review of Bob). And it compiles to (:Person:Doctor { NAME: "Bob", _hash: 456 
       * _label: 'Person|Doctor', _labels: ['Person', 'Doctor'] })
       * 
       * We end up with two Bobs, the only difference is that we added a non-determining 
       * property (in form of a label) to the unique person Bob. What if he leaves medicine 
       * tomorrow, will it stop him being a (:Person { NAME: "Bob", _hash: 123 }) ?
       * No. 
       * So it's better to ensure that should we want to add a Doctor label to Person named Bob,
       * it results in (:Person { NAME: "Bob", _hash: 123, _label: 'Person', _labels: ['Person', 'Doctor'] })
       * 
       * _label: string // main label
       * _labels: string[] // all labels, with main one coming first
       */
      newNode.labels = node.labels;
      newNode.properties._label =
        node.labels[0] || null;
        // node.labels.length !== 0 ? node.labels.join("|") : null;
      newNode.properties._labels = node.labels;

      /* set _template */
      newNode.properties._template = isPresent(template) ? template : "Node";

      /* add _date_created */
      newNode.properties._date_created = setDateCreated();

      /* make final Node */
      const finalNode = new Node({ ...newNode });
      
      /* set _hash */
      finalNode.setHash();

      return new Success({
        data: finalNode,
        parameters: { node },
      });
    });
    return extract ? data.map(getResultData) : data;

    /////////////// FUN ///////////////

    /**
     * Runs all validations.
     *
     * @private
     * @param {nodeObj[]} arr
     */
    function _validateBuildNodesArguments(arr: any[]): Result {
      if (!arr) {
        return new Failure({
          reason: `Builder.buildNodes: Validation Error:\n. Falsy first argument. See parameters.`,
          parameters: { firstArgument: arr },
        });
      }
      if (!(arr instanceof Array)) {
        return new Failure({
          reason: `Builder.buildNodes: Validation Error:\nFirst argument was not an Array. See parameters.`,
          parameters: { firstArgument: arr },
        });
      }
      if (
        !arr.every(
          (elm) =>
            elm instanceof NodeCandidate || elm instanceof EnhancedNodeCandidate
        )
      ) {
        return new Failure({
          reason: `Builder.buildNodes: Validation Error:\nFirst argument must be NodeCandidate[] || EnhancedNodeCandidate[]. See parameters.`,
          parameters: { firstArgument: arr },
        });
      }
      return new Success();
    }

    /**
     * We need to make a node that we will wrap in a Node... get this?
     * a node, that we WILL WRAP IN ANOTHER NODE! yay more Node-wrapped-nodes!
     *
     * @private
     * @param {nodeObj} node
     */
    function _composeNewNode(node: nodeObj): Object {
      const entries = (obj = {}) => Object.entries(obj);
      const newNode = { labels: [], properties: {} };
      /* get rid of { rquired, optional, _private } sub-structure */
      const { required, optional, _private } = node.properties;
      for (let [key, value] of entries(required)) {
        newNode.properties[key] = value;
      }
      for (let [key, value] of entries(optional)) {
        newNode.properties[key] = value;
      }
      for (let [key, value] of entries(_private)) {
        newNode.properties[key] = value;
      }
      return newNode;
    }

    /////////////// END ///////////////
  }

  /**
   * @public
   *
   * Principles:
   * 1. must accept EnhancedNodeCandidate[] only.
   * 2. must eagerly attempt to promote each EnhancedNodeCandidate to full
   * EnhancedNode and return EnhancedNode[].
   * 3. all-or-nothing - either the whole ENC[] batch is promoted to EN[]
   * or [Failure.data = ENC|ValidationResult[]]. User will review ValidationResults,
   * either remove corresponding ENCs from the batch or update them and run again.
   *
   * @param {EnhancedNodeCandidate[]} arr - Array of EnhancedNodeCandidates.
   * @param {Object} obj - Configuration object.
   * @returns {Promise<Result[]>}
   * where
   * each Success.data = [EnhancedNode]
   * one Failure.data = [EnhancedNodeCandidate that has validationResult for any
   * failed EnhancedNode]
   */
  buildEnhancedNodes(
    arr: EnhancedNodeCandidate[],
    obj: {
      extract?: boolean,
      template?: Template | typeof undefined,
      ignore: Array<any> | typeof undefined,
      stopAfterCoreNodes: boolean,
      stopAfterRelNodes: boolean,
      stopAfterRelationships: boolean,
    } = {
      extract: false,
      template: undefined,
      ignore: undefined,
      stopAfterCoreNodes: false,
      stopAfterRelNodes: false,
      stopAfterRelationships: false,
    }
  ): Result[] {
    const {
      extract,
      template,
      ignore,
      stopAfterCoreNodes,
      stopAfterRelNodes,
      stopAfterRelationships,
    } = obj;

    /**
     * SO a new simpler idea.
     *
     * buildEnhancedNodes takes ONLY EnhancedNodeCandidate as its input material.
     * 1. invokes buildNodes on its nodes - !!! or @todo buildEnhancedNodes to handle deep enodes.
     *    I'd prefer to collect relNodes via an array by reference.
     * 2. invokes buildRelationships on its relationships
     * 3. if all successful - returns Success.data = EnhancedNode
     * 4. if something went wrong - returns Failure.data = EnhancedNodeCandidate for user's improvement
     */

    /**
     * Validations
     */

    let validationResult: Result = _validateBuildEnhancedNodesArguments(arr);
    if (validationResult.length == 1 && isFailure(validationResult[0])) {
      return validationResult;
    }

    /**
     * Logic
     */

    /**
     * 1. Now we have EnhancedNodeCandidate[] to validate every node of.
     * There will be 2 types of nodes for us to work with:
     * a. coreNode <- ENC.getCoreNode() => coreNode. To set it back
     * b. relationships nodes <- ENC.getAllRelationshipNodes => [rnode_1, ...rnode_n]
     */

    /**
     * 1. Deal with coreNode.
     */
    const arr_with_coreNodes = _dealWithCodeNodes(arr, this);
    if (stopAfterCoreNodes) {
      return arr_with_coreNodes;
    }

    /**
     * 2. Deal with relationships' nodes.
     */
    const arr_with_relNodes = _dealWithRelNodes(arr_with_coreNodes, this);
    // log(arr_with_relNodes)
    if (stopAfterRelNodes) {
      return arr_with_relNodes;
    }

    /**
     * 3. Deal with Relationships.
     */
    const arr_with_relationships = _dealWithRelationships(
      arr_with_relNodes,
      this
    );
    // log(arr_with_relationships)
    if (stopAfterRelationships) {
      return arr_with_relationships;
    }

    const arr_with_enodes: Array<EnhancedNode | Failure> = _enhancer(
      arr_with_relationships,
      this
    );

    const result = _resultWrapper(arr_with_enodes, this);
    if (extract) {
      return result.map(getResultData);
    }
    return result;

    /////////////// FUN ///////////////
    function _isNodeCandidate(val): boolean {
      return val instanceof NodeCandidate;
    }

    function _validateBuildEnhancedNodesArguments(arr: any[]): Result {
      if (isMissing(arr)) {
        return [
          new Failure({
            reason: `Builder.buildEnhancedNodes: Validation Error:\n. Missing first argument. See parameters.`,
            parameters: { firstArgument: arr },
          }),
        ];
      }
      if (not(isArray(arr))) {
        return [
          new Failure({
            reason: `Builder.buildEnhancedNodes: Validation Error:\nFirst argument was not an Array. See parameters.`,
            parameters: { firstArgument: arr },
          }),
        ];
      }
      if (arr.length == 0) {
        return [
          new Failure({
            reason: `Builder.buildEnhancedNodes: Validation Error:\nFirst argument was an empty Array. Nothing to work with. See parameters.`,
            parameters: { firstArgument: arr },
          }),
        ];
      }
      if (!arr.every((elm) => elm instanceof EnhancedNodeCandidate)) {
        return [
          new Failure({
            reason: `Builder.buildEnhancedNodes: Validation Error:\nFirst argument must be EnhancedNodeCandidate[]. See parameters.`,
            parameters: { arguments: arr },
          }),
        ];
      }
      return new Success();
    }

    /**
     *
     * Attempts to build a Node out of coreNode.
     * If Success => replaces coreNode with Node,
     * If Failure => replaces coreNode with Failure
     *
     * @private
     * @returns EnhancedNodeCandidate[]
     *
     */
    function _dealWithCodeNodes(
      arr: EnhancedNodeCandidate[],
      ctx
    ): EnhancedNodeCandidate[] {
      return arr.map((candidate) => {
        let coreNode = candidate.getCoreNode();
        if (isNode(coreNode)) {
          return candidate;
        }
        // if (!(coreNode instanceof NodeCandidate)) {
        if (not(isNodeCandidate(coreNode))) {
          const badNode = new Failure({
            reason: `Builder.buildEnhancedNodes: _dealWithCodeNodes:\ncoreNode must be NodeCandidate. See parameters.`,
            parameters: { coreNode },
          });
          candidate.setCoreNode(badNode);
          return candidate;
        }

        const result: Result[] = ctx.buildNodes([coreNode], { template });

        // unpacking - Principle 3.
        if (isFailure(result)) {
          candidate.setCoreNode(result);
          return candidate;
        }
        if (Array.isArray(result)) {
          if (result[0] instanceof Failure) {
            candidate.setCoreNode(result[0]);
            return candidate;
          }
          if (result[0] instanceof Success) {
            candidate.setCoreNode(result[0].data);
            return candidate;
          }
        } else {
          throw new Error(
            `Builder.buildEnhancedNodes: _dealWithCodeNodes:\ncannot deal with coreNode.`
          );
        }
      });
    }

    function _dealWithRelNodes(
      arr: EnhancedNodeCandidate[],
      ctx
    ): EnhancedNodeCandidate[] {
      /** walk arr's rels, on encountering an rc ->
       * 1. has nc ? return buildNode([nc])
       * 2. has enc ? return _dealWithRelNodes([enc])
       * 3. anything else ? Failure/Node/Enode ? return it
       * 4. return arr
       */

      return arr.map((enc) => {
        if (!isEnhancedNodeCandidate(enc)) {
          throw new Error(
            `Builder.buildEnhancedNodes._dealWithRelNodes: expected an ENC.\nReceived: ${JSON.stringify(
              enc
            )}.`
          );
        }
        /* required rels */
        const rrels = enc.getAllRelationships();

        if (!rrels.length) {
          return enc;
        }
        const newRRels = rrels.map(function _worker(rel) {
          try {
            if (isRelationship(rel) || isFailure(rel)) {
              return rel;
            } else if (isRelationshipCandidate(rel)) {
              /* mainNode is the coreNode must have been dealt with by _dealWithCoreNodes
              via enc.setCodeNode calling on enc.addCoreNodeToRelationships */
              const [pn] = rel.getPartnerNode();
              if (isNodeCandidate(pn)) {
                const nc_result: Result[] = ctx.buildNodes([pn], { template });
                if (!Array.isArray(nc_result)) {
                  throw new Error(
                    `Builder.buildEnhancedNodes._dealWithRelNodes: nc_result must be Result[].\nReceived: ${JSON.stringify(
                      nc_result
                    )}.`
                  );
                }
                const newNode = isSuccess(nc_result[0])
                  ? nc_result[0].getData()
                  : nc_result[0];
                rel.setPartnerNode(newNode);
                return rel;
              } else if (isEnhancedNodeCandidate(pn)) {
                /* go recursively */
                const enc_result = ctx.buildEnhancedNodes([pn]);
                if (!Array.isArray(enc_result)) {
                  throw new Error(
                    `Builder.buildEnhancedNodes._dealWithRelNodes: enc_result must be Result[].\nReceived: ${JSON.stringify(
                      enc_result
                    )}.`
                  );
                }
                const newNode = isSuccess(enc_result[0])
                  ? enc_result[0].getData()
                  : enc_result[0];
                rel.setPartnerNode(newNode);
                return rel;
              }
              return rel;
            } else {
              throw new Error(
                `Builder.buildEnhancedNodes._dealWithRelNodes: rel must be RelationshipCandidate | Relationship | Failure.\nReceived: ${JSON.stringify(
                  rel
                )}.`
              );
            }
          } catch (error) {
            // throw new Error(`Builder.buildEnhancedNodes._dealWithRelNodes._worker: error:\n${JSON.stringify(error)}`)
            // throw new Error(`Builder.buildEnhancedNodes._dealWithRelNodes._worker: error:`, error)
            console.log(
              "Builder.buildEnhancedNodes._dealWithRelNodes._worker:",
              error
            );
          }
        });

        const req = newRRels.filter((rel) => rel.getNecessity() === "required");
        const opt = newRRels.filter((rel) => rel.getNecessity() === "optional");
        enc.setRequiredRelationships(req);
        enc.setOptionalRelationships(opt);

        // optional rels

        return enc;
      });
    }

    /**
     * RelationshipCandidates -> NodeCandidates
     * Takes care of building Relationships. At this point if RelationshipCandidate's NodeCandidates
     * could become Nodes, they have done so.
     *
     * [2022-03-01] I'm not an expert, but this looks like an non-pure function - it maps over arr with Array.prototype.map
     * and returns the initial arr. It means it produces desirable side-effects.
     *
     * @param {EnhancedNodeCandidate[]} arr
     * @param {this} ctx
     */
    function _dealWithRelationships(
      arr: EnhancedNodeCandidate[],
      ctx: this
    ): EnhancedNodeCandidate[] {
      /**
       * Legacy musings. at [2022-03-01] all works and I have no idea/desire to find out what this means.
       *
       * since my RCs don't have both startNode & endNode at the same time, mb it's here
       * where I need to add them to be able to use buildRelationships that expects both nodes.
       * I need to check that we have a Node for coreNode here, otherwise we cannot build any Rel
       */

      const newArr = arr.map((enc) => {
        /* if already enhanceable, leave it */
        if (enc.isEnhanceable()) return;

        if (isEnhancedNodeCandidate(enc)) {
          const coreNode = enc.getCoreNode();
          if (isNode(coreNode)) {
            enc.getAllRelationships().forEach((rel) => {
              rel.setMainNode(coreNode);
            });

            const results = ctx.buildRelationships(enc.getAllRelationships());

            /* replace enc's requiredRelationships with updated ones */
            enc.setRequiredRelationships(
              _unpack(results).filter(
                (rel) => rel.getNecessity() === "required"
              )
            );
            enc.setOptionalRelationships(
              _unpack(results).filter(
                (rel) => rel.getNecessity() === "optional"
              )
            );
            // console.log('enc', enc)
            return enc;
          } else {
            throw new Error(
              `Builder.buildEnhancedNodes._dealWithRelationships: coreNode must be a Node.\ncoreNode: ${JSON.stringify(
                coreNode
              )}`
            );
          }
        }
      });
      // log(newArr)
      return arr;

      /////////////// END ///////////////
      function _unpackSuccess(result: Result): Result | any {
        return isSuccess(result) ? result.getData() : result;
      }
      function _unpack(arr: Result[]): Array<Failure | Relationship> {
        return arr.map(_unpackSuccess);
      }
      /////////////// END ///////////////
    }

    /**
     * Does the final job - takes what's enhanceable and instantiates EnhancedNode.
     * @param {*} arr
     * @param {*} ctx
     */
    function _enhancer(
      arr: EnhancedNodeCandidate[],
      ctx
    ): Array<EnhancedNode | Failure> {
      const result = arr.map((enc) => {
        // console.log('enc.isEnhanceable()', enc.isEnhanceable())
        // return enc.isEnhanceable() ? enc.toEnhancedNode() : enc
        return enc.toEnhancedNode();
      });
      // log(result)
      return result;
    }

    function _resultWrapper(arr: Array<EnhancedNode | Failure>, ctx): Result[] {
      const result = arr.map((data) => {
        if (isEnhancedNode(data)) {
          return new Success({ data });
        }
        if (isEnhancedNodeCandidate(data)) {
          // log(data)
          return new Failure({ reason: "could not enahance", data });
        } else {
          return new Failure({ reason: "some other reason", data });
        }
      });
      return result;
    }
    /////////////// END ///////////////
  }

  /**
   * @public
   *
   * buildRelationships is used to turn a RelationshipCandidate into
   * a full Relationship.
   *
   * @param {RelationshipCandidate[]} arr
   * @param {object} options
   *
   * @example
   * const RelationshipCandidate = {
   *  labels: ['RELATIONSHIP_A'],
   *  properties: Object,
   *  startNode: new Node() | new EnhancedNode(),
   *  endNode: new Node() | new EnhancedNode(),
   *  identity: { low: Number, high: Number }
   * }
   * @example!
   * @returns {Result[]}
   *
   * @todo [2021-08-02] refactor start/endNode checks
   */
  buildRelationships(
    arr: RelationshipCandidate[],
    obj: {
      hashType: string,
      extract: boolean,
      flatten: boolean,
      keepFailures: boolean,
    } = {
      hashType: "labels",
      extract: false,
      flatten: true,
      keepFailures: false,
    }
  ): Result[] {
    const { hashType, extract, flatten, keepFailures } = obj;

    /**
     * Validations.
     */
    /* First argument must be RelationshipCandidate[]. */
    {
      const data = arr.filter((rel) => {
        return !isRelationshipCandidate(rel);
      });
      if (data.length) {
        return [
          new Failure({
            reason: `Builder.buildRelationships(): Validation error: First argument must be RelationshipCandidate[].`,
            data,
          }),
        ];
      }
    }
    // log(arr)
    const data: Result[] = arr.map((relObj) => {
      /* check start/endNode have hashes */
      // log('start checking')

      let startNode, endNode;

      /// work on startNode
      if (not(relObj.getStartNode())) {
        return new Failure({
          reason: `Builder.buildRelationships(): Logic error: cannot access startNode.`,
          parameters: relObj,
          data: [],
        });
      } else {
        const sn = relObj.getStartNode()[0];
        // log(sn)
        // console.log('isNodeCandidate(sn)', isNodeCandidate(sn))
        // if it's a xCandidate, attempt to build it.
        if (isNodeCandidate(sn)) {
          // build Node
          const result: Result[] = this.buildNodes([sn]);
          if (isFailure(result)) {
            throw new Error(
              `Builder.buildRelationships: attempted to build a Node from startNode (NodeCandidate) and failed:\nresult ${JSON.stringify(
                result
              )}`
            );
          }
          if (not(isNode(result[0].getData()))) {
            throw new Error(
              `Builder.buildRelationships: attempted to build a Node from startNode (NodeCandidate) and failed: did not get the Node:\nresult ${JSON.stringify(
                result
              )}\nresult[0].getData(): ${JSON.stringify(result[0].getData())}`
            );
          }
          // success
          // console.log('node success result[0].getData()', result[0].getData())
          startNode /* : Node */ = result[0].getData();
        } else if (isEnhancedNodeCandidate(sn)) {
          // build Enode
          const result: Result[] = this.buildEnhancedNodes([sn]);
          if (isFailure(result)) {
            throw new Error(
              `Builder.buildRelationships: attempted to build an EnhancedNode from startNode (EnhancedNodeCandidate) and failed:\nresult ${JSON.stringify(
                result
              )}`
            );
          }
          if (not(isEnhancedNode(result[0].getData()))) {
            throw new Error(
              `Builder.buildRelationships: attempted to build an EnhancedNode from startNode (EnhancedNodeCandidate) and failed: did not get the EnhancedNode:\nresult ${JSON.stringify(
                result
              )}\nresult[0].getData(): ${JSON.stringify(result[0].getData())}`
            );
          }
          // success
          // console.log('enode success result[0].getData()', result[0].getData())
          startNode /* : EnhancedNode */ = result[0].getData();
        }

        // Success was supplied
        if (isSuccess(sn)) {
          startNode = sn.getData();
        } else if (isEnhancedNode(sn) || isNode(sn)) {
          // it was a Node
          startNode = sn;
        }

        // final check
        if (not(isEnhancedNode(startNode) || isNode(startNode))) {
          throw new Error(
            `Builder.buildRelationships: final check on startNode failed: startNode must be Node|EnhancedNode:\nstartNode ${JSON.stringify(
              startNode
            )}`
          );
        }
      }

      /// work on endNode
      if (not(relObj.getEndNode())) {
        return new Failure({
          reason: `Builder.buildRelationships(): Logic error: cannot access endNode.`,
          parameters: relObj,
          data: [],
        });
      } else {
        const en = relObj.getEndNode()[0];

        // if it's a xCandidate, attempt to build it.
        if (isNodeCandidate(en)) {
          // console.log('isNodeCandidate(en)', isNodeCandidate(en))
          // build Node
          const result: Result[] = this.buildNodes([en]);
          if (isFailure(result)) {
            throw new Error(
              `Builder.buildRelationships: attempted to build a Node from endNode (NodeCandidate) and failed:\nresult ${JSON.stringify(
                result
              )}`
            );
          }
          if (not(isNode(result[0].getData()))) {
            throw new Error(
              `Builder.buildRelationships: attempted to build a Node from endNode (NodeCandidate) and failed: did not get the Node:\nresult ${JSON.stringify(
                result
              )}\nresult[0].getData(): ${JSON.stringify(result[0].getData())}`
            );
          }
          // success
          // console.log('node success result[0].getData()', result[0].getData())
          endNode /* : Node */ = result[0].getData();
        } else if (isEnhancedNodeCandidate(en)) {
          // build Enode
          const result: Result[] = this.buildEnhancedNodes([en]);
          if (isFailure(result)) {
            throw new Error(
              `Builder.buildRelationships: attempted to build an EnhancedNode from endNode (EnhancedNodeCandidate) and failed:\nresult ${JSON.stringify(
                result
              )}`
            );
          }
          if (not(isEnhancedNode(result[0].getData()))) {
            throw new Error(
              `Builder.buildRelationships: attempted to build an EnhancedNode from endNode (EnhancedNodeCandidate) and failed: did not get the EnhancedNode:\nresult ${JSON.stringify(
                result
              )}\nresult[0].getData(): ${JSON.stringify(result[0].getData())}`
            );
          }
          // success
          // console.log('enode success result[0].getData()', result[0].getData())
          endNode /* : EnhancedNode */ = result[0].getData();
        }

        // Success was supplied
        if (isSuccess(en)) {
          endNode = en.getData();
        } else if (isEnhancedNode(en) || isNode(en)) {
          // it was a Node
          endNode = en;
        }

        // final check
        if (not(isEnhancedNode(endNode) || isNode(endNode))) {
          throw new Error(
            `Builder.buildRelationships: final check on endNode failed: endNode must be Node|EnhancedNode:\nendNode ${JSON.stringify(
              endNode
            )}`
          );
        }
      }

      if (!startNode.properties || !endNode.properties) {
        log("buildRelationships: !startNode.properties || !endNode.properties");
        log(relObj);
        log(startNode);
        log(startNode.properties._hash);
        log(endNode);
        log(endNode.properties._hash);
      }

      // log(startNode)
      // log(endNode)
      const reason = [];
      if (!startNode.properties._hash) reason.push(`Missing startNode hash.`);
      if (!endNode.properties._hash) reason.push(`Missing endNode hash.`);
      if (reason.length) {
        return [
          new Failure({
            reason: reason.join(" "),
            parameters: relObj,
            data: [],
          }),
        ];
      }

      /**
       * Logic
       */
      const rel = new Relationship({
        labels: relObj.labels,
        properties: relObj.properties, // need validation
        direction: relObj.direction,
        necessity: relObj.necessity,
        startNode,
        endNode,
      });
      // rel.setHash(hashType) // leave it to Relationship constructor, which accounts for
      rel.properties._date_created = setDateCreated();
      rel.properties._necessity = relObj.necessity;

      /* check that rel has successfully set hash */
      if (!rel.getHash()) {
        return new Failure({
          reason: `buildRelationships: unable to set hash.`,
          parameters: rel,
          data: [],
        });
      }

      if (extract) {
        return rel;
      }
      return new Success({
        parameters: relObj,
        data: rel,
      });
    });

    /* fuf, all ok */
    // log(data)
    return data;
  }

  /**
   * @public
   *
   * PartialNode is used as a wrapper around some combination of
   * node labels/parameters + search conditions that user wants to
   * query Neo4j with as match/optional match.
   *
   * This should present a convinient interface for users to supply their
   * search parameters.
   *
   * @todo VALIDATE that each presented key = searchObject
   * `{isDate, isRange, isCondition, type, key, value}`
   * @todo - can I simplify the nodeObj|enodeObj ?
   *
   * @param {(nodeObj|enhancednodeObj)[]} arr
   * @returns {Result[]}
   */
  buildPartialNodes(
    arr: nodeObj[],
    obj: {
      extract: boolean,
    } = {}
  ): Result[] {
    /* defaults */
    const extract = isPresent(obj.extract) ? obj.extract : false;
    const Template = this.loadTemplate("PartialNode");

    const data = arr.map((obj) => {
      let { labels, properties } = obj;

      /* should recognize both nodeObj and PartialNodes */
      properties = isNodeObj(obj)
        ? keys(properties).reduce((acc, key) => {
            acc = {
              ...acc,
              ...properties[key], // key == 'required' or 'optional'
            };
            return acc;
          }, {})
        : properties;

      const newObj = { labels, properties };

      /* add _label to be picked up by Cypher */
      newObj.properties._label = labels.length !== 0 ? labels.join("|") : null;

      /* add _date_created */
      newObj.properties._date_created = setDateCreated();

      /* create an instance */
      const finalObj = new Template(newObj);

      /* set _hash */
      finalObj.setHash();

      /* remove createRelationshipsTemplate method */
      delete finalObj.createRelationshipsTemplate;

      /* memoize */
      // this.collection[newObj.properties._hash] = finalObj

      return new Success({ data: finalObj });
    });

    return extract ? data.map(getResultData) : data;
  }

  /**
   * @to_be_depricated
   * @param {string} template
   */
  loadTemplate(template: string): Function {
    return templates[template]
      ? templates[template]
      : templates["EnhancedNode"];
  }

  /**
   */
  async loadConfig(): Config {
    class Config {
      constructor() {
        this.allowIncompleteNodes = true;
      }
    }
    return new Config();
  }

  //// HELPER METHODS ////
  makeNodeCandidate(
    labels: String[],
    required: Object,
    optional: Object,
    _private: Object
  ): NodeCandidate {
    return new NodeCandidate({
      labels,
      properties: { required, optional, _private },
    });
  }

  /**
   * A shorthand to make a Node.
   *
   * @public
   * @param {string[]} labels - Labels for the Node.
   * @param {Node} required - Required properties - these make the Node unique.
   * @param {Node} optional - Optional properties - these are non-unique, and
   * Nodes are not differentiated on them.
   * @param {Node} _private - Private properties - are kind of 'optional', should
   * be used for utilities/system/private stuff.
   * @returns {Node}
   * @example
   */
  makeNode(
    labels: string[],
    required: Object,
    optional: Object,
    _private: Object
  ): Node {
    const candidate = this.makeNodeCandidate(
      labels,
      required,
      optional,
      _private
    );
    const result = this.buildNodes([candidate]);
    if (isFailure(result)) {
      throw new Error(
        `Builder.makeNode: failed to create a Node.\nresult ${JSON.stringify(
          result
        )}`
      );
    }
    return result[0].firstDataElement;
  }

  makeEnhancedNodeCandidate(
    coreNode: Node,
    requiredRels: Relationship[] | RelationshipCandidate[],
    optionalRels: Relationship[] | RelationshipCandidate[]
  ): EnhancedNodeCandidate {
    return new EnhancedNodeCandidate(coreNode, {
      required: requiredRels,
      optional: optionalRels,
    });
  }

  /**
   * Recursively builds an EnhancedNode from various building blocks.
   *
   * @public
   * @param {Node|SimplifiedNode} coreNode - Main Node, 'root' of the tree.
   * @param {SimplifiedRelationship[]| SimplifiedRelationshipArray[]| Relationship[]| RelationshipCandidate[]} requiredRels - "Must-have" Relationships
   * @param {SimplifiedRelationship[]| SimplifiedRelationshipArray[]| Relationship[]| RelationshipCandidate[]} optionalRels - Optional Relationships.
   * @returns {EnhancedNode}
   */
  makeEnhancedNode(
    coreNode: Node | SimplifiedNode,
    requiredRels:
      | SimplifiedRelationship[]
      | SimplifiedRelationshipArray[]
      | Relationship[]
      | RelationshipCandidate[],
    optionalRels:
      | SimplifiedRelationship[]
      | SimplifiedRelationshipArray[]
      | Relationship[]
      | RelationshipCandidate[]
  ): EnhancedNode {
    /* Bind all methods so they are usable in recursive iteration. */
    const makeRelationshipCandidate = this.makeRelationshipCandidate.bind(this);
    const makeEnhancedNode = this.makeEnhancedNode.bind(this);
    const makeNode = this.makeNode.bind(this);

    /* Build a full Node out of SimplifiedNode */
    if (isSimplifiedNode(coreNode)) {
      coreNode = makeNode(
        coreNode.labels,
        ...decomposeProps(coreNode.properties, {
          asArray: true,
        })
      );
    }

    /* All recursive work is done here */
    const relationships: RelationshipCandidate[] = requiredRels.map(
      _processRelationship
    );

    const candidate: EnhancedNodeCandidate = this.makeEnhancedNodeCandidate(
      coreNode,
      relationships
    );

    const result: Result = this.buildEnhancedNodes([candidate]);

    if (isFailure(result)) {
      throw new Error(
        `Builder.makeNode: failed to create an EnhancedNode.\nresult ${JSON.stringify(
          result
        )}`
      );
    }
    return result[0].firstDataElement;

    /* Local Functions
    _________________________________________________________*/
    function _processRelationship(relationship) {
      if (isSimplifiedRelationship(relationship)) {
        let { labels, partnerNode, properties, direction } = relationship;

        /* Simple end case. */
        if (isSimplifiedNode(partnerNode)) {
          // log('isSimplifiedNode')
          partnerNode = makeNode(
            partnerNode.labels,
            ...decomposeProps(partnerNode.properties, {
              asArray: true,
            })
          );
        }

        /* Deal with deep EnhancedNode recursively */
        if (isSimplifiedEnhancedNode(partnerNode)) {
          partnerNode = makeEnhancedNode(
            makeNode(
              partnerNode.labels,
              ...decomposeProps(partnerNode.properties, {
                asArray: true,
              })
            ),
            /* Mark all relationships as required for now. */
            partnerNode.relationships
          );
        }

        return makeRelationshipCandidate(
          labels,
          partnerNode,
          properties,
          direction
        );
      }

      /**@todo add checks for other rel types */
      if (not(isAcceptableRelationship(relationship))) {
        throw new Error(`Builder.makeEnhancedNode._processRelationship: relationship is not acceptable, must be one of SimplifiedRelationship
        | SimplifiedRelationshipArray
        | Relationship
        | RelationshipCandidate.\nrelationship: ${stringify(relationship)}`);
      }
      return relationship;
    }
  }

  makeRelationshipCandidate(
    labels: String[],
    partnerNode: Node | EnhancedNode,
    properties?: Object,
    direction?: string
  ): RelationshipCandidate {
    let outbound = ["outbound", ">"].includes(direction);
    let inbound = ["inbound", "<"].includes(direction);
    if (isMissing(direction) || not(outbound || inbound)) {
      /* defaults to outbound */
      direction = "outbound";
      outbound = true;
    }
    if (outbound) {
      return new RelationshipCandidate({
        labels,
        properties,
        direction,
        endNode: partnerNode,
      });
    }
    if (inbound) {
      return new RelationshipCandidate({
        labels,
        properties,
        direction,
        startNode: partnerNode,
      });
    }
  }
}

function isLabelsOk(labels: any): boolean {
  /* { labels: string[] } */
  if (
    labels &&
    isArray(labels) &&
    labels.length !== 0 &&
    labels.every(isString)
  ) {
    return true;
  }
  return false;
}

function isPartnerNodeOk(partnerNode: any): boolean {
  /* { partnerNode: partialNodeObj | NodeCandidate | Node } */
  const conditions = {
    isSimplifiedNode: false,
    isSimplifiedEnhancedNode: false,
    isNodeCandidate: false,
    isEnhancedNodeCandidate: false,
    isNode: false,
    isEnhancedNode: false,
  };

  if (isSimplifiedNode(partnerNode)) {
    conditions.isSimplifiedNode = true;
  }
  if (isSimplifiedEnhancedNode(partnerNode)) {
    conditions.isSimplifiedEnhancedNode = true;
  }
  if (isNodeCandidate(partnerNode)) {
    conditions.isNodeCandidate = true;
  }
  if (isEnhancedNodeCandidate(partnerNode)) {
    conditions.isEnhancedNodeCandidate = true;
  }
  if (isNode(partnerNode)) {
    conditions.isNode = true;
  }
  if (isEnhancedNode(partnerNode)) {
    conditions.isEnhancedNode = true;
  }
  return values(conditions).some(isTrue);
}

function isPropertiesOk(properties: any): boolean {
  /* { properties: Object } */
  if (isObject(properties)) {
    return true;
  }
  return false;
}

function isRelationshipsOk(relationships: any): boolean {
  /* { relationships: [] | SimplifiedRelationship[] | SimplifiedRelationshipArray[] | RelationshipCandidate[] | Relationship[] } */
  if (not(isArray(relationships))) {
    return false;
  }

  if (relationships.length == 0) {
    return true;
  }
  const results = relationships.map(isAcceptableRelationship);
  // log(results);
  return results.every(isTrue);
}

function isAcceptableRelationship(obj: any): boolean {
  if (isArray(obj)) {
    if (isSimplifiedRelationshipArray(obj)) {
      return true;
    }
  }

  if (not(isObject(obj))) {
    return false;
  }

  if (
    isRelationshipCandidate(obj) ||
    isRelationship(obj) ||
    isSimplifiedRelationship(obj)
  ) {
    return true;
  }
  return false;
}

function isSimplifiedRelationship(obj: any): boolean {
  if (not(isObject(obj))) {
    return false;
  }
  // log(obj);
  let { labels, partnerNode } = obj;
  const conditions = {
    labelsOk: isLabelsOk(labels),
    partnerNodeOk: isPartnerNodeOk(partnerNode),
  };
  // log(conditions);
  if (values(conditions).every(isTrue)) {
    return true;
  } else {
    return false;
  }
}

function isSimplifiedNode(obj: any): boolean {
  /* { labels: string[], properties: Object, } */
  if (not(isObject(obj))) {
    return false;
  }
  let { labels, properties, relationships } = obj;
  const conditions = {
    labelsOk: isLabelsOk(labels),
    propertiesOk: isPropertiesOk(properties),
    // relationships: { inbound: [], outbound: [] 
    noRelationships:
    // at least conform to standard, although empty

      /* no relationships whatsoever */
      isMissing(relationships) || (
        /* or relationships is not object */
        isObject(relationships) 
        && 
        
        /* or object has no inbound/outbound props */
        (has(relationships, 'inbound') && 
        has(relationships, 'outbound'))

        && 
        /* or inbound/outbound aren't Arrays */
        (isArray(relationships.inbound) && 
        isArray(relationships.outbound)) 

        && 
        /* or inbound/outbound are empty Arrays */
        (relationships.inbound.length === 0 && relationships.inbound.length === 0)
      ),
  };

  if (values(conditions).every(isTrue)) {
    // log('isSimplifiedNode true', obj)
    return true;
  } else {
    // log('isSimplifiedNode false', obj, conditions)
    return false;
  }
}
// function isSimplifiedNode(obj: any): boolean {
//   /* { labels: string[], properties: Object, } */
//   if (not(isObject(obj))) {
//     return false;
//   }
//   let { labels, properties, relationships } = obj;
//   const conditions = {
//     labelsOk: isLabelsOk(labels),
//     propertiesOk: isPropertiesOk(properties),
//     noRelationships:
//       isMissing(relationships) ||
//       (isArray(relationships) && relationships.length == 0),
//   };

//   if (values(conditions).every(isTrue)) {
//     // log('isSimplifiedNode true', obj)
//     return true;
//   } else {
//     log('isSimplifiedNode false', obj, conditions)
//     return false;
//   }
// }

function isSimplifiedEnhancedNode(obj: any): boolean {
  /* { labels: string[], properties: Object, relationships: SimplifiedRelationship[] } */
  if (not(isObject(obj))) {
    return false;
  }
  let { labels, properties, relationships } = obj;
  const conditions = {
    labelsOk: isLabelsOk(labels),
    propertiesOk: isPropertiesOk(properties),
    relationshipsOk: isRelationshipsOk(relationships),
  };

  if (values(conditions).every(isTrue)) {
    // log('isSimplifiedEnhancedNode true', obj)
    return true;
  } else {
    // log('isSimplifiedEnhancedNode false', obj, conditions)
    return false;
  }
}

const builder = new Builder();
export { Builder, builder, isIdentifiedNodeObj, isRelationshipObject };
