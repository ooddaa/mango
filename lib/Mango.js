"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.search = exports.Mango = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _lodash = require("lodash");

var _ = require(".");

var _utils = require("./utils");

var _Errors = require("./Errors");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

/**
 * Mango is a user/developer-friendly Object-To-Graph Mapper build on top of Neo4j's official
 * JavaScript Driver.
 *
 * @class Main class for the user to operate.
 * @public
 * @module Mango
 * @see module:Builder
 *
 * @see module:Engine
 *
 * @param {Object} config - Configuration object.
 * @param {Engine} config.engine - Instance of an Engine class. If none is supplied, Mango will look for config.engineConfig. If that does not exist or is unusable, a NoEngineError will be thrown.
 * @param {Object} config.engineConfig - Configuration object to instantiate connection to Neo4j.
 * @param {string} config.engineConfig.username - Neo4j DBMS username.
 * @param {string} config.engineConfig.password - Neo4j DBMS password.
 * @param {string?} [config.engineConfig.ip='0.0.0.0'] - Neo4j DBMS IP to connect to.
 * @param {string?} [config.engineConfig.port='7687'] - Neo4j DBMS port to use
 * @param {string?} [config.engineConfig.database='neo4j'] - Neo4j DBMS database name to use.
 *
 * @param {Builder?} [config.builder=new Builder()] - Instance of a Builder class. If none is supplied, a generic one will be instantiated for you.
 *
 * @example
 *
 * const mango = new Mango({
 *  engineConfig: {
 *    username: 'neo4j',
 *    password: 'neo4jpass',
 *  }
 * }); // connects to Neo4j DBMS instance running on 0.0.0.0:7687 and uses 'neo4j' database
 */
class Mango {
  constructor() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if ((0, _.isMissing)(config.engine)) {
      try {
        var engineConfigIsOk = this.constructor._isEngineConfigUsable(config.engineConfig);

        if (engineConfigIsOk == false) {
          throw new _Errors.NoEngineError("Mango.constructor: do not have a usable Engine instance.");
        }
      } catch (error) {
        (0, _.log)("Mango constructor engineConfig error.\nname: ".concat(error.name, "\nmessage: ").concat(error.message));
        throw new _Errors.NoEngineError(error.message);
      }
    }

