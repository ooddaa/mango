# Mango 🥭

An Object-to-Graph Mapping tool that you can use to work with [Neo4j](https://neo4j.com/) from your [Node.js](https://nodejs.org/) application.

## Usage

\$ npm install @ooddaa/mango

`const { Mango } = require("@ooddaa/mango");`

\$ npm install mango@npm:@ooddaa/mango

`const { Mango } = require("mango");`

Go to [doc](https://ooddaa.github.io/mango/) to read full documentation.

## Tests

To run tests, add Neo4j credentials to config/testing.json file:

`{ "neo4jUsername": "neo4j", "neo4jPassword": "password", "ip": "0.0.0.0", "port": "7687", "env": "testing", "database": "test" }`
