import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen, Compass, Shield, ArrowRight, CheckCircle2, XCircle, ChevronRight, MapPin, ScanFace, ArrowLeft, Briefcase, Globe, Star, User } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useActiveRegion, COMPASS_REGIONS, FlagEmoji, type RegionCode } from "@/lib/active-region";
import { LandingLayout } from "@/components/layout/LandingLayout";

type Phase = "hero" | "quiz" | "result";

const QUESTION_KEYS = [
  {
    id: 1,
    scenarioKey: "welcome.quiz_q1_scenario" as const,
    optionKeys: ["welcome.quiz_q1_opt_a", "welcome.quiz_q1_opt_b", "welcome.quiz_q1_opt_c"] as const,
    correctIndex: 2,
    explanationKey: "welcome.quiz_q1_explanation" as const,
  },
  {
    id: 2,
    scenarioKey: "welcome.quiz_q2_scenario" as const,
    optionKeys: ["welcome.quiz_q2_opt_a", "welcome.quiz_q2_opt_b", "welcome.quiz_q2_opt_c"] as const,
    correctIndex: 0,
    explanationKey: "welcome.quiz_q2_explanation" as const,
  },
  {
    id: 3,
    scenarioKey: "welcome.quiz_q3_scenario" as const,
    optionKeys: ["welcome.quiz_q3_opt_a", "welcome.quiz_q3_opt_b", "welcome.quiz_q3_opt_c"] as const,
    correctIndex: 1,
    explanationKey: "welcome.quiz_q3_explanation" as const,
  },
];

const FEATURED_REGIONS: RegionCode[] = ["GB", "US", "AU", "CN", "JP", "FR", "DE", "IT", "BE", "CH", "SG", "IN", "MX", "BR", "ES", "CO", "AE"];

