import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useLocale, type SupportedLocale } from "@/lib/i18n";
import { LOCALE_GROUPS } from "@/lib/i18n-locales";
import { useActiveRegion, FlagEmoji } from "@/lib/active-region";
import { ChevronDown } from "lucide-react";

export function ActiveContextChips() {
  const { locale, setLocale } = useLocale();
  const { activeRegion, getRegionName } = useActiveRegion();

  const [showLangPicker, setShowLangPicker] = useState(false);

  const langChipRef = useRef<HTMLButtonElement>(null);

  const allLocales = LOCALE_GROUPS.flatMap((g) => g.locales);
  const currentLocale = allLocales.find((l) => l.locale === locale);
  const languageLabel = currentLocale?.languageLabel ?? "English";

  useEffect(() => {
    if (!showLangPicker) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowLangPicker(false);
        langChipRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showLangPicker]);

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
          onClick={() => setShowLangPicker((v) => !v)}
          className={`${chipBase} ${showLangPicker ? chipOpen : chipIdle}`}
          aria-label={`Language: ${languageLabel}. Click to change.`}
          aria-expanded={showLangPicker}
          aria-haspopup="listbox"
        >
          <FlagEmoji code={currentLocale?.flag ?? "US"} size="sm" />
          <span>{languageLabel}</span>
          <ChevronDown
            className={`w-3 h-3 opacity-50 transition-transform duration-150 ${showLangPicker ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>

        {/* The region chip is intentionally a read-only link to the profile.
            Inline switching from non-profile pages was causing accidental
            region changes (and downstream content pollution) when users only
            wanted to glance at their active region. The profile page is the
            single canonical place to change it. */}
        <Link
          href="/profile"
          className={`${chipBase} ${chipIdle}`}
          aria-label={`Region: ${getRegionName(activeRegion)}. Open profile to change.`}
        >
          <FlagEmoji code={activeRegion} size="sm" />
          <span>{getRegionName(activeRegion)}</span>
        </Link>
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
                <FlagEmoji code={l.flag} size="sm" />
                {l.languageLabel}
              </button>
            );
          })}
        </div>
      )}

    </div>
  );
}
