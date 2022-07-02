export class Node {
  constructor(config: {
    labels?: string[],
    properties?: Object,
    identity?: number | string | null,
  });

  getId(param?: string): number | null
  getLabels(): string[]
  getProperties(parameter: string = "number"): Object
  getProperty(prop: string): any // string | string[] | number | number[] | boolean | null | typeof undefined | smth else?
  hasher(data: string): string
  createHash(data): string
  getHash(): string | typeof undefined
  setHash(): void
  setLabels(val: string[]): Node
  addLabel(val: string): void
  setProperties(val: Object): void
  addProperty(propName: string, propVal: string): Node
  setIdentity(val: number | string | null): Node
  toString(
    config: { 
      parameter: "all"|"labels"|"properties"|"no hash",
      firstLabelOnly: boolean, 
      required: boolean, 
      requiredPropsOnly: boolean,
      optional: boolean, 
      optionalPropsOnly: boolean,
      _private: boolean,
      _privatePropsOnly: boolean
    }
  ): string
  toObject(): Object
  toNode(): Node 
  toNodeObj(): Object
  propertiesToNumber(): Node
  firstLetterUp(str: string): string
  stringifyLabel(labels: string[] | string): string
  stringifyProperties(properties: Object): string
  convertIntegerToNumber(object: Integer): number
  isComplete(): boolean
  toUpdateById(): Object
  isWritten(): boolean
  isNode(val: any): boolean
  isNodeLike(value: any): boolean
  isNodeObj(node: any): boolean
  isWrittenNode(node: Node): boolean
  isSameNode(nodeA: Node, nodeB: Node): boolean
}