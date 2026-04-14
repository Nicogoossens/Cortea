import { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useLocale, LOCALE_GROUPS, getLocaleDefinition, type SupportedLocale } from "@/lib/i18n";

function FlagEmoji({ countryCode }: { countryCode: string }) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((c) => 0x1f1e0 + c.charCodeAt(0) - 65);
  return <span aria-hidden="true">{String.fromCodePoint(...codePoints)}</span>;
}

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const current = getLocaleDefinition(locale);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  function handleSelect(l: SupportedLocale) {
    setLocale(l);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t("locale.select")}: ${current.languageLabel} (${current.regionLabel})`}
        className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-sm transition-colors text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
      >
        <Globe className="w-3 h-3 flex-shrink-0 opacity-60" aria-hidden="true" />
        <span className="flex items-center gap-1.5 flex-1 min-w-0">
          <FlagEmoji countryCode={current.flag} />
          <span className="truncate font-mono tracking-wide">{current.regionLabel}</span>
        </span>
        <ChevronDown
          className={`w-3 h-3 flex-shrink-0 opacity-50 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t("locale.choose_region")}
          className="absolute bottom-full left-0 right-0 mb-1 z-50 bg-sidebar border border-sidebar-border rounded-sm shadow-lg overflow-hidden"
          style={{ maxHeight: "320px", overflowY: "auto" }}
        >
          <div className="py-1">
            {LOCALE_GROUPS.map((group) => (
              <div key={group.groupLabel}>
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-sidebar-foreground/40 border-b border-sidebar-border/30">
                  {group.groupLabel}
                </div>
                {group.locales.map((def) => {
                  const isSelected = def.locale === locale;
                  return (
                    <button
                      key={def.locale}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(def.locale)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors focus-visible:outline-none focus-visible:bg-sidebar-accent/50 ${
                        isSelected
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground"
                      }`}
                    >
                      <FlagEmoji countryCode={def.flag} />
                      <span className="flex-1 text-left leading-tight">
                        <span className="block font-medium">{def.languageLabel}</span>
                        <span className="block text-[10px] opacity-60">{def.regionLabel}</span>
                      </span>
                      {isSelected && <Check className="w-3 h-3 flex-shrink-0" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
