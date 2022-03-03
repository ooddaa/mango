"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Node = void 0;
exports.isNode = isNode;
exports.isNodeObj = isNodeObj;
exports.isSameNode = isSameNode;
exports.isWrittenNode = isWrittenNode;

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _IdArray = require("../../IdArray");

var _ = require("../..");

var _util = _interopRequireDefault(require("util"));

var _crypto = _interopRequireDefault(require("crypto"));

var _has = _interopRequireDefault(require("lodash/has"));

var _keys = _interopRequireDefault(require("lodash/keys"));

var _isArray = _interopRequireDefault(require("lodash/isArray"));

var _isObject = _interopRequireDefault(require("lodash/isObject"));

var _excluded = ["_hash"];

/**
 * @todo make .toString() return without ':' - then we could run CQL without named variables.
 */
class Node {
  /**
   * @constructor
   * @param {labels} labels - Array for all labels
   * @param {properties} properties - Map with node properties
   * @param {identity} identity - Unique identity
   */
  constructor() {
    var obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    this.labels = obj.labels || [];
    this.properties = obj.properties || {};
    this.identity = obj.identity || null;
  }

  getRequiredProperties() {
    return (0, _.getRequiredProperties)(this.properties);
    /**@bug if dealing with ID Arrays - no good test for it yet.
     * Just gonna keep old code here.
     */
    // function getRequiredProperties(): Object {
    //   const REQUIRED = keys(this.properties).filter(
    //     word => word[0] !== "_" && word[0] === word[0].toUpperCase()
    //   );
    //   return REQUIRED.reduce((acc, key) => {
    //     acc[key] = isIdArray(this.properties[key]) ?
    //       this.properties[key].getHashableValue() : this.properties[key]
    //     return acc;
    //   }, {});
    // }
  }

  getOptionalProperties() {
    return (0, _.getOptionalProperties)(this.properties);
  }

  getPrivateProperties() {
    return (0, _.getPrivateProperties)(this.properties);
  }

}

exports.Node = Node;

function getId(param) {
  //let id
  if (param === 'asNumber') {
    return Number(this.identity.low);
  }

  if (this.identity === null) return null;
  if (typeof this.identity === "string") return Number(this.identity);
  if (typeof this.identity === "object") return Number(this.identity.low);
  return this.identity; // a string when retreived from Neo4j
}

Node.prototype.getId = getId;

function getLabels() {
  return this.labels;
}

Node.prototype.getLabels = getLabels;

function getProperties() {
  var parameter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "number";

  if (parameter === "number" || parameter === "numbers") {
    var properties = (0, _keys.default)(this.properties).reduce((acc, key) => {
      var prop = this.properties[key];

      if ((0, _IdArray.isIdArray)(prop)) {
        acc[key] = prop.toArray();
        return acc;
      } else if (prop instanceof Array) {
        if (prop.every(elm => typeof elm === "object")) {
          acc[key] = prop.map(this.convertIntegerToNumber);
          return acc;
        }
      }

      if (typeof prop === "object") {
        acc[key] = this.convertIntegerToNumber(prop);
        return acc;
      }

      acc[key] = prop;
      return acc;
    }, {});
    return properties;
  } // return 'Node.getProperties() failed'


  throw new Error("Node.getProperties() failed.");
}

Node.prototype.getProperties = getProperties;

function getProperty(prop) {
  return this.properties[prop];
}

Node.prototype.getProperty = getProperty;
/**
 * @to_be_depricated as useless - use this.hasher instead
 * @param {*} data_to_hash 
 */

function createHash(data_to_hash) {
  // const data_to_hash = this.toString('all', { REQUIRED: true })
  var hash = this.hasher(data_to_hash);
  return hash;
}

Node.prototype.createHash = createHash;

function getHash() {
  return this.properties._hash;
}

Node.prototype.getHash = getHash;
/**
 * Hash formula is
 * Labels[0] + all required properties.
 * IdArrays return only first element, NICKNAME.
 * @todo how do we _hash 
 */

function setHash() {
  var props = this.getRequiredProperties(); // in case we don't have any required properties, we'll hash by labels only

  if (!(0, _keys.default)(props).length) {
    var hash = this.createHash(JSON.stringify(this.getLabels()));
    this.properties._hash = hash;
    return;
  } // hmm something somewhere will break =) hello, bug!
  // if (!keys(props).length) {
  //   return;
  // }


  this.properties._hash = this.createHash(this.toString("all", {
    REQUIRED: true
  }));
}

