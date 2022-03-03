"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cashAccountObject = exports.CashAccount = void 0;

var _Node = require("./Node");

var _Template = require("./Template");

var _Relationship = require("./Relationship");

var _Result = require("../../Result");

var _utils = require("../../utils");

var _lodash = _interopRequireDefault(require("lodash"));

/**
 * Takes care of EnhancedNode's Relationships based on node's
 * properties.
 * @param {nodeLikeObject??} node
 */
var relationshipsTemplate = node => {
  var inbound = [],
      outbound = [];
  /* optional */

  /**
   * **inbound**  (CashAccount)<-[:CASH_ACCOUNT]-(Project) 
   * **outbound** (CashAccount)-[:PROJECT]->(Project)
   */

  if (node.properties['project']) {
    var projectNode = {
      type: 'PartialNode',
      labels: ['Project'],
      properties: (node => {
        // this is ABSOLUTELY not gonna work now. 
        return {
          required: {
            project: {
              isDate: false,
              isRange: false,
              isCondition: false,
              type: 'property',
              key: 'project',
              value: [node.properties['project']]
            }
          }
        };
      })(node)
    };
    inbound.push(new _Relationship.Relationship({
      labels: ['CASH_ACCOUNT'],
      properties: {},
      startNode: projectNode,
      endNode: node
    }));
    outbound.push(new _Relationship.Relationship({
      labels: ['PROJECT'],
      properties: {},
      startNode: node,
      endNode: projectNode
    }));
  }

  return {
    inbound,
    outbound
  };
};
/**
 * Template for CashAccount Nodes.
 * CashAccount's REQUIRED properties allow to make a Transfer = to send a Transaction.
 */


class CashAccount extends _Template.Template {
  constructor(obj) {
    super(obj);
    this.labels = ['CashAccount'];
    this.properties = {
      required: {
        CURRENCY: {
          constructor: 'String',
          example: 'USD',
          validation: val => {
            if (!val) return new _Result.Failure({
              reason: "No truthy value.",
              parameters: {
                val
              }
            });
            if (val.constructor.name !== 'String') return new _Result.Failure({
              reason: "Value must be string.",
              parameters: {
                val
              }
            });
            return new _Result.Success();
          }
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

exports.CashAccount = CashAccount;
var cashAccountObject = {
  labels: ['CashAccount'],
  properties: {
    required: {
      CURRENCY: 'USD'
    },
    optional: {
      notes: 'such and such account',
      project: 'some specific project?'
    },
    _private: {// ADDED BY BUILDER 
      // _date_updated: [1,2,3,4,5],   
      // _user_created: 'lol',      
      // _user_updated: 'bar',      
      // _user_checked: 'Dima',
      // _label: 'CashAccount',
      // _hash: '123abc',
      // _temporary_uuid: '123123'
    }
  }
};
exports.cashAccountObject = cashAccountObject;