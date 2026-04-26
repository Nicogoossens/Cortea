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
  ExternalLink, ChevronRight, ChevronDown, User, Languages, Trash2, X, Lock, Camera, Pencil, Check,
  Layers, MapPin, ArrowRight, UtensilsCrossed,
  Eye, EyeOff, KeyRound, Loader2 as PasswordLoader2,
} from "lucide-react";
import { format, type Locale } from "date-fns";
import { enGB, enUS, enAU, enCA, nl, fr, de, es, pt, ptBR, it, ar, ja } from "date-fns/locale";
import { useLanguage, type SupportedLocale, LOCALE_GROUPS } from "@/lib/i18n";
import { OBJECTIVE_OPTIONS, SPHERE_OPTIONS } from "@/lib/profile-options";
import { useActiveRegion, COMPASS_REGIONS, FlagEmoji, type RegionCode } from "@/lib/active-region";
import { levelKey, pillarDomainKey, pillarTitleKey } from "@/lib/content-labels";
import { useAuth } from "@/lib/auth";
import React, { useState, useEffect, useCallback, useRef, KeyboardEvent } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { usePageTitle } from "@/hooks/usePageTitle";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const DATE_FNS_LOCALE: Record<SupportedLocale, Locale> = {
  "en-GB": enGB, "en-US": enUS, "en-AU": enAU, "en-CA": enCA,
  "nl-NL": nl, "fr-FR": fr, "de-DE": de,
  "es-ES": es, "es-MX": es,
  "pt-PT": pt, "pt-BR": ptBR,
  "it-IT": it,
  "ar-SA": ar,
  "ja-JP": ja,
};

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia",
  "Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium",
  "Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei",
  "Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia","Cameroon","Canada",
  "Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica",
  "Croatia","Cuba","Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic",
  "Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia",
  "Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada",
  "Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India",
  "Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan",
  "Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya",
  "Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali",
  "Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco",
  "Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands",
  "New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman",
  "Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines",
  "Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia",
  "Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia",
  "Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia",
  "Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka",
  "Sudan","Suriname","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand",
  "Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu",
  "Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan",
  "Vanuatu","Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
];

interface BehaviorProfile {
  listening_score: number;
  assertiveness_style: "assertive" | "passive" | "aggressive" | "passive_aggressive";
  conflict_mode: "collaborate" | "avoid" | "compete" | "accommodate";
  nonverbal_awareness: number;
  eq_dimensions: {
    self_awareness: number;
    self_regulation: number;
    empathy: number;
    social_skill: number;
  };
}

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
  situational_interests?: string[] | null;
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

interface UseCaseWithRating {
  id: number;
  slug: string;
  title: string;
  flag_emoji: string;
  formality_level: string;
  domain_tags: string[];
  primary_tool: string;
  readiness_score: number | null;
  component_scores: {
    atelier: number | null;
    counsel: number | null;
    mirror: number | null;
    compass: number | null;
  } | null;
}

const AMBITION_LEVELS: { key: string; labelKey: string; descKey: string }[] = [
  { key: "casual",       labelKey: "ambition.casual.label",       descKey: "ambition.casual.desc" },
  { key: "professional", labelKey: "ambition.professional.label", descKey: "ambition.professional.desc" },
  { key: "diplomatic",   labelKey: "ambition.diplomatic.label",   descKey: "ambition.diplomatic.desc" },
];

const LEGACY_AMBITION_MAP: Record<string, string> = {
  curious:      "casual",
  aspirational: "professional",
  distinguished: "diplomatic",
};

function normalizeAmbitionLevel(level: string | null | undefined): string | null | undefined {
  if (!level) return level;
  return LEGACY_AMBITION_MAP[level] ?? level;
}

