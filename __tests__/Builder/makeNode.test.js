/* @flow */

import {
    Builder,
    Node,
    NodeCandidate,
    isNode,
    log
  } from '../../src';
  
  import cloneDeep from 'lodash/cloneDeep';
  
  const builder = new Builder();

  describe('makeNodes helper method', () => {
      test('make a simple Node', async () => {
        const node: Node = builder.makeNode(['PERSON'], {
            FIRST_NAME: "Matvey",
            LAST_NAME: "Medvedev",
            DOB: [2018, 10, 21]
        })
        expect(isNode(node)).toEqual(true)
      })
  })