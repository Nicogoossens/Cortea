import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import {
  COMPASS_REGIONS,
  ACTIVE_REGIONS,
  FlagEmoji,
  type RegionCode,
  type Continent,
} from "@/lib/active-region";
import { useLanguage } from "@/lib/i18n";

type RegionAvailability = "available" | "coming_soon";

interface CounselRegionPickerProps {
  effectiveRegion: RegionCode;
  availableCodes: Set<string>;
  sessionRegion: RegionCode | null;
  getRegionName: (code: RegionCode) => string;
  onSelect: (code: RegionCode) => void;
  onReset?: () => void;
}

const CONTINENT_ORDER: Continent[] = [
  "europe",
  "americas",
  "asia_pacific",
  "middle_east_africa",
];

export function CounselRegionPicker({
  effectiveRegion,
  availableCodes,
  sessionRegion,
  getRegionName,
  onSelect,
  onReset,
}: CounselRegionPickerProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");

  function classify(code: RegionCode): RegionAvailability {
    if (availableCodes.has(code)) return "available";
    return "coming_soon";
  }

  function isActiveSoon(code: RegionCode): boolean {
    return ACTIVE_REGIONS.has(code) && !availableCodes.has(code);
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return COMPASS_REGIONS;
    return COMPASS_REGIONS.filter((r) => {
      const name = getRegionName(r.code).toLowerCase();
      return name.includes(q) || r.code.toLowerCase().includes(q);
    });
  }, [search, getRegionName]);

  const byContinent = useMemo((): Map<Continent, typeof COMPASS_REGIONS> => {
    const map = new Map<Continent, typeof COMPASS_REGIONS>();
    for (const c of CONTINENT_ORDER) map.set(c, []);
    for (const r of filtered) {
      map.get(r.continent)!.push(r);
    }
    return map;
  }, [filtered]);

  const continentLabel: Record<Continent, string> = {
    europe: t("counsel.picker.continent.europe"),
    americas: t("counsel.picker.continent.americas"),
    asia_pacific: t("counsel.picker.continent.asia_pacific"),
    middle_east_africa: t("counsel.picker.continent.middle_east_africa"),
  };

  const soonLabel = t("counsel.picker.soon");

  function renderRegion(region: (typeof COMPASS_REGIONS)[number]) {
    const availability = classify(region.code);
    const soon = isActiveSoon(region.code);
    const isSelected = region.code === effectiveRegion;
    const isSelectable = availability === "available";
    const name = getRegionName(region.code);

    if (!isSelectable) {
      return (
        <button
          key={region.code}
          type="button"
          disabled
          title={`${name} — ${soonLabel}`}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs border transition-none ${
            soon
              ? "border-border/25 text-muted-foreground/35 cursor-not-allowed"
              : "border-border/15 text-muted-foreground/20 cursor-not-allowed"
          }`}
        >
          <FlagEmoji
            code={region.flag}
            size="sm"
            className={soon ? "opacity-40" : "opacity-20"}
          />
          <span className={`line-through ${soon ? "decoration-muted-foreground/30" : "decoration-muted-foreground/15"}`}>
            {name}
          </span>
          <span className="ml-0.5 text-[8px] font-mono uppercase tracking-wider opacity-50">
            {soonLabel}
          </span>
        </button>
      );
    }

    return (
      <button
        key={region.code}
        type="button"
        onClick={() => onSelect(region.code)}
        title={name}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs border transition-all ${
          isSelected
            ? "bg-primary text-primary-foreground border-primary"
            : "border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/30"
        }`}
      >
        <FlagEmoji code={region.flag} size="sm" />
        {name}
      </button>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/40 pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("counsel.picker.search_placeholder")}
          className="w-full pl-7 pr-7 py-2 text-xs bg-muted/30 border border-border/40 rounded-sm focus:outline-none focus:border-primary/40 focus:bg-background placeholder:text-muted-foreground/40"
          autoComplete="off"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Region groups — continent sections collapse when empty (including during search) */}
      {filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground/50 font-mono px-1">—</p>
      ) : (
        CONTINENT_ORDER.map((continent) => {
          const regions = byContinent.get(continent) ?? [];
          if (regions.length === 0) return null;
          return (
            <div key={continent} className="space-y-1.5">
              <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/40 px-0.5">
                {continentLabel[continent]}
              </p>
              <div className="flex flex-wrap gap-1.5">{regions.map(renderRegion)}</div>
            </div>
          );
        })
      )}

      {/* Reset session override */}
      {sessionRegion && onReset && (
        <div className="pt-1 border-t border-border/20">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-sm text-xs border border-primary/30 text-primary hover:bg-primary/10 transition-all"
          >
            <X className="w-3 h-3" aria-hidden="true" />
            {t("counsel.session_override_reset")}
          </button>
        </div>
      )}
    </div>
  );
}
