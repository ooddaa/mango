/* @flow */
import { int, isInt, toNumber, inSafeRange } from ".";
import { Node } from "./Builder/templates/Node";
import { IdArray } from "./IdArray";
import { Success, Failure } from "./Result";
import { TransactionPropertiesValidationError } from "./Errors";

import without from "lodash/without";
import has from "lodash/has";
import range from "lodash/range";
import keys from "lodash/keys";
import pick from "lodash/pick";
import uniq from "lodash/uniq";
import isNull from "lodash/isNull";
import _isString from "lodash/isString";
import _isNumber from "lodash/isNumber";
import _isObject from "lodash/isObject";
import isArray from "lodash/isArray";

import fs from "fs";
import path from "path";
import util from "util";

import type { timeArray } from "./types";

const log = (...items: any) =>
  items.forEach((item) =>
    console.log(util.inspect(item, { depth: null, colors: true }))
  );

function superlog(
  dir: string,
  obj: { showDirectory?: boolean /* , showArguments = true */ } = {
    showDirectory: true,
  }
) {
  /* Prints directory name, useful when multiple files log to console more/less same data. */
  const directory = obj.showDirectory ? dir + "\n\n" : "\n";

  /* Prints name of the argument passed, useful to see which namespaces being logged. */
  function getArgs(func) {
    // First match everything inside the function argument parens.
    var args = func.toString().match(/function\s.*?\(([^)]*)\)/)[1];

    // Split the arguments string into an array comma delimited.
    return args
      .split(",")
      .map(function(arg) {
        // Ensure no inline comments are parsed and trim the whitespace.
        return arg.replace(/\/\*.*\*\//, "").trim();
      })
      .filter(function(arg) {
        // Ensure no undefined values are added.
        return arg;
      });
  }
  return function(
    d: Object,
    obj: { terminal: boolean, file: boolean, _stats: boolean } = {
      terminal: true,
      file: false,
      _stats: false,
    },
    name: string = `debug_${new Date().valueOf()}.log`
  ) {
    const { terminal, file, _stats } = obj;
    /* define filename */
    const filename = path.join(
      dir,
      "logs",
      `${name}_${new Date().valueOf()}.log`
    );
    if (file) {
      if (_stats) {
        d = {
          ...d.summary.counters._stats,
          resultConsumedAfter: d.summary.resultConsumedAfter,
          resultAvailableAfter: d.summary.resultAvailableAfter,
        };
      }

      /* ensure ./logs exists */
      fs.mkdir(path.join(dir, "logs"), { recursive: true }, (err) => {
        if (err) throw err;
      });
      var log_file = fs.createWriteStream(filename, { flags: "w" });
      log_file.write(util.formatWithOptions({ depth: null }, "", d) + "\n");
    }
    if (terminal) {
      // if (showArguments)
      // const args = showArguments ? getArgs(logger).join(', ') : ''
      console.log(
        `${directory} ${util.inspect(d, { depth: null, colors: true })}\n\n`
      );
    }
  };
}

const reduceAsync = async (array: Array<any>, asyncFn: Function): any => {
  let final;
  try {
    final = await array.reduce((acc, value) => {
      return acc.then((iter) =>
        asyncFn(value).then((result) => [...iter, result])
      );
    }, Promise.resolve([]));
  } catch (error) {
    console.log("reduceAsync(): ", error);
    return final;
  }
  return final;
};

const validateProperties = (
  properties_to_check: Object,
  required_properties: Object
): boolean | Object => {
  // TODO: validate properties_to_check' types.

  if (properties_to_check == null || typeof properties_to_check !== "object")
    throw new Error(
      `validateProperties(): you need to pass object with properties_to_check.`
    );
  if (required_properties == null || typeof required_properties !== "object")
    throw new Error(
      `validateProperties(): you need to pass object with required_properties.`
    );

  const required = Object.keys(required_properties);
  const supplied = Object.keys(properties_to_check);
  const missing = without(required, ...supplied);

  if (missing.length) {
    let message = `validateProperties(): Required properties are missing: see result.missing_props.`;
    const e = new TransactionPropertiesValidationError();
    e.message = message;
    e.result = new Failure({
      reason: `Required properties are missing: see missing_props.`,
      parameters: properties_to_check,
    });
    e.result.set("missing_props", missing); // attach missing properties
    throw e;
  }
  return true;
};

