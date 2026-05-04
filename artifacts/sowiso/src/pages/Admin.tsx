import { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import {
  Search, Lock, CheckCircle2, XCircle, Shield, User, ChevronDown, ChevronUp,
  BadgeCheck, Ban, Loader2, Database, Upload, RefreshCw, Users, Trash2, AlertTriangle,
  BookOpen, Cpu, Save, ClipboardList, ThumbsUp, KeyRound, Copy, Check, Plus, Pencil, X,
  Briefcase, BarChart3, Tag, Languages, Vote, Mail, ArrowRight, TrendingUp,
  Clock, Play, Grid2x2,
} from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string;
  full_name: string | null;
  email: string | null;
  email_verified: boolean;
  subscription_tier: string;
  subscription_status: string;
  noble_score: number;
  is_admin: boolean;
  suspended_at: string | null;
  created_at: string;
  language_code: string;
  country_of_origin: string | null;
  active_region: string | null;
  onboarding_completed: boolean;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
}

function maskEmail(email: string | null): string {
  if (!email) return "—";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

interface ContentStatus {
  scenarios: number;
  culture_protocols: number;
  compass_regions: number;
  learning_track_questions: number;
  learning_track_questions_by_region: Record<string, number>;
  translations: Record<string, number>;
  scenario_translation_coverage: Record<string, number>;
  total_scenarios: number;
}

type ActionState = "idle" | "loading" | "done" | "error";
type AdminTab = "users" | "content" | "cc_screening" | "integrations" | "use_cases" | "attribution" | "onboarding" | "translation" | "counsel_seeds" | "votes";

interface CounselSeedRow {
  id: number;
  region_code: string;
  domain: string;
  status: string;
  eval_score: number | null;
  eval_notes: string | null;
  seeded_at: string;
  reviewed_at: string | null;
  promoted_at: string | null;
  content: Record<string, unknown>;
}

interface UseCase {
  id: number;
  slug: string;
  title: string;
  region_code: string;
  flag_emoji: string;
  formality_level: string;
  domain_tags: string[];
  pillar_weights: Record<string, number>;
  description: string;
  cover_context: string;
  primary_tool: string;
}

const EMPTY_USE_CASE: Omit<UseCase, "id"> = {
  slug: "",
  title: "",
  region_code: "",
  flag_emoji: "🌍",
  formality_level: "formal",
  domain_tags: [],
  pillar_weights: {},
  description: "",
  cover_context: "",
  primary_tool: "atelier",
};

// ── Small components ──────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    guest: "bg-muted text-muted-foreground",
    traveller: "bg-blue-100 text-blue-700",
    ambassador: "bg-amber-100 text-amber-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase tracking-widest ${colors[tier] ?? colors.guest}`}>
      {tier}
    </span>
  );
}

// ── User row ──────────────────────────────────────────────────────────────────

