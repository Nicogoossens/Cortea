import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Globe, Trophy, CheckCircle2, Loader2, ArrowRight, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import { useActiveRegion, FlagEmoji, type RegionCode } from "@/lib/active-region";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/**
 * Per-region summary returned by GET /api/learning-tracks/per-region-summary.
 * Mirrors the server payload exactly. The shape is deliberately small and
 * pre-aggregated so we never have to do heavy reduction work in the browser.
 */
interface RegionSummary {
  region_code: string;
  is_active: boolean;
  is_interest: boolean;
  added_at: string | null;
  mastered_phases: number;
  in_progress_phases: number;
  pillar_summary: Record<string, { mastered: number; in_progress: number; level?: number; max_level?: number }>;
  total_attempts: number;
  accuracy: number; // 0..1
  badges_earned: number;
  last_attempted_at: string | null;
}

/**
 * "Mijn leertrajecten per regio" overview shown on the profile.
 *
 * Surfaces the per-country progress that the platform was already tracking
 * silently (learning_track_progress + learning_track_attempts + region-scoped
 * badges). The user can see for every country they have ever studied:
 *   • mastered phases vs in-progress phases
 *   • total attempts + accuracy
 *   • badges earned in that country
 *   • when they last practiced
 *
 * The currently-active country gets an explicit "Actief" badge; all others
 * get a "Schakel naar dit land" button that flips the active region without
 * touching any stored progress (the data stays keyed by region_code).
 */
