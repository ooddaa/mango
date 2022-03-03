/* @flow */

import {
  Builder,
  Node,
  getResultData,
  PartialNode,
  isSuccess,
  log,
  isPartialNode
} from '../../src'

import cloneDeep from 'lodash/cloneDeep'

const _date_created = [
  expect.any(Number),
  expect.any(Number),
  expect.any(Number),
  expect.any(Number),
  expect.any(Number)],
  _uuid = expect.any(String),
  _hash = expect.any(String),
  identity = { low: expect.any(Number), high: 0 }

describe('validations', () => {
  // test('', async () => {})
})
describe('takes (nodeObj|enodeObj)[] as input as of [2020-04-17]', () => {
  test('test simple pnode', async () => {
    const result: Result[] = await new Builder().buildPartialNodes([
      {
        labels: ['BJJ'],  // 12 copies
        properties: {
          required: {
            A: {
              // isDate: false,
              // isRange: false,
              // isCondition: false,
              type: 'property',
              key: 'A',
              value: [1]
            }
          }
        }
      },
      {
        labels: ['JUDO'], // 12 copies
        properties: {
          A: {
            isDate: false,
            isRange: false,
            isCondition: false,
            type: 'property',
            key: 'A',
            value: [2]
          },
          B: {
            isDate: false,
            isRange: false,
            isCondition: false,
            type: 'property',
            key: 'B',
            value: [2]
          }
        }
      },
    ])

    expect(result).toBeInstanceOf(Array)
    expect(result.every(isSuccess)).toEqual(true)

    const [pnode1, pnode2] = result.map(getResultData)
    expect([pnode1, pnode2].every(isPartialNode)).toEqual(true)

    /* pnode1 */
    expect(pnode1).toMatchObject(/* PartialNode */ {
      labels: ['BJJ'],
      properties:
      {
        A:
        {
          isDate: false,
          isRange: false,
          isCondition: false,
          type: 'property',
          key: 'A',
          value: [1]
        },
        _label: 'BJJ',
        _date_created,
        _hash
      },
      identity: null,
    })

    /* pnode2 */
    expect(pnode2).toMatchObject(/* PartialNode */ {
      labels: ['JUDO'],
      properties:
      {
        A:
        {
          isDate: false,
          isRange: false,
          isCondition: false,
          type: 'property',
          key: 'A',
          value: [2]
        },
        B:
        {
          isDate: false,
          isRange: false,
          isCondition: false,
          type: 'property',
          key: 'B',
          value: [2]
        },
        _label: 'JUDO',
        _date_created,
        _hash
      },
      identity: null,
    })
  })
  test('conditions only', async () => {

    const result: Result[] = await new Builder().buildPartialNodes([
      {
        labels: ['JUDO'],
        properties: {
          required: {
            A: {
              isDate: false,
              isRange: false,
              isCondition: true,
              type: 'property',
              key: 'A',
              value: [
                {
                  get: 1, // >=
                  let: 3, // <=
                  // '>=': 1
                }
              ]
            }
          }
        }
      },
      {
        labels: ['BJJ'], // A = 2 and B > 1 and B < 3 (=> B = 2) = 12 copies
        properties: {
          A: {
            isDate: false,
            isRange: false,
            isCondition: false,
            type: 'property',
            key: 'A',
            value: [2]
          },
          B: {
            isDate: false,
            isRange: false,
            isCondition: true,
            type: 'property',
            key: 'B',
            value: [
              {
                gt: 1,
                lt: 3
              }
            ]
          }
        }
      },
    ])
    expect(result).toBeInstanceOf(Array)
    expect(result.every(isSuccess)).toEqual(true)

    const [pnode1, pnode2] = result.map(getResultData)
    expect([pnode1, pnode2].every(isPartialNode)).toEqual(true)
    // log(pnode1)
    /* pnode1 */
    expect(pnode1).toMatchObject(/* PartialNode */ {
      labels: ['JUDO'],
      properties:
      {
        A:
        {
          isDate: false,
          isRange: false,
          isCondition: true,
          type: 'property',
          key: 'A',
          value: [{ get: 1, let: 3 }]
        },
        _label: 'JUDO',
        _date_created,
        _hash
      },
      identity: null,
    })

    /* pnode2 */
    expect(pnode2).toMatchObject(/* PartialNode */ {
      labels: ['BJJ'],
      properties:
      {
        A:
        {
          isDate: false,
          isRange: false,
          isCondition: false,
          type: 'property',
          key: 'A',
          value: [2]
        },
        B:
        {
          isDate: false,
          isRange: false,
          isCondition: true,
          type: 'property',
          key: 'B',
          value: [{ gt: 1, lt: 3 }]
        },
        _label: 'BJJ',
        _date_created,
        _hash
      },
      identity: null,
    })
  })
  test('one date', async () => {
    const result: Result[] = await new Builder().buildPartialNodes([
      {
        labels: ['JUDO'],  // 1 copy
        properties: {
          required: {
            DAY: {
              isDate: true,
              isRange: false,
              isCondition: false,
              type: 'DAY',
              key: 'DAY',
              value: [2018, 1, 1, 1, 123]
            }
          }
        }
      },
    ])

    expect(result).toBeInstanceOf(Array)
    expect(result.every(isSuccess)).toEqual(true)

    const [pnode1] = result.map(getResultData)
    expect([pnode1].every(isPartialNode)).toEqual(true)

    /* pnode1 */
    expect(pnode1).toMatchObject(/* PartialNode */ {
      labels: ['JUDO'],
      properties:
      {
        DAY:
        {
          isDate: true,
          isRange: false,
          isCondition: false,
          type: 'DAY',
          key: 'DAY',
          value: [2018, 1, 1, 1, 123]
        },
        _label: 'JUDO',
        _date_created,
        _hash
      },
      identity: null,
    })
  })
  test('one date range', async () => {
    const result: Result[] = await new Builder().buildPartialNodes([
      {
        labels: ['BJJ'], // 31 copies
        properties: {
          DAY: {
            isDate: true,
            isRange: true,
            isCondition: false,
            type: 'DAY',
            key: 'DAY',
            value: [{
              from: [2018, 1, 1, 1, 123],
              to: [2018, 3, 31, 1, 123]
            }]
          },
        }
      },
    ])

    expect(result).toBeInstanceOf(Array)
    expect(result.every(isSuccess)).toEqual(true)

    const [pnode1] = result.map(getResultData)
    expect([pnode1].every(isPartialNode)).toEqual(true)

    /* pnode1 */
    expect(pnode1).toMatchObject(/* PartialNode */ {
      labels: ['BJJ'],
      properties:
      {
        DAY:
        {
          isDate: true,
          isRange: true,
          isCondition: false,
          type: 'DAY',
          key: 'DAY',
          value:
            [{ from: [2018, 1, 1, 1, 123], to: [2018, 3, 31, 1, 123] }]
        },
        _label: 'BJJ',
        _date_created,
        _hash
      },
      identity: null,
    })

  })
  test('label only', async () => {
    const result: Result[] = await new Builder().buildPartialNodes([
      {
        labels: ['BJJ'],
        properties: {}
      },
    ])
    expect(result).toBeInstanceOf(Array)
    expect(result.every(isSuccess)).toEqual(true)

    const [pnode1] = result.map(getResultData)
    expect([pnode1].every(isPartialNode)).toEqual(true)

    expect(pnode1).toMatchObject(/* PartialNode */ {
      labels: ['BJJ'],
      properties:
      {
        _label: 'BJJ',
        _date_created
      },
      identity: null,
    })
  })
  test('no labels', async () => {
    const results: Result[] = await new Builder().buildPartialNodes([
      {
        labels: [''], // @todo matchPartialNodes cannot create PartialNode without labels.
        properties: {
          required: {
            DAY: {
              isDate: true,
              type: 'DAY',
              key: 'DAY',
              value: [2018, 1, 1, 1, 1]
            }
          }
        }
      },
      {
        labels: [], // @todo matchPartialNodes cannot create PartialNode without labels.
        properties: {
          required: {
            DAY: {
              isDate: true,
              type: 'DAY',
              key: 'DAY',
              value: [2018, 1, 1, 1, 1]
            }
          }
        }
      },
    ])
    expect(results).toBeInstanceOf(Array)
    expect(results.every(isSuccess)).toEqual(true)

    const [pnode1, pnode2] = results.map(getResultData)
    expect([pnode1, pnode2].every(isPartialNode)).toEqual(true)

    expect(pnode1).toMatchObject(/* PartialNode */ {
      labels: [''],
      properties: {
        DAY: {
          isDate: true,
          type: 'DAY',
          key: 'DAY',
          value: [2018, 1, 1, 1, 1],
          isCondition: false,
          isRange: false
        },
        _label: '',
        _date_created,
        _hash: expect.any(String)
      },
      identity: null
    })

    // currently does not remove 
    expect(pnode2).toMatchObject(/* PartialNode */ {
      labels: [],
      properties: {
        DAY: {
          isDate: true,
          type: 'DAY',
          key: 'DAY',
          value: [2018, 1, 1, 1, 1],
          isCondition: false,
          isRange: false
        },
        _label: null,
        _date_created,
        _hash: expect.any(String)
      },
      identity: null
    })
  })
  test('properties with conditions + date range', async () => {
    /**
     * FOR literals use '=' or 'in'
     * FOR arrays use 'contains'/'not_contains'
     */
    const [IN, NOT, IN_NOT, CONTAINS, CONTAINS_LET_, NOT_CONTAINS_LT, VODKA_JON]: PartialNode[] =
      await new Builder().buildPartialNodes([
        {
          labels: ['Test'], // IN
          properties: {
            DAY: {
              isDate: true,
              isRange: true,
              isCondition: false,
              type: 'DAY',
              key: 'DAY',
              value: [{
                from: [2018, 1, 1, 1, 123],
                to: [2018, 3, 31, 1, 123]
              }]
            },
            NAME: {
              isDate: false,
              isRange: false,
              isCondition: true,
              type: 'string',
              key: 'NAME',
              value: [
                {
                  in: ['Jon', 'Barbara']
                }
              ]
            }
          }
        },
        {
          labels: ['Test'], // NOT
          properties: {
            DAY: {
              isDate: true,
              isRange: true,
              isCondition: false,
              type: 'DAY',
              key: 'DAY',
              value: [{
                from: [2018, 1, 1, 1, 123],
                to: [2019, 3, 31, 1, 123]
              }]
            },
            B: {
              isDate: false,
              isRange: false,
              isCondition: true,
              type: 'number',
              key: 'B',
              value: [
                {
                  not: [2, 3]
                }
              ]
            }
          }
        },
        {
          labels: ['Test'], // IN_NOT
          properties: {
            DAY: {
              isDate: true,
              isRange: true,
              isCondition: false,
              type: 'DAY',
              key: 'DAY',
              value: [{
                from: [2018, 1, 1, 1, 123],
                to: [2019, 3, 31, 1, 123]
              }]
            },
            NAME: {
              isDate: false,
              isRange: false,
              isCondition: true,
              type: 'string',
              key: 'NAME',
              value: [
                {
                  in: ['Jon', 'Barbara'],
                }
              ]
            },
            B: {
              isDate: false,
              isRange: false,
              isCondition: true,
              type: 'number',
              key: 'B',
              value: [
                {
                  not: [2, 3]
                }
              ]
            }
          }
        },
        {
          // CONTAINS
          // D is array that contains ['kiwi', 'wine'] == 4
          labels: ['Test'],
          properties: {
            DAY: {
              isDate: true,
              isRange: true,
              isCondition: false,
              type: 'DAY',
              key: 'DAY',
              value: [{
                from: [2018, 1, 1, 1, 123],
                to: [2019, 3, 31, 1, 123]
              }]
            },
            D: {
              isDate: false,
              isRange: false,
              isCondition: true,
              type: 'string[]',
              key: 'D',
              value: [
                {
                  contains: ['kiwi', 'wine']
                }
              ]
            }
          }
        },
        {
          // CONTAINS_LET_
          // D is array that contains ['kiwi', 'wine'] (4) less 1 that is B = 4 finds 3  
          labels: ['Test'],
          properties: {
            DAY: {
              isDate: true,
              isRange: true,
              isCondition: false,
              type: 'DAY',
              key: 'DAY',
              value: [{
                from: [2018, 1, 1, 1, 123],
                to: [2019, 3, 31, 1, 123]
              }]
            },
            B: {
              isDate: false,
              isRange: false,
              isCondition: true,
              type: 'number',
              key: 'B',
              value: [
                {
                  '<=': [3]
                }
              ]
            },
            D: {
              isDate: false,
              isRange: false,
              isCondition: true,
              type: 'STRING[]',
              key: 'D',
              value: [
                {
                  contains: ['kiwi', 'wine']
                }
              ]
            },
          }
        },
        {
          // NOT_CONTAINS_LT
          // B < 4 and D not_contains ['vodka', 'kiwi', 'beer'] == 1 node
          labels: ['Test'],
          properties: {
            DAY: {
              isDate: true,
              isRange: true,
              isCondition: false,
              type: 'DAY',
              key: 'DAY',
              value: [{
                from: [2018, 1, 1, 1, 123],
                to: [2019, 3, 31, 1, 123]
              }]
            },
            B: {
              isDate: false,
              isRange: false,
              isCondition: true,
              type: 'number',
              key: 'B',
              value: [
                {
                  '<': [4]
                }
              ]
            },
            D: {
              isDate: false,
              isRange: false,
              isCondition: true,
              type: 'STRING[]',
              key: 'D',
              value: [
                {
                  not_contains: ['vodka', 'kiwi', 'beer']
                }
              ]
            },
          }
        },
        {
          // VODKA_JON
          // C == true AND D contains ['vodka'] AND NAME NOT ['Barbara', 'Peter', 'lol'] === 1 node
          labels: ['Test'],
          properties: {
            DAY: {
              isDate: true,
              isRange: true,
              isCondition: false,
              type: 'DAY',
              key: 'DAY',
              value: [{
                from: [2018, 1, 1, 1, 123],
                to: [2019, 3, 31, 1, 123]
              }]
            },
            C: {
              isDate: false,
              isRange: false,
              isCondition: true,
              type: 'boolean',
              key: 'C',
              value: [
                {
                  '=': [true]
                }
              ]
            },
            D: {
              isDate: false,
              isRange: false,
              isCondition: true,
              type: 'property',
              key: 'D',
              value: [
                {
                  contains: ['vodka']
                }
              ]
            },
            NAME: {
              isDate: false,
              isRange: false,
              isCondition: true,
              type: 'string[]',
              key: 'NAME',
              value: [
                {
                  not: ['Barbara', 'Peter', 'lol'],
                }
              ]
            },
          }
        },
      ], { extract: true })

    expect(IN).toBeInstanceOf(PartialNode)
    expect(IN).toMatchObject(/* PartialNode */ {
      labels: ['Test'],
      properties:
      {
        DAY:
        {
          isDate: true,
          isRange: true,
          isCondition: false,
          type: 'DAY',
          key: 'DAY',
          value:
            [{ from: [2018, 1, 1, 1, 123], to: [2018, 3, 31, 1, 123] }]
        },
        NAME:
        {
          isDate: false,
          isRange: false,
          isCondition: true,
          type: 'string',
          key: 'NAME',
          value: [{ in: ['Jon', 'Barbara'] }]
        },
        _label: 'Test',
        _date_created,
        _hash
      },
      identity: null,
    })

    expect(NOT).toBeInstanceOf(PartialNode)
    expect(NOT).toMatchObject(/* PartialNode */ {
      labels: ['Test'],
      properties:
      {
        DAY:
        {
          isDate: true,
          isRange: true,
          isCondition: false,
          type: 'DAY',
          key: 'DAY',
          value:
            [{ from: [2018, 1, 1, 1, 123], to: [2019, 3, 31, 1, 123] }]
        },
        B:
        {
          isDate: false,
          isRange: false,
          isCondition: true,
          type: 'number',
          key: 'B',
          value: [{ not: [2, 3] }]
        },
        _label: 'Test',
        _date_created,
        _hash
      },
      identity: null,
    })

    expect(IN_NOT).toBeInstanceOf(PartialNode)
    expect(IN_NOT).toMatchObject(/* PartialNode */ {
      labels: ['Test'],
      properties:
      {
        DAY:
        {
          isDate: true,
          isRange: true,
          isCondition: false,
          type: 'DAY',
          key: 'DAY',
          value:
            [{ from: [2018, 1, 1, 1, 123], to: [2019, 3, 31, 1, 123] }]
        },
        NAME:
        {
          isDate: false,
          isRange: false,
          isCondition: true,
          type: 'string',
          key: 'NAME',
          value: [{ in: ['Jon', 'Barbara'] }]
        },
        B:
        {
          isDate: false,
          isRange: false,
          isCondition: true,
          type: 'number',
          key: 'B',
          value: [{ not: [2, 3] }]
        },
        _label: 'Test',
        _date_created,
        _hash
      },
      identity: null,
    })

    expect(CONTAINS).toBeInstanceOf(PartialNode)
    expect(CONTAINS).toMatchObject(/* PartialNode */ {
      labels: ['Test'],
      properties:
      {
        DAY:
        {
          isDate: true,
          isRange: true,
          isCondition: false,
          type: 'DAY',
          key: 'DAY',
          value:
            [{ from: [2018, 1, 1, 1, 123], to: [2019, 3, 31, 1, 123] }]
        },
        D:
        {
          isDate: false,
          isRange: false,
          isCondition: true,
          type: 'string[]',
          key: 'D',
          value: [{ contains: ['kiwi', 'wine'] }]
        },
        _label: 'Test',
        _date_created,
        _hash
      },
      identity: null,
    })

    expect(CONTAINS_LET_).toBeInstanceOf(PartialNode)
    expect(CONTAINS_LET_).toMatchObject(/* PartialNode */ {
      labels: ['Test'],
      properties:
      {
        DAY:
        {
          isDate: true,
          isRange: true,
          isCondition: false,
          type: 'DAY',
          key: 'DAY',
          value:
            [{ from: [2018, 1, 1, 1, 123], to: [2019, 3, 31, 1, 123] }]
        },
        B:
        {
          isDate: false,
          isRange: false,
          isCondition: true,
          type: 'number',
          key: 'B',
          value: [{ '<=': [3] }]
        },
        D:
        {
          isDate: false,
          isRange: false,
          isCondition: true,
          type: 'STRING[]',
          key: 'D',
          value: [{ contains: ['kiwi', 'wine'] }]
        },
        _label: 'Test',
        _date_created,
        _hash
      },
      identity: null,
    })

    expect(NOT_CONTAINS_LT).toBeInstanceOf(PartialNode)
    expect(NOT_CONTAINS_LT).toMatchObject(/* PartialNode */ {
      labels: ['Test'],
      properties:
      {
        DAY:
        {
          isDate: true,
          isRange: true,
          isCondition: false,
          type: 'DAY',
          key: 'DAY',
          value:
            [{ from: [2018, 1, 1, 1, 123], to: [2019, 3, 31, 1, 123] }]
        },
        B:
        {
          isDate: false,
          isRange: false,
          isCondition: true,
          type: 'number',
          key: 'B',
          value: [{ '<': [4] }]
        },
        D:
        {
          isDate: false,
          isRange: false,
          isCondition: true,
          type: 'STRING[]',
          key: 'D',
          value: [{ not_contains: ['vodka', 'kiwi', 'beer'] }]
        },
        _label: 'Test',
        _date_created,
        _hash
      },
      identity: null,
    })

    expect(VODKA_JON).toBeInstanceOf(PartialNode)
    expect(VODKA_JON).toMatchObject(/* PartialNode */ {
      labels: ['Test'],
      properties:
      {
        DAY:
        {
          isDate: true,
          isRange: true,
          isCondition: false,
          type: 'DAY',
          key: 'DAY',
          value:
            [{ from: [2018, 1, 1, 1, 123], to: [2019, 3, 31, 1, 123] }]
        },
        C:
        {
          isDate: false,
          isRange: false,
          isCondition: true,
          type: 'boolean',
          key: 'C',
          value: [{ '=': [true] }]
        },
        D:
        {
          isDate: false,
          isRange: false,
          isCondition: true,
          type: 'property',
          key: 'D',
          value: [{ contains: ['vodka'] }]
        },
        NAME:
        {
          isDate: false,
          isRange: false,
          isCondition: true,
          type: 'string[]',
          key: 'NAME',
          value: [{ not: ['Barbara', 'Peter', 'lol'] }]
        },
        _label: 'Test',
        _date_created,
        _hash
      },
      identity: null,
    })
  })
  test('mixed conditions', async () => {
    /* this condition actually doesnt make logical sense, but just to
    illustrate the point. */
    const [pnode] = await new Builder().buildPartialNodes([
      {
        labels: ['Test'], // IN
        properties: {
          NAME: {
            isDate: false,
            isRange: false,
            isCondition: true,
            type: 'string',
            key: 'NAME',
            value: [
              {
                in: ['Jon', 'Barbara'],
                not: ['Lol']
              }
            ]
          }
        }
      },
    ], { extract: true })/* .map(getResultData) */

    expect(pnode).toBeInstanceOf(PartialNode)
    expect(pnode).toMatchObject(/* PartialNode */ {
      labels: ['Test'],
      properties:
      {
        NAME:
        {
          isDate: false,
          isRange: false,
          isCondition: true,
          type: 'string',
          key: 'NAME',
          value: [{ in: ['Jon', 'Barbara'], not: ['Lol'] }]
        },
        _label: 'Test',
        _date_created,
        _hash
      },
      identity: null,
    })
  })
})
describe('simplified input', () => {
  test('test simple pnode', async () => {
    const result: Result[] = await new Builder().buildPartialNodes([
      {
        labels: ['BJJ'],  // 12 copies
        properties: {
          required: {
            A: {
              // isDate: false,
              // isRange: false,
              // isCondition: false,
              type: 'property',
              key: 'A',
              value: [1]
            }
          }
        }
      },
      {
        labels: ['JUDO'], // 12 copies
        properties: {
          A: {
            isDate: false,
            isRange: false,
            isCondition: false,
            type: 'property',
            key: 'A',
            value: [2]
          },
          B: {
            isDate: false,
            isRange: false,
            isCondition: false,
            type: 'property',
            key: 'B',
            value: [2]
          }
        }
      },
    ])

    expect(result).toBeInstanceOf(Array)
    expect(result.every(isSuccess)).toEqual(true)

    const [pnode1, pnode2] = result.map(getResultData)
    expect([pnode1, pnode2].every(isPartialNode)).toEqual(true)

    /* pnode1 */
    expect(pnode1).toMatchObject(/* PartialNode */ {
      labels: ['BJJ'],
      properties:
      {
        A:
        {
          isDate: false,
          isRange: false,
          isCondition: false,
          type: 'property',
          key: 'A',
          value: [1]
        },
        _label: 'BJJ',
        _date_created,
        _hash
      },
      identity: null,
    })

    /* pnode2 */
    expect(pnode2).toMatchObject(/* PartialNode */ {
      labels: ['JUDO'],
      properties:
      {
        A:
        {
          isDate: false,
          isRange: false,
          isCondition: false,
          type: 'property',
          key: 'A',
          value: [2]
        },
        B:
        {
          isDate: false,
          isRange: false,
          isCondition: false,
          type: 'property',
          key: 'B',
          value: [2]
        },
        _label: 'JUDO',
        _date_created,
        _hash
      },
      identity: null,
    })
  })
  test('conditions only', async () => {

    const result: Result[] = await new Builder().buildPartialNodes([
      {
        labels: ['JUDO'],
        properties: {
          required: {
            A: {
              // isDate: false,
              // isRange: false,
              isCondition: true,
              type: 'property',
              key: 'A',
              value: [
                {
                  get: 1, // >=
                  let: 3, // <=
                  // '>=': 1
                }
              ]
            }
          }
        }
      },
      {
        labels: ['BJJ'], // A = 2 and B > 1 and B < 3 (=> B = 2) = 12 copies
        properties: {
          A: {
            // // isDate: false,
            // // isRange: false,
            // isCondition: false,
            type: 'property',
            key: 'A',
            value: [2]
          },
          B: {
            // isDate: false,
            // isRange: false,
            isCondition: true,
            type: 'property',
            key: 'B',
            value: [
              {
                gt: 1,
                lt: 3
              }
            ]
          }
        }
      },
    ])
    expect(result).toBeInstanceOf(Array)
    expect(result.every(isSuccess)).toEqual(true)

    const [pnode1, pnode2] = result.map(getResultData)
    expect([pnode1, pnode2].every(isPartialNode)).toEqual(true)
    // log(pnode1)
    /* pnode1 */
    expect(pnode1).toMatchObject(/* PartialNode */ {
      labels: ['JUDO'],
      properties:
      {
        A:
        {
          isDate: false,
          isRange: false,
          isCondition: true,
          type: 'property',
          key: 'A',
          value: [{ get: 1, let: 3 }]
        },
        _label: 'JUDO',
        _date_created,
        _hash
      },
      identity: null,
    })

    /* pnode2 */
    expect(pnode2).toMatchObject(/* PartialNode */ {
      labels: ['BJJ'],
      properties:
      {
        A:
        {
          isDate: false,
          isRange: false,
          isCondition: false,
          type: 'property',
          key: 'A',
          value: [2]
        },
        B:
        {
          isDate: false,
          isRange: false,
          isCondition: true,
          type: 'property',
          key: 'B',
          value: [{ gt: 1, lt: 3 }]
        },
        _label: 'BJJ',
        _date_created,
        _hash
      },
      identity: null,
    })
  })
  test('one date', async () => {
    const result: Result[] = await new Builder().buildPartialNodes([
      {
        labels: ['JUDO'],  // 1 copy
        properties: {
          required: {
            DAY: {
              isDate: true,
              // isRange: false,
              // isCondition: false,
              type: 'DAY',
              key: 'DAY',
              value: [2018, 1, 1, 1, 123]
            }
          }
        }
      },
    ])

    expect(result).toBeInstanceOf(Array)
    expect(result.every(isSuccess)).toEqual(true)

    const [pnode1] = result.map(getResultData)
    expect([pnode1].every(isPartialNode)).toEqual(true)

    /* pnode1 */
    expect(pnode1).toMatchObject(/* PartialNode */ {
      labels: ['JUDO'],
      properties:
      {
        DAY:
        {
          isDate: true,
          isRange: false,
          isCondition: false,
          type: 'DAY',
          key: 'DAY',
          value: [2018, 1, 1, 1, 123]
        },
        _label: 'JUDO',
        _date_created,
        _hash
      },
      identity: null,
    })
  })
  test('one date range', async () => {
    const result: Result[] = await new Builder().buildPartialNodes([
      {
        labels: ['BJJ'], // 31 copies
        properties: {
          DAY: {
            isDate: true,
            isRange: true,
            // isCondition: false,
            type: 'DAY',
            key: 'DAY',
            value: [{
              from: [2018, 1, 1, 1, 123],
              to: [2018, 3, 31, 1, 123]
            }]
          },
        }
      },
    ])

    expect(result).toBeInstanceOf(Array)
    expect(result.every(isSuccess)).toEqual(true)

    const [pnode1] = result.map(getResultData)
    expect([pnode1].every(isPartialNode)).toEqual(true)

    /* pnode1 */
    expect(pnode1).toMatchObject(/* PartialNode */ {
      labels: ['BJJ'],
      properties:
      {
        DAY:
        {
          isDate: true,
          isRange: true,
          isCondition: false,
          type: 'DAY',
          key: 'DAY',
          value:
            [{ from: [2018, 1, 1, 1, 123], to: [2018, 3, 31, 1, 123] }]
        },
        _label: 'BJJ',
        _date_created,
        _hash
      },
      identity: null,
    })
  })
})