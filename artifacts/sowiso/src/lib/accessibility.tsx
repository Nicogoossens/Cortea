import { createContext, useContext, useEffect, useState } from "react";

export type FontSize = "normal" | "large" | "xl";

interface AccessibilityContextValue {
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;
  fontSize: FontSize;
  setFontSize: (v: FontSize) => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue>({
  highContrast: false,
  setHighContrast: () => {},
  fontSize: "normal",
  setFontSize: () => {},
});

const LS_HIGH_CONTRAST = "sowiso_high_contrast";
const LS_FONT_SIZE     = "sowiso_font_size";

function readBool(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === "true";
  } catch {
    return fallback;
  }
}

function readString<T extends string>(key: string, fallback: T, allowed: T[]): T {
  try {
    const v = localStorage.getItem(key) as T | null;
    return v && allowed.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

const FONT_SIZES: FontSize[] = ["normal", "large", "xl"];

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [highContrast, setHighContrastState] = useState(() =>
    readBool(LS_HIGH_CONTRAST, false)
  );
  const [fontSize, setFontSizeState] = useState<FontSize>(() =>
    readString<FontSize>(LS_FONT_SIZE, "normal", FONT_SIZES)
  );

  function setHighContrast(v: boolean) {
    setHighContrastState(v);
    try { localStorage.setItem(LS_HIGH_CONTRAST, String(v)); } catch {}
  }

  function setFontSize(v: FontSize) {
    setFontSizeState(v);
    try { localStorage.setItem(LS_FONT_SIZE, v); } catch {}
  }

  // Apply classes to <html> element
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("high-contrast", highContrast);
  }, [highContrast]);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove("font-scale-large", "font-scale-xl");
    if (fontSize === "large") html.classList.add("font-scale-large");
    else if (fontSize === "xl") html.classList.add("font-scale-xl");
  }, [fontSize]);

  return (
    <AccessibilityContext.Provider value={{ highContrast, setHighContrast, fontSize, setFontSize }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  return useContext(AccessibilityContext);
}
