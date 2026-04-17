import { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import {
  Search, Lock, CheckCircle2, XCircle, Shield, User, ChevronDown, ChevronUp,
  BadgeCheck, Ban, Loader2, Database, Upload, RefreshCw, Users, Trash2, AlertTriangle,
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
  translations: Record<string, number>;
  scenario_translation_coverage: Record<string, number>;
  total_scenarios: number;
}

type ActionState = "idle" | "loading" | "done" | "error";
type AdminTab = "users" | "content";

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
        headers: authHeaders,
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
        headers: { "Content-Type": "application/json", ...authHeaders },
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
                      headers: authHeaders,
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
                        headers: authHeaders,
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

const SCENARIO_LANGS = ["nl", "fr", "de", "es", "pt", "it", "ar", "ja"] as const;
const LANG_LABELS: Record<string, string> = {
  nl: "Nederlands", fr: "Français", de: "Deutsch", es: "Español",
  pt: "Português", it: "Italiano", ar: "العربية", ja: "日本語",
};

function ContentTab({ authHeaders }: { authHeaders: Record<string, string> }) {
  const [status, setStatus] = useState<ContentStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [seedState, setSeedState] = useState<ActionState>("idle");
  const [seedOutput, setSeedOutput] = useState<string[]>([]);
  const [importState, setImportState] = useState<ActionState>("idle");
  const [importResult, setImportResult] = useState<{ inserted: number; errors_count: number; errors: string[]; translation_queued?: boolean; translation_scenario_ids?: number[]; translation_note?: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/content/status`, { headers: authHeaders });
      if (res.ok) setStatus(await res.json() as ContentStatus);
    } catch { /* silent */ } finally {
      setLoadingStatus(false);
    }
  }, [authHeaders]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  async function handleSeed() {
    setSeedState("loading");
    setSeedOutput([]);
    try {
      const res = await fetch(`${API_BASE}/api/admin/content/seed`, {
        method: "POST",
        headers: authHeaders,
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

  async function handleImport(type: "scenarios" | "compass_regions") {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setImportState("loading");
    setImportResult(null);
    try {
      const text = await file.text();
      const items = JSON.parse(text) as unknown[];
      const res = await fetch(`${API_BASE}/api/admin/content/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ type, items }),
      });
      const data = await res.json() as { inserted: number; errors_count: number; errors: string[] };
      setImportResult(data);
      setImportState(res.ok ? "done" : "error");
      if (res.ok) fetchStatus();
    } catch (err) {
      setImportResult({ inserted: 0, errors_count: 1, errors: [String(err)] });
      setImportState("error");
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
            8 languages (nl, fr, de, es, pt, it, ar, ja) in the background after import.
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
    </div>
  );
}

// ── Main Admin page ───────────────────────────────────────────────────────────

export default function Admin() {
  const { t } = useLanguage();
  const { isAuthenticated, isAdmin, getAuthHeaders } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const authHeaders = getAuthHeaders();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchUsers = useCallback(async (q: string, page = 1) => {
    setLoading(true);
    try {
      const url = `${API_BASE}/api/admin/users?q=${encodeURIComponent(q)}&page=${page}&limit=50`;
      const res = await fetch(url, { headers: authHeaders });
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

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/50">
        {([
          { key: "users" as const, label: "Users", icon: Users },
          { key: "content" as const, label: "Content", icon: Database },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-mono transition-colors border-b-2 -mb-px
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
    </div>
  );
}