const parameters_to_string_array = (parameters: Object): string[] => {
  const stringifyProperties = (properties: Object): string[] => {
    if (!properties) return [""];
    const array = Object.entries(properties);
    const stringifyPerType = (val: any): string => {
      if (typeof val === "string") return `'${String(val)}'`;
      if (typeof val === "number") return `${String(val)}`;
      if (typeof val === "boolean") return !!val ? "true" : "false";
      if (val instanceof Array) {
        const result = val.reduce((acc, elm) => {
          acc += `${elm}, `;
          return acc;
        }, "");
        return `[${result.substr(0, result.length - 2)}]`;
      }
      return "";
    };
    const result = array.map((pair) => {
      let [key, value] = pair;
      return `t.${key} = ${stringifyPerType(value)}`;
    });
    return result;
  };
  return stringifyProperties(parameters);
};

const once = (fn: Function): Function => {
  let called = false;
  return (...args: any) => {
    if (called) return;
    called = true;
    return fn(...args);
  };
};

/**
 * Used by Account template validations.
 * @param {string[]} val
 */
const isIdentificationArray = (val: string[]): Result => {
  // ['Jon Doe', 'ID', '_hash'] == [nickname, ID, _hash]
  if (!val)
    return new Failure({
      reason: `No truthy value.`,
      parameters: { val },
    });
  if (!(val instanceof Array))
    return new Failure({
      reason: `Value must be an Array.`,
      parameters: { val },
    });
  if (!val.length)
    return new Failure({
      reason: `Value must not be empty Array.`,
      parameters: { val },
    });
  if (val.length != 3)
    return new Failure({
      reason: `Value must be enum type [full_name, id, _hash]. '' is allowed for missing property (2 max).`,
      parameters: { val },
    });
  if (!val.every((x) => x !== undefined))
    return new Failure({
      reason: `Value must not contain undefined values.`,
      parameters: { val },
    });
  if (!val.every((x) => x !== null))
    return new Failure({
      reason: `Value must not contain null values.`,
      parameters: { val },
    });
  const [full_name, id, _hash] = val;
  // must be at least one of these
  if (!(full_name || id || _hash))
    return new Failure({
      reason: `Value contain at least one of the [full_name, id, _hash].`,
      parameters: { val },
    });
  if (isNaN(id))
    return new Failure({
      reason: `ID must not be NaN.`,
      parameters: { val },
    });
  if (val instanceof IdArray) return new Success();
  return new Success();
};

const isString = (val: any, allowed_values?: string[]): Result => {
  if (!val) {
    return new Failure({
      reason: `No truthy value.`,
      parameters: { val },
    });
  }

  if (val.constructor.name !== "String") {
    return new Failure({
      reason: `Value must be string.`,
      parameters: { val },
    });
  }
  /**
   * allowed_values validations.
   */
  if (
    allowed_values &&
    allowed_values.length &&
    allowed_values.every((val) => typeof val === "string")
  ) {
    if (!allowed_values.includes(val)) {
      return new Failure({
        reason: `Value must be one of the allowed - see data.`,
        parameters: { val },
        data: allowed_values,
      });
    }
  }
  return new Success();
};

const isNumber = (val: any): Result => {
  if (!val) {
    return new Failure({
      reason: `No truthy value.`,
      parameters: { val },
    });
  }

  if (val.constructor.name !== "Number") {
    return new Failure({
      reason: `Value must be number.`,
      parameters: { val },
    });
  }
  return new Success();
};

const isBoolean = (val: any): Result => {
  if (val.constructor.name !== "Boolean") {
    return new Failure({
      reason: `Value must be a Boolean.`,
      parameters: { val },
    });
  }
  return new Success();
};

const isTimeArray = (val: any[]): Result => {
  let [YEAR, MONTH, DAY, weekday, utc] = val;
  DAY = (() => {
    // log(YEAR, MONTH, DAY)
    if (typeof DAY !== "number") return false;
    if ([1, 3, 5, 7, 8, 10, 12].includes(MONTH)) return DAY >= 1 && DAY <= 31;
    if ([4, 6, 9, 11].includes(MONTH)) return DAY >= 1 && DAY <= 30;
    if (MONTH === 2 && range(1980, 2028, 4).includes(YEAR)) {
      const result = DAY >= 1 && DAY <= 29;
      // console.log('isTimeArray: ', [YEAR, MONTH, DAY], result)
      return result;
    }
    return DAY >= 1 && DAY <= 28;
  })();
  YEAR = (() => {
    if (typeof YEAR !== "number") return false;
    return YEAR >= 1950 && YEAR <= 2100;
  })();
  MONTH = (() => {
    if (typeof MONTH !== "number") return false;
    return MONTH >= 1 && MONTH <= 12;
  })();
  weekday = (() => {
    if (typeof weekday !== "number") return false;
    return weekday >= 1 && weekday <= 7;
  })();
  utc = (() => {
    if (typeof utc !== "number") return false;
    return !!utc;
  })();
  const data = [YEAR, MONTH, DAY /* , weekday, utc */];
  if (data.every((elm) => elm === true)) return new Success({ data });
  return new Failure({ data });
};

