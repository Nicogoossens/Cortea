import { createContext, useContext } from "react";
import {
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

export const LocaleContext = createContext<LocaleContextValue | null>(null);

export function useLanguage(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

export function useLocale(): LocaleContextValue {
  return useLanguage();
}
