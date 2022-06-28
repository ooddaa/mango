"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.builder = exports.Builder = void 0;
Object.defineProperty(exports, "isIdentifiedNodeObj", {
  enumerable: true,
  get: function get() {
    return _utils.isIdentifiedNodeObj;
  }
});
Object.defineProperty(exports, "isRelationshipObject", {
  enumerable: true,
  get: function get() {
    return _utils.isRelationshipObject;
  }
});

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _ = require(".");

var _2 = require("../");

var _Result = require("../Result");

var _templates = _interopRequireDefault(require("./templates"));

var _utils = require("../utils");

var _lodash = require("lodash");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

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


  buildNodes(arr) {
    var obj = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
      extract: false,
      validateOptionals: false,
      template: undefined
    };
    var {
      extract,
      validateOptionals,
      template
    } = obj;
    /* validations */

    var validationResult = _validateBuildNodesArguments(arr);

    if ((0, _Result.isFailure)(validationResult)) {
      // since this is Failure, we cannot do array destruction on buildNodes ((
      return [validationResult];
    }
    /* !validations */

    /**
     * Logic.
     */


    var data = arr.map(function _attemptBuildingANode(candidate) {
      /**
       * If we accidently passed a Node, just return it.
       */
      if ((0, _.isNode)(candidate) || (0, _.isEnhancedNode)(candidate)) {
        return new _Result.Success({
          data: candidate,
          parameters: {
            candidate
          }
        });
      }
      /**
       * 1. Find out which template must be used.
       * @tested
       */


      var node = (0, _.isNodeCandidate)(candidate.getCoreNode()) ? candidate.getCoreNode().getCoreNode() : candidate.getCoreNode(); // Make user specify template explicitly or default to Node

      var Template = _templates.default[template] || _templates.default["Node"];
      /**
       * 2. The reason for all of us to gather here tonight - do
       * the validations!!!
       */

      if ((0, _.isNode)(node)) {
        return new _Result.Success({
          data: node,
          parameters: {
            node
          }
        });
      } // log(Template)


      var validations = new _2.Validator(node, Template).validate({
        validateOptionals
      });

      if ((0, _Result.isFailure)(validations)) {
        // return validationResult instead of candidate
        return validations;
      }
      /**
       * 3. If nodeObj successfully passed validations -
       * stuff the newNode with all good stuff (no pun...).
       */


      var newNode = _composeNewNode(node);
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
      newNode.properties._label = node.labels[0] || null; // node.labels.length !== 0 ? node.labels.join("|") : null;

      newNode.properties._labels = node.labels;
      /* set _template */

      newNode.properties._template = (0, _utils.isPresent)(template) ? template : "Node";
      /* add _date_created */

      newNode.properties._date_created = (0, _utils.setDateCreated)();
      /* make final Node */

      var finalNode = new _.Node(_objectSpread({}, newNode));
      /* set _hash */

      finalNode.setHash();
      return new _Result.Success({
        data: finalNode,
        parameters: {
          node
        }
      });
    });
    return extract ? data.map(_Result.getResultData) : data; /////////////// FUN ///////////////

    /**
     * Runs all validations.
     *
     * @private
     * @param {nodeObj[]} arr
     */

    function _validateBuildNodesArguments(arr) {
      if (!arr) {
        return new _Result.Failure({
          reason: "Builder.buildNodes: Validation Error:\n. Falsy first argument. See parameters.",
          parameters: {
            firstArgument: arr
          }
        });
      }

      if (!(arr instanceof Array)) {
        return new _Result.Failure({
          reason: "Builder.buildNodes: Validation Error:\nFirst argument was not an Array. See parameters.",
          parameters: {
            firstArgument: arr
          }
        });
      }

      if (!arr.every(elm => elm instanceof _.NodeCandidate || elm instanceof _.EnhancedNodeCandidate)) {
        return new _Result.Failure({
          reason: "Builder.buildNodes: Validation Error:\nFirst argument must be NodeCandidate[] || EnhancedNodeCandidate[]. See parameters.",
          parameters: {
            firstArgument: arr
          }
        });
      }

      return new _Result.Success();
    }
    /**
     * We need to make a node that we will wrap in a Node... get this?
     * a node, that we WILL WRAP IN ANOTHER NODE! yay more Node-wrapped-nodes!
     *
     * @private
     * @param {nodeObj} node
     */


    function _composeNewNode(node) {
      var entries = function entries() {
        var obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        return Object.entries(obj);
      };

      var newNode = {
        labels: [],
        properties: {}
      };
      /* get rid of { rquired, optional, _private } sub-structure */

      var {
        required,
        optional,
        _private
      } = node.properties;

      for (var [key, value] of entries(required)) {
        newNode.properties[key] = value;
      }

      for (var [_key, _value] of entries(optional)) {
        newNode.properties[_key] = _value;
      }

      for (var [_key2, _value2] of entries(_private)) {
        newNode.properties[_key2] = _value2;
      }

      return newNode;
    } /////////////// END ///////////////

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


  buildEnhancedNodes(arr) {
    var obj = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
      extract: false,
      template: undefined,
      ignore: undefined,
      stopAfterCoreNodes: false,
      stopAfterRelNodes: false,
      stopAfterRelationships: false
    };
    var {
      extract,
      template,
      ignore,
      stopAfterCoreNodes,
      stopAfterRelNodes,
      stopAfterRelationships
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

    var validationResult = _validateBuildEnhancedNodesArguments(arr);

    if (validationResult.length == 1 && (0, _Result.isFailure)(validationResult[0])) {
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


    var arr_with_coreNodes = _dealWithCodeNodes(arr, this);

    if (stopAfterCoreNodes) {
      return arr_with_coreNodes;
    }
    /**
     * 2. Deal with relationships' nodes.
     */


    var arr_with_relNodes = _dealWithRelNodes(arr_with_coreNodes, this); // log(arr_with_relNodes)


    if (stopAfterRelNodes) {
      return arr_with_relNodes;
    }
    /**
     * 3. Deal with Relationships.
     */


    var arr_with_relationships = _dealWithRelationships(arr_with_relNodes, this); // log(arr_with_relationships)


    if (stopAfterRelationships) {
      return arr_with_relationships;
    }

    var arr_with_enodes = _enhancer(arr_with_relationships, this);

    var result = _resultWrapper(arr_with_enodes, this);

    if (extract) {
      return result.map(_Result.getResultData);
    }

    return result; /////////////// FUN ///////////////

    function _isNodeCandidate(val) {
      return val instanceof _.NodeCandidate;
    }

    function _validateBuildEnhancedNodesArguments(arr) {
      if ((0, _utils.isMissing)(arr)) {
        return [new _Result.Failure({
          reason: "Builder.buildEnhancedNodes: Validation Error:\n. Missing first argument. See parameters.",
          parameters: {
            firstArgument: arr
          }
        })];
      }

      if ((0, _utils.not)((0, _lodash.isArray)(arr))) {
        return [new _Result.Failure({
          reason: "Builder.buildEnhancedNodes: Validation Error:\nFirst argument was not an Array. See parameters.",
          parameters: {
            firstArgument: arr
          }
        })];
      }

      if (arr.length == 0) {
        return [new _Result.Failure({
          reason: "Builder.buildEnhancedNodes: Validation Error:\nFirst argument was an empty Array. Nothing to work with. See parameters.",
          parameters: {
            firstArgument: arr
          }
        })];
      }

      if (!arr.every(elm => elm instanceof _.EnhancedNodeCandidate)) {
        return [new _Result.Failure({
          reason: "Builder.buildEnhancedNodes: Validation Error:\nFirst argument must be EnhancedNodeCandidate[]. See parameters.",
          parameters: {
            arguments: arr
          }
        })];
      }

      return new _Result.Success();
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


    function _dealWithCodeNodes(arr, ctx) {
      return arr.map(candidate => {
        var coreNode = candidate.getCoreNode();

        if ((0, _.isNode)(coreNode)) {
          return candidate;
        } // if (!(coreNode instanceof NodeCandidate)) {


        if ((0, _utils.not)((0, _.isNodeCandidate)(coreNode))) {
          var badNode = new _Result.Failure({
            reason: "Builder.buildEnhancedNodes: _dealWithCodeNodes:\ncoreNode must be NodeCandidate. See parameters.",
            parameters: {
              coreNode
            }
          });
          candidate.setCoreNode(badNode);
          return candidate;
        }

        var result = ctx.buildNodes([coreNode], {
          template
        }); // unpacking - Principle 3.

        if ((0, _Result.isFailure)(result)) {
          candidate.setCoreNode(result);
          return candidate;
        }

        if (Array.isArray(result)) {
          if (result[0] instanceof _Result.Failure) {
            candidate.setCoreNode(result[0]);
            return candidate;
          }

          if (result[0] instanceof _Result.Success) {
            candidate.setCoreNode(result[0].data);
            return candidate;
          }
        } else {
          throw new Error("Builder.buildEnhancedNodes: _dealWithCodeNodes:\ncannot deal with coreNode.");
        }
      });
    }

    function _dealWithRelNodes(arr, ctx) {
      /** walk arr's rels, on encountering an rc ->
       * 1. has nc ? return buildNode([nc])
       * 2. has enc ? return _dealWithRelNodes([enc])
       * 3. anything else ? Failure/Node/Enode ? return it
       * 4. return arr
       */
      return arr.map(enc => {
        if (!(0, _.isEnhancedNodeCandidate)(enc)) {
          throw new Error("Builder.buildEnhancedNodes._dealWithRelNodes: expected an ENC.\nReceived: ".concat(JSON.stringify(enc), "."));
        }
        /* required rels */


        var rrels = enc.getAllRelationships();

        if (!rrels.length) {
          return enc;
        }

        var newRRels = rrels.map(function _worker(rel) {
          try {
            if ((0, _.isRelationship)(rel) || (0, _Result.isFailure)(rel)) {
              return rel;
            } else if ((0, _.isRelationshipCandidate)(rel)) {
              /* mainNode is the coreNode must have been dealt with by _dealWithCoreNodes
              via enc.setCodeNode calling on enc.addCoreNodeToRelationships */
              var [pn] = rel.getPartnerNode();

              if ((0, _.isNodeCandidate)(pn)) {
                var nc_result = ctx.buildNodes([pn], {
                  template
                });

                if (!Array.isArray(nc_result)) {
                  throw new Error("Builder.buildEnhancedNodes._dealWithRelNodes: nc_result must be Result[].\nReceived: ".concat(JSON.stringify(nc_result), "."));
                }

                var newNode = (0, _Result.isSuccess)(nc_result[0]) ? nc_result[0].getData() : nc_result[0];
                rel.setPartnerNode(newNode);
                return rel;
              } else if ((0, _.isEnhancedNodeCandidate)(pn)) {
                /* go recursively */
                var enc_result = ctx.buildEnhancedNodes([pn]);

                if (!Array.isArray(enc_result)) {
                  throw new Error("Builder.buildEnhancedNodes._dealWithRelNodes: enc_result must be Result[].\nReceived: ".concat(JSON.stringify(enc_result), "."));
                }

                var _newNode = (0, _Result.isSuccess)(enc_result[0]) ? enc_result[0].getData() : enc_result[0];

                rel.setPartnerNode(_newNode);
                return rel;
              }

              return rel;
            } else {
              throw new Error("Builder.buildEnhancedNodes._dealWithRelNodes: rel must be RelationshipCandidate | Relationship | Failure.\nReceived: ".concat(JSON.stringify(rel), "."));
            }
          } catch (error) {
            // throw new Error(`Builder.buildEnhancedNodes._dealWithRelNodes._worker: error:\n${JSON.stringify(error)}`)
            // throw new Error(`Builder.buildEnhancedNodes._dealWithRelNodes._worker: error:`, error)
            console.log("Builder.buildEnhancedNodes._dealWithRelNodes._worker:", error);
          }
        });
        var req = newRRels.filter(rel => rel.getNecessity() === "required");
        var opt = newRRels.filter(rel => rel.getNecessity() === "optional");
        enc.setRequiredRelationships(req);
        enc.setOptionalRelationships(opt); // optional rels

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


    function _dealWithRelationships(arr, ctx) {
      /**
       * Legacy musings. at [2022-03-01] all works and I have no idea/desire to find out what this means.
       *
       * since my RCs don't have both startNode & endNode at the same time, mb it's here
       * where I need to add them to be able to use buildRelationships that expects both nodes.
       * I need to check that we have a Node for coreNode here, otherwise we cannot build any Rel
       */
      var newArr = arr.map(enc => {
        /* if already enhanceable, leave it */
        if (enc.isEnhanceable()) return;

        if ((0, _.isEnhancedNodeCandidate)(enc)) {
          var coreNode = enc.getCoreNode();

          if ((0, _.isNode)(coreNode)) {
            enc.getAllRelationships().forEach(rel => {
              rel.setMainNode(coreNode);
            });
            var results = ctx.buildRelationships(enc.getAllRelationships());
            /* replace enc's requiredRelationships with updated ones */

            enc.setRequiredRelationships(_unpack(results).filter(rel => rel.getNecessity() === "required"));
            enc.setOptionalRelationships(_unpack(results).filter(rel => rel.getNecessity() === "optional")); // console.log('enc', enc)

            return enc;
          } else {
            throw new Error("Builder.buildEnhancedNodes._dealWithRelationships: coreNode must be a Node.\ncoreNode: ".concat(JSON.stringify(coreNode)));
          }
        }
      }); // log(newArr)

      return arr; /////////////// END ///////////////

      function _unpackSuccess(result) {
        return (0, _Result.isSuccess)(result) ? result.getData() : result;
      }

      function _unpack(arr) {
        return arr.map(_unpackSuccess);
      } /////////////// END ///////////////

    }
    /**
     * Does the final job - takes what's enhanceable and instantiates EnhancedNode.
     * @param {*} arr
     * @param {*} ctx
     */


    function _enhancer(arr, ctx) {
      var result = arr.map(enc => {
        // console.log('enc.isEnhanceable()', enc.isEnhanceable())
        // return enc.isEnhanceable() ? enc.toEnhancedNode() : enc
        return enc.toEnhancedNode();
      }); // log(result)

      return result;
    }

    function _resultWrapper(arr, ctx) {
      var result = arr.map(data => {
        if ((0, _.isEnhancedNode)(data)) {
          return new _Result.Success({
            data
          });
        }

        if ((0, _.isEnhancedNodeCandidate)(data)) {
          // log(data)
          return new _Result.Failure({
            reason: "could not enahance",
            data
          });
        } else {
          return new _Result.Failure({
            reason: "some other reason",
            data
          });
        }
      });
      return result;
    } /////////////// END ///////////////

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


  buildRelationships(arr) {
    var obj = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
      hashType: "labels",
      extract: false,
      flatten: true,
      keepFailures: false
    };
    var {
      hashType,
      extract,
      flatten,
      keepFailures
    } = obj;
    /**
     * Validations.
     */

    /* First argument must be RelationshipCandidate[]. */

    {
      var _data = arr.filter(rel => {
        return !(0, _.isRelationshipCandidate)(rel);
      });

      if (_data.length) {
        return [new _Result.Failure({
          reason: "Builder.buildRelationships(): Validation error: First argument must be RelationshipCandidate[].",
          data: _data
        })];
      }
    } // log(arr)

    var data = arr.map(relObj => {
      /* check start/endNode have hashes */
      // log('start checking')
      var startNode, endNode; /// work on startNode

      if ((0, _utils.not)(relObj.getStartNode())) {
        return new _Result.Failure({
          reason: "Builder.buildRelationships(): Logic error: cannot access startNode.",
          parameters: relObj,
          data: []
        });
      } else {
        var sn = relObj.getStartNode()[0]; // log(sn)
        // console.log('isNodeCandidate(sn)', isNodeCandidate(sn))
        // if it's a xCandidate, attempt to build it.

        if ((0, _.isNodeCandidate)(sn)) {
          // build Node
          var result = this.buildNodes([sn]);

          if ((0, _Result.isFailure)(result)) {
            throw new Error("Builder.buildRelationships: attempted to build a Node from startNode (NodeCandidate) and failed:\nresult ".concat(JSON.stringify(result)));
          }

          if ((0, _utils.not)((0, _.isNode)(result[0].getData()))) {
            throw new Error("Builder.buildRelationships: attempted to build a Node from startNode (NodeCandidate) and failed: did not get the Node:\nresult ".concat(JSON.stringify(result), "\nresult[0].getData(): ").concat(JSON.stringify(result[0].getData())));
          } // success
          // console.log('node success result[0].getData()', result[0].getData())


          startNode
          /* : Node */
          = result[0].getData();
        } else if ((0, _.isEnhancedNodeCandidate)(sn)) {
          // build Enode
          var _result = this.buildEnhancedNodes([sn]);

          if ((0, _Result.isFailure)(_result)) {
            throw new Error("Builder.buildRelationships: attempted to build an EnhancedNode from startNode (EnhancedNodeCandidate) and failed:\nresult ".concat(JSON.stringify(_result)));
          }

          if ((0, _utils.not)((0, _.isEnhancedNode)(_result[0].getData()))) {
            throw new Error("Builder.buildRelationships: attempted to build an EnhancedNode from startNode (EnhancedNodeCandidate) and failed: did not get the EnhancedNode:\nresult ".concat(JSON.stringify(_result), "\nresult[0].getData(): ").concat(JSON.stringify(_result[0].getData())));
          } // success
          // console.log('enode success result[0].getData()', result[0].getData())


          startNode
          /* : EnhancedNode */
          = _result[0].getData();
        } // Success was supplied


        if ((0, _Result.isSuccess)(sn)) {
          startNode = sn.getData();
        } else if ((0, _.isEnhancedNode)(sn) || (0, _.isNode)(sn)) {
          // it was a Node
          startNode = sn;
        } // final check


        if ((0, _utils.not)((0, _.isEnhancedNode)(startNode) || (0, _.isNode)(startNode))) {
          throw new Error("Builder.buildRelationships: final check on startNode failed: startNode must be Node|EnhancedNode:\nstartNode ".concat(JSON.stringify(startNode)));
        }
      } /// work on endNode


      if ((0, _utils.not)(relObj.getEndNode())) {
        return new _Result.Failure({
          reason: "Builder.buildRelationships(): Logic error: cannot access endNode.",
          parameters: relObj,
          data: []
        });
      } else {
        var en = relObj.getEndNode()[0]; // if it's a xCandidate, attempt to build it.

        if ((0, _.isNodeCandidate)(en)) {
          // console.log('isNodeCandidate(en)', isNodeCandidate(en))
          // build Node
          var _result2 = this.buildNodes([en]);

          if ((0, _Result.isFailure)(_result2)) {
            throw new Error("Builder.buildRelationships: attempted to build a Node from endNode (NodeCandidate) and failed:\nresult ".concat(JSON.stringify(_result2)));
          }

          if ((0, _utils.not)((0, _.isNode)(_result2[0].getData()))) {
            throw new Error("Builder.buildRelationships: attempted to build a Node from endNode (NodeCandidate) and failed: did not get the Node:\nresult ".concat(JSON.stringify(_result2), "\nresult[0].getData(): ").concat(JSON.stringify(_result2[0].getData())));
          } // success
          // console.log('node success result[0].getData()', result[0].getData())


          endNode
          /* : Node */
          = _result2[0].getData();
        } else if ((0, _.isEnhancedNodeCandidate)(en)) {
          // build Enode
          var _result3 = this.buildEnhancedNodes([en]);

          if ((0, _Result.isFailure)(_result3)) {
            throw new Error("Builder.buildRelationships: attempted to build an EnhancedNode from endNode (EnhancedNodeCandidate) and failed:\nresult ".concat(JSON.stringify(_result3)));
          }

          if ((0, _utils.not)((0, _.isEnhancedNode)(_result3[0].getData()))) {
            throw new Error("Builder.buildRelationships: attempted to build an EnhancedNode from endNode (EnhancedNodeCandidate) and failed: did not get the EnhancedNode:\nresult ".concat(JSON.stringify(_result3), "\nresult[0].getData(): ").concat(JSON.stringify(_result3[0].getData())));
          } // success
          // console.log('enode success result[0].getData()', result[0].getData())


          endNode
          /* : EnhancedNode */
          = _result3[0].getData();
        } // Success was supplied


        if ((0, _Result.isSuccess)(en)) {
          endNode = en.getData();
        } else if ((0, _.isEnhancedNode)(en) || (0, _.isNode)(en)) {
          // it was a Node
          endNode = en;
        } // final check


        if ((0, _utils.not)((0, _.isEnhancedNode)(endNode) || (0, _.isNode)(endNode))) {
          throw new Error("Builder.buildRelationships: final check on endNode failed: endNode must be Node|EnhancedNode:\nendNode ".concat(JSON.stringify(endNode)));
        }
      }

      if (!startNode.properties || !endNode.properties) {
        (0, _utils.log)("buildRelationships: !startNode.properties || !endNode.properties");
        (0, _utils.log)(relObj);
        (0, _utils.log)(startNode);
        (0, _utils.log)(startNode.properties._hash);
        (0, _utils.log)(endNode);
        (0, _utils.log)(endNode.properties._hash);
      } // log(startNode)
      // log(endNode)


      var reason = [];
      if (!startNode.properties._hash) reason.push("Missing startNode hash.");
      if (!endNode.properties._hash) reason.push("Missing endNode hash.");

      if (reason.length) {
        return [new _Result.Failure({
          reason: reason.join(" "),
          parameters: relObj,
          data: []
        })];
      }
      /**
       * Logic
       */


      var rel = new _.Relationship({
        labels: relObj.labels,
        properties: relObj.properties,
        // need validation
        direction: relObj.direction,
        necessity: relObj.necessity,
        startNode,
        endNode
      }); // rel.setHash(hashType) // leave it to Relationship constructor, which accounts for

      rel.properties._date_created = (0, _utils.setDateCreated)();
      rel.properties._necessity = relObj.necessity;
      /* check that rel has successfully set hash */

      if (!rel.getHash()) {
        return new _Result.Failure({
          reason: "buildRelationships: unable to set hash.",
          parameters: rel,
          data: []
        });
      }

      if (extract) {
        return rel;
      }

      return new _Result.Success({
        parameters: relObj,
        data: rel
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


  buildPartialNodes(arr) {
    var obj = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    /* defaults */
    var extract = (0, _utils.isPresent)(obj.extract) ? obj.extract : false;
    var Template = this.loadTemplate("PartialNode");
    var data = arr.map(obj => {
      var {
        labels,
        properties
      } = obj;
      /* should recognize both nodeObj and PartialNodes */

      properties = (0, _.isNodeObj)(obj) ? (0, _lodash.keys)(properties).reduce((acc, key) => {
        acc = _objectSpread(_objectSpread({}, acc), properties[key]);
        return acc;
      }, {}) : properties;
      var newObj = {
        labels,
        properties
      };
      /* add _label to be picked up by Cypher */

      newObj.properties._label = labels.length !== 0 ? labels.join("|") : null;
      /* add _date_created */

      newObj.properties._date_created = (0, _utils.setDateCreated)();
      /* create an instance */

      var finalObj = new Template(newObj);
      /* set _hash */

      finalObj.setHash();
      /* remove createRelationshipsTemplate method */

      delete finalObj.createRelationshipsTemplate;
      /* memoize */
      // this.collection[newObj.properties._hash] = finalObj

      return new _Result.Success({
        data: finalObj
      });
    });
    return extract ? data.map(_Result.getResultData) : data;
  }
  /**
   * @to_be_depricated
   * @param {string} template
   */


  loadTemplate(template) {
    return _templates.default[template] ? _templates.default[template] : _templates.default["EnhancedNode"];
  }
  /**
   */


  loadConfig() {
    return (0, _asyncToGenerator2.default)(function* () {
      class Config {
        constructor() {
          this.allowIncompleteNodes = true;
        }

      }

      return new Config();
    })();
  } //// HELPER METHODS ////


  makeNodeCandidate(labels, required, optional, _private) {
    return new _.NodeCandidate({
      labels,
      properties: {
        required,
        optional,
        _private
      }
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


  makeNode(labels, required, optional, _private) {
    var candidate = this.makeNodeCandidate(labels, required, optional, _private);
    var result = this.buildNodes([candidate]);

    if ((0, _Result.isFailure)(result)) {
      throw new Error("Builder.makeNode: failed to create a Node.\nresult ".concat(JSON.stringify(result)));
    }

    return result[0].firstDataElement;
  }

  makeEnhancedNodeCandidate(coreNode, requiredRels, optionalRels) {
    return new _.EnhancedNodeCandidate(coreNode, {
      required: requiredRels,
      optional: optionalRels
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


  makeEnhancedNode(coreNode, requiredRels, optionalRels) {
    /* Bind all methods so they are usable in recursive iteration. */
    var makeRelationshipCandidate = this.makeRelationshipCandidate.bind(this);
    var makeEnhancedNode = this.makeEnhancedNode.bind(this);
    var makeNode = this.makeNode.bind(this);
    /* Build a full Node out of SimplifiedNode */

    if (isSimplifiedNode(coreNode)) {
      coreNode = makeNode(coreNode.labels, ...(0, _utils.decomposeProps)(coreNode.properties, {
        asArray: true
      }));
    }
    /* All recursive work is done here */


    var relationships = requiredRels.map(_processRelationship);
    var candidate = this.makeEnhancedNodeCandidate(coreNode, relationships);
    var result = this.buildEnhancedNodes([candidate]);

    if ((0, _Result.isFailure)(result)) {
      throw new Error("Builder.makeNode: failed to create an EnhancedNode.\nresult ".concat(JSON.stringify(result)));
    }

    return result[0].firstDataElement;
    /* Local Functions
    _________________________________________________________*/

    function _processRelationship(relationship) {
      if (isSimplifiedRelationship(relationship)) {
        var {
          labels,
          partnerNode,
          properties,
          direction
        } = relationship;
        /* Simple end case. */

        if (isSimplifiedNode(partnerNode)) {
          partnerNode = makeNode(partnerNode.labels, ...(0, _utils.decomposeProps)(partnerNode.properties, {
            asArray: true
          }));
        }
        /* Deal with deep EnhancedNode recursively */


        if (isSimplifiedEnhancedNode(partnerNode)) {
          partnerNode = makeEnhancedNode(makeNode(partnerNode.labels, ...(0, _utils.decomposeProps)(partnerNode.properties, {
            asArray: true
          })),
          /* Mark all relationships as required for now. */
          partnerNode.relationships);
        }

        return makeRelationshipCandidate(labels, partnerNode, properties, direction);
      }
      /**@todo add checks for other rel types */


      if ((0, _utils.not)(isAcceptableRelationship(relationship))) {
        throw new Error("Builder.makeEnhancedNode._processRelationship: relationship is not acceptable, must be one of SimplifiedRelationship\n        | SimplifiedRelationshipArray\n        | Relationship\n        | RelationshipCandidate.\nrelationship: ".concat((0, _utils.stringify)(relationship)));
      }

      return relationship;
    }
  }

  makeRelationshipCandidate(labels, partnerNode, properties, direction) {
    var outbound = ["outbound", ">"].includes(direction);
    var inbound = ["inbound", "<"].includes(direction);

    if ((0, _utils.isMissing)(direction) || (0, _utils.not)(outbound || inbound)) {
      /* defaults to outbound */
      direction = "outbound";
      outbound = true;
    }

    if (outbound) {
      return new _.RelationshipCandidate({
        labels,
        properties,
        direction,
        endNode: partnerNode
      });
    }

    if (inbound) {
      return new _.RelationshipCandidate({
        labels,
        properties,
        direction,
        startNode: partnerNode
      });
    }
  }

}

exports.Builder = Builder;

function isLabelsOk(labels) {
  /* { labels: string[] } */
  if (labels && (0, _lodash.isArray)(labels) && labels.length !== 0 && labels.every(_lodash.isString)) {
    return true;
  }

  return false;
}

function isPartnerNodeOk(partnerNode) {
  /* { partnerNode: partialNodeObj | NodeCandidate | Node } */
  var conditions = {
    isSimplifiedNode: false,
    isSimplifiedEnhancedNode: false,
    isNodeCandidate: false,
    isEnhancedNodeCandidate: false,
    isNode: false,
    isEnhancedNode: false
  };

  if (isSimplifiedNode(partnerNode)) {
    conditions.isSimplifiedNode = true;
  }

  if (isSimplifiedEnhancedNode(partnerNode)) {
    conditions.isSimplifiedEnhancedNode = true;
  }

  if ((0, _.isNodeCandidate)(partnerNode)) {
    conditions.isNodeCandidate = true;
  }

  if ((0, _.isEnhancedNodeCandidate)(partnerNode)) {
    conditions.isEnhancedNodeCandidate = true;
  }

  if ((0, _.isNode)(partnerNode)) {
    conditions.isNode = true;
  }

  if ((0, _.isEnhancedNode)(partnerNode)) {
    conditions.isEnhancedNode = true;
  }

  return (0, _lodash.values)(conditions).some(_utils.isTrue);
}

function isPropertiesOk(properties) {
  /* { properties: Object } */
  if ((0, _lodash.isObject)(properties)) {
    return true;
  }

  return false;
}

function isRelationshipsOk(relationships) {
  /* { relationships: [] | SimplifiedRelationship[] | SimplifiedRelationshipArray[] | RelationshipCandidate[] | Relationship[] } */
  if ((0, _utils.not)((0, _lodash.isArray)(relationships))) {
    return false;
  }

  if (relationships.length == 0) {
    return true;
  }

  var results = relationships.map(isAcceptableRelationship); // log(results);

  return results.every(_utils.isTrue);
}

function isAcceptableRelationship(obj) {
  if ((0, _lodash.isArray)(obj)) {
    if (isSimplifiedRelationshipArray(obj)) {
      return true;
    }
  }

  if ((0, _utils.not)((0, _lodash.isObject)(obj))) {
    return false;
  }

  if ((0, _.isRelationshipCandidate)(obj) || (0, _.isRelationship)(obj) || isSimplifiedRelationship(obj)) {
    return true;
  }

  return false;
}

function isSimplifiedRelationship(obj) {
  if ((0, _utils.not)((0, _lodash.isObject)(obj))) {
    return false;
  } // log(obj);


  var {
    labels,
    partnerNode
  } = obj;
  var conditions = {
    labelsOk: isLabelsOk(labels),
    partnerNodeOk: isPartnerNodeOk(partnerNode)
  }; // log(conditions);

  if ((0, _lodash.values)(conditions).every(_utils.isTrue)) {
    return true;
  } else {
    return false;
  }
}

function isSimplifiedNode(obj) {
  /* { labels: string[], properties: Object, } */
  if ((0, _utils.not)((0, _lodash.isObject)(obj))) {
    return false;
  }

  var {
    labels,
    properties,
    relationships
  } = obj;
  var conditions = {
    labelsOk: isLabelsOk(labels),
    propertiesOk: isPropertiesOk(properties),
    noRelationships: (0, _utils.isMissing)(relationships) || (0, _lodash.isArray)(relationships) && relationships.length == 0
  };

  if ((0, _lodash.values)(conditions).every(_utils.isTrue)) {
    return true;
  } else {
    return false;
  }
}

function isSimplifiedEnhancedNode(obj) {
  /* { labels: string[], properties: Object, relationships: SimplifiedRelationship[] } */
  if ((0, _utils.not)((0, _lodash.isObject)(obj))) {
    return false;
  }

  var {
    labels,
    properties,
    relationships
  } = obj;
  var conditions = {
    labelsOk: isLabelsOk(labels),
    propertiesOk: isPropertiesOk(properties),
    relationshipsOk: isRelationshipsOk(relationships)
  };

  if ((0, _lodash.values)(conditions).every(_utils.isTrue)) {
    return true;
  } else {
    return false;
  }
}

var builder = new Builder();
exports.builder = builder;