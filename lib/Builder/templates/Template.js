"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Template = void 0;

var _Relationship = require("./Relationship");

var _keys = _interopRequireDefault(require("lodash/keys"));

/**
 * This is god knows what, it: 
 * looks like a Node
 * quacks like a Node
 * functions like a Node
 * ????
 * @todo extends Node ????
 */
class Template
/* extends Node */
{
  constructor() {
    var obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    this.labels = obj.labels;
    this.properties = {
      required: obj.properties ? obj.properties.required : {},
      optional: obj.properties ? obj.properties.optional : {},
      _private: obj.properties ? obj.properties._private : {}
    };
  }
  /**
   * @public
   */


  getLabels() {
    return this.labels;
  }
  /**
   * @public
   */


  getRequiredProperties() {
    return (0, _keys.default)(this.properties.required);
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
          var {
            constructor_name,
            example
          } = this.properties.required[key]; // acc[key] = constructor ? constructor : undefined
          // [2020-01-13] this will never trigger, as there's always a constructor on object: [Function: Object]. I might have done a mistake by naming my property 'constructor'. 

          if (!constructor_name) {
            throw new Error("Template.generateModelObject(): no constructor_name specified:\nkey: ".concat(key, "\nvalue: ").concat(JSON.stringify(this.properties.required[key]), "."));
          }

          var value;

          if (constructor_name === "Array") {
            // need to display example's value's constructor_name names
            if (!example) {
              throw new Error("Template.generateModelObject(): no example specified: key: ".concat(key, "\nvalue: ").concat(JSON.stringify(this.properties.required[key]), "."));
            }

            if (!(example instanceof Array)) {
              throw new Error("Template.generateModelObject(): example is not an array: key: ".concat(key, "\nvalue: ").concat(JSON.stringify(this.properties.required[key]), "."));
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

exports.Template = Template;