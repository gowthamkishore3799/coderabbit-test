import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@coderabbit-test/shared-services': resolve(__dirname, 'packages/shared-services/src/index.ts'),
      // Pin all zod imports to a single instance to avoid cross-version parse errors
      'zod': resolve(__dirname, 'node_modules/zod'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
  },
});