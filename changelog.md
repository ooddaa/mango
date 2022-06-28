[2021-12-26][1.0.1] 
    1. Result
        a.  isPending method checks if Result is neither Success nor Failure. 
        b.  All default values == undefined.

[2022-03-20][1.1.0] 
    1. Node handles multiple labels differently: only the first label is used to compose Node's _hash and is displayed as (:FirstLabel { _label: FirstLabel, _labels: [FirstLabel, OtherLabels] }). 

[2022-06-23][1.1.1] 
    1. Mango.findNode - props are now optional. Use case - to search all Nodes by the label only. 
[2022-06-24][1.1.2] 
    1. Engine.enhancedNode - accepts NodeLikeObject. Use case - if it quacks like a Node, if it walks like a Node, it is a NodeLikeObject.
[2022-06-28][1.1.3] 
    1. isSimplifiedNode - accepts a POJO with { relationships: { inbound: [], outbound: [] } } prop. So that Mango.buildAndMergeEnhancedNodes does not fail at _processRelationship when given a decent POJO by the frontend as a partnerNode for a relationship. 