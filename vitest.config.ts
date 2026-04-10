import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@coderabbit-test/shared-services': resolve(__dirname, './packages/shared-services/src/index.ts'),
      // Deduplicate zod: ensure all packages use the same root zod instance
      'zod': resolve(__dirname, './node_modules/zod'),
    },
  },
  test: {
    globals: false,
  },
});