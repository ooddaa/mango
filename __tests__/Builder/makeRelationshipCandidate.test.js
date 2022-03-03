/* @flow */

import {
  Builder,
  Node,
  isNode,
  RelationshipCandidate,
  log
} from '../../src';

import cloneDeep from 'lodash/cloneDeep';

const builder = new Builder();

describe('makeRelationshipCandidate helper method', () => {
  test('make a RelationshipCandidate', async () => {
    const node: Node = builder.makeNode(['PERSON'], {
      FIRST_NAME: "Matvey",
      LAST_NAME: "Medvedev",
      DOB: [2018, 10, 21]
    })
    expect(isNode(node)).toEqual(true);

    const result: RelationshipCandidate = builder.makeRelationshipCandidate(['REL_TYPE'],
      {
        REQUIREDPROP: 1,
        optionalProp: 2,
        _privateProp: 3,
      },
      'outbound',
      node
    );
    expect(result).toBeInstanceOf(RelationshipCandidate);

  })
})