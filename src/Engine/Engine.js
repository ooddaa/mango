/* @flow */

/**
 * @module Engine
 */

import crypto from "crypto";
import { builder, isTimeArray } from "../";
import {
  EnhancedNode,
  isNotEnhancedNode,
  isEnhancedNode,
} from "../Builder/templates/EnhancedNode";
import {
  isNode,
  isSameNode,
  isWrittenNode,
  Node,
} from "../Builder/templates/Node";
import { isPartialNode, PartialNode } from "../Builder/templates/PartialNode";
import {
  isRelationship,
  isNotRelationship,
  Relationship,
  isWrittenRelationship,
} from "../Builder/templates/Relationship";
import { RelationshipCandidate } from "../Builder/templates/RelationshipCandidate";
import {
  Failure,
  getResultData,
  getFirstDataElement,
  isResult,
  isFailure,
  isSuccess,
  Success,
} from "../Result";
import {
  hasher,
  isMissing,
  isPresent,
  isTrue,
  neo4jIntegerToNumber,
  setDateCreated,
  generateTimeArray,
  superlog,
  not,
  isFalse,
  unwrapIfInArray,
} from "../utils";
import { flatten as _flatten, isFunction } from "lodash";
import clondeDeep from "lodash/cloneDeep";
import flattenDeep from "lodash/flattenDeep";
import has from "lodash/has";
import isNumber from "lodash/isNumber";
import keys from "lodash/keys";
import values from "lodash/values";
import zip from "lodash/zip";
import uniq from "lodash/uniq";
import cloneDeep from "lodash/cloneDeep";
import identity from "lodash/identity";
import forIn from "lodash/forIn";
import { v4 as uuid } from "uuid";
import isArray from "lodash/isArray";
import isString from "lodash/isString";
import isObject from "lodash/isObject";
import { EnhancedNodeCandidate } from "../Builder/templates/EnhancedNodeCandidate";
import { Session, Driver } from "neo4j-driver-core";
import fs from "fs";

import neo4j from "neo4j-driver/lib/";

const {
  int,
  isInt,
  integer: { toNumber, inSafeRange },
} = neo4j;

const log = superlog(__dirname, { showDirectory: true });

const NEO4J_RETURNED_NULL = "Neo4j returned null.";

const sessionPool = {};

