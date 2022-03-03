"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PartialNode = void 0;
exports.isPartialNode = isPartialNode;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _Node = require("./Node");

var _utils = require("../../utils");

var _keys = _interopRequireDefault(require("lodash/keys"));

var _has = _interopRequireDefault(require("lodash/has"));

var _isObject = _interopRequireDefault(require("lodash/isObject"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

/**
 * PartialNodes are used to do Node matching. 
 * They will have `ranges`, `search specifications` etc.
 * Engine.matchPartialNodes will interpret PartialNode and
 * create Cypher query.
 */
class PartialNode extends _Node.Node {
  constructor(obj) {
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
    (0, _keys.default)(obj.properties).forEach(prop => {
      // if an object and has type key value
      var property = obj.properties[prop];

      if ((0, _isObject.default)(property) && !Array.isArray(property)) {
        // simple case
        if (!(0, _has.default)(property, 'isDate') && !(0, _has.default)(property, 'isRange') && !(0, _has.default)(property, 'isCondition')) {
          property.isDate = false;
          property.isRange = false;
          property.isCondition = false;
        } // condition


        if (property.isCondition == true) {
          property.isDate = false;
          property.isRange = false;
        } // is date

        /**@potential_bug can I have a date range with condition? */


        if (property.isDate == true) {
          property.isCondition = false;
          property.isRange = property.isRange !== undefined ? property.isRange : false;
        }
      }
    });
    super(obj);
  }

  setHash() {
    var props = this.getRequiredProperties();
    if (!(0, _keys.default)(props).length) return;
    this.properties._hash = this.createHash(this.toString());
  }

  toString() {
    /* must recursively stringify properties */
    return "".concat(this.stringifyLabel(this.labels)).concat(JSON.stringify(this.getRequiredProperties()));
  }
  /**
   * So far works with single property only.
   * @todo it's a bad hotfix, you can do better.
   */


  toObject() {
    var props = this.properties;
    var newProps = (0, _keys.default)(this.getRequiredProperties()) // .filter(word => word[0] !== '_' && word[0] === word[0].toUpperCase())
    .reduce((acc, key) => {
      var {
        isDate,
        isRange,
        isCondition
      } = props[key];

      if (!isDate && !isRange && !isCondition) {
        acc[key] = props[key].value[0];
      } else {
        throw new Error("PartialNode.toObject: problem with values.\nthis: ".concat(this));
      }

      return acc;
    }, {}); // log(keys(props))

    return {
      labels: this.labels,
      properties: newProps
    };
  }

  toNodeObject() {
    var obj = this.toObject();
    /* OMG really? */

    var newObj = _objectSpread(_objectSpread({}, obj), {}, {
      properties: {
        required: obj.properties
      }
    });

    return newObj;
  }

}

exports.PartialNode = PartialNode;

function isPartialNode(val) {
  return val instanceof PartialNode;
}