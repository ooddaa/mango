/* @flow */

import { isArray, isFunction, isObject, isString, has } from "lodash";
import {
  Builder,
  Engine,
  log,
  PartialNode,
  Result,
  isFailure,
  isPartialNode,
  Relationship,
  RelationshipCandidate,
  isNode,
  not,
  isEnhancedNode,
  EnhancedNode,
  isMissing,
  Node,
} from ".";
import {
  getRequiredProperties,
  getOptionalProperties,
  getPrivateProperties,
  stringify,
  decomposeProps,
} from "./utils";

import { NoEngineError } from "./Errors";
import type {
  SimplifiedRelationshipArray,
  SimplifiedRelationship,
  SimplifiedEnhancedNode,
} from "./types";

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
  builder: Builder;
  engine: Engine;
  findNode: Function;
  deleteNode: Function;
  buildAndMergeNode: Function;
  buildAndMergeRelationship: Function;
  decomposeProps: Function;
  search: Function;
  is: Function;
  constructor(
    config: {
      engine: Engine,
      engineConfig: Object,
      builder: Builder,
    } = {}
  ) {
    if (isMissing(config.engine)) {
      try {
        let engineConfigIsOk = this.constructor._isEngineConfigUsable(
          config.engineConfig
        );
        if (engineConfigIsOk == false) {
          throw new NoEngineError(
            `Mango.constructor: do not have a usable Engine instance.`
          );
        }
      } catch (error) {
        log(
          `Mango constructor engineConfig error.\nname: ${error.name}\nmessage: ${error.message}`
        );
        throw new NoEngineError(error.message);
      }
    }
    this.engine = config.engine || this._initEngine(config.engineConfig);
    this.builder = config.builder || new Builder();
  }

  /**
   * I want to communicate to users what is missing from configEngine.
   * I'll do it by way of throwing errors at them.
   *
   * @private
   * @param {Object} engineConfig - Configuration object to authenticate and initiate Neo4j driver.
   * @returns {boolean}
   */
  static _isEngineConfigUsable(engineConfig: Object): boolean {
    /* username && password are sufficient to connect to default Neo4j DBMS */
    if (has(engineConfig, "username") == false) {
      throw new NoEngineError(
        `Mango.constructor._isEnigneConfigUsable: no username found.\nengineConfig: ${stringify(
          engineConfig
        )}`
      );
    } else {
      if (isString(engineConfig["username"]) == false) {
        throw new NoEngineError(
          `Mango.constructor._isEnigneConfigUsable: username must be string.\nengineConfig: ${stringify(
            engineConfig
          )}`
        );
      }
    }
    if (has(engineConfig, "password") == false) {
      throw new NoEngineError(
        `Mango.constructor._isEnigneConfigUsable: no password found.\nengineConfig: ${stringify(
          engineConfig
        )}`
      );
    } else {
      if (isString(engineConfig["password"]) == false) {
        throw new NoEngineError(
          `Mango.constructor._isEnigneConfigUsable: password must be string.\nengineConfig: ${stringify(
            engineConfig
          )}`
        );
      }
    }
    return true;
  }

  /**
   * @private
   * @param {Object} engineConfig - Configuration object to authenticate and initiate Neo4j driver.
   * @returns {Engine}
   */
  _initEngine(engineConfig: Object): Engine {
    let database = engineConfig.database || "neo4j";
    const engine = new Engine({
      neo4jUsername: engineConfig.username,
      neo4jPassword: engineConfig.password,
      ip: engineConfig.ip || "0.0.0.0",
      port: engineConfig.port || "7687",
      database,
    });

    /***@todo start and check connection */
    /* Start Neo4j Driver */
    engine.startDriver();

    /* Check connection to Neo4j */
    engine.verifyConnectivity({ database }).then(log);
    /***@todo throw here if cannot connect */

    return engine;
  }

  async _verifyConnectivity(config?: { database?: string } = {}): Object {
    if (this.engine instanceof Engine) {
      return config.database && isString(config.database)
        ? await this.engine.verifyConnectivity({ database: config.database })
        : await this.engine.verifyConnectivity();
    } else {
      return { address: null, version: null, reason: "no engine" };
    }
  }

  /**
   * Adapter between a POJO properties object and PartialNode constructor.
   * @private
   * @param {Object} props - Node properties we are looking for.
   * @returns {Object}
   */
  _buildSearchedProps(props: Object): Object {
    const searchedProps = {};
    for (let [key, value] of Object.entries(props)) {
      // find out type
      const type =
        value instanceof ConditionContainer ? value.getType() : typeof value;

      // form value object for pnodes. Default case - we use "e" == equal
      const valueObj =
        value instanceof ConditionContainer ? value.toObject() : { e: value };
      const searchedProp = {
        isCondition: true,
        type,
        key /***@TODO check if needs to be UpperCase? ie we search only for Required props? */,
        value: [valueObj],
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
   */
  async findNode(
    labels: string[],
    props: Object,
    config: {
      exactMatch: boolean,
      returnResult: boolean,
    } = {}
  ) {
    const { requiredProps, optionalProps, privateProps } = this.decomposeProps(
      props
    );

    if (config.exactMatch) {
      const node = this.builder.makeNode(
        labels,
        requiredProps,
        optionalProps,
        privateProps
      );

      const result: Result[] = await this.engine.matchNodes([node]);

      if (config.returnResult) return result[0];

      return result[0].getData();
    }

    // not an exact match, use engine.matchPartialNodes
    // create PartialNodes
    const pnode: Result[] = this.builder.buildPartialNodes([
      {
        labels,
        properties: { ...this._buildSearchedProps(props) },
      },
    ]);

    /* check if succeeded */
    if (isFailure(pnode[0])) {
      throw new Error(
        `Mango.findNode: failed to create a PartialNode: ${JSON.stringify(
          pnode,
          null,
          4
        )}`
      );
    }

    /* another check - do we have a pnode? */
    if (isPartialNode(pnode[0].getData()) == false) {
      throw new Error(
        `Mango.findNode: failed to retrieve the PartialNode: ${JSON.stringify(
          pnode,
          null,
          4
        )}`
      );
    }

    /* all good */
    const result = await this.engine.matchPartialNodes([pnode[0].getData()]);

    if (config.returnResult) {
      log("final 2");
      return result[0];
    }

    return await Promise.all(result[0].getData());
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
  async buildAndMergeNode(
    labels: string[],
    props: Object,
    config: {
      returnResult: boolean,
    } = {}
  ): Promise<Result | EnhancedNode> {
    const { requiredProps, optionalProps, privateProps } = this.decomposeProps(
      props
    );

    const node = this.builder.makeNode(
      labels,
      requiredProps,
      optionalProps,
      privateProps
    );

    let result: Result[];
    try {
      result = await this.engine.mergeNodes([node]);
    } catch (error) {
      throw new Error(`Mango.buildAndMergeNode: ${error}`);
    }

    if (config.returnResult) return result[0];

    return result[0].firstDataElement;
  }

  /**
   * Builds a Relationship and merges it to Neo4j.
   * Direction is optional. If not specified, it is set by the position of startNode & endNode:
   * (startNode)-[:RELATIONSHIP]->(endNode).
   *
   * @public
   * @param {Node|EnhancedNode} startNode - Node that has an outbound Relationship.
   * @param {SimplifiedRelationship|SimplifiedRelationshipArray} relationship - See SimplifiedRelationship and SimplifiedRelationshipArray
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
  async buildAndMergeRelationship(
    startNode: Node | EnhancedNode,
    relationship: SimplifiedRelationshipArray | SimplifiedRelationship,
    endNode: Node | EnhancedNode,
    config: Object = {}
  ): Promise<Result | Relationship> {
    /* ensure we have a usable startNode */
    let startNodeToUse;

    if (isNode(startNode)) {
      // case: we have a Node
      startNodeToUse = startNode;
    } else if (isArray(startNode)) {
      // case: [["Product"], { NAME: "Bediol" }],
      let unwrittenStartNode: Node = this.builder.makeNode(...startNode);
      if (isNode(unwrittenStartNode) == false) {
        throw new Error(
          `Mango.buildAndMergeRelationship: failed to make a Node: ${JSON.stringify(
            unwrittenStartNode,
            null,
            4
          )}`
        );
      } else {
        startNodeToUse = unwrittenStartNode;
      }
    }

    /* ensure we have a usable endNode */
    let endNodeToUse;

    if (isNode(endNode)) {
      // case: we have a Node
      endNodeToUse = endNode;
    } else if (isArray(endNode)) {
      // case: [["Product"], { NAME: "Bediol" }],
      let unwrittenEndNode: Node = this.builder.makeNode(...endNode);
      if (isNode(unwrittenEndNode) == false) {
        throw new Error(
          `Mango.buildAndMergeRelationship: failed to make a Node: ${JSON.stringify(
            unwrittenEndNode,
            null,
            4
          )}`
        );
      } else {
        endNodeToUse = unwrittenEndNode;
      }
    }

    const _isArray = isArray(relationship);
    const rc = new RelationshipCandidate({
      labels: _isArray ? relationship[0] : relationship.labels,
      properties: _isArray
        ? relationship[2] || {}
        : relationship.properties || {},
      necessity: _isArray
        ? relationship[1] || "required"
        : relationship.necessity || "required",
      startNode: startNodeToUse,
      endNode: endNodeToUse,
      direction: relationship.direction || "outbound",
    });

    const rel: Result[] = await this.builder.buildRelationships([rc]);

    const result: Result[] = await this.engine.mergeRelationships([
      rel[0].getData(),
    ]);

    if (config.returnResult) return result[0];

    return result[0].getData()[0];
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
  async mergeEnhancedNode(
    enode: EnhancedNode,
    config: Object = {}
  ): Promise<Result | EnhancedNode> {
    if (not(isEnhancedNode(enode))) {
      throw new Error(
        `Mango.mergeEnhancedNode: need an EnhancedNode as the first argument: ${JSON.stringify(
          enode,
          null,
          4
        )}`
      );
    }
    const result: Result[] = await this.engine.mergeEnhancedNodes([enode]);

    if (config.returnResult) return result[0];

    return result[0].getData()[0];
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
  async mergeEnhancedNodes(
    enodes: EnhancedNode[],
    config: Object = {}
  ): Promise<Result | EnhancedNode[]> {
    if (not(isArray(enodes))) {
      throw new Error(
        `Mango.mergeEnhancedNode: need an Array as the first argument: ${stringify(
          enode,
          null,
          4
        )}`
      );
    }
    if (not(enodes.every(isEnhancedNode))) {
      throw new Error(
        `Mango.mergeEnhancedNode: need an EnhancedNode[] as the first argument: ${stringify(
          enode,
          null,
          4
        )}`
      );
    }
    const result: Result[] = await this.engine.mergeEnhancedNodes(enodes);

    if (config.returnResult) return result;

    return result[0].getData();
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
  async buildAndMergeEnhancedNode(
    { labels, properties, relationships }: SimplifiedEnhancedNode,
    config: Object = {}
  ): Promise<Result | EnhancedNode> {
    /* there may be no relationships */
    relationships = relationships || [];

    const enode: EnhancedNode = this.builder.makeEnhancedNode(
      { labels, properties },
      relationships
    );

    const result: Result[] = await this.engine.mergeEnhancedNodes([enode]);

    if (config.returnResult) return result[0];

    return result[0].getData()[0];
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
  async buildAndMergeEnhancedNodes(
    graphPatterns: SimplifiedEnhancedNode[],
    config: Object = {}
  ): Promise<Result | EnhancedNode> {
    const makeEnhancedNode = this.builder.makeEnhancedNode.bind(this.builder);

    const enodes: EnhancedNode[] = graphPatterns.map(_processGraphPattern);

    const results: Result[] = await this.engine.mergeEnhancedNodes(enodes);

    if (config.returnResult) return results;
    return results.map((result) => result.getData()[0]);

    /* Local Functions
    _________________________________________________________*/

    function _processGraphPattern({ labels, properties, relationships }) {
      /* there may be no relationships */
      relationships = relationships || [];
      const enode: EnhancedNode = makeEnhancedNode(
        { labels, properties },
        relationships
      );
      return enode;
    }
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
  async deleteNode(
    node: Node | EnhancedNode,
    config: {
      returnResult: boolean,
      archiveNodes: boolean,
    } = {}
  ): Promise<Result | EnhancedNode> {
    /* validations */
    if (not(isNode(node)) || not(isEnhancedNode(node))) {
      throw new Error(
        `Mango.deleteNode: need a Node|EnhancedNode as first argument: ${JSON.stringify(
          node,
          null,
          4
        )}`
      );
    }
    /* !validations */

    if (config.archiveNodes) {
      throw new Error(
        `Mango.deleteNode: { archiveNodes: true } not yet implemented!`
      );
    } else {
      const results: Result[] = await this.engine.deleteNodes([node], {
        deletePermanently: true,
      });
      /* As engine.deleteNodes returns Success.data = EnhancedNode[] but
    users expect only one EnhancedNode, we unwrap and return 
    Success.data = EnhancedNode
    */
      const rv = results[0];
      rv.data = results[0].getData();

      if (config.returnResult) {
        return rv;
      }

      return rv.getData()[0];
    }
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
  static search(condition: string, value: any): ConditionContainer {
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
  decomposeProps(props: Object, config: Object): Object | Object[] {
    return decomposeProps(props, config);
  }
}

/**
 * Represents a searched value and its search condition.
 *
 * @public
 * @param {string} condition - Condition for value search ( > < >= <= == etc. ).
 * @param {any} value - Searched value.
 */
class ConditionContainer {
  condition: string;
  value: any;
  getType: Function;
  toObject: Function;
  constructor(condition: string, value: any) {
    this.condition = condition;
    this.value = value;
  }

  /**
   * Helper method to check value's type.
   *
   * @public
   * @returns value type
   */
  getType(): any {
    return typeof this.value;
  }

  /**
   * Helper method to unwrap value.
   *
   * @public
   * @returns {Object} - { condition: value }.
   */
  toObject(): Object {
    return {
      [this.condition]: this.value,
    };
  }
}

const search = Mango.search;
export { Mango, search };
