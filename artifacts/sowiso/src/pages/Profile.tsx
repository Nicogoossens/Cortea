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
  ExternalLink, ChevronRight, User, Languages, Trash2, X, Lock, Camera, Pencil, Check, Plus,
} from "lucide-react";
import { format, type Locale } from "date-fns";
import { enGB, enUS, enAU, enCA, nl, fr, de, es, pt, ptBR, it, hi } from "date-fns/locale";
import { useLanguage, type SupportedLocale, LOCALE_GROUPS } from "@/lib/i18n";
import { useActiveRegion, COMPASS_REGIONS, FlagEmoji, type RegionCode } from "@/lib/active-region";
import { levelKey, pillarDomainKey } from "@/lib/content-labels";
import { useAuth } from "@/lib/auth";
import { useState, useEffect, useCallback, useRef, KeyboardEvent } from "react";
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
  username?: string | null;
  avatar_url?: string | null;
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
  country_of_origin?: string | null;
  objectives?: string[] | null;
  interests_sports?: string[] | null;
  interests_cuisine?: string[] | null;
  interests_dress_code?: string[] | null;
  onboarding_completed?: boolean | null;
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

const AMBITION_LEVELS: { key: string; labelKey: string; descKey: string }[] = [
  { key: "curious",       labelKey: "ambition.curious.label",       descKey: "ambition.curious.desc" },
  { key: "casual",        labelKey: "ambition.casual.label",        descKey: "ambition.casual.desc" },
  { key: "aspirational",  labelKey: "ambition.aspirational.label",  descKey: "ambition.aspirational.desc" },
  { key: "professional",  labelKey: "ambition.professional.label",  descKey: "ambition.professional.desc" },
  { key: "distinguished", labelKey: "ambition.distinguished.label", descKey: "ambition.distinguished.desc" },
  { key: "diplomatic",    labelKey: "ambition.diplomatic.label",    descKey: "ambition.diplomatic.desc" },
];

const OBJECTIVE_OPTIONS: { key: string; labelKey: string }[] = [
  { key: "business",        labelKey: "objective.business" },
  { key: "elite",           labelKey: "objective.elite" },
  { key: "romantic",        labelKey: "objective.romantic" },
  { key: "world_traveller", labelKey: "objective.world_traveller" },
];

const INTEREST_PRESETS: Record<"sports" | "cuisine" | "dress_code", string[]> = {
  sports: [
    "Tennis", "Golf", "Polo", "Equestrian", "Sailing", "Cricket",
    "Croquet", "Fencing", "Skiing", "Rowing", "Squash", "Shooting",
    "Hunting", "Swimming", "Cycling", "Yachting",
  ],
  cuisine: [
    "French", "Italian", "Japanese", "British", "Spanish", "Mediterranean",
    "Indian", "Chinese", "Mexican", "Turkish", "Scandinavian",
    "Wine & Sommellerie", "Fine Dining", "Tea Ceremony", "Champagne", "Gastronomy",
  ],
  dress_code: [
    "White Tie", "Black Tie", "Morning Dress", "Lounge Suit",
    "Business Formal", "Business Casual", "Smart Casual",
    "Cocktail Attire", "Country Casual", "Resort Formal",
  ],
};

function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "SO";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function logStatusKey(delta: number): string {
  if (delta > 0) return "profile.log.refined";
  if (delta < 0) return "profile.log.reconsidered";
  return "profile.log.observed";
}

