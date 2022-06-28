"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.bankAccountObject = exports.BankAccount = void 0;

var _Node = require("./Node");

var _Template = require("./Template");

var _Relationship = require("./Relationship");

var _Result = require("../../Result");

var _types = require("../../types");

var _utils = require("../../utils");

/**
 * Takes care of EnhancedNode's Relationships based on node's
 * properties. 
 * @todo use `.buildRelationships` instead of `new Relationship` 
 * @param {nodeLikeObject??} node 
 */
var relationshipsTemplate = node => {
  var inbound = [],
      outbound = [];
  /* must examine node and compose relationships */

  /* required props first */

  /* BENEFICIARY */

  /**
   * **inbound** (BankAccount)<-[:HAS_BANK_ACCOUNT]-(Beneficiary_Type)
   * **outbound** (BankAccount)-[:BENEFICIARY]->(Beneficiary_Type)
   */

  var beneficiary_node = node => {
    var [full_legal_name, ID, _hash] = node.properties['BENEFICIARY'];
    var beneficiary_type = node.properties['BENEFICIARY_TYPE'];
    var beneficiary = {
      type: 'Node',
      labels: [beneficiary_type],
      properties: {
        required: {}
      },
      identity: null
    };

    if (full_legal_name.length) {
      beneficiary.properties.required.FULL_NAME = full_legal_name;
    }

    if (ID.length && !isNaN(ID)) {
      beneficiary.identity = {
        low: ID,
        high: 0
      };
    }

    if (_hash.length) {
      beneficiary.properties._hash = _hash;
    }

    return beneficiary;
  };

  inbound.push(new _Relationship.Relationship({
    labels: ['HAS_BANK_ACCOUNT'],
    properties: {},
    startNode: beneficiary_node(node),
    endNode: node
  }));
  outbound.push(new _Relationship.Relationship({
    labels: ['BENEFICIARY'],
    properties: {},
    startNode: node,
    endNode: beneficiary_node(node)
  }));
  /* BANK_NAME */

  /* AUTHORISED_SIGNATORY */

  /* optionals */

  /* date_opened */

  /* date_closed */

  return {
    inbound,
    outbound
  };
};
/**
 * Template for BankAccount Nodes.
 * BankAccount's REQUIRED properties allow to make a Transfer = to send a Transaction.
 * @todo what if we have `joint` BankAccount with 2 persons as beneficiaries?
 */


class BankAccount extends _Template.Template {
  constructor(obj) {
    super(obj);
    this.labels = ['BankAccount'];
    this.properties = {
      required: {
        TYPE: {
          constructor: 'String',
          example: 'personal',
          validation: val => (0, _utils.isString)(val)
        },
        IBAN: {
          constructor: 'String',
          example: 'IBAN12312123',
          validation: val => (0, _utils.isString)(val)
        },
        ACCOUNT_NUMBER: {
          constructor: 'String',
          example: '123123132.Z',
          validation: val => (0, _utils.isString)(val)
        },
        BENEFICIARY_TYPE: {
          constructor: 'String',
          example: 'Person',
          validation: val => (0, _utils.isString)(val, _types.beneficiary_types)
        },
        BENEFICIARY: {
          constructor: 'Array',
          example: ['Jon Doe', 'ID', '_hash'],
          // [full_legal_name, Neo4j ID, _hash] == identificationArray
          validation: val => (0, _utils.isIdentificationArray)(val)
        },
        SWIFT_CODE: {
          constructor: 'String',
          example: 'SWIFT123',
          validation: val => (0, _utils.isString)(val)
        },
        BANK_NAME: {
          constructor: 'Array',
          example: ['EFG', 'ID', '_hash'],
          // [full_legal_name, Neo4j ID, _hash] == identificationArray
          validation: val => (0, _utils.isIdentificationArray)(val)
        },
        BANK_ADDRESS: {
          constructor: 'String',
          example: '1 Baker St, London, UK',
          validation: val => (0, _utils.isString)(val)
        },
        CURRENCY: {
          constructor: 'String',
          example: 'USD',
          validation: val => (0, _utils.isString)(val)
        },
        IS_ACTIVE: {
          constructor: 'Boolean',
          example: true,
          validation: val => (0, _utils.isBoolean)(val)
        },
        AUTHORISED_SIGNATORY: {
          constructor: 'Array',
          example: ['Jon Doe', 'ID', '_hash'],
          validation: val => (0, _utils.isIdentificationArray)(val)
        }
      },
      optional: {}
    };
    /**
     * Values of relationships is based on the node, to make it automatic for cases
     * where user supplies nodeLikeObject. 
     * Later I will implement more complex case, where user supplies enhancedNodeLikeObject. 
     * But still some 'default' relationships will remain. 
     */

    this.createRelationships = relationshipsTemplate;
  }

}

exports.BankAccount = BankAccount;
var bankAccountObject = {
  labels: ['BankAccount'],
  properties: {
    required: {
      TYPE: 'personal',
      // personal, joint, corporate what else?
      IBAN: 'IBAN12312123',
      ACCOUNT_NUMBER: '132.Z',
      BENEFICIARY_TYPE: 'Person',
      // Entity/Person one of Labels so we could do indexed search later on Label + _hash (if given)
      BENEFICIARY: ['Jon Doe', 'ID', '_hash'],
      // joint?     // if Beneficiary does not have his own Node, then ['Jon Doe', '', ''] check with size(x.BENEFICIARY[1]) <> 0

      /* we need AUTORIZED_SIGNATORY/ies */
      // ACCOUNT_MANAGER: ['Rita', 'ID', '_hash'],       // [AccountManagerName:str, AccountManager._id: str] <-[:ACCOUNT_MANAGER]-(x) where id(x) = toInteger(Account.ACCOUNT_MANAGER[1]) 
      SWIFT_CODE: 'ABC123',
      BANK_NAME: ['EFG', 'ID', '_hash'],
      // (Account)-[:BANK_NAME]->(Bank)
      BANK_ADDRESS: '1 Baker St, London, UK',
      // (Account)-[:BANK_NAME]->(Bank)-[:BANK_ADDRESS]->(Address) need to have ['1 Baker St, London, UK', 'ID', '_hash'] ??
      CURRENCY: 'USD',
      // TYPE: 'BANK',    // what type of institution created this account? something like BANK/ESCROW/CASH/etc
      // STATUS: 'active'
      IS_ACTIVE: true,
      // E_BANKING: ['']                              // do we have access, who has access? where's token, what's login/pass?? where they are?? // (Account)-[:ACCESS]->(Ebanking_Access)
      AUTHORISED_SIGNATORY: ['Jon Doe', 'ID', '_hash']
    },
    optional: {
      notes: 'such and such account',
      sort_code: 123345,
      contact_person: ['Kerstin', 'ID', '_hash'],
      date_opened: [2018, 1, 1, 1, 123],
      // time array
      date_closed: null
    },
    _private: {// ADDED BY BUILDER 
      // _date_updated: [1,2,3,4,5],   
      // _user_created: 'lol',      
      // _user_updated: 'bar',      
      // _user_checked: 'Dima',
      // _label: 'BankAccount',
      // _hash: '123abc',
      // _temporary_uuid: '123123'
    }
  }
};
exports.bankAccountObject = bankAccountObject;