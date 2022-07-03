export interface PartialProp {
  isDate?: boolean  /**@todo | typeof undefined ?? */
  isRange?: boolean /**@todo | typeof undefined ?? */
  isCondition?: boolean /**@todo | typeof undefined ?? */
}

export interface PartialNodeConfig {
  properties: PartialProp[]
}

export class PartialNode {
  setHash: () => void
  toString: () => string
  toObject: () => Object
  toNodeObject: () => Object

  constructor(obj: PartialNodeConfig)
}

export interface isPartialNodeFunction {
  (val: any): boolean
}

export const isPartialNode: isPartialNodeFunction