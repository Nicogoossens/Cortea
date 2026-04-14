import {
  useGetNobleScore,
  useGetPillarProgress,
  useGetNobleScoreLog,
  getGetNobleScoreQueryKey,
  getGetPillarProgressQueryKey,
  getGetNobleScoreLogQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Award, Calendar, Globe, Target, Clock, CheckCircle2, AlertTriangle,
  ExternalLink, ChevronRight, User, Languages, Trash2, X, Lock,
} from "lucide-react";
import { format, type Locale } from "date-fns";
import { enGB, enUS, enAU, enCA, nl, fr, de, es, pt, ptBR, it, hi } from "date-fns/locale";
import { useLanguage, type SupportedLocale, LOCALE_GROUPS } from "@/lib/i18n";
import { useActiveRegion, COMPASS_REGIONS, FlagEmoji, type RegionCode } from "@/lib/active-region";
import { levelKey, pillarDomainKey, triggerLabel } from "@/lib/content-labels";
import { useAuth } from "@/lib/auth";
import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const DATE_FNS_LOCALE: Record<SupportedLocale, Locale> = {
  "en-GB": enGB, "en-US": enUS, "en-AU": enAU, "en-CA": enCA,
  "nl-NL": nl, "fr-FR": fr, "de-DE": de,
  "es-ES": es, "es-MX": es,
  "pt-PT": pt, "pt-BR": ptBR,
  "it-IT": it, "hi-IN": hi,
};

interface UserProfileData {
  id: string;
  full_name?: string | null;
  email?: string | null;
  birth_year?: number | null;
  gender_identity?: string | null;
  ambition_level: string;
  subscription_tier: string;
  language_code: string;
  active_region: string;
  noble_score: number;
  created_at: string;
  is_admin?: boolean;
}

interface EnrichedLogEntry {
  id: number;
  user_id: string;
  scenario_id: number | null;
  score_delta: number;
  timestamp: string;
  trigger: string;
  level_name_after?: string | null;
  scenario_title?: string | null;
  scenario_pillar?: number | null;
  scenario_pillar_domain?: string | null;
}

type SaveState = "idle" | "saving" | "saved" | "error";

function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "SO";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain || !local) return "•••@•••";
  return local[0] + "•".repeat(Math.max(3, local.length - 1)) + "@" + domain;
}

function logStatusKey(delta: number): string {
  if (delta > 0) return "profile.log.refined";
  if (delta < 0) return "profile.log.reconsidered";
  return "profile.log.observed";
}

function SaveIndicator({ state, t }: { state: SaveState; t: (k: string) => string }) {
  if (state === "idle") return null;
  if (state === "saving") return (
    <span className="text-xs text-muted-foreground font-mono animate-pulse">…</span>
  );
  if (state === "saved") return (
    <span className="flex items-center gap-1 text-xs text-green-600 font-mono animate-in fade-in">
      <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
      {t("profile.saved")}
    </span>
  );
  return (
    <span className="text-xs text-destructive font-mono">{t("profile.save_error")}</span>
  );
}