function getRandomArbitrary(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min) + min);
}

function getRandomFromArray(array: any[]): any {
  return array[getRandomArbitrary(0, array.length - 1)];
}

function isIdentifiedNodeObj(node: any): boolean {
  if (!node) return false;
  if (typeof node !== "object") return false;
  if (has(node, "labels") && has(node, "properties") && has(node, "identity")) {
    if (!(node.labels instanceof Array)) return false;
    if (!node.labels.length) return false;
    if (typeof node.labels[0] !== "string") return false;

    if (!has(node.properties, "_hash")) return false;
    if (typeof node.properties["_hash"] !== "string") return false;

    if (isNaN(node.identity.low)) return false;
    if (isNaN(node.identity.high)) return false;
    return true;
  }
  return false;
}

function isRelationshipObject(rel: any): boolean {
  if (!rel) return false;
  if (typeof rel !== "object") return false;
  if (has(rel, "labels") && has(rel, "properties")) {
    /* labels */
    if (!(rel.labels instanceof Array)) return false;
    if (!rel.labels.length) return false;
    if (typeof rel.labels[0] !== "string") return false;

    /* startNode */
    if (!has(rel, "startNode") || !(rel.startNode instanceof Node))
      return false;

    /* endNode */
    if (!has(rel, "endNode") || !(rel.endNode instanceof Node)) return false;

    return true;
  }
  return false;
}

function convert_nodeObj_to_Node(nodeObj) {
  const obj = {
    labels: nodeObj.labels,
    properties: {},
  };
  keys(nodeObj).forEach((key) => {
    obj.properties[key] = nodeObj[key];
  });
  return obj;
}

function convert_Node_to_nodeObj(node) {
  // log('convert_Node_to_nodeObj node is')
  // log(node)
  const obj = {
    labels: node.labels,
    properties: {
      required: {},
      optional: {},
      _private: {},
    },
    identity: node.identity || null,
  };
  const result = keys(node.properties).reduce((acc, key) => {
    if (key[0] === "_") {
      acc.properties._private[key] = node.properties[key];
      return acc;
    } else if (key[0] === key[0].toUpperCase()) {
      acc.properties.required[key] = node.properties[key];
      return acc;
    } else {
      acc.properties.optional[key] = node.properties[key];
      return acc;
    }
    return "convert_Node_to_nodeObj: Error: something wroong!";
  }, obj);
  return result;
}

function isLeapYear(year: number): boolean {
  return range(1980, 2080, 4).includes(year);
}

/**
 * Going to use with Home.statistics - will get days per month and
 * budgeted_amount_per_month/days_per_month so make statistics more granualar,
 * as now I only do quarters.
 * @param {*} param0
 */
function daysInMonth({ year, month }): Number {
  const mapping = {
    1: () => 31, // January
    2: (year) => {
      return isLeapYear(year) ? 29 : 28;
    },
    3: () => 31,
    4: () => 30,
    5: () => 31,
    6: () => 30,
    7: () => 31,
    8: () => 31,
    9: () => 30,
    10: () => 31,
    11: () => 30,
    12: () => 31,
  };
  return mapping[month](year);
}

function makeQuarters(years = [2018]): Object {
  const result = years.reduce((acc, year) => {
    acc[year] = {
      q1: {
        from: [Number(year), 1, 1],
        to: [Number(year), 3, 31],
      },
      q2: {
        from: [Number(year), 4, 1],
        to: [Number(year), 6, 30],
      },
      q3: {
        from: [Number(year), 7, 1],
        to: [Number(year), 9, 30],
      },
      q4: {
        from: [Number(year), 10, 1],
        to: [Number(year), 12, 31],
      },
    };
    return acc;
  }, {});
  return result;
}

