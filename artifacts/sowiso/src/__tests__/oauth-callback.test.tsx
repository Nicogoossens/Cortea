/**
 * Tests for the OAuthCallback page — the client-side leg of the OAuth loop.
 *
 * /oauth-callback?code=<one-time-code>
 *   → /api/auth/redeem  (exchange code for session cookie)
 *   → /api/users/profile (check onboarding status)
 *   → navigate to /onboarding (new user) or / (returning user)
 *
 * Mocks: window.fetch, wouter, @/lib/auth, @/lib/i18n, @/lib/active-region,
 *        @/hooks/usePageTitle.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";

// ─── mock wouter ─────────────────────────────────────────────────────────────
const mockSetLocation = vi.fn();

vi.mock("wouter", () => ({
  useLocation: () => ["/oauth-callback", mockSetLocation],
}));

// ─── mock @/lib/auth ─────────────────────────────────────────────────────────
const mockLogin = vi.fn();

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({ login: mockLogin }),
}));

// ─── mock @/lib/i18n ─────────────────────────────────────────────────────────
vi.mock("@/lib/i18n", () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    setLocale: vi.fn(),
  }),
  ALL_LOCALES: ["en-GB", "nl-NL"],
}));

// ─── mock @/lib/i18n-locales ─────────────────────────────────────────────────
vi.mock("@/lib/i18n-locales", () => ({
  ALL_LOCALES: ["en-GB", "nl-NL"],
}));

// ─── mock @/lib/active-region ────────────────────────────────────────────────
vi.mock("@/lib/active-region", () => ({
  useActiveRegion: () => ({ setActiveRegion: vi.fn() }),
  COMPASS_REGIONS: [{ code: "GB" }, { code: "NL" }],
}));

// ─── mock @/hooks/usePageTitle ───────────────────────────────────────────────
vi.mock("@/hooks/usePageTitle", () => ({
  usePageTitle: vi.fn(),
}));

// ─── import component after mocks ────────────────────────────────────────────
import OAuthCallback from "../pages/OAuthCallback";

// ─── helpers ─────────────────────────────────────────────────────────────────

/**
 * Set window.location.search to a query string and render the component.
 * Returns the rendered result plus a helper that waits for navigation.
 */
function renderWithCode(search: string) {
  Object.defineProperty(window, "location", {
    writable: true,
    value: { ...window.location, search },
  });
  return render(React.createElement(OAuthCallback));
}

/**
 * Build a mock redeem response from /api/auth/redeem.
 */
function makeRedeemResponse(overrides: {
  userId?: string;
  fullName?: string | null;
  isAdmin?: boolean;
  isNewUser?: boolean;
} = {}) {
  return {
    userId: "user_test_001",
    fullName: "Test User",
    isAdmin: false,
    isNewUser: false,
    ...overrides,
  };
}

/**
 * Build a mock profile response from /api/users/profile.
 */
function makeProfileResponse(overrides: {
  onboarding_completed?: boolean;
  language_code?: string;
  active_region?: string;
} = {}) {
  return {
    onboarding_completed: true,
    language_code: "en",
    active_region: "GB",
    ...overrides,
  };
}

// ─── Setup / teardown ────────────────────────────────────────────────────────

beforeEach(() => {
  mockSetLocation.mockClear();
  mockLogin.mockClear();
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ─── Scenario 1: no ?code param ──────────────────────────────────────────────

describe("OAuthCallback — no code in URL", () => {
  it("redirects to /signin?error=auth_failed when URL has no code param", async () => {
    renderWithCode(""); // no query string

    await waitFor(() => {
      expect(mockSetLocation).toHaveBeenCalledWith("/signin?error=auth_failed");
    });

    expect(fetch).not.toHaveBeenCalled();
  });
});

// ─── Scenario 2: ?error param in URL ─────────────────────────────────────────

describe("OAuthCallback — error param in URL", () => {
  it("redirects to /signin?error=auth_failed when ?error=auth_failed is present", async () => {
    renderWithCode("?error=auth_failed");

    await waitFor(() => {
      expect(mockSetLocation).toHaveBeenCalledWith("/signin?error=auth_failed");
    });
  });

  it("redirects to /signin?error=auth_failed when ?error=account_suspended is present", async () => {
    renderWithCode("?error=account_suspended");

    await waitFor(() => {
      expect(mockSetLocation).toHaveBeenCalledWith("/signin?error=auth_failed");
    });
  });
});

// ─── Scenario 3: redeem endpoint fails ───────────────────────────────────────

describe("OAuthCallback — redeem API failure", () => {
  it("redirects to /signin?error=auth_failed when /api/auth/redeem returns 401", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
    } as Response);

    renderWithCode("?code=valid-looking-code");

    await waitFor(() => {
      expect(mockSetLocation).toHaveBeenCalledWith("/signin?error=auth_failed");
    });
  });

  it("redirects to /signin?error=auth_failed when fetch throws (network error)", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

    renderWithCode("?code=valid-looking-code");

    await waitFor(() => {
      expect(mockSetLocation).toHaveBeenCalledWith("/signin?error=auth_failed");
    });
  });
});

