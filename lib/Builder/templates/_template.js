"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.templateObject = exports.template = void 0;

var _Template = require("./Template");

var _ = require("../..");

var _cloneDeep = _interopRequireDefault(require("lodash/cloneDeep"));

/**
 * Takes care of EnhancedNode's Relationships based on node's
 * properties. 
 * Will be called by Builder when instantiating Template.
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
   * **inbound** (template)<-[:template]-(Day)
   * **outbound** (template)-[:DATE]->(Day)
   */

  /* check first */
  // const { properties: date } = node 
  // if (!(date && isTimeArray(date))) {
  //   throw new Error(`relationshipsTemplate: template requires a Day relationship, but node provided no DATE: ${node}.`)
  // }

  inbound.push();
  outbound.push();
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
 * @todo make this 100% declarative, so that we can 'programm' it from client-side.
 * as in: 
 * 
 * DATE
 * constructor
 * example
 * validation
 * 
 * are all supplied as strings
 * then Builder/Validator (whoever) goes to library and uses the appropriate validation rule.
 */


function required_properties() {
  return {
    DATE: {
      constructor: 'Array',
      example: [2018, 1, 1, 1, 123],
      validation: val => (0, _.isTimeArray)(val)
    }
  };
}
/**
 * Template.
 */


class template extends _Template.Template {
  constructor(obj) {
    super(obj);
    this.labels = ["template"];
    this.properties = {
      required: {// DATE: {
        //   constructor: 'Array',
        //   example: [2018, 1, 1, 1, 123],
        //   validation: val => isTimeArray(val)
        // },
        // CATEGORY: {
        //   constructor: 'String',
        //   example: "TRANSPORT",
        //   validation: val => isString(val)
        // },
        // SUBCATEGORY: {
        //   constructor: 'String',
        //   example: "DRIVING",
        //   validation: val => isString(val)
        // },
        // AMOUNT: {
        //   constructor: 'Number',
        //   example: 1000,
        //   validation: val => isNumber(val)
        // },
        // CURRENCY: {
        //   constructor: 'String',
        //   example: 'GBP',
        //   validation: val => isString(val)
        // },
        // OWNER: {
        //   constructor: 'String',
        //   example: 'DV',
        //   validation: val => isString(val)
        // },
        // DESCRIPTION: {
        //   constructor: 'String',
        //   example: "something something",
        //   validation: val => isString(val)
        // },
        // ACCOUNT: {
        //   constructor: 'String',
        //   example: "TESCO",
        //   validation: val => isString(val)
        // }, 
        // DEBIT: {
        //   constructor: 'Boolean',
        //   example: true,
        //   validation: val => isBoolean(val)
        // }, 
      },
      optional: {}
    };
    this.createRelationships = relationshipsTemplate; // will be called by Builder
  }

}

exports.template = template;
var templateObject = {
  labels: ["template"],
  properties: {
    required: {
      DATE: [2018, 1, 1, 1, 123] // CATEGORY: "TRANSPORT",
      // SUBCATEGORY: 'DRIVING',
      // AMOUNT: 1000,
      // CURRENCY: "GBP",
      // OWNER: 'DV', 
      // ACCOUNT: 'TESCO',
      // DEBIT: true

    },
    optional: {// notes: "such and such H_transaction",
      // id: 123 // from _TRANSACTIONS_DB
    }
  }
};
/**
 * 2018-19 one day = one htransaction. 
 * for testing purposes
 */
// const mocktemplateObjects = ({ 
//   years = [2018, 2019], 
//   obj = templateObject
// } = {}) => {
//   return generateTimeArrays(years)
//       .map(timeArray => {
//         const tr = cloneDeep(obj)
//         tr.properties.required.DATE = timeArray
//         return tr
//       })
// }

exports.templateObject = templateObject;