import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    alias: {
      '@coderabbit-test/shared-services': path.resolve(__dirname, './packages/shared-services/src/index.ts'),
    },
  },
  resolve: {
    alias: {
      '@coderabbit-test/shared-services': path.resolve(__dirname, './packages/shared-services/src/index.ts'),
    },
  },
});