"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mockHTransactionObjects = exports.HTransactionObject = exports.HTransaction = void 0;

var _Template = require("./Template");

var _ = require("../..");

var _cloneDeep = _interopRequireDefault(require("lodash/cloneDeep"));

/**
 * Takes care of EnhancedNode's Relationships based on node's
 * properties.
 * @param {nodeLikeObject??} node
 */
var relationshipsTemplate = function relationshipsTemplate(node) {
  var param = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    ignore: []
  };
  var inbound = [],
      outbound = [],
      {
    ignore: ignoredRelationships = []
  } = param;
  /* must examine node and compose relationships */

  /* required props first */

  /* DATE */

  /**
   * **inbound** (H_Transaction)<-[:HTRANSACTION]-(Day)
   * **outbound** (H_Transaction)-[:DATE]->(Day)
   */

  inbound.push({
    labels: ["HTRANSACTION"],
    properties: {},
    startNode: {
      type: 'Node',
      labels: ["Day"],
      properties: (node => {
        var [YEAR, MONTH, DAY] = node.properties["DATE"];
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
    labels: ["DATE"],
    properties: {},
    startNode: node,
    endNode: {
      type: 'Node',
      labels: ["Day"],
      properties: (node => {
        var [YEAR, MONTH, DAY] = node.properties["DATE"];
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
  /* filter out non-required rels */

  if (ignoredRelationships.length) {
    var truncatedRelationships = {
      inbound: inbound.filter(relObj => !ignoredRelationships.includes(relObj.labels[0])),
      outbound: outbound.filter(relObj => !ignoredRelationships.includes(relObj.labels[0]))
    };
    return truncatedRelationships;
  }

  return {
    inbound,
    outbound
  };
};
/**
 * Template for H_Transaction Nodes.
 */


class HTransaction extends _Template.Template {
  constructor(obj) {
    super(obj);
    this.labels = ["HTransaction"];
    this.properties = {
      required: {
        DATE: {
          constructor: 'Array',
          example: [2018, 1, 1, 1, 123],
          validation: val => (0, _.isTimeArray)(val)
        },
        CATEGORY: {
          constructor: 'String',
          example: "TRANSPORT",
          validation: val => (0, _.isString)(val)
        },
        SUBCATEGORY: {
          constructor: 'String',
          example: "DRIVING",
          validation: val => (0, _.isString)(val)
        },
        AMOUNT: {
          constructor: 'Number',
          example: 1000,
          validation: val => (0, _.isNumber)(val)
        },
        CURRENCY: {
          constructor: 'String',
          example: 'GBP',
          validation: val => (0, _.isString)(val)
        },
        OWNER: {
          constructor: 'String',
          example: 'DV',
          validation: val => (0, _.isString)(val)
        },
        DESCRIPTION: {
          constructor: 'String',
          example: "something something",
          validation: val => (0, _.isString)(val)
        },
        ACCOUNT: {
          constructor: 'String',
          example: "TESCO",
          validation: val => (0, _.isString)(val)
        },
        DEBIT: {
          constructor: 'Boolean',
          example: true,
          validation: val => (0, _.isBoolean)(val)
        }
      },
      optional: {}
    };
    this.createRelationships = relationshipsTemplate;
  }

}

exports.HTransaction = HTransaction;
var HTransactionObject = {
  labels: ["HTransaction"],
  properties: {
    required: {
      DATE: [2018, 1, 1, 1, 123],
      CATEGORY: "TRANSPORT",
      SUBCATEGORY: 'DRIVING',
      DESCRIPTION: "MONK_LESSON",
      AMOUNT: 1000,
      CURRENCY: "GBP",
      OWNER: 'DV',
      ACCOUNT: 'TESCO',
      DEBIT: true
    },
    optional: {
      notes: "such and such H_transaction" // id: 123 // from _TRANSACTIONS_DB

    }
  }
};
/**
 * 2018-19 one day = one htransaction. 
 * 
 */

exports.HTransactionObject = HTransactionObject;

var mockHTransactionObjects = function mockHTransactionObjects() {
  var {
    years = [2018, 2019],
    obj = HTransactionObject
  } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  return (0, _.generateTimeArrays)(years).map(timeArray => {
    var tr = (0, _cloneDeep.default)(obj);
    tr.properties.required.DATE = timeArray;
    return tr;
  });
};

exports.mockHTransactionObjects = mockHTransactionObjects;