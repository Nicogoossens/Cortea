import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { SPHERE_OPTIONS } from "@/lib/profile-options";
import { WORLD_COUNTRIES } from "@/lib/world-countries";
import {
  ArrowRight, ArrowLeft, CheckCircle2, Loader2, Sparkles, Globe, Crown, Star,
  AlertTriangle,
} from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ─── Step 1: Objectives ───────────────────────────────────────────────────────
const OBJECTIVES = [
  { id: "business",        icon: "◈", label_key: "onboarding.obj_business",  desc_key: "onboarding.obj_business_desc" },
  { id: "elite",           icon: "◇", label_key: "onboarding.obj_elite",     desc_key: "onboarding.obj_elite_desc" },
  { id: "romantic",        icon: "◉", label_key: "onboarding.obj_romantic",  desc_key: "onboarding.obj_romantic_desc" },
  { id: "world_traveller", icon: "◎", label_key: "onboarding.obj_travel",    desc_key: "onboarding.obj_travel_desc" },
] as const;

// ─── Step 4: World choice ─────────────────────────────────────────────────────
const WORLD_OPTIONS = [
  {
    id: "A" as const,
    label_key:    "onboarding.world_A",
    desc_key:     "onboarding.world_A_desc",
    icon:         "◎",
  },
  {
    id: "B" as const,
    label_key:    "onboarding.world_B",
    desc_key:     "onboarding.world_B_desc",
    icon:         "◇",
  },
  {
    id: "C" as const,
    label_key:    "onboarding.world_C",
    desc_key:     "onboarding.world_C_desc",
    icon:         "◈",
  },
] as const;

// ─── Step 5: Archetypes ───────────────────────────────────────────────────────
const ARCHETYPE_OPTIONS = [
  { id: "diplomate",    label_key: "onboarding.archetype_diplomate",    desc_key: "onboarding.archetype_diplomate_desc",    pillar_key: "onboarding.archetype_diplomate_pillar" },
  { id: "urbanist",     label_key: "onboarding.archetype_urbanist",     desc_key: "onboarding.archetype_urbanist_desc",     pillar_key: "onboarding.archetype_urbanist_pillar" },
  { id: "aesthete",     label_key: "onboarding.archetype_aesthete",     desc_key: "onboarding.archetype_aesthete_desc",     pillar_key: "onboarding.archetype_aesthete_pillar" },
  { id: "scholar",      label_key: "onboarding.archetype_scholar",      desc_key: "onboarding.archetype_scholar_desc",      pillar_key: "onboarding.archetype_scholar_pillar" },
  { id: "cosmopolite",  label_key: "onboarding.archetype_cosmopolite",  desc_key: "onboarding.archetype_cosmopolite_desc",  pillar_key: "onboarding.archetype_cosmopolite_pillar" },
  { id: "virtuose",     label_key: "onboarding.archetype_virtuose",     desc_key: "onboarding.archetype_virtuose_desc",     pillar_key: "onboarding.archetype_virtuose_pillar" },
] as const;

// ─── Step 6: Social circles (fallback when catalog is empty — content is END1) ─
const SOCIAL_CIRCLE_FALLBACK = [
  { id: "old_money",            label_key: "onboarding.circle_old_money",            registers: ["elite"] },
  { id: "diplomatic_corps",     label_key: "onboarding.circle_diplomatic_corps",     registers: ["elite"] },
  { id: "landed_gentry",        label_key: "onboarding.circle_landed_gentry",        registers: ["elite"] },
  { id: "arts_patronage",       label_key: "onboarding.circle_arts_patronage",       registers: ["elite", "middle_class"] },
  { id: "yacht_set",            label_key: "onboarding.circle_yacht_set",            registers: ["elite"] },
  { id: "hunting_set",          label_key: "onboarding.circle_hunting_set",          registers: ["elite"] },
  { id: "fashion_world",        label_key: "onboarding.circle_fashion_world",        registers: ["elite", "middle_class"] },
  { id: "haute_cuisine",        label_key: "onboarding.circle_haute_cuisine",        registers: ["elite", "middle_class"] },
  { id: "philanthropy",         label_key: "onboarding.circle_philanthropy",         registers: ["middle_class", "elite"] },
  { id: "corporate_executive",  label_key: "onboarding.circle_corporate_executive",  registers: ["middle_class"] },
  { id: "academia",             label_key: "onboarding.circle_academia",             registers: ["middle_class"] },
  { id: "religious_leadership", label_key: "onboarding.circle_religious_leadership", registers: ["middle_class"] },
];

// ─── Step 7: Cultural interests (fallback when catalog is empty — content is END1)
const CULTURAL_INTEREST_FALLBACK = [
  { id: "horology",        label_key: "onboarding.culture_horology",        registers: ["elite"] },
  { id: "wine_culture",    label_key: "onboarding.culture_wine_culture",    registers: ["elite"] },
  { id: "antiquities",     label_key: "onboarding.culture_antiquities",     registers: ["elite"] },
  { id: "fine_art",        label_key: "onboarding.culture_fine_art",        registers: ["elite", "middle_class"] },
  { id: "opera",           label_key: "onboarding.culture_opera",           registers: ["elite", "middle_class"] },
  { id: "interior_design", label_key: "onboarding.culture_interior_design", registers: ["elite", "middle_class"] },
  { id: "gastronomy",      label_key: "onboarding.culture_gastronomy",      registers: ["elite", "middle_class"] },
  { id: "classical_music", label_key: "onboarding.culture_classical_music", registers: ["middle_class", "elite"] },
  { id: "ballet",          label_key: "onboarding.culture_ballet",          registers: ["middle_class", "elite"] },
  { id: "architecture",    label_key: "onboarding.culture_architecture",    registers: ["middle_class", "elite"] },
  { id: "heritage_travel", label_key: "onboarding.culture_heritage_travel", registers: ["middle_class"] },
  { id: "literature",      label_key: "onboarding.culture_literature",      registers: ["middle_class"] },
];

