import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules', 'fools/node_modules', 'packages/**/node_modules'],
  },
});