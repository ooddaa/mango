"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.transactionObject = exports.Transaction = void 0;

var _Node = require("./Node");

var _Template = require("./Template");

var _Relationship = require("./Relationship");

var _Result = require("../../Result");

var _utils = require("../../utils");

var _types = require("../../types");

var _IdArray = require("../../IdArray");

var _RequiredValue = require("../../RequiredValue");

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
var _createRelationshipsTemplate = function _createRelationshipsTemplate(node) {
  var param = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    ignore: []
  };
  var inbound = [],
      outbound = [],
      {
    ignore: ignoredRelationships = []
  } = param; // log(ignoredRelationships)

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
        var [YEAR, MONTH, DAY] = node.properties["DATE_SENT"];
        return {
          required: {
            YEAR,
            MONTH,
            DAY
          }
        };
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
        var [YEAR, MONTH, DAY] = node.properties["DATE_SENT"];
        return {
          required: {
            YEAR,
            MONTH,
            DAY
          }
        };
      })(node)
    }
  });
  /* PAYOR / PAYEE */

  /**
   * **outbound** (Transaction)-[:PAYOR]->(Beneficiary)
   * **outbound** (Transaction)-[:PAYEE]->(Beneficiary)
   */

  var beneficiary_node = (node, type) => {
    // type = [PAYOR / PAYEE]
    // log(node)
    var [NICKNAME, ID, _hash] = node.properties[type] instanceof _IdArray.IdArray ? node.properties[type].toArray() : node.properties[type];
    var propType = node.properties["".concat(type, "_TYPE")]; // it's really a label.

    if (!propType) {
      throw new Error("Transaction template: beneficiary_node(): propType not specified,\nmake sure there is a ".concat(type, "_TYPE property."));
    }

    var label = propType; //whats the purpose of Node???? Seems that I should do new Node(...node) (less 'type')

    var beneficiary = {
      type: "Node",
      labels: [label],
      properties: {
        required: {}
      },
      identity: null
    }; // log(NICKNAME, ID, _hash)

    /**
     * ID && _hash > ID > _hash > NICKNAME 
     */

    /* if we have all key identifications */

    if (ID.length && !isNaN(ID)
    /* && ID !== '123' */
    && _hash.length) {
      // log('has identifications')
      // log(type)
      // console.log(NICKNAME, ID, _hash)
      return {
        type: "IdentifiedNode",
        labels: [label],
        properties: {
          _hash
        },
        identity: {
          low: ID,
          high: 0
        }
      };
    }
    /* if we have ID, matchNodes by ID */


    if (ID.length && !isNaN(ID)
    /* && ID !== '123' */
    ) {
      // log('has id')
      // beneficiary.identity = { low: ID, high: 0 };
      // return beneficiary;
      return {
        type: "IdentifiedNode",
        labels: [label],
        properties: {},
        identity: {
          low: ID,
          high: 0
        }
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
        properties: {
          _hash
        } // identity: { low: ID, high: 0 }

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
    var truncatedRelationships = {
      inbound: inbound.filter(relObj => !ignoredRelationships.includes(relObj.labels[0])),
      outbound: outbound.filter(relObj => !ignoredRelationships.includes(relObj.labels[0]))
    }; // log(truncatedRelationships)

    return truncatedRelationships;
  }

  return {
    inbound,
    outbound
  };
};
/**
 * Template for Transaction Nodes.
 */


class Transaction extends _Template.Template {
  constructor(obj) {
    super(obj);
    this.labels = ["Transaction"];
    this.properties = {
      required: {
        DATE_SENT: new _RequiredValue.RequiredValue("Array", [2018, 8, 27, 1, 123], val => (0, _utils.isTimeArray)(val)),
        PROJECT: new _RequiredValue.RequiredValue("String", "testTest", val => (0, _utils.isString)(val)),
        TOTAL_AMOUNT: new _RequiredValue.RequiredValue("Number", 1000, val => (0, _utils.isNumber)(val)),
        SUM_AMOUNT: new _RequiredValue.RequiredValue("Number", 900, val => (0, _utils.isNumber)(val)),
        FEES_AMOUNT: new _RequiredValue.RequiredValue("Number", 100, val => (0, _utils.isNumber)(val)),
        CURRENCY: new _RequiredValue.RequiredValue("String", "USD", val => (0, _utils.isString)(val)),
        BANK: new _RequiredValue.RequiredValue("IdArray", ["Bank_A", "123", "_hash"], val => (0, _utils.isIdentificationArray)(val)),
        PAYOR: new _RequiredValue.RequiredValue("IdArray", ["Payor_A", "123", "_hash"], val => (0, _utils.isIdentificationArray)(val)),
        PAYEE: new _RequiredValue.RequiredValue("IdArray", ["Payee_A", "123", "_hash"], val => (0, _utils.isIdentificationArray)(val)),
        PAYMENT_REFERENCE: new _RequiredValue.RequiredValue("String", "abc", val => (0, _utils.isString)(val)),
        PAYOR_TYPE: new _RequiredValue.RequiredValue("String", "Person", val => (0, _utils.isString)(val, _types.beneficiary_types)),
        PAYEE_TYPE: new _RequiredValue.RequiredValue("String", "Person", val => (0, _utils.isString)(val, _types.beneficiary_types))
      },
      optional: {// from_account: {
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

exports.Transaction = Transaction;
var transactionObject = {
  labels: ["Transaction"],
  properties: {
    required: {
      DATE_SENT: [2018, 8, 27, 1, 123],
      PROJECT: "testTest",
      TOTAL_AMOUNT: 1000,
      SUM_AMOUNT: 900,
      FEES_AMOUNT: 100,
      CURRENCY: "USD",
      BANK: new _IdArray.IdArray(["EFG", 123, "_hash"]),
      PAYOR: new _IdArray.IdArray(["Best Ltd", 123, "_hash"]),
      // at first do (Tr)-[:PAYOR]->(Beneficiary_Type), then (Tr)-[:from_account]->(BankAccount)-[:BENEFICIARY]->(Beneficiary_Type)
      PAYEE: new _IdArray.IdArray(["All Stars LLC", 123, "_hash"]),
      // at first do (Tr)-[:PAYEE]->(Beneficiary_Type), then (Tr)-[:to_account]->(BankAccount)-[:BENEFICIARY]->(Beneficiary_Type)
      PAYMENT_REFERENCE: "abc",
      PAYOR_TYPE: "LegalPerson",
      PAYEE_TYPE: "LegalPerson"
    },
    optional: {
      notes: "such and such transaction",
      date_received: [2018, 8, 27, 1, 123] // from_account: [], // (Tr)-[:FROM_ACCOUNT]->(Account) ideally IBAN, for K2 == NICKNAME
      // to_account: [] // (Tr)-[:TO_ACCOUNT]->(Account)

    } // _private: {
    //   _source: '_authoritative_source' // for data linage tracing as per BCBS 239
    // }

  }
};
exports.transactionObject = transactionObject;