import {
  useGetNobleScore,
  useGetPillarProgress,
  useGetNobleScoreLog,
  useGetLearningTrackBadges,
  getGetNobleScoreQueryKey,
  getGetPillarProgressQueryKey,
  getGetNobleScoreLogQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  Award, Calendar, Globe, Target, Clock, CheckCircle2, AlertTriangle,
  ExternalLink, ChevronRight, ChevronDown, User, Languages, Trash2, X, Lock, Camera, Pencil, Check,
  Layers, MapPin, ArrowRight, UtensilsCrossed, Bookmark, BookOpen,
  Eye, EyeOff, KeyRound, Loader2 as PasswordLoader2,
  Trophy, Medal, Shield, Download, ToggleLeft, ToggleRight, Info,
  Users2 as Users2Icon, Link2 as LinkIcon, Copy as CopyIcon, Loader2 as Loader2Icon,
} from "lucide-react";
import { format, type Locale } from "date-fns";
import { enGB, enUS, enAU, enCA, nl, fr, de, es, pt, ptBR, it, ar, ja, zhCN } from "date-fns/locale";
import { useLanguage, type SupportedLocale } from "@/lib/i18n";
import { LOCALE_GROUPS } from "@/lib/i18n-locales";
import { OBJECTIVE_OPTIONS, SPHERE_OPTIONS } from "@/lib/profile-options";
import { useActiveRegion, COMPASS_REGIONS, FlagEmoji, type RegionCode } from "@/lib/active-region";
import { levelKey, pillarDomainKey, pillarTitleKey } from "@/lib/content-labels";
import { useAuth } from "@/lib/auth";
import { VenueCard } from "@/components/VenueCard";
import { useSavedVenues } from "@/lib/saved-venues";
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
  "zh-CN": zhCN,
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
  country_of_origin_locked_at?: string | null;
  objectives?: string[] | null;
  interests_sports?: string[] | null;
  interests_cuisine?: string[] | null;
  interests_dress_code?: string[] | null;
  onboarding_completed?: boolean | null;
  situational_interests?: string[] | null;
  profiling_consent?: boolean | null;
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

interface PurchasedGuide {
  id: string;
  title: string;
  description: string | null;
  pillar: string;
  region_code: string | null;
  price_cents: number;
  tier_required: string | null;
  purchased_at: string;
}

const GUIDE_PILLAR_LABEL_KEYS: Record<string, string> = {
  internship: "guides.pillar.internship",
  exchange: "guides.pillar.exchange",
  dining: "guides.pillar.dining",
  interview: "guides.pillar.interview",
  networking: "guides.pillar.networking",
  travel: "guides.pillar.travel",
  business: "guides.pillar.business",
};

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

/**
 * Mask an e-mail address as `j••••@example.com`: first character of the local
 * part, four bullet characters, then the original domain. Never reveals the
 * full local part on the read-only Personal Details panel.
 */
function maskEmail(email: string | null | undefined): string {
  if (!email) return "—";
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0) return trimmed;
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at);
  return `${local[0]}••••${domain}`;
}

/**
 * Eight base languages selectable from the Profile preferences dropdown.
 * Each entry maps a base language code (used for `language_code` persisted to
 * the DB) to a sensible default regional locale (used for `setLocale()` so the
 * UI switches immediately). The codebase ships translations for these
 * languages today; if a Hindi locale is added later it should be appended here.
 */
