import { engine } from "../../start";
import { Mango, search, Builder, log, Result, Success } from "../../src";

const builder = new Builder();
const mango = new Mango({ builder, engine });
const dbProps = {
  properties: {
    _date_created: [
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
    ],
    _uuid: expect.any(String),
    _hash: expect.any(String),
  },
  identity: { low: expect.any(Number), high: 0 },
};

describe("Node exists", () => {
  test("exact match", async () => {
    /// db setup
    /**
     * Merge 3 nodes into DB, all have same NAME prop.
     * Match by NAME.
     * Since it's an exactMatch, only one will come back.
     */
    await engine.cleanDB();

    const node = builder.makeNode(["Product"], {
      NAME: "Bedrocan",
    });
    const node2 = builder.makeNode(["Product"], {
      NAME: "Bedrocan",
      TYPE: "B",
    });
    const node3 = builder.makeNode(["Product"], {
      NAME: "Bedrocan",
      optional: "optional",
    });
    const mergedNode = await engine.mergeNodes([node, node2, node3]);
    expect(mergedNode[0]).toBeInstanceOf(Success);
    /// !db setup

    let products /* : Node[] */ = await mango.findNode(
      ["Product"],
      {
        NAME: "Bedrocan",
      },
      { exactMatch: true }
    );
    expect(products).toBeInstanceOf(Array);
    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      labels: ["Product"],
      properties: {
        NAME: "Bedrocan",
      },
      ...dbProps,
    });

    /* ID is the same, ie no copies */
    expect(mergedNode[0].getData().getId()).toEqual(products[0].getId());
  });

  describe("non-exact match", () => {
    test("use shorthand to match 3 out of 3 Nodes", async () => {
      /// db setup
      /**
       * Merge 3 nodes into DB, all have same NAME prop.
       * Match by NAME.
       * Since it's NOT an exactMatch, all three will be matched.
       */
      await engine.cleanDB();

      const node = builder.makeNode(["Product"], {
        NAME: "Bedrocan",
      });
      const node2 = builder.makeNode(["Product"], {
        NAME: "Bedrocan",
        TYPE: "B",
      });
      const node3 = builder.makeNode(["Product"], {
        NAME: "Bedrocan",
        TYPE: "optional",
      });
      const mergedNode = await engine.mergeNodes([node, node2, node3]);
      // log(mergedNode);
      expect(mergedNode[0]).toBeInstanceOf(Success);
      /// !db setup

      let products /* : EnhancedNode[] */ = await mango.findNode(
        ["Product"],
        {
          NAME: "Bedrocan",
        },
        { exactMatch: false }
      );

      /* 3 matches */
      expect(products).toBeInstanceOf(Array);
      expect(products).toHaveLength(3);

      expect(products[0]).toMatchObject({
        labels: ["Product"],
        properties: {
          NAME: "Bedrocan",
        },
        ...dbProps,
      });

      /* all IDs match */
      for (let i = 0; i < products.length; i++) {
        expect(mergedNode[i].getData().getId()).toEqual(products[i].getId());
      }
    });

    test("use search to match 3 out of 3 Nodes", async () => {
      /// db setup
      /**
       * Merge 3 nodes into DB, all have same NAME prop.
       * Match by NAME.
       * Since it's NOT an exactMatch, all three will be matched.
       */
      await engine.cleanDB();

      const node = builder.makeNode(["Product"], {
        NAME: "Bedrocan",
      });
      const node2 = builder.makeNode(["Product"], {
        NAME: "Bedrocan",
        TYPE: "B",
      });
      const node3 = builder.makeNode(["Product"], {
        NAME: "Bedrocan",
        TYPE: "optional",
      });
      const mergedNode = await engine.mergeNodes([node, node2, node3]);
      expect(mergedNode[0]).toBeInstanceOf(Success);
      /// !db setup

      let products /* : EnhancedNode[] */ = await mango.findNode(
        ["Product"],
        {
          NAME: search("e", "Bedrocan"),
        },
        { exactMatch: false }
      );

      /* 3 matches */
      expect(products).toBeInstanceOf(Array);
      expect(products).toHaveLength(3);

      expect(products[0]).toMatchObject({
        labels: ["Product"],
        properties: {
          NAME: "Bedrocan",
        },
        ...dbProps,
      });

      /* all IDs match */
      for (let i = 0; i < products.length; i++) {
        expect(mergedNode[i].getData().getId()).toEqual(products[i].getId());
      }
    });

    test("use search to match 3 out of 3 Nodes", async () => {
      /// db setup
      /**
       * Merge 3 nodes into DB, all have same NAME prop.
       * Match by NAME.
       * Since it's NOT an exactMatch, all three will be matched.
       */
      await engine.cleanDB();

      const node = builder.makeNode(["Product"], {
        NAME: "Bedrocan",
      });
      const node2 = builder.makeNode(["Product"], {
        NAME: "Bedrocan",
        TYPE: "B",
      });
      const node3 = builder.makeNode(["Product"], {
        NAME: "Bedrocan",
        TYPE: "optional",
      });
      const mergedNode = await engine.mergeNodes([node, node2, node3]);
      expect(mergedNode[0]).toBeInstanceOf(Success);
      /// !db setup

      let products /* : EnhancedNode[] */ = await mango.findNode(
        ["Product"],
        {
          TYPE: search("in", ["B", "optional"]),
        },
        { exactMatch: false }
      );

      /* 2 matches */
      expect(products).toBeInstanceOf(Array);
      expect(products).toHaveLength(2);

      /* all IDs match */

      expect(mergedNode[1].getData().getId()).toEqual(products[0].getId());
      expect(mergedNode[2].getData().getId()).toEqual(products[1].getId());
    });

    test("matches by label only", async () => {
      /// db setup
      /**
       * Merge 3 nodes into DB, all have same NAME prop.
       * Match by NAME.
       * Since it's an exactMatch, only one will come back.
       */
      await engine.cleanDB();

      const node1 = builder.makeNode(["Passport"], {
        PASSPORT_NUMBER: "123",
        TYPE: "P",
      });
      const node2 = builder.makeNode(["Passport"], {
        PASSPORT_NUMBER: "456",
        TYPE: "P",
      });
      const node3 = builder.makeNode(["Passport"], {
        PASSPORT_NUMBER: "789",
        TYPE: "P",
      });
      const node4 = builder.makeNode(["Not_Passport"], {
        NOT_PASSPORT_NUMBER: "000",
        TYPE: "ID",
      });
      const mergedNodes: Result[] = await engine.mergeNodes([node1, node2, node3, node4]);
      expect(mergedNodes[0]).toBeInstanceOf(Success);
      /// !db setup

      const passports /* : Node[] */ = await mango.findNode(
        ["Passport"]
      );

      expect(passports).toBeInstanceOf(Array);
      expect(passports).toHaveLength(3);
      expect(passports[0]).toMatchObject({
        labels: ["Passport"],
        properties: {
          PASSPORT_NUMBER: expect.any(String),
          TYPE: "P",
        },
        ...dbProps,
      });

      // /* ID is the same, ie no copies */
      // expect(mergedNodes[0].getData().getId()).toEqual(passports[0].getId());
    });
  });

  describe("fuzzy match", () => {
    test('single prop fuzzy match: find Keanu Reeves as Keanu', async () => {
      /// db setup
      /**
       * Merge 3 nodes into DB, all have same NAME prop.
       * Match by NAME.
       * Since it's an exactMatch, only one will come back.
       */
      await engine.cleanDB();

      const node1 = builder.makeNode(["Person"], {
        NAME: "Keanu Reeves",
      });
      const node2 = builder.makeNode(["Person"], {
        NAME: "KeanuReeves",
      });
      const node3 = builder.makeNode(["Person"], {
        NAME: "Keanu",
      });
      const node4 = builder.makeNode(["Person"], {
        NAME: "Reeves",
      });
      const mergedNodes: Result[] = await engine.mergeNodes([node1, node2, node3, node4]);
      expect(mergedNodes[0]).toBeInstanceOf(Success);
      /// !db setup

       const keanus /* : Node[] */ = await mango.findNode(["Person"], { NAME: 'Keanu' }, { fuzzy: true });

      expect(keanus).toBeInstanceOf(Array);
      expect(keanus).toHaveLength(3);
      expect(keanus[0].properties.NAME.includes('Keanu')).toEqual(true)
    })

    test.skip('select props to fuzzy match on: find Keanu Reeves as Keanu, and all Neos', async () => {
      /// db setup
      /**
       * Merge 3 nodes into DB, all have same NAME prop.
       * Match by NAME.
       * Since it's an exactMatch, only one will come back.
       */
      await engine.cleanDB();

      const node1 = builder.makeNode(["Person"], {
        NAME: "Keanu Reeves",
      });
      const node2 = builder.makeNode(["Person"], {
        NAME: "KeanuReeves",
      });
      const node3 = builder.makeNode(["Person"], {
        NAME: "Keanu",
      });
      const node4 = builder.makeNode(["Person"], {
        NAME: "Reeves",
      });
      const mergedNodes: Result[] = await engine.mergeNodes([node1, node2, node3, node4]);
      expect(mergedNodes[0]).toBeInstanceOf(Success);
      /// !db setup

       const keanus /* : Node[] */ = await mango.findNode(["Person"], { NAME: 'Keanu' }, { fuzzy: true });

      expect(keanus).toBeInstanceOf(Array);
      expect(keanus).toHaveLength(3);
      expect(keanus[0].properties.NAME.includes('Keanu')).toEqual(true)
    })
  })
});
