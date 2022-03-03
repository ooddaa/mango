/* @flow */
import { Template } from './Template';

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
        const [YEAR, MONTH, DAY] = node.properties["DATE"]
        return { required: { YEAR, MONTH, DAY } }
      })(node)
    },
    endNode: node
  })
  outbound.push({
    labels: ["DATE"],
    properties: {},
    startNode: node,
    endNode: {
      type: 'Node',
      labels: ["Day"],
      properties: (node => {
        const [YEAR, MONTH, DAY] = node.properties["DATE"]
        return { required: { YEAR, MONTH, DAY } }
      })(node)
    }
  })
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
 * Template for H_Transaction Nodes.
 */
class HTransaction extends Template {
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
    this.labels = ["HTransaction"]
    this.properties = {
      required: {
        DATE: {
          constructor: 'Array',
          example: [2018, 1, 1, 1, 123],
          validation: val => isTimeArray(val)
        },
        CATEGORY: {
          constructor: 'String',
          example: "TRANSPORT",
          validation: val => isString(val)
        },
        SUBCATEGORY: {
          constructor: 'String',
          example: "DRIVING",
          validation: val => isString(val)
        },
        AMOUNT: {
          constructor: 'Number',
          example: 1000,
          validation: val => isNumber(val)
        },
        CURRENCY: {
          constructor: 'String',
          example: 'GBP',
          validation: val => isString(val)
        },
        OWNER: {
          constructor: 'String',
          example: 'DV',
          validation: val => isString(val)
        },
        DESCRIPTION: {
          constructor: 'String',
          example: "something something",
          validation: val => isString(val)
        },
        ACCOUNT: {
          constructor: 'String',
          example: "TESCO",
          validation: val => isString(val)
        },
        DEBIT: {
          constructor: 'Boolean',
          example: true,
          validation: val => isBoolean(val)
        },
      },
      optional: {}
    }
    this.createRelationships = relationshipsTemplate
  }
}

const HTransactionObject = {
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
      notes: "such and such H_transaction",
      // id: 123 // from _TRANSACTIONS_DB
    },
  }
}

/**
 * 2018-19 one day = one htransaction. 
 * 
 */
const mockHTransactionObjects = ({
  years = [2018, 2019],
  obj = HTransactionObject
} = {}) => {
  return generateTimeArrays(years)
    .map(timeArray => {
      const tr = cloneDeep(obj)
      tr.properties.required.DATE = timeArray
      return tr
    })
}

export { HTransaction, HTransactionObject, mockHTransactionObjects }
