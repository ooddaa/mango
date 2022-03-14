/* @flow */

import {
  Builder,
  Node,
  NodeCandidate,
  isNode,
  log,
  EnhancedNode,
} from "../../src";

import cloneDeep from "lodash/cloneDeep";
import { engine } from "../../start";

const builder = new Builder();

const item = {
  was: {
    product: "Noidecs T10:C15 Cannabis Oil",
    form: "Full Spectrum Oil",
    strain: "Sativa",
    cultivar: "N/A",
    thc: "10 mg/ml",
    cbd: "15 mg/ml",
    size: "50ml",
    privateprescriptionpricingapprox: "50ml bottle from £175",
    availableonprojecttwenty21: "Yes",
    productsize: "50ml bottle",
    monthlyamountcappedat15: "upto 50ml",
    pharmacyt21: "Dispensary Green",
    notes: "",
    levelsinstockuk: "Out Of Stock",
    atpharmacy: "No",
    moreinformationreviews: null,
    dispensary: "dg",
  },
  now: {
    product: "Noidecs T10:C15 Cannabis Oil",
    form: "Full Spectrum Oil",
    form: {
      rel: [
        ["HAS_FORM"], // type
        "outbound", // direction
        {}, // props
      ],
      endNode: [
        ["Product"], // labels
        { NAME: "Full Spectrum Oil" }, // required props
        {}, // optional props
      ],
    },

    strain: "Sativa",
    cultivar: "N/A",
    thc: "10 mg/ml",
    cbd: "15 mg/ml",
    size: "50ml",
    privateprescriptionpricingapprox: "50ml bottle from £175",
    availableonprojecttwenty21: "Yes",
    productsize: "50ml bottle",
    monthlyamountcappedat15: "upto 50ml",
    pharmacyt21: "Dispensary Green",
    notes: "",
    levelsinstockuk: "Out Of Stock",
    atpharmacy: "No",
    moreinformationreviews: null,
    dispensary: "dg",
  },
};

const _date_created = [
    expect.any(Number),
    expect.any(Number),
    expect.any(Number),
    expect.any(Number),
    expect.any(Number),
  ],
  _uuid = expect.any(String),
  _hash = expect.any(String),
  identity = { low: expect.any(Number), high: 0 };

/**
 * This is high-level utility function will be used by client's App in order to turn
 * a Plain Old JavaScript Object (POJO) into an EnhancedNode.
 */
describe("make an EnhancedNode out of POJOs", () => {
  test('(:Person { NAME: "Rob" })-[:HAS_FRIEND]->(:Person { NAME: "Charlie" })', async () => {
    const startNode = builder.makeNode(["Person"], { NAME: "Rob" });
    const endNode = builder.makeNode(["Person"], { NAME: "Charlie" });
    const rc = builder.makeRelationshipCandidate(["HAS_FRIEND"], endNode);
    const enode = builder.makeEnhancedNode(startNode, [rc]);
    expect(enode).toBeInstanceOf(EnhancedNode);

    // const results: Result[] = await engine.mergeEnhancedNodes([enode]);
    // expect(results[0].getData()[0].isWritten()).toEqual(true);
  });
  test("deep enode", async () => {
    /* (:Person { NAME: "Rob" })-[:HAS_FRIEND]->(:Person { NAME: "Charlie" })-[:HAS_ROOMMATE]->(:Person { NAME: "Frank" }) */
    /* order is important */
    const mn = builder.makeNode.bind(builder);
    const mrc = builder.makeRelationshipCandidate.bind(builder);
    const men = builder.makeEnhancedNode.bind(builder);

    const rob = mn(["Person"], { NAME: "Rob" });
    const frank = mn(["Person"], { NAME: "Frank" });
    const hasRoommate = mrc(["HAS_ROOMMATE"], frank);
    let charlie = mn(["Person"], { NAME: "Charlie" });
    charlie = men(charlie, [hasRoommate]);

    const hasFriend = mrc(["HAS_FRIEND"], charlie);
    const enode = men(rob, [hasFriend]);

    expect(enode).toBeInstanceOf(EnhancedNode);
    expect(enode.getParticipatingRelationships()).toHaveLength(2);
  });
  // test.only("deep enode", async () => {
  //   // (:Person { NAME: "Rob" })-[:HAS_FRIEND]->(:Person { NAME: "Charlie" })-[:HAS_ROOMMATE]->(:Person { NAME: "Frank" })
  //   const mn = builder.makeNode.bind(builder);
  //   const mrc = builder.makeRelationshipCandidate.bind(builder);
  //   const men = builder.makeEnhancedNode.bind(builder);

  //   const rob = mn(["Person"], { NAME: "Rob" });
  //   const charlie = mn(["Person"], { NAME: "Charlie" });
  //   const frank = mn(["Person"], { NAME: "Frank" });

  //   const hasFriend = mrc(["HAS_FRIEND"], charlie);
  //   const hasRoommate = mrc(["HAS_ROOMMATE"], frank);
  //   const enode1 = men(rob, [hasFriend]);

  //   expect(enode1).toBeInstanceOf(EnhancedNode);
  //   log(enode1);

  //   const enode2 = men(charlie, [hasRoommate]);
  //   expect(enode2).toBeInstanceOf(EnhancedNode);

  //   log(enode2);

  //   // const results: Result[] = await engine.mergeEnhancedNodes([enode]);
  //   // expect(results[0].getData()[0].isWritten()).toEqual(true);
  // });
});