function SaveIndicator({ state, t }: { state: SaveState; t: (k: string) => string }) {
  if (state === "idle") return null;
  if (state === "saving") return <span className="text-xs text-muted-foreground font-mono animate-pulse">…</span>;
  if (state === "saved") return (
    <span className="flex items-center gap-1 text-xs text-green-600 font-mono animate-in fade-in">
      <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
      {t("profile.saved")}
    </span>
  );
  return <span className="text-xs text-destructive font-mono">{t("profile.save_error")}</span>;
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

  // Identity fields
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameSave, setUsernameSave] = useState<SaveState>("idle");
  const [editingFullName, setEditingFullName] = useState(false);
  const [fullNameInput, setFullNameInput] = useState("");
  const [fullNameSave, setFullNameSave] = useState<SaveState>("idle");
  const [avatarSave, setAvatarSave] = useState<SaveState>("idle");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Ambition level
  const [ambitionSave, setAmbitionSave] = useState<SaveState>("idle");

  // Interests & Objectives
  const [editingCountry, setEditingCountry] = useState(false);
  const [countryInput, setCountryInput] = useState("");
  const [countrySave, setCountrySave] = useState<SaveState>("idle");
  const [objectivesSave, setObjectivesSave] = useState<SaveState>("idle");
  const [tagInputSports, setTagInputSports] = useState("");
  const [tagInputCuisine, setTagInputCuisine] = useState("");
  const [tagInputDressCode, setTagInputDressCode] = useState("");
  const [sportsSave, setSportsSave] = useState<SaveState>("idle");
  const [cuisineSave, setCuisineSave] = useState<SaveState>("idle");
  const [dressCodeSave, setDressCodeSave] = useState<SaveState>("idle");

  const fetchProfile = useCallback(() => {
    if (!userId) { setProfileLoading(false); return; }
    fetch(`${API_BASE}/api/users/profile`, { headers: getAuthHeaders() })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        setProfileData(data);
        setUsernameInput(data?.username ?? "");
        setFullNameInput(data?.full_name ?? "");
        setCountryInput(data?.country_of_origin ?? "");
      })
      .catch(() => setProfileData(null))
      .finally(() => setProfileLoading(false));
  }, [userId, getAuthHeaders]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const { data: nobleScore, isLoading: scoreLoading } = useGetNobleScore({ query: { queryKey: getGetNobleScoreQueryKey() } });
  const { data: pillars, isLoading: pillarsLoading } = useGetPillarProgress({ query: { queryKey: getGetPillarProgressQueryKey() } });
  const { data: rawLogs, isLoading: logsLoading } = useGetNobleScoreLog({ limit: 10 }, { query: { queryKey: getGetNobleScoreLogQueryKey({ limit: 10 }) } });
  const logs = rawLogs as EnrichedLogEntry[] | undefined;

  async function patchProfile(body: Record<string, unknown>, setSave: (s: SaveState) => void) {
    setSave("saving");
    try {
      const res = await fetch(`${API_BASE}/api/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfileData(updated);
        setSave("saved");
        setTimeout(() => setSave("idle"), 2500);
      } else {
        setSave("error");
      }
    } catch {
      setSave("error");
    }
  }

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

  async function handleUsernameSubmit() {
    await patchProfile({ username: usernameInput.trim() || null }, setUsernameSave);
    setEditingUsername(false);
  }

  async function handleFullNameSubmit() {
    await patchProfile({ full_name: fullNameInput.trim() || null }, setFullNameSave);
    setEditingFullName(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) {
      alert(t("profile.avatar_too_large"));
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      await patchProfile({ avatar_url: reader.result as string }, setAvatarSave);
    };
    reader.readAsDataURL(file);
  }

  async function handleAmbitionChange(level: string) {
    if (profileData?.ambition_level === level || ambitionSave === "saving") return;
    await patchProfile({ ambition_level: level }, setAmbitionSave);
  }

  async function handleObjectiveToggle(obj: string) {
    const current = profileData?.objectives ?? [];
    const next = current.includes(obj) ? current.filter((o) => o !== obj) : [...current, obj];
    await patchProfile({ objectives: next }, setObjectivesSave);
  }

  async function handleCountrySubmit() {
    await patchProfile({ country_of_origin: countryInput.trim() || null }, setCountrySave);
    setEditingCountry(false);
  }

  async function handleTagAdd(
    field: "sports" | "cuisine" | "dress_code",
    value: string,
    clearInput: () => void,
  ) {
    const key = `interests_${field}` as keyof UserProfileData;
    const setSave = field === "sports" ? setSportsSave : field === "cuisine" ? setCuisineSave : setDressCodeSave;
    const current = (profileData?.[key] as string[] | null | undefined) ?? [];
    const trimmed = value.trim();
    if (!trimmed || current.includes(trimmed)) { clearInput(); return; }
    clearInput();
    await patchProfile({ [key]: [...current, trimmed] }, setSave);
  }

  async function handleTagRemove(field: "sports" | "cuisine" | "dress_code", value: string) {
    const key = `interests_${field}` as keyof UserProfileData;
    const setSave = field === "sports" ? setSportsSave : field === "cuisine" ? setCuisineSave : setDressCodeSave;
    const current = (profileData?.[key] as string[] | null | undefined) ?? [];
    await patchProfile({ [key]: current.filter((v) => v !== value) }, setSave);
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
        <Skeleton className="h-72 rounded-sm" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-64 rounded-sm" />
          <Skeleton className="h-64 rounded-sm lg:col-span-2" />
        </div>
        <Skeleton className="h-96 rounded-sm" />
      </div>
    );
  }

  const initials = getInitials(profileData?.full_name ?? null);
  const avatarUrl = profileData?.avatar_url;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center p-8 bg-card border border-border shadow-sm rounded-sm">
        {/* Avatar */}
        <div className="relative group flex-shrink-0">
          <div
            className="w-20 h-20 rounded-full bg-primary/10 border-4 border-background flex items-center justify-center shadow-sm overflow-hidden cursor-pointer"
            onClick={() => avatarInputRef.current?.click()}
            aria-label={t("profile.upload_avatar")}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={profileData?.full_name ?? "Avatar"} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-serif text-primary">{initials}</span>
            )}
          </div>
          <button
            onClick={() => avatarInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={t("profile.upload_avatar_btn")}
          >
            <Camera className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          {avatarSave === "saving" && (
            <div className="absolute inset-0 rounded-full bg-background/60 flex items-center justify-center">
              <span className="text-xs font-mono animate-pulse">…</span>
            </div>
          )}
        </div>

        {/* Name + Meta */}
        <div className="flex-1 space-y-2 min-w-0">
          {/* Full name */}
          <div className="flex flex-wrap items-center gap-3">
            {editingFullName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleFullNameSubmit(); if (e.key === "Escape") setEditingFullName(false); }}
                  className="text-2xl font-serif h-auto py-1 px-2 border-primary/40 focus:border-primary w-48 md:w-64"
                  autoFocus
                />
                <button onClick={handleFullNameSubmit} className="text-primary hover:text-primary/70" aria-label="Save">
                  <Check className="w-4 h-4" aria-hidden="true" />
                </button>
                <button onClick={() => { setEditingFullName(false); setFullNameInput(profileData?.full_name ?? ""); }} className="text-muted-foreground hover:text-foreground" aria-label="Cancel">
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button
                className="group flex items-center gap-2 text-3xl font-serif text-foreground hover:text-foreground/80 transition-colors"
                onClick={() => setEditingFullName(true)}
                aria-label="Edit full name"
              >
                {profileData?.full_name ?? <span className="text-muted-foreground font-light italic text-xl">{t("profile.set_name_placeholder")}</span>}
                <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
              </button>
            )}
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono uppercase tracking-widest border border-primary/20 shrink-0">
              {profileData?.subscription_tier ?? "guest"}
            </span>
            <SaveIndicator state={fullNameSave} t={t} />
          </div>

          {/* Username */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-muted-foreground/50">@</span>
            {editingUsername ? (
              <div className="flex items-center gap-2">
                <Input
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value.replace(/\s/g, "_"))}
                  onKeyDown={(e) => { if (e.key === "Enter") handleUsernameSubmit(); if (e.key === "Escape") setEditingUsername(false); }}
                  className="h-7 py-0 px-2 font-mono text-sm border-primary/40 w-40"
                  placeholder="username"
                  autoFocus
                />
                <button onClick={handleUsernameSubmit} className="text-primary hover:text-primary/70" aria-label="Save username">
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button onClick={() => { setEditingUsername(false); setUsernameInput(profileData?.username ?? ""); }} className="text-muted-foreground hover:text-foreground" aria-label="Cancel">
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button
                className="group flex items-center gap-1.5 font-mono text-sm hover:text-foreground transition-colors"
                onClick={() => setEditingUsername(true)}
                aria-label="Edit username"
              >
                {profileData?.username ?? <span className="italic text-muted-foreground/50 font-sans font-light">{t("profile.set_username_placeholder")}</span>}
                <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
              </button>
            )}
            <SaveIndicator state={usernameSave} t={t} />
          </div>

          {/* Ambition selector + Member since */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground pt-1 items-center">
            {/* Ambition level — clickable pills */}
            <div className="space-y-1.5 w-full">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Target className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                {AMBITION_LEVELS.map(({ key, labelKey, descKey }) => (
                  <button
                    key={key}
                    onClick={() => handleAmbitionChange(key)}
                    disabled={ambitionSave === "saving"}
                    title={t(descKey)}
                    className={`px-2.5 py-0.5 rounded-full text-xs border transition-all ${
                      profileData?.ambition_level === key
                        ? "bg-primary/10 text-primary border-primary/30 font-medium"
                        : "border-border/40 text-muted-foreground/60 hover:border-primary/30 hover:text-muted-foreground"
                    }`}
                  >
                    {t(labelKey)}
                  </button>
                ))}
                <SaveIndicator state={ambitionSave} t={t} />
              </div>
              {profileData?.ambition_level && (
                <p className="text-xs text-muted-foreground/60 font-light pl-6 italic">
                  {t(AMBITION_LEVELS.find((l) => l.key === profileData.ambition_level)?.descKey ?? "")}
                </p>
              )}
            </div>

            {/* Member since */}
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

      {/* ── Personal Details + Preferences ── */}
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
            <DetailRow label="Username" value={profileData?.username ? `@${profileData.username}` : "—"} />
            <DetailRow label={t("profile.email_label")} value={profileData?.email ?? "—"} />
            <DetailRow label={t("profile.birth_year_label")} value={profileData?.birth_year ? String(profileData.birth_year) : "—"} />
            <DetailRow label={t("profile.gender_label")} value={profileData?.gender_identity ? capitalize(profileData.gender_identity.replace("_", " ")) : "—"} />
            <div className="pt-1 border-t border-border/50">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/60">{t("profile.phone_label")}</span>
                <span className="text-xs text-muted-foreground/40 italic font-light">{t("profile.phone_coming_soon")}</span>
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
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{t("profile.pref_language")}</label>
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
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{t("profile.pref_region_label")}</label>
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
                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showRegionPicker ? "rotate-90" : ""}`} aria-hidden="true" />
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

      {/* ── Interests & Objectives ── always visible, always editable ── */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Target className="w-4 h-4 text-primary/60" aria-hidden="true" />
            {t("profile.interests_title")}
          </CardTitle>
          <CardDescription>
            {t("profile.interests_subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Country of origin */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground/70">{t("profile.country_origin_label")}</label>
              <SaveIndicator state={countrySave} t={t} />
            </div>
            {editingCountry ? (
              <div className="flex items-center gap-2">
                <Input
                  value={countryInput}
                  onChange={(e) => setCountryInput(e.target.value)}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter") handleCountrySubmit();
                    if (e.key === "Escape") { setEditingCountry(false); setCountryInput(profileData?.country_of_origin ?? ""); }
                  }}
                  placeholder="e.g. Belgium"
                  className="flex-1 h-8 text-sm border-primary/40 focus:border-primary"
                  autoFocus
                />
                <button onClick={handleCountrySubmit} className="text-primary hover:text-primary/70 transition-colors" aria-label="Save">
                  <Check className="w-4 h-4" aria-hidden="true" />
                </button>
                <button onClick={() => { setEditingCountry(false); setCountryInput(profileData?.country_of_origin ?? ""); }} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Cancel">
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingCountry(true)}
                className="group flex items-center gap-2 text-sm text-foreground/80 hover:text-foreground transition-colors"
              >
                {profileData?.country_of_origin ?? <span className="italic text-muted-foreground/50 font-light">{t("profile.country_not_specified")}</span>}
                <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Objectives */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground/70">{t("profile.objectives_label")}</label>
              <SaveIndicator state={objectivesSave} t={t} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {OBJECTIVE_OPTIONS.map(({ key, labelKey }) => {
                const isActive = (profileData?.objectives ?? []).includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => handleObjectiveToggle(key)}
                    disabled={objectivesSave === "saving"}
                    className={`text-left px-4 py-3 rounded-sm border text-sm transition-all ${
                      isActive
                        ? "bg-primary/10 border-primary/40 text-primary font-medium"
                        : "border-border/50 text-muted-foreground hover:border-primary/30 hover:bg-muted/30"
                    }`}
                  >
                    {t(labelKey)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sports & Leisure */}
          <InterestSelector
            label={t("profile.sports_leisure_label")}
            field="sports"
            presets={INTEREST_PRESETS.sports}
            tags={profileData?.interests_sports ?? []}
            saveState={sportsSave}
            customInputValue={tagInputSports}
            onCustomInputChange={setTagInputSports}
            onTogglePreset={(v) => {
              const active = (profileData?.interests_sports ?? []).includes(v);
              if (active) handleTagRemove("sports", v);
              else handleTagAdd("sports", v, () => {});
            }}
            onAddCustom={() => handleTagAdd("sports", tagInputSports, () => setTagInputSports(""))}
            onRemove={(v) => handleTagRemove("sports", v)}
            t={t}
          />

          {/* Culinary Interests */}
          <InterestSelector
            label={t("profile.culinary_interests_label")}
            field="cuisine"
            presets={INTEREST_PRESETS.cuisine}
            tags={profileData?.interests_cuisine ?? []}
            saveState={cuisineSave}
            customInputValue={tagInputCuisine}
            onCustomInputChange={setTagInputCuisine}
            onTogglePreset={(v) => {
              const active = (profileData?.interests_cuisine ?? []).includes(v);
              if (active) handleTagRemove("cuisine", v);
              else handleTagAdd("cuisine", v, () => {});
            }}
            onAddCustom={() => handleTagAdd("cuisine", tagInputCuisine, () => setTagInputCuisine(""))}
            onRemove={(v) => handleTagRemove("cuisine", v)}
            t={t}
          />

          {/* Dress Code Preferences */}
          <InterestSelector
            label={t("profile.dress_code_prefs_label")}
            field="dress_code"
            presets={INTEREST_PRESETS.dress_code}
            tags={profileData?.interests_dress_code ?? []}
            saveState={dressCodeSave}
            customInputValue={tagInputDressCode}
            onCustomInputChange={setTagInputDressCode}
            onTogglePreset={(v) => {
              const active = (profileData?.interests_dress_code ?? []).includes(v);
              if (active) handleTagRemove("dress_code", v);
              else handleTagAdd("dress_code", v, () => {});
            }}
            onAddCustom={() => handleTagAdd("dress_code", tagInputDressCode, () => setTagInputDressCode(""))}
            onRemove={(v) => handleTagRemove("dress_code", v)}
            t={t}
          />

        </CardContent>
      </Card>

      {/* ── Noble Standing + Domain Mastery ── */}
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
                    backgroundColor: nobleScore?.level_color || "var(--primary)",
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

      {/* ── Recent Log ── */}
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

      {/* ── Danger Zone ── */}
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
                <p className="text-xs text-muted-foreground font-light mt-1 max-w-sm">{t("profile.delete_account_warning")}</p>
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

/* ── Interest selector sub-component ── preset chips + custom input ── */
interface InterestSelectorProps {
  label: string;
  field: string;
  presets: string[];
  tags: string[];
  saveState: SaveState;
  customInputValue: string;
  onCustomInputChange: (v: string) => void;
  onTogglePreset: (v: string) => void;
  onAddCustom: () => void;
  onRemove: (v: string) => void;
  t: (k: string) => string;
}

function InterestSelector({
  label, presets, tags, saveState,
  customInputValue, onCustomInputChange, onTogglePreset, onAddCustom, onRemove, t,
}: InterestSelectorProps) {
  const customTags = tags.filter((tag) => !presets.includes(tag));

  return (
    <div className="space-y-3 pt-1 border-t border-border/30 first:border-0 first:pt-0">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground/70">{label}</label>
        <SaveIndicator state={saveState} t={t} />
      </div>

      {/* Preset options — all visible, click to select/deselect */}
      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset) => {
          const isActive = tags.includes(preset);
          return (
            <button
              key={preset}
              onClick={() => onTogglePreset(preset)}
              disabled={saveState === "saving"}
              className={`px-3 py-1 rounded-sm text-xs border transition-all ${
                isActive
                  ? "bg-primary/10 text-primary border-primary/35 font-medium"
                  : "border-border/40 text-muted-foreground/70 hover:border-primary/30 hover:text-foreground hover:bg-muted/30"
              }`}
            >
              {preset}
            </button>
          );
        })}
      </div>

      {/* Custom tags (not in presets) shown with remove × */}
      {customTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {customTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-muted/40 text-foreground/70 text-xs border border-border/40 italic"
            >
              {tag}
              <button
                onClick={() => onRemove(tag)}
                className="text-muted-foreground/50 hover:text-destructive transition-colors ml-0.5"
                aria-label={`Remove ${tag}`}
              >
                <X className="w-3 h-3" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Custom input for options not in the preset list */}
      <div className="flex gap-2">
        <Input
          value={customInputValue}
          onChange={(e) => onCustomInputChange(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter" && customInputValue.trim()) { e.preventDefault(); onAddCustom(); }
          }}
          placeholder={t("profile.add_custom_interest")}
          className="h-8 text-sm border-border/40 focus:border-primary/40 flex-1 font-light placeholder:italic placeholder:text-muted-foreground/40"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={onAddCustom}
          disabled={!customInputValue.trim() || saveState === "saving"}
          className="h-8 px-3 border-border/40 hover:border-primary/40 text-muted-foreground"
          aria-label={`Add custom ${label}`}
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline gap-2 border-b border-border/40 pb-2 last:border-0">
      <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/70 shrink-0">{label}</span>
      <span className="text-sm text-foreground text-right font-light truncate">{value}</span>
    </div>
  );
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
