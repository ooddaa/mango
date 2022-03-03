/* @flow */
'use strict';

import {
  Node,
  Relationship,
  EnhancedNode,
  log
} from '../../../src';

const _date_created = [
  expect.any(Number),
  expect.any(Number),
  expect.any(Number),
  expect.any(Number),
  expect.any(Number)],
  _uuid = expect.any(String),
  _hash = expect.any(String),
  identity = { low: expect.any(Number), high: 0 }

describe('methods', () => {
  test('toObject', () => {
    const startNode = new Node({ properties: { a: 'a' } })
    const endNode = new Node({ properties: { b: 'b' } })
    const rel = new Relationship({
      labels: ['TRANSACTION'],
      properties: { date_started: '123', date_ended: '', completed: false },
      startNode,
      endNode
    })
    const result = rel.toObject()
    expect(result).toMatchObject({
      labels: ['TRANSACTION'],
      properties: { date_started: '123', date_ended: '', completed: false },
      startNode,
      endNode,
      identity: null
    })
  })
  test('isWritable', () => {
    const rel = new Relationship({
      labels: ['w_0_1'],
      properties:
      {
        weight: 0,
        _hash:
          'dc69436d4faa311426ca3f06c5066432fb54f8eb6e4632d6975b23fab2d3a8ab',
        _date_created: [2020, 3, 13, 5, 1584110723525]
      },
      startNode:
        new Node({
          labels: ['l_0_0'],
          properties:
          {
            INPUT: 1,
            _label: 'l_0_0',
            _date_created: [2020, 3, 13, 5, 1584110723523],
            _hash:
              '69da7135a1f9104513d2196eefd96f3e2a4646bbbc48280416ddb5f6636be0a5',
          },
          identity: null
        }),
      endNode:
        new Node({
          labels: ['l_1_0'],
          properties:
          {
            INPUT: 0,
            _label: 'l_1_0',
            _date_created: [2020, 3, 13, 5, 1584110723519],
            _hash:
              '98d4eacdda3010054abefc35a7c3881dc56bc1f8e86808189a03c34377043e82',
          },
          identity: null
        }),
      identity: null,
      direction: 'inbound'
    })

    expect(rel.isWritable()).toEqual(true)

    /* now remove _hash */
    rel.properties._hash = undefined
    expect(rel.isWritable()).toEqual(false)
  })
  test('isWriten', () => {
    const rel = new Relationship({
      labels: ['MANAGED_BY'],
      properties:
      {
        _date_created: [2021, 9, 17, 5, 1631877269336],
        DESCRIPTION: '...',
        _hash:
          '2b97cd109f94f8a9579ab568354f0a3093041932492dbfcf58f4ea370d2e7e5b',
        _type: 'MANAGED_BY',
        _necessity: 'optional',
        _uuid: '0fffbf29-b0a8-4925-a6dd-bb337daa1b5b',
        _isCurrent: true,
        _hasBeenUpdated: false
      },
      startNode:
        new EnhancedNode({
          labels: ['BANK_ACCOUNT'],
          properties:
          {
            USD_IBAN: 'CH123',
            DESCRIPTION: 'RIHH UBS accounts',
            _date_created: [2021, 9, 17, 5, 1631877269336],
            _hash:
              '5d4e8cd9a4f8940773442280e1bd2779528329ece46d662333cd70d9cc25b583',
            RUB_IBAN: 'CH456',
            _uuid: '4341d76e-81ce-489f-9689-97b0c7e82061',
            IS_ACTIVE: true,
            _label: 'BANK_ACCOUNT',
            EUR_IBAN: 'CH789'
          },
          identity: /* Integer */ { low: 42, high: 0 },
          relationships: { inbound: [], outbound: [] }
        }),
      endNode:
        new EnhancedNode({
          labels: ['TEAM'],
          properties:
          {
            DESCRIPTION: 'Team manages a number of corporate and private accounts.',
            _hash:
              'd2e5b5614d3fb92bc5a3ac4a2f8b0c96a21b336ee8f191fd349370a2400310f5',
            _date_created: [2021, 9, 17, 5, 1631877269333],
            USED_TO_MANNAGE: ['Mayfair', 'OGH'],
            MANAGES:
              ['Solaris Cy',
                'Fermis',
                'Grunwald',
                'Linopia',
                'LM private',
                'RIHH'],
            _uuid: '200c97f9-95a7-493a-940b-fc829463629c',
            _label: 'TEAM',
            NAME: 'TEAM Kerstin'
          },
          identity: /* Integer */ { low: 0, high: 0 },
          relationships: { inbound: [], outbound: [] }
        }),
      identity: /* Integer */ { low: 148, high: 0 },
      direction: null,
      necessity: 'optional'
    })

    expect(rel.isWritten()).toEqual(true)
  })
  test('areParticipatingNodesIdentified', () => {
    const rel = new Relationship({
      labels: ['w_0_1'],
      properties:
      {
        weight: 0,
        _hash:
          'dc69436d4faa311426ca3f06c5066432fb54f8eb6e4632d6975b23fab2d3a8ab',
        _date_created: [2020, 3, 13, 5, 1584110723525]
      },
      startNode:
        new Node({
          labels: ['l_0_0'],
          properties:
          {
            INPUT: 1,
            _label: 'l_0_0',
            _date_created: [2020, 3, 13, 5, 1584110723523],
            _hash:
              '69da7135a1f9104513d2196eefd96f3e2a4646bbbc48280416ddb5f6636be0a5',
          },
          identity: null
        }),
      endNode:
        new Node({
          labels: ['l_1_0'],
          properties:
          {
            INPUT: 0,
            _label: 'l_1_0',
            _date_created: [2020, 3, 13, 5, 1584110723519],
            _hash:
              '98d4eacdda3010054abefc35a7c3881dc56bc1f8e86808189a03c34377043e82',
          },
          identity: null
        }),
      identity: null,
      direction: 'inbound'
    })

    expect(rel.areParticipatingNodesIdentified()).toEqual(false)

    /* add identity && _uuid */
    rel.startNode.setIdentity({ low: 1, high: 0 })
    rel.startNode.addProperty('_uuid', '123')

    rel.endNode.setIdentity({ low: 2, high: 0 })
    rel.endNode.addProperty('_uuid', '456')
    expect(rel.areParticipatingNodesIdentified()).toEqual(true)
  })
  test('toCypherParameterObj', () => {
    const rel = new Relationship({
      labels: ['w_0_1'],
      properties:
      {
        weight: 0,
        _hash:
          'dc69436d4faa311426ca3f06c5066432fb54f8eb6e4632d6975b23fab2d3a8ab',
        _date_created: [2020, 3, 13, 5, 1584110723525]
      },
      startNode:
        new Node({
          labels: ['l_0_0'],
          properties:
          {
            INPUT: 1,
            _label: 'l_0_0',
            _date_created: [2020, 3, 13, 5, 1584110723523],
            _hash:
              '69da7135a1f9104513d2196eefd96f3e2a4646bbbc48280416ddb5f6636be0a5',
          },
          identity: { low: 1, high: 0 }
        }),
      endNode:
        new Node({
          labels: ['l_1_0'],
          properties:
          {
            INPUT: 0,
            _label: 'l_1_0',
            _date_created: [2020, 3, 13, 5, 1584110723519],
            _hash:
              '98d4eacdda3010054abefc35a7c3881dc56bc1f8e86808189a03c34377043e82',
          },
          identity: { low: 2, high: 0 }
        }),
      identity: { low: 3, high: 0 },
      direction: 'inbound'
    })
    expect(rel.toCypherParameterObj()).toMatchObject({
      startNode_id: rel.getStartNodeId(),
      startNode_hash: rel.getStartNodeHash(),
      endNode_id: rel.getEndNodeId(),
      endNode_hash: rel.getEndNodeHash(),
      properties: rel.getProperties()
    })
  })
  describe('setHash', () => {
    test('success if start/endNodes have their _hashes', () => {
      const rel = {
        labels: ['TRANSACTION'],
        properties:
        { /* _temporary_uuid: '3cad19db-306c-4682-bdc6-c2fb75ee6d38',
              _hash: undefined,
              _date_created: [ 2019, 2, 28, 4, 1551358055827 ]  */},
        startNode:
          new Node({
            labels: ['Day'],
            properties:
            {
              YEAR: 2018,
              MONTH: 1,
              DAY: 1,
              _date_created: [2019, 2, 28, 4, 1551358055827],
              _label: 'Day',
              _temporary_uuid: '4995853d-a488-46dd-9c44-e6b8d51ea9be',
              _hash:
                '4cf8bfecf81f792baed7a153120d4143986f5e050267ca20a8291404822deb4d'
            },
            identity: null
          }),
        endNode:
          new Node({
            labels: ['Transaction'],
            properties:
            {
              DATE_SENT: [2018, 1, 1, 1, 123],
              PROJECT: 'A',
              TOTAL_AMOUNT: 1000,
              SUM_AMOUNT: 900,
              FEES_AMOUNT: 100,
              CURRENCY: 'USD',
              BANK: 'Bank_A',
              PAYOR: 'Payor_A',
              PAYEE: 'Payee_A',
              PAYMENT_REFERENCE: 'A2018111',
              _date_created: [2019, 2, 28, 4, 1551358055822],
              _label: 'Transaction',
              _temporary_uuid: 'c5f42052-9091-45cf-9710-bffd4290cac8',
              _hash:
                'e2a333905caa456a0b9eb75f72f6f6c065143da8547a8653ee66c06960c40c24'
            },
            identity: null
          }),
        identity: null
      }
      const result = new Relationship({
        ...rel
      })
      /* it sets _hash automatically */
      expect(result.getHash()).toBeTruthy()
    })
    test('undefined if start/endNodes dont have _hashes', () => {
      const rel = {
        labels: ['TRANSACTION'],
        properties:
        { /* _temporary_uuid: '3cad19db-306c-4682-bdc6-c2fb75ee6d38',
              _hash: undefined,
              _date_created: [ 2019, 2, 28, 4, 1551358055827 ]  */},
        startNode:
          new Node({
            labels: ['Day'],
            properties:
            {
              YEAR: 2018,
              MONTH: 1,
              DAY: 1,
              _date_created: [2019, 2, 28, 4, 1551358055827],
              _label: 'Day',
              _temporary_uuid: '4995853d-a488-46dd-9c44-e6b8d51ea9be',
                  /* _hash:
                  '4cf8bfecf81f792baed7a153120d4143986f5e050267ca20a8291404822deb4d' */ },
            identity: null
          }),
        endNode:
          new Node({
            labels: ['Transaction'],
            properties:
            {
              DATE_SENT: [2018, 1, 1, 1, 123],
              PROJECT: 'A',
              TOTAL_AMOUNT: 1000,
              SUM_AMOUNT: 900,
              FEES_AMOUNT: 100,
              CURRENCY: 'USD',
              BANK: 'Bank_A',
              PAYOR: 'Payor_A',
              PAYEE: 'Payee_A',
              PAYMENT_REFERENCE: 'A2018111',
              _date_created: [2019, 2, 28, 4, 1551358055822],
              _label: 'Transaction',
              _temporary_uuid: 'c5f42052-9091-45cf-9710-bffd4290cac8',
              _hash:
                'e2a333905caa456a0b9eb75f72f6f6c065143da8547a8653ee66c06960c40c24'
            },
            identity: null
          }),
        identity: null
      }
      const result = new Relationship({
        ...rel
      })
      /* it sets _hash automatically */
      expect(result.getHash()).toBeFalsy()
    })
    test('replaces undefined after setHash() is called', () => {
      const result = new Relationship({
        labels: ['TRANSACTION'],
        properties:
        {
          _hash: undefined,
        },
        startNode:
          new Node({
            labels: ['Day'],
            properties:
            {
              YEAR: 2018,
              MONTH: 1,
              DAY: 1,
              _date_created: [2019, 2, 28, 4, 1551358055827],
              _label: 'Day',
              _temporary_uuid: '4995853d-a488-46dd-9c44-e6b8d51ea9be',
              _hash:
                '4cf8bfecf81f792baed7a153120d4143986f5e050267ca20a8291404822deb4d'
            },
            identity: null
          }),
        // endNode: null,
        direction: 'inbound',
        identity: null
      })

      /* it sets _hash automatically if all _hashes exist */
      expect(result.getHash()).toBeFalsy()
      result.endNode = new Node({
        labels: ['Transaction'],
        properties:
        {
          DATE_SENT: [2018, 1, 1, 1, 123],
          PROJECT: 'A',
          TOTAL_AMOUNT: 1000,
          SUM_AMOUNT: 900,
          FEES_AMOUNT: 100,
          CURRENCY: 'USD',
          BANK: 'Bank_A',
          PAYOR: 'Payor_A',
          PAYEE: 'Payee_A',
          PAYMENT_REFERENCE: 'A2018111',
          _date_created: [2019, 2, 28, 4, 1551358055822],
          _label: 'Transaction',
          _temporary_uuid: 'c5f42052-9091-45cf-9710-bffd4290cac8',
          _hash:
            'e2a333905caa456a0b9eb75f72f6f6c065143da8547a8653ee66c06960c40c24'
        },
        identity: null
      })
      result.setHash()
      expect(result.getHash()).toBeTruthy()
    })
    test('include required properties into hash', () => {
      // rel1 has prop = 0, rel2 has prop = 1
      const rel1 = new Relationship({
        labels: ['w_0_1'],
        properties:
        {
          REQIREDPROP: 0,
          _date_created: [2020, 3, 13, 5, 1584110723525]
        },
        startNode:
          new Node({
            labels: ['l_0_0'],
            properties:
            {
              INPUT: 1,
              _label: 'l_0_0',
              _date_created: [2020, 3, 13, 5, 1584110723523],
              _hash:
                '69da7135a1f9104513d2196eefd96f3e2a4646bbbc48280416ddb5f6636be0a5',
            },
            identity: { low: 1, high: 0 }
          }),
        endNode:
          new Node({
            labels: ['l_1_0'],
            properties:
            {
              INPUT: 0,
              _label: 'l_1_0',
              _date_created: [2020, 3, 13, 5, 1584110723519],
              _hash:
                '98d4eacdda3010054abefc35a7c3881dc56bc1f8e86808189a03c34377043e82',
            },
            identity: { low: 2, high: 0 }
          }),
        identity: { low: 3, high: 0 },
        direction: 'inbound'
      })
      const rel2 = new Relationship({
        labels: ['w_0_1'],
        properties:
        {
          REQIREDPROP: 1,
          _date_created: [2020, 3, 13, 5, 1584110723525]
        },
        startNode:
          new Node({
            labels: ['l_0_0'],
            properties:
            {
              INPUT: 1,
              _label: 'l_0_0',
              _date_created: [2020, 3, 13, 5, 1584110723523],
              _hash:
                '69da7135a1f9104513d2196eefd96f3e2a4646bbbc48280416ddb5f6636be0a5',
            },
            identity: { low: 1, high: 0 }
          }),
        endNode:
          new Node({
            labels: ['l_1_0'],
            properties:
            {
              INPUT: 0,
              _label: 'l_1_0',
              _date_created: [2020, 3, 13, 5, 1584110723519],
              _hash:
                '98d4eacdda3010054abefc35a7c3881dc56bc1f8e86808189a03c34377043e82',
            },
            identity: { low: 2, high: 0 }
          }),
        identity: { low: 3, high: 0 },
        direction: 'inbound'
      })

      /* old style - both hashes will be same */
      rel1.setHash()
      rel2.setHash()

      expect(rel1.getHash()).toEqual(rel2.getHash())

      /* old style - both hashes will be same */
      rel1.setHash('gibberish')
      rel2.setHash('gibberish')

      expect(rel1.getHash()).toEqual(rel2.getHash())

      /* new style - hashes differ due to properties */
      rel1.setHash('all')
      rel2.setHash('all')
      expect(rel1.getHash()).not.toEqual(rel2.getHash())
    })
  })
  describe('toString', () => {
    test('Relationship.toString() one label, not upperCased', () => {
      const relationship = new Relationship({ labels: ['Transaction'], dev: true })
      const result = relationship.toString()
      const expected = `:TRANSACTION {_hash: 'undefined'}` // do I want {_hash: 'undefined'} here?
      expect(result).toEqual(expected)
    })
    test('Relationship.toString() one label, not upperCased', () => {
      const relationship = new Relationship({ labels: ['Transaction'], dev: true })
      const result = relationship.toString()
      const expected = `:TRANSACTION {_hash: 'undefined'}` // do I want {_hash: 'undefined'} here?
      expect(result).toEqual(expected)
    })

    test('Relationship.toString() one label, upperCased', () => {
      const relationship = new Relationship({ labels: ['TRANSACTION'], dev: true })
      const result = relationship.toString()
      const expected = `:TRANSACTION {_hash: 'undefined'}`
      expect(result).toEqual(expected)
    })

    test('Relationship.toString() one label one property', () => {
      const relationship = new Relationship({ labels: ['Transaction'], properties: { name: 'UK' }, dev: true })
      const result = relationship.toString()
      const expected = `:TRANSACTION {name: 'UK', _hash: 'undefined'}`
      expect(result).toEqual(expected)
    })

    test('Relationship.toString() one label many properties', () => {
      const relationship = new Relationship({ labels: ['PERSON'], properties: { name: 'Jon', surname: 'Doe', nickname: 'jd', from_date: '13/06/1958', to_date: 'now' }, dev: true })
      const result = relationship.toString()
      const expected = `:PERSON {name: 'Jon', surname: 'Doe', nickname: 'jd', from_date: '13/06/1958', to_date: 'now', _hash: 'undefined'}`
      expect(result).toEqual(expected)
    })
  })
})

