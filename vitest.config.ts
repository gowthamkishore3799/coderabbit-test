import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@coderabbit-test/shared-services': path.resolve(
        __dirname,
        './packages/shared-services/src/index.ts'
      ),
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
});