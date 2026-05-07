import { describe, it, expect, beforeEach, vi } from "vitest";
import { detectLocale, hasStoredLocalePreference, hasSupportedBrowserLocale } from "@/lib/language-provider";

const STORAGE_KEY = "sowiso_locale";

/**
 * Helpers to control localStorage and navigator.language in happy-dom.
 */
function setStoredLocale(value: string) {
  localStorage.setItem(STORAGE_KEY, value);
}

function clearStoredLocale() {
  localStorage.removeItem(STORAGE_KEY);
}

function setNavigatorLanguage(lang: string) {
  Object.defineProperty(navigator, "language", {
    value: lang,
    configurable: true,
  });
}

function clearLangParam() {
  Object.defineProperty(window, "location", {
    value: { search: "" },
    configurable: true,
  });
}

beforeEach(() => {
  localStorage.clear();
  clearLangParam();
  setNavigatorLanguage("en-US");
});

// ── detectLocale ─────────────────────────────────────────────────────────────

describe("detectLocale — stored preference wins", () => {
  it("returns the stored locale when it is a supported locale", () => {
    setStoredLocale("nl-NL");
    setNavigatorLanguage("en-GB"); // browser says English — should be ignored
    expect(detectLocale()).toBe("nl-NL");
  });

  it("returns stored locale regardless of the browser language", () => {
    setStoredLocale("fr-FR");
    setNavigatorLanguage("de-DE");
    expect(detectLocale()).toBe("fr-FR");
  });

  it("ignores a stored value that is NOT a supported locale and falls through", () => {
    setStoredLocale("xx-XX"); // unsupported
    setNavigatorLanguage("nl-NL");
    // falls through to browser match
    expect(detectLocale()).toBe("nl-NL");
  });
});

describe("detectLocale — browser language exact match", () => {
  it("returns browser locale when it exactly matches a supported locale", () => {
    clearStoredLocale();
    setNavigatorLanguage("nl-NL");
    expect(detectLocale()).toBe("nl-NL");
  });

  it("returns browser locale for en-US exact match", () => {
    clearStoredLocale();
    setNavigatorLanguage("en-US");
    expect(detectLocale()).toBe("en-US");
  });

  it("returns browser locale for ja-JP exact match", () => {
    clearStoredLocale();
    setNavigatorLanguage("ja-JP");
    expect(detectLocale()).toBe("ja-JP");
  });
});

describe("detectLocale — browser base-language partial match", () => {
  it("returns the first supported locale whose base language matches the browser base", () => {
    clearStoredLocale();
    // navigator says "nl" (no region) — should pick the only nl locale: nl-NL
    setNavigatorLanguage("nl");
    expect(detectLocale()).toBe("nl-NL");
  });

  it("matches 'es' base language to the first supported es-* locale", () => {
    clearStoredLocale();
    setNavigatorLanguage("es");
    // ALL_LOCALES has es-ES before es-MX
    expect(detectLocale()).toBe("es-ES");
  });

  it("matches 'pt' base language to the first supported pt-* locale", () => {
    clearStoredLocale();
    setNavigatorLanguage("pt");
    expect(detectLocale()).toBe("pt-PT");
  });

  it("matches a region-specific browser locale to the same base-language when the region itself is unsupported", () => {
    clearStoredLocale();
    // "de-AT" is not in ALL_LOCALES but "de" base matches "de-DE"
    setNavigatorLanguage("de-AT");
    expect(detectLocale()).toBe("de-DE");
  });
});

describe("detectLocale — English fallback", () => {
  it("returns en-GB when browser language is completely unknown", () => {
    clearStoredLocale();
    setNavigatorLanguage("xx-XX");
    expect(detectLocale()).toBe("en-GB");
  });

  it("returns en-GB when browser language is an empty-ish value with no match", () => {
    clearStoredLocale();
    setNavigatorLanguage("zz");
    expect(detectLocale()).toBe("en-GB");
  });
});