    this.engine = config.engine || this._initEngine(config.engineConfig);
    this.builder = config.builder || new _.Builder();
  }
  /**
   * I want to communicate to users what is missing from configEngine.
   * I'll do it by way of throwing errors at them.
   *
   * @private
   * @param {Object} engineConfig - Configuration object to authenticate and initiate Neo4j driver.
   * @returns {boolean}
   */


  static _isEngineConfigUsable(engineConfig) {
    /* username && password are sufficient to connect to default Neo4j DBMS */
    if ((0, _lodash.has)(engineConfig, "username") == false) {
      throw new _Errors.NoEngineError("Mango.constructor._isEnigneConfigUsable: no username found.\nengineConfig: ".concat((0, _utils.stringify)(engineConfig)));
    } else {
      if ((0, _lodash.isString)(engineConfig["username"]) == false) {
        throw new _Errors.NoEngineError("Mango.constructor._isEnigneConfigUsable: username must be string.\nengineConfig: ".concat((0, _utils.stringify)(engineConfig)));
      }
    }

    if ((0, _lodash.has)(engineConfig, "password") == false) {
      throw new _Errors.NoEngineError("Mango.constructor._isEnigneConfigUsable: no password found.\nengineConfig: ".concat((0, _utils.stringify)(engineConfig)));
    } else {
      if ((0, _lodash.isString)(engineConfig["password"]) == false) {
        throw new _Errors.NoEngineError("Mango.constructor._isEnigneConfigUsable: password must be string.\nengineConfig: ".concat((0, _utils.stringify)(engineConfig)));
      }
    }

    return true;
  }
  /**
   * @private
   * @param {Object} engineConfig - Configuration object to authenticate and initiate Neo4j driver.
   * @returns {Engine}
   */


  _initEngine(engineConfig) {
    var database = engineConfig.database || "neo4j";
    var engine = new _.Engine({
      neo4jUsername: engineConfig.username,
      neo4jPassword: engineConfig.password,
      ip: engineConfig.ip || "0.0.0.0",
      port: engineConfig.port || "7687",
      database
    });
    /***@todo start and check connection */

    /* Start Neo4j Driver */

    engine.startDriver();
    /* Check connection to Neo4j */

    engine.verifyConnectivity({
      database
    }).then(_.log);
    /***@todo throw here if cannot connect */

    return engine;
  }

  _verifyConnectivity() {
    var _arguments = arguments,
        _this = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var config = _arguments.length > 0 && _arguments[0] !== undefined ? _arguments[0] : {};

      if (_this.engine instanceof _.Engine) {
        return config.database && (0, _lodash.isString)(config.database) ? yield _this.engine.verifyConnectivity({
          database: config.database
        }) : yield _this.engine.verifyConnectivity();
      } else {
        return {
          address: null,
          version: null,
          reason: "no engine"
        };
      }
    })();
  }
  /**
   * Adapter between a POJO properties object and PartialNode constructor.
   * @private
   * @param {Object} props - Node properties we are looking for.
   * @returns {Object}
   */


  _buildSearchedProps(props) {
    var searchedProps = {};

    for (var [key, value] of Object.entries(props)) {
      // find out type
      var type = value instanceof ConditionContainer ? value.getType() : typeof value; // form value object for pnodes. Default case - we use "e" == equal

      var valueObj = value instanceof ConditionContainer ? value.toObject() : {
        e: value
      };
      var searchedProp = {
        isCondition: true,
        type,
        key
        /***@TODO check if needs to be UpperCase? ie we search only for Required props? */
        ,
        value: [valueObj]
      };
      searchedProps[key] = searchedProp;
    }

    return searchedProps;
  }
  /**
   * Main method to search for Nodes in Neo4j.
   * Search granularity: 
   *    Broadest  - by label only
   *    Narrow    - by label + props
   *
   * @public
   * @param {string[]} labels - Array of labels to match Nodes by.
   * @param {Object} props - A POJO containing key:value to search for matches.
   * @param {Object} config - Configuration object.
   * @param {boolean} [config.exactMatch=false] - {true} Mango searches for exactly what we specified, ie the returned Nodes must not have any extra properties above supplied labels & properties. You get exactly what you asked for.
   *
   * {false} Mango matches any Nodes that have supplied labels and properties and the returned result may contain Nodes with extra properties. You may get more than you asked for.
   * @param {boolean} [config.fuzzy=false] - {true} Mango does a fuzzy match on strings. !!! as of 220811 tested on single property only 
   *
   * {false} Mango does a strict match on strings.
   * @param {string[]} [config.fuzzyProps=[]] - {string[]} Mango does a fuzzy match on selected properties strings.
   *
   * @param {boolean} [config.returnResult=false] - {true} returns a Result with additional Neo4j query data.
   *
   * {false} return Node[].
   *
   * @returns {Promise<Result|Node[]>}
   * @example
   *
   * import { Mango, isEnhancedNode, log } from 'mango';
   *
   * const mango = new Mango({
   *  // pass engineConfig with Neo4j credentials
   * });
   *
   * const results: EnhancedNode[] = await mango.findNode(["Person"], { NAME: 'Bob' });
   * log(results.every(isEnhancedNode));        // true
   * log(results.length);                       // 2 <- we found 2 Nodes with NAME == 'Bob'
   * log(results[0].getProperty("FULL_NAME"));  // Bob Dylan
   * log(results[1].getProperty("FULL_NAME"));  // Bob Marley
   * 
   * // fuzzy matching
   * const results: EnhancedNode[] = await mango.findNode(["Person"], { FULL_NAME: 'Dyl' }, { fuzzy: true });
   * log(results.every(isEnhancedNode));        // true
   * log(results.length);                       // 1 <- we found 1 Bob Dylan
   * log(results[0].getProperty("FULL_NAME"));  // Bob Dylan
   */


  findNode(labels, props) {
    var _arguments2 = arguments,
        _this2 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var config = _arguments2.length > 2 && _arguments2[2] !== undefined ? _arguments2[2] : {};

      /**
       * @todo think of a better mechanism to prefer fuzzy > fuzzyProps
       */
      if (config.fuzzy && config.fuzzyProps && config.fuzzyProps.length !== 0) {
        throw new Error("Mango.findNode: either fuzzy: boolean | fuzzyProps: string[] should be supplied, or none, but not both.\nfuzzy: ".concat(String(config.fuzzy), "\nfuzzyProps: ").concat((0, _utils.stringify)(config.fuzzyProps)));
      }

      var {
        requiredProps,
        optionalProps,
        privateProps
      } = _this2.decomposeProps(props || {});
      /* if exact match, make a new Node and match it 100% */


      if (config.exactMatch) {
        var node = _this2.builder.makeNode(labels, requiredProps, optionalProps, privateProps);

        var _result = yield _this2.engine.matchNodes([node]);

        if (config.returnResult) return _result[0];
        return _result[0].getData();
      }
      /**
       * Adds "contains" condition to props to allow fuzzy matching on 
       * 
       * all props - if config.fuzzy === true
       * or
       * selected props - of config.fuzzyProps === non empty string[] 
       * props { NAME: 'Keanu' }  => NAME: search('contains', ['Keanu']
       */


      function makeFuzzySearchProps(props) {
        var newProps = {};

        if (config.fuzzy) {
          for (var key in props) {
            newProps[key] = Mango.search('contains', [props[key]]);
          }
        } else if (config.fuzzyProps && config.fuzzyProps.length !== 0 && config.fuzzyProps.every(_lodash.isString)) {
          for (var _key in props) {
            if (config.fuzzyProps.includes(_key)) {
              newProps[_key] = Mango.search('contains', [props[_key]]);
            } else {
              newProps[_key] = props[_key];
            }
          }
        } else {
          throw new Error("Mango.findNode.makeFuzzySearchProps: cannot decide which fuzzy matching is required:\nconfig: ".concat((0, _utils.stringify)(config)));
        }

        return newProps;
      }

      var searchProps = config.fuzzy || config.fuzzyProps && config.fuzzyProps.length !== 0 ? _this2._buildSearchedProps(makeFuzzySearchProps(props) || {}) : _this2._buildSearchedProps(props || {});

      var pnode = _this2.builder.buildPartialNodes([{
        labels,
        properties: _objectSpread({}, searchProps)
      }]);
      /* check if succeeded */


      if ((0, _.isFailure)(pnode[0])) {
        throw new Error("Mango.findNode: failed to create a PartialNode: ".concat(JSON.stringify(pnode, null, 4)));
      }
      /* another check - do we have a pnode? */


      if ((0, _.isPartialNode)(pnode[0].getData()) == false) {
        throw new Error("Mango.findNode: failed to retrieve the PartialNode: ".concat(JSON.stringify(pnode, null, 4)));
      }
      /* all good */


      var result = yield _this2.engine.matchPartialNodes([pnode[0].getData()]);

      if (config.returnResult) {
        // log("final 2");
        (0, _.log)("returnResult", result);
        return result[0];
      }

      return yield Promise.all(result[0].getData());
    })();
  }
  /**
   * Builds a Node and merges it into Neo4j.
   *
   * @public
   * @param {string[]} labels - Array of labels to match Nodes by.
   * @param {Object} props - A POJO with properties to construct and merge a Node to Neo4j. !MUST contain at least one label and a REQUIRED property to be unique (Uniqueness Requirement).
   * @param {Object} config - Configuration object.
   * @param {boolean} [config.returnResult=false] - {true} returns a Result with additional Neo4j query data.
   *
   * {false} returns EnhancedNode.
   * @todo - allow opting out of Uniqueness Requirement.
   * @returns {Promise<Result|EnhancedNode>}
   * @example
   *
   * import { Mango, isEnhancedNode, log } from 'mango';
   *
   * const mango = new Mango({
   *  // pass engineConfig with Neo4j credentials
   * });
   *
   * const result: EnhancedNode =
   *  await mango.buildAndMergeNode(["Product"], { NAME: "Sweet Mango" });
   *
   * log(isEnhancedNode(result)); // true
   * log(node.isWritten());       // true <- Neo4j has a (Product { NAME: "Sweet Mango", _hash:str, _uuid:str, _date_created: TimeArray })
   * log(node.getId());           // 1 <- Neo4j's Id for this Node
   */


  buildAndMergeNode(labels, props) {
    var _arguments3 = arguments,
        _this3 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var config = _arguments3.length > 2 && _arguments3[2] !== undefined ? _arguments3[2] : {};

      var {
        requiredProps,
        optionalProps,
        privateProps
      } = _this3.decomposeProps(props);

      var node = _this3.builder.makeNode(labels, requiredProps, optionalProps, privateProps);

      var result;

      try {
        result = yield _this3.engine.mergeNodes([node]);
      } catch (error) {
        throw new Error("Mango.buildAndMergeNode: ".concat(error));
      }

      if (config.returnResult) return result[0];
      return result[0].firstDataElement;
    })();
  }
  /**
   * Builds a Relationship and merges it to Neo4j.
   * Needs no direction, as it is set by the position of startNode & endNode.
   * Namely, (startNode)-[:RELATIONSHIP]->(endNode).
   *
   * @public
   * @param {Node|EnhancedNode} startNode - Node that has an outbound Relationship.
   * @param {SimplifiedRelationshipArray|SimplifiedRelationship} relationship - [["REL_TYPES"], "required" | "optional", { relProps } ] | { labels: string[], properties: Object, necessity: "required" | "optional" }.
   * @param {Node|EnhancedNode} endNode - Node that has an inbound Relationship.
   * @param {Object} config - Configuration object.
   * @param {boolean} [config.returnResult=false] - {true} returns a Result with additional Neo4j query data.
   *
   * {false} returns Relationship.
   *
   * @returns {Promise<Result|Relationship>}
   * @example
   *
   * import { Mango, isRelationship, log } from 'mango';
   *
   * const mango = new Mango({
   *  // pass engineConfig with Neo4j credentials
   * });
   *
   * // Find Nodes.
   * const bob = await mango.buildAndMergeNode(["Person"], {
   *  FULL_NAME: "SpongeBob SquarePants",
   * });
   * const patrick = await mango.buildAndMergeNode(["Person"], {
   *  FULL_NAME: "Patrick Star",
   * });
   *
   * // Build a beautiful friendship!
   * const relationship = await mango.buildAndMergeRelationship(
   *  bob,
   *  {
   *    labels: ["IS_FRIENDS_WITH"],
   *    properties: { since: "forever" },
   *  }
   *  patrick
   * );
   *
   *
   * // Check
   * // (:Person { FULL_NAME: "SpongeBob SquarePants" })-[:IS_FRIENDS_WITH { since: "forever" }]->(:Person { FULL_NAME: "Patrick Star" })
   * log(isRelationship(relationship)); // true
   * log(relationship.isWritten());     // true
   *
   */


  buildAndMergeRelationship(startNode, relationship, endNode) {
    var _arguments4 = arguments,
        _this4 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var config = _arguments4.length > 3 && _arguments4[3] !== undefined ? _arguments4[3] : {};

      /* ensure we have a usable startNode */
      var startNodeToUse;

      if ((0, _.isNode)(startNode)) {
        // case: we have a Node
        startNodeToUse = startNode;
      } else if ((0, _lodash.isArray)(startNode)) {
        // case: [["Product"], { NAME: "Bediol" }],
        var unwrittenStartNode = _this4.builder.makeNode(...startNode);

        if ((0, _.isNode)(unwrittenStartNode) == false) {
          throw new Error("Mango.buildAndMergeRelationship: failed to make a Node: ".concat(JSON.stringify(unwrittenStartNode, null, 4)));
        } else {
          startNodeToUse = unwrittenStartNode;
        }
      }
      /* ensure we have a usable endNode */


      var endNodeToUse;

      if ((0, _.isNode)(endNode)) {
        // case: we have a Node
        endNodeToUse = endNode;
      } else if ((0, _lodash.isArray)(endNode)) {
        // case: [["Product"], { NAME: "Bediol" }],
        var unwrittenEndNode = _this4.builder.makeNode(...endNode);

        if ((0, _.isNode)(unwrittenEndNode) == false) {
          throw new Error("Mango.buildAndMergeRelationship: failed to make a Node: ".concat(JSON.stringify(unwrittenEndNode, null, 4)));
        } else {
          endNodeToUse = unwrittenEndNode;
        }
      }

      var _isArray = (0, _lodash.isArray)(relationship);

      var rc = new _.RelationshipCandidate({
        labels: _isArray ? relationship[0] : relationship.labels,
        properties: _isArray ? relationship[2] || {} : relationship.properties || {},
        necessity: _isArray ? relationship[1] || "required" : relationship.necessity || "required",
        startNode: startNodeToUse,
        endNode: endNodeToUse,
        direction: relationship.direction || "outbound"
      });
      var rel = yield _this4.builder.buildRelationships([rc]);
      var result = yield _this4.engine.mergeRelationships([rel[0].getData()]);
      if (config.returnResult) return result[0];
      return result[0].getData()[0];
    })();
  }
  /**
   * Merges EnhancedNode into Neo4j.
   * Separates the building of Nodes/Relationships from their merging stage. You have to build EnhancedNodes
   * with new Builder().buildEnhancedNodes first and then merge with this method.
   *
   * @public
   * @param {EnhancedNode} enode - EnhancedNode to merge into Neo4j.
   * @param {Object} config - Configuration object.
   * @param {boolean} [config.returnResult=false] - {true} returns a Result with additional Neo4j query data.
   *
   * {false} returns EnhancedNode.
   *
   * @returns {Promise<Result|EnhancedNode>}
   * @example
   *
   * // This is a long way to do it.
   * // A shorter is to use mango.buildAndMergeEnhancedNode method.
   *
   * import { Builder, Mango, isEnhancedNode, log } from 'mango';
   *
   * const builder = new Builder();
   * const mango = new Mango({
   *  // pass engineConfig with Neo4j credentials
   * });
   *
   * // Merge a pattern to Neo4j:
   * // (:Person { NAME: "SpongeBob" })-[:HAS_FRIEND]->(:Person { NAME: "Patrick" })
   *
   * const person: EnhancedNode = builder.makeEnhancedNode(
   *   // specify core, or "start", node
   *   builder.makeNode(["Person"], { NAME: "SpongeBob" }),
   *   // specify relationships
   *   [
   *     builder.makeRelationshipCandidate(
   *       ["HAS_FRIEND"],
   *       // specify the endNode
   *       builder.makeNode(["Person"], { NAME: "Patrick" })
   *     ),
   *   ]
   * );
   *
   * const enode: EnhancedNode = await mango.mergeEnhancedNode(person);
   * log(isEnhancedNode(enode));  // true
   * log(enode.isWritten());      // true
   */


  mergeEnhancedNode(enode) {
    var _arguments5 = arguments,
        _this5 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var config = _arguments5.length > 1 && _arguments5[1] !== undefined ? _arguments5[1] : {};

      if ((0, _.not)((0, _.isEnhancedNode)(enode))) {
        throw new Error("Mango.mergeEnhancedNode: need an EnhancedNode as the first argument: ".concat(JSON.stringify(enode, null, 4)));
      }

      var result = yield _this5.engine.mergeEnhancedNodes([enode]);
      if (config.returnResult) return result[0];
      return result[0].getData()[0];
    })();
  }
  /**
   * Merges EnhancedNodes into Neo4j.
   * A batch variant of Mango.mergeEnhancedNode.
   *
   * @public
   * @param {EnhancedNode[]} enodes - EnhancedNode[] to merge into Neo4j.
   * @param {Object} config - Configuration object.
   * @param {boolean} [config.returnResult=false] - {true} returns a Result with additional Neo4j query data.
   *
   * {false} returns EnhancedNode[].
   *
   * @returns {Promise<Result|EnhancedNode[]>}
   * @example
   *
   * import { Builder, Mango, isEnhancedNode, log } from 'mango';
   *
   * const builder = new Builder();
   * const mango = new Mango({
   *  // pass engineConfig with Neo4j credentials
   * });
   *
   * // Merge a pattern to Neo4j:
   * // (:Person { NAME: "SpongeBob" })-[:HAS_FRIEND]->(:Person { NAME: "Patrick" })
   * // (:TVSeries { NAME: "SpongeBob SquarePants" })-[:HAS_WIKIPAGE]->(:Webpage { URL: "https://en.wikipedia.org/wiki/SpongeBob_SquarePants" })
   *
   * const person: EnhancedNode = builder.makeEnhancedNode(
   *   // specify core, or "start", node
   *   builder.makeNode(["Person"], { NAME: "SpongeBob" }),
   *   // specify relationships
   *   [
   *     builder.makeRelationshipCandidate(
   *       ["HAS_FRIEND"],
   *       // specify the endNode
   *       builder.makeNode(["Person"], { NAME: "Patrick" })
   *     ),
   *   ]
   * );
   *
   * const wiki: EnhancedNode = builder.makeEnhancedNode(
   *    builder.makeNode(["TVSeries"], { NAME: "SpongeBob SquarePants" }),
   *    [
   *      builder.makeRelationshipCandidate(
   *        ["HAS_WIKIPAGE"],
   *        builder.makeNode(["Webpage"], { URL: "https://en.wikipedia.org/wiki/SpongeBob_SquarePants" })
   *     ),
   *    ]
   * )
   *
   * const results: EnhancedNode[] = await mango.mergeEnhancedNodes([person, wiki]);
   * log(results.every(isEnhancedNode));  // true
   * log(results[0].isWritten());         // true
   * log(results[1].isWritten());         // true
   */


  mergeEnhancedNodes(enodes) {
    var _arguments6 = arguments,
        _this6 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var config = _arguments6.length > 1 && _arguments6[1] !== undefined ? _arguments6[1] : {};

      if ((0, _.not)((0, _lodash.isArray)(enodes))) {
        throw new Error("Mango.mergeEnhancedNode: need an Array as the first argument: ".concat((0, _utils.stringify)(enode, null, 4)));
      }

      if ((0, _.not)(enodes.every(_.isEnhancedNode))) {
        throw new Error("Mango.mergeEnhancedNode: need an EnhancedNode[] as the first argument: ".concat((0, _utils.stringify)(enode, null, 4)));
      }

      var result = yield _this6.engine.mergeEnhancedNodes(enodes);
      if (config.returnResult) return result;
      return result[0].getData();
    })();
  }
  /**
   * Builds and merges EnhancedNode (a subgraph) to Neo4j.
   * Ensures that specified pattern exists in Neo4j.
   * Allows a user-friendly declaration of a graph pattern that needs to be merged into Neo4j.
   *
   * @public
   * @param {SimplifiedEnhancedNode} graphPattern - a graph pattern (aka EnhancedNode) to be built and merged into Neo4j.
   * @param {boolean} [config.returnResult=false] - {true} returns a Result with additional Neo4j query data.
   *
   * {false} returns EnhancedNode.
   *
   * @returns {Promise<Result|EnhancedNode>}
   * @example
   *
   * import { Mango, isEnhancedNode, log } from 'mango';
   * const mango = new Mango({
   *  // pass engineConfig with Neo4j credentials
   * });
   *
   * // We want SpongeBob and Patrick to be friends:
   * // (:Person { NAME: "SpongeBob" })-[:HAS_FRIEND]->(:Person { NAME: "Patrick" })
   *
   * let spongeBob: EnhancedNode = await mango.buildAndMergeEnhancedNode({
   *  labels: ["Person"],
   *  properties: { NAME: "Sponge Bob" },
   *  relationships: [
   *    {
   *      labels: ["HAS_FRIEND"],
   *      partnerNode: { labels: ["Person"], properties: { NAME: "Patrick" } },
   *    },
   *  ],
   * });
   *
   * log(isEnhancedNode(spongeBob)); // true
   * log(spongeBob.isWritten());     // true <- pattern is written to Neo4j
   *
   *
   * // Patterns can be however deep.
   * // (:City { NAME: "Bikini Bottom" })<-[:LIVES_IN]-(:Person { NAME: "SpongeBob" })-[:HAS_FRIEND]->(:Person { NAME: "Patrick" })-[:LIVES_IN]->(:City { NAME: "Bikini Bottom" })
   *
   * let bikiniBottom = {
   *  labels: ["City"],
   *  properties: { NAME: "Bikini Bottom" },
   * };
   *
   * let spongeBob: EnhancedNode = await mango.buildAndMergeEnhancedNode({
   *  labels: ["Person"],
   *  properties: { NAME: "SpongeBob" },
   *  relationships: [
   *     {
   *       labels: ["LIVES_IN"],
   *       partnerNode: bikiniBottom,
   *     },
   *     {
   *       labels: ["HAS_FRIEND"],
   *       partnerNode: {
   *         labels: ["Person"],
   *         properties: { NAME: "Patrick" },
   *         relationships: [
   *           {
   *             labels: ["LIVES_IN"],
   *             partnerNode: bikiniBottom,
   *           },
   *         ],
   *       },
   *     },
   *   ],
   * });
   *
   * log(isEnhancedNode(spongeBob));                  // true
   * log(spongeBob.isWritten());                      // true
   * log(spongeBob.getParticipatingRelationships());  // 3 <- we merged 3 Relationships
   */


  buildAndMergeEnhancedNode(_ref) {
    var _arguments7 = arguments,
        _this7 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var {
        labels,
        properties,
        relationships
      } = _ref;
      var config = _arguments7.length > 1 && _arguments7[1] !== undefined ? _arguments7[1] : {};

      /* there may be no relationships */
      relationships = relationships || [];

      var enode = _this7.builder.makeEnhancedNode({
        labels,
        properties
      }, relationships);

      var result = yield _this7.engine.mergeEnhancedNodes([enode]);
      if (config.returnResult) return result[0];
      return result[0].getData()[0];
    })();
  }
  /**
   * Builds and batch merges multiple EnhancedNodes (aka subgraph) to Neo4j.
   * Allows a user-friendly declaration of a graph pattern that will be merged into Neo4j.
   *
   * @public
   * @param {SimplifiedEnhancedNode[]} graphPattern - a graph pattern (aka EnhancedNodes) to be built and merged into Neo4j.
   * @param {boolean} [config.returnResult=false] - {true} returns a Result with additional Neo4j query data.
   *
   * {false} returns EnhancedNode.
   *
   * @returns {Promise<Result|EnhancedNode[]>}
   * @example
   *
   * import { Mango, isEnhancedNode, log } from 'mango';
   * const mango = new Mango({
   *  // pass engineConfig with Neo4j credentials
   * });
   *
   * // Create the following pattern in Neo4j:
   * // (:Person { NAME: "SpongeBob" })-[:HAS_FRIEND]->(:Person { NAME: "Patrick" })
   * // (:TVSeries { NAME: "SpongeBob SquarePants" })-[:HAS_WIKIPAGE]->(:Webpage { URL: "https://en.wikipedia.org/wiki/SpongeBob_SquarePants" })
   *
   * let [spongeBob, tvseries]: [EnhancedNode, EnhancedNode] =
   *    await mango.buildAndMergeEnhancedNodes([
   *      // (:Person { NAME: "SpongeBob" })-[:HAS_FRIEND]->(:Person { NAME: "Patrick" })
   *      {
   *       labels: ["Person"],
   *       properties: { NAME: "Sponge Bob" },
   *       relationships: [
   *         {
   *           labels: ["HAS_FRIEND"],
   *           partnerNode: { labels: ["Person"], properties: { NAME: "Patrick" } },
   *         },
   *       ],
   *      }
   *
   *      // (:TVSeries { NAME: "SpongeBob SquarePants" })-[:HAS_WIKIPAGE { isToLong: true }]
   *      // ->(:Webpage { URL: "https://en.wikipedia.org/wiki/SpongeBob_SquarePants" })
   *      {
   *       labels: ["TVSeries"],
   *       properties: { NAME: "SpongeBob SquarePants" },
   *       relationships: [
   *         {
   *           labels: ["HAS_WIKIPAGE"],
   *           properties: { isTooLong: true },
   *           partnerNode: {
   *             labels: ["Webpage"],
   *             properties: {
   *               URL: "https://en.wikipedia.org/wiki/SpongeBob_SquarePants"
   *             }
   *           },
   *         },
   *       ],
   *      }
   *      ]);
   *
   * log(isEnhancedNode(spongeBob));  // true
   * log(spongeBob.isWritten());      // true <- pattern is written to Neo4j
   * log(isEnhancedNode(tvseries));   // true
   * log(tvseries.isWritten());       // true <- pattern is written to Neo4j
   */


  buildAndMergeEnhancedNodes(graphPatterns) {
    var _arguments8 = arguments,
        _this8 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var config = _arguments8.length > 1 && _arguments8[1] !== undefined ? _arguments8[1] : {};

      var makeEnhancedNode = _this8.builder.makeEnhancedNode.bind(_this8.builder);

      var enodes = graphPatterns.map(_processGraphPattern);
      var results = yield _this8.engine.mergeEnhancedNodes(enodes);
      if (config.returnResult) return results;
      return results.map(result => result.getData()[0]);
      /* Local Functions
      _________________________________________________________*/

      function _processGraphPattern(_ref2) {
        var {
          labels,
          properties,
          relationships
        } = _ref2;

        /* there may be no relationships */
        relationships = relationships || [];
        var enode = makeEnhancedNode({
          labels,
          properties
        }, relationships);
        return enode;
      }
    })();
  }
  /**
   * Removes Node/EnhancedNode and all its Relationships from Neo4j.
   *
   * @public
   * @param {Node|EnhancedNode} node - Node to delete.
   * @param {Object} config - Configuration object.
   * @param {boolean} [config.archiveNodes=false] - {true} does not actually delete anything from Neo4j. Instead it sets { _isCurrent: false, _dateArchived: TimeArray } on Node & all its Relationships to signify that the Node has been archived and does not represent current state of domain knowledge.
   *
   * {false} permanently deletes Nodes and all its Relations.
   *
   * @param {boolean} [config.returnResult=false] - {true} returns a Result.
   *
   * {false} return deleted EnhancedNode.
   *
   * @returns {Promise<Result|EnhancedNode>}
   * @example
   *
   * import { Mango, log } from 'mango';
   * const mango = new Mango({
   *  // pass engineConfig with Neo4j credentials
   * });
   *
   * // mango.findNode returns EnhancedNode[], so we will grab the first result.
   * const [bob]: EnhancedNode = await mango.findNode(["Person"], { FULL_NAME: 'SpongeBob SquarePants' });
   *
   * // result is an EnhancedNode that also specifies all Relationships that were affected.
   * const result: EnhancedNode = await mango.deleteNode(bob);
   *
   * log(isEnhancedNode(result));                // true
   * log(result.getProperty('_hasBeenDeleted')); // true
   * log(result.getProperty('_whenWasDeleted')); // [year, month, day, weekday, timestamp]
   * log(result.getProperty('_isArchived'));     // false
   */


  deleteNode(node) {
    var _arguments9 = arguments,
        _this9 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var config = _arguments9.length > 1 && _arguments9[1] !== undefined ? _arguments9[1] : {};

      /* validations */
      if ((0, _.not)((0, _.isNode)(node)) || (0, _.not)((0, _.isEnhancedNode)(node))) {
        throw new Error("Mango.deleteNode: need a Node|EnhancedNode as first argument: ".concat(JSON.stringify(node, null, 4)));
      }
      /* !validations */


      if (config.archiveNodes) {
        throw new Error("Mango.deleteNode: { archiveNodes: true } not yet implemented!");
      } else {
        var results = yield _this9.engine.deleteNodes([node], {
          deletePermanently: true
        });
        /* As engine.deleteNodes returns Success.data = EnhancedNode[] but
        users expect only one EnhancedNode, we unwrap and return 
        Success.data = EnhancedNode
        */

        var rv = results[0];
        rv.data = results[0].getData();

        if (config.returnResult) {
          return rv;
        }

        return rv.getData()[0];
      }
    })();
  }
  /**
   * A shortcut to create a search condition.
   *
   * @public
   * @static
   * @param {string} condition - Condition for value search ( > < >= <= == etc. ).
   * @param {any} value - Searched value.
   * @returns {ConditionContainer}
   */


  static search(condition, value) {
    return new ConditionContainer(condition, value);
  }
  /**
   * Helper method to classify a POJO's properties into REQUIRED/optional/_private types.
   * Used by Mango to create unique Nodes based on REQUIRED properties.
   *
   * @public
   * @param {Object} props - Properties object to decompose.
   * @param {Object} config - Configuration object.
   * @param {boolean} [config.asArray=false] - Return array instead of object.
   * @returns {{ requiredProps: Object, optionalProps: Object, privateProps: Object }|[requiredProps, optionalProps, privateProps]}
   * @example
   *
   * import { Mango, isEnhancedNode, log } from 'mango';
   *
   * const mango = new Mango({
   *  // pass engineConfig with Neo4j credentials
   * });
   *
   * const props = {
   *  SOMETHINGIMPORTANT: 'foo',
   *  somethingOptional: 'bar',
   *  _andSomePrivateProp: 'kek'
   * }
   *
   * const rv = mango.decomposeProps(props);
   * log(rv);
   * // {
   * //  requiredProps: { SOMETHINGIMPORTANT: 'foo' },
   * //  optionalProps: { somethingOptional: 'bar' },
   * //  privateProps: { _andSomePrivateProp: 'kek' },
   * // }
   *
   * const rv2 = mango.decomposeProps(props, { asArray: true });
   *
   * log(rv2);
   * // [ { SOMETHINGIMPORTANT: 'foo' }, { somethingOptional: 'bar' }, { _andSomePrivateProp: 'kek' } ]
   */


  decomposeProps(props, config) {
    return (0, _utils.decomposeProps)(props, config);
  }

}
/**
 * Represents a searched value and its search condition.
 *
 * @public
 * @param {string} condition - Condition for value search ( > < >= <= == etc. ).
 * @param {any} value - Searched value.
 */


