/* @flow */

import { Node } from './Node';
import { Template } from './Template';
import { Relationship } from './Relationship';
import { Success, Failure } from '../../Result';
import { RequiredValue } from "../../RequiredValue";
import {
  log, isIdentificationArray,
  isString, isNumber, isBoolean, isTimeArray
} from '../../utils';
import { beneficiary_types } from '../../types';

/**
 * Takes care of EnhancedNode's Relationships based on node's
 * properties.  
 * @param {nodeLikeObject??} node 
 */
const relationshipsTemplate = (node) => {
  const inbound = [],
    outbound = []
  return { inbound, outbound }
}

/**
 * 
 */
class LegalPerson extends Template {
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
    this.labels = ['LegalPerson']
    this.properties = {
      required: {
        NICKNAME: new RequiredValue('String', 'Payor_A', val => isString(val)),
        TYPE: new RequiredValue('String', 'Company', val => isString(val, beneficiary_types)),
        REG_NUMBER: new RequiredValue('String', '123abc', val => isString(val)),
        COUNTRY_OF_INCORPORATION: new RequiredValue('IdArray', ['BVI', 'ID', '_hash'], val => isIdentificationArray(val)),
        IS_ACTIVE: new RequiredValue('Boolean', true, val => isBoolean(val)),
        DATE_OF_INCORPORATION: new RequiredValue('Array', [2018, 1, 1, 1, 123], val => isTimeArray(val)),

      },
      optional: {}
    }
    this.createRelationships = relationshipsTemplate
  }
}

const legalPersonObject = {
  labels: ['LegalPerson'],
  properties: {
    required: {
      NICKNAME: 'Payor_A',
      TYPE: 'Company',
      REG_NUMBER: '123abc',
      COUNTRY_OF_INCORPORATION: ['BVI', 'ID', '_hash'],
      IS_ACTIVE: true,
      DATE_OF_INCORPORATION: [2018, 1, 1, 1, 123]
    },
    optional: {},
    _private: {}
  }
}

export { LegalPerson, legalPersonObject }
