import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@coderabbit-test/shared-services": path.resolve(
        __dirname,
        "./packages/shared-services/src/index.ts"
      ),
      // Force all code to use the same single zod instance from root
      "zod": path.resolve(__dirname, "./node_modules/zod"),
    },
    dedupe: ["zod"],
  },
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.js"],
    exclude: ["node_modules", "fools/node_modules", "packages/*/node_modules"],
    deps: {
      inline: ["@coderabbit-test/shared-services"],
    },
  },
});