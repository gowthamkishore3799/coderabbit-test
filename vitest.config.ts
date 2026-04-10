import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@coderabbit-test/shared-services': resolve(
        __dirname,
        'packages/shared-services/src/index.ts'
      ),
      // Force all zod imports to resolve to the root instance to avoid dual-module issues
      'zod': resolve(__dirname, 'node_modules/zod'),
    },
    dedupe: ['zod'],
  },
  test: {
    globals: true,
    environment: 'node',
    server: {
      deps: {
        inline: ['@coderabbit-test/shared-services'],
      },
    },
  },
});