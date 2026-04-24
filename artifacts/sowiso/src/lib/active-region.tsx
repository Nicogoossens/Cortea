import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { SupportedLanguage } from "./i18n";

export type RegionCode =
  | "GB" | "US" | "AE" | "CN" | "JP"
  | "FR" | "DE" | "NL" | "AU" | "CA"
  | "IT" | "IN" | "ES" | "PT"
  | "SG" | "BR" | "ZA" | "MX"
  | "CO" | "BE" | "CH";

export interface CompassRegion {
  code: RegionCode;
  flag: RegionCode;
  names: Record<SupportedLanguage, string>;
}

export const COMPASS_REGIONS: CompassRegion[] = [
  { code: "GB", flag: "GB", names: { en: "United Kingdom", nl: "Verenigd Koninkrijk", fr: "Royaume-Uni", de: "Vereinigtes Königreich", es: "Reino Unido", pt: "Reino Unido", it: "Regno Unito", ar: "المملكة المتحدة", ja: "英国" } },
  { code: "US", flag: "US", names: { en: "United States", nl: "Verenigde Staten", fr: "États-Unis", de: "Vereinigte Staaten", es: "Estados Unidos", pt: "Estados Unidos", it: "Stati Uniti", ar: "الولايات المتحدة", ja: "アメリカ合衆国" } },
  { code: "AE", flag: "AE", names: { en: "UAE / Dubai", nl: "VAE / Dubai", fr: "Émirats Arabes", de: "VAE / Dubai", es: "EAU / Dubái", pt: "EAU / Dubai", it: "EAU / Dubai", ar: "الإمارات / دبي", ja: "UAE / ドバイ" } },
  { code: "CN", flag: "CN", names: { en: "China", nl: "China", fr: "Chine", de: "China", es: "China", pt: "China", it: "Cina", ar: "الصين", ja: "中国" } },
  { code: "JP", flag: "JP", names: { en: "Japan", nl: "Japan", fr: "Japon", de: "Japan", es: "Japón", pt: "Japão", it: "Giappone", ar: "اليابان", ja: "日本" } },
  { code: "FR", flag: "FR", names: { en: "France", nl: "Frankrijk", fr: "France", de: "Frankreich", es: "Francia", pt: "França", it: "Francia", ar: "فرنسا", ja: "フランス" } },
  { code: "DE", flag: "DE", names: { en: "Germany", nl: "Duitsland", fr: "Allemagne", de: "Deutschland", es: "Alemania", pt: "Alemanha", it: "Germania", ar: "ألمانيا", ja: "ドイツ" } },
  { code: "NL", flag: "NL", names: { en: "Netherlands", nl: "Nederland", fr: "Pays-Bas", de: "Niederlande", es: "Países Bajos", pt: "Países Baixos", it: "Paesi Bassi", ar: "هولندا", ja: "オランダ" } },
  { code: "AU", flag: "AU", names: { en: "Australia", nl: "Australië", fr: "Australie", de: "Australien", es: "Australia", pt: "Austrália", it: "Australia", ar: "أستراليا", ja: "オーストラリア" } },
  { code: "CA", flag: "CA", names: { en: "Canada", nl: "Canada", fr: "Canada", de: "Kanada", es: "Canadá", pt: "Canadá", it: "Canada", ar: "كندا", ja: "カナダ" } },
  { code: "IT", flag: "IT", names: { en: "Italy", nl: "Italië", fr: "Italie", de: "Italien", es: "Italia", pt: "Itália", it: "Italia", ar: "إيطاليا", ja: "イタリア" } },
  { code: "IN", flag: "IN", names: { en: "India", nl: "India", fr: "Inde", de: "Indien", es: "India", pt: "Índia", it: "India", ar: "الهند", ja: "インド" } },
  { code: "ES", flag: "ES", names: { en: "Spain", nl: "Spanje", fr: "Espagne", de: "Spanien", es: "España", pt: "Espanha", it: "Spagna", ar: "إسبانيا", ja: "スペイン" } },
  { code: "PT", flag: "PT", names: { en: "Portugal", nl: "Portugal", fr: "Portugal", de: "Portugal", es: "Portugal", pt: "Portugal", it: "Portogallo", ar: "البرتغال", ja: "ポルトガル" } },
  { code: "SG", flag: "SG", names: { en: "Singapore", nl: "Singapore", fr: "Singapour", de: "Singapur", es: "Singapur", pt: "Singapura", it: "Singapore", ar: "سنغافورة", ja: "シンガポール" } },
  { code: "BR", flag: "BR", names: { en: "Brazil", nl: "Brazilië", fr: "Brésil", de: "Brasilien", es: "Brasil", pt: "Brasil", it: "Brasile", ar: "البرازيل", ja: "ブラジル" } },
  { code: "ZA", flag: "ZA", names: { en: "South Africa", nl: "Zuid-Afrika", fr: "Afrique du Sud", de: "Südafrika", es: "Sudáfrica", pt: "África do Sul", it: "Sudafrica", ar: "جنوب أفريقيا", ja: "南アフリカ" } },
  { code: "MX", flag: "MX", names: { en: "Mexico", nl: "Mexico", fr: "Mexique", de: "Mexiko", es: "México", pt: "México", it: "Messico", ar: "المكسيك", ja: "メキシコ" } },
  { code: "CO", flag: "CO", names: { en: "Colombia", nl: "Colombia", fr: "Colombie", de: "Kolumbien", es: "Colombia", pt: "Colômbia", it: "Colombia", ar: "كولومبيا", ja: "コロンビア" } },
  { code: "BE", flag: "BE", names: { en: "Belgium", nl: "België", fr: "Belgique", de: "Belgien", es: "Bélgica", pt: "Bélgica", it: "Belgio", ar: "بلجيكا", ja: "ベルギー" } },
  { code: "CH", flag: "CH", names: { en: "Switzerland", nl: "Zwitserland", fr: "Suisse", de: "Schweiz", es: "Suiza", pt: "Suíça", it: "Svizzera", ar: "سويسرا", ja: "スイス" } },
];

