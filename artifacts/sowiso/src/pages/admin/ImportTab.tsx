import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAdminFetch } from "@/lib/useAdminFetch";
import {
  Loader2, RefreshCw, FolderOpen, FileText, Upload, CheckCircle2,
  XCircle, Clock, AlertTriangle, ChevronDown, ChevronRight, FolderInput,
} from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ─── Types ────────────────────────────────────────────────────────────────────

interface DriveFile { id: string; name: string; mimeType: string; }
interface DriveFolder { folder_id: string; folder_name: string; files: DriveFile[]; }
interface TodoFilesResponse {
  folders:    DriveFolder[];
  root_files: DriveFile[];   // files placed directly in import/ root (no country subfolder)
}

interface ImportRun {
  id: number;
  file_id: string;
  file_name: string;
  status: "queued" | "parsing" | "inserting" | "done" | "error";
  inserted_count: number;
  skipped_count: number;
  error_count: number;
  errors_json: string[] | null;
  triggered_by: string | null;
  started_at: string;
  finished_at: string | null;
}

// ─── Status chip ──────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: ImportRun["status"] }) {
  const map: Record<ImportRun["status"], { label: string; className: string; icon: React.ReactNode }> = {
    queued:    { label: "Queued",    className: "text-muted-foreground border-border",         icon: <Clock className="w-3 h-3" /> },
    parsing:   { label: "Parsing",   className: "text-amber-600 border-amber-400/40",           icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    inserting: { label: "Inserting", className: "text-blue-600 border-blue-400/40",             icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    done:      { label: "Done",      className: "text-emerald-600 border-emerald-400/40",       icon: <CheckCircle2 className="w-3 h-3" /> },
    error:     { label: "Error",     className: "text-destructive border-destructive/40",       icon: <XCircle className="w-3 h-3" /> },
  };
  const { label, className, icon } = map[status] ?? map.error;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest border rounded-sm px-1.5 py-0.5 ${className}`}>
      {icon}{label}
    </span>
  );
}

// ─── Single run row ───────────────────────────────────────────────────────────

function RunRow({ run }: { run: ImportRun }) {
  const [open, setOpen] = useState(false);
  const hasErrors = (run.errors_json ?? []).length > 0;
  return (
    <div className="border border-border rounded-sm bg-card text-sm">
      <button
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <ChevronDown className="w-3 h-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 shrink-0 text-muted-foreground" />}
        <FileText className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
        <span className="flex-1 font-mono text-xs truncate text-foreground">{run.file_name}</span>
        {run.status === "done" && (
          <span className="text-xs font-mono text-muted-foreground shrink-0">
            +{run.inserted_count} <span className="text-muted-foreground/50">/ {run.skipped_count} dup</span>
          </span>
        )}
        <StatusChip status={run.status} />
        <span className="text-[10px] font-mono text-muted-foreground/60 shrink-0 hidden sm:block">
          {new Date(run.started_at).toLocaleString("nl-BE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
        </span>
      </button>
      {open && (
        <div className="border-t border-border px-4 py-3 space-y-2 text-xs font-mono">
          <div className="flex flex-wrap gap-4 text-muted-foreground">
            <span>Inserted: <strong className="text-foreground">{run.inserted_count}</strong></span>
            <span>Skipped (dup): <strong className="text-foreground">{run.skipped_count}</strong></span>
            <span>Warnings/errors: <strong className={run.error_count > 0 ? "text-amber-600" : "text-foreground"}>{run.error_count}</strong></span>
            {run.finished_at && (
              <span>Duration: <strong className="text-foreground">
                {Math.round((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000)}s
              </strong></span>
            )}
          </div>
          {hasErrors && (
            <div className="space-y-1 mt-2">
              <p className="text-muted-foreground uppercase tracking-widest text-[10px]">Messages ({(run.errors_json ?? []).length})</p>
              <div className="bg-muted/40 rounded-sm p-2 max-h-40 overflow-y-auto space-y-0.5">
                {(run.errors_json ?? []).map((e, i) => (
                  <p key={i} className="text-[10px] text-muted-foreground leading-relaxed">{e}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Active job poller ────────────────────────────────────────────────────────

function ActiveRunPoller({
  runId,
  onDone,
}: {
  runId: number;
  onDone: (run: ImportRun) => void;
}) {
  const adminFetch = useAdminFetch();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(async () => {
      try {
        const res = await adminFetch(`${API_BASE}/api/admin/import/runs/${runId}`);
        if (!res.ok) return;
        const run = await res.json() as ImportRun;
        if (run.status === "done" || run.status === "error") {
          if (timerRef.current) clearInterval(timerRef.current);
          onDone(run);
        }
      } catch { /* ignore */ }
    }, 2000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [runId, onDone, adminFetch]);

  return null;
}

// ─── Root files section (files dropped directly into import/ root) ────────────

const COUNTRY_CODES = [
  "BE", "NL", "DE", "FR", "GB", "US", "IT", "ES", "PT", "PL",
  "CZ", "SK", "HU", "RO", "AT", "CH", "LU", "DK", "SE", "FI",
  "NO", "IE", "GR", "HR", "SI", "LT", "LV", "EE", "BG",
];

function RootFilesSection({
  files,
  folders,
  onImportFile,
  activeRunIds,
}: {
  files:         DriveFile[];
  folders:       DriveFolder[];
  onImportFile:  (file: DriveFile, sourceFolderId: string) => void;
  activeRunIds:  Set<string>;
}) {
  // Per-file: which country folder the user selected
  const knownFolderNames = folders.map((f) => f.folder_name);
  const allCountries = Array.from(new Set([...knownFolderNames, ...COUNTRY_CODES])).sort();

  const [selectedCountry, setSelectedCountry] = useState<Record<string, string>>({});

  if (files.length === 0) return null;

  return (
    <div className="border border-amber-400/40 rounded-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-amber-400/10">
        <FolderInput className="w-4 h-4 text-amber-600" />
        <span className="font-mono text-sm font-medium text-amber-700">
          Losse bestanden in root
        </span>
        <span className="text-xs font-mono text-amber-600/70 ml-1">
          ({files.length} file{files.length !== 1 ? "s" : ""} — geen land-submap)
        </span>
      </div>
      <div className="divide-y divide-border/40">
        {files.map((file) => {
          const busy    = activeRunIds.has(file.id);
          const country = selectedCountry[file.id] ?? "";

          // Resolve folder ID: prefer a known Drive folder, else use root
          const matchedFolder = folders.find((f) => f.folder_name === country);
          const resolvedFolderId = matchedFolder?.folder_id ?? null;

          return (
            <div key={file.id} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-muted/10 transition-colors">
              <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="flex-1 min-w-0 text-sm font-mono truncate text-foreground">{file.name}</span>
              <select
                className="h-7 rounded-sm border border-border bg-background font-mono text-xs px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary shrink-0"
                value={country}
                onChange={(e) => setSelectedCountry((prev) => ({ ...prev, [file.id]: e.target.value }))}
                disabled={busy}
              >
                <option value="">— kies land —</option>
                {allCountries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <Button
                size="sm"
                variant="outline"
                className="font-mono text-xs h-7 shrink-0"
                onClick={() => onImportFile(file, resolvedFolderId ?? "")}
                disabled={busy || !country}
                title={!country ? "Kies eerst een land" : undefined}
              >
                {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
                {busy ? "Importing…" : "Import"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Folder section ───────────────────────────────────────────────────────────

function FolderSection({
  folder,
  onImportFile,
  onImportAll,
  activeRunIds,
}: {
  folder: DriveFolder;
  onImportFile: (file: DriveFile, sourceFolderId: string) => void;
  onImportAll:  (folder: DriveFolder) => void;
  activeRunIds: Set<string>;
}) {
  const [open, setOpen] = useState(true);
  const isEmpty = folder.files.length === 0;
  return (
    <div className="border border-border rounded-sm overflow-hidden">
      <div
        className="flex items-center gap-2 px-4 py-3 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        <FolderOpen className="w-4 h-4 text-primary/70" />
        <span className="font-mono text-sm font-medium text-foreground">{folder.folder_name}</span>
        <span className="text-xs font-mono text-muted-foreground ml-1">({folder.files.length} file{folder.files.length !== 1 ? "s" : ""})</span>
        <div className="ml-auto">
          {!isEmpty && (
            <Button
              size="sm"
              variant="outline"
              className="font-mono text-xs h-7"
              onClick={(e) => { e.stopPropagation(); onImportAll(folder); }}
              disabled={folder.files.some((f) => activeRunIds.has(f.id))}
            >
              <Upload className="w-3 h-3 mr-1" />
              Import all
            </Button>
          )}
        </div>
      </div>
      {open && (
        <div className="divide-y divide-border/40">
          {isEmpty && (
            <p className="px-4 py-3 text-xs text-muted-foreground font-mono italic">No files in to-do/</p>
          )}
          {folder.files.map((file) => {
            const busy = activeRunIds.has(file.id);
            return (
              <div key={file.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/10 transition-colors">
                <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="flex-1 text-sm font-mono truncate text-foreground">{file.name}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="font-mono text-xs h-7 shrink-0"
                  onClick={() => onImportFile(file, folder.folder_id)}
                  disabled={busy}
                >
                  {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
                  {busy ? "Importing…" : "Import"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main tab component ───────────────────────────────────────────────────────

export function ImportTab() {
  const adminFetch = useAdminFetch();

  // Drive files
  const [folders,      setFolders]      = useState<DriveFolder[]>([]);
  const [rootFiles,    setRootFiles]    = useState<DriveFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [filesError,   setFilesError]   = useState<string | null>(null);

  // Import runs log
  const [runs,      setRuns]      = useState<ImportRun[]>([]);
  const [runsLoading, setRunsLoading] = useState(true);

  // Active jobs: fileId → runId
  const [activeJobs, setActiveJobs] = useState<Map<string, number>>(new Map());

  // ── Loaders ────────────────────────────────────────────────────────────────

  const loadFiles = useCallback(async () => {
    setFilesLoading(true);
    setFilesError(null);
    try {
      const res = await adminFetch(`${API_BASE}/api/admin/import/todo-files`);
      if (!res.ok) { setFilesError(`Drive API error (HTTP ${res.status}).`); return; }
      const data = await res.json() as TodoFilesResponse;
      setFolders(data.folders ?? []);
      setRootFiles(data.root_files ?? []);
    } catch (err) {
      setFilesError(`Network error: ${String(err)}`);
    } finally {
      setFilesLoading(false);
    }
  }, [adminFetch]);

  const loadRuns = useCallback(async () => {
    setRunsLoading(true);
    try {
      const res = await adminFetch(`${API_BASE}/api/admin/import/runs`);
      if (res.ok) setRuns(await res.json() as ImportRun[]);
    } finally {
      setRunsLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => { loadFiles(); loadRuns(); }, [loadFiles, loadRuns]);

  // ── Import trigger ─────────────────────────────────────────────────────────

  const triggerImport = useCallback(async (file: DriveFile, sourceFolderId: string) => {
    try {
      const res = await adminFetch(`${API_BASE}/api/admin/import/ltq`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_id: file.id, file_name: file.name, source_folder_id: sourceFolderId }),
      });
      if (!res.ok) { alert(`Import failed (HTTP ${res.status}).`); return; }
      const { run_id } = await res.json() as { run_id: number };
      setActiveJobs((prev) => new Map(prev).set(file.id, run_id));
      // Optimistic: add queued run to top of log
      setRuns((prev) => [{
        id: run_id, file_id: file.id, file_name: file.name,
        status: "queued", inserted_count: 0, skipped_count: 0,
        error_count: 0, errors_json: [], triggered_by: null,
        started_at: new Date().toISOString(), finished_at: null,
      }, ...prev]);
    } catch (err) {
      alert(`Network error: ${String(err)}`);
    }
  }, [adminFetch]);

  const triggerImportAll = useCallback(async (folder: DriveFolder) => {
    for (const file of folder.files) {
      await triggerImport(file, folder.folder_id);
    }
  }, [triggerImport]);

  const triggerImportAllFolders = useCallback(async () => {
    for (const folder of folders) {
      for (const file of folder.files) {
        await triggerImport(file, folder.folder_id);
      }
    }
  }, [folders, triggerImport]);

  // ── Job completion callback ────────────────────────────────────────────────

  const handleJobDone = useCallback((fileId: string, run: ImportRun) => {
    setActiveJobs((prev) => { const m = new Map(prev); m.delete(fileId); return m; });
    setRuns((prev) => prev.map((r) => r.id === run.id ? run : r));
    // Remove the file from both the folder list and the root files (it's been moved to done/)
    if (run.status === "done") {
      setFolders((prev) =>
        prev.map((f) => ({ ...f, files: f.files.filter((fi) => fi.id !== fileId) }))
      );
      setRootFiles((prev) => prev.filter((fi) => fi.id !== fileId));
    }
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  const activeRunIds = new Set(activeJobs.keys());
  const activeRunEntries = Array.from(activeJobs.entries());

  return (
    <div className="space-y-8">

      {/* Pollers for active jobs */}
      {activeRunEntries.map(([fileId, runId]) => (
        <ActiveRunPoller key={runId} runId={runId} onDone={(run) => handleJobDone(fileId, run)} />
      ))}

      {/* ── Drive to-do files ─────────────────────────────────────────────── */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Google Drive — to-do/
            </CardTitle>
            <div className="flex items-center gap-2 shrink-0">
              {!filesLoading && !filesError && folders.some((f) => f.files.length > 0) && (
                <Button
                  size="sm" variant="outline"
                  className="font-mono text-xs h-7"
                  onClick={triggerImportAllFolders}
                  disabled={activeRunIds.size > 0}
                >
                  <Upload className="w-3 h-3 mr-1" />
                  Import all countries
                </Button>
              )}
              <Button
                size="sm" variant="ghost"
                className="font-mono text-xs text-muted-foreground h-7"
                onClick={loadFiles}
                disabled={filesLoading}
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${filesLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {filesLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              Fetching Drive files…
            </div>
          )}
          {!filesLoading && filesError && (
            <div className="flex items-start gap-2 text-sm text-destructive py-4">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{filesError}</span>
            </div>
          )}
          {!filesLoading && !filesError && folders.length === 0 && (
            <p className="text-sm text-muted-foreground font-mono italic py-4 text-center">
              No country subfolders found in to-do/.
            </p>
          )}
          {!filesLoading && !filesError && rootFiles.length > 0 && (
            <RootFilesSection
              files={rootFiles}
              folders={folders}
              onImportFile={triggerImport}
              activeRunIds={activeRunIds}
            />
          )}
          {!filesLoading && !filesError && folders.map((folder) => (
            <FolderSection
              key={folder.folder_id}
              folder={folder}
              onImportFile={triggerImport}
              onImportAll={triggerImportAll}
              activeRunIds={activeRunIds}
            />
          ))}
        </CardContent>
      </Card>

      {/* ── Import run log ────────────────────────────────────────────────── */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Import log (last 50)
            </CardTitle>
            <Button
              size="sm" variant="ghost"
              className="font-mono text-xs text-muted-foreground"
              onClick={loadRuns}
              disabled={runsLoading}
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${runsLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {runsLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading runs…
            </div>
          )}
          {!runsLoading && runs.length === 0 && (
            <p className="text-sm text-muted-foreground font-mono italic py-4 text-center">
              No import runs yet.
            </p>
          )}
          {runs.map((run) => <RunRow key={run.id} run={run} />)}
        </CardContent>
      </Card>

    </div>
  );
}
