"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toNumber = exports.isInt = exports.int = exports.inSafeRange = exports.Engine = void 0;
exports.wrapper = wrapper;

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _crypto = _interopRequireDefault(require("crypto"));

var _ = require("../");

var _EnhancedNode = require("../Builder/templates/EnhancedNode");

var _Node = require("../Builder/templates/Node");

var _PartialNode = require("../Builder/templates/PartialNode");

var _Relationship = require("../Builder/templates/Relationship");

var _RelationshipCandidate = require("../Builder/templates/RelationshipCandidate");

var _Result = require("../Result");

var _utils = require("../utils");

var _lodash = require("lodash");

var _cloneDeep = _interopRequireDefault(require("lodash/cloneDeep"));

var _flattenDeep = _interopRequireDefault(require("lodash/flattenDeep"));

var _has = _interopRequireDefault(require("lodash/has"));

var _isNumber = _interopRequireDefault(require("lodash/isNumber"));

var _keys = _interopRequireDefault(require("lodash/keys"));

var _values = _interopRequireDefault(require("lodash/values"));

var _zip = _interopRequireDefault(require("lodash/zip"));

var _uniq = _interopRequireDefault(require("lodash/uniq"));

var _identity = _interopRequireDefault(require("lodash/identity"));

var _forIn = _interopRequireDefault(require("lodash/forIn"));

var _uuid = require("uuid");

var _isArray = _interopRequireDefault(require("lodash/isArray"));

var _isString = _interopRequireDefault(require("lodash/isString"));

var _isObject = _interopRequireDefault(require("lodash/isObject"));

var _EnhancedNodeCandidate = require("../Builder/templates/EnhancedNodeCandidate");

var _neo4jDriverCore = require("neo4j-driver-core");

var _fs = _interopRequireDefault(require("fs"));

