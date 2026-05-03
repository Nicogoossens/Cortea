/**
 * End-to-end tests for the Google sign-in flow.
 *
 * The callback tests (3, 4) obtain a one-time code via the debug endpoint
 * (POST /api/debug/issue-redeem-code), then navigate to
 * /oauth-callback?code=<code> and let the OAuthCallback component exchange the
 * code for a real session cookie via the real /api/auth/redeem server route.
 * This exercises the full browser→server cookie-exchange path without going
 * through real Google OAuth.
 *
 * The debug endpoint and the auth rate-limiter skip are both gated on
 * ENABLE_TEST_DEBUG_ROUTES=true (which is never set in production), so neither
 * poses a security risk in deployed environments.
 *
 * Network legs that cannot be exercised without real Google credentials are
 * stubbed via page.route():
 *   • /api/auth/google/status  — must return { configured: true } for the
 *                                sign-in button to render.
 *   • /api/auth/google         — responds with a meta-refresh that triggers a
 *                                new top-level navigation to accounts.google.com
 *                                (route.fulfill({ status: 302 }) and
 *                                route.continue({ url }) do NOT produce an
 *                                observable browser URL change for main-frame
 *                                navigations in Playwright).
 *   • https://accounts.google.com/**  — returns mock HTML to prevent the
 *                                       browser from making a real external
 *                                       request.
 *
 * Coverage:
 *   1. Sign-in page renders the "Doorgaan met Google" button when Google is
 *      configured.
 *   2. Clicking the Google button navigates toward accounts.google.com.
 *   3. /oauth-callback?code=<debug code, existing user> → redirects to /
 *   4. /oauth-callback?code=<debug code, new user>      → redirects to /onboarding
 *   5. /oauth-callback?code=<invalid>                   → redirects to /signin?error=auth_failed
 *   6. auth_failed error message is visible on the sign-in page.
 *   7. /oauth-callback (no code param)                  → redirects to /signin
 */

import { test, expect } from "@playwright/test";
import { randomBytes } from "crypto";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8080";

const replitDev = process.env.REPLIT_DEV_DOMAIN;
const APP_BASE =
  process.env.APP_BASE_URL ??
  (replitDev ? `https://${replitDev}` : "http://localhost:3000");

function uniqueEmail(): string {
  return `e2e-${randomBytes(4).toString("hex")}@example.com`;
}

/**
 * Issue a one-time redeem code via the debug endpoint.
 * Requires ENABLE_TEST_DEBUG_ROUTES=true on the API server.
 */