function RegionPicker() {
  const { activeRegion, setActiveRegion, getRegionName } = useActiveRegion();
  const { t } = useLanguage();

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-500" style={{ animationDelay: "200ms" }}>
      <div className="flex items-center gap-2">
        <MapPin className="w-3.5 h-3.5 text-muted-foreground/60" aria-hidden="true" />
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground/60">
          {t("landing.your_region")}
        </span>
      </div>
      <p className="text-xs text-muted-foreground/50 font-light">
        {t("landing.region_intro")}
      </p>
      <div
        className="flex flex-wrap gap-2"
        role="listbox"
        aria-label={t("landing.your_region")}
      >
        {FEATURED_REGIONS.map((code) => {
          const region = COMPASS_REGIONS.find((r) => r.code === code);
          if (!region) return null;
          const isSelected = activeRegion === code;
          return (
            <button
              key={code}
              role="option"
              aria-selected={isSelected}
              onClick={() => setActiveRegion(code)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-xs font-mono transition-all duration-200 ${
                isSelected
                  ? "border-primary bg-primary/10 text-primary font-semibold scale-105"
                  : "border-border/50 bg-card text-foreground/60 hover:border-primary/40 hover:text-foreground hover:bg-primary/5"
              }`}
            >
              <FlagEmoji code={code} />
              <span className="hidden sm:inline">{getRegionName(code)}</span>
              <span className="sm:hidden">{code}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}


export default function Welcome() {
  const [, navigate] = useLocation();
  const { t, locale } = useLanguage();
  const { activeRegion } = useActiveRegion();
  const [phase, setPhase] = useState<Phase>("hero");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null]);
  const [revealed, setRevealed] = useState(false);

  const qKey = QUESTION_KEYS[currentQ];
  const score = answers.filter((a, i) => a === QUESTION_KEYS[i].correctIndex).length;

  const baseLang = locale.split("-")[0];

  function selectAnswer(idx: number) {
    if (revealed) return;
    const next = [...answers];
    next[currentQ] = idx;
    setAnswers(next);
    setRevealed(true);
  }

  function advance() {
    if (currentQ < QUESTION_KEYS.length - 1) {
      setCurrentQ(currentQ + 1);
      setRevealed(false);
    } else {
      setPhase("result");
    }
  }

  function getScoreLabel() {
    if (score === 3) return t("welcome.result_flawless");
    if (score === 2) return t("welcome.result_accomplished");
    if (score === 1) return t("welcome.result_promising");
    return t("welcome.result_nascent");
  }

  function getScoreMessage() {
    if (score === 3) return t("welcome.result_msg_flawless");
    if (score === 2) return t("welcome.result_msg_accomplished");
    if (score === 1) return t("welcome.result_msg_promising");
    return t("welcome.result_msg_nascent");
  }

  function goToRegister() {
    const params = new URLSearchParams({ lang: baseLang, region: activeRegion });
    navigate(`/register?${params.toString()}`);
  }

  if (phase === "hero") {
    return (
      <LandingLayout>
        <div className="flex-1 flex flex-col items-center justify-center px-6 md:px-12 lg:px-24 py-12 max-w-4xl mx-auto w-full space-y-14">

          <div className="space-y-6 text-center animate-in fade-in duration-700">
            <p className="text-xs font-mono uppercase tracking-[0.4em] text-muted-foreground">
              {t("app.tagline")}
            </p>
            <h1 className="text-5xl md:text-7xl font-serif text-foreground leading-tight">
              {t("welcome.hero_title_1")}<br />
              <span className="text-primary">{t("welcome.hero_title_2")}</span>
            </h1>
            <p className="text-lg text-muted-foreground font-light leading-relaxed max-w-xl mx-auto">
              {t("welcome.hero_subtitle")}
            </p>
          </div>

          <div className="w-full border-t border-border/30 pt-10">
            <RegionPicker />
          </div>

          <div className="flex flex-col items-center gap-6 animate-in fade-in duration-700" style={{ animationDelay: "400ms" }}>
            <Button
              size="lg"
              className="font-serif text-lg px-10 py-6 bg-primary hover:bg-primary/90 text-primary-foreground gap-3 rounded-sm"
              onClick={() => setPhase("quiz")}
            >
              {t("welcome.begin")}
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </Button>
            <p className="text-xs text-muted-foreground/50 font-light">
              {t("landing.signin_prompt")}{" "}
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); navigate("/signin"); }}
                className="underline underline-offset-2 hover:text-muted-foreground transition-colors"
              >
                {t("landing.signin_link")}
              </a>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full border-t border-border/20 pt-8 animate-in fade-in duration-700" style={{ animationDelay: "500ms" }}>
            {[
              { icon: BookOpen,  labelKey: "nav.atelier", descKey: "welcome.module_atelier_desc", href: "/atelier" },
              { icon: Shield,    labelKey: "nav.counsel", descKey: "welcome.module_counsel_desc", href: "/counsel" },
              { icon: Compass,   labelKey: "nav.compass", descKey: "welcome.module_compass_desc", href: "/compass" },
              { icon: ScanFace,  labelKey: "nav.mirror",  descKey: "welcome.module_mirror_desc",  href: "/mirror"  },
            ].map(({ icon: Icon, labelKey, descKey, href }) => (
              <Link key={labelKey} href={href}>
                <div className="flex items-start gap-4 p-5 rounded-sm border border-transparent hover:border-border/40 hover:bg-card/60 transition-all duration-200 group cursor-pointer">
                  <Icon className="w-5 h-5 mt-0.5 text-primary/60 group-hover:text-primary/80 transition-colors shrink-0" aria-hidden="true" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="font-serif text-sm text-foreground">{t(labelKey as Parameters<typeof t>[0])}</div>
                    <div className="text-xs text-muted-foreground font-light leading-relaxed">{t(descKey as Parameters<typeof t>[0])}</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-primary/30 group-hover:text-primary/60 transition-colors shrink-0 mt-0.5" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>

          <div className="w-full border-t border-border/10 pt-8 space-y-6 animate-in fade-in duration-700" style={{ animationDelay: "600ms" }}>
            <h2 className="text-center font-serif text-lg text-foreground/80">
              {t("welcome.audience_section_title")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { headingKey: "welcome.audience_professional_heading", bodyKey: "welcome.audience_professional_body", Icon: Briefcase, accent: "text-amber-600/70 bg-amber-500/10" },
                { headingKey: "welcome.audience_curious_heading",      bodyKey: "welcome.audience_curious_body",      Icon: Globe,      accent: "text-sky-600/70   bg-sky-500/10"   },
                { headingKey: "welcome.audience_refined_heading",      bodyKey: "welcome.audience_refined_body",      Icon: Star,       accent: "text-violet-600/70 bg-violet-500/10" },
                { headingKey: "welcome.audience_everyday_heading",     bodyKey: "welcome.audience_everyday_body",     Icon: User,       accent: "text-emerald-600/70 bg-emerald-500/10" },
              ].map(({ headingKey, bodyKey, Icon, accent }) => (
                <div key={headingKey} className="flex gap-3.5 items-start px-5 py-4 rounded-sm border border-border/20 bg-card/40">
                  <span className={`mt-0.5 shrink-0 flex items-center justify-center w-7 h-7 rounded-full ${accent}`} aria-hidden="true">
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <div className="space-y-1">
                    <h3 className="font-serif text-sm text-foreground">{t(headingKey as Parameters<typeof t>[0])}</h3>
                    <p className="text-xs text-muted-foreground font-light leading-relaxed">{t(bodyKey as Parameters<typeof t>[0])}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground/50 font-light leading-relaxed max-w-2xl text-center mx-auto pt-2">
              {t("welcome.foundation_sentence")}
            </p>
          </div>
        </div>
      </LandingLayout>
    );
  }

  if (phase === "quiz") {
    const selected = answers[currentQ];
    const isCorrect = selected === qKey.correctIndex;
    const optionLabels = ["A", "B", "C"];

    return (
      <LandingLayout>
        <div className="flex-1 flex flex-col px-6 md:px-12 py-10 max-w-2xl mx-auto w-full">
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
              <button
                onClick={() => { setPhase("hero"); setCurrentQ(0); setAnswers([null, null, null]); setRevealed(false); }}
                className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground/60 hover:text-muted-foreground transition-colors shrink-0"
                aria-label={t("welcome.quiz_back")}
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                {t("welcome.quiz_back")}
              </button>
              <div className="flex items-center gap-3 flex-1">
                {QUESTION_KEYS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                      i < currentQ
                        ? "bg-primary"
                        : i === currentQ
                        ? "bg-primary/50"
                        : "bg-border"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                {t("welcome.quiz_scenario")} {qKey.id} {t("welcome.quiz_of")} {QUESTION_KEYS.length}
              </p>
              <p className="text-xl md:text-2xl font-serif text-foreground leading-relaxed">
                {t(qKey.scenarioKey)}
              </p>
            </div>

            <div className="space-y-3">
              {qKey.optionKeys.map((optKey, idx) => {
                let variant: "correct" | "incorrect" | "neutral" | "dimmed" = "neutral";
                if (revealed) {
                  if (idx === qKey.correctIndex) variant = "correct";
                  else if (idx === selected) variant = "incorrect";
                  else variant = "dimmed";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => selectAnswer(idx)}
                    disabled={revealed}
                    className={`w-full text-left px-6 py-4 rounded-sm border transition-all duration-300 flex items-start gap-4 ${
                      variant === "correct"
                        ? "border-green-400 bg-green-50/60 text-green-900"
                        : variant === "incorrect"
                        ? "border-red-400 bg-red-50/60 text-red-900"
                        : variant === "dimmed"
                        ? "border-border/40 bg-muted/20 text-muted-foreground opacity-50"
                        : "border-border bg-card hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
                    }`}
                  >
                    <span className={`font-mono text-xs mt-0.5 font-bold ${
                      variant === "correct" ? "text-green-600" :
                      variant === "incorrect" ? "text-red-500" : "text-muted-foreground"
                    }`}>
                      {optionLabels[idx]}
                    </span>
                    <span className="font-light leading-relaxed">{t(optKey)}</span>
                    {revealed && idx === qKey.correctIndex && (
                      <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto shrink-0 mt-0.5" aria-hidden="true" />
                    )}
                    {revealed && idx === selected && idx !== qKey.correctIndex && (
                      <XCircle className="w-4 h-4 text-red-500 ml-auto shrink-0 mt-0.5" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>

            {revealed && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-400 space-y-4">
                <div className={`px-5 py-4 rounded-sm border text-sm font-light leading-relaxed ${
                  isCorrect
                    ? "border-green-300/60 bg-green-50/40 text-green-800"
                    : "border-amber-300/60 bg-amber-50/40 text-amber-800"
                }`}>
                  <span className="font-semibold font-mono text-xs uppercase tracking-wider mr-2">
                    {isCorrect ? t("welcome.quiz_correct") : t("welcome.quiz_not_quite")}
                  </span>
                  {t(qKey.explanationKey)}
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={advance}
                    className="font-serif bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-sm"
                  >
                    {currentQ < QUESTION_KEYS.length - 1 ? t("welcome.quiz_next") : t("welcome.quiz_result")}
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </LandingLayout>
    );
  }

  return (
    <LandingLayout>
      <div className="flex-1 flex flex-col items-center justify-center px-6 md:px-12 py-10 max-w-2xl mx-auto w-full">
        <div className="space-y-12 animate-in fade-in duration-700 text-center w-full">
          <div className="space-y-6">
            <p className="text-xs font-mono uppercase tracking-[0.4em] text-muted-foreground">
              {t("welcome.result_title")}
            </p>
            <div className="text-8xl font-serif text-primary">{score}<span className="text-4xl text-muted-foreground">/3</span></div>
            <h2 className="text-3xl font-serif text-foreground">{getScoreLabel()}</h2>
            <p className="text-muted-foreground font-light leading-relaxed max-w-lg mx-auto">
              {getScoreMessage()}
            </p>
          </div>

          <div className="border border-border rounded-sm p-8 space-y-6 text-left bg-card">
            <div className="space-y-2">
              <h3 className="font-serif text-xl text-foreground">{t("welcome.join_heading")}</h3>
              <p className="text-sm text-muted-foreground font-light leading-relaxed">
                {t("welcome.join_body")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              {[
                { labelKey: "nav.atelier", descKey: "welcome.module_atelier_desc" },
                { labelKey: "nav.counsel", descKey: "welcome.module_counsel_desc" },
                { labelKey: "nav.compass", descKey: "welcome.module_compass_desc" },
              ].map(({ labelKey, descKey }) => (
                <div key={labelKey} className="space-y-1">
                  <div className="font-serif text-foreground">{t(labelKey as Parameters<typeof t>[0])}</div>
                  <div className="text-xs text-muted-foreground font-mono">{t(descKey as Parameters<typeof t>[0])}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                size="lg"
                className="flex-1 font-serif bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-sm"
                onClick={goToRegister}
              >
                {t("welcome.create_account")}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="font-serif rounded-sm"
                onClick={() => navigate("/signin")}
              >
                {t("signin.title")}
              </Button>
            </div>
          </div>

          <button
            onClick={() => { setPhase("quiz"); setCurrentQ(0); setAnswers([null, null, null]); setRevealed(false); }}
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground underline underline-offset-4 font-mono"
          >
            {t("welcome.repeat")}
          </button>
        </div>
      </div>
    </LandingLayout>
  );
}
