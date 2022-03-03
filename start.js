const config = require("config");
const { Engine, log } = require("./src");
const [neo4jUsername, neo4jPassword, ip, port, database] = [
  config.get("neo4jUsername"),
  config.get("neo4jPassword"),
  config.get("ip"),
  config.get("port"),
  config.get("database"),
];

/* Instantiate Engine */
const engine = new Engine({ neo4jUsername, neo4jPassword, ip, port, database });

/* Start Neo4j Driver */
engine.startDriver();

/* Check connection to Neo4j */
engine.verifyConnectivity({ database }).then(log);

module.exports = { engine };
