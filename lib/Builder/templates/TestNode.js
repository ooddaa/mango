"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TestNode = void 0;

var _Node = require("./Node");

var _Template = require("./Template");

var _Relationship = require("./Relationship");

var _utils = require("../../utils");

var _Result = require("../../Result");

var _RequiredValue = require("../../RequiredValue");

var _lodash = _interopRequireDefault(require("lodash"));

/**
 * Takes care of EnhancedNode's Relationships based on node's
 * properties.
 * @param {nodeLikeObject??} node
 */
var relationshipsTemplate = node => {
  var inbound = [],
      outbound = [];
  /* must examine node and compose relationships */

  /**
   * **inbound** (Test)<-[:TEST]-(Day)
   * **outbound**(Test)-[:DAY]->(Day)
   */

  var day = {
    // is given to Builder.buildNodes() 
    labels: ['Day'],
    properties: (node => {
      var [YEAR, MONTH, DAY] = node.properties['DAY'];
      return {
        required: {
          YEAR,
          MONTH,
          DAY
        }
      }; // this must be nodeLikeObject
    })(node)
  };
  inbound.push(new _Relationship.Relationship({
    labels: ['TEST'],
    properties: {},
    startNode: day,
    endNode: node
  }));
  outbound.push(new _Relationship.Relationship({
    labels: ['DAY'],
    properties: {},
    startNode: node,
    endNode: day
  }));
  return {
    inbound,
    outbound
  };
};
/**
 * @todo have to remove all direct instantiations of Relationships/Nodes 
 */


class TestNode extends _Template.Template {
  constructor(obj) {
    super(obj);
    this.labels = ['Test'];
    this.properties = {
      required: {
        NAME: new _RequiredValue.RequiredValue('String', 'Jon', val => (0, _utils.isString)(val)),
        SURNAME: new _RequiredValue.RequiredValue('String', 'Doe', val => (0, _utils.isString)(val)),
        SEX: new _RequiredValue.RequiredValue('String', 'Male', val => (0, _utils.isString)(val, ['Male', 'Female'])) // HEIGHT: new RequiredValue('Number', 123, val => isNumber(val)),

      },
      optional: {}
    };
    this.createRelationships = relationshipsTemplate;
  }

}

exports.TestNode = TestNode;