// ─── Step 8: Sports / gastronomy / dresscode ──────────────────────────────────
const SPORTS_FALLBACK = [
  { id: "polo",          label_key: "onboarding.sport_polo",         registers: ["elite"] },
  { id: "horse_riding",  label_key: "onboarding.sport_horse_riding", registers: ["elite"] },
  { id: "sailing",       label_key: "onboarding.sport_sailing",      registers: ["elite"] },
  { id: "hunting",       label_key: "onboarding.sport_hunting",      registers: ["elite"] },
  { id: "fencing",       label_key: "onboarding.sport_fencing",      registers: ["elite", "middle_class"] },
  { id: "rowing",        label_key: "onboarding.sport_rowing",       registers: ["elite", "middle_class"] },
  { id: "golf",          label_key: "onboarding.sport_golf",         registers: ["elite", "middle_class"] },
  { id: "tennis",        label_key: "onboarding.sport_tennis",       registers: ["middle_class", "elite"] },
  { id: "squash",        label_key: "onboarding.sport_squash",       registers: ["middle_class"] },
];

const CUISINE_FALLBACK = [
  { id: "French",        label_key: "onboarding.cuisine_french",       registers: ["elite", "middle_class"] },
  { id: "Japanese",      label_key: "onboarding.cuisine_japanese",     registers: ["elite", "middle_class"] },
  { id: "Italian",       label_key: "onboarding.cuisine_italian",      registers: ["elite", "middle_class"] },
  { id: "Scandinavian",  label_key: "onboarding.cuisine_scandinavian", registers: ["elite"] },
  { id: "British",       label_key: "onboarding.cuisine_british",      registers: ["elite", "middle_class"] },
  { id: "Spanish",       label_key: "onboarding.cuisine_spanish",      registers: ["middle_class", "elite"] },
  { id: "Indian",        label_key: "onboarding.cuisine_indian",       registers: ["middle_class"] },
  { id: "Chinese",       label_key: "onboarding.cuisine_chinese",      registers: ["middle_class"] },
  { id: "Lebanese",      label_key: "onboarding.cuisine_lebanese",     registers: ["middle_class"] },
  { id: "Peruvian",      label_key: "onboarding.cuisine_peruvian",     registers: ["middle_class"] },
];

const DRESS_FALLBACK = [
  { id: "black tie",     label_key: "onboarding.dress_black_tie",   registers: ["elite"] },
  { id: "cocktail",      label_key: "onboarding.dress_cocktail",    registers: ["elite", "middle_class"] },
  { id: "business",      label_key: "onboarding.dress_business",    registers: ["middle_class", "elite"] },
  { id: "casual chic",   label_key: "onboarding.dress_casual_chic", registers: ["middle_class"] },
  { id: "country",       label_key: "onboarding.dress_country",     registers: ["elite", "middle_class"] },
];

// ─── Step 9: Learning intent pillars ─────────────────────────────────────────
const LEARNING_PILLARS = [
  { id: "P1", label_key: "onboarding.pillar_P1" },
  { id: "P2", label_key: "onboarding.pillar_P2" },
  { id: "P3", label_key: "onboarding.pillar_P3" },
  { id: "P4", label_key: "onboarding.pillar_P4" },
  { id: "P5", label_key: "onboarding.pillar_P5" },
];

const INTENT_OPTIONS = [
  { id: "surface",   label_key: "onboarding.intent_surface",   desc_key: "onboarding.intent_surface_desc" },
  { id: "competent", label_key: "onboarding.intent_competent", desc_key: "onboarding.intent_competent_desc" },
  { id: "mastery",   label_key: "onboarding.intent_mastery",   desc_key: "onboarding.intent_mastery_desc" },
] as const;

// ─── Plan step types ──────────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
type PaidTier = "student" | "traveller" | "ambassador";

interface Plan {
  productId:       string;
  tier:            PaidTier | "guest" | "concierge";
  displayName:     string;
  monthlyPriceId:  string | null;
  monthlyAmount:   number | null;
  yearlyPriceId:   string | null;
  yearlyAmount:    number | null;
  currency:        string;
  trialDays?:      number;
}

const PAID_TIER_META: Record<PaidTier, {
  icon:           typeof Globe;
  accent:         string;
  labelKey:       string;
  taglineKey:     string;
  ctaKey:         string;
  defaultName:    string;
  defaultTagline: string;
  defaultCta:     string;
}> = {
  student: {
    icon:           Star,
    accent:         "#4a7c9b",
    labelKey:       "membership.student.tagline",
    taglineKey:     "onboarding.plan_student_tagline",
    ctaKey:         "membership.cta_student",
    defaultName:    "The Student",
    defaultTagline: "An apprentice's path",
    defaultCta:     "Begin your formation",
  },
  traveller: {
    icon:           Globe,
    accent:         "var(--primary)",
    labelKey:       "membership.traveller.tagline",
    taglineKey:     "onboarding.plan_traveller_tagline",
    ctaKey:         "membership.cta_traveller",
    defaultName:    "The Traveller",
    defaultTagline: "Expand your world",
    defaultCta:     "Expand your world",
  },
  ambassador: {
    icon:           Crown,
    accent:         "#9b7c4a",
    labelKey:       "membership.ambassador.tagline",
    taglineKey:     "onboarding.plan_ambassador_tagline",
    ctaKey:         "membership.cta_ambassador",
    defaultName:    "The Ambassador",
    defaultTagline: "Refine your presence",
    defaultCta:     "Elevate your standing",
  },
};

function recommendTier(objectives: string[]): PaidTier {
  if (objectives.includes("elite") || objectives.includes("business")) return "ambassador";
  if (objectives.includes("world_traveller") || objectives.includes("romantic")) return "traveller";
  return "student";
}

