/* @flow */
import { engine } from "../../start";
import {
  Node,
  NodeCandidate,
  EnhancedNode,
  isEnhancedNode,
  PartialNode,
  Relationship,
  RelationshipCandidate,
  isRelationship,
  Result,
  Success,
  Failure,
  isResult,
  isSuccess,
  isFailure,
  log,
  Builder,
} from "../../src";

import isArray from "lodash/isArray";

const builder = new Builder();

afterAll(async (done) => {
  engine.closeAllSessions();
  engine.closeDriver();
  done();
});

// https://neo4j.com/docs/cypher-manual/current/clauses/

describe("returns Result", () => {
  const matchAll = "MATCH (x) RETURN x";
  const optionalMatch = `OPTIONAL ${matchAll}`;
  test("wrap: true, empty db, data = [Success.data=[]]", async () => {
    /**
     * @todo must be Success.data = []. reason: 'Neo4j returned null.'
     * @todo must have query & summary
     * @todo must be exactly same as above!!!
     */
    /// db setup
    await engine.cleanDB();
    /// !db setup

    const result: Result = await engine.runQuery({ query: matchAll });

    // result is Success
    expect(isSuccess(result)).toEqual(true);

    // data contains [Success]
    const [success]: Success = result.getData();
    expect(isSuccess(success)).toEqual(true);

    expect(success).toMatchObject({
      success: true,
      reason: "Neo4j returned null.",
      data: [],
    });
  });
  test("wrap: true, one match, returnSuccess: false, data = [EnhancedNode[]]", async () => {
    /// db setup
    await engine.cleanDB();
    // https://neo4j.com/docs/cypher-manual/current/clauses/create/#create-create-node-and-add-labels-and-properties
    const query = `CREATE (n:Person {name: 'Andy', title: 'Developer'}), (x:Person {name: 'Bobby', title: 'Magician'}) RETURN n, x`;
    /// !db setup
    const result: Result = await engine.runQuery({
      query,
      returnSuccess: false,
    });
    // log(result)
    // result is Success
    expect(isSuccess(result)).toEqual(true);

    // data contains [Success]
    const [enode]: EnhancedNode = result.getData({ flatten: true });
    // log(enode)
    expect(isEnhancedNode(enode)).toEqual(true);

    // expect(enode).toMatchObject({})
  });
  test("wrap: true, two matches, returnSuccess: true, data = [Success]", async () => {
    /// db setup
    await engine.cleanDB();
    // https://neo4j.com/docs/cypher-manual/current/clauses/create/#create-create-node-and-add-labels-and-properties
    const query = `CREATE (n:Person {name: 'Andy', title: 'Developer'}), (x:Person {name: 'Bobby', title: 'Magician'}) RETURN n, x`;
    /// !db setup
    const result: Result = await engine.runQuery({
      query,
      returnSuccess: true,
    });
    // log(result)
    // result is Success
    expect(isSuccess(result)).toEqual(true);

    // data contains [Success]
    const [success]: Success = result.getData();
    expect(isSuccess(success)).toEqual(true);

    expect(success.getData().length).toEqual(2);
    expect(success.getData().every(isEnhancedNode)).toEqual(true);
  });
  describe("engine queries", () => {
    test("mergeNodes", async () => {
      await engine.cleanDB();
      const arr = [
        new Node({
          labels: ["RunQueryTest"],
          properties: {
            VALUE: 1,
            _hash: "RunQueryTest_1",
          },
        }),
        new Node({
          labels: ["RunQueryTest"],
          properties: {
            VALUE: 2,
            _hash: "RunQueryTest_2",
          },
        }),
      ];
      let parameters, query;
      parameters = {
        nodes: arr.map((node) => node.getProperties()),
      };
      query = `
            UNWIND $nodes as node
            MERGE (x:RunQueryTest {_hash: node._hash})
            ON CREATE SET x = node
            WITH x
            CALL apoc.create.uuids(1) YIELD uuid
            SET x._uuid = uuid
            RETURN x 
            `;
      let result: Result = await engine.runQuery({ query, parameters });
      expect(isResult(result)).toEqual(true);

      /// runQuery's job to return Result.data = [] and put any Neo4j Records into [].
      /// Here we have Record1 == RunQueryTest_node_1, Record2 == RunQueryTest_node_2
      /// so with wrap: true we expect Success.data = [ [enode1], [enode2] ]
      /// mergeNodes will adjust this to its own interface.
      const resultData: Array<EnahncedNode[]> = result.getData();
      expect(isArray(resultData)).toEqual(true);
      expect(resultData.length).toEqual(2);
      expect(resultData.every(isArray)).toEqual(true);
      expect(resultData.every(([enode]) => isEnhancedNode(enode))).toEqual(
        true
      );
      expect(result.summary).toMatchObject({
        query: { text: expect.any(String) },
        queryType: "rw",
        counters: /* QueryStatistics */ {
          _stats: {
            nodesCreated: 2,
            nodesDeleted: 0,
            relationshipsCreated: 0,
            relationshipsDeleted: 0,
            propertiesSet: 8,
            labelsAdded: 2,
            labelsRemoved: 0,
            indexesAdded: 0,
            indexesRemoved: 0,
            constraintsAdded: 0,
            constraintsRemoved: 0,
          },
          _systemUpdates: 0,
        },
        updateStatistics: /* QueryStatistics */ {
          _stats: {
            nodesCreated: 2,
            nodesDeleted: 0,
            relationshipsCreated: 0,
            relationshipsDeleted: 0,
            propertiesSet: 8,
            labelsAdded: 2,
            labelsRemoved: 0,
            indexesAdded: 0,
            indexesRemoved: 0,
            constraintsAdded: 0,
            constraintsRemoved: 0,
          },
          _systemUpdates: 0,
        },
        plan: false,
        profile: false,
        notifications: [],
        server: /* ServerInfo */ {
          address: expect.any(String),
          version: expect.any(String),
          agent: expect.any(String),
          protocolVersion: expect.any(Number),
        },
        resultConsumedAfter: /* Integer */ { low: expect.any(Number), high: 0 },
        resultAvailableAfter: /* Integer */ {
          low: expect.any(Number),
          high: 0,
        },
        database: { name: expect.any(String) },
      });
    });
    test("mergeRelationships", async () => {
      //// mergeRelationships uses wrap: true
      /// db setup
      await engine.cleanDB();
      /// !db setup
      const arr: Relationship[] = await builder.buildRelationships(
        [
          new RelationshipCandidate({
            labels: ["RunQueryTestRelationship"],
            properties: {
              REQ_PROP: "(oldEnode)-[:RunQueryTestRelationship]->(X)",
            },
            startNode: new NodeCandidate({
              labels: ["oldEnode"],
              properties: {
                required: { oldEnode_REQ_PROP: "oldEnode_REQ_PROP" },
              },
            }),
            endNode: new NodeCandidate({
              labels: ["X"],
              properties: {
                required: { X_REQ_PROP: "X_REQ_PROP" },
              },
            }),
          }),
          new RelationshipCandidate({
            labels: ["RunQueryTestRelationship"],
            properties: {
              REQ_PROP: "(oldEnode)-[:RunQueryTestRelationship]->(X) 2",
            },
            startNode: new NodeCandidate({
              labels: ["oldEnode"],
              properties: {
                required: { oldEnode_REQ_PROP: "oldEnode_REQ_PROP" },
              },
            }),
            endNode: new NodeCandidate({
              labels: ["X"],
              properties: {
                required: { X_REQ_PROP: "X_REQ_PROP" },
              },
            }),
          }),
          new RelationshipCandidate({
            labels: ["RunQueryTestRelationship"],
            properties: {
              REQ_PROP: "(oldEnode)<-[:RunQueryTestRelationship]-(Y)",
            },
            startNode: new NodeCandidate({
              labels: ["Y"],
              properties: {
                required: { Y_REQ_PROP: "Y_REQ_PROP" },
              },
            }),
            endNode: new NodeCandidate({
              labels: ["oldEnode"],
              properties: {
                required: { oldEnode_REQ_PROP: "oldEnode_REQ_PROP" },
              },
            }),
          }),
        ],
        { extract: true }
      );

      let parameters, query;

      parameters = {
        rels: arr.map((rel) => rel.toCypherParameterObj()),
      };
      query = `UNWIND $rels as rel
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
      let result: Result = await engine.runQuery({ query, parameters });

      expect(isResult(result)).toEqual(true);
      // log(result.summary)
      /// runQuery's job to return Result.data = [] and put any Neo4j Records into [].
      /// Here we have Record1 == startNode, relationship, endNode, Record2 == startNode, relationship, endNode
      /// so with wrap: true we expect Success.data = [ [startNode, relationship, endNode], [startNode, relationship, endNode] ]
      /// mergeRelationships will adjust this to its own interface.
      const resultData: Array<
        [EnhancedNode, Relationship, EnahncedNode]
      > = result.getData();
      expect(isArray(resultData)).toEqual(true);
      expect(resultData.length).toEqual(3);
      expect(resultData.every(isArray)).toEqual(true);
      expect(
        resultData.every(([startNode, relationship, endNode]) => {
          return (
            isEnhancedNode(startNode) &&
            isRelationship(relationship) &&
            isEnhancedNode(endNode)
          );
        })
      ).toEqual(true);
      /// **WARNING** result.summary is incorrect due to query using APOC procedure that does not report to Neo4j.
    });
    test("matchNodes", async () => {
      //// aka OPTIONAL MATCH
      /// db setup
      await engine.cleanDB();
      /// !db setup
      let result: Result = await engine.runQuery({
        query: optionalMatch,
        raw: true,
      });

      // result is Success
      expect(isSuccess(result)).toEqual(true);

      const resultData: Array = result.getData();
      expect(isArray(resultData)).toEqual(true);
      expect(resultData.length).toEqual(1);
      expect(resultData[0]).toMatchObject({
        keys: ["x"],
        length: 1,
        _fields: [null],
        _fieldLookup: { x: 0 },
      });
    });
  });
  describe("ExclusiveLock error", async () => {
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
    // https://javascript.info/promise-basics
    // https://nodejs.org/api/cli.html#cli_unhandled_rejections_mode
    const msg = `yo, I can't acquire ExclusiveLock`;

    // prepare a Special Failing session

    function setupSession() {
      var counter = 0;
      return {
        run(val): Promise {
          // emulate driver/db behaviour
          const promise = new Promise((resolve, reject) => {
            if (val == "fail" || counter == 0) {
              // fails on first attempt
              counter++;
              reject(new Error(msg));
            } else {
              resolve(new Success());
            }
          });

          // add .then() and .catch()
          promise.then(
            // resolver
            (result) => {
              return result;
            },
            (error) => {}
          );
          promise.catch(
            // rejecter
            (error) => {}
          );
          return promise;
        },
      };
    }
    test("test session should throw", async () => {
      const session = setupSession();
      const promise = await session.run().catch((e) => {
        expect(e.message).toEqual(msg);
      });
    });
    test("test session should return Success on second call", async () => {
      const session = setupSession();
      await session.run().catch((e) => {
        expect(e.message).toEqual(msg);
      });
      await session
        .run()
        .then((result) => expect(isSuccess(result)).toEqual(true));
    });
    test("test session should always throw with fail arg", async () => {
      const session = setupSession();
      await session.run().catch((e) => {
        expect(e.message).toEqual(msg);
      });
      await session.run("fail").catch((e) => {
        expect(e.message).toEqual(msg);
      });
      await session.run("fail").catch((e) => {
        expect(e.message).toEqual(msg);
      });
    });
    test("test retry logic, should succeed", async () => {
      /* don't forget to provide our special session */
      const session = setupSession();
      /* runQuery should call session.run() twice and return success on second call */
      const result: Success = await engine.runQuery({
        query: "",
        session,
        _testRetry: true,
      });

      expect(isSuccess(result)).toEqual(true);
    });
  });
});