var _lib = _interopRequireDefault(require("neo4j-driver/lib/"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

var {
  int,
  isInt,
  integer: {
    toNumber,
    inSafeRange
  }
} = _lib.default;
exports.inSafeRange = inSafeRange;
exports.toNumber = toNumber;
exports.isInt = isInt;
exports.int = int;
var log = (0, _utils.superlog)(__dirname, {
  showDirectory: true
});
var NEO4J_RETURNED_NULL = "Neo4j returned null.";
var sessionPool = {};
/* TYPES */

/**
 * @public
 * @class
 * Main class to handle all transactions with Neo4j.
 *
 * @param {Object} config - Configuration object.
 * @param {string} config.neo4jUsername - Database username.
 * @param {string} config.neo4jPassword - Password.
 * @param {string} [config.ip='0.0.0.0'] - IP of Neo4j's running DBMS.
 * @param {string} [config.port='7867'] - Port to connect.
 * @param {string} [config.database='neo4j'] - Neo4j database to use.
 * @param {Driver} [config.driver='neo4j-driver'] - Instance of Neo4j JS driver database to use. Default - Neo4j official JS driver.
 *
 * @example
 *
 * import { Engine } from 'mango';
 *
 * const engine = new Engine({
 *  neo4jUsername: 'mangocat',
 *  neo4jPassword: '🙈',
 *  ip: '1.2.3.4',
 *  port: '7687,
 *  database: 'fruits',
 * })
 */
class Engine {
  constructor() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    /* Allow users to supply their custom driver */
    if ((0, _utils.isMissing)(config.driver)) {
      if ((0, _utils.isMissing)(config.neo4jUsername)) {
        throw new Error("Engine: user must supply a valid Neo4j DBMS user name.\nneo4jUsername: ".concat(config.neo4jUsername));
      }

      if ((0, _utils.isMissing)(config.neo4jUsername)) {
        throw new Error("Engine: user must supply a valid Neo4j DBMS password.\nneo4jPassword: ".concat(config.neo4jPassword));
      }
    }

    this.neo4jUsername = config.neo4jUsername;
    this.neo4jPassword = config.neo4jPassword;
    this.ip = config.ip || "0.0.0.0";
    this.port = config.port || "7687";
    this.database = config.database || "neo4j";
    this.sessionPool = {};
  }
  /* DRIVER SETUP */

  /**
   * Instantiates Neo4j's official JavaScript Driver
   * https://neo4j.com/docs/api/javascript-driver/current/
   *
   * Props: https://neo4j.com/docs/api/javascript-driver/current/function/index.html#static-function-driver
   */


  startDriver(props) {
    try {
      var driver;
      var args = ["bolt://".concat(this.ip, ":").concat(this.port), _lib.default.auth.basic(this.neo4jUsername, this.neo4jPassword), _objectSpread({
        encrypted: "ENCRYPTION_OFF"
      }, props)];

      if (this.driver) {
        // if (not(isFunction(this.driver))) {
        if ((0, _utils.not)((0, _lodash.isFunction)(this.driver))) {
          /* make it obvious - user wanted to supply driver but it failed. */
          throw new Error("Engine.startDriver: driver not a Function.\nthis.driver: ".concat(JSON.stringify(this.driver, null, 4)));
        }
        /* flowJs, calm down, we know that this.driver IS a Function here */


        driver = this.driver && this.driver(...args);
      } else {
        driver = _lib.default.driver(...args);
      }
      /* when invoked manually */


      this.driver = driver;
      /* when invoked via constructor */

      return driver;
    } catch (error) {
      console.error(error);
      throw new Error("Engine.startDriver: could not instantiate driver.\nerror: ".concat(error));
    }
  }
  /**
   * We can check if dtabase is available.
   * https://neo4j.com/docs/api/javascript-driver/current/file/lib6/driver.js.html
   */


  verifyConnectivity() {
    var _arguments = arguments,
        _this = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var config = _arguments.length > 0 && _arguments[0] !== undefined ? _arguments[0] : {};

      if (_this.driver) {
        return config.database && (0, _isString.default)(config.database) ? yield _this.driver.verifyConnectivity({
          database: config.database
        }) : yield _this.driver.verifyConnectivity();
      } else {
        return {
          address: null,
          version: null
        };
      }
    })();
  }
  /* TOOLS */


  getConditionMapping() {
    return {
      e: "=",
      "=": "=",
      ne: "<>",
      "<>": "<>",
      lt: "<",
      "<": "<",
      gt: ">",
      ">": ">",
      let: "<=",
      "<=": "<=",
      get: ">=",
      ">=": ">=",
      in: "IN",
      IN: "IN",
      nin: "NIN",
      NIN: "NIN",
      not: "NOT",
      NOT: "NOT",
      and: "AND",
      AND: "AND",
      containsall: "CONTAINSALL",
      CONTAINSALL: "CONTAINSALL",
      containsany: "CONTAINSANY",
      CONTAINSANY: "CONTAINSANY",
      not_contains: "NOT_CONTAINS",
      NOT_CONTAINS: "NOT_CONTAINS",
      CONTAINS: "CONTAINS",
      contains: "contains",
      "~": "~",
      "=~": "=~"
    };
  }
  /**
   * Used to make hash of Label + REQUIRED properties for later Node identification in mergeNodes.
   * @param {string} data
   */


  hasher(data) {
    var hash = _crypto.default.createHash("sha256");

    hash.update(data);
    var result = hash.digest("hex");
    return result;
  }
  /**
   * Handles session creation and pooling.
   * Sessions are created for this.database, unless user supplies their option.
   *
   * @param {Object} config - Configuration object.
   * @param {string} [config.database='neo4j'] - Database to create a session for.
   * @returns {{ session: Session, sessionId: str }}
   */


  createSession() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      database: "neo4j"
    };

    /* create a session */
    var session;

    if (this.driver) {
      session = config.database && (0, _isString.default)(config.database) ? this.driver.session({
        database: config.database
      }) : this.driver.session({
        database: this.database
      });
    } else {
      throw new Error("Engine.createSession: driver is not available.\nthis.driver: ".concat(JSON.stringify(this.driver, null, 4)));
    }
    /* save into pool */


    var sessionId = (0, _uuid.v4)();
    this.sessionPool[sessionId] = session;
    return {
      session,
      sessionId
    };
  }
  /**
   * Gracefully closes the session.
   *
   * @param {Object} config - Configuration object.
   * @param {Session} config.session - Active Session.
   * @param {string|null} config.sessionId - Session's id if available.
   * @returns {Result}
   */


  closeSession() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    /**@todo omg why do we need to call this? should place all logic here. */
    return closeSession({
      session: config.session,
      sessionId: config.sessionId
    });
  }
  /**
   * Closes all active sessions.
   *
   * @returns Result
   */


  closeAllSessions() {
    (0, _forIn.default)(this.sessionPool, (val, key) => {
      try {
        val.close();
        delete this.sessionPool[key];
      } catch (e) {
        throw new Error("Engine.closeAllSessions errored:\nmessage: ".concat(JSON.stringify(e, null, 4)));
      }
    });
    return new _Result.Success({
      /**@todo data interface Success.data != Array<T> */
      data: this.sessionPool,
      parameters: {
        dataDescription: "return new Success({ data: this.sessionPool })"
      }
    });
  }
  /**
   * Closes driver. Evoke when program/test exits
   * @returns Result
   */


  closeDriver() {
    return closeDriver(this.driver);
  }
  /* METHODS */

  /**
   * Main query runner.
   * Implements OLRi (One Level Result Interface) where Result.data =
   * [Nodes|EnhancedNodes|Relationships]
   * @todo find a way to get rid of all Integers.
   * @param {Object} config - Configuration object.
   * @param {string} config.query - Cypher query to execute against the database.
   * @param {Object} [config.parameters={}] - Parameters to use with Cypher query.
   * @param {boolean} [config.closeConnection=false] - Close execution session.
   * @param {boolean} [config.wrap=true] - Wrap Neo4j Nodes and Relationships in Mango classes?
   * @param {boolean} [config.returnSuccess=true] - Passed to wrapper to return Success[] instead of Class[].
   * @param {string} [config.database='neo4j'] - Pass a database name, or use default - neo4j.
   * @param {Session} [config.session=Session] - Pass a session, or one will be created for you.
   * @param {boolean} [config._testRetry=false] - For testing re-try logic.
   * @param {boolean} [config.raw=false] - Return raw Neo4j response. Does not apply wrapper.
   * @param {boolean} [config.logResult=false] - Copy result to console.log.
   * @returns {Promise<Result>}
   *
   * @example
   *
   * // Drop the database
   *
   * await new Engine({ neo4jUsername: 'me', neo4jpassword: 'secret' })
   *  .runQuery('MATCH (x) DETACH DELETE X'); // bye-bye! 🙀
   *
   */


  runQuery() {
    var _arguments2 = arguments,
        _this2 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var config = _arguments2.length > 0 && _arguments2[0] !== undefined ? _arguments2[0] : {};

      /* validations */

      /* !validations */

      /* defaults */
      var query = config.query;
      var wrap = config.wrap || true;
      var parameters = config.parameters || {};
      var database = config.database || _this2.database;
      var returnSuccess = config.returnSuccess || false;
      var closeConnection = config.closeConnection || false;

      var _testRetry = config._testRetry || false;
      /* directly supplied session > this.sessionPool['specialSession'] > a new session */


      var {
        session,
        sessionId
      } = config.session ? {
        session: config.session,
        sessionId: null
      } : _this2.createSession({
        database
      });
      /* at least return raw Neo4jResult */

      var raw = config.raw || false;

      if ((0, _utils.not)(wrap) && (0, _utils.not)(raw)) {
        raw = true;
      }

      var logResult = config.logResult || false;
      /* !defaults */

      return yield session.run(query, parameters).then(result => {
        /* testing/debugging only */
        if (_testRetry) {
          return result;
        }
        /* return Neo4jResult */


        if (raw) {
          return new _Result.Success({
            /**@TODO data interface Success.data != Array<T> */
            data: result.records,
            summary: result.summary,
            query
          });
        }
        /* use wrapper */


        var {
          data,
          summary
        } = wrapper(result, {
          returnSuccess
        });
        if (logResult) console.log(data, summary, query);
        return new _Result.Success({
          data,
          summary,
          query
        });
      }).catch( /*#__PURE__*/function () {
        var _ref = (0, _asyncToGenerator2.default)(function* (e) {
          console.log("runQuery() Error: ".concat(e));
          /* check if the error contains "can't acquire ExclusiveLock" phrase, and re-try in same session */

          if ((0, _utils.isPresent)(e.message.match("ExclusiveLock"))) {
            log("runQuery retried the transaction because of ExclusiveLock");
            return yield _this2.runQuery({
              query,
              parameters,
              closeConnection,
              wrap,
              returnSuccess,
              session,
              sessionId,
              _testRetry
            });
          }

          if (closeConnection) _this2.closeSession({
            session,
            sessionId
          });
          return new _Result.Failure({
            reason: e.message,
            //"See data for Error",
            data: [e],
            query
          });
        });

        return function (_x) {
          return _ref.apply(this, arguments);
        };
      }());
    })();
  }
  /**
   * Curried version of runQuery to get rid of ugly
   * closeConnection as second argument.
   * @param {*} closeConnection
   */


  runQueryCurried() {
    var _arguments3 = arguments,
        _this3 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var closeConnection = _arguments3.length > 0 && _arguments3[0] !== undefined ? _arguments3[0] : false;
      var ctx = _this3;
      return /*#__PURE__*/function () {
        var _fn = (0, _asyncToGenerator2.default)(function* (query) {
          var parameters = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
          var config = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {
            transform: true
          };
          return yield ctx.runQuery({
            query,
            parameters,
            closeConnection,
            transform: config.transform
          });
        });

        function fn(_x2) {
          return _fn.apply(this, arguments);
        }

        return fn;
      }();
    })();
  }
  /* CREATE */

  /**
   * Merges nodes into Neo4j.
   *
   * **Batched Merging**
   * Nodes are groupped by label for batched merging for optimization.
   *
   * **No Copies**
   * Merging ensures that no node copies are left in Neo4j.
   * Matching is done on `label + _hash` combination, which every
   * Node receives during the build process done by Builder.
   *
   * @TODO - this must be optional! add { allowDuplicates: true }
   *
   * If it is not a full Node, and it has no `label + _hash`,
   * then it is created.
   *
   * Therefore it is ABSOLUTELY critical not to supply anything
   * other than full Nodes here.
   *
   * @param {Node[]} arr - Array of Nodes to be merged.
   * @param {Object} config - Configuration object.
   * @param {boolean} [config.extract=false] - {true} returns EnhancedNode[].
   *
   * {false} returns Result[].
   * @param {boolean} [config.wrap=true] - {true} wraps Neo4j Nodes & Relationships into Mango classes.
   * @param {boolean} [config._logExecutionTime=false] - Logs execution time to console for testing.
   * @param {string} [config.database] - Name of the database to work with.
   *
   *  @todo add config.runParallel - @default false  run in a new session
   *  @todo add config.allowDuplicates - @default false  allow Node duplicates
    * @returns {Promise<Result[]|EnhancedNode[]>} - If config.extract = true, returns 
   * EnhancedNode[] each having 0 Relationships. 
   * @example
   * 
   * import { Builder, Engine, Node, NodeCandidate, Result, isSuccess, log } from 'mango';
   * 
   * // First build the Nodes
   * const labels = ['Label1', 'Label2'];
   * const nodes: Node[] = new Builder().buildNodes(
   *  [
   *    new NodeCandidate({
   *      labels,
   *       properties: {
   *        required: { A: "a1" },
   *      },
   *    }),
   *    new NodeCandidate({
   *      labels,
   *       properties: {
   *        required: { B: "b1" },
   *      },
   *    }),
   *  ],
   *  { extract: true }
   * );
   *
   * // Then merge them
   * const results: Result[] = await engine.mergeNodes(nodes);
   * 
   * // Checks
   * log(results.every(isSuccess)); // true <- all good
   * log(results[0].isWritten());   // true <- our Node1 is in Neo4j
   * log(results[1].isWritten());   // true <- our Node2 is in Neo4j
   */


  mergeNodes(arr) {
    var _arguments4 = arguments,
        _this4 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var config = _arguments4.length > 1 && _arguments4[1] !== undefined ? _arguments4[1] : {};

      /* time */
      var start = process.hrtime();
      /* validations */

      if ((0, _utils.not)((0, _isArray.default)(arr))) {
        return [new _Result.Failure({
          reason: "Engine.mergeNodes(): Validation error: First argument must be Array.",
          parameters: {
            arr
          }
        })];
      }
      /* First argument must be Node[]. */


      {
        var _data = arr.filter(node => {
          return (0, _utils.not)((0, _Node.isNode)(node));
        });

        if (_data.length) {
          return new _Result.Failure({
            reason: "Engine.mergeNodes(): Validation error: First argument must be Node[].",
            data: _data
          });
        }
      }
      /**@todo check if Node has ID, call this.matchNodesById*/

      /* Failure if some Nodes have no label + _hash. */

      {
        var _data2 = arr.filter(node => {
          var hash = node.properties._hash;
          var [label] = node.labels;
          return !(typeof hash === "string" && hash.length && typeof label === "string" && label.length);
        });

        if (_data2.length) {
          return new _Result.Failure({
            reason: "Engine.mergeNodes: Each Node must have label and _hash.",
            data: _data2
          });
        }
      }
      /* !validations */

      /* defaults */

      var extract = config.extract || false;
      var wrap = config.wrap || false;
      var closeConnection = config.closeConnection || false;

      var _logExecutionTime = config._logExecutionTime || false;

      var database = config.database || _this4.database;
      /* !defaults */

      /* LOGIC */

      /* Sort received nodes by their labels */

      var map = toMapByLabel(arr);
      /* Create array of queries for runQuery. */

      /* We do batched merging based on labels. */

      var arr_to_query = (0, _keys.default)(map).map(labels => {
        var parameters, query;
        parameters = {
          nodes: map[labels].map(node => node.getProperties())
        };
        /**@TODO ON MATCH update optional properties  */

        query = "\n      UNWIND $nodes as node\n      MERGE (x:".concat(labels, " {_hash: node._hash})\n      ON MATCH SET x._labels = node._labels\n      ON CREATE SET x = node\n      WITH x\n      CALL apoc.create.uuids(1) YIELD uuid\n      FOREACH (changeMe IN CASE WHEN x._uuid IS NULL THEN [1] ELSE [] END | SET x._uuid = uuid)\n      RETURN x \n      ");
        return {
          query,
          parameters
        };
      });
      /* runQuery on array, returns Result[][], will flatten later */

      var data = yield Promise.all(arr_to_query.map( /*#__PURE__*/function () {
        var _ref3 = (0, _asyncToGenerator2.default)(function* (_ref2) {
          var {
            query,
            parameters
          } = _ref2;
          var result = yield _this4.runQuery({
            query,
            parameters,
            database
          });
          /* adjust to OLRi */

          var rv;

          if ((0, _Result.isResult)(result)) {
            rv = result.getData({
              flatten: true
            });
            /* to please flowJS */

            if (!rv) return [];
            /* so it knows that we can call rv.map */

            rv = rv.map(node => {
              if ((0, _Result.isFailure)(node)) return node;

              if ((0, _EnhancedNode.isEnhancedNode)(node)) {
                return new _Result.Success({
                  /**@TODO data interface Success.data != Array<T> */
                  data: node,
                  query: result.query,
                  summary: result.summary,
                  parameters: {
                    /* append the original Node for reference */
                    node: parameters.nodes.find(originalNode => originalNode._hash == node.properties._hash)
                  }
                });
              }

              throw new Error("Engine.mergeNodes: runQuery was expected to return EnhancedNodes or Failure, but got something else.\nnode: ".concat((0, _utils.stringify)(node), "\n\nquery: ").concat(query, "\n\nparameters: ").concat((0, _utils.stringify)(parameters)));
            });
          } else {
            throw new Error("Engine.mergeNodes: runQuery was expected to return a Result.\nresult: ".concat((0, _utils.stringify)(result), "\n\nquery: ").concat(query, "\n\nparameters: ").concat((0, _utils.stringify)(parameters)));
          }

          return rv;
        });

        return function (_x3) {
          return _ref3.apply(this, arguments);
        };
      }()));
      var result = (0, _lodash.flatten)(data);
      /* !time */

      var [sec, ms] = process.hrtime(start);
      if (_logExecutionTime) log("mergeNodes(): ".concat(ms / 1e6));
      if (extract) return result.map(_Result.getResultData);
      return result;
      /* INNER FUNCTIONS
      _________________________________________________________________*/

      function toMapByLabel(arr) {
        return arr.reduce((acc, node) => {
          var label = node.getLabels()[0];
          if (label == undefined) return acc;

          if (!acc[label]) {
            acc[label] = [node];
            return acc;
          }

          acc[label].push(node);
          return acc;
        }, {});
      }
    })();
  }
  /**
   * Makes sure that all EnhancedNodes are stored in Neo4j as represented by user.
   * Adds Neo4j IDs (for Nodes and Relationsihps) to returned EnhancedNodes.
   *
   * @param {EnhancedNode[]} enodes - Array of EnhancedNodes to merge.
   * @param {Object} config - Configuration object.
   * @param {boolean} [config.extract=false] - {true} returns EnhancedNode[].
   *
   * {false} returns Result[].
   * @param {boolean} [config.wrap=true] - {true} wraps Neo4j Nodes & Relationships into Mango classes.
   *
   * {false} returns raw Neo4j results.
   * @param {boolean} [config._logExecutionTime=false] - Logs execution time to console for testing.
   *
   * @returns {Promise<Result[]|EnhancedNode[]>} - If config.extract = true, returns
   * EnhancedNode[].
   * @example
   *
   * // We want our graph to be:
   * // (:Person { NAME: "Rob" })-[:HAS_FRIEND]->(:Person { NAME: "Charlie "})
   * import { Builder, Engine, Node, NodeCandidate, Result, isSuccess, log } from 'mango';
   *
   * // A long way to do it (for shorter way use Mango)
   * // Assemble start/endNodes
   * const startNode: Node = builder.makeNode(["Person"], { NAME: "Rob" });
   * const endNode: Node = builder.makeNode(["Person"], { NAME: "Charlie" });
   *
   * // Specify the outbound relationship
   * const rc: RelationshipCandidate = builder.makeRelationshipCandidate(["HAS_FRIEND"], endNode);
   *
   * // Attach relationship to startNode == create EnhancedNode
   * const enode: EnhancedNode = builder.makeEnhancedNode(startNode, [rc]);
   * const results: Result[] = await engine.mergeEnhancedNodes([enode]);
   *
   * // Checks
   * log(results[0].getData()[0].isWritten()); // true <- we have succesfully merged our pattern
   */


  mergeEnhancedNodes(enodes_) {
    var _arguments5 = arguments,
        _this5 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var config = _arguments5.length > 1 && _arguments5[1] !== undefined ? _arguments5[1] : {};
      var enodes = (0, _cloneDeep.default)(enodes_);
      /* validations */

      {
        var validationResult = _validateArguments(enodes);

        if ((0, _Result.isFailure)(validationResult)) return [validationResult];
      }
      /* !validations */

      /* defaults */

      var wrap = config.wrap || true;
      var extract = config.extract || false; // const closeConnection = config.closeConnection || false;

      var logExecutionTime = config.logExecutionTime || false;
      /* !defaults */

      /* 1. unique node_hashMap */

      var node_hashMap = _toNodeHashMap(enodes);
      /* 2. merge nodes */


      var mergeNodesResults = yield _this5.mergeNodes((0, _values.default)(node_hashMap), {
        extract: false,
        logExecutionTime,
        wrap
      }); // log(mergeNodesResults)

      {
        /* validations - check what's come back from DB */
        var response_nodes = _check_results(mergeNodesResults, "Node");

        if ((0, _Result.isFailure)(response_nodes)) return [response_nodes];
      }
      /* 2a. replace node_hashMap with merged nodes */

      node_hashMap = _toNodeHashMap(mergeNodesResults.map(_Result.getResultData));
      /* 3. Preparing the returned results - update original enodes[] with merged nodes  */

      enodes.forEach(enode => enode.identifyParticipatingNodes(node_hashMap));
      /* 4. unique rel_hashMap */

      var rel_hashMap = _toRelHashMap(enodes);
      /* 4a. if enode has no relationships, don't attempt to merge them, as 
      Engine.mergeRelationships expects non empty Relationship[] */


      if ((0, _keys.default)(rel_hashMap).length !== 0) {
        /* 5. merge Relationships */
        var mergedRelsResult = yield _this5.mergeRelationships((0, _values.default)(rel_hashMap), {
          extract: false,
          logExecutionTime
        });
        {
          /* 5a. check results */
          var response_rels = _check_results(mergedRelsResult, "Relationship");

          if ((0, _Result.isFailure)(response_rels)) return [response_rels];
        }
        var mergedRels = mergedRelsResult.reduce((acc, res) => {
          var data = res.getData()[0];

          if ((0, _Relationship.isRelationship)(data)) {
            acc.push(data);
          }

          return acc;
        }, []);
        /* 6. update original enodes[] with merged rels */

        rel_hashMap = _toHashMap(mergedRels);
        enodes.forEach(enode => {
          enode.identifyParticipatingRelationships(rel_hashMap);
        });
      }
      /* Prepare results - add query & summary */


      var result = _resultWrapper(enodes, mergeNodesResults);

      return extract ? result.map(_Result.getFirstDataElement) : result; /////////////// FUN ///////////////

      /**
       * Checks input.
       * @param {EnhancedNode[]} enodes
       * @returns {Result}
       */

      function _validateArguments(enodes) {
        if (!enodes.length) return new _Result.Failure({
          reason: "Engine.mergeEnhancedNodes(): Validation error: enodes.length === 0.",
          data: enodes
        });
        /* First argument must be EnhancedNode[]. */

        var data = enodes.filter(_EnhancedNode.isNotEnhancedNode);

        if (data.length) {
          return new _Result.Failure({
            reason: "Engine.mergeNodes(): Validation error: First argument must contain only EnhancedNodes. Found something else, aborting.",
            data
          });
        }

        return new _Result.Success();
      }
      /**
       * Builds an object that lists given Node|Relationship by their _hash.
       * @param {any[]} arr
       * @returns {Object} where key:value == [_hash]: Node|Relationship
       */


      function _toHashMap(arr) {
        // log(arr);
        return arr.reduce((acc, val) => {
          acc[val.properties._hash] = val;
          return acc;
        }, {});
      }
      /**
       * Builds an object that lists all Nodes comprising the given
       * EnhancedNode by their _hash where key:value == [_hash]: Node
       * @param {(EnhancedNode | EnhancedNode[])[]} arr
       * @returns {Object}
       */


      function _toNodeHashMap(arr) {
        return arr.reduce((acc, val) => {
          /** @since { 2021-08-05 } swiching to wrap==true */
          if ((0, _EnhancedNode.isEnhancedNode)(val[0])) {
            val = val[0];
          }
          /* for flowJS purposes */


          if (val instanceof _EnhancedNode.EnhancedNode) {
            acc = _objectSpread(_objectSpread({}, acc), val.getParticipatingNodes({
              asHashMap: true
            }));
          } else {
            throw new Error("Engine.mergeEnhancedNodes._toNodeHashMap: val is not instance of EnhancedNode.\nval: ".concat((0, _utils.stringify)(val)));
          }

          return acc;
        }, {});
      }
      /**
       * Builds an object that lists all Relationships comprising the given
       * EnhancedNode by their _hash
       * @param {EnhancedNode[]} arr
       * @returns {Object} where key:value == [_hash]: Relationship
       */


      function _toRelHashMap(arr) {
        return (0, _cloneDeep.default)(arr).reduce((acc, val) => {
          acc = _objectSpread(_objectSpread({}, acc), val.getParticipatingRelationships({
            asHashMap: true,
            short: true
          }));
          return acc;
        }, {});
      }
      /**
       * Checks results received from Neo4j for Failures.
       * @param {EnhancedNode[]} arr
       * @param {"Node"|"EnhancedNode"|"Relationship"} type
       * @returns {Object} where key:value == [_hash]: Relationship
       * @todo Check there are no `Neo4jError: Node(28829) already exists` errors.
       */


      function _check_results(results, type) {
        var data = results.filter(result => {
          return (0, _Result.isFailure)(result);
        });

        if (data.length) {
          return new _Result.Failure({
            reason: "Engine.mergeEnhancedNodes._check_result: Merging of some ".concat(type, "s was unsuccessful. See data.\ndata: ").concat(JSON.stringify(data)),
            data
          });
        }

        return new _Result.Success();
      }
      /**
       * Prepares return results.
       * @param {EnhancedNode[]} enodes - updated EnhancedNodes
       * @param {Result[]} mergeNodesResults - contains query and summary
       * @returns {Result[]}
       */


      function _resultWrapper(enodes, mergeNodesResults) {
        return enodes.map(enode => {
          var [{
            query,
            summary
          }] = mergeNodesResults.filter(result => result.getData().getHash() === enode.getHash());
          return enode.isWritten() ? new _Result.Success({
            data: [enode],
            query,
            summary
          }) : new _Result.Failure({
            reason: "enode.isWritten() === false.",
            query,
            summary,
            data: [enode]
          });
        });
      } /////////////// END ///////////////

    })();
  }
  /**
   * Merges Relationships.
   *
   * @param {Relationship[]} relationships - Array of Relationships to merge.
   * @param {Object} config - Configuration object.
   * @param {boolean} [config.extract=false] - {true} returns EnhancedNode[].
   *
   * {false} returns Result[].
   * @param {boolean} [config.wrap=true] - {true} wraps Neo4j Nodes & Relationships into Mango classes.
   *
   * {false} returns raw Neo4j results.
   *
   * @returns {Result[]}
   * @example
   *
   * // import a bunch of low level stuff.
   * // Alternatively, use new Mango(/../).buildAndMergeRelationship
   *
   * import { Relationship, RelationshipCandidate, Builder, Result, log, Engine } from 'mango';
   *
   * // express (:Person { NAME: "SpongeBob" })-[:HAS_FRIEND]->(:Person { NAME: "Patrick "})
   * // as a Relationship and then merge it.
   * const relationship: Relationship[] = builder.buildRelationships(
   *  [
   *    new RelationshipCandidate({
   *      labels: ["HAS_FRIEND"],
   *      startNode: builder.makeNode(["Person"], { NAME: "SpongeBob" }),
   *      endNode: builder.makeNode(["Person"], { NAME: "Patrick" }),
   *    }),
   *  ],
   *  { extract: true }
   * );
   * const results: Result[] = await engine.mergeRelationships(relationship);
   *
   * // Check
   * log(results[0].getData()[0].isWritten()); // true <- yay! SpongeBob has a friend!
   *
   */


  mergeRelationships(relationships) {
    var _arguments6 = arguments,
        _this6 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var config = _arguments6.length > 1 && _arguments6[1] !== undefined ? _arguments6[1] : {};
      var rels = (0, _cloneDeep.default)(relationships);
      /* validations */

      var validation = _validateArguments(rels);

      if ((0, _Result.isFailure)(validation)) return [validation];
      /* !validations */

      /* defaults */

      var wrap = config.wrap || false;
      var extract = config.extract || false;
      var closeConnection = config.closeConnection || false;
      /* !defaults */

      /**@todo - if our participatingNodes aren't yet identified ??*/

      var cypherQueryArray = _2_toCypherQueryArray(rels);

      var mergedRelsResult = yield _3_merge(cypherQueryArray, _this6);
      /* check what's come back from DB */

      {
        var response = _check_rels_result(mergedRelsResult);

        if ((0, _Result.isFailure)(response)) return [response];
      }
      /* extract Relationships */

      var mergedRels = mergedRelsResult.reduce((acc, res) => {
        var extractedRelationships = _extractRelationship(res.getData());

        acc.push(...extractedRelationships);
        return acc;
      }, []);

      var results = _resultWrapper(rels, mergedRels);

      return results; /////////////// FUN ///////////////

      /**
       * Check input.
       * @param {Relationship[]} rels
       */

      function _validateArguments(rels) {
        if (!rels.length) {
          return new _Result.Failure({
            reason: "Engine.mergeRelationships(): Validation error: rels.length === 0.\nrels: ".concat((0, _utils.stringify)(rels)),
            data: rels
          });
        }
        /* First argument must be Relationship[]. */


        var data = rels.filter(_Relationship.isNotRelationship);

        if (data.length) {
          return new _Result.Failure({
            reason: "Engine.mergeRelationships(): Validation error: First argument must contain only Relationships. Found something else, aborting.\nrels: ".concat((0, _utils.stringify)(rels)),
            data
          });
        }

        return new _Result.Success();
      }
      /**
       * This is where rubber meets the road, I mean, Node meets Cypher.
       * We express our Relationships in Cypher to supply it later to _3_merge.
       * @param {Relationship[]} rels
       * @returns {CypherQuery[]}
       */


      function _2_toCypherQueryArray(rels) {
        var parameters = {
          rels: rels.map(rel => rel.toCypherParameterObj())
        };
        var query = "\n      UNWIND $rels as rel\n      MERGE (startNode { _hash: rel.startNode_hash })\n      ON CREATE SET startNode = rel.startNodeProperties.all        \n      MERGE (endNode { _hash: rel.endNode_hash })\n      ON CREATE SET endNode = rel.endNodeProperties.all\n      WITH *\n      CALL apoc.merge.relationship(startNode, rel.properties._type, { _hash: rel.properties._hash }, rel.properties, endNode, {})\n      YIELD rel as relationship\n      WITH *\n      CALL apoc.create.uuids(3) YIELD uuid\n      WITH collect(uuid) as uuids, startNode, relationship, endNode\n      FOREACH (ignoreMe IN CASE WHEN startNode._uuid IS NULL THEN [1] ELSE [] END | SET startNode._uuid = uuids[0]) \n      FOREACH (ignoreMe IN CASE WHEN relationship._uuid IS NULL THEN [1] ELSE [] END | SET relationship._uuid = uuids[1]) \n      FOREACH (ignoreMe IN CASE WHEN endNode._uuid IS NULL THEN [1] ELSE [] END | SET endNode._uuid = uuids[2]) \n      WITH *\n      CALL apoc.create.addLabels([ID(startNode)], [startNode._label]) YIELD node as a\n      CALL apoc.create.addLabels([ID(endNode)], [endNode._label]) YIELD node as b\n      RETURN startNode, relationship, endNode\n      ";
        return [{
          query,
          parameters
        }];
      }
      /**
       * Query Neo4j for Relationships.
       * @param {Object[]} cypherQueryArray
       */


      function _3_merge(_x4, _x5) {
        return _3_merge2.apply(this, arguments);
      }
      /**
       * Check there are no `Neo4jError: Node(28829) already exists` errors.
       * @param {Result[]} results - Results to check.
       * @returns {Result}
       */


      function _3_merge2() {
        _3_merge2 = (0, _asyncToGenerator2.default)(function* (cypherQueryArray, ctx) {
          var results = yield Promise.all(cypherQueryArray.map(_query));
          return results;
          /**
           * The actual function that calls DB and returns Result
           * @param {CypherQuery} cypherQueryObject
           */

          function _query(_x6) {
            return _query2.apply(this, arguments);
          }
          /**
           * Simply unwraps Relationships.
           * @param {Result[]} results
           */


          function _query2() {
            _query2 = (0, _asyncToGenerator2.default)(function* (_ref4) {
              var {
                query,
                parameters
              } = _ref4;
              var result = yield ctx.runQuery({
                query,
                parameters
              });
              return result;
            });
            return _query2.apply(this, arguments);
          }

          function _extractRelationships(results) {
            var result = results.reduce((acc, result) => {
              if ((0, _Result.isSuccess)(result)) {
                acc.push(...result.getData());
                return acc;
              } else {
                throw new Error("Engine.mergeEnhancedNodes() _3_merge: received Failure from Neo4j, expected to receive a Success.data = [Relationship].");
              }
            }, []);
            return result;
          }
        });
        return _3_merge2.apply(this, arguments);
      }

      function _check_rels_result(results) {
        var data = results.filter(result => {
          // are there Failures == runQuery returned Neo4j error
          return (0, _Result.isFailure)(result);
        });

        if (data.length) {
          return new _Result.Failure({
            reason: " Engine.mergeRelationships._check_rels_result: Some Relationships were unsuccessful. See data.\ndata: ".concat((0, _utils.stringify)(data)),
            data
          });
        }

        return new _Result.Success();
      }
      /**
       * Arrange nodes/rels by their _hash.
       */


      function _toRelsHashMap(arr) {
        return arr.reduce((acc, rel) => {
          acc[rel.properties._hash] = rel;
          return acc;
        }, {});
      }

      function _extractRelationship(arr) {
        if (!Array.isArray(arr)) {
          throw new Error("Engine.mergeRelationships._extractRelationship: arr not an array.\narr: ".concat((0, _utils.stringify)(arr)));
        }

        var rels = (0, _flattenDeep.default)(arr).filter(_Relationship.isRelationship);

        if (!rels.length) {
          throw new Error("Engine.mergeRelationships._extractRelationship: expected at least one Relationship.\nrels: ".concat((0, _utils.stringify)(rels)));
        }

        return rels;
      }
      /**
       * Adjust return result for Result[].
       * @param {Relationship[]} originalRels - Relationships supplied by user.
       * @param {Relationship[]} mergedRels - Relationships returned from Neo4j.
       * @returns {Result[]}
       */


      function _resultWrapper(originalRels, mergedRels) {
        var newRelsHashMap = _toRelsHashMap(mergedRels);

        return originalRels.map(oldRel => {
          // log(oldRel)
          var oldRelHash = oldRel.getHash();

          if (!(0, _has.default)(newRelsHashMap, oldRelHash)) {
            return new _Result.Failure({
              parameters: oldRel,
              reason: "Engine.mergeRelationships._resultWrapper: did not find this Relationships by its hash among merged Relationships.\nHash changed? Merging failed?.\noldRel.hash: ".concat((0, _utils.stringify)(oldRelHash), ".")
            });
          }

          var newRel = newRelsHashMap[oldRelHash];

          if (newRel.isWritten() == false) {
            log("newRel.isWritten() == false");
            console.log("newRel: ", (0, _utils.stringify)(newRel));
          }

          return newRel.isWritten() ?
          /**@TODO data interface Success.data != Array<T> */
          new _Result.Success({
            parameters: oldRel,
            data: [newRel]
          }) : // new Success({ parameters: oldRel, data: newRel })
          new _Result.Failure({
            parameters: oldRel,
            reason: "Engine.mergeRelationships._resultWrapper: newRel.isWritten() === false.\nSad, but true - we have a merged relationship, but currently we failed to represent it as a proper Relationship.\nmerged Relationship hashes & identities:\nRelationship:\nhash: ".concat(newRel.getHash(), "\nidentity ").concat(newRel.getId(), "\n\nstartNode:\nhash: ").concat(newRel.getStartNodeHash(), "\nidentity ").concat(newRel.getStartNodeId(), "\n\nendNode:\nhash: ").concat(newRel.getEndNodeHash(), "\nidentity ").concat(newRel.getEndNodeId(), "\n"),
            data: newRel
          });
        });
      } /////////////// END ///////////////

    })();
  }
  /* READ */

  /**
   * Does Node optional matching by labels/parameters, returning Failure for unmatched Nodes.
   *
   * @public
   * @param {Node|EnhancedNode[]} nodes - Nodes to match.
   * @param {Object} config - Configuration object.
   * @returns {Promise<Result[]>}
   */


  matchNodes(nodes) {
    var _arguments7 = arguments,
        _this7 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var config = _arguments7.length > 1 && _arguments7[1] !== undefined ? _arguments7[1] : {};
      var arr = (0, _cloneDeep.default)(nodes);
      /* validations */

      if (!arr.length) {
        return [new _Result.Failure({
          reason: "Engine.matchNodes: automat: must receive a non-empty array."
        })];
      }
      /* !validations */

      /* make a holder for validated objects */


      var holder = arr.map(node => {
        if ((0, _Node.isNodeLike)(node)) {
          // log(node)
          var newNode = new _Node.Node(node); // const newNode = new EnhancedNode(node)
          // log(newNode)
          // log(isNode(newNode))

          return newNode;
        }
        /* check it's a Node */


        if ((0, _utils.not)((0, _Node.isNode)(node))) {
          /* attempt to create a node */
          // const newNode 
          return new _Result.Failure({
            reason: "Engine.matchNodes: automat: only instances of Node can be matched.",
            parameters: {
              node
            }
          });
        }
        /* check if Node's ok */


        var {
          labels,
          properties
        } = node;

        if (labels.length == 0 && (!properties || (0, _keys.default)(properties).length == 0)) {
          return new _Result.Failure({
            reason: "Engine.matchNodes: automat: a Node must have at least one label or one property.",
            parameters: {
              node
            }
          });
        }
        /* Node's ok */


        return node;
      });
      /* !validations */

      /* defaults */

      /* !defaults */

      /* automat */

      var automat = /*#__PURE__*/function () {
        var _ref5 = (0, _asyncToGenerator2.default)(function* (holder) {
          if (holder.every(_Result.isFailure)) {
            return nothingToQuery(holder);
          }
          /* fullQuery will skip Failures */


          return fullQuery(holder);
        });

        return function automat(_x7) {
          return _ref5.apply(this, arguments);
        };
      }();
      /* queries */


      var nothingToQuery = /*#__PURE__*/function () {
        var _ref6 = (0, _asyncToGenerator2.default)(function* (arr) {
          return [new _Result.Failure({
            reason: "Engine.matchNodes: nothingToQuery: need at least one decent Node to search for.",
            data: arr
          })];
        });

        return function nothingToQuery(_x8) {
          return _ref6.apply(this, arguments);
        };
      }();

      var fullQuery = /*#__PURE__*/function () {
        var _ref7 = (0, _asyncToGenerator2.default)(function* (arr) {
          /* this array_to_query will be runQuery'ed in sequence */
          var array_to_query = arr.map(function produceQueryObjects(node) {
            // log(node) // no uuids
            if ((0, _utils.not)((0, _Node.isNode)(node))) {
              // throw new Error(
              //   `Engine.matchNodes.fullQuery.produceQueryObjects: expect a Node:\nnode ${stringify(
              //     node
              //   )}`
              // );
              return node;
            }
            /* check if it's a Neo4j Node really, if so, match by ID */


            if ((0, _has.default)(node, ["identity"]) && node.identity !== null) {
              var _query3 = "OPTIONAL MATCH (x) WHERE ID(x) = ".concat(node.getId(), " RETURN x");

              return {
                query: _query3,
                originalNode: node
              };
            }
            /* check if _hash is present and match by it */


            if ((0, _has.default)(node.properties, ["_hash"])) {
              var _query4 = "OPTIONAL MATCH (x".concat(node.toString({
                parameter: "labels"
              }), "{_hash:'").concat(node.properties._hash, "'}) RETURN x");

              return {
                query: _query4,
                originalNode: node
              };
            }
            /* hmm no _hash and no identity?? ok, match by its label && required properties */


            var query = "\n        OPTIONAL MATCH (x".concat(node.toString("all", {
              REQUIRED: true
            }), ")\n        RETURN x\n        ");
            /* pass on original Node to identify possible Failures */

            return {
              query,
              originalNode: node
            };
          });
          /* run queries */

          var data = yield Promise.all(array_to_query.map( /*#__PURE__*/function () {
            var _ref8 = (0, _asyncToGenerator2.default)(function* (queryObject) {
              /* [2022-03-02] removed dead code */
              // if (isFailure(queryObject)) return queryObject;
              var {
                query,
                originalNode
              } = queryObject;
              var level2 = yield _this7.runQuery({
                query,
                transform: false,
                wrap: true
              });
              /**
               * adjust return results to Result[] pattern where S.data = [Enode] or S.data = []
               * show which node was not found
               */

              var level1 = level2.getData({
                flatten: true
              }) // wrap: true

              /* but if we match by property, length could be any */
              .map(node => {
                if ((0, _Result.isFailure)(node)) {
                  /* show what was not found */
                  node.parameters = {
                    originalNode
                  };
                  return node;
                } // if Neo4j returned no matches, it's represented as []


                if ((0, _isArray.default)(node)) {
                  if (node.length == 0) {
                    return new _Result.Success({
                      reason: NEO4J_RETURNED_NULL,
                      data: [],
                      parameters: {
                        originalNode
                      }
                    });
                  } else {
                    var flattened = (0, _lodash.flatten)(node); // check contents, should be EnhancedNodes

                    if ((0, _utils.not)(flattened.every(_EnhancedNode.isEnhancedNode))) {
                      return new _Result.Failure({
                        reason: "Expected EnhancedNode[], but got something else.",
                        data: flattened,
                        parameters: {
                          originalNode
                        }
                      });
                    }

                    return new _Result.Success({
                      data: node,
                      parameters: {
                        originalNode
                      }
                    });
                  }
                }

                return new _Result.Success({
                  /**
                   * @potential_bug As it's the case with matchNodesById, we expect
                   * to get only one successfull match! So we won't use Array here.
                   * [2021-08-11] - Yes we will use Array for consistency with other
                   * methods that return Result[] where S.data = [whatever]
                   * */
                  data: [node],
                  parameters: {
                    originalNode
                  }
                });
              });
              return level1;
            });

            return function (_x10) {
              return _ref8.apply(this, arguments);
            };
          }()));
          return (0, _lodash.flatten)(data);
        });

        return function fullQuery(_x9) {
          return _ref7.apply(this, arguments);
        };
      }();

      return automat(holder);
    })();
  }
  /**
   * PartialNodes are Node fragments that we expect to complete by searching Neo4j,
   * they hold values and search conditions.
   *
   * The idea is that if we have a full Node/Enode (a discription of some fact that
   * we consider to be full and complete), then we use matchNodes/matchEnhancedNodes.
   *
   * But when we just have a property or label, or time range or some other property
   * that we want to search for, we use matchPartialNodes. It constructs various
   * Cypher OPTIONAL MATCH queries, allowing different types of searches.
   *
   * @public
   * @param {PartialNode[]} partialNodes - PartialNodes to search for.
   * @param {Object} config - Configuration object.
   * @param {boolean} [config.extract=false] - {true} returns EnhancedNode[][] because
   * each PartialNode search may result in multiple matches. Use config.flatten=true to
   * return EnhancedNode[]
   *
   * {false} returns Result[].
   * @param {boolean} [config.flatten=false] - {true} returns EnhancedNode[] if
   * config.extract=true.
   * @param {boolean} [config.useTimeTree=false] - {true} uses TimeTree (if available)
   * for quicker date searches.
   *
   * @returns {Promise<Result[]|EnhancedNode[]|EnhancedNode[][]>}
   */


  matchPartialNodes(partialNodes) {
    var _arguments8 = arguments,
        _this8 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var config = _arguments8.length > 1 && _arguments8[1] !== undefined ? _arguments8[1] : {};

      /* pure function */
      var arr = (0, _cloneDeep.default)(partialNodes);
      /* !pure function */

      /* validations */

      {
        if (!arr.every(_PartialNode.isPartialNode)) {
          return [new _Result.Failure({
            reason: "matchPartialNodes(): Validation error: only instances of PartialNode can be matched.\narr: ".concat(JSON.stringify(arr)),
            parameters: {
              arr
            }
          })];
        }
      }
      /* !validations */

      /* defaults */

      var ctx = _this8;
      var extract = config.extract || false;
      var flatten = config.flatten || false;
      var useTimeTree = config.useTimeTree || false;
      /* !defaults */

      /**
       * 1. If there is search by DATE involved? -> Do `timeTree_query` first
       *    [2021-08-16] Need to simplify, so will not rely on TimeTree
       *    MATCH (x) WHERE x.DAY[0] = 2018 AND x.DAY[1] = 1 AND x.DAY[2] = 2 RETURN x
       * 2. Examine pnode's properties and build `property_query`.
       * 3. Combine `timeTree_query` + `property_query`.
       * 4. runQuery
       * 4a. enhance if necessary ??!?
       * 5. return Result[]
       */

      var array_to_query = arr.map(pnode => {
        var {
          labels,
          properties
        } = pnode;
        /**
         * 1.
         * If we have any dates, it will usually be only one property that user
         * specified. If not, it's confusing, let's do something about it?
         * let's return Failure
         */

        var dates = extractDateConditions(properties);

        if (dates.length > 1) {
          return new _Result.Failure({
            reason: "matchPartialNodes() can match only one DATE property. More than one was supplied."
          });
        }

        var date_query;

        if (dates.length) {
          var date = properties[dates[0]];
          date_query = _produceDateQuery(date, {
            useTimeTree
          });
        }

        function _produceDateQuery(date, _ref9) {
          var {
            useTimeTree
          } = _ref9;

          /* 
          {
            isDate: true,
            type: 'DAY',
            key: 'DAY',
            value: [2018, 1, 1, 1, 123]
          } 
          */
          var date_query = "";
          var {
            isDate,
            isRange,
            type,
            key,
            value
          } = date; // [2021-08-16] not to use TimeTree will be default behaviour. As we want to simplify Mango.
          // TimeTree is now an additional plugin.
          // isDate == false && isRange == false

          if (isDate == false && ((0, _utils.isMissing)(isRange) || isRange == false)) {
            date_query = ""; // return date_query
          } // Simple day case
          // properties: {
          //   required: {
          //     DAY: {
          //       isDate: true,
          //       type: 'DAY',
          //       key: 'DAY',
          //       value: [2018, 1, 1, 1, 1]
          //     }
          //   }
          // }
          // isDate == true && isRange == false
          else if (isDate == true && ((0, _utils.isMissing)(isRange) || isRange == false)) {
            if ((0, _utils.not)((0, _.isTimeArray)(value))) {
              throw new Error("Engine.matchPartialNodes: _produceDateQuery: when isDate == true && isRange == false, the value must be a TimeArray.\nvalue: ".concat(JSON.stringify(value)));
            }

            var [YEAR, MONTH, DAY] = value;
            date_query = "WHERE x.DAY[0] = ".concat(YEAR, " AND x.DAY[1] = ").concat(MONTH, " AND x.DAY[2] = ").concat(DAY, " ");
          } // Date range case
          // properties: {
          //   DAY: {
          //     isDate: true,
          //     isRange: true,
          //     type: 'DAY',
          //     key: 'DAY',
          //     value: [{
          //       from: [2018, 1, 1, 1, 1],
          //       to: [2019, 1, 2, 1, 3]
          //     }]
          //   },
          // }
          // isDate == true && isRange == true
          else if (isDate == true && isRange == true) {
            if ((0, _utils.isMissing)(value[0])) {
              throw new Error("Engine.matchPartialNodes: _produceDateQuery: when isDate == true && isRange == true, the value must be a [{from: TimeArray, to: TimeArray}].\nvalue: ".concat(JSON.stringify(value)));
            }

            var [{
              from,
              to
            }] = value;

            if ((0, _utils.isMissing)(from) || (0, _utils.isMissing)(to)) {
              throw new Error("Engine.matchPartialNodes: _produceDateQuery: when isDate == true && isRange == true, the value must be a [{from: TimeArray, to: TimeArray}].\nvalue: ".concat(JSON.stringify(value)));
            }

            var from_TIMESTAMP = from[4];
            var to_TIMESTAMP = to[4];
            date_query = "WHERE x.DAY[4] >= ".concat(from_TIMESTAMP, " AND x.DAY[4] <= ").concat(to_TIMESTAMP, " ");
          }

          return date_query;
        }
        /**
         * Deal with all non-date properties.
         */


        var props = extractConditions(properties);

        var properties_query = _buildWhereClauses(props, properties, _this8);
        /**
         * 3. Combine `timeTree_query` + `property_query`.
         */


        var query = _buildFinalQuery(date_query, properties_query, labels); // log(query)


        return {
          PartialNode: pnode,
          query
        };
      });
      /**
       * 4. runQuery
       * Returns [Result, Result] R.data = EnhancedNode[] | []
       */

      var data = yield Promise.all(array_to_query.map( /*#__PURE__*/function () {
        var _queryRunner = (0, _asyncToGenerator2.default)(function* (node) {
          if ((0, _Result.isFailure)(node)) return node;
          var {
            query,
            PartialNode
          } = node;
          var result = yield ctx.runQuery({
            query
          });
          var innerData = result.getData();
          /* that's when Neo4j returned null, no matches.
          I need to understand it better, but for now I'll monkey patch it
          to return Success.data = [], Success.reason = 'Neo4j returned null' */

          if ((0, _Result.isSuccess)(innerData[0])) {
            return innerData[0];
          }

          var enodes = (0, _lodash.flatten)(innerData);

          if (enodes.every(_EnhancedNode.isEnhancedNode)) {
            /* all good */
            return new _Result.Success({
              data: enodes,
              query: result.query,
              summary: result.summary
            });
          }

          throw new Error("Engine.matchPartialNodes.queryRunner: did not expect to reach here.\nnode: ".concat((0, _utils.stringify)(node)));
        });

        function queryRunner(_x11) {
          return _queryRunner.apply(this, arguments);
        }

        return queryRunner;
      }()));
      /* return results */

      if (extract) {
        var result = data.map(_Result.getResultData);
        return flatten ? (0, _lodash.flatten)(result) : result;
      }

      return data; /////////////// FUN ///////////////

      function extractDateConditions(properties) {
        var result = (0, _keys.default)(properties).filter(prop => prop[0] !== "_") // exclude _private properties
        .filter(prop => (0, _isObject.default)(properties[prop]) && properties[prop].isDate == true);
        return result;
      }

      function extractConditions(properties) {
        return (0, _keys.default)(properties).filter(prop => prop[0] !== "_") // exclude _private properties
        .filter(prop => !((0, _isObject.default)(properties[prop]) && properties[prop].isDate == true)) // no dates
        .filter(prop => (0, _isObject.default)(properties[prop])); // but must be an object
      }
      /**
       * Builds Cypher queries based on PartialNode conditions.
       * @param {string[]} props
       * @param {Object[]} properties
       * @todo use conditionMaping as { 'CONTAINS': (valueItem) => { if (valueItem.lenght == 1)}}
       */


      function _buildWhereClauses(props, properties, ctx) {
        // log(props) ['A']
        var wheres = props.reduce((acc, prop) => {
          var {
            key,
            value,
            isCondition
          } = properties[prop];
          /* make use of conditions */

          if (isCondition) {
            /* there could be several conditions! */
            var conditions = value.map(conditionObj => {
              // { get: 1, let: 3 }
              return (0, _keys.default)(conditionObj) // ['get', 'let']
              .map(condition => {
                // 'get
                var cond = ctx.getConditionMapping()[condition];
                var result;
                var value_item = conditionObj[condition];

                if (["IN", "in"].includes(cond)) {
                  result = "x.".concat(key, " IN ").concat(stringifyPerType(value_item)); // Array => String
                } else if (["NOT", "not"].includes(cond)) {
                  result = "NOT x.".concat(key, " IN ").concat(stringifyPerType(value_item));
                } else if (["NIN", "nin"].includes(cond)) {
                  // no in
                  result = "NOT (x.".concat(key, " IN ").concat(stringifyPerType(value_item), ")");
                } else if (["CONTAINSALL", "containsall"].includes(cond)) {
                  // I have this one case when I cannot put WHERE in front
                  result = "WITH x, [x in x.".concat(key, " WHERE x in ").concat(stringifyPerType(value_item), " | x] as f WHERE size(f) > 1");
                } else if (["CONTAINSANY", "containsany"].includes(cond)) {
                  result = "[x IN x.".concat(key, " WHERE x IN ").concat(stringifyPerType(value_item), " | x]");
                } else if (["NOT_CONTAINS", "not_contains"].includes(cond)) {
                  result = "NOT filter(x IN x.".concat(key, " WHERE x IN ").concat(stringifyPerType(value_item), ")");
                } else if (["CONTAINS", "contains", "~", "=~"].includes(cond)) {
                  function worker(val) {
                    var holder = [];
                    /**@todo this is unweildy but works */

                    holder.push("x.".concat(key, " CONTAINS ").concat(stringifyPerType((0, _isString.default)(val) ? val : (0, _isArray.default)(val) && val.length === 1 ? (0, _flattenDeep.default)(val)[0] : (0, _isArray.default)(val) ? (0, _flattenDeep.default)(val).forEach((el, idx) => holder.push("x.".concat(key, " CONTAINS ").concat(stringifyPerType(el), " OR"))) : val)));
                    return holder.join(" ");
                  }

                  result = worker(value_item);
                } else {
                  if ((0, _isString.default)(value_item)) {
                    result = "x.".concat(key, " ").concat(cond, " '").concat(value_item, "'");
                  } else {
                    result = "x.".concat(key, " ").concat(cond, " ").concat(value_item);
                  }
                }

                return result;
              });
            });
            acc.push(...conditions);
            return acc;
          }
          /* isCondition == false - simple */
          // if (isPresent(value) && typeof value[0] === "string") {
          //   acc.push(`x.${key} = '${value[0]}'`);
          // } else {
          //   acc.push(`x.${key} = ${value[0]}`);
          // }
          // log(key)
          // log(value)


          if ((0, _utils.isPresent)(value)) {
            if (typeof value[0] === "string") {
              acc.push("x.".concat(key, " = '").concat(value[0], "'"));
            } else {
              acc.push("x.".concat(key, " = ").concat(value[0]));
            }
          } else {
            return acc;
          }

          return acc;
        }, []); // fix for that one case which starts with WITH - multiple conditions

        function addWHERE(wheres) {
          // if it's 'WITH ...' don't add WHERE
          var queryArr = (0, _lodash.flatten)(wheres);
          var result = "";

          if (!queryArr.length) {
            return result;
          } else if (queryArr[0].split(" ")[0] == "WITH") {
            result = "".concat((0, _lodash.flatten)(wheres).join(" AND "));
          } else {
            result = "WHERE ".concat((0, _lodash.flatten)(wheres).join(" AND "));
          }

          return result;
        }

        return addWHERE(wheres);
      }
      /**
       * @param {string} date_query
       * @param {string} properties_query
       * @param {string[]} labels
       * @returns {string} Cypher Query
       */


      function _buildFinalQuery(WHEN, WHERE, labels) {
        // log(WHEN)
        if ((0, _utils.isMissing)(WHEN)) {
          WHEN = "";
        }

        if ((0, _utils.isMissing)(WHERE)) {
          WHERE = "";
        }

        var x = (0, _utils.isPresent)(labels[0]) && labels[0].length !== 0 ? "x:".concat(labels.join("|")) : "x"; // log(x)

        var result = ""; // we dont have anything

        if (WHEN.length == 0 && WHERE.length == 0) {
          result = "MATCH (".concat(x, ") RETURN x");
        } // we have a date string only


        if (WHEN.length !== 0 && WHERE.length == 0) {
          // WHEN is of
          // WHERE x.DAY[0] = 2018 AND x.DAY[1] = 1 AND x.DAY[2] IN [1, 2] or
          // WHERE x.DAY[0] = 2018 AND x.DAY[1] = 1 AND x.DAY[2] IN 1
          // type
          result = "MATCH (".concat(x, ") ").concat(WHEN, " RETURN x");
        } // we have props only


        if (WHEN.length == 0 && WHERE.length !== 0) {
          result = "MATCH (".concat(x, ") ").concat(WHERE, " RETURN x");
        } // we have a date string + props


        if (WHEN.length !== 0 && WHERE.length !== 0) {
          result = "MATCH (".concat(x, ") ").concat(WHEN, " AND ").concat(WHERE, " RETURN x");
        } // log(result)


        return result;
      } /////////////// END ///////////////

    })();
  }
  /**
   * Does Node matching by IDs
   * When validations fail, Result.parameter = { IDs }
   * when returns Result[], it has structure of Result.parameter = { id }
   * so a bit confusing. But, on the other hand, exactly what the function does -
   * if validations fail, ie the IDs array was not workable, it gets returned
   * using argument's name (user will examine the response and figure it out.)
   * Alternatively I could name id 'supplied_ids', 'id_array' etc
   *
   * @param {number[]} IDs - array with Neo4j ID numbers
   * @param {Object} obj - parameter object
   * @default {extract:false,closeConnection:false,transfrom:false,wrap:true}
   * @returns {Result[]}
   */


  matchNodesById(IDs) {
    var _arguments9 = arguments,
        _this9 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var obj = _arguments9.length > 1 && _arguments9[1] !== undefined ? _arguments9[1] : {};

      /* validations */
      if ((0, _utils.isMissing)(IDs)) {
        return [new _Result.Failure({
          reason: "matchNodesById(): nothing was passed as an argument."
        })];
      }

      if ((0, _utils.not)((0, _isArray.default)(IDs))) {
        return [new _Result.Failure({
          reason: "matchNodesById(): only accepts number[].",
          parameters: {
            IDs
          }
        })];
      }
      /**
       * @todo - leave it as is? It's more explicit to tell the user that
       * they supplied an empty [].
       */


      if (IDs.length == 0) {
        return [new _Result.Failure({
          reason: "matchNodesById(): IDs array is empty.",
          parameters: {
            IDs
          }
        })];
      }

      if ((0, _utils.not)(IDs.some(_isNumber.default))) {
        return [new _Result.Failure({
          reason: "matchNodesById(): IDs must contain at least one number.",
          parameters: {
            IDs
          }
        })];
      }

      if (!IDs.every(_isNumber.default)) {
        return [new _Result.Failure({
          reason: "matchNodesById(): IDs array must be numbers only.",
          parameters: {
            IDs
          }
        })];
      }
      /* !validations */

      /* defaults */


      var extract = (0, _utils.isPresent)(obj.extract) ? obj.extract : false;
      var closeConnection = (0, _utils.isPresent)(obj.closeConnection) ? obj.closeConnection : false;
      var transform = (0, _utils.isPresent)(obj.transform) ? obj.transform : false;
      var wrap = (0, _utils.isPresent)(obj.wrap) ? obj.wrap : true;
      /* !defaults */

      /* logic */

      var query = "\n      OPTIONAL MATCH (x) \n      WHERE ID(x) IN [".concat(IDs.join(", "), "] \n      RETURN *\n    ");
      var result = yield _this9.runQuery({
        query,
        closeConnection,
        transform,
        wrap
      });
      /* need to customize runQuery's response */

      /* make sure the order is correct */

      var data = IDs.map(function wrapIdIntoResult(id, i) {
        var node = (0, _lodash.flatten)(result.data).filter(node => {
          if (node.getId() === id) return node;
        });

        if (node.length === 1) {
          return new _Result.Success({
            parameters: {
              id
            },

            /**
             * @potential_bug - [2020-04-08] this is risky, although if we match by
             * ID we expect 1 or null nodes to come back. So it's ok.
             * */
            data: [...node]
          });
        } else {
          return new _Result.Failure({
            reason: "Node was not matched",
            parameters: {
              id
            },
            data: [] //// [2021-08-10] all Result data should come back in arrays.

          });
        }
      });

      if (extract) {
        // add null instead of [] where Node was not matched
        var _result = (0, _lodash.flatten)(data.map(_Result.getResultData).map(arr => arr.length === 0 ? null : arr));

        return _result;
      }

      return data;
    })();
  }
  /**
   * Matches if specified EnhancedNodes exist.
   * @param {EnhancedNode[]} arr
   * @returns {Result[]}
   */


  matchEnhancedNodes(arr) {
    return (0, _asyncToGenerator2.default)(function* () {})();
  }
  /**
   * Does Relationship optional matching. Second argument defines how matching is done:
   * labels     - by label (type) only
   * all        - by labels + properties combination
   * NOTE! in Neo4j you cannot match a relationship without specifying its type (label)!
   * Case: get all ()-[:SOME_LABEL {props}]-() patterns
   * @param {Relationship[]} arr
   * @param {string} parameter = all / labels / properties
   * @returns Result[] where
   * Success.data = Relationship[]
   * Failure.data = []
   */


  matchRelationships(arr) {
    var _arguments10 = arguments,
        _this10 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var parameter = _arguments10.length > 1 && _arguments10[1] !== undefined ? _arguments10[1] : "all";

      /* validations */
      {
        var validation = _validateArguments(arr);

        if ((0, _Result.isFailure)(validation)) return [validation];
      }
      /* validations */

      /* logic */

      /* query DB */

      var dbData = yield Promise.all(arr.map( /*#__PURE__*/function () {
        var _ref10 = (0, _asyncToGenerator2.default)(function* (rel) {
          if ((0, _Result.isFailure)(rel)) return rel;

          var query = _createQuery(rel);

          return yield _this10.runQuery({
            query,
            wrap: true
          });
        });

        return function (_x12) {
          return _ref10.apply(this, arguments);
        };
      }()));
      /* filter out Relationships */

      var result = dbData.map((result, i) => {
        var data = (0, _lodash.flatten)(result.getData()).filter(_Relationship.isRelationship); // const data = result.getData().filter(isRelationship);
        // log(data)

        /* if there were no Relationships, it is a Failure */

        if (!data.length) {
          return new _Result.Failure({
            reason: NEO4J_RETURNED_NULL,
            parameters: {
              rel: arr[i]
            },
            data: []
          });
        } // append matched data


        result.data = data;
        /* specify which argument was passed as parameter */

        result.parameters = {
          rel: arr[i]
        };
        return result;
      });
      return result; /////////////// FUN ///////////////

      function _createQuery(rel) {
        return "OPTIONAL MATCH (x)-[z".concat(rel.toString(parameter), "]->(y) RETURN x, y, z");
      }
      /**
       * Check input.
       * @param {Relationship[]} rels
       * @returns {Result}
       */


      function _validateArguments(rels) {
        if (!Array.isArray(rels)) {
          return new _Result.Failure({
            reason: "Engine.matchRelationships: Validation error: first argument must be array.\nfirst argument: ".concat(JSON.stringify(rels)),

            /**@TODO adhere to data interface Result.data = Array<T> */
            // parameters: rels,
            // data: []
            data: rels
          });
        }

        if (!rels.length) return new _Result.Failure({
          reason: "Engine.matchRelationships: Validation error: first argument must be non-empty array.\nfirst argument: ".concat(JSON.stringify(rels)),
          data: rels
        });
        var isRel = rels.map(_Relationship.isRelationship);

        if (!isRel.every(_utils.isTrue)) {
          return new _Result.Failure({
            reason: "Engine.matchRelationships: Validation error: first argument must be Relationship[].\nfirst argument: ".concat(JSON.stringify(isRel)),
            data: rels
          });
        }
        /**@TODO why ? */


        return new _Result.Success();
      } /////////////// END ///////////////

    })();
  }
  /**
   * @todo 2020-06-03 I need matchPartialRelationships to be able to match by label/property only
   * @question does neo4j allow matching relationships by its props only? YES!
   * create ()-[:Lol {a: 1}]->()
   * match ()-[x {a: 1}]-() return x
   * returns [{"a": 1}, {"a": 1}]
   */


  matchPartialRelationships() {
    /**
     * by one label
     * 'MATCH ()-[x:${label}]-() RETURN x'
     * by multiple lables
     * 'MATCH ()-[x:${label}|${lable}]-() RETURN x'
     *
     */

    return (0, _asyncToGenerator2.default)(function* () {})();
  }
  /**
   * Does Relationship matching by IDs
   * @param {number[]} arr
   */


  matchRelationshipsById(arr) {// UNWIND $relIds as relId
    // MATCH (startNode)-[relationship]-(endNode)
    // WHERE ID
    // match ()-[r]-() where ID(r) IN [5419, 5418] return *

    return (0, _asyncToGenerator2.default)(function* () {})();
  }
  /**
   * Enhances Node|EnhancedNode to return all its n-degree relationshps.
   * @todo ver 0.1 - make one query per each enode.
   * @todo make sure runQuery returns same order[] as matched_success[]
   * @param {Node|EnhancedNode[]} arr
   * @param {Object} obj - parameter object
   *  extract - @default false  returns Result[], if true - returns EnhancedNode[]
   *  hops    - @default 1      defines over how many hops to enhance
   * @returns {Promise<Result[]>}
   */


  enhanceNodes(arr) {
    var _arguments11 = arguments,
        _this11 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var obj = _arguments11.length > 1 && _arguments11[1] !== undefined ? _arguments11[1] : {};

      /* validations */
      var validation = _validateArguments(arr);

      if ((0, _Result.isFailure)(validation)) return [validation];
      /* !validations */

      /* defaults */

      var extract = (0, _utils.isMissing)(obj.extract) ? false : obj.extract;
      var hops = (0, _utils.isMissing)(obj.hops) ? 1 : obj.hops;
      /* !defaults */

      /* logic */

      /**
       * 1. get Node's IDs.
       * 2. enhance each Node.
       */

      var results = yield _this11.matchNodes(arr);
      var data = yield Promise.all(results.map( /*#__PURE__*/function () {
        var _ref11 = (0, _asyncToGenerator2.default)(function* (result) {
          if ((0, _Result.isFailure)(result)) return result; // return await enhance(result.getData(), hops, this); // transformer
          // log(result)

          var data = result.getData();

          if (data.length === 0) {
            return new _Result.Failure({
              reason: 'no such Node found in database',
              parameters: result.parameters,
              data: []
            });
          }

          return yield enhance(result.getData()[0], hops, _this11); // wrapper
        });

        return function (_x13) {
          return _ref11.apply(this, arguments);
        };
      }()));

      if (extract) {
        return (0, _lodash.flatten)(data.map(_Result.getResultData));
      }

      return data; /////////////// FUN ///////////////

      /**
       * Check input.
       * @param {*} nodes
       */

      function _validateArguments(nodes) {
        if (!Array.isArray(nodes)) {
          return new _Result.Failure({
            reason: "Engine.enhanceNodes: Validation error: first argument must be array.\nfirst argument: ".concat(JSON.stringify(nodes)),

            /**@TODO adhere to data interface Result.data = Array<T> */
            data: nodes
          });
        }

        if (!nodes.length) return new _Result.Failure({
          reason: "Engine.enhanceNodes: Validation error: first argument must be non-empty array.\nfirst argument: ".concat(JSON.stringify(nodes)),
          data: nodes
        }); // const isnode = nodes.map(isNode);

        var isnode = nodes.map(node => (0, _Node.isNode)(node) || (0, _Node.isNodeLike)(node));

        if (!isnode.every(_utils.isTrue)) {
          return new _Result.Failure({
            reason: "Engine.enhanceNodes: Validation error: first argument must be (Node|EnhancedNode|SimplifiedNode)[].\nfirst argument: ".concat(JSON.stringify(_Node.isNode)),
            data: nodes
          });
        }
        /**@TODO why? */


        return new _Result.Success();
      }

      function enhance(_x14, _x15, _x16) {
        return _enhance.apply(this, arguments);
      } /////////////// END ///////////////


      function _enhance() {
        _enhance = (0, _asyncToGenerator2.default)(function* (node, hops, ctx) {
          /* make query for each Successful node */
          var query = _createQuery(node); // log(query)

          /* I will use new wrapper here, so that I get [[startNode, Relationship, endNode],..] */


          var result = yield ctx.runQuery({
            query,
            wrap: true
          }); // log(result)

          /* now merge inbounds/outbounds into one enode */

          var rels = (0, _flattenDeep.default)(result.getData()).filter(_Relationship.isRelationship); // log(rels)

          /* create enode */

          /**
           * I should really use Builder here, but it botches up relationships.
           * On the other hand, Builder builds Nodes/Enodes/Relationships, ensuring
           * their contents according to a template, which after that lives its own
           * life - gets recorded into Neo4j. When I read it back, I don't need to
           * 'rebuild' its contents - just wrap into class to attach all methods.
           */

          var enode = new _EnhancedNode.EnhancedNode(_objectSpread({}, node)).deepen(rels);
          /* EnhancedNode {
            labels: [ 'Person' ],
            properties:
             { _uuid: 'fdcdae41-4815-4e45-b65c-79c25fb4ee33',
               _hash:
                '6661b5fb7ed89de9f9ad37608a209c713ea318a2e35dd32853114d7bef002895',
               _date_created: [ 2020, 5, 6, 3, 1588769317350 ],
               _label: 'Person',
               NAME: 'Pete' },
            identity: Integer { low: 4367, high: 0 },
            relationships: { inbound: [], outbound: [] } } */
          // log(enode)

          return new _Result.Success({
            parameters: {
              node
            },

            /**@TODO adhere to data interface Result.data = Array<T> */
            data: [enode] // data: enode,

          }); /////////////// FUN ///////////////

          function _createQuery(node) {
            var [label] = node.getLabels();
            var id = node.getId();
            var pathLength = hops > 1 ? "*1..".concat(hops) : "";
            var query = "\n        MATCH (endNode:".concat(label, ") \n        WHERE ID(endNode) = ").concat(id, "\n        MATCH (endNode)-[relationship").concat(pathLength, "]-(startNode)\n        RETURN startNode, relationship, endNode\n        ");
            return query;
          } /////////////// END ///////////////

        });
        return _enhance.apply(this, arguments);
      }
    })();
  }
  /* UPDATE */

  /**
   * Updates are done to Nodes so that oldNodes/oldEnodes are preserved.
   * @TODO [2022-02-10] I need to make preservation of old Nodes optional!
   *                    add { preserveNodes: bool }
   * Updatees get marked as:
   *  _isCurrent: false,
   *  _toDate: setDateCreated(), // just current timestamp, bad name
   *  _hasBeenUpdated: true,
   *  _nextNodeHash: updatee's hash,
   *  _dateUpdated: setDateCreated(),,
   *  _userUpdated: string
   */

  /**
   * Low level updaing function.
   * Receives fully descibed updatee (double checks with Neo4j) and updater nodes.
   * Merges updater node/enode as it is given.
   * Sets updatee's rels to _isCurrent: false, _toDate: setCurrentDate()
   * Sets (updatee)-[:HAS_UPDATE]->(updater)
   * @param {Object<updatee: Node|EnhancedNode, updater: Node|EnhancedNode>[]} arr - {updatee: ol1, updater: nn1}, {updatee: ol2, updater: nn2}]
   * @param {*} obj
   * @returns {Object<updatee: EnhancedNode, updater: EnhancedNode>[]} - all nodes as they are in Neo4j now.
   */


  updateNodes(arr) {
    var _arguments12 = arguments,
        _this12 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var obj = _arguments12.length > 1 && _arguments12[1] !== undefined ? _arguments12[1] : {};

      /* validations */
      if ((0, _utils.not)((0, _isArray.default)(arr))) {
        throw new Error("Engine.updateNodes validations: first argument must be UpdatingPair[]. UpdatingPair == { updatee: Node|EnhancedNode, updater: Node|EnhancedNode }");
      }

      if (arr.length == 0) return arr; // each object must be a Node|EnhancedNode pair

      arr.forEach(pair => {
        if ((0, _utils.not)((0, _keys.default)(pair).includes("updatee"))) {
          throw new Error("Engine.updateNodes validations: updatee is missing:\npair: ".concat(JSON.stringify(pair)));
        }

        if ((0, _utils.not)((0, _keys.default)(pair).includes("updater"))) {
          throw new Error("Engine.updateNodes validations: updater is missing:\npair: ".concat(JSON.stringify(pair)));
        }

        var {
          updatee,
          updater
        } = pair;

        if ((0, _utils.isMissing)(updatee) || (0, _utils.isMissing)(updater)) {
          throw new Error("Engine.updateNodes validations: this pair is not complete:\npair: ".concat(JSON.stringify(pair)));
        }

        if ((0, _utils.not)((0, _Node.isNode)(updatee)) || (0, _utils.not)((0, _Node.isNode)(updater))) {
          throw new Error("Engine.updateNodes validations: this pair does not qualify, both need to be Node|EnhancedNode:\npair: ".concat(JSON.stringify(pair)));
        } // we cannot update smth that does not exist in Neo4j


        if ((0, _utils.not)(updatee.isWritten())) {
          throw new Error("Engine.updateNodes validations: this pair's updatee has not been written to Neo4j yet. Each updatee must be written in Neo4j and have identifications:\npair: ".concat(JSON.stringify(pair)));
        }
      });
      /* !validations */

      /* defaults */

      var extract = (0, _utils.isPresent)(obj.extract) ? obj.extract : false;
      var flatten = (0, _utils.isPresent)(obj.flatten) ? obj.flatten : false;
      var transform = (0, _utils.isPresent)(obj.transform) ? obj.transform : false;
      var wrap = (0, _utils.isPresent)(obj.wrap) ? obj.wrap : true;
      var enhanceOnReturn = (0, _utils.isPresent)(obj.enhanceOnReturn) ? obj.enhanceOnReturn : false;
      var preserveUpdatee = (0, _utils.isPresent)(obj.preserveUpdatee) ? obj.preserveUpdatee : true;
      /* !defaults */
      /// 1.1 find all updatee's relationships, if preserveUpdatee == true, then we will need to preserve them as _isCurrent: false, else - we will simply delete them.
      // const arr_with_updatees_from_db: Result[] = await this.enhanceNodes(arr.map(pair => pair["updatee"]))

      var arr_with_updatees_from_db = yield Promise.all(arr.map( /*#__PURE__*/function () {
        var _ref12 = (0, _asyncToGenerator2.default)(function* (pair) {
          var {
            updatee,
            updater
          } = pair;
          /** @todo now we might need to check that updater is not in Neo4j yet */

          var result = yield _this12.enhanceNodes([updatee]); /// validations

          if ((0, _Result.isFailure)(result[0])) {
            throw new Error("Engine.updateNodes 1.1: looking for updatee's relationships in Neo4j, but failed:\nresult: ".concat(JSON.stringify(result)));
          }

          var updateeFromDb = result[0].getData();

          if ((0, _utils.not)((0, _EnhancedNode.isEnhancedNode)(updateeFromDb)) && (0, _utils.not)((0, _EnhancedNode.isEnhancedNode)(updateeFromDb[0]))) {
            throw new Error("Engine.updateNodes 1.1: looking for updatee's relationships in Neo4j, but failed: result does not contain an EnhancedNode\nresult: ".concat(JSON.stringify(result)));
          }

          if ((0, _EnhancedNode.isEnhancedNode)(updateeFromDb) && (0, _utils.not)(updateeFromDb.isWritten()) || (0, _utils.not)(updateeFromDb[0].isWritten())) {
            throw new Error("Engine.updateNodes 1.1: looking for updatee's relationships in Neo4j, but failed: returned EnhancedNode is not written to Neo4j!??!\nresult: ".concat(JSON.stringify(result)));
          } /// !validations


          return {
            updatee: updateeFromDb,
            updater
          };
        });

        return function (_x17) {
          return _ref12.apply(this, arguments);
        };
      }())); // log(arr_with_updatees_from_db)

      /**
       * Forms a Neo4j query
       * Quick n dirty - since updateNodes is not likely to deal with large batches of updates for now,
       * we make it simple, one query per one update.
       * @param {*} old
       * @param {*} young
       * @param {*} _case
       */

      var _main_worker = /*#__PURE__*/function () {
        var _ref13 = (0, _asyncToGenerator2.default)(function* (old_, young_, ctx) {
          var old = (0, _utils.unwrapIfInArray)(old_);
          var young = (0, _utils.unwrapIfInArray)(young_);
          /* validations */

          if ((0, _utils.isMissing)(old)) {
            throw new Error("Engine.updateNodes._main_worker: old is missing.\n".concat(old));
          }

          if ((0, _utils.isMissing)(young)) {
            throw new Error("Engine.updateNodes._main_worker: young is missing.\n".concat(young));
          }
          /* !validations */
          /// prepare (old)-[:HAS_UPDATE]->(young)


          var _hasUpdateRel = yield _.builder.buildRelationships([new _RelationshipCandidate.RelationshipCandidate({
            labels: ["HAS_UPDATE"],
            properties: {
              _isCurrent: true,
              // will always be true?
              _dateFrom: (0, _utils.setDateCreated)(),
              _dateTo: [],
              _isValid: true,
              _validFrom: (0, _utils.setDateCreated)(),
              _validTo: [],
              _userCreated: "DV" // getCurrentUser()

            },
            startNode: old,
            endNode: young,
            necessity: "required"
          })], {
            extract: true
          }); // log(_hasUpdateRel)
          /// regardless of whether young isNode or isEnhancedNode, we will turn it into
          /// EnhancedNode and add (old)-[:HAS_UPDATE]->(young) to its relationships
          /// young.addRelationships(Relationship[])
          /// turn young Node into EnhancedNode since it's better to use
          /// mergeEnhancedNodes over mergeNodes


          if ((0, _utils.not)((0, _EnhancedNode.isEnhancedNode)(young))) {
            var result = yield _.builder.buildEnhancedNodes([new _EnhancedNodeCandidate.EnhancedNodeCandidate(young)]);

            if ((0, _Result.isFailure)(result[0])) {
              throw new Error("Engine.updateNodes._main_worker: attempted to promote young Node to empty EnhancedNode, but failed.\nresult".concat(JSON.stringify(result)));
            }

            var youngEnode = result[0].getData();

            if ((0, _utils.not)((0, _EnhancedNode.isEnhancedNode)(youngEnode))) {
              throw new Error("Engine.updateNodes._main_worker: attempted to promote young Node to empty EnhancedNode, but failed, the result is not an EnhancedNode.\nyoungEnode".concat(JSON.stringify(youngEnode)));
            }

            young = youngEnode;
          }

          young.addRelationships(_hasUpdateRel); // log(young)
          /// now merge young instead of relationships

          var updaterFromDBResult = yield ctx.mergeEnhancedNodes([young]);

          if ((0, _Result.isFailure)(updaterFromDBResult[0])) {
            // lets just throw for simplicity, later mb return Failure for user to re-try
            throw new Error("Engine.updateNodes._main_worker: failed to merge newEnode.\nupdaterFromDBResult: ".concat(JSON.stringify(updaterFromDBResult)));
          } /// merge (old)-[:HAS_UPDATE]->(young)
          /// access updater written in Neo4j


          var updaterFromDB = updaterFromDBResult[0].firstDataElement;

          if ((0, _utils.not)((0, _EnhancedNode.isEnhancedNode)(updaterFromDB))) {
            throw new Error("Engine.updateNodes._main_worker: expected to receive updater as an EnhancedNode from DB.\nupdaterFromDB: ".concat(JSON.stringify(updaterFromDB)));
          } /// mark old as updated


          {
            // const result: Result[] = await ctx.markNodesAsUpdated([old], [updaterFromDB])
            var _result2 = yield ctx.markNodesAsUpdated([{
              updatee: (0, _utils.unwrapIfInArray)(old),
              updater: (0, _utils.unwrapIfInArray)(updaterFromDB)
            }]);

            if ((0, _Result.isFailure)(_result2[0])) {
              // lets just throw for simplicity, later mb return Failure for user to re-try
              throw new Error("Engine.updateNodes._main_worker: failed to mark old node as updated.\nresult: ".concat(JSON.stringify(_result2)));
            }
          } /// if old has any rels, mark those as _isCurrent: false

          {
            var oldRels = old.getAllRelationshipsAsArray();
            var newRelCandidates = oldRels.map(rel => {
              var updatedProps = _objectSpread(_objectSpread({}, rel.properties), {}, {
                _dateTo: (0, _utils.setDateCreated)(),
                _updateEventHashes: ["123"] // @todo mb we introduce UpdateEvent nodes and point to them by _hash??

              });

              return new _RelationshipCandidate.RelationshipCandidate(_objectSpread(_objectSpread({}, rel), {}, {
                properties: updatedProps,
                _isCurrent: false
              }));
            });
            var newRels = (yield _.builder.buildRelationships(newRelCandidates)).map(_Result.getResultData);
            var updateOldRels = yield ctx.editRelationships(oldRels, newRels); // log(update_old_rels)

            if ((0, _utils.not)(updateOldRels.every(_Result.isSuccess))) {
              throw new Error("Engine.updateNodes._main_worker: expected to succesfully update oldNode's relationships, but failed.\nupdateOldRels: ".concat(JSON.stringify(updateOldRels)));
            }
          } /// package return updatedPair { updatee: Enode, updater: Enode }

          var updatedPair = {}; /// if user wants to see a larger graph snapshot - we enhance all enodes

          if (enhanceOnReturn) {
            var enhanceUpdatedPair = yield ctx.enhanceNodes([old, updaterFromDB]);

            if (enhanceUpdatedPair.some(_Result.isFailure)) {
              throw new Error("Engine.updateNodes._main_worker: failed to enahance updatedPair.\nenhanceUpdatedPair: ".concat(JSON.stringify(enhanceUpdatedPair)));
            }

            updatedPair.updatee = (0, _utils.unwrapIfInArray)(enhanceUpdatedPair[0].getData());
            updatedPair.updater = (0, _utils.unwrapIfInArray)(enhanceUpdatedPair[1].getData());
          } else {
            updatedPair.updatee = (0, _utils.unwrapIfInArray)(old);
            updatedPair.updater = (0, _utils.unwrapIfInArray)(updaterFromDB);
          } // log(updatedPair)


          return updatedPair;
        });

        return function _main_worker(_x18, _x19, _x20) {
          return _ref13.apply(this, arguments);
        };
      }();

      var final = yield Promise.all(arr_with_updatees_from_db.map( /*#__PURE__*/function () {
        var _ref14 = (0, _asyncToGenerator2.default)(function* (pair, i) {
          var {
            updatee,
            updater
          } = pair;
          var result = yield _main_worker(updatee, updater, _this12);
          return result;
        });

        return function (_x21, _x22) {
          return _ref14.apply(this, arguments);
        };
      }())); // log(final)

      function _resultWrapper(data) {
        // log(extract)
        if (extract) {// return [{ updatee: Enode, updater: Enode }]
        } else {// return [{ updatee: Result, updater: Result }]
        }
      }

      return final; // return _resultWrapper(final)
      /////////////// END ///////////////
    })();
  }
  /**
   * 2020-06-05 This adds _isCurrent false, _dateUpdated, etc - all relevant props to those
   * Nodes that have been updated by updateNodes.
   * I chose not to construct editNodes (for now), this is a more restrictive/less general
   * approach until I figure out how to write/use editNodes.
   * @returns updatee as EnhancedNode
   * @todo change interface to UpdatingPair[]
   */


  markNodesAsUpdated(arr) {
    var _arguments13 = arguments,
        _this13 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var obj = _arguments13.length > 1 && _arguments13[1] !== undefined ? _arguments13[1] : {};

      /* validations */
      if ((0, _utils.not)((0, _isArray.default)(arr))) {
        throw new Error("Engine.markNodesAsUpdated validations: first argument must be UpdatingPair[]. UpdatingPair == { updatee: Node|EnhancedNode, updater: Node|EnhancedNode }.\narr:".concat(JSON.stringify(arr)));
      }

      if (arr.length == 0) return arr; // each object must be a Node|EnhancedNode pair

      arr.forEach(pair => {
        if ((0, _utils.not)((0, _keys.default)(pair).includes("updatee"))) {
          throw new Error("Engine.markNodesAsUpdated validations: updatee is missing:\npair: ".concat(JSON.stringify(pair)));
        }

        if ((0, _utils.not)((0, _keys.default)(pair).includes("updater"))) {
          throw new Error("Engine.markNodesAsUpdated validations: updater is missing:\npair: ".concat(JSON.stringify(pair)));
        }

        var {
          updatee,
          updater
        } = pair;
        updatee = (0, _isArray.default)(updatee) ? updatee[0] : updatee;
        updater = (0, _isArray.default)(updater) ? updater[0] : updater;

        if ((0, _utils.isMissing)(updatee) || (0, _utils.isMissing)(updater)) {
          throw new Error("Engine.markNodesAsUpdated validations: this pair is not complete:\npair: ".concat(JSON.stringify(pair)));
        }

        if ((0, _utils.not)((0, _Node.isNode)(updatee)) || (0, _utils.not)((0, _Node.isNode)(updater))) {
          throw new Error("Engine.markNodesAsUpdated validations: this pair does not qualify, both need to be Node|EnhancedNode:\npair: ".concat(JSON.stringify(pair)));
        } // we cannot update smth that does not exist in Neo4j


        if ((0, _utils.not)(updatee.isWritten())) {
          throw new Error("Engine.markNodesAsUpdated validations: this pair's updatee has not been written to Neo4j yet. Each updatee must be written in Neo4j and have identifications:\npair: ".concat(JSON.stringify(pair)));
        }
      });
      /* !validations */

      /* defaults */

      var extract = (0, _utils.isPresent)(obj.extract) ? obj.extract : false;
      var flatten = (0, _utils.isPresent)(obj.flatten) ? obj.flatten : false;
      var transform = (0, _utils.isPresent)(obj.transform) ? obj.transform : false;
      var wrap = (0, _utils.isPresent)(obj.wrap) ? obj.wrap : true;
      /* !defaults */

      /* prepare { query, parameters } */

      var objs = arr.map(pair => {
        var {
          updatee,
          updater
        } = pair; // log(updatee);

        return {
          updateeId: updatee.getId(),
          updateeHash: updatee.getHash(),
          //
          updaterPrivateProps: updater.getPrivateProperties(),
          _userUpdated: "DV"
        };
      }); // log(objs)

      var parameters = {
        objs
      };
      /**@todo add _nextNodeId ?? */

      var query = "\n    UNWIND $objs as obj\n    MATCH (oldNode) WHERE oldNode._hash = obj.updateeHash\n    SET oldNode += { _isCurrent: false, _hasBeenUpdated: true, _updateeNodeHash: obj.updaterPrivateProps._hash, _dateUpdated: [".concat((0, _utils.setDateCreated)(), "], _userUpdated: obj._userUpdated, _toDate: [").concat((0, _utils.setDateCreated)(), "]}\n    RETURN oldNode\n    ");
      /**@todo why is it Result, and not Result[] ? */

      var result = yield _this13.runQuery({
        query,
        parameters,
        wrap
      });
      if ((0, _Result.isFailure)(result)) return [result];

      if (extract) {
        return (0, _lodash.flatten)(result.getData());
      } else {
        result.data = (0, _lodash.flatten)(result.getData())[0];
        return [result];
      }
    })();
  }
  /* EDIT */

  /**
   * Edits are simple brute changes to Nodes/Relationships properties.
   * They do not take into account any graph integrity (datawise, consistency-wise etc).
   * Low level tools.
   */

  /**
   * Edit nodes in Neo4j, takes its Neo4j ID and
   * property object, simply rewrites node's properties
   * with supplied property object.
   * @param {*} param0
   * @example
   * [{ id: 123, properties: {a:1, b:2}}] // will match ID(x) = 123 and reset its
   *                                      // properties to {a:1,b:2}
   * @todo this method allows to screw what I have been
   * trying to avoid - all Nodes conforming to some template
   * standard. On the other hand it does seem to achieve what it
   * purports to achieve - to edit a Node's properties.
   *
   * @todo test
   */


  editNodesById() {
    var _arguments14 = arguments,
        _this14 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var {
        arr = [],
        extract = false,
        flatten = true,
        closeConnection = false
      } = _arguments14.length > 0 && _arguments14[0] !== undefined ? _arguments14[0] : {};

      /* validations */
      if (!arr.length) {
        return new _Result.Failure({
          reason: "Engine.editNodesById: Validation error: arr is empty: ".concat(arr, "."),
          parameters: {
            arr
          }
        });
      }
      /* !validations */

      /**
       * Logic.
       */


      var parameters = {
        arr
      };
      var query = "\n    UNWIND $arr as obj\n    MATCH (x) WHERE ID(x) = toInteger(obj.id)\n    SET x = obj.properties\n    RETURN x\n    ";
      var data = yield _this14.runQuery({
        query,
        parameters
      });

      if (data.success === false) {
        return new _Result.Failure({
          reason: "Engine.editNodesById: result is Failure",
          data
        }); // throw new Error(`Engine.updateNodesById: result is Failure: ${data}`)
      }

      var result = new _Result.Success({
        data
      }); // log(result)

      return extract ? result.extract() : result;
    })();
  }
  /**
   * Edits an existing Neo4j Relationship's properties and Labels.
   * This method simply edits an existing Relationship's properties and label, direction
   * ie everything except the Neo4j ID and _uuid.
   *
   * This is different from updateRelationships as the latter creates a newRel,
   * sets oldRel as _isCurrent: false, adding pointer to newRel _hash. The idea there
   * to preserve all knowledge, whilst pointing to current state.
   *
   * @todo At the moment (2020-06-03) I will just replace oldRel props with newRel props.
   * will add Label change and direction change later.
   *
   * @todo 2020-06-03 Sooner or later Relationship will have to conform to
   * { required, optional, _private } interface for properties.
   *
   * @todo 2021-08-03 change interface to UpdatingRelationship[] == [{ updateeRel, updaterRel }]
   *
   * @param {*} oldRels
   * @param {*} newRels
   * @param {*} obj
   */


  editRelationships(oldRels, newRels) {
    var _arguments15 = arguments,
        _this15 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var obj = _arguments15.length > 2 && _arguments15[2] !== undefined ? _arguments15[2] : {};

      if (!oldRels.every(_Relationship.isRelationship)) {
        throw new Error("Engine.editRelationships: first argument (oldRels) must be Relationship[].\noldRels: ".concat(JSON.stringify(oldRels)));
      }

      if (!oldRels.every(_Relationship.isWrittenRelationship)) {
        throw new Error("Engine.editRelationships: first argument (oldRels) must already have been written in Neo4j and have all identifications.\nisWrittenRelationship: ".concat(JSON.stringify(oldRels.map(_Relationship.isWrittenRelationship)), "\noldRels: ").concat(JSON.stringify(oldRels)));
      }

      if (!newRels.every(_Relationship.isRelationship)) {
        throw new Error("Engine.editRelationships: second argument (newRels) must be Relationship[].\nnewRels: ".concat(JSON.stringify(newRels)));
      }
      /* hm I will read Rels from N4j, then minimaly update it (until I have PropertyObj, it's gonna
      be messy) and edit back, so these newRels will be written.*/
      // if (newRels.some(isWrittenRelationship)) {
      //   throw new Error(`Engine.editRelationships: second argument (newRels) must not have been written in Neo4j, but some have been.\nnewRels: ${JSON.stringify(newRels)}`)
      // }


      if (oldRels.length !== newRels.length) {
        throw new Error("Engine.editRelationships: oldRels.length !== newRels.length.\noldRels: ".concat(JSON.stringify(oldRels), "\nnewRels: ").concat(JSON.stringify(newRels)));
      }

      var check = _check_oldRels_vs_newRels_consistency(oldRels, newRels);

      if ((0, _Result.isFailure)(check)) return [check];
      /* defaults */

      var extract = obj.extract !== undefined ? obj.extract : false;
      var flatten = obj.flatten !== undefined ? obj.flatten : false;
      var transform = obj.transform !== undefined ? obj.transform : false;
      var wrap = obj.wrap !== undefined ? obj.wrap : true;
      /**
       * 1. Since it's a written Relationship, just change its props.
       */

      /* prepare { query, parameters } */

      var objs = (0, _lodash.flatten)((0, _zip.default)(oldRels, newRels).map(_ref15 => {
        var [oldRel, newRel] = _ref15;
        return {
          oldRelLabels: oldRel.getLabels(),
          oldRelId: oldRel.getId(),
          oldRelStartNodeId: oldRel.getStartNodeId(),
          oldRelStartNodeHash: oldRel.getStartNodeHash(),
          //
          oldRelEndNodeId: oldRel.getEndNodeId(),
          oldRelProps: oldRel.getProperties(),
          oldRelHash: oldRel.getHash(),
          //
          newRelLabels: newRel.getLabels(),
          newRelProps: newRel.getProperties() //

        };
      })); // log(objs)

      var parameters = {
        objs
      }; //  WITH *
      // CALL apoc.create.addLabels([ID(startNode)], [startNode._label]) YIELD node as a

      var query1 = "\n    UNWIND $objs as obj\n    MATCH (startNode)-[relationship]->(endNode)\n    WHERE relationship._hash = obj.oldRelHash AND startNode._hash = obj.oldRelStartNodeHash\n    SET relationship = obj.newRelProps\n    RETURN startNode, relationship, endNode\n    ";
      var query = "\n    UNWIND $objs as obj\n    MATCH (startNode)-[relationship]->(endNode)\n    WHERE ID(relationship) = toInteger(obj.oldRelId) AND ID(startNode) = obj.oldRelStartNodeId\n    SET relationship = obj.newRelProps\n    RETURN startNode, relationship, endNode\n    ";
      var dbresult = yield _this15.runQuery({
        query,
        parameters,
        wrap
      });

      if ((0, _Result.isFailure)(dbresult)) {
        return [dbresult];
      }
      /* return only Relationships */


      var final = _resultWrapper(oldRels, newRels, dbresult);

      return final; /////////////// FUN ///////////////

      /**
       * Do I need to check if newRel startNode.hash == oldRel startNode.hash ?!
       */

      function _check_oldRels_vs_newRels_consistency(oldRels, newRels) {
        var holder = [];
        (0, _zip.default)(oldRels, newRels).forEach(_ref16 => {
          var [oldRel, newRel] = _ref16;

          /**
           * @IMPORTANT this will preclude us from editing direction!
           * I just need to check that there are only 2 unique hash
           */
          var result = (0, _uniq.default)([oldRel.getStartNodeHash(), oldRel.getEndNodeHash(), newRel.getStartNodeHash(), newRel.getEndNodeHash()]);
          /**
           * @potential_butt_hurt knowing my ability to construct logics keke =)
           * basically I'm trying to establish that we do not introduce extra hashes in
           * the Relationship, as we are trying to update that one oldRelationship (whose nodes
           * might have only one unique hash, as the Rel is self-referencing)
           */

          if (result.length > 2) {
            holder.push([oldRel, newRel]);
          }
        });

        if (holder.length) {
          return new _Result.Failure({
            reason: "Engine.editRelationships validation error: pair of oldRel & newRel do not match start/endNodes. See data.",
            // \nholder: ${JSON.stringify(holder)}
            data: holder
          });
        }

        return new _Result.Success();
      }
      /**
       * I need to map throut oldRels and return Success where
       * S.data = dbRels Relationship
       * S.parameter = { oldRel, newRel } // keep all at hand for reference
       *
       * Failure where I cannot match dbRel to newRel
       */


      function _resultWrapper(oldRels, newRels, dbresult) {
        var neo4jRels = (0, _lodash.flatten)(dbresult.getData()).filter(_Relationship.isRelationship);
        var result = (0, _zip.default)(oldRels, newRels).map(_ref17 => {
          var [oldRel, newRel] = _ref17;
          var holder = [];
          holder.push(...neo4jRels.filter(rel => rel.getHash() === newRel.getHash())); // log(holder)

          if (!holder.length) {
            /* this means we do not have newRel (updating Relationship) among those returned by Neo4j */
            return new _Result.Failure({
              reason: "Engine.editRelationships._resultWrapper: did not match newRel hash with those returned by Neo4j.",
              parameters: {
                oldRel,
                newRel
              }
              /**@TODO adhere to data interface Result.data = Array<T> */
              // data: []

            });
          } else {
            return new _Result.Success({
              parameters: {
                oldRel,
                newRel
              },

              /**@TODO adhere to data interface Result.data = Array<T> */
              // data: holder,
              data: holder[0]
              /**@todo can we have more than one REl here? */

            });
          }
        });
        return result;
      } /////////////// END ///////////////

    })();
  }
  /* DELETE */

  /**
   * @expects ids = [1,2,3..]
   * @param {*} param0
   */


  deleteNodesById() {
    var _arguments16 = arguments,
        _this16 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var {
        ids,
        extract = false
      } = _arguments16.length > 0 && _arguments16[0] !== undefined ? _arguments16[0] : {};

      /**
       * Validations.
       */
      if (!ids.length) {
        return new _Result.Failure({
          reason: "Engine.deleteNodesById: Validation error: ids is empty: ".concat(ids, "."),
          parameters: {
            ids
          }
        });
      }

      if (!ids.every(id => (0, _isNumber.default)(id))) {
        return new _Result.Failure({
          reason: "Engine.deleteNodesById: Validation error: ids must be Number[]: ".concat(ids, "."),
          parameters: {
            ids
          }
        });
      }
      /**
       * Logic.
       */


      var parameters = {
        ids
      };
      var query = "\n    UNWIND $ids as id\n    MATCH (x) WHERE ID(x) = toInteger(id)\n    DETACH DELETE x\n    RETURN x\n    ";
      var data = yield _this16.runQuery({
        query,
        parameters
      });

      if (data.success === false) {
        return new _Result.Failure({
          reason: "Engine.deleteNodesById: result is Failure. See data for error",
          data
        });
      }
      /* mb better to answer in kind - return Number[] */


      var result = data.extract().map(get("getId"));
      return extract ?
      /**@TODO adhere to data interface Result.data = Array<T> */
      new _Result.Success({
        data: result
      }).extract() : new _Result.Success({
        data: result
      });
    })();
  }
  /**
   * User can generate a Node | EnhancedNode hash and we will delete using it.
   * @WIP
   */


  deleteNodesByHash() {
    return (0, _asyncToGenerator2.default)(function* () {})();
  }
  /**
   * @WIP
   * Deletes Nodes by _hash.
   * Neo4j automatically deletes all Nodes relationships.
   * Returns all deleted data.
   *
   * atm [2022-02-16] APOC has only one delete function!
   * https://neo4j.com/labs/apoc/4.0/graph-updates/data-deletion/
   * CALL apoc.nodes.delete(node|nodes|id|[ids])
   *
   * @todo add _hash to return object, match deletedNode
   *
   * @param {Node[]} nodes                We only need Node's _hash to delete it.
   * @param {Object} parameterObject
   *  extract           - @default false  returns Result[], if true - returns EnhancedNode[]
   *  deletePermanently - @default false  @todo I might want to make default deletes 'soft'
   *                                      so that nodes are simply marked as _deleted: true
   *                                      Then this parameter will control hard delete.
   *
   * @returns {Result[]}  Success.data = EnhancedNode[] (lenght 1) with confirmations:
   * - _hasBeenDeleted: bool - confirms the Node does not exist in Neo4j
   * - _dateWasDeleted: TimeArray - confirms time of deletion (as per backend, not Neo4j!)
   * - _isArchived: bool - confirms whether it was archived instead of deleted.
   *
   */


  deleteNodes(nodes) {
    var _arguments17 = arguments,
        _this17 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var obj = _arguments17.length > 1 && _arguments17[1] !== undefined ? _arguments17[1] : {};

      /* validations */
      {
        if ((0, _utils.not)((0, _isArray.default)(nodes))) {
          return [new _Result.Failure({
            reason: "Engine.deleteNodes: validations: first argument must be Array.",
            parameters: {
              firstArgument: nodes
            }
          })];
        }

        if (nodes.every(_Node.isNode) == false) {
          return [new _Result.Failure({
            reason: "Engine.deleteNodes: validations: first argument must be Node[].",
            parameters: {
              firstArgument: nodes
            }
          })];
        }
      }
      /* !validations */

      /* defaults */

      var extract = (0, _utils.isMissing)(obj.extract) ? false : obj.extract; // const deletePermanently: boolean = isMissing(obj.deletePermanently) ? false : obj.deletePermanently

      /* !defaults */

      /* should I do a check? paranoid user */

      var enodes = yield _this17.enhanceNodes(nodes, {
        hops: 1,
        extract: true
      });
      var parameters = {
        nodes: nodes.map(_getNodeHash)
      };
      /**
       * @TODO thinking about how to implement returning all deleted data
       * mb I need 3 queries:
       * 1. returns all outbound relatinonships' snapshot.
       * 2. same for inbounds
       * 3. detach deletes x
       *
       * And we assemble the return value here.
       *
       * OR I could just use engine.enhanceNode()
       */

      var query = "\n    UNWIND $nodes as node\n    MATCH (x) WHERE x._hash = node._hash\n    DETACH DELETE x\n    RETURN x\n    ";
      var data = yield _this17.runQuery({
        query,
        parameters,
        transform: false,
        wrap: true
      });

      if ((0, _Result.isFailure)(data)) {
        return [new _Result.Failure({
          reason: "Engine.deleteNodes: result is Failure. See data for error",
          data: [data]
        })]; // throw new Error(`Engine.deleteNodesById: result is Failure: ${data}`)
      }

      var results = _resultWrapper(data.getData({
        flatten: true
      }), enodes);

      return extract ? results.map(_Result.getResultData) : results; /////////////// FUN ///////////////

      function _getNodeHash(node) {
        return {
          _hash: node.getHash()
        };
      }

      function _resultWrapper(data, enodes) {
        // log(data)
        var results = data.map((enode, i) => {
          if (!(0, _EnhancedNode.isEnhancedNode)(enode)) {
            return new _Result.Failure({
              reason: "Engine.deleteNodes._resultWrapper: expected an Enode.\nenode: ".concat(JSON.stringify(enode)),
              data: [enode]
            });
          } // match data's ids with enodes' ids


          var zipped = (0, _zip.default)(data, enodes);
          var idsMatch = zipped.reduce((acc, _ref18) => {
            var [deletedEnode, checkEnode] = _ref18;

            if (deletedEnode.getId() !== checkEnode.getId()) {
              acc.push(false);
            } else {
              acc.push(true);
            }

            return acc;
          }, []); // log(idsMatch);

          if (idsMatch.every(_utils.isTrue) !== true) {
            // show which ones didn't match

            /**
             * For me reading in future.
             * A simple filtering with a mask led to
             * writing a generator based predicate function.
             */
            function maskWith(arr) {
              function* iteratesOnArray(arr) {
                for (var _i = 0; _i < arr.length; _i++) {
                  yield arr[_i];
                }
              }

              var gen = iteratesOnArray(arr);
              return el => {
                var rv = gen.next();
                return rv.value;
              };
            }

            var didntMatch = zipped.filter(maskWith(idsMatch));
            throw new Error("Engine.deleteNodes: deleted ids and their corresponding Nodes' last snapshots' ids do not match:\n".concat(JSON.stringify(didntMatch)));
          }
          /* Just mark the latest snapshot as deleted
          As we have proved with idsMatch check
          that all these EnhancedNodes have been detached
          and deleted. */


          var rv = enodes[i];
          /* mark as deleted */

          var timeArray_ = (0, _utils.generateTimeArray)();
          rv.properties["_hasBeenDeleted"] = true;
          rv.properties["_whenWasDeleted"] = timeArray_;
          rv.properties["_isArchived"] = false;
          /* mark Relationships as deleted */

          rv.relationships.inbound.forEach(rel => {
            rel.properties = _objectSpread(_objectSpread({}, rel.properties), {}, {
              _hasBeenDeleted: true,
              _whenWasDeleted: timeArray_,
              _isArchived: false
            });
          });
          rv.relationships.outbound.forEach(rel => {
            rel.properties = _objectSpread(_objectSpread({}, rel.properties), {}, {
              _hasBeenDeleted: true,
              _whenWasDeleted: timeArray_,
              _isArchived: false
            });
          });
          return new _Result.Success({
            parameters: {
              nodeToDelete: nodes[i]
            },
            data: [rv]
          });
        });
        return (0, _lodash.flatten)(results);
      } /////////////// END ///////////////

    })();
  }
  /**
   * @WIP
   * Deletes a Relationship by _hash.
   *
   * @todo add deletePermanently
   *
   * @param {Relationship[]} relationships We only need Relationship's _hash to delete it.
   * @param {Object} parameterObject
   *  extract           - @default false  returns Result[], if true - returns EnhancedNode[]
   *  deletePermanently - @default false  @todo I might want to make default deletes 'soft'
   *                                      so that nodes are simply marked as _deleted: true
   *                                      Then this parameter will control hard delete.
   *
   * @returns {Result[]}  where S.data = [Relationship] which has been deleted,
   *                      S.parameters = { originalRel: Relationship supplied by user }
   *                      F.data: [Relationship] which hasn't been deleted. F.reason: why.
   */


  deleteRelationships(_rels) {
    var _arguments18 = arguments,
        _this18 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var obj = _arguments18.length > 1 && _arguments18[1] !== undefined ? _arguments18[1] : {};

      /* pure function */
      var rels = (0, _cloneDeep.default)(_rels);
      /* !pure function */

      /* validations */

      {
        if ((0, _utils.not)((0, _isArray.default)(rels))) {
          return [new _Result.Failure({
            reason: "Engine.deleteRelationships: validations: first argument must be Array.",
            parameters: {
              firstArgument: rels
            }
          })];
        }

        if (rels.every(_Relationship.isRelationship) == false) {
          return [new _Result.Failure({
            reason: "Engine.deleteRelationships: validations: first argument must be Relationship[].",
            parameters: {
              firstArgument: rels
            }
          })];
        }
      }
      /* !validations */

      /* defaults */

      var extract = obj.extract !== undefined ? obj.extract : false; // const deletePermanently = obj.deletePermanently !== undefined ? obj.deletePermanently : false

      /* !defaults */

      /* should I do a check? paranoid user */

      var parameters = {
        rels: rels.map(_getRelHash)
      };
      var query = "\n    UNWIND $rels as rel\n    MATCH ()-[x]->() where x._hash = rel._hash\n    WITH x, properties(x) as props\n    DELETE x\n    RETURN x, props \n    ";
      var result = yield _this18.runQuery({
        query,
        parameters,
        raw: true
      });

      if ((0, _Result.isFailure)(result)) {
        return [new _Result.Failure({
          reason: "Engine.deleteRelationships: result is Failure. See data for error",
          data: [result]
        })];
      }

      var final = _resultWrapper(result.getData({
        flatten: true
      }), rels);

      return extract ? final.map(_Result.getResultData) : final; /////////////// FUN ///////////////

      function _getRelHash(rel) {
        return {
          _hash: rel.getHash()
        };
      }
      /**
       * Make Result[] to return to user.
       *
       * Neo4j won't return anything for the Relationship that didn't exist,
       * so we need to create a Success.data = [] for it.
       * This piece of functionality is what wrapper is supposed to do.
       * But it feels more appropertate to put it here.
       *
       * @param {Record[]} deletedRels - Neo4j records from runQuery(... { raw: true })
       * @param {Relationship[]} originalRels
       * @returns {Result[]}
       */


      function _resultWrapper(deletedRels, originalRels) {
        var final = originalRels.map(originalRel => {
          // if deletedRels have a Record that matches originalRel by hash,
          // return Success({ parameters: { originalRel }, data: [updatedOriginalRel]})
          var originalRel_hash = originalRel.getHash();
          var deletedRel = deletedRels.filter(record => {
            var {
              _fields: [relationship, props]
            } = record;

            if ((0, _utils.not)((0, _has.default)(props, "_hash"))) {
              throw new Error("Engine.deleteRelationships: _resultWrapper: expected to find deleted Relationships's hash, but found none.\nrecord: ".concat(JSON.stringify(record)));
            }

            if (props._hash == originalRel_hash) {
              return true;
            }
          }); // we should either have 1 or 0 matches

          if (deletedRel.length > 1) {
            throw new Error("Engine.deleteRelationships: _resultWrapper: expected to find one or zero matches, instead there were more.\ndeletedRel: ".concat(JSON.stringify(deletedRel)));
          } // we have our match, the Rel was deleted


          if (deletedRel.length == 1) {
            // update originalRel with Neo4j's id and _uuid - as it might not have had those
            var updatedOriginalRel = (0, _cloneDeep.default)(originalRel);
            var [deletedRelIds, deletedRelProps] = deletedRel[0];
            updatedOriginalRel.identity = deletedRelIds.identity;
            updatedOriginalRel.properties._uuid = deletedRelProps._uuid;
            return new _Result.Success({
              parameters: {
                originalRel
              },
              data: [updatedOriginalRel]
            });
          }

          if (deletedRel.length == 0) {
            return new _Result.Success({
              reason: "originalRel did not exist in Neo4j.",
              parameters: {
                originalRel
              },
              data: []
            });
          }
        });
        return final;
      } /////////////// END ///////////////

    })();
  }

  cleanDB() {
    var _arguments19 = arguments,
        _this19 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var obj = _arguments19.length > 0 && _arguments19[0] !== undefined ? _arguments19[0] : {};
      var result = yield _this19.runQuery({
        query: "MATCH (x) detach delete x",
        logResult: obj.logResult
      });

      if (obj.msg) {
        if ((0, _Result.isSuccess)(result)) console.log(obj.msg);
      } else if (obj.log == true) {
        if ((0, _Result.isSuccess)(result)) console.log("all DB data dropped");
      }
    })();
  }
  /**
   * @WIP
   */


  deleteEnhancedNodes(enodes) {
    var _arguments20 = arguments;
    return (0, _asyncToGenerator2.default)(function* () {
      var obj = _arguments20.length > 1 && _arguments20[1] !== undefined ? _arguments20[1] : {};

      /* defaults */
      var extract = obj.extract !== undefined ? obj.extract : false;
      var deletePermanently = obj.deletePermanently !== undefined ? obj.deletePermanently : false;
    })();
  }
  /**
   * Low level Interface === Result.data = [node]
   * Merges an Enhanced CustomNode = CustomNode + all of its siblings with relationships.
   * RETURNS: EnhancedNode from the Graph.
   * USES: adding Transactions in K3 will add sub-graphs
   * @param {EnhancedNode} enode - a node with all of its 1st degree relationships
   * @deprecated use mergeEnhancedNodes instead
   */


  addSingleEnhancedNode(enode) {
    var _this20 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      /** validations **/

      /** logic **/

      /* adding nodes */
      var nodes = yield _this20.mergeNodes(enode.getParticipatingNodes());
      var [enhancedNode, ...rest] = nodes.getData(); // again, each is a Result!!

      /* here's our enode */

      var [enode_] = enhancedNode.getData();
      /* adding relationships & setting rels_ onto enode_ */

      var rels_in = enode.getInboundRelationships();
      var rels_out = enode.getOutboundRelationships();
      /* if it isn't EnhancedNode, it's just a Node */

      if (!(enode_ instanceof _EnhancedNode.EnhancedNode)) {
        enode_ = new _EnhancedNode.EnhancedNode(_objectSpread({}, enode_));
      }

      for (var rel of rels_in) {
        var rel_in = yield _this20.addSingleRelationship(rel); // again, Result here!!

        if (rel_in instanceof _Result.Failure) {
          return "addSingleEnhancedNode() relationship was not added as planned - think what to do here.";
        }

        enode_.relationships.inbound.push(rel_in.getData()[0]);
      }

      for (var _rel of rels_out) {
        var rel_out = yield _this20.addSingleRelationship(_rel);

        if (rel_out instanceof _Result.Failure) {
          return "addSingleEnhancedNode() relationship was not added as planned - think what to do here.";
        }

        enode_.relationships.outbound.push(rel_out.getData()[0]);
      }

      return new _Result.Success({
        parameters: _objectSpread({}, enode),
        data: [enode_]
      });
    })();
  }
  /**
   * Adds a relationship between ALREADY EXISTING nodes!! returns Success.data = [Relationship]
   * @todo should add non-exisitng nodes, as the point is to ADD a relationship
   * === ie a Relationship must exist after the function runs Successfully !
   * @todo make runQuery return Neo4j records - it's the only way to
   * establish correct relationship direction.
   * @param {Relationship} relationship
   * @param {string} parameter - label || all - match by Label only or by Lable + properties (REQUIRED + optional only)
   */


  addSingleRelationship(relationship, parameter) {
    var _this21 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      // return 'fuck all'

      /**
       * 0. Check arguments.
       * 1. Obtain IDs of start and endNodes: match them.
       * 2. Merge a relationship.
       * 3. Report Result
       */

      /* validations */
      if ((0, _utils.isMissing)(relationship)) {
        return [new _Result.Failure({
          reason: "Engine.addSingleRelationship(): nothing was passed as argument."
        })];
      }

      if (!(relationship instanceof _Relationship.Relationship)) return new _Result.Failure({
        reason: "Engine.addSingleRelationship(): accepts one Relationship."
      });
      /* do we have all of required main properties? */

      var {
        labels,
        properties,
        startNode,
        endNode
      } = relationship;
      if (!labels.length && (!properties || !Object.keys(properties).length)) return new _Result.Failure({
        reason: "Engine.addSingleRelationship(): a Relationship must have at least one label or one property.",
        parameters: {
          relationship
        }
      });
      /* are startNode & endNode instances of Node or EnhancedNode? */

      if (!(startNode instanceof _Node.Node || startNode instanceof _EnhancedNode.EnhancedNode) && !(endNode instanceof _Node.Node || endNode instanceof _EnhancedNode.EnhancedNode)) return new _Result.Failure({
        reason: "Engine.addSingleRelationship(): neither Node is instanceof Node.",
        parameters: {
          relationship
        }
      });
      if (!(startNode instanceof _Node.Node || startNode instanceof _EnhancedNode.EnhancedNode) || !(endNode instanceof _Node.Node || endNode instanceof _EnhancedNode.EnhancedNode)) return new _Result.Failure({
        reason: "Engine.addSingleRelationship(): ".concat(startNode instanceof _Node.Node ? "endNode" : "startNode", " is not instanceof Node."),
        parameters: {
          relationship
        }
      });
      /* !validations */

      /* all seem ok, let's merge Nodes into GDB */

      var nodes_ = yield _this21.mergeNodes([startNode, endNode]);
      if (nodes_ instanceof _Result.Failure) return new _Result.Failure({
        reason: "Was not able to merge nodes and set up relationship.",
        parameters: {
          relationship
        }
      });
      var [start, end] = nodes_.map(_Result.getResultData);
      var start_id = start.getId(),
          end_id = end.getId();
      var query = "\n        MATCH (x) WHERE ID(x) = ".concat(start_id, "\n        MATCH (y) WHERE ID(y) = ").concat(end_id, "\n        MERGE (x)-[z").concat(relationship.toString("_hash"), "]->(y)\n        ON CREATE set z = ").concat(relationship.toString("properties"), "\n        RETURN *\n        ");
      /* modify Result */

      var result = yield _this21.runQuery({
        query,
        transform: false,
        wrap: true
      });
      var [startNode_, endNode_, rel_] = result.getData({
        flatten: true
      });
      rel_.startNode = startNode_;
      rel_.endNode = endNode_;
      result.parameters = {
        relationship
      };
      result.data = [rel_];
      return result;
    })();
  }
  /**
   * @deprecated
   * Merges a single Node.
   * @param {Node} node
   */


  addSingleNode(node) {
    var _this22 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      /**
       * Adds one CustomNode only. Creates no relationships.
       * Reports Result.
       */
      if (!(node instanceof _Node.Node)) return new _Result.Failure({
        reason: "addSingleNode(): accepting only instances of Node.",
        parameters: {
          node
        }
      });
      if (!Object.keys(node.getProperties()).length) return new _Result.Failure({
        reason: "CustomNode has no properties",
        parameters: {
          node
        }
      });
      var query = "\n            CALL apoc.create.uuids(1) YIELD uuid\n            MERGE (x".concat(node.toString(), ")\n            FOREACH (n in CASE \n            WHEN not(exists(x._uuid)) THEN [1]\n            ELSE []\n            END | SET x._uuid=uuid) \n            RETURN x\n        ");
      return yield _this22.runQuery({
        query
      });
    })();
  }
  /* WIP */

  /**
   * Driver Manual https://neo4j.com/docs/javascript-manual/current/session-api/configuration/
   * Driver API https://neo4j.com/docs/api/javascript-driver/current/
   * Recommended
   *
   * Before writing a transaction function it is important to ensure that any side-effects
   * carried out by a transaction function should be designed to be idempotent. This is because
   * a function may be executed multiple times if initial runs fail.
   *
   * Any query results obtained within a transaction function should be consumed within that
   * function, as connection-bound resources cannot be managed correctly when out of scope.
   * To that end, transaction functions can return values but these should be derived values
   * rather than raw results.
   */
  //  async runTxFunction() {}


}
/**
 * Utility function to separate nodes by their label for quick index-based r/w.
 *
 * @param {(PartialNode|Node|EnhancedNode)[]} arr
 */


