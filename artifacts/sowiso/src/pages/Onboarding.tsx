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
} from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const OBJECTIVES = [
  { id: "business", icon: "◈", label_key: "onboarding.obj_business", desc_key: "onboarding.obj_business_desc" },
  { id: "elite", icon: "◇", label_key: "onboarding.obj_elite", desc_key: "onboarding.obj_elite_desc" },
  { id: "romantic", icon: "◉", label_key: "onboarding.obj_romantic", desc_key: "onboarding.obj_romantic_desc" },
  { id: "world_traveller", icon: "◎", label_key: "onboarding.obj_travel", desc_key: "onboarding.obj_travel_desc" },
] as const;

const SPORTS_OPTIONS = [
  { id: "polo",         label_key: "onboarding.sport_polo" },
  { id: "golf",         label_key: "onboarding.sport_golf" },
  { id: "sailing",      label_key: "onboarding.sport_sailing" },
  { id: "rowing",       label_key: "onboarding.sport_rowing" },
  { id: "horse riding", label_key: "onboarding.sport_horse_riding" },
  { id: "squash",       label_key: "onboarding.sport_squash" },
  { id: "tennis",       label_key: "onboarding.sport_tennis" },
  { id: "fencing",      label_key: "onboarding.sport_fencing" },
  { id: "hunting",      label_key: "onboarding.sport_hunting" },
];

const CUISINE_OPTIONS = [
  { id: "French",        label_key: "onboarding.cuisine_french" },
  { id: "Japanese",      label_key: "onboarding.cuisine_japanese" },
  { id: "Italian",       label_key: "onboarding.cuisine_italian" },
  { id: "Indian",        label_key: "onboarding.cuisine_indian" },
  { id: "Scandinavian",  label_key: "onboarding.cuisine_scandinavian" },
  { id: "Spanish",       label_key: "onboarding.cuisine_spanish" },
  { id: "British",       label_key: "onboarding.cuisine_british" },
  { id: "Chinese",       label_key: "onboarding.cuisine_chinese" },
  { id: "Lebanese",      label_key: "onboarding.cuisine_lebanese" },
  { id: "Peruvian",      label_key: "onboarding.cuisine_peruvian" },
];

const DRESS_OPTIONS = [
  { id: "business",     label_key: "onboarding.dress_business" },
  { id: "black tie",    label_key: "onboarding.dress_black_tie" },
  { id: "cocktail",     label_key: "onboarding.dress_cocktail" },
  { id: "casual chic",  label_key: "onboarding.dress_casual_chic" },
  { id: "country",      label_key: "onboarding.dress_country" },
];

type Step = 1 | 2 | 3 | 4 | 5;
type PaidTier = "student" | "traveller" | "ambassador";

interface Plan {
  productId: string;
  tier: PaidTier | "guest" | "concierge";
  displayName: string;
  monthlyPriceId: string | null;
  monthlyAmount: number | null;
  yearlyPriceId: string | null;
  yearlyAmount: number | null;
  currency: string;
  trialDays?: number;
}

const PAID_TIER_META: Record<PaidTier, {
  icon: typeof Globe;
  accent: string;
  labelKey: string;
  taglineKey: string;
  ctaKey: string;
  defaultName: string;
  defaultTagline: string;
  defaultCta: string;
}> = {
  student: {
    icon: Star,
    accent: "#4a7c9b",
    labelKey: "membership.student.tagline",
    taglineKey: "onboarding.plan_student_tagline",
    ctaKey: "membership.cta_student",
    defaultName: "The Student",
    defaultTagline: "An apprentice's path",
    defaultCta: "Begin your formation",
  },
  traveller: {
    icon: Globe,
    accent: "var(--primary)",
    labelKey: "membership.traveller.tagline",
    taglineKey: "onboarding.plan_traveller_tagline",
    ctaKey: "membership.cta_traveller",
    defaultName: "The Traveller",
    defaultTagline: "Expand your world",
    defaultCta: "Expand your world",
  },
  ambassador: {
    icon: Crown,
    accent: "#9b7c4a",
    labelKey: "membership.ambassador.tagline",
    taglineKey: "onboarding.plan_ambassador_tagline",
    ctaKey: "membership.cta_ambassador",
    defaultName: "The Ambassador",
    defaultTagline: "Refine your presence",
    defaultCta: "Elevate your standing",
  },
};

/**
 * Recommend a paid tier based on the objectives the user picked in step 2.
 * Priority order:
 *   - Elite Society or Professional Refinement → Ambassador
 *   - World Traveller or Romantic Pursuit → Traveller
 *   - No clear signal (skipped step 2) → Student (the gentle entry point)
 */
function recommendTier(objectives: string[]): PaidTier {
  if (objectives.includes("elite") || objectives.includes("business")) return "ambassador";
  if (objectives.includes("world_traveller") || objectives.includes("romantic")) return "traveller";
  return "student";
}

