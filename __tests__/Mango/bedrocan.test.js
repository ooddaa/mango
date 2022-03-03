import { Mango, log } from "../../src";

// const mango = new Mango();

test("first Mango", async () => {
  expect(true).toEqual(true);
  /** 1 Get hold of the Node */
  // /** 1.1 Look in DB or merge a new Node. End result - we work with an existing Node */
  // /** @PROBLEM I'm not feeling this to be a right decision - mixing reading and writing
  // to db in the same interface... */
  // const product1/* : Node[] */ = await mango.findOrMergeNode(["Product"], { NAME: "Bedrocan" });
  // const product2/* : Node[] */ = await mango.findOrMergeNode(["Product"], { NAME: "Bediol" });
  // const bedrocan/* : Node[] */ = await mango.findOrMergeNode(["Manufacturer"], { NAME: "Bedrocan" });

  /** 1.1 Look in DB - we may have a right Node already. */
  // let product1 /* : Node[] */ = await mango.findNode(["Product"], {
  //   NAME: "Bedrocan",
  // });
  // let product2 /* : Node[] */ = await mango.findNode(["Product"], {
  //   NAME: "Bediol",
  // });
  // let bedrocan /* : Node[] */ = await mango.findNode(["Manufacturer"], {
  //   NAME: "Bedrocan",
  // });
  // /* do checks */
  // log(product1);

  // /** 1.2 Some/all Nodes aren't present? Create and merge them */
  // product1 /* : Node */ = await mango.buildAndMergeNode(["Product"], {
  //   NAME: "Bedrocan",
  // });
  // product2 /* : Node */ = await mango.buildAndMergeNode(["Product"], {
  //   NAME: "Bedrocan",
  // });
  // bedrocan /* : Node */ = await mango.buildAndMergeNode(["Manufacturer"], {
  //   NAME: "Bedrocan",
  // });
  // log(product2);
  // /* now we have Nodes, lets add Relationships between them */

  // /** 2 Add Relationships */
  // // await mango.buildAndMergeRelationship(startNode, rel, endNode)
  // // We want:
  // // (bedrocan)<-[:MADE_BY]-(product1)
  // // (bedrocan)<-[:MADE_BY]-(product2)
  // let rel1 /* : Relationship */ = await mango.buildAndMergeRelationship(
  //   bedrocan,
  //   [["MADE_BY"], {}, "inbound", "required"],
  //   product1
  // );
  // log(rel1);
  // let rel2 /* : Relationship */ = await mango.buildAndMergeRelationship(
  //   bedrocan,
  //   [["MADE_BY"], {}, "inbound", "required"],
  //   product2
  // );
});

// /** 1.2 Decide */
//   /**@ABORTED */
//   const bedrocanEnode /* : EnhancedNode[] */ = await mango.findOrCreateEnhancedNode(
//     ["Manufacturer"],
//     { NAME: "Bedrocan",},
//     [
//       [["MADE_BY"], {}, "inbound",  "required",  product1],
//       [["MADE_BY"], {}, "inbound",  "required",  product2],
//     ],
//     {
//       // WYSIWYG principle means that this is a complete description of bedrocanEnode in
//       // our graph if there is already a (:Manufacturer { NAME: Bedrocan, anotherProp: 123 })
//       // this will delete it and replace it.
//       // if WYSIWYG: false - then we blend/merge this description into the existing graph,
//       // enriching it via engine.updateNodes.
//       // It means, that if we are adding new REQUIRED_PROPS, hashes need to be re-calculated on
//       // both EnhancedNode and all its Relationships.
//       /** @NOTE this gets too complicated, need to simplify */
//       // We must not hide implied graph variations - user must know when the graph is being written
//       // to. So I useEnhancedNode must only ... hm this goes nowhere
//       WYSIWYG: true,
//     }
//   );