exports.Engine = Engine;

function toMapByLabel(arr) {
  return arr.reduce((acc, node) => {
    var labels = node.getLabels().join(":");

    if (!acc[labels]) {
      acc[labels] = [node];
      return acc;
    }

    acc[labels].push(node);
    return acc;
  }, {});
}
/**
 * Taken from Node.
 * @param {any} val
 */


function stringifyPerType(val) {
  if (typeof val === "string") return "'".concat(String(val), "'");
  if (typeof val === "number") return "".concat(val);
  if (typeof val === "boolean") return !!val ? "true" : "false";

  if (val instanceof Array) {
    var result;

    if (val.every(elm => typeof elm === "number")) {
      result = val.reduce((acc, elm) => {
        acc += "".concat(elm, ", ");
        return acc;
      }, "");
      return "[".concat(result.substr(0, result.length - 2), "]");
    }

    result = val.reduce((acc, elm) => {
      if (typeof elm === "number") return acc += "'".concat(elm, "', ");
      if (typeof elm === "string") return acc += "'".concat(elm, "', ");
      acc += "".concat(elm, ", ");
      return acc;
    }, "");
    return "[".concat(result.substr(0, result.length - 2), "]");
  }

  return "";
}
/**
 * Wrapper translates Neo4j classes into our classes.
 * Neo4j Node -> Mango Node
 * Neo4j Relationship -> Mango Relationship
 *
 * Wrapper DOES NOT alter Neo4jResult's structure: ie if we asked
 * for a [startNode, rel, endNode] (enhancing Nodes, merging etc)
 * then we receive [startNode, rel, endNode][] - wrapper just wraps
 * those into
 *  [startNode: EnhancedNode, rel:Relationship, endNode:EnhancedNode]
 * and returns.
 *
 * Consumers will implement their transformations before the final
 * result is returned to user.
 *
 * @param {Neo4jResult} result - Neo4j's response.
 * @param {Object} obj - Configuration object.
 * @returns {Object<data: (Node | Relationship | Failure)[], summary: Object>}
 */