declare type Neo4jInteger = { low: Number, high: Number };
function neo4jIntegerToNumber1(int: Neo4jInteger | Number): Number {
  if (_isNumber(int)) {
    return int;
  }
  if (_isString(int)) {
    return Number(int);
  }
  if (_isObject(int) && has(int, "low")) {
    return int.low;
  }
  throw new Error(
    `neo4jIntegerToNumber: couldn't transform to Number: ${int}.`
  );
}

/**
 * I will iterate through properties, if I find an Integer, I'll convert it to Number.
 * If not, the original prop will be returned untouched.
 * @param {*} int
 */
function neo4jIntegerToNumber(int: any): any {
  //https://neo4j.com/docs/api/javascript-driver/current/class/src/integer.js~Integer.html
  if (!isInt(int)) {
    // throw new Error(`neo4jIntegerToNumber: int not an Integer.\nint: ${JSON.stringify(int)}.`);
    return int;
  }
  if (!inSafeRange(int)) {
    throw new Error(
      `neo4jIntegerToNumber: int not in safe range.\nint: ${JSON.stringify(
        int
      )}.`
    );
  }
  return toNumber(int);
}

function dateArrayToString(arr) {
  /* [2018, 1] => '2018-1' */
  return arr.join("-");
}

function dateArrayStringToArray(str) {
  /* '2018-1' => [2018, 1] */
  return str.split("-").map(Number);
}

function produceMonthsFromDates(from, to) {
  // from/to == '2019-05-31T23:00:00.000Z'
  /* check from is earlier than to */
  const dateFrom = new Date(from),
    dateTo = new Date(to);
  if (dateFrom.valueOf() >= dateTo.valueOf()) {
    throw new Error(
      `produceMonthsFromDates: dateFrom (${dateFrom}) must be earlier that dateTo (${dateTo})`
    );
  }

  /* 
    I generate dates between start and stop, then turn each into
    'YYYY-MM' string, filter uniques and turn them back to [YYYY, MM]
  */

  return uniq(
    getDates(dateFrom, dateTo).map(function turnDatesIntoDateArrayStrings(
      date
    ) {
      return dateArrayToString([date.getFullYear(), date.getMonth() + 1]);
    })
  ).map(dateArrayStringToArray);

  /************************/
  function addDays(date, days) {
    var newDate = new Date(date.valueOf());
    newDate.setDate(newDate.getDate() + days);
    return newDate;
  }

  function getDates(startDate, stopDate) {
    var dateArray = [],
      currentDate = startDate;
    while (currentDate <= stopDate) {
      dateArray.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }
    return dateArray;
  }
}

/**
 * @expects string from HTML5 date form.
 * '2019-06-20Tblablbalba'
 * @param {*} str
 */
function dateStringToDateArray(str) {
  const date = new Date(str);
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()];
}

/**
 * Made this to unify date conversion from front end (ctrl) -> back end (router).
 * @expects _from: '2018-01-01' _to: '2018-12-31'
 * @example
 *  adjustFrontEndDates('2018-01-01', '2018-12-31') // {from: [2018, 1, 1], to: [2018, 12, 31]}
 * @param {*} _from
 * @param {*} _to
 */
function adjustFrontEndDates(_from: String, _to: String): Result {
  const from = dateStringToDateArray(_from),
    to = dateStringToDateArray(_to);
  /* to check dates I need to do 'reduce_to_truth' filter by supplied fn, take length */
  if (!isTimeArray(from) || !isTimeArray(to)) {
    return new Failure({
      reason: `adjustFrontEndDates: dates are not good: from ${from}, to: ${to}.`,
      parameters: {
        from,
        to,
      },
    });
  }
  return new Success({ data: [{ from, to }] });
}

function isOdd(number) {
  return number % 2 !== 0;
}

