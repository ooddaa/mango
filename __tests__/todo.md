//// optimizations
mergeEnhancedNodes.test - re-write efficacy tests. When we start optimizations.
mergeNodes.test - re-write efficacy tests. When we start optimizations.
Engine - pull out all functions and assign to Engine.prototype

////////////// ENGINE //////////////

//// Engine.mergeNodes
// validations - ok
// defaults - ok
// flow - false
// docs - ok
// comments - ok
// refactored - false
// tests = ok

//// Engine.mergeEnhancedNodes
// validations - ok
// defaults - ok
// flow annotations - ok
// flow - false
// docs - ok
// comments - ok
// refactored - false
// tests = ok

Engine.mergeEnhancedNodes - add query & summary to result - done
Switch to { wrap: true } - done
set defaults - done
@todo \_check_nodes_result & \_check_rels_result Check there are no `Neo4jError: Node(28829) already exists` errors.

//// Engine.matchNodes
// validations -
// defaults - nope
// resultWrapper - nope
// flow annotations -
// flow -
// docs -
// comments -
// refactored -
// tests =

//// Engine.matchNodesById
// validations - ok
// defaults - ok
// uses wrapper - true
// resultWrapper - nope
// flow annotations -
// flow -
// docs -
// comments -
// refactored - a bit
// tests - ok

//// Engine.matchRelationships
// validations - ok
// defaults - ok
// uses wrapper - true
// resultWrapper - nope
// function JSDoc annotations - {XYZ} !!!
// flow annotations -
// flow -
// docs -
// comments -
// refactored - a bit
// tests - ok
in wrapper missing rels return null (uses OPTIONAL MATCH), tests pass. Shall I return null ? I think so

//// Engine.matchPartialNodes
// validations - ok
// defaults - ok
// resultWrapper -
// flow annotations -
// flow -
// docs -
// comments -
// refactored -
// tests -
wft - random order of results from runQuery via console.log? sometimes pn2 comes in front of pn1
!!! DO NOT ENHANCE

//// Engine.enhanceNodes
// validations - ok
// defaults - ok
// resultWrapper -
// flow annotations - ok
// function description - ok
// flow -
// docs -
// comments -
// refactored -
// tests -
// finished -

//// Engine.deleteNodes
// validations - ok
// defaults - ok
// resultWrapper - ok
// flow annotations - ok
// function description - ok
// flow -
// docs -
// comments -
// refactored -
// tests -
// finished -
@deletePermanently
@add \_hash to returned object - use matchNodes to obtain (\_hash + id) combo

////
// validations -
// defaults -
// resultWrapper -
// flow annotations -
// function description -
// flow -
// docs -
// comments -
// refactored -
// tests -
// finished -

////Engine.mergeRelationships
[e.1][done] add query & summary to result
[e.2][ ] return [] if Relationship[].length == 0? less code for mergeEnhancedNodes 4a
[e.3][ ] add { allowDuplicates: bool } to allow merging duplicate Relationships

Engine.matchPartialNodes - handle NOT_CONTAINS case

Engine.enhanceNodes - what if there are 1+ updates on the same node? Currently this

- only handles one update. Mb then we set isValid: false on all but the
- only valid version + nextNodeHash on the valid updated node?

Engine.enhanceNodes - updated node should take place of the updatee node.

////////////// BUILDER //////////////

remove engine
WHY DO I RUN METHODS ASYNC ?!?!?!? they are synchronous! remove async

Builder.buildNodes / NodeCandidate.properties.required = { propName } - should I turn it into Node.properties = { PROP_NAME } ??, now it is copied as is
Builder.buildEnahncedNodes - had a case where forgot to add startNode (updateNodes complex case setup - C node) and got a TypeError: Cannot read property 'getNecessity' of undefined - need a more precise error message.

// updateNodes //

Relationship - necessity: 'excluded'

NodeCandidate - I sometimes supply 'parameters' instead of 'properties' - I need to throw for it!

what if updater Node|EnhancedNode is written in DB ?

buildEnahncedNodes.test - write describe('both rels', () => { })

buildRelationships - add private props \_fromDate: setCurrentDate(), \_toDate: [], \_isValid: true ???, \_validFrom: setCurrentDate(), \_validTo: []
buildRelationships - does not need to be async? make standalone?

RelationshipCandidate - add methods so we can set main/participatingNode
RelationshipCandidate - write test - describe('setting main/partnerNode sets respective start/endNode', () => { })
RelationshipCandidate - add EnhancedNodeCandidate[] as possible arguments to partnerNode & mainNode and test

ENC.isEnhanceable - change return value to { } so we can make better error messages

Engine.updateNodes - we might need to check that updater is not in Neo4j yet - if it is written, ok, we just do -has_update-> and old rels' \_isCurrent: false

Engine.editNodesById - rename editNodes ? test

/// runQuery
use queries from neo4j.com tutorials/docs

Engine.runQuery - omg this should have been done first!! test. clairfy
transformer? ??!±?± as default == false - check
wrapper ????!>! - I seem to have wrapper as default == true (markNodesAsUpdated, updateNodes)
raw ??!> !! >

Engine.runQuery.test - ffs write a test for the main worker
retry at - runQuery() Error: Neo4jError: ForsetiClient[22] can't acquire ExclusiveLock{owner=ForsetiClient[13]} on RELATIONSHIP(176476), because holders of that lock are waiting for ForsetiClient[22].
Wait list:ExclusiveLock[
Client[13] waits for [22]]

wtf - runQuery returns Success.data = [Failure] & Success.data = [Enode[]] instead of [Success] ??