Node.prototype.setHash = setHash;

function setLabels(val) {
  this.labels = val;
  return this;
}

Node.prototype.setLabels = setLabels;

function addLabel(val) {
  this.labels.push(val);
}

Node.prototype.addLabel = addLabel;

function setProperties(val) {
  /**
   *  @todo add val check
   */
  this.properties = val;
}

Node.prototype.setProperties = setProperties;

function addProperty(propName, propVal) {
  this.properties[propName] = propVal;
  return this;
}

Node.prototype.addProperty = addProperty;

function setIdentity(val) {
  this.identity = val;
  return this;
}

Node.prototype.setIdentity = setIdentity;

function toString() {
  var parameter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "all";
  var {
    REQUIRED,
    required,
    optional,
    _private
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if (parameter === "labels") {
    return "".concat(this.stringifyLabel(this.labels));
  }

  if (parameter === "all") {
    if (REQUIRED || required) return "".concat(this.stringifyLabel(this.labels)).concat(this.stringifyProperties(this.getRequiredProperties()));
    if (optional) return "".concat(this.stringifyLabel(this.labels)).concat(this.stringifyProperties(this.getOptionalProperties()));
    if (_private) return "".concat(this.stringifyLabel(this.labels)).concat(this.stringifyProperties(this.getPrivateProperties()));
    return "".concat(this.stringifyLabel(this.labels)).concat(this.stringifyProperties(this.properties));
  }

  if (parameter === "properties") {
    if (REQUIRED || required) return "".concat(this.stringifyProperties(this.getRequiredProperties())).slice(1);
    if (optional) return "".concat(this.stringifyProperties(this.getOptionalProperties())).slice(1);
    if (_private) return "".concat(this.stringifyProperties(this.getPrivateProperties())).slice(1);
    return "".concat(this.stringifyProperties(this.properties)).slice(1);
  }

  if (parameter === "no hash") {
    var _this$properties = this.properties,
        {
      _hash
    } = _this$properties,
        rest = (0, _objectWithoutProperties2.default)(_this$properties, _excluded);
    return "".concat(this.stringifyLabel(this.labels)).concat(this.stringifyProperties(rest));
  }

  return "".concat(this.stringifyLabel(this.labels)).concat(this.stringifyProperties(this.properties));
}

Node.prototype.toString = toString;

function toObject() {
  return {
    identity: this.identity,
    labels: this.labels,
    properties: this.properties
  };
}

Node.prototype.toObject = toObject;
/**
 * For compatibility. EnhancedNode has its own toNode method.
 */

function toNode() {
  return this;
}

Node.prototype.toNode = toNode;
/**
 * Converts Node back to 'half-backed-Node-candidate' with
 * {
 * labels,
 * properties: {
 *  required,
 *  optional,
 *  _private
 *  },
 * identity
 * }
 * structure. These are consumed by Builder.
 * Frontend obj -> Node wrapper -> Node.toNodeObj() -> to Builder
 * so that we can ascertain that whatever Frontend sent is worthy
 * of being saved in Neo4j.
 */

function toNodeObj() {
  return convert_Node_to_nodeObj(this);

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
      } else if (key[0] !== key[0].toUpperCase()) {
        acc.properties.optional[key] = node.properties[key];
        return acc;
      } else {
        // return 'convert_Node_to_nodeObj: Error: something wroong!'
        throw new Error("Node.toNodeObj(): something went wrong! ".concat(JSON.stringify(obj)));
      }
    }, obj);
    return result;
  }
}

Node.prototype.toNodeObj = toNodeObj;
/**
 * @shit_method da fuk is this for? makes no sense
 */

function propertiesToNumber() {
  this.properties = this.getProperties("number");
  return this;
}

Node.prototype.propertiesToNumber = propertiesToNumber;

function firstLetterUp(str) {
  return str.substr(0, 1).toUpperCase() + str.substr(1);
}

Node.prototype.firstLetterUp = firstLetterUp;