export function CountryProgressOverview() {
  const { t, locale } = useLanguage();
  const { activeRegion, setActiveRegion, getRegionName } = useActiveRegion();

  const [summary, setSummary] = useState<RegionSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/learning-tracks/per-region-summary`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: RegionSummary[] = await res.json();
        if (!cancelled) setSummary(data);
      } catch (err) {
        if (!cancelled) {
          // eslint-disable-next-line no-console
          console.warn("Per-region summary fetch failed", err);
          setError(t("country_progress.load_error"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [t]);

  // Re-fetch whenever the active region flips so the "Actief" badge moves
  // to the right card without a full page reload.
  useEffect(() => {
    if (!summary) return;
    setSummary((prev) => prev?.map((r) => ({ ...r, is_active: r.region_code === activeRegion })) ?? null);
  }, [activeRegion, summary?.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const dateLocale = useMemo(() => locale, [locale]);

  async function handleSwitch(code: string) {
    if (code === activeRegion) return;
    setSwitching(code);
    try {
      await setActiveRegion(code as RegionCode);
    } finally {
      setSwitching(null);
    }
  }

  return (
    <Card id="country-progress" className="border-border/40 bg-card shadow-sm scroll-mt-20">
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-lg flex items-center gap-2 text-foreground">
          <Globe className="w-4 h-4 text-primary/70" aria-hidden="true" />
          {t("country_progress.title")}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground font-light">
          {t("country_progress.desc")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 flex items-center justify-center text-muted-foreground/70 text-sm">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
            {t("common.loading")}
          </div>
        ) : error ? (
          <p className="text-xs text-destructive/80 italic py-4">{error}</p>
        ) : !summary || summary.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground/60">
            <Globe className="w-8 h-8 mx-auto mb-3 opacity-30" aria-hidden="true" />
            <p className="font-serif text-sm">{t("country_progress.empty_title")}</p>
            <p className="text-xs mt-1 font-light">{t("country_progress.empty_hint")}</p>
            <Link href="/atelier">
              <p className="text-xs mt-3 underline underline-offset-2 hover:text-foreground transition-colors cursor-pointer">
                {t("country_progress.empty_cta")}
              </p>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[11px] font-light text-muted-foreground/80 italic mb-1">
              {t("country_progress.preserved_note")}
            </p>
            {summary.map((row) => {
              const accuracyPct = Math.round(row.accuracy * 100);
              const lastDate = row.last_attempted_at
                ? format(new Date(row.last_attempted_at), "d MMM yyyy")
                : null;
              const isSwitching = switching === row.region_code;
              return (
                <div
                  key={row.region_code}
                  className={`rounded-sm border p-4 transition-all ${
                    row.is_active
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/40 bg-muted/10 hover:bg-muted/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <FlagEmoji code={row.region_code} size="sm" />
                      <div className="min-w-0">
                        <h4 className="font-serif text-sm text-foreground truncate">
                          {getRegionName(row.region_code as RegionCode)}
                        </h4>
                        {lastDate && (
                          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60 mt-0.5">
                            {t("country_progress.last_practiced")} {lastDate}
                          </p>
                        )}
                      </div>
                    </div>
                    {row.is_active ? (
                      <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 shrink-0">
                        {t("country_progress.active_badge")}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSwitch(row.region_code)}
                        disabled={isSwitching}
                        className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all shrink-0 inline-flex items-center gap-1.5 disabled:opacity-50"
                        aria-label={`${t("country_progress.switch_action")}: ${getRegionName(row.region_code as RegionCode)}`}
                      >
                        {isSwitching ? (
                          <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                        ) : (
                          <>
                            {t("country_progress.switch_action")}
                            <ArrowRight className="w-3 h-3" aria-hidden="true" />
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Stat row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                    <Stat
                      icon={<CheckCircle2 className="w-3 h-3" aria-hidden="true" />}
                      label={t("country_progress.mastered")}
                      value={String(row.mastered_phases)}
                    />
                    <Stat
                      icon={<Loader2 className="w-3 h-3" aria-hidden="true" />}
                      label={t("country_progress.in_progress")}
                      value={String(row.in_progress_phases)}
                    />
                    <Stat
                      icon={<Trophy className="w-3 h-3" aria-hidden="true" />}
                      label={t("country_progress.badges")}
                      value={String(row.badges_earned)}
                    />
                    <Stat
                      icon={<History className="w-3 h-3" aria-hidden="true" />}
                      label={t("country_progress.accuracy")}
                      value={row.total_attempts > 0 ? `${accuracyPct}%` : "—"}
                      sublabel={row.total_attempts > 0
                        ? `${row.total_attempts} ${t("country_progress.attempts_short")}`
                        : undefined}
                    />
                  </div>

                  {/* Per-pillar breakdown (only when there is anything to show) */}
                  {Object.keys(row.pillar_summary).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/30 space-y-1.5">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
                        {t("country_progress.per_pillar")}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                        {Object.entries(row.pillar_summary)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([pillarKey, stats]) => {
                            // Anchor-point ladder: 5 dots per pillar, filled
                            // up to the user's current level. Mastery shows a
                            // crown instead of the last dot.
                            const maxLevel = stats.max_level ?? 5;
                            const level = Math.min(stats.level ?? 0, maxLevel);
                            const mastered = stats.mastered > 0;
                            return (
                              <div key={pillarKey} className="flex items-center justify-between gap-2 text-xs">
                                <span className="text-muted-foreground/80 truncate">
                                  {pillarLabel(pillarKey, t)}
                                </span>
                                <span className="flex items-center gap-1 shrink-0" aria-label={`${level}/${maxLevel}`}>
                                  {Array.from({ length: maxLevel }).map((_, i) => {
                                    const filled = i < level;
                                    const isLastAndMastered = mastered && i === maxLevel - 1;
                                    return (
                                      <span
                                        key={i}
                                        className={
                                          isLastAndMastered
                                            ? "h-1.5 w-1.5 rounded-full bg-amber-500 ring-1 ring-amber-300"
                                            : filled
                                              ? "h-1.5 w-1.5 rounded-full bg-foreground/70"
                                              : "h-1.5 w-1.5 rounded-full border border-muted-foreground/30"
                                        }
                                        aria-hidden="true"
                                      />
                                    );
                                  })}
                                  <span className="font-mono text-[10px] text-muted-foreground/60 ml-1 tabular-nums">
                                    {level}/{maxLevel}
                                  </span>
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Resume / continue link */}
                  {row.is_active && (
                    <div className="mt-3">
                      <Link href="/atelier">
                        <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-primary hover:underline cursor-pointer">
                          {t("country_progress.continue_here")}
                          <ArrowRight className="w-3 h-3" aria-hidden="true" />
                        </span>
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ icon, label, value, sublabel }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <div className="rounded-sm bg-background/60 border border-border/30 px-2.5 py-2">
      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
      {sublabel && (
        <p className="text-[10px] font-light text-muted-foreground/60 leading-tight">{sublabel}</p>
      )}
    </div>
  );
}

/**
 * Map raw research_pillar codes (P1..P4 or "unscoped") to a translated
 * label. Falls back to the raw key so newly-added pillars do not blank out.
 */
function pillarLabel(key: string, t: (k: string, fallback?: string) => string): string {
  const map: Record<string, string> = {
    P1: t("country_progress.pillar.P1", "Pillar 1"),
    P2: t("country_progress.pillar.P2", "Pillar 2"),
    P3: t("country_progress.pillar.P3", "Pillar 3"),
    P4: t("country_progress.pillar.P4", "Pillar 4"),
    unscoped: t("country_progress.pillar.unscoped", "General"),
  };
  return map[key] ?? key;
}
