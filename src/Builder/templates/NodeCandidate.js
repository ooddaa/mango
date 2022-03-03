/* @flow */
"use strict";

import { Node, isNodeObj, isNode } from './Node';
import { Relationship } from './Relationship';
import { Failure } from '../../Result';
import { setDateCreated, log } from "../../"

import cloneDeep from 'lodash/cloneDeep';
import isObject from 'lodash/isObject';

/**
 * @todo 2020-06-06 add default _isCurrent props. By default every NC is considered current,
 * non updated. It is turned into updatee/updator by Engine.updateNodes. But I'd like to 
 * set defaults from the beginning of Node's life, ie here.
 */
class NodeCandidate {
    coreNode: Object | Failure
    constructor(coreNode: Object) {
        this.coreNode = coreNode
        this.setDefaultProperties()
    }


    setDefaultProperties(): void {
        const coreNode = this.getCoreNode()
        if (!coreNode || !isObject(coreNode)) return
        coreNode.properties = {
            required: {},
            optional: {},
            _private: {},
            ...coreNode.properties,
        }
    }
}

/**
 * Gives immutable access to coreNode. 
 * @public
 */
function getCoreNode(): Object | Node {
    return this.coreNode
}
NodeCandidate.prototype.getCoreNode = getCoreNode

/**
 * Sets coreNode. 
 * Useful for buildEnhancedNodes, as it seems that I cannot just
 * mutate object returned by getCoreNode, unless it's wrapped in []
 * @public
 */
function setCoreNode(newCoreNode: Object | Node): void {
    this.coreNode = newCoreNode
}
NodeCandidate.prototype.setCoreNode = setCoreNode

/**
 * Important method that promotes NC to Node! Nodes should only be created via this method.
 */
function toNode(): Node {
    /* I should check first what is it that I want to become a Node */
    if (isNode(this.getCoreNode())) {
        return this.getCoreNode()
    }
    if (!isNodeObj(this.getCoreNode())) {
        throw new Error(`NodeCandidate.toNode: this NC is not a NodeObject.\n\n${JSON.stringify(this)}`)
    }

    const { labels, properties: { required, optional }, identity } = this.getCoreNode()

    let properties = {
        ...required,
        _label: labels[0],
        _date_created: setDateCreated(),
        // _isCurrent: true,
        // _hasBeenUpdated: false,
        // _dateUpdated: null,
        // _userUpdated: null,
        // _nextNodeHash: null,
        // _previousNodeHash: null,
    } // there is always at least an empty {}
    if (optional) {
        properties = { ...properties, ...optional }
    }
    const newNode = new Node({ labels, properties, identity })
    newNode.setHash()
    return newNode
}
NodeCandidate.prototype.toNode = toNode


function isNodeCandidate(val: any): boolean {
    return val instanceof NodeCandidate
}
export { NodeCandidate, isNodeCandidate }


// /* @flow */
// "use strict";

// import { Node, isNodeObj, isNode } from './Node';
// import { Relationship } from './Relationship';
// import { Failure } from '../../Result';
// import { setDateCreated, log } from "../../"

// import cloneDeep from 'lodash/cloneDeep';
// import isObject from 'lodash/isObject';

// /**
//  * @todo 2020-06-06 add default _isCurrent props. By default every NC is considered current,
//  * non updated. It is turned into updatee/updator by Engine.updateNodes. But I'd like to 
//  * set defaults from the beginning of Node's life, ie here.
//  */
// class NodeCandidate {
//     coreNode: Object | Failure
//     constructor(coreNode: Object) {
//         this.coreNode = coreNode
//         this.setDefaultProperties()
//     }
//     /**
//      * Gives immutable access to coreNode. 
//      * @public
//      */
//     getCoreNode(): Object | Node {
//         return this.coreNode
//     }

//     /**
//      * Sets coreNode. 
//      * Useful for buildEnhancedNodes, as it seems that I cannot just
//      * mutate object returned by getCoreNode, unless it's wrapped in []
//      * @public
//      */
//     setCoreNode(newCoreNode: Object | Node): void {
//         this.coreNode = newCoreNode
//     }

//     /**
//      * Important method that promotes NC to Node! Nodes should only be created via this method.
//      */
//     toNode(): Node {
//         /* I should check first what is it that I want to become a Node */
//         if (isNode(this.getCoreNode())) {
//             return this.getCoreNode()
//         }
//         if (!isNodeObj(this.getCoreNode())) {
//             throw new Error(`NodeCandidate.toNode: this NC is not a NodeObject.\n\n${JSON.stringify(this)}`)
//         }

//         const { labels, properties: { required, optional }, identity } = this.getCoreNode()

//         let properties = {
//             ...required,
//             _label: labels[0],
//             _date_created: setDateCreated(),
//             // _isCurrent: true,
//             // _hasBeenUpdated: false,
//             // _dateUpdated: null,
//             // _userUpdated: null,
//             // _nextNodeHash: null,
//             // _previousNodeHash: null,
//         } // there is always at least an empty {}
//         if (optional) {
//             properties = { ...properties, ...optional }
//         }
//         const newNode = new Node({ labels, properties, identity })
//         newNode.setHash()
//         return newNode
//     }

//     setDefaultProperties(): void {
//         const coreNode = this.getCoreNode()
//         // if (!coreNode.properties) {
//         //     coreNode.properties = {
//         //         required: {},
//         //         optional: {},
//         //         _private: {},
//         //     }
//         // } else {
//         if (!coreNode || !isObject(coreNode)) return
//         coreNode.properties = {
//             required: {},
//             optional: {},
//             _private: {},
//             ...coreNode.properties,
//         }
//         // }
//     }
// }

// function isNodeCandidate(val: any): boolean {
//     return val instanceof NodeCandidate
// }
// export { NodeCandidate, isNodeCandidate }