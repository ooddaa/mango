/* @flow */
"use strict";

import { Template, IdArray, Result, Success, Failure, NodeCandidate } from "./";
import { superlog } from "./utils";

import keys from "lodash/keys";
import difference from "lodash/difference";
import cloneDeep from "lodash/cloneDeep";

import type { nodeObj, enhancedNodeObj } from "./types";

const log = superlog(__dirname, { showDirectory: true });

/**
 * @todo omg stop using object wrappers for boolean, string, number!!
 * https://flow.org/en/docs/types/primitives/
 */

declare type keyValidation = {
  valid: boolean,
  expected: string,
  received: string,
  type: string,
};
declare type valueValidation = {
  valid: boolean,
  expected: {
    constructor: string | typeof undefined,
    example: any,
  },
  received: {
    constructor: string | typeof undefined,
    value: any,
  },
};
declare type validationArray = [keyValidation, valueValidation][];

class Validator {
  validations: Result;
  node: nodeObj;
  template: Template;
  config: Object;
  constructor(
    node: nodeObj,
    Template: Template,
    params: { validateOptionals: boolean } = {}
  ) {
    this.node = node;
    this.template = new Template();
    this.config = {
      validateOptionals: params.validateOptionals || false,
    };
    this.validations = this.validate();
  }

