/* @flow */
import { Engine, log, Builder } from '../../src';

describe('setting up neo4j driver', () => {
    describe('should not start driver automatically', () => {
        const engine = new Engine({
            neo4jUsername: 'neo4j',
            neo4jPassword: 'pass',
        });
        test('driver is null', () => {

            expect(engine.driver).toEqual(null);
        })
        test('no connectivity', async () => {
            const result = await engine.verifyConnectivity();
            expect(result).toMatchObject({ address: null, version: null });
        })
    })
    test('should connect to DMBS', async () => {
        const database = 'neoj';
        const engine = new Engine({
            neo4jUsername: 'neo4j',
            neo4jPassword: 'pass',
        });
        engine.startDriver();
        await engine.verifyConnectivity().then(log);
    })
    test('should write to chosen database', async () => {
        const database = 'test';
        const engine = new Engine({
            neo4jUsername: 'neo4j',
            neo4jPassword: 'pass',
            database
        });
        engine.startDriver();
        await engine.verifyConnectivity({ database })

        const nodes = new Builder().makeNode(
            ['PERSON'],
            {
                FIRST_NAME: "Matvey",
                LAST_NAME: "Medvedev",
                DOB: [2018, 10, 21]
            })
        // log(nodes)
        const results = await engine.mergeNodes([nodes], { database });
        expect(results[0].success).toEqual(true);
    })
})

// afterAll(async (done) => {
//     engine.closeAllSessions()
//     engine.closeDriver()
//     done()
// })