/* @flow */

import { Node } from './Node'
import { Template } from './Template'
import { Relationship } from './Relationship'
import {
  log,
  isValidYear,
  isValidMonth,
  isValidDay,
  isIdentificationArray,
  isString,
  isNumber,
  isBoolean,
  isTimeArray,
} from '../../utils'

import { Success, Failure } from '../../Result'
import { RequiredValue } from "../../RequiredValue";

import _ from 'lodash'

/**
 * Takes care of EnhancedNode's Relationships based on node's
 * properties.
 * @param {nodeLikeObject??} node
 */
const relationshipsTemplate = (node) => {
  const inbound = [],
    outbound = []

  /* must examine node and compose relationships */

  /**
   * **inbound** (Test)<-[:TEST]-(Day)
   * **outbound**(Test)-[:DAY]->(Day)
   */
  const day = { // is given to Builder.buildNodes() 
    labels: ['Day'],
    properties: ((node): nodeLikeObject => {
      const [YEAR, MONTH, DAY] = node.properties['DAY']
      return { required: { YEAR, MONTH, DAY } } // this must be nodeLikeObject
    })(node),
  }
  inbound.push(
    new Relationship({
      labels: ['TEST'],
      properties: {},
      startNode: day,
      endNode: node
    })
  )
  outbound.push(
    new Relationship({
      labels: ['DAY'],
      properties: {},
      startNode: node,
      endNode: day
    })
  )

  return { inbound, outbound }
}

/**
 * @todo have to remove all direct instantiations of Relationships/Nodes 
 */
class TestNode extends Template {
  constructor(obj?: {
    labels: string[],
    properties: {
      required: Object,
      optional: Object,
      // _private: Object
    },
    relationships: {
      inbound: Relationship[] | [],
      outbound: Relationship[] | [],
    }
  }) {
    super(obj)
    this.labels = ['Test']
    this.properties = {
      required: {
        NAME: new RequiredValue('String', 'Jon', val => isString(val)),
        SURNAME: new RequiredValue('String', 'Doe', val => isString(val)),
        SEX: new RequiredValue('String', 'Male', val => isString(val, ['Male', 'Female'])),
        // HEIGHT: new RequiredValue('Number', 123, val => isNumber(val)),
      },
      optional: {}
    }
    this.createRelationships = relationshipsTemplate
  }
}


export { TestNode }