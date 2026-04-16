import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen, Compass, Shield, ArrowRight, CheckCircle2, XCircle, ChevronRight, MapPin, ScanFace, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useActiveRegion, COMPASS_REGIONS, type RegionCode } from "@/lib/active-region";
import { LandingLayout } from "@/components/layout/LandingLayout";

type Phase = "hero" | "quiz" | "result";

interface Question {
  id: number;
  scenario: string;
  options: { label: string; text: string }[];
  correctIndex: number;
  explanation: string;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    scenario:
      "You have been invited to dinner at a private residence. The invitation states seven o'clock. At what time should you arrive?",
    options: [
      { label: "A", text: "Six forty-five — to assist with final preparations." },
      { label: "B", text: "Seven o'clock precisely — punctuality is a virtue." },
      { label: "C", text: "Between seven ten and seven fifteen — the customary quarter." },
    ],
    correctIndex: 2,
    explanation:
      "Arriving slightly after the stated hour — the so-called 'gentleman's quarter' — allows the host to conclude their preparations with composure. Arriving early is considered an imposition.",
  },
  {
    id: 2,
    scenario:
      "You are seated at a formally laid table. Bread rolls are placed on either side of your setting. Which is yours?",
    options: [
      { label: "A", text: "The one to my left." },
      { label: "B", text: "The one to my right." },
      { label: "C", text: "Whichever appears freshest." },
    ],
    correctIndex: 0,
    explanation:
      "The mnemonic BMW guides the formal table: Bread to the left, Meal in the centre, Water and Wine to the right. The bread roll to your left is always yours.",
  },
  {
    id: 3,
    scenario:
      "During a business dinner in Tokyo, your host presents their meishi — business card — with both hands and a respectful bow. How do you respond?",
    options: [
      { label: "A", text: "Accept with one hand and a warm smile, then set it aside." },
      { label: "B", text: "Accept with both hands, study it attentively, and place it respectfully on the table." },
      { label: "C", text: "Accept graciously and immediately reciprocate with your own card." },
    ],
    correctIndex: 1,
    explanation:
      "In Japanese business culture, the meishi is an extension of the person. It must be received with both hands, examined with genuine attention, and placed carefully on the table — never written upon or pocketed immediately.",
  },
];

function FlagEmoji({ countryCode }: { countryCode: string }) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((c) => 0x1f1e0 + c.charCodeAt(0) - 65);
  return <span aria-hidden="true">{String.fromCodePoint(...codePoints)}</span>;
}

const FEATURED_REGIONS: RegionCode[] = ["GB", "US", "FR", "DE", "JP", "AE", "CN", "AU", "NL", "SG"];

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
              <FlagEmoji countryCode={code} />
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

  const question = QUESTIONS[currentQ];
  const score = answers.filter((a, i) => a === QUESTIONS[i].correctIndex).length;

  const baseLang = locale.split("-")[0];

  function selectAnswer(idx: number) {
    if (revealed) return;
    const next = [...answers];
    next[currentQ] = idx;
    setAnswers(next);
    setRevealed(true);
  }

  function advance() {
    if (currentQ < QUESTIONS.length - 1) {
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full border-t border-border/20 pt-8 animate-in fade-in duration-700" style={{ animationDelay: "500ms" }}>
            {[
              { icon: BookOpen,  labelKey: "nav.atelier", descKey: "welcome.module_atelier_desc" },
              { icon: Shield,    labelKey: "nav.counsel", descKey: "welcome.module_counsel_desc" },
              { icon: Compass,   labelKey: "nav.compass", descKey: "welcome.module_compass_desc" },
              { icon: ScanFace,  labelKey: "nav.mirror",  descKey: "welcome.module_mirror_desc"  },
            ].map(({ icon: Icon, labelKey, descKey }) => (
              <div key={labelKey} className="text-center space-y-2">
                <Icon className="w-6 h-6 mx-auto text-primary/60" aria-hidden="true" />
                <div className="font-serif text-sm text-foreground">{t(labelKey as Parameters<typeof t>[0])}</div>
                <div className="text-xs text-muted-foreground font-light">{t(descKey as Parameters<typeof t>[0])}</div>
              </div>
            ))}
          </div>
        </div>
      </LandingLayout>
    );
  }

  if (phase === "quiz") {
    const selected = answers[currentQ];
    const isCorrect = selected === question.correctIndex;

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
                {QUESTIONS.map((_, i) => (
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
                {t("welcome.quiz_scenario")} {question.id} {t("welcome.quiz_of")} {QUESTIONS.length}
              </p>
              <p className="text-xl md:text-2xl font-serif text-foreground leading-relaxed">
                {question.scenario}
              </p>
            </div>

            <div className="space-y-3">
              {question.options.map((opt, idx) => {
                let variant: "correct" | "incorrect" | "neutral" | "dimmed" = "neutral";
                if (revealed) {
                  if (idx === question.correctIndex) variant = "correct";
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
                      {opt.label}
                    </span>
                    <span className="font-light leading-relaxed">{opt.text}</span>
                    {revealed && idx === question.correctIndex && (
                      <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto shrink-0 mt-0.5" aria-hidden="true" />
                    )}
                    {revealed && idx === selected && idx !== question.correctIndex && (
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
                  {question.explanation}
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={advance}
                    className="font-serif bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-sm"
                  >
                    {currentQ < QUESTIONS.length - 1 ? t("welcome.quiz_next") : t("welcome.quiz_result")}
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