/**
 * Regions that currently have a baseline dataset across all three modules:
 * The Atelier (scenarios), The Cultural Compass, and The Counsel.
 * Update this set when new region data is seeded into the database.
 */
export const ACTIVE_REGIONS: ReadonlySet<RegionCode> = new Set([
  "GB", "AU", "CN", "US", "JP", "DE", "IT", "FR", "BE", "CH",
  "BR", "ES", "SG", "IN", "MX", "AE", "CO",
]);

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
  ar: "AE",
  ja: "JP",
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
    const apiBase = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL?.replace(/\/$/, "") ?? "";
    fetch(`${apiBase}/api/users/profile`, {
      credentials: "include",
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data: { active_region?: string } | null) => {
        if (!data?.active_region) return;
        const validCodes = COMPASS_REGIONS.map((r) => r.code);
        if (validCodes.includes(data.active_region as RegionCode)) {
          // Write to both state and localStorage so the preference persists
          // across page refreshes without requiring another profile API call.
          setActiveRegionState(data.active_region as RegionCode);
          localStorage.setItem(REGION_PREF_KEY, data.active_region);
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

    // Sync to profile API using the HttpOnly session cookie.
    // This ensures the active region is persisted globally (not just in localStorage)
    // regardless of which UI control triggered the change (context bar, profile page, etc.).
    const apiBase = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL?.replace(/\/$/, "") ?? "";
    fetch(`${apiBase}/api/users/profile/region`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
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
 * Renders a country flag using the bundled flag-icons CSS library.
 * No external CDN — SVGs are bundled locally with the app.
 * className controls size via font-size (e.g. "text-xl", "text-4xl").
 */
export function FlagEmoji({ code, className, ariaLabel }: { code: string; className?: string; ariaLabel?: string }) {
  const lower = code.toLowerCase().slice(0, 2);
  return (
    <span
      className={`fi fi-${lower} ${className ?? "text-xl"}`}
      role="img"
      aria-label={ariaLabel ?? code.toUpperCase()}
    />
  );
}
