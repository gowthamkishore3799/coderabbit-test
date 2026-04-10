import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    dedupe: ['zod'],
    alias: {
      '@coderabbit-test/shared-services': path.resolve(__dirname, 'packages/shared-services/src/index.ts'),
      'zod': path.resolve(__dirname, 'node_modules/zod'),
    },
  },
});