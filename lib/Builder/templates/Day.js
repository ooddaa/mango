"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Day = void 0;

var _Template = require("./Template");

var _utils = require("../../utils");

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
  return {
    inbound,
    outbound
  };
};
/**
 * I can make a dynamically-grown TimeTree instead of creating fixed-size TimeTree.
 * Better: combine the two. Each Day will ensure it is connected to a month. Each Month -
 * to a Year.
 * PROBLEM: (day1)-[:NEXT]->(day2) what if day2 does not exist?
 */


class Day extends _Template.Template {
  constructor(obj) {
    super(obj);
    this.labels = ['Day'];
    this.properties = {
      required: {
        // KEY: new RequiredValue(constructor_name: string, example: any, validation: Function),
        YEAR: new _RequiredValue.RequiredValue('Number', 2018, val => (0, _utils.isValidYear)(val)),
        MONTH: new _RequiredValue.RequiredValue('Number', 12, val => (0, _utils.isValidMonth)(val)),
        DAY: new _RequiredValue.RequiredValue('Number', 1, val => (0, _utils.isValidDay)(val))
      },
      optional: {}
    };
    this.createRelationships = relationshipsTemplate;
  }

}

exports.Day = Day;