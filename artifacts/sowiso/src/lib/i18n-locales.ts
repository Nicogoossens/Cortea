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

export const ALL_LOCALES: SupportedLocale[] = LOCALE_GROUPS.flatMap((g) => g.locales.map((l) => l.locale));

export function getLocaleDefinition(locale: SupportedLocale): LocaleDefinition {
  for (const group of LOCALE_GROUPS) {
    const found = group.locales.find((l) => l.locale === locale);
    if (found) return found;
  }
  return LOCALE_GROUPS[0].locales[0];
}
