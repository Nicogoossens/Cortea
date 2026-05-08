/**
 * Tests for EmailVerify locale-application behaviour.
 *
 * When a user follows a magic-link (GET /api/auth/verify), the server
 * returns `language_code` in the response body.  The component must call
 * `setLocale()` synchronously inside the same React batch as the status
 * transition so that the post-login screen renders in the correct language
 * — no flash of the wrong locale.
 *
 * Covered cases:
 *  - Returning user (already_verified: true)  → setLocale called immediately
 *  - New user (already_verified absent/false)  → setLocale called immediately
 *  - active_region provided                   → resolved to exact locale
 *  - active_region absent                     → resolved via base-lang fallback
 *  - language_code absent from response       → setLocale NOT called
 *  - Unresolvable language_code               → setLocale NOT called
 *  - Error / expired / invalid responses      → setLocale NOT called
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";

// ─── mock wouter ─────────────────────────────────────────────────────────────
const mockSetLocation = vi.fn();

vi.mock("wouter", () => ({
  useLocation: () => ["/verify", mockSetLocation],
  Link: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement("a", { href }, children),
}));

// ─── mock @/lib/auth ─────────────────────────────────────────────────────────
const mockLogin = vi.fn();

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({ login: mockLogin }),
}));

// ─── mock @/lib/i18n ─────────────────────────────────────────────────────────
const mockSetLocale = vi.fn();

vi.mock("@/lib/i18n", () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    setLocale: mockSetLocale,
  }),
  ALL_LOCALES: ["en-GB", "en-US", "nl-NL", "fr-FR", "de-DE"],
}));

// ─── mock @/lib/i18n-locales ──────────────────────────────────────────────────
vi.mock("@/lib/i18n-locales", () => ({
  ALL_LOCALES: ["en-GB", "en-US", "nl-NL", "fr-FR", "de-DE"],
}));

// ─── mock @/lib/active-region ─────────────────────────────────────────────────
const mockSetActiveRegion = vi.fn();

vi.mock("@/lib/active-region", () => ({
  useActiveRegion: () => ({ setActiveRegion: mockSetActiveRegion }),
  COMPASS_REGIONS: [
    { code: "GB" },
    { code: "US" },
    { code: "NL" },
    { code: "FR" },
    { code: "DE" },
  ],
  FlagEmoji: () => null,
}));

// ─── mock @/hooks/usePageTitle ────────────────────────────────────────────────
vi.mock("@/hooks/usePageTitle", () => ({
  usePageTitle: vi.fn(),
}));

// ─── mock @/lib/utm ───────────────────────────────────────────────────────────
vi.mock("@/lib/utm", () => ({
  getStoredUtmParams: () => ({}),
  clearStoredUtmParams: vi.fn(),
}));

// ─── mock lucide-react ────────────────────────────────────────────────────────
vi.mock("lucide-react", () => ({
  CheckCircle2: () => null,
  XCircle: () => null,
  Loader2: () => null,
  ArrowRight: () => null,
  BookOpen: () => null,
  Compass: () => null,
  Shield: () => null,
  Scan: () => null,
}));

// ─── mock shadcn/ui button ────────────────────────────────────────────────────
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) =>
    React.createElement("button", { onClick }, children),
}));

// ─── import component after mocks ─────────────────────────────────────────────
import EmailVerify from "../pages/EmailVerify";

// ─── helpers ──────────────────────────────────────────────────────────────────

const BASE_ORIGIN = "https://sowiso.test";

function setToken(token: string) {
  Object.defineProperty(window, "location", {
    writable: true,
    configurable: true,
    value: {
      ...window.location,
      origin: BASE_ORIGIN,
      search: `?token=${token}`,
    },
  });
}

function clearToken() {
  Object.defineProperty(window, "location", {
    writable: true,
    configurable: true,
    value: {
      ...window.location,
      origin: BASE_ORIGIN,
      search: "",
    },
  });
}

type VerifyResponseOverrides = {
  already_verified?: boolean;
  user_id?: string;
  full_name?: string;
  is_admin?: boolean;
  language_code?: string;
  active_region?: string;
};

function makeVerifyResponse(overrides: VerifyResponseOverrides = {}) {
  return {
    message: "ok",
    user_id: "user_test_001",
    full_name: "Test User",
    is_admin: false,
    ...overrides,
  };
}

function mockFetchOk(body: object, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify(body), {
          status,
          headers: { "Content-Type": "application/json" },
        })
      )
    )
  );
}

function mockFetchError(status: number) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: "err" }), {
          status,
          headers: { "Content-Type": "application/json" },
        })
      )
    )
  );
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  mockLogin.mockClear();
  mockSetLocale.mockClear();
  mockSetActiveRegion.mockClear();
  mockSetLocation.mockClear();
  setToken("test-magic-link-token");
});

afterEach(() => {
  vi.unstubAllGlobals();
  clearToken();
});

// ─── Core: locale applied from verify response ────────────────────────────────

describe("EmailVerify — setLocale is called from the verify response (magic-link sign-in)", () => {
  it("calls setLocale with the resolved locale when returning user (already_verified: true)", async () => {
    mockFetchOk(
      makeVerifyResponse({ already_verified: true, language_code: "nl", active_region: "NL" })
    );

    render(React.createElement(EmailVerify));

    await waitFor(() => {
      expect(mockSetLocale).toHaveBeenCalledWith("nl-NL");
    });
  });

  it("calls setLocale with the resolved locale when new user (already_verified absent)", async () => {
    mockFetchOk(
      makeVerifyResponse({ language_code: "fr", active_region: "FR" })
    );

    render(React.createElement(EmailVerify));

    await waitFor(() => {
      expect(mockSetLocale).toHaveBeenCalledWith("fr-FR");
    });
  });

  it("resolves locale via base-language fallback when active_region is absent", async () => {
    mockFetchOk(
      makeVerifyResponse({ language_code: "de" })
      // no active_region → resolveLocale falls back to first de-* locale
    );

    render(React.createElement(EmailVerify));

    await waitFor(() => {
      expect(mockSetLocale).toHaveBeenCalledWith("de-DE");
    });
  });

  it("resolves locale via exact lang-region match when both are provided", async () => {
    mockFetchOk(
      makeVerifyResponse({ language_code: "en", active_region: "US" })
    );

    render(React.createElement(EmailVerify));

    await waitFor(() => {
      expect(mockSetLocale).toHaveBeenCalledWith("en-US");
    });
  });
});

// ─── setLocale must NOT be called when data is absent or unresolvable ──────────

describe("EmailVerify — setLocale is NOT called when locale cannot be determined", () => {
  it("does not call setLocale when language_code is absent from the response", async () => {
    mockFetchOk(makeVerifyResponse({ already_verified: true }));
    // no language_code field

    render(React.createElement(EmailVerify));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });

    expect(mockSetLocale).not.toHaveBeenCalled();
  });

  it("does not call setLocale when language_code does not match any supported locale", async () => {
    mockFetchOk(
      makeVerifyResponse({ language_code: "xx" }) // unsupported language
    );

    render(React.createElement(EmailVerify));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });

    expect(mockSetLocale).not.toHaveBeenCalled();
  });
});

// ─── setLocale is NOT called on error responses ───────────────────────────────

describe("EmailVerify — setLocale is NOT called on non-ok responses", () => {
  it("does not call setLocale on a 410 expired response", async () => {
    mockFetchError(410);

    render(React.createElement(EmailVerify));

    await new Promise((r) => setTimeout(r, 50));

    expect(mockSetLocale).not.toHaveBeenCalled();
  });

  it("does not call setLocale on a 404 invalid token response", async () => {
    mockFetchError(404);

    render(React.createElement(EmailVerify));

    await new Promise((r) => setTimeout(r, 50));

    expect(mockSetLocale).not.toHaveBeenCalled();
  });
});

// ─── Ordering: setLocale is called before the post-login view renders ─────────

describe("EmailVerify — locale applied before post-login screen renders", () => {
  it("calls setLocale in the same tick as login() (batched, no intermediate render)", async () => {
    const callOrder: string[] = [];
    mockLogin.mockImplementation(() => callOrder.push("login"));
    mockSetLocale.mockImplementation(() => callOrder.push("setLocale"));

    mockFetchOk(
      makeVerifyResponse({ already_verified: true, language_code: "nl", active_region: "NL" })
    );

    render(React.createElement(EmailVerify));

    await waitFor(() => {
      expect(mockSetLocale).toHaveBeenCalled();
      expect(mockLogin).toHaveBeenCalled();
    });

    // login() comes first in the handler, then setLocale() — both synchronously
    // before the status state update triggers a render of the post-login screen.
    expect(callOrder).toEqual(["login", "setLocale"]);
  });
});