function formatPrice(amount: number | null, currency: string): string {
  if (amount === null) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amount / 100);
}

export default function Onboarding() {
  usePageTitle("Welcome");
  const { t } = useLanguage();
  const { getAuthHeaders } = useAuth();
  const [, navigate] = useLocation();

  const [step, setStep] = useState<Step>(1);
  const [country, setCountry] = useState("");
  const [objectives, setObjectives] = useState<string[]>([]);
  const [sports, setSports] = useState<string[]>([]);
  const [cuisine, setCuisine] = useState<string[]>([]);
  const [dressCode, setDressCode] = useState<string[]>([]);
  const [spheres, setSpheres] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [checkingOut, setCheckingOut] = useState<PaidTier | null>(null);

  const TOTAL_STEPS = 5;

  // Pre-fetch the plan list so step 5 renders instantly with live prices.
  useEffect(() => {
    fetch(`${API_BASE}/api/subscription/plans`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => setPlans(Array.isArray(data) ? (data as Plan[]) : []))
      .catch(() => setPlans([]));
  }, []);

  function toggleArr(arr: string[], val: string, set: (v: string[]) => void) {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  // Records what the user did on the plan-choice step so we can analyse
  // drop-off in deployment logs. Best-effort only — never blocks the user.
  function trackPlanChoice(action: "selected_tier" | "skipped" | "skipped_unauth", tier?: PaidTier | null) {
    try {
      void fetch(`${API_BASE}/api/onboarding/plan-choice`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          action,
          tier: tier ?? null,
          recommendedTier: recommendTier(objectives),
          objectives,
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* ignore */
    }
  }

  /**
   * Persists the profile (with onboarding_completed=true) and advances to
   * step 5. We mark onboarding as complete here — not on step 4 finish — so
   * users who close the tab on the plan-choice step don't get re-prompted.
   */
  async function handleAdvanceToPlanStep() {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/api/users/profile`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          country_of_origin: country || null,
          objectives,
          interests_sports: sports,
          interests_cuisine: cuisine,
          interests_dress_code: dressCode,
          situational_interests: spheres,
          onboarding_completed: true,
        }),
      });
    } catch {
      /* ignore — advancing the user is more important than a save failure */
    } finally {
      setSaving(false);
      setStep(5);
    }
  }

  async function handleSelectTier(tier: PaidTier) {
    const plan = plans.find((p) => p.tier === tier);
    const priceId = plan?.monthlyPriceId ?? null;
    trackPlanChoice("selected_tier", tier);

    if (!priceId) {
      // Stripe not yet configured — send to signin so they can register/login
      // and will be shown membership options once authenticated.
      navigate("/signin?return=/membership");
      return;
    }

    setCheckingOut(tier);
    try {
      const res = await fetch(`${API_BASE}/api/subscription/checkout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ priceId }),
      });
      if (res.status === 401) {
        // Not signed in — redirect to sign-in, then back to membership after auth.
        trackPlanChoice("skipped_unauth", tier);
        navigate("/signin?return=/membership");
        return;
      }
      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        // Checkout URL missing — go to membership page to retry.
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

  const stepLabels: Record<Step, string> = {
    1: t("onboarding.step1_label"),
    2: t("onboarding.step2_label"),
    3: t("onboarding.step3_label"),
    4: t("onboarding.step4_label"),
    5: t("onboarding.step5_label", "Your Path"),
  };

  return (
    <div className="max-w-xl mx-auto space-y-10 animate-in fade-in duration-500 py-10">

      {/* Progress dots */}
      <div className="flex justify-center gap-3">
        {([1, 2, 3, 4, 5] as Step[]).map((s) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              s === step ? "w-10 bg-primary" : s < step ? "w-4 bg-primary/50" : "w-4 bg-border"
            }`}
          />
        ))}
      </div>

      <div className="text-center space-y-1">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          {t("onboarding.step_of", { current: step, total: TOTAL_STEPS })} — {stepLabels[step]}
        </p>
      </div>

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
            <Button
              className="font-serif gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => setStep(2)}
            >
              {t("onboarding.next")}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
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
                  {selected && (
                    <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-primary" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex justify-between gap-3">
            <Button variant="outline" className="font-serif gap-2" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              {t("onboarding.back")}
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" className="font-serif text-muted-foreground" onClick={() => setStep(3)}>
                {t("onboarding.skip")}
              </Button>
              <Button
                className="font-serif gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => setStep(3)}
              >
                {t("onboarding.next")}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Interests */}
      {step === 3 && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-serif text-foreground">{t("onboarding.step3_title")}</h1>
            <p className="text-muted-foreground font-light leading-relaxed">{t("onboarding.step3_subtitle")}</p>
          </div>

          <div className="space-y-6">
            {/* Sports */}
            <div className="space-y-3">
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                {t("onboarding.interests_sports")}
              </p>
              <div className="flex flex-wrap gap-2">
                {SPORTS_OPTIONS.map((opt) => {
                  const sel = sports.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleArr(sports, opt.id, setSports)}
                      className={`px-3 py-1.5 rounded-sm text-xs border transition-all ${
                        sel ? "bg-primary text-primary-foreground border-primary" : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {t(opt.label_key)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cuisine */}
            <div className="space-y-3">
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                {t("onboarding.interests_cuisine")}
              </p>
              <div className="flex flex-wrap gap-2">
                {CUISINE_OPTIONS.map((opt) => {
                  const sel = cuisine.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleArr(cuisine, opt.id, setCuisine)}
                      className={`px-3 py-1.5 rounded-sm text-xs border transition-all ${
                        sel ? "bg-primary text-primary-foreground border-primary" : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {t(opt.label_key)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dress code */}
            <div className="space-y-3">
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                {t("onboarding.interests_dress")}
              </p>
              <div className="flex flex-wrap gap-2">
                {DRESS_OPTIONS.map((opt) => {
                  const sel = dressCode.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleArr(dressCode, opt.id, setDressCode)}
                      className={`px-3 py-1.5 rounded-sm text-xs border transition-all ${
                        sel ? "bg-primary text-primary-foreground border-primary" : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {t(opt.label_key)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-3">
            <Button variant="outline" className="font-serif gap-2" onClick={() => setStep(2)}>
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              {t("onboarding.back")}
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" className="font-serif text-muted-foreground" onClick={() => setStep(4)}>
                {t("onboarding.skip")}
              </Button>
              <Button
                className="font-serif gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => setStep(4)}
              >
                {t("onboarding.next")}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Social Spheres */}
      {step === 4 && (
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
            <Button variant="outline" className="font-serif gap-2" onClick={() => setStep(3)}>
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              {t("onboarding.back")}
            </Button>
            <Button
              className="font-serif gap-2 bg-primary hover:bg-primary/90 text-primary-foreground min-w-[140px]"
              onClick={handleAdvanceToPlanStep}
              disabled={saving}
              aria-busy={saving}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <>
                  {t("onboarding.next")}
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 5: Plan choice */}
      {step === 5 && (() => {
        const recommended = recommendTier(objectives);
        const tierOrder: PaidTier[] = ["student", "traveller", "ambassador"];
        return (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center space-y-3">
              <h1 className="text-3xl md:text-4xl font-serif text-foreground">
                {t("onboarding.step5_title", "Choose your path")}
              </h1>
              <p className="text-muted-foreground font-light leading-relaxed">
                {t("onboarding.step5_subtitle", "Begin with a 14-day free trial. Cancel any time before then and you'll never be charged.")}
              </p>
            </div>

            <div className="space-y-3">
              {tierOrder.map((tier) => {
                const meta = PAID_TIER_META[tier];
                const Icon = meta.icon;
                const plan = plans.find((p) => p.tier === tier);
                const amount = plan?.monthlyAmount ?? null;
                const currency = plan?.currency ?? "eur";
                const trialDays = plan?.trialDays ?? 60;
                const isRecommended = tier === recommended;
                const isLoading = checkingOut === tier;

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
                      <span
                        className="absolute -top-2 left-5 text-[10px] font-mono uppercase tracking-widest bg-primary text-primary-foreground px-2 py-0.5 rounded-[2px]"
                        data-testid={`onboarding-recommended-${tier}`}
                      >
                        {t("onboarding.plan_recommended", "Recommended for you")}
                      </span>
                    )}
                    <div className="flex items-start gap-4">
                      <Icon
                        className="w-6 h-6 mt-1 shrink-0"
                        style={{ color: meta.accent }}
                        aria-hidden="true"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-3 flex-wrap">
                          <div className="font-serif text-lg text-foreground">
                            {plan?.displayName ?? meta.defaultName}
                          </div>
                          <div className="text-right">
                            {amount !== null ? (
                              <div className="font-serif text-base text-foreground">
                                {formatPrice(amount, currency)}
                                <span className="text-xs text-muted-foreground font-light ml-1">
                                  /{t("membership.billing_per_month", "mo")}
                                </span>
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground font-light italic">
                                {t("membership.price_not_configured", "Pricing not yet configured")}
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground font-light mt-1">
                          {t(meta.labelKey, meta.defaultTagline)}
                        </p>
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
                    <div className="font-serif text-base text-foreground">
                      {t("onboarding.plan_skip_title", "Decide later")}
                    </div>
                    <p className="text-xs text-muted-foreground font-light mt-1 leading-relaxed">
                      {t("onboarding.plan_skip_subtitle", "Continue as a Guest. You can choose your path from your profile at any time.")}
                    </p>
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
                onClick={() => setStep(4)}
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
