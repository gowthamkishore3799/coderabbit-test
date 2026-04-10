import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@coderabbit-test/shared-services": path.resolve(
        __dirname,
        "./packages/shared-services/src/index.ts"
      ),
      // Force a single zod instance to avoid cross-package version conflicts
      zod: path.resolve(__dirname, "./node_modules/zod"),
    },
    dedupe: ["zod"],
  },
  test: {
    include: ["**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/fools/**"],
  },
});