function printMessage(text: String[]): String {
  /**
   * Receives lines of text ['abc', 'def']
   * Returns nicely framed message
   * total width = 45
   * usable width = 45 - 4(borders) = 41 - 4(extra padding) = 37
   * which makes the 23(21) the centre
   *
   *
   *                       |
   * =============================================
   * ||                                         ||
   * ||                   abc                   ||
   * ||                   defg                  ||
   * ||                                         ||
   * =============================================
   */
  /**
   * 0. def constants
   * 1. calculate line length
   *  1.1 if it <= 37, create full_line
   *  1.2 if it > 37, split at " " before 38 index // what if there are no " " ?
   */
  const TOP_BORDER = "=".repeat(45),
    SIDE_BORDER = "||",
    TOTAL_WIDTH = TOP_BORDER.length,
    SIDE_BORDERS = SIDE_BORDER.length * 2,
    EXTRA_PADDING = " ".repeat(2), // each side
    TOTAL_USABLE_WIDTH = TOTAL_WIDTH - SIDE_BORDERS - EXTRA_PADDING.length * 2; // 37
  //  CENTRE = /* isOdd(TOTAL_WIDTH) ?  */Math.round(TOTAL_WIDTH/2)

  return [
    generateTop(),
    generateEmptyLine(),
    ...text.map(generateFullLine),
    generateEmptyLine(),
    generateTop(),
  ].join("");

  /********************************/
  function generateTop() {
    return `${TOP_BORDER}\n`;
  }
  function generateEmptyLine() {
    return `${SIDE_BORDER}${" ".repeat(41)}${SIDE_BORDER}\n`;
  }
  function generateFullLine(line) {
    const ll = line.length,
      total_padding = TOTAL_USABLE_WIDTH - ll;
    let left_padding, righ_padding;

    if (ll > 37) {
      throw new Error(
        `padding.generateFullLine: line is longer than 37 symbols.`
      );
    }

    if (isOdd(ll)) {
      /* Line is odd length good, we can nicely arrange it around CENTRE, both paddings are even */
      if (isOdd(total_padding)) {
        left_padding = " ".repeat(Math.floor(total_padding / 2)); // will make left shorter
        righ_padding = " ".repeat(Math.ceil(total_padding / 2));
      } else {
        left_padding = " ".repeat(total_padding / 2);
        righ_padding = " ".repeat(total_padding / 2);
      }
    } else {
      /* Line is even length, leave right padding larger */
      left_padding = " ".repeat(Math.floor(total_padding / 2));
      righ_padding = " ".repeat(Math.ceil(total_padding / 2));
    }
    return `${SIDE_BORDER}${EXTRA_PADDING}${left_padding}${line}${righ_padding}${EXTRA_PADDING}${SIDE_BORDER}\n`;
  }
}

/**
 * @example
 *  getMonthNumber({ month: 'January', asString: true }) // '01'
 * @param {*} month
 * @param {*} asString
 */
function getMonthNumber({ month = "", asString = true } = {}): String | Number {
  if (!month.length) {
    return new Failure({
      reason: "getMonthNumber: no month supplied.",
    });
  }
  const mapping = {
    January: "01",
    February: "02",
    March: "03",
    April: "04",
    May: "05",
    June: "06",
    July: "07",
    August: "08",
    September: "09",
    October: "10",
    November: "11",
    December: "12",
  };
  return asString ? mapping[month] : Number(mapping[month]);
}

function neo4jNumberToNumber(number: object | number | string): number {}

import crypto from "crypto";

function hasher(data: string): string {
  const hash = crypto.createHash("sha256");
  hash.update(data);
  const result = hash.digest("hex");
  return result;
}

function isValidYear(val: number): boolean {
  if (typeof val.YEAR !== "number") {
    return false;
  }
  return val.YEAR >= 1950 && val.YEAR <= 2100;
}

function isValidMonth(val: number): boolean {
  if (typeof val.MONTH !== "number") {
    return false;
  }
  return val.MONTH >= 1 && val.MONTH <= 12;
}

function isValidDay(val: number): boolean {
  if (typeof val.DAY !== "number") {
    return false;
  }
  if ([1, 3, 5, 7, 8, 10, 12].includes(val.MONTH))
    return val.DAY >= 1 && val.DAY <= 31;
  if ([4, 6, 9, 11].includes(val.MONTH)) return val.DAY >= 1 && val.DAY <= 30;
  if (val.MONTH === 2 && _.range(2028, 1980, -4).includes(val.YEAR))
    return val.DAY >= 1 && val.DAY <= 29;
  return val.DAY >= 1 && val.DAY <= 28;
}

function setDateCreated(param: string = "array"): timeArray | Object {
  const r = new Date();
  if (param === "array")
    return [
      r.getFullYear(),
      r.getMonth() + 1,
      r.getDate(),
      r.getDay(),
      r.valueOf(),
    ];
  return {
    year: r.getFullYear(),
    month: r.getMonth() + 1,
    day: r.getDate(),
    weekday: r.getDay(),
    utc: r.valueOf(),
  };
}

function generateTimeArray(): timeArray {
  const r = new Date();
  return [
    r.getFullYear(),
    r.getMonth() + 1,
    r.getDate(),
    r.getDay(),
    r.valueOf(),
  ];
}

function isNeo4jId(val: any): boolean {
  // declare type Neo4jId = { low: number, high: number }
  return (
    _isObject(val) &&
    has(val, "low") &&
    _isNumber(val.low) &&
    has(val, "high") &&
    _isNumber(val.high)
  );
}

function isTrue(val: any): boolean {
  return Boolean(val) === true;
}

function isFalse(val: any): boolean {
  return Boolean(val) === false;
}

function sumUpArray(acc: number = 0, n: number): number {
  return (acc += n);
}

function get(method: string) {
  return (obj: Object) => {
    return obj[method]();
  };
}

function abs(val: number): number {
  if (!isNumber(val)) {
    throw new Error(`abs: val is NaN.\nval: ${JSON.stringify(val)}`);
  } else {
    return val < 0 ? -1 * val : val;
  }
}

function isMissing(val: any): boolean {
  return isNull(val) || val == undefined;
}

function isPresent(val: any): boolean {
  return !isNull(val) && val !== undefined;
}

function not(val: boolean): boolean {
  return !val;
}

function isUpperCased(word) {
  return word.split().every((letter) => letter === letter.toUpperCase());
}

function hasLeadingDash(word) {
  return word[0] === "_";
}

/**
 * Picks only UPPER_CASED/UPPERCASED keys as required props
 * @param {Object} properties
 * @returns {Object}
 */
function getRequiredProperties(props /* : Object */) /* : Object */ {
  let properties = props || this.properties;
  const REQUIRED = keys(properties).filter(
    (word) => not(hasLeadingDash(word)) && isUpperCased(word)
  );
  return pick(properties, REQUIRED);
}

/**
 * Picks only upperCased/upperCASED/UPPER_CASEd/uPPERCASED keys as optional props
 * @param {Object} properties
 * @returns {Object}
 */
function getOptionalProperties(props /* : Object */) /* : Object */ {
  let properties = props || this.properties;
  const optional = keys(properties).filter(
    (word) => not(hasLeadingDash(word)) && not(isUpperCased(word))
  );
  return pick(properties, optional);
}

/**
 * Picks only _upperCased/__UPPERCASED/_UpPeR_CaSeD keys as private props
 * @param {Object} properties
 * @returns {Object}
 */
function getPrivateProperties(props /* : Object */) /* : Object */ {
  let properties = props || this.properties;
  const _private = keys(properties).filter(hasLeadingDash);
  return pick(properties, _private);
}

function generateTimeArrays(years: number[]): Array<any> {
  /* account for leap years */
  const timeArrays = [];
  const days_in_month = (year, month) => {
    if (month === 2) {
      return isLeapYear(year) ? 29 : 28;
    }
    if ([1, 3, 5, 7, 8, 10, 12].includes(month)) {
      return 31;
    }
    return 30;
  };
  years.forEach((year) => {
    for (let month = 1; month < 13; month++) {
      for (let day = 1; day <= days_in_month(year, month); day++) {
        timeArrays.push([
          year,
          month,
          day,
          new Date(year, month - 1, day).getDay() + 1,
          123,
        ]);
      }
    }
  });
  return timeArrays;
}

function unwrapIfInArray(val: any[]): any {
  return isArray(val) ? val[0] : val;
}

export {
  log,
  superlog,
  reduceAsync,
  validateProperties,
  parameters_to_string_array,
  once,
  isIdentificationArray,
  isString,
  isNumber,
  isBoolean,
  isTimeArray,
  getRandomArbitrary,
  getRandomFromArray,
  isIdentifiedNodeObj,
  isRelationshipObject,
  convert_nodeObj_to_Node,
  convert_Node_to_nodeObj,
  isLeapYear,
  daysInMonth,
  makeQuarters,
  neo4jIntegerToNumber,
  dateArrayToString,
  dateArrayStringToArray,
  produceMonthsFromDates,
  dateStringToDateArray,
  adjustFrontEndDates,
  printMessage,
  getMonthNumber,
  hasher,
  isValidYear,
  isValidMonth,
  isValidDay,
  setDateCreated,
  generateTimeArray,
  isNeo4jId,
  isTrue,
  isFalse,
  sumUpArray,
  get,
  abs,
  isMissing,
  isPresent,
  not,
  getRequiredProperties,
  getOptionalProperties,
  getPrivateProperties,
  generateTimeArrays,
  unwrapIfInArray,
};
