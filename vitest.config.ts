import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@coderabbit-test/shared-services': resolve(__dirname, 'packages/shared-services/src/index.ts'),
    },
  },
});