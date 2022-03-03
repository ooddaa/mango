/* @flow */
'use strict';

import {
    RequiredValue,
    log
} from '../src';

import keys from 'lodash/keys';


describe('general', () => {
    test('instantiation', async () => {
        const req_val = new RequiredValue()
    })
})
describe('methods', () => {
    const req_val = new RequiredValue('constructor_name', 'example', () => true)
    test('getConstructorName', async () => {
        expect(req_val.getConstructorName())
            .toEqual('constructor_name')
    })
    test('getExample', async () => {
        expect(req_val.getExample())
            .toEqual('example')
    })
    describe('getValidation', () => {
        test('all ok', async () => {
            expect(req_val.getValidation()())
                .toEqual(true)
        })
        test('error if validation is not a function', async () => {
            expect(() => {
                new RequiredValue(null, null, 'something').getValidation()
            })
                .toThrowError(new Error(`RequiredValue.getValidation(): validation must be a function. Received: something`))

        })
    })

})