/* TYPES */
import type { UpdatingPair, UpdatedPair, timeArray } from "../types";
declare type CypherQuery = { query: string, parameters: Object };
declare type QueryObject = { query: string, originalNode: Node };
declare type Result = Success | Failure;
declare type Record = {
  keys: String[],
  length: Number,
  _fields: (Node | Relationship | any)[],
  _fieldLookup: Object,
};
declare type _Stats = {
  nodesCreated: Number,
  nodesDeleted: Number,
  relationshipsCreated: Number,
  relationshipsDeleted: Number,
  propertiesSet: Number,
  labelsAdded: Number,
  labelsRemoved: Number,
  indexesAdded: Number,
  indexesRemoved: Number,
  constraintsAdded: Number,
  constraintsRemoved: Number,
};
declare type Summary = {
  statement: {
    text: String,
    parameters: {},
  },
  statementType: String,
  counters: {
    _stats: _Stats,
  },
  updateStatistics: _Stats,
  plan: boolean,
  profile: false,
  notifications: any[],
  server: {
    address: String,
    version: String,
  },
  resultConsumedAfter: {
    low: Number,
    high: Number,
  },
  resultAvailableAfter: {
    low: Number,
    high: Number,
  },
};
declare type Neo4jResult = { records: Record[], summary: Summary };

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
  neo4jUsername: string;
  neo4jPassword: string;
  ip: string;
  port: string;
  sessionPool: Object;
  driver: Function | null;
  session: Function;
  database: string;

  constructor(
    config: {
      neo4jUsername: string,
      neo4jPassword: string,
      ip?: string,
      port?: string,
      database?: string,
      driver?: Driver,
    } = {}
  ) {
    /* Allow users to supply their custom driver */
    if (isMissing(config.driver)) {
      if (isMissing(config.neo4jUsername)) {
        throw new Error(
          `Engine: user must supply a valid Neo4j DBMS user name.\nneo4jUsername: ${config.neo4jUsername}`
        );
      }
      if (isMissing(config.neo4jUsername)) {
        throw new Error(
          `Engine: user must supply a valid Neo4j DBMS password.\nneo4jPassword: ${config.neo4jPassword}`
        );
      }
    }

    this.neo4jUsername = config.neo4jUsername;
    this.neo4jPassword = config.neo4jPassword;
    this.ip = config.ip || "0.0.0.0";
    // this.ip = isPresent(config.ip) ? config.ip : "0.0.0.0";
    this.port = config.port || "7687";
    // this.port = isPresent(config.port) ? config.port : "7687";
    this.driver = config.driver || null; // start driver explicitly
    this.database = config.database || "neo4j";
    // this.database = isPresent(config.database) ? config.database : "neo4j";
    this.sessionPool = {};
  }

  /* DRIVER SETUP */

  /**
   * Instantiates Neo4j's official JavaScript Driver
   * https://neo4j.com/docs/api/javascript-driver/current/
   *
   * Props: https://neo4j.com/docs/api/javascript-driver/current/function/index.html#static-function-driver
   */
  startDriver(props?: Object): Driver {
    try {
      let driver;
      let args = [
        `bolt://${this.ip}:${this.port}`,
        neo4j.auth.basic(this.neo4jUsername, this.neo4jPassword),
        { encrypted: "ENCRYPTION_OFF", ...props },
      ];

      if (this.driver) {
        // if (not(isFunction(this.driver))) {
        if (not(isFunction(this.driver))) {
          /* make it obvious - user wanted to supply driver but it failed. */
          throw new Error(
            `Engine.startDriver: driver not a Function.\nthis.driver: ${JSON.stringify(
              this.driver,
              null,
              4
            )}`
          );
        }
        /* flowJs, calm down, we know that this.driver IS a Function here */
        driver = this.driver && this.driver(...args);
      } else {
        driver = neo4j.driver(...args);
      }

      /* when invoked manually */
      this.driver = driver;

      /* when invoked via constructor */
      return driver;
    } catch (error) {
      console.error(error);
      throw new Error(
        `Engine.startDriver: could not instantiate driver.\nerror: ${error}`
      );
    }
  }

  /**
   * We can check if dtabase is available.
   * https://neo4j.com/docs/api/javascript-driver/current/file/lib6/driver.js.html
   */
  async verifyConnectivity(config: { database: string } = {}) {
    if (this.driver) {
      return config.database && isString(config.database)
        ? await this.driver.verifyConnectivity({ database: config.database })
        : await this.driver.verifyConnectivity();
    } else {
      return { address: null, version: null };
    }
  }

  /* TOOLS */

  getConditionMapping(): Object {
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
      "=~": "=~",
    };
  }

  /**
   * Used to make hash of Label + REQUIRED properties for later Node identification in mergeNodes.
   * @param {string} data
   */
  hasher(data: string): string {
    const hash = crypto.createHash("sha256");
    hash.update(data);
    const result = hash.digest("hex");
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
  createSession(
    config: { database: string } = { database: "neo4j" }
  ): { session: Session, sessionId: string } {
    /* create a session */
    let session;
    if (this.driver) {
      session =
        config.database && isString(config.database)
          ? this.driver.session({ database: config.database })
          : this.driver.session({ database: this.database });
    } else {
      throw new Error(
        `Engine.createSession: driver is not available.\nthis.driver: ${JSON.stringify(
          this.driver,
          null,
          4
        )}`
      );
    }

    /* save into pool */
    const sessionId = uuid();

    this.sessionPool[sessionId] = session;

    return { session, sessionId };
  }

  /**
   * Gracefully closes the session.
   *
   * @param {Object} config - Configuration object.
   * @param {Session} config.session - Active Session.
   * @param {string|null} config.sessionId - Session's id if available.
   * @returns {Result}
   */
  closeSession(
    config: { session: Session, sessionId: string | null } = {}
  ): Result {
    /**@todo omg why do we need to call this? should place all logic here. */
    return closeSession({
      session: config.session,
      sessionId: config.sessionId,
    });
  }

  /**
   * Closes all active sessions.
   *
   * @returns Result
   */
  closeAllSessions(): Result {
    forIn(this.sessionPool, (val, key) => {
      try {
        val.close();
        delete this.sessionPool[key];
      } catch (e) {
        throw new Error(
          `Engine.closeAllSessions errored:\nmessage: ${JSON.stringify(
            e,
            null,
            4
          )}`
        );
      }
    });
    return new Success({
      /**@todo data interface Success.data != Array<T> */
      data: this.sessionPool,
      parameters: {
        dataDescription: "return new Success({ data: this.sessionPool })",
      },
    });
  }

  /**
   * Closes driver. Evoke when program/test exits
   * @returns Result
   */
  closeDriver(): Result {
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
  async runQuery(
    config: {
      query: string,
      parameters?: Object,
      closeConnection?: boolean,
      wrap?: boolean,
      returnSuccess?: boolean,
      database?: string,
      session?: Session,
      _testRetry?: boolean,
      raw?: boolean,
      logResult?: boolean,
    } = {}
  ): Promise<Result> {
    /* validations */
    /* !validations */

    /* defaults */
    const query = config.query;
    const wrap = config.wrap || true;
    const parameters = config.parameters || {};
    const database = config.database || this.database;
    const returnSuccess = config.returnSuccess || false;
    const closeConnection = config.closeConnection || false;
    const _testRetry = config._testRetry || false;

    /* directly supplied session > this.sessionPool['specialSession'] > a new session */
    const { session, sessionId } = config.session
      ? { session: config.session, sessionId: null }
      : this.createSession({ database });

    /* at least return raw Neo4jResult */
    let raw = config.raw || false;
    if (not(wrap) && not(raw)) {
      raw = true;
    }

    const logResult = config.logResult || false;

    /* !defaults */

    return await session
      .run(query, parameters)
      .then((result) => {
        /* testing/debugging only */
        if (_testRetry) {
          return result;
        }

        /* return Neo4jResult */
        if (raw) {
          return new Success({
            /**@TODO data interface Success.data != Array<T> */
            data: result.records,
            summary: result.summary,
            query,
          });
        }

        /* use wrapper */
        const { data, summary } = wrapper(result, { returnSuccess });

        if (logResult) console.log(data, summary, query);
        return new Success({ data, summary, query });
      })
      .catch(async (e) => {
        console.log(`runQuery() Error: ${e}`);

        /* check if the error contains "can't acquire ExclusiveLock" phrase, and re-try in same session */
        if (isPresent(e.message.match("ExclusiveLock"))) {
          log("runQuery retried the transaction because of ExclusiveLock");
          return await this.runQuery({
            query,
            parameters,
            closeConnection,
            wrap,
            returnSuccess,
            session,
            sessionId,
            _testRetry,
          });
        }

        if (closeConnection) this.closeSession({ session, sessionId });

        return new Failure({
          reason: e.message, //"See data for Error",
          data: [e],
          query,
        });
      });
  }

  /**
   * Curried version of runQuery to get rid of ugly
   * closeConnection as second argument.
   * @param {*} closeConnection
   */
  async runQueryCurried(closeConnection: boolean = false) {
    const ctx = this;
    return async function fn(
      query: string,
      parameters: Object = {},
      config: { transform: boolean } = {
        transform: true,
      }
    ) {
      return await ctx.runQuery({
        query,
        parameters,
        closeConnection,
        transform: config.transform,
      });
    };
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
  async mergeNodes(
    arr: Node[],
    config: {
      extract?: boolean,
      wrap?: boolean,
      closeConnection?: boolean,
      _logExecutionTime?: boolean,
      database?: string,
    } = {}
  ): Promise<Result[]> {
    /* time */
    const start = process.hrtime();

    /* validations */
    if (not(isArray(arr))) {
      return [
        new Failure({
          reason: `Engine.mergeNodes(): Validation error: First argument must be Array.`,
          parameters: { arr },
        }),
      ];
    }
    /* First argument must be Node[]. */
    {
      const data = arr.filter((node) => {
        return not(isNode(node));
      });
      if (data.length) {
        return new Failure({
          reason: `Engine.mergeNodes(): Validation error: First argument must be Node[].`,
          data,
        });
      }
    }

    /**@todo check if Node has ID, call this.matchNodesById*/

    /* Failure if some Nodes have no label + _hash. */
    {
      const data = arr.filter((node) => {
        const hash = node.properties._hash;
        const [label] = node.labels;
        return !(
          typeof hash === "string" &&
          hash.length &&
          typeof label === "string" &&
          label.length
        );
      });
      if (data.length) {
        return new Failure({
          reason: `Engine.mergeNodes: Each Node must have label and _hash.`,
          data,
        });
      }
    }
    /* !validations */

    /* defaults */
    const extract = config.extract || false;
    const wrap = config.wrap || false;
    const closeConnection = config.closeConnection || false;
    const _logExecutionTime = config._logExecutionTime || false;
    const database = config.database || this.database;
    /* !defaults */

    /* LOGIC */

    /* Sort received nodes by their labels */
    const map = toMapByLabel(arr);

    /* Create array of queries for runQuery. */
    /* We do batched merging based on labels. */
    const arr_to_query = keys(map).map((labels) => {
      let parameters, query;
      parameters = {
        nodes: map[labels].map((node) => node.getProperties()),
      };

      query = `
      UNWIND $nodes as node
      MERGE (x:${labels} {_hash: node._hash})
      ON CREATE SET x = node
      WITH x
      CALL apoc.create.uuids(1) YIELD uuid
      FOREACH (changeMe IN CASE WHEN x._uuid IS NULL THEN [1] ELSE [] END | SET x._uuid = uuid)
      RETURN x 
      `;

      return { query, parameters };
    });

    /* runQuery on array, returns Result[][], will flatten later */
    const data: Result[] = await Promise.all(
      arr_to_query.map(async ({ query, parameters }) => {
        let result: Result = await this.runQuery({
          query,
          parameters,
          database,
        });

        /* adjust to OLRi */
        let rv;
        if (isResult(result)) {
          rv = result.getData({ flatten: true });

          /* to please flowJS */
          if (!rv) return [];

          /* so it knows that we can call rv.map */
          rv = rv.map((node) => {
            if (isFailure(node)) return node;
            if (isEnhancedNode(node)) {
              return new Success({
                /**@TODO data interface Success.data != Array<T> */
                data: node,
                query: result.query,
                summary: result.summary,
                parameters: {
                  /* append the original Node for reference */
                  node: parameters.nodes.find(
                    (originalNode) =>
                      originalNode._hash == node.properties._hash
                  ),
                },
              });
            }

            throw new Error(
              `Engine.mergeNodes: runQuery was expected to return EnhancedNodes or Failure, but got something else.\nnode: ${stringify(
                node
              )}\n\nquery: ${query}\n\nparameters: ${stringify(parameters)}`
            );
          });
        } else {
          throw new Error(
            `Engine.mergeNodes: runQuery was expected to return a Result.\nresult: ${stringify(
              result
            )}\n\nquery: ${query}\n\nparameters: ${stringify(parameters)}`
          );
        }

        return rv;
      })
    );

    const result = _flatten(data);

    /* !time */
    const [sec, ms] = process.hrtime(start);

    if (_logExecutionTime) log(`mergeNodes(): ${ms / 1e6}`);

    if (extract) return result.map(getResultData);

    return result;
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
  async mergeEnhancedNodes(
    enodes_: EnhancedNode[],
    config: {
      extract?: boolean,
      wrap?: boolean,
      logExecutionTime?: boolean,
    } = {}
  ): Promise<Result[]> {
    const enodes = cloneDeep(enodes_);

    /* validations */
    {
      const validationResult: Result = _validateArguments(enodes);
      if (isFailure(validationResult)) return [validationResult];
    }
    /* !validations */

    /* defaults */
    const wrap = config.wrap || true;
    const extract = config.extract || false;
    // const closeConnection = config.closeConnection || false;
    const logExecutionTime = config.logExecutionTime || false;
    /* !defaults */

    /* 1. unique node_hashMap */
    let node_hashMap: /* _hash: Node */ Object = _toNodeHashMap(enodes);
    /* 2. merge nodes */
    const mergeNodesResults: Result[] = await this.mergeNodes(
      values(node_hashMap),
      { extract: false, logExecutionTime, wrap }
    );
    // log(mergeNodesResults)

    {
      /* validations - check what's come back from DB */
      const response_nodes: Result = _check_results(mergeNodesResults, "Node");
      if (isFailure(response_nodes)) return [response_nodes];
    }

    /* 2a. replace node_hashMap with merged nodes */
    node_hashMap = _toNodeHashMap(mergeNodesResults.map(getResultData));

    /* 3. Preparing the returned results - update original enodes[] with merged nodes  */
    enodes.forEach((enode) => enode.identifyParticipatingNodes(node_hashMap));

    /* 4. unique rel_hashMap */
    let rel_hashMap: Object = _toRelHashMap(enodes);

    /* 4a. if enode has no relationships, don't attempt to merge them, as 
    Engine.mergeRelationships expects non empty Relationship[] */
    if (keys(rel_hashMap).length !== 0) {
      /* 5. merge Relationships */
      const mergedRelsResult: Result[] = await this.mergeRelationships(
        values(rel_hashMap),
        { extract: false, logExecutionTime }
      );

      {
        /* 5a. check results */
        const response_rels: Result = _check_results(
          mergedRelsResult,
          "Relationship"
        );
        if (isFailure(response_rels)) return [response_rels];
      }

      const mergedRels: Relationship[] = mergedRelsResult.reduce((acc, res) => {
        const data = res.getData()[0];
        if (isRelationship(data)) {
          acc.push(data);
        }
        return acc;
      }, []);

      /* 6. update original enodes[] with merged rels */

      rel_hashMap = _toHashMap(mergedRels);
      enodes.forEach((enode) => {
        enode.identifyParticipatingRelationships(rel_hashMap);
      });
    }

    /* Prepare results - add query & summary */
    const result: Result[] = _resultWrapper(enodes, mergeNodesResults);

    return extract ? result.map(getFirstDataElement) : result;

    /////////////// FUN ///////////////
    /**
     * Checks input.
     * @param {EnhancedNode[]} enodes
     * @returns {Result}
     */
    function _validateArguments(enodes: EnhancedNode[]): Result {
      if (!enodes.length)
        return new Failure({
          reason: `Engine.mergeEnhancedNodes(): Validation error: enodes.length === 0.`,
          data: enodes,
        });

      /* First argument must be EnhancedNode[]. */

      const data = enodes.filter(isNotEnhancedNode);

      if (data.length) {
        return new Failure({
          reason: `Engine.mergeNodes(): Validation error: First argument must contain only EnhancedNodes. Found something else, aborting.`,
          data,
        });
      }

      return new Success();
    }

    /**
     * Builds an object that lists given Node|Relationship by their _hash.
     * @param {any[]} arr
     * @returns {Object} where key:value == [_hash]: Node|Relationship
     */
    function _toHashMap(arr: any[]): Object {
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
    function _toNodeHashMap(arr: (EnhancedNode | EnhancedNode[])[]): Object {
      return arr.reduce((acc, val: any | any[]) => {
        /** @since { 2021-08-05 } swiching to wrap==true */
        if (isEnhancedNode(val[0])) {
          val = val[0];
        }

        /* for flowJS purposes */
        if (val instanceof EnhancedNode) {
          acc = { ...acc, ...val.getParticipatingNodes({ asHashMap: true }) };
        } else {
          throw new Error(
            `Engine.mergeEnhancedNodes._toNodeHashMap: val is not instance of EnhancedNode.\nval: ${stringify(
              val
            )}`
          );
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
    function _toRelHashMap(arr: EnhancedNode[]): Object {
      return clondeDeep(arr).reduce((acc, val) => {
        acc = {
          ...acc,
          ...val.getParticipatingRelationships({
            asHashMap: true,
            short: true,
          }),
        };
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
    function _check_results(
      results: Result[],
      type: "Node" | "EnhancedNode" | "Relationship"
    ): Result {
      const data = results.filter((result) => {
        return isFailure(result);
      });
      if (data.length) {
        return new Failure({
          reason: `Engine.mergeEnhancedNodes._check_result: Merging of some ${type}s was unsuccessful. See data.\ndata: ${JSON.stringify(
            data
          )}`,
          data,
        });
      }
      return new Success();
    }

    /**
     * Prepares return results.
     * @param {EnhancedNode[]} enodes - updated EnhancedNodes
     * @param {Result[]} mergeNodesResults - contains query and summary
     * @returns {Result[]}
     */
    function _resultWrapper(
      enodes: EnhancedNode[],
      mergeNodesResults: Result[]
    ): Result[] {
      return enodes.map((enode) => {
        const [{ query, summary }] = mergeNodesResults.filter(
          (result) => result.getData().getHash() === enode.getHash()
        );
        return enode.isWritten()
          ? new Success({ data: [enode], query, summary })
          : new Failure({
              reason: `enode.isWritten() === false.`,
              query,
              summary,
              data: [enode],
            });
      });
    }
    /////////////// END ///////////////
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
  async mergeRelationships(
    relationships: Relationship[],
    config: {
      extract?: boolean,
      wrap?: boolean,
      closeConnection?: boolean,
    } = {}
  ): Promise<Result[]> {
    const rels = cloneDeep(relationships);

    /* validations */
    const validation = _validateArguments(rels);
    if (isFailure(validation)) return [validation];
    /* !validations */

    /* defaults */
    const wrap = config.wrap || false;
    const extract = config.extract || false;
    const closeConnection = config.closeConnection || false;
    /* !defaults */

    /**@todo - if our participatingNodes aren't yet identified ??*/

    const cypherQueryArray = _2_toCypherQueryArray(rels);

    const mergedRelsResult: Result[] = await _3_merge(cypherQueryArray, this);

    /* check what's come back from DB */
    {
      const response: Result = _check_rels_result(mergedRelsResult);
      if (isFailure(response)) return [response];
    }

    /* extract Relationships */
    const mergedRels: Relationship[] = mergedRelsResult.reduce((acc, res) => {
      const extractedRelationships: Relationship[] = _extractRelationship(
        res.getData()
      );

      acc.push(...extractedRelationships);

      return acc;
    }, []);

    const results: Result[] = _resultWrapper(rels, mergedRels);
    return results;

    /////////////// FUN ///////////////
    /**
     * Check input.
     * @param {Relationship[]} rels
     */
    function _validateArguments(rels: Relationship[]): Result {
      if (!rels.length) {
        return new Failure({
          reason: `Engine.mergeRelationships(): Validation error: rels.length === 0.\nrels: ${stringify(
            rels
          )}`,
          data: rels,
        });
      }

      /* First argument must be Relationship[]. */

      const data = rels.filter(isNotRelationship);

      if (data.length) {
        return new Failure({
          reason: `Engine.mergeRelationships(): Validation error: First argument must contain only Relationships. Found something else, aborting.\nrels: ${stringify(
            rels
          )}`,
          data,
        });
      }

      return new Success();
    }

    /**
     * This is where rubber meets the road, I mean, Node meets Cypher.
     * We express our Relationships in Cypher to supply it later to _3_merge.
     * @param {Relationship[]} rels
     * @returns {CypherQuery[]}
     */
    function _2_toCypherQueryArray(rels: Relationship[]): CypherQuery[] {
      const parameters: Object = {
        rels: rels.map((rel) => rel.toCypherParameterObj()),
      };
      const query = `
      UNWIND $rels as rel
      MERGE (startNode { _hash: rel.startNode_hash })
      ON CREATE SET startNode = rel.startNodeProperties.all        
      MERGE (endNode { _hash: rel.endNode_hash })
      ON CREATE SET endNode = rel.endNodeProperties.all
      WITH *
      CALL apoc.merge.relationship(startNode, rel.properties._type, { _hash: rel.properties._hash }, rel.properties, endNode, {})
      YIELD rel as relationship
      WITH *
      CALL apoc.create.uuids(3) YIELD uuid
      WITH collect(uuid) as uuids, startNode, relationship, endNode
      FOREACH (ignoreMe IN CASE WHEN startNode._uuid IS NULL THEN [1] ELSE [] END | SET startNode._uuid = uuids[0]) 
      FOREACH (ignoreMe IN CASE WHEN relationship._uuid IS NULL THEN [1] ELSE [] END | SET relationship._uuid = uuids[1]) 
      FOREACH (ignoreMe IN CASE WHEN endNode._uuid IS NULL THEN [1] ELSE [] END | SET endNode._uuid = uuids[2]) 
      WITH *
      CALL apoc.create.addLabels([ID(startNode)], [startNode._label]) YIELD node as a
      CALL apoc.create.addLabels([ID(endNode)], [endNode._label]) YIELD node as b
      RETURN startNode, relationship, endNode
      `;
      return [{ query, parameters }];
    }

    /**
     * Query Neo4j for Relationships.
     * @param {Object[]} cypherQueryArray
     */
    async function _3_merge(cypherQueryArray, ctx): Promise<Result[]> {
      const results: Result[] = await Promise.all(cypherQueryArray.map(_query));
      return results;

      /**
       * The actual function that calls DB and returns Result
       * @param {CypherQuery} cypherQueryObject
       */
      async function _query({ query, parameters }): Promise<Result> {
        const result: Result = await ctx.runQuery({ query, parameters });
        return result;
      }

      /**
       * Simply unwraps Relationships.
       * @param {Result[]} results
       */
      function _extractRelationships(results: Result[]): Relationship[] {
        const result = results.reduce((acc, result) => {
          if (isSuccess(result)) {
            acc.push(...result.getData());
            return acc;
          } else {
            throw new Error(
              `Engine.mergeEnhancedNodes() _3_merge: received Failure from Neo4j, expected to receive a Success.data = [Relationship].`
            );
          }
        }, []);

        return result;
      }
    }

    /**
     * Check there are no `Neo4jError: Node(28829) already exists` errors.
     * @param {Result[]} results - Results to check.
     * @returns {Result}
     */
    function _check_rels_result(results: Result[]): Result {
      const data = results.filter((result) => {
        // are there Failures == runQuery returned Neo4j error
        return isFailure(result);
      });
      if (data.length) {
        return new Failure({
          reason: ` Engine.mergeRelationships._check_rels_result: Some Relationships were unsuccessful. See data.\ndata: ${stringify(
            data
          )}`,
          data,
        });
      }
      return new Success();
    }

    /**
     * Arrange nodes/rels by their _hash.
     */
    function _toRelsHashMap(arr: Relationship[]): Object {
      return arr.reduce((acc, rel) => {
        acc[rel.properties._hash] = rel;
        return acc;
      }, {});
    }

    function _extractRelationship(arr: Result[]): Relationship[] {
      if (!Array.isArray(arr)) {
        throw new Error(
          `Engine.mergeRelationships._extractRelationship: arr not an array.\narr: ${stringify(
            arr
          )}`
        );
      }
      const rels = flattenDeep(arr).filter(isRelationship);
      if (!rels.length) {
        throw new Error(
          `Engine.mergeRelationships._extractRelationship: expected at least one Relationship.\nrels: ${stringify(
            rels
          )}`
        );
      }
      return rels;
    }

    /**
     * Adjust return result for Result[].
     * @param {Relationship[]} originalRels - Relationships supplied by user.
     * @param {Relationship[]} mergedRels - Relationships returned from Neo4j.
     * @returns {Result[]}
     */
    function _resultWrapper(
      originalRels: Relationship[],
      mergedRels: Relationship[]
    ): Result[] {
      const newRelsHashMap: { hash: Relationship } = _toRelsHashMap(mergedRels);
      return originalRels.map((oldRel) => {
        // log(oldRel)
        const oldRelHash = oldRel.getHash();
        if (!has(newRelsHashMap, oldRelHash)) {
          return new Failure({
            parameters: oldRel,
            reason: `Engine.mergeRelationships._resultWrapper: did not find this Relationships by its hash among merged Relationships.\nHash changed? Merging failed?.\noldRel.hash: ${stringify(
              oldRelHash
            )}.`,
          });
        }
        const newRel = newRelsHashMap[oldRelHash];
        if (newRel.isWritten() == false) {
          log("newRel.isWritten() == false");
          console.log("newRel: ", stringify(newRel));
        }
        return newRel.isWritten()
          ? /**@TODO data interface Success.data != Array<T> */
            new Success({ parameters: oldRel, data: [newRel] })
          : // new Success({ parameters: oldRel, data: newRel })
            new Failure({
              parameters: oldRel,
              reason: `Engine.mergeRelationships._resultWrapper: newRel.isWritten() === false.\nSad, but true - we have a merged relationship, but currently we failed to represent it as a proper Relationship.\nmerged Relationship hashes & identities:\nRelationship:\nhash: ${newRel.getHash()}\nidentity ${newRel.getId()}\n\nstartNode:\nhash: ${newRel.getStartNodeHash()}\nidentity ${newRel.getStartNodeId()}\n\nendNode:\nhash: ${newRel.getEndNodeHash()}\nidentity ${newRel.getEndNodeId()}\n`,
              data: newRel,
            });
      });
    }
    /////////////// END ///////////////
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
  async matchNodes(
    nodes: Node | EnhancedNode[],
    config: {
      // extract: boolean,
    } = {}
  ): Promise<Result[]> {
    const arr = clondeDeep(nodes);
    /* validations */
    if (!arr.length) {
      return [
        new Failure({
          reason: `Engine.matchNodes: automat: must receive a non-empty array.`,
        }),
      ];
    }
    /* !validations */

    /* make a holder for validated objects */
    const holder: (Failure | Node)[] = arr.map((node) => {
      /* check it's a Node */
      if (not(isNode(node))) {
        return new Failure({
          reason: `Engine.matchNodes: automat: only instances of Node can be matched.`,
          parameters: { node },
        });
      }

      /* check if Node's ok */
      let { labels, properties } = node;
      if (labels.length == 0 && (!properties || keys(properties).length == 0)) {
        return new Failure({
          reason: `Engine.matchNodes: automat: a Node must have at least one label or one property.`,
          parameters: { node },
        });
      }

      /* Node's ok */
      return node;
    });
    /* !validations */

    /* defaults */
    /* !defaults */

    /* automat */
    const automat = async (holder: any[]): Promise<Result[]> => {
      if (holder.every(isFailure)) {
        return nothingToQuery(holder);
      }
      /* fullQuery will skip Failures */
      return fullQuery(holder);
    };

    /* queries */
    const nothingToQuery = async (arr: Failure[]): Promise<Result[]> => {
      return [
        new Failure({
          reason: `Engine.matchNodes: nothingToQuery: need at least one decent Node to search for.`,
          data: arr,
        }),
      ];
    };
    const fullQuery = async (arr: Node[]): Promise<Result[]> => {
      /* this array_to_query will be runQuery'ed in sequence */

      const array_to_query: (QueryObject | Node)[] = arr.map(
        function produceQueryObjects(node) {
          // log(node) // no uuids
          if (not(isNode(node))) {
            // throw new Error(
            //   `Engine.matchNodes.fullQuery.produceQueryObjects: expect a Node:\nnode ${stringify(
            //     node
            //   )}`
            // );
            return node;
          }

          /* check if it's a Neo4j Node really, if so, match by ID */
          if (has(node, ["identity"]) && node.identity !== null) {
            const query = `OPTIONAL MATCH (x) WHERE ID(x) = ${node.getId()} RETURN x`;
            return { query, originalNode: node };
          }

          /* check if _hash is present and match by it */
          if (has(node.properties, ["_hash"])) {
            const query = `OPTIONAL MATCH (x${node.toString("labels")}{_hash:'${
              node.properties._hash
            }'}) RETURN x`;
            return { query, originalNode: node };
          }

          /* hmm no _hash and no identity?? ok, match by its label && required properties */
          const query = `
        OPTIONAL MATCH (x${node.toString("all", { REQUIRED: true })})
        RETURN x
        `;
          /* pass on original Node to identify possible Failures */
          return { query, originalNode: node };
        }
      );

      /* run queries */
      const data: Result[] = await Promise.all(
        array_to_query.map(async (queryObject) => {
          /* [2022-03-02] removed dead code */
          // if (isFailure(queryObject)) return queryObject;

          const { query, originalNode } = queryObject;

          const level2: Result = await this.runQuery({
            query,
            transform: false,
            wrap: true,
          });

          /**
           * adjust return results to Result[] pattern where S.data = [Enode] or S.data = []
           * show which node was not found
           */
          const level1 = level2
            .getData({ flatten: true }) // wrap: true
            /* but if we match by property, length could be any */
            .map((node) => {
              if (isFailure(node)) {
                /* show what was not found */
                node.parameters = { originalNode };
                return node;
              }
              // if Neo4j returned no matches, it's represented as []
              if (isArray(node)) {
                if (node.length == 0) {
                  return new Success({
                    reason: NEO4J_RETURNED_NULL,
                    data: [],
                    parameters: { originalNode },
                  });
                } else {
                  const flattened = _flatten(node);
                  // check contents, should be EnhancedNodes
                  if (not(flattened.every(isEnhancedNode))) {
                    return new Failure({
                      reason:
                        "Expected EnhancedNode[], but got something else.",
                      data: flattened,
                      parameters: { originalNode },
                    });
                  }
                  return new Success({
                    data: node,
                    parameters: { originalNode },
                  });
                }
              }
              return new Success({
                /**
                 * @potential_bug As it's the case with matchNodesById, we expect
                 * to get only one successfull match! So we won't use Array here.
                 * [2021-08-11] - Yes we will use Array for consistency with other
                 * methods that return Result[] where S.data = [whatever]
                 * */
                data: [node],
                parameters: { originalNode },
              });
            });
          return level1;
        })
      );

      return _flatten(data);
    };
    return automat(holder);
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
  async matchPartialNodes(
    partialNodes: PartialNode[],
    config: {
      extract: boolean,
      flatten: boolean,
      useTimeTree: boolean,
    } = {}
  ): Promise<Result[]> {
    /* pure function */
    const arr = clondeDeep(partialNodes);
    /* !pure function */
    /* validations */
    {
      if (!arr.every(isPartialNode)) {
        return [
          new Failure({
            reason: `matchPartialNodes(): Validation error: only instances of PartialNode can be matched.\narr: ${JSON.stringify(
              arr
            )}`,
            parameters: { arr },
          }),
        ];
      }
    }
    /* !validations */

    /* defaults */
    const ctx = this;
    const extract = config.extract || false;
    const flatten = config.flatten || false;
    const useTimeTree = config.useTimeTree || false;
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

    const array_to_query: Object[] = arr.map((pnode) => {
      const { labels, properties } = pnode;

      /**
       * 1.
       * If we have any dates, it will usually be only one property that user
       * specified. If not, it's confusing, let's do something about it?
       * let's return Failure
       */

      const dates = extractDateConditions(properties);

      if (dates.length > 1) {
        return new Failure({
          reason: `matchPartialNodes() can match only one DATE property. More than one was supplied.`,
        });
      }

      let date_query;

      if (dates.length) {
        const date = properties[dates[0]];
        date_query = _produceDateQuery(date, { useTimeTree });
      }

      function _produceDateQuery(date: Object, { useTimeTree }): string {
        /* 
        {
          isDate: true,
          type: 'DAY',
          key: 'DAY',
          value: [2018, 1, 1, 1, 123]
        } 
        */
        var date_query = ``;
        const { isDate, isRange, type, key, value } = date;

        // [2021-08-16] not to use TimeTree will be default behaviour. As we want to simplify Mango.
        // TimeTree is now an additional plugin.

        // isDate == false && isRange == false
        if (isDate == false && (isMissing(isRange) || isRange == false)) {
          date_query = ``;
          // return date_query
        }
        // Simple day case
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
        else if (isDate == true && (isMissing(isRange) || isRange == false)) {
          if (not(isTimeArray(value))) {
            throw new Error(
              `Engine.matchPartialNodes: _produceDateQuery: when isDate == true && isRange == false, the value must be a TimeArray.\nvalue: ${JSON.stringify(
                value
              )}`
            );
          }
          const [YEAR, MONTH, DAY] = value;
          date_query = `WHERE x.DAY[0] = ${YEAR} AND x.DAY[1] = ${MONTH} AND x.DAY[2] = ${DAY} `;
        }
        // Date range case
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
          if (isMissing(value[0])) {
            throw new Error(
              `Engine.matchPartialNodes: _produceDateQuery: when isDate == true && isRange == true, the value must be a [{from: TimeArray, to: TimeArray}].\nvalue: ${JSON.stringify(
                value
              )}`
            );
          }
          const [{ from, to }] = value;
          if (isMissing(from) || isMissing(to)) {
            throw new Error(
              `Engine.matchPartialNodes: _produceDateQuery: when isDate == true && isRange == true, the value must be a [{from: TimeArray, to: TimeArray}].\nvalue: ${JSON.stringify(
                value
              )}`
            );
          }
          const from_TIMESTAMP = from[4];
          const to_TIMESTAMP = to[4];
          date_query = `WHERE x.DAY[4] >= ${from_TIMESTAMP} AND x.DAY[4] <= ${to_TIMESTAMP} `;
        }

        return date_query;
      }

      /**
       * Deal with all non-date properties.
       */
      const props = extractConditions(properties);

      const properties_query = _buildWhereClauses(props, properties, this);

      /**
       * 3. Combine `timeTree_query` + `property_query`.
       */
      const query = _buildFinalQuery(date_query, properties_query, labels);
      // log(query)
      return {
        PartialNode: pnode,
        query,
      };
    });

    /**
     * 4. runQuery
     * Returns [Result, Result] R.data = EnhancedNode[] | []
     */
    const data: Result[] = await Promise.all(
      array_to_query.map(async function queryRunner(node) {
        if (isFailure(node)) return node;

        const { query, PartialNode } = node;

        const result: Result = await ctx.runQuery({ query });
        const innerData: Result[] | EnhancedNode[] = result.getData();

        /* that's when Neo4j returned null, no matches.
        I need to understand it better, but for now I'll monkey patch it
        to return Success.data = [], Success.reason = 'Neo4j returned null' */
        if (isSuccess(innerData[0])) {
          return innerData[0];
        }
        let enodes: EnhancedNode[] = _flatten(innerData);
        if (enodes.every(isEnhancedNode)) {
          /* all good */
          return new Success({ data: enodes });
        }
        throw new Error(
          `Engine.matchPartialNodes.queryRunner: did not expect to reach here.\nnode: ${stringify(
            node
          )}`
        );
      })
    );

    /* return results */
    if (extract) {
      const result = data.map(getResultData);
      return flatten ? _flatten(result) : result;
    }

    return data;

    /////////////// FUN ///////////////
    function extractDateConditions(properties) {
      const result = keys(properties)
        .filter((prop) => prop[0] !== `_`) // exclude _private properties
        .filter(
          (prop) =>
            isObject(properties[prop]) && properties[prop].isDate == true
        );

      return result;
    }

    function extractConditions(properties) {
      return keys(properties)
        .filter((prop) => prop[0] !== "_") // exclude _private properties
        .filter(
          (prop) =>
            !(isObject(properties[prop]) && properties[prop].isDate == true)
        ) // no dates
        .filter((prop) => isObject(properties[prop])); // but must be an object
    }

    /**
     * Builds Cypher queries based on PartialNode conditions.
     * @param {string[]} props
     * @param {Object[]} properties
     * @todo use conditionMaping as { 'CONTAINS': (valueItem) => { if (valueItem.lenght == 1)}}
     */
    function _buildWhereClauses(
      props: string[],
      properties: Object,
      ctx
    ): string {
      // log(props) ['A']
      const wheres = props.reduce((acc, prop) => {
        const { key, value, isCondition } = properties[prop];

        /* make use of conditions */
        if (isCondition) {
          /* there could be several conditions! */
          const conditions = value.map((conditionObj) => {
            // { get: 1, let: 3 }
            return keys(conditionObj) // ['get', 'let']
              .map((condition) => {
                // 'get
                const cond = ctx.getConditionMapping()[condition];
                let result;
                const value_item = conditionObj[condition];
                if (["IN", "in"].includes(cond)) {
                  result = `x.${key} IN ${stringifyPerType(value_item)}`; // Array => String
                } else if (["NOT", "not"].includes(cond)) {
                  result = `NOT x.${key} IN ${stringifyPerType(value_item)}`;
                } else if (["NIN", "nin"].includes(cond)) {
                  // no in
                  result = `NOT (x.${key} IN ${stringifyPerType(value_item)})`;
                } else if (["CONTAINSALL", "containsall"].includes(cond)) {
                  // I have this one case when I cannot put WHERE in front
                  result = `WITH x, [x in x.${key} WHERE x in ${stringifyPerType(
                    value_item
                  )} | x] as f WHERE size(f) > 1`;
                } else if (["CONTAINSANY", "containsany"].includes(cond)) {
                  result = `[x IN x.${key} WHERE x IN ${stringifyPerType(
                    value_item
                  )} | x]`;
                } else if (["NOT_CONTAINS", "not_contains"].includes(cond)) {
                  result = `NOT filter(x IN x.${key} WHERE x IN ${stringifyPerType(
                    value_item
                  )})`;
                } else if (["CONTAINS", "contains", "~", "=~"].includes(cond)) {
                  function worker(val) {
                    const holder = [];
                    if (isArray(val)) {
                      val.forEach((el, idx) => {
                        if (
                          val.length <= 1 || // is it the last element?
                          idx == val.length - 1 // is it the last element?
                        ) {
                          holder.push(
                            `x.${key} CONTAINS ${stringifyPerType(el)}`
                          );
                        } else {
                          holder.push(
                            `x.${key} CONTAINS ${stringifyPerType(el)} OR`
                          );
                        }
                      });
                    } else {
                      holder.push(stringifyPerType(val));
                    }
                    return holder.join(" ");
                  }

                  result = worker(value_item);
                }
                // } else if (["CONTAINS", "contains", "~", "=~"].includes(cond)) {
                //   result = `x.${key} CONTAINS ${stringifyPerType(
                //     isArray(value_item) ? value_item[0] : value_item
                //   )}`;
                // }
                else {
                  if (isString(value_item)) {
                    result = `x.${key} ${cond} '${value_item}'`;
                  } else {
                    result = `x.${key} ${cond} ${value_item}`;
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
        if (isPresent(value)) {
          if (typeof value[0] === "string") {
            acc.push(`x.${key} = '${value[0]}'`);
          } else {
            acc.push(`x.${key} = ${value[0]}`);
          }
        } else {
          return acc;
        }
        return acc;
      }, []);

      // fix for that one case which starts with WITH - multiple conditions
      function addWHERE(wheres) {
        // if it's 'WITH ...' don't add WHERE
        const queryArr = _flatten(wheres);
        let result = "";
        if (!queryArr.length) {
          return result;
        } else if (queryArr[0].split(" ")[0] == "WITH") {
          result = `${_flatten(wheres).join(" AND ")}`;
        } else {
          result = `WHERE ${_flatten(wheres).join(" AND ")}`;
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
    function _buildFinalQuery(
      WHEN?: string,
      WHERE?: string,
      labels: string[]
    ): string {
      // log(WHEN)
      if (isMissing(WHEN)) {
        WHEN = ``;
      }
      if (isMissing(WHERE)) {
        WHERE = ``;
      }

      const x =
        isPresent(labels[0]) && labels[0].length !== 0
          ? `x:${labels.join("|")}`
          : `x`;
      // log(x)
      var result = ``;

      // we dont have anything
      if (WHEN.length == 0 && WHERE.length == 0) {
        result = `MATCH (${x}) RETURN x`;
      }
      // we have a date string only
      if (WHEN.length !== 0 && WHERE.length == 0) {
        // WHEN is of
        // WHERE x.DAY[0] = 2018 AND x.DAY[1] = 1 AND x.DAY[2] IN [1, 2] or
        // WHERE x.DAY[0] = 2018 AND x.DAY[1] = 1 AND x.DAY[2] IN 1
        // type
        result = `MATCH (${x}) ${WHEN} RETURN x`;
      }
      // we have props only
      if (WHEN.length == 0 && WHERE.length !== 0) {
        result = `MATCH (${x}) ${WHERE} RETURN x`;
      }
      // we have a date string + props
      if (WHEN.length !== 0 && WHERE.length !== 0) {
        result = `MATCH (${x}) ${WHEN} AND ${WHERE} RETURN x`;
      }

      // log(result)
      return result;
    }
    /////////////// END ///////////////
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
  async matchNodesById(
    IDs: number[],
    obj: {
      extract: boolean,
      closeConnection: boolean,
      transfrom: boolean,
      wrap: boolean,
    } = {}
  ): Promise<Result[]> {
    /* validations */
    if (isMissing(IDs)) {
      return [
        new Failure({
          reason: "matchNodesById(): nothing was passed as an argument.",
        }),
      ];
    }

    if (not(isArray(IDs))) {
      return [
        new Failure({
          reason: "matchNodesById(): only accepts number[].",
          parameters: { IDs },
        }),
      ];
    }

    /**
     * @todo - leave it as is? It's more explicit to tell the user that
     * they supplied an empty [].
     */
    if (IDs.length == 0) {
      return [
        new Failure({
          reason: "matchNodesById(): IDs array is empty.",
          parameters: { IDs },
        }),
      ];
    }

    if (not(IDs.some(isNumber))) {
      return [
        new Failure({
          reason: "matchNodesById(): IDs must contain at least one number.",
          parameters: { IDs },
        }),
      ];
    }

    if (!IDs.every(isNumber)) {
      return [
        new Failure({
          reason: "matchNodesById(): IDs array must be numbers only.",
          parameters: { IDs },
        }),
      ];
    }
    /* !validations */

    /* defaults */
    const extract = isPresent(obj.extract) ? obj.extract : false;
    const closeConnection = isPresent(obj.closeConnection)
      ? obj.closeConnection
      : false;
    const transform = isPresent(obj.transform) ? obj.transform : false;
    const wrap = isPresent(obj.wrap) ? obj.wrap : true;
    /* !defaults */

    /* logic */
    const query = `
      OPTIONAL MATCH (x) 
      WHERE ID(x) IN [${IDs.join(", ")}] 
      RETURN *
    `;
    const result = await this.runQuery({
      query,
      closeConnection,
      transform,
      wrap,
    });

    /* need to customize runQuery's response */

    /* make sure the order is correct */
    let data = IDs.map(function wrapIdIntoResult(id, i) {
      const node = _flatten(result.data).filter((node) => {
        if (node.getId() === id) return node;
      });
      if (node.length === 1) {
        return new Success({
          parameters: { id },
          /**
           * @potential_bug - [2020-04-08] this is risky, although if we match by
           * ID we expect 1 or null nodes to come back. So it's ok.
           * */
          data: [...node],
        });
      } else {
        return new Failure({
          reason: `Node was not matched`,
          parameters: { id },
          data: [], //// [2021-08-10] all Result data should come back in arrays.
        });
      }
    });

    if (extract) {
      // add null instead of [] where Node was not matched
      const result = _flatten(
        data.map(getResultData).map((arr) => (arr.length === 0 ? null : arr))
      );

      return result;
    }
    return data;
  }

  /**
   * Matches if specified EnhancedNodes exist.
   * @param {EnhancedNode[]} arr
   * @returns {Result[]}
   */
  async matchEnhancedNodes(arr: EnhancedNode[]): Promise<Result[]> {}

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
  async matchRelationships(
    arr: Relationship[],
    parameter: string = "all"
  ): Promise<Result[]> {
    /* validations */
    {
      const validation = _validateArguments(arr);
      if (isFailure(validation)) return [validation];
    }
    /* validations */

    /* logic */
    /* query DB */
    const dbData: Result[] = await Promise.all(
      arr.map(async (rel) => {
        if (isFailure(rel)) return rel;

        const query = _createQuery(rel);

        return await this.runQuery({ query, wrap: true });
      })
    );

    /* filter out Relationships */
    const result: Result[] = dbData.map((result, i) => {
      const data = _flatten(result.getData()).filter(isRelationship);
      // const data = result.getData().filter(isRelationship);
      // log(data)
      /* if there were no Relationships, it is a Failure */
      if (!data.length) {
        return new Failure({
          reason: NEO4J_RETURNED_NULL,
          parameters: { rel: arr[i] },
          data: [],
        });
      }
      // append matched data
      result.data = data;
      /* specify which argument was passed as parameter */
      result.parameters = { rel: arr[i] };
      return result;
    });
    return result;

    /////////////// FUN ///////////////
    function _createQuery(rel: Relationship): String {
      return `OPTIONAL MATCH (x)-[z${rel.toString(
        parameter
      )}]->(y) RETURN x, y, z`;
    }

    /**
     * Check input.
     * @param {Relationship[]} rels
     * @returns {Result}
     */
    function _validateArguments(rels: Relationship[]): Result {
      if (!Array.isArray(rels)) {
        return new Failure({
          reason: `Engine.matchRelationships: Validation error: first argument must be array.\nfirst argument: ${JSON.stringify(
            rels
          )}`,
          /**@TODO adhere to data interface Result.data = Array<T> */

          // parameters: rels,
          // data: []
          data: rels,
        });
      }
      if (!rels.length)
        return new Failure({
          reason: `Engine.matchRelationships: Validation error: first argument must be non-empty array.\nfirst argument: ${JSON.stringify(
            rels
          )}`,
          data: rels,
        });

      const isRel = rels.map(isRelationship);
      if (!isRel.every(isTrue)) {
        return new Failure({
          reason: `Engine.matchRelationships: Validation error: first argument must be Relationship[].\nfirst argument: ${JSON.stringify(
            isRel
          )}`,
          data: rels,
        });
      }

      /**@TODO why ? */
      return new Success();
    }
    /////////////// END ///////////////
  }

  /**
   * @todo 2020-06-03 I need matchPartialRelationships to be able to match by label/property only
   * @question does neo4j allow matching relationships by its props only? YES!
   * create ()-[:Lol {a: 1}]->()
   * match ()-[x {a: 1}]-() return x
   * returns [{"a": 1}, {"a": 1}]
   */
  async matchPartialRelationships() {
    /**
     * by one label
     * 'MATCH ()-[x:${label}]-() RETURN x'
     * by multiple lables
     * 'MATCH ()-[x:${label}|${lable}]-() RETURN x'
     *
     */
  }

  /**
   * Does Relationship matching by IDs
   * @param {number[]} arr
   */
  async matchRelationshipsById(arr: number[]): Promise<Result> {
    // UNWIND $relIds as relId
    // MATCH (startNode)-[relationship]-(endNode)
    // WHERE ID
    // match ()-[r]-() where ID(r) IN [5419, 5418] return *
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
  async enhanceNodes(
    arr: Node[],
    obj: {
      extract: boolean,
      hops: number,
    } = {}
  ): Promise<Result[]> {
    /* validations */
    const validation = _validateArguments(arr);
    if (isFailure(validation)) return [validation];
    /* !validations */

    /* defaults */
    const extract = isMissing(obj.extract) ? false : obj.extract;
    const hops = isMissing(obj.hops) ? 1 : obj.hops;
    /* !defaults */

    /* logic */
    /**
     * 1. get Node's IDs.
     * 2. enhance each Node.
     */
    const results: Result[] = await this.matchNodes(arr);
    const data = await Promise.all(
      results.map(async (result) => {
        if (isFailure(result)) return result;
        // return await enhance(result.getData(), hops, this); // transformer
        return await enhance(result.getData()[0], hops, this); // wrapper
      })
    );
    if (extract) {
      return _flatten(data.map(getResultData));
    }
    return data;

    /////////////// FUN ///////////////
    /**
     * Check input.
     * @param {*} nodes
     */
    function _validateArguments(nodes: (Node | EnhancedNode)[]): Result {
      if (!Array.isArray(nodes)) {
        return new Failure({
          reason: `Engine.enhanceNodes: Validation error: first argument must be array.\nfirst argument: ${JSON.stringify(
            nodes
          )}`,
          /**@TODO adhere to data interface Result.data = Array<T> */

          data: nodes,
        });
      }
      if (!nodes.length)
        return new Failure({
          reason: `Engine.enhanceNodes: Validation error: first argument must be non-empty array.\nfirst argument: ${JSON.stringify(
            nodes
          )}`,
          data: nodes,
        });

      const isnode = nodes.map(isNode);
      if (!isnode.every(isTrue)) {
        return new Failure({
          reason: `Engine.enhanceNodes: Validation error: first argument must be (Node|EnhancedNode)[].\nfirst argument: ${JSON.stringify(
            isNode
          )}`,
          data: nodes,
        });
      }

      /**@TODO why? */
      return new Success();
    }

    async function enhance(node: Node, hops: number, ctx): Promise<Result> {
      /* make query for each Successful node */
      const query = _createQuery(node);
      // log(query)
      /* I will use new wrapper here, so that I get [[startNode, Relationship, endNode],..] */
      const result: Result = await ctx.runQuery({ query, wrap: true });
      // log(result)

      /* now merge inbounds/outbounds into one enode */
      const rels = flattenDeep(result.getData()).filter(isRelationship);
      // log(rels)
      /* create enode */
      /**
       * I should really use Builder here, but it botches up relationships.
       * On the other hand, Builder builds Nodes/Enodes/Relationships, ensuring
       * their contents according to a template, which after that lives its own
       * life - gets recorded into Neo4j. When I read it back, I don't need to
       * 'rebuild' its contents - just wrap into class to attach all methods.
       */
      const enode = new EnhancedNode({ ...node }).deepen(rels);

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
      return new Success({
        parameters: { node },
        /**@TODO adhere to data interface Result.data = Array<T> */

        data: [enode],
        // data: enode,
      });

      /////////////// FUN ///////////////
      function _createQuery(node: Node): Object {
        const [label] = node.getLabels();
        const id = node.getId();
        const pathLength = hops > 1 ? `*1..${hops}` : ``;
        const query = `
        MATCH (endNode:${label}) 
        WHERE ID(endNode) = ${id}
        MATCH (endNode)-[relationship${pathLength}]-(startNode)
        RETURN startNode, relationship, endNode
        `;
        return query;
      }
      /////////////// END ///////////////
    }
    /////////////// END ///////////////
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
  async updateNodes(
    arr: UpdatingPair[],
    obj: {
      extract: boolean,
      flatten: boolean,
      transform: boolean,
      wrap: boolean,
      enhanceOnReturn: boolean,
      preserveUpdatee: boolean,
    } = {}
  ): Promise<Result[]> {
    /* validations */
    if (not(isArray(arr))) {
      throw new Error(
        `Engine.updateNodes validations: first argument must be UpdatingPair[]. UpdatingPair == { updatee: Node|EnhancedNode, updater: Node|EnhancedNode }`
      );
    }
    if (arr.length == 0) return arr;

    // each object must be a Node|EnhancedNode pair
    arr.forEach((pair) => {
      if (not(keys(pair).includes("updatee"))) {
        throw new Error(
          `Engine.updateNodes validations: updatee is missing:\npair: ${JSON.stringify(
            pair
          )}`
        );
      }
      if (not(keys(pair).includes("updater"))) {
        throw new Error(
          `Engine.updateNodes validations: updater is missing:\npair: ${JSON.stringify(
            pair
          )}`
        );
      }

      const { updatee, updater } = pair;
      if (isMissing(updatee) || isMissing(updater)) {
        throw new Error(
          `Engine.updateNodes validations: this pair is not complete:\npair: ${JSON.stringify(
            pair
          )}`
        );
      }
      if (not(isNode(updatee)) || not(isNode(updater))) {
        throw new Error(
          `Engine.updateNodes validations: this pair does not qualify, both need to be Node|EnhancedNode:\npair: ${JSON.stringify(
            pair
          )}`
        );
      }
      // we cannot update smth that does not exist in Neo4j
      if (not(updatee.isWritten())) {
        throw new Error(
          `Engine.updateNodes validations: this pair's updatee has not been written to Neo4j yet. Each updatee must be written in Neo4j and have identifications:\npair: ${JSON.stringify(
            pair
          )}`
        );
      }
    });
    /* !validations */

    /* defaults */
    const extract = isPresent(obj.extract) ? obj.extract : false;
    const flatten = isPresent(obj.flatten) ? obj.flatten : false;
    const transform = isPresent(obj.transform) ? obj.transform : false;
    const wrap = isPresent(obj.wrap) ? obj.wrap : true;
    const enhanceOnReturn = isPresent(obj.enhanceOnReturn)
      ? obj.enhanceOnReturn
      : false;
    const preserveUpdatee = isPresent(obj.preserveUpdatee)
      ? obj.preserveUpdatee
      : true;
    /* !defaults */

    /// 1.1 find all updatee's relationships, if preserveUpdatee == true, then we will need to preserve them as _isCurrent: false, else - we will simply delete them.
    // const arr_with_updatees_from_db: Result[] = await this.enhanceNodes(arr.map(pair => pair["updatee"]))
    const arr_with_updatees_from_db: Result[] = await Promise.all(
      arr.map(async (pair) => {
        const { updatee, updater } = pair;
        /** @todo now we might need to check that updater is not in Neo4j yet */
        const result: Result[] = await this.enhanceNodes([updatee]);

        /// validations
        if (isFailure(result[0])) {
          throw new Error(
            `Engine.updateNodes 1.1: looking for updatee's relationships in Neo4j, but failed:\nresult: ${JSON.stringify(
              result
            )}`
          );
        }
        const updateeFromDb = result[0].getData();

        if (
          not(isEnhancedNode(updateeFromDb)) &&
          not(isEnhancedNode(updateeFromDb[0]))
        ) {
          throw new Error(
            `Engine.updateNodes 1.1: looking for updatee's relationships in Neo4j, but failed: result does not contain an EnhancedNode\nresult: ${JSON.stringify(
              result
            )}`
          );
        }
        if (
          (isEnhancedNode(updateeFromDb) && not(updateeFromDb.isWritten())) ||
          not(updateeFromDb[0].isWritten())
        ) {
          throw new Error(
            `Engine.updateNodes 1.1: looking for updatee's relationships in Neo4j, but failed: returned EnhancedNode is not written to Neo4j!??!\nresult: ${JSON.stringify(
              result
            )}`
          );
        }
        /// !validations

        return { updatee: updateeFromDb, updater };
      })
    );
    // log(arr_with_updatees_from_db)

    /**
     * Forms a Neo4j query
     * Quick n dirty - since updateNodes is not likely to deal with large batches of updates for now,
     * we make it simple, one query per one update.
     * @param {*} old
     * @param {*} young
     * @param {*} _case
     */
    const _main_worker = async (
      old_: Node | EnhancedNode,
      young_: Node | EnhancedNode,
      ctx
    ): string /* neo4j query */ => {
      let old = unwrapIfInArray(old_);
      let young = unwrapIfInArray(young_);
      /* validations */
      if (isMissing(old)) {
        throw new Error(
          `Engine.updateNodes._main_worker: old is missing.\n${old}`
        );
      }
      if (isMissing(young)) {
        throw new Error(
          `Engine.updateNodes._main_worker: young is missing.\n${young}`
        );
      }
      /* !validations */

      /// prepare (old)-[:HAS_UPDATE]->(young)
      const _hasUpdateRel: Relationship[] = await builder.buildRelationships(
        [
          new RelationshipCandidate({
            labels: ["HAS_UPDATE"],
            properties: {
              _isCurrent: true, // will always be true?
              _dateFrom: setDateCreated(),
              _dateTo: [],
              _isValid: true,
              _validFrom: setDateCreated(),
              _validTo: [],
              _userCreated: "DV", // getCurrentUser()
            },
            startNode: old,
            endNode: young,
            necessity: "required",
          }),
        ],
        { extract: true }
      );
      // log(_hasUpdateRel)

      /// regardless of whether young isNode or isEnhancedNode, we will turn it into
      /// EnhancedNode and add (old)-[:HAS_UPDATE]->(young) to its relationships
      /// young.addRelationships(Relationship[])
      /// turn young Node into EnhancedNode since it's better to use
      /// mergeEnhancedNodes over mergeNodes
      if (not(isEnhancedNode(young))) {
        let result: Result[] = await builder.buildEnhancedNodes([
          new EnhancedNodeCandidate(young),
        ]);
        if (isFailure(result[0])) {
          throw new Error(
            `Engine.updateNodes._main_worker: attempted to promote young Node to empty EnhancedNode, but failed.\nresult${JSON.stringify(
              result
            )}`
          );
        }
        let youngEnode = result[0].getData();
        if (not(isEnhancedNode(youngEnode))) {
          throw new Error(
            `Engine.updateNodes._main_worker: attempted to promote young Node to empty EnhancedNode, but failed, the result is not an EnhancedNode.\nyoungEnode${JSON.stringify(
              youngEnode
            )}`
          );
        }
        young = youngEnode;
      }
      young.addRelationships(_hasUpdateRel);
      // log(young)

      /// now merge young instead of relationships
      const updaterFromDBResult: Result[] = await ctx.mergeEnhancedNodes([
        young,
      ]);
      if (isFailure(updaterFromDBResult[0])) {
        // lets just throw for simplicity, later mb return Failure for user to re-try
        throw new Error(
          `Engine.updateNodes._main_worker: failed to merge newEnode.\nupdaterFromDBResult: ${JSON.stringify(
            updaterFromDBResult
          )}`
        );
      }
      /// merge (old)-[:HAS_UPDATE]->(young)
      /// access updater written in Neo4j
      const updaterFromDB: EnhancedNode =
        updaterFromDBResult[0].firstDataElement;
      if (not(isEnhancedNode(updaterFromDB))) {
        throw new Error(
          `Engine.updateNodes._main_worker: expected to receive updater as an EnhancedNode from DB.\nupdaterFromDB: ${JSON.stringify(
            updaterFromDB
          )}`
        );
      }

      /// mark old as updated
      {
        // const result: Result[] = await ctx.markNodesAsUpdated([old], [updaterFromDB])

        const result: Result[] = await ctx.markNodesAsUpdated([
          {
            updatee: unwrapIfInArray(old),
            updater: unwrapIfInArray(updaterFromDB),
          },
        ]);
        if (isFailure(result[0])) {
          // lets just throw for simplicity, later mb return Failure for user to re-try
          throw new Error(
            `Engine.updateNodes._main_worker: failed to mark old node as updated.\nresult: ${JSON.stringify(
              result
            )}`
          );
        }
      }

      /// if old has any rels, mark those as _isCurrent: false
      {
        const oldRels = old.getAllRelationshipsAsArray();
        const newRelCandidates: RelationshipCandidate[] = oldRels.map((rel) => {
          const updatedProps = {
            ...rel.properties,
            _dateTo: setDateCreated(),
            _updateEventHashes: ["123"], // @todo mb we introduce UpdateEvent nodes and point to them by _hash??
          };
          return new RelationshipCandidate({
            ...rel,
            properties: updatedProps,
            _isCurrent: false,
          });
        });
        const newRels: Relationship[] = (
          await builder.buildRelationships(newRelCandidates)
        ).map(getResultData);
        const updateOldRels: Result[] = await ctx.editRelationships(
          oldRels,
          newRels
        );
        // log(update_old_rels)
        if (not(updateOldRels.every(isSuccess))) {
          throw new Error(
            `Engine.updateNodes._main_worker: expected to succesfully update oldNode's relationships, but failed.\nupdateOldRels: ${JSON.stringify(
              updateOldRels
            )}`
          );
        }
      }

      /// package return updatedPair { updatee: Enode, updater: Enode }
      const updatedPair = {};

      /// if user wants to see a larger graph snapshot - we enhance all enodes
      if (enhanceOnReturn) {
        const enhanceUpdatedPair: Result[] = await ctx.enhanceNodes([
          old,
          updaterFromDB,
        ]);
        if (enhanceUpdatedPair.some(isFailure)) {
          throw new Error(
            `Engine.updateNodes._main_worker: failed to enahance updatedPair.\nenhanceUpdatedPair: ${JSON.stringify(
              enhanceUpdatedPair
            )}`
          );
        }
        updatedPair.updatee = unwrapIfInArray(enhanceUpdatedPair[0].getData());
        updatedPair.updater = unwrapIfInArray(enhanceUpdatedPair[1].getData());
      } else {
        updatedPair.updatee = unwrapIfInArray(old);
        updatedPair.updater = unwrapIfInArray(updaterFromDB);
      }
      // log(updatedPair)
      return updatedPair;
    };

    const final = await Promise.all(
      arr_with_updatees_from_db.map(async (pair, i) => {
        const { updatee, updater } = pair;
        const result = await _main_worker(updatee, updater, this);
        return result;
      })
    );
    // log(final)
    function _resultWrapper(data): Result[] {
      // log(extract)
      if (extract) {
        // return [{ updatee: Enode, updater: Enode }]
      } else {
        // return [{ updatee: Result, updater: Result }]
      }
    }

    return final;
    // return _resultWrapper(final)
    /////////////// END ///////////////
  }

  /**
   * 2020-06-05 This adds _isCurrent false, _dateUpdated, etc - all relevant props to those
   * Nodes that have been updated by updateNodes.
   * I chose not to construct editNodes (for now), this is a more restrictive/less general
   * approach until I figure out how to write/use editNodes.
   * @returns updatee as EnhancedNode
   * @todo change interface to UpdatingPair[]
   */
  async markNodesAsUpdated(
    arr: UpdatingPair[],
    obj: {
      extract: boolean,
      flatten: boolean,
      transform: boolean,
      wrap: boolean,
    } = {}
  ): Promise<Result[]> {
    /* validations */
    if (not(isArray(arr))) {
      throw new Error(
        `Engine.markNodesAsUpdated validations: first argument must be UpdatingPair[]. UpdatingPair == { updatee: Node|EnhancedNode, updater: Node|EnhancedNode }.\narr:${JSON.stringify(
          arr
        )}`
      );
    }
    if (arr.length == 0) return arr;

    // each object must be a Node|EnhancedNode pair
    arr.forEach((pair) => {
      if (not(keys(pair).includes("updatee"))) {
        throw new Error(
          `Engine.markNodesAsUpdated validations: updatee is missing:\npair: ${JSON.stringify(
            pair
          )}`
        );
      }
      if (not(keys(pair).includes("updater"))) {
        throw new Error(
          `Engine.markNodesAsUpdated validations: updater is missing:\npair: ${JSON.stringify(
            pair
          )}`
        );
      }

      let { updatee, updater } = pair;

      updatee = isArray(updatee) ? updatee[0] : updatee;
      updater = isArray(updater) ? updater[0] : updater;
      if (isMissing(updatee) || isMissing(updater)) {
        throw new Error(
          `Engine.markNodesAsUpdated validations: this pair is not complete:\npair: ${JSON.stringify(
            pair
          )}`
        );
      }
      if (not(isNode(updatee)) || not(isNode(updater))) {
        throw new Error(
          `Engine.markNodesAsUpdated validations: this pair does not qualify, both need to be Node|EnhancedNode:\npair: ${JSON.stringify(
            pair
          )}`
        );
      }
      // we cannot update smth that does not exist in Neo4j
      if (not(updatee.isWritten())) {
        throw new Error(
          `Engine.markNodesAsUpdated validations: this pair's updatee has not been written to Neo4j yet. Each updatee must be written in Neo4j and have identifications:\npair: ${JSON.stringify(
            pair
          )}`
        );
      }
    });
    /* !validations */

    /* defaults */
    const extract = isPresent(obj.extract) ? obj.extract : false;
    const flatten = isPresent(obj.flatten) ? obj.flatten : false;
    const transform = isPresent(obj.transform) ? obj.transform : false;
    const wrap = isPresent(obj.wrap) ? obj.wrap : true;
    /* !defaults */

    /* prepare { query, parameters } */
    const objs: Object[] = arr.map((pair) => {
      const { updatee, updater } = pair;
      // log(updatee);
      return {
        updateeId: updatee.getId(),
        updateeHash: updatee.getHash(), //
        updaterPrivateProps: updater.getPrivateProperties(),
        _userUpdated: "DV",
      };
    });
    // log(objs)
    const parameters = { objs };
    /**@todo add _nextNodeId ?? */
    const query = `
    UNWIND $objs as obj
    MATCH (oldNode) WHERE oldNode._hash = obj.updateeHash
    SET oldNode += { _isCurrent: false, _hasBeenUpdated: true, _updateeNodeHash: obj.updaterPrivateProps._hash, _dateUpdated: [${setDateCreated()}], _userUpdated: obj._userUpdated, _toDate: [${setDateCreated()}]}
    RETURN oldNode
    `;

    /**@todo why is it Result, and not Result[] ? */
    const result: Result = await this.runQuery({
      query,
      parameters,
      wrap,
    });

    if (isFailure(result)) return [result];
    if (extract) {
      return _flatten(result.getData());
    } else {
      result.data = _flatten(result.getData())[0];
      return [result];
    }
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
  async editNodesById({
    arr = [],
    extract = false,
    flatten = true,
    closeConnection = false,
  } = {}): Promise<Result> {
    /* validations */
    if (!arr.length) {
      return new Failure({
        reason: `Engine.editNodesById: Validation error: arr is empty: ${arr}.`,
        parameters: {
          arr,
        },
      });
    }
    /* !validations */

    /**
     * Logic.
     */
    const parameters = { arr };
    const query = `
    UNWIND $arr as obj
    MATCH (x) WHERE ID(x) = toInteger(obj.id)
    SET x = obj.properties
    RETURN x
    `;
    const data: Result = await this.runQuery({ query, parameters });

    if (data.success === false) {
      return new Failure({
        reason: `Engine.editNodesById: result is Failure`,
        data,
      });
      // throw new Error(`Engine.updateNodesById: result is Failure: ${data}`)
    }
    const result = new Success({ data });
    // log(result)
    return extract ? result.extract() : result;
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
  async editRelationships(
    oldRels: Relationship[],
    newRels: Relationship[],
    obj: {
      extract: boolean,
      flatten: boolean,
      transform: boolean,
      wrap: boolean,
    } = {}
  ): Promise<Result[]> {
    if (!oldRels.every(isRelationship)) {
      throw new Error(
        `Engine.editRelationships: first argument (oldRels) must be Relationship[].\noldRels: ${JSON.stringify(
          oldRels
        )}`
      );
    }
    if (!oldRels.every(isWrittenRelationship)) {
      throw new Error(
        `Engine.editRelationships: first argument (oldRels) must already have been written in Neo4j and have all identifications.\nisWrittenRelationship: ${JSON.stringify(
          oldRels.map(isWrittenRelationship)
        )}\noldRels: ${JSON.stringify(oldRels)}`
      );
    }
    if (!newRels.every(isRelationship)) {
      throw new Error(
        `Engine.editRelationships: second argument (newRels) must be Relationship[].\nnewRels: ${JSON.stringify(
          newRels
        )}`
      );
    }
    /* hm I will read Rels from N4j, then minimaly update it (until I have PropertyObj, it's gonna
    be messy) and edit back, so these newRels will be written.*/
    // if (newRels.some(isWrittenRelationship)) {
    //   throw new Error(`Engine.editRelationships: second argument (newRels) must not have been written in Neo4j, but some have been.\nnewRels: ${JSON.stringify(newRels)}`)
    // }
    if (oldRels.length !== newRels.length) {
      throw new Error(
        `Engine.editRelationships: oldRels.length !== newRels.length.\noldRels: ${JSON.stringify(
          oldRels
        )}\nnewRels: ${JSON.stringify(newRels)}`
      );
    }

    const check = _check_oldRels_vs_newRels_consistency(oldRels, newRels);
    if (isFailure(check)) return [check];

    /* defaults */
    const extract = obj.extract !== undefined ? obj.extract : false;
    const flatten = obj.flatten !== undefined ? obj.flatten : false;
    const transform = obj.transform !== undefined ? obj.transform : false;
    const wrap = obj.wrap !== undefined ? obj.wrap : true;

    /**
     * 1. Since it's a written Relationship, just change its props.
     */

    /* prepare { query, parameters } */
    const objs: Object[] = _flatten(
      zip(oldRels, newRels).map(([oldRel, newRel]) => {
        return {
          oldRelLabels: oldRel.getLabels(),
          oldRelId: oldRel.getId(),
          oldRelStartNodeId: oldRel.getStartNodeId(),
          oldRelStartNodeHash: oldRel.getStartNodeHash(), //
          oldRelEndNodeId: oldRel.getEndNodeId(),
          oldRelProps: oldRel.getProperties(),
          oldRelHash: oldRel.getHash(), //
          newRelLabels: newRel.getLabels(),
          newRelProps: newRel.getProperties(), //
        };
      })
    );
    // log(objs)
    const parameters = { objs };
    //  WITH *
    // CALL apoc.create.addLabels([ID(startNode)], [startNode._label]) YIELD node as a
    const query1 = `
    UNWIND $objs as obj
    MATCH (startNode)-[relationship]->(endNode)
    WHERE relationship._hash = obj.oldRelHash AND startNode._hash = obj.oldRelStartNodeHash
    SET relationship = obj.newRelProps
    RETURN startNode, relationship, endNode
    `;
    const query = `
    UNWIND $objs as obj
    MATCH (startNode)-[relationship]->(endNode)
    WHERE ID(relationship) = toInteger(obj.oldRelId) AND ID(startNode) = obj.oldRelStartNodeId
    SET relationship = obj.newRelProps
    RETURN startNode, relationship, endNode
    `;
    const dbresult: Result = await this.runQuery({
      query,
      parameters,
      wrap,
    });

    if (isFailure(dbresult)) {
      return [dbresult];
    }

    /* return only Relationships */
    const final = _resultWrapper(oldRels, newRels, dbresult);
    return final;

    /////////////// FUN ///////////////
    /**
     * Do I need to check if newRel startNode.hash == oldRel startNode.hash ?!
     */
    function _check_oldRels_vs_newRels_consistency(
      oldRels: Relationship[],
      newRels: Relationship[]
    ): Result {
      const holder = [];
      zip(oldRels, newRels).forEach(([oldRel, newRel]) => {
        /**
         * @IMPORTANT this will preclude us from editing direction!
         * I just need to check that there are only 2 unique hash
         */
        const result = uniq([
          oldRel.getStartNodeHash(),
          oldRel.getEndNodeHash(),
          newRel.getStartNodeHash(),
          newRel.getEndNodeHash(),
        ]);
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
        return new Failure({
          reason: `Engine.editRelationships validation error: pair of oldRel & newRel do not match start/endNodes. See data.`, // \nholder: ${JSON.stringify(holder)}
          data: holder,
        });
      }
      return new Success();
    }

    /**
     * I need to map throut oldRels and return Success where
     * S.data = dbRels Relationship
     * S.parameter = { oldRel, newRel } // keep all at hand for reference
     *
     * Failure where I cannot match dbRel to newRel
     */
    function _resultWrapper(
      oldRels: Relationship[],
      newRels: Relationship[],
      dbresult: Result
    ): Result[] {
      const neo4jRels = _flatten(dbresult.getData()).filter(isRelationship);

      const result = zip(oldRels, newRels).map(([oldRel, newRel]) => {
        const holder = [];
        holder.push(
          ...neo4jRels.filter((rel) => rel.getHash() === newRel.getHash())
        );
        // log(holder)
        if (!holder.length) {
          /* this means we do not have newRel (updating Relationship) among those returned by Neo4j */
          return new Failure({
            reason: `Engine.editRelationships._resultWrapper: did not match newRel hash with those returned by Neo4j.`,
            parameters: { oldRel, newRel },
            /**@TODO adhere to data interface Result.data = Array<T> */
            // data: []
          });
        } else {
          return new Success({
            parameters: { oldRel, newRel },
            /**@TODO adhere to data interface Result.data = Array<T> */

            // data: holder,
            data: holder[0] /**@todo can we have more than one REl here? */,
          });
        }
      });
      return result;
    }
    /////////////// END ///////////////
  }

  /* DELETE */

  /**
   * @expects ids = [1,2,3..]
   * @param {*} param0
   */
  async deleteNodesById({ ids, extract = false } = {}): Promise<Result[]> {
    /**
     * Validations.
     */
    if (!ids.length) {
      return new Failure({
        reason: `Engine.deleteNodesById: Validation error: ids is empty: ${ids}.`,
        parameters: { ids },
      });
    }

    if (!ids.every((id) => isNumber(id))) {
      return new Failure({
        reason: `Engine.deleteNodesById: Validation error: ids must be Number[]: ${ids}.`,
        parameters: { ids },
      });
    }
    /**
     * Logic.
     */
    const parameters = { ids };
    const query = `
    UNWIND $ids as id
    MATCH (x) WHERE ID(x) = toInteger(id)
    DETACH DELETE x
    RETURN x
    `;
    const data: Result = await this.runQuery({ query, parameters });

    if (data.success === false) {
      return new Failure({
        reason: `Engine.deleteNodesById: result is Failure. See data for error`,
        data,
      });
    }
    /* mb better to answer in kind - return Number[] */
    const result = data.extract().map(get("getId"));

    return extract
      ? /**@TODO adhere to data interface Result.data = Array<T> */

        new Success({ data: result }).extract()
      : new Success({ data: result });
  }

  /**
   * User can generate a Node | EnhancedNode hash and we will delete using it.
   * @WIP
   */
  async deleteNodesByHash() {}

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
  async deleteNodes(
    nodes: Node[],
    obj: {
      extract: boolean,
      // deletePermanently: boolean,
    } = {}
  ): Promise<Result[]> {
    /* validations */
    {
      if (not(isArray(nodes))) {
        return [
          new Failure({
            reason: `Engine.deleteNodes: validations: first argument must be Array.`,
            parameters: { firstArgument: nodes },
          }),
        ];
      }
      if (nodes.every(isNode) == false) {
        return [
          new Failure({
            reason: `Engine.deleteNodes: validations: first argument must be Node[].`,
            parameters: { firstArgument: nodes },
          }),
        ];
      }
    }
    /* !validations */

    /* defaults */
    const extract: boolean = isMissing(obj.extract) ? false : obj.extract;
    // const deletePermanently: boolean = isMissing(obj.deletePermanently) ? false : obj.deletePermanently
    /* !defaults */
    /* should I do a check? paranoid user */
    const enodes: EnhancedNode[] = await this.enhanceNodes(nodes, {
      hops: 1,
      extract: true,
    });

    const parameters: Object = { nodes: nodes.map(_getNodeHash) };

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

    const query: String = `
    UNWIND $nodes as node
    MATCH (x) WHERE x._hash = node._hash
    DETACH DELETE x
    RETURN x
    `;

    const data: Result = await this.runQuery({
      query,
      parameters,
      transform: false,
      wrap: true,
    });

    if (isFailure(data)) {
      return [
        new Failure({
          reason: `Engine.deleteNodes: result is Failure. See data for error`,
          data: [data],
        }),
      ];
      // throw new Error(`Engine.deleteNodesById: result is Failure: ${data}`)
    }
    const results: Result[] = _resultWrapper(
      data.getData({ flatten: true }),
      enodes
    );

    return extract ? results.map(getResultData) : results;

    /////////////// FUN ///////////////
    function _getNodeHash(node) {
      return { _hash: node.getHash() };
    }

    function _resultWrapper(
      data: EnhancedNode[],
      enodes: EnhancedNode[]
    ): Result[] {
      // log(data)
      const results = data.map((enode, i) => {
        if (!isEnhancedNode(enode)) {
          return new Failure({
            reason: `Engine.deleteNodes._resultWrapper: expected an Enode.\nenode: ${JSON.stringify(
              enode
            )}`,
            data: [enode],
          });
        }

        // match data's ids with enodes' ids
        const zipped = zip(data, enodes);
        const idsMatch: boolean = zipped.reduce(
          (acc, [deletedEnode, checkEnode]) => {
            if (deletedEnode.getId() !== checkEnode.getId()) {
              acc.push(false);
            } else {
              acc.push(true);
            }
            return acc;
          },
          []
        );
        // log(idsMatch);
        if (idsMatch.every(isTrue) !== true) {
          // show which ones didn't match
          /**
           * For me reading in future.
           * A simple filtering with a mask led to
           * writing a generator based predicate function.
           */
          function maskWith(arr): Function {
            function* iteratesOnArray(arr) {
              for (let i = 0; i < arr.length; i++) {
                yield arr[i];
              }
            }

            const gen = iteratesOnArray(arr);
            return (el) => {
              const rv = gen.next();
              return rv.value;
            };
          }

          const didntMatch = zipped.filter(maskWith(idsMatch));
          throw new Error(
            `Engine.deleteNodes: deleted ids and their corresponding Nodes' last snapshots' ids do not match:\n${JSON.stringify(
              didntMatch
            )}`
          );
        }

        /* Just mark the latest snapshot as deleted
        As we have proved with idsMatch check
        that all these EnhancedNodes have been detached
        and deleted. */
        const rv: EnhancedNode = enodes[i];
        /* mark as deleted */
        const timeArray_ = generateTimeArray();
        rv.properties["_hasBeenDeleted"] = true;
        rv.properties["_whenWasDeleted"] = timeArray_;
        rv.properties["_isArchived"] = false;

        /* mark Relationships as deleted */
        rv.relationships.inbound.forEach((rel) => {
          rel.properties = {
            ...rel.properties,
            _hasBeenDeleted: true,
            _whenWasDeleted: timeArray_,
            _isArchived: false,
          };
        });

        rv.relationships.outbound.forEach((rel) => {
          rel.properties = {
            ...rel.properties,
            _hasBeenDeleted: true,
            _whenWasDeleted: timeArray_,
            _isArchived: false,
          };
        });

        return new Success({
          parameters: { nodeToDelete: nodes[i] },
          data: [rv],
        });
      });
      return _flatten(results);
    }
    /////////////// END ///////////////
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
  async deleteRelationships(
    _rels: Relationship[],
    obj: {
      extract: boolean,
      // deletePermanently: boolean,
    } = {}
  ): Promise<Result[]> {
    /* pure function */
    const rels = clondeDeep(_rels);
    /* !pure function */

    /* validations */
    {
      if (not(isArray(rels))) {
        return [
          new Failure({
            reason: `Engine.deleteRelationships: validations: first argument must be Array.`,
            parameters: { firstArgument: rels },
          }),
        ];
      }
      if (rels.every(isRelationship) == false) {
        return [
          new Failure({
            reason: `Engine.deleteRelationships: validations: first argument must be Relationship[].`,
            parameters: { firstArgument: rels },
          }),
        ];
      }
    }
    /* !validations */
    /* defaults */
    const extract = obj.extract !== undefined ? obj.extract : false;
    // const deletePermanently = obj.deletePermanently !== undefined ? obj.deletePermanently : false
    /* !defaults */

    /* should I do a check? paranoid user */

    const parameters = { rels: rels.map(_getRelHash) };

    const query = `
    UNWIND $rels as rel
    MATCH ()-[x]->() where x._hash = rel._hash
    WITH x, properties(x) as props
    DELETE x
    RETURN x, props 
    `;

    const result: Result = await this.runQuery({
      query,
      parameters,
      raw: true,
    });

    if (isFailure(result)) {
      return [
        new Failure({
          reason: `Engine.deleteRelationships: result is Failure. See data for error`,
          data: [result],
        }),
      ];
    }

    const final: Result[] = _resultWrapper(
      result.getData({ flatten: true }),
      rels
    );

    return extract ? final.map(getResultData) : final;

    /////////////// FUN ///////////////
    function _getRelHash(rel) {
      return { _hash: rel.getHash() };
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
    function _resultWrapper(
      deletedRels: Record[],
      originalRels: Relationship[]
    ): Result[] {
      const final: Result[] = originalRels.map((originalRel) => {
        // if deletedRels have a Record that matches originalRel by hash,
        // return Success({ parameters: { originalRel }, data: [updatedOriginalRel]})
        const originalRel_hash: String = originalRel.getHash();
        const deletedRel: [Object, Object][] = deletedRels.filter((record) => {
          const {
            _fields: [relationship, props],
          }: [Object, Object] = record;
          if (not(has(props, "_hash"))) {
            throw new Error(
              `Engine.deleteRelationships: _resultWrapper: expected to find deleted Relationships's hash, but found none.\nrecord: ${JSON.stringify(
                record
              )}`
            );
          }
          if (props._hash == originalRel_hash) {
            return true;
          }
        });

        // we should either have 1 or 0 matches
        if (deletedRel.length > 1) {
          throw new Error(
            `Engine.deleteRelationships: _resultWrapper: expected to find one or zero matches, instead there were more.\ndeletedRel: ${JSON.stringify(
              deletedRel
            )}`
          );
        }

        // we have our match, the Rel was deleted
        if (deletedRel.length == 1) {
          // update originalRel with Neo4j's id and _uuid - as it might not have had those
          const updatedOriginalRel: Relationship = cloneDeep(originalRel);
          const [deletedRelIds, deletedRelProps] = deletedRel[0];
          updatedOriginalRel.identity = deletedRelIds.identity;
          updatedOriginalRel.properties._uuid = deletedRelProps._uuid;
          return new Success({
            parameters: { originalRel },
            data: [updatedOriginalRel],
          });
        }

        if (deletedRel.length == 0) {
          return new Success({
            reason: "originalRel did not exist in Neo4j.",
            parameters: { originalRel },
            data: [],
          });
        }
      });

      return final;
    }
    /////////////// END ///////////////
  }

  async cleanDB(
    obj: { log?: boolean, msg?: String, logResult?: boolean } = {}
  ) {
    const result = await this.runQuery({
      query: "MATCH (x) detach delete x",
      logResult: obj.logResult,
    });

    if (obj.msg) {
      if (isSuccess(result)) console.log(obj.msg);
    } else if (obj.log == true) {
      if (isSuccess(result)) console.log("all DB data dropped");
    }
  }

  /**
   * @WIP
   */
  async deleteEnhancedNodes(
    enodes: EnhancedNode[],
    obj: {
      extract: boolean,
      deletePermanently: boolean,
    } = {}
  ): Promise<Result[]> {
    /* defaults */

    const extract = obj.extract !== undefined ? obj.extract : false;
    const deletePermanently =
      obj.deletePermanently !== undefined ? obj.deletePermanently : false;
  }

  /**
   * Low level Interface === Result.data = [node]
   * Merges an Enhanced CustomNode = CustomNode + all of its siblings with relationships.
   * RETURNS: EnhancedNode from the Graph.
   * USES: adding Transactions in K3 will add sub-graphs
   * @param {EnhancedNode} enode - a node with all of its 1st degree relationships
   * @deprecated use mergeEnhancedNodes instead
   */
  async addSingleEnhancedNode(enode: EnhancedNode): Promise<Result> {
    /** validations **/

    /** logic **/

    /* adding nodes */
    const nodes = await this.mergeNodes(enode.getParticipatingNodes());
    let [enhancedNode, ...rest] = nodes.getData(); // again, each is a Result!!

    /* here's our enode */
    let [enode_] = enhancedNode.getData();

    /* adding relationships & setting rels_ onto enode_ */
    const rels_in = enode.getInboundRelationships();
    const rels_out = enode.getOutboundRelationships();

    /* if it isn't EnhancedNode, it's just a Node */
    if (!(enode_ instanceof EnhancedNode)) {
      enode_ = new EnhancedNode({ ...enode_ });
    }

    for (let rel of rels_in) {
      const rel_in = await this.addSingleRelationship(rel); // again, Result here!!
      if (rel_in instanceof Failure) {
        return "addSingleEnhancedNode() relationship was not added as planned - think what to do here.";
      }
      enode_.relationships.inbound.push(rel_in.getData()[0]);
    }
    for (let rel of rels_out) {
      const rel_out = await this.addSingleRelationship(rel);
      if (rel_out instanceof Failure) {
        return "addSingleEnhancedNode() relationship was not added as planned - think what to do here.";
      }
      enode_.relationships.outbound.push(rel_out.getData()[0]);
    }
    return new Success({
      parameters: { ...enode },
      data: [enode_],
    });
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
  async addSingleRelationship(
    relationship: Relationship,
    parameter: string
  ): Promise<Result> {
    // return 'fuck all'
    /**
     * 0. Check arguments.
     * 1. Obtain IDs of start and endNodes: match them.
     * 2. Merge a relationship.
     * 3. Report Result
     */

    /* validations */
    if (isMissing(relationship)) {
      return [
        new Failure({
          reason: `Engine.addSingleRelationship(): nothing was passed as argument.`,
        }),
      ];
    }

    if (!(relationship instanceof Relationship))
      return new Failure({
        reason: `Engine.addSingleRelationship(): accepts one Relationship.`,
      });

    /* do we have all of required main properties? */
    const { labels, properties, startNode, endNode } = relationship;
    if (!labels.length && (!properties || !Object.keys(properties).length))
      return new Failure({
        reason: `Engine.addSingleRelationship(): a Relationship must have at least one label or one property.`,
        parameters: { relationship },
      });

    /* are startNode & endNode instances of Node or EnhancedNode? */
    if (
      !(startNode instanceof Node || startNode instanceof EnhancedNode) &&
      !(endNode instanceof Node || endNode instanceof EnhancedNode)
    )
      return new Failure({
        reason: `Engine.addSingleRelationship(): neither Node is instanceof Node.`,
        parameters: { relationship },
      });
    if (
      !(startNode instanceof Node || startNode instanceof EnhancedNode) ||
      !(endNode instanceof Node || endNode instanceof EnhancedNode)
    )
      return new Failure({
        reason: `Engine.addSingleRelationship(): ${
          startNode instanceof Node ? "endNode" : "startNode"
        } is not instanceof Node.`,
        parameters: { relationship },
      });
    /* !validations */

    /* all seem ok, let's merge Nodes into GDB */
    const nodes_: Result[] = await this.mergeNodes([startNode, endNode]);

    if (nodes_ instanceof Failure)
      return new Failure({
        reason: `Was not able to merge nodes and set up relationship.`,
        parameters: { relationship },
      });
    const [start, end] = nodes_.map(getResultData);
    let start_id = start.getId(),
      end_id = end.getId();

    const query = `
        MATCH (x) WHERE ID(x) = ${start_id}
        MATCH (y) WHERE ID(y) = ${end_id}
        MERGE (x)-[z${relationship.toString("_hash")}]->(y)
        ON CREATE set z = ${relationship.toString("properties")}
        RETURN *
        `;

    /* modify Result */
    const result = await this.runQuery({ query, transform: false, wrap: true });
    let [startNode_, endNode_, rel_] = result.getData({ flatten: true });
    rel_.startNode = startNode_;
    rel_.endNode = endNode_;
    result.parameters = { relationship };
    result.data = [rel_];
    return result;
  }

  /**
   * @deprecated
   * Merges a single Node.
   * @param {Node} node
   */
  async addSingleNode(node: Node): Promise<Result> {
    /**
     * Adds one CustomNode only. Creates no relationships.
     * Reports Result.
     */
    if (!(node instanceof Node))
      return new Failure({
        reason: `addSingleNode(): accepting only instances of Node.`,
        parameters: { node },
      });
    if (!Object.keys(node.getProperties()).length)
      return new Failure({
        reason: "CustomNode has no properties",
        parameters: { node },
      });

    const query = `
            CALL apoc.create.uuids(1) YIELD uuid
            MERGE (x${node.toString()})
            FOREACH (n in CASE 
            WHEN not(exists(x._uuid)) THEN [1]
            ELSE []
            END | SET x._uuid=uuid) 
            RETURN x
        `;
    return await this.runQuery({ query });
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
function toMapByLabel(arr: (PartialNode | Node | EnhancedNode)[]): Object {
  return arr.reduce((acc, node) => {
    const labels = node.getLabels().join(":");
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
function stringifyPerType(val: any): string {
  if (typeof val === "string") return `'${String(val)}'`;
  if (typeof val === "number") return `${val}`;
  if (typeof val === "boolean") return !!val ? "true" : "false";
  if (val instanceof Array) {
    let result;
    if (val.every((elm) => typeof elm === "number")) {
      result = val.reduce((acc, elm) => {
        acc += `${elm}, `;
        return acc;
      }, ``);
      return `[${result.substr(0, result.length - 2)}]`;
    }
    result = val.reduce((acc, elm): String => {
      if (typeof elm === "number") return (acc += `'${elm}', `);
      if (typeof elm === "string") return (acc += `'${elm}', `);
      acc += `${elm}, `;
      return acc;
    }, ``);
    return `[${result.substr(0, result.length - 2)}]`;
  }
  return ``;
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
function wrapper(
  result: Neo4jResult,
  obj: {
    returnSuccess: boolean,
  } = {}
): { data: (Node | Relationship | Success | Failure)[], summary: Object } {
  /* defaults */
  const returnSuccess = isMissing(obj.returnSuccess)
    ? false
    : obj.returnSuccess;
  /* !defaults */
  const summary = _getSummaryFromResult(result);

  let data;

  if (!result.records.length) {
    data = [new Success({ reason: NEO4J_RETURNED_NULL, data: [] })];
    return { data, summary };
  }

  data /* Class[] */ = resultFromDriverTransformer(result);

  if (returnSuccess) {
    const result = [new Success({ data: _flatten(data) })];
    return { data: result, summary };
  }
  /* this is where data is EnhancedNode[][]  */
  return { data, summary };

  /////////////// FUN ///////////////
  /**
   * @param {Object} result
   * @param {Class} customClass
   */
  function resultFromDriverTransformer(
    result: Neo4jResult,
    customClass?: Class<any>
  ): Class<any>[] {
    const holder: Object[][] = result.records.map(_wrapIndividualRecord);
    const final = _appendPartnerNodesToRelationships(holder);

    return final;

    /////////////// FUN ///////////////
    function _wrapIndividualRecord(
      record: Object
    ): (Node | Relationship | null)[] {
      // cuts off everything except _fields, wrapping its contents
      // log(record)
      const { keys, length, _fields, _fieldLookup } = record;
      const wrappedFields = _fields.map((field) => {
        /* 
        field could be a Node|Relationship|Relationship[]
        if its an Array ==> it's a Relationship[] ??? only?
        cause of (s)-[r*1..2]-(e) pattern
        */
        if (isMissing(field)) {
          // throw new Error(`wrapper._wrapIndividualRecord: field is null or undefined.\nfield: ${JSON.stringify(field)}.\nrecord: ${JSON.stringify(record)}`)
          // return null
          return [];
        } else if (_isRelationshipLike(field)) {
          // log('_isRelationshipLike')
          return Array.isArray(field)
            ? field.map((f) => relationshipTransformer(f, customClass))
            : relationshipTransformer(field, customClass);
        }
        if (_isNodeLike(field)) {
          // log('_isNodeLike')
          return nodeTransformer(field, customClass);
        }
        // TimeTree returned Node[]
        if (isArray(field)) {
          // log('aaaa arrrarary')
          return _wrapIndividualRecord(field);
        }
        throw new Error(
          `wrapper._wrapIndividualRecord: field is neither Node nor Relationship.\nfield: ${JSON.stringify(
            field
          )}`
        );
        // log('whata')
        // return []
      });
      return wrappedFields;
    }

    /* if Relationships exist, append full start/endNodes by id */
    function _appendPartnerNodesToRelationships(
      arr /* [startNode, rel, endNode][] */
    ): Object[] {
      const allNodes = _flatten(arr).filter(isNode);
      const rv = arr.map((elm) => {
        /* we are looking for [enode, [rel,..], enode] pattern */
        if (!Array.isArray(elm)) {
          return elm;
        }
        const rels = _flatten(elm).filter(isRelationship);

        /* proceed only if there are any Relationships */
        if (!rels.length) {
          return elm;
        }

        rels.forEach((rel) => {
          if (!isRelationship(rel)) {
            throw new Error(
              `wrapper._appendPartnerNodesToRelationships: rel is supposed to be a Relationship.\nrel: ${JSON.stringify(
                rel,
                null,
                4
              )}`
            );
          }
          rel.setStartNode(
            allNodes.filter((node) => node.getId() === rel.startNode.low)[0]
          );
          rel.setEndNode(
            allNodes.filter((node) => node.getId() === rel.endNode.low)[0]
          );

          /**
           * @todo check hash consistency - ie rel.getHash() must == rel.makeHash()
           */
        });

        return elm;
      });

      return rv;
    }
    /////////////// END ///////////////
  }
  /**
   *
   * @param {Object} node
   * @param {Class} customClass
   */
  function neo4jNodeTransformer(
    node: Object,
    customClass: Class = Node /* nodes['Node'] */
  ): Class {
    let { labels, properties, identity } = node;
    /**
     * @todo include check has(customClass, 'propertiesToNumber') or isNode(customClass)
     */
    const result = new customClass({
      labels,
      properties,
      identity,
    }).propertiesToNumber();
    return result;
  }
  /**
   * @todo need to make Nodes/EnhancedNodes
   * @param {Object} node
   * @param {Class} customClass
   */
  function nodeTransformer(node: Object, customClass?: Class): Class {
    let { identity, labels, properties } = node;
    let constructor = EnhancedNode; //nodes['EnhancedNode']
    // log(constructor)
    return neo4jNodeTransformer(node, constructor);
  }

  /**
   * Apply our Relationship class to Neo4j's relationships.
   * @param {Object} relationship - Relationship object.
   * @param {Class} customClass -
   */
  function relationshipTransformer(
    relationship: Object,
    customClass?: Class
  ): Class {
    let {
      identity,
      start: startNode,
      end: endNode,
      type,
      properties,
    } = relationship;

    /* remove all Integers from properties */
    const newProperties = {};

    if (properties._date_created) {
      newProperties["_date_created"] = properties._date_created.map(
        neo4jIntegerToNumber
      );
    }
    for (let prop in properties) {
      if (prop === "_date_created") continue; // don't touch it again, timeArray is already transformed to int
      newProperties[prop] = neo4jIntegerToNumber(properties[prop]);
    }

    return new Relationship({
      labels: [type],
      properties: newProperties,
      identity,
      startNode,
      endNode,
      necessity: properties._necessity,
      direction: properties._direction,
    });
  }

  /**
   * Self explanatory
   *
   * @private
   * @param {Neo4jResult} result
   * @returns {Object}
   */
  function _getSummaryFromResult(result: Neo4jResult): Object {
    return result.summary;
  }

  /**
   * @private
   */
  function _isRelationshipLike(field: Object | Object[]): boolean {
    /* if we do hops, rels come back as Object[] */
    if (Array.isArray(field) && field.length > 0) {
      const isRel =
        field[0].hasOwnProperty("start") &&
        field[0].hasOwnProperty("end") &&
        field[0].hasOwnProperty("type");
      return Boolean(isRel);
    }

    const isRel =
      field.hasOwnProperty("start") &&
      field.hasOwnProperty("end") &&
      field.hasOwnProperty("type");

    return Boolean(isRel);
  }
  function _isNodeLike(field: Object): boolean {
    const isArr = Array.isArray(field);
    const isRel =
      field.hasOwnProperty("start") &&
      field.hasOwnProperty("end") &&
      field.hasOwnProperty("type");
    const labelsOK =
      field.hasOwnProperty("labels") && Array.isArray(field["labels"]);
    const propsOk =
      field.hasOwnProperty("properties") &&
      typeof field["properties"] === "object";
    const idOk =
      field.hasOwnProperty("identity") &&
      typeof field["identity"] === "object" &&
      field["identity"].hasOwnProperty("high") &&
      field["identity"].hasOwnProperty("low");
    // log(`!isArr ${!isArr} && !isRel $!{!isRel} labelsOK ${labelsOK} propsOk ${propsOk} idOk ${idOk}`)
    return Boolean(!isArr && !isRel && labelsOK && propsOk && idOk);
  }
  /////////////// END ///////////////
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
function closeSession({ session, sessionId }): Result {
  /* check if we have stuff to work with */
  if (isMissing(session) && isMissing(sessionId)) {
    throw new Error(
      `Engine.closeSession: missing both session and sessionId, need at least one to proceed.\nsession: ${JSON.stringify(
        session
      )}\n\nsessionId: ${JSON.stringify(sessionId)}`
    );
  }
  if (isPresent(sessionId)) {
    /* close by id */
    sessionPool[sessionId].close();
    /* remove from pool */
    delete sessionPool[sessionId];
    return new Success({
      /**@TODO data interface Success.data != Array<T> */
      // data: [sessionId], // ?
      data: sessionId,
      reason: `Session ${sessionId} has been closed.`,
    });
  } else {
    /* close the session */
    session.close();
    return new Success({ data: session, reason: `Session has been closed.` });
  }
  return new Success({ data: { session, sessionId } });
}

/**
 * Closes driver. Evoke when program/test exits
 * @returns Result
 */
function closeDriver(driver): Result {
  driver.close();
  return new Success({ data: driver });
}

function stringify(val: any): string {
  return JSON.stringify(val, null, 4);
}

export { Engine, wrapper, int, isInt, toNumber, inSafeRange };
