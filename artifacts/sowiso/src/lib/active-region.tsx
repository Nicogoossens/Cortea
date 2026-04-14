import React, { createContext, useContext, useState, useCallback } from "react";
import type { SupportedLanguage } from "./i18n";

export type RegionCode =
  | "GB" | "US" | "AE" | "CN" | "JP"
  | "FR" | "DE" | "NL" | "AU" | "CA"
  | "IT" | "IN" | "ES" | "PT";

export interface CompassRegion {
  code: RegionCode;
  flag: RegionCode;
  names: Record<SupportedLanguage, string>;
}

export const COMPASS_REGIONS: CompassRegion[] = [
  { code: "GB", flag: "GB", names: { en: "United Kingdom", nl: "Verenigd Koninkrijk", fr: "Royaume-Uni", de: "Vereinigtes Königreich", es: "Reino Unido", pt: "Reino Unido", it: "Regno Unito", hi: "यूनाइटेड किंगडम" } },
  { code: "US", flag: "US", names: { en: "United States", nl: "Verenigde Staten", fr: "États-Unis", de: "Vereinigte Staaten", es: "Estados Unidos", pt: "Estados Unidos", it: "Stati Uniti", hi: "संयुक्त राज्य" } },
  { code: "AE", flag: "AE", names: { en: "UAE / Dubai", nl: "VAE / Dubai", fr: "Émirats Arabes", de: "VAE / Dubai", es: "EAU / Dubái", pt: "EAU / Dubai", it: "EAU / Dubai", hi: "यूएई / दुबई" } },
  { code: "CN", flag: "CN", names: { en: "China", nl: "China", fr: "Chine", de: "China", es: "China", pt: "China", it: "Cina", hi: "चीन" } },
  { code: "JP", flag: "JP", names: { en: "Japan", nl: "Japan", fr: "Japon", de: "Japan", es: "Japón", pt: "Japão", it: "Giappone", hi: "जापान" } },
  { code: "FR", flag: "FR", names: { en: "France", nl: "Frankrijk", fr: "France", de: "Frankreich", es: "Francia", pt: "França", it: "Francia", hi: "फ्रांस" } },
  { code: "DE", flag: "DE", names: { en: "Germany", nl: "Duitsland", fr: "Allemagne", de: "Deutschland", es: "Alemania", pt: "Alemanha", it: "Germania", hi: "जर्मनी" } },
  { code: "NL", flag: "NL", names: { en: "Netherlands", nl: "Nederland", fr: "Pays-Bas", de: "Niederlande", es: "Países Bajos", pt: "Países Baixos", it: "Paesi Bassi", hi: "नीदरलैंड" } },
  { code: "AU", flag: "AU", names: { en: "Australia", nl: "Australië", fr: "Australie", de: "Australien", es: "Australia", pt: "Austrália", it: "Australia", hi: "ऑस्ट्रेलिया" } },
  { code: "CA", flag: "CA", names: { en: "Canada", nl: "Canada", fr: "Canada", de: "Kanada", es: "Canadá", pt: "Canadá", it: "Canada", hi: "कनाडा" } },
  { code: "IT", flag: "IT", names: { en: "Italy", nl: "Italië", fr: "Italie", de: "Italien", es: "Italia", pt: "Itália", it: "Italia", hi: "इटली" } },
  { code: "IN", flag: "IN", names: { en: "India", nl: "India", fr: "Inde", de: "Indien", es: "India", pt: "Índia", it: "India", hi: "भारत" } },
  { code: "ES", flag: "ES", names: { en: "Spain", nl: "Spanje", fr: "Espagne", de: "Spanien", es: "España", pt: "Espanha", it: "Spagna", hi: "स्पेन" } },
  { code: "PT", flag: "PT", names: { en: "Portugal", nl: "Portugal", fr: "Portugal", de: "Portugal", es: "Portugal", pt: "Portugal", it: "Portogallo", hi: "पुर्तगाल" } },
];

/** Regions that currently have full etiquette data and AI counsel support. */
export const ACTIVE_REGIONS: ReadonlySet<RegionCode> = new Set(["GB", "US", "AE"]);

export function isRegionActive(code: RegionCode): boolean {
  return ACTIVE_REGIONS.has(code);
}

const REGION_STORAGE_KEY = "sowiso_active_region";

const LANGUAGE_DEFAULTS: Record<SupportedLanguage, RegionCode> = {
  en: "GB",
  nl: "NL",
  fr: "FR",
  de: "DE",
  es: "ES",
  pt: "PT",
  it: "IT",
  hi: "IN",
};

function detectActiveRegion(language: SupportedLanguage): RegionCode {
  const stored = localStorage.getItem(REGION_STORAGE_KEY) as RegionCode | null;
  const validCodes = COMPASS_REGIONS.map((r) => r.code);
  if (stored && validCodes.includes(stored)) return stored;
  const defaultCode = LANGUAGE_DEFAULTS[language] ?? "GB";
  return isRegionActive(defaultCode) ? defaultCode : "GB";
}

interface ActiveRegionContextValue {
  activeRegion: RegionCode;
  setActiveRegion: (code: RegionCode) => void;
  getRegionName: (code: RegionCode) => string;
  getCurrentRegion: () => CompassRegion;
}

const ActiveRegionContext = createContext<ActiveRegionContextValue | null>(null);

export function ActiveRegionProvider({
  children,
  language,
}: {
  children: React.ReactNode;
  language: SupportedLanguage;
}) {
  const [activeRegion, setActiveRegionState] = useState<RegionCode>(() =>
    detectActiveRegion(language)
  );

  const setActiveRegion = useCallback((code: RegionCode) => {
    setActiveRegionState(code);
    localStorage.setItem(REGION_STORAGE_KEY, code);
  }, []);

  const getRegionName = useCallback(
    (code: RegionCode): string => {
      const region = COMPASS_REGIONS.find((r) => r.code === code);
      return region?.names[language] ?? code;
    },
    [language]
  );

  const getCurrentRegion = useCallback((): CompassRegion => {
    return COMPASS_REGIONS.find((r) => r.code === activeRegion) ?? COMPASS_REGIONS[0];
  }, [activeRegion]);

  return (
    <ActiveRegionContext.Provider
      value={{ activeRegion, setActiveRegion, getRegionName, getCurrentRegion }}
    >
      {children}
    </ActiveRegionContext.Provider>
  );
}

export function useActiveRegion(): ActiveRegionContextValue {
  const ctx = useContext(ActiveRegionContext);
  if (!ctx) throw new Error("useActiveRegion must be used within ActiveRegionProvider");
  return ctx;
}

/**
 * Renders a small, legible country code badge instead of an emoji flag.
 * Flag Unicode emojis are unreliable in many browser/OS combinations.
 */
export function FlagEmoji({ code }: { code: string }) {
  const display = code.toUpperCase().slice(0, 2);
  return (
    <span
      aria-hidden="true"
      className="inline-flex items-center justify-center text-[9px] font-bold leading-none tracking-wider rounded-[2px] px-[3px] py-[2px] border border-current/20 font-mono shrink-0"
      style={{
        minWidth: "1.5rem",
        color: "var(--muted-foreground)",
        backgroundColor: "color-mix(in srgb, currentColor 8%, transparent)",
      }}
    >
      {display}
    </span>
  );
}
