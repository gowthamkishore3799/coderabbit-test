import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@coderabbit-test/shared-services": path.resolve(
        __dirname,
        "packages/shared-services/dist/index.js"
      ),
    },
  },
});