exports.Mango = Mango;

class ConditionContainer {
  constructor(condition, value) {
    this.condition = condition;
    this.value = value;
  }
  /**
   * Helper method to check value's type.
   *
   * @public
   * @returns value type
   */


  getType() {
    return typeof this.value;
  }
  /**
   * Helper method to unwrap value.
   *
   * @public
   * @returns {Object} - { condition: value }.
   */


  toObject() {
    return {
      [this.condition]: this.value
    };
  }

}
/**
   * @private
   * 
   * @idea Mango.buildDeepSimplifiedEnhancedNode will help transform SimplifiedEnhancedNode[] into a mergeable 
   * deep EnhancedNode. 
   * 
   * @param {SimplifiedEnhancedNode[]} arr 
   * @param {(startEnode, endEnode) => SimplifiedRelationship} fn - receives parent and child nodes and returns an object to use to describe relationship between them
   * @returns {SimplifiedEnhancedNode}
   * 
   * @example
   */


function buildDeepSimplifiedEnhancedNode(arr, fn) {
  var [startNode, ...descendants] = arr;

  var acc = _objectSpread(_objectSpread({}, startNode), {}, {
    relationships: []
  }); // if no acc, take first el as acc and remove it from array


  if (descendants && descendants.length) {
    // describe relationship
    if (fn && typeof fn === 'function') {
      return _objectSpread(_objectSpread({}, acc), {}, {
        relationships: [_objectSpread(_objectSpread({}, fn(startNode, descendants[0])), {}, {
          partnerNode: buildDeepSimplifiedEnhancedNode(descendants, fn)
        })]
      });
    }

    return _objectSpread(_objectSpread({}, acc), {}, {
      relationships: [{
        labels: ['NEXT'],
        partnerNode: buildDeepSimplifiedEnhancedNode(descendants, fn)
      }]
    });
  }

  return acc;
}

Mango.prototype.buildDeepSimplifiedEnhancedNode = buildDeepSimplifiedEnhancedNode;
var search = Mango.search;
exports.search = search;