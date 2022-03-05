# Mango 🥭

Goal: A tool that builds Knowledge Graphs and plants Knowledge Trees 🌳

Simply: it is an Object-to-Graph Mapping tool that you can use to work with [Neo4j](https://neo4j.com/) from your [Node.js](https://nodejs.org/) application.

## Idea

The idea behind the project is to build a tool to makes it easy to perform

- Create
- Read
- Update
- Delete
  operations on Neo4j Graph Database using JavaScript.

## Philosophy:

Graphs are powerful because they are visually obvious. You may draw a graph to simplify something. It takes a purely abstract thought concept and makes it appear as a 2D model in front of your eyes.

Graphs are powerful because they are simple. As a basic data structure a Node or (Node), can represent any amount of data. If (Node1) and (Node2) have a way to associate, then it could
be expressed as (Node1)-[:RELATES_TO]->(Node2). And there you have it - a full blown Knowledge Graph!

Now think of adding properties to Nodes and its Relationships and the expressive potential is limitless.

Rich Knowledge Graphs can provide enough machine-readable context for humans to build useful
real-world services.

Go to [doc](https://ooddaa.github.io/mango/) to read full documentation.

## Tests

To run tests, add Neo4j credentials to config/testing.json file:

`{ "neo4jUsername": "neo4j", "neo4jPassword": "password", "ip": "0.0.0.0", "port": "7687", "env": "testing", "database": "test" }`