function wrapper(result) {
  var obj = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  /* defaults */
  var returnSuccess = (0, _utils.isMissing)(obj.returnSuccess) ? false : obj.returnSuccess;
  /* !defaults */

  var summary = _getSummaryFromResult(result);

  var data;

  if (!result.records.length) {
    data = [new _Result.Success({
      reason: NEO4J_RETURNED_NULL,
      data: [],
      summary
    })];
    return {
      data,
      summary
    };
  }

  data
  /* Class[] */
  = resultFromDriverTransformer(result);

  if (returnSuccess) {
    var _result3 = [new _Result.Success({
      data: (0, _lodash.flatten)(data)
    })];
    return {
      data: _result3,
      summary
    };
  }
  /* this is where data is EnhancedNode[][]  */


  return {
    data,
    summary
  }; /////////////// FUN ///////////////

  /**
   * @param {Object} result
   * @param {Class} customClass
   */

  function resultFromDriverTransformer(result, customClass) {
    var holder = result.records.map(_wrapIndividualRecord);

    var final = _appendPartnerNodesToRelationships(holder);

    return final; /////////////// FUN ///////////////

    function _wrapIndividualRecord(record) {
      // cuts off everything except _fields, wrapping its contents
      // log(record)
      var {
        keys,
        length,
        _fields,
        _fieldLookup
      } = record;

      var wrappedFields = _fields.map(field => {
        /* 
        field could be a Node|Relationship|Relationship[]
        if its an Array ==> it's a Relationship[] ??? only?
        cause of (s)-[r*1..2]-(e) pattern
        */
        if ((0, _utils.isMissing)(field)) {
          // throw new Error(`wrapper._wrapIndividualRecord: field is null or undefined.\nfield: ${JSON.stringify(field)}.\nrecord: ${JSON.stringify(record)}`)
          // return null
          return [];
        } else if (_isRelationshipLike(field)) {
          // log('_isRelationshipLike')
          return Array.isArray(field) ? field.map(f => relationshipTransformer(f, customClass)) : relationshipTransformer(field, customClass);
        }

        if (_isNodeLike(field)) {
          // log('_isNodeLike')
          return nodeTransformer(field, customClass);
        } // TimeTree returned Node[]


        if ((0, _isArray.default)(field)) {
          // log('aaaa arrrarary')
          return _wrapIndividualRecord(field);
        }

        throw new Error("wrapper._wrapIndividualRecord: field is neither Node nor Relationship.\nfield: ".concat(JSON.stringify(field))); // log('whata')
        // return []
      });

      return wrappedFields;
    }
    /* if Relationships exist, append full start/endNodes by id */


    function _appendPartnerNodesToRelationships(arr
    /* [startNode, rel, endNode][] */
    ) {
      var allNodes = (0, _lodash.flatten)(arr).filter(_Node.isNode);
      var rv = arr.map(elm => {
        /* we are looking for [enode, [rel,..], enode] pattern */
        if (!Array.isArray(elm)) {
          return elm;
        }

        var rels = (0, _lodash.flatten)(elm).filter(_Relationship.isRelationship);
        /* proceed only if there are any Relationships */

        if (!rels.length) {
          return elm;
        }

        rels.forEach(rel => {
          if (!(0, _Relationship.isRelationship)(rel)) {
            throw new Error("wrapper._appendPartnerNodesToRelationships: rel is supposed to be a Relationship.\nrel: ".concat(JSON.stringify(rel, null, 4)));
          }

          rel.setStartNode(allNodes.filter(node => node.getId() === rel.startNode.low)[0]);
          rel.setEndNode(allNodes.filter(node => node.getId() === rel.endNode.low)[0]);
          /**
           * @todo check hash consistency - ie rel.getHash() must == rel.makeHash()
           */
        });
        return elm;
      });
      return rv;
    } /////////////// END ///////////////

  }
  /**
   *
   * @param {Object} node
   * @param {Class} customClass
   */


  function neo4jNodeTransformer(node) {
    var customClass = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _Node.Node;
    var {
      labels,
      properties,
      identity
    } = node;
    /**
     * @todo include check has(customClass, 'propertiesToNumber') or isNode(customClass)
     */

    var result = new customClass({
      labels,
      properties,
      identity
    }).propertiesToNumber();
    return result;
  }
  /**
   * @todo need to make Nodes/EnhancedNodes
   * @param {Object} node
   * @param {Class} customClass
   */


  function nodeTransformer(node, customClass) {
    var {
      identity,
      labels,
      properties
    } = node;
    var constructor = _EnhancedNode.EnhancedNode; //nodes['EnhancedNode']
    // log(constructor)

    return neo4jNodeTransformer(node, constructor);
  }
  /**
   * Apply our Relationship class to Neo4j's relationships.
   * @param {Object} relationship - Relationship object.
   * @param {Class} customClass -
   */


  function relationshipTransformer(relationship, customClass) {
    var {
      identity,
      start: startNode,
      end: endNode,
      type,
      properties
    } = relationship;
    /* remove all Integers from properties */

    var newProperties = {};

    if (properties._date_created) {
      newProperties["_date_created"] = properties._date_created.map(_utils.neo4jIntegerToNumber);
    }

    for (var prop in properties) {
      if (prop === "_date_created") continue; // don't touch it again, timeArray is already transformed to int

      newProperties[prop] = (0, _utils.neo4jIntegerToNumber)(properties[prop]);
    }

    return new _Relationship.Relationship({
      labels: [type],
      properties: newProperties,
      identity,
      startNode,
      endNode,
      necessity: properties._necessity,
      direction: properties._direction
    });
  }
  /**
   * Self explanatory
   *
   * @private
   * @param {Neo4jResult} result
   * @returns {Object}
   */


  function _getSummaryFromResult(result) {
    return result.summary;
  }
  /**
   * @private
   */


  function _isRelationshipLike(field) {
    /* if we do hops, rels come back as Object[] */
    if (Array.isArray(field) && field.length > 0) {
      var _isRel = field[0].hasOwnProperty("start") && field[0].hasOwnProperty("end") && field[0].hasOwnProperty("type");

      return Boolean(_isRel);
    }

    var isRel = field.hasOwnProperty("start") && field.hasOwnProperty("end") && field.hasOwnProperty("type");
    return Boolean(isRel);
  }

  function _isNodeLike(field) {
    var isArr = Array.isArray(field);
    var isRel = field.hasOwnProperty("start") && field.hasOwnProperty("end") && field.hasOwnProperty("type");
    var labelsOK = field.hasOwnProperty("labels") && Array.isArray(field["labels"]);
    var propsOk = field.hasOwnProperty("properties") && typeof field["properties"] === "object";
    var idOk = field.hasOwnProperty("identity") && typeof field["identity"] === "object" && field["identity"].hasOwnProperty("high") && field["identity"].hasOwnProperty("low"); // log(`!isArr ${!isArr} && !isRel $!{!isRel} labelsOK ${labelsOK} propsOk ${propsOk} idOk ${idOk}`)

    return Boolean(!isArr && !isRel && labelsOK && propsOk && idOk);
  } /////////////// END ///////////////

}
/**
 * Handles session creation and session pooling.
 * @returns { session: Session, sessionId: str }
 */
