import {defineConfig} from 'vitest/config';
import {fileURLToPath} from 'node:url';

export default defineConfig({
    resolve: {
        alias: {'@': fileURLToPath(new URL('./', import.meta.url))},
    },
    test: {
        environment: 'node',
        include: ['tests/**/*.test.{js,mjs,ts}'],
        globalSetup: ['tests/setup/globalSetup.js'],
        setupFiles: ['tests/setup/testSetup.js'],
        // Test files share one MongoDB; run them one at a time
        fileParallelism: false,
        testTimeout: 20000,
        hookTimeout: 60000,
    },
});
