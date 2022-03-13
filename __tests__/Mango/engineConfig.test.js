import { Mango, log, NoEngineError } from "../../src/index";

test("no username", () => {
  const engineConfig = {};

  expect(() => {
    Mango._isEngineConfigUsable(engineConfig);
  }).toThrow(NoEngineError);
});
test("username is not string", () => {
  const engineConfig = {
    username: null,
  };

  expect(() => {
    Mango._isEngineConfigUsable(engineConfig);
  }).toThrow(NoEngineError);
});
test("no password", () => {
  const engineConfig = {
    username: "user",
  };

  expect(() => {
    Mango._isEngineConfigUsable(engineConfig);
  }).toThrow(NoEngineError);
});
test("password is not string", () => {
  const engineConfig = {
    username: "user",
    password: null,
  };

  expect(() => {
    Mango._isEngineConfigUsable(engineConfig);
  }).toThrow(NoEngineError);
});
test("engineConfig is usable", () => {
  const engineConfig = {
    username: "neo4j",
    password: "pass",
  };
  const rv = Mango._isEngineConfigUsable(engineConfig);
  expect(rv).toEqual(true);
});
test("_verifyConnectivity", async () => {
  /* username && password are sufficient to connect to default Neo4j DBMS */
  const engineConfig = {
    username: "neo4j",
    password: "pass",
  };
  const rv = await new Mango({ engineConfig })._verifyConnectivity();
  expect(rv).toMatchObject({
    address: expect.any(String),
    version: expect.any(String),
  });
});