const GENDER_OPTIONS: { value: string; labelKey: string }[] = [
  { value: "male",              labelKey: "profile.gender_male" },
  { value: "female",            labelKey: "profile.gender_female" },
  { value: "non_binary",        labelKey: "profile.gender_non_binary" },
  { value: "other",             labelKey: "profile.gender_other" },
  { value: "prefer_not_to_say", labelKey: "profile.gender_prefer_not" },
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

const ASSERTIVENESS_SCORE: Record<string, number> = {
  assertive: 82,
  passive: 42,
  aggressive: 22,
  passive_aggressive: 18,
};

const CONFLICT_SCORE: Record<string, number> = {
  collaborate: 88,
  accommodate: 58,
  avoid: 32,
  compete: 18,
};

function behaviorToRadar(p: BehaviorProfile): [number, number, number, number, number] {
  const attentiveness = p.listening_score;
  const composure = ASSERTIVENESS_SCORE[p.assertiveness_style] ?? 50;
  const eq = Math.round((p.eq_dimensions.self_awareness + p.eq_dimensions.self_regulation + p.eq_dimensions.empathy + p.eq_dimensions.social_skill) / 4);
  const diplomacy = CONFLICT_SCORE[p.conflict_mode] ?? 50;
  const presence = p.nonverbal_awareness;
  return [attentiveness, composure, eq, diplomacy, presence];
}

interface PentagonChartProps {
  values: [number, number, number, number, number];
  labels: [string, string, string, string, string];
  color?: string;
}

function PentagonChart({ values, labels, color = "var(--primary)" }: PentagonChartProps) {
  const cx = 130;
  const cy = 130;
  const maxR = 100;
  const angles = [-90, -18, 54, 126, 198].map((a) => (a * Math.PI) / 180);

  function point(r: number, i: number): string {
    return `${cx + r * Math.cos(angles[i])},${cy + r * Math.sin(angles[i])}`;
  }

  const gridLevels = [0.25, 0.5, 0.75, 1];

  const dataPoints = values
    .map((v, i) => {
      const r = (Math.min(v, 100) / 100) * maxR;
      return point(r, i);
    })
    .join(" ");

  return (
    <svg width="260" height="260" viewBox="0 0 260 260" className="mx-auto" role="img" aria-label="Refinement compass">
      {gridLevels.map((frac) => {
        const pts = angles.map((_, i) => point(maxR * frac, i)).join(" ");
        return <polygon key={frac} points={pts} fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border" />;
      })}
      {angles.map((_, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + maxR * Math.cos(angles[i])} y2={cy + maxR * Math.sin(angles[i])} stroke="currentColor" strokeWidth="0.5" className="text-border" />
      ))}
      <polygon
        points={dataPoints}
        fill={color}
        fillOpacity={0.15}
        stroke={color}
        strokeWidth="2"
      />
      {values.map((v, i) => {
        const r = (Math.min(v, 100) / 100) * maxR;
        const x = cx + r * Math.cos(angles[i]);
        const y = cy + r * Math.sin(angles[i]);
        return <circle key={i} cx={x} cy={y} r={4} fill={color} />;
      })}
      {labels.map((label, i) => {
        const labelR = maxR + 20;
        const x = cx + labelR * Math.cos(angles[i]);
        const y = cy + labelR * Math.sin(angles[i]);
        const anchor = x < cx - 5 ? "end" : x > cx + 5 ? "start" : "middle";
        return (
          <text key={i} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" className="fill-muted-foreground" fontSize="10" fontFamily="var(--font-mono, monospace)" letterSpacing="0.08em">
            {label.toUpperCase()}
          </text>
        );
      })}
    </svg>
  );
}

