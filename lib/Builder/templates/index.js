"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var templates = {};

_fs.default.readdirSync(__dirname).filter(file => {
  return file.indexOf('.') !== 0 && file !== 'index.js' && file.slice(-3) === '.js';
}).forEach(file => {
  var key = file.slice(0, -3);
  templates[key] = require("./".concat(file))[key];
});

var _default = templates;
exports.default = _default;