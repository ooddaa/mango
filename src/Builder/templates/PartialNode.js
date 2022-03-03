/* @flow */
import { Node } from './Node'
import { log } from '../../utils'

import keys from 'lodash/keys'
import has from 'lodash/has'
import isObject from 'lodash/isObject'

/**
 * PartialNodes are used to do Node matching. 
 * They will have `ranges`, `search specifications` etc.
 * Engine.matchPartialNodes will interpret PartialNode and
 * create Cypher query.
 */
class PartialNode extends Node {
  constructor(obj: Object) {
    /**
     * Trying to simplify user inteface by setting some defaults.
     * 
     * If incoming obj does not mention
     * isDate
     * isRange
     * isCondintion
     * 
     * then it's plain case, add these as false.
     */

    keys(obj.properties).forEach(prop => {
      // if an object and has type key value
      const property = obj.properties[prop]
      if (isObject(property)
        && !Array.isArray(property)) {

        // simple case
        if (!has(property, 'isDate')
          && !has(property, 'isRange')
          && !has(property, 'isCondition')) {
          property.isDate = false
          property.isRange = false
          property.isCondition = false
        }
        // condition
        if (property.isCondition == true) {
          property.isDate = false
          property.isRange = false
        }
        // is date
        /**@potential_bug can I have a date range with condition? */
        if (property.isDate == true) {
          property.isCondition = false
          property.isRange = property.isRange !== undefined ? property.isRange : false
        }
      }
    })

    super(obj)
  }
  setHash(): void {
    const props = this.getRequiredProperties()
    if (!keys(props).length) return
    this.properties._hash = this.createHash(this.toString())
  }
  toString(): string {
    /* must recursively stringify properties */
    return `${this.stringifyLabel(this.labels)}${JSON.stringify(this.getRequiredProperties())}`
  }
  /**
   * So far works with single property only.
   * @todo it's a bad hotfix, you can do better.
   */
  toObject(): Object {
    const props = this.properties
    const newProps = keys(this.getRequiredProperties())
      // .filter(word => word[0] !== '_' && word[0] === word[0].toUpperCase())
      .reduce((acc, key) => {
        const { isDate, isRange, isCondition } = props[key]
        if (!isDate && !isRange && !isCondition) {
          acc[key] = props[key].value[0]
        } else {
          throw new Error(`PartialNode.toObject: problem with values.\nthis: ${this}`)
        }
        return acc
      }, {})
    // log(keys(props))
    return {
      labels: this.labels,
      properties: newProps
    }
  }

  toNodeObject(): Object {
    const obj = this.toObject()
    /* OMG really? */
    const newObj = {
      ...obj,
      properties: {
        required: obj.properties
      }
    }
    return newObj
  }
}

function isPartialNode(val: any): boolean {
  return val instanceof PartialNode
}

export { PartialNode, isPartialNode }
