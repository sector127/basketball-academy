import {MongoMemoryServer} from 'mongodb-memory-server';

// One throwaway MongoDB for the whole run. Set MONGODB_TEST_URI to use an existing
// server instead (each run uses its own database name).
let server;

export async function setup({provide}) {
    if (process.env.MONGODB_TEST_URI) {
        provide('mongoUri', process.env.MONGODB_TEST_URI);
        return;
    }
    server = await MongoMemoryServer.create();
    provide('mongoUri', `${server.getUri()}bba_test`);
}

export async function teardown() {
    await server?.stop();
}
