"use strict";
/**
 * [2022-02-01] This is to create Templates.
 * [2020-01-13] I just realized (after finding a clash of names 'constructor' vs
 * native 'constructor' in Template.generateModelObject()) that I should be better
 * off if I formalize assignment of required properties to Templates. Hence - this class.
 *
 * Just had a tough mental debate on the subject of purpose of this class - should it be
 * RequiredProperty or RequiredValue? If RP - then we need to include property_name and
 * adjust Template to receive RequiredProperty[] to define its required props. Which is
 * logical, but too big a change with unclear advantages. Whereas if we go with RV only -
 * we aim at the goal described in the first paragraph above.
 * Which seems more important now.
 *
 * On the signature. Whereas I'd like to stick with my preferred way of function/class
 * signatures ({ key: val }), I think I should sacrifice it here for the sake of being
 * more concise with Templates, it will take anyone just one look at function signature
 * (I can leave it as comment in the relevant place) and then not be bothered with
 * excessive repetition of { constructor_name, example, validation }. I think that's a win here.
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RequiredValue = void 0;

class RequiredValue {
  constructor(constructor_name, example, validation) {
    this.constructor_name = constructor_name;
    this.example = example;
    this.validation = validation;
  }
  /**
   * @public
   */


  getConstructorName() {
    return this.constructor_name;
  }
  /**
   * @public
   */


  getExample() {
    return this.example;
  }
  /**
   * @public
   */


  getValidation() {
    // let's test that it's a function
    if (typeof this.validation !== "function") {
      throw new Error("RequiredValue.getValidation(): validation must be a function. Received: ".concat(this.validation));
    }

    return this.validation;
  }

}

exports.RequiredValue = RequiredValue;