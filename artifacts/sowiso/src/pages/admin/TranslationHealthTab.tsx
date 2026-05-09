import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { useAdminFetch } from "@/lib/useAdminFetch";
import { useLanguage } from "@/lib/i18n";
import {
  Loader2, RefreshCw, Play, AlertTriangle, CheckCircle2, Clock,
  ChevronDown, Grid2x2, History,
} from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const TRANSLATION_LANGS = ["nl", "fr", "de", "es", "pt", "it", "ar", "ja", "zh"] as const;
type TransLang = typeof TRANSLATION_LANGS[number];

const TRANS_LABELS: Record<TransLang, string> = {
  nl: "NL", fr: "FR", de: "DE", es: "ES", pt: "PT",
  it: "IT", ar: "AR", ja: "JA", zh: "ZH",
};

interface RegCoverage { count: number; pct: number }
interface QualityMetrics {
  avg_score: number; pct_passed: number | null; pct_rewritten: number | null;
  per_register?: Record<string, { avg_score?: number; pct_passed?: number } | unknown> | null;
}
interface LangCoverage {
  lang: TransLang; count: number; pct: number; last_run?: unknown;
  by_register?: Record<string, RegCoverage>;
  quality_metrics?: QualityMetrics | null; previous_quality_metrics?: QualityMetrics | null;
}
interface LtqGridCell { count: number; pct: number }
interface LtqStatus {
  ok: boolean; en_total: number;
  en_by_register?: Record<string, number>;
  en_by_region_register?: Record<string, Record<string, number>>;
  region_register_grid?: Record<string, Record<string, Record<string, LtqGridCell>>>;
  langs: LangCoverage[];
}
interface ScenarioStatus {
  ok: boolean; total: number; langs: LangCoverage[];
  last_run?: { started_at: string; status: string; items_processed: number; estimated_usd: number };
}
interface CompassStatus {
  ok: boolean; total: number; langs: LangCoverage[];
  last_run?: { started_at: string; status: string; items_processed: number; estimated_usd: number };
}
interface CounselDomainCoverage { domain: string; active: number; draft: number; missing: number; pct: number }
interface CounselSeedCoverageStatus {
  ok: boolean; total_regions: number; domains: CounselDomainCoverage[];
  last_run?: { started_at: string; status: string; items_processed: number; estimated_usd: number } | null;
}
interface CounselSeedTransStatus {
  ok: boolean; total: number; langs: LangCoverage[];
  last_run?: { started_at: string; status: string; items_processed: number; estimated_usd: number } | null;
}
interface WorkerRun {
  id: number; sweeper: string; started_at: string; finished_at: string | null;
  items_processed: number; estimated_usd: number; status: string;
  metadata: Record<string, unknown> | null;
}

function formatRelative(ts: string | number | null | undefined): string {
  if (!ts) return "never";
  const d = typeof ts === "number" ? ts : Date.parse(ts);
  if (isNaN(d)) return "—";
  const diff = Date.now() - d;
  if (diff < 0) return "just now";
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ${Math.floor(min % 60)}m ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function CovBar({ pct, count }: { pct: number; count: number }) {
  const color = pct >= 85 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="space-y-0.5">
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <p className="text-[10px] font-mono text-muted-foreground tabular-nums">{count.toLocaleString()} · {pct}%</p>
    </div>
  );
}

function QualityBadge({ metrics, previous }: { metrics: QualityMetrics; previous?: QualityMetrics | null }) {
  const score = metrics.avg_score;
  const colorClass = score >= 8.0 ? "bg-emerald-500/15 text-emerald-700 border-emerald-300/40" : score >= 7.0 ? "bg-amber-500/15 text-amber-700 border-amber-300/40" : "bg-rose-500/15 text-rose-700 border-rose-300/40";
  const passed = metrics.pct_passed != null ? `${Math.round(metrics.pct_passed)}% direct geslaagd` : null;
  const rewritten = metrics.pct_rewritten != null ? `${Math.round(metrics.pct_rewritten)}% herschreven` : null;
  const delta = previous != null ? +(score - previous.avg_score).toFixed(2) : null;
  const deltaTip = delta != null ? `prev avg ${previous!.avg_score.toFixed(1)} → now ${score.toFixed(1)} (${delta >= 0 ? "+" : ""}${delta.toFixed(1)})` : null;
  const tooltip = [`avg ${score.toFixed(1)}/10`, passed, rewritten, deltaTip].filter(Boolean).join(" · ");
  return (
    <span title={tooltip} className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded border text-[10px] font-mono tabular-nums cursor-default ${colorClass}`}>
      {score.toFixed(1)}
      {delta != null && Math.abs(delta) >= 0.05 && <span className={delta > 0 ? "text-emerald-600" : "text-rose-600"}>{delta > 0 ? "↑" : "↓"}</span>}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = { ok: "bg-emerald-500/15 text-emerald-700", partial: "bg-amber-500/15 text-amber-700", budget_capped: "bg-blue-500/15 text-blue-700", failed: "bg-rose-500/15 text-rose-700" };
  return <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase ${map[status] ?? "bg-muted text-muted-foreground"}`}>{status}</span>;
}

function fmtUsd(n: number) { return n < 0.01 ? "<$0.01" : `~$${n.toFixed(2)}`; }
function fmtMin(min: number) {
  if (min < 1) return "<1 min";
  if (min < 60) return `~${Math.ceil(min)} min`;
  const h = Math.floor(min / 60), m = Math.round(min % 60);
  return m > 0 ? `~${h}u ${m}m` : `~${h}u`;
}

function sweeperLabel(sweeper: string): string {
  if (sweeper.startsWith("ltq-translation-")) return `Practice questions ${sweeper.replace("ltq-translation-", "").toUpperCase()}`;
  if (sweeper === "scenario-translation") return "Scenarios (all languages)";
  if (sweeper === "compass-content-translation") return "Country protocols";
  if (sweeper.startsWith("compass-content-translation-")) return `Country protocols ${sweeper.replace("compass-content-translation-", "").toUpperCase()}`;
  if (sweeper === "compass-translation") return "Country protocols";
  if (sweeper === "counsel-seed") return "Atelier distillates";
  if (sweeper === "counsel-seed-translation") return "Atelier distillates (Translation)";
  return sweeper;
}

