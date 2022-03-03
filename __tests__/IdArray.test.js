/* @flow */
'use strict';

import {
    IdArray,
    log
} from '../src';

describe('constructor', () => {
    test('throws if called empty', () => {
        expect(() => {
            new IdArray()
        }).toThrow() //`TypeError: Invalid attempt to destructure non-iterable instance`
    })
    test('throws if called with anything other than an Array', () => {
        expect(() => {
            new IdArray({})
        }).toThrow() //`TypeError: Invalid attempt to destructure non-iterable instance`
    })
    test('ok', () => {
        expect(() => {
            new IdArray([])
        }).not.toThrow()
    })
    test('constructs from array, returns string[], id: number', () => {
        const result = new IdArray(['Joe', 123, 'abc123'])

        expect(result.toArray()).toEqual(['Joe', '123', 'abc123'])
        expect(result.isValid()).toEqual(true)
    })
    describe('possible values for array', () => {
        test('nickname: string', () => {
            const result = new IdArray(['Joe', 123, 'abc123'])
            expect(result.toArray()).toEqual(['Joe', '123', 'abc123'])
            expect(result.isValid()).toEqual(true)
        })
        test('nickname: number', () => {
            const result = new IdArray([1, 123, 'abc123'])
            expect(result.toArray()).toEqual(['', '123', 'abc123'])
            expect(result.isValid()).toEqual(true)
        })
        test('nickname: null', () => {
            const result = new IdArray([null, 123, 'abc123'])
            expect(result.toArray()).toEqual(['', '123', 'abc123'])
            expect(result.isValid()).toEqual(true)
        })
        test('id: string', () => {
            const result = new IdArray(['Joe', '123', 'abc123'])
            expect(result.toArray()).toEqual(['Joe', '123', 'abc123'])
            expect(result.isValid()).toEqual(true)
        })
        test('id: number', () => {
            const result = new IdArray(['Joe', 123, 'abc123'])
            expect(result.toArray()).toEqual(['Joe', '123', 'abc123'])
            expect(result.isValid()).toEqual(true)
        })
    })
})
describe('methods', () => {
    const result = new IdArray(['Joe', 123, 'abc123'])
    test('toArray()', () => {
        expect(result.toArray())
            .toEqual(['Joe', '123', 'abc123'])
    })
    test('getNICKNAME()', () => {
        expect(result.getNICKNAME()).toEqual('Joe')
    })
    test('getId()', () => {
        expect(result.getId()).toEqual(123)
    })
    test('getHash()', () => {
        expect(result.getHash()).toEqual('abc123')
    })
    test('isValid()', () => {
        expect(result.isValid()).toEqual(true)
    })
    test('getHashableValue()', () => {
        expect(result.getHashableValue()).toEqual('Joe')
    })
    test('isIdentificationArray()', () => {
        expect(new IdArray(['Jon', 'ID', 'abc123']).isIdentificationArray())
            .toMatchObject({
                success: true,
                data: ['Jon', '', 'abc123']
            })
    })
})

describe('use cases', () => {

    describe('testing valid IdArrays', () => {
        test('sufficiency test', () => {
            // must contain at least one valid identificator
            const correct = [
                ['Joe'],
                [null, 123],
                [null, null, 'abc123'],
            ].map(array => new IdArray(array))
            // log(correct.map(idArr => idArr.isIdentificationArray()))
            expect(correct.every(idArr => idArr.isValid()))
                .toEqual(true)
            // log(correct.map(idArr => idArr.toArray()))
            expect(correct.map(idArr => idArr.toArray()))
                .toEqual(expect.arrayContaining([
                    ['Joe', '', ''],
                    ['', '123', ''],
                    ['', '', 'abc123']
                ]))
        })
        test('anything above is ok', () => {
            const correct = [
                ['Joe', 123, true],
                [null, 123, 'abc123'],
                ['Joe', 'ID', 'abc123'],
            ].map(array => new IdArray(array))
            // log(correct)
            // log(correct.map(idArr => idArr.isIdentificationArray()))
            expect(correct.every(idArr => idArr.isValid()))
                .toEqual(true)
            // log(correct.map(idArr => idArr.toArray()))
            expect(correct.map(idArr => idArr.toArray()))
                .toEqual(expect.arrayContaining([
                    ['Joe', '123', ''],
                    ['', '123', 'abc123'],
                    ['Joe', '', 'abc123']
                ]))
        })
    })

    test('testing invalid IdArrays', () => {
        const incorrect = [
            // general
            [],
            [''],
            [null],
            [null, null, null],
            [undefined],
            [undefined, undefined, undefined],
            ['', '', ''],

            //// pseudo-sufficient

            // ID must not be a NaN!
            ['', 'ID', ''],
            [null, 'something', null],


            // no booleans
            [true, '', ''],


        ].map(array => new IdArray(array))

        // log(incorrect.map(idArr => !idArr.isValid()))
        // log(incorrect.map(idArr => idArr.isIdentificationArray()))
        expect(incorrect.every(idArr => !idArr.isValid()))
            .toEqual(true)
    })
})




