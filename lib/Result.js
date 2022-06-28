"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Success = exports.Result = exports.Failure = void 0;
exports.getFirstDataElement = getFirstDataElement;
exports.getResultData = getResultData;
exports.isFailure = isFailure;
exports.isPending = isPending;
exports.isResult = isResult;
exports.isSuccess = isSuccess;

var _lodash = _interopRequireDefault(require("lodash"));

var _utils = require("./utils");

/**
 * A `patlet` - brief description of `Result` **proto-pattern**.
 * Attempt at implementing a **Behavioral Design Pattern**
 *
 * I use it for internal API. Each class method or standalone function receives
 * some arguments to perform some work on them. This work may succeed or fail.
 * Thus I find it more convenient and data-rich to return Success or Failure with
 * additional information.
 *
 * To clarify, where Arrays of arguments are supplied, a Result[] is returned.
 */
class Result {
  constructor() {
    var obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    this.success = obj.success !== undefined ? obj.success : undefined;
    this.reason = obj.reason
    /*  || "" */
    ; // Comment why returning Failure.

    this.parameters = obj.parameters
    /*  || {} */
    ; // Parameters that were supplied to the function,
    // that returns this Result.

    this.data = obj.data
    /*  || undefined */
    ; // Any data being returned by the function.

    this.query = obj.query
    /*  || "" */
    ; // Optional: which Cypher query was executed.

    this.summary = obj.summary
    /*  || {} */
    ; // Neo4j driver's summary aka resultFromDriver:

    this.meta = obj.meta; // { records: Object[], summary: Object }
  }

  getReason() {
    return this.reason;
  }

  getParameters() {
    return this.parameters;
  }
  /**
   * Retrieve data.
   * Optionally, retrieve only first element.
   * @param {*} param0
   */


  getData() {
    var obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      singleDatum: false,
      flatten: false
    };

    if (obj.singleDatum) {
      return Array.isArray(this.data) ? this.data[0] : this.data;
    }

    if (obj.flatten) {
      return _lodash.default.flatten(this.data);
    }

    return this.data;
  }
  /**
   * @deprecated
   * Simple version to get first element of Result.data
   */


  getSingleDatum() {
    return Array.isArray(this.data) ? this.data[0] : this.data;
  }

  getFirstDatum() {
    return Array.isArray(this.data) ? this.data[0] : this.data;
  }

  get firstDataElement() {
    return Array.isArray(this.data) ? this.data[0] : this.data;
  }

  getSummary() {
    return this.summary;
  }

  valueOf() {
    return this.success;
  }

  set(name) {
    var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    this[name] = data;
    return;
  }
  /**
   * @refactor - as I moved away from this.data: any[] to this.data: any
   *
   * Will use to quickly access Nodes|EnhancedNodes|Relationships.
   * Peels off Level1 & Level2 Results
   */


  extract() {
    var obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      flatten: true,
      keepFailures: true
    };
    var {
      flatten,
      keepFailures
    } = obj;
    if (this.success === false) return [];
    if (!this.data.length) return [];
    if (!(this.data[0] instanceof Result)) return flatten ? _lodash.default.flatten(this.data) : this.data;
    var result = this.data.map(result => result.getData());
    return flatten ? _lodash.default.flatten(result) : result;
  }
  /**
   * Used in testing, to randomly extract data points.
   * @param {*} param0
   */


  extractRandom() {
    var obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      flatten: true
    };
    var {
      flatten
    } = obj;
    var results = this.extract({
      flatten
    });
    if (!results.length) return null;
    var random = Math.floor((0, _utils.getRandomArbitrary)(0, results.length)); // log(random)

    return results[random];
  }

}

exports.Result = Result;

class Success extends Result {
  constructor() {
    var obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    super({
      success: true,
      reason: obj.reason,
      parameters: obj.parameters,
      data: obj.data,
      query: obj.query,
      summary: obj.summary
    });
  }

}

exports.Success = Success;

class Failure extends Result {
  constructor() {
    var obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    super({
      success: false,
      reason: obj.reason,
      parameters: obj.parameters,
      data: obj.data,
      query: obj.query,
      summary: obj.summary
    });
    this.missing_props = undefined;
  }

  getMissingProperties() {
    /**
     * If TransactionPropertiesValidationError is thrown, missing_props will be returned in
     * Error.result.missing_props
     */
    if (Array.isArray(this.data) && this.data.length > 0 && this.data[0].result && this.data[0].result instanceof Failure && this.data[0].result.getMissingProperties() instanceof Array) {
      return this.data[0].result.getMissingProperties();
    }

    return this.missing_props ? this.missing_props : new Failure({
      reason: "No missing properties were attached.",
      parameters: this.parameters,
      data: this.data
    });
  }

}

exports.Failure = Failure;

function isResult(val) {
  return val instanceof Result;
}

function isPending(val) {
  return val instanceof Result && !(val instanceof Success) && !(val instanceof Failure);
}

function isSuccess(val) {
  return val instanceof Success;
}

function isFailure(val) {
  return val instanceof Failure;
}

function getResultData(result) {
  if (!isResult(result)) {
    throw new Error("getResultData: result is not a Result.\nresult: ".concat(JSON.stringify(result)));
  }

  return result.getData();
}

function getFirstDataElement(result) {
  if (!isResult(result)) {
    throw new Error("getFirstDataElement: result is not a Result.\nresult: ".concat(JSON.stringify(result)));
  }

  return result.firstDataElement;
}