export default function Profile() {
  usePageTitle("My Profile");
  const { t, locale, setLocale } = useLanguage();
  const dateFnsLocale = DATE_FNS_LOCALE[locale] ?? enGB;
  const { activeRegion, setActiveRegion, getRegionName } = useActiveRegion();
  const { userId, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [behaviorProfile, setBehaviorProfile] = useState<BehaviorProfile | null>(null);
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
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [editingFullName, setEditingFullName] = useState(false);
  const [fullNameInput, setFullNameInput] = useState("");
  const [fullNameSave, setFullNameSave] = useState<SaveState>("idle");
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [avatarSave, setAvatarSave] = useState<SaveState>("idle");

  // Birth year & gender — editable once, then locked
  const [birthYearInput, setBirthYearInput] = useState("");
  const [birthYearSave, setBirthYearSave] = useState<SaveState>("idle");
  const [genderSave, setGenderSave] = useState<SaveState>("idle");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Ambition level
  const [ambitionSave, setAmbitionSave] = useState<SaveState>("idle");

  // Interests & Objectives
  const [editingCountry, setEditingCountry] = useState(false);
  const [countryInput, setCountryInput] = useState("");
  const [countrySave, setCountrySave] = useState<SaveState>("idle");
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [objectivesSave, setObjectivesSave] = useState<SaveState>("idle");
  const [sportsSave, setSportsSave] = useState<SaveState>("idle");
  const [cuisineSave, setCuisineSave] = useState<SaveState>("idle");
  const [dressCodeSave, setDressCodeSave] = useState<SaveState>("idle");
  const [spheresSave, setSpheresSave] = useState<SaveState>("idle");

  const fetchProfile = useCallback(() => {
    if (!userId) { setProfileLoading(false); return; }
    Promise.all([
      fetch(`${API_BASE}/api/users/profile`, { credentials: "include" }).then((r) => r.ok ? r.json() : null),
      fetch(`${API_BASE}/api/users/behavior-profile`, { credentials: "include" }).then((r) => r.ok ? r.json() : null),
    ])
      .then(([data, bp]) => {
        setProfileData(data);
        setUsernameInput(data?.username ?? "");
        setFullNameInput(data?.full_name ?? "");
        setCountryInput(data?.country_of_origin ?? "");
        setBirthYearInput(data?.birth_year ? String(data.birth_year) : "");
        if (bp && typeof bp.listening_score === "number") setBehaviorProfile(bp as BehaviorProfile);
      })
      .catch(() => setProfileData(null))
      .finally(() => setProfileLoading(false));
  }, [userId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const { data: nobleScore, isLoading: scoreLoading } = useGetNobleScore({ query: { queryKey: getGetNobleScoreQueryKey() } });
  const { data: pillars, isLoading: pillarsLoading } = useGetPillarProgress({ query: { queryKey: getGetPillarProgressQueryKey() } });
  const { data: rawLogs, isLoading: logsLoading } = useGetNobleScoreLog({ limit: 10 }, { query: { queryKey: getGetNobleScoreLogQueryKey({ limit: 10 }) } });

  const { data: useCasesData } = useQuery<UseCaseWithRating[]>({
    queryKey: ["use-cases-profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/use-cases`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
  });
  const logs = rawLogs as EnrichedLogEntry[] | undefined;

  async function patchProfile(
    body: Record<string, unknown>,
    setSave: (s: SaveState) => void,
    setConflictError?: (msg: string | null) => void,
  ): Promise<boolean> {
    setSave("saving");
    if (setConflictError) setConflictError(null);
    try {
      const res = await fetch(`${API_BASE}/api/users/profile`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfileData(updated);
        setSave("saved");
        setTimeout(() => setSave("idle"), 2500);
        return true;
      } else if (res.status === 409) {
        const err = await res.json().catch(() => ({}));
        if (setConflictError) {
          setConflictError(
            err.code === "USERNAME_TAKEN"
              ? t("profile.username_taken")
              : t("profile.full_name_taken"),
          );
        }
        setSave("error");
        return false;
      } else {
        setSave("error");
        return false;
      }
    } catch {
      setSave("error");
      return false;
    }
  }

  async function handleLanguageChange(newLocale: SupportedLocale) {
    if (!userId) return;
    setLangSave("saving");
    const langCode = newLocale.split("-")[0];
    try {
      const res = await fetch(`${API_BASE}/api/users/profile`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
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
        credentials: "include",
        headers: { "Content-Type": "application/json" },
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
    const ok = await patchProfile({ username: usernameInput.trim() || null }, setUsernameSave, setUsernameError);
    if (ok) setEditingUsername(false);
  }

  async function handleFullNameSubmit() {
    const ok = await patchProfile({ full_name: fullNameInput.trim() || null }, setFullNameSave, setFullNameError);
    if (ok) setEditingFullName(false);
  }

  async function handleBirthYearSubmit() {
    const year = parseInt(birthYearInput, 10);
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() - 5) return;
    await patchProfile({ birth_year: year }, setBirthYearSave);
  }

  async function handleGenderSelect(value: string) {
    await patchProfile({ gender_identity: value }, setGenderSave);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (avatarInputRef.current) avatarInputRef.current.value = "";

    const MAX_SIDE = 800;
    const QUALITY = 0.82;

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            const { width: w, height: h } = img;
            const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(w * scale);
            canvas.height = Math.round(h * scale);
            const ctx = canvas.getContext("2d");
            if (!ctx) { resolve(ev.target?.result as string); return; }
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", QUALITY));
          };
          img.onerror = reject;
          img.src = ev.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await patchProfile({ avatar_url: dataUrl }, setAvatarSave);
    } catch {
      setAvatarSave("error");
    }
  }

  async function handleAmbitionChange(level: string) {
    if (normalizeAmbitionLevel(profileData?.ambition_level) === level || ambitionSave === "saving") return;
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

  async function handleSphereToggle(sphere: string) {
    if (spheresSave === "saving") return;
    const current = profileData?.situational_interests ?? [];
    const next = current.includes(sphere)
      ? current.filter((s) => s !== sphere)
      : [...current, sphere];
    await patchProfile({ situational_interests: next }, setSpheresSave);
  }

  async function handleDeleteAccount() {
    if (!userId || deleteInput !== "DELETE") return;
    setDeleting(true);
    try {
      await fetch(`${API_BASE}/api/users/profile`, { method: "DELETE", credentials: "include" });
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
          <input ref={avatarInputRef} type="file" accept="image/*,image/heic,image/heif" className="absolute opacity-0 w-0 h-0 pointer-events-none" tabIndex={-1} aria-hidden="true" onChange={handleAvatarUpload} />
          {avatarSave === "saving" && (
            <div className="absolute inset-0 rounded-full bg-background/60 flex items-center justify-center">
              <span className="text-xs font-mono animate-pulse">…</span>
            </div>
          )}
        </div>

        {/* Name + Meta */}
        <div className="flex-1 space-y-2 min-w-0">
          {/* Full name — editable only when empty, locked once set */}
          <div className="flex flex-wrap items-center gap-3">
            {profileData?.full_name ? (
              <span className="text-3xl font-serif text-foreground flex items-center gap-2">
                {profileData.full_name}
                <Lock className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" aria-label={t("profile.locked_field_hint")} />
              </span>
            ) : editingFullName ? (
              <div className="space-y-1">
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
                  <button onClick={() => { setEditingFullName(false); setFullNameInput(""); setFullNameError(null); }} className="text-muted-foreground hover:text-foreground" aria-label="Cancel">
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
                {fullNameError && <p className="text-xs text-destructive font-mono">{fullNameError}</p>}
              </div>
            ) : (
              <button
                className="group flex items-center gap-2 text-3xl font-serif text-foreground hover:text-foreground/80 transition-colors"
                onClick={() => setEditingFullName(true)}
                aria-label="Edit full name"
              >
                <span className="text-muted-foreground font-light italic text-xl">{t("profile.set_name_placeholder")}</span>
                <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
              </button>
            )}
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono uppercase tracking-widest border border-primary/20 shrink-0">
              {profileData?.subscription_tier ?? "guest"}
            </span>
            <SaveIndicator state={fullNameSave} t={t} />
          </div>

          {/* Username */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-muted-foreground/50">@</span>
              {editingUsername ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={usernameInput}
                    onChange={(e) => { setUsernameInput(e.target.value.replace(/\s/g, "_")); setUsernameError(null); }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleUsernameSubmit(); if (e.key === "Escape") { setEditingUsername(false); setUsernameError(null); } }}
                    className="h-7 py-0 px-2 font-mono text-sm border-primary/40 w-40"
                    placeholder="username"
                    autoFocus
                  />
                  <button onClick={handleUsernameSubmit} className="text-primary hover:text-primary/70" aria-label="Save username">
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button onClick={() => { setEditingUsername(false); setUsernameInput(profileData?.username ?? ""); setUsernameError(null); }} className="text-muted-foreground hover:text-foreground" aria-label="Cancel">
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
            {usernameError && <p className="text-xs text-destructive font-mono pl-4">{usernameError}</p>}
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
                      normalizeAmbitionLevel(profileData?.ambition_level) === key
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
                  {t(AMBITION_LEVELS.find((l) => l.key === normalizeAmbitionLevel(profileData.ambition_level))?.descKey ?? "")}
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
            <DetailRow label={t("profile.full_name_label")} value={profileData?.full_name ?? "—"} locked={!!profileData?.full_name} />
            <DetailRow label={t("profile.email_label")} value={profileData?.email ?? "—"} />

            {/* Birth year — editable when empty, locked when set */}
            <div className="border-b border-border/40 pb-2">
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/70 shrink-0">{t("profile.birth_year_label")}</span>
                {profileData?.birth_year ? (
                  <span className="flex items-center gap-1.5 text-sm text-foreground font-light">
                    {profileData.birth_year}
                    <Lock className="w-3 h-3 text-muted-foreground/40 shrink-0" aria-label={t("profile.locked_field_hint")} />
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={birthYearInput}
                      onChange={(e) => setBirthYearInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      onKeyDown={(e) => { if (e.key === "Enter") handleBirthYearSubmit(); }}
                      placeholder={t("profile.birth_year_placeholder")}
                      className="h-7 py-0 px-2 text-sm w-24 border-border/50 focus:border-primary/40 text-right"
                    />
                    <button
                      onClick={handleBirthYearSubmit}
                      disabled={!birthYearInput || birthYearSave === "saving"}
                      className="text-primary hover:text-primary/70 disabled:opacity-40"
                      aria-label="Save year of birth"
                    >
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <SaveIndicator state={birthYearSave} t={t} />
                  </div>
                )}
              </div>
            </div>

            {/* Gender — chips when empty, locked when set */}
            <div className="border-b border-border/40 pb-2 last:border-0 space-y-2">
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/70 shrink-0">{t("profile.gender_label")}</span>
                {profileData?.gender_identity ? (
                  <span className="flex items-center gap-1.5 text-sm text-foreground font-light">
                    {capitalize(profileData.gender_identity.replace("_", " "))}
                    <Lock className="w-3 h-3 text-muted-foreground/40 shrink-0" aria-label={t("profile.locked_field_hint")} />
                  </span>
                ) : (
                  <div className="flex items-center gap-0.5">
                    <SaveIndicator state={genderSave} t={t} />
                  </div>
                )}
              </div>
              {!profileData?.gender_identity && (
                <div className="flex flex-wrap gap-1.5">
                  {GENDER_OPTIONS.map(({ value, labelKey }) => (
                    <button
                      key={value}
                      onClick={() => handleGenderSelect(value)}
                      disabled={genderSave === "saving"}
                      className="px-2.5 py-1 rounded-sm text-xs border border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/30 transition-all"
                    >
                      {t(labelKey)}
                    </button>
                  ))}
                </div>
              )}
            </div>

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

      {/* ── Interests & Objectives ── collapsible ── */}
      <CollapsibleSection
        title={t("profile.interests_title")}
        icon={<Target className="w-4 h-4 text-primary/60" aria-hidden="true" />}
        description={t("profile.interests_subtitle")}
      >
        <CardContent className="space-y-6">

          {/* Country of origin */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground/70">{t("profile.country_origin_label")}</label>
              <SaveIndicator state={countrySave} t={t} />
            </div>
            {editingCountry ? (
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    value={countryInput}
                    onChange={(e) => {
                      setCountryInput(e.target.value);
                      setCountryDropdownOpen(true);
                    }}
                    onFocus={() => setCountryDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setCountryDropdownOpen(false), 120)}
                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter") { setCountryDropdownOpen(false); handleCountrySubmit(); }
                      if (e.key === "Escape") { setCountryDropdownOpen(false); setEditingCountry(false); setCountryInput(profileData?.country_of_origin ?? ""); }
                    }}
                    placeholder="e.g. Belgium"
                    className="h-8 text-sm border-primary/40 focus:border-primary w-full"
                    autoFocus
                  />
                  {countryDropdownOpen && (() => {
                    const q = countryInput.trim().toLowerCase();
                    const filtered = q
                      ? COUNTRIES.filter(c => c.toLowerCase().includes(q))
                      : COUNTRIES;
                    return filtered.length > 0 ? (
                      <ul className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-sm border border-border bg-background shadow-md">
                        {filtered.slice(0, 30).map(country => (
                          <li key={country}>
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setCountryInput(country);
                                setCountryDropdownOpen(false);
                              }}
                              className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors"
                            >
                              {country}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null;
                  })()}
                </div>
                <button onClick={() => { setCountryDropdownOpen(false); handleCountrySubmit(); }} className="text-primary hover:text-primary/70 transition-colors" aria-label="Save">
                  <Check className="w-4 h-4" aria-hidden="true" />
                </button>
                <button onClick={() => { setCountryDropdownOpen(false); setEditingCountry(false); setCountryInput(profileData?.country_of_origin ?? ""); }} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Cancel">
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
            presets={INTEREST_PRESETS.sports}
            tags={profileData?.interests_sports ?? []}
            saveState={sportsSave}
            onTogglePreset={(v) => {
              const active = (profileData?.interests_sports ?? []).includes(v);
              if (active) handleTagRemove("sports", v);
              else handleTagAdd("sports", v, () => {});
            }}
            onRemove={(v) => handleTagRemove("sports", v)}
            t={t}
          />

          {/* Dress Code Preferences */}
          <InterestSelector
            label={t("profile.dress_code_prefs_label")}
            presets={INTEREST_PRESETS.dress_code}
            tags={profileData?.interests_dress_code ?? []}
            saveState={dressCodeSave}
            onTogglePreset={(v) => {
              const active = (profileData?.interests_dress_code ?? []).includes(v);
              if (active) handleTagRemove("dress_code", v);
              else handleTagAdd("dress_code", v, () => {});
            }}
            onRemove={(v) => handleTagRemove("dress_code", v)}
            t={t}
          />

        </CardContent>
      </CollapsibleSection>

      {/* ── Culinaire Interesses ── collapsible ── */}
      <CollapsibleSection
        title={t("profile.culinary_interests_label")}
        icon={<UtensilsCrossed className="w-4 h-4 text-primary/60" aria-hidden="true" />}
      >
        <CardContent>
          <InterestSelector
            label={t("profile.culinary_interests_label")}
            presets={INTEREST_PRESETS.cuisine}
            tags={profileData?.interests_cuisine ?? []}
            saveState={cuisineSave}
            onTogglePreset={(v) => {
              const active = (profileData?.interests_cuisine ?? []).includes(v);
              if (active) handleTagRemove("cuisine", v);
              else handleTagAdd("cuisine", v, () => {});
            }}
            onRemove={(v) => handleTagRemove("cuisine", v)}
            t={t}
          />
        </CardContent>
      </CollapsibleSection>

      {/* ── Jouw Sferen ── collapsible ── */}
      <CollapsibleSection
        title={t("profile.spheres_title")}
        icon={<Layers className="w-4 h-4 text-primary/60" aria-hidden="true" />}
        description={t("profile.spheres_subtitle")}
      >
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {SPHERE_OPTIONS.map(({ key, icon: Icon, labelKey }) => {
              const isActive = (profileData?.situational_interests ?? []).includes(key);
              return (
                <button
                  key={key}
                  onClick={() => handleSphereToggle(key)}
                  disabled={spheresSave === "saving"}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-sm border text-sm transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary border-primary/35 font-medium"
                      : "border-border/50 text-muted-foreground hover:border-primary/30 hover:bg-muted/30 hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  {t(labelKey)}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-2 h-4">
            <SaveIndicator state={spheresSave} t={t} />
          </div>
        </CardContent>
      </CollapsibleSection>

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
                    <span className="font-serif italic text-foreground/80 text-sm">{t(pillarTitleKey(pillar.current_title))}</span>
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
                        {t("profile.next")}: {t(pillarTitleKey(pillar.next_title))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Use Case Readiness ── */}
      {useCasesData && useCasesData.length > 0 && (() => {
        const sorted = [...useCasesData]
          .filter(uc => uc.readiness_score !== null)
          .sort((a, b) => (b.readiness_score ?? 0) - (a.readiness_score ?? 0));
        const top3 = sorted.slice(0, 3);
        const focus = sorted[sorted.length - 1];

        if (top3.length === 0) return null;

        const getColor = (s: number) => {
          if (s >= 75) return "#16a34a";
          if (s >= 50) return "#ca8a04";
          if (s >= 25) return "#ea580c";
          return "#dc2626";
        };

        const SmallCircle = ({ score }: { score: number }) => {
          const size = 44;
          const radius = (size - 6) / 2;
          const circumference = 2 * Math.PI * radius;
          return (
            <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
              <svg width={size} height={size} className="-rotate-90">
                <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="currentColor" strokeWidth={3} className="text-muted/30" />
                <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={getColor(score)} strokeWidth={3}
                  strokeDasharray={circumference} strokeDashoffset={circumference - (score / 100) * circumference}
                  strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold" style={{ color: getColor(score) }}>
                {score}%
              </span>
            </div>
          );
        };

        return (
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary/70" />
                Your Situation Readiness
              </CardTitle>
              <CardDescription>Readiness scores across curated real-world situations, derived from all your tools.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Top situations</h4>
                <div className="space-y-2">
                  {top3.map((uc) => (
                    <Link key={uc.id} href="/use-cases">
                      <div className="flex items-center gap-3 p-3 rounded-sm border border-border/40 hover:border-primary/30 hover:bg-muted/20 transition-all cursor-pointer group">
                        <span className="text-lg flex-shrink-0">{uc.flag_emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium leading-snug group-hover:text-primary transition-colors truncate">{uc.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 capitalize">{uc.formality_level.replace(/_/g, " ")}</div>
                        </div>
                        <SmallCircle score={uc.readiness_score!} />
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors group-hover:translate-x-0.5 flex-shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {focus && focus.id !== top3[0]?.id && (
                <div className="space-y-3 pt-4 border-t border-border/30">
                  <h4 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Focus area</h4>
                  <Link href="/use-cases">
                    <div className="flex items-center gap-3 p-3 rounded-sm border border-destructive/20 bg-destructive/5 hover:border-destructive/30 transition-all cursor-pointer group">
                      <span className="text-lg flex-shrink-0">{focus.flag_emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium leading-snug group-hover:text-destructive transition-colors truncate">{focus.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Lowest readiness — most room to grow</div>
                      </div>
                      <SmallCircle score={focus.readiness_score!} />
                    </div>
                  </Link>
                </div>
              )}

              <div className="flex justify-end">
                <Link href="/use-cases">
                  <Button variant="outline" size="sm" className="gap-2 text-xs">
                    <MapPin className="h-3.5 w-3.5" />
                    View all use cases
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* ── Refinement Compass ── */}
      {behaviorProfile && (() => {
        const radarValues = behaviorToRadar(behaviorProfile);
        const RADAR_LABELS: [string, string, string, string, string] = [
          t("profile.compass.attentiveness"),
          t("profile.compass.composure"),
          t("profile.compass.discernment"),
          t("profile.compass.diplomacy"),
          t("profile.compass.presence"),
        ];
        return (
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-xl">{t("profile.compass.title")}</CardTitle>
              <CardDescription>{t("profile.compass.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <PentagonChart values={radarValues} labels={RADAR_LABELS} />
              </div>
              <div className="flex flex-col gap-3 flex-1 min-w-0">
                {(["attentiveness", "composure", "discernment", "diplomacy", "presence"] as const).map((key, i) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{t(`profile.compass.${key}`)}</span>
                      <span className="text-xs text-muted-foreground font-mono">{radarValues[i]}</span>
                    </div>
                    <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary/70 transition-all duration-700" style={{ width: `${radarValues[i]}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

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

      {/* ── Password ── */}
      <PasswordSection />

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

/* ── Interest selector sub-component ── preset chips only ── */
interface InterestSelectorProps {
  label: string;
  presets: string[];
  tags: string[];
  saveState: SaveState;
  onTogglePreset: (v: string) => void;
  onRemove: (v: string) => void;
  t: (k: string) => string;
}

function InterestSelector({
  label, presets, tags, saveState,
  onTogglePreset, onRemove, t,
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

    </div>
  );
}

/**
 * Collapsible card section — header is always visible; body toggles on click.
 * Starts collapsed (isOpen = false) and resets to collapsed on next page load.
 */
function CollapsibleSection({
  title, icon, description, className, children,
}: {
  title: string;
  icon?: React.ReactNode;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Card className={`bg-card border-border shadow-sm ${className ?? ""}`}>
      <CardHeader
        className="pb-3 cursor-pointer select-none"
        onClick={() => setIsOpen((v) => !v)}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setIsOpen((v) => !v); } }}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </div>
        {description && (
          <CardDescription className="font-light">{description}</CardDescription>
        )}
      </CardHeader>
      {isOpen && <>{children}</>}
    </Card>
  );
}

function DetailRow({ label, value, locked }: { label: string; value: string; locked?: boolean }) {
  return (
    <div className="flex justify-between items-baseline gap-2 border-b border-border/40 pb-2 last:border-0">
      <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/70 shrink-0">{label}</span>
      <span className="flex items-center gap-1.5 text-sm text-foreground text-right font-light truncate">
        {value}
        {locked && <Lock className="w-3 h-3 text-muted-foreground/40 shrink-0 flex-none" aria-hidden="true" />}
      </span>
    </div>
  );
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function PasswordSection() {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newPw || newPw.length < 8) { setMessage("Wachtwoord moet minimaal 8 tekens hebben."); setState("error"); return; }
    if (newPw !== confirmPw) { setMessage("De wachtwoorden komen niet overeen."); setState("error"); return; }
    setState("loading");
    setMessage(null);
    try {
      const body: Record<string, string> = { password: newPw };
      if (currentPw) body.current_password = currentPw;
      const res = await fetch(`${API_BASE}/api/auth/set-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { message?: string; error?: string };
      if (!res.ok) {
        setMessage(data.error ?? "Instellen mislukt.");
        setState("error");
      } else {
        setMessage(data.message ?? "Wachtwoord bijgewerkt.");
        setState("done");
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
        setTimeout(() => setState("idle"), 4000);
      }
    } catch {
      setMessage("Er is een fout opgetreden. Probeer opnieuw.");
      setState("error");
    }
  }

  return (
    <CollapsibleSection
      title="Wachtwoord instellen"
      icon={<KeyRound className="w-5 h-5 text-muted-foreground" aria-hidden="true" />}
      description="Stel een wachtwoord in om direct in te loggen zonder link."
    >
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="pw-current" className="text-sm font-medium text-foreground">Huidig wachtwoord <span className="text-xs text-muted-foreground/60">(leeg laten als nog niet ingesteld)</span></label>
            <Input
              id="pw-current"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={currentPw}
              onChange={(e) => { setCurrentPw(e.target.value); setState("idle"); setMessage(null); }}
              className="rounded-sm"
              disabled={state === "loading"}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="pw-new" className="text-sm font-medium text-foreground">Nieuw wachtwoord <span className="text-destructive" aria-hidden="true">*</span></label>
            <div className="relative">
              <Input
                id="pw-new"
                type={showNew ? "text" : "password"}
                autoComplete="new-password"
                placeholder="min. 8 tekens"
                value={newPw}
                onChange={(e) => { setNewPw(e.target.value); setState("idle"); setMessage(null); }}
                className="rounded-sm pr-10"
                disabled={state === "loading"}
                required
              />
              <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground" tabIndex={-1}>
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="pw-confirm" className="text-sm font-medium text-foreground">Bevestig wachtwoord <span className="text-destructive" aria-hidden="true">*</span></label>
            <div className="relative">
              <Input
                id="pw-confirm"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="herhaal wachtwoord"
                value={confirmPw}
                onChange={(e) => { setConfirmPw(e.target.value); setState("idle"); setMessage(null); }}
                className="rounded-sm pr-10"
                disabled={state === "loading"}
                required
              />
              <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground" tabIndex={-1}>
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {message && (
            <p className={`text-sm px-3 py-2 rounded-sm border ${state === "done" ? "text-green-700 bg-green-50 border-green-200" : "text-destructive bg-destructive/5 border-destructive/30"}`} role="alert">
              {message}
            </p>
          )}

          <Button
            type="submit"
            className="font-serif rounded-sm"
            disabled={!newPw || !confirmPw || state === "loading"}
          >
            {state === "loading" ? (
              <><PasswordLoader2 className="w-4 h-4 mr-2 animate-spin" />Opslaan…</>
            ) : state === "done" ? (
              <><CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />Opgeslagen</>
            ) : (
              "Wachtwoord opslaan"
            )}
          </Button>
        </form>
      </CardContent>
    </CollapsibleSection>
  );
}