describe("detectLocale — ?lang= query param takes highest priority", () => {
  it("returns the locale specified via ?lang= even when localStorage has a preference", () => {
    setStoredLocale("nl-NL");
    Object.defineProperty(window, "location", {
      value: { search: "?lang=fr-FR" },
      configurable: true,
    });
    expect(detectLocale()).toBe("fr-FR");
  });

  it("resolves a base-lang param to the first matching locale", () => {
    clearStoredLocale();
    Object.defineProperty(window, "location", {
      value: { search: "?lang=es" },
      configurable: true,
    });
    expect(detectLocale()).toBe("es-ES");
  });

  it("falls through to stored preference when ?lang= value is unsupported", () => {
    setStoredLocale("de-DE");
    Object.defineProperty(window, "location", {
      value: { search: "?lang=xx" },
      configurable: true,
    });
    expect(detectLocale()).toBe("de-DE");
  });
});

describe("detectLocale — ?lang= param is persisted to localStorage", () => {
  it("writes the resolved locale to localStorage when a valid ?lang= param is present", () => {
    clearStoredLocale();
    Object.defineProperty(window, "location", {
      value: { search: "?lang=nl-NL" },
      configurable: true,
    });
    detectLocale();
    expect(localStorage.getItem(STORAGE_KEY)).toBe("nl-NL");
  });

  it("persists the resolved locale even when localStorage previously held a different preference", () => {
    setStoredLocale("en-GB");
    Object.defineProperty(window, "location", {
      value: { search: "?lang=fr-FR" },
      configurable: true,
    });
    detectLocale();
    expect(localStorage.getItem(STORAGE_KEY)).toBe("fr-FR");
  });

  it("persists the expanded locale when a base-lang param is used", () => {
    clearStoredLocale();
    Object.defineProperty(window, "location", {
      value: { search: "?lang=es" },
      configurable: true,
    });
    detectLocale();
    expect(localStorage.getItem(STORAGE_KEY)).toBe("es-ES");
  });

  it("does NOT write to localStorage when ?lang= value is unsupported", () => {
    clearStoredLocale();
    Object.defineProperty(window, "location", {
      value: { search: "?lang=xx" },
      configurable: true,
    });
    detectLocale();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("subsequent call without ?lang= returns the persisted locale", () => {
    clearStoredLocale();
    Object.defineProperty(window, "location", {
      value: { search: "?lang=de-DE" },
      configurable: true,
    });
    detectLocale(); // first call: param present, writes de-DE to storage

    // Simulate page reload without the param
    Object.defineProperty(window, "location", {
      value: { search: "" },
      configurable: true,
    });
    expect(detectLocale()).toBe("de-DE");
  });
});

// ── hasStoredLocalePreference ────────────────────────────────────────────────

describe("hasStoredLocalePreference", () => {
  it("returns false when no locale is stored", () => {
    clearStoredLocale();
    expect(hasStoredLocalePreference()).toBe(false);
  });

  it("returns true when a locale has been stored", () => {
    setStoredLocale("nl-NL");
    expect(hasStoredLocalePreference()).toBe(true);
  });

  it("returns true even for an unsupported stored value (presence is what matters)", () => {
    setStoredLocale("xx-XX");
    expect(hasStoredLocalePreference()).toBe(true);
  });
});

// ── hasSupportedBrowserLocale ────────────────────────────────────────────────

describe("hasSupportedBrowserLocale", () => {
  it("returns true when navigator.language is exactly a supported locale", () => {
    setNavigatorLanguage("nl-NL");
    expect(hasSupportedBrowserLocale()).toBe(true);
  });

  it("returns true when navigator.language base-language matches a supported locale", () => {
    setNavigatorLanguage("nl"); // base match to nl-NL
    expect(hasSupportedBrowserLocale()).toBe(true);
  });

  it("returns false when navigator.language has no match at all", () => {
    setNavigatorLanguage("xx-XX");
    expect(hasSupportedBrowserLocale()).toBe(false);
  });
});