  /**
   * Main method.
   * @private
   * Creates validationArray == [[{key_validation},{value_validation}],]
   * which tells whether the candidate node has satisfied all Template's requirements.
   *
   * @todo will be used in connection with Config to decide additional Labels.
   *
   * @param {nodeObj} node
   * @param {Template} template_node
   */
  _createValidationArray(
    node: NodeCandidate,
    template: Template
  ): validationArray {
    /**
     * 0. Some pre-checks.
     * 1. Validate if the node's required props and values satisfy Template.
     * 2. Check if node has extra required properties, not specified by Template (mb misspelled?).
     * 3. Check optionals.
     */
    // log(node)
    if (!node || !node.properties || !node.properties.required) {
      throw new Error(
        `Validator._createValidationArray(): (!node || !node.properties || !node.properties.required) - cannot reach required properties.\nnode: ${JSON.stringify(
          node
        )}`
      );
    }

    const node_props = node.properties.required,
      template_props = template.properties.required,
      template_keys = keys(template_props),
      node_keys = keys(node_props);

    /**
     * 1. Validate if the node's required props and values satisfy Template.
     */
    const requiredValidations = template_keys.map((key) => {
      // @todo this ugly ass format is due to prettier VS extension, which I need to config

      const requiredValue = template["properties"]["required"][key],
        constructor = requiredValue.getConstructorName(),
        example = requiredValue.getExample(),
        validation = requiredValue.getValidation();

      return [
        _validateRequiredKey(node, key),
        _validateRequiredValue(node, key, constructor, example, validation),
      ];
    });

    /**
     * 2. Check if node has extra required properties, not specified by Template (mb misspelled?).
     * Will reveal node's extra non required properties.
     * @todo to be regulated by Config. Will now limit to Transaction only!
     */
    let not_required_props = [];
    // if (template.labels[0] === "Transaction") {
    if (["Transaction", "Loan"].includes(template.labels[0])) {
      not_required_props = difference(keys(node_props), keys(template_props));

      /* if it does, create key/value validation summaries */
      not_required_props = not_required_props.length
        ? not_required_props.map((not_required_prop_key) => {
            return [
              // key_validation
              {
                valid: false,
                expected: "",
                received: not_required_prop_key,
                type: "not_required",
              },
              // value_validation
              {
                valid: false,
                expected: {
                  constructor: undefined,
                  example: undefined,
                },
                received: {
                  constructor:
                    node.properties.required[not_required_prop_key].constructor
                      .name,
                  value: node.properties.required[not_required_prop_key],
                },
              },
            ];
          })
        : [];
    }

    /**
     * 3. Check optionals.
     */
    let optionalValidations: validationArray | [] = [];
    if (this.config.validateOptionals) {
      optionalValidations = keys(node.properties.optional).map((key) => {
        return [_validateOptionalKey(key), _validateOptionalValue(node, key)];
      });
    }

    const validationArray: validationArray = [
      ...requiredValidations.concat(not_required_props),
      ...optionalValidations,
    ];
    return validationArray;

    /////////////// FUN ///////////////

    /**
     * Main method to validate whether a candidate node's key of a required property
     * is present. Generally there are no validations for keys except being present/absent.
     *
     * @private
     * @param {*} node
     * @param {string} key template's key
     */
    function _validateRequiredKey(node, key: string): keyValidation {
      const key_valid = node_keys.includes(key);
      return {
        valid: key_valid,
        expected: key,
        received: key_valid ? key : "",
        type: "required",
      };
    }

    /**
     * Main method to validate whether a candidate node's value for required property
     * satisfies requirements of the Template.
     * @private
     * @param {*} node
     * @param {string} key template's key
     * @param {Function} validation validation for particular value provided by Template
     * @param {string} constructor
     * @param {any} example
     */
    function _validateRequiredValue(
      node,
      key: string,
      constructor: string,
      example: any,
      validation: Function
    ): valueValidation {
      const received_value = _normalizeRequiredValue(node, key);
      return {
        valid:
          received_value === undefined
            ? false
            : validation(received_value).success,
        expected: {
          constructor,
          example,
        },
        received: {
          constructor: _findReceivedConstructor(node, received_value, key),
          value: received_value,
        },
      };
    }

    /**
     * @private
     * I need to handle non-literals that might be presented as values on nodeObj.
     * For instance, IdArray. Later - TimeArray.
     * @param {*} key template's required key
     */
    function _normalizeRequiredValue(node, key: string): any {
      const value = node.properties.required[key],
        node_has_req_prop = node_keys.includes(key);

      if (value === undefined) {
        return undefined;
      }
      if (value instanceof IdArray) {
        return value.toArray();
      }
      return value;
    }

    /**
     * @private
     * @param {} node // a bit overkill, mb just pass value here?
     * @param {} value
     * @param {*} key template's required key
     */
    function _findReceivedConstructor(
      node,
      value: any,
      key: string
    ): string | typeof undefined {
      if (value === undefined) {
        return undefined;
      }
      if (value === null) {
        return "Object";
      }
      if (typeof value === "string") {
        return "String";
      }
      const constructor = node.properties.required[key].constructor;
      if (constructor) {
        return constructor.name;
      }
      if (isNaN(value)) {
        return "Number";
      }
      return "unable to find constructor";
    }

    /**
     * Main method to validate an optional key, which we never expect, so
     * Template does not regulate for it. (if it did, it wouldn't be optional :)
     *
     * @private
     * @param {string} key template's key
     */
    function _validateOptionalKey(key: string): keyValidation {
      return {
        valid: true, // we never expect any optional, and always glad to have some, so always true
        expected: "",
        received: key,
        type: "optional",
      };
    }

    /**
     * Main method to validate whether a candidate node's value for required property
     * satisfies requirements of the Template.
     * @private
     * @param {*} node
     * @param {string} key template's key
     */
    function _validateOptionalValue(node, key: string): valueValidation {
      const value = node.properties.optional[key];
      const value_valid = (function IIFE() {
        if (value.constructor.name === "Object") {
          return false;
        }
        if (
          value instanceof Array &&
          (value.some((elm) => elm instanceof Array) ||
            // we cannot as of Neo4j3.5.8 have lists of non-literals, so we exclude those here
            value.some((elm) => elm.constructor.name === "Object"))
        ) {
          return false;
        }
        return true;
      })();
      return {
        valid: value_valid,
        expected: {
          constructor: undefined,
          example: undefined,
        },
        received: {
          constructor: value.constructor.name,
          value: value,
        },
      };
    }

    /////////////// END ///////////////
  }

  /**
   * Utility function to shorthand reducing in _valuesOk/_keysOk/_noExtraRequiredProps
   * @private
   * @param {validationArray} validations
   * @param {Function} predicate
   */
  _general(validations: validationArray, predicate: Function) {
    const reducer = _outer(predicate);
    if (!validations.length) {
      return [];
    }
    return cloneDeep(validations).reduce(reducer);

    /////////////// FUN ///////////////
    /**
     * While I remember why I did it =) This this actually obvious after 5 sec.
     * I need to be able to pass my predicate functions into Array.reduce.
     * @param {Function} predicate
     */
    function _outer(predicate: Function) {
      return function inner(acc: boolean, [key, value]: [Object, Object]) {
        if (predicate(key, value)) {
          acc = false;
          return acc;
        }
        return acc;
      };
    }
    /////////////// END ///////////////
  }

