import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@coderabbit-test/shared-services": resolve(
        __dirname,
        "packages/shared-services/src/index.ts"
      ),
      // Force a single zod instance so shared-services src and test files
      // use the same zod, avoiding cross-instance schema validation errors.
      "zod": resolve(__dirname, "node_modules/zod"),
    },
    dedupe: ["zod"],
  },
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});