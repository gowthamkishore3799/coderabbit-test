import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      'zod': resolve(__dirname, 'node_modules/zod'),
    },
  },
})