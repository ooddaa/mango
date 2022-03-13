"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.abs = abs;
exports.adjustFrontEndDates = adjustFrontEndDates;
exports.convert_Node_to_nodeObj = convert_Node_to_nodeObj;
exports.convert_nodeObj_to_Node = convert_nodeObj_to_Node;
exports.dateArrayStringToArray = dateArrayStringToArray;
exports.dateArrayToString = dateArrayToString;
exports.dateStringToDateArray = dateStringToDateArray;
exports.daysInMonth = daysInMonth;
exports.generateTimeArray = generateTimeArray;
exports.generateTimeArrays = generateTimeArrays;
exports.get = get;
exports.getMonthNumber = getMonthNumber;
exports.getOptionalProperties = getOptionalProperties;
exports.getPrivateProperties = getPrivateProperties;
exports.getRandomArbitrary = getRandomArbitrary;
exports.getRandomFromArray = getRandomFromArray;
exports.getRequiredProperties = getRequiredProperties;
exports.hasher = hasher;
exports.isBoolean = void 0;
exports.isFalse = isFalse;
exports.isIdentificationArray = void 0;
exports.isIdentifiedNodeObj = isIdentifiedNodeObj;
exports.isLeapYear = isLeapYear;
exports.isMissing = isMissing;
exports.isNeo4jId = isNeo4jId;
exports.isNumber = void 0;
exports.isPresent = isPresent;
exports.isRelationshipObject = isRelationshipObject;
exports.isTimeArray = exports.isString = void 0;
exports.isTrue = isTrue;
exports.isValidDay = isValidDay;
exports.isValidMonth = isValidMonth;
exports.isValidYear = isValidYear;
exports.log = void 0;
exports.makeQuarters = makeQuarters;
exports.neo4jIntegerToNumber = neo4jIntegerToNumber;
exports.not = not;
exports.parameters_to_string_array = exports.once = void 0;
exports.printMessage = printMessage;
exports.produceMonthsFromDates = produceMonthsFromDates;
exports.reduceAsync = void 0;
exports.setDateCreated = setDateCreated;
exports.stringify = stringify;
exports.sumUpArray = sumUpArray;
exports.superlog = superlog;
exports.unwrapIfInArray = unwrapIfInArray;
exports.validateProperties = void 0;

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _2 = require(".");

var _Node = require("./Builder/templates/Node");

var _IdArray = require("./IdArray");

var _Result = require("./Result");

var _Errors = require("./Errors");

var _without = _interopRequireDefault(require("lodash/without"));

var _has = _interopRequireDefault(require("lodash/has"));

var _range = _interopRequireDefault(require("lodash/range"));

var _keys = _interopRequireDefault(require("lodash/keys"));

var _pick = _interopRequireDefault(require("lodash/pick"));

var _uniq = _interopRequireDefault(require("lodash/uniq"));

var _isNull = _interopRequireDefault(require("lodash/isNull"));

var _isString2 = _interopRequireDefault(require("lodash/isString"));

var _isNumber2 = _interopRequireDefault(require("lodash/isNumber"));

var _isObject2 = _interopRequireDefault(require("lodash/isObject"));