function UserRow({ user, authHeaders, onUpdated, onDeleted }: {
  user: AdminUser;
  authHeaders: Record<string, string>;
  onUpdated: (updated: AdminUser) => void;
  onDeleted: (id: string) => void;
}) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [tierValue, setTierValue] = useState(user.subscription_tier);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteState, setDeleteState] = useState<ActionState>("idle");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);

  const isSuspended = !!user.suspended_at;

  async function deleteUser() {
    setDeleteState("loading");
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${user.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        onDeleted(user.id);
      } else {
        setDeleteState("error");
        setTimeout(() => setDeleteState("idle"), 2000);
      }
    } catch {
      setDeleteState("error");
      setTimeout(() => setDeleteState("idle"), 2000);
    }
  }

  async function patchUser(payload: Record<string, unknown>) {
    setActionState("loading");
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${user.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json() as AdminUser;
        onUpdated(updated);
        setActionState("done");
        setTimeout(() => setActionState("idle"), 1500);
      } else {
        setActionState("error");
        setTimeout(() => setActionState("idle"), 2000);
      }
    } catch {
      setActionState("error");
      setTimeout(() => setActionState("idle"), 2000);
    }
  }

  return (
    <div className="border border-border/60 rounded-sm bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-primary" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground truncate">
              {user.full_name ?? "—"}
            </span>
            {user.is_admin && (
              <Shield className="w-3 h-3 text-amber-600 flex-shrink-0" aria-hidden="true" />
            )}
            <TierBadge tier={user.subscription_tier} />
            {isSuspended && (
              <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase tracking-widest bg-red-100 text-red-700">
                {t("admin.suspended")}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground font-light truncate">{maskEmail(user.email)}</div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {user.email_verified
            ? <CheckCircle2 className="w-4 h-4 text-green-500" aria-label={t("admin.verified")} />
            : <XCircle className="w-4 h-4 text-muted-foreground/40" aria-label={t("admin.unverified")} />
          }
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-border/40 space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="font-mono uppercase tracking-wider text-muted-foreground/70">{t("admin.col_id")}</span>
              <p className="font-mono text-foreground mt-0.5 break-all">{user.id}</p>
            </div>
            <div>
              <span className="font-mono uppercase tracking-wider text-muted-foreground/70">{t("admin.col_score")}</span>
              <p className="text-foreground mt-0.5">{user.noble_score}</p>
            </div>
            <div>
              <span className="font-mono uppercase tracking-wider text-muted-foreground/70">{t("admin.col_lang")}</span>
              <p className="text-foreground mt-0.5">{user.language_code}</p>
            </div>
            <div>
              <span className="font-mono uppercase tracking-wider text-muted-foreground/70">{t("admin.col_country")}</span>
              <p className="text-foreground mt-0.5">{user.country_of_origin ?? "—"}</p>
            </div>
            <div>
              <span className="font-mono uppercase tracking-wider text-muted-foreground/70">Active Region</span>
              <p className="text-foreground mt-0.5">{user.active_region ?? "—"}</p>
            </div>
            <div>
              <span className="font-mono uppercase tracking-wider text-muted-foreground/70">{t("admin.col_onboarding")}</span>
              <p className="text-foreground mt-0.5">{user.onboarding_completed ? t("admin.yes") : t("admin.no")}</p>
            </div>
            <div>
              <span className="font-mono uppercase tracking-wider text-muted-foreground/70">{t("admin.col_joined")}</span>
              <p className="text-foreground mt-0.5">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {!user.email_verified && (
              <Button
                size="sm"
                variant="outline"
                className="font-mono text-xs gap-1.5"
                disabled={actionState === "loading"}
                onClick={() => patchUser({ email_verified: true })}
              >
                <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" />
                {t("admin.action_verify")}
              </Button>
            )}
            {isSuspended ? (
              <Button
                size="sm"
                variant="outline"
                className="font-mono text-xs gap-1.5 border-green-400/60 text-green-700 hover:bg-green-50"
                disabled={actionState === "loading"}
                onClick={async () => {
                  setActionState("loading");
                  try {
                    const res = await fetch(`${API_BASE}/api/admin/users/${user.id}/unsuspend`, {
                      method: "PATCH",
                      credentials: "include",
                    });
                    if (res.ok) {
                      onUpdated(await res.json() as AdminUser);
                      setActionState("done");
                      setTimeout(() => setActionState("idle"), 1500);
                    } else {
                      setActionState("error");
                      setTimeout(() => setActionState("idle"), 2000);
                    }
                  } catch {
                    setActionState("error");
                    setTimeout(() => setActionState("idle"), 2000);
                  }
                }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />{t("admin.action_unsuspend")}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="font-mono text-xs gap-1.5 border-red-400/60 text-red-700 hover:bg-red-50"
                disabled={actionState === "loading"}
                onClick={() => setShowSuspendConfirm(true)}
              >
                <Ban className="w-3.5 h-3.5" />{t("admin.action_suspend")}
              </Button>
            )}
            <div className="flex items-center gap-1.5">
              <select
                value={tierValue}
                onChange={(e) => setTierValue(e.target.value)}
                className="h-8 px-2 rounded-sm border border-border/60 bg-background text-xs text-foreground font-mono"
              >
                <option value="guest">guest</option>
                <option value="traveller">traveller</option>
                <option value="ambassador">ambassador</option>
              </select>
              <Button
                size="sm"
                variant="outline"
                className="font-mono text-xs h-8"
                disabled={actionState === "loading" || tierValue === user.subscription_tier}
                onClick={() => patchUser({ subscription_tier: tierValue })}
              >
                {actionState === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t("admin.action_set_tier")}
              </Button>
            </div>
            {actionState === "done" && <span className="text-xs text-green-600 font-mono flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{t("admin.saved")}</span>}
            {actionState === "error" && <span className="text-xs text-destructive font-mono">{t("admin.error")}</span>}
          </div>

          {/* Suspend confirmation panel */}
          {showSuspendConfirm && !isSuspended && (
            <div className="border border-amber-200/60 bg-amber-50/50 rounded-sm p-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 font-mono">
                  Suspend <strong>{user.full_name ?? maskEmail(user.email)}</strong>? They will not be able to sign in until reinstated.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="font-mono text-xs gap-1.5 border-amber-500 bg-amber-500 text-white hover:bg-amber-600"
                  disabled={actionState === "loading"}
                  onClick={async () => {
                    setActionState("loading");
                    setShowSuspendConfirm(false);
                    try {
                      const res = await fetch(`${API_BASE}/api/admin/users/${user.id}/suspend`, {
                        method: "PATCH",
                        credentials: "include",
                      });
                      if (res.ok) {
                        onUpdated(await res.json() as AdminUser);
                        setActionState("done");
                        setTimeout(() => setActionState("idle"), 1500);
                      } else {
                        setActionState("error");
                        setTimeout(() => setActionState("idle"), 2000);
                      }
                    } catch {
                      setActionState("error");
                      setTimeout(() => setActionState("idle"), 2000);
                    }
                  }}
                >
                  <Ban className="w-3.5 h-3.5" /> Confirm Suspend
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="font-mono text-xs"
                  onClick={() => setShowSuspendConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Delete section */}
          {!showDeleteConfirm ? (
            <div className="pt-2 border-t border-border/30">
              <Button
                size="sm"
                variant="outline"
                className="font-mono text-xs gap-1.5 border-red-300/60 text-red-600/70 hover:bg-red-50 hover:text-red-700 hover:border-red-400"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Account
              </Button>
            </div>
          ) : (
            <div className="pt-2 border-t border-red-200/60 bg-red-50/50 rounded-sm p-3 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-800 font-mono">
                  Permanently delete <strong>{user.full_name ?? user.email}</strong>? All data, progress, and score history will be removed. This cannot be undone.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-red-700 font-mono">Type <strong>DELETE</strong> to confirm:</p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="h-7 px-2 w-28 rounded-sm border border-red-300 bg-white text-xs font-mono text-red-800 placeholder:text-red-300 focus:outline-none focus:ring-1 focus:ring-red-400"
                  autoComplete="off"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="font-mono text-xs gap-1.5 border-red-500 bg-red-600 text-white hover:bg-red-700 disabled:opacity-40"
                  disabled={deleteState === "loading" || deleteConfirmText !== "DELETE"}
                  onClick={deleteUser}
                >
                  {deleteState === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Confirm Delete
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="font-mono text-xs"
                  disabled={deleteState === "loading"}
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                >
                  Cancel
                </Button>
                {deleteState === "error" && <span className="text-xs text-destructive font-mono flex items-center">Error — try again</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Content Management Tab ────────────────────────────────────────────────────

const SCENARIO_LANGS = ["nl", "fr", "de", "es", "pt", "it", "ar", "ja", "zh"] as const;
const LANG_LABELS: Record<string, string> = {
  nl: "Nederlands", fr: "Français", de: "Deutsch", es: "Español",
  pt: "Português", it: "Italiano", ar: "العربية", ja: "日本語", zh: "中文",
};

function ContentTab({ authHeaders }: { authHeaders: Record<string, string> }) {
  const [status, setStatus] = useState<ContentStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [seedState, setSeedState] = useState<ActionState>("idle");
  const [seedOutput, setSeedOutput] = useState<string[]>([]);
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
      const res = await fetch(`${API_BASE}/api/admin/content/status`, { credentials: "include" });
      if (res.ok) setStatus(await res.json() as ContentStatus);
    } catch { /* silent */ } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  async function handleSeed() {
    setSeedState("loading");
    setSeedOutput([]);
    try {
      const res = await fetch(`${API_BASE}/api/admin/content/seed`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json() as { ok: boolean; results: string[] };
      setSeedOutput(data.results ?? []);
      setSeedState(data.ok ? "done" : "error");
      if (data.ok) fetchStatus();
    } catch (err) {
      setSeedOutput([String(err)]);
      setSeedState("error");
    }
    setTimeout(() => setSeedState("idle"), 5000);
  }

  async function handleImport(type: "scenarios" | "compass_regions" | "learning_tracks") {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setImportState("loading");
    setImportResult(null);
    setImportProgress(null);

    try {
      const text = await file.text();
      const items = JSON.parse(text) as unknown[];

      const CHUNK_SIZE = 500;
      const chunks: unknown[][] = [];
      for (let i = 0; i < items.length; i += CHUNK_SIZE) {
        chunks.push(items.slice(i, i + CHUNK_SIZE));
      }

      let totalInserted = 0;
      let totalErrors = 0;
      const allErrors: string[] = [];
      let lastData: { inserted: number; errors_count: number; errors: string[]; translation_queued?: boolean; translation_scenario_ids?: number[]; translation_note?: string } | null = null;

      for (let c = 0; c < chunks.length; c++) {
        setImportProgress({ current: c + 1, total: chunks.length });
        const res = await fetch(`${API_BASE}/api/admin/content/import`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, items: chunks[c] }),
        });
        const data = await res.json() as { inserted: number; errors_count: number; errors: string[]; translation_queued?: boolean; translation_scenario_ids?: number[]; translation_note?: string };
        totalInserted += data.inserted ?? 0;
        totalErrors += data.errors_count ?? 0;
        allErrors.push(...(data.errors ?? []));
        lastData = data;
        if (!res.ok) {
          setImportResult({ inserted: totalInserted, errors_count: totalErrors, errors: allErrors.slice(0, 20) });
          setImportState("error");
          setImportProgress(null);
          return;
        }
      }

      setImportResult({
        inserted: totalInserted,
        errors_count: totalErrors,
        errors: allErrors.slice(0, 20),
        translation_queued: lastData?.translation_queued,
        translation_scenario_ids: lastData?.translation_scenario_ids,
        translation_note: lastData?.translation_note,
      });
      setImportState("done");
      setImportProgress(null);
      fetchStatus();
    } catch (err) {
      setImportResult({ inserted: 0, errors_count: 1, errors: [String(err)] });
      setImportState("error");
      setImportProgress(null);
    }
  }

  async function handleMdImport() {
    const file = mdFileRef.current?.files?.[0];
    if (!file) return;

    setMdImportState("loading");
    setMdImportResult(null);
    try {
      const content = await file.text();
      const res = await fetch(`${API_BASE}/api/admin/content/import-learning-tracks-md`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "text/plain" },
        body: content,
      });
      const data = await res.json() as { parsed: number; inserted: number; skipped: number; errors_count: number; errors: string[] };
      setMdImportResult(data);
      setMdImportState(res.ok ? "done" : "error");
    } catch (err) {
      setMdImportResult({ parsed: 0, inserted: 0, skipped: 0, errors_count: 1, errors: [String(err)] });
      setMdImportState("error");
    }
  }

  return (
    <div className="space-y-8">
      {/* Status overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif text-foreground">Content Status</h2>
          <Button
            variant="outline"
            size="sm"
            className="font-mono text-xs gap-1.5"
            onClick={fetchStatus}
            disabled={loadingStatus}
          >
            {loadingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh
          </Button>
        </div>

        {loadingStatus && !status ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-sm" />)}
          </div>
        ) : status ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "Scenarios", value: status.scenarios },
                { label: "Culture Protocols", value: status.culture_protocols },
                { label: "Compass Regions", value: status.compass_regions },
              ].map(({ label, value }) => (
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
                      {Object.entries(status.learning_track_questions_by_region)
                        .map(([region, n]) => `${region}: ${n.toLocaleString()}`)
                        .join(" · ")}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Scenario translation coverage */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70">
                  Scenario Translation Coverage ({status.total_scenarios} total)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {SCENARIO_LANGS.map(lang => {
                    const covered = status.scenario_translation_coverage[lang] ?? 0;
                    const pct = status.total_scenarios > 0
                      ? Math.round((covered / status.total_scenarios) * 100)
                      : 0;
                    return (
                      <div key={lang} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-mono text-foreground/80">{LANG_LABELS[lang]}</span>
                          <span className={`font-mono ${pct === 100 ? "text-green-600" : pct > 0 ? "text-amber-600" : "text-muted-foreground/40"}`}>
                            {covered}/{status.total_scenarios}
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${pct === 100 ? "bg-green-500" : pct > 0 ? "bg-amber-400" : "bg-muted-foreground/20"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* UI Translations */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70">
                  UI Translations (keys per language)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(status.translations).sort().map(([lang, n]) => (
                    <span key={lang} className="px-2 py-1 rounded-sm bg-muted text-xs font-mono">
                      {lang}: {n}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* Seed action */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Seed Base Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground font-light">
            Runs all seed scripts (Atelier, Compass, Translations, Admin account).
            Existing data is preserved — seeds are skipped if the tables are already populated.
          </p>
          <Button
            className="font-serif gap-2"
            disabled={seedState === "loading"}
            onClick={handleSeed}
          >
            {seedState === "loading" ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Seeding…</>
            ) : seedState === "done" ? (
              <><CheckCircle2 className="w-4 h-4" /> Seed Complete</>
            ) : seedState === "error" ? (
              <><XCircle className="w-4 h-4" /> Seed Failed</>
            ) : (
              <>Seed Base Content</>
            )}
          </Button>

          {seedOutput.length > 0 && (
            <pre className="text-xs font-mono bg-muted/40 border border-border/50 rounded-sm p-3 overflow-auto max-h-48 whitespace-pre-wrap">
              {seedOutput.join("\n\n")}
            </pre>
          )}
        </CardContent>
      </Card>

      {/* JSON Bulk Import */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Bulk Import (JSON)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground font-light">
            Upload a JSON array of scenario or compass region objects. Scenarios are inserted as new rows;
            compass regions are upserted by region_code. New scenarios are automatically translated into
            9 languages (nl, fr, de, es, pt, it, ar, ja, zh) in the background after import.
          </p>

          <div className="flex flex-wrap gap-3 items-start">
            <div className="flex flex-col gap-2 flex-1 min-w-48">
              <input
                ref={fileRef}
                type="file"
                accept=".json"
                className="text-xs text-muted-foreground font-mono file:mr-3 file:px-3 file:py-1.5 file:rounded-sm file:border file:border-border/60 file:bg-muted file:text-xs file:font-mono file:text-foreground hover:file:bg-muted/70 cursor-pointer"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="font-mono text-xs"
                disabled={importState === "loading"}
                onClick={() => handleImport("scenarios")}
              >
                {importState === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Import Scenarios"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="font-mono text-xs"
                disabled={importState === "loading"}
                onClick={() => handleImport("compass_regions")}
              >
                {importState === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Import Compass Regions"}
              </Button>
            </div>
          </div>

          {importResult && (
            <div className="space-y-2">
              <div className={`text-xs font-mono p-3 rounded-sm border ${importState === "done" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                <p>{importResult.inserted} item(s) imported. {importResult.errors_count} error(s).</p>
                {importResult.errors.length > 0 && (
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                )}
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

      {/* Learning Track MD Import */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import Learning Tracks (MD)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground font-light">
            Upload a canonical <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">.md</span> file (one file per pillar).
            The file is parsed server-side and questions are inserted directly — no JSON conversion needed.
            Duplicate questions are silently skipped.
          </p>

          <div className="flex flex-wrap gap-3 items-center">
            <input
              ref={mdFileRef}
              type="file"
              accept=".md,.txt"
              className="text-xs text-muted-foreground font-mono file:mr-3 file:px-3 file:py-1.5 file:rounded-sm file:border file:border-border/60 file:bg-muted file:text-xs file:font-mono file:text-foreground hover:file:bg-muted/70 cursor-pointer flex-1 min-w-48"
            />
            <Button
              size="sm"
              variant="outline"
              className="font-mono text-xs"
              disabled={mdImportState === "loading"}
              onClick={handleMdImport}
            >
              {mdImportState === "loading"
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Importing…</>
                : mdImportState === "done"
                ? <><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Done</>
                : mdImportState === "error"
                ? <><XCircle className="w-3.5 h-3.5 mr-1" /> Failed</>
                : "Import Learning Tracks (MD)"}
            </Button>
          </div>

          {mdImportResult && (
            <div className={`text-xs font-mono p-3 rounded-sm border space-y-1 ${mdImportState === "done" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
              <p>
                Parsed: <strong>{mdImportResult.parsed}</strong> questions —
                Inserted: <strong>{mdImportResult.inserted}</strong> —
                Skipped (duplicates): <strong>{mdImportResult.skipped}</strong> —
                Errors: <strong>{mdImportResult.errors_count}</strong>
              </p>
              {mdImportResult.errors.length > 0 && (
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  {mdImportResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <CompassRegionsDataScore />
    </div>
  );
}

// ── Compass Regions Data Score ────────────────────────────────────────────────

interface CompassRegionRow {
  region_code: string;
  flag_emoji: string;
  is_published: boolean;
  locale_count: number;
  completeness: number;
}

function CompassRegionsDataScore() {
  const [rows, setRows] = useState<CompassRegionRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "published" | "stub">("all");

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/compass-regions`, { credentials: "include" });
      if (res.ok) setRows(await res.json() as CompassRegionRow[]);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  async function togglePublished(row: CompassRegionRow) {
    setPendingCode(row.region_code);
    try {
      const res = await fetch(`${API_BASE}/api/admin/compass-regions/${row.region_code}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: !row.is_published }),
      });
      if (res.ok) {
        setRows((prev) => prev?.map((r) => r.region_code === row.region_code
          ? { ...r, is_published: !row.is_published }
          : r) ?? null);
      }
    } finally {
      setPendingCode(null);
    }
  }

  const filtered = (rows ?? []).filter((r) =>
    filter === "all" ? true : filter === "published" ? r.is_published : !r.is_published
  );
  const publishedCount = (rows ?? []).filter((r) => r.is_published).length;
  const totalCount = rows?.length ?? 0;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Compass Regions — Data Score
          </span>
          <Button variant="outline" size="sm" className="font-mono text-xs gap-1.5" onClick={fetchRows} disabled={loading}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 items-center text-xs font-mono">
          <span className="text-muted-foreground">
            {publishedCount}/{totalCount} published
          </span>
          <div className="flex gap-1 ml-auto">
            {(["all", "published", "stub"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-sm border text-xs font-mono uppercase tracking-widest ${
                  filter === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/40 border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading && !rows ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-9 rounded-sm" />)}
          </div>
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
                      <button
                        onClick={() => togglePublished(row)}
                        disabled={pendingCode === row.region_code}
                        className={`px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-widest border ${
                          row.is_published
                            ? "bg-green-50 border-green-300 text-green-800"
                            : "bg-muted border-border text-muted-foreground"
                        } ${pendingCode === row.region_code ? "opacity-50" : "hover:opacity-80 cursor-pointer"}`}
                      >
                        {pendingCode === row.region_code
                          ? "…"
                          : row.is_published ? "Published" : "Stub"}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{row.locale_count}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${row.completeness === 100 ? "bg-green-500" : row.completeness > 0 ? "bg-amber-400" : "bg-muted-foreground/20"}`}
                            style={{ width: `${row.completeness}%` }}
                          />
                        </div>
                        <span className="text-muted-foreground tabular-nums">{row.completeness}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground/60">
                      No regions match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── CC Screening Worker Tab ───────────────────────────────────────────────────

const CC_SUBCATEGORIES: Record<string, string[]> = {
  Z1: ["religious_impact", "holidays", "gift_giving", "taboos", "color_symbolism", "alternative_behavior"],
  Z2: ["forms_of_address", "greeting_ritual", "communication_context", "safe_smalltalk", "topics_to_avoid", "nonverbal_style"],
  Z3: ["cutlery_use", "seating_order", "payment_ritual", "consumption_sounds", "table_posture", "wine_and_drinks"],
  Z4: ["gender_nuances", "seniority_business", "hierarchy_social", "networking", "relationship_gifts", "conflict_face_saving"],
  Z5: ["dress_code_business", "dress_code_social", "modest_dress", "eye_contact_personal_space", "touch_etiquette", "accessories_symbols"],
};

const CC_BOOKS = [
  { code: "DH", label: "DH — Debrett's Handbook (UK)" },
  { code: "AV", label: "AV — Amy Vanderbilt (Universeel West)" },
  { code: "ME", label: "ME — Modern Etiquette for a Better Life" },
  { code: "MG", label: "MG — Guide to the Modern Gentleman (UK)" },
  { code: "DN", label: "DN — Debrett's New Guide (UK)" },
  { code: "CB", label: "CB — Chinese Business Etiquette (China)" },
  { code: "CA", label: "CA — Culture Smart! Australia" },
  { code: "CM", label: "CM — The Culture Map (Cross-cultureel)" },
] as const;

const PILLAR_LABELS: Record<string, string> = {
  Z1: "Z1 · Cultuur & Traditie",
  Z2: "Z2 · Interactie & Taal",
  Z3: "Z3 · Tafelmanieren",
  Z4: "Z4 · Relaties & Status",
  Z5: "Z5 · Verschijning",
};

interface CCRecord {
  source_book: string;
  source_page: string;
  region: string;
  pillar: string;
  subcategory: string;
  rule_raw: string;
  rule_cc: string;
  personas: string[];
  modules: string[];
  urgency: number;
  verified: boolean;
  _note?: string;
}

interface PendingCCRecord {
  id: number;
  region_code: string;
  pillar_code: string | null;
  subcategory: string | null;
  rule_cc: string | null;
  rule_raw: string | null;
  urgency: number | null;
  source_book: string | null;
  source_page: string | null;
  source_reference: string | null;
  verified: boolean;
  created_at: string;
}

interface VerifiedCCRecord {
  id: number;
  region_code: string;
  pillar_code: string | null;
  subcategory: string | null;
  rule_cc: string | null;
  urgency: number | null;
  source_book: string | null;
  source_page: string | null;
  source_reference: string | null;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  reviewer_name: string | null;
}

function UrgencyBadge({ urgency }: { urgency: number | null }) {
  if (urgency === 3) {
    return (
      <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase tracking-widest bg-red-100 text-red-700 border border-red-200">
        U3 · Kritisch
      </span>
    );
  }
  if (urgency === 2) {
    return (
      <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase tracking-widest bg-amber-100 text-amber-700 border border-amber-200">
        U2 · Belangrijk
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase tracking-widest bg-green-50 text-green-700 border border-green-200">
      U1 · Nice-to-know
    </span>
  );
}

function PendingRecordRow({
  record,
  authHeaders,
  onApproved,
  onDeleted,
}: {
  record: PendingCCRecord;
  authHeaders: Record<string, string>;
  onApproved: (id: number) => void;
  onDeleted: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [approveState, setApproveState] = useState<ActionState>("idle");
  const [deleteState, setDeleteState] = useState<ActionState>("idle");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [editRuleCc, setEditRuleCc] = useState(record.rule_cc ?? "");
  const [editSubcategory, setEditSubcategory] = useState(record.subcategory ?? "");
  const [editUrgency, setEditUrgency] = useState<number>(record.urgency ?? 1);
  const [editRegionCode, setEditRegionCode] = useState(record.region_code ?? "");
  const [saveState, setSaveState] = useState<ActionState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const [baseline, setBaseline] = useState({
    rule_cc: record.rule_cc ?? "",
    subcategory: record.subcategory ?? "",
    urgency: record.urgency ?? 1,
    region_code: record.region_code ?? "",
  });

  const isUrgent = editUrgency === 3;
  const pillarCode = record.pillar_code ?? "";
  const subcategoryOptions = CC_SUBCATEGORIES[pillarCode] ?? [];

  const isDirty =
    editRuleCc !== baseline.rule_cc ||
    editSubcategory !== baseline.subcategory ||
    editUrgency !== baseline.urgency ||
    editRegionCode !== baseline.region_code;

  async function handleSaveChanges() {
    setSaveState("loading");
    setSaveError(null);
    try {
      const payload: Record<string, unknown> = {};
      if (editRuleCc !== baseline.rule_cc) payload.rule_cc = editRuleCc;
      if (editSubcategory !== baseline.subcategory) payload.subcategory = editSubcategory;
      if (editUrgency !== baseline.urgency) payload.urgency = editUrgency;
      if (editRegionCode !== baseline.region_code) payload.region_code = editRegionCode;

      const res = await fetch(`${API_BASE}/api/admin/cc-protocols/${record.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setBaseline({ rule_cc: editRuleCc, subcategory: editSubcategory, urgency: editUrgency, region_code: editRegionCode });
        setSaveState("done");
        setTimeout(() => setSaveState("idle"), 2000);
      } else {
        const data = await res.json() as { error?: string; message?: string };
        setSaveError(data.message ?? data.error ?? "Opslaan mislukt.");
        setSaveState("error");
        setTimeout(() => setSaveState("idle"), 3000);
      }
    } catch {
      setSaveError("Verbinding mislukt.");
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  }

  async function handleApprove() {
    setApproveState("loading");
    try {
      const res = await fetch(`${API_BASE}/api/admin/cc-protocols/${record.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve: true }),
      });
      if (res.ok) {
        setApproveState("done");
        setTimeout(() => onApproved(record.id), 800);
      } else {
        setApproveState("error");
        setTimeout(() => setApproveState("idle"), 2000);
      }
    } catch {
      setApproveState("error");
      setTimeout(() => setApproveState("idle"), 2000);
    }
  }

  async function handleDelete() {
    setDeleteState("loading");
    try {
      const res = await fetch(`${API_BASE}/api/admin/cc-protocols/${record.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setDeleteState("done");
        setTimeout(() => onDeleted(record.id), 500);
      } else {
        setDeleteState("error");
        setTimeout(() => setDeleteState("idle"), 2000);
      }
    } catch {
      setDeleteState("error");
      setTimeout(() => setDeleteState("idle"), 2000);
    }
  }

  return (
    <div className={`border rounded-sm overflow-hidden ${isUrgent ? "border-red-300 bg-red-50/30" : "border-border/60 bg-card"}`}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-3 p-3 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-medium text-foreground">
              {record.pillar_code ?? "—"} · {editSubcategory || record.subcategory || "—"}
            </span>
            <UrgencyBadge urgency={editUrgency} />
            <span className="text-[10px] font-mono text-muted-foreground border border-border/50 px-1.5 py-0.5 rounded-sm">
              {editRegionCode || record.region_code}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {record.source_book} · p.{record.source_page}
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-light truncate">
            {editRuleCc ? editRuleCc.slice(0, 120) + (editRuleCc.length > 120 ? "…" : "") : "—"}
          </p>
        </div>
        <div className="shrink-0 pt-0.5">
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-border/30 space-y-3 animate-in fade-in duration-150">
          {record.rule_raw && (
            <div className="space-y-1">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">rule_raw (intern — alleen-lezen)</p>
              <p className="text-xs font-light text-muted-foreground italic bg-muted/30 rounded-sm px-2 py-1.5">{record.rule_raw}</p>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">rule_cc (app-tekst)</label>
            <textarea
              value={editRuleCc}
              onChange={(e) => setEditRuleCc(e.target.value)}
              rows={3}
              className="w-full rounded-sm border border-border bg-background px-2 py-1.5 text-xs font-light leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">Subcategorie</label>
              <select
                value={editSubcategory}
                onChange={(e) => setEditSubcategory(e.target.value)}
                className="w-full h-7 px-2 rounded-sm border border-border bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary/40"
              >
                {subcategoryOptions.length > 0 ? (
                  subcategoryOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))
                ) : (
                  <option value={editSubcategory}>{editSubcategory || "—"}</option>
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">Urgentie</label>
              <select
                value={editUrgency}
                onChange={(e) => setEditUrgency(Number(e.target.value))}
                className="w-full h-7 px-2 rounded-sm border border-border bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary/40"
              >
                <option value={1}>1 — Nice-to-know</option>
                <option value={2}>2 — Belangrijk</option>
                <option value={3}>3 — Kritisch</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">Regiecode</label>
              <input
                type="text"
                value={editRegionCode}
                onChange={(e) => setEditRegionCode(e.target.value.toUpperCase())}
                maxLength={10}
                className="w-full h-7 px-2 rounded-sm border border-border bg-background text-xs font-mono uppercase focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Button
              size="sm"
              variant="outline"
              className="font-mono text-xs gap-1.5"
              disabled={saveState === "loading" || !isDirty || approveState === "loading"}
              onClick={handleSaveChanges}
            >
              {saveState === "loading"
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Save className="w-3.5 h-3.5" />
              }
              Wijzigingen opslaan
            </Button>
            {saveState === "done" && (
              <span className="text-xs text-green-600 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Opgeslagen
              </span>
            )}
            {saveState === "error" && saveError && (
              <span className="text-xs text-red-600 font-mono">{saveError}</span>
            )}
          </div>

          <div className="text-[10px] font-mono text-muted-foreground space-x-4">
            <span>ID: {record.id}</span>
            <span>Bron: {record.source_reference ?? `${record.source_book}:${record.source_page}`}</span>
            <span>Toegevoegd: {new Date(record.created_at).toLocaleDateString()}</span>
          </div>

          {approveState === "done" ? (
            <div className="flex items-center gap-2 text-xs text-green-700 font-mono p-2 bg-green-50 rounded-sm border border-green-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> Goedgekeurd — record is nu verified: true.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 items-center">
              <Button
                size="sm"
                variant="outline"
                className="font-mono text-xs gap-1.5 border-green-400/60 text-green-700 hover:bg-green-50 disabled:opacity-40"
                disabled={approveState === "loading" || deleteState === "loading" || saveState === "loading" || isDirty}
                title={isDirty ? "Sla eerst de wijzigingen op voordat je goedkeurt" : undefined}
                onClick={handleApprove}
              >
                {approveState === "loading"
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <ThumbsUp className="w-3.5 h-3.5" />
                }
                Goedkeuren
              </Button>
              {isDirty && (
                <span className="text-[10px] text-amber-600 font-mono">Sla wijzigingen op voor goedkeuring</span>
              )}

              {!showDeleteConfirm ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="font-mono text-xs gap-1.5 border-red-300/60 text-red-600/70 hover:bg-red-50 hover:text-red-700"
                  disabled={approveState === "loading" || deleteState === "loading"}
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Verwijderen
                </Button>
              ) : (
                <div className="flex gap-2 items-center">
                  <Button
                    size="sm"
                    variant="outline"
                    className="font-mono text-xs gap-1.5 border-red-500 bg-red-600 text-white hover:bg-red-700"
                    disabled={deleteState === "loading"}
                    onClick={handleDelete}
                  >
                    {deleteState === "loading"
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />
                    }
                    Bevestig verwijdering
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="font-mono text-xs"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Annuleren
                  </Button>
                </div>
              )}

              {approveState === "error" && <span className="text-xs text-red-600 font-mono">Goedkeuren mislukt.</span>}
              {deleteState === "error" && <span className="text-xs text-red-600 font-mono">Verwijderen mislukt.</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PendingReviewPanel({ authHeaders, refreshKey }: { authHeaders: Record<string, string>; refreshKey: number }) {
  const [records, setRecords] = useState<PendingCCRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPending = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/cc-protocols?page=${p}&limit=20`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json() as { records: PendingCCRecord[]; total: number; pages: number; page: number };
        setRecords(data.records);
        setTotal(data.total);
        setTotalPages(data.pages ?? 1);
        setPage(data.page ?? 1);
      }
    } catch { } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(1); }, [fetchPending, refreshKey]);

  function handleApproved(id: number) {
    const newRecords = records.filter((r) => r.id !== id);
    const newTotal = Math.max(0, total - 1);
    setRecords(newRecords);
    setTotal(newTotal);
    if (newRecords.length === 0 && newTotal > 0) {
      const targetPage = page > 1 ? page - 1 : 1;
      fetchPending(targetPage);
    }
  }

  function handleDeleted(id: number) {
    const newRecords = records.filter((r) => r.id !== id);
    const newTotal = Math.max(0, total - 1);
    setRecords(newRecords);
    setTotal(newTotal);
    if (newRecords.length === 0 && newTotal > 0) {
      const targetPage = page > 1 ? page - 1 : 1;
      fetchPending(targetPage);
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
          <ClipboardList className="w-4 h-4" />
          Wachtrij voor review
          {total > 0 && (
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full border border-amber-300 bg-amber-50 text-amber-700 font-mono">
              {total} in wachtrij
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground font-light">
          Records die door de CC Screening Worker zijn opgeslagen staan hier klaar voor menselijke review.
          Keur goed om ze zichtbaar te maken in de app, of verwijder ze bij twijfel.
          Records met urgentie&nbsp;3 zijn rood gemarkeerd voor prioritaire beoordeling.
        </p>

        <div className="flex items-center justify-between">
          <p className="text-xs font-mono text-muted-foreground">
            {loading ? "Laden…" : `${total} record${total !== 1 ? "s" : ""} in behandeling`}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="font-mono text-xs gap-1.5"
            onClick={() => fetchPending(page)}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Vernieuwen
          </Button>
        </div>

        {loading && records.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-sm" />)}
          </div>
        ) : records.length === 0 ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-8 h-8 mx-auto text-green-400 mb-2" />
            <p className="text-sm text-muted-foreground font-light">Geen records in behandeling. Alles is beoordeeld.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map((r) => (
              <PendingRecordRow
                key={r.id}
                record={r}
                authHeaders={authHeaders}
                onApproved={handleApproved}
                onDeleted={handleDeleted}
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              className="font-mono text-xs"
              disabled={page <= 1 || loading}
              onClick={() => fetchPending(page - 1)}
            >
              ← Vorige
            </Button>
            <span className="text-xs font-mono text-muted-foreground px-2">
              {page} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="font-mono text-xs"
              disabled={page >= totalPages || loading}
              onClick={() => fetchPending(page + 1)}
            >
              Volgende →
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function VerifiedRecordRow({
  record,
  onChanged,
  onRemoved,
  onUnverified,
}: {
  record: VerifiedCCRecord;
  onChanged: (updated: Partial<VerifiedCCRecord> & { id: number }) => void;
  onRemoved: (id: number) => void;
  onUnverified: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [saveState, setSaveState] = useState<ActionState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [unverifyState, setUnverifyState] = useState<ActionState>("idle");
  const [showUnverifyConfirm, setShowUnverifyConfirm] = useState(false);
  const [deleteState, setDeleteState] = useState<ActionState>("idle");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [editRuleCc, setEditRuleCc] = useState(record.rule_cc ?? "");
  const [editSubcategory, setEditSubcategory] = useState(record.subcategory ?? "");
  const [editUrgency, setEditUrgency] = useState<number>(record.urgency ?? 1);
  const [editRegionCode, setEditRegionCode] = useState(record.region_code ?? "");

  const [baseline, setBaseline] = useState({
    rule_cc: record.rule_cc ?? "",
    subcategory: record.subcategory ?? "",
    urgency: record.urgency ?? 1,
    region_code: record.region_code ?? "",
  });

  const pillarCode = record.pillar_code ?? "";
  const subcategoryOptions = CC_SUBCATEGORIES[pillarCode] ?? [];

  const isDirty =
    editRuleCc !== baseline.rule_cc ||
    editSubcategory !== baseline.subcategory ||
    editUrgency !== baseline.urgency ||
    editRegionCode !== baseline.region_code;

  async function handleSave() {
    setSaveState("loading");
    setSaveError(null);
    try {
      const payload: Record<string, unknown> = {};
      if (editRuleCc !== baseline.rule_cc) payload.rule_cc = editRuleCc;
      if (editSubcategory !== baseline.subcategory) payload.subcategory = editSubcategory;
      if (editUrgency !== baseline.urgency) payload.urgency = editUrgency;
      if (editRegionCode !== baseline.region_code) payload.region_code = editRegionCode;

      const res = await fetch(`${API_BASE}/api/admin/cc-protocols/${record.id}/verified`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const next = { rule_cc: editRuleCc, subcategory: editSubcategory, urgency: editUrgency, region_code: editRegionCode };
        setBaseline(next);
        onChanged({ id: record.id, ...next });
        setSaveState("done");
        setTimeout(() => setSaveState("idle"), 2000);
      } else {
        const data = await res.json().catch(() => ({} as { error?: string }));
        setSaveError(data.error ?? "Opslaan mislukt.");
        setSaveState("error");
        setTimeout(() => setSaveState("idle"), 3000);
      }
    } catch {
      setSaveError("Verbinding mislukt.");
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  }

  async function handleUnverify() {
    setUnverifyState("loading");
    try {
      const res = await fetch(`${API_BASE}/api/admin/cc-protocols/${record.id}/verified`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unverify: true }),
      });
      if (res.ok) {
        setUnverifyState("done");
        setTimeout(() => onUnverified(record.id), 600);
      } else {
        setUnverifyState("error");
        setTimeout(() => setUnverifyState("idle"), 2500);
      }
    } catch {
      setUnverifyState("error");
      setTimeout(() => setUnverifyState("idle"), 2500);
    }
  }

  async function handleDelete() {
    setDeleteState("loading");
    try {
      const res = await fetch(`${API_BASE}/api/admin/cc-protocols/${record.id}/verified`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setDeleteState("done");
        setTimeout(() => onRemoved(record.id), 400);
      } else {
        setDeleteState("error");
        setTimeout(() => setDeleteState("idle"), 2500);
      }
    } catch {
      setDeleteState("error");
      setTimeout(() => setDeleteState("idle"), 2500);
    }
  }

  return (
    <div className="border border-green-200/60 bg-green-50/20 rounded-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-3 p-3 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-medium text-foreground">
              {record.pillar_code ?? "—"} · {editSubcategory || "—"}
            </span>
            <UrgencyBadge urgency={editUrgency} />
            <span className="text-[10px] font-mono text-muted-foreground border border-border/50 px-1.5 py-0.5 rounded-sm">
              {editRegionCode}
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-light truncate">
            {editRuleCc ? editRuleCc.slice(0, 120) + (editRuleCc.length > 120 ? "…" : "") : "—"}
          </p>
          <p className="text-[10px] font-mono text-green-700/80">
            Beoordeeld door <span className="font-semibold">{record.reviewer_name ?? "onbekend"}</span>
            {record.reviewed_at ? (
              <> op {new Date(record.reviewed_at).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}</>
            ) : null}
          </p>
        </div>
        <div className="shrink-0 pt-0.5">
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-green-200/40 space-y-3 animate-in fade-in duration-150">
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">rule_cc (app-tekst)</label>
            <textarea
              value={editRuleCc}
              onChange={(e) => setEditRuleCc(e.target.value)}
              rows={3}
              className="w-full rounded-sm border border-border bg-background px-2 py-1.5 text-xs font-light leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">Subcategorie</label>
              <select
                value={editSubcategory}
                onChange={(e) => setEditSubcategory(e.target.value)}
                className="w-full h-7 px-2 rounded-sm border border-border bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary/40"
              >
                {subcategoryOptions.length > 0 ? (
                  subcategoryOptions.map((s) => <option key={s} value={s}>{s}</option>)
                ) : (
                  <option value={editSubcategory}>{editSubcategory || "—"}</option>
                )}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">Urgentie</label>
              <select
                value={editUrgency}
                onChange={(e) => setEditUrgency(Number(e.target.value))}
                className="w-full h-7 px-2 rounded-sm border border-border bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary/40"
              >
                <option value={1}>1 — Nice-to-know</option>
                <option value={2}>2 — Belangrijk</option>
                <option value={3}>3 — Kritisch</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">Regiocode</label>
              <input
                type="text"
                value={editRegionCode}
                onChange={(e) => setEditRegionCode(e.target.value.toUpperCase())}
                maxLength={10}
                className="w-full h-7 px-2 rounded-sm border border-border bg-background text-xs font-mono uppercase focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="text-[10px] font-mono text-muted-foreground space-x-4">
            <span>ID: {record.id}</span>
            <span>Bron: {record.source_reference ?? `${record.source_book}:${record.source_page}`}</span>
            <span>Toegevoegd: {new Date(record.created_at).toLocaleDateString()}</span>
          </div>

          <div className="flex flex-wrap gap-2 items-center pt-1 border-t border-green-200/30">
            <Button
              size="sm"
              variant="outline"
              className="font-mono text-xs gap-1.5"
              disabled={!isDirty || saveState === "loading" || unverifyState === "loading" || deleteState === "loading"}
              onClick={handleSave}
              data-testid={`button-verified-save-${record.id}`}
            >
              {saveState === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Correctie opslaan
            </Button>
            {saveState === "done" && (
              <span className="text-xs text-green-600 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Opgeslagen — vertalingen worden vernieuwd op de achtergrond.
              </span>
            )}
            {saveState === "error" && saveError && (
              <span className="text-xs text-red-600 font-mono">{saveError}</span>
            )}

            {!showUnverifyConfirm ? (
              <Button
                size="sm"
                variant="outline"
                className="font-mono text-xs gap-1.5 border-amber-400/60 text-amber-700 hover:bg-amber-50"
                disabled={isDirty || saveState === "loading" || unverifyState === "loading" || deleteState === "loading"}
                title={isDirty ? "Sla eerst je wijzigingen op of annuleer ze" : "Stuur dit record terug naar de wachtrij voor opnieuw te beoordelen"}
                onClick={() => setShowUnverifyConfirm(true)}
                data-testid={`button-verified-unverify-${record.id}`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Terug naar wachtrij
              </Button>
            ) : (
              <div className="flex gap-2 items-center">
                <Button
                  size="sm"
                  variant="outline"
                  className="font-mono text-xs gap-1.5 border-amber-500 bg-amber-500 text-white hover:bg-amber-600"
                  disabled={unverifyState === "loading"}
                  onClick={async () => { setShowUnverifyConfirm(false); await handleUnverify(); }}
                >
                  {unverifyState === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Bevestig terugzetten
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="font-mono text-xs"
                  onClick={() => setShowUnverifyConfirm(false)}
                >
                  Annuleren
                </Button>
              </div>
            )}

            {!showDeleteConfirm ? (
              <Button
                size="sm"
                variant="outline"
                className="font-mono text-xs gap-1.5 border-red-300/60 text-red-600/70 hover:bg-red-50 hover:text-red-700"
                disabled={saveState === "loading" || unverifyState === "loading" || deleteState === "loading"}
                onClick={() => setShowDeleteConfirm(true)}
                data-testid={`button-verified-delete-${record.id}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Verwijderen
              </Button>
            ) : (
              <div className="flex gap-2 items-center">
                <Button
                  size="sm"
                  variant="outline"
                  className="font-mono text-xs gap-1.5 border-red-500 bg-red-600 text-white hover:bg-red-700"
                  disabled={deleteState === "loading"}
                  onClick={handleDelete}
                >
                  {deleteState === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Bevestig verwijdering
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="font-mono text-xs"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Annuleren
                </Button>
              </div>
            )}

            {unverifyState === "error" && <span className="text-xs text-red-600 font-mono">Terugzetten mislukt.</span>}
            {deleteState === "error" && <span className="text-xs text-red-600 font-mono">Verwijderen mislukt.</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function VerifiedPanel({ authHeaders }: { authHeaders: Record<string, string> }) {
  const [records, setRecords] = useState<VerifiedCCRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchVerified = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/cc-protocols/verified?page=${p}&limit=20`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json() as { records: VerifiedCCRecord[]; total: number; pages: number; page: number };
        setRecords(data.records);
        setTotal(data.total);
        setTotalPages(data.pages ?? 1);
        setPage(data.page ?? 1);
      }
    } catch { } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVerified(1); }, [fetchVerified]);

  function handleLocalUpdate(updated: Partial<VerifiedCCRecord> & { id: number }) {
    setRecords((rows) => rows.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
  }

  function handleRemoved(id: number) {
    const next = records.filter((r) => r.id !== id);
    const newTotal = Math.max(0, total - 1);
    setRecords(next);
    setTotal(newTotal);
    if (next.length === 0 && newTotal > 0) {
      fetchVerified(page > 1 ? page - 1 : 1);
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
            <BadgeCheck className="w-4 h-4 text-green-600" />
            Geverifieerde records
            <span className="text-[10px] text-muted-foreground/60 font-mono normal-case tracking-normal">
              · {loading && total === 0 ? "…" : `${total} record${total === 1 ? "" : "s"}`}
            </span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="font-mono text-xs gap-1.5 h-8 text-muted-foreground hover:text-foreground"
            onClick={() => fetchVerified(page)}
            disabled={loading}
            data-testid="button-verified-refresh"
            aria-label="Vernieuwen"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Vernieuwen
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground font-light">
          Goedgekeurde CC-records. Je kunt fouten <span className="font-medium text-foreground/80">corrigeren</span>,
          een record <span className="font-medium text-foreground/80">terug naar de wachtrij</span> sturen voor herziening,
          of het volledig <span className="font-medium text-foreground/80">verwijderen</span>.
          Bij elke tekstcorrectie worden de vertalingen in alle talen automatisch ververst.
        </p>

        {loading && records.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-sm" />)}
          </div>
        ) : records.length === 0 ? (
          <div className="py-8 text-center">
            <BadgeCheck className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground font-light">Nog geen geverifieerde records.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map((r) => (
              <VerifiedRecordRow
                key={r.id}
                record={r}
                onChanged={handleLocalUpdate}
                onRemoved={handleRemoved}
                onUnverified={handleRemoved}
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              className="font-mono text-xs"
              disabled={page <= 1 || loading}
              onClick={() => fetchVerified(page - 1)}
            >
              ← Vorige
            </Button>
            <span className="text-xs font-mono text-muted-foreground px-2">
              {page} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="font-mono text-xs"
              disabled={page >= totalPages || loading}
              onClick={() => fetchVerified(page + 1)}
            >
              Volgende →
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CCScreeningPanel({ authHeaders }: { authHeaders: Record<string, string> }) {
  const [fragment, setFragment] = useState("");
  const [sourceBook, setSourceBook] = useState("DH");
  const [sourcePage, setSourcePage] = useState("");
  const [screenState, setScreenState] = useState<ActionState>("idle");
  const [screenError, setScreenError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [record, setRecord] = useState<CCRecord | null>(null);
  const [editedRecord, setEditedRecord] = useState<string>("");
  const [saveState, setSaveState] = useState<ActionState>("idle");
  const [savedId, setSavedId] = useState<number | null>(null);
  const [savedTranslations, setSavedTranslations] = useState<Record<string, string>>({});
  const [pendingRefreshKey, setPendingRefreshKey] = useState(0);

  async function handleScreen() {
    if (!fragment.trim() || !sourcePage.trim()) return;
    setScreenState("loading");
    setScreenError(null);
    setWarnings([]);
    setRecord(null);
    setSavedId(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/cc-screen`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fragment: fragment.trim(), source_book: sourceBook, source_page: sourcePage.trim() }),
      });
      const data = await res.json() as { ok?: boolean; record?: CCRecord; warnings?: string[]; error?: string; message?: string };
      if (!res.ok || !data.ok) {
        setScreenError(data.message ?? data.error ?? "Verwerking mislukt.");
        setScreenState("error");
      } else {
        setRecord(data.record!);
        setEditedRecord(JSON.stringify(data.record, null, 2));
        setWarnings(data.warnings ?? []);
        setScreenState("done");
      }
    } catch {
      setScreenError("Verbinding met de server mislukt.");
      setScreenState("error");
    }
  }

  async function handleSave() {
    if (!editedRecord) return;
    setSaveState("loading");
    let parsed: CCRecord;
    try {
      parsed = JSON.parse(editedRecord) as CCRecord;
    } catch {
      setSaveState("error");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/admin/cc-save`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const data = await res.json() as { ok?: boolean; id?: number; error?: string; translations?: Record<string, string> };
      if (res.ok && data.ok) {
        setSavedId(data.id ?? null);
        setSavedTranslations(data.translations ?? {});
        setSaveState("done");
        setPendingRefreshKey((k) => k + 1);
      } else {
        setSaveState("error");
      }
    } catch {
      setSaveState("error");
    }
  }

  function reset() {
    setFragment("");
    setSourcePage("");
    setScreenState("idle");
    setScreenError(null);
    setWarnings([]);
    setRecord(null);
    setEditedRecord("");
    setSaveState("idle");
    setSavedId(null);
    setSavedTranslations({});
  }

  return (
    <div className="space-y-6">
      {/* Pending review queue */}
      <PendingReviewPanel authHeaders={authHeaders} refreshKey={pendingRefreshKey} />

      {/* Verified records */}
      <VerifiedPanel authHeaders={authHeaders} />

      {/* Input card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            CC Screening Worker — Kennisextractie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground font-light">
            Plak een tekstfragment uit een etiquetteboek. De worker extraheert de etiquetteregel,
            classificeert deze onder het 5-Zuilen-schema en genereert een auteursrechtveilig JSON-record
            voor de <span className="font-mono text-xs">culture_protocols</span> tabel.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-wide">Bronboek</label>
              <select
                value={sourceBook}
                onChange={(e) => setSourceBook(e.target.value)}
                className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/40"
              >
                {CC_BOOKS.map(b => (
                  <option key={b.code} value={b.code}>{b.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-wide">Paginanummer</label>
              <Input
                placeholder="bijv. 142"
                value={sourcePage}
                onChange={(e) => setSourcePage(e.target.value)}
                className="font-mono rounded-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wide">Tekstfragment</label>
            <textarea
              value={fragment}
              onChange={(e) => setFragment(e.target.value)}
              placeholder="Plak hier het tekstfragment uit het bronboek (parafraseer zelf eerst indien nodig)..."
              rows={6}
              className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm font-light leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            <p className="text-[11px] text-muted-foreground font-mono">
              {fragment.length} tekens · Plak geen letterlijke boektekst — parafraseer het fragment eerst zelf.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleScreen}
              disabled={screenState === "loading" || !fragment.trim() || !sourcePage.trim()}
              className="font-serif rounded-sm"
            >
              {screenState === "loading"
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Verwerken…</>
                : <><Cpu className="w-4 h-4 mr-2" />Verwerk fragment</>
              }
            </Button>
            {(record || screenError) && (
              <Button variant="outline" onClick={reset} className="font-mono text-xs rounded-sm">
                Nieuw fragment
              </Button>
            )}
          </div>

          {/* Error state */}
          {screenState === "error" && screenError && (
            <div className="flex items-start gap-2 text-sm p-3 rounded-sm border bg-red-50 border-red-200 text-red-800">
              <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{screenError}</span>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="space-y-1">
              {warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-xs p-2.5 rounded-sm border bg-amber-50 border-amber-200 text-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result card */}
      {record && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Geëxtraheerd record — {PILLAR_LABELS[record.pillar] ?? record.pillar}
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full border border-amber-300 bg-amber-50 text-amber-700">
                verified: false
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary view */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="space-y-1">
                <span className="text-muted-foreground">Bron:</span>
                <span className="ml-2 text-foreground">{record.source_book} · p. {record.source_page}</span>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground">Regio:</span>
                <span className="ml-2 text-foreground">{record.region}</span>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground">Zuil:</span>
                <span className="ml-2 text-foreground">{record.pillar} · {record.subcategory}</span>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground">Urgentie:</span>
                <span className={`ml-2 font-bold ${record.urgency === 3 ? "text-red-600" : record.urgency === 2 ? "text-amber-600" : "text-green-600"}`}>
                  {record.urgency} {record.urgency === 3 ? "— Kritisch" : record.urgency === 2 ? "— Belangrijk" : "— Nice-to-know"}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground">Persona's:</span>
                <span className="ml-2 text-foreground">{record.personas.join(", ")}</span>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground">Modules:</span>
                <span className="ml-2 text-foreground">{record.modules.join(", ")}</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide">rule_raw (intern)</p>
              <p className="text-sm font-light text-muted-foreground italic bg-muted/30 rounded-sm px-3 py-2">{record.rule_raw}</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide">rule_cc (app-tekst)</p>
              <p className="text-sm font-light leading-relaxed bg-muted/30 rounded-sm px-3 py-2">{record.rule_cc}</p>
            </div>

            {record._note && (
              <p className="text-xs text-muted-foreground font-mono italic">Noot: {record._note}</p>
            )}

            {/* Editable JSON */}
            <div className="space-y-1.5">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide">JSON — bewerk voor opslaan indien nodig</p>
              <textarea
                value={editedRecord}
                onChange={(e) => setEditedRecord(e.target.value)}
                rows={18}
                className="w-full rounded-sm border border-border bg-muted/20 px-3 py-2 text-xs font-mono resize-y focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>

            {/* Save button */}
            {saveState !== "done" ? (
              <div className="flex gap-2 items-center">
                <Button
                  onClick={handleSave}
                  disabled={saveState === "loading"}
                  variant="outline"
                  className="font-serif rounded-sm border-green-400/60 text-green-700 hover:bg-green-50"
                >
                  {saveState === "loading"
                    ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Opslaan…</>
                    : <><Save className="w-4 h-4 mr-2" />Opslaan naar database</>
                  }
                </Button>
                {saveState === "error" && (
                  <span className="text-xs text-red-600 font-mono">Opslaan mislukt — controleer de JSON.</span>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm p-3 rounded-sm border bg-green-50 border-green-200 text-green-800">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Record opgeslagen · ID: <span className="font-mono">{savedId}</span> · verified: false — klaar voor redactionele review.</span>
                </div>
                {Object.keys(savedTranslations).length > 0 && (
                  <div className="border border-border rounded-sm p-3 space-y-2">
                    <p className="text-xs font-mono uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                      <span>🌐</span> Automatische vertalingen (rule_cc_i18n)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {Object.entries(savedTranslations).map(([lang, text]) => (
                        <div key={lang} className="text-xs bg-muted/30 rounded-sm px-2 py-1.5">
                          <span className="font-mono font-medium uppercase text-muted-foreground mr-2">{lang}</span>
                          <span className="font-light">{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {Object.keys(savedTranslations).length === 0 && (
                  <p className="text-xs text-muted-foreground font-mono">Vertaling niet beschikbaar (AI niet bereikbaar of fout opgetreden).</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quality checklist card */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground/50 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" />
            Kwaliteitschecklist (automatisch gevalideerd)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-xs text-muted-foreground font-light space-y-1.5">
            {[
              "Geen letterlijk geciteerde zin uit het bronwerk",
              "C&C-stem consistent (mentor, niet rechter)",
              "Zuil + subcategorie correct en specifiek",
              "Regio correct (UK / CN / CA / AU / UNIVERSAL)",
              "Urgentie realistisch (max 20% van regels = urgency 3)",
              "Personas logisch (niet alle drie tenzij echt universeel)",
              "JSON valide (geen trailing comma's, geen ontbrekende quotes)",
              "verified altijd false bij extractie",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-3 h-3 mt-0.5 text-green-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Use Cases Tab ─────────────────────────────────────────────────────────────

type UseCaseFormData = Omit<UseCase, "id">;

function UseCaseForm({
  initial,
  onSave,
  onCancel,
  saving,
  saveError,
}: {
  initial: UseCaseFormData;
  onSave: (data: UseCaseFormData) => void;
  onCancel: () => void;
  saving: boolean;
  saveError: string | null;
}) {
  const [form, setForm] = useState<UseCaseFormData>(initial);
  const [domainTagsInput, setDomainTagsInput] = useState(initial.domain_tags.join(", "));
  const [pillarWeightsInput, setPillarWeightsInput] = useState(
    Object.entries(initial.pillar_weights).map(([k, v]) => `${k}:${v}`).join(", ")
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setJsonError(null);

    const tags = domainTagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const weights: Record<string, number> = {};
    const pwParts = pillarWeightsInput.split(",").map((p) => p.trim()).filter(Boolean);
    for (const part of pwParts) {
      const [k, v] = part.split(":").map((s) => s.trim());
      const num = parseFloat(v);
      if (!k || isNaN(num)) {
        setJsonError(`Invalid pillar_weights entry: "${part}". Expected format: "1:0.4, 2:0.3"`);
        return;
      }
      weights[k] = num;
    }

    onSave({ ...form, domain_tags: tags, pillar_weights: weights });
  }

  const field = (label: string, key: keyof UseCaseFormData, props?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="space-y-1">
      <label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">{label}</label>
      <Input
        value={String(form[key] ?? "")}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="rounded-sm font-mono text-sm"
        {...props}
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {field("Slug", "slug", { placeholder: "e.g. london-gala-dinner", pattern: "[a-z0-9_-]+" })}
        {field("Title", "title", { placeholder: "A London Gala Dinner" })}
        {field("Region Code", "region_code", { placeholder: "UK" })}
        {field("Flag Emoji", "flag_emoji", { placeholder: "🇬🇧" })}
        {field("Formality Level", "formality_level", { placeholder: "black_tie" })}
        {field("Primary Tool", "primary_tool", { placeholder: "atelier" })}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">Domain Tags (comma-separated)</label>
        <Input
          value={domainTagsInput}
          onChange={(e) => setDomainTagsInput(e.target.value)}
          placeholder="gastronomy, business, formal_events"
          className="rounded-sm font-mono text-sm"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">Pillar Weights (key:value, comma-separated)</label>
        <Input
          value={pillarWeightsInput}
          onChange={(e) => setPillarWeightsInput(e.target.value)}
          placeholder="1:0.4, 2:0.3, 3:0.2, 4:0.1"
          className="rounded-sm font-mono text-sm"
        />
        <p className="text-[11px] text-muted-foreground font-mono">Pillar numbers 1–5, weights summing to 1.0 recommended</p>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
          placeholder="A brief description shown to users…"
          className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm font-light resize-y focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">Cover Context</label>
        <textarea
          value={form.cover_context}
          onChange={(e) => setForm((f) => ({ ...f, cover_context: e.target.value }))}
          rows={2}
          placeholder="Context displayed on the cover card…"
          className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm font-light resize-y focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
      </div>

      {jsonError && (
        <p className="text-xs text-destructive font-mono flex items-center gap-1.5">
          <XCircle className="w-3.5 h-3.5 shrink-0" />{jsonError}
        </p>
      )}
      {saveError && (
        <p className="text-xs text-destructive font-mono flex items-center gap-1.5">
          <XCircle className="w-3.5 h-3.5 shrink-0" />{saveError}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={saving} className="font-serif rounded-sm gap-1.5">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save Use Case"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="font-mono text-xs rounded-sm gap-1.5" disabled={saving}>
          <X className="w-3.5 h-3.5" />Cancel
        </Button>
      </div>
    </form>
  );
}

function UseCasesTab() {
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editingUseCase, setEditingUseCase] = useState<UseCase | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchUseCases = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/use-cases`, { credentials: "include" });
      if (res.ok) {
        setUseCases(await res.json() as UseCase[]);
      } else {
        setLoadError("Could not load use cases.");
      }
    } catch {
      setLoadError("Network error loading use cases.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUseCases(); }, [fetchUseCases]);

  async function handleCreate(data: UseCaseFormData) {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/use-cases`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json() as UseCase & { error?: string };
      if (res.ok) {
        setUseCases((prev) => [...prev, json]);
        setMode("list");
      } else {
        setSaveError(json.error ?? "Failed to create use case.");
      }
    } catch {
      setSaveError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(data: UseCaseFormData) {
    if (!editingUseCase) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/use-cases/${editingUseCase.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json() as UseCase & { error?: string };
      if (res.ok) {
        setUseCases((prev) => prev.map((uc) => uc.id === editingUseCase.id ? json : uc));
        setMode("list");
        setEditingUseCase(null);
      } else {
        setSaveError(json.error ?? "Failed to update use case.");
      }
    } catch {
      setSaveError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/use-cases/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setUseCases((prev) => prev.filter((uc) => uc.id !== id));
        setDeleteId(null);
      } else {
        const json = await res.json() as { error?: string };
        setDeleteError(json.error ?? "Failed to delete.");
        setTimeout(() => setDeleteError(null), 3000);
      }
    } catch {
      setDeleteError("Network error.");
      setTimeout(() => setDeleteError(null), 3000);
    } finally {
      setDeleting(false);
    }
  }

  if (mode === "create") {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
            <Plus className="w-4 h-4" />New Use Case
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UseCaseForm
            initial={EMPTY_USE_CASE}
            onSave={handleCreate}
            onCancel={() => { setMode("list"); setSaveError(null); }}
            saving={saving}
            saveError={saveError}
          />
        </CardContent>
      </Card>
    );
  }

  if (mode === "edit" && editingUseCase) {
    const { id: _id, ...rest } = editingUseCase;
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
            <Pencil className="w-4 h-4" />Edit Use Case — <span className="text-foreground/60 font-mono">{editingUseCase.slug}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UseCaseForm
            initial={rest}
            onSave={handleEdit}
            onCancel={() => { setMode("list"); setEditingUseCase(null); setSaveError(null); }}
            saving={saving}
            saveError={saveError}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          {loading ? "Loading…" : `${useCases.length} use case${useCases.length !== 1 ? "s" : ""}`}
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="font-mono text-xs gap-1.5"
            onClick={fetchUseCases}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh
          </Button>
          <Button
            size="sm"
            className="font-mono text-xs gap-1.5"
            onClick={() => { setMode("create"); setSaveError(null); }}
          >
            <Plus className="w-3.5 h-3.5" />New Use Case
          </Button>
        </div>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 p-3 rounded-sm border border-red-200 bg-red-50 text-sm text-red-800">
          <XCircle className="w-4 h-4 shrink-0" />{loadError}
        </div>
      )}

      {loading && useCases.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-sm" />)}
        </div>
      ) : useCases.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Briefcase className="w-8 h-8 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-light text-sm">No use cases yet. Create the first one.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {useCases.map((uc) => (
            <div key={uc.id} className="border border-border/60 rounded-sm bg-card overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <div className="text-2xl shrink-0 w-10 text-center">{uc.flag_emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{uc.title}</span>
                    <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase tracking-widest bg-muted text-muted-foreground">
                      {uc.region_code}
                    </span>
                    <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-200/60">
                      {uc.formality_level}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">{uc.slug}</div>
                  {uc.domain_tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-1.5">
                      {uc.domain_tags.map((tag) => (
                        <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-primary/5 text-primary/70 border border-primary/10">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="font-mono text-xs gap-1.5 h-8"
                    onClick={() => { setEditingUseCase(uc); setMode("edit"); setSaveError(null); }}
                  >
                    <Pencil className="w-3.5 h-3.5" />Edit
                  </Button>
                  {deleteId === uc.id ? (
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="font-mono text-xs gap-1 h-8 border-red-500 bg-red-600 text-white hover:bg-red-700"
                        disabled={deleting}
                        onClick={() => handleDelete(uc.id)}
                      >
                        {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="font-mono text-xs h-8"
                        onClick={() => setDeleteId(null)}
                        disabled={deleting}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="font-mono text-xs gap-1.5 h-8 border-red-300/60 text-red-600/70 hover:bg-red-50 hover:text-red-700"
                      onClick={() => { setDeleteId(uc.id); setDeleteError(null); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />Delete
                    </Button>
                  )}
                </div>
              </div>
              {uc.description && (
                <div className="px-4 pb-3 border-t border-border/30 pt-2">
                  <p className="text-xs text-muted-foreground font-light leading-relaxed line-clamp-2">{uc.description}</p>
                </div>
              )}
              {deleteError && deleteId === uc.id && (
                <div className="px-4 pb-3">
                  <p className="text-xs text-destructive font-mono">{deleteError}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── UTM Attribution Tab ───────────────────────────────────────────────────────

interface UtmBreakdownRow {
  value: string;
  count: number;
}
interface UtmCombinedRow {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  count: number;
}
interface UtmAttributionData {
  total_users: number;
  attributed_users: number;
  unattributed_users: number;
  by_source: UtmBreakdownRow[];
  by_medium: UtmBreakdownRow[];
  by_campaign: UtmBreakdownRow[];
  by_content: UtmBreakdownRow[];
  by_term: UtmBreakdownRow[];
  top_combined: UtmCombinedRow[];
}

function AttributionTab() {
  const [data, setData] = useState<UtmAttributionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/utm-attribution`, { credentials: "include" });
      if (!res.ok) {
        setError(`Failed to load attribution data (HTTP ${res.status}).`);
        return;
      }
      setData(await res.json() as UtmAttributionData);
    } catch {
      setError("Network error while loading attribution data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function exportCsv() {
    if (!data) return;
    const lines: string[] = [];
    lines.push("dimension,value,count");
    const dump = (dim: string, rows: UtmBreakdownRow[]) =>
      rows.forEach((r) => lines.push(`${dim},"${r.value.replace(/"/g, '""')}",${r.count}`));
    dump("source", data.by_source);
    dump("medium", data.by_medium);
    dump("campaign", data.by_campaign);
    dump("content", data.by_content);
    dump("term", data.by_term);
    lines.push("");
    lines.push("utm_source,utm_medium,utm_campaign,count");
    for (const r of data.top_combined) {
      lines.push(`"${r.utm_source ?? ""}","${r.utm_medium ?? ""}","${r.utm_campaign ?? ""}",${r.count}`);
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cortea-utm-attribution-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function BreakdownTable({ title, rows }: { title: string; rows: UtmBreakdownRow[] }) {
    const max = rows.reduce((m, r) => Math.max(m, r.count), 0);
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono uppercase tracking-widest flex items-center gap-2">
            <Tag className="w-4 h-4" /> {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-xs text-muted-foreground font-light">No data yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {rows.map((r) => (
                <li key={r.value} className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex-1 truncate" title={r.value}>{r.value}</span>
                  <div className="w-32 h-1.5 bg-muted/50 rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-primary/70"
                      style={{ width: `${max > 0 ? (r.count / max) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="tabular-nums w-10 text-right text-muted-foreground">{r.count}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-sm" />)}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-destructive/5 border-destructive/30">
        <CardContent className="py-6 space-y-3">
          <p className="text-sm text-destructive font-mono">{error}</p>
          <Button size="sm" variant="outline" onClick={load} className="font-mono text-xs">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const coverage = data.total_users > 0
    ? Math.round((data.attributed_users / data.total_users) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-lg font-serif text-foreground">Campaign Attribution</h2>
          <p className="text-xs text-muted-foreground font-light">
            Where registered users found Cortéa, captured from UTM parameters at sign-up.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={load} className="font-mono text-xs">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={exportCsv} className="font-mono text-xs">
            <Upload className="w-3.5 h-3.5 mr-1.5 rotate-180" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="py-4">
            <p className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Total users</p>
            <p className="text-2xl font-serif tabular-nums">{data.total_users}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="py-4">
            <p className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Attributed</p>
            <p className="text-2xl font-serif tabular-nums">{data.attributed_users}</p>
            <p className="text-xs font-mono text-muted-foreground">{coverage}% coverage</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="py-4">
            <p className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Unattributed</p>
            <p className="text-2xl font-serif tabular-nums">{data.unattributed_users}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <BreakdownTable title="By source" rows={data.by_source} />
        <BreakdownTable title="By medium" rows={data.by_medium} />
        <BreakdownTable title="By campaign" rows={data.by_campaign} />
        <BreakdownTable title="By content" rows={data.by_content} />
        <BreakdownTable title="By term" rows={data.by_term} />
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono uppercase tracking-widest flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Top source · medium · campaign
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.top_combined.length === 0 ? (
            <p className="text-xs text-muted-foreground font-light">No combined attribution data yet.</p>
          ) : (
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-1.5 pr-3 font-normal">source</th>
                  <th className="py-1.5 pr-3 font-normal">medium</th>
                  <th className="py-1.5 pr-3 font-normal">campaign</th>
                  <th className="py-1.5 pr-3 font-normal text-right">users</th>
                </tr>
              </thead>
              <tbody>
                {data.top_combined.map((r, i) => (
                  <tr key={i} className="border-t border-border/30">
                    <td className="py-1.5 pr-3">{r.utm_source ?? "—"}</td>
                    <td className="py-1.5 pr-3">{r.utm_medium ?? "—"}</td>
                    <td className="py-1.5 pr-3">{r.utm_campaign ?? "—"}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Translation Control Panel ─────────────────────────────────────────────────

const TRANSLATION_LANGS = ["nl", "fr", "de", "es", "pt", "it", "ar", "ja", "zh"] as const;
type TransLang = typeof TRANSLATION_LANGS[number];

const TRANS_LABELS: Record<TransLang, string> = {
  nl: "NL", fr: "FR", de: "DE", es: "ES", pt: "PT",
  it: "IT", ar: "AR", ja: "JA", zh: "ZH",
};

interface RegCoverage { count: number; pct: number }
interface QualityMetrics {
  avg_score: number;
  pct_passed: number | null;
  pct_rewritten: number | null;
  per_register?: Record<string, { avg_score?: number; pct_passed?: number } | unknown> | null;
}
interface LangCoverage {
  lang: TransLang; count: number; pct: number; last_run?: unknown;
  by_register?: Record<string, RegCoverage>;
  quality_metrics?: QualityMetrics | null;
  previous_quality_metrics?: QualityMetrics | null;
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
  ok: boolean; total: number;
  langs: LangCoverage[];
  last_run?: { started_at: string; status: string; items_processed: number; estimated_usd: number };
}
interface CompassStatus {
  ok: boolean; total: number;
  langs: LangCoverage[];
  last_run?: { started_at: string; status: string; items_processed: number; estimated_usd: number };
}
interface CounselDomainCoverage {
  domain: string; active: number; draft: number; missing: number; pct: number;
}
interface CounselSeedCoverageStatus {
  ok: boolean; total_regions: number;
  domains: CounselDomainCoverage[];
  last_run?: { started_at: string; status: string; items_processed: number; estimated_usd: number } | null;
}
interface CounselSeedTransStatus {
  ok: boolean; total: number;
  langs: LangCoverage[];
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
  // Thresholds: ≥85% green, 50–84% amber, <50% red
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
  // Thresholds: ≥8.0 green, 7.0–7.9 orange, <7.0 red (per task spec)
  const colorClass =
    score >= 8.0 ? "bg-emerald-500/15 text-emerald-700 border-emerald-300/40" :
    score >= 7.0 ? "bg-amber-500/15 text-amber-700 border-amber-300/40" :
                   "bg-rose-500/15 text-rose-700 border-rose-300/40";
  const passed = metrics.pct_passed != null ? `${Math.round(metrics.pct_passed)}% direct geslaagd` : null;
  const rewritten = metrics.pct_rewritten != null ? `${Math.round(metrics.pct_rewritten)}% herschreven` : null;

  const delta = previous != null ? +(score - previous.avg_score).toFixed(2) : null;
  const deltaTip = delta != null
    ? `prev avg ${previous!.avg_score.toFixed(1)} → now ${score.toFixed(1)} (${delta >= 0 ? "+" : ""}${delta.toFixed(1)})`
    : null;

  const tooltip = [
    `avg ${score.toFixed(1)}/10`,
    passed,
    rewritten,
    deltaTip,
  ].filter(Boolean).join(" · ");

  return (
    <span
      title={tooltip}
      className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded border text-[10px] font-mono tabular-nums cursor-default ${colorClass}`}
    >
      {score.toFixed(1)}
      {delta != null && Math.abs(delta) >= 0.05 && (
        <span className={delta > 0 ? "text-emerald-600" : "text-rose-600"}>
          {delta > 0 ? "↑" : "↓"}
        </span>
      )}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    ok: "bg-emerald-500/15 text-emerald-700",
    partial: "bg-amber-500/15 text-amber-700",
    budget_capped: "bg-blue-500/15 text-blue-700",
    failed: "bg-rose-500/15 text-rose-700",
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

// ── Cost / time helpers ───────────────────────────────────────────────────────
function fmtUsd(n: number) { return n < 0.01 ? "<$0.01" : `~$${n.toFixed(2)}`; }
function fmtMin(min: number) {
  if (min < 1) return "<1 min";
  if (min < 60) return `~${Math.ceil(min)} min`;
  const h = Math.floor(min / 60), m = Math.round(min % 60);
  return m > 0 ? `~${h}u ${m}m` : `~${h}u`;
}

// ── Coverage panel for one content type ──────────────────────────────────────
interface CoverageCardProps {
  title: string;
  description: string;
  actionLabel: string;
  total: number;
  langs: LangCoverage[];
  sweeper: string;
  showRegisterBars?: boolean;
  costPerItem: number;
  itemsPerMinute: number;
  onTranslateAll: () => Promise<void>;
  onTranslateLang: (lang: TransLang) => Promise<void>;
  launching: string | null;
  lastRun?: { started_at: string; status: string; items_processed: number; estimated_usd: number } | null;
  hideAllButton?: boolean;
  activeSweepers?: Set<string>;
}
function CoverageCard({
  title, description, actionLabel, total, langs, sweeper, showRegisterBars,
  costPerItem, itemsPerMinute,
  onTranslateAll, onTranslateLang, launching, lastRun, hideAllButton,
  activeSweepers,
}: CoverageCardProps) {
  // Derive active state from DB-sourced worker_runs (finished_at === null)
  // sweeper = "ltq-translation" → checks "ltq-translation" (orchestrator) or "ltq-translation-nl" etc.
  const isModuleActive = activeSweepers
    ? [...activeSweepers].some((s) => s === sweeper || s.startsWith(`${sweeper}-`))
    : false;
  const isLangActive = (lang: string) =>
    activeSweepers
      ? activeSweepers.has(`${sweeper}-${lang}`) || activeSweepers.has(sweeper)
      : false;

  // allDone = every lang is 100% translated (used for button variant + copy)
  // 85/50 thresholds are for color bars only — not completion semantics
  const allDone = langs.every((l) => l.pct >= 100);
  const totalRemaining = langs.reduce((s, l) => s + Math.max(0, total - l.count), 0);
  const totalEstCost = totalRemaining * costPerItem;
  const totalEstMin  = totalRemaining / itemsPerMinute;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
            <p className="text-xs text-muted-foreground leading-snug">{description}</p>

            {/* wat doet de vertaalknop */}
            <div className="flex items-start gap-1.5 mt-1.5 px-2 py-1.5 rounded bg-muted/50 border border-border/40">
              <Play className="w-3 h-3 mt-0.5 shrink-0 text-primary/60" />
              <p className="text-[11px] text-muted-foreground leading-snug">
                <span className="font-medium text-foreground/80">De ▶-knop per taal</span> {actionLabel}
              </p>
            </div>

            {/* bron + kosten totaal */}
            <p className="text-[11px] font-mono text-muted-foreground/70 pt-0.5">
              Bron: {total.toLocaleString()} EN-rijen
              {!allDone && totalRemaining > 0 && (
                <> · nog {totalRemaining.toLocaleString()} te vertalen · {fmtUsd(totalEstCost)} · {fmtMin(totalEstMin)}</>
              )}
              {lastRun && (
                <> · laatste run {formatRelative(lastRun.started_at)} · <StatusPill status={lastRun.status} /></>
              )}
            </p>
          </div>
          {!hideAllButton && (
            <Button
              size="sm"
              variant={allDone ? "outline" : "default"}
              className="font-mono text-xs gap-1.5 shrink-0"
              disabled={launching !== null || isModuleActive}
              onClick={onTranslateAll}
              title={isModuleActive
                ? "Een vertaalworker is momenteel actief voor deze module — wacht tot die klaar is."
                : `Start vertaalworker voor alle 9 talen. Geschatte kosten: ${fmtUsd(totalEstCost)}, duur: ${fmtMin(totalEstMin)}.`}
            >
              {(launching === "all" || isModuleActive) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Alle talen vertalen
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-x-4 gap-y-4">
          {langs.map((l) => {
            const remaining = Math.max(0, total - l.count);
            const estCost   = remaining * costPerItem;
            const estMin    = remaining / itemsPerMinute;
            const tooltip   = remaining > 0
              ? `Start DB-vertaling voor ${l.lang.toUpperCase()}: ${remaining.toLocaleString()} rijen nog te vertalen. Geschat: ${fmtUsd(estCost)} · ${fmtMin(estMin)}.`
              : `${l.lang.toUpperCase()} is volledig vertaald.`;
            return (
              <div key={l.lang} className="space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-xs font-mono font-semibold text-foreground/80">{TRANS_LABELS[l.lang]}</span>
                    {l.quality_metrics && <QualityBadge metrics={l.quality_metrics} previous={l.previous_quality_metrics} />}
                  </div>
                  <button
                    className="text-[10px] font-mono text-primary/70 hover:text-primary disabled:opacity-40 transition-colors shrink-0"
                    disabled={launching !== null || isLangActive(l.lang) || remaining === 0}
                    onClick={() => onTranslateLang(l.lang)}
                    title={isLangActive(l.lang) ? `Een vertaalworker voor ${l.lang.toUpperCase()} is actief — wacht tot die klaar is.` : tooltip}
                  >
                    {(launching === l.lang || isLangActive(l.lang)) ? <Loader2 className="w-3 h-3 animate-spin inline" /> : "▶"}
                  </button>
                </div>
                <CovBar pct={l.pct} count={l.count} />
                {remaining > 0 && (
                  <p className="text-[9px] font-mono text-muted-foreground/50 tabular-nums leading-tight">
                    {remaining.toLocaleString()} rijen · {fmtUsd(estCost)}
                    <br />{fmtMin(estMin)}
                  </p>
                )}
                {showRegisterBars && l.by_register && (
                  <div className="space-y-1 pt-0.5">
                    {(["middle_class", "elite"] as const).map((reg) => {
                      const rv = l.by_register![reg] ?? { count: 0, pct: 0 };
                      return (
                        <div key={reg} className="space-y-0.5">
                          <p className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-wide">
                            {reg === "middle_class" ? "Middenklasse" : "Elite"}
                          </p>
                          <div className="h-1 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${reg === "middle_class" ? "bg-blue-400" : "bg-purple-400"}`}
                              style={{ width: `${Math.min(100, rv.pct)}%` }}
                            />
                          </div>
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

// ── Atelier-distillaten domain coverage card ──────────────────────────────────

const COUNSEL_DOMAIN_LABELS: Record<string, string> = {
  gastronomy:          "Gastronomie",
  business:            "Zakelijk",
  eloquence:           "Welsprekendheid",
  formal_events:       "Formele gelegenheden",
  dress_code:          "Kledingcode",
  cultural_knowledge:  "Culturele kennis",
};

const SEED_COST_PER_REGION = 0.008;
const SEED_REGIONS_PER_MIN = 8;

interface DomainCoverageCardProps {
  data: CounselSeedCoverageStatus;
  launching: string | null;
  onGenerateAll: () => Promise<void>;
  onGenerateDomain: (domain: string) => Promise<void>;
}

function DomainCoverageCard({ data, launching, onGenerateAll, onGenerateDomain }: DomainCoverageCardProps) {
  const totalMissing    = data.domains.reduce((s, d) => s + d.missing, 0);
  const totalEstCost    = totalMissing * SEED_COST_PER_REGION;
  const totalEstMin     = totalMissing / SEED_REGIONS_PER_MIN;
  const allActive       = data.domains.every((d) => d.missing === 0 && d.draft === 0 && d.active === data.total_regions);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold text-foreground">Atelier-distillaten (Regio-dekking)</CardTitle>
            <p className="text-xs text-muted-foreground leading-snug">
              Per regio × domein kennisdistillaat dat de Counsel-AI voedt. Actieve seeds worden automatisch als context meegestuurd bij elke Counsel-sessie. Bron: {data.total_regions} gepubliceerde landen × 6 domeinen = {(data.total_regions * 6).toLocaleString()} mogelijke seeds.
            </p>

            <div className="flex items-start gap-1.5 mt-1.5 px-2 py-1.5 rounded bg-muted/50 border border-border/40">
              <Play className="w-3 h-3 mt-0.5 shrink-0 text-primary/60" />
              <p className="text-[11px] text-muted-foreground leading-snug">
                <span className="font-medium text-foreground/80">De ▶-knop per domein</span> start de counsel-seed-worker voor alle ontbrekende regio's in dat domein. De worker distilleert de Engelstalige oefenvragen voor die regio naar een gestructureerd kennisoverzicht. Nieuwe seeds verschijnen in 'draft' — promoveer ze via de Atelier-distillaten tab.
              </p>
            </div>

            <p className="text-[11px] font-mono text-muted-foreground/70 pt-0.5">
              {totalMissing > 0
                ? <>nog {totalMissing.toLocaleString()} regio×domein te genereren · {fmtUsd(totalEstCost)} · {fmtMin(totalEstMin)}</>
                : <>Alle domeinen volledig gedistilleerd</>
              }
              {data.last_run && (
                <> · laatste run {formatRelative(data.last_run.started_at)} · <StatusPill status={data.last_run.status} /></>
              )}
            </p>
          </div>

          <Button
            size="sm"
            variant={allActive ? "outline" : "default"}
            className="font-mono text-xs gap-1.5 shrink-0"
            disabled={launching !== null || totalMissing === 0}
            onClick={onGenerateAll}
            title={`Start batch-worker voor alle domeinen. Geschatte kosten: ${fmtUsd(totalEstCost)}, duur: ${fmtMin(totalEstMin)}.`}
          >
            {launching === "all" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Alle domeinen aanvullen
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {data.domains.map((d) => {
            const estCost = d.missing * SEED_COST_PER_REGION;
            const estMin  = d.missing / SEED_REGIONS_PER_MIN;
            const color   = d.pct >= 100 ? "bg-emerald-500" : d.pct >= 50 ? "bg-amber-500" : "bg-rose-500";
            const isDone  = d.missing === 0;
            return (
              <div key={d.domain} className="flex items-center gap-3">
                <div className="w-32 shrink-0">
                  <span className="text-xs font-mono text-foreground/80">{COUNSEL_DOMAIN_LABELS[d.domain] ?? d.domain}</span>
                </div>
                <div className="flex-1 space-y-0.5 min-w-0">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${Math.min(100, d.pct)}%` }} />
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground tabular-nums">
                    {d.active} actief · {d.draft} draft · {d.missing} ontbreekt
                    {d.missing > 0 && <> · {fmtUsd(estCost)} · {fmtMin(estMin)}</>}
                  </p>
                </div>
                <div className="w-8 shrink-0 text-right">
                  <button
                    className="text-[10px] font-mono text-primary/70 hover:text-primary disabled:opacity-40 transition-colors"
                    disabled={launching !== null || isDone}
                    onClick={() => onGenerateDomain(d.domain)}
                    title={isDone ? `${COUNSEL_DOMAIN_LABELS[d.domain]} is volledig.` : `Genereer seeds voor alle ontbrekende regio's in ${COUNSEL_DOMAIN_LABELS[d.domain]}. ${d.missing} regio's · ${fmtUsd(estCost)} · ${fmtMin(estMin)}.`}
                  >
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

// ── Human-readable sweeper display names ──────────────────────────────────────
function sweeperLabel(sweeper: string): string {
  if (sweeper.startsWith("ltq-translation-")) {
    const lang = sweeper.replace("ltq-translation-", "").toUpperCase();
    return `Oefenvragen ${lang}`;
  }
  if (sweeper === "scenario-translation") return "Scenario's (alle talen)";
  if (sweeper === "compass-content-translation") return "Landenprotocollen";
  if (sweeper.startsWith("compass-content-translation-")) {
    const lang = sweeper.replace("compass-content-translation-", "").toUpperCase();
    return `Landenprotocollen ${lang}`;
  }
  if (sweeper === "compass-translation")  return "Landenprotocollen";
  if (sweeper === "counsel-seed")             return "Atelier-distillaten";
  if (sweeper === "counsel-seed-translation") return "Atelier-distillaten (Vertaling)";
  return sweeper;
}

// ── Worker Runs Log ───────────────────────────────────────────────────────────
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
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border/40">
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
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => {
                  const meta = (r.metadata ?? {}) as Record<string, unknown>;
                  const avgScore = typeof meta.avg_score === "number" ? meta.avg_score
                    : typeof meta.avg_quality_score === "number" ? meta.avg_quality_score : null;
                  const pctPassed = typeof meta.pct_passed_first_try === "number" ? meta.pct_passed_first_try : null;
                  const scoreLow = avgScore !== null && avgScore < 7.5;
                  const scoreColor = avgScore === null ? "" :
                    avgScore >= 8.0 ? "text-emerald-700" :
                    avgScore >= 7.0 ? "text-amber-700" : "text-rose-700";

                  // Extract module / taal / register / regio from sweeper + metadata.
                  // Sweeper suffix is reliable for LTQ (ltq-translation-nl).
                  // For Scenario/Compass the sweeper is unsuffixed; use metadata.lang.
                  const metaLang = typeof meta.lang === "string" ? meta.lang.toUpperCase() : null;
                  const swLang = r.sweeper.startsWith("ltq-translation-")
                    ? r.sweeper.replace("ltq-translation-", "").toUpperCase()
                    : r.sweeper.startsWith("scenario-translation-")
                    ? r.sweeper.replace("scenario-translation-", "").toUpperCase()
                    : r.sweeper.startsWith("compass-content-translation-")
                    ? r.sweeper.replace("compass-content-translation-", "").toUpperCase()
                    : metaLang;
                  const moduleName = r.sweeper.startsWith("ltq-translation") ? "LTQ"
                    : r.sweeper.startsWith("scenario-translation") ? "Scenario"
                    : r.sweeper.startsWith("compass-content-translation") || r.sweeper.startsWith("compass-translation") ? "Compass"
                    : r.sweeper.startsWith("counsel-seed-translation") ? "Atelier (trans.)"
                    : r.sweeper === "counsel-seed" ? "Atelier (gen.)"
                    : sweeperLabel(r.sweeper);
                  const metaRegister = typeof meta.register === "string" ? meta.register
                    : typeof meta.registers === "string" ? meta.registers : null;
                  const metaRegion = typeof meta.region === "string" ? meta.region
                    : typeof meta.region_code === "string" ? meta.region_code : null;
                  const registerLabel = metaRegister === "middle_class" ? "Midden"
                    : metaRegister === "elite" ? "Elite" : metaRegister ?? "—";

                  // Duration: finished_at - started_at in minutes
                  let duurLabel = "—";
                  if (r.finished_at) {
                    const ms = new Date(r.finished_at).getTime() - new Date(r.started_at).getTime();
                    const mins = Math.round(ms / 60000);
                    duurLabel = mins < 1 ? "<1 min" : `${mins} min`;
                  } else if (r.status !== "failed") {
                    duurLabel = "⏳";
                  }

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

// ── LTQ Region × Register grid ────────────────────────────────────────────────
// Rows = BE-middenklasse / BE-elite / AE-middenklasse / AE-elite
// Columns = 9 target languages
// Each cell shows: mini progress bar + count/total + pct (+ quality when available)

const LTQ_GRID_ROWS = [
  { region: "BE", register: "middle_class", label: "BE Middenklasse" },
  { region: "BE", register: "elite",        label: "BE Elite" },
  { region: "AE", register: "middle_class", label: "AE Middenklasse" },
  { region: "AE", register: "elite",        label: "AE Elite" },
] as const;

function LtqRegisterGrid({
  ltq,
  onTranslateLang,
  onTranslateRow,
  onTranslateCell,
  launching,
  rowLaunching,
  cellLaunching,
  activeSweepers,
}: {
  ltq: LtqStatus;
  onTranslateLang: (lang: TransLang) => Promise<void>;
  onTranslateRow: (region: string, register: string) => Promise<void>;
  onTranslateCell: (lang: TransLang, region: string, register: string) => Promise<void>;
  launching: string | null;
  rowLaunching: string | null;
  cellLaunching: string | null;
  activeSweepers: Set<string>;
}) {
  const grid = ltq.region_register_grid ?? {};
  const enGrid = ltq.en_by_region_register ?? {};
  // grid_quality[region][register][lang] = { avg_score, pct_passed, pct_rewritten } | null
  const gridQuality = (ltq as Record<string, unknown>).grid_quality as
    Record<string, Record<string, Record<string, { avg_score: number; pct_passed: number | null } | null>>> | undefined;

  const anyBusy = launching !== null || rowLaunching !== null || cellLaunching !== null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono border-separate border-spacing-0">
        <thead>
          <tr>
            {/* Row header column — includes a blank for the "Alle talen" sub-header */}
            <th className="py-1.5 pr-3 text-left font-normal text-muted-foreground text-[10px] uppercase tracking-wide w-40">Register</th>
            {TRANSLATION_LANGS.map((lang) => {
              const isActive = activeSweepers.has(`ltq-translation-${lang}`) || activeSweepers.has("ltq-translation");
              return (
                <th key={lang} className="py-1.5 px-1 font-normal text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[10px] font-semibold text-foreground/70">{lang.toUpperCase()}</span>
                    <button
                      className="text-[9px] text-primary/60 hover:text-primary disabled:opacity-30 transition-colors"
                      disabled={anyBusy || isActive}
                      onClick={() => onTranslateLang(lang)}
                      title={isActive
                        ? `LTQ-worker voor ${lang.toUpperCase()} is actief`
                        : `Start LTQ-vertaling voor ${lang.toUpperCase()} (alle regio's + registers)`}
                    >
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
            // rowActive = any ltq-translation-* worker is currently running (not just orchestrator)
            const rowActive = [...activeSweepers].some((s) => s.startsWith("ltq-translation"));
            const rowBusy = rowLaunching === rowKey;
            // Count how many langs are missing for this row
            const missingLangs = TRANSLATION_LANGS.filter((lang) => {
              const cell = rowData[lang] ?? { count: 0, pct: 0 };
              return cell.pct < 100;
            });
            return (
              <tr key={rowKey} className="border-t border-border/20">
                <td className="py-2 pr-3 align-top">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-medium text-foreground/80 leading-tight">{label}</span>
                    {enTotal > 0 && (
                      <span className="text-[9px] font-mono text-muted-foreground/60">{enTotal.toLocaleString()} EN</span>
                    )}
                    {/* Row-level "alle ontbrekende talen" button */}
                    {missingLangs.length > 0 && enTotal > 0 && (
                      <button
                        className="flex items-center gap-0.5 text-[9px] font-mono text-primary/60 hover:text-primary disabled:opacity-30 transition-colors mt-0.5"
                        disabled={anyBusy || rowActive}
                        onClick={() => onTranslateRow(region, register)}
                        title={rowActive
                          ? `Worker voor ${label} is actief`
                          : `Alle ${missingLangs.length} ontbrekende talen vertalen voor ${label}`}
                      >
                        {(rowBusy || rowActive)
                          ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          : <Play className="w-2.5 h-2.5" />}
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
                  // Use per-(region, register, lang) quality from grid_quality; fall back to lang-level
                  const cellQual = gridQuality?.[region]?.[register]?.[lang] ?? null;
                  const qualScore = cellQual?.avg_score ?? null;
                  const qualColor = qualScore === null ? "" :
                    qualScore >= 8.0 ? "text-emerald-700" :
                    qualScore >= 7.0 ? "text-amber-700" : "text-rose-700";
                  const cellKey = `${rowKey}-${lang}`;
                  const cellActive = activeSweepers.has(`ltq-translation-${lang}`) || rowActive;
                  const cellBusy = cellLaunching === cellKey;
                  const remaining = enTotal > 0 ? Math.max(0, enTotal - cell.count) : 0;
                  return (
                    <td key={lang} className={`py-2 px-1 text-center align-top ${cellBg}`}>
                      <div className="flex flex-col items-center gap-0.5 min-w-[38px]">
                        <div className="h-1 w-9 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${barColor} transition-all duration-500`}
                            style={{ width: `${Math.min(100, cell.pct)}%` }} />
                        </div>
                        <span className={`tabular-nums text-[9px] ${isRed ? "text-rose-600 font-medium" : isOrange ? "text-amber-700" : "text-muted-foreground"}`}>
                          {cell.count}/{enTotal > 0 ? enTotal : "?"}
                        </span>
                        <span className="tabular-nums text-[9px] text-muted-foreground/60">{cell.pct}%</span>
                        {qualScore !== null && (
                          <span
                            className={`text-[8px] tabular-nums leading-none ${qualColor}`}
                            title={`Kwaliteitsscore (${register === "middle_class" ? "middenklasse" : "elite"} / ${lang.toUpperCase()}): ${qualScore.toFixed(1)}/10`}
                          >
                            ⭐{qualScore.toFixed(1)}
                          </span>
                        )}
                        {/* Per-cell translate button — only shown when there's work to do */}
                        {remaining > 0 && (
                          <button
                            className="text-[8px] text-primary/50 hover:text-primary disabled:opacity-25 transition-colors mt-0.5"
                            disabled={anyBusy || cellActive}
                            onClick={() => onTranslateCell(lang, region, register)}
                            title={cellActive
                              ? `Worker voor ${lang.toUpperCase()} / ${label} is actief`
                              : `${remaining.toLocaleString()} rijen vertalen (${lang.toUpperCase()} / ${label})`}
                          >
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

// ── Main Translation Control Panel component ──────────────────────────────────
function TranslationHealthTab() {
  const [ltq, setLtq]             = useState<LtqStatus | null>(null);
  const [scen, setScen]           = useState<ScenarioStatus | null>(null);
  const [compass, setCompass]     = useState<CompassStatus | null>(null);
  const [counselSeeds, setCounselSeeds] = useState<CounselSeedCoverageStatus | null>(null);
  const [counselSeedTrans, setCounselSeedTrans] = useState<CounselSeedTransStatus | null>(null);
  const [runs, setRuns]           = useState<WorkerRun[]>([]);
  const [activeRuns, setActiveRuns] = useState<WorkerRun[]>([]);
  const [loading, setLoading]     = useState(false);
  const [err, setErr]             = useState<string | null>(null);

  const [weekCostUsd, setWeekCostUsd]           = useState<number | null>(null);

  const [ltqLaunching, setLtqLaunching]         = useState<string | null>(null);
  const [scenLaunching, setScenLaunching]       = useState<string | null>(null);
  const [compassLaunching, setCompassLaunching] = useState<string | null>(null);
  const [seedsLaunching, setSeedsLaunching]         = useState<string | null>(null);
  const [seedTransLaunching, setSeedTransLaunching] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [workerTarget, setWorkerTarget] = useState<"dev" | "prod">("dev");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [ltqRes, scenRes, compassRes, seedsRes, seedsTransRes, runsRes, activeRunsRes, weekCostRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/ltq/translation-status`,              { credentials: "include" }),
        fetch(`${API_BASE}/api/admin/scenarios/translation-status`,        { credentials: "include" }),
        fetch(`${API_BASE}/api/admin/compass/translation-status`,          { credentials: "include" }),
        fetch(`${API_BASE}/api/admin/counsel-seeds/coverage`,              { credentials: "include" }),
        fetch(`${API_BASE}/api/admin/counsel-seeds/translation-status`,    { credentials: "include" }),
        fetch(`${API_BASE}/api/admin/worker-runs?limit=50`,                { credentials: "include" }),
        fetch(`${API_BASE}/api/admin/worker-runs?active=1`,                { credentials: "include" }),
        fetch(`${API_BASE}/api/admin/translation/week-cost`,               { credentials: "include" }),
      ]);
      if (ltqRes.ok)         setLtq(await ltqRes.json() as LtqStatus);
      if (scenRes.ok)        setScen(await scenRes.json() as ScenarioStatus);
      if (compassRes.ok)     setCompass(await compassRes.json() as CompassStatus);
      if (seedsRes.ok)       setCounselSeeds(await seedsRes.json() as CounselSeedCoverageStatus);
      if (seedsTransRes.ok)  setCounselSeedTrans(await seedsTransRes.json() as CounselSeedTransStatus);
      if (runsRes.ok)        setRuns(((await runsRes.json()) as { runs: WorkerRun[] }).runs);
      if (activeRunsRes.ok)  setActiveRuns(((await activeRunsRes.json()) as { runs: WorkerRun[] }).runs);
      if (weekCostRes.ok)    setWeekCostUsd(((await weekCostRes.json()) as { week_usd: number }).week_usd);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 30_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  // LTQ launchers
  const targetParam = workerTarget === "prod" ? { target: "prod" as const } : {};

  const launchLtqAll = async () => {
    setLtqLaunching("all");
    try {
      const res = await fetch(`${API_BASE}/api/admin/ltq/translate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parallel: 2, ...targetParam }),
      });
      const d = await res.json();
      showToast(d.message ?? "LTQ orchestrator launched.");
    } catch { showToast("Failed to launch LTQ orchestrator."); }
    finally { setLtqLaunching(null); }
  };
  const launchLtqLang = async (lang: TransLang) => {
    setLtqLaunching(lang);
    try {
      const res = await fetch(`${API_BASE}/api/admin/ltq/translate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, ...targetParam }),
      });
      const d = await res.json();
      showToast(d.message ?? `LTQ [${lang}] launched.`);
    } catch { showToast(`Failed to launch LTQ [${lang}].`); }
    finally { setLtqLaunching(null); }
  };

  // Row-level launcher: all missing languages for one region × register row
  const [ltqRowLaunching, setLtqRowLaunching] = useState<string | null>(null);
  const launchLtqRow = async (region: string, register: string) => {
    const key = `${region}-${register}`;
    setLtqRowLaunching(key);
    try {
      const res = await fetch(`${API_BASE}/api/admin/ltq/translate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region_code: region, register, ...targetParam }),
      });
      const d = await res.json();
      showToast(d.message ?? `LTQ ${key} (alle ontbrekende talen) gestart.`);
    } catch { showToast(`Kon LTQ ${key} niet starten.`); }
    finally { setLtqRowLaunching(null); }
  };

  // Cell-level launcher: specific lang × region × register
  const [ltqCellLaunching, setLtqCellLaunching] = useState<string | null>(null);
  const launchLtqCell = async (lang: TransLang, region: string, register: string) => {
    const key = `${region}-${register}-${lang}`;
    setLtqCellLaunching(key);
    try {
      const res = await fetch(`${API_BASE}/api/admin/ltq/translate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, region_code: region, register, ...targetParam }),
      });
      const d = await res.json();
      showToast(d.message ?? `LTQ ${lang.toUpperCase()} / ${region} ${register} gestart.`);
    } catch { showToast(`Kon LTQ ${lang}/${region}/${register} niet starten.`); }
    finally { setLtqCellLaunching(null); }
  };

  // Scenario launchers
  const launchScenAll = async () => {
    setScenLaunching("all");
    try {
      const res = await fetch(`${API_BASE}/api/admin/scenarios/translate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...targetParam }),
      });
      const d = await res.json();
      showToast(d.message ?? "Scenario worker launched.");
    } catch { showToast("Failed to launch scenario worker."); }
    finally { setScenLaunching(null); }
  };
  const launchScenLang = async (lang: TransLang) => {
    setScenLaunching(lang);
    try {
      const res = await fetch(`${API_BASE}/api/admin/scenarios/translate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, ...targetParam }),
      });
      const d = await res.json();
      showToast(d.message ?? `Scenario [${lang}] launched.`);
    } catch { showToast(`Failed to launch scenario [${lang}].`); }
    finally { setScenLaunching(null); }
  };

  // Compass launchers
  const launchCompassAll = async () => {
    setCompassLaunching("all");
    try {
      const res = await fetch(`${API_BASE}/api/admin/compass/translate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...targetParam }),
      });
      const d = await res.json();
      showToast(d.message ?? "Compass worker launched.");
    } catch { showToast("Failed to launch compass worker."); }
    finally { setCompassLaunching(null); }
  };
  const launchCompassLang = async (lang: TransLang) => {
    setCompassLaunching(lang);
    try {
      const res = await fetch(`${API_BASE}/api/admin/compass/translate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, ...targetParam }),
      });
      const d = await res.json();
      showToast(d.message ?? `Compass [${lang}] launched.`);
    } catch { showToast(`Failed to launch compass [${lang}].`); }
    finally { setCompassLaunching(null); }
  };

  // Counsel seed translation launcher (per-lang only, no "all" button per cost policy)
  const launchSeedTransLang = async (lang: TransLang) => {
    setSeedTransLaunching(lang);
    try {
      const res = await fetch(`${API_BASE}/api/admin/counsel-seeds/translate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang }),
      });
      const d = await res.json();
      showToast(d.message ?? `Vertaalworker voor Atelier-distillaten [${lang.toUpperCase()}] gestart.`);
    } catch { showToast(`Kon vertaalworker voor [${lang.toUpperCase()}] niet starten.`); }
    finally { setSeedTransLaunching(null); }
  };

  // Counsel seed launchers
  const launchSeedsAll = async () => {
    setSeedsLaunching("all");
    try {
      const res = await fetch(`${API_BASE}/api/admin/counsel-seeds/generate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const d = await res.json();
      showToast(d.message ?? "Counsel seed batch worker gestart.");
    } catch { showToast("Kon counsel seed worker niet starten."); }
    finally { setSeedsLaunching(null); }
  };
  const launchSeedsDomain = async (domain: string) => {
    setSeedsLaunching(domain);
    try {
      const res = await fetch(`${API_BASE}/api/admin/counsel-seeds/generate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      const d = await res.json();
      showToast(d.message ?? `Counsel seed worker voor [${domain}] gestart.`);
    } catch { showToast(`Kon counsel seed worker voor [${domain}] niet starten.`); }
    finally { setSeedsLaunching(null); }
  };

  // ── Active-worker detection — dedicated ?active=1 fetch (no row-count limit) ──────────
  // Uses a separate API call that returns ONLY running rows (finished_at IS NULL, status='running')
  // so it cannot miss workers that have been pushed past the history limit=50 window.
  const activeSweepers = new Set(activeRuns.map((r) => r.sweeper));

  // allGreen = every module + lang at 100% (completion truth, not color threshold)
  const allGreen = ltq && scen && compass
    && ltq.langs.every((l) => l.pct >= 100)
    && scen.langs.every((l) => l.pct >= 100)
    && compass.langs.every((l) => l.pct >= 100);

  // ── Weekly cost — comes from dedicated backend endpoint (no row limit) ──────
  const weekCost = weekCostUsd ?? 0;

  // ── Backlog cost estimate — sum remaining work across ALL 9 target langs per module ──
  // Each language that isn't fully translated contributes its remaining items × rate.
  const ltqBacklog = ltq
    ? ltq.langs.reduce((s, l) => s + Math.max(0, ltq.en_total - l.count), 0)
    : 0;
  const scenBacklog = scen
    ? scen.langs.reduce((s, l) => s + Math.max(0, scen.total - l.count), 0)
    : 0;
  const compassBacklog = compass
    ? compass.langs.reduce((s, l) => s + Math.max(0, compass.total - l.count), 0)
    : 0;
  const backlogCost = ltqBacklog * 0.006 + scenBacklog * 0.005 + compassBacklog * 0.011;

  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background text-xs font-mono px-4 py-2.5 rounded-sm shadow-lg animate-in slide-in-from-bottom-2 duration-200">
          {toast}
        </div>
      )}

      {/* Header + cost summary */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-serif text-foreground">Vertalingen</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Beheer de AI-vertalingen van oefenvragen, etiquettescenario's en landenprotocollen naar 9 talen.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Cost summary badges — always rendered (shows $0.00 when no runs yet) */}
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground border border-border/60 rounded-sm px-2.5 py-1.5 bg-muted/20">
            <span className="text-foreground/60 uppercase tracking-wide">AI-kosten</span>
            <span className="text-foreground font-medium">
              ${weekCost.toFixed(2)}
              <span className="text-muted-foreground font-normal"> / 7 dagen</span>
            </span>
            {backlogCost > 0.01 && (
              <>
                <span className="text-border">·</span>
                <span className="text-amber-700">
                  ~${backlogCost.toFixed(2)}
                  <span className="text-muted-foreground font-normal"> achterstand</span>
                </span>
              </>
            )}
          </div>
          {/* Omgeving selector — controls which DB workers write to */}
          <div className="flex items-center gap-1.5 text-[10px] font-mono border border-border/60 rounded-sm px-2 py-1.5 bg-muted/20">
            <span className="text-foreground/60 uppercase tracking-wide">Omgeving</span>
            <select
              value={workerTarget}
              onChange={(e) => setWorkerTarget(e.target.value as "dev" | "prod")}
              className={`bg-transparent border-none outline-none font-mono text-[10px] cursor-pointer ${workerTarget === "prod" ? "text-rose-600 font-semibold" : "text-foreground"}`}
            >
              <option value="dev">dev</option>
              <option value="prod">prod</option>
            </select>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="font-mono text-xs gap-1.5"
            onClick={fetchAll}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall health pill */}
      {(ltq || scen || compass) && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-sm text-xs font-mono border ${allGreen ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-700" : "border-amber-500/40 bg-amber-500/5 text-amber-700"}`}>
          {allGreen ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
          {allGreen ? "Alle inhoud is volledig vertaald in alle 9 talen." : "Sommige talen zijn nog niet vertaald — gebruik de knoppen hieronder om een vertaalrun te starten."}
        </div>
      )}

      {err && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-3 text-xs font-mono text-destructive">{err}</CardContent>
        </Card>
      )}

      {/* LTQ */}
      {ltq && (
        <>
          <CoverageCard
            title="Oefenvragen (DB-vertaling)"
            description="De Engelstalige oefenvragen in de database worden door AI vertaald naar de gekozen taal. Middenklasse- en elite-vragen zitten als aparte rijen in de DB en worden beide in één run vertaald. Dit is géén Atelier-omschrijving — die pipeline zit in de Atelier-distillaten tab."
            actionLabel="start de DB-vertaling voor die taal: alle onvertaalde Engelstalige oefenvragen (middenklasse + elite) worden naar die taal vertaald. De kwaliteit wordt automatisch gecheckt en bij een score onder 8/10 herschreven."
            total={ltq.en_total}
            langs={ltq.langs as LangCoverage[]}
            sweeper="ltq-translation"
            showRegisterBars
            costPerItem={0.006}
            itemsPerMinute={20}
            onTranslateAll={launchLtqAll}
            onTranslateLang={launchLtqLang}
            launching={ltqLaunching}
            activeSweepers={activeSweepers}
          />
          {/* Region × Register grid — only shown when grid data is available */}
          {ltq.region_register_grid && Object.keys(ltq.region_register_grid).length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                  <Grid2x2 className="w-4 h-4" /> Regio × Register dekking
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Vertaaldekking per regio-register combinatie. Klik ▶ per taal om een run te starten.
                  Kwaliteitsscore (⭐) toont het gemiddelde van de laatste run per register per taal.
                </p>
              </CardHeader>
              <CardContent>
                <LtqRegisterGrid
                  ltq={ltq}
                  onTranslateLang={launchLtqLang}
                  onTranslateRow={launchLtqRow}
                  onTranslateCell={launchLtqCell}
                  launching={ltqLaunching}
                  rowLaunching={ltqRowLaunching}
                  cellLaunching={ltqCellLaunching}
                  activeSweepers={activeSweepers}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Scenarios */}
      {scen && (
        <CoverageCard
          title="Etiquettescenario's (DB-vertaling)"
          description="De Engelstalige etiquette-situaties (titel + situatiebeschrijving) worden door AI naar de gekozen taal vertaald. Zichtbaar voor gebruikers in de leermodule."
          actionLabel="vertaalt alle onvertaalde Engelstalige scenario's (titel + situatiebeschrijving) naar die taal."
          total={scen.total}
          langs={scen.langs as LangCoverage[]}
          sweeper="scenario-translation"
          costPerItem={0.005}
          itemsPerMinute={15}
          onTranslateAll={launchScenAll}
          onTranslateLang={launchScenLang}
          launching={scenLaunching}
          lastRun={scen.last_run ?? null}
          activeSweepers={activeSweepers}
        />
      )}

      {/* Compass */}
      {compass && (
        <CoverageCard
          title="Landenprotocollen (DB-vertaling)"
          description="De 5 etiquette-pijlers per land (compass_regions.locale_data) worden naar de gekozen taal vertaald. Zichtbaar op de Cultural Compass-pagina's voor alle 206 gepubliceerde landen."
          actionLabel="vertaalt alle landenprotocollen naar die taal (alle pijlers van alle gepubliceerde landen die nog niet vertaald zijn)."
          total={compass.total}
          langs={compass.langs as LangCoverage[]}
          sweeper="compass-content-translation"
          costPerItem={0.011}
          itemsPerMinute={3}
          onTranslateAll={launchCompassAll}
          onTranslateLang={launchCompassLang}
          launching={compassLaunching}
          lastRun={compass.last_run ?? null}
          activeSweepers={activeSweepers}
        />
      )}

      {/* Atelier-distillaten — regio-dekking */}
      {counselSeeds && (
        <DomainCoverageCard
          data={counselSeeds}
          launching={seedsLaunching}
          onGenerateAll={launchSeedsAll}
          onGenerateDomain={launchSeedsDomain}
        />
      )}

      {/* Atelier-distillaten — vertaling per taal */}
      {counselSeedTrans && (
        <CoverageCard
          title="Atelier-distillaten (Vertaling)"
          description="De Engelstalige kennisdistillaten per regio × domein worden per taal vertaald. Enkel actieve seeds worden vertaald. Elke taal moet afzonderlijk worden gestart — er is geen 'Alle talen'-knop om de kosten beheersbaar te houden."
          actionLabel="start de vertaling van alle actieve Atelier-distillaten naar die taal (max. 50 seeds per run)."
          total={counselSeedTrans.total}
          langs={counselSeedTrans.langs as LangCoverage[]}
          sweeper="counsel-seed-translation"
          costPerItem={0.004}
          itemsPerMinute={15}
          onTranslateAll={async () => {}}
          onTranslateLang={launchSeedTransLang}
          launching={seedTransLaunching}
          lastRun={counselSeedTrans.last_run ?? null}
          hideAllButton
          activeSweepers={activeSweepers}
        />
      )}

      {/* Worker run log */}
      {runs.length > 0 && (
        <WorkerRunsLog runs={runs.filter((r) =>
          r.sweeper.startsWith("ltq-translation") ||
          r.sweeper.startsWith("scenario-translation") ||
          r.sweeper.startsWith("compass-content-translation") ||
          r.sweeper === "compass-translation" ||
          r.sweeper.startsWith("counsel-seed")
        )} />
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />≥85%</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />50–84%</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />&lt;50%</span>
        <span className="ml-auto">Auto-refresh every 30s</span>
      </div>
    </div>
  );
}

// ── Onboarding Funnel Tab ─────────────────────────────────────────────────────

interface OnboardingFunnelSeriesPoint {
  bucket: string;
  reached: number;
  selected_tier: number;
  skipped: number;
  skipped_unauth: number;
  recommendation_followed: number;
  recommendation_eligible: number;
}

interface OnboardingFunnelData {
  window_days: number;
  bucket: "day" | "week";
  totals: {
    reached: number;
    by_action: Record<string, number>;
    by_tier: Record<string, number>;
    recommendation_followed: number;
    recommendation_eligible: number;
  };
  series: OnboardingFunnelSeriesPoint[];
}

function OnboardingFunnelTab() {
  const [data, setData] = useState<OnboardingFunnelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bucket, setBucket] = useState<"day" | "week">("day");
  const [days, setDays] = useState(30);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE}/api/admin/onboarding-funnel?bucket=${bucket}&days=${days}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        setError(`Failed to load onboarding funnel (HTTP ${res.status}).`);
        return;
      }
      setData(await res.json() as OnboardingFunnelData);
    } catch {
      setError("Network error while loading onboarding funnel.");
    } finally {
      setLoading(false);
    }
  }, [bucket, days]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-sm" />)}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-destructive/5 border-destructive/30">
        <CardContent className="py-6 space-y-3">
          <p className="text-sm text-destructive font-mono">{error}</p>
          <Button size="sm" variant="outline" onClick={load} className="font-mono text-xs">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const reached = data.totals.reached;
  const selected = data.totals.by_action.selected_tier ?? 0;
  const skipped = (data.totals.by_action.skipped ?? 0) + (data.totals.by_action.skipped_unauth ?? 0);
  const pct = (n: number) => reached > 0 ? Math.round((n / reached) * 100) : 0;
  const recFollowed = data.totals.recommendation_followed;
  const recEligible = data.totals.recommendation_eligible;
  const recPct = recEligible > 0 ? Math.round((recFollowed / recEligible) * 100) : 0;

  const tierEntries = Object.entries(data.totals.by_tier).sort((a, b) => b[1] - a[1]);
  const maxTier = tierEntries.reduce((m, [, n]) => Math.max(m, n), 0);
  const maxSeries = data.series.reduce((m, p) => Math.max(m, p.reached), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-lg font-serif text-foreground">Onboarding · Plan Choice</h2>
          <p className="text-xs text-muted-foreground font-light">
            Conversion at step 5 of onboarding: how many users land here, what they pick,
            and how often they follow the recommended tier.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="text-xs font-mono px-2 py-1 rounded-sm border border-border bg-background"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last 365 days</option>
          </select>
          <select
            value={bucket}
            onChange={(e) => setBucket(e.target.value as "day" | "week")}
            className="text-xs font-mono px-2 py-1 rounded-sm border border-border bg-background"
          >
            <option value="day">Per day</option>
            <option value="week">Per week</option>
          </select>
          <Button size="sm" variant="outline" onClick={load} className="font-mono text-xs">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="py-4">
            <p className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Reached step 5</p>
            <p className="text-2xl font-serif tabular-nums">{reached}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="py-4">
            <p className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Selected a tier</p>
            <p className="text-2xl font-serif tabular-nums">{selected}</p>
            <p className="text-xs font-mono text-muted-foreground">{pct(selected)}%</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="py-4">
            <p className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Skipped</p>
            <p className="text-2xl font-serif tabular-nums">{skipped}</p>
            <p className="text-xs font-mono text-muted-foreground">{pct(skipped)}%</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="py-4">
            <p className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Followed recommendation</p>
            <p className="text-2xl font-serif tabular-nums">{recFollowed}</p>
            <p className="text-xs font-mono text-muted-foreground">{recPct}% of {recEligible}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono uppercase tracking-widest flex items-center gap-2">
            <Tag className="w-4 h-4" /> Tier selected
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tierEntries.length === 0 ? (
            <p className="text-xs text-muted-foreground font-light">No tier selections in this window.</p>
          ) : (
            <ul className="space-y-1.5">
              {tierEntries.map(([tier, n]) => (
                <li key={tier} className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex-1 truncate">{tier}</span>
                  <div className="w-32 h-1.5 bg-muted/50 rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-primary/70"
                      style={{ width: `${maxTier > 0 ? (n / maxTier) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="tabular-nums w-10 text-right text-muted-foreground">{n}</span>
                  <span className="tabular-nums w-12 text-right text-muted-foreground/70">
                    {selected > 0 ? Math.round((n / selected) * 100) : 0}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono uppercase tracking-widest flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Per {bucket}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.series.length === 0 ? (
            <p className="text-xs text-muted-foreground font-light">No events in this window.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-1.5 pr-3 font-normal">{bucket}</th>
                    <th className="py-1.5 pr-3 font-normal text-right">reached</th>
                    <th className="py-1.5 pr-3 font-normal text-right">selected</th>
                    <th className="py-1.5 pr-3 font-normal text-right">skipped</th>
                    <th className="py-1.5 pr-3 font-normal text-right">rec. followed</th>
                    <th className="py-1.5 pr-3 font-normal w-32">trend</th>
                  </tr>
                </thead>
                <tbody>
                  {data.series.map((p) => {
                    const skippedTotal = p.skipped + p.skipped_unauth;
                    return (
                      <tr key={p.bucket} className="border-t border-border/30">
                        <td className="py-1.5 pr-3">{p.bucket}</td>
                        <td className="py-1.5 pr-3 text-right tabular-nums">{p.reached}</td>
                        <td className="py-1.5 pr-3 text-right tabular-nums">{p.selected_tier}</td>
                        <td className="py-1.5 pr-3 text-right tabular-nums">{skippedTotal}</td>
                        <td className="py-1.5 pr-3 text-right tabular-nums">
                          {p.recommendation_followed}
                          <span className="text-muted-foreground/70"> / {p.recommendation_eligible}</span>
                        </td>
                        <td className="py-1.5 pr-3">
                          <div className="h-1.5 bg-muted/50 rounded-sm overflow-hidden">
                            <div
                              className="h-full bg-primary/70"
                              style={{ width: `${maxSeries > 0 ? (p.reached / maxSeries) * 100 : 0}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Admin page ───────────────────────────────────────────────────────────

export default function Admin() {
  usePageTitle("Admin");
  const { t } = useLanguage();
  const { isAuthenticated, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const authHeaders: Record<string, string> = {};

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const [waitlistCounts, setWaitlistCounts] = useState<{ claimed: number; total: number } | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    fetch(`${API_BASE}/api/admin/waitlist`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { founderClaimed: number; founderTotal: number } | null) => {
        if (!cancelled && d) {
          setWaitlistCounts({ claimed: d.founderClaimed, total: d.founderTotal });
        }
      })
      .catch(() => { /* silent */ });
    return () => { cancelled = true; };
  }, [isAdmin]);

  const fetchUsers = useCallback(async (q: string, page = 1) => {
    setLoading(true);
    try {
      const url = `${API_BASE}/api/admin/users?q=${encodeURIComponent(q)}&page=${page}&limit=50`;
      const res = await fetch(url, { credentials: "include" });
      if (res.ok) {
        const data = await res.json() as { users: AdminUser[]; total: number; pages: number; page: number };
        setUsers(data.users);
        setTotalPages(data.pages ?? 1);
        setTotalUsers(data.total ?? 0);
        setCurrentPage(data.page ?? 1);
      }
    } catch {
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchUsers("");
  }, [isAdmin, fetchUsers]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchUsers(query, 1);
  }

  function handleUserUpdated(updated: AdminUser) {
    setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
  }

  function handleUserDeleted(id: string) {
    setUsers((prev) => {
      const next = prev.filter((u) => u.id !== id);
      const newTotal = Math.max(0, totalUsers - 1);
      setTotalUsers(newTotal);
      const newTotalPages = Math.max(1, Math.ceil(newTotal / 50));
      setTotalPages(newTotalPages);
      if (next.length === 0 && currentPage > 1) {
        const prevPage = currentPage - 1;
        setCurrentPage(prevPage);
        fetchUsers(query, prevPage);
      }
      return next;
    });
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-6">
        <Lock className="w-12 h-12 mx-auto text-muted-foreground/40" aria-hidden="true" />
        <p className="text-muted-foreground font-light">{t("profile.not_authenticated")}</p>
        <Link href="/signin">
          <Button className="font-serif">{t("profile.sign_in")}</Button>
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-6">
        <Shield className="w-12 h-12 mx-auto text-muted-foreground/40" aria-hidden="true" />
        <p className="text-muted-foreground font-light">{t("admin.not_admin")}</p>
        <Link href="/">
          <Button variant="outline" className="font-serif">{t("common.return_home")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" aria-hidden="true" />
          <h1 className="text-3xl font-serif text-foreground">{t("admin.title")}</h1>
        </div>
        <p className="text-muted-foreground font-light text-sm">{t("admin.subtitle")}</p>
      </div>

      {/* Quick links */}
      <Link href="/admin/waitlist" className="block group no-underline">
        <Card className="bg-card border-border hover:border-primary/60 transition-colors cursor-pointer">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-serif text-foreground">Waitlist</div>
              <div className="text-xs text-muted-foreground font-light">Founder signups & invitations</div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-serif text-foreground">
                {waitlistCounts ? (
                  <>
                    <span className="text-lg text-primary">{waitlistCounts.claimed}</span>
                    <span className="text-xs text-muted-foreground"> / {waitlistCounts.total}</span>
                  </>
                ) : (
                  <span className="text-xs font-mono text-muted-foreground">…</span>
                )}
              </div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Founders</div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" aria-hidden="true" />
          </CardContent>
        </Card>
      </Link>

      {/* Tabs */}
      <div className="flex flex-wrap gap-x-1 gap-y-0 border-b border-border/50">
        {([
          { key: "users" as const, label: "Users", icon: Users },
          { key: "attribution" as const, label: "Attribution", icon: BarChart3 },
          { key: "onboarding" as const, label: "Onboarding", icon: TrendingUp },
          { key: "content" as const, label: "Inhoud", icon: Database },
          { key: "use_cases" as const, label: "Use Cases", icon: Briefcase },
          { key: "cc_screening" as const, label: "CC Screening", icon: Cpu },
          { key: "integrations" as const, label: "Integrations", icon: KeyRound },
          { key: "translation" as const, label: "Vertalingen", icon: Languages },
          { key: "counsel_seeds" as const, label: "Atelier-distillaten", icon: Database },
          { key: "votes" as const, label: "Country Votes", icon: Vote },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 shrink-0 whitespace-nowrap px-3 py-2.5 text-sm font-mono transition-colors border-b-2 -mb-px
              ${activeTab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Users tab */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder={t("admin.search_placeholder")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 rounded-sm"
              />
            </div>
            <Button type="submit" className="font-serif rounded-sm" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("admin.search_btn")}
            </Button>
          </form>

          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-sm" />)}
            </div>
          )}

          {!loading && searched && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                  {t("admin.users_found", { n: totalUsers })}
                </p>
                {totalPages > 1 && (
                  <p className="text-xs font-mono text-muted-foreground">
                    Page {currentPage} / {totalPages}
                  </p>
                )}
              </div>
              {users.length === 0 ? (
                <Card className="bg-card border-border">
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground font-light">{t("admin.no_users")}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {users.map((u) => (
                    <UserRow
                      key={u.id}
                      user={u}
                      authHeaders={authHeaders}
                      onUpdated={handleUserUpdated}
                      onDeleted={handleUserDeleted}
                    />
                  ))}
                </div>
              )}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="font-mono text-xs"
                    disabled={currentPage <= 1 || loading}
                    onClick={() => fetchUsers(query, currentPage - 1)}
                  >
                    ← Prev
                  </Button>
                  <span className="text-xs font-mono text-muted-foreground px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="font-mono text-xs"
                    disabled={currentPage >= totalPages || loading}
                    onClick={() => fetchUsers(query, currentPage + 1)}
                  >
                    Next →
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content tab */}
      {activeTab === "content" && (
        <ContentTab authHeaders={authHeaders} />
      )}

      {/* Use Cases tab */}
      {activeTab === "use_cases" && (
        <UseCasesTab />
      )}

      {/* CC Screening tab */}
      {activeTab === "cc_screening" && (
        <CCScreeningPanel authHeaders={authHeaders} />
      )}

      {/* Integrations tab */}
      {activeTab === "integrations" && (
        <IntegrationsPanel />
      )}

      {/* Attribution tab */}
      {activeTab === "attribution" && (
        <AttributionTab />
      )}

      {/* Onboarding funnel tab */}
      {activeTab === "onboarding" && (
        <OnboardingFunnelTab />
      )}

      {/* Translation health tab */}
      {activeTab === "translation" && (
        <TranslationHealthTab />
      )}

      {/* Counsel Seeds tab */}
      {activeTab === "counsel_seeds" && (
        <CounselSeedsTab authHeaders={authHeaders} />
      )}

      {/* Country Votes tab */}
      {activeTab === "votes" && (
        <CountryVotesTab authHeaders={authHeaders} />
      )}
    </div>
  );
}

// ── Country Votes tab ─────────────────────────────────────────────────────────

type VoteTally = { region_code: string; region_name: string; flag_emoji: string | null; votes: number };
type PeriodSummary = { period_ym: string; total_votes: number; unique_voters: number };

function CountryVotesTab({ authHeaders }: { authHeaders: Record<string, string> }) {
  const [period, setPeriod] = useState<string>("");
  const [currentPeriod, setCurrentPeriod] = useState<string>("");
  const [tally, setTally] = useState<VoteTally[]>([]);
  const [periods, setPeriods] = useState<PeriodSummary[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async (p?: string) => {
    setLoading(true);
    setErr(null);
    try {
      const url = p ? `${API_BASE}/api/admin/votes/countries?period=${encodeURIComponent(p)}` : `${API_BASE}/api/admin/votes/countries`;
      const res = await fetch(url, { credentials: "include", headers: authHeaders });
      if (!res.ok) {
        setErr(`Kon overzicht niet laden (${res.status}).`);
        return;
      }
      const data = await res.json();
      setPeriod(data.period || "");
      setCurrentPeriod(data.current_period || "");
      setTally(data.tally || []);
      setPeriods(data.periods || []);
      setTotalVotes(data.total_votes || 0);
    } catch {
      setErr("Kon overzicht niet laden.");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => { load(); }, [load]);

  const periodLabel = (ym: string) => {
    if (!ym) return "";
    const [y, m] = ym.split("-");
    const months = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
    const mi = parseInt(m, 10) - 1;
    return `${months[mi] || m} ${y}`;
  };

  const maxVotes = tally.reduce((m, t) => Math.max(m, t.votes), 0) || 1;

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Vote className="w-5 h-5" />
            Country votes — period overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-xs font-mono text-muted-foreground">Period:</label>
            <select
              value={period}
              onChange={(e) => load(e.target.value)}
              className="text-sm font-mono px-2 py-1 rounded-sm border border-border bg-background"
            >
              {(periods.length ? periods : [{ period_ym: period || currentPeriod, total_votes: 0, unique_voters: 0 }]).map((p) => (
                <option key={p.period_ym} value={p.period_ym}>
                  {periodLabel(p.period_ym)} {p.period_ym === currentPeriod ? "(huidig)" : ""}
                </option>
              ))}
            </select>
            <span className="text-xs font-mono text-muted-foreground ml-auto">
              {totalVotes} totaal stemmen · {tally.length} landen
            </span>
          </div>

          {err && (
            <div className="p-3 rounded-md border border-destructive/30 bg-destructive/5 text-sm text-destructive">{err}</div>
          )}

          {loading ? (
            <div className="space-y-2">
              {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-10 rounded-sm" />)}
            </div>
          ) : tally.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center font-light">
              Nog geen stemmen voor deze periode.
            </p>
          ) : (
            <div className="space-y-1">
              {tally.map((t, idx) => (
                <div key={t.region_code} className="flex items-center gap-3 py-2 px-3 rounded-sm hover:bg-accent/30">
                  <span className="text-xs font-mono text-muted-foreground w-6 text-right">{idx + 1}.</span>
                  <span className="text-xl">{t.flag_emoji || "🏳"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-serif text-sm truncate">{t.region_name}</div>
                    <div className="text-xs font-mono text-muted-foreground">{t.region_code}</div>
                  </div>
                  <div className="w-32 hidden sm:block">
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${(t.votes / maxVotes) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-mono tabular-nums w-12 text-right">{t.votes}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {periods.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-serif text-base">Maandelijkse activiteit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {periods.map((p) => (
                <div key={p.period_ym} className="flex items-center gap-3 text-sm py-1.5 px-2 rounded-sm hover:bg-accent/30">
                  <button
                    onClick={() => load(p.period_ym)}
                    className={`font-mono w-24 text-left hover:text-primary ${p.period_ym === period ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {periodLabel(p.period_ym)}
                  </button>
                  <span className="text-xs font-mono text-muted-foreground">
                    {p.total_votes} stemmen · {p.unique_voters} {p.unique_voters === 1 ? "stemmer" : "stemmers"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Counsel Seeds tab ─────────────────────────────────────────────────────────

function CounselSeedsTab({ authHeaders }: { authHeaders: Record<string, string> }) {
  const [seeds, setSeeds] = useState<CounselSeedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/counsel-seeds`, {
        credentials: "include",
        headers: authHeaders,
      });
      if (!res.ok) {
        setError(`Failed to load seeds (HTTP ${res.status}).`);
        return;
      }
      const data = await res.json() as { seeds: CounselSeedRow[] };
      setSeeds(data.seeds ?? []);
    } catch {
      setError("Network error while loading counsel seeds.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const act = async (id: number, action: "promote" | "demote") => {
    setActionId(id);
    try {
      const res = await fetch(`${API_BASE}/api/admin/counsel-seeds/${id}/${action}`, {
        method: "POST",
        credentials: "include",
        headers: authHeaders,
      });
      if (!res.ok) {
        setError(`Action failed (HTTP ${res.status}).`);
        return;
      }
      const data = await res.json() as { seed: CounselSeedRow };
      setSeeds((prev) => prev.map((s) => s.id === id ? data.seed : s));
    } catch {
      setError("Network error during seed action.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          Counsel region seeds — distillates of Atelier knowledge per region & domain
        </p>
        <Button size="sm" variant="outline" className="font-mono text-xs" onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/40">
          <CardContent className="py-3 text-sm text-destructive font-mono">{error}</CardContent>
        </Card>
      )}

      {loading && seeds.length === 0 && (
        <div className="space-y-2">{[1,2,3].map((i) => <Skeleton key={i} className="h-14 rounded-sm" />)}</div>
      )}

      {!loading && seeds.length === 0 && !error && (
        <Card><CardContent className="py-8 text-center text-muted-foreground font-light text-sm">
          No counsel seeds yet. Run <code className="font-mono">scripts/counsel-seed-worker.mjs --region &lt;CODE&gt;</code>.
        </CardContent></Card>
      )}

      {seeds.length > 0 && (
        <div className="border border-border rounded-sm overflow-hidden">
          <table className="w-full text-xs font-mono">
            <thead className="bg-muted/40 text-muted-foreground uppercase tracking-widest">
              <tr>
                <th className="text-left px-3 py-2">Region</th>
                <th className="text-left px-3 py-2">Domain</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-right px-3 py-2">Score</th>
                <th className="text-left px-3 py-2">Seeded</th>
                <th className="text-right px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {seeds.map((s) => (
                <tr key={s.id} className="border-t border-border/60">
                  <td className="px-3 py-2 text-foreground">{s.region_code}</td>
                  <td className="px-3 py-2 text-foreground">{s.domain}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-sm uppercase text-[10px] tracking-widest ${
                      s.status === "active" ? "bg-green-100 text-green-700" :
                      s.status === "reviewed" ? "bg-blue-100 text-blue-700" :
                      "bg-muted text-muted-foreground"
                    }`}>{s.status}</span>
                  </td>
                  <td className="px-3 py-2 text-right text-foreground">{s.eval_score ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{new Date(s.seeded_at).toISOString().split("T")[0]}</td>
                  <td className="px-3 py-2 text-right">
                    {s.status !== "active" ? (
                      <Button size="sm" variant="outline" className="font-mono text-[10px] h-7" disabled={actionId === s.id} onClick={() => void act(s.id, "promote")}>
                        {actionId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Promote"}
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="font-mono text-[10px] h-7 text-muted-foreground" disabled={actionId === s.id} onClick={() => void act(s.id, "demote")}>
                        {actionId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Demote"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Integrations panel ────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-2 inline-flex items-center gap-1 text-xs font-mono text-muted-foreground/60 hover:text-primary transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

interface StripeTierProduct {
  tier: "guest" | "student" | "traveller" | "ambassador";
  productId: string;
  displayName: string;
  monthlyPriceId: string | null;
  monthlyAmount: number | null;
  yearlyPriceId: string | null;
  yearlyAmount: number | null;
  currency: string;
}

interface StripeStatus {
  configured: boolean;
  reachable: boolean;
  products: StripeTierProduct[];
  error?: string;
}

function formatPrice(cents: number | null, currency: string): string {
  if (cents == null) return "—";
  const symbol = currency.toLowerCase() === "eur" ? "€" : currency.toUpperCase() + " ";
  return `${symbol}${(cents / 100).toFixed(2)}`;
}

function IntegrationsPanel() {
  const [googleStatus, setGoogleStatus] = useState<"checking" | "configured" | "not_configured">("checking");
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [stripeLoading, setStripeLoading] = useState(true);
  const [seedingStudent, setSeedingStudent] = useState<ActionState>("idle");
  const [seedError, setSeedError] = useState<string | null>(null);

  const refreshStripe = useCallback(async () => {
    setStripeLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/stripe/status`, { credentials: "include" });
      if (res.ok) {
        const data = (await res.json()) as StripeStatus;
        setStripeStatus(data);
      } else {
        setStripeStatus({ configured: false, reachable: false, products: [] });
      }
    } catch {
      setStripeStatus({ configured: false, reachable: false, products: [] });
    } finally {
      setStripeLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/google/status`)
      .then((r) => r.json())
      .then((d: { configured: boolean }) => setGoogleStatus(d.configured ? "configured" : "not_configured"))
      .catch(() => setGoogleStatus("not_configured"));
    void refreshStripe();
  }, [refreshStripe]);

  const studentProduct = stripeStatus?.products.find((p) => p.tier === "student");
  const studentReady =
    !!studentProduct && !!studentProduct.monthlyPriceId && !!studentProduct.yearlyPriceId;

  const seedStudent = async () => {
    setSeedingStudent("loading");
    setSeedError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/stripe/seed/student`, {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setSeedError(data.error ?? "Het Student-product kon niet worden aangemaakt.");
        setSeedingStudent("error");
        return;
      }
      setSeedingStudent("done");
      await refreshStripe();
    } catch (err) {
      setSeedError(err instanceof Error ? err.message : "Onbekende fout.");
      setSeedingStudent("error");
    }
  };

  const redirectUri = "https://sowiso-01.replit.app/api/auth/google/callback";
  const devRedirectUri = typeof window !== "undefined"
    ? `${window.location.origin}/api/auth/google/callback`
    : redirectUri;

  return (
    <div className="space-y-6">
      {/* Google OAuth */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true" className="shrink-0">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Google OAuth
            <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-mono ${
              googleStatus === "configured"
                ? "border border-green-300 bg-green-50 text-green-700"
                : googleStatus === "checking"
                ? "border border-border bg-muted/30 text-muted-foreground"
                : "border border-amber-300 bg-amber-50 text-amber-700"
            }`}>
              {googleStatus === "configured" ? "Geconfigureerd" : googleStatus === "checking" ? "Controleren…" : "Niet geconfigureerd"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {googleStatus === "configured" ? (
            <div className="flex items-start gap-3 p-4 border border-green-200 bg-green-50/60 rounded-sm">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Google OAuth is actief</p>
                <p className="text-xs text-green-700/80 mt-1 font-light">
                  GOOGLE_CLIENT_ID en GOOGLE_CLIENT_SECRET zijn ingesteld. Gebruikers kunnen inloggen met hun Google-account.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 border border-amber-200 bg-amber-50/60 rounded-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Configuratie vereist</p>
                <p className="text-xs text-amber-700/80 mt-1 font-light">
                  Stel GOOGLE_CLIENT_ID en GOOGLE_CLIENT_SECRET in als omgevingsvariabelen om Google-login te activeren.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/70">Setup instructies</h3>
            <ol className="space-y-3 text-sm text-muted-foreground font-light list-none">
              <li className="flex gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono flex items-center justify-center">1</span>
                <span>
                  Ga naar{" "}
                  <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                    Google Cloud Console → Credentials
                  </a>{" "}
                  en maak een nieuw OAuth 2.0 Client ID aan.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono flex items-center justify-center">2</span>
                <span>Kies als applicatietype <strong className="text-foreground">Web application</strong>.</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono flex items-center justify-center">3</span>
                <div className="space-y-2 flex-1">
                  <span>Voeg deze <strong className="text-foreground">Authorized Redirect URIs</strong> toe:</span>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2 bg-muted/40 border border-border/50 rounded-sm px-3 py-2">
                      <code className="text-xs font-mono text-foreground/80 break-all flex-1">{redirectUri}</code>
                      <CopyButton text={redirectUri} />
                    </div>
                    {devRedirectUri !== redirectUri && (
                      <div className="flex items-center gap-2 bg-muted/40 border border-border/50 rounded-sm px-3 py-2">
                        <code className="text-xs font-mono text-foreground/80 break-all flex-1">{devRedirectUri}</code>
                        <CopyButton text={devRedirectUri} />
                        <span className="text-[10px] font-mono text-amber-600 border border-amber-300/60 rounded px-1">dev</span>
                      </div>
                    )}
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono flex items-center justify-center">4</span>
                <div className="space-y-1 flex-1">
                  <span>Kopieer de Client ID en Client Secret en stel deze in als omgevingsvariabelen:</span>
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center gap-2 bg-muted/40 border border-border/50 rounded-sm px-3 py-1.5">
                      <code className="text-xs font-mono text-foreground/80 flex-1">GOOGLE_CLIENT_ID</code>
                      <span className="text-[10px] text-muted-foreground/60">= jouw Client ID</span>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/40 border border-border/50 rounded-sm px-3 py-1.5">
                      <code className="text-xs font-mono text-foreground/80 flex-1">GOOGLE_CLIENT_SECRET</code>
                      <span className="text-[10px] text-muted-foreground/60">= jouw Client Secret</span>
                    </div>
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono flex items-center justify-center">5</span>
                <span>Herstart de API-server nadat de omgevingsvariabelen zijn ingesteld.</span>
              </li>
            </ol>
          </div>

          <div className="border-t border-border/40 pt-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/70 mb-3">Technische details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground font-light">
              <div>
                <span className="font-medium text-foreground/70 block mb-0.5">Issuer</span>
                <code className="font-mono text-[11px]">https://accounts.google.com</code>
              </div>
              <div>
                <span className="font-medium text-foreground/70 block mb-0.5">Scope</span>
                <code className="font-mono text-[11px]">openid email profile</code>
              </div>
              <div>
                <span className="font-medium text-foreground/70 block mb-0.5">PKCE</span>
                <code className="font-mono text-[11px]">S256 (verplicht)</code>
              </div>
              <div>
                <span className="font-medium text-foreground/70 block mb-0.5">Callback endpoint</span>
                <code className="font-mono text-[11px]">/api/auth/google/callback</code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stripe */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
              <path d="M111.328 15.602c0-4.97-2.415-8.9-7.013-8.9s-7.423 3.93-7.423 8.86c0 5.85 3.32 8.81 8.04 8.81 2.32 0 4.05-.53 5.36-1.27v-3.92c-1.31.66-2.81 1.06-4.71 1.06-1.87 0-3.51-.66-3.72-2.91h9.4c0-.25.06-1.24.06-1.73zm-9.5-1.84c0-2.16 1.32-3.06 2.52-3.06 1.18 0 2.42.9 2.42 3.06zm-12.21-7.06c-1.91 0-3.13.9-3.81 1.52l-.25-1.21H81.4v22.71l4.79-1.02v-5.51c.69.5 1.71 1.21 3.39 1.21 3.43 0 6.55-2.76 6.55-8.86.05-5.55-3.13-8.84-6.51-8.84zM88.34 19.81c-1.13 0-1.79-.4-2.25-.91l-.03-7.07c.49-.55 1.18-.95 2.28-.95 1.74 0 2.94 1.95 2.94 4.45 0 2.55-1.18 4.48-2.94 4.48zM75.46 5.42l4.81-1.04V.5l-4.81 1.04zm0 1.46h4.81v16.81h-4.81zm-5.16 1.42l-.31-1.42h-4.13v16.81h4.79V12.32c1.13-1.42 3.04-1.21 3.65-.97V6.88c-.61-.21-2.86-.61-4 1.42zm-9.59-5.6L56.03 3.7l-.02 15.36c0 2.83 2.13 4.91 4.96 4.91 1.56 0 2.71-.27 3.34-.59v-3.85c-.61.24-3.65 1.13-3.65-1.69V11h3.65V6.88h-3.65zm-13.74 9.4c0-.74.61-1.02 1.62-1.02 1.45 0 3.28.43 4.73 1.21V8.49c-1.58-.62-3.13-.87-4.73-.87-3.86 0-6.43 2.02-6.43 5.39 0 5.27 7.25 4.42 7.25 6.69 0 .87-.76 1.16-1.83 1.16-1.58 0-3.6-.65-5.21-1.52v4.55c1.78.77 3.57 1.09 5.21 1.09 3.96 0 6.68-1.96 6.68-5.39-.02-5.69-7.29-4.66-7.29-6.81z" transform="scale(0.25) translate(-30 -2)" fill="#635bff"/>
              <path d="M16 0C7.16 0 0 7.16 0 16s7.16 16 16 16 16-7.16 16-16S24.84 0 16 0zm6.43 21.18c-.48 1.27-1.34 2.27-2.46 2.86-.86.45-1.86.7-2.93.7-1.51 0-2.92-.34-4.04-.83v-3.34c.96.5 2.36 1 3.79 1 .96 0 1.66-.36 1.66-1.06 0-1.6-5.6-.96-5.6-5.4 0-2.36 1.66-4.16 4.7-4.16 1.43 0 2.66.27 3.46.55v3.32c-.86-.43-2-.86-3.16-.86-.86 0-1.5.27-1.5.83 0 1.5 5.7.84 5.7 5.4 0 .39-.04.7-.12 1z" fill="#635bff"/>
            </svg>
            Stripe billing
            <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-mono ${
              stripeLoading
                ? "border border-border bg-muted/30 text-muted-foreground"
                : studentReady
                ? "border border-green-300 bg-green-50 text-green-700"
                : stripeStatus?.configured
                ? "border border-amber-300 bg-amber-50 text-amber-700"
                : "border border-amber-300 bg-amber-50 text-amber-700"
            }`}>
              {stripeLoading
                ? "Controleren…"
                : studentReady
                ? "Student actief"
                : stripeStatus?.configured
                ? "Sleutel ok – product ontbreekt"
                : "Niet geconfigureerd"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!stripeLoading && !stripeStatus?.configured && (
            <div className="flex items-start gap-3 p-4 border border-amber-200 bg-amber-50/60 rounded-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Stripe-account nog niet actief</p>
                <p className="text-xs text-amber-700/80 mt-1 font-light">
                  Zodra het Stripe-account beschikbaar is, stel <code className="font-mono">STRIPE_SECRET_KEY</code> in als omgevingsvariabele.
                  De Membership-pagina toont tot dan statische tier-kaarten zonder werkende checkout.
                </p>
              </div>
            </div>
          )}
          {!stripeLoading && stripeStatus?.configured && !stripeStatus.reachable && (
            <div className="flex items-start gap-3 p-4 border border-red-200 bg-red-50/60 rounded-sm">
              <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Stripe is onbereikbaar</p>
                <p className="text-xs text-red-700/80 mt-1 font-light">
                  {stripeStatus.error ?? "Controleer de sleutel en netwerktoegang."}
                </p>
              </div>
            </div>
          )}
          {!stripeLoading && stripeStatus?.configured && stripeStatus.reachable && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 border border-green-200 bg-green-50/60 rounded-sm">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">Stripe-sleutel actief</p>
                  <p className="text-xs text-green-700/80 mt-1 font-light">
                    {studentReady
                      ? "Het Student-product is klaar voor checkout."
                      : "Maak hieronder het Student-product aan om de €4.99/mnd en €39/jaar abonnementen te activeren."}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/70">
                  Tier-producten in Stripe
                </h3>
                {stripeStatus.products.length === 0 && (
                  <p className="text-xs text-muted-foreground font-light">
                    Nog geen tier-producten met <code className="font-mono">metadata.tier</code> in Stripe.
                  </p>
                )}
                {stripeStatus.products.map((p) => (
                  <div key={p.productId} className="border border-border/50 rounded-sm p-3 bg-muted/20">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{p.displayName}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border bg-background text-muted-foreground">
                          {p.tier}
                        </span>
                      </div>
                      <code className="text-[10px] font-mono text-muted-foreground/70">{p.productId}</code>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground/70 block">Maandelijks</span>
                        <span className="font-mono text-foreground/80">
                          {formatPrice(p.monthlyAmount, p.currency)}
                        </span>
                        {p.monthlyPriceId && (
                          <code className="block text-[10px] font-mono text-muted-foreground/60 mt-0.5">
                            {p.monthlyPriceId}
                          </code>
                        )}
                      </div>
                      <div>
                        <span className="text-muted-foreground/70 block">Jaarlijks</span>
                        <span className="font-mono text-foreground/80">
                          {formatPrice(p.yearlyAmount, p.currency)}
                        </span>
                        {p.yearlyPriceId && (
                          <code className="block text-[10px] font-mono text-muted-foreground/60 mt-0.5">
                            {p.yearlyPriceId}
                          </code>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  size="sm"
                  variant={studentReady ? "outline" : "default"}
                  disabled={seedingStudent === "loading"}
                  onClick={seedStudent}
                >
                  {seedingStudent === "loading" ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Bezig…</>
                  ) : studentReady ? (
                    <><RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Student-prijzen verifiëren</>
                  ) : (
                    <><Plus className="w-3.5 h-3.5 mr-1.5" /> Maak Student-product aan</>
                  )}
                </Button>
                {seedingStudent === "done" && (
                  <span className="text-xs text-green-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Bijgewerkt
                  </span>
                )}
                {seedingStudent === "error" && seedError && (
                  <span className="text-xs text-red-700">{seedError}</span>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/70">Setup instructies</h3>
            <ol className="space-y-3 text-sm text-muted-foreground font-light list-none">
              <li className="flex gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono flex items-center justify-center">1</span>
                <span>
                  Open je <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">Stripe Dashboard → Developers → API keys</a> en kopieer de Secret key (sk_test_… of sk_live_…).
                </span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono flex items-center justify-center">2</span>
                <div className="space-y-1 flex-1">
                  <span>Stel deze in als Replit-omgevingsvariabele:</span>
                  <div className="mt-2 flex items-center gap-2 bg-muted/40 border border-border/50 rounded-sm px-3 py-1.5">
                    <code className="text-xs font-mono text-foreground/80 flex-1">STRIPE_SECRET_KEY</code>
                    <span className="text-[10px] text-muted-foreground/60">= sk_…</span>
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono flex items-center justify-center">3</span>
                <span>Herstart de API-server en klik hierboven op <strong className="text-foreground">Maak Student-product aan</strong>. Deze actie is idempotent en maakt de €4.99/mnd en €39/jaar prijzen aan.</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono flex items-center justify-center">4</span>
                <span>Optioneel — voor volledige reproduceerbaarheid kun je het seed-script draaien:
                  <code className="block mt-1 font-mono text-[11px] bg-muted/40 border border-border/50 rounded-sm px-2 py-1">pnpm --filter @workspace/api-server tsx src/scripts/seed-stripe-student.ts</code>
                </span>
              </li>
            </ol>
          </div>

          <div className="border-t border-border/40 pt-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/70 mb-3">Technische details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground font-light">
              <div>
                <span className="font-medium text-foreground/70 block mb-0.5">Product-metadata</span>
                <code className="font-mono text-[11px]">tier = student | traveller | ambassador</code>
              </div>
              <div>
                <span className="font-medium text-foreground/70 block mb-0.5">Webhook endpoint</span>
                <code className="font-mono text-[11px]">/api/stripe/webhook</code>
              </div>
              <div>
                <span className="font-medium text-foreground/70 block mb-0.5">Student – maandelijks</span>
                <code className="font-mono text-[11px]">€4.99 EUR · interval=month</code>
              </div>
              <div>
                <span className="font-medium text-foreground/70 block mb-0.5">Student – jaarlijks</span>
                <code className="font-mono text-[11px]">€39.00 EUR · interval=year</code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Google Tag Manager */}
      <GtmIntegrationCard />
    </div>
  );
}

function GtmIntegrationCard() {
  const gtmId = (import.meta.env.VITE_GTM_ID as string | undefined)?.trim();
  const isPlaceholder = !gtmId || gtmId === "%VITE_GTM_ID%" || gtmId.toLowerCase() === "undefined";
  const looksValid = !!gtmId && /^GTM-[A-Z0-9]+$/i.test(gtmId);
  const status: "configured" | "invalid" | "not_configured" = isPlaceholder
    ? "not_configured"
    : looksValid
      ? "configured"
      : "invalid";

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 shrink-0" />
          Google Tag Manager
          <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-mono ${
            status === "configured"
              ? "border border-green-300 bg-green-50 text-green-700"
              : status === "invalid"
                ? "border border-red-300 bg-red-50 text-red-700"
                : "border border-amber-300 bg-amber-50 text-amber-700"
          }`}>
            {status === "configured" ? "Geconfigureerd" : status === "invalid" ? "Ongeldig ID" : "Niet geconfigureerd"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {status === "configured" ? (
          <div className="flex items-start gap-3 p-4 border border-green-200 bg-green-50/60 rounded-sm">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">Tag Manager is actief</p>
              <p className="text-xs text-green-700/80 mt-1 font-light">
                Container ID <code className="font-mono">{gtmId}</code> is ingesteld. Pageviews worden naar GTM gestuurd.
              </p>
            </div>
          </div>
        ) : status === "invalid" ? (
          <div className="flex items-start gap-3 p-4 border border-red-200 bg-red-50/60 rounded-sm">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Container ID lijkt ongeldig</p>
              <p className="text-xs text-red-700/80 mt-1 font-light">
                Verwacht formaat <code className="font-mono">GTM-XXXXXXX</code>, gevonden <code className="font-mono">{gtmId}</code>.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-4 border border-amber-200 bg-amber-50/60 rounded-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Configuratie vereist</p>
              <p className="text-xs text-amber-700/80 mt-1 font-light">
                Stel <code className="font-mono">VITE_GTM_ID</code> in als Replit Secret om analytics te activeren.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/70">Setup instructies</h3>
          <ol className="space-y-3 text-sm text-muted-foreground font-light list-none">
            <li className="flex gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono flex items-center justify-center">1</span>
              <span>
                Ga naar{" "}
                <a href="https://tagmanager.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                  tagmanager.google.com
                </a>{" "}
                en log in met je Google-account.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono flex items-center justify-center">2</span>
              <span>
                Klik op <strong className="text-foreground">Account aanmaken</strong>. Vul de accountnaam in (bv. <em>SOWISO</em>) en kies een land.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono flex items-center justify-center">3</span>
              <div className="space-y-1 flex-1">
                <span>Maak een container aan met:</span>
                <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground/90 list-disc list-inside">
                  <li>Containernaam: <code className="font-mono">sowiso-01.replit.app</code> (of je eigen domein)</li>
                  <li>Doelplatform: <strong className="text-foreground">Web</strong></li>
                </ul>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono flex items-center justify-center">4</span>
              <span>
                Accepteer de servicevoorwaarden. Je krijgt nu een <strong className="text-foreground">Container ID</strong> te zien in het formaat <code className="font-mono">GTM-XXXXXXX</code>. Kopieer deze.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono flex items-center justify-center">5</span>
              <div className="space-y-1 flex-1">
                <span>Voeg de container ID toe als Replit Secret:</span>
                <div className="mt-2 flex items-center gap-2 bg-muted/40 border border-border/50 rounded-sm px-3 py-1.5">
                  <code className="text-xs font-mono text-foreground/80 flex-1">VITE_GTM_ID</code>
                  <span className="text-[10px] text-muted-foreground/60">= GTM-XXXXXXX</span>
                </div>
                <p className="text-[11px] text-muted-foreground/70 mt-1">
                  Open in Replit het tabblad <strong className="text-foreground">Secrets</strong> en voeg een nieuwe sleutel toe met deze naam en jouw container ID als waarde.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono flex items-center justify-center">6</span>
              <span>
                Herstart de <code className="font-mono">web</code> workflow zodat Vite de nieuwe variabele oppikt. Controleer daarna in GTM via <strong className="text-foreground">Preview</strong> of pageviews binnenkomen.
              </span>
            </li>
          </ol>
        </div>

        <div className="border-t border-border/40 pt-4">
          <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/70 mb-3">Technische details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground font-light">
            <div>
              <span className="font-medium text-foreground/70 block mb-0.5">Snippet locatie</span>
              <code className="font-mono text-[11px]">artifacts/sowiso/index.html</code>
            </div>
            <div>
              <span className="font-medium text-foreground/70 block mb-0.5">Env variabele</span>
              <code className="font-mono text-[11px]">VITE_GTM_ID</code>
            </div>
            <div>
              <span className="font-medium text-foreground/70 block mb-0.5">Huidige waarde</span>
              <code className="font-mono text-[11px]">{isPlaceholder ? "— niet ingesteld —" : gtmId}</code>
            </div>
            <div>
              <span className="font-medium text-foreground/70 block mb-0.5">Verwacht formaat</span>
              <code className="font-mono text-[11px]">GTM-XXXXXXX</code>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
