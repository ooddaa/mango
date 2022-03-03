# Mango 🥭

An Object-to-Graph Mapping tool to build Knowledge Graphs with Node.js and Neo4j.

The idea behind the project is build a tool to facilitate creation, updates and management of Knowledge Graphs and their integration with 3rd party tools.

The philosophy of a Knowledge Graph:

1. Knowledge Graph stores knowledge of the real world as closely to how humans store it in their minds. Sane humans that is.
2. All entities that are unique in the real world are kept unique in Knowledge Graph.
3. Knowledge Graph can add new/store/update/remove old knowledge quickly and securely.
4. Users can benefit if they provide schemas of how their knowledge should relate to already existing Knowledge Graph, but this is optional.

Go to (doc)[http://ooddaa.co] to read full documentation.

## Tests

To run tests, create a config directory and add a config/testing.json file to it. This will be the testing config file and will contain the follwing environment variables:

`{ "neo4jUsername": "neo4j", "neo4jPassword": "password", "ip": "0.0.0.0", "port": "7687", "env": "testing", "database": "test" }`

Don't forget to create the 'test' database in Neo4j DBMS.

In fact, add all of your configs to this directory. My config directory looks like:

- default.json
- development.json
- production.json
- testing.json

Alternatively, you can do without it, and simply kick-start an Engine instance every time that you need it.
But I find it easier to

`import { engine } from './start.js'`;

and supply Neo4j credentials via a config file as described above.
