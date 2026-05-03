import { defineConfig, devices } from "@playwright/test";
import { execSync } from "child_process";

function findChromium(): string | undefined {
  const fromEnv = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  if (fromEnv) return fromEnv;
  try {
    const result = execSync(
      "which chromium 2>/dev/null || which chromium-browser 2>/dev/null || which google-chrome 2>/dev/null",
      { encoding: "utf8" },
    ).trim();
    return result || undefined;
  } catch {
    return undefined;
  }
}

const chromiumPath = findChromium();

// In Replit the Vite dev server is assigned a dynamic port by the platform.
// The Replit proxy (REPLIT_DEV_DOMAIN) routes browser traffic to that port, and
// is reachable from the spawned Chromium subprocess.  Fall back to localhost
// only for standard CI environments where servers listen on known ports.
const replitDev = process.env.REPLIT_DEV_DOMAIN;
const baseURL =
  process.env.APP_BASE_URL ??
  (replitDev ? `https://${replitDev}` : "http://localhost:3000");

// URL used to confirm the frontend is serving before any test runs.
// In Replit, ping the dev-domain proxy (always responds when the workflow is
// running).  In standard CI, ping localhost directly.
const frontendReadyUrl = replitDev
  ? `https://${replitDev}`
  : "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  timeout: 30_000,

  // Verify the app stack is reachable before running any browser tests.
  // reuseExistingServer: true — Playwright skips the start command when the
  // health URL is already responding (i.e. the Replit dev workflows are up).
  webServer: [
    {
      command: "pnpm --filter @workspace/sowiso run dev",
      url: frontendReadyUrl,
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command:
        "ENABLE_TEST_DEBUG_ROUTES=true PORT=8080 pnpm --filter @workspace/api-server run dev",
      // Use localhost directly — accessible from the Playwright Node process
      // regardless of whether we are in Replit or standard CI.
      url: "http://localhost:8080/api/auth/google/status",
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],

  use: {
    baseURL,
    trace: "on-first-retry",
    launchOptions: {
      executablePath: chromiumPath,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