function stringifyLabel(labels) {
  // log(labels)
  if ((0, _.isMissing)(labels) || labels.length == 0) {
    return "";
  }

  if (typeof labels === "string" && labels.length) return ":".concat(this.firstLetterUp(labels));

  if (labels instanceof Array) {
    return labels.map(each => this.stringifyLabel(each)).join("");
  }

  return labels.toString(); // what shall we do here? what's the default
  //behavior? we will only have either str or [str1, str2]
}

Node.prototype.stringifyLabel = stringifyLabel;

function stringifyProperties(properties) {
  if (!properties) return "";
  var array = Object.entries(properties);
  if (!array.length) return "";

  var stringifyPerType = val => {
    if (typeof val === "string") return "'".concat(String(val), "'");
    if (typeof val === "number") return "".concat(val);
    if (typeof val === "boolean") return !!val ? "true" : "false";

    if (val instanceof Array) {
      var _result;

      if (val.every(elm => typeof elm === "number")) {
        _result = val.reduce((acc, elm) => {
          acc += "".concat(elm, ", ");
          return acc;
        }, "");
        return "[".concat(_result.substr(0, _result.length - 2), "]");
      }

      _result = val.reduce((acc, elm) => {
        if (typeof elm === "number") return acc += "'".concat(elm, "', ");
        if (typeof elm === "string") return acc += "'".concat(elm, "', ");
        acc += "".concat(elm, ", ");
        return acc;
      }, "");
      return "[".concat(_result.substr(0, _result.length - 2), "]");
    }

    return "";
  };

  var result = array.reduce((acc, element) => {
    var [key, value] = element;
    acc += "".concat(key, ": ").concat(stringifyPerType(value), ", ");
    return acc;
  }, "");
  return " {".concat(result.substr(0, result.length - 2), "}");
}

Node.prototype.stringifyProperties = stringifyProperties;

function convertIntegerToNumber(object) {
  if ((0, _keys.default)(object).includes("low") && (0, _keys.default)(object).includes("high")) {
    return (0, _.toNumber)(object);
  }

  return object;
}

Node.prototype.convertIntegerToNumber = convertIntegerToNumber;

function hasher(data) {
  var hash = _crypto.default.createHash("sha256");

  hash.update(data);
  var result = hash.digest("hex");
  return result;
}

Node.prototype.hasher = hasher;
/**
 * Checks if Node has _hash, which is interpreted as this Node having passed Validator
 * and Builder ==> is fit/complete to be written to Neo4j.
 */

function isComplete() {
  return !!this.properties._hash;
}

Node.prototype.isComplete = isComplete;
/**
 * Used by home.updateHTransactions (wrapper around engine.updateNodesById).
 */

function toUpdateById() {
  // [{ id: 123, properties: {a:1, b:2}}]
  // const properties = {
  //   ...this.getRequiredProperties(),
  //   ...this.getOptionalProperties()
  // }
  return {
    // id: this.getId(),
    id: this.properties._neo4j_identity,
    properties: this.getProperties()
  };
}

Node.prototype.toUpdateById = toUpdateById;
/**
 * Checks if Node has all proper identifications.
 */

function isWritten() {
  var result = !!(this.getHash() && this.getId() && this.getProperty('_uuid'));
  return result;
}

Node.prototype.isWritten = isWritten;

function isNode(val) {
  return val instanceof Node;
}
/**
 * Function to check if supplied node satisfies Node constructor requirements.
 * Minimal nodeObject configuration: 
 *  {
 *    labels: [],
 *    properties: { required: {} }
 *  }
 * @param {any} node 
 */


function isNodeObj(node) {
  if (!node) return false;
  if ((0, _.not)((0, _isObject.default)(node))) return false;

  if ((0, _has.default)(node, "labels") && (0, _has.default)(node, "properties")) {
    if ((0, _.not)((0, _isArray.default)(node.labels))) return false;
    if ((0, _has.default)(node.properties, "required") && (0, _isObject.default)(node.properties.required)) return true;
    return false;
  }

  return false;
}

function isWrittenNode(node) {
  if (!isNode(node)) {
    throw new Error("isWrittenNode: node must be a Node.\nnode: ".concat(JSON.stringify(node)));
  }

  return node.isWritten();
}

function isSameNode(nodeA, nodeB) {
  return Boolean(nodeA.getHash() === nodeB.getHash() && nodeA.getId() === nodeB.getId());
}