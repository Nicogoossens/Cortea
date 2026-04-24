import { useState, useEffect, useRef } from "react";
import { useLocale, LOCALE_GROUPS, type SupportedLocale } from "@/lib/i18n";
import { useActiveRegion, FlagEmoji, COMPASS_REGIONS } from "@/lib/active-region";
import { X, ChevronDown } from "lucide-react";

export function ActiveContextChips() {
  const { locale, setLocale } = useLocale();
  const { activeRegion, setActiveRegion, getRegionName } = useActiveRegion();

  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);

  const langChipRef = useRef<HTMLButtonElement>(null);
  const regionChipRef = useRef<HTMLButtonElement>(null);

  const allLocales = LOCALE_GROUPS.flatMap((g) => g.locales);
  const currentLocale = allLocales.find((l) => l.locale === locale);
  const languageLabel = currentLocale?.languageLabel ?? "English";

  useEffect(() => {
    if (!showLangPicker && !showRegionPicker) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (showLangPicker) {
          setShowLangPicker(false);
          langChipRef.current?.focus();
        } else if (showRegionPicker) {
          setShowRegionPicker(false);
          regionChipRef.current?.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showLangPicker, showRegionPicker]);

  const chipBase =
    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono transition-colors";
  const chipIdle =
    "border-border/60 bg-muted/30 text-foreground/70 hover:border-primary/40 hover:bg-primary/5 hover:text-foreground cursor-pointer";
  const chipOpen = "border-primary/50 bg-primary/10 text-primary cursor-pointer";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2" aria-label="Active session context">
        <button
          ref={langChipRef}
          type="button"
          onClick={() => { setShowLangPicker((v) => !v); setShowRegionPicker(false); }}
          className={`${chipBase} ${showLangPicker ? chipOpen : chipIdle}`}
          aria-label={`Language: ${languageLabel}. Click to change.`}
          aria-expanded={showLangPicker}
          aria-haspopup="listbox"
        >
          <FlagEmoji code={currentLocale?.flag ?? "US"} className="text-sm" />
          <span>{languageLabel}</span>
          <ChevronDown
            className={`w-3 h-3 opacity-50 transition-transform duration-150 ${showLangPicker ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>

        <button
          ref={regionChipRef}
          type="button"
          onClick={() => { setShowRegionPicker((v) => !v); setShowLangPicker(false); }}
          className={`${chipBase} ${showRegionPicker ? chipOpen : chipIdle}`}
          aria-label={`Region: ${getRegionName(activeRegion)}. Click to change.`}
          aria-expanded={showRegionPicker}
          aria-haspopup="listbox"
        >
          <FlagEmoji code={activeRegion} className="text-sm" />
          <span>{getRegionName(activeRegion)}</span>
          <ChevronDown
            className={`w-3 h-3 opacity-50 transition-transform duration-150 ${showRegionPicker ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {showLangPicker && (
        <div
          role="listbox"
          aria-label="Choose language"
          className="flex flex-wrap gap-1.5 animate-in fade-in duration-150 pt-1"
        >
          {allLocales.map((l) => {
            const isSelected = l.locale === locale;
            return (
              <button
                key={l.locale}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => { setLocale(l.locale as SupportedLocale); setShowLangPicker(false); langChipRef.current?.focus(); }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs border transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/30"
                }`}
              >
                <FlagEmoji code={l.flag} />
                {l.languageLabel}
              </button>
            );
          })}
        </div>
      )}

      {showRegionPicker && (
        <div
          role="listbox"
          aria-label="Choose region"
          className="flex flex-wrap gap-1.5 animate-in fade-in duration-150 pt-1"
        >
          {COMPASS_REGIONS.map((region) => {
            const isSelected = region.code === activeRegion;
            return (
              <button
                key={region.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => { setActiveRegion(region.code); setShowRegionPicker(false); regionChipRef.current?.focus(); }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs border transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/30"
                }`}
              >
                <FlagEmoji code={region.flag} />
                {getRegionName(region.code)}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => { setShowRegionPicker(false); regionChipRef.current?.focus(); }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-sm text-xs border border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/30 transition-all"
          >
            <X className="w-3 h-3" aria-hidden="true" />
            Close
          </button>
        </div>
      )}
    </div>
  );
}