// ─── Scenario 4: new user → /onboarding ──────────────────────────────────────

describe("OAuthCallback — new user flow (isNewUser: true)", () => {
  beforeEach(() => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => makeRedeemResponse({ isNewUser: true }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => makeProfileResponse({ onboarding_completed: false }),
      } as Response);
  });

  it("navigates to /onboarding for a brand-new user", async () => {
    renderWithCode("?code=new-user-redeem-code");

    await waitFor(() => {
      expect(mockSetLocation).toHaveBeenCalledWith("/onboarding");
    });
  });

  it("calls login() with the correct userId and name", async () => {
    renderWithCode("?code=new-user-redeem-code");

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        "user_test_001",
        expect.objectContaining({ name: "Test User", isAdmin: false })
      );
    });
  });
});

// ─── Scenario 5: existing user → / ───────────────────────────────────────────

describe("OAuthCallback — existing user flow (isNewUser: false, onboarding complete)", () => {
  beforeEach(() => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => makeRedeemResponse({ isNewUser: false }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => makeProfileResponse({ onboarding_completed: true }),
      } as Response);
  });

  it("navigates to / (home) for a returning user with completed onboarding", async () => {
    renderWithCode("?code=existing-user-redeem-code");

    await waitFor(() => {
      expect(mockSetLocation).toHaveBeenCalledWith("/");
    });
  });

  it("calls login() for the returning user", async () => {
    renderWithCode("?code=existing-user-redeem-code");

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        "user_test_001",
        expect.objectContaining({ isAdmin: false })
      );
    });
  });
});

// ─── Scenario 6: incomplete onboarding fallback ───────────────────────────────

describe("OAuthCallback — onboarding incomplete fallback", () => {
  it("navigates to / when isNewUser=false even if onboarding_completed=false (isNewUser wins)", async () => {
    // The ?? operator: `false ?? <anything>` = false. The server-supplied
    // isNewUser flag takes precedence over the profile-based fallback.
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => makeRedeemResponse({ isNewUser: false }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => makeProfileResponse({ onboarding_completed: false }),
      } as Response);

    renderWithCode("?code=incomplete-onboarding-code");

    await waitFor(() => {
      expect(mockSetLocation).toHaveBeenCalledWith("/");
    });
  });

  it("navigates to /onboarding via profile fallback when isNewUser is absent from redeem response", async () => {
    // Legacy / pre-rollout sessions may omit isNewUser from the redeem payload.
    // In that case the component falls back to profile.onboarding_completed.
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        // isNewUser intentionally omitted → undefined → triggers fallback
        json: async () => ({ userId: "user_legacy_001", fullName: "Legacy", isAdmin: false }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => makeProfileResponse({ onboarding_completed: false }),
      } as Response);

    renderWithCode("?code=legacy-no-isnewuser-code");

    await waitFor(() => {
      expect(mockSetLocation).toHaveBeenCalledWith("/onboarding");
    });
  });

  it("navigates to /onboarding when profile fetch fails but isNewUser=true", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => makeRedeemResponse({ isNewUser: true }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false, // profile fetch fails
        status: 401,
      } as Response);

    renderWithCode("?code=profile-fetch-fail-code");

    await waitFor(() => {
      expect(mockSetLocation).toHaveBeenCalledWith("/onboarding");
    });
  });
});

// ─── Invariant: redeem endpoint called with the correct code ──────────────────

describe("OAuthCallback — redeem request format", () => {
  it("calls /api/auth/redeem with the code from the URL", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => makeRedeemResponse({ isNewUser: false }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => makeProfileResponse(),
      } as Response);

    renderWithCode("?code=specific-test-code-xyz");

    await waitFor(() => {
      const firstCall = vi.mocked(fetch).mock.calls[0];
      expect(firstCall[0]).toContain("/api/auth/redeem");
      expect(firstCall[0]).toContain("specific-test-code-xyz");
    });
  });

  it("includes credentials: include in the redeem request", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => makeRedeemResponse({ isNewUser: false }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => makeProfileResponse(),
      } as Response);

    renderWithCode("?code=creds-check-code");

    await waitFor(() => {
      const firstCall = vi.mocked(fetch).mock.calls[0];
      expect(firstCall[1]).toMatchObject({ credentials: "include" });
    });
  });
});
