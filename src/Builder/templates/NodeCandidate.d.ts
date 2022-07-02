export class NodeCandidate {
  getCoreNode: () => Object | Node
  setCoreNode: () => void
  toNode: () => Node

  coreNode: Object | Failure

  constructor(coreNode: Object);
}