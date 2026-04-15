import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import i18n from "@/i18n";

// ── Locale type definitions ─────────────────────────────────────────────────

export type SupportedLocale =
  | "en-GB" | "en-US" | "en-AU" | "en-CA"
  | "nl-NL"
  | "fr-FR"
  | "de-DE"
  | "es-ES" | "es-MX"
  | "pt-PT" | "pt-BR"
  | "it-IT"
  | "ar-SA"
  | "ja-JP";

export type SupportedLanguage = "en" | "nl" | "fr" | "de" | "es" | "pt" | "it" | "ar" | "ja";

export interface LocaleDefinition {
  locale: SupportedLocale;
  languageLabel: string;
  regionLabel: string;
  flag: string;
  baseLang: SupportedLanguage;
  rtl?: boolean;
}

export const LOCALE_GROUPS: { groupLabel: string; locales: LocaleDefinition[] }[] = [
  {
    groupLabel: "English",
    locales: [
      { locale: "en-GB", languageLabel: "English", regionLabel: "United Kingdom", flag: "GB", baseLang: "en" },
      { locale: "en-US", languageLabel: "English", regionLabel: "United States", flag: "US", baseLang: "en" },
      { locale: "en-AU", languageLabel: "English", regionLabel: "Australia", flag: "AU", baseLang: "en" },
      { locale: "en-CA", languageLabel: "English", regionLabel: "Canada", flag: "CA", baseLang: "en" },
    ],
  },
  {
    groupLabel: "Nederlands",
    locales: [
      { locale: "nl-NL", languageLabel: "Nederlands", regionLabel: "Nederland", flag: "NL", baseLang: "nl" },
    ],
  },
  {
    groupLabel: "Français",
    locales: [
      { locale: "fr-FR", languageLabel: "Français", regionLabel: "France", flag: "FR", baseLang: "fr" },
    ],
  },
  {
    groupLabel: "Deutsch",
    locales: [
      { locale: "de-DE", languageLabel: "Deutsch", regionLabel: "Deutschland", flag: "DE", baseLang: "de" },
    ],
  },
  {
    groupLabel: "Español",
    locales: [
      { locale: "es-ES", languageLabel: "Español", regionLabel: "España", flag: "ES", baseLang: "es" },
      { locale: "es-MX", languageLabel: "Español", regionLabel: "México", flag: "MX", baseLang: "es" },
    ],
  },
  {
    groupLabel: "Português",
    locales: [
      { locale: "pt-PT", languageLabel: "Português", regionLabel: "Portugal", flag: "PT", baseLang: "pt" },
      { locale: "pt-BR", languageLabel: "Português", regionLabel: "Brasil", flag: "BR", baseLang: "pt" },
    ],
  },
  {
    groupLabel: "Italiano",
    locales: [
      { locale: "it-IT", languageLabel: "Italiano", regionLabel: "Italia", flag: "IT", baseLang: "it" },
    ],
  },
  {
    groupLabel: "العربية",
    locales: [
      { locale: "ar-SA", languageLabel: "العربية", regionLabel: "المملكة العربية السعودية", flag: "SA", baseLang: "ar", rtl: true },
    ],
  },
  {
    groupLabel: "日本語",
    locales: [
      { locale: "ja-JP", languageLabel: "日本語", regionLabel: "日本", flag: "JP", baseLang: "ja" },
    ],
  },
];

export function getLocaleDefinition(locale: SupportedLocale): LocaleDefinition {
  for (const group of LOCALE_GROUPS) {
    const found = group.locales.find((l) => l.locale === locale);
    if (found) return found;
  }
  return LOCALE_GROUPS[0].locales[0];
}

function localeToBaseLang(locale: SupportedLocale): SupportedLanguage {
  return locale.split("-")[0] as SupportedLanguage;
}

// RTL languages
const RTL_LANGS: Set<string> = new Set(["ar"]);

function isRtl(lang: string): boolean {
  return RTL_LANGS.has(lang);
}

// ── Context ─────────────────────────────────────────────────────────────────

interface LocaleContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, vars?: Record<string, string | number> | string) => string;
  dir: "ltr" | "rtl";
  language: SupportedLanguage;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const STORAGE_KEY = "sowiso_locale";
const ALL_LOCALES: SupportedLocale[] = LOCALE_GROUPS.flatMap((g) => g.locales.map((l) => l.locale));

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

  // Apply locale on mount and when it changes
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

  // Ensure i18n is initialised to the correct language on first mount
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

  // Thin wrapper around i18n.t — keeps the existing API and handles
  // both string fallback (legacy) and interpolation object (new call sites)
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
    // Re-create on locale change so all consumers get fresh translations
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
