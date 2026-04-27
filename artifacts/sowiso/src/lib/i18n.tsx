import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import i18n from "@/i18n";
import {
  ALL_LOCALES,
  LOCALE_GROUPS,
  type SupportedLocale,
  type SupportedLanguage,
  type LocaleDefinition,
} from "@/lib/i18n-locales";

export type { SupportedLocale, SupportedLanguage, LocaleDefinition };

export interface LocaleContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, vars?: Record<string, string | number> | string) => string;
  dir: "ltr" | "rtl";
  language: SupportedLanguage;
}

function localeToBaseLang(locale: SupportedLocale): SupportedLanguage {
  return locale.split("-")[0] as SupportedLanguage;
}

const RTL_LANGS: Set<string> = new Set(["ar"]);

function isRtl(lang: string): boolean {
  return RTL_LANGS.has(lang);
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const STORAGE_KEY = "sowiso_locale";

function detectLocale(): SupportedLocale {
  const stored = localStorage.getItem(STORAGE_KEY) as SupportedLocale | null;
  if (stored && ALL_LOCALES.includes(stored)) return stored;

  const browserLocale = navigator.language as SupportedLocale;
  if (ALL_LOCALES.includes(browserLocale)) return browserLocale;

  const browserBase = navigator.language.split("-")[0];
  const match = ALL_LOCALES.find((l) => l.startsWith(browserBase + "-"));
  if (match) return match;

  return "en-GB";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(detectLocale);
  const [, forceUpdate] = useState(0);

  const language: SupportedLanguage = localeToBaseLang(locale);
  const dir: "ltr" | "rtl" = isRtl(language) ? "rtl" : "ltr";

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
    localStorage.setItem(STORAGE_KEY, newLocale);
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

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, dir, language }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLanguage(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

export function useLocale(): LocaleContextValue {
  return useLanguage();
}

