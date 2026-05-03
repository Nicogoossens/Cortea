import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@workspace/db": path.resolve(import.meta.dirname, "../../lib/db/src/index.ts"),
      "@workspace/api-zod": path.resolve(import.meta.dirname, "../../lib/api-zod/src/index.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    globals: false,
    clearMocks: true,
  },
});
