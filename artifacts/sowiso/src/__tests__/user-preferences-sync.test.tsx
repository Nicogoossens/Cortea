/**
 * Integration tests for <UserPreferencesSync />.
 *
 * The component is mounted against the real production code imported from
 * `@/components/UserPreferencesSync`. We mock only the React-context hooks
 * (`useAuth`, `useLanguage`, `useAccessibility`) and the global `fetch`.
 * `hasStoredLocalePreference` and `hasSupportedBrowserLocale` run against
 * the real happy-dom `localStorage` and `navigator.language` so their actual
 * read logic is exercised — no guard logic is duplicated here.
 */

import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, waitFor, cleanup } from "@testing-library/react";
import { UserPreferencesSync } from "@/components/UserPreferencesSync";

// ── Locale storage key (mirrors the private constant in language-provider.tsx) ──
const STORAGE_KEY = "sowiso_locale";

// ── Module-level mocks ────────────────────────────────────────────────────────

const mockSetLocale = vi.fn();
const mockLogin = vi.fn();
const mockAutoApplyAgeFont = vi.fn();

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    userId: "user-abc",
    login: mockLogin,
    logout: vi.fn(),
  }),
}));

vi.mock("@/lib/i18n", () => ({
  useLanguage: () => ({
    locale: "en-GB" as const,
    setLocale: mockSetLocale,
    t: (k: string) => k,
    dir: "ltr" as const,
    language: "en" as const,
  }),
}));

vi.mock("@/lib/accessibility", () => ({
  useAccessibility: () => ({
    autoApplyAgeFont: mockAutoApplyAgeFont,
    highContrast: false,
    setHighContrast: vi.fn(),
    fontSize: "medium" as const,
    setFontSize: vi.fn(),
  }),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeProfileFetch(profile: Record<string, unknown>) {
  return vi.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify(profile), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    )
  );
}

function setNavigatorLanguage(lang: string) {
  Object.defineProperty(navigator, "language", {
    value: lang,
    configurable: true,
  });
}

// ── Suite ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
  mockSetLocale.mockClear();
  mockLogin.mockClear();
  mockAutoApplyAgeFont.mockClear();
  // Default: browser language has no supported locale match
  setNavigatorLanguage("xx-XX");
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("UserPreferencesSync — setLocale is NOT called when localStorage has a preference", () => {
  it("does not call setLocale when sowiso_locale is already in localStorage", async () => {
    localStorage.setItem(STORAGE_KEY, "fr-FR"); // user previously chose French
    // Include is_admin so login() is called — used as a reliable completion signal
    vi.stubGlobal("fetch", makeProfileFetch({ language_code: "nl", is_admin: false, id: "u1" }));

    render(<UserPreferencesSync />);

    // Wait until the async effect resolves (login is the observable side-effect)
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });

    // setLocale must never have been called despite the server suggesting "nl"
    expect(mockSetLocale).not.toHaveBeenCalled();
  });

  it("does not call setLocale when the browser language already matches a supported locale", async () => {
    localStorage.removeItem(STORAGE_KEY); // no stored pref
    setNavigatorLanguage("nl-NL"); // browser picks a supported locale
    vi.stubGlobal("fetch", makeProfileFetch({ language_code: "de", is_admin: false, id: "u1" }));

    render(<UserPreferencesSync />);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });

    expect(mockSetLocale).not.toHaveBeenCalled();
  });

  it("does not call setLocale when profile has no language_code", async () => {
    localStorage.removeItem(STORAGE_KEY);
    vi.stubGlobal("fetch", makeProfileFetch({ age_group: "senior_elder" }));

    render(<UserPreferencesSync />);

    await waitFor(() => {
      expect(mockAutoApplyAgeFont).toHaveBeenCalledWith("large");
    });

    expect(mockSetLocale).not.toHaveBeenCalled();
  });
});

describe("UserPreferencesSync — setLocale IS called when all guard conditions allow it", () => {
  it("calls setLocale with the matched locale when no stored pref and no browser match", async () => {
    localStorage.removeItem(STORAGE_KEY); // no stored preference
    setNavigatorLanguage("xx-XX"); // browser language matches nothing

    vi.stubGlobal("fetch", makeProfileFetch({ language_code: "nl" }));

    render(<UserPreferencesSync />);

    await waitFor(() => {
      expect(mockSetLocale).toHaveBeenCalledWith("nl-NL");
    });
  });

  it("resolves a full locale language_code (e.g. fr-FR) correctly", async () => {
    localStorage.removeItem(STORAGE_KEY);
    setNavigatorLanguage("xx-XX");

    vi.stubGlobal("fetch", makeProfileFetch({ language_code: "fr-FR" }));

    render(<UserPreferencesSync />);

    await waitFor(() => {
      expect(mockSetLocale).toHaveBeenCalledWith("fr-FR");
    });
  });
});

describe("UserPreferencesSync — fetch failure does not crash the component", () => {
  it("silently swallows a network error and does not call setLocale", async () => {
    localStorage.removeItem(STORAGE_KEY);
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("Network error"))));

    render(<UserPreferencesSync />);

    // Wait a tick for the promise chain to settle
    await new Promise((r) => setTimeout(r, 50));

    expect(mockSetLocale).not.toHaveBeenCalled();
  });
});
