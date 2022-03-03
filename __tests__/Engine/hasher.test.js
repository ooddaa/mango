/* @flow */
import { engine } from '../../start';
import {
    Builder,
    Node,
    log
} from '../../src';

describe('use case', () => {
    test('should return string hash', () => {
        const data = ''
        const result = engine.hasher(data)
        // log(result)
        expect(result).toEqual(expect.any(String))
        expect(result).toEqual('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
    })
    test('should return string hash', () => {
        const data = 'blablabla'
        const result = engine.hasher(data)
        // log(result)
        expect(result).toEqual(expect.any(String))
        expect(result).toEqual('492f3f38d6b5d3ca859514e250e25ba65935bcdd9f4f40c124b773fe536fee7d')
    })
    test('should return string hash multiple times', () => {
        const data = ['a', 'b', 'c']
        const result = data.map(engine.hasher)
        // log(result)
        expect(result).toEqual([expect.any(String), expect.any(String), expect.any(String)])
    })
    test('should return same hash ', () => {
        const data = ['a', 'a']
        const result = data.map(engine.hasher)
        expect(result[0] === result[1]).toEqual(true)
    })
})