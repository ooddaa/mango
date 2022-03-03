/* @flow */
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
// https://stackoverflow.com/questions/35502432/passing-object-to-nodes-error-class-returns-an-unaccessible-object
import { log } from "./utils";
// const e = new Error('lol')
// e.error =
// e.message = {text: 'lol', data: ['one', 'two']}
// log(e.message.data[0])
// log(e)

class TransactionPropertiesValidationError extends Error {
  result: Object;
  constructor(result?: Object, ...props: any[]) {
    super(...props);
    this.result = result || {};
  }
}
class NoEngineError extends Error {
  result: Object;
  constructor(result?: Object, ...props: any[]) {
    super(...props);
    this.result = result || {};
  }
}

export { TransactionPropertiesValidationError, NoEngineError };
