/**
 * Unit tests for the Google OAuth redeem-code flow.
 *
 * Covers:
 *  - issueRedeemCode  — creates a unique opaque code and stores the entry
 *  - redeemCodes map  — single-use semantics (code removed after read)
 *  - pruneExpiredCodes — entries past their TTL are removed
 *  - getOrigin helper (real implementation from api-server/src/lib/origin.ts)
 *                     — APP_PUBLIC_URL override vs req-derived fallback
 *
 * These tests run in Vitest (happy-dom) and never start an HTTP server or
 * touch the database.  They give a reproducible, committed baseline for the
 * correct operation of the code exchange that the Google OAuth callback relies on.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  issueRedeemCode,
  redeemCodes,
  pruneExpiredCodes,
  type RedeemEntry,
} from "../../../api-server/src/lib/redeem-codes";
import { getOrigin } from "../../../api-server/src/lib/origin";
import type { Request } from "express";

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<Omit<RedeemEntry, "expiresAt">> = {}): Omit<RedeemEntry, "expiresAt"> {
  return {
    token: "tok_test",
    userId: "user_test_001",
    fullName: "Test User",
    isAdmin: false,
    isNewUser: false,
    ...overrides,
  };
}

function makeReq(protocol: string, hostname: string): Request {
  return { protocol, hostname } as unknown as Request;
}

// ─── issueRedeemCode ─────────────────────────────────────────────────────────

describe("issueRedeemCode", () => {
  beforeEach(() => redeemCodes.clear());
  afterEach(() => redeemCodes.clear());

  it("returns a 32-character hex string", () => {
    const code = issueRedeemCode(makeEntry());
    expect(code).toMatch(/^[0-9a-f]{32}$/);
  });

  it("stores the entry in the redeemCodes map", () => {
    const code = issueRedeemCode(makeEntry());
    expect(redeemCodes.has(code)).toBe(true);
  });

  it("stores all provided fields", () => {
    const entry = makeEntry({ token: "tok_abc", userId: "user_x", fullName: "Alice", isAdmin: true, isNewUser: true });
    const code = issueRedeemCode(entry);
    const stored = redeemCodes.get(code)!;
    expect(stored.token).toBe("tok_abc");
    expect(stored.userId).toBe("user_x");
    expect(stored.fullName).toBe("Alice");
    expect(stored.isAdmin).toBe(true);
    expect(stored.isNewUser).toBe(true);
  });

  it("sets expiresAt roughly 60 seconds in the future", () => {
    const before = Date.now();
    const code = issueRedeemCode(makeEntry());
    const after = Date.now();
    const entry = redeemCodes.get(code)!;
    expect(entry.expiresAt).toBeGreaterThanOrEqual(before + 59_900);
    expect(entry.expiresAt).toBeLessThanOrEqual(after + 60_100);
  });

  it("each call produces a unique code", () => {
    const codes = Array.from({ length: 20 }, () => issueRedeemCode(makeEntry()));
    const unique = new Set(codes);
    expect(unique.size).toBe(20);
  });
});

// ─── single-use semantics (simulated) ────────────────────────────────────────

describe("redeem-code single-use semantics", () => {
  beforeEach(() => redeemCodes.clear());
  afterEach(() => redeemCodes.clear());

  it("entry is present before redeem and absent after manual deletion", () => {
    const code = issueRedeemCode(makeEntry());
    expect(redeemCodes.has(code)).toBe(true);

    // Simulate what /api/auth/redeem does: read + delete
    const entry = redeemCodes.get(code);
    redeemCodes.delete(code);

    expect(entry).toBeDefined();
    expect(redeemCodes.has(code)).toBe(false);
  });

  it("a second redemption attempt with the same code returns undefined", () => {
    const code = issueRedeemCode(makeEntry());
    redeemCodes.delete(code); // first redeem
    expect(redeemCodes.get(code)).toBeUndefined();
  });
});

// ─── pruneExpiredCodes ───────────────────────────────────────────────────────

describe("pruneExpiredCodes", () => {
  beforeEach(() => redeemCodes.clear());
  afterEach(() => redeemCodes.clear());

  it("removes entries whose expiresAt is in the past", () => {
    const expiredCode = "expired_code_abc";
    redeemCodes.set(expiredCode, {
      token: "tok",
      userId: "u1",
      fullName: null,
      isAdmin: false,
      isNewUser: false,
      expiresAt: Date.now() - 1,
    });

    const freshCode = issueRedeemCode(makeEntry());

    pruneExpiredCodes();

    expect(redeemCodes.has(expiredCode)).toBe(false);
    expect(redeemCodes.has(freshCode)).toBe(true);
  });

  it("does not remove entries that have not yet expired", () => {
    const code = issueRedeemCode(makeEntry());
    pruneExpiredCodes();
    expect(redeemCodes.has(code)).toBe(true);
  });
});

// ─── getOrigin — tests the REAL implementation from api-server/src/lib/origin ─

describe("getOrigin — APP_PUBLIC_URL override", () => {
  const originalUrl = process.env.APP_PUBLIC_URL;

  afterEach(() => {
    if (originalUrl === undefined) {
      delete process.env.APP_PUBLIC_URL;
    } else {
      process.env.APP_PUBLIC_URL = originalUrl;
    }
  });

  it("returns APP_PUBLIC_URL without trailing slash when set with slash", () => {
    process.env.APP_PUBLIC_URL = "https://sowiso-01.replit.app/";
    const result = getOrigin(makeReq("https", "ignored.host"));
    expect(result).toBe("https://sowiso-01.replit.app");
  });

  it("returns APP_PUBLIC_URL unchanged when already clean (no trailing slash)", () => {
    process.env.APP_PUBLIC_URL = "https://sowiso-01.replit.app";
    const result = getOrigin(makeReq("https", "ignored.host"));
    expect(result).toBe("https://sowiso-01.replit.app");
  });

  it("falls back to protocol+hostname when APP_PUBLIC_URL is not set", () => {
    delete process.env.APP_PUBLIC_URL;
    const result = getOrigin(makeReq("https", "dev.example.replit.dev"));
    expect(result).toBe("https://dev.example.replit.dev");
  });

  it("builds a correct production callback URL", () => {
    process.env.APP_PUBLIC_URL = "https://sowiso-01.replit.app";
    const origin = getOrigin(makeReq("https", "ignored.host"));
    const callbackUrl = `${origin}/api/auth/google/callback`;
    expect(callbackUrl).toBe("https://sowiso-01.replit.app/api/auth/google/callback");
  });

  it("ignores request protocol/hostname entirely when APP_PUBLIC_URL is set", () => {
    process.env.APP_PUBLIC_URL = "https://sowiso-01.replit.app";
    const result = getOrigin(makeReq("http", "proxy.internal"));
    expect(result).toBe("https://sowiso-01.replit.app");
    // Critically: does NOT produce http://proxy.internal
    expect(result).not.toContain("proxy.internal");
  });
});