function LangRunHistoryModal({ sweeper, langParam, label, children }: { sweeper: string; langParam?: string; label: string; children?: React.ReactNode }) {
  const { t } = useLanguage();
  const adminFetch = useAdminFetch();
  const [open, setOpen] = useState(false);
  const [runs, setRuns] = useState<WorkerRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const params = new URLSearchParams({ sweeper, limit: "50" });
      if (langParam) params.set("lang", langParam);
      const res = await adminFetch(`${API_BASE}/api/admin/worker-runs?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { runs: WorkerRun[] };
      setRuns(data.runs);
    } catch (e) { setErr(String(e)); }
    finally { setLoading(false); }
  }, [sweeper, langParam]);

  const handleOpen = (v: boolean) => { setOpen(v); if (v) load(); };

  const defaultTrigger = (
    <button type="button" className="text-muted-foreground/50 hover:text-muted-foreground transition-colors" title={`Rungeschiedenis voor ${label}`} aria-label={`Rungeschiedenis voor ${label}`}>
      <History className="w-3 h-3" />
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{children ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-3xl w-full max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase tracking-widest">{t("admin.trans.run_history")} — {label}</DialogTitle>
          <DialogDescription className="text-xs font-mono text-muted-foreground">sweeper: {sweeper} · {t("admin.trans.last_50_runs")}</DialogDescription>
        </DialogHeader>
        {loading && <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground font-mono"><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t("admin.cc.loading")}</div>}
        {err && <p className="text-xs font-mono text-rose-600 py-2">{err}</p>}
        {!loading && !err && runs.length === 0 && <p className="text-xs font-mono text-muted-foreground py-4">{t("admin.trans.no_runs")}</p>}
        {!loading && runs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead><tr className="text-left text-muted-foreground border-b border-border/40">
                <th className="py-1.5 pr-4 font-normal whitespace-nowrap">tijdstip</th>
                <th className="py-1.5 pr-3 font-normal text-right">items</th>
                <th className="py-1.5 pr-3 font-normal text-right">kosten</th>
                <th className="py-1.5 pr-3 font-normal text-right">kwaliteit</th>
                <th className="py-1.5 font-normal">status</th>
              </tr></thead>
              <tbody>
                {runs.map((r, idx) => {
                  const meta = (r.metadata ?? {}) as Record<string, unknown>;
                  const avgScore = typeof meta.avg_score === "number" ? meta.avg_score : typeof meta.avg_quality_score === "number" ? meta.avg_quality_score : null;
                  const prevRun = runs[idx + 1];
                  const prevMeta = (prevRun?.metadata ?? {}) as Record<string, unknown>;
                  const prevScore = prevRun ? (typeof prevMeta.avg_score === "number" ? prevMeta.avg_score : typeof prevMeta.avg_quality_score === "number" ? prevMeta.avg_quality_score : null) : null;
                  const scoreDelta = avgScore !== null && prevScore !== null ? +(avgScore - prevScore).toFixed(2) : null;
                  const scoreColor = avgScore === null ? "" : avgScore >= 8.0 ? "text-emerald-700" : avgScore >= 7.0 ? "text-amber-700" : "text-rose-700";
                  return (
                    <tr key={r.id} className="border-t border-border/20 hover:bg-muted/20">
                      <td className="py-1.5 pr-4 text-muted-foreground whitespace-nowrap">{formatRelative(r.started_at)}</td>
                      <td className="py-1.5 pr-3 text-right tabular-nums">{r.items_processed}</td>
                      <td className="py-1.5 pr-3 text-right tabular-nums">${r.estimated_usd.toFixed(3)}</td>
                      <td className="py-1.5 pr-3 text-right tabular-nums">
                        {avgScore !== null ? (
                          <span className={scoreColor}>⭐{avgScore.toFixed(1)}{scoreDelta !== null && Math.abs(scoreDelta) >= 0.05 && <span className={scoreDelta > 0 ? "text-emerald-600" : "text-rose-600"}>{scoreDelta > 0 ? "↑" : "↓"}</span>}</span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="py-1.5"><StatusPill status={r.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function WorkerRunsLog({ runs }: { runs: WorkerRun[] }) {
  const [open, setOpen] = useState(false);
  if (runs.length === 0) return null;
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setOpen((o) => !o)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Recente vertaalruns ({runs.length})
          </CardTitle>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </CardHeader>
      {open && (
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead><tr className="text-left text-muted-foreground border-b border-border/40">
                <th className="py-1.5 pr-3 font-normal">tijdstip</th>
                <th className="py-1.5 pr-3 font-normal">module</th>
                <th className="py-1.5 pr-2 font-normal">taal</th>
                <th className="py-1.5 pr-2 font-normal">register</th>
                <th className="py-1.5 pr-2 font-normal">regio</th>
                <th className="py-1.5 pr-2 font-normal text-right">items</th>
                <th className="py-1.5 pr-2 font-normal text-right">kosten</th>
                <th className="py-1.5 pr-2 font-normal text-right">duur</th>
                <th className="py-1.5 pr-3 font-normal">kwaliteit</th>
                <th className="py-1.5 font-normal">status</th>
              </tr></thead>
              <tbody>
                {runs.map((r) => {
                  const meta = (r.metadata ?? {}) as Record<string, unknown>;
                  const avgScore = typeof meta.avg_score === "number" ? meta.avg_score : typeof meta.avg_quality_score === "number" ? meta.avg_quality_score : null;
                  const pctPassed = typeof meta.pct_passed_first_try === "number" ? meta.pct_passed_first_try : null;
                  const scoreLow = avgScore !== null && avgScore < 7.5;
                  const scoreColor = avgScore === null ? "" : avgScore >= 8.0 ? "text-emerald-700" : avgScore >= 7.0 ? "text-amber-700" : "text-rose-700";
                  const metaLang = typeof meta.lang === "string" ? meta.lang.toUpperCase() : null;
                  const swLang = r.sweeper.startsWith("ltq-translation-") ? r.sweeper.replace("ltq-translation-", "").toUpperCase()
                    : r.sweeper.startsWith("scenario-translation-") ? r.sweeper.replace("scenario-translation-", "").toUpperCase()
                    : r.sweeper.startsWith("compass-content-translation-") ? r.sweeper.replace("compass-content-translation-", "").toUpperCase()
                    : metaLang;
                  const moduleName = r.sweeper.startsWith("ltq-translation") ? "LTQ"
                    : r.sweeper.startsWith("scenario-translation") ? "Scenario"
                    : r.sweeper.startsWith("compass-content-translation") || r.sweeper.startsWith("compass-translation") ? "Compass"
                    : r.sweeper.startsWith("counsel-seed-translation") ? "Atelier (trans.)"
                    : r.sweeper === "counsel-seed" ? "Atelier (gen.)" : sweeperLabel(r.sweeper);
                  const metaRegister = typeof meta.register === "string" ? meta.register : typeof meta.registers === "string" ? meta.registers : null;
                  const metaRegion = typeof meta.region === "string" ? meta.region : typeof meta.region_code === "string" ? meta.region_code : null;
                  const registerLabel = metaRegister === "middle_class" ? "Midden" : metaRegister === "elite" ? "Elite" : metaRegister ?? "—";
                  let duurLabel = "—";
                  if (r.finished_at) { const ms = new Date(r.finished_at).getTime() - new Date(r.started_at).getTime(); const mins = Math.round(ms / 60000); duurLabel = mins < 1 ? "<1 min" : `${mins} min`; }
                  else if (r.status !== "failed") duurLabel = "⏳";
                  return (
                    <tr key={r.id} className="border-t border-border/20 hover:bg-muted/20">
                      <td className="py-1 pr-3 text-muted-foreground whitespace-nowrap">{formatRelative(r.started_at)}</td>
                      <td className="py-1 pr-3 font-medium">{moduleName}</td>
                      <td className="py-1 pr-2">{swLang ?? "—"}</td>
                      <td className="py-1 pr-2 text-muted-foreground">{registerLabel}</td>
                      <td className="py-1 pr-2 text-muted-foreground">{metaRegion ?? "—"}</td>
                      <td className="py-1 pr-2 text-right tabular-nums">{r.items_processed}</td>
                      <td className="py-1 pr-2 text-right tabular-nums">${r.estimated_usd.toFixed(3)}</td>
                      <td className="py-1 pr-2 text-right tabular-nums text-muted-foreground">{duurLabel}</td>
                      <td className="py-1 pr-3">
                        {avgScore !== null ? (
                          <span className={`tabular-nums ${scoreColor}`} title={pctPassed !== null ? `${Math.round(pctPassed)}% eerste poging geslaagd` : undefined}>
                            {scoreLow && "⚠ "}⭐{avgScore.toFixed(1)}{pctPassed !== null ? ` · ${Math.round(pctPassed)}%` : ""}
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="py-1"><StatusPill status={r.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

const LTQ_GRID_ROWS = [
  { region: "BE", register: "middle_class", label: "BE Middenklasse" },
  { region: "BE", register: "elite",        label: "BE Elite" },
  { region: "AE", register: "middle_class", label: "AE Middenklasse" },
  { region: "AE", register: "elite",        label: "AE Elite" },
] as const;

function LtqRegisterGrid({ ltq, onTranslateLang, onTranslateRow, onTranslateCell, launching, rowLaunching, cellLaunching, activeSweepers }: {
  ltq: LtqStatus; onTranslateLang: (lang: TransLang) => Promise<void>;
  onTranslateRow: (region: string, register: string) => Promise<void>;
  onTranslateCell: (lang: TransLang, region: string, register: string) => Promise<void>;
  launching: string | null; rowLaunching: string | null; cellLaunching: string | null; activeSweepers: Set<string>;
}) {
  const grid = ltq.region_register_grid ?? {};
  const enGrid = ltq.en_by_region_register ?? {};
  const gridQuality = (ltq as unknown as Record<string, unknown>).grid_quality as Record<string, Record<string, Record<string, { avg_score: number; pct_passed: number | null } | null>>> | undefined;
  const anyBusy = launching !== null || rowLaunching !== null || cellLaunching !== null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="py-1.5 pr-3 text-left font-normal text-muted-foreground text-[10px] uppercase tracking-wide w-40">Register</th>
            {TRANSLATION_LANGS.map((lang) => {
              const isActive = activeSweepers.has(`ltq-translation-${lang}`) || activeSweepers.has("ltq-translation");
              return (
                <th key={lang} className="py-1.5 px-1 font-normal text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[10px] font-semibold text-foreground/70">{lang.toUpperCase()}</span>
                    <button className="text-[9px] text-primary/60 hover:text-primary disabled:opacity-30 transition-colors" disabled={anyBusy || isActive} onClick={() => onTranslateLang(lang)} title={isActive ? `LTQ-worker voor ${lang.toUpperCase()} is actief` : `Start LTQ-vertaling voor ${lang.toUpperCase()} (alle regio's + registers)`}>
                      {(launching === lang || isActive) ? <Loader2 className="w-2.5 h-2.5 animate-spin inline" /> : "▶"}
                    </button>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {LTQ_GRID_ROWS.map(({ region, register, label }) => {
            const enTotal = enGrid[region]?.[register] ?? 0;
            const rowData = grid[region]?.[register] ?? {};
            const rowKey = `${region}-${register}`;
            const rowActive = [...activeSweepers].some((s) => s.startsWith("ltq-translation"));
            const rowBusy = rowLaunching === rowKey;
            const missingLangs = TRANSLATION_LANGS.filter((lang) => (rowData[lang] ?? { count: 0, pct: 0 }).pct < 100);
            return (
              <tr key={rowKey} className="border-t border-border/20">
                <td className="py-2 pr-3 align-top">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-medium text-foreground/80 leading-tight">{label}</span>
                    {enTotal > 0 && <span className="text-[9px] font-mono text-muted-foreground/60">{enTotal.toLocaleString()} EN</span>}
                    {missingLangs.length > 0 && enTotal > 0 && (
                      <button className="flex items-center gap-0.5 text-[9px] font-mono text-primary/60 hover:text-primary disabled:opacity-30 transition-colors mt-0.5" disabled={anyBusy || rowActive} onClick={() => onTranslateRow(region, register)} title={rowActive ? `Worker voor ${label} is actief` : `Alle ${missingLangs.length} ontbrekende talen vertalen voor ${label}`}>
                        {(rowBusy || rowActive) ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Play className="w-2.5 h-2.5" />}
                        <span>Alle talen ({missingLangs.length})</span>
                      </button>
                    )}
                  </div>
                </td>
                {TRANSLATION_LANGS.map((lang) => {
                  const cell = rowData[lang] ?? { count: 0, pct: 0 };
                  const isRed = enTotal > 0 && cell.pct === 0;
                  const isOrange = cell.pct > 0 && cell.pct < 85;
                  const cellBg = isRed ? "bg-rose-500/5" : "";
                  const barColor = cell.pct >= 85 ? "bg-emerald-500" : cell.pct >= 50 ? "bg-amber-500" : "bg-rose-500";
                  const cellQual = gridQuality?.[region]?.[register]?.[lang] ?? null;
                  const qualScore = cellQual?.avg_score ?? null;
                  const qualColor = qualScore === null ? "" : qualScore >= 8.0 ? "text-emerald-700" : qualScore >= 7.0 ? "text-amber-700" : "text-rose-700";
                  const cellKey = `${rowKey}-${lang}`;
                  const cellActive = activeSweepers.has(`ltq-translation-${lang}`) || rowActive;
                  const cellBusy = cellLaunching === cellKey;
                  const remaining = enTotal > 0 ? Math.max(0, enTotal - cell.count) : 0;
                  return (
                    <td key={lang} className={`py-2 px-1 text-center align-top ${cellBg}`}>
                      <div className="flex flex-col items-center gap-0.5 min-w-[38px]">
                        <div className="h-1 w-9 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${Math.min(100, cell.pct)}%` }} />
                        </div>
                        <span className={`tabular-nums text-[9px] ${isRed ? "text-rose-600 font-medium" : isOrange ? "text-amber-700" : "text-muted-foreground"}`}>{cell.count}/{enTotal > 0 ? enTotal : "?"}</span>
                        <span className="tabular-nums text-[9px] text-muted-foreground/60">{cell.pct}%</span>
                        {qualScore !== null && <span className={`text-[8px] tabular-nums leading-none ${qualColor}`} title={`Kwaliteitsscore (${register === "middle_class" ? "middenklasse" : "elite"} / ${lang.toUpperCase()}): ${qualScore.toFixed(1)}/10`}>⭐{qualScore.toFixed(1)}</span>}
                        {remaining > 0 && (
                          <button className="text-[8px] text-primary/50 hover:text-primary disabled:opacity-25 transition-colors mt-0.5" disabled={anyBusy || cellActive} onClick={() => onTranslateCell(lang, region, register)} title={cellActive ? `Worker voor ${lang.toUpperCase()} / ${label} is actief` : `${remaining.toLocaleString()} rijen vertalen (${lang.toUpperCase()} / ${label})`}>
                            {(cellBusy || cellActive) ? <Loader2 className="w-2 h-2 animate-spin inline" /> : "▶"}
                          </button>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const COUNSEL_DOMAIN_LABELS: Record<string, string> = {
  gastronomy: "Gastronomy", business: "Business", eloquence: "Eloquence",
  formal_events: "Formal events", dress_code: "Dress code", cultural_knowledge: "Cultural knowledge",
};
const SEED_COST_PER_REGION = 0.008;
const SEED_REGIONS_PER_MIN = 8;

function DomainCoverageCard({ data, launching, onGenerateAll, onGenerateDomain }: {
  data: CounselSeedCoverageStatus; launching: string | null;
  onGenerateAll: () => Promise<void>; onGenerateDomain: (domain: string) => Promise<void>;
}) {
  const { t } = useLanguage();
  const totalMissing = data.domains.reduce((s, d) => s + d.missing, 0);
  const totalEstCost = totalMissing * SEED_COST_PER_REGION;
  const totalEstMin = totalMissing / SEED_REGIONS_PER_MIN;
  const allActive = data.domains.every((d) => d.missing === 0 && d.draft === 0 && d.active === data.total_regions);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold text-foreground">{t("admin.trans.atelier_title")}</CardTitle>
            <p className="text-xs text-muted-foreground leading-snug">{t("admin.trans.atelier_desc", { n: data.total_regions, total: (data.total_regions * 6).toLocaleString() })}</p>
            <div className="flex items-start gap-1.5 mt-1.5 px-2 py-1.5 rounded bg-muted/50 border border-border/40">
              <Play className="w-3 h-3 mt-0.5 shrink-0 text-primary/60" />
              <p className="text-[11px] text-muted-foreground leading-snug">{t("admin.trans.atelier_hint")}</p>
            </div>
            <p className="text-[11px] font-mono text-muted-foreground/70 pt-0.5">
              {totalMissing > 0
                ? <>{t("admin.trans.domain_remaining", { n: totalMissing.toLocaleString() })} · {fmtUsd(totalEstCost)} · {fmtMin(totalEstMin)}</>
                : <>{t("admin.trans.all_domains_done")}</>}
              {data.last_run && <> · {t("admin.trans.last_run")} {formatRelative(data.last_run.started_at)} · <StatusPill status={data.last_run.status} /></>}
            </p>
          </div>
          <Button size="sm" variant={allActive ? "outline" : "default"} className="font-mono text-xs gap-1.5 shrink-0" disabled={launching !== null || totalMissing === 0} onClick={onGenerateAll} title={t("admin.trans.start_domains_hint", { cost: fmtUsd(totalEstCost), dur: fmtMin(totalEstMin) })}>
            {launching === "all" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {t("admin.trans.fill_all_domains")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {data.domains.map((d) => {
            const estCost = d.missing * SEED_COST_PER_REGION;
            const estMin = d.missing / SEED_REGIONS_PER_MIN;
            const color = d.pct >= 100 ? "bg-emerald-500" : d.pct >= 50 ? "bg-amber-500" : "bg-rose-500";
            const isDone = d.missing === 0;
            return (
              <div key={d.domain} className="flex items-center gap-3">
                <div className="w-32 shrink-0"><span className="text-xs font-mono text-foreground/80">{COUNSEL_DOMAIN_LABELS[d.domain] ?? d.domain}</span></div>
                <div className="flex-1 space-y-0.5 min-w-0">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className={`h-full ${color} transition-all duration-500`} style={{ width: `${Math.min(100, d.pct)}%` }} /></div>
                  <p className="text-[10px] font-mono text-muted-foreground tabular-nums">{d.active} active · {d.draft} draft · {d.missing} missing{d.missing > 0 && <> · {fmtUsd(estCost)} · {fmtMin(estMin)}</>}</p>
                </div>
                <div className="w-8 shrink-0 text-right">
                  <button className="text-[10px] font-mono text-primary/70 hover:text-primary disabled:opacity-40 transition-colors" disabled={launching !== null || isDone} onClick={() => onGenerateDomain(d.domain)} title={isDone ? `${COUNSEL_DOMAIN_LABELS[d.domain]} is complete.` : `Generate seeds for all missing regions in ${COUNSEL_DOMAIN_LABELS[d.domain]}. ${d.missing} regions · ${fmtUsd(estCost)} · ${fmtMin(estMin)}.`}>
                    {launching === d.domain ? <Loader2 className="w-3 h-3 animate-spin inline" /> : "▶"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface CoverageCardProps {
  title: string; description: string; actionLabel: string; total: number;
  langs: LangCoverage[]; sweeper: string; showRegisterBars?: boolean;
  costPerItem: number; itemsPerMinute: number; onTranslateAll: () => Promise<void>;
  onTranslateLang: (lang: TransLang) => Promise<void>; onForceTranslateLang?: (lang: TransLang) => Promise<void>;
  launching: string | null;
  lastRun?: { started_at: string; status: string; items_processed: number; estimated_usd: number } | null;
  hideAllButton?: boolean; activeSweepers?: Set<string>;
}

function CoverageCard({ title, description, actionLabel, total, langs, sweeper, showRegisterBars, costPerItem, itemsPerMinute, onTranslateAll, onTranslateLang, onForceTranslateLang, launching, lastRun, hideAllButton, activeSweepers }: CoverageCardProps) {
  const { t } = useLanguage();
  const isModuleActive = activeSweepers ? [...activeSweepers].some((s) => s === sweeper || s.startsWith(`${sweeper}-`)) : false;
  const isLangActive = (lang: string) => activeSweepers ? (activeSweepers.has(`${sweeper}-${lang}`) || activeSweepers.has(sweeper)) : false;
  const allDone = langs.every((l) => l.pct >= 100);
  const totalRemaining = langs.reduce((s, l) => s + Math.max(0, total - l.count), 0);
  const totalEstCost = totalRemaining * costPerItem;
  const totalEstMin = totalRemaining / itemsPerMinute;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
            <p className="text-xs text-muted-foreground leading-snug">{description}</p>
            <div className="flex items-start gap-1.5 mt-1.5 px-2 py-1.5 rounded bg-muted/50 border border-border/40">
              <Play className="w-3 h-3 mt-0.5 shrink-0 text-primary/60" />
              <p className="text-[11px] text-muted-foreground leading-snug"><span className="font-medium text-foreground/80">De ▶-knop per taal</span> {actionLabel}</p>
            </div>
            <p className="text-[11px] font-mono text-muted-foreground/70 pt-0.5">
              {t("admin.trans.source_rows", { n: total.toLocaleString() })}
              {!allDone && totalRemaining > 0 && <> · {t("admin.trans.remaining", { n: totalRemaining.toLocaleString() })} · {fmtUsd(totalEstCost)} · {fmtMin(totalEstMin)}</>}
              {lastRun && <> · {t("admin.trans.last_run")} {formatRelative(lastRun.started_at)} · <StatusPill status={lastRun.status} /></>}
            </p>
          </div>
          {!hideAllButton && (
            <Button size="sm" variant={allDone ? "outline" : "default"} className="font-mono text-xs gap-1.5 shrink-0" disabled={launching !== null || isModuleActive} onClick={onTranslateAll} title={isModuleActive ? t("admin.trans.worker_active") : t("admin.trans.start_all_hint", { cost: fmtUsd(totalEstCost), dur: fmtMin(totalEstMin) })}>
              {(launching === "all" || isModuleActive) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              {t("admin.trans.translate_all_langs")}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-x-4 gap-y-4">
          {langs.map((l) => {
            const remaining = Math.max(0, total - l.count);
            const estCost = remaining * costPerItem;
            const estMin = remaining / itemsPerMinute;
            const tooltip = remaining > 0 ? `Start DB-vertaling voor ${l.lang.toUpperCase()}: ${remaining.toLocaleString()} rijen nog te vertalen. Geschat: ${fmtUsd(estCost)} · ${fmtMin(estMin)}.` : `${l.lang.toUpperCase()} is volledig vertaald.`;
            return (
              <div key={l.lang} className="space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1 min-w-0">
                    {sweeper.startsWith("ltq-translation") ? (
                      <LangRunHistoryModal sweeper={`${sweeper}-${l.lang}`} label={`${TRANS_LABELS[l.lang]} · ${sweeper}-${l.lang}`}>
                        <button type="button" className="flex items-center gap-1 cursor-pointer hover:opacity-70 transition-opacity" title={`Rungeschiedenis voor ${TRANS_LABELS[l.lang]}`}>
                          <span className="text-xs font-mono font-semibold text-foreground/80">{TRANS_LABELS[l.lang]}</span>
                          {l.quality_metrics && <QualityBadge metrics={l.quality_metrics} previous={l.previous_quality_metrics} />}
                          <History className="w-3 h-3 text-muted-foreground/50" />
                        </button>
                      </LangRunHistoryModal>
                    ) : (
                      <LangRunHistoryModal sweeper={sweeper} langParam={l.lang} label={`${TRANS_LABELS[l.lang]} · ${sweeper}`}>
                        <button type="button" className="flex items-center gap-1 cursor-pointer hover:opacity-70 transition-opacity" title={`Rungeschiedenis voor ${TRANS_LABELS[l.lang]}`}>
                          <span className="text-xs font-mono font-semibold text-foreground/80">{TRANS_LABELS[l.lang]}</span>
                          {l.quality_metrics && <QualityBadge metrics={l.quality_metrics} previous={l.previous_quality_metrics} />}
                          <History className="w-3 h-3 text-muted-foreground/50" />
                        </button>
                      </LangRunHistoryModal>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button className="text-[10px] font-mono text-primary/70 hover:text-primary disabled:opacity-40 transition-colors" disabled={launching !== null || isLangActive(l.lang) || remaining === 0} onClick={() => onTranslateLang(l.lang)} title={isLangActive(l.lang) ? `Een vertaalworker voor ${l.lang.toUpperCase()} is actief — wacht tot die klaar is.` : tooltip}>
                      {(launching === l.lang || isLangActive(l.lang)) ? <Loader2 className="w-3 h-3 animate-spin inline" /> : "▶"}
                    </button>
                    {onForceTranslateLang && (
                      <button className="text-[9px] font-mono text-orange-500/70 hover:text-orange-500 disabled:opacity-40 transition-colors leading-none flex items-center gap-0.5" disabled={launching !== null || isLangActive(l.lang)} onClick={() => onForceTranslateLang(l.lang)} title={`Hertalen (overschrijf bestaande) — start de vertaalworker voor ${l.lang.toUpperCase()} met --force; reeds vertaalde seeds worden opnieuw vertaald.`} aria-label={`Hertalen (overschrijf bestaande) voor ${l.lang.toUpperCase()}`}>
                        {launching === `force-${l.lang}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <><span>↺</span><span className="hidden sm:inline">Hertalen</span></>}
                      </button>
                    )}
                  </div>
                </div>
                <CovBar pct={l.pct} count={l.count} />
                {remaining > 0 && <p className="text-[9px] font-mono text-muted-foreground/50 tabular-nums leading-tight">{remaining.toLocaleString()} rijen · {fmtUsd(estCost)}<br />{fmtMin(estMin)}</p>}
                {showRegisterBars && l.by_register && (
                  <div className="space-y-1 pt-0.5">
                    {(["middle_class", "elite"] as const).map((reg) => {
                      const rv = l.by_register![reg] ?? { count: 0, pct: 0 };
                      return (
                        <div key={reg} className="space-y-0.5">
                          <p className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-wide">{reg === "middle_class" ? t("admin.trans.register_middle") : t("admin.trans.register_elite")}</p>
                          <div className="h-1 bg-muted rounded-full overflow-hidden"><div className={`h-full transition-all duration-500 ${reg === "middle_class" ? "bg-blue-400" : "bg-purple-400"}`} style={{ width: `${Math.min(100, rv.pct)}%` }} /></div>
                          <p className="text-[9px] font-mono text-muted-foreground/60 tabular-nums">{rv.count.toLocaleString()} · {rv.pct}%</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function TranslationHealthTab() {
  const { t } = useLanguage();
  const adminFetch = useAdminFetch();
  const [ltq, setLtq] = useState<LtqStatus | null>(null);
  const [scen, setScen] = useState<ScenarioStatus | null>(null);
  const [compass, setCompass] = useState<CompassStatus | null>(null);
  const [counselSeeds, setCounselSeeds] = useState<CounselSeedCoverageStatus | null>(null);
  const [counselSeedTrans, setCounselSeedTrans] = useState<CounselSeedTransStatus | null>(null);
  const [runs, setRuns] = useState<WorkerRun[]>([]);
  const [activeRuns, setActiveRuns] = useState<WorkerRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [weekCostUsd, setWeekCostUsd] = useState<number | null>(null);
  const [ltqLaunching, setLtqLaunching] = useState<string | null>(null);
  const [scenLaunching, setScenLaunching] = useState<string | null>(null);
  const [compassLaunching, setCompassLaunching] = useState<string | null>(null);
  const [seedsLaunching, setSeedsLaunching] = useState<string | null>(null);
  const [seedTransLaunching, setSeedTransLaunching] = useState<string | null>(null);
  const [ltqRowLaunching, setLtqRowLaunching] = useState<string | null>(null);
  const [ltqCellLaunching, setLtqCellLaunching] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [workerTarget, setWorkerTarget] = useState<"dev" | "prod">("dev");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 4000); };

  const fetchAll = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const [ltqRes, scenRes, compassRes, seedsRes, seedsTransRes, runsRes, activeRunsRes, weekCostRes] = await Promise.all([
        adminFetch(`${API_BASE}/api/admin/ltq/translation-status`),
        adminFetch(`${API_BASE}/api/admin/scenarios/translation-status`),
        adminFetch(`${API_BASE}/api/admin/compass/translation-status`),
        adminFetch(`${API_BASE}/api/admin/counsel-seeds/coverage`),
        adminFetch(`${API_BASE}/api/admin/counsel-seeds/translation-status`),
        adminFetch(`${API_BASE}/api/admin/worker-runs?limit=50`),
        adminFetch(`${API_BASE}/api/admin/worker-runs?active=1`),
        adminFetch(`${API_BASE}/api/admin/translation/week-cost`),
      ]);
      if (ltqRes.ok)        setLtq(await ltqRes.json() as LtqStatus);
      if (scenRes.ok)       setScen(await scenRes.json() as ScenarioStatus);
      if (compassRes.ok)    setCompass(await compassRes.json() as CompassStatus);
      if (seedsRes.ok)      setCounselSeeds(await seedsRes.json() as CounselSeedCoverageStatus);
      if (seedsTransRes.ok) setCounselSeedTrans(await seedsTransRes.json() as CounselSeedTransStatus);
      if (runsRes.ok)       setRuns(((await runsRes.json()) as { runs: WorkerRun[] }).runs);
      if (activeRunsRes.ok) setActiveRuns(((await activeRunsRes.json()) as { runs: WorkerRun[] }).runs);
      if (weekCostRes.ok)   setWeekCostUsd(((await weekCostRes.json()) as { week_usd: number }).week_usd);
    } catch (e) { setErr(String(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); const id = setInterval(fetchAll, 30_000); return () => clearInterval(id); }, [fetchAll]);

  const targetParam = workerTarget === "prod" ? { target: "prod" as const } : {};

  const launchLtqAll = async () => { setLtqLaunching("all"); try { const res = await adminFetch(`${API_BASE}/api/admin/ltq/translate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ parallel: 2, ...targetParam }) }); const d = await res.json(); showToast(d.message ?? "LTQ orchestrator launched."); } catch { showToast("Failed to launch LTQ orchestrator."); } finally { setLtqLaunching(null); } };
  const launchLtqLang = async (lang: TransLang) => { setLtqLaunching(lang); try { const res = await adminFetch(`${API_BASE}/api/admin/ltq/translate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lang, ...targetParam }) }); const d = await res.json(); showToast(d.message ?? `LTQ [${lang}] launched.`); } catch { showToast(`Failed to launch LTQ [${lang}].`); } finally { setLtqLaunching(null); } };
  const launchLtqRow = async (region: string, register: string) => { const key = `${region}-${register}`; setLtqRowLaunching(key); try { const res = await adminFetch(`${API_BASE}/api/admin/ltq/translate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ region_code: region, register, ...targetParam }) }); const d = await res.json(); showToast(d.message ?? `LTQ ${key} (alle ontbrekende talen) gestart.`); } catch { showToast(`Kon LTQ ${key} niet starten.`); } finally { setLtqRowLaunching(null); } };
  const launchLtqCell = async (lang: TransLang, region: string, register: string) => { const key = `${region}-${register}-${lang}`; setLtqCellLaunching(key); try { const res = await adminFetch(`${API_BASE}/api/admin/ltq/translate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lang, region_code: region, register, ...targetParam }) }); const d = await res.json(); showToast(d.message ?? `LTQ ${lang.toUpperCase()} / ${region} ${register} gestart.`); } catch { showToast(`Kon LTQ ${lang}/${region}/${register} niet starten.`); } finally { setLtqCellLaunching(null); } };
  const launchScenAll = async () => { setScenLaunching("all"); try { const res = await adminFetch(`${API_BASE}/api/admin/scenarios/translate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...targetParam }) }); const d = await res.json(); showToast(d.message ?? "Scenario worker launched."); } catch { showToast("Failed to launch scenario worker."); } finally { setScenLaunching(null); } };
  const launchScenLang = async (lang: TransLang) => { setScenLaunching(lang); try { const res = await adminFetch(`${API_BASE}/api/admin/scenarios/translate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lang, ...targetParam }) }); const d = await res.json(); showToast(d.message ?? `Scenario [${lang}] launched.`); } catch { showToast(`Failed to launch scenario [${lang}].`); } finally { setScenLaunching(null); } };
  const launchCompassAll = async () => { setCompassLaunching("all"); try { const res = await adminFetch(`${API_BASE}/api/admin/compass/translate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...targetParam }) }); const d = await res.json(); showToast(d.message ?? "Compass worker launched."); } catch { showToast("Failed to launch compass worker."); } finally { setCompassLaunching(null); } };
  const launchCompassLang = async (lang: TransLang) => { setCompassLaunching(lang); try { const res = await adminFetch(`${API_BASE}/api/admin/compass/translate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lang, ...targetParam }) }); const d = await res.json(); showToast(d.message ?? `Compass [${lang}] launched.`); } catch { showToast(`Failed to launch compass [${lang}].`); } finally { setCompassLaunching(null); } };
  const launchSeedTransLang = async (lang: TransLang) => { setSeedTransLaunching(lang); try { const res = await adminFetch(`${API_BASE}/api/admin/counsel-seeds/translate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lang }) }); const d = await res.json(); showToast(d.message ?? `Vertaalworker voor Atelier-distillaten [${lang.toUpperCase()}] gestart.`); } catch { showToast(`Kon vertaalworker voor [${lang.toUpperCase()}] niet starten.`); } finally { setSeedTransLaunching(null); } };
  const launchSeedTransLangForce = async (lang: TransLang) => { setSeedTransLaunching(`force-${lang}`); try { const res = await adminFetch(`${API_BASE}/api/admin/counsel-seeds/translate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lang, force: true }) }); const d = await res.json(); showToast(d.message ?? `Hertaalworker (--force) voor Atelier-distillaten [${lang.toUpperCase()}] gestart.`); } catch { showToast(`Kon hertaalworker (--force) voor [${lang.toUpperCase()}] niet starten.`); } finally { setSeedTransLaunching(null); } };
  const launchSeedsAll = async () => { setSeedsLaunching("all"); try { const res = await adminFetch(`${API_BASE}/api/admin/counsel-seeds/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }); const d = await res.json(); showToast(d.message ?? "Counsel seed batch worker gestart."); } catch { showToast("Kon counsel seed worker niet starten."); } finally { setSeedsLaunching(null); } };
  const launchSeedsDomain = async (domain: string) => { setSeedsLaunching(domain); try { const res = await adminFetch(`${API_BASE}/api/admin/counsel-seeds/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain }) }); const d = await res.json(); showToast(d.message ?? `Counsel seed worker voor [${domain}] gestart.`); } catch { showToast(`Kon counsel seed worker voor [${domain}] niet starten.`); } finally { setSeedsLaunching(null); } };

  const activeSweepers = new Set(activeRuns.map((r) => r.sweeper));
  const allGreen = ltq && scen && compass && ltq.langs.every((l) => l.pct >= 100) && scen.langs.every((l) => l.pct >= 100) && compass.langs.every((l) => l.pct >= 100);
  const weekCost = weekCostUsd ?? 0;
  const ltqBacklog = ltq ? ltq.langs.reduce((s, l) => s + Math.max(0, ltq.en_total - l.count), 0) : 0;
  const scenBacklog = scen ? scen.langs.reduce((s, l) => s + Math.max(0, scen.total - l.count), 0) : 0;
  const compassBacklog = compass ? compass.langs.reduce((s, l) => s + Math.max(0, compass.total - l.count), 0) : 0;
  const backlogCost = ltqBacklog * 0.006 + scenBacklog * 0.005 + compassBacklog * 0.011;

  return (
    <div className="space-y-6">
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background text-xs font-mono px-4 py-2.5 rounded-sm shadow-lg animate-in slide-in-from-bottom-2 duration-200">{toast}</div>}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-serif text-foreground">{t("admin.trans.page_title")}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t("admin.trans.page_desc")}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground border border-border/60 rounded-sm px-2.5 py-1.5 bg-muted/20">
            <span className="text-foreground/60 uppercase tracking-wide">AI-kosten</span>
            <span className="text-foreground font-medium">${weekCost.toFixed(2)}<span className="text-muted-foreground font-normal"> / 7 dagen</span></span>
            {backlogCost > 0.01 && <><span className="text-border">·</span><span className="text-amber-700">~${backlogCost.toFixed(2)}<span className="text-muted-foreground font-normal"> achterstand</span></span></>}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono border border-border/60 rounded-sm px-2 py-1.5 bg-muted/20">
            <span className="text-foreground/60 uppercase tracking-wide">Omgeving</span>
            <select value={workerTarget} onChange={(e) => setWorkerTarget(e.target.value as "dev" | "prod")} className={`bg-transparent border-none outline-none font-mono text-[10px] cursor-pointer ${workerTarget === "prod" ? "text-rose-600 font-semibold" : "text-foreground"}`}>
              <option value="dev">dev</option>
              <option value="prod">prod</option>
            </select>
          </div>
          <Button size="sm" variant="outline" className="font-mono text-xs gap-1.5" onClick={fetchAll} disabled={loading}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}Refresh
          </Button>
        </div>
      </div>

      {(ltq || scen || compass) && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-sm text-xs font-mono border ${allGreen ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-700" : "border-amber-500/40 bg-amber-500/5 text-amber-700"}`}>
          {allGreen ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
          {allGreen ? t("admin.trans.all_done") : t("admin.trans.some_missing")}
        </div>
      )}

      {err && <Card className="border-destructive/40 bg-destructive/5"><CardContent className="py-3 text-xs font-mono text-destructive">{err}</CardContent></Card>}

      {ltq && (
        <>
          <CoverageCard title={t("admin.trans.ltq_title")} description={t("admin.trans.ltq_desc")} actionLabel={t("admin.trans.ltq_action")} total={ltq.en_total} langs={ltq.langs as LangCoverage[]} sweeper="ltq-translation" showRegisterBars costPerItem={0.006} itemsPerMinute={20} onTranslateAll={launchLtqAll} onTranslateLang={launchLtqLang} launching={ltqLaunching} activeSweepers={activeSweepers} />
          {ltq.region_register_grid && Object.keys(ltq.region_register_grid).length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2"><Grid2x2 className="w-4 h-4" /> {t("admin.trans.region_register_title")}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{t("admin.trans.region_register_desc")}</p>
              </CardHeader>
              <CardContent>
                <LtqRegisterGrid ltq={ltq} onTranslateLang={launchLtqLang} onTranslateRow={launchLtqRow} onTranslateCell={launchLtqCell} launching={ltqLaunching} rowLaunching={ltqRowLaunching} cellLaunching={ltqCellLaunching} activeSweepers={activeSweepers} />
              </CardContent>
            </Card>
          )}
        </>
      )}

      {scen && <CoverageCard title={t("admin.trans.scen_title")} description={t("admin.trans.scen_desc")} actionLabel={t("admin.trans.scen_action")} total={scen.total} langs={scen.langs as LangCoverage[]} sweeper="scenario-translation" costPerItem={0.005} itemsPerMinute={15} onTranslateAll={launchScenAll} onTranslateLang={launchScenLang} launching={scenLaunching} lastRun={scen.last_run ?? null} activeSweepers={activeSweepers} />}
      {compass && <CoverageCard title={t("admin.trans.compass_title")} description={t("admin.trans.compass_desc")} actionLabel={t("admin.trans.compass_action")} total={compass.total} langs={compass.langs as LangCoverage[]} sweeper="compass-content-translation" costPerItem={0.011} itemsPerMinute={3} onTranslateAll={launchCompassAll} onTranslateLang={launchCompassLang} launching={compassLaunching} lastRun={compass.last_run ?? null} activeSweepers={activeSweepers} />}
      {counselSeeds && <DomainCoverageCard data={counselSeeds} launching={seedsLaunching} onGenerateAll={launchSeedsAll} onGenerateDomain={launchSeedsDomain} />}
      {counselSeedTrans && <CoverageCard title={t("admin.trans.seed_trans_title")} description={t("admin.trans.seed_trans_desc")} actionLabel={t("admin.trans.seed_trans_action")} total={counselSeedTrans.total} langs={counselSeedTrans.langs as LangCoverage[]} sweeper="counsel-seed-translation" costPerItem={0.004} itemsPerMinute={15} onTranslateAll={async () => {}} onTranslateLang={launchSeedTransLang} onForceTranslateLang={launchSeedTransLangForce} launching={seedTransLaunching} lastRun={counselSeedTrans.last_run ?? null} hideAllButton activeSweepers={activeSweepers} />}
      {runs.length > 0 && <WorkerRunsLog runs={runs.filter((r) => r.sweeper.startsWith("ltq-translation") || r.sweeper.startsWith("scenario-translation") || r.sweeper.startsWith("compass-content-translation") || r.sweeper === "compass-translation" || r.sweeper.startsWith("counsel-seed"))} />}

      <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />≥85%</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />50–84%</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />&lt;50%</span>
        <span className="ml-auto">Auto-refresh every 30s</span>
      </div>
    </div>
  );
}
