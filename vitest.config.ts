import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@coderabbit-test/shared-services': resolve(__dirname, 'packages/shared-services/src/index.ts'),
    },
    dedupe: ['zod'],
  },
  test: {
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['**/node_modules/**'],
  },
});