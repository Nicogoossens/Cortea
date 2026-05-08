import { useState, useCallback, useEffect } from "react";
import i18n from "@/i18n";
import {
  ALL_LOCALES,
  type SupportedLocale,
  type SupportedLanguage,
} from "@/lib/i18n-locales";
import { LocaleContext, type LocaleContextValue } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "sowiso_locale";
const RTL_LANGS: Set<string> = new Set(["ar"]);
const STORAGE_WARNING_KEY = "sowiso_storage_warning_shown";

function isStorageAvailable(): boolean {
  try {
    localStorage.setItem("__storage_test__", "1");
    localStorage.removeItem("__storage_test__");
    return true;
  } catch {
    return false;
  }
}

function hasShownStorageWarning(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_WARNING_KEY) === "1";
  } catch {
    return false;
  }
}

function markStorageWarningShown(): void {
  try {
    sessionStorage.setItem(STORAGE_WARNING_KEY, "1");
  } catch {
    // sessionStorage also unavailable — best effort
  }
}

const STORAGE_TOAST_PAYLOAD = {
  title: "Language preference can't be saved",
  description:
    "Your browser is blocking storage (e.g. private browsing mode). Your language choice will reset when you reload the page.",
  variant: "destructive" as const,
};

export function hasStoredLocalePreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function hasSupportedBrowserLocale(): boolean {
  try {
    const browserLocale = navigator.language;
    if (ALL_LOCALES.includes(browserLocale as SupportedLocale)) return true;
    const browserBase = browserLocale.split("-")[0];
    return ALL_LOCALES.some((l) => l.startsWith(browserBase + "-"));
  } catch {
    return false;
  }
}

function localeToBaseLang(locale: SupportedLocale): SupportedLanguage {
  return locale.split("-")[0] as SupportedLanguage;
}

function isRtl(lang: string): boolean {
  return RTL_LANGS.has(lang);
}

export function detectLocale(): SupportedLocale {
  // ?lang=xx query parameter takes highest priority (enables hreflang URL variants).
  // When it resolves, persist it to localStorage so subsequent navigations without
  // the param continue to use the same language instead of silently reverting.
  try {
    const params = new URLSearchParams(window.location.search);
    const langParam = params.get("lang");
    if (langParam) {
      let resolved: SupportedLocale | undefined;
      if (ALL_LOCALES.includes(langParam as SupportedLocale)) {
        resolved = langParam as SupportedLocale;
      } else {
        resolved = ALL_LOCALES.find((l) => l.startsWith(langParam + "-") || l === langParam);
      }
      if (resolved) {
        try { localStorage.setItem(STORAGE_KEY, resolved); } catch { /* storage unavailable */ }
        return resolved;
      }
    }
  } catch { /* SSR/test safety */ }

  try {
    const stored = localStorage.getItem(STORAGE_KEY) as SupportedLocale | null;
    if (stored && ALL_LOCALES.includes(stored)) return stored;
  } catch { /* storage unavailable */ }

  const browserLocale = navigator.language as SupportedLocale;
  if (ALL_LOCALES.includes(browserLocale)) return browserLocale;

  const browserBase = navigator.language.split("-")[0];
  const match = ALL_LOCALES.find((l) => l.startsWith(browserBase + "-"));
  if (match) return match;

  return "en-GB";
}

/**
 * Provider component for the locale context. Lives in its own file so that
 * `lib/i18n.tsx` only exports hooks/types — that keeps Vite's Fast Refresh
 * happy (it requires component-only modules) and avoids the runtime crash
 * "useLanguage must be used within LanguageProvider" caused by HMR rewriting
 * the context identity while consumers still hold the old reference.
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(detectLocale);
  const [, forceUpdate] = useState(0);
  const { toast } = useToast();

  const language: SupportedLanguage = localeToBaseLang(locale);
  const dir: "ltr" | "rtl" = isRtl(language) ? "rtl" : "ltr";

  useEffect(() => {
    if (!hasShownStorageWarning() && !isStorageAvailable()) {
      markStorageWarningShown();
      toast(STORAGE_TOAST_PAYLOAD);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const baseLang = localeToBaseLang(locale);
    const direction = isRtl(baseLang) ? "rtl" : "ltr";

    if (i18n.language !== baseLang) {
      i18n.changeLanguage(baseLang).then(() => {
        forceUpdate((n) => n + 1);
      });
    }

    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
  }, [locale]);

  useEffect(() => {
    const baseLang = localeToBaseLang(locale);
    if (i18n.language !== baseLang) {
      i18n.changeLanguage(baseLang).then(() => forceUpdate((n) => n + 1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = useCallback((newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {
      if (!hasShownStorageWarning()) {
        markStorageWarningShown();
        toast(STORAGE_TOAST_PAYLOAD);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number> | string): string => {
      if (typeof vars === "string") {
        return i18n.t(key, { defaultValue: vars, lng: language });
      }
      if (typeof vars === "object") {
        return i18n.t(key, { ...vars, lng: language });
      }
      return i18n.t(key, { lng: language, defaultValue: key });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale]
  );

  const value: LocaleContextValue = { locale, setLocale, t, dir, language };

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}
