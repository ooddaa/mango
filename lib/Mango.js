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
 * Mango is a user-friendly Object-To-Graph Mapper build on top of Neo4j's official
 * JavaScript Driver.
 *
 * At this moment [2022-02-22] the version 1.0.1 is opinionated insofar as its main
 * purpose has been to help build Knowledge Graphs (aka KG). These KGs would be based on
 * preserving unique Entities (aka Nodes) and Relationships between Nodes.
 *
 * The key driving motive was to design a tool which would help ensure that there are no
 * copies of the same Node.
 *
 * The idea came up when I worked for a family office and was dealing with bits and pieces
 * of data coming across my desk. I noticed that I would spend most of my time and effort
 * not on the value-generating activities relating to the data, but on solving questions
 * like:
 *  - What is the correct full address of Person X?
 *  - Did we send that document to Y?
 *  - Where can I find Z?
 *
 * It was obvious that the solutions to these questions (99% of time that would be a
 * source document, or colleague's advice) resided within my colleague's minds or on their
 * desktops/emails.
 *
 * We did have an old and limited database that had some records of some legal entities
 * and natural persons - but to use that knowledge it had to be checked and double-checked
 * with colleagues first. Which in 50% of situations required them requesting the info from
 * their counterparties.
 *
 * The problem was that once all the effort was made and the relevant info was received,
 * verified and utilized, it was simply forgotten until the next time when same problem
 * arrived. And when it did, usually after a prolonged period of time, no one could easily
 * locate the previous result to reduce the amount of cognitive work.
 *
 * Simple solution was to agree to share all such hard-earned knowledge, but:
 *
 *  - There was no simple way to do it. We tried Confluence - but it required a learning
 *    curve that no one wanted. Everyone want to go on writing emails and making phone calls.
 *  - No one wants to archive. Archiving is a difficult mental work which is not rewarded
 *    in an obvious, immediate way. Therefore no one does it. This creates a huge (but
 *    familiar) tech debt in a form of knowledge search, repeating same work that already
 *    has been done. On the upside this is how office workers1.0 justify the time they spend
 *    in the office getting paid.
 *
 *
 * @class Main class for the user to operate.
 * @public
 * @module Mango
 * @see module:Builder
 * @see module:Engine
 * @param {Object} config - Configuration object.
 * @param {Engine} config.engine - Instance of an Engine class. If none is supplied, Mango will look for config.engineConfig. If that does not exist or is unusable, a NoEngineError will be thrown.
 * @param {Object} config.engineConfig - Configuration object to instantiate connection to Neo4j.
 * @param {string} config.engineConfig.username - Neo4j DBMS username.
 * @param {string} config.engineConfig.password - Neo4j DBMS password.
 * @param {string} config.engineConfig.ip - Neo4j DBMS IP to connect to. Default: '0.0.0.0'.
 * @param {string} config.engineConfig.port - Neo4j DBMS port to connect to. Default: '7687'.
 * @param {string} config.engineConfig.database - Neo4j DBMS database name to use. Default: 'neo4j'.
 *
 * @param {Builder} config.builder - Instance of a Builder class. If none is supplied, a generic one will be instantiated for you.
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

    if ((0, _.isMissing)(config.engine) && this._isEngineConfigUsable(config.engineConfig) == false) {
      throw new _Errors.NoEngineError("Mango.constructor: do not have a usable Engine instance.");
    }

    this.engine = config.engine || this._initEngine(config.engineConfig);
    this.builder = config.builder || new _.Builder();
  }
  /**
   * @private
   * @param {Object} engineConfig - Configuration object to authenticate and initiate Neo4j driver.
   * @returns {boolean}
   */


  _isEngineConfigUsable(engineConfig) {
    /***@todo implement */
    // { neo4jUsername, neo4jPassword, ip, port, database }
    return false;
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
   * Main method to search for data in Neo4j.
   *
   * @public
   * @param {string[]} labels - Array of labels to match Nodes by.
   * @param {Object} props - A POJO containing key:value to search for matches.
   * @param {Object} config - Configuration object.
   * @param {boolean} [config.exactMatch=false] - {true} Mango searches for exactly what we specified, ie the returned Nodes must not have any extra properties above supplied labels & properties. You get exactly what you asked for.
   *
   * {false} Mango matches any Nodes that have supplied labels and properties and the returned result may contain Nodes with extra properties. You may get more than you asked for.
   * @param {boolean} [config.returnResult=false] - {true} returns a Result with additional Neo4j query data.
   *
   * {false} return Node[].
   *
   * @returns {Promise<Result|Node[]>}
   * @example
   *
   * const rv =
   *  mango
   *  .findNode(["Person"], { NAME: 'Bob' })
   *  .then(nodes => {
   *    console.log(nodes.length) // 2 <- we found 2 Nodes with NAME == 'Bob'
   *    console.log(nodes[0].getProperty("fullName")) // Bob Dylan
   *    console.log(nodes[1].getProperty("fullName")) // Bob Marley
   *  })
   */


  findNode(labels, props) {
    var _arguments = arguments,
        _this = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var config = _arguments.length > 2 && _arguments[2] !== undefined ? _arguments[2] : {};

      var {
        requiredProps,
        optionalProps,
        privateProps
      } = _this.decomposeProps(props);

      if (config.exactMatch) {
        var node = _this.builder.makeNode(labels, requiredProps, optionalProps, privateProps);

        var _result = yield _this.engine.matchNodes([node]);

        if (config.returnResult) return _result[0];
        return _result[0].getData();
      } // not an exact match, use engine.matchPartialNodes
      // create PartialNodes


      var pnode = _this.builder.buildPartialNodes([{
        labels,
        properties: _objectSpread({}, _this._buildSearchedProps(props))
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


      var result = yield _this.engine.matchPartialNodes([pnode[0].getData()]);

      if (config.returnResult) {
        (0, _.log)("final 2");
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
   * {false} returns Node[].
   * @todo - allow opting out of Uniqueness Requirement.
   * @returns {Promise<Result|EnhancedNode>}
   * @example
   * const node =
   *  await mango.buildAndMergeNode(["Product"], { NAME: "Sweet Mango" });
   *
   *  console.log(node.isWritten());  // true <- Neo4j has a (Product { NAME: "Sweet Mango", _hash:str, _uuid:str, _date_created: TimeArray })
   *  console.log(node.getId());      // 1 <- Neo4j's Id for this Node
   */


  buildAndMergeNode(labels, props) {
    var _arguments2 = arguments,
        _this2 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var config = _arguments2.length > 2 && _arguments2[2] !== undefined ? _arguments2[2] : {};

      var {
        requiredProps,
        optionalProps,
        privateProps
      } = _this2.decomposeProps(props);

      var node = _this2.builder.makeNode(labels, requiredProps, optionalProps, privateProps);

      var result;

      try {
        result = yield _this2.engine.mergeNodes([node]);
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
   * @param {SimplifiedRelationshipArray|SimplifiedRelationshipObject} relationship - [["REL_TYPES"], "required" | "optional", { relProps } ] | { labels: string[], properties: Object, necessity: "required" | "optional" }.
   * @param {Node|EnhancedNode} endNode - Node that has an inbound Relationship.
   * @param {Object} config - Configuration object.
   * @param {boolean} [config.returnResult=false] - {true} returns a Result with additional Neo4j query data.
   *
   * {false} returns Relationship.
   *
   * @returns {Promise<Result|Relationship>}
   * @example
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
   * // exists
   * console.log(relationship.isWritten()) // true
   *
   */


  buildAndMergeRelationship(startNode, relationship, endNode) {
    var _arguments3 = arguments,
        _this3 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var config = _arguments3.length > 3 && _arguments3[3] !== undefined ? _arguments3[3] : {};

      /* ensure we have a usable startNode */
      var startNodeToUse;

      if ((0, _.isNode)(startNode)) {
        // case: we have a Node
        startNodeToUse = startNode;
      } else if ((0, _lodash.isArray)(startNode)) {
        // case: [["Product"], { NAME: "Bediol" }],
        var unwrittenStartNode = _this3.builder.makeNode(...startNode);

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
        var unwrittenEndNode = _this3.builder.makeNode(...endNode);

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
      var rel = yield _this3.builder.buildRelationships([rc]);
      var result = yield _this3.engine.mergeRelationships([rel[0].getData()]);
      if (config.returnResult) return result[0];
      return result[0].getData()[0];
    })();
  }
  /**
   * Merges EnhancedNode into Neo4j. Ensures that specified pattern exists in Neo4j.
   * Separates building of Nodes/Relationships from their merging.
   *
   * @public
   * @param {EnhancedNode} enode - EnhancedNode to merge into Neo4j.
   * @param {Object} config - Configuration object.
   * @param {boolean} [config.returnResult=false] - {true} returns a Result with additional Neo4j query data.
   *
   * {false} returns Relationship.
   *
   * @returns {Promise<Result|EnhancedNode>}
   * @example
   *
   * // Merge a pattern to Neo4j:
   * // (:Person { NAME: "SpongeBob" })-[:HAS_FRIEND]->(:Person { NAME: "Patrick" })
   *
   * let person: EnhancedNode = builder.makeEnhancedNode(
   *   builder.makeNode(["Person"], { NAME: "SpongeBob" }),
   *   [
   *     builder.makeRelationshipCandidate(
   *       ["HAS_FRIEND"],
   *       // or use
   *       // builder.makeNode(["Person"], { NAME: "Patrick" })
   *       await mango.buildAndMergeNode(["Person"], { NAME: "Patrick" })
   *     ),
   *   ]
   * );
   */


  mergeEnhancedNode(enode) {
    var _arguments4 = arguments,
        _this4 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var config = _arguments4.length > 1 && _arguments4[1] !== undefined ? _arguments4[1] : {};

      if ((0, _.not)((0, _.isEnhancedNode)(enode))) {
        throw new Error("Mango.mergeEnhancedNode: need an EnhancedNode as the first argument: ".concat(JSON.stringify(enode, null, 4)));
      }

      var result = yield _this4.engine.mergeEnhancedNodes([enode]);
      if (config.returnResult) return result[0];
      return result[0].getData()[0];
    })();
  }
  /**
   * Builds and merges EnhancedNode (a subgraph) to Neo4j.
   * Ensures that specified pattern exists in Neo4j.
   * Allows a user-friendly declaration of a graph pattern that needs to be merged into Neo4j.
   *
   * @public
   * @param {SimplifiedEnhancedNodeObject} graphPattern - a graph pattern (aka EnhancedNode) to be built and merged into Neo4j.
   * @param {boolean} [config.returnResult=false] - {true} returns a Result with additional Neo4j query data.
   *
   * {false} returns Relationship.
   *
   * @returns {Promise<Result|EnhancedNode>}
   * @example
   *
   * import { isEnhancedNode, log } from 'mango';
   *
   * // Create the following pattern in Neo4j:
   * // (:Person { NAME: "SpongeBob" })-[:HAS_FRIEND]->(:Person { NAME: "Patrick" })
   *
   * let person: EnhancedNode = await mango.buildAndMergeEnhancedNode({
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
   * log(isEnhancedNode(person)); // true
   * log(person.isWritten());     // true <- pattern is written to Neo4j
   */


  buildAndMergeEnhancedNode(graphPattern) {
    var _arguments5 = arguments,
        _this5 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var config = _arguments5.length > 1 && _arguments5[1] !== undefined ? _arguments5[1] : {};

      var {
        requiredProps,
        optionalProps,
        privateProps
      } = _this5.decomposeProps(graphPattern.properties);

      var enode = _this5.builder.makeEnhancedNode(_this5.builder.makeNode(graphPattern.labels, requiredProps, _objectSpread(_objectSpread({}, optionalProps), privateProps)), [...graphPattern.relationships.map(relObject => {
        var {
          requiredProps,
          optionalProps,
          privateProps
        } = _this5.decomposeProps(relObject.partnerNode.properties);

        return _this5.builder.makeRelationshipCandidate(relObject.labels, _this5.builder.makeNode(relObject.partnerNode.labels, requiredProps, _objectSpread(_objectSpread({}, optionalProps), privateProps)));
      })]);

      var result = yield _this5.engine.mergeEnhancedNodes([enode]);
      if (config.returnResult) return result[0];
      return result[0].getData()[0];
    })();
  }
  /**
   * Removes Node/EnhancedNode and all its Relationships from Neo4j.
   *
   * @public
   * @param {Node|EnhancedNode} node - Node to delete.
   * @param {Object} config - Configuration object.
   * @param {boolean} [config.archiveNodes=false] - {true} does not delete anything. Instead it sets { _isCurrent: false, _dateArchived: TimeArray } on Node & all its Relationships.
   *
   * {false} permanently deletes Nodes and all its Relations.
   *
   * @returns {Promise<Result>} - Returns Result where Result.data contains affected Node and its Relationships.
   * @example
   *
   * const mango = new Mango({ engineConfig });
   * const bob = await mango.findNode(["Person"], { fullName: 'SpongeBob SquarePants' });
   * const rv =
   *  mango
   *  .deleteNode(bob)
   *  .then(node => {
   *    // node == EnhancedNode that specifies all Relationships that were affected
   *    console.log(node.getProperty('_hasBeenDeleted')); // true
   *    console.log(node.getProperty('_whenWasDeleted')); // [year, month, day, weekday, timestamp]
   *    console.log(node.getProperty('_isArchived')); // false
   *  })
   */


  deleteNode(node) {
    var _arguments6 = arguments,
        _this6 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var config = _arguments6.length > 1 && _arguments6[1] !== undefined ? _arguments6[1] : {};

      /* validations */
      if ((0, _.not)((0, _.isNode)(node)) || (0, _.not)((0, _.isEnhancedNode)(node))) {
        throw new Error("Mango.deleteNode: need a Node|EnhancedNode as first argument: ".concat(JSON.stringify(node, null, 4)));
      }
      /* !validations */


      if (config.archiveNodes) {
        throw new Error("Mango.deleteNode: { archiveNodes: true } not yet implemented!");
      } else {
        var results = yield _this6.engine.deleteNodes([node], {
          deletePermanently: true
        });
        /* As engine.deleteNodes returns Success.data = EnhancedNode[] but
        users expect only one EnhancedNode, we unwrap and return 
        Success.data = EnhancedNode
        */

        var rv = results[0];
        rv.data = results[0].getData()[0];
        return rv;
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
   * A shortcut to create a search condition.
   * A non-static version of static search.
   *
   * @public
   * @param {string} condition - Condition for value search ( > < >= <= == etc. ).
   * @param {any} value - Searched value.
   * @returns {ConditionContainer}
   */


  is(condition, value) {
    return this.search(condition, value);
  }
  /**
   * Helper method to classify a POJO's properties into REQUIRED/optional/_private types.
   * Used by Mango to create unique Nodes based on REQUIRED properties.
   *
   * @public
   * @param {Object} props
   * @returns {{ requiredProps: Object, optionalProps: Object, privateProps: Object }}
   * @example
   *
   * const rv = new Mango().decomposeProps({
   *  SOMETHINGIMPORTANT: 'foo',
   *  somethingOptional: 'bar',
   *  _andSomePrivateProp: 'kek'
   *  });
   * console.log(rv);
   * // {
   * //  requiredProps: { SOMETHINGIMPORTANT: 'foo' },
   * //  optionalProps: { somethingOptional: 'bar' },
   * //  privateProps: { _andSomePrivateProp: 'kek' },
   * // }
   */


  decomposeProps(props) {
    return {
      requiredProps: (0, _utils.getRequiredProperties)(props),
      optionalProps: (0, _utils.getOptionalProperties)(props),
      privateProps: (0, _utils.getPrivateProperties)(props)
    };
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

var search = Mango.search;
exports.search = search;