  /**
   * @private
   * @param {*} validations
   */
  _keysOK(validations: validationArray): boolean | [] {
    return this._general(validations, (key, value) => key.valid === false);
  }

  /**
   * @private
   * @param {validationArray} validations
   */
  _valuesOK(validations: validationArray): boolean | [] {
    return this._general(
      validations,
      (key, value) => key.valid === true && value.valid === false
    );
  }

  /**
   * @private
   * @param {validationArray} validations
   */
  _noExtraRequiredProps(validations: validationArray): boolean | [] {
    return this._general(
      validations,
      (key, value) => key.valid === false && key.type === "not_required"
    );
  }

  /**
   * @public
   * Returns Result.data = Object[][] of key:value validation results.
   * Main work is performed by this._createValidationArray
   *
   * @example
   * [{
   *   valid: true,
   *   expected: 'DATE_SENT',
   *   received: 'DATE_SENT',
   *   type: 'required'
   *  },
   *  {
   *   valid: true,
   *   expected: { constructor: 'Array', example: [2018, 8, 27, 1, 123] },
   *   received: { constructor: 'Array', value: [2018, 8, 27, 1, 123] }
   *  }],
   */
  validate(
    obj: { validateOptionals?: boolean } = { validateOptionals: false }
  ): Result {
    this.config.validateOptionals = obj.validateOptionals;
    const validations: validationArray = this._createValidationArray(
      this.node,
      this.template
    );

    const reason = [];
    if (!this._keysOK(validations))
      reason.push(`Validator.validate: Missing required properties.`);
    if (!this._valuesOK(validations))
      reason.push(`Validator.validate: Values are not validated.`);
    if (!this._noExtraRequiredProps(validations))
      reason.push(`Validator.validate: Non required properties present.`);

    if (reason.length) {
      return new Failure({
        reason: reason.join(" "),
        data: validations,
        parameters: {
          node: this.node,
          template: this.template,
        },
      });
    }

    return new Success({
      parameters: {
        node: this.node,
        template: this.template,
      },
      data: validations,
    });
  }

  /**
   * @public
   * Returns only key:value pairs that passed validation.
   * Used for creating a 'Frankenstein' object (.toObject()) to show user,
   * in hopes that they will add the missing key:value pairs.
   */
  getPassedValidations() {
    if (!this.validations) this.validate();
    return this.validations.data.filter(
      ([key, value]) => key.valid && value.valid
    );
  }

  /**
   * @public
   * Same idea as for getPassedValidation, returns failed ones.
   */
  getFailedValidations() {
    if (!this.validations) this.validate();
    return this.validations.data.filter(
      ([key, value]) => !key.valid || !value.valid
    );
  }

  /**
   * @public
   */
  getValidationArray(): Object[][] {
    return this.validations;
  }

  /**
   * @public
   * Idea behind this is to populate a 'model' object, generated by
   * Template, with required key:value pairs and pass this
   * object to user, so that he could add any missing values in a
   * straightforward fashion.
   *
   * Missing values are represented by the name of an expected constructor.
   * @example
   * const node = {
   *  key1: 'foo'
   * }
   * const model = {
   *  key1: String,
   *  key2: Number,
   *  key3: [Number, Number]
   * }
   * // const result = new Validator(node, model).toObject()
   * // log(result)
   * {
   *  key1: 'foo',
   *  key2: 'Number',
   *  key3: ['Number', 'Number']
   * }
   * @example! So user ads key2, key3, and we can continue validating until all ok.
   */
  toObject(): Object {
    const result = this.template.generateModelObject(); // base class method
    /* collect what's usable and add to result */
    this.getPassedValidations().forEach(([keyValidation, valueValidation]) => {
      const key = keyValidation.received,
        { value } = valueValidation.received;
      result.properties.required[key] = value;
    });
    return result;
  }

  /**
   * @public
   * keke
   */
  toFrankensteinObject(): Object {
    return this.toObject();
  }

  // getValidationResult
}

export { Validator /* , Validations */ };
