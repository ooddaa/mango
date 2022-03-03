/* @flow */

import { Relationship } from "./Relationship";
import keys from "lodash/keys";

/**
 * This is god knows what, it: 
 * looks like a Node
 * quacks like a Node
 * functions like a Node
 * ????
 * @todo extends Node ????
 */
class Template /* extends Node */ {
  constructor(
    obj: {
      labels: string[],
      properties: {
        required: Object,
        optional: Object,
        _private: Object
      },
      relationships: {
        inbound: Relationship[],
        outbound: Relationship[]
      }
    } = {}
  ) {
    this.labels = obj.labels;
    this.properties = {
      required: obj.properties ? obj.properties.required : {},
      optional: obj.properties ? obj.properties.optional : {},
      _private: obj.properties ? obj.properties._private : {},
    };
  }

  /**
   * @public
   */
  getLabels(): string[] {
    return this.labels;
  }

  /**
   * @public
   */
  getRequiredProperties(): Array {
    return keys(this.properties.required);
  }

  /**
   * @public
   * ModelObject here means a handy 'half-baked' version of a templated Node, that is presented to user,
   * usually in case when some required props/values are missing or do not agree with the Template.
   */
  generateModelObject() {
    return {
      labels: this.getLabels(),
      properties: {
        required: this.getRequiredProperties().reduce((acc, key) => {
          let { constructor_name, example } = this.properties.required[key];
          // acc[key] = constructor ? constructor : undefined

          // [2020-01-13] this will never trigger, as there's always a constructor on object: [Function: Object]. I might have done a mistake by naming my property 'constructor'. 
          if (!constructor_name) {
            throw new Error(`Template.generateModelObject(): no constructor_name specified:\nkey: ${key}\nvalue: ${JSON.stringify(this.properties.required[key])}.`)
          }
          let value;
          if (constructor_name === "Array") {
            // need to display example's value's constructor_name names
            if (!example) {
              throw new Error(`Template.generateModelObject(): no example specified: key: ${key}\nvalue: ${JSON.stringify(this.properties.required[key])}.`)
            }
            if (!(example instanceof Array)) {
              throw new Error(`Template.generateModelObject(): example is not an array: key: ${key}\nvalue: ${JSON.stringify(this.properties.required[key])}.`)
            }
            value = example.map(elm => elm.constructor.name);
          } else {
            // otherwise we just trust the Template
            value = constructor_name;
          }
          acc[key] = value;
          return acc;
        }, {}),
        optional: this.properties.optional
      }
    };
  }
}

export { Template };
