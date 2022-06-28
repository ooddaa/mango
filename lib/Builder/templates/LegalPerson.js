"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.legalPersonObject = exports.LegalPerson = void 0;

var _Node = require("./Node");

var _Template = require("./Template");

var _Relationship = require("./Relationship");

var _Result = require("../../Result");

var _RequiredValue = require("../../RequiredValue");

var _utils = require("../../utils");

var _types = require("../../types");

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
 * 
 */


class LegalPerson extends _Template.Template {
  constructor(obj) {
    super(obj);
    this.labels = ['LegalPerson'];
    this.properties = {
      required: {
        NICKNAME: new _RequiredValue.RequiredValue('String', 'Payor_A', val => (0, _utils.isString)(val)),
        TYPE: new _RequiredValue.RequiredValue('String', 'Company', val => (0, _utils.isString)(val, _types.beneficiary_types)),
        REG_NUMBER: new _RequiredValue.RequiredValue('String', '123abc', val => (0, _utils.isString)(val)),
        COUNTRY_OF_INCORPORATION: new _RequiredValue.RequiredValue('IdArray', ['BVI', 'ID', '_hash'], val => (0, _utils.isIdentificationArray)(val)),
        IS_ACTIVE: new _RequiredValue.RequiredValue('Boolean', true, val => (0, _utils.isBoolean)(val)),
        DATE_OF_INCORPORATION: new _RequiredValue.RequiredValue('Array', [2018, 1, 1, 1, 123], val => (0, _utils.isTimeArray)(val))
      },
      optional: {}
    };
    this.createRelationships = relationshipsTemplate;
  }

}

exports.LegalPerson = LegalPerson;
var legalPersonObject = {
  labels: ['LegalPerson'],
  properties: {
    required: {
      NICKNAME: 'Payor_A',
      TYPE: 'Company',
      REG_NUMBER: '123abc',
      COUNTRY_OF_INCORPORATION: ['BVI', 'ID', '_hash'],
      IS_ACTIVE: true,
      DATE_OF_INCORPORATION: [2018, 1, 1, 1, 123]
    },
    optional: {},
    _private: {}
  }
};
exports.legalPersonObject = legalPersonObject;