export default function Profile() {
  const { t, locale, setLocale } = useLanguage();
  const dateFnsLocale = DATE_FNS_LOCALE[locale] ?? enGB;
  const { activeRegion, setActiveRegion, getRegionName } = useActiveRegion();
  const { userId, isAuthenticated, logout, getAuthHeaders } = useAuth();
  const [, navigate] = useLocation();

  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [langSave, setLangSave] = useState<SaveState>("idle");
  const [regionSave, setRegionSave] = useState<SaveState>("idle");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  const fetchProfile = useCallback(() => {
    if (!userId) { setProfileLoading(false); return; }
    fetch(`${API_BASE}/api/users/profile?user_id=${encodeURIComponent(userId)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setProfileData(data))
      .catch(() => setProfileData(null))
      .finally(() => setProfileLoading(false));
  }, [userId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const { data: nobleScore, isLoading: scoreLoading } = useGetNobleScore({ query: { queryKey: getGetNobleScoreQueryKey() } });
  const { data: pillars, isLoading: pillarsLoading } = useGetPillarProgress({ query: { queryKey: getGetPillarProgressQueryKey() } });
  const { data: rawLogs, isLoading: logsLoading } = useGetNobleScoreLog({ limit: 10 }, { query: { queryKey: getGetNobleScoreLogQueryKey({ limit: 10 }) } });
  const logs = rawLogs as EnrichedLogEntry[] | undefined;

  async function handleLanguageChange(newLocale: SupportedLocale) {
    if (!userId) return;
    setLangSave("saving");
    const langCode = newLocale.split("-")[0];
    try {
      const res = await fetch(`${API_BASE}/api/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ language_code: langCode }),
      });
      if (res.ok) {
        setLocale(newLocale);
        setLangSave("saved");
        setTimeout(() => setLangSave("idle"), 2500);
      } else {
        setLangSave("error");
      }
    } catch {
      setLangSave("error");
    }
  }

  async function handleRegionChange(code: RegionCode) {
    setActiveRegion(code);
    setShowRegionPicker(false);
    if (!userId) return;
    setRegionSave("saving");
    try {
      const res = await fetch(`${API_BASE}/api/users/profile/region`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ region_code: code }),
      });
      if (res.ok) {
        setRegionSave("saved");
        setTimeout(() => setRegionSave("idle"), 2500);
      } else {
        setRegionSave("error");
      }
    } catch {
      setRegionSave("error");
    }
  }

  async function handleDeleteAccount() {
    if (!userId || deleteInput !== "DELETE") return;
    setDeleting(true);
    try {
      await fetch(`${API_BASE}/api/users/profile`, { method: "DELETE", headers: getAuthHeaders() });
      logout();
      navigate("/");
    } catch {
      setDeleting(false);
    }
  }

  const isLoading = profileLoading || scoreLoading || pillarsLoading || logsLoading;

  if (!isAuthenticated && !profileLoading) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-6 animate-in fade-in duration-500">
        <Lock className="w-12 h-12 mx-auto text-muted-foreground/40" aria-hidden="true" />
        <p className="text-muted-foreground font-light">{t("profile.not_authenticated")}</p>
        <Link href="/signin">
          <Button className="font-serif bg-primary hover:bg-primary/90 text-primary-foreground">
            {t("profile.sign_in")}
          </Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-8" aria-live="polite">
        <Skeleton className="h-36 w-full rounded-sm" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 rounded-sm" />
          <Skeleton className="h-48 rounded-sm" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-64 rounded-sm" />
          <Skeleton className="h-64 rounded-sm lg:col-span-2" />
        </div>
        <Skeleton className="h-96 rounded-sm" />
      </div>
    );
  }

  const initials = getInitials(profileData?.full_name ?? null);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center p-8 bg-card border border-border shadow-sm rounded-sm">
        <div
          className="w-20 h-20 rounded-full bg-primary/10 border-4 border-background flex items-center justify-center shadow-sm flex-shrink-0 text-2xl font-serif text-primary"
          aria-label={profileData?.full_name ?? t("profile.title")}
        >
          {initials}
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-serif text-foreground truncate">
              {profileData?.full_name ?? t("profile.title")}
            </h1>
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono uppercase tracking-widest border border-primary/20 shrink-0">
              {profileData?.subscription_tier ?? "guest"}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground pt-1">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" aria-hidden="true" />
              <span className="capitalize">{profileData?.ambition_level} {t("profile.ambition")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              <span>
                {t("profile.member_since")}{" "}
                {profileData?.created_at
                  ? format(new Date(profileData.created_at), "LLLL yyyy", { locale: dateFnsLocale })
                  : t("profile.member_since.recently")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Personal Details + Preferences ──────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Personal Details */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <User className="w-4 h-4 text-primary/60" aria-hidden="true" />
              {t("profile.personal_details")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow label={t("profile.full_name_label")} value={profileData?.full_name ?? "—"} />
            <DetailRow
              label={t("profile.email_label")}
              value={profileData?.email ? maskEmail(profileData.email) : "—"}
            />
            <DetailRow
              label={t("profile.birth_year_label")}
              value={profileData?.birth_year ? String(profileData.birth_year) : "—"}
            />
            <DetailRow
              label={t("profile.gender_label")}
              value={profileData?.gender_identity ? capitalize(profileData.gender_identity.replace("_", " ")) : "—"}
            />
            <div className="pt-1 border-t border-border/50">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/60">
                  {t("profile.phone_label")}
                </span>
                <span className="text-xs text-muted-foreground/40 italic font-light">
                  {t("profile.phone_coming_soon")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Languages className="w-4 h-4 text-primary/60" aria-hidden="true" />
              {t("profile.preferences")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Language */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  {t("profile.pref_language")}
                </label>
                <SaveIndicator state={langSave} t={t} />
              </div>
              <div className="flex flex-wrap gap-2">
                {LOCALE_GROUPS.map((group) => {
                  const firstLocale = group.locales[0];
                  const isSelected = group.locales.some((l) => l.locale === locale);
                  return (
                    <button
                      key={group.groupLabel}
                      onClick={() => handleLanguageChange(firstLocale.locale)}
                      disabled={langSave === "saving"}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs border transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/40"
                      }`}
                    >
                      <FlagEmoji code={firstLocale.flag} />
                      {group.groupLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Region */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  {t("profile.pref_region_label")}
                </label>
                <SaveIndicator state={regionSave} t={t} />
              </div>
              <button
                onClick={() => setShowRegionPicker((v) => !v)}
                aria-expanded={showRegionPicker}
                className="flex items-center gap-2 px-3 py-2 rounded-sm border border-border/60 hover:border-primary/40 hover:bg-muted/30 transition-all text-sm w-full text-left"
              >
                <Globe className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                <FlagEmoji code={activeRegion} />
                <span className="font-medium flex-1">{getRegionName(activeRegion)}</span>
                <ChevronRight
                  className={`w-4 h-4 text-muted-foreground transition-transform ${showRegionPicker ? "rotate-90" : ""}`}
                  aria-hidden="true"
                />
              </button>

              {showRegionPicker && (
                <div className="flex flex-wrap gap-1.5 pt-1 animate-in fade-in duration-200">
                  {COMPASS_REGIONS.map((region) => {
                    const isSelected = region.code === activeRegion;
                    return (
                      <button
                        key={region.code}
                        onClick={() => handleRegionChange(region.code as RegionCode)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-sm text-xs border transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border/40 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/30"
                        }`}
                      >
                        <FlagEmoji code={region.flag} />
                        {getRegionName(region.code)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Noble Standing + Domain Mastery ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="bg-card border-border shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: nobleScore?.level_color || "var(--primary)" }} aria-hidden="true" />
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" aria-hidden="true" />
              {t("profile.noble_standing")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-4">
              <div className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-2">{t("profile.current_title")}</div>
              <div className="text-3xl font-serif" style={{ color: nobleScore?.level_color || "inherit" }}>
                {t(levelKey(nobleScore?.level_name))}
              </div>
            </div>
            <div className="space-y-2">
              <div
                className="h-1.5 w-full bg-muted rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={nobleScore?.total_score ?? 0}
                aria-valuemin={0}
                aria-valuemax={nobleScore?.next_level_threshold ?? 100}
              >
                <div
                  className="h-full transition-all duration-1000"
                  style={{
                    width: `${nobleScore?.next_level_threshold ? (nobleScore.total_score / nobleScore.next_level_threshold) * 100 : 100}%`,
                    backgroundColor: nobleScore?.level_color || "var(--primary)"
                  }}
                />
              </div>
              {nobleScore?.next_level_threshold && (
                <div className="text-xs text-right text-muted-foreground">{t("profile.next_rank")}</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-xl">{t("profile.domain_mastery")}</CardTitle>
            <CardDescription>{t("profile.domain_subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {pillars?.map((pillar) => (
                <div key={pillar.pillar} className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-40 flex-shrink-0">
                    <div className="text-sm font-medium">{t(pillarDomainKey(pillar.pillar_domain))}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">{t("atelier.pillar")} {pillar.pillar}</div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="font-serif italic text-foreground/80 text-sm">{pillar.current_title}</span>
                    <div
                      className="h-1 w-full bg-muted rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={pillar.progress_percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div className="h-full bg-primary/70 transition-all duration-1000" style={{ width: `${pillar.progress_percent}%` }} />
                    </div>
                    {pillar.next_title && (
                      <div className="text-[10px] text-right text-muted-foreground uppercase tracking-wider">
                        {t("profile.next")}: {pillar.next_title}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Log ──────────────────────────────────────── */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
            {t("profile.recent_log")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs && logs.length > 0 ? (
            <div className="relative border-l border-border/50 ml-3 md:ml-4 space-y-6 pb-4">
              {logs.map((log) => (
                <div key={log.id} className="relative pl-6 md:pl-8">
                  <div
                    className={`absolute w-3 h-3 rounded-full left-[-6px] top-1.5 ring-4 ring-background ${
                      log.score_delta > 0 ? "bg-green-500" : log.score_delta < 0 ? "bg-red-500" : "bg-muted-foreground"
                    }`}
                    aria-hidden="true"
                  />
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">
                        {log.scenario_title ?? t("profile.log.general_practice")}
                      </div>
                      {log.scenario_pillar_domain && (
                        <div className="text-xs text-muted-foreground/70 font-mono uppercase tracking-wider">
                          {log.scenario_pillar_domain}
                          {log.scenario_pillar != null && ` · Pillar ${log.scenario_pillar}`}
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <span className={`text-xs font-mono uppercase tracking-widest ${
                          log.score_delta > 0 ? "text-green-600" : log.score_delta < 0 ? "text-red-600" : "text-muted-foreground"
                        }`}>
                          {t(logStatusKey(log.score_delta))}
                        </span>
                        <span className={`text-xs font-mono px-1.5 py-0.5 rounded-sm ${
                          log.score_delta > 0 ? "bg-green-100 text-green-700" : log.score_delta < 0 ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"
                        }`}>
                          {log.score_delta > 0 ? "+" : ""}{log.score_delta} {t("profile.log.points")}
                        </span>
                        {log.level_name_after && (
                          <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-mono">
                            <Award className="w-3 h-3" aria-hidden="true" />
                            {t("profile.log.level_up_label")}: {log.level_name_after}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <time dateTime={log.timestamp} className="text-xs font-mono text-muted-foreground">
                        {format(new Date(log.timestamp), "dd MMM, HH:mm", { locale: dateFnsLocale })}
                      </time>
                      {log.scenario_id != null && (
                        <Link href={`/atelier/${log.scenario_id}`}>
                          <span className="inline-flex items-center gap-1 text-xs text-primary hover:underline underline-offset-2 font-mono cursor-pointer">
                            {t("profile.log.review")}
                            <ExternalLink className="w-3 h-3" aria-hidden="true" />
                          </span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="font-serif text-lg">{t("profile.no_history")}</p>
              <p className="text-sm mt-1">{t("profile.visit_atelier")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Danger Zone ─────────────────────────────────────── */}
      <Card className="border-destructive/20 bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-lg flex items-center gap-2 text-foreground">
            <AlertTriangle className="w-4 h-4 text-destructive/70" aria-hidden="true" />
            {t("profile.danger_zone")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!showDeleteDialog ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">{t("profile.delete_account_title")}</p>
                <p className="text-xs text-muted-foreground font-light mt-1 max-w-sm">
                  {t("profile.delete_account_warning")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="border-destructive/30 text-destructive hover:bg-destructive/5 hover:border-destructive/60 font-mono shrink-0"
              >
                <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                {t("profile.delete_account_title")}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-200">
              <p className="text-sm text-destructive font-light">{t("profile.delete_account_warning")}</p>
              <div className="space-y-2">
                <label htmlFor="delete-confirm" className="text-xs font-mono uppercase tracking-wider text-muted-foreground block">
                  {t("profile.delete_confirm_label")}
                </label>
                <Input
                  id="delete-confirm"
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="DELETE"
                  className="font-mono border-destructive/30 focus:border-destructive/60 max-w-xs"
                  disabled={deleting}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleteInput !== "DELETE" || deleting}
                  onClick={handleDeleteAccount}
                  className="font-mono"
                  aria-busy={deleting}
                >
                  {deleting ? "…" : t("profile.delete_confirm_button")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowDeleteDialog(false); setDeleteInput(""); }}
                  disabled={deleting}
                  className="font-mono gap-1"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                  {t("profile.delete_cancel")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline gap-2 border-b border-border/40 pb-2 last:border-0">
      <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/70 shrink-0">
        {label}
      </span>
      <span className="text-sm text-foreground text-right font-light truncate">{value}</span>
    </div>
  );
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
