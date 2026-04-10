import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    // Only pick up tests directly in the root directory; fools/ has its own vitest config.
    include: ["*.test.ts", "*.spec.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "fools/**"],
  },
});