import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@coderabbit-test/shared-services': '/home/jailuser/git/packages/shared-services/src/index.ts',
    },
  },
});