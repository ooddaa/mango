/* @flow */
'use strict';
// [2020-01-16] ok

import {
    Template,
    log
} from '../../../src';

import keys from 'lodash/keys';


describe('general', () => {
    test('instantiation', async () => {
        const result = {
            labels: undefined,
            properties: {
                required: {},
                optional: {},
                _private: {}
            }
        }
        expect(new Template()).toMatchObject(result)
    })
})
describe('methods', () => {
    test('getRequiredProperties', async () => {
        const required_props = { A: 1, B: 2, C: true },
            template = new Template({ properties: { required: required_props } })

        expect(template.getRequiredProperties())
            .toEqual(expect.arrayContaining(keys(required_props)))
    })
    describe('generateModelObject', () => {
        test('required prop must have { constructor_name, example } - OK', async () => {
            const required_props = {
                A: { constructor_name: 'constructor_a', example: 1 },
                B: { constructor_name: 'constructor_b', example: 2 },
            },
                template = new Template({ labels: ['abc'], properties: { required: required_props } })

            const result = {
                labels: ['abc'],
                properties: {
                    required: {
                        A: 'constructor_a',
                        B: 'constructor_b',
                    },
                    optional: {}
                },
            }

            expect(template.generateModelObject())
                .toMatchObject(result)
        })
        test('required prop must have { constructor, example } - NOT OK', async () => {
            const required_props = {
                A: { /* constructor: 'constructor_a', */ example: 1 },
                B: { constructor_name: 'constructor_b', example: 2 },
            },
                template = new Template({ labels: ['abc'], properties: { required: required_props } })

            expect(() => {
                template.generateModelObject();
            })
                .toThrowError(new Error(`Template.generateModelObject(): no constructor_name specified:\nkey: A\nvalue: {"example":1}.`))
        })

    })

})