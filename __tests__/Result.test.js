/* @flow */

import {
    Result,
    Success,
    Failure,
    isResult,
    isPending,
    isSuccess,
    isFailure,
    log
} from '../src/';

describe('Testing Result', () => {
    test('Result may be undefined', () => {
        const result = new Result({})
        expect(result == true).toEqual(false)
        expect(result == false).toEqual(false)
        expect(result == undefined).toEqual(false)
        expect(undefined == undefined).toEqual(true)
    })
})
describe('Testing Success', () => {
    test('Success should return true', () => {
        const success = new Success()
        expect(success.success).toBeTruthy()
        expect(!!success).toBeTruthy()
        expect(success == true).toBeTruthy()
    })
    describe('methods', () => {
        test('1', () => {
            const success1 = new Success()
            expect(success1.getReason()).toEqual(undefined)
            expect(success1.getParameters()).toEqual(undefined)
            expect(success1.getData()).toEqual(undefined)
        })
        test('2', () => {
            const success2 = new Success({})
            expect(success2.getReason()).toEqual(undefined)
            expect(success2.getParameters()).toEqual(undefined)
            expect(success2.getData()).toEqual(undefined)
        })
        test('3', () => {
            const success3 = new Success([])
            expect(success3.getReason()).toEqual(undefined)
            expect(success3.getParameters()).toEqual(undefined)
            expect(success3.getData()).toEqual(undefined)
        })
        test('4', () => {
            const success4 = new Success({ reason: 'foo', parameters: { first: 'a', 'second': [] }, data: [1, 2, 3] })
            expect(success4.getReason()).toEqual('foo')
            expect(success4.getParameters()).toMatchObject({
                first: 'a',
                'second': []
            })
            expect(success4.getData()).toEqual([1, 2, 3])
        })

    })
})
describe('Testing Failure', () => {
    test('failure', () => {
        const failure1 = new Failure({ reason: 'lol' })
        expect(failure1.getReason()).toEqual('lol')
        expect(failure1.getParameters()).toEqual(undefined)
        expect(failure1.getData()).toEqual(undefined)
    })
    test('Failure should return false', () => {
        const failure = new Failure()
        // expect(failure).toEqual(false)
        expect(failure.success).toBeFalsy()
        expect(failure == false).toEqual(true)
        expect(failure == false).toBeTruthy()
        expect(failure == true).toEqual(false)
        // expect(!!failure).toEqual(false)
    })
    test('Failure().getMissingProperties() called on main Failure returns string[] if ok', () => {
        const inner_fail = new Failure({
            reason: `Oioioi`,
            parameters: {},
        })
        inner_fail.set('missing_props', ['a', 'b'])
        const main_fail = new Failure({
            data: [{
                message: 'string',
                result: inner_fail
            }]
        })
        expect(main_fail).toBeInstanceOf(Failure)
        expect(main_fail.getMissingProperties()).toEqual(['a', 'b'])
        expect(inner_fail.getMissingProperties()).toEqual(['a', 'b'])
    })
    test('Failure().getMissingProperties() returns string[] if ok', () => {
        /**
         * Simulate a Failure from validateProperties()
         */
        const result_ok = new Failure({
            reason: `Required properties are missing: see missing_props.`,
            parameters: { a: 1, b: 2 },
            data: ['abra']
        })
        result_ok.set('missing_props', ['a', 'b'])
        expect(result_ok.getMissingProperties()).toEqual(['a', 'b'])
    })
    test('Failure().getMissingProperties() returns Failure if no missing_props attached', () => {

        const result_fail = new Failure({
            parameters: { a: 1, b: 2 },
            data: ['abra']
        }).getMissingProperties()

        expect(result_fail).toBeInstanceOf(Failure)
        expect(result_fail.getReason()).toEqual('No missing properties were attached.')
    })
})
describe('extract', () => {
    test('should return [data] for Level2', () => {
        const data = [1, 2, 3]
        const success = new Success({ data })
        const result = success.extract()
        expect(result).toEqual(data)
    })
    test('should return [data[]] for Level1', () => {
        const data1 = [1, 2, 3]
        const data2 = ['a']
        const level1 = new Success({
            data: [
                new Success({
                    data: data1
                }),
                new Success({
                    data: data2
                }),
                new Success({
                    data: []
                }),
            ]
        })
        const result = level1.extract({ flatten: false })
        expect(result).toEqual([data1, data2, []])
    })
    test('should return [data] for Level1 with flatten:true', () => {
        const data1 = [1, 2, 3]
        const data2 = ['a']
        const level1 = new Success({
            data: [
                new Success({
                    data: data1
                }),
                new Success({
                    data: data2
                }),
                new Success({
                    data: []
                }),
            ]
        })
        const result = level1.extract({ flatten: true })
        expect(result).toEqual([...data1, ...data2])
    })
    test('matchNode use case', () => {
        const level1 = new Success({
            data: [new Success({
                success: true,
                reason: '',
                parameters: {},
                data: [{
                    labels: ['BJJ'],
                    properties: {
                        A: 1,
                        B: 1,
                        C: 1,
                        _hash: '212b5f6c841beec7c0c61c74d0662ea78867a171efdd16cdef752f74207106bb',
                        _date_created: [2019, 1, 28, 1, 1548708770972],
                        _uuid: '1eefcb8a-7c87-438b-824b-cd2e531bce86',
                        _temporary_uuid: 'be4859eb-0588-4032-aa49-9af9fb21fc64',
                        DATE_SENT: [2018, 1, 1, 1, 123],
                        _label: 'BJJ'
                    },
                    identity: { low: 6748, high: 0 },
                    relationships: { inbound: [], outbound: [] }
                }]
            })]
        })
        const result = {
            labels: ['BJJ'],
            properties: {
                A: 1,
                B: 1,
                C: 1,
                _hash: '212b5f6c841beec7c0c61c74d0662ea78867a171efdd16cdef752f74207106bb',
                _date_created: [2019, 1, 28, 1, 1548708770972],
                _uuid: '1eefcb8a-7c87-438b-824b-cd2e531bce86',
                _temporary_uuid: 'be4859eb-0588-4032-aa49-9af9fb21fc64',
                DATE_SENT: [2018, 1, 1, 1, 123],
                _label: 'BJJ'
            },
            identity: { low: 6748, high: 0 },
            relationships: { inbound: [], outbound: [] }
        }
        expect(level1.extract({ flatten: true })).toEqual([result])
    })
})
test('tell an undefined Result from definite Results', () => {
    const notDone = 'not done talking yet',
        pendingMeta = { a: 1, b: true }
    const pendingResult = new Result({ reason: notDone, meta: pendingMeta })
    const success = new Success({ reason: 'all good', meta: { b: 2, c: true } })
    const failure = new Failure({ reason: 'something wrong', meta: { d: 3, e: false } })

    expect(isResult(success)).toEqual(true) // isResult won't capture pendingResult vs non-penginResult
    expect(isFailure(pendingResult)).toEqual(false)
    expect(isSuccess(pendingResult)).toEqual(false)

    expect(isPending(success)).toEqual(false)
    expect(isPending(failure)).toEqual(false)
    expect(isPending(pendingResult)).toEqual(true) // this is what we need

    expect(pendingResult.reason).toEqual(notDone)
    expect(pendingResult.meta).toEqual(pendingMeta)
})