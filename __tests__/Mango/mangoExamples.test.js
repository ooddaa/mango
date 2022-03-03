import { engine } from "../../start";
import { Mango, search, Builder, log, Result, Success } from "../../src";

const builder = new Builder();
const mango = new Mango({ builder, engine });

describe("Main Mango workflow", () => {
  test("with await/async", async () => {
    await engine.cleanDB();

    const bob = await mango.buildAndMergeNode(["Person"], {
      FULL_NAME: "SpongeBob SquarePants",
    });
    const patrick = await mango.buildAndMergeNode(["Person"], {
      FULL_NAME: "Patrick Star",
    });

    expect(bob.isWritten()).toEqual(true);
    expect(patrick.isWritten()).toEqual(true);
  });
  test.skip("with .then()", async () => {
    /**@TODO .then DOES NOT WORK!?!?! */
    await engine.cleanDB();
    const bob = mango
      .buildAndMergeNode(["Person"], {
        FULL_NAME: "SpongeBob SquarePants",
        fullName: "SpongeBob SquarePants",
      })
      .then((enode) => {
        // log(enode);
        expect(enode.isWritten()).toEqual(true);
      });
  });
  test("buildAndMergeRelationship", async () => {
    await engine.cleanDB();

    const bob = await mango.buildAndMergeNode(["Person"], {
      FULL_NAME: "SpongeBob SquarePants",
    });
    const patrick = await mango.buildAndMergeNode(["Person"], {
      FULL_NAME: "Patrick Star",
    });

    expect(bob.isWritten()).toEqual(true);
    expect(patrick.isWritten()).toEqual(true);

    const relationship = await mango.buildAndMergeRelationship(
      bob,
      [["IS_FRIENDS_WITH"]],
      patrick
    );
    // log(relationship);
    expect(relationship.isWritten()).toEqual(true);
  });
  test.skip("findNode example", async () => {
    /**@TODO .then DOES NOT WORK!?!?! */
    await engine.cleanDB();

    mango
      .buildAndMergeNode(["Product"], { NAME: "Sweet Mango" })
      .then((node) => {
        console.log(node.isWritten()); // true <- Neo4j has a (Product { NAME: "Sweet Mango", _hash:str, _uuid:str, _date_created: TimeArray })
        console.log(node.getId()); // 1 <- Neo4j's Id for this Node
        expect(node.isWritten()).toEqual(false);
      });
  });
  test("findNode example", async () => {
    await engine.cleanDB();

    const node = await mango.buildAndMergeNode(["Product"], {
      NAME: "Sweet Mango",
    });
    console.log(node.isWritten()); // true <- Neo4j has a (Product { NAME: "Sweet Mango", _hash:str, _uuid:str, _date_created: TimeArray })
    console.log(node.getId()); // 1 <- Neo4j's Id for this Node
    expect(node.isWritten()).toEqual(true);
  });
});
