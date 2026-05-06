import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen, Compass, Shield, ArrowRight, CheckCircle2, XCircle, ChevronRight, MapPin, ArrowLeft, Briefcase, Globe, Star, User, Crown, TrendingUp, Check, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useActiveRegion, COMPASS_REGIONS, FlagEmoji, isRegionActive, type RegionCode } from "@/lib/active-region";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LandingLayout } from "@/components/layout/LandingLayout";
import { SEOHead } from "@/components/SEOHead";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

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

type LandingSortMode = "popular" | "available_first" | "az" | "za";

function RegionPicker() {
  const { activeRegion, setActiveRegion, getRegionName, getCurrentRegion } = useActiveRegion();
  const { t } = useLanguage();
  const [sortMode, setSortMode] = useState<LandingSortMode>("popular");
  const [popularity, setPopularity] = useState<Record<string, number>>({});
  const [topPopular, setTopPopular] = useState<RegionCode[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/regions/popularity`)
      .then((r) => (r.ok ? r.json() : { regions: [] }))
      .then((data: { regions: { region_code: string; learners: number }[] }) => {
        if (cancelled) return;
        const map: Record<string, number> = {};
        for (const r of data.regions) map[r.region_code] = r.learners;
        setPopularity(map);
        const top = [...COMPASS_REGIONS]
          .filter((r) => isRegionActive(r.code))
          .sort((a, b) => (map[b.code] || 0) - (map[a.code] || 0))
          .slice(0, 3)
          .map((r) => r.code);
        setTopPopular(top);
      })
      .catch(() => { /* no-op: keep alphabetical fallback */ });
    return () => { cancelled = true; };
  }, []);

  const sorted = [...COMPASS_REGIONS].sort((a, b) => {
    const aAvail = isRegionActive(a.code) ? 1 : 0;
    const bAvail = isRegionActive(b.code) ? 1 : 0;
    if (sortMode === "available_first" && aAvail !== bAvail) return bAvail - aAvail;
    if (sortMode === "popular") {
      // Available always before unavailable in popular mode too.
      if (aAvail !== bAvail) return bAvail - aAvail;
      const diff = (popularity[b.code] || 0) - (popularity[a.code] || 0);
      if (diff !== 0) return diff;
    }
    const an = getRegionName(a.code);
    const bn = getRegionName(b.code);
    return sortMode === "za" ? bn.localeCompare(an) : an.localeCompare(bn);
  });

  const current = getCurrentRegion();
  const currentLearners = popularity[current.code];

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

      {topPopular.length > 0 && sortMode === "popular" && (
        <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-amber-700/70 bg-amber-500/5 border border-amber-500/20 rounded-sm px-3 py-2">
          <TrendingUp className="w-3 h-3 shrink-0" aria-hidden="true" />
          <span className="text-amber-800/80 font-medium">{t("landing.popularity_eyebrow", "Vandaag het meest gekozen")}:</span>
          <span className="flex items-center gap-2 flex-wrap">
            {topPopular.map((code, i) => (
              <span key={code} className="flex items-center gap-1 normal-case font-sans text-foreground/75">
                <FlagEmoji code={code} size="sm" />
                {getRegionName(code)}
                {i < topPopular.length - 1 ? <span className="text-muted-foreground/40">·</span> : null}
              </span>
            ))}
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <Select value={activeRegion} onValueChange={(v) => setActiveRegion(v as RegionCode)}>
          <SelectTrigger className="flex-1 h-11 text-sm">
            <SelectValue>
              <span className="flex items-center gap-2">
                <FlagEmoji code={current.code} size="sm" />
                <span className="font-medium">{getRegionName(current.code)}</span>
                {typeof currentLearners === "number" && currentLearners > 0 ? (
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground ml-1">
                    {currentLearners.toLocaleString()} {t("landing.learners_short", "leerlingen")}
                  </span>
                ) : null}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[360px]">
            {sorted.map((region) => {
              const available = isRegionActive(region.code);
              const learners = popularity[region.code] || 0;
              const isTop = topPopular.includes(region.code);
              return (
                <SelectItem
                  key={region.code}
                  value={region.code}
                  disabled={!available}
                  className={!available ? "opacity-50" : ""}
                >
                  <span className="flex items-center gap-2 w-full">
                    <FlagEmoji code={region.code} size="sm" />
                    <span className={available ? "" : "line-through decoration-muted-foreground/40"}>
                      {getRegionName(region.code)}
                    </span>
                    {isTop && available ? (
                      <TrendingUp className="w-3 h-3 text-amber-600/70 shrink-0" aria-hidden="true" />
                    ) : null}
                    {available && learners > 0 ? (
                      <span className="ml-auto text-[10px] font-mono text-muted-foreground/70 tabular-nums">
                        {learners.toLocaleString()}
                      </span>
                    ) : null}
                    {!available ? (
                      <span className="ml-auto text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">
                        {t("landing.region_soon", "binnenkort")}
                      </span>
                    ) : null}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Select value={sortMode} onValueChange={(v) => setSortMode(v as LandingSortMode)}>
          <SelectTrigger className="sm:w-[210px] h-11 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-amber-600/70" aria-hidden="true" />
                {t("landing.sort_popular", "Meest gekozen")}
              </span>
            </SelectItem>
            <SelectItem value="available_first">
              <span className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-primary/70" aria-hidden="true" />
                {t("landing.sort_available", "Beschikbaar eerst")}
              </span>
            </SelectItem>
            <SelectItem value="az">{t("landing.sort_az", "Naam A → Z")}</SelectItem>
            <SelectItem value="za">{t("landing.sort_za", "Naam Z → A")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}


interface WaitlistStats {
  claimed: number;
  total: number;
  remaining: number;
}

function WaitlistHeroBanner() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<WaitlistStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/waitlist/stats`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: WaitlistStats | null) => {
        if (!cancelled && d) setStats(d);
      })
      .catch(() => { /* silent */ });
    return () => { cancelled = true; };
  }, []);

  const claimed = stats?.claimed ?? 0;
  const total = stats?.total ?? 100;
  const remaining = stats?.remaining ?? Math.max(0, total - claimed);
  const percent = Math.min(100, Math.round((claimed / total) * 100));
  const full = remaining <= 0;

  return (
    <Link href="/waitlist">
      <div
        data-testid="link-welcome-waitlist-cta"
        className="group relative overflow-hidden rounded-sm border border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card hover:border-primary/50 hover:from-primary/10 transition-all duration-300 cursor-pointer animate-in fade-in duration-700"
        style={{ animationDelay: "300ms" }}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 via-primary/60 to-primary/40" aria-hidden="true" />
        <div className="p-6 md:p-7 flex flex-col md:flex-row md:items-center gap-5">
          <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-sm bg-primary/10 border border-primary/20">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-primary">
              {t("landing.waitlist_eyebrow")}
            </p>
            <h2 className="font-serif text-xl md:text-2xl text-foreground">
              {t("landing.waitlist_title")}
            </h2>
            {stats && (
              <div className="space-y-1.5 max-w-md">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-mono uppercase tracking-widest text-muted-foreground">
                    {t("waitlist.counter_label")}
                  </span>
                  <span
                    className="font-serif text-foreground"
                    data-testid="welcome-waitlist-counter"
                  >
                    <span className="text-primary">{claimed}</span>
                    <span className="text-muted-foreground"> / {total}</span>
                  </span>
                </div>
                <div
                  className="h-1.5 bg-muted/40 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground font-light">
                  {full
                    ? t("waitlist.counter_full")
                    : t("waitlist.counter_remaining", { count: remaining })}
                </p>
              </div>
            )}
          </div>
          <div className="shrink-0">
            <span className="inline-flex items-center gap-2 px-5 py-3 rounded-sm bg-primary/10 border border-primary/30 text-primary text-sm font-medium tracking-wide group-hover:bg-primary/20 transition-colors">
              {t("landing.waitlist_cta")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Welcome() {
  const [, navigate] = useLocation();
  const { t, locale } = useLanguage();
  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Cortéa",
    "url": "https://cortea.app",
    "description": "Master cultural etiquette and refined social conduct across 50+ countries.",
    "applicationCategory": "EducationApplication",
    "offers": [
      { "@type": "Offer", "name": "Guest", "price": "0", "priceCurrency": "EUR" },
      { "@type": "Offer", "name": "Student", "price": "9.99", "priceCurrency": "EUR" },
      { "@type": "Offer", "name": "Traveller", "price": "19.99", "priceCurrency": "EUR" },
      { "@type": "Offer", "name": "Ambassador", "price": "39.99", "priceCurrency": "EUR" },
    ],
    "availableLanguage": ["en", "nl", "fr", "de", "es", "pt", "it", "ar", "ja", "zh"],
    "operatingSystem": "Web",
  };
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
        <SEOHead
          title={t("seo.landing.title", "Cortéa — The Art of Conduct")}
          description={t("seo.landing.description")}
          locale={locale}
          path="/"
          jsonLd={webAppJsonLd}
        />
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

          {/* "Cortéa is for everyone…" — moved above the region picker so visitors immediately know what this is about */}
          <div className="w-full border-t border-border/20 pt-10 space-y-6 animate-in fade-in duration-700" style={{ animationDelay: "150ms" }}>
            <h2 className="text-center font-serif text-lg text-foreground/80">
              {t("welcome.audience_section_title")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { headingKey: "welcome.audience_everyday_heading",     bodyKey: "welcome.audience_everyday_body",     Icon: User,       accent: "text-emerald-600/70 bg-emerald-500/10" },
                { headingKey: "welcome.audience_curious_heading",      bodyKey: "welcome.audience_curious_body",      Icon: Globe,      accent: "text-sky-600/70   bg-sky-500/10"   },
                { headingKey: "welcome.audience_refined_heading",      bodyKey: "welcome.audience_refined_body",      Icon: Star,       accent: "text-violet-600/70 bg-violet-500/10" },
                { headingKey: "welcome.audience_professional_heading", bodyKey: "welcome.audience_professional_body", Icon: Briefcase,  accent: "text-amber-600/70 bg-amber-500/10" },
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

          <div className="w-full border-t border-border/30 pt-10">
            <WaitlistHeroBanner />
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
            <p className="text-base text-muted-foreground font-light">
              {t("landing.signin_prompt")}{" "}
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); navigate("/signin"); }}
                className="font-medium text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary transition-colors"
                data-testid="link-welcome-signin"
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
            ].map(({ icon: Icon, labelKey, descKey, href }) => (
              <Link key={labelKey} href={href}>
                <div className="flex items-start gap-4 p-5 rounded-sm border border-transparent hover:border-border/40 hover:bg-card/60 transition-all duration-200 group cursor-pointer">
                  <Icon className="w-5 h-5 mt-0.5 text-primary/60 group-hover:text-primary/80 transition-colors shrink-0" aria-hidden="true" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="font-serif text-sm text-foreground text-center">{t(labelKey as Parameters<typeof t>[0])}</div>
                    <div className="text-xs text-muted-foreground font-light leading-relaxed">{t(descKey as Parameters<typeof t>[0])}</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-primary/30 group-hover:text-primary/60 transition-colors shrink-0 mt-0.5" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>

          <Link href="/membership">
            <div
              data-testid="link-welcome-upgrade-cta"
              className="group relative overflow-hidden rounded-sm border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-card to-card hover:border-amber-500/50 hover:from-amber-500/10 transition-all duration-300 cursor-pointer animate-in fade-in duration-700"
              style={{ animationDelay: "550ms" }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500/40 via-amber-400/60 to-amber-500/40" aria-hidden="true" />
              <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
                <div className="shrink-0 flex items-center justify-center w-14 h-14 rounded-sm bg-amber-500/10 border border-amber-500/20">
                  <Crown className="h-6 w-6 text-amber-600" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-amber-700/70">
                    {t("home.upgrade_eyebrow")}
                  </p>
                  <h2 className="font-serif text-xl md:text-2xl text-foreground">
                    {t("home.upgrade_title")}
                  </h2>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    {t("home.upgrade_description")}
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="inline-flex items-center gap-2 px-5 py-3 rounded-sm bg-amber-500/10 border border-amber-500/30 text-amber-700 text-sm font-medium tracking-wide group-hover:bg-amber-500/20 transition-colors">
                    {t("home.upgrade_cta")}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </div>
          </Link>

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
