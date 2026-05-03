/**
 * Tests for the Google OAuth route handlers.
 *
 * Mocks: `openid-client` and `@workspace/db` — no HTTP server, no real DB.
 *
 * Coverage:
 *   GET /api/auth/google        — OAuth init route
 *   GET /api/auth/google/callback — OAuth callback route
 *   isGoogleConfigured()        — env-var check
 *   Full loop: init → callback  — end-to-end redirect chain
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import type { Request, Response } from "express";

// ─── mock openid-client ───────────────────────────────────────────────────────

vi.mock("openid-client", () => ({
  discovery: vi.fn().mockResolvedValue({}),
  randomState: vi.fn().mockReturnValue("mock-state"),
  randomNonce: vi.fn().mockReturnValue("mock-nonce"),
  randomPKCECodeVerifier: vi.fn().mockReturnValue("mock-verifier"),
  calculatePKCECodeChallenge: vi.fn().mockResolvedValue("mock-challenge"),
  buildAuthorizationUrl: vi.fn().mockReturnValue(
    new URL("https://accounts.google.com/o/oauth2/auth?prompt=select_account&state=mock-state")
  ),
  authorizationCodeGrant: vi.fn(),
}));

// ─── mock @workspace/db ───────────────────────────────────────────────────────

const mockDbSelect = vi.fn();
const mockDbUpdate = vi.fn();
const mockDbInsert = vi.fn();

vi.mock("@workspace/db", () => ({
  usersTable: { $inferSelect: {} as never, email: "email", id: "id", oauth_provider: "p", oauth_provider_id: "pid" },
  db: {
    select: () => ({ from: () => ({ where: () => ({ limit: mockDbSelect }) }) }),
    update: () => ({ set: () => ({ where: mockDbUpdate }) }),
    insert: () => ({ values: () => ({ returning: mockDbInsert }) }),
  },
}));

// ─── imports after mocks ──────────────────────────────────────────────────────

import * as oidc from "openid-client";
import { redeemCodes } from "../lib/redeem-codes";

// ─── typed lightweight mock req/res ──────────────────────────────────────────

interface MockRequest {
  cookies: Record<string, string>;
  query: Record<string, string>;
  url: string;
  headers: Record<string, string>;
  protocol: string;
  hostname: string;
  log: { error: ReturnType<typeof vi.fn> };
}

interface MockResponse {
  _redirectUrl: string;
  _statusCode: number;
  _body: unknown;
  _cookies: Record<string, string>;
  _clearedCookies: string[];
  status: (code: number) => this;
  json: (body: unknown) => this;
  redirect: (url: string) => void;
  cookie: (name: string, value: string) => void;
  clearCookie: (name: string) => void;
}

function makeReq(overrides: Partial<MockRequest> = {}): MockRequest {
  return {
    cookies: {},
    query: {},
    url: "/api/auth/google/callback?code=gcode&state=mock-state",
    headers: { host: "localhost:8080" },
    protocol: "http",
    hostname: "localhost",
    log: { error: vi.fn() },
    ...overrides,
  };
}

function makeRes(): MockResponse {
  const res: MockResponse = {
    _redirectUrl: "",
    _statusCode: 200,
    _body: null,
    _cookies: {},
    _clearedCookies: [],
    status(code) { this._statusCode = code; return this; },
    json(body) { this._body = body; return this; },
    redirect(url) { this._redirectUrl = url; },
    cookie(name, value) { this._cookies[name] = value; },
    clearCookie(name) { this._clearedCookies.push(name); },
  };
  return res;
}

function makeDbUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user_existing_001",
    full_name: "Existing User",
    email: "test@example.com",
    avatar_url: null,
    session_token: "old-tok",
    is_admin: false,
    suspended_at: null,
    onboarding_completed: true,
    oauth_provider: "google",
    oauth_provider_id: "google-sub-123",
    subscription_tier: "guest",
    noble_score: 0,
    region_history: [],
    ...overrides,
  };
}

function makeGoogleClaims(overrides: Record<string, unknown> = {}) {
  return {
    sub: "google-sub-123",
    email: "test@example.com",
    name: "Test User",
    given_name: "Test",
    family_name: "User",
    picture: "https://example.com/avatar.jpg",
    ...overrides,
  };
}

function callbackCookies(returnTo = "/oauth-callback") {
  return {
    g_code_verifier: "verifier-abc",
    g_state: "mock-state",
    g_nonce: "nonce-xyz",
    g_return_to: returnTo,
  };
}

// ─── Shared route handlers (single import, preserving shared redeemCodes Map) ─

type RouteHandler = (req: unknown, res: unknown) => Promise<void>;

let initHandler: RouteHandler;
let callbackHandler: RouteHandler;

beforeAll(async () => {
  const mod = await import("../routes/google-oauth");
  const router = mod.default as { stack: Array<{ route?: { path: string; stack: Array<{ handle: RouteHandler }> } }> };

  const initLayer = router.stack.find((l) => l.route?.path === "/auth/google");
  const cbLayer = router.stack.find((l) => l.route?.path === "/auth/google/callback");
  if (!initLayer || !cbLayer) throw new Error("Required routes not found in router stack");

  initHandler = initLayer.route!.stack[0].handle;
  callbackHandler = cbLayer.route!.stack[0].handle;
});

// ─── isGoogleConfigured ───────────────────────────────────────────────────────

describe("isGoogleConfigured", () => {
  function saveEnv() { return { id: process.env.GOOGLE_CLIENT_ID, secret: process.env.GOOGLE_CLIENT_SECRET }; }
  function restoreEnv(s: { id?: string; secret?: string }) {
    if (s.id === undefined) delete process.env.GOOGLE_CLIENT_ID; else process.env.GOOGLE_CLIENT_ID = s.id;
    if (s.secret === undefined) delete process.env.GOOGLE_CLIENT_SECRET; else process.env.GOOGLE_CLIENT_SECRET = s.secret;
  }

  it("returns true when both env vars are set", async () => {
    const prev = saveEnv();
    process.env.GOOGLE_CLIENT_ID = "id"; process.env.GOOGLE_CLIENT_SECRET = "secret";
    vi.resetModules();
    const { isGoogleConfigured } = await import("../routes/google-oauth");
    expect(isGoogleConfigured()).toBe(true);
    restoreEnv(prev);
  });

  it("returns false when GOOGLE_CLIENT_ID is absent", async () => {
    const prev = saveEnv();
    delete process.env.GOOGLE_CLIENT_ID; process.env.GOOGLE_CLIENT_SECRET = "secret";
    vi.resetModules();
    const { isGoogleConfigured } = await import("../routes/google-oauth");
    expect(isGoogleConfigured()).toBe(false);
    restoreEnv(prev);
  });

  it("returns false when GOOGLE_CLIENT_SECRET is absent", async () => {
    const prev = saveEnv();
    process.env.GOOGLE_CLIENT_ID = "id"; delete process.env.GOOGLE_CLIENT_SECRET;
    vi.resetModules();
    const { isGoogleConfigured } = await import("../routes/google-oauth");
    expect(isGoogleConfigured()).toBe(false);
    restoreEnv(prev);
  });
});

// ─── GET /api/auth/google (OAuth init route) ──────────────────────────────────

describe("GET /api/auth/google — OAuth init route", () => {
  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = "test-id";
    process.env.GOOGLE_CLIENT_SECRET = "test-secret";
  });
  afterEach(() => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    vi.clearAllMocks();
  });

  it("sets PKCE and state cookies before redirecting to Google", async () => {
    const req = makeReq({ url: "/api/auth/google" });
    const res = makeRes();
    await initHandler(req, res);

    expect(res._cookies["g_code_verifier"]).toBeTruthy();
    expect(res._cookies["g_state"]).toBeTruthy();
    expect(res._cookies["g_nonce"]).toBeTruthy();
  });

  it("redirects to Google's authorization endpoint", async () => {
    const req = makeReq({ url: "/api/auth/google" });
    const res = makeRes();
    await initHandler(req, res);

    expect(res._redirectUrl).toContain("accounts.google.com");
  });

  it("passes prompt=select_account (forces account picker) to Google", async () => {
    const req = makeReq({ url: "/api/auth/google" });
    const res = makeRes();
    await initHandler(req, res);

    const buildArgs = (oidc.buildAuthorizationUrl as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(buildArgs[1]).toMatchObject({ prompt: "select_account" });
  });

  it("stores the returnTo path safely defaulting to /oauth-callback", async () => {
    const req = makeReq({ url: "/api/auth/google", query: {} });
    const res = makeRes();
    await initHandler(req, res);

    expect(res._cookies["g_return_to"]).toBe("/oauth-callback");
  });

  it("honours an explicit returnTo query param", async () => {
    const req = makeReq({ url: "/api/auth/google?returnTo=/dashboard", query: { returnTo: "/dashboard" } });
    const res = makeRes();
    await initHandler(req, res);

    expect(res._cookies["g_return_to"]).toBe("/dashboard");
  });

  it("rejects an unsafe returnTo value and falls back to /oauth-callback", async () => {
    const req = makeReq({ url: "/api/auth/google?returnTo=//evil.com", query: { returnTo: "//evil.com" } });
    const res = makeRes();
    await initHandler(req, res);

    expect(res._cookies["g_return_to"]).toBe("/oauth-callback");
  });

  it("builds the callback URL from APP_PUBLIC_URL when set", async () => {
    const prev = process.env.APP_PUBLIC_URL;
    process.env.APP_PUBLIC_URL = "https://sowiso-01.replit.app";
    const req = makeReq({ url: "/api/auth/google" });
    const res = makeRes();
    await initHandler(req, res);

    const buildArgs = (oidc.buildAuthorizationUrl as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(buildArgs[1].redirect_uri).toBe("https://sowiso-01.replit.app/api/auth/google/callback");

    if (prev === undefined) delete process.env.APP_PUBLIC_URL; else process.env.APP_PUBLIC_URL = prev;
  });

  it("returns 503 when Google credentials are not configured", async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    const req = makeReq({ url: "/api/auth/google" });
    const res = makeRes();
    await initHandler(req, res);

    expect(res._statusCode).toBe(503);
  });
});

// ─── GET /api/auth/google/callback — missing cookies ─────────────────────────

describe("GET /api/auth/google/callback — missing cookies", () => {
  beforeEach(() => redeemCodes.clear());
  afterEach(() => { redeemCodes.clear(); vi.clearAllMocks(); });

  it("redirects to /signin?error=auth_failed when g_code_verifier is absent", async () => {
    const req = makeReq({ cookies: { g_state: "mock-state" } });
    const res = makeRes();
    await callbackHandler(req, res);
    expect(res._redirectUrl).toContain("/signin?error=auth_failed");
    expect(redeemCodes.size).toBe(0);
  });

  it("redirects to /signin?error=auth_failed when g_state is absent", async () => {
    const req = makeReq({ cookies: { g_code_verifier: "verifier" } });
    const res = makeRes();
    await callbackHandler(req, res);
    expect(res._redirectUrl).toContain("/signin?error=auth_failed");
  });

  it("clears all four OAuth temp cookies regardless of validation outcome", async () => {
    const req = makeReq({ cookies: {} });
    const res = makeRes();
    await callbackHandler(req, res);
    for (const name of ["g_code_verifier", "g_state", "g_nonce", "g_return_to"]) {
      expect(res._clearedCookies).toContain(name);
    }
  });
});

// ─── GET /api/auth/google/callback — token exchange failure ──────────────────

describe("GET /api/auth/google/callback — Google token exchange failure", () => {
  beforeEach(() => {
    redeemCodes.clear();
    (oidc.authorizationCodeGrant as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("invalid_grant"));
  });
  afterEach(() => { redeemCodes.clear(); vi.clearAllMocks(); });

  it("redirects to /signin?error=auth_failed and issues no redeem code", async () => {
    const req = makeReq({ cookies: callbackCookies() });
    const res = makeRes();
    await callbackHandler(req, res);
    expect(res._redirectUrl).toContain("/signin?error=auth_failed");
    expect(redeemCodes.size).toBe(0);
  });
});

// ─── GET /api/auth/google/callback — new user ────────────────────────────────

describe("GET /api/auth/google/callback — new user (DB insert path)", () => {
  beforeEach(() => {
    redeemCodes.clear();
    mockDbSelect.mockResolvedValue([]);
    mockDbInsert.mockResolvedValue([makeDbUser({ id: "user_new_001", onboarding_completed: false })]);
    mockDbUpdate.mockResolvedValue([]);
    (oidc.authorizationCodeGrant as ReturnType<typeof vi.fn>).mockResolvedValue({
      claims: () => makeGoogleClaims({ sub: "brand-new-sub" }),
    });
  });
  afterEach(() => { redeemCodes.clear(); vi.clearAllMocks(); });

  it("issues a redeem code with isNewUser=true", async () => {
    const req = makeReq({ cookies: callbackCookies() });
    const res = makeRes();
    await callbackHandler(req, res);

    expect(res._redirectUrl).toMatch(/\/oauth-callback\?code=[0-9a-f]{32}$/);
    const code = new URL(res._redirectUrl, "http://localhost").searchParams.get("code")!;
    const entry = redeemCodes.get(code);
    expect(entry?.isNewUser).toBe(true);
    expect(entry?.userId).toBe("user_new_001");
  });
});

// ─── GET /api/auth/google/callback — existing user ───────────────────────────

describe("GET /api/auth/google/callback — existing user (DB select hit)", () => {
  beforeEach(() => {
    redeemCodes.clear();
    mockDbSelect.mockResolvedValue([makeDbUser()]);
    mockDbUpdate.mockResolvedValue([]);
    (oidc.authorizationCodeGrant as ReturnType<typeof vi.fn>).mockResolvedValue({
      claims: () => makeGoogleClaims(),
    });
  });
  afterEach(() => { redeemCodes.clear(); vi.clearAllMocks(); });

  it("issues a redeem code with isNewUser=false", async () => {
    const req = makeReq({ cookies: callbackCookies() });
    const res = makeRes();
    await callbackHandler(req, res);

    expect(res._redirectUrl).toMatch(/\/oauth-callback\?code=[0-9a-f]{32}$/);
    const code = new URL(res._redirectUrl, "http://localhost").searchParams.get("code")!;
    const entry = redeemCodes.get(code);
    expect(entry?.isNewUser).toBe(false);
    expect(entry?.userId).toBe("user_existing_001");
  });
});

// ─── GET /api/auth/google/callback — suspended account ───────────────────────

describe("GET /api/auth/google/callback — suspended account", () => {
  beforeEach(() => {
    redeemCodes.clear();
    mockDbSelect.mockResolvedValue([makeDbUser({ suspended_at: new Date() })]);
    (oidc.authorizationCodeGrant as ReturnType<typeof vi.fn>).mockResolvedValue({
      claims: () => makeGoogleClaims(),
    });
  });
  afterEach(() => { redeemCodes.clear(); vi.clearAllMocks(); });

  it("redirects to /signin?error=account_suspended and issues no redeem code", async () => {
    const req = makeReq({ cookies: callbackCookies() });
    const res = makeRes();
    await callbackHandler(req, res);
    expect(res._redirectUrl).toContain("/signin?error=account_suspended");
    expect(redeemCodes.size).toBe(0);
  });
});

// ─── Full OAuth redirect loop (init → callback) ───────────────────────────────
//
// Exercises the chain: init route sets cookies → callback route reads those
// cookies, exchanges the code, and issues a redeem code. Asserts that the
// isNewUser flag correctly reflects the DB lookup outcome without any mocked
// shortcut between the two legs.

describe("Full OAuth loop: init → callback", () => {
  beforeEach(() => {
    redeemCodes.clear();
    process.env.GOOGLE_CLIENT_ID = "test-id";
    process.env.GOOGLE_CLIENT_SECRET = "test-secret";
  });
  afterEach(() => {
    redeemCodes.clear();
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    vi.clearAllMocks();
  });

  it("new user: init sets cookies → callback issues isNewUser=true redeem code", async () => {
    mockDbSelect.mockResolvedValue([]);
    mockDbInsert.mockResolvedValue([makeDbUser({ id: "user_loop_new", onboarding_completed: false })]);
    mockDbUpdate.mockResolvedValue([]);
    (oidc.authorizationCodeGrant as ReturnType<typeof vi.fn>).mockResolvedValue({
      claims: () => makeGoogleClaims({ sub: "loop-new-sub" }),
    });

    // Step 1: init route — user clicks "Sign in with Google"
    const initReq = makeReq({ url: "/api/auth/google", query: { returnTo: "/oauth-callback" } });
    const initRes = makeRes();
    await initHandler(initReq, initRes);

    expect(initRes._redirectUrl).toContain("accounts.google.com");
    const issuedCookies = initRes._cookies;
    expect(issuedCookies["g_code_verifier"]).toBeTruthy();
    expect(issuedCookies["g_state"]).toBeTruthy();

    // Step 2: callback route — Google redirects back with an auth code
    const cbReq = makeReq({ cookies: issuedCookies });
    const cbRes = makeRes();
    await callbackHandler(cbReq, cbRes);

    expect(cbRes._redirectUrl).toMatch(/\/oauth-callback\?code=[0-9a-f]{32}$/);
    const code = new URL(cbRes._redirectUrl, "http://localhost").searchParams.get("code")!;
    const entry = redeemCodes.get(code);
    expect(entry?.isNewUser).toBe(true);
    expect(entry?.userId).toBe("user_loop_new");
  });

  it("existing user: init sets cookies → callback issues isNewUser=false redeem code", async () => {
    mockDbSelect.mockResolvedValue([makeDbUser({ id: "user_loop_existing" })]);
    mockDbUpdate.mockResolvedValue([]);
    (oidc.authorizationCodeGrant as ReturnType<typeof vi.fn>).mockResolvedValue({
      claims: () => makeGoogleClaims(),
    });

    // Step 1: init
    const initReq = makeReq({ url: "/api/auth/google", query: { returnTo: "/oauth-callback" } });
    const initRes = makeRes();
    await initHandler(initReq, initRes);
    const issuedCookies = initRes._cookies;

    // Step 2: callback
    const cbReq = makeReq({ cookies: issuedCookies });
    const cbRes = makeRes();
    await callbackHandler(cbReq, cbRes);

    const code = new URL(cbRes._redirectUrl, "http://localhost").searchParams.get("code")!;
    const entry = redeemCodes.get(code);
    expect(entry?.isNewUser).toBe(false);
    expect(entry?.userId).toBe("user_loop_existing");
  });
});
