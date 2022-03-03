/* @flow */
import _ from "lodash";
import { getRandomArbitrary } from "./utils";

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
  $key: string;
  $value: any;
  success: boolean | typeof undefined;
  reason: string | typeof undefined;
  parameters: Object | typeof undefined;
  data: any;
  query: string | typeof undefined;
  summary: Object | typeof undefined;
  meta: Object | typeof undefined;
  constructor(
    obj: {
      success?: boolean,
      reason?: string,
      parameters?: Object,
      data?: any,
      query?: string,
      summary?: Object,
      meta?: Object,
    } = {}
  ) {
    this.success = obj.success !== undefined ? obj.success : undefined;
    this.reason = obj.reason /*  || "" */; // Comment why returning Failure.
    this.parameters = obj.parameters /*  || {} */; // Parameters that were supplied to the function,
    // that returns this Result.
    this.data = obj.data /*  || undefined */; // Any data being returned by the function.
    this.query = obj.query /*  || "" */; // Optional: which Cypher query was executed.
    this.summary = obj.summary /*  || {} */; // Neo4j driver's summary aka resultFromDriver:
    this.meta = obj.meta;
    // { records: Object[], summary: Object }
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
  getData(
    obj: { singleDatum?: boolean, flatten?: boolean } = {
      singleDatum: false,
      flatten: false,
    }
  ) {
    if (obj.singleDatum) {
      return Array.isArray(this.data) ? this.data[0] : this.data;
    }
    if (obj.flatten) {
      return _.flatten(this.data);
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
  set(name: string, data: any = null): void {
    this[name] = data;
    return;
  }
  /**
   * @refactor - as I moved away from this.data: any[] to this.data: any
   *
   * Will use to quickly access Nodes|EnhancedNodes|Relationships.
   * Peels off Level1 & Level2 Results
   */
  extract(
    obj: {
      flatten?: boolean,
      keepFailures?: boolean,
    } = {
      flatten: true,
      keepFailures: true,
    }
  ): any[] {
    const { flatten, keepFailures } = obj;
    if (this.success === false) return [];
    if (!this.data.length) return [];
    if (!(this.data[0] instanceof Result))
      return flatten ? _.flatten(this.data) : this.data;
    const result = this.data.map((result) => result.getData());
    return flatten ? _.flatten(result) : result;
  }

  /**
   * Used in testing, to randomly extract data points.
   * @param {*} param0
   */
  extractRandom(obj: { flatten?: boolean } = { flatten: true }): Object | null {
    const { flatten } = obj;
    const results = this.extract({ flatten });
    if (!results.length) return null;
    const random = Math.floor(getRandomArbitrary(0, results.length));
    // log(random)
    return results[random];
  }
}

class Success extends Result {
  constructor(
    obj: {
      reason?: string,
      parameters?: Object,
      data?: any,
      query?: string,
      summary?: Object,
    } = {}
  ) {
    super({
      success: true,
      reason: obj.reason,
      parameters: obj.parameters,
      data: obj.data,
      query: obj.query,
      summary: obj.summary,
    });
  }
}

class Failure extends Result {
  missing_props: any | typeof undefined;
  constructor(
    obj: {
      reason?: string,
      parameters?: Object,
      data?: any,
      query?: string,
      summary?: Object,
    } = {}
  ): Function {
    super({
      success: false,
      reason: obj.reason,
      parameters: obj.parameters,
      data: obj.data,
      query: obj.query,
      summary: obj.summary,
    });
    this.missing_props = undefined;
  }
  getMissingProperties() {
    /**
     * If TransactionPropertiesValidationError is thrown, missing_props will be returned in
     * Error.result.missing_props
     */
    if (
      Array.isArray(this.data) &&
      this.data.length > 0 &&
      this.data[0].result &&
      this.data[0].result instanceof Failure &&
      this.data[0].result.getMissingProperties() instanceof Array
    ) {
      return this.data[0].result.getMissingProperties();
    }
    return this.missing_props
      ? this.missing_props
      : new Failure({
          reason: "No missing properties were attached.",
          parameters: this.parameters,
          data: this.data,
        });
  }
}

function isResult(val: any): boolean {
  return val instanceof Result;
}

function isPending(val: any): boolean {
  return (
    val instanceof Result &&
    !(val instanceof Success) &&
    !(val instanceof Failure)
  );
}

function isSuccess(val: any): boolean {
  return val instanceof Success;
}

function isFailure(val: any): boolean {
  return val instanceof Failure;
}

function getResultData(result: Result): any {
  if (!isResult(result)) {
    throw new Error(
      `getResultData: result is not a Result.\nresult: ${JSON.stringify(
        result
      )}`
    );
  }
  return result.getData();
}

function getFirstDataElement(result: Result): any {
  if (!isResult(result)) {
    throw new Error(
      `getFirstDataElement: result is not a Result.\nresult: ${JSON.stringify(
        result
      )}`
    );
  }
  return result.firstDataElement;
}

export {
  Result,
  Success,
  Failure,
  isResult,
  isPending,
  isSuccess,
  isFailure,
  getResultData,
  getFirstDataElement,
};
