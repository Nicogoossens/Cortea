import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

/**
 * Dedicated Vitest config — kept separate from `vite.config.ts` because
 * the latter contains Replit-only dev plugins (cartographer, dev-banner,
 * the `syncLocales` hook) that are inappropriate during test runs and
 * would also cause the test runner to discover duplicate spec files
 * inside the synced `public/locales` mirror.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/build/**", "public/**"],
    globals: false,
    css: false,
    clearMocks: true,
  },
});
