import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@coderabbit-test/shared-services': resolve(__dirname, 'packages/shared-services/src/index.ts'),
      // Force all zod imports (including those in shared-services/src) to use the same root instance
      'zod': resolve(__dirname, 'node_modules/zod'),
    },
    dedupe: ['zod'],
  },
  test: {
    environment: 'node',
    globals: true,
  },
});