/* @flow */

import { Template } from './Template';
import {
    log,
    isIdentificationArray,
    isString,
    isNumber,
    isTimeArray,
    isValidYear,
    isValidMonth,
    isValidDay,
} from '../../utils';
import { RequiredValue } from "../../RequiredValue";

import _ from 'lodash';

/**
 * Takes care of EnhancedNode's Relationships based on node's
 * properties.
 * @param {nodeLikeObject??} node
 */
const relationshipsTemplate = node => {
    const inbound = [],
        outbound = []
    return { inbound, outbound }
}

/**
 * I can make a dynamically-grown TimeTree instead of creating fixed-size TimeTree.
 * Better: combine the two. Each Day will ensure it is connected to a month. Each Month -
 * to a Year.
 * PROBLEM: (day1)-[:NEXT]->(day2) what if day2 does not exist?
 */
class Day extends Template {
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
        this.labels = ['Day']
        this.properties = {
            required: {
                // KEY: new RequiredValue(constructor_name: string, example: any, validation: Function),
                YEAR: new RequiredValue('Number', 2018, val => isValidYear(val)),
                MONTH: new RequiredValue('Number', 12, val => isValidMonth(val)),
                DAY: new RequiredValue('Number', 1, val => isValidDay(val)),
            },
            optional: {}
        }
        this.createRelationships = relationshipsTemplate
    }
}


export { Day }