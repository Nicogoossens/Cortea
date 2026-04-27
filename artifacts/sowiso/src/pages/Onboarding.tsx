import { useState } from "react";
import { useLocation } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { SPHERE_OPTIONS } from "@/lib/profile-options";
import { WORLD_COUNTRIES } from "@/lib/world-countries";
import {
  ArrowRight, ArrowLeft, CheckCircle2, Loader2,
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

type Step = 1 | 2 | 3 | 4;

export default function Onboarding() {
  usePageTitle("Welcome");
  const { t } = useLanguage();
  const [, navigate] = useLocation();

  const [step, setStep] = useState<Step>(1);
  const [country, setCountry] = useState("");
  const [objectives, setObjectives] = useState<string[]>([]);
  const [sports, setSports] = useState<string[]>([]);
  const [cuisine, setCuisine] = useState<string[]>([]);
  const [dressCode, setDressCode] = useState<string[]>([]);
  const [spheres, setSpheres] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function toggleArr(arr: string[], val: string, set: (v: string[]) => void) {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  async function handleFinish() {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/api/users/profile`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
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
    } finally {
      navigate("/");
    }
  }

  const stepLabels: Record<Step, string> = {
    1: t("onboarding.step1_label"),
    2: t("onboarding.step2_label"),
    3: t("onboarding.step3_label"),
    4: t("onboarding.step4_label"),
  };

  return (
    <div className="max-w-xl mx-auto space-y-10 animate-in fade-in duration-500 py-10">

      {/* Progress dots */}
      <div className="flex justify-center gap-3">
        {([1, 2, 3, 4] as Step[]).map((s) => (
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
          {t("onboarding.step_of", { current: step, total: 4 })} — {stepLabels[step]}
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
              onClick={handleFinish}
              disabled={saving}
              aria-busy={saving}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <>
                  {t("onboarding.finish")}
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