function formatPrice(amount: number | null, currency: string): string {
  if (amount === null) return "—";
  return new Intl.NumberFormat("en-GB", {
    style:                 "currency",
    currency:              currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amount / 100);
}

export default function Onboarding() {
  usePageTitle("Welcome");
  const { t } = useLanguage();
  const { getAuthHeaders, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const [step, setStep] = useState<Step>(() => {
    const saved = sessionStorage.getItem("onboarding_resume_step");
    if (saved) {
      sessionStorage.removeItem("onboarding_resume_step");
      const n = parseInt(saved, 10);
      if (n >= 1 && n <= 11) return n as Step;
    }
    return 1;
  });

  // ── Step 1 ────────────────────────────────────────────────────────────────
  const [country, setCountry] = useState("");
  // ── Step 2 ────────────────────────────────────────────────────────────────
  const [objectives, setObjectives] = useState<string[]>([]);
  // ── Step 3 ────────────────────────────────────────────────────────────────
  const [spheres, setSpheres] = useState<string[]>([]);
  // ── Step 4 ────────────────────────────────────────────────────────────────
  const [worldChoice, setWorldChoice] = useState<"A" | "B" | "C" | null>(null);
  // ── Step 5 ────────────────────────────────────────────────────────────────
  const [archetype, setArchetype] = useState<string | null>(null);
  const [secondaryArchetype, setSecondaryArchetype] = useState<string | null>(null);
  const [showSecondary, setShowSecondary] = useState(false);
  // ── Step 6 ────────────────────────────────────────────────────────────────
  const [socialCircles, setSocialCircles] = useState<string[]>([]);
  const [showOtherWorld6, setShowOtherWorld6] = useState(false);
  const [catalogCircles, setCatalogCircles] = useState<{ id: string; label_key: string; registers: string[] }[] | null>(null);
  // ── Step 7 ────────────────────────────────────────────────────────────────
  const [culturalInterests, setCulturalInterests] = useState<string[]>([]);
  const [showOtherWorld7, setShowOtherWorld7] = useState(false);
  const [catalogCulture, setCatalogCulture] = useState<{ id: string; label_key: string; registers: string[] }[] | null>(null);
  // ── Step 8 ────────────────────────────────────────────────────────────────
  const [sports, setSports] = useState<string[]>([]);
  const [cuisine, setCuisine] = useState<string[]>([]);
  const [dressCode, setDressCode] = useState<string[]>([]);
  const [showOtherWorld8, setShowOtherWorld8] = useState(false);
  const [catalogSports, setCatalogSports] = useState<{ id: string; label_key: string; registers: string[] }[] | null>(null);
  const [catalogCuisine, setCatalogCuisine] = useState<{ id: string; label_key: string; registers: string[] }[] | null>(null);
  const [catalogDress, setCatalogDress] = useState<{ id: string; label_key: string; registers: string[] }[] | null>(null);
  // ── Step 9 ────────────────────────────────────────────────────────────────
  const defaultIntent: Record<string, "surface" | "competent" | "mastery"> =
    Object.fromEntries(LEARNING_PILLARS.map((p) => [p.id, "competent"]));
  const [learningIntent, setLearningIntent] = useState<Record<string, "surface" | "competent" | "mastery">>(defaultIntent);
  // ── Step 10 ───────────────────────────────────────────────────────────────
  const [placementSkipped, setPlacementSkipped] = useState(false);
  // ── Global ────────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [checkingOut, setCheckingOut] = useState<PaidTier | null>(null);

  const TOTAL_STEPS = 10;

  useEffect(() => {
    fetch(`${API_BASE}/api/subscription/plans`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => setPlans(Array.isArray(data) ? (data as Plan[]) : []))
      .catch(() => setPlans([]));
  }, []);

  useEffect(() => {
    if (step === 6 && catalogCircles === null) {
      fetch(`${API_BASE}/api/catalog/interests?taxonomy=social_circles`)
        .then((r) => (r.ok ? r.json() : []))
        .then((rows: unknown) => {
          if (Array.isArray(rows) && rows.length > 0) {
            setCatalogCircles((rows as Array<{ slug: string; label_i18n_key: string; registers: string[] }>)
              .map((r) => ({ id: r.slug, label_key: r.label_i18n_key, registers: r.registers })));
          } else {
            setCatalogCircles([]);
          }
        })
        .catch(() => setCatalogCircles([]));
    }
  }, [step, catalogCircles]);

  useEffect(() => {
    if (step === 7 && catalogCulture === null) {
      fetch(`${API_BASE}/api/catalog/interests?taxonomy=cultural_interests`)
        .then((r) => (r.ok ? r.json() : []))
        .then((rows: unknown) => {
          if (Array.isArray(rows) && rows.length > 0) {
            setCatalogCulture((rows as Array<{ slug: string; label_i18n_key: string; registers: string[] }>)
              .map((r) => ({ id: r.slug, label_key: r.label_i18n_key, registers: r.registers })));
          } else {
            setCatalogCulture([]);
          }
        })
        .catch(() => setCatalogCulture([]));
    }
  }, [step, catalogCulture]);

  function toggleArr<T extends string>(arr: T[], val: T, set: (v: T[]) => void) {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : ([...arr, val] as T[]));
  }

  function toggleMax<T extends string>(arr: T[], val: T, set: (v: T[]) => void, max: number) {
    if (arr.includes(val)) {
      set(arr.filter((x) => x !== val) as T[]);
    } else if (arr.length < max) {
      set([...arr, val] as T[]);
    }
  }

  useEffect(() => {
    if (step === 8) {
      if (catalogSports === null) {
        fetch(`${API_BASE}/api/catalog/interests?taxonomy=sports`)
          .then((r) => (r.ok ? r.json() : []))
          .then((rows: unknown) => {
            const arr = Array.isArray(rows) && rows.length > 0
              ? (rows as Array<{ slug: string; label_i18n_key: string; registers: string[] }>)
                  .map((r) => ({ id: r.slug, label_key: r.label_i18n_key, registers: r.registers }))
              : [];
            setCatalogSports(arr);
          })
          .catch(() => setCatalogSports([]));
      }
      if (catalogCuisine === null) {
        fetch(`${API_BASE}/api/catalog/interests?taxonomy=gastronomy`)
          .then((r) => (r.ok ? r.json() : []))
          .then((rows: unknown) => {
            const arr = Array.isArray(rows) && rows.length > 0
              ? (rows as Array<{ slug: string; label_i18n_key: string; registers: string[] }>)
                  .map((r) => ({ id: r.slug, label_key: r.label_i18n_key, registers: r.registers }))
              : [];
            setCatalogCuisine(arr);
          })
          .catch(() => setCatalogCuisine([]));
      }
      if (catalogDress === null) {
        fetch(`${API_BASE}/api/catalog/interests?taxonomy=dress_codes`)
          .then((r) => (r.ok ? r.json() : []))
          .then((rows: unknown) => {
            const arr = Array.isArray(rows) && rows.length > 0
              ? (rows as Array<{ slug: string; label_i18n_key: string; registers: string[] }>)
                  .map((r) => ({ id: r.slug, label_key: r.label_i18n_key, registers: r.registers }))
              : [];
            setCatalogDress(arr);
          })
          .catch(() => setCatalogDress([]));
      }
    }
  }, [step, catalogSports, catalogCuisine, catalogDress]);

  // ── Save to the canonical onboarding endpoint ────────────────────────────
  // Throws with a user-facing message string on HTTP or network error.
  async function saveOnboarding(body: Record<string, unknown>): Promise<void> {
    if (!isAuthenticated) return;
    const res = await fetch(`${API_BASE}/api/users/me/onboarding`, {
      method:      "PUT",
      credentials: "include",
      headers:     { "Content-Type": "application/json", ...getAuthHeaders() },
      body:        JSON.stringify(body),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(json.error ?? "An error occurred while saving your progress.");
    }
  }

  function trackPlanChoice(action: "selected_tier" | "skipped" | "skipped_unauth", tier?: PaidTier | null) {
    try {
      void fetch(`${API_BASE}/api/onboarding/plan-choice`, {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json", ...getAuthHeaders() },
        body:        JSON.stringify({ action, tier: tier ?? null, recommendedTier: recommendTier(objectives), objectives }),
        keepalive:   true,
      }).catch(() => {});
    } catch { /* ignore */ }
  }

  // ── Advance from step 3 → 4 (save steps 1-3 via canonical endpoint) ────────
  async function handleAdvanceFromStep3() {
    setSaving(true);
    try {
      await saveOnboarding({
        country_of_origin:      country || null,
        objectives,
        situational_interests:  spheres,
      });
    } finally {
      setSaving(false);
      setStep(4);
    }
  }

  // ── Advance from step 9 → 10 (save learning intent + mark completed) ──────
  const [completionError, setCompletionError] = useState<string | null>(null);

  async function handleAdvanceFromStep9() {
    setSaving(true);
    setCompletionError(null);
    try {
      await saveOnboarding({
        learning_intent:      learningIntent,
        onboarding_completed: true,
      });
      setStep(10);
    } catch (err) {
      setCompletionError(err instanceof Error ? err.message : "Unable to complete onboarding. Please go back and check your answers.");
    } finally {
      setSaving(false);
    }
  }

  // ── Plan step: select a tier ──────────────────────────────────────────────
  async function handleSelectTier(tier: PaidTier) {
    const plan    = plans.find((p) => p.tier === tier);
    const priceId = plan?.monthlyPriceId ?? null;
    trackPlanChoice("selected_tier", tier);

    if (!priceId) {
      if (!isAuthenticated) {
        sessionStorage.setItem("onboarding_resume_step", "11");
        navigate("/signin?return=/onboarding");
        return;
      }
      setCheckingOut(tier);
      try {
        const trialRes = await fetch(`${API_BASE}/api/subscription/start-trial`, {
          method:      "POST",
          credentials: "include",
          headers:     { "Content-Type": "application/json", ...getAuthHeaders() },
          body:        JSON.stringify({ tier }),
        });
        if (trialRes.status === 401) {
          sessionStorage.setItem("onboarding_resume_step", "11");
          navigate("/signin?return=/onboarding");
          return;
        }
        window.location.href = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/atelier?upgrade=success`;
      } catch {
        navigate("/membership");
      } finally {
        setCheckingOut(null);
      }
      return;
    }

    setCheckingOut(tier);
    try {
      const res = await fetch(`${API_BASE}/api/subscription/checkout`, {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json", ...getAuthHeaders() },
        body:        JSON.stringify({ priceId }),
      });
      if (res.status === 401) {
        trackPlanChoice("skipped_unauth", tier);
        navigate("/signin?return=/onboarding");
        return;
      }
      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        navigate("/membership");
      }
    } catch {
      setCheckingOut(null);
      navigate("/membership");
    }
  }

  function handleSkipPlan() {
    trackPlanChoice("skipped");
    navigate("/");
  }

  // ── Step labels (progress indicator) ─────────────────────────────────────
  const stepLabels: Record<Step, string> = {
    1:  t("onboarding.step1_label"),
    2:  t("onboarding.step2_label"),
    3:  t("onboarding.step4_label"),                 // "Social World" (existing key)
    4:  t("onboarding.step_world_label"),
    5:  t("onboarding.step_archetype_label"),
    6:  t("onboarding.step_circles_label"),
    7:  t("onboarding.step_culture_label"),
    8:  t("onboarding.step3_label"),                 // "Interests" (existing key)
    9:  t("onboarding.step_intent_label"),
    10: t("onboarding.step_placement_label"),
    11: t("onboarding.step5_label", "Your Path"),
  };

  // ── Shared pill button ────────────────────────────────────────────────────
  function PillButton({ id, label, selected, disabled, onClick }: {
    id: string; label: string; selected: boolean; disabled?: boolean; onClick: () => void;
  }) {
    return (
      <button
        key={id}
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`px-3 py-1.5 rounded-sm text-xs border transition-all ${
          selected
            ? "bg-primary text-primary-foreground border-primary"
            : disabled
              ? "border-border/40 text-muted-foreground/50 cursor-not-allowed"
              : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
        }`}
      >
        {label}
      </button>
    );
  }

  // ── Nav buttons ────────────────────────────────────────────────────────────
  function NavBack({ to }: { to: Step }) {
    return (
      <Button variant="outline" className="font-serif gap-2" onClick={() => setStep(to)}>
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        {t("onboarding.back")}
      </Button>
    );
  }

  function NavNext({
    to, disabled, loading, onAdvance,
  }: {
    to?: Step; disabled?: boolean; loading?: boolean; onAdvance?: () => void;
  }) {
    return (
      <Button
        className="font-serif gap-2 bg-primary hover:bg-primary/90 text-primary-foreground min-w-[140px]"
        disabled={disabled || loading}
        aria-busy={loading}
        onClick={() => { if (onAdvance) { onAdvance(); } else if (to) { setStep(to); } }}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : (
          <>
            {t("onboarding.next")}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </>
        )}
      </Button>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-10 animate-in fade-in duration-500 py-10">

      {/* Progress dots (steps 1-10; step 11 = plan is outside indicator) */}
      {step <= 10 && (
        <div className="flex justify-center gap-2 flex-wrap">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step ? "w-8 bg-primary" : s < step ? "w-3 bg-primary/50" : "w-3 bg-border"
              }`}
            />
          ))}
        </div>
      )}

      {step <= 10 && (
        <div className="text-center space-y-1">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            {t("onboarding.step_of", { current: step, total: TOTAL_STEPS })} — {stepLabels[step]}
          </p>
        </div>
      )}

      {/* Step 1: Country of origin */}
      {step === 1 && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-serif text-foreground">{t("onboarding.step1_title")}</h1>
            <p className="text-muted-foreground font-light leading-relaxed">{t("onboarding.step1_subtitle")}</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="country" className="text-xs font-mono uppercase tracking-widest text-muted-foreground block">
              {t("onboarding.country_label")}
            </label>
            <select
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full h-12 px-4 rounded-sm border border-border/60 bg-background text-sm text-foreground focus:outline-none focus:border-primary/50"
            >
              <option value="">{t("onboarding.country_placeholder")}</option>
              {WORLD_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" className="font-serif text-muted-foreground" onClick={() => navigate("/")}>
              {t("onboarding.skip")}
            </Button>
            <NavNext to={2} />
          </div>
        </div>
      )}

      {/* Step 2: Objectives */}
      {step === 2 && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-serif text-foreground">{t("onboarding.step2_title")}</h1>
            <p className="text-muted-foreground font-light leading-relaxed">{t("onboarding.step2_subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {OBJECTIVES.map((obj) => {
              const selected = objectives.includes(obj.id);
              return (
                <button
                  key={obj.id}
                  type="button"
                  onClick={() => toggleArr(objectives, obj.id, setObjectives)}
                  className={`relative p-5 rounded-sm border text-left transition-all duration-200 ${
                    selected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border/60 hover:border-primary/30 hover:bg-muted/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl text-primary/60 font-serif leading-none mt-0.5" aria-hidden="true">
                      {obj.icon}
                    </span>
                    <div>
                      <div className="font-serif text-base text-foreground">{t(obj.label_key)}</div>
                      <div className="text-xs text-muted-foreground font-light mt-1 leading-relaxed">{t(obj.desc_key)}</div>
                    </div>
                  </div>
                  {selected && <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-primary" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          <div className="flex justify-between gap-3">
            <NavBack to={1} />
            <div className="flex gap-2">
              <Button variant="ghost" className="font-serif text-muted-foreground" onClick={() => setStep(3)}>
                {t("onboarding.skip")}
              </Button>
              <NavNext to={3} />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Social Spheres */}
      {step === 3 && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-serif text-foreground">{t("onboarding.step4_title")}</h1>
            <p className="text-muted-foreground font-light leading-relaxed">{t("onboarding.step4_subtitle")}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            {SPHERE_OPTIONS.map(({ key, icon: Icon, labelKey }) => {
              const selected = spheres.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleArr(spheres, key, setSpheres)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-sm border text-sm transition-all duration-200 ${
                    selected
                      ? "bg-primary/10 text-primary border-primary/35 font-medium ring-1 ring-primary/20"
                      : "border-border/50 text-muted-foreground hover:border-primary/30 hover:bg-muted/30 hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{t(labelKey)}</span>
                  {selected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 ml-0.5" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          <div className="flex justify-between gap-3">
            <NavBack to={2} />
            <div className="flex gap-2">
              <Button variant="ghost" className="font-serif text-muted-foreground" onClick={() => { void handleAdvanceFromStep3(); }}>
                {t("onboarding.skip")}
              </Button>
              <NavNext loading={saving} onAdvance={() => { void handleAdvanceFromStep3(); }} />
            </div>
          </div>
        </div>
      )}

      {/* Step 4: World choice */}
      {step === 4 && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-serif text-foreground">{t("onboarding.step_world_title")}</h1>
            <p className="text-muted-foreground font-light leading-relaxed">{t("onboarding.step_world_subtitle")}</p>
          </div>

          <div className="space-y-3">
            {WORLD_OPTIONS.map((opt) => {
              const selected = worldChoice === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setWorldChoice(opt.id)}
                  className={`relative w-full text-left p-5 rounded-sm border transition-all duration-200 ${
                    selected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border/60 hover:border-primary/30 hover:bg-muted/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl text-primary/60 font-serif leading-none mt-0.5" aria-hidden="true">
                      {opt.icon}
                    </span>
                    <div>
                      <div className="font-serif text-base text-foreground">{t(opt.label_key)}</div>
                      <div className="text-xs text-muted-foreground font-light mt-1 leading-relaxed">{t(opt.desc_key)}</div>
                    </div>
                  </div>
                  {selected && <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-primary" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          <div className="flex justify-between gap-3">
            <NavBack to={3} />
            <div className="flex gap-2">
              <Button variant="ghost" className="font-serif text-muted-foreground" onClick={() => setStep(5)}>
                {t("onboarding.skip")}
              </Button>
              <NavNext
                to={5}
                onAdvance={() => {
                  if (worldChoice) void saveOnboarding({ world_choice: worldChoice });
                  setStep(5);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Archetype */}
      {step === 5 && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-serif text-foreground">{t("onboarding.step_archetype_title")}</h1>
            <p className="text-muted-foreground font-light leading-relaxed">{t("onboarding.step_archetype_subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ARCHETYPE_OPTIONS.map((arc) => {
              const selected = archetype === arc.id;
              return (
                <button
                  key={arc.id}
                  type="button"
                  onClick={() => {
                    setArchetype(selected ? null : arc.id);
                    if (selected) setSecondaryArchetype(null);
                  }}
                  className={`relative p-4 rounded-sm border text-left transition-all duration-200 ${
                    selected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border/60 hover:border-primary/30 hover:bg-muted/20"
                  }`}
                >
                  <div className="font-serif text-base text-foreground">{t(arc.label_key)}</div>
                  <div className="text-xs text-muted-foreground font-light mt-1 leading-relaxed">{t(arc.desc_key)}</div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-primary/60 mt-2">{t(arc.pillar_key)}</div>
                  {selected && <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-primary" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          {/* Optional secondary archetype */}
          {archetype && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowSecondary(!showSecondary)}
                className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                {showSecondary ? "▾" : "▸"} {t("onboarding.secondary_archetype_label")}
              </button>
              {showSecondary && (
                <div className="flex flex-wrap gap-2 pl-1">
                  {ARCHETYPE_OPTIONS.filter((a) => a.id !== archetype).map((arc) => {
                    const sel = secondaryArchetype === arc.id;
                    return (
                      <button
                        key={arc.id}
                        type="button"
                        onClick={() => setSecondaryArchetype(sel ? null : arc.id)}
                        className={`px-3 py-1.5 rounded-sm text-xs border transition-all ${
                          sel
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        }`}
                      >
                        {t(arc.label_key)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between gap-3">
            <NavBack to={4} />
            <div className="flex gap-2">
              <Button variant="ghost" className="font-serif text-muted-foreground" onClick={() => setStep(6)}>
                {t("onboarding.skip")}
              </Button>
              <NavNext
                to={6}
                onAdvance={() => {
                  if (archetype) void saveOnboarding({ archetype, secondary_archetype: secondaryArchetype });
                  setStep(6);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 6: Social circles */}
      {step === 6 && (() => {
        const allCircles = catalogCircles && catalogCircles.length > 0 ? catalogCircles : SOCIAL_CIRCLE_FALLBACK;
        const primaryRegister = worldChoice === "B" ? "elite" : worldChoice === "A" ? "middle_class" : null;
        const primaryCircles = primaryRegister ? allCircles.filter((o) => o.registers.includes(primaryRegister)) : allCircles;
        const otherCircles   = primaryRegister ? allCircles.filter((o) => !o.registers.includes(primaryRegister)) : [];
        const showToggle = otherCircles.length > 0;
        return (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center space-y-3">
              <h1 className="text-3xl md:text-4xl font-serif text-foreground">{t("onboarding.step_circles_title")}</h1>
              <p className="text-muted-foreground font-light leading-relaxed">{t("onboarding.step_circles_subtitle")}</p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {primaryCircles.map((opt) => {
                  const sel = socialCircles.includes(opt.id);
                  const atMax = !sel && socialCircles.length >= 4;
                  return (
                    <PillButton
                      key={opt.id}
                      id={opt.id}
                      label={t(opt.label_key)}
                      selected={sel}
                      disabled={atMax}
                      onClick={() => toggleMax(socialCircles, opt.id, setSocialCircles, 4)}
                    />
                  );
                })}
              </div>

              {showToggle && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowOtherWorld6(!showOtherWorld6)}
                    className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                  >
                    {showOtherWorld6 ? "▾" : "▸"} {t("onboarding.show_other_world")}
                  </button>
                  {showOtherWorld6 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {otherCircles.map((opt) => {
                        const sel = socialCircles.includes(opt.id);
                        const atMax = !sel && socialCircles.length >= 4;
                        return (
                          <PillButton
                            key={opt.id}
                            id={opt.id}
                            label={t(opt.label_key)}
                            selected={sel}
                            disabled={atMax}
                            onClick={() => toggleMax(socialCircles, opt.id, setSocialCircles, 4)}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {socialCircles.length > 0 && (
              <p className="text-xs text-muted-foreground font-light text-center">
                {socialCircles.length} / 4 {t("onboarding.max_selected")}
              </p>
            )}

            <div className="flex justify-between gap-3">
              <NavBack to={5} />
              <NavNext
                to={7}
                disabled={socialCircles.length === 0}
                onAdvance={() => {
                  void saveOnboarding({ social_circles: socialCircles }).catch(() => {});
                  setStep(7);
                }}
              />
            </div>
          </div>
        );
      })()}

      {/* Step 7: Cultural interests */}
      {step === 7 && (() => {
        const allCulture = catalogCulture && catalogCulture.length > 0 ? catalogCulture : CULTURAL_INTEREST_FALLBACK;
        const primaryRegister = worldChoice === "B" ? "elite" : worldChoice === "A" ? "middle_class" : null;
        const primaryCulture = primaryRegister ? allCulture.filter((o) => o.registers.includes(primaryRegister)) : allCulture;
        const otherCulture   = primaryRegister ? allCulture.filter((o) => !o.registers.includes(primaryRegister)) : [];
        const showToggle = otherCulture.length > 0;
        return (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center space-y-3">
              <h1 className="text-3xl md:text-4xl font-serif text-foreground">{t("onboarding.step_culture_title")}</h1>
              <p className="text-muted-foreground font-light leading-relaxed">{t("onboarding.step_culture_subtitle")}</p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {primaryCulture.map((opt) => {
                  const sel = culturalInterests.includes(opt.id);
                  const atMax = !sel && culturalInterests.length >= 4;
                  return (
                    <PillButton
                      key={opt.id}
                      id={opt.id}
                      label={t(opt.label_key)}
                      selected={sel}
                      disabled={atMax}
                      onClick={() => toggleMax(culturalInterests, opt.id, setCulturalInterests, 4)}
                    />
                  );
                })}
              </div>

              {showToggle && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowOtherWorld7(!showOtherWorld7)}
                    className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                  >
                    {showOtherWorld7 ? "▾" : "▸"} {t("onboarding.show_other_world")}
                  </button>
                  {showOtherWorld7 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {otherCulture.map((opt) => {
                        const sel = culturalInterests.includes(opt.id);
                        const atMax = !sel && culturalInterests.length >= 4;
                        return (
                          <PillButton
                            key={opt.id}
                            id={opt.id}
                            label={t(opt.label_key)}
                            selected={sel}
                            disabled={atMax}
                            onClick={() => toggleMax(culturalInterests, opt.id, setCulturalInterests, 4)}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {culturalInterests.length > 0 && (
              <p className="text-xs text-muted-foreground font-light text-center">
                {culturalInterests.length} / 4 {t("onboarding.max_selected")}
              </p>
            )}

            <div className="flex justify-between gap-3">
              <NavBack to={6} />
              <NavNext
                to={8}
                disabled={culturalInterests.length === 0}
                onAdvance={() => {
                  void saveOnboarding({ cultural_interests: culturalInterests }).catch(() => {});
                  setStep(8);
                }}
              />
            </div>
          </div>
        );
      })()}

      {/* Step 8: Sports / gastronomy / dresscode */}
      {step === 8 && (() => {
        const allSports  = catalogSports  && catalogSports.length  > 0 ? catalogSports  : SPORTS_FALLBACK;
        const allCuisine = catalogCuisine && catalogCuisine.length > 0 ? catalogCuisine : CUISINE_FALLBACK;
        const allDress   = catalogDress   && catalogDress.length   > 0 ? catalogDress   : DRESS_FALLBACK;
        const primaryRegister = worldChoice === "B" ? "elite" : worldChoice === "A" ? "middle_class" : null;
        const combinedCount = sports.length + cuisine.length + dressCode.length;
        const toggleSport  = (id: string) => { if (!sports.includes(id)  && combinedCount >= 4) return; toggleArr(sports,    id, setSports);   };
        const toggleCuisine = (id: string) => { if (!cuisine.includes(id)  && combinedCount >= 4) return; toggleArr(cuisine,   id, setCuisine);  };
        const toggleDress  = (id: string) => { if (!dressCode.includes(id) && combinedCount >= 4) return; toggleArr(dressCode, id, setDressCode); };
        const filterPrimary = <T extends { registers: string[] }>(opts: T[]) =>
          primaryRegister ? opts.filter((o) => o.registers.includes(primaryRegister)) : opts;
        const filterOther = <T extends { registers: string[] }>(opts: T[]) =>
          primaryRegister ? opts.filter((o) => !o.registers.includes(primaryRegister)) : [];
        const primarySports  = filterPrimary(allSports);
        const primaryCuisine = filterPrimary(allCuisine);
        const primaryDress   = filterPrimary(allDress);
        const otherSports    = filterOther(allSports);
        const otherCuisine   = filterOther(allCuisine);
        const otherDress     = filterOther(allDress);
        const hasOther = otherSports.length > 0 || otherCuisine.length > 0 || otherDress.length > 0;
        return (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center space-y-3">
              <h1 className="text-3xl md:text-4xl font-serif text-foreground">{t("onboarding.step3_title")}</h1>
              <p className="text-muted-foreground font-light leading-relaxed">{t("onboarding.step3_subtitle")}</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  {t("onboarding.interests_sports")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {primarySports.map((opt) => (
                    <PillButton key={opt.id} id={opt.id} label={t(opt.label_key)}
                      selected={sports.includes(opt.id)} onClick={() => toggleSport(opt.id)} />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  {t("onboarding.interests_cuisine")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {primaryCuisine.map((opt) => (
                    <PillButton key={opt.id} id={opt.id} label={t(opt.label_key)}
                      selected={cuisine.includes(opt.id)} onClick={() => toggleCuisine(opt.id)} />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  {t("onboarding.interests_dress")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {primaryDress.map((opt) => (
                    <PillButton key={opt.id} id={opt.id} label={t(opt.label_key)}
                      selected={dressCode.includes(opt.id)} onClick={() => toggleDress(opt.id)} />
                  ))}
                </div>
              </div>

              {combinedCount > 0 && (
                <p className="text-xs text-muted-foreground font-light text-center">
                  {combinedCount} / 4 {t("onboarding.max_selected")}
                </p>
              )}

              {hasOther && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowOtherWorld8(!showOtherWorld8)}
                    className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                  >
                    {showOtherWorld8 ? "▾" : "▸"} {t("onboarding.show_other_world")}
                  </button>
                  {showOtherWorld8 && (
                    <div className="space-y-4 pt-1">
                      {otherSports.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {otherSports.map((opt) => (
                            <PillButton key={opt.id} id={opt.id} label={t(opt.label_key)}
                              selected={sports.includes(opt.id)} onClick={() => toggleSport(opt.id)} />
                          ))}
                        </div>
                      )}
                      {otherCuisine.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {otherCuisine.map((opt) => (
                            <PillButton key={opt.id} id={opt.id} label={t(opt.label_key)}
                              selected={cuisine.includes(opt.id)} onClick={() => toggleCuisine(opt.id)} />
                          ))}
                        </div>
                      )}
                      {otherDress.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {otherDress.map((opt) => (
                            <PillButton key={opt.id} id={opt.id} label={t(opt.label_key)}
                              selected={dressCode.includes(opt.id)} onClick={() => toggleDress(opt.id)} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-between gap-3">
              <NavBack to={7} />
              <NavNext
                to={9}
                disabled={[...sports, ...cuisine, ...dressCode].length === 0}
                onAdvance={() => {
                  const combined = [...sports, ...cuisine, ...dressCode];
                  void saveOnboarding({
                    selected_interests:   combined,
                    interests_sports:     sports,
                    interests_cuisine:    cuisine,
                    interests_dress_code: dressCode,
                  }).catch(() => {});
                  setStep(9);
                }}
              />
            </div>
          </div>
        );
      })()}

      {/* Step 9: Learning intent per pillar */}
      {step === 9 && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-serif text-foreground">{t("onboarding.step_intent_title")}</h1>
            <p className="text-muted-foreground font-light leading-relaxed">{t("onboarding.step_intent_subtitle")}</p>
          </div>

          <div className="space-y-5">
            {LEARNING_PILLARS.map((pillar) => {
              const current = learningIntent[pillar.id] ?? "competent";
              return (
                <div key={pillar.id} className="space-y-2">
                  <p className="text-sm font-serif text-foreground">{t(pillar.label_key)}</p>
                  <div className="flex gap-2 flex-wrap">
                    {INTENT_OPTIONS.map((intent) => {
                      const sel = current === intent.id;
                      return (
                        <button
                          key={intent.id}
                          type="button"
                          onClick={() => setLearningIntent((prev) => ({ ...prev, [pillar.id]: intent.id }))}
                          className={`px-3 py-2 rounded-sm border text-left transition-all flex-1 min-w-[90px] ${
                            sel
                              ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                              : "border-border/60 hover:border-primary/30 hover:bg-muted/20"
                          }`}
                        >
                          <div className="text-xs font-serif text-foreground">{t(intent.label_key)}</div>
                          <div className="text-[10px] text-muted-foreground font-light mt-0.5 leading-relaxed">{t(intent.desc_key)}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {completionError && (
            <p className="text-sm text-destructive text-center bg-destructive/10 rounded-lg px-4 py-2">
              {completionError}
            </p>
          )}

          <div className="flex justify-between gap-3">
            <NavBack to={8} />
            <NavNext loading={saving} onAdvance={() => { void handleAdvanceFromStep9(); }} />
          </div>
        </div>
      )}

      {/* Step 10: Placement assessment */}
      {step === 10 && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-serif text-foreground">{t("onboarding.step_placement_title")}</h1>
            <p className="text-muted-foreground font-light leading-relaxed">{t("onboarding.step_placement_subtitle")}</p>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                setPlacementSkipped(false);
                navigate("/atelier?placement=true");
              }}
              className="w-full text-left p-5 rounded-sm border border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-serif text-base text-foreground">{t("onboarding.placement_cta")}</div>
                  <div className="text-xs text-muted-foreground font-light mt-1">{t("onboarding.placement_cta_desc")}</div>
                </div>
                <ArrowRight className="w-5 h-5 text-primary shrink-0 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setPlacementSkipped(true);
                setStep(11);
              }}
              className="w-full text-left p-4 rounded-sm border border-dashed border-border/60 hover:border-border transition-all duration-200 group"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 mt-0.5 text-muted-foreground/70 shrink-0" aria-hidden="true" />
                <div>
                  <div className="font-serif text-sm text-foreground">{t("onboarding.placement_skip")}</div>
                  <div className="text-xs text-muted-foreground font-light mt-1">{t("onboarding.placement_skip_warning")}</div>
                </div>
              </div>
            </button>
          </div>

          <div className="flex justify-start">
            <NavBack to={9} />
          </div>
        </div>
      )}

      {/* Step 11: Plan choice */}
      {step === 11 && (() => {
        const recommended = recommendTier(objectives);
        const tierOrder: PaidTier[] = ["student", "traveller", "ambassador"];
        return (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center space-y-3">
              <h1 className="text-3xl md:text-4xl font-serif text-foreground">
                {t("onboarding.step5_title", "Choose your path")}
              </h1>
              <p className="text-muted-foreground font-light leading-relaxed">
                {t("onboarding.step5_subtitle", "Begin with a 2-month free trial. Cancel any time before then and you'll never be charged.")}
              </p>
            </div>

            {placementSkipped && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-sm border border-amber-500/30 bg-amber-50/50 dark:bg-amber-900/10">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                <p className="text-xs text-amber-700 dark:text-amber-400 font-light leading-relaxed">
                  {t("onboarding.placement_skip_warning")}
                </p>
              </div>
            )}

            <div className="space-y-3">
              {tierOrder.map((tier) => {
                const meta       = PAID_TIER_META[tier];
                const Icon       = meta.icon;
                const plan       = plans.find((p) => p.tier === tier);
                const amount     = plan?.monthlyAmount ?? null;
                const currency   = plan?.currency ?? "eur";
                const trialDays  = plan?.trialDays || 60;
                const isRecommended = tier === recommended;
                const isLoading  = checkingOut === tier;

                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => handleSelectTier(tier)}
                    disabled={!!checkingOut}
                    aria-busy={isLoading}
                    data-testid={`onboarding-plan-${tier}`}
                    className={`relative w-full text-left p-5 rounded-sm border transition-all duration-200 disabled:opacity-60 disabled:cursor-wait ${
                      isRecommended
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30 hover:bg-primary/10"
                        : "border-border/60 hover:border-primary/40 hover:bg-muted/20"
                    }`}
                  >
                    {isRecommended && (
                      <span className="absolute -top-2 left-5 text-[10px] font-mono uppercase tracking-widest bg-primary text-primary-foreground px-2 py-0.5 rounded-[2px]" data-testid={`onboarding-recommended-${tier}`}>
                        {t("onboarding.plan_recommended", "Recommended for you")}
                      </span>
                    )}
                    <div className="flex items-start gap-4">
                      <Icon className="w-6 h-6 mt-1 shrink-0" style={{ color: meta.accent }} aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-3 flex-wrap">
                          <div className="font-serif text-lg text-foreground">{plan?.displayName ?? meta.defaultName}</div>
                          <div className="text-right">
                            {amount !== null ? (
                              <div className="font-serif text-base text-foreground">
                                {formatPrice(amount, currency)}
                                <span className="text-xs text-muted-foreground font-light ml-1">/{t("membership.billing_per_month", "mo")}</span>
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground font-light italic">{t("membership.price_not_configured", "Pricing not yet configured")}</div>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground font-light mt-1">{t(meta.labelKey, meta.defaultTagline)}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-[10px] font-mono uppercase tracking-widest bg-primary/10 text-primary px-1.5 py-0.5 rounded-[2px] border border-primary/20">
                            {t("membership.trial_badge", { days: trialDays }) || `${trialDays}-day free trial`}
                          </span>
                          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-border/40">
              <button
                type="button"
                onClick={handleSkipPlan}
                disabled={!!checkingOut}
                data-testid="onboarding-plan-skip"
                className="w-full text-left p-4 rounded-sm border border-dashed border-border/60 hover:border-border transition-all duration-200 disabled:opacity-60 group"
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 mt-0.5 text-muted-foreground shrink-0" aria-hidden="true" />
                  <div className="flex-1">
                    <div className="font-serif text-base text-foreground">{t("onboarding.plan_skip_title", "Decide later")}</div>
                    <p className="text-xs text-muted-foreground font-light mt-1 leading-relaxed">{t("onboarding.plan_skip_subtitle", "Continue as a Guest. You can choose your path from your profile at any time.")}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground mt-1 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                </div>
              </button>
            </div>

            <div className="flex justify-start">
              <Button
                variant="ghost"
                size="sm"
                className="font-serif gap-2 text-muted-foreground"
                onClick={() => setStep(10)}
                disabled={!!checkingOut}
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                {t("onboarding.back")}
              </Button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
