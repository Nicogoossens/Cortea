import { useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminFetch } from "@/lib/useAdminFetch";
import { Loader2, RefreshCw, Database, Upload, Trash2, CheckCircle2, XCircle } from "lucide-react";
import type { ContentStatus, ActionState } from "./types";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const SCENARIO_LANGS = ["nl", "fr", "de", "es", "pt", "it", "ar", "ja", "zh"] as const;
const LANG_LABELS: Record<string, string> = {
  nl: "Nederlands", fr: "Français", de: "Deutsch", es: "Español",
  pt: "Português", it: "Italiano", ar: "العربية", ja: "日本語", zh: "中文",
};

type ClearableTable = "compass_regions" | "scenarios" | "culture_protocols" | "learning_track_questions";

interface CompassDriveImportResult {
  ok: boolean; sources: string[]; parsed_countries: number; imported_new: number;
  updated_existing: number; skipped_unknown: number; skipped: string[];
  parse_errors: string[]; upsert_errors: string[]; fetch_errors: string[];
  published_count_after: number; merge_safe: boolean; error?: string;
}

function CompassDriveImportCard() {
  const adminFetch = useAdminFetch();
  const [fileIds, setFileIds] = useState("");
  const [forceOverwrite, setForceOverwrite] = useState(false);
  const [state, setState] = useState<ActionState>("idle");
  const [result, setResult] = useState<CompassDriveImportResult | null>(null);

  async function handleImport() {
    setState("loading");
    setResult(null);
    const ids = fileIds.trim().split(/[\s,]+/).filter(Boolean);
    try {
      const res = await adminFetch(`${API_BASE}/api/admin/content/import-compass-from-drive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(ids.length > 0 ? { file_ids: ids } : {}), force_overwrite: forceOverwrite }),
      });
      const data = await res.json() as CompassDriveImportResult;
      setResult(data);
      setState(res.ok && data.ok ? "done" : "error");
    } catch (err) {
      setResult({ ok: false, error: String(err), sources: [], parsed_countries: 0, imported_new: 0, updated_existing: 0, skipped_unknown: 0, skipped: [], parse_errors: [], upsert_errors: [], fetch_errors: [], published_count_after: 0, merge_safe: true });
      setState("error");
    }
    setTimeout(() => setState("idle"), 8000);
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Compass Import — Google Drive / Lokale bestanden
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground font-light">
          Parseert de Compass-database MD-bestanden en importeert elk land in{" "}
          <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">compass_regions</span>.{" "}
          <strong>Merge-safe</strong>: bestaande vertalingen (nl, fr, de…) worden bewaard — alleen de{" "}
          <span className="font-mono text-xs">en-GB</span>-sleutel wordt bijgewerkt.{" "}
          Zonder Drive-bestands-IDs worden alle lokale{" "}
          <span className="font-mono text-xs">attached_assets/Compas_database*.md</span>-bestanden gebruikt.
        </p>
        <div className="space-y-2">
          <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            Google Drive-bestands-IDs (optioneel, één per regel of kommagescheiden)
          </label>
          <textarea
            value={fileIds}
            onChange={(e) => setFileIds(e.target.value)}
            placeholder={"1abc...DriveID\n1def...DriveID"}
            rows={3}
            className="w-full px-3 py-2 rounded-sm border border-border bg-muted/30 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          />
          <p className="text-xs text-muted-foreground font-light">
            Voor Drive-import: stel <span className="font-mono">GOOGLE_ACCESS_TOKEN</span> in via Secrets. Laat leeg om lokale bestanden te gebruiken.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="force-overwrite" checked={forceOverwrite} onChange={(e) => setForceOverwrite(e.target.checked)} className="w-3.5 h-3.5" />
          <label htmlFor="force-overwrite" className="text-xs font-mono text-muted-foreground cursor-pointer">
            Force overwrite (verwijdert bestaande vertalingen — gebruik alleen na een clear)
          </label>
        </div>
        <Button size="sm" className="font-mono text-xs gap-1.5" disabled={state === "loading"} onClick={handleImport}>
          {state === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : state === "done" ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            : state === "error" ? <XCircle className="w-3.5 h-3.5 text-red-500" />
            : <Upload className="w-3.5 h-3.5" />}
          {state === "loading" ? "Importeren…" : fileIds.trim() ? "Importeer van Drive" : "Importeer lokale MD-bestanden"}
        </Button>
        {result && (
          <div className={`text-xs font-mono p-4 rounded-sm border space-y-2 ${result.ok ? "bg-green-50 border-green-200 text-green-900" : "bg-red-50 border-red-200 text-red-900"}`}>
            {result.error && <p className="font-medium">✗ {result.error}</p>}
            {result.ok && (
              <>
                <p className="font-medium">✓ Import voltooid</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-green-800">
                  <span>Bronnen: {result.sources.join(", ")}</span>
                  <span>Geparseerd: {result.parsed_countries} landen</span>
                  <span>Nieuw ingevoegd: {result.imported_new}</span>
                  <span>Bestaand bijgewerkt: {result.updated_existing}</span>
                  <span>Onbekend (overgeslagen): {result.skipped_unknown}</span>
                  <span className="font-semibold">Gepubliceerd totaal: {result.published_count_after}</span>
                </div>
                {result.merge_safe && <p className="text-green-700 font-light">✓ Merge-safe: bestaande vertalingen bewaard</p>}
              </>
            )}
            {result.fetch_errors.length > 0 && (
              <div className="mt-2"><p className="font-medium text-amber-800">Drive-fouten ({result.fetch_errors.length}):</p>
                <ul className="list-disc list-inside space-y-0.5 text-amber-700">{result.fetch_errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
              </div>
            )}
            {result.parse_errors.length > 0 && (
              <div className="mt-2"><p className="font-medium text-amber-800">Parse-fouten ({result.parse_errors.length}):</p>
                <ul className="list-disc list-inside space-y-0.5 text-amber-700">{result.parse_errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}</ul>
              </div>
            )}
            {result.upsert_errors.length > 0 && (
              <div className="mt-2"><p className="font-medium text-red-700">DB-fouten ({result.upsert_errors.length}):</p>
                <ul className="list-disc list-inside space-y-0.5">{result.upsert_errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}</ul>
              </div>
            )}
            {result.skipped.length > 0 && (
              <details className="mt-1">
                <summary className="cursor-pointer text-muted-foreground">Overgeslagen ({result.skipped.length})</summary>
                <p className="mt-1 text-muted-foreground">{result.skipped.join(", ")}</p>
              </details>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CompassRegionRow {
  region_code: string; flag_emoji: string; is_published: boolean; locale_count: number; completeness: number;
}

function CompassRegionsDataScore() {
  const adminFetch = useAdminFetch();
  const [rows, setRows] = useState<CompassRegionRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "published" | "stub">("all");

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch(`${API_BASE}/api/admin/compass-regions`);
      if (res.ok) setRows(await res.json() as CompassRegionRow[]);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  async function togglePublished(row: CompassRegionRow) {
    setPendingCode(row.region_code);
    try {
      const res = await adminFetch(`${API_BASE}/api/admin/compass-regions/${row.region_code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: !row.is_published }),
      });
      if (res.ok) setRows((prev) => prev?.map((r) => r.region_code === row.region_code ? { ...r, is_published: !row.is_published } : r) ?? null);
    } finally { setPendingCode(null); }
  }

  const filtered = (rows ?? []).filter((r) => filter === "all" ? true : filter === "published" ? r.is_published : !r.is_published);
  const publishedCount = (rows ?? []).filter((r) => r.is_published).length;
  const totalCount = rows?.length ?? 0;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2"><Database className="w-4 h-4" />Compass Regions — Data Score</span>
          <Button variant="outline" size="sm" className="font-mono text-xs gap-1.5" onClick={fetchRows} disabled={loading}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 items-center text-xs font-mono">
          <span className="text-muted-foreground">{publishedCount}/{totalCount} published</span>
          <div className="flex gap-1 ml-auto">
            {(["all", "published", "stub"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-sm border text-xs font-mono uppercase tracking-widest ${filter === f ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 border-border text-muted-foreground hover:bg-muted"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        {loading && !rows ? (
          <div className="space-y-2">{[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-9 rounded-sm" />)}</div>
        ) : (
          <div className="overflow-auto max-h-[480px] border border-border/50 rounded-sm">
            <table className="w-full text-xs font-mono">
              <thead className="bg-muted/40 sticky top-0">
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium text-muted-foreground/80">Flag</th>
                  <th className="px-3 py-2 font-medium text-muted-foreground/80">Code</th>
                  <th className="px-3 py-2 font-medium text-muted-foreground/80">Published</th>
                  <th className="px-3 py-2 font-medium text-muted-foreground/80">Locales</th>
                  <th className="px-3 py-2 font-medium text-muted-foreground/80">Completeness</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.region_code} className="border-t border-border/40 hover:bg-muted/20">
                    <td className="px-3 py-2 text-base leading-none">{row.flag_emoji}</td>
                    <td className="px-3 py-2 text-foreground/90">{row.region_code}</td>
                    <td className="px-3 py-2">
                      <button onClick={() => togglePublished(row)} disabled={pendingCode === row.region_code}
                        className={`px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-widest border ${row.is_published ? "bg-green-50 border-green-300 text-green-800" : "bg-muted border-border text-muted-foreground"} ${pendingCode === row.region_code ? "opacity-50" : "hover:opacity-80 cursor-pointer"}`}>
                        {pendingCode === row.region_code ? "…" : row.is_published ? "Published" : "Stub"}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{row.locale_count}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${row.completeness === 100 ? "bg-green-500" : row.completeness > 0 ? "bg-amber-400" : "bg-muted-foreground/20"}`} style={{ width: `${row.completeness}%` }} />
                        </div>
                        <span className="text-muted-foreground tabular-nums">{row.completeness}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground/60">No regions match this filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ContentTab({ authHeaders }: { authHeaders: Record<string, string> }) {
  const adminFetch = useAdminFetch();
  const [status, setStatus] = useState<ContentStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [seedState, setSeedState] = useState<ActionState>("idle");
  const [seedOutput, setSeedOutput] = useState<string[]>([]);
  const [granularSeedState, setGranularSeedState] = useState<Record<string, ActionState>>({});
  const [granularSeedOutput, setGranularSeedOutput] = useState<string[]>([]);
  const [clearTable, setClearTable] = useState<ClearableTable | null>(null);
  const [clearConfirmText, setClearConfirmText] = useState("");
  const [clearState, setClearState] = useState<ActionState>("idle");
  const [clearResult, setClearResult] = useState<string | null>(null);
  const [importState, setImportState] = useState<ActionState>("idle");
  const [importResult, setImportResult] = useState<{ inserted: number; errors_count: number; errors: string[]; translation_queued?: boolean; translation_scenario_ids?: number[]; translation_note?: string } | null>(null);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mdImportState, setMdImportState] = useState<ActionState>("idle");
  const [mdImportResult, setMdImportResult] = useState<{ parsed: number; inserted: number; skipped: number; errors_count: number; errors: string[] } | null>(null);
  const mdFileRef = useRef<HTMLInputElement>(null);

  const fetchStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const res = await adminFetch(`${API_BASE}/api/admin/content/status`);
      if (res.ok) setStatus(await res.json() as ContentStatus);
    } catch { } finally { setLoadingStatus(false); }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  async function handleSeed() {
    setSeedState("loading"); setSeedOutput([]);
    try {
      const res = await adminFetch(`${API_BASE}/api/admin/content/seed`, { method: "POST" });
      const data = await res.json() as { ok: boolean; results: string[] };
      setSeedOutput(data.results ?? []);
      setSeedState(data.ok ? "done" : "error");
      if (data.ok) fetchStatus();
    } catch (err) { setSeedOutput([String(err)]); setSeedState("error"); }
    setTimeout(() => setSeedState("idle"), 5000);
  }

  async function handleGranularSeed(section: string) {
    setGranularSeedState(s => ({ ...s, [section]: "loading" })); setGranularSeedOutput([]);
    try {
      const res = await adminFetch(`${API_BASE}/api/admin/content/seed/${section}`, { method: "POST" });
      const data = await res.json() as { ok: boolean; results: string[] };
      setGranularSeedOutput(data.results ?? []);
      setGranularSeedState(s => ({ ...s, [section]: data.ok ? "done" : "error" }));
      if (data.ok) fetchStatus();
    } catch (err) { setGranularSeedOutput([String(err)]); setGranularSeedState(s => ({ ...s, [section]: "error" })); }
    setTimeout(() => setGranularSeedState(s => ({ ...s, [section]: "idle" })), 5000);
  }

  async function handleClearTable() {
    if (!clearTable || clearConfirmText !== "CLEAR") return;
    setClearState("loading"); setClearResult(null);
    try {
      const res = await adminFetch(`${API_BASE}/api/admin/content/clear`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: clearTable, confirm: "CLEAR" }),
      });
      const data = await res.json() as { ok: boolean; table: string; deleted: number; error?: string };
      if (res.ok && data.ok) { setClearResult(`✓ ${data.deleted} rijen gewist uit ${data.table}`); setClearState("done"); fetchStatus(); }
      else { setClearResult(`✗ ${data.error ?? "Onbekende fout"}`); setClearState("error"); }
    } catch (err) { setClearResult(`✗ ${String(err)}`); setClearState("error"); }
    setClearTable(null); setClearConfirmText("");
    setTimeout(() => { setClearState("idle"); setClearResult(null); }, 6000);
  }

  async function handleImport(type: "scenarios" | "compass_regions" | "learning_tracks") {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setImportState("loading"); setImportResult(null); setImportProgress(null);
    try {
      const text = await file.text();
      const items = JSON.parse(text) as unknown[];
      const CHUNK_SIZE = 500;
      const chunks: unknown[][] = [];
      for (let i = 0; i < items.length; i += CHUNK_SIZE) chunks.push(items.slice(i, i + CHUNK_SIZE));
      let totalInserted = 0, totalErrors = 0;
      const allErrors: string[] = [];
      let lastData: { inserted: number; errors_count: number; errors: string[]; translation_queued?: boolean; translation_scenario_ids?: number[]; translation_note?: string } | null = null;
      for (let c = 0; c < chunks.length; c++) {
        setImportProgress({ current: c + 1, total: chunks.length });
        const res = await adminFetch(`${API_BASE}/api/admin/content/import`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, items: chunks[c] }),
        });
        const data = await res.json() as { inserted: number; errors_count: number; errors: string[]; translation_queued?: boolean; translation_scenario_ids?: number[]; translation_note?: string };
        totalInserted += data.inserted ?? 0; totalErrors += data.errors_count ?? 0;
        allErrors.push(...(data.errors ?? [])); lastData = data;
        if (!res.ok) { setImportResult({ inserted: totalInserted, errors_count: totalErrors, errors: allErrors.slice(0, 20) }); setImportState("error"); setImportProgress(null); return; }
      }
      setImportResult({ inserted: totalInserted, errors_count: totalErrors, errors: allErrors.slice(0, 20), translation_queued: lastData?.translation_queued, translation_scenario_ids: lastData?.translation_scenario_ids, translation_note: lastData?.translation_note });
      setImportState("done"); setImportProgress(null); fetchStatus();
    } catch (err) { setImportResult({ inserted: 0, errors_count: 1, errors: [String(err)] }); setImportState("error"); setImportProgress(null); }
  }

  async function handleMdImport() {
    const file = mdFileRef.current?.files?.[0];
    if (!file) return;
    setMdImportState("loading"); setMdImportResult(null);
    try {
      const content = await file.text();
      const res = await adminFetch(`${API_BASE}/api/admin/content/import-learning-tracks-md`, {
        method: "POST", headers: { "Content-Type": "text/plain" }, body: content,
      });
      const data = await res.json() as { parsed: number; inserted: number; skipped: number; errors_count: number; errors: string[] };
      setMdImportResult(data); setMdImportState(res.ok ? "done" : "error");
    } catch (err) { setMdImportResult({ parsed: 0, inserted: 0, skipped: 0, errors_count: 1, errors: [String(err)] }); setMdImportState("error"); }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif text-foreground">Content Status</h2>
          <Button variant="outline" size="sm" className="font-mono text-xs gap-1.5" onClick={fetchStatus} disabled={loadingStatus}>
            {loadingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}Refresh
          </Button>
        </div>
        {loadingStatus && !status ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-sm" />)}</div>
        ) : status ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[{ label: "Scenarios", value: status.scenarios }, { label: "Culture Protocols", value: status.culture_protocols }, { label: "Compass Regions", value: status.compass_regions }].map(({ label, value }) => (
                <Card key={label} className="bg-card border-border">
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/70">{label}</p>
                    <p className="text-2xl font-serif text-foreground mt-1">{value}</p>
                  </CardContent>
                </Card>
              ))}
              <Card className="bg-card border-border col-span-2 md:col-span-3">
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/70">Learning Track Questions</p>
                  <p className="text-2xl font-serif text-foreground mt-1">{status.learning_track_questions.toLocaleString()}</p>
                  {Object.keys(status.learning_track_questions_by_region).length > 0 && (
                    <p className="text-xs font-mono text-muted-foreground mt-1.5">
                      {Object.entries(status.learning_track_questions_by_region).map(([region, n]) => `${region}: ${n.toLocaleString()}`).join(" · ")}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70">Scenario Translation Coverage ({status.total_scenarios} total)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {SCENARIO_LANGS.map(lang => {
                    const covered = status.scenario_translation_coverage[lang] ?? 0;
                    const pct = status.total_scenarios > 0 ? Math.round((covered / status.total_scenarios) * 100) : 0;
                    return (
                      <div key={lang} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-mono text-foreground/80">{LANG_LABELS[lang]}</span>
                          <span className={`font-mono ${pct === 100 ? "text-green-600" : pct > 0 ? "text-amber-600" : "text-muted-foreground/40"}`}>{covered}/{status.total_scenarios}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${pct === 100 ? "bg-green-500" : pct > 0 ? "bg-amber-400" : "bg-muted-foreground/20"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70">UI Translations (keys per language)</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(status.translations).sort().map(([lang, n]) => (
                    <span key={lang} className="px-2 py-1 rounded-sm bg-muted text-xs font-mono">{lang}: {n}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
            <Database className="w-4 h-4" />Seed Base Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground font-light">Runs seed scripts. Existing data is preserved — seeds are idempotent. Use <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">Seed All</span> for a full run, or seed individual sections below.</p>
          <div className="flex flex-wrap gap-2 items-center">
            <Button className="font-serif gap-2" disabled={seedState === "loading"} onClick={handleSeed}>
              {seedState === "loading" ? <><Loader2 className="w-4 h-4 animate-spin" /> Seeding all…</>
                : seedState === "done" ? <><CheckCircle2 className="w-4 h-4" /> Seed Complete</>
                : seedState === "error" ? <><XCircle className="w-4 h-4" /> Seed Failed</>
                : <>Seed All</>}
            </Button>
            <span className="text-xs text-muted-foreground font-mono">Atelier + Compass + Vertalingen + Admin</span>
          </div>
          <div className="border border-border/50 rounded-sm p-4 space-y-3">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/60">Per sectie seeden</p>
            <div className="flex flex-wrap gap-2">
              {([
                { key: "atelier",       label: "Atelier (counsel seeds)" },
                { key: "compass",       label: "Compass (regios)"         },
                { key: "translations",  label: "UI-vertalingen"           },
                { key: "admin-account", label: "Admin-account"            },
              ] as const).map(({ key, label }) => {
                const s = granularSeedState[key] ?? "idle";
                return (
                  <Button key={key} size="sm" variant="outline" className="font-mono text-xs gap-1.5" disabled={s === "loading"} onClick={() => handleGranularSeed(key)}>
                    {s === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : s === "done" ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : s === "error" ? <XCircle className="w-3.5 h-3.5 text-red-500" /> : <Database className="w-3.5 h-3.5" />}
                    {label}
                  </Button>
                );
              })}
            </div>
            {granularSeedOutput.length > 0 && (
              <pre className="text-xs font-mono bg-muted/40 border border-border/50 rounded-sm p-3 overflow-auto max-h-32 whitespace-pre-wrap">{granularSeedOutput.join("\n\n")}</pre>
            )}
          </div>
          {seedOutput.length > 0 && (
            <pre className="text-xs font-mono bg-muted/40 border border-border/50 rounded-sm p-3 overflow-auto max-h-48 whitespace-pre-wrap">{seedOutput.join("\n\n")}</pre>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-red-200">
        <CardHeader>
          <CardTitle className="text-sm font-mono uppercase tracking-widest text-red-600/80 flex items-center gap-2"><Trash2 className="w-4 h-4" />Tabel wissen (dev only)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground font-light">Wis een volledige content-tabel in dev — zodat je daarna verse data kunt importeren. <span className="text-red-600 font-medium">Niet beschikbaar in productie.</span></p>
          {clearResult && (
            <div className={`text-xs font-mono p-3 rounded-sm border ${clearState === "done" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>{clearResult}</div>
          )}
          <div className="flex flex-wrap gap-2">
            {(["compass_regions", "scenarios", "culture_protocols", "learning_track_questions"] as ClearableTable[]).map((tbl) => (
              <Button key={tbl} size="sm" variant="outline" className="font-mono text-xs border-red-300 text-red-700 hover:bg-red-50 gap-1.5" disabled={clearState === "loading"} onClick={() => { setClearTable(tbl); setClearConfirmText(""); }}>
                <Trash2 className="w-3.5 h-3.5" />{tbl}
              </Button>
            ))}
          </div>
          {clearTable && (
            <div className="border border-red-300 bg-red-50 rounded-sm p-4 space-y-3">
              <p className="text-sm font-mono text-red-800">Je staat op het punt <strong>{clearTable}</strong> volledig te wissen. Type <span className="bg-red-200 px-1 rounded font-bold">CLEAR</span> ter bevestiging.</p>
              <div className="flex gap-2 items-center">
                <input type="text" value={clearConfirmText} onChange={(e) => setClearConfirmText(e.target.value)} placeholder="Type CLEAR" className="px-3 py-1.5 rounded-sm border border-red-300 bg-white text-sm font-mono w-36 focus:outline-none focus:ring-1 focus:ring-red-400" />
                <Button size="sm" variant="outline" className="border-red-500 bg-red-600 text-white hover:bg-red-700 font-mono text-xs gap-1.5" disabled={clearConfirmText !== "CLEAR" || clearState === "loading"} onClick={handleClearTable}>
                  {clearState === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}Wis {clearTable}
                </Button>
                <Button size="sm" variant="outline" className="font-mono text-xs" onClick={() => { setClearTable(null); setClearConfirmText(""); }}>Annuleer</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CompassDriveImportCard />

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2"><Upload className="w-4 h-4" />Bulk Import (JSON)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground font-light">Upload a JSON array of scenario or compass region objects. Scenarios are inserted as new rows; compass regions are upserted by region_code. New scenarios are automatically translated into 9 languages in the background after import.</p>
          <div className="flex flex-wrap gap-3 items-start">
            <div className="flex flex-col gap-2 flex-1 min-w-48">
              <input ref={fileRef} type="file" accept=".json" className="text-xs text-muted-foreground font-mono file:mr-3 file:px-3 file:py-1.5 file:rounded-sm file:border file:border-border/60 file:bg-muted file:text-xs file:font-mono file:text-foreground hover:file:bg-muted/70 cursor-pointer" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="font-mono text-xs" disabled={importState === "loading"} onClick={() => handleImport("scenarios")}>
                {importState === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Import Scenarios"}
              </Button>
              <Button size="sm" variant="outline" className="font-mono text-xs" disabled={importState === "loading"} onClick={() => handleImport("compass_regions")}>
                {importState === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Import Compass Regions"}
              </Button>
            </div>
          </div>
          {importProgress && <p className="text-xs font-mono text-muted-foreground">Uploading chunk {importProgress.current} / {importProgress.total}…</p>}
          {importResult && (
            <div className="space-y-2">
              <div className={`text-xs font-mono p-3 rounded-sm border ${importState === "done" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                <p>{importResult.inserted} item(s) imported. {importResult.errors_count} error(s).</p>
                {importResult.errors.length > 0 && <ul className="mt-2 space-y-1 list-disc list-inside">{importResult.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
              </div>
              {importResult.translation_queued && (
                <div className="text-xs font-mono p-3 rounded-sm border bg-blue-50 border-blue-200 text-blue-800">
                  <p className="font-medium">🌐 Translation worker started</p>
                  <p className="mt-1 text-blue-700 font-light">{importResult.translation_note}</p>
                  <p className="mt-1 text-blue-600">Scenario IDs: {importResult.translation_scenario_ids?.join(", ")}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2"><Upload className="w-4 h-4" />Import Learning Tracks (MD)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground font-light">Upload a canonical <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">.md</span> file (one file per pillar). The file is parsed server-side and questions are inserted directly — no JSON conversion needed. Duplicate questions are silently skipped.</p>
          <div className="flex flex-wrap gap-3 items-center">
            <input ref={mdFileRef} type="file" accept=".md,.txt" className="text-xs text-muted-foreground font-mono file:mr-3 file:px-3 file:py-1.5 file:rounded-sm file:border file:border-border/60 file:bg-muted file:text-xs file:font-mono file:text-foreground hover:file:bg-muted/70 cursor-pointer flex-1 min-w-48" />
            <Button size="sm" variant="outline" className="font-mono text-xs" disabled={mdImportState === "loading"} onClick={handleMdImport}>
              {mdImportState === "loading" ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Importing…</>
                : mdImportState === "done" ? <><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Done</>
                : mdImportState === "error" ? <><XCircle className="w-3.5 h-3.5 mr-1" /> Failed</>
                : "Import Learning Tracks (MD)"}
            </Button>
          </div>
          {mdImportResult && (
            <div className={`text-xs font-mono p-3 rounded-sm border space-y-1 ${mdImportState === "done" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
              <p>Parsed: <strong>{mdImportResult.parsed}</strong> — Inserted: <strong>{mdImportResult.inserted}</strong> — Skipped: <strong>{mdImportResult.skipped}</strong> — Errors: <strong>{mdImportResult.errors_count}</strong></p>
              {mdImportResult.errors.length > 0 && <ul className="mt-2 space-y-1 list-disc list-inside">{mdImportResult.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
            </div>
          )}
        </CardContent>
      </Card>

      <CompassRegionsDataScore />
    </div>
  );
}
