/**
 * Unit tests for the welcome-banner session storage helpers.
 *
 * Scenarios covered:
 *  1. Anonymous first visit  — shows banner, writes anon key
 *  2. Named first visit      — shows banner, writes named key
 *  3. Repeat visit (anon)    — banner suppressed because anon key already set
 *  4. Repeat visit (named)   — banner suppressed because named key already set
 *  5. Upgrading anon → named — shows banner again (different key)
 *  6. Missing userId         — banner suppressed
 *  7. Missing profile        — banner suppressed
 *  8. Missing nobleScore     — banner suppressed
 *  9. Timer constant         — WELCOME_DURATION_MS is 7000 ms
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  WELCOME_DURATION_MS,
  getWelcomeSessionKey,
  markWelcomeShown,
  shouldShowWelcomeBanner,
} from "../lib/welcome-banner";

// ─── In-memory sessionStorage mock ───────────────────────────────────────────

class SessionStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return Object.prototype.hasOwnProperty.call(this.store, key)
      ? this.store[key]
      : null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

const mockSessionStorage = new SessionStorageMock();

// Replace the global before each test so every test starts with a clean slate.
beforeEach(() => {
  mockSessionStorage.clear();
  Object.defineProperty(globalThis, "sessionStorage", {
    value: mockSessionStorage,
    writable: true,
    configurable: true,
  });
});

// ─── getWelcomeSessionKey ─────────────────────────────────────────────────────

describe("getWelcomeSessionKey", () => {
  it("returns an anon key when the user has no name", () => {
    expect(getWelcomeSessionKey("user-42", false)).toBe(
      "welcome_shown_anon_user-42",
    );
  });

  it("returns a named key when the user has a name", () => {
    expect(getWelcomeSessionKey("user-42", true)).toBe(
      "welcome_shown_named_user-42",
    );
  });

  it("includes the userId in the key so different users get separate entries", () => {
    expect(getWelcomeSessionKey("alice", true)).not.toBe(
      getWelcomeSessionKey("bob", true),
    );
  });
});

// ─── shouldShowWelcomeBanner ──────────────────────────────────────────────────

describe("shouldShowWelcomeBanner — anonymous first visit", () => {
  it("returns show:true with the correct anon key", () => {
    const result = shouldShowWelcomeBanner("user-1", true, true, false);
    expect(result).toEqual({ show: true, key: "welcome_shown_anon_user-1" });
  });

  it("does NOT write the key to sessionStorage itself", () => {
    shouldShowWelcomeBanner("user-1", true, true, false);
    expect(sessionStorage.getItem("welcome_shown_anon_user-1")).toBeNull();
  });
});

describe("shouldShowWelcomeBanner — named first visit", () => {
  it("returns show:true with the correct named key", () => {
    const result = shouldShowWelcomeBanner("user-1", true, true, true);
    expect(result).toEqual({ show: true, key: "welcome_shown_named_user-1" });
  });
});

describe("shouldShowWelcomeBanner — repeat anonymous visit (same session)", () => {
  it("returns show:false when the anon key is already in sessionStorage", () => {
    sessionStorage.setItem("welcome_shown_anon_user-1", "1");
    const result = shouldShowWelcomeBanner("user-1", true, true, false);
    expect(result).toEqual({ show: false });
  });
});

describe("shouldShowWelcomeBanner — repeat named visit (same session)", () => {
  it("returns show:false when the named key is already in sessionStorage", () => {
    sessionStorage.setItem("welcome_shown_named_user-1", "1");
    const result = shouldShowWelcomeBanner("user-1", true, true, true);
    expect(result).toEqual({ show: false });
  });
});

describe("shouldShowWelcomeBanner — upgrading from anonymous to named", () => {
  it("shows the banner again after a name is added (different session key)", () => {
    // Simulate: anon visit happened first.
    sessionStorage.setItem("welcome_shown_anon_user-1", "1");

    // Now the user has added their name — the named key doesn't exist yet.
    const result = shouldShowWelcomeBanner("user-1", true, true, true);
    expect(result).toEqual({ show: true, key: "welcome_shown_named_user-1" });
  });

  it("suppresses the named banner once it has already been shown", () => {
    sessionStorage.setItem("welcome_shown_anon_user-1", "1");
    sessionStorage.setItem("welcome_shown_named_user-1", "1");

    const result = shouldShowWelcomeBanner("user-1", true, true, true);
    expect(result).toEqual({ show: false });
  });
});

describe("shouldShowWelcomeBanner — missing pre-conditions", () => {
  it("returns show:false when userId is null", () => {
    expect(shouldShowWelcomeBanner(null, true, true, false)).toEqual({
      show: false,
    });
  });

  it("returns show:false when userId is undefined", () => {
    expect(shouldShowWelcomeBanner(undefined, true, true, false)).toEqual({
      show: false,
    });
  });

  it("returns show:false when profile is not yet loaded", () => {
    expect(
      shouldShowWelcomeBanner("user-1", false, true, false),
    ).toEqual({ show: false });
  });

  it("returns show:false when nobleScore is not yet loaded", () => {
    expect(
      shouldShowWelcomeBanner("user-1", true, false, false),
    ).toEqual({ show: false });
  });

  it("returns show:false when both profile and nobleScore are missing", () => {
    expect(
      shouldShowWelcomeBanner("user-1", false, false, false),
    ).toEqual({ show: false });
  });
});

// ─── markWelcomeShown ─────────────────────────────────────────────────────────

describe("markWelcomeShown", () => {
  it("writes the anon key to sessionStorage", () => {
    markWelcomeShown("welcome_shown_anon_user-1");
    expect(sessionStorage.getItem("welcome_shown_anon_user-1")).toBe("1");
  });

  it("writes the named key to sessionStorage", () => {
    markWelcomeShown("welcome_shown_named_user-1");
    expect(sessionStorage.getItem("welcome_shown_named_user-1")).toBe("1");
  });

  it("after markWelcomeShown (anon), shouldShowWelcomeBanner returns show:false", () => {
    const first = shouldShowWelcomeBanner("user-1", true, true, false);
    expect(first.show).toBe(true);
    if (first.show) markWelcomeShown(first.key);
    const second = shouldShowWelcomeBanner("user-1", true, true, false);
    expect(second).toEqual({ show: false });
  });

  it("after markWelcomeShown (named), shouldShowWelcomeBanner returns show:false", () => {
    const first = shouldShowWelcomeBanner("user-1", true, true, true);
    expect(first.show).toBe(true);
    if (first.show) markWelcomeShown(first.key);
    const second = shouldShowWelcomeBanner("user-1", true, true, true);
    expect(second).toEqual({ show: false });
  });
});

// ─── Full visit flow simulations (mirrors Home.tsx useEffect behaviour) ───────

describe("Full visit flow — anonymous first visit", () => {
  it("shows banner on first visit and suppresses on second visit", () => {
    const userId = "flow-user-anon";

    // First render: no pre-existing key → show banner and mark it
    const visit1 = shouldShowWelcomeBanner(userId, true, true, false);
    expect(visit1).toEqual({ show: true, key: `welcome_shown_anon_${userId}` });
    if (visit1.show) markWelcomeShown(visit1.key);
    expect(sessionStorage.getItem(`welcome_shown_anon_${userId}`)).toBe("1");

    // Second render in same session → suppress
    const visit2 = shouldShowWelcomeBanner(userId, true, true, false);
    expect(visit2).toEqual({ show: false });
  });
});

describe("Full visit flow — named first visit", () => {
  it("shows named banner on first visit and suppresses on second visit", () => {
    const userId = "flow-user-named";

    const visit1 = shouldShowWelcomeBanner(userId, true, true, true);
    expect(visit1).toEqual({ show: true, key: `welcome_shown_named_${userId}` });
    if (visit1.show) markWelcomeShown(visit1.key);
    expect(sessionStorage.getItem(`welcome_shown_named_${userId}`)).toBe("1");

    const visit2 = shouldShowWelcomeBanner(userId, true, true, true);
    expect(visit2).toEqual({ show: false });
  });
});

describe("Full visit flow — anonymous then named (upgrade scenario)", () => {
  it("shows banner on first anon visit, then shows again after name is added, then suppresses", () => {
    const userId = "flow-user-upgrade";

    // Step 1: anonymous visit
    const anonVisit = shouldShowWelcomeBanner(userId, true, true, false);
    expect(anonVisit).toEqual({ show: true, key: `welcome_shown_anon_${userId}` });
    if (anonVisit.show) markWelcomeShown(anonVisit.key);

    // Step 2: user returns still anonymously — suppressed
    const anonRepeat = shouldShowWelcomeBanner(userId, true, true, false);
    expect(anonRepeat).toEqual({ show: false });

    // Step 3: user adds their name (hasName: true) — new key, banner shown again
    const namedVisit = shouldShowWelcomeBanner(userId, true, true, true);
    expect(namedVisit).toEqual({ show: true, key: `welcome_shown_named_${userId}` });
    if (namedVisit.show) markWelcomeShown(namedVisit.key);
    expect(sessionStorage.getItem(`welcome_shown_named_${userId}`)).toBe("1");

    // Step 4: further named visits — suppressed
    const namedRepeat = shouldShowWelcomeBanner(userId, true, true, true);
    expect(namedRepeat).toEqual({ show: false });
  });
});

// ─── WELCOME_DURATION_MS ──────────────────────────────────────────────────────

describe("WELCOME_DURATION_MS", () => {
  it("is 7000 ms", () => {
    expect(WELCOME_DURATION_MS).toBe(7_000);
  });
});
