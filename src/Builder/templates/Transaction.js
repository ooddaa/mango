/* @flow */

import { Node } from "./Node";
import { Template } from "./Template";
import { Relationship } from "./Relationship";
import { Success, Failure } from "../../Result";
import {
  log,
  isIdentificationArray,
  isString,
  isNumber,
  isBoolean,
  isTimeArray
} from "../../utils";
import { beneficiary_types } from "../../types";
import type { relationshipsTemplate } from "../../types";
import { IdArray } from "../../IdArray";
import { RequiredValue } from "../../RequiredValue";

/**
 * Purpose of this function (which is invoked as Template.createRelationships method)
 * is to provide a template of relationships for Builder.buildEnhancedNodes to work with.
 * 
 * Whereas in simple Builder.buildNodes we do not concern ourselves with any relationships,
 * the central idea behind EnhancedNode is that EnhancedNode = Node + all of its direct siblings
 * (ie relationships of first kind). 
 * 
 * Therefore we need to specify how Builder must instantiate Relationships. The most important part
 * is how Builder should search for those sibling Nodes. Builder searches by passing  
 * 
 * Takes care of EnhancedNode's Relationships based on node's
 * properties.
 * @todo supply `relationshipObj` instead of `new Relationship`
 * @param {nodeLikeObject??} node
 */
const _createRelationshipsTemplate = (
  node,
  param: { ignore: String[] } = { ignore: [] }
): relationshipsTemplate => {
  const inbound = [],
    outbound = [],
    { ignore: ignoredRelationships = [] } = param;
  // log(ignoredRelationships)

  /* must examine node and compose relationships */

  /* required props first */

  /* DATE_SENT */
  /**
   * **inbound** (Transaction)<-[:TRANSACTION]-(Day)
   * **outbound** (Transaction)-[:DATE_SENT]->(Day)
   */

  inbound.push({
    labels: ["TRANSACTION"],
    properties: {},
    startNode: {
      type: "Node",
      labels: ["Day"],
      properties: (node => {
        const [YEAR, MONTH, DAY] = node.properties["DATE_SENT"];
        return { required: { YEAR, MONTH, DAY } };
      })(node)
    },
    endNode: node
  });
  outbound.push({
    labels: ["DATE_SENT"],
    properties: {},
    startNode: node,
    endNode: {
      type: "Node",
      labels: ["Day"],
      properties: (node => {
        const [YEAR, MONTH, DAY] = node.properties["DATE_SENT"];
        return { required: { YEAR, MONTH, DAY } };
      })(node)
    }
  });

  /* PAYOR / PAYEE */
  /**
   * **outbound** (Transaction)-[:PAYOR]->(Beneficiary)
   * **outbound** (Transaction)-[:PAYEE]->(Beneficiary)
   */
  const beneficiary_node = (node: Node, type: string): nodeLikeObject => {
    // type = [PAYOR / PAYEE]
    // log(node)
    const [NICKNAME, ID, _hash] =
      node.properties[type] instanceof IdArray
        ? node.properties[type].toArray()
        : node.properties[type]

    const propType = node.properties[`${type}_TYPE`] // it's really a label.
    if (!propType) {
      throw new Error(`Transaction template: beneficiary_node(): propType not specified,\nmake sure there is a ${type}_TYPE property.`)
    }
    const label = propType

    //whats the purpose of Node???? Seems that I should do new Node(...node) (less 'type')
    const beneficiary = {
      type: "Node",
      labels: [label],
      properties: {
        required: {}
      },
      identity: null
    };
    // log(NICKNAME, ID, _hash)

    /**
     * ID && _hash > ID > _hash > NICKNAME 
     */
    /* if we have all key identifications */
    if (ID.length && !isNaN(ID) /* && ID !== '123' */ && _hash.length) {
      // log('has identifications')
      // log(type)
      // console.log(NICKNAME, ID, _hash)
      return {
        type: "IdentifiedNode",
        labels: [label],
        properties: { _hash },
        identity: { low: ID, high: 0 }
      };
    }
    /* if we have ID, matchNodes by ID */
    if (ID.length && !isNaN(ID) /* && ID !== '123' */) {
      // log('has id')
      // beneficiary.identity = { low: ID, high: 0 };
      // return beneficiary;
      return {
        type: "IdentifiedNode",
        labels: [label],
        properties: {},
        identity: { low: ID, high: 0 }
      };
    }
    /* if we have _hash, matchNodes by _hash, BUT WE DONT HAVE LABEL NOW SO NO INDEXING! */
    /**
     * @question [2020-01-20] ???????
     */
    if (_hash.length) {
      // log('has hash')
      // beneficiary.properties._hash = _hash;
      // return beneficiary;
      return {
        type: "IdentifiedNode",
        labels: [label],
        properties: { _hash },
        // identity: { low: ID, high: 0 }
      };
    }

    /**
     * If this happens - which will at first when Graph has not been developed, and there are no IDs? then
     * Builder shall use Engine.matchPartialNodes() to try find that one Node.
     * 
     * [2020-01-20] Last resort - find by NICKNAME property. 
     */
    if (NICKNAME.length) {
      return {
        type: "PartialNode",
        labels: [label],
        properties: {
          required: {
            NICKNAME: {
              isDate: false,
              isRange: false,
              isCondition: false,
              type: "property",
              key: "NICKNAME",
              value: [NICKNAME]
            }
          }
        }
      };
    }
    return beneficiary;
  };
  outbound.push({
    labels: ["PAYOR"],
    properties: {},
    startNode: node,
    endNode: beneficiary_node(node, "PAYOR")
  });

  outbound.push({
    labels: ["PAYEE"],
    properties: {},
    startNode: node,
    endNode: beneficiary_node(node, "PAYEE")
  });

  /* PROJECT */
  /* BANK */

  /* optionals */

  /* date_received */
  // log(outbound)

  /* filter out non-required rels */
  if (ignoredRelationships.length) {
    const truncatedRelationships = {
      inbound: inbound.filter(
        relObj => !ignoredRelationships.includes(relObj.labels[0])
      ),
      outbound: outbound.filter(
        relObj => !ignoredRelationships.includes(relObj.labels[0])
      )
    };
    // log(truncatedRelationships)
    return truncatedRelationships;
  }
  return { inbound, outbound };
};

