"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TransactionPropertiesValidationError = exports.NoEngineError = void 0;

var _utils = require("./utils");

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
// https://stackoverflow.com/questions/35502432/passing-object-to-nodes-error-class-returns-an-unaccessible-object
// const e = new Error('lol')
// e.error =
// e.message = {text: 'lol', data: ['one', 'two']}
// log(e.message.data[0])
// log(e)
class TransactionPropertiesValidationError extends Error {
  constructor(result) {
    for (var _len = arguments.length, props = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      props[_key - 1] = arguments[_key];
    }

    super(...props);
    this.result = result || {};
  }

}

exports.TransactionPropertiesValidationError = TransactionPropertiesValidationError;

class NoEngineError extends Error {
  constructor(result) {
    for (var _len2 = arguments.length, props = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      props[_key2 - 1] = arguments[_key2];
    }

    super(...props);
    this.result = result || {};
  }

}

exports.NoEngineError = NoEngineError;