const PROFILE_LANGUAGE_OPTIONS: { code: string; locale: SupportedLocale; label: string }[] = [
  { code: "en", locale: "en-GB", label: "English" },
  { code: "nl", locale: "nl-NL", label: "Nederlands" },
  { code: "fr", locale: "fr-FR", label: "Français" },
  { code: "de", locale: "de-DE", label: "Deutsch" },
  { code: "es", locale: "es-ES", label: "Español" },
  { code: "pt", locale: "pt-PT", label: "Português" },
  { code: "it", locale: "it-IT", label: "Italiano" },
  { code: "ja", locale: "ja-JP", label: "日本語" },
];

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
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    tier: string;
    status: string;
    renewalDate: string | null;
    paymentFailed: boolean;
    hasStripeCustomer: boolean;
  } | null>(null);
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [courseRegionDropdownOpen, setCourseRegionDropdownOpen] = useState(false);
  const [showCourseChangeWarning, setShowCourseChangeWarning] = useState(false);
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

  // "Complete your profile" flow — for users missing full_name, birth_year,
  // or gender_identity (e.g. legacy / social sign-in accounts). Each field is
  // set-once, so we only render inputs for fields not yet populated.
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [completeProfileSave, setCompleteProfileSave] = useState<SaveState>("idle");
  const [completeProfileError, setCompleteProfileError] = useState<string | null>(null);
  const [cpFullName, setCpFullName] = useState("");
  const [cpBirthYear, setCpBirthYear] = useState("");
  const [cpGender, setCpGender] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Ambition level
  const [ambitionSave, setAmbitionSave] = useState<SaveState>("idle");

  // Interests & Objectives
  const [editingCountry, setEditingCountry] = useState(false);
  const [countryInput, setCountryInput] = useState("");
  const [countrySave, setCountrySave] = useState<SaveState>("idle");
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  // Separate state for the Course Settings card country editor
  const [editingCountryCourse, setEditingCountryCourse] = useState(false);
  const [countryInputCourse, setCountryInputCourse] = useState("");
  const [countryDropdownOpenCourse, setCountryDropdownOpenCourse] = useState(false);
  const [objectivesSave, setObjectivesSave] = useState<SaveState>("idle");
  const [sportsSave, setSportsSave] = useState<SaveState>("idle");
  const [cuisineSave, setCuisineSave] = useState<SaveState>("idle");
  const [dressCodeSave, setDressCodeSave] = useState<SaveState>("idle");
  const [spheresSave, setSpheresSave] = useState<SaveState>("idle");

  const fetchProfile = useCallback(() => {
    if (!userId) { setProfileLoading(false); return; }
    // Pass `user_id` as a query param so the server loads the authenticated
    // user's record. Auth still flows via the HttpOnly `cortea_session`
    // cookie (sent automatically with `credentials: "include"`).
    const profileUrl = `${API_BASE}/api/users/profile?user_id=${encodeURIComponent(userId)}`;
    Promise.all([
      fetch(profileUrl, { credentials: "include" }).then((r) => r.ok ? r.json() : null),
      fetch(`${API_BASE}/api/users/behavior-profile`, { credentials: "include" }).then((r) => r.ok ? r.json() : null),
      fetch(`${API_BASE}/api/subscription/status`, { credentials: "include" }).then((r) => r.ok ? r.json() : null),
    ])
      .then(([data, bp, subStatus]) => {
        setProfileData(data);
        setUsernameInput(data?.username ?? "");
        setFullNameInput(data?.full_name ?? "");
        setCountryInput(data?.country_of_origin ?? "");
        setCountryInputCourse(data?.country_of_origin ?? "");
        if (bp && typeof bp.listening_score === "number") setBehaviorProfile(bp as BehaviorProfile);
        if (subStatus && typeof subStatus.tier === "string") setSubscriptionStatus(subStatus);
      })
      .catch(() => setProfileData(null))
      .finally(() => setProfileLoading(false));
  }, [userId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // Deep-link focus: when the profile is opened with `?focus=region` (e.g.
  // from the Atelier "Wijzig uw actieve regio" link or the read-only region
  // chip), force-open the Cursusinstellingen card, scroll it into view, and
  // briefly highlight the leerregio dropdown so the user immediately sees
  // what to change. The flag auto-clears after the highlight animation so
  // a refresh does not keep flashing.
  const [focusRegion, setFocusRegion] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("focus") !== "region") return;
    setFocusRegion(true);
    // Scroll & highlight after the section has had a chance to expand.
    // We target the leerregio dropdown ANCHOR specifically (not the card
    // top) and use block:"center" so the control lands in the middle of
    // the viewport — otherwise the card opens but the dropdown sits below
    // the fold and the user does not see what to click.
    const timer = window.setTimeout(() => {
      const el =
        document.getElementById("focus-region-anchor") ??
        document.getElementById("course-settings-card");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 250);
    // Clear the highlight ring after a few seconds.
    const clearTimer = window.setTimeout(() => setFocusRegion(false), 4000);
    return () => { window.clearTimeout(timer); window.clearTimeout(clearTimer); };
  }, []);

  const { data: nobleScore, isLoading: scoreLoading } = useGetNobleScore({ query: { queryKey: getGetNobleScoreQueryKey() } });
  const { data: pillars, isLoading: pillarsLoading } = useGetPillarProgress({ query: { queryKey: getGetPillarProgressQueryKey() } });
  const { data: rawLogs, isLoading: logsLoading } = useGetNobleScoreLog({ limit: 10 }, { query: { queryKey: getGetNobleScoreLogQueryKey({ limit: 10 }) } });
  const { data: earnedBadges } = useGetLearningTrackBadges({
    query: { enabled: !!userId, staleTime: 30_000 },
  });

  const { data: purchasedGuides, isLoading: purchasedGuidesLoading } = useQuery<PurchasedGuide[]>({
    queryKey: ["purchased-guides", userId],
    enabled: !!userId,
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/guides/purchased`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

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

  /**
   * Persist a single profile preference (language or region) via the
   * unified PATCH /users/profile?user_id=... endpoint. Returns true on
   * success so callers can chain UI updates (e.g. setLocale).
   */
  async function patchPreferences(
    body: { language_code?: string; active_region?: string },
    setSave: (s: SaveState) => void,
  ): Promise<boolean> {
    if (!userId) return false;
    setSave("saving");
    try {
      const url = `${API_BASE}/api/users/profile?user_id=${encodeURIComponent(userId)}`;
      const res = await fetch(url, {
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
      }
      setSave("error");
      return false;
    } catch {
      setSave("error");
      return false;
    }
  }

  async function handleLanguageChange(newLocale: SupportedLocale) {
    if (!userId) return;
    const langCode = newLocale.split("-")[0];
    const ok = await patchPreferences({ language_code: langCode }, setLangSave);
    if (ok) setLocale(newLocale);
  }

  async function handleRegionChange(code: RegionCode) {
    setActiveRegion(code);
    setShowRegionPicker(false);
    // Persist via the unified PATCH /users/profile?user_id=... endpoint
    // (Task #16). On success, surface the existing "course change" warning
    // so the user is reminded that learning content recalibrates per region.
    const ok = await patchPreferences({ active_region: code }, setRegionSave);
    if (ok) setShowCourseChangeWarning(true);
  }

  async function handleUsernameSubmit() {
    const ok = await patchProfile({ username: usernameInput.trim() || null }, setUsernameSave, setUsernameError);
    if (ok) setEditingUsername(false);
  }

  async function handleFullNameSubmit() {
    const ok = await patchProfile({ full_name: fullNameInput.trim() || null }, setFullNameSave, setFullNameError);
    if (ok) setEditingFullName(false);
  }

  function openCompleteProfile() {
    setCpFullName(profileData?.full_name ?? "");
    setCpBirthYear(profileData?.birth_year ? String(profileData.birth_year) : "");
    setCpGender(profileData?.gender_identity ?? "");
    setCompleteProfileError(null);
    setCompleteProfileSave("idle");
    setShowCompleteProfile(true);
  }

  async function handleCompleteProfileSubmit() {
    const body: Record<string, unknown> = {};
    const currentYear = new Date().getFullYear();

    // Only include fields that are still missing on the profile (set-once
    // semantics — once populated they are locked server-side too).
    if (!profileData?.full_name) {
      const trimmed = cpFullName.trim();
      if (!trimmed) {
        setCompleteProfileError(t("profile.complete_error_full_name"));
        return;
      }
      body.full_name = trimmed;
    }
    if (!profileData?.birth_year) {
      const year = parseInt(cpBirthYear, 10);
      if (isNaN(year) || year < 1900 || year > currentYear - 5) {
        setCompleteProfileError(t("profile.complete_error_birth_year"));
        return;
      }
      body.birth_year = year;
    }
    if (!profileData?.gender_identity && cpGender) {
      body.gender_identity = cpGender;
    }

    if (Object.keys(body).length === 0) {
      setShowCompleteProfile(false);
      return;
    }

    const ok = await patchProfile(body, setCompleteProfileSave, setCompleteProfileError);
    if (ok) {
      setTimeout(() => setShowCompleteProfile(false), 600);
    }
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
    const ok = await patchProfile({ ambition_level: level }, setAmbitionSave);
    if (ok) setShowCourseChangeWarning(true);
  }

  async function handleObjectiveToggle(obj: string) {
    const current = profileData?.objectives ?? [];
    const next = current.includes(obj) ? current.filter((o) => o !== obj) : [...current, obj];
    await patchProfile({ objectives: next }, setObjectivesSave);
  }

  async function handleCountrySubmit() {
    const ok = await patchProfile({ country_of_origin: countryInput.trim() || null }, setCountrySave);
    if (ok) { setShowCourseChangeWarning(true); setCountryInputCourse(countryInput.trim()); }
    setEditingCountry(false);
  }

  async function handleCountrySubmitCourse() {
    const ok = await patchProfile({ country_of_origin: countryInputCourse.trim() || null }, setCountrySave);
    if (ok) { setShowCourseChangeWarning(true); setCountryInput(countryInputCourse.trim()); }
    setEditingCountryCourse(false);
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

  // Multi-country progress (Task #209): each interest country has its own
  // progress + badge trail, displayed as an independent panel below.
  const [interestsList, setInterestsList] = useState<{ region_code: string }[]>([]);
  const [interestsBusy, setInterestsBusy] = useState(false);
  type TrackProgressRow = {
    register: string;
    region_code: string;
    research_pillar: string | null;
    phase: number;
    current_level: number;
  };
  type TrackBadge = {
    id: number; slug: string; title: string; badge_type: string;
    region_code: string | null; phase: number | null;
  };
  const [trackProgress, setTrackProgress] = useState<TrackProgressRow[]>([]);
  const [trackBadges, setTrackBadges] = useState<TrackBadge[]>([]);
  useEffect(() => {
    if (!isAuthenticated) return;
    fetch(`${API_BASE}/api/users/country-interests`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((rows: { region_code: string }[]) => setInterestsList(rows))
      .catch(() => setInterestsList([]));
    fetch(`${API_BASE}/api/learning-tracks/progress`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((rows: TrackProgressRow[]) => setTrackProgress(rows))
      .catch(() => setTrackProgress([]));
    fetch(`${API_BASE}/api/learning-tracks/badges`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((rows: TrackBadge[]) => setTrackBadges(rows))
      .catch(() => setTrackBadges([]));
  }, [isAuthenticated, profileData?.id]);

  async function toggleInterestRegion(code: string) {
    if (interestsBusy) return;
    setInterestsBusy(true);
    try {
      const has = interestsList.some((r) => r.region_code === code);
      if (has) {
        const res = await fetch(`${API_BASE}/api/users/country-interests/${encodeURIComponent(code)}`, {
          method: "DELETE", credentials: "include",
        });
        if (!res.ok) {
          // 409 ACTIVE_REGION_LAST or other server-side rejection: surface
          // the message and leave local state untouched so the UI matches DB.
          let msg = t("profile.country_remove_failed", "Could not remove this country.");
          try {
            const body = await res.json();
            if (body?.message) msg = body.message;
          } catch { /* ignore */ }
          alert(msg);
          return;
        }
        setInterestsList((prev) => prev.filter((r) => r.region_code !== code));
      } else {
        const res = await fetch(`${API_BASE}/api/users/country-interests`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ region_code: code }),
        });
        if (res.ok) {
          const row = await res.json();
          setInterestsList((prev) => [...prev.filter((r) => r.region_code !== code), row]);
        }
      }
    } finally {
      setInterestsBusy(false);
    }
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
          {/* Full name — shows "Member" as a graceful fallback when unset */}
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
                <span className="text-foreground/80">{t("profile.member_fallback")}</span>
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

      {/* ── Subscription Status ──
          The standalone "Lidmaatschap actief" row was removed because the
          tier badge in the user header above (TRAVELLER / AMBASSADOR / …)
          already communicates membership status. We keep a slim row here
          ONLY when payment has failed, since that warrants a prominent
          banner the user must see and act on. */}
      {subscriptionStatus && subscriptionStatus.tier !== "guest" && subscriptionStatus.paymentFailed && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 rounded-sm border text-sm border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" aria-hidden="true" />
            <p className="text-amber-500 font-light">
              {t("subscription.profile_payment_failed")}
            </p>
          </div>
          <Link
            href="/membership"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            {t("subscription.profile_manage")}
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </Link>
        </div>
      )}

      {/* ── Badges ──
          Hier verplaatst (was eerder verder onderaan de pagina) zodat de
          gebruiker meteen na het identiteitsblok zijn behaalde
          onderscheidingen ziet, vóór de persoonlijke gegevens. */}
      <Card id="badges" className="border-border/40 bg-card shadow-sm scroll-mt-20">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-lg flex items-center gap-2 text-foreground">
            <Trophy className="w-4 h-4 text-amber-500/80" aria-hidden="true" />
            {t("profile.badges_title")}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground font-light">
            {t("profile.badges_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!earnedBadges || earnedBadges.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground/60">
              <Trophy className="w-8 h-8 mx-auto mb-3 opacity-30" aria-hidden="true" />
              <p className="font-serif text-sm">{t("profile.badges_empty")}</p>
              <Link href="/atelier">
                <p className="text-xs mt-1 underline underline-offset-2 hover:text-foreground transition-colors cursor-pointer">{t("profile.badges_empty_hint")}</p>
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Group badges by type */}
              {(["pillar", "phase", "country", "ambassador"] as const)
                .filter((type) => earnedBadges.some((b) => b.badge_type === type))
                .map((type) => {
                  const group = earnedBadges.filter((b) => b.badge_type === type);
                  const typeLabel =
                    type === "pillar" ? t("profile.badges_type_pillar")
                    : type === "phase" ? t("profile.badges_type_phase")
                    : type === "country" ? t("profile.badges_type_country")
                    : t("profile.badges_type_ambassador");
                  const TypeIcon =
                    type === "pillar" ? Medal
                    : type === "phase" ? Trophy
                    : type === "country" ? Globe
                    : Shield;
                  return (
                    <div key={type}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <TypeIcon className="w-3 h-3 text-muted-foreground/60" aria-hidden="true" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
                          {typeLabel} {group.length > 1 ? `(${group.length})` : ""}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.map((badge) => (
                          <div
                            key={badge.slug}
                            className="flex items-start gap-3 px-3 py-2.5 rounded-sm border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors"
                          >
                            <span className="text-lg shrink-0 mt-0.5" aria-hidden="true">
                              {type === "pillar" ? "🏅"
                                : type === "phase" ? "🏆"
                                : type === "country" ? "🌟"
                                : "🎖️"}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-foreground leading-tight truncate">
                                {badge.title}
                              </p>
                              <p className="text-[10px] text-muted-foreground/70 mt-0.5 leading-snug line-clamp-2">
                                {badge.description}
                              </p>
                              {badge.awarded_at && (
                                <p className="text-[10px] text-muted-foreground/50 mt-1 font-mono">
                                  {format(new Date(badge.awarded_at), "d MMM yyyy", { locale: dateFnsLocale })}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Personal Details + Preferences ── */}
      <div className="grid grid-cols-1 gap-6">

        {/* Personal Details */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <User className="w-4 h-4 text-primary/60" aria-hidden="true" />
              {t("profile.personal_details")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Read-only display of identity fields. Editing of these is
                handled during onboarding; here we present them as a static
                "ID card" view so the user can verify what is on file.
                Users who registered without these fields (legacy / social
                sign-ins) can still set them via the "Complete profile" button
                rendered below the panel. */}
            <DetailRow label={t("profile.full_name_label")} value={profileData?.full_name ?? "—"} locked={!!profileData?.full_name} />

            {/* Email is masked (e.g. j••••@domain) so the local-part is never
                shown on a screen that may be visible to onlookers. */}
            <DetailRow label={t("profile.email_label")} value={maskEmail(profileData?.email)} />

            {/* Born YYYY — read-only; em-dash if not on file */}
            <div className="border-b border-border/40 pb-2">
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/70 shrink-0">{t("profile.birth_year_label")}</span>
                {profileData?.birth_year ? (
                  <span className="flex items-center gap-1.5 text-sm text-foreground font-light">
                    {t("profile.born", { year: profileData.birth_year })}
                    <Lock className="w-3 h-3 text-muted-foreground/40 shrink-0" aria-label={t("profile.locked_field_hint")} />
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground/60 font-light">—</span>
                )}
              </div>
            </div>

            {/* Gender — only rendered when the user has provided one */}
            {profileData?.gender_identity && (
              <div className="border-b border-border/40 pb-2">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/70 shrink-0">{t("profile.gender_label")}</span>
                  <span className="flex items-center gap-1.5 text-sm text-foreground font-light">
                    {capitalize(profileData.gender_identity.replace("_", " "))}
                    <Lock className="w-3 h-3 text-muted-foreground/40 shrink-0" aria-label={t("profile.locked_field_hint")} />
                  </span>
                </div>
              </div>
            )}

            {/* Country of origin — editable. Retained from the upstream
                Personal Details panel; not in scope for Task #16 but kept so
                users can still update it. */}
            <div className="border-b border-border/40 pb-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground/70">{t("profile.country_origin_label")}</label>
                <SaveIndicator state={countrySave} t={t} />
              </div>
              {profileData?.country_of_origin_locked_at ? (
                // Permanent lock — origin can only be set once.
                <div className="flex items-center gap-1.5 text-sm text-foreground/80 font-light">
                  {profileData.country_of_origin ?? <span className="italic text-muted-foreground/50 font-light">{t("profile.country_not_specified")}</span>}
                  <Lock className="w-3 h-3 text-muted-foreground/40 shrink-0" aria-label={t("profile.locked_field_hint")} />
                </div>
              ) : editingCountry ? (
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
                      const filtered = q ? COUNTRIES.filter(c => c.toLowerCase().includes(q)) : COUNTRIES;
                      return filtered.length > 0 ? (
                        <ul className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-sm border border-border bg-background shadow-md">
                          {filtered.slice(0, 30).map(country => (
                            <li key={country}>
                              <button
                                type="button"
                                onMouseDown={(e) => { e.preventDefault(); setCountryInput(country); setCountryDropdownOpen(false); }}
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

            {/* Phone — placeholder; real SMS verification ships later */}
            <div className="pt-1 border-t border-border/50">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/60">{t("profile.phone_label")}</span>
                <span className="text-xs text-muted-foreground/40 italic font-light">{t("profile.phone_coming_soon")}</span>
              </div>
            </div>

            {/* Preferred language — moved out of the standalone "Preferences"
                card so users see it alongside their other personal data.
                Selecting an option PATCHes the user profile and immediately
                switches the UI locale. */}
            <div className="pt-3 border-t border-border/50 space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="profile-language-select"
                  className="text-xs font-mono uppercase tracking-wider text-muted-foreground/70"
                >
                  {t("profile.pref_language")}
                </label>
                <SaveIndicator state={langSave} t={t} />
              </div>
              <select
                id="profile-language-select"
                aria-label={t("profile.lang_label")}
                value={locale.split("-")[0]}
                disabled={langSave === "saving"}
                onChange={(e) => {
                  const opt = PROFILE_LANGUAGE_OPTIONS.find((o) => o.code === e.target.value);
                  if (opt) handleLanguageChange(opt.locale);
                }}
                className="w-full px-3 py-2 rounded-sm border border-border/60 bg-card text-sm text-foreground hover:border-primary/40 focus:border-primary focus:outline-none transition-all"
              >
                {PROFILE_LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Complete profile — visible only when one or more of the
                set-once identity fields (full name, birth year, gender) is
                still missing. Opens a modal that lets the user fill in
                whatever is absent. Once saved, the field is locked. */}
            {profileData && (!profileData.full_name || !profileData.birth_year || !profileData.gender_identity) && (
              <div className="pt-3 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full font-mono text-xs uppercase tracking-wider"
                  onClick={openCompleteProfile}
                >
                  <Pencil className="w-3 h-3 mr-2" aria-hidden="true" />
                  {t("profile.complete_profile_cta")}
                </Button>
                <p className="text-xs text-muted-foreground/60 font-light mt-2 leading-snug">
                  {t("profile.complete_profile_hint")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* The standalone "Preferences" card was removed: language now lives
            inside Personal Details (above) and learning region is managed
            from the Course Settings panel below. This eliminates the
            duplicate region picker that confused users. */}
      </div>

      {/* ── Course Settings (Cursusinstellingen) ──
          Converted from a static Card to a CollapsibleSection so it stacks
          uniformly with Interesses, Culinaire Interesses and Sferen below.
          Together they read as one grouped "Cursus & Voorkeuren" set of
          accordions, while each retains its own collapsible state. */}
      <CollapsibleSection
        id="course-settings-card"
        title={t("profile.course_settings_title")}
        icon={<Layers className="w-4 h-4 text-primary/60" aria-hidden="true" />}
        description={t("profile.course_settings_desc")}
        storageKey="course_settings"
        forceOpen={focusRegion}
      >
        <CardContent className="space-y-5">

          {/* Warning banner */}
          {showCourseChangeWarning && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-sm bg-amber-50/60 border border-amber-200/60 dark:bg-amber-950/20 dark:border-amber-800/40">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1 text-sm text-amber-800 dark:text-amber-300 font-light">
                {t("profile.course_change_warning")}{" "}
                <Link href="/navigator" className="underline underline-offset-2 font-medium hover:opacity-80 transition-opacity">
                  {t("profile.course_change_navigator_link")}
                </Link>
              </div>
              <button
                onClick={() => setShowCourseChangeWarning(false)}
                className="text-amber-600/70 hover:text-amber-800 transition-colors shrink-0"
                aria-label={t("common.close")}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Ambition level */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground/70">{t("profile.ambition")}</label>
              <SaveIndicator state={ambitionSave} t={t} />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {AMBITION_LEVELS.map(({ key, labelKey, descKey }) => (
                <button
                  key={key}
                  onClick={() => handleAmbitionChange(key)}
                  disabled={ambitionSave === "saving"}
                  title={t(descKey)}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-all ${
                    normalizeAmbitionLevel(profileData?.ambition_level) === key
                      ? "bg-primary/10 text-primary border-primary/30 font-medium"
                      : "border-border/40 text-muted-foreground/60 hover:border-primary/30 hover:text-muted-foreground"
                  }`}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
            {profileData?.ambition_level && (
              <p className="text-xs text-muted-foreground/60 font-light italic">
                {t(AMBITION_LEVELS.find((l) => l.key === normalizeAmbitionLevel(profileData.ambition_level))?.descKey ?? "")}
              </p>
            )}
          </div>

          {/* Learning region dropdown */}
          <div
            id="focus-region-anchor"
            className={`scroll-mt-32 space-y-1.5 rounded-sm transition-all ${focusRegion ? "ring-2 ring-primary/60 ring-offset-4 ring-offset-card animate-pulse" : ""}`}
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground/70">{t("profile.pref_region_label")}</label>
              <SaveIndicator state={regionSave} t={t} />
            </div>
            {focusRegion && (
              <p className="text-xs font-light text-primary/80 italic">
                {/* Inline hint shown only when the user arrived via a "wijzig
                    regio" deep-link, so they know exactly which control to
                    use. Disappears together with the highlight ring. */}
                Wijzig hieronder uw actieve leerregio. Uw aanpassing wordt automatisch opgeslagen.
              </p>
            )}
            <div className="relative">
              <button
                onClick={() => setCourseRegionDropdownOpen((v) => !v)}
                onBlur={() => setTimeout(() => setCourseRegionDropdownOpen(false), 150)}
                aria-haspopup="listbox"
                aria-expanded={courseRegionDropdownOpen}
                className="flex items-center gap-2 px-3 py-2 rounded-sm border border-border/60 hover:border-primary/40 hover:bg-muted/30 transition-all text-sm w-full text-left"
              >
                <Globe className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                <FlagEmoji code={activeRegion} size="sm" />
                <span className="font-medium flex-1">{getRegionName(activeRegion)}</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${courseRegionDropdownOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
              {courseRegionDropdownOpen && (
                <div role="listbox" className="absolute z-50 top-full left-0 right-0 mt-1 rounded-sm border border-border bg-background shadow-md overflow-y-auto max-h-56">
                  {COMPASS_REGIONS.map((region) => {
                    const isSelected = region.code === activeRegion;
                    return (
                      <button
                        key={region.code}
                        role="option"
                        aria-selected={isSelected}
                        onMouseDown={() => { handleRegionChange(region.code as RegionCode); setCourseRegionDropdownOpen(false); }}
                        className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm transition-colors ${
                          isSelected
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                        }`}
                      >
                        <FlagEmoji code={region.flag} size="sm" />
                        {getRegionName(region.code)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Country of origin — editable */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground/70">{t("profile.country_origin_label")}</label>
              <SaveIndicator state={countrySave} t={t} />
            </div>
            {profileData?.country_of_origin_locked_at ? (
              // Permanent lock — same display in the Course panel.
              <div className="flex items-center gap-1.5 text-sm text-foreground/80 font-light">
                {profileData.country_of_origin ?? <span className="italic text-muted-foreground/50 font-light">{t("profile.country_not_specified")}</span>}
                <Lock className="w-3 h-3 text-muted-foreground/40 shrink-0" aria-label={t("profile.locked_field_hint")} />
              </div>
            ) : editingCountryCourse ? (
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    value={countryInputCourse}
                    onChange={(e) => { setCountryInputCourse(e.target.value); setCountryDropdownOpenCourse(true); }}
                    onFocus={() => setCountryDropdownOpenCourse(true)}
                    onBlur={() => setTimeout(() => setCountryDropdownOpenCourse(false), 120)}
                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter") { setCountryDropdownOpenCourse(false); handleCountrySubmitCourse(); }
                      if (e.key === "Escape") { setCountryDropdownOpenCourse(false); setEditingCountryCourse(false); setCountryInputCourse(profileData?.country_of_origin ?? ""); }
                    }}
                    placeholder="e.g. Belgium"
                    className="h-8 text-sm border-primary/40 focus:border-primary w-full"
                    autoFocus
                  />
                  {countryDropdownOpenCourse && (() => {
                    const q = countryInputCourse.trim().toLowerCase();
                    const filtered = q ? COUNTRIES.filter(c => c.toLowerCase().includes(q)) : COUNTRIES;
                    return filtered.length > 0 ? (
                      <ul className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-sm border border-border bg-background shadow-md">
                        {filtered.slice(0, 30).map(country => (
                          <li key={country}>
                            <button type="button" onMouseDown={(e) => { e.preventDefault(); setCountryInputCourse(country); setCountryDropdownOpenCourse(false); }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors">
                              {country}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null;
                  })()}
                </div>
                <button onClick={() => { setCountryDropdownOpenCourse(false); handleCountrySubmitCourse(); }} className="text-primary hover:text-primary/70 transition-colors" aria-label="Save">
                  <Check className="w-4 h-4" aria-hidden="true" />
                </button>
                <button onClick={() => { setCountryDropdownOpenCourse(false); setEditingCountryCourse(false); setCountryInputCourse(profileData?.country_of_origin ?? ""); }} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Cancel">
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button onClick={() => setEditingCountryCourse(true)} className="group flex items-center gap-2 text-sm text-foreground/80 hover:text-foreground transition-colors">
                {profileData?.country_of_origin ?? <span className="italic text-muted-foreground/50 font-light">{t("profile.country_not_specified")}</span>}
                <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Gender — read-only */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/70">{t("profile.gender_label")}</span>
            <span className="flex items-center gap-1.5 text-sm text-foreground/70 font-light">
              {profileData?.gender_identity
                ? capitalize(profileData.gender_identity.replace("_", " "))
                : <span className="italic text-muted-foreground/50">{t("profile.country_not_specified")}</span>}
              <Lock className="w-3 h-3 text-muted-foreground/40 shrink-0" aria-hidden="true" />
            </span>
          </div>

          {/* Age group — derived from birth_year, read-only */}
          {(() => {
            const currentYear = new Date().getFullYear();
            const age = profileData?.birth_year ? currentYear - profileData.birth_year : null;
            const ageGroupKey = age === null
              ? "profile.age_group_unknown"
              : age < 30
                ? "profile.age_group_under30"
                : age <= 50
                  ? "profile.age_group_30_50"
                  : "profile.age_group_over50";
            return (
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/70">{t("profile.age_group_label")}</span>
                <span className="flex items-center gap-1.5 text-sm text-foreground/70 font-light">
                  {t(ageGroupKey)}
                  <Lock className="w-3 h-3 text-muted-foreground/40 shrink-0" aria-hidden="true" />
                </span>
              </div>
            );
          })()}

          {/* ── Inline subsections merged into Cursusinstellingen ──
              Doelstellingen, Interesses, Culinaire interesses en Sferen
              waren voorheen losse kaarten. Alles wat de cursus en
              aanbevelingen stuurt hoort thuis in dit ene vak; visueel
              gescheiden door subkoppen, niet door extra kaarten. */}

          <CollapsibleSubsection
            icon={<Target className="w-4 h-4 text-primary/60" aria-hidden="true" />}
            title={t("profile.interests_title")}
            description={t("profile.interests_subtitle")}
            storageKey="interests"
          >
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
          </CollapsibleSubsection>

          <CollapsibleSubsection
            icon={<UtensilsCrossed className="w-4 h-4 text-primary/60" aria-hidden="true" />}
            title={t("profile.culinary_interests_label")}
            storageKey="culinary"
          >
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
          </CollapsibleSubsection>

          <CollapsibleSubsection
            icon={<Layers className="w-4 h-4 text-primary/60" aria-hidden="true" />}
            title={t("profile.spheres_title")}
            description={t("profile.spheres_subtitle")}
            storageKey="spheres"
          >
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
              {spheresSave === "idle" && (profileData?.situational_interests ?? []).length > 0 && (
                <span className="text-xs text-muted-foreground/70 font-mono flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/40" aria-hidden="true" />
                  {t("profile.spheres_onboarding_hint")}
                </span>
              )}
            </div>
          </CollapsibleSubsection>

        </CardContent>
      </CollapsibleSection>

      {/* Countries of Interest — multi-track progress (independent per country). */}
      <CollapsibleSection
        title={t("profile.countries_interest_title", "Countries you're learning")}
        icon={<Globe className="w-4 h-4 text-primary/60" aria-hidden="true" />}
        description={t("profile.countries_interest_subtitle", "Track several cultures in parallel — each one keeps its own progress.")}
        storageKey="countries"
      >
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {COMPASS_REGIONS.map((region) => {
              const isActive = interestsList.some((r) => r.region_code === region.code);
              return (
                <button
                  key={region.code}
                  onClick={() => toggleInterestRegion(region.code)}
                  disabled={interestsBusy}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-sm border text-sm transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary border-primary/35 font-medium"
                      : "border-border/50 text-muted-foreground hover:border-primary/30 hover:bg-muted/30 hover:text-foreground"
                  }`}
                >
                  <FlagEmoji code={region.flag} size="sm" />
                  {getRegionName(region.code)}
                  {isActive ? <Check className="w-3.5 h-3.5 ml-1" aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>
          {interestsList.length === 0 && (
            <p className="text-xs text-muted-foreground/60 italic font-light mt-3">
              {t("profile.countries_interest_empty", "Pick at least one country above to start tracking it.")}
            </p>
          )}

          {interestsList.length > 0 && (
            <div className="mt-6 space-y-3">
              <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                {t("profile.per_country_progress", "Independent progress per country")}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {interestsList.map((interest) => {
                  const region = COMPASS_REGIONS.find((r) => r.code === interest.region_code);
                  const rows = trackProgress.filter((p) => p.region_code === interest.region_code);
                  const badges = trackBadges.filter((b) => b.region_code === interest.region_code);
                  const eliteRow = rows.find((r) => r.register === "elite");
                  const mcRows = rows.filter((r) => r.register === "middle_class");
                  const mcAvg = mcRows.length
                    ? Math.round(mcRows.reduce((s, r) => s + r.current_level, 0) / mcRows.length)
                    : 0;
                  return (
                    <div
                      key={interest.region_code}
                      className="border border-border/50 rounded-sm p-3 bg-muted/10"
                      data-testid={`country-progress-${interest.region_code}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {region ? <FlagEmoji code={region.flag} size="sm" /> : null}
                        <span className="text-sm font-medium">
                          {getRegionName(interest.region_code)}
                        </span>
                        {interest.region_code === activeRegion ? (
                          <span className="text-[10px] font-mono uppercase tracking-wider text-primary/70 ml-auto">
                            {t("profile.active_label", "Active")}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <div>
                          {t("profile.elite_level", "Elite level")}: {eliteRow?.current_level ?? 1}
                        </div>
                        <div>
                          {t("profile.mc_level_avg", "Middle-class avg level")}: {mcAvg || 1}
                        </div>
                      </div>
                      {badges.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {badges.slice(0, 6).map((b) => (
                            <span
                              key={b.id}
                              title={b.title}
                              className="text-[10px] px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary border border-primary/20"
                            >
                              {b.badge_type === "country" ? "★" : b.badge_type === "phase" ? "◆" : "•"} {b.title}
                            </span>
                          ))}
                          {badges.length > 6 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{badges.length - 6}
                            </span>
                          )}
                        </div>
                      )}
                      {badges.length === 0 && (
                        <div className="text-[10px] text-muted-foreground/60 italic mt-2">
                          {t("profile.no_badges_yet", "No badges yet")}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
              {nobleScore?.next_level_name && nobleScore.next_level_threshold - nobleScore.total_score > 0 && (
                <div className="text-xs text-right text-muted-foreground">
                  {t("home.welcome_back_next_rank", {
                    remaining: nobleScore.next_level_threshold - nobleScore.total_score,
                    next_level: t(levelKey(nobleScore.next_level_name)),
                  })}
                </div>
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

      {/* ── My Guides ── */}
      <Card id="my-guides" className="border-border/40 bg-card shadow-sm scroll-mt-20">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-lg flex items-center gap-2 text-foreground">
            <BookOpen className="w-4 h-4 text-primary/60" aria-hidden="true" />
            {t("profile.my_guides_title")}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground font-light">
            {t("profile.my_guides_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {purchasedGuidesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 rounded-sm" />
              <Skeleton className="h-16 rounded-sm" />
            </div>
          ) : !purchasedGuides || purchasedGuides.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground/70">
              <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-30" aria-hidden="true" />
              <p className="font-serif text-sm">{t("profile.my_guides_empty")}</p>
              <Link href="/guides">
                <p className="text-xs mt-2 underline underline-offset-2 hover:text-foreground transition-colors cursor-pointer">
                  {t("profile.my_guides_empty_cta")}
                </p>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {purchasedGuides.map((guide) => (
                <Link key={guide.id} href={`/guides#${guide.id}`} aria-label={t("profile.my_guides_open") + ": " + guide.title}>
                  <div className="flex items-start gap-3 px-3 py-3 rounded-sm border border-border/40 bg-muted/20 hover:bg-muted/40 hover:border-primary/30 transition-colors cursor-pointer group">
                    <BookOpen className="w-4 h-4 text-primary/60 shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground leading-tight truncate">
                        {guide.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-wider rounded-[2px]">
                          {t(GUIDE_PILLAR_LABEL_KEYS[guide.pillar] ?? "", guide.pillar)}
                        </Badge>
                        {guide.region_code && (
                          <Badge variant="secondary" className="text-[10px] font-mono rounded-[2px]">
                            {guide.region_code}
                          </Badge>
                        )}
                      </div>
                      {guide.purchased_at && (
                        <p className="text-[10px] text-muted-foreground/60 mt-1.5 font-mono">
                          {t("profile.my_guides_purchased_on", {
                            date: format(new Date(guide.purchased_at), "d MMM yyyy", { locale: dateFnsLocale }),
                          })}
                        </p>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60 group-hover:text-primary transition-colors shrink-0 mt-1">
                      {t("profile.my_guides_open")}
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Companion & Invitation ── */}
      <IncomingInvitationSection />
      <CompanionInviteSection />

      {/* ── Password ── */}
      <PasswordSection />

      {/* ── GDPR / My Data ── */}
      <GdprSection
        profileData={profileData}
        setProfileData={setProfileData}
        apiBase={API_BASE}
        t={t}
      />

      {/* ── Legal ── */}
      <Card className="border-border/40 bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-lg flex items-center gap-2 text-foreground">
            <Shield className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            {t("profile.legal_section")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">{t("legal.privacy_policy")}</p>
              <p className="text-xs text-muted-foreground font-light mt-1 max-w-sm">{t("profile.legal_privacy_desc")}</p>
            </div>
            <Link href="/privacy-policy">
              <Button
                variant="outline"
                size="sm"
                className="border-border/50 text-muted-foreground hover:text-foreground font-mono shrink-0 flex items-center gap-2"
              >
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                {t("profile.legal_read")}
              </Button>
            </Link>
          </div>
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

      {/* ── My Venues (saved from The Local) ── */}
      <MyVenuesSection isAuthenticated={isAuthenticated} t={t} />
      {/* ── Complete profile dialog ──────────────────────────────────────────
          Lets users with missing identity fields (full name, birth year, or
          gender) fill them in. Only renders inputs for fields that are not
          yet on the profile — once a field is set the server locks it. */}
      <Dialog open={showCompleteProfile} onOpenChange={setShowCompleteProfile}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">{t("profile.complete_profile_title")}</DialogTitle>
            <DialogDescription className="font-light">
              {t("profile.complete_profile_description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {!profileData?.full_name && (
              <div className="space-y-1.5">
                <label htmlFor="cp_full_name" className="text-xs font-mono uppercase tracking-wider text-muted-foreground/80">
                  {t("profile.full_name_label")}
                </label>
                <Input
                  id="cp_full_name"
                  value={cpFullName}
                  onChange={(e) => { setCpFullName(e.target.value); setCompleteProfileError(null); }}
                  placeholder="Jane Doe"
                  maxLength={150}
                  autoFocus
                />
              </div>
            )}

            {!profileData?.birth_year && (
              <div className="space-y-1.5">
                <label htmlFor="cp_birth_year" className="text-xs font-mono uppercase tracking-wider text-muted-foreground/80">
                  {t("profile.birth_year_label")}
                </label>
                <Input
                  id="cp_birth_year"
                  type="number"
                  inputMode="numeric"
                  value={cpBirthYear}
                  onChange={(e) => { setCpBirthYear(e.target.value); setCompleteProfileError(null); }}
                  placeholder="1990"
                  min={1900}
                  max={new Date().getFullYear() - 5}
                />
              </div>
            )}

            {!profileData?.gender_identity && (
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground/80">
                  {t("profile.gender_label")}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {GENDER_OPTIONS.map((opt) => {
                    const active = cpGender === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setCpGender(opt.value); setCompleteProfileError(null); }}
                        className={`px-3 py-1.5 rounded-sm text-xs border transition-all ${
                          active
                            ? "bg-primary/10 text-primary border-primary/40 font-medium"
                            : "border-border/50 text-muted-foreground/80 hover:border-primary/30 hover:text-foreground"
                        }`}
                      >
                        {t(opt.labelKey)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground/60 font-light leading-snug flex items-start gap-1.5">
              <Lock className="w-3 h-3 mt-0.5 shrink-0" aria-hidden="true" />
              {t("profile.complete_profile_lock_notice")}
            </p>

            {completeProfileError && (
              <p className="text-xs text-destructive font-mono">{completeProfileError}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCompleteProfile(false)}
              disabled={completeProfileSave === "saving"}
              className="font-mono"
            >
              {t("profile.delete_cancel")}
            </Button>
            <Button
              size="sm"
              onClick={handleCompleteProfileSubmit}
              disabled={completeProfileSave === "saving"}
              className="font-mono gap-1.5"
              aria-busy={completeProfileSave === "saving"}
            >
              {completeProfileSave === "saving" ? "…" : (
                <>
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  {t("profile.complete_profile_save")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

interface MyVenuesSectionProps {
  isAuthenticated: boolean;
  t: (k: string, fallback?: string) => string;
}

/**
 * Lists every venue the caller has bookmarked across all regions.
 * Re-uses the standard VenueCard so the bookmark icon stays interactive
 * (a click here unsaves the venue and removes it from the list).
 */
function MyVenuesSection({ isAuthenticated, t }: MyVenuesSectionProps) {
  const { savedVenues, loading, pendingId, toggleSave } = useSavedVenues(isAuthenticated);

  if (!isAuthenticated) return null;

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-lg flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-primary/60" aria-hidden="true" />
          {t("profile.my_venues_title", "My Venues")}
          {savedVenues.length > 0 && (
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 border border-border/40 rounded-[2px] px-1.5 py-0.5 ml-1">
              {savedVenues.length}
            </span>
          )}
        </CardTitle>
        <CardDescription className="text-xs font-light text-muted-foreground/70 mt-0.5">
          {t("profile.my_venues_subtitle", "Your personal shortlist of venues bookmarked from The Local.")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => <Skeleton key={i} className="h-36 w-full" />)}
          </div>
        ) : savedVenues.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border/40 rounded-sm">
            <Bookmark className="w-6 h-6 mx-auto mb-2 opacity-30" aria-hidden="true" />
            <p>{t("profile.my_venues_empty", "You haven't saved any venues yet.")}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {t("profile.my_venues_hint", "Tap the bookmark icon on any venue under The Local to add it here.")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedVenues.map((venue) => (
              <VenueCard
                key={venue.id}
                venue={venue}
                isSaved={true}
                saving={pendingId === venue.id}
                onToggleSave={toggleSave}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
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
 * When `storageKey` is provided the open/closed state is persisted in
 * localStorage under the key `profile_section_<storageKey>` and restored on
 * mount. Defaults to closed when no stored value exists or storage is
 * unavailable (e.g. private browsing).
 */
function CollapsibleSection({
  title, icon, description, className, storageKey, children, id, forceOpen,
}: {
  title: string;
  icon?: React.ReactNode;
  description?: string;
  className?: string;
  storageKey?: string;
  children: React.ReactNode;
  id?: string;
  /** When set to true, the section is forced open regardless of stored
   *  preference. Used by the deep-link focus mechanism (e.g. when arriving
   *  from "Wijzig uw actieve regio") so the user immediately sees the
   *  controls they came to change. */
  forceOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(() => {
    if (forceOpen) return true;
    if (!storageKey) return false;
    try {
      const stored = localStorage.getItem(`profile_section_${storageKey}`);
      return stored === "true";
    } catch {
      return false;
    }
  });

  // Re-open whenever forceOpen flips to true (e.g. user navigates again
  // with ?focus=region while the section is closed).
  useEffect(() => {
    if (forceOpen) setIsOpen(true);
  }, [forceOpen]);

  function toggle() {
    setIsOpen((v) => {
      const next = !v;
      if (storageKey) {
        try { localStorage.setItem(`profile_section_${storageKey}`, String(next)); } catch { /* noop */ }
      }
      return next;
    });
  }
  return (
    <Card id={id} className={`bg-card border-border shadow-sm ${className ?? ""}`}>
      <CardHeader
        className="pb-3 cursor-pointer select-none"
        onClick={toggle}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } }}
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

/**
 * Collapsible subsection used inside the Cursusinstellingen card to group
 * Doelstellingen / Culinaire interesses / Sferen as individually openable
 * blocks WITHOUT giving them the weight of a separate Card. The header is
 * always visible (with chevron + click to toggle); the body collapses.
 * Open/closed state persists in localStorage under
 * `profile_subsection_<storageKey>` so each user keeps their preference.
 */
function CollapsibleSubsection({
  icon, title, description, storageKey, defaultOpen = false, children,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  storageKey: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(() => {
    try {
      const stored = localStorage.getItem(`profile_subsection_${storageKey}`);
      if (stored === null) return defaultOpen;
      return stored === "true";
    } catch {
      return defaultOpen;
    }
  });
  function toggle() {
    setIsOpen((v) => {
      const next = !v;
      try { localStorage.setItem(`profile_subsection_${storageKey}`, String(next)); } catch { /* noop */ }
      return next;
    });
  }
  return (
    <div className="pt-5 mt-2 border-t border-border/40">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-3 text-left group"
      >
        <div className="space-y-1 min-w-0">
          <h3 className="font-serif text-base flex items-center gap-2 text-foreground group-hover:text-primary transition-colors">
            {icon}
            {title}
          </h3>
          {description && (
            <p className="text-xs font-light text-muted-foreground/70">{description}</p>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {isOpen && <div className="mt-4 space-y-5">{children}</div>}
    </div>
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

function IncomingInvitationSection() {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("pending_invite_token");
  });
  const [details, setDetails] = useState<{ inviter_name: string; expires_at: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/api/invitations/${token}`)
      .then(async (r) => ({ ok: r.ok, data: await r.json() }))
      .then(({ ok, data }) => {
        if (ok) {
          setDetails({ inviter_name: data.inviter_name, expires_at: data.expires_at });
        } else {
          setError(data.error ?? "Deze uitnodiging is niet meer beschikbaar.");
          sessionStorage.removeItem("pending_invite_token");
        }
      })
      .catch(() => setError("Kon de uitnodiging niet ophalen."))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleAccept() {
    if (!token) return;
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/invitations/redeem`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (res.ok) {
        sessionStorage.removeItem("pending_invite_token");
        setAccepted(true);
      } else {
        setError(data.error ?? "Kon de uitnodiging niet accepteren.");
      }
    } catch {
      setError("Kon de uitnodiging niet accepteren.");
    } finally {
      setAccepting(false);
    }
  }

  function handleDecline() {
    sessionStorage.removeItem("pending_invite_token");
    setToken(null);
    setDetails(null);
  }

  if (!token) return null;

  return (
    <Card className="bg-card border-primary/30 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-lg flex items-center gap-2">
          <Users2Icon className="w-4 h-4 text-primary" aria-hidden="true" />
          Uitnodiging ontvangen
        </CardTitle>
        <CardDescription className="font-light">
          U heeft een uitnodiging ontvangen om met iemand als companions verbonden te worden.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && <Skeleton className="h-12 w-full rounded-sm" />}

        {!loading && accepted && (
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            <span>U bent nu verbonden als companions.</span>
            <Link href="/companion" className="underline underline-offset-2 ml-auto text-xs font-mono uppercase tracking-wider">
              Naar dashboard
            </Link>
          </div>
        )}

        {!loading && !accepted && error && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
              <span>{error}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDecline} className="font-mono text-xs uppercase tracking-wider">
              Sluiten
            </Button>
          </div>
        )}

        {!loading && !accepted && !error && details && (
          <div className="space-y-3">
            <div className="border border-border/40 rounded-sm p-3 bg-muted/10 space-y-1.5">
              <p className="text-sm text-foreground">
                <span className="font-medium">{details.inviter_name}</span>{" "}
                heeft u uitgenodigd om als companions verbonden te worden.
              </p>
              <p className="text-xs text-muted-foreground/70 font-mono flex items-center gap-1.5">
                <Clock className="w-3 h-3" aria-hidden="true" />
                Verloopt {new Date(details.expires_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleAccept}
                disabled={accepting}
                size="sm"
                className="font-mono uppercase tracking-widest text-xs gap-2"
              >
                {accepting
                  ? <Loader2Icon className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  : <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />}
                {accepting ? "Bezig…" : "Accepteer & verbind"}
              </Button>
              <Button
                onClick={handleDecline}
                disabled={accepting}
                variant="ghost"
                size="sm"
                className="font-mono uppercase tracking-widest text-xs text-muted-foreground hover:text-destructive"
              >
                <X className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                Weiger
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface SentInvitation {
  id: number;
  token: string;
  status: string;
  expires_at: string;
  created_at: string;
  invitee_name: string | null;
}

function CompanionInviteSection() {
  const { t } = useLanguage();
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteState, setInviteState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [copied, setCopied] = useState<string | null>(null);
  const [sent, setSent] = useState<SentInvitation[]>([]);
  const [sentLoading, setSentLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  async function loadSent() {
    setSentLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/invitations/sent`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json() as { invitations: SentInvitation[] };
        setSent(data.invitations ?? []);
      }
    } catch {
      // ignore
    } finally {
      setSentLoading(false);
    }
  }

  useEffect(() => {
    loadSent();
  }, []);

  async function handleGenerate() {
    setInviteState("loading");
    try {
      const res = await fetch(`${API_BASE}/api/invitations/generate`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as { token: string };
      const url = `${window.location.origin}${import.meta.env.BASE_URL}invite/${data.token}`;
      setInviteLink(url);
      setInviteState("done");
      loadSent();
    } catch {
      setInviteState("error");
    }
  }

  async function handleCopy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 2500);
    } catch {
      // fallback: select the text
    }
  }

  async function handleRevoke(token: string) {
    setRevoking(token);
    try {
      const res = await fetch(`${API_BASE}/api/invitations/${token}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        loadSent();
        if (inviteLink && inviteLink.endsWith(`/invite/${token}`)) {
          setInviteLink(null);
          setInviteState("idle");
        }
      }
    } finally {
      setRevoking(null);
    }
  }

  function buildLink(token: string) {
    return `${window.location.origin}${import.meta.env.BASE_URL}invite/${token}`;
  }

  function statusBadge(status: string) {
    const map: Record<string, { label: string; cls: string }> = {
      pending: { label: "In afwachting", cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800/40" },
      accepted: { label: "Geaccepteerd", cls: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800/40" },
      expired: { label: "Verlopen", cls: "bg-muted text-muted-foreground border-border" },
      revoked: { label: "Ingetrokken", cls: "bg-muted text-muted-foreground border-border" },
    };
    const v = map[status] ?? { label: status, cls: "bg-muted text-muted-foreground border-border" };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-sm border text-[10px] font-mono uppercase tracking-wider ${v.cls}`}>
        {v.label}
      </span>
    );
  }

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-lg flex items-center gap-2">
          <Users2Icon className="w-4 h-4 text-primary/60" aria-hidden="true" />
          Companion & Uitnodiging
        </CardTitle>
        <CardDescription className="font-light">
          Nodig een vertrouwde kennis uit om samen uw etiquette-reis te doorlopen. Bekijk wederzijdse voortgang en wissel reflecties uit na rollenspel-scenario's.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!inviteLink ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={inviteState === "loading"}
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider"
          >
            {inviteState === "loading" ? (
              <Loader2Icon className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <LinkIcon className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            Uitnodigingslink aanmaken
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Uw persoonlijke uitnodigingslink</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-muted/40 border border-border/40 rounded-sm px-3 py-2 truncate select-all text-foreground/80">
                {inviteLink}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(inviteLink, "current")}
                className="shrink-0 font-mono text-xs"
              >
                {copied === "current" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" aria-hidden="true" />
                ) : (
                  <CopyIcon className="w-3.5 h-3.5" aria-hidden="true" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground/60 font-light">
              Geldig voor 7 dagen. Wanneer uw genodigde zich registreert via deze link, worden jullie automatisch als companions gekoppeld.
            </p>
          </div>
        )}
        {inviteState === "error" && (
          <p className="text-xs text-destructive font-mono">Kon geen uitnodigingslink aanmaken. Probeer het opnieuw.</p>
        )}

        <div className="pt-3 border-t border-border/40 space-y-3">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Verzonden uitnodigingen
          </p>
          {sentLoading ? (
            <Skeleton className="h-12 w-full rounded-sm" />
          ) : sent.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 font-light italic">
              U heeft nog geen uitnodigingen verzonden.
            </p>
          ) : (
            <ul className="space-y-2">
              {sent.slice(0, 6).map((inv) => {
                const link = buildLink(inv.token);
                const copyKey = `sent-${inv.token}`;
                const dateLabel = inv.status === "pending"
                  ? `Verloopt ${new Date(inv.expires_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                  : `Verstuurd ${new Date(inv.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
                return (
                  <li
                    key={inv.id}
                    className="border border-border/40 rounded-sm p-3 bg-muted/10 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        {statusBadge(inv.status)}
                        <span className="text-xs text-foreground/80 truncate">
                          {inv.invitee_name ? (
                            <>met <span className="font-medium">{inv.invitee_name}</span></>
                          ) : (
                            <span className="text-muted-foreground italic">nog niet geclaimd</span>
                          )}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
                        {dateLabel}
                      </span>
                    </div>
                    {inv.status === "pending" && (
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-[11px] bg-background border border-border/40 rounded-sm px-2 py-1 truncate select-all text-foreground/70">
                          {link}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(link, copyKey)}
                          className="shrink-0 font-mono text-xs h-7 px-2"
                          title="Kopieer link"
                        >
                          {copied === copyKey ? (
                            <CheckCircle2 className="w-3 h-3 text-green-500" aria-hidden="true" />
                          ) : (
                            <CopyIcon className="w-3 h-3" aria-hidden="true" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevoke(inv.token)}
                          disabled={revoking === inv.token}
                          className="shrink-0 font-mono text-xs h-7 px-2 text-muted-foreground hover:text-destructive"
                          title="Trek uitnodiging in"
                        >
                          {revoking === inv.token
                            ? <Loader2Icon className="w-3 h-3 animate-spin" aria-hidden="true" />
                            : <X className="w-3 h-3" aria-hidden="true" />}
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="pt-2 border-t border-border/40">
          <Link
            href="/companion"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
          >
            <Users2Icon className="w-3.5 h-3.5" aria-hidden="true" />
            Companion Dashboard bekijken
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function GdprSection({
  profileData,
  setProfileData,
  apiBase,
  t,
}: {
  profileData: UserProfileData | null;
  setProfileData: React.Dispatch<React.SetStateAction<UserProfileData | null>>;
  apiBase: string;
  t: (key: string, fallback?: string) => string;
}) {
  const [exportState, setExportState] = useState<"idle" | "loading" | "error">("idle");
  const [profilingSaving, setProfilingSaving] = useState(false);

  const profilingEnabled = profileData?.profiling_consent !== false;

  async function handleExport() {
    setExportState("loading");
    try {
      const res = await fetch(`${apiBase}/api/users/me/export`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cd = res.headers.get("Content-Disposition") ?? "";
      const fnMatch = cd.match(/filename="([^"]+)"/);
      a.download = fnMatch?.[1] ?? "cortea-data-export.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportState("idle");
    } catch {
      setExportState("error");
      setTimeout(() => setExportState("idle"), 4000);
    }
  }

  async function handleProfilingToggle() {
    if (profilingSaving) return;
    const newValue = !profilingEnabled;
    setProfilingSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/users/profile/profiling-consent`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profiling_consent: newValue }),
      });
      if (res.ok) {
        setProfileData((prev) => prev ? { ...prev, profiling_consent: newValue } : prev);
      }
    } catch {
      // ignore
    } finally {
      setProfilingSaving(false);
    }
  }

  const RIGHTS = [
    "gdpr.right_access",
    "gdpr.right_rectification",
    "gdpr.right_erasure",
    "gdpr.right_restriction",
    "gdpr.right_portability",
    "gdpr.right_objection",
  ] as const;

  return (
    <Card className="border-border/40 bg-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-lg flex items-center gap-2 text-foreground">
          <Shield className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          {t("gdpr.section_title", "My Data")}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground font-light">
          {t("gdpr.section_desc", "Manage your personal data and exercise your privacy rights.")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Data Export */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-border/40">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Download className="w-3.5 h-3.5 text-muted-foreground/70" aria-hidden="true" />
              <p className="text-sm font-medium text-foreground">{t("gdpr.export_title", "Export my data")}</p>
            </div>
            <p className="text-xs text-muted-foreground font-light max-w-sm">{t("gdpr.export_desc", "Download a JSON file of your personal data (Art. 20 GDPR).")}</p>
            {exportState === "error" && (
              <p className="text-xs text-destructive mt-1">{t("gdpr.export_error", "Export failed. Please try again.")}</p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exportState === "loading"}
            className="border-border/50 text-muted-foreground hover:text-foreground font-mono shrink-0 flex items-center gap-2"
          >
            {exportState === "loading" ? (
              <><Loader2Icon className="w-3.5 h-3.5 animate-spin" />{t("gdpr.export_loading", "Preparing…")}</>
            ) : (
              <><Download className="w-3.5 h-3.5" aria-hidden="true" />{t("gdpr.export_button", "Download data")}</>
            )}
          </Button>
        </div>

        {/* Profiling Consent Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-border/40">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {profilingEnabled ? (
                <ToggleRight className="w-3.5 h-3.5 text-primary/70" aria-hidden="true" />
              ) : (
                <ToggleLeft className="w-3.5 h-3.5 text-muted-foreground/70" aria-hidden="true" />
              )}
              <p className="text-sm font-medium text-foreground">{t("gdpr.profiling_title", "Behavioural profiling")}</p>
              <span className={`text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-sm ${profilingEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {profilingEnabled ? t("gdpr.profiling_active", "Active") : t("gdpr.profiling_paused", "Paused")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-light max-w-sm">{t("gdpr.profiling_desc", "Cortéa analyses your scenario responses to build your Refinement Compass. You may object at any time (Art. 21 GDPR).")}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleProfilingToggle}
            disabled={profilingSaving}
            className="border-border/50 text-muted-foreground hover:text-foreground font-mono shrink-0"
          >
            {profilingSaving
              ? t("gdpr.profiling_saving", "Saving…")
              : profilingEnabled
              ? t("gdpr.profiling_pause", "Pause profiling")
              : t("gdpr.profiling_resume", "Resume profiling")}
          </Button>
        </div>

        {/* Privacy Rights Info */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-3.5 h-3.5 text-muted-foreground/70" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">{t("gdpr.rights_title", "Your privacy rights")}</p>
          </div>
          <p className="text-xs text-muted-foreground font-light mb-3">{t("gdpr.rights_intro", "Under GDPR (Art. 15–21) you hold the following rights:")}</p>
          <ul className="space-y-1.5">
            {RIGHTS.map((key) => (
              <li key={key} className="flex items-start gap-2 text-xs text-muted-foreground font-light">
                <CheckCircle2 className="w-3 h-3 text-muted-foreground/40 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground/70 font-light mt-3 pt-3 border-t border-border/40">
            {t("gdpr.contact", "For any data request e-mail privacy@cortea.app — we respond within 30 calendar days.")}
          </p>
        </div>

      </CardContent>
    </Card>
  );
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function PasswordSection() {
  const { t } = useLanguage();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newPw || newPw.length < 8) { setMessage(t("profile.password_error_length")); setState("error"); return; }
    if (newPw !== confirmPw) { setMessage(t("profile.password_error_mismatch")); setState("error"); return; }
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
        setMessage(data.error ?? t("profile.password_error_failed"));
        setState("error");
      } else {
        setMessage(data.message ?? t("profile.password_success"));
        setState("done");
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
        setTimeout(() => setState("idle"), 4000);
      }
    } catch {
      setMessage(t("profile.password_error_generic"));
      setState("error");
    }
  }

  return (
    <CollapsibleSection
      title={t("profile.password_title")}
      icon={<KeyRound className="w-5 h-5 text-muted-foreground" aria-hidden="true" />}
      description={t("profile.password_desc")}
      storageKey="password"
    >
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="pw-current" className="text-sm font-medium text-foreground">{t("profile.password_current_label")} <span className="text-xs text-muted-foreground/60">{t("profile.password_current_optional")}</span></label>
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
            <label htmlFor="pw-new" className="text-sm font-medium text-foreground">{t("profile.password_new_label")} <span className="text-destructive" aria-hidden="true">*</span></label>
            <div className="relative">
              <Input
                id="pw-new"
                type={showNew ? "text" : "password"}
                autoComplete="new-password"
                placeholder={t("profile.password_placeholder")}
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
            <label htmlFor="pw-confirm" className="text-sm font-medium text-foreground">{t("profile.password_confirm_label")} <span className="text-destructive" aria-hidden="true">*</span></label>
            <div className="relative">
              <Input
                id="pw-confirm"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder={t("register.password_confirm_placeholder")}
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
              <><PasswordLoader2 className="w-4 h-4 mr-2 animate-spin" />{t("profile.password_saving")}</>
            ) : state === "done" ? (
              <><CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />{t("profile.password_saved")}</>
            ) : (
              t("profile.password_save")
            )}
          </Button>
        </form>
      </CardContent>
    </CollapsibleSection>
  );
}
