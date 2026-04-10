import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@coderabbit-test/shared-services': path.resolve(
        __dirname,
        './packages/shared-services/src/index.ts'
      ),
      // Force all zod imports to use the same instance to avoid cross-instance
      // schema validation failures between root and shared-services packages.
      'zod': path.resolve(__dirname, './node_modules/zod'),
    },
  },
});