/**
 * Template for Transaction Nodes.
 */
class Transaction extends Template {
  constructor(obj?: {
    // labels: string[],
    properties: {
      required: Object,
      optional: Object
    },
    relationships: {
      inbound: Relationship[] | [],
      outbound: Relationship[] | []
    }
  }) {
    super(obj);
    this.labels = ["Transaction"];
    this.properties = {
      required: {
        DATE_SENT: new RequiredValue("Array", [2018, 8, 27, 1, 123], val => isTimeArray(val)),
        PROJECT: new RequiredValue("String", "testTest", val => isString(val)),
        TOTAL_AMOUNT: new RequiredValue("Number", 1000, val => isNumber(val)),
        SUM_AMOUNT: new RequiredValue("Number", 900, val => isNumber(val)),
        FEES_AMOUNT: new RequiredValue("Number", 100, val => isNumber(val)),
        CURRENCY: new RequiredValue("String", "USD", val => isString(val)),
        BANK: new RequiredValue("IdArray", ["Bank_A", "123", "_hash"], val => isIdentificationArray(val)),
        PAYOR: new RequiredValue("IdArray", ["Payor_A", "123", "_hash"], val => isIdentificationArray(val)),
        PAYEE: new RequiredValue("IdArray", ["Payee_A", "123", "_hash"], val => isIdentificationArray(val)),
        PAYMENT_REFERENCE: new RequiredValue("String", "abc", val => isString(val)),
        PAYOR_TYPE: new RequiredValue("String", "Person", val => isString(val, beneficiary_types)),
        PAYEE_TYPE: new RequiredValue("String", "Person", val => isString(val, beneficiary_types)),
      },
      optional: {
        // from_account: {
        //   constructor: 'Array',
        //   example: ['UBS_Solaris_CY_USD', '123', '_hash'], // NICKNAME
        //   validation: (val) => {
        //     return isIdentificationArray(val)
        //   }
        // }
      }
    };
    /**
     * Values of relationships is based on the node, to make it automatic for cases
     * where user supplies nodeLikeObject.
     * Later I will implement more complex case, where user supplies enhancedNodeLikeObject.
     * But still some 'default' relationships will remain.
     */
    this.createRelationshipsTemplate = _createRelationshipsTemplate;
  }
}

const transactionObject = {
  labels: ["Transaction"],
  properties: {
    required: {
      DATE_SENT: [2018, 8, 27, 1, 123],
      PROJECT: "testTest",
      TOTAL_AMOUNT: 1000,
      SUM_AMOUNT: 900,
      FEES_AMOUNT: 100,
      CURRENCY: "USD",
      BANK: new IdArray(["EFG", 123, "_hash"]),
      PAYOR: new IdArray(["Best Ltd", 123, "_hash"]), // at first do (Tr)-[:PAYOR]->(Beneficiary_Type), then (Tr)-[:from_account]->(BankAccount)-[:BENEFICIARY]->(Beneficiary_Type)
      PAYEE: new IdArray(["All Stars LLC", 123, "_hash"]), // at first do (Tr)-[:PAYEE]->(Beneficiary_Type), then (Tr)-[:to_account]->(BankAccount)-[:BENEFICIARY]->(Beneficiary_Type)
      PAYMENT_REFERENCE: "abc",
      PAYOR_TYPE: "LegalPerson",
      PAYEE_TYPE: "LegalPerson"
    },
    optional: {
      notes: "such and such transaction",
      date_received: [2018, 8, 27, 1, 123]
      // from_account: [], // (Tr)-[:FROM_ACCOUNT]->(Account) ideally IBAN, for K2 == NICKNAME
      // to_account: [] // (Tr)-[:TO_ACCOUNT]->(Account)
    }
    // _private: {
    //   _source: '_authoritative_source' // for data linage tracing as per BCBS 239
    // }
  }
};

export { Transaction, transactionObject };