async function issueCode(options: {
  isNewUser: boolean;
  email?: string;
}): Promise<string> {
  const res = await fetch(`${API_BASE}/api/debug/issue-redeem-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: options.email ?? uniqueEmail(),
      fullName: "E2E Test User",
      isNewUser: options.isNewUser,
    }),
  });
  if (!res.ok) {
    throw new Error(
      `debug endpoint returned ${res.status} — is ENABLE_TEST_DEBUG_ROUTES=true?`,
    );
  }
  const body = (await res.json()) as { code: string };
  return body.code;
}

// ─── 1. Sign-in page ─────────────────────────────────────────────────────────

test.describe("Sign-in page", () => {
  test("renders the Google sign-in button when Google is configured", async ({
    page,
  }) => {
    // Stub Google status so the test is deterministic regardless of whether
    // GOOGLE_CLIENT_ID is configured in the current environment.
    await page.route("**/api/auth/google/status", (route) =>
      route.fulfill({ json: { configured: true } }),
    );

    await page.goto(`${APP_BASE}/signin`);

    // The button renders only when /api/auth/google/status → { configured: true }.
    const googleBtn = page.locator("button", {
      hasText: "Doorgaan met Google",
    });
    await expect(googleBtn).toBeVisible({ timeout: 5000 });
    await expect(googleBtn).toBeEnabled();
  });

  test("clicking the Google button navigates toward accounts.google.com", async ({
    page,
  }) => {
    await page.route("**/api/auth/google/status", (route) =>
      route.fulfill({ json: { configured: true } }),
    );

    // Intercept /api/auth/google and respond with a page that immediately
    // redirects to accounts.google.com via <meta http-equiv="refresh">.
    // This triggers a new top-level navigation that Playwright can observe
    // and intercept — unlike route.fulfill({ status: 302 }) or
    // route.continue({ url }), which do not produce an observable browser
    // URL change for main-frame requests.
    await page.route(/\/api\/auth\/google(\?|$)/, (route) =>
      route.fulfill({
        status: 200,
        contentType: "text/html",
        body: `<html><head><meta http-equiv="refresh" content="0; url=https://accounts.google.com/o/oauth2/auth?client_id=test&scope=openid+email+profile"></head><body></body></html>`,
      }),
    );

    // Return lightweight mock HTML for the Google consent page so the
    // navigation chain completes without a real external request.
    await page.route("https://accounts.google.com/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<html><body>Mocked Google consent page</body></html>",
      }),
    );

    await page.goto(`${APP_BASE}/signin`);

    const googleBtn = page.locator("button", {
      hasText: "Doorgaan met Google",
    });
    await expect(googleBtn).toBeVisible({ timeout: 5000 });

    await Promise.all([
      page.waitForURL(/accounts\.google\.com/, { timeout: 15_000 }),
      googleBtn.click(),
    ]);

    expect(page.url()).toContain("accounts.google.com");
  });
});

// ─── 2. Callback: existing user ───────────────────────────────────────────────

test.describe("OAuth callback — existing user", () => {
  test("navigating to /oauth-callback with a valid code redirects to /", async ({
    page,
  }) => {
    // Obtain a real one-time code from the debug endpoint.  The code is then
    // redeemed by the browser via the real /api/auth/redeem route, exercising
    // the full server-side session / cookie-exchange path.
    const code = await issueCode({ isNewUser: false });

    await page.goto(`${APP_BASE}/oauth-callback?code=${code}`);

    // OAuthCallback: redeem code → session cookie → profile fetch → setLocation("/")
    await page.waitForURL(/\/$/, { timeout: 15_000 });
    expect(new URL(page.url()).pathname).toBe("/");
  });
});

// ─── 3. Callback: new user ────────────────────────────────────────────────────

test.describe("OAuth callback — new user", () => {
  test("navigating to /oauth-callback with isNewUser=true redirects to /onboarding", async ({
    page,
  }) => {
    const code = await issueCode({ isNewUser: true });

    await page.goto(`${APP_BASE}/oauth-callback?code=${code}`);

    // OAuthCallback: isNewUser=true → setLocation("/onboarding")
    await page.waitForURL(/\/onboarding/, { timeout: 15_000 });
    expect(new URL(page.url()).pathname).toBe("/onboarding");
  });
});

// ─── 4. Callback: invalid / expired code ─────────────────────────────────────

test.describe("OAuth callback — invalid code", () => {
  test("an expired or bogus code redirects to /signin?error=auth_failed", async ({
    page,
  }) => {
    await page.goto(
      `${APP_BASE}/oauth-callback?code=00000000000000000000000000000000`,
    );

    await page.waitForURL(/\/signin/, { timeout: 10_000 });
    const url = new URL(page.url());
    expect(url.pathname).toBe("/signin");
    expect(url.searchParams.get("error")).toBe("auth_failed");
  });

  test("the auth_failed error message is visible on the sign-in page", async ({
    page,
  }) => {
    await page.goto(`${APP_BASE}/signin?error=auth_failed`);

    const alert = page.locator("[role=alert]");
    await expect(alert).toBeVisible({ timeout: 5000 });
    const text = await alert.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });
});

// ─── 5. Callback: no code param ──────────────────────────────────────────────

test.describe("OAuth callback — no code parameter", () => {
  test("navigating to /oauth-callback without a code redirects to /signin", async ({
    page,
  }) => {
    await page.goto(`${APP_BASE}/oauth-callback`);

    await page.waitForURL(/\/signin/, { timeout: 10_000 });
    expect(new URL(page.url()).pathname).toBe("/signin");
  });
});
