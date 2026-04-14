import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { ArrowRight, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const COUNTRY_LIST = [
  "Argentina", "Australia", "Austria", "Belgium", "Brazil", "Canada", "Chile",
  "China", "Colombia", "Denmark", "Egypt", "Finland", "France", "Germany",
  "Greece", "Hong Kong", "Hungary", "India", "Indonesia", "Ireland", "Israel",
  "Italy", "Japan", "Kenya", "Malaysia", "Mexico", "Morocco", "Netherlands",
  "New Zealand", "Nigeria", "Norway", "Pakistan", "Peru", "Philippines",
  "Poland", "Portugal", "Romania", "Russia", "Saudi Arabia", "Singapore",
  "South Africa", "South Korea", "Spain", "Sweden", "Switzerland", "Taiwan",
  "Thailand", "Turkey", "Ukraine", "United Arab Emirates", "United Kingdom",
  "United States", "Vietnam",
];

const OBJECTIVES = [
  { id: "business", icon: "◈", label_key: "onboarding.obj_business", desc_key: "onboarding.obj_business_desc" },
  { id: "elite", icon: "◇", label_key: "onboarding.obj_elite", desc_key: "onboarding.obj_elite_desc" },
  { id: "romantic", icon: "◉", label_key: "onboarding.obj_romantic", desc_key: "onboarding.obj_romantic_desc" },
  { id: "world_traveller", icon: "◎", label_key: "onboarding.obj_travel", desc_key: "onboarding.obj_travel_desc" },
] as const;

const SPORTS_OPTIONS = [
  "polo", "golf", "sailing", "rowing", "horse riding",
  "squash", "tennis", "fencing", "hunting",
];

const CUISINE_OPTIONS = [
  "French", "Japanese", "Italian", "Indian", "Scandinavian",
  "Spanish", "British", "Chinese", "Lebanese", "Peruvian",
];

const DRESS_OPTIONS = [
  "business", "black tie", "cocktail", "casual chic", "country",
];

type Step = 1 | 2 | 3;

export default function Onboarding() {
  const { t } = useLanguage();
  const { getAuthHeaders } = useAuth();
  const [, navigate] = useLocation();

  const [step, setStep] = useState<Step>(1);
  const [country, setCountry] = useState("");
  const [objectives, setObjectives] = useState<string[]>([]);
  const [sports, setSports] = useState<string[]>([]);
  const [cuisine, setCuisine] = useState<string[]>([]);
  const [dressCode, setDressCode] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function toggleArr(arr: string[], val: string, set: (v: string[]) => void) {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  async function handleFinish() {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/api/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          country_of_origin: country || null,
          objectives,
          interests_sports: sports,
          interests_cuisine: cuisine,
          interests_dress_code: dressCode,
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
  };

  return (
    <div className="max-w-xl mx-auto space-y-10 animate-in fade-in duration-500 py-10">

      {/* Progress dots */}
      <div className="flex justify-center gap-3">
        {([1, 2, 3] as Step[]).map((s) => (
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
          {t("onboarding.step_of").replace("{current}", String(step)).replace("{total}", "3")} — {stepLabels[step]}
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
              {COUNTRY_LIST.map((c) => (
                <option key={c} value={c}>{c}</option>
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
                {SPORTS_OPTIONS.map((s) => {
                  const sel = sports.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleArr(sports, s, setSports)}
                      className={`px-3 py-1.5 rounded-sm text-xs border transition-all capitalize ${
                        sel ? "bg-primary text-primary-foreground border-primary" : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {s}
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
                {CUISINE_OPTIONS.map((c) => {
                  const sel = cuisine.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleArr(cuisine, c, setCuisine)}
                      className={`px-3 py-1.5 rounded-sm text-xs border transition-all ${
                        sel ? "bg-primary text-primary-foreground border-primary" : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {c}
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
                {DRESS_OPTIONS.map((d) => {
                  const sel = dressCode.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleArr(dressCode, d, setDressCode)}
                      className={`px-3 py-1.5 rounded-sm text-xs border transition-all capitalize ${
                        sel ? "bg-primary text-primary-foreground border-primary" : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {d}
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
