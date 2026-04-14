import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Globe, MapPin } from "lucide-react";
import { useLocale, LOCALE_GROUPS, type SupportedLocale } from "@/lib/i18n";
import { useActiveRegion, COMPASS_REGIONS, FlagEmoji, type RegionCode } from "@/lib/active-region";

function ContextPill({
  icon,
  label,
  onClick,
  open,
}: {
  icon: React.ReactNode;
  label: React.ReactNode;
  onClick: () => void;
  open: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-expanded={open}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-mono tracking-wide text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      <ChevronDown
        className={`w-3 h-3 opacity-50 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        aria-hidden="true"
      />
    </button>
  );
}

function Dropdown({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`absolute top-full mt-1 z-50 bg-background border border-border rounded-sm shadow-lg overflow-hidden ${className}`}
      style={{ maxHeight: "320px", overflowY: "auto" }}
    >
      {children}
    </div>
  );
}

function LanguageDropdown({ onClose }: { onClose: () => void }) {
  const { locale, setLocale } = useLocale();

  function handleSelect(l: SupportedLocale) {
    setLocale(l);
    onClose();
  }

  return (
    <div className="py-1 min-w-[200px]">
      {LOCALE_GROUPS.map((group) => (
        <div key={group.groupLabel}>
          <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 border-b border-border/30">
            {group.groupLabel}
          </div>
          {group.locales.map((def) => {
            const isSelected = def.locale === locale;
            return (
              <button
                key={def.locale}
                onClick={() => handleSelect(def.locale)}
                role="option"
                aria-selected={isSelected}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors focus-visible:outline-none focus-visible:bg-muted/50 ${
                  isSelected
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground/80 hover:bg-muted/40 hover:text-foreground"
                }`}
              >
                <FlagEmoji code={def.flag} />
                <span className="flex-1 text-left">
                  <span className="block">{def.languageLabel}</span>
                  {group.locales.length > 1 && (
                    <span className="block text-[10px] opacity-60">{def.regionLabel}</span>
                  )}
                </span>
                {isSelected && <Check className="w-3 h-3 flex-shrink-0" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function RegionDropdown({ onClose }: { onClose: () => void }) {
  const { activeRegion, setActiveRegion, getRegionName } = useActiveRegion();

  function handleSelect(code: RegionCode) {
    setActiveRegion(code);
    onClose();
  }

  return (
    <div className="py-1 min-w-[200px]">
      {COMPASS_REGIONS.map((region) => {
        const isSelected = region.code === activeRegion;
        return (
          <button
            key={region.code}
            onClick={() => handleSelect(region.code)}
            role="option"
            aria-selected={isSelected}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors focus-visible:outline-none focus-visible:bg-muted/50 ${
              isSelected
                ? "bg-primary/10 text-primary font-medium"
                : "text-foreground/80 hover:bg-muted/40 hover:text-foreground"
            }`}
          >
            <FlagEmoji code={region.flag} />
            <span className="flex-1 text-left">{getRegionName(region.code)}</span>
            {isSelected && <Check className="w-3 h-3 flex-shrink-0" aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}

export function ContextBar() {
  const { locale, t } = useLocale();
  const { activeRegion, getRegionName } = useActiveRegion();

  const [openPanel, setOpenPanel] = useState<"language" | "region" | null>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      const target = e.target as Node;
      const clickedLang = langRef.current?.contains(target);
      const clickedRegion = regionRef.current?.contains(target);
      if (!clickedLang && !clickedRegion) setOpenPanel(null);
    }
    if (openPanel) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [openPanel]);

  const currentLocale = LOCALE_GROUPS.flatMap((g) => g.locales).find((l) => l.locale === locale);

  return (
    <div className="flex items-center justify-end gap-1 px-4 py-2 border-b border-border/40 bg-background/60 backdrop-blur-sm">

      <div ref={langRef} className="relative">
        <ContextPill
          icon={<Globe className="w-3 h-3" aria-hidden="true" />}
          label={
            <span className="flex items-center gap-1">
              <FlagEmoji code={currentLocale?.flag ?? "GB"} />
              <span>{currentLocale?.languageLabel ?? "English"}</span>
            </span>
          }
          onClick={() => setOpenPanel(openPanel === "language" ? null : "language")}
          open={openPanel === "language"}
        />
        {openPanel === "language" && (
          <Dropdown className="right-0">
            <div className="px-3 py-2 border-b border-border/30 text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
              {t("locale.choose_region")}
            </div>
            <LanguageDropdown onClose={() => setOpenPanel(null)} />
          </Dropdown>
        )}
      </div>

      <div className="w-px h-4 bg-border/60" aria-hidden="true" />

      <div ref={regionRef} className="relative">
        <ContextPill
          icon={<MapPin className="w-3 h-3" aria-hidden="true" />}
          label={
            <span className="flex items-center gap-1">
              <FlagEmoji code={activeRegion} />
              <span>{getRegionName(activeRegion)}</span>
            </span>
          }
          onClick={() => setOpenPanel(openPanel === "region" ? null : "region")}
          open={openPanel === "region"}
        />
        {openPanel === "region" && (
          <Dropdown className="right-0">
            <div className="px-3 py-2 border-b border-border/30 text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
              {t("region.choose")}
            </div>
            <RegionDropdown onClose={() => setOpenPanel(null)} />
          </Dropdown>
        )}
      </div>

    </div>
  );
}
