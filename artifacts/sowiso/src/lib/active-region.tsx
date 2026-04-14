import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { SupportedLanguage } from "./i18n";

export type RegionCode =
  | "GB" | "US" | "AE" | "CN" | "JP"
  | "FR" | "DE" | "NL" | "AU" | "CA"
  | "IT" | "IN" | "ES" | "PT"
  | "SG" | "BR" | "ZA" | "MX";

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
  { code: "SG", flag: "SG", names: { en: "Singapore", nl: "Singapore", fr: "Singapour", de: "Singapur", es: "Singapur", pt: "Singapura", it: "Singapore", hi: "सिंगापुर" } },
  { code: "BR", flag: "BR", names: { en: "Brazil", nl: "Brazilië", fr: "Brésil", de: "Brasilien", es: "Brasil", pt: "Brasil", it: "Brasile", hi: "ब्राज़ील" } },
  { code: "ZA", flag: "ZA", names: { en: "South Africa", nl: "Zuid-Afrika", fr: "Afrique du Sud", de: "Südafrika", es: "Sudáfrica", pt: "África do Sul", it: "Sudafrica", hi: "दक्षिण अफ़्रीका" } },
  { code: "MX", flag: "MX", names: { en: "Mexico", nl: "Mexico", fr: "Mexique", de: "Mexiko", es: "México", pt: "México", it: "Messico", hi: "मेक्सिको" } },
];

/**
 * Regions that currently have a baseline dataset across all three modules:
 * The Atelier (scenarios), The Cultural Compass, and The Counsel.
 * Update this set when new region data is seeded into the database.
 */
export const ACTIVE_REGIONS: ReadonlySet<RegionCode> = new Set(["GB", "CN", "CA", "AU"]);

export function isRegionActive(code: RegionCode): boolean {
  return ACTIVE_REGIONS.has(code);
}

/** Persisted user preference — survives across sessions. */
const REGION_PREF_KEY = "sowiso_active_region";
/** Location-inferred suggestion — cleared when the browser tab closes. */
const REGION_SESSION_KEY = "sowiso_session_region";

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

function resolveActiveRegion(language: SupportedLanguage): RegionCode {
  const validCodes = COMPASS_REGIONS.map((r) => r.code);
  // Session-scoped location suggestion takes precedence over stored preference.
  const session = sessionStorage.getItem(REGION_SESSION_KEY) as RegionCode | null;
  if (session && validCodes.includes(session)) return session;
  const stored = localStorage.getItem(REGION_PREF_KEY) as RegionCode | null;
  if (stored && validCodes.includes(stored)) return stored;
  // Fall back to the language-appropriate default — all regions are selectable.
  return (LANGUAGE_DEFAULTS[language] ?? "GB") as RegionCode;
}

interface ActiveRegionContextValue {
  activeRegion: RegionCode;
  /** Persist the user's explicit region choice to localStorage. */
  setActiveRegion: (code: RegionCode) => void;
  /** Accept a location-detected suggestion; stored in sessionStorage only. */
  setDetectedRegion: (code: RegionCode) => void;
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
    resolveActiveRegion(language)
  );

  // Hydrate active region from the user profile on first load if no explicit
  // preference is stored yet (localStorage key absent).
  useEffect(() => {
    if (localStorage.getItem(REGION_PREF_KEY)) return;
    const userId = localStorage.getItem("sowiso_user_id");
    if (!userId) return;
    const apiBase = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL?.replace(/\/$/, "") ?? "";
    fetch(`${apiBase}/api/users/profile?user_id=${encodeURIComponent(userId)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data: { active_region?: string } | null) => {
        if (!data?.active_region) return;
        const validCodes = COMPASS_REGIONS.map((r) => r.code);
        if (validCodes.includes(data.active_region as RegionCode)) {
          setActiveRegionState(data.active_region as RegionCode);
        }
      })
      .catch(() => undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setActiveRegion = useCallback((code: RegionCode) => {
    setActiveRegionState(code);
    localStorage.setItem(REGION_PREF_KEY, code);
    // Explicit user choice supersedes any session-scoped detection.
    sessionStorage.removeItem(REGION_SESSION_KEY);

    // Sync to profile API whenever a session token is available.
    // This ensures the active region is persisted globally (not just in localStorage)
    // regardless of which UI control triggered the change (context bar, profile page, etc.).
    const sessionToken = localStorage.getItem("sowiso_session_token");
    const apiBase = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL?.replace(/\/$/, "") ?? "";
    fetch(`${apiBase}/api/users/profile/region`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      },
      body: JSON.stringify({ region_code: code }),
    }).catch(() => undefined); // Fire-and-forget; localStorage is the source of truth for UI
  }, []);

  const setDetectedRegion = useCallback((code: RegionCode) => {
    setActiveRegionState(code);
    sessionStorage.setItem(REGION_SESSION_KEY, code);
    // Do NOT write to localStorage — location data is session-scoped only.
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
      value={{ activeRegion, setActiveRegion, setDetectedRegion, getRegionName, getCurrentRegion }}
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