// function createSession2(driver, sessionPool) /*: { Session, sessionId } */ {
//   // create a session
//   const session = driver.session();
//   // save into pool
//   const sessionId = uuid();
//   sessionPool[sessionId] = session;
//   return { session, sessionId };
// }

/**
 * Handles session destruction.
 * @returns { Result }
 */


function closeSession(_ref19) {
  var {
    session,
    sessionId
  } = _ref19;

  /* check if we have stuff to work with */
  if ((0, _utils.isMissing)(session) && (0, _utils.isMissing)(sessionId)) {
    throw new Error("Engine.closeSession: missing both session and sessionId, need at least one to proceed.\nsession: ".concat(JSON.stringify(session), "\n\nsessionId: ").concat(JSON.stringify(sessionId)));
  }

  if ((0, _utils.isPresent)(sessionId)) {
    /* close by id */
    sessionPool[sessionId].close();
    /* remove from pool */

    delete sessionPool[sessionId];
    return new _Result.Success({
      /**@TODO data interface Success.data != Array<T> */
      // data: [sessionId], // ?
      data: sessionId,
      reason: "Session ".concat(sessionId, " has been closed.")
    });
  } else {
    /* close the session */
    session.close();
    return new _Result.Success({
      data: session,
      reason: "Session has been closed."
    });
  }

  return new _Result.Success({
    data: {
      session,
      sessionId
    }
  });
}
/**
 * Closes driver. Evoke when program/test exits
 * @returns Result
 */


function closeDriver(driver) {
  driver.close();
  return new _Result.Success({
    data: driver
  });
}