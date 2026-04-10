import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      // Point to the TypeScript source directly so vitest can transpile it
      // without needing a pre-built dist. The shared-services dist cannot be
      // produced due to a zod v4 API change in analytics-service.ts, so we
      // alias to the src index instead.
      "@coderabbit-test/shared-services": path.resolve(
        __dirname,
        "packages/shared-services/src/index.ts"
      ),
    },
  },
  test: {
    include: [
      "*.test.ts",
      "*.test.js",
      "fools/*.test.ts",
      "fools/*.test.js",
    ],
    exclude: ["node_modules/**", "packages/**", "fools/node_modules/**"],
  },
});