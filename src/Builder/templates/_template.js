/* @flow */
import { Template } from './Template'

import {
  Success, Failure,
  log, isIdentificationArray,
  isString, isNumber, isBoolean, isTimeArray,
  generateTimeArrays
} from '../..';

import cloneDeep from 'lodash/cloneDeep';

/**
 * Takes care of EnhancedNode's Relationships based on node's
 * properties. 
 * Will be called by Builder when instantiating Template.
 * @param {nodeLikeObject??} node
 */
const relationshipsTemplate = (node, param: { ignore: String[] } = { ignore: [] }) => {

  const inbound = [],
    outbound = [],
    { ignore: ignoredRelationships = [] } = param

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

  inbound.push(
    // {
    // labels: ["template"],
    // properties: {},
    // startNode: {
    //   type: 'Node',
    //   labels: ["Day"],
    //   properties: (node => {
    //     const [YEAR, MONTH, DAY] = node.properties["DATE"]
    //     return { required: { YEAR, MONTH, DAY } }
    //   })(node)
    // },
    // endNode: node }
  )

  outbound.push(
    // {
    // labels: ["DATE"],
    // properties: {},
    // startNode: node,
    // endNode: {
    //   type: 'Node',
    //   labels: ["Day"],
    //   properties: (node => {
    //     const [YEAR, MONTH, DAY] = node.properties["DATE"]
    //     return { required: { YEAR, MONTH, DAY } }
    //   })(node)
    // }}
  )

  /* filter out non-required rels */
  if (ignoredRelationships.length) {
    const truncatedRelationships = {
      inbound: inbound.filter(relObj => !ignoredRelationships.includes(relObj.labels[0])),
      outbound: outbound.filter(relObj => !ignoredRelationships.includes(relObj.labels[0])),
    }
    return truncatedRelationships
  }
  return { inbound, outbound }
}

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
      validation: val => isTimeArray(val)
    },
  }
}

/**
 * Template.
 */
class template extends Template {
  constructor(obj?: {
    labels: string[],
    properties: {
      required: Object,
      optional: Object
    },
    relationships: {
      inbound: Relationship[] | [],
      outbound: Relationship[] | []
    }
  }) {
    super(obj)
    this.labels = ["template"]
    this.properties = {
      required: {
        // DATE: {
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
    }
    this.createRelationships = relationshipsTemplate // will be called by Builder
  }
}

const templateObject = {
  labels: ["template"],
  properties: {
    required: {
      DATE: [2018, 1, 1, 1, 123],
      // CATEGORY: "TRANSPORT",
      // SUBCATEGORY: 'DRIVING',
      // AMOUNT: 1000,
      // CURRENCY: "GBP",
      // OWNER: 'DV', 
      // ACCOUNT: 'TESCO',
      // DEBIT: true
    },
    optional: {
      // notes: "such and such H_transaction",
      // id: 123 // from _TRANSACTIONS_DB
    },
  }
}

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

export { template, templateObject/* , mocktemplateObjects */ }
