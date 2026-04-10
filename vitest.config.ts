import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      // Resolve the internal shared-services package from source so tests
      // work without requiring a separate `npm run build` step.
      "@coderabbit-test/shared-services": path.resolve(
        __dirname,
        "packages/shared-services/src/index.ts"
      ),
    },
    // Force a single zod instance to avoid cross-package Zod version conflicts.
    dedupe: ["zod"],
  },
  test: {
    globals: false,
    environment: "node",
include: ["**/*.test.ts", "**/*.spec.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});