var _isArray = _interopRequireDefault(require("lodash/isArray"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _util = _interopRequireDefault(require("util"));

var _crypto = _interopRequireDefault(require("crypto"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

var log = function log() {
  for (var _len = arguments.length, items = new Array(_len), _key = 0; _key < _len; _key++) {
    items[_key] = arguments[_key];
  }

  return items.forEach(item => console.log(_util.default.inspect(item, {
    depth: null,
    colors: true
  })));
};

exports.log = log;

function superlog(dir) {
  var obj = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    showDirectory: true
  };

  /* Prints directory name, useful when multiple files log to console more/less same data. */
  var directory = obj.showDirectory ? dir + "\n\n" : "\n";
  /* Prints name of the argument passed, useful to see which namespaces being logged. */

  function getArgs(func) {
    // First match everything inside the function argument parens.
    var args = func.toString().match(/function\s.*?\(([^)]*)\)/)[1]; // Split the arguments string into an array comma delimited.

    return args.split(",").map(function (arg) {
      // Ensure no inline comments are parsed and trim the whitespace.
      return arg.replace(/\/\*.*\*\//, "").trim();
    }).filter(function (arg) {
      // Ensure no undefined values are added.
      return arg;
    });
  }

  return function (d) {
    var obj = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
      terminal: true,
      file: false,
      _stats: false
    };
    var name = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "debug_".concat(new Date().valueOf(), ".log");
    var {
      terminal,
      file,
      _stats
    } = obj;
    /* define filename */

    var filename = _path.default.join(dir, "logs", "".concat(name, "_").concat(new Date().valueOf(), ".log"));

    if (file) {
      if (_stats) {
        d = _objectSpread(_objectSpread({}, d.summary.counters._stats), {}, {
          resultConsumedAfter: d.summary.resultConsumedAfter,
          resultAvailableAfter: d.summary.resultAvailableAfter
        });
      }
      /* ensure ./logs exists */


      _fs.default.mkdir(_path.default.join(dir, "logs"), {
        recursive: true
      }, err => {
        if (err) throw err;
      });

      var log_file = _fs.default.createWriteStream(filename, {
        flags: "w"
      });

      log_file.write(_util.default.formatWithOptions({
        depth: null
      }, "", d) + "\n");
    }

    if (terminal) {
      // if (showArguments)
      // const args = showArguments ? getArgs(logger).join(', ') : ''
      console.log("".concat(directory, " ").concat(_util.default.inspect(d, {
        depth: null,
        colors: true
      }), "\n\n"));
    }
  };
}

var reduceAsync = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2.default)(function* (array, asyncFn) {
    var final;

    try {
      final = yield array.reduce((acc, value) => {
        return acc.then(iter => asyncFn(value).then(result => [...iter, result]));
      }, Promise.resolve([]));
    } catch (error) {
      console.log("reduceAsync(): ", error);
      return final;
    }

    return final;
  });

  return function reduceAsync(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

exports.reduceAsync = reduceAsync;

var validateProperties = (properties_to_check, required_properties) => {
  // TODO: validate properties_to_check' types.
  if (properties_to_check == null || typeof properties_to_check !== "object") throw new Error("validateProperties(): you need to pass object with properties_to_check.");
  if (required_properties == null || typeof required_properties !== "object") throw new Error("validateProperties(): you need to pass object with required_properties.");
  var required = Object.keys(required_properties);
  var supplied = Object.keys(properties_to_check);
  var missing = (0, _without.default)(required, ...supplied);

  if (missing.length) {
    var message = "validateProperties(): Required properties are missing: see result.missing_props.";
    var e = new _Errors.TransactionPropertiesValidationError();
    e.message = message;
    e.result = new _Result.Failure({
      reason: "Required properties are missing: see missing_props.",
      parameters: properties_to_check
    });
    e.result.set("missing_props", missing); // attach missing properties

    throw e;
  }

  return true;
};

exports.validateProperties = validateProperties;

var parameters_to_string_array = parameters => {
  var stringifyProperties = properties => {
    if (!properties) return [""];
    var array = Object.entries(properties);

    var stringifyPerType = val => {
      if (typeof val === "string") return "'".concat(String(val), "'");
      if (typeof val === "number") return "".concat(String(val));
      if (typeof val === "boolean") return !!val ? "true" : "false";

      if (val instanceof Array) {
        var _result = val.reduce((acc, elm) => {
          acc += "".concat(elm, ", ");
          return acc;
        }, "");

        return "[".concat(_result.substr(0, _result.length - 2), "]");
      }

      return "";
    };

    var result = array.map(pair => {
      var [key, value] = pair;
      return "t.".concat(key, " = ").concat(stringifyPerType(value));
    });
    return result;
  };

  return stringifyProperties(parameters);
};

exports.parameters_to_string_array = parameters_to_string_array;

var once = fn => {
  var called = false;
  return function () {
    if (called) return;
    called = true;
    return fn(...arguments);
  };
};
/**
 * Used by Account template validations.
 * @param {string[]} val
 */


exports.once = once;

var isIdentificationArray = val => {
  // ['Jon Doe', 'ID', '_hash'] == [nickname, ID, _hash]
  if (!val) return new _Result.Failure({
    reason: "No truthy value.",
    parameters: {
      val
    }
  });
  if (!(val instanceof Array)) return new _Result.Failure({
    reason: "Value must be an Array.",
    parameters: {
      val
    }
  });
  if (!val.length) return new _Result.Failure({
    reason: "Value must not be empty Array.",
    parameters: {
      val
    }
  });
  if (val.length != 3) return new _Result.Failure({
    reason: "Value must be enum type [full_name, id, _hash]. '' is allowed for missing property (2 max).",
    parameters: {
      val
    }
  });
  if (!val.every(x => x !== undefined)) return new _Result.Failure({
    reason: "Value must not contain undefined values.",
    parameters: {
      val
    }
  });
  if (!val.every(x => x !== null)) return new _Result.Failure({
    reason: "Value must not contain null values.",
    parameters: {
      val
    }
  });
  var [full_name, id, _hash] = val; // must be at least one of these

  if (!(full_name || id || _hash)) return new _Result.Failure({
    reason: "Value contain at least one of the [full_name, id, _hash].",
    parameters: {
      val
    }
  });
  if (isNaN(id)) return new _Result.Failure({
    reason: "ID must not be NaN.",
    parameters: {
      val
    }
  });
  if (val instanceof _IdArray.IdArray) return new _Result.Success();
  return new _Result.Success();
};

exports.isIdentificationArray = isIdentificationArray;

var isString = (val, allowed_values) => {
  if (!val) {
    return new _Result.Failure({
      reason: "No truthy value.",
      parameters: {
        val
      }
    });
  }

  if (val.constructor.name !== "String") {
    return new _Result.Failure({
      reason: "Value must be string.",
      parameters: {
        val
      }
    });
  }
  /**
   * allowed_values validations.
   */


  if (allowed_values && allowed_values.length && allowed_values.every(val => typeof val === "string")) {
    if (!allowed_values.includes(val)) {
      return new _Result.Failure({
        reason: "Value must be one of the allowed - see data.",
        parameters: {
          val
        },
        data: allowed_values
      });
    }
  }

  return new _Result.Success();
};

exports.isString = isString;

var isNumber = val => {
  if (!val) {
    return new _Result.Failure({
      reason: "No truthy value.",
      parameters: {
        val
      }
    });
  }

  if (val.constructor.name !== "Number") {
    return new _Result.Failure({
      reason: "Value must be number.",
      parameters: {
        val
      }
    });
  }

  return new _Result.Success();
};

exports.isNumber = isNumber;

var isBoolean = val => {
  if (val.constructor.name !== "Boolean") {
    return new _Result.Failure({
      reason: "Value must be a Boolean.",
      parameters: {
        val
      }
    });
  }

  return new _Result.Success();
};

exports.isBoolean = isBoolean;

var isTimeArray = val => {
  var [YEAR, MONTH, DAY, weekday, utc] = val;

  DAY = (() => {
    // log(YEAR, MONTH, DAY)
    if (typeof DAY !== "number") return false;
    if ([1, 3, 5, 7, 8, 10, 12].includes(MONTH)) return DAY >= 1 && DAY <= 31;
    if ([4, 6, 9, 11].includes(MONTH)) return DAY >= 1 && DAY <= 30;

    if (MONTH === 2 && (0, _range.default)(1980, 2028, 4).includes(YEAR)) {
      var result = DAY >= 1 && DAY <= 29; // console.log('isTimeArray: ', [YEAR, MONTH, DAY], result)

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

  var data = [YEAR, MONTH, DAY
  /* , weekday, utc */
  ];
  if (data.every(elm => elm === true)) return new _Result.Success({
    data
  });
  return new _Result.Failure({
    data
  });
};

exports.isTimeArray = isTimeArray;

function getRandomArbitrary(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

function getRandomFromArray(array) {
  return array[getRandomArbitrary(0, array.length - 1)];
}

function isIdentifiedNodeObj(node) {
  if (!node) return false;
  if (typeof node !== "object") return false;

  if ((0, _has.default)(node, "labels") && (0, _has.default)(node, "properties") && (0, _has.default)(node, "identity")) {
    if (!(node.labels instanceof Array)) return false;
    if (!node.labels.length) return false;
    if (typeof node.labels[0] !== "string") return false;
    if (!(0, _has.default)(node.properties, "_hash")) return false;
    if (typeof node.properties["_hash"] !== "string") return false;
    if (isNaN(node.identity.low)) return false;
    if (isNaN(node.identity.high)) return false;
    return true;
  }

  return false;
}

function isRelationshipObject(rel) {
  if (!rel) return false;
  if (typeof rel !== "object") return false;

  if ((0, _has.default)(rel, "labels") && (0, _has.default)(rel, "properties")) {
    /* labels */
    if (!(rel.labels instanceof Array)) return false;
    if (!rel.labels.length) return false;
    if (typeof rel.labels[0] !== "string") return false;
    /* startNode */

    if (!(0, _has.default)(rel, "startNode") || !(rel.startNode instanceof _Node.Node)) return false;
    /* endNode */

    if (!(0, _has.default)(rel, "endNode") || !(rel.endNode instanceof _Node.Node)) return false;
    return true;
  }

  return false;
}

function convert_nodeObj_to_Node(nodeObj) {
  var obj = {
    labels: nodeObj.labels,
    properties: {}
  };
  (0, _keys.default)(nodeObj).forEach(key => {
    obj.properties[key] = nodeObj[key];
  });
  return obj;
}

function convert_Node_to_nodeObj(node) {
  // log('convert_Node_to_nodeObj node is')
  // log(node)
  var obj = {
    labels: node.labels,
    properties: {
      required: {},
      optional: {},
      _private: {}
    },
    identity: node.identity || null
  };
  var result = (0, _keys.default)(node.properties).reduce((acc, key) => {
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

function isLeapYear(year) {
  return (0, _range.default)(1980, 2080, 4).includes(year);
}
/**
 * Going to use with Home.statistics - will get days per month and
 * budgeted_amount_per_month/days_per_month so make statistics more granualar,
 * as now I only do quarters.
 * @param {*} param0
 */


function daysInMonth(_ref2) {
  var {
    year,
    month
  } = _ref2;
  var mapping = {
    1: () => 31,
    // January
    2: year => {
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
    12: () => 31
  };
  return mapping[month](year);
}

function makeQuarters() {
  var years = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [2018];
  var result = years.reduce((acc, year) => {
    acc[year] = {
      q1: {
        from: [Number(year), 1, 1],
        to: [Number(year), 3, 31]
      },
      q2: {
        from: [Number(year), 4, 1],
        to: [Number(year), 6, 30]
      },
      q3: {
        from: [Number(year), 7, 1],
        to: [Number(year), 9, 30]
      },
      q4: {
        from: [Number(year), 10, 1],
        to: [Number(year), 12, 31]
      }
    };
    return acc;
  }, {});
  return result;
}

function neo4jIntegerToNumber1(int) {
  if ((0, _isNumber2.default)(int)) {
    return int;
  }

  if ((0, _isString2.default)(int)) {
    return Number(int);
  }

  if ((0, _isObject2.default)(int) && (0, _has.default)(int, "low")) {
    return int.low;
  }

  throw new Error("neo4jIntegerToNumber: couldn't transform to Number: ".concat(int, "."));
}
/**
 * I will iterate through properties, if I find an Integer, I'll convert it to Number.
 * If not, the original prop will be returned untouched.
 * @param {*} int
 */


function neo4jIntegerToNumber(int) {
  //https://neo4j.com/docs/api/javascript-driver/current/class/src/integer.js~Integer.html
  if (!(0, _2.isInt)(int)) {
    // throw new Error(`neo4jIntegerToNumber: int not an Integer.\nint: ${JSON.stringify(int)}.`);
    return int;
  }

  if (!(0, _2.inSafeRange)(int)) {
    throw new Error("neo4jIntegerToNumber: int not in safe range.\nint: ".concat(JSON.stringify(int), "."));
  }

  return (0, _2.toNumber)(int);
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
  var dateFrom = new Date(from),
      dateTo = new Date(to);

  if (dateFrom.valueOf() >= dateTo.valueOf()) {
    throw new Error("produceMonthsFromDates: dateFrom (".concat(dateFrom, ") must be earlier that dateTo (").concat(dateTo, ")"));
  }
  /* 
    I generate dates between start and stop, then turn each into
    'YYYY-MM' string, filter uniques and turn them back to [YYYY, MM]
  */


  return (0, _uniq.default)(getDates(dateFrom, dateTo).map(function turnDatesIntoDateArrayStrings(date) {
    return dateArrayToString([date.getFullYear(), date.getMonth() + 1]);
  })).map(dateArrayStringToArray);
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
  var date = new Date(str);
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


function adjustFrontEndDates(_from, _to) {
  var from = dateStringToDateArray(_from),
      to = dateStringToDateArray(_to);
  /* to check dates I need to do 'reduce_to_truth' filter by supplied fn, take length */

  if (!isTimeArray(from) || !isTimeArray(to)) {
    return new _Result.Failure({
      reason: "adjustFrontEndDates: dates are not good: from ".concat(from, ", to: ").concat(to, "."),
      parameters: {
        from,
        to
      }
    });
  }

  return new _Result.Success({
    data: [{
      from,
      to
    }]
  });
}

function isOdd(number) {
  return number % 2 !== 0;
}

function printMessage(text) {
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
  var TOP_BORDER = "=".repeat(45),
      SIDE_BORDER = "||",
      TOTAL_WIDTH = TOP_BORDER.length,
      SIDE_BORDERS = SIDE_BORDER.length * 2,
      EXTRA_PADDING = " ".repeat(2),
      // each side
  TOTAL_USABLE_WIDTH = TOTAL_WIDTH - SIDE_BORDERS - EXTRA_PADDING.length * 2; // 37
  //  CENTRE = /* isOdd(TOTAL_WIDTH) ?  */Math.round(TOTAL_WIDTH/2)

  return [generateTop(), generateEmptyLine(), ...text.map(generateFullLine), generateEmptyLine(), generateTop()].join("");
  /********************************/

  function generateTop() {
    return "".concat(TOP_BORDER, "\n");
  }

  function generateEmptyLine() {
    return "".concat(SIDE_BORDER).concat(" ".repeat(41)).concat(SIDE_BORDER, "\n");
  }

  function generateFullLine(line) {
    var ll = line.length,
        total_padding = TOTAL_USABLE_WIDTH - ll;
    var left_padding, righ_padding;

    if (ll > 37) {
      throw new Error("padding.generateFullLine: line is longer than 37 symbols.");
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

    return "".concat(SIDE_BORDER).concat(EXTRA_PADDING).concat(left_padding).concat(line).concat(righ_padding).concat(EXTRA_PADDING).concat(SIDE_BORDER, "\n");
  }
}
/**
 * @example
 *  getMonthNumber({ month: 'January', asString: true }) // '01'
 * @param {*} month
 * @param {*} asString
 */


function getMonthNumber() {
  var {
    month = "",
    asString = true
  } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  if (!month.length) {
    return new _Result.Failure({
      reason: "getMonthNumber: no month supplied."
    });
  }

  var mapping = {
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
    December: "12"
  };
  return asString ? mapping[month] : Number(mapping[month]);
}

function neo4jNumberToNumber(number) {}

function hasher(data) {
  var hash = _crypto.default.createHash("sha256");

  hash.update(data);
  var result = hash.digest("hex");
  return result;
}

function isValidYear(val) {
  if (typeof val.YEAR !== "number") {
    return false;
  }

  return val.YEAR >= 1950 && val.YEAR <= 2100;
}

function isValidMonth(val) {
  if (typeof val.MONTH !== "number") {
    return false;
  }

  return val.MONTH >= 1 && val.MONTH <= 12;
}

function isValidDay(val) {
  if (typeof val.DAY !== "number") {
    return false;
  }

  if ([1, 3, 5, 7, 8, 10, 12].includes(val.MONTH)) return val.DAY >= 1 && val.DAY <= 31;
  if ([4, 6, 9, 11].includes(val.MONTH)) return val.DAY >= 1 && val.DAY <= 30;
  if (val.MONTH === 2 && _.range(2028, 1980, -4).includes(val.YEAR)) return val.DAY >= 1 && val.DAY <= 29;
  return val.DAY >= 1 && val.DAY <= 28;
}

function setDateCreated() {
  var param = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "array";
  var r = new Date();
  if (param === "array") return [r.getFullYear(), r.getMonth() + 1, r.getDate(), r.getDay(), r.valueOf()];
  return {
    year: r.getFullYear(),
    month: r.getMonth() + 1,
    day: r.getDate(),
    weekday: r.getDay(),
    utc: r.valueOf()
  };
}

function generateTimeArray() {
  var r = new Date();
  return [r.getFullYear(), r.getMonth() + 1, r.getDate(), r.getDay(), r.valueOf()];
}

function isNeo4jId(val) {
  // declare type Neo4jId = { low: number, high: number }
  return (0, _isObject2.default)(val) && (0, _has.default)(val, "low") && (0, _isNumber2.default)(val.low) && (0, _has.default)(val, "high") && (0, _isNumber2.default)(val.high);
}

function isTrue(val) {
  return Boolean(val) === true;
}

function isFalse(val) {
  return Boolean(val) === false;
}

function sumUpArray() {
  var acc = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  var n = arguments.length > 1 ? arguments[1] : undefined;
  return acc += n;
}

function get(method) {
  return obj => {
    return obj[method]();
  };
}

function abs(val) {
  if (!isNumber(val)) {
    throw new Error("abs: val is NaN.\nval: ".concat(JSON.stringify(val)));
  } else {
    return val < 0 ? -1 * val : val;
  }
}

function isMissing(val) {
  return (0, _isNull.default)(val) || val == undefined;
}

function isPresent(val) {
  return !(0, _isNull.default)(val) && val !== undefined;
}

function not(val) {
  return !val;
}

function isUpperCased(word) {
  return word.split().every(letter => letter === letter.toUpperCase());
}

function hasLeadingDash(word) {
  return word[0] === "_";
}
/**
 * Picks only UPPER_CASED/UPPERCASED keys as required props
 * @param {Object} properties
 * @returns {Object}
 */


function getRequiredProperties(props
/* : Object */
)
/* : Object */
{
  var properties = props || this.properties;
  var REQUIRED = (0, _keys.default)(properties).filter(word => not(hasLeadingDash(word)) && isUpperCased(word));
  return (0, _pick.default)(properties, REQUIRED);
}
/**
 * Picks only upperCased/upperCASED/UPPER_CASEd/uPPERCASED keys as optional props
 * @param {Object} properties
 * @returns {Object}
 */


function getOptionalProperties(props
/* : Object */
)
/* : Object */
{
  var properties = props || this.properties;
  var optional = (0, _keys.default)(properties).filter(word => not(hasLeadingDash(word)) && not(isUpperCased(word)));
  return (0, _pick.default)(properties, optional);
}
/**
 * Picks only _upperCased/__UPPERCASED/_UpPeR_CaSeD keys as private props
 * @param {Object} properties
 * @returns {Object}
 */


function getPrivateProperties(props
/* : Object */
)
/* : Object */
{
  var properties = props || this.properties;

  var _private = (0, _keys.default)(properties).filter(hasLeadingDash);

  return (0, _pick.default)(properties, _private);
}

function generateTimeArrays(years) {
  /* account for leap years */
  var timeArrays = [];

  var days_in_month = (year, month) => {
    if (month === 2) {
      return isLeapYear(year) ? 29 : 28;
    }

    if ([1, 3, 5, 7, 8, 10, 12].includes(month)) {
      return 31;
    }

    return 30;
  };

  years.forEach(year => {
    for (var month = 1; month < 13; month++) {
      for (var day = 1; day <= days_in_month(year, month); day++) {
        timeArrays.push([year, month, day, new Date(year, month - 1, day).getDay() + 1, 123]);
      }
    }
  });
  return timeArrays;
}

function unwrapIfInArray(val) {
  return (0, _isArray.default)(val) ? val[0] : val;
}

function stringify(val) {
  return JSON.stringify(val, null, 4);
}