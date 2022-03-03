/* @flow */

import { Node } from './Node';
import { Template } from './Template';
import { Relationship } from './Relationship';
import { Success, Failure } from '../../Result';
import { log, isIdentificationArray, isString, isNumber, isTimeArray } from '../../utils';

import _ from 'lodash';

/**
 * Takes care of EnhancedNode's Relationships based on node's
 * properties.
 * @param {nodeLikeObject??} node
 */
const relationshipsTemplate = node => {
  const inbound = [],
    outbound = []

  /* optional */
  /**
   * **inbound**  (CashAccount)<-[:CASH_ACCOUNT]-(Project) 
   * **outbound** (CashAccount)-[:PROJECT]->(Project)
   */
  if (node.properties['project']) {
    const projectNode = {
      type: 'PartialNode',
      labels: ['Project'],
      properties: ((node): partialNodeObj => { // this is ABSOLUTELY not gonna work now. 
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
        }
      })(node),
    }
    inbound.push(
      new Relationship({
        labels: ['CASH_ACCOUNT'],
        properties: {},
        startNode: projectNode,
        endNode: node,
      })
    )
    outbound.push(
      new Relationship({
        labels: ['PROJECT'],
        properties: {},
        startNode: node,
        endNode: projectNode
      })
    )
  }
  return { inbound, outbound }
}

/**
 * Template for CashAccount Nodes.
 * CashAccount's REQUIRED properties allow to make a Transfer = to send a Transaction.
 */
class CashAccount extends Template {
  labels: Object
  properties: Object
  createRelationships: Function
  constructor(obj?: {
    labels: string[],
    properties: {
      required: Object,
      optional: Object,
    },
    relationships: {
      inbound: Relationship[] | [],
      outbound: Relationship[] | [],
    }
  }) {
    super(obj)
    this.labels = ['CashAccount']
    this.properties = {
      required: {
        CURRENCY: {
          constructor: 'String',
          example: 'USD',
          validation: (val) => {
            if (!val) return new Failure({
              reason: `No truthy value.`,
              parameters: { val }
            })
            if (val.constructor.name !== 'String') return new Failure({
              reason: `Value must be string.`,
              parameters: { val }
            })
            return new Success()
          }
        },
      },
      optional: {}
    }
    /**
     * Values of relationships is based on the node, to make it automatic for cases
     * where user supplies nodeLikeObject. 
     * Later I will implement more complex case, where user supplies enhancedNodeLikeObject. 
     * But still some 'default' relationships will remain. 
     */
    this.createRelationships = relationshipsTemplate;
  }
}

const cashAccountObject = {
  labels: ['CashAccount'],
  properties: {
    required: {
      CURRENCY: 'USD',
    },
    optional: {
      notes: 'such and such account',
      project: 'some specific project?'
    },
    _private: {
      // ADDED BY BUILDER 
      // _date_updated: [1,2,3,4,5],   
      // _user_created: 'lol',      
      // _user_updated: 'bar',      
      // _user_checked: 'Dima',
      // _label: 'CashAccount',
      // _hash: '123abc',
      // _temporary_uuid: '123123'
    }

  }
}

export { CashAccount, cashAccountObject }
