"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.IdArray = void 0;
exports.isIdArray = isIdArray;

var _ = require(".");

var log = function log() {
  for (var _len = arguments.length, items = new Array(_len), _key = 0; _key < _len; _key++) {
    items[_key] = arguments[_key];
  }

  return items.forEach(item => console.log(util.inspect(item, {
    depth: null,
    colors: true
  })));
};
/**
 * @private
 * missing items may be represented by ""/undefined/null
 * @param {*} val 
 */


function _isIdentificationArray(val) {
  // ['Jon Doe', 'ID', '_hash'] == [nickname, ID, _hash]
  // general sane checks
  if (!val) return new _.Failure({
    reason: "No truthy value.",
    parameters: val,
    data: ['', '', '']
  });
  if (!(val instanceof Array)) return new _.Failure({
    reason: "Value must be an Array.",
    parameters: val,
    data: ['', '', '']
  });
  if (!val.length) return new _.Failure({
    reason: "Value must not be empty Array.",
    parameters: val,
    data: ['', '', '']
  });
  if (val.length != 3) return new _.Failure({
    reason: "Value must be enum type [nickname, id, _hash]. '' is allowed for missing property (2 max).",
    parameters: val,
    data: ['', '', '']
  }); // sufficiency test - must contain at least one valid identificator:

  var [nickname, id, _hash] = val;
  var new_val = []; // must be at least one of these

  if (!(nickname || id || _hash)) {
    return new _.Failure({
      reason: "Value must contain at least one of the [nickname, id, _hash].",
      parameters: val,
      data: ['', '', '']
    });
  } else {
    // check if there is at least one valid identificator that we can use
    // leave it or replace with ''
    if (nickname && (0, _.isString)(nickname) instanceof _.Success) {
      new_val[0] = nickname;
    } else {
      new_val[0] = '';
    } // a valid id is anything that could be coerced to a Number. 


    if (id && ((0, _.isNumber)(id) instanceof _.Success || (0, _.isString)(id) instanceof _.Success && !isNaN(id))) {
      new_val[1] = String(id);
    } else {
      new_val[1] = '';
    }

    if (_hash && (0, _.isString)(_hash) instanceof _.Success) {
      new_val[2] = _hash;
    } else {
      new_val[2] = '';
    } // final check so that [true, '', '']/['', 'ID', ''] won't pass


    if (new_val.every(val => val === '')) {
      return new _.Failure({
        reason: "there are no usable identificators.",
        parameters: val,
        data: new_val
      });
    } else {
      return new _.Success({
        parameters: val,
        data: new_val
      });
    }
  }
}

;
/**
 * @public
 * This is used to represent node identification info. 
 * For instance - I need to enhance some node, let's say a Transaction, and build 
 * relationships with PAYOR and PAYEE. So to be able to identify the correct PAYOR/PAYEE
 * Transaction shall have an IdArray with sufficient info so that app could query Neo4j and
 * locate the correct Node, or ascertain that no such Node exists (in which case user is requested to
 * provide required properties and create such PAYOR/PAYEE Node).
 * 
 * [2020-01-15] Class gives priority to parameters supplied as an array. - What's the purpose 
 * of having 2 ways to supply parameters to constructor??? It makes everything more complicated. 
 * Instead I should choose one (key:value or array) and stick to it.
 * 
 * I will go with array (a tuple, enum type etc):
 * @example
 *  OK if contains at least one valid identificator (sufficiency test):
 * 
 *  const id1 = new IdArray(['nickname', 123, 'hash'])  => ['nickname', '123', 'hash']
 *  const id2 = new IdArray(['nickname'])               => ['nickname', '', '']
 *  const id3 = new IdArray([null, 123])                => ['', '123', '']
 *  const id4 = new IdArray([null, null, 'hash'])       => ['', '', 'hash']
 * 
 * @idea1 I think IdArray should return unequivocally usable array, meaning that if we put in 
 * something like ['Joe', 'keke'], then it should give us a ['Joe', null, null] - clearly 
 * indicating which parts could be used further.
 * 
 * @idea1_update [2020-01-16] While in the shower this morning, remembered that Cypher3.5 allows
 * only heterogeneous lists == all elements must be literals of same type. 
 * https://neo4j.com/docs/cypher-manual/3.5/syntax/values/#composite-types
 * 
 * Therefore, I was correct initially by turning all non-usable identificators to ''. 
 * 
 */

class IdArray {
  constructor(array) {
    var [NICKNAME, id, hash] = array;
    this.NICKNAME = NICKNAME;
    this.id = id;
    this.hash = hash;
  }
  /**
   * @public
   */


  toArray() {
    return this.isIdentificationArray().data;
  }
  /**
   * @public
   */


  getNICKNAME() {
    return this.NICKNAME;
  }
  /**
   * @public
   */


  getId() {
    return this.id;
  }
  /**
   * @public
   */


  getHash() {
    return this.hash;
  }
  /**
   * @public
   */


  isValid() {
    return _isIdentificationArray([this.NICKNAME, this.id, this.hash]).success;
  }
  /**
   * 
   * What is this for? I need to hash Nodes, so that I could
   * 1. ascertain their consistence over time - all required props give their inputs into hash function.
   * 2. This _hash is indexed by Neo4j! Huge optimization.
   * 
   * Problem - IdArray MAY be ['', '', ''] - when we add incomplete nodes, unenhanced nodes. 
   * By design, idea behind IdArray - to have a 3step identification 
   * for the correct node to build relationship to. NICKNAME 
   * can be added by user, it is the bare minimum, id & _hash
   * will be added later, when this node becomes a permanent
   * member of Neo4j.
   * 
   * We can treat IdArray as an extended_required_property,
   * where NICKNAME is a REQUIRED field (althogh IdArray does
   * not enforce this - should it?), and id/_hash as optional
   * components. Then IdArray's hash == NICKNAME only.
   * 
   */


  getHashableValue() {
    // what if it's ''?
    return String(this.NICKNAME);
  }

  isIdentificationArray() {
    return _isIdentificationArray([this.NICKNAME, this.id, this.hash]);
  }

}

exports.IdArray = IdArray;

function isIdArray(val) {
  return val instanceof IdArray;
}