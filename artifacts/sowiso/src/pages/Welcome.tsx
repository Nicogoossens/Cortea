import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  BookOpen, Compass, Shield, ArrowRight, CheckCircle2, XCircle,
  ChevronRight, MapPin, ArrowLeft, Briefcase, Globe, Star, User,
  Crown, TrendingUp, Check, Sparkles,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useActiveRegion, COMPASS_REGIONS, FlagEmoji, isRegionActive, type RegionCode } from "@/lib/active-region";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LandingLayout } from "@/components/layout/LandingLayout";
import { SEOHead } from "@/components/SEOHead";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Question {
  id: number;
  country: string;
  countryCode: string;
  facet: string;
  scenario: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    country: "Belgium",
    countryCode: "BE",
    facet: "Dining etiquette",
    scenario: "You have been invited to dinner at a private residence in Brussels. The invitation states seven o'clock. At what time should you arrive?",
    options: [
      "Six forty-five — to assist with final preparations.",
      "Seven o'clock precisely — punctuality is a virtue.",
      "Between seven ten and seven fifteen — the customary quarter.",
    ],
    correctIndex: 2,
    explanation: "Arriving slightly after the stated hour — the so-called 'gentleman's quarter' — allows the host to conclude their preparations with composure. Arriving early is considered an imposition in Belgian and French social circles.",
  },
  {
    id: 2,
    country: "France",
    countryCode: "FR",
    facet: "Table protocol",
    scenario: "You are seated at a formally laid table in Paris. Bread rolls are placed on either side of your setting. Which is yours?",
    options: [
      "The one to my left.",
      "The one to my right.",
      "Whichever appears freshest.",
    ],
    correctIndex: 0,
    explanation: "The mnemonic BMW guides the formal table: Bread to the left, Meal in the centre, Water and Wine to the right. The bread roll to your left is always yours.",
  },
  {
    id: 3,
    country: "Japan",
    countryCode: "JP",
    facet: "Business protocol",
    scenario: "During a business dinner in Tokyo, your host presents their meishi — business card — with both hands and a respectful bow. How do you respond?",
    options: [
      "Accept with one hand and a warm smile, then set it aside.",
      "Accept with both hands, study it attentively, and place it respectfully on the table.",
      "Accept graciously and immediately reciprocate with your own card.",
    ],
    correctIndex: 1,
    explanation: "In Japanese business culture, the meishi is an extension of the person. It must be received with both hands, examined with genuine attention, and placed carefully on the table — never written upon or pocketed immediately.",
  },
  {
    id: 4,
    country: "United Kingdom",
    countryCode: "GB",
    facet: "Formal introduction",
    scenario: "You are introduced to a senior partner at a London law firm. She extends her hand first. What is the correct response?",
    options: [
      "Offer a firm, brief handshake and maintain direct eye contact.",
      "Offer a warm two-handed handshake to convey enthusiasm.",
      "Bow your head slightly before taking her hand.",
    ],
    correctIndex: 0,
    explanation: "In British professional circles, a firm but brief handshake with direct eye contact is the standard greeting. Two-handed shakes are considered overly familiar, and bowing is not a British custom. When the senior party extends their hand first, you follow without delay.",
  },
  {
    id: 5,
    country: "Germany",
    countryCode: "DE",
    facet: "Business punctuality",
    scenario: "You are scheduled for a 9 a.m. meeting in Frankfurt. Your train is delayed — you will arrive at 9:05. What is the appropriate action?",
    options: [
      "Send a brief message ahead of time and apologise sincerely upon arrival.",
      "Arrive and say nothing — five minutes is inconsequential.",
      "Reschedule the meeting rather than arrive at all.",
    ],
    correctIndex: 0,
    explanation: "German business culture places exceptional value on punctuality. Even a five-minute delay warrants prior notification and a sincere apology upon arrival. Silence on the matter is considered a mark of poor character.",
  },
  {
    id: 6,
    country: "Saudi Arabia",
    countryCode: "SA",
    facet: "Hospitality customs",
    scenario: "You are a guest at a business meeting in Riyadh. Qahwa — Arabic coffee — is offered. You have had three cups and wish to decline a fourth. How do you signal this?",
    options: [
      "Place your hand over the cup and say 'no thank you'.",
      "Gently tilt and shake the cup from side to side.",
      "Simply stop drinking — the host will understand.",
    ],
    correctIndex: 1,
    explanation: "In Arabian hospitality, gently tilting or shaking the empty cup — known as 'rakz' — is the traditional signal that you have had sufficient. Placing your hand over the cup may seem abrupt; stopping silently risks appearing rude.",
  },
  {
    id: 7,
    country: "Italy",
    countryCode: "IT",
    facet: "Dining etiquette",
    scenario: "At a family dinner in Rome, you have greatly enjoyed the pasta. A small portion remains on your plate. What is the refined choice?",
    options: [
      "Finish every last bite — to leave food is disrespectful to the cook.",
      "Leave a small amount — it signals you were satisfied, not greedy.",
      "Ask for the remainder to be wrapped to take home.",
    ],
    correctIndex: 0,
    explanation: "In Italian dining culture, finishing your plate is considered the highest compliment to the cook. Leaving food, particularly in a home setting, may suggest the dish was not to your taste — a subtle but significant slight.",
  },
  {
    id: 8,
    country: "India",
    countryCode: "IN",
    facet: "Gift-giving",
    scenario: "You are invited to a colleague's home in Mumbai for a festive meal. You bring a gift of sweets. How will your host most likely respond upon receiving it?",
    options: [
      "Open it immediately and offer some to the other guests.",
      "Set it aside graciously to open later in private.",
      "Politely decline — gifts are not customary in this context.",
    ],
    correctIndex: 1,
    explanation: "In many Indian social contexts, gifts are traditionally set aside to be opened in private rather than in front of the giver. This avoids any appearance of eagerness or disappointment. The gesture is nonetheless warmly appreciated.",
  },
];

function RegionPicker() {
  const { activeRegion, setActiveRegion, getRegionName, getCurrentRegion } = useActiveRegion();
  const { t } = useLanguage();

  const sorted = [...COMPASS_REGIONS].sort((a, b) => {
    const aAvail = isRegionActive(a.code) ? 1 : 0;
    const bAvail = isRegionActive(b.code) ? 1 : 0;
    if (aAvail !== bAvail) return bAvail - aAvail;
    return getRegionName(a.code).localeCompare(getRegionName(b.code));
  });

  const current = getCurrentRegion();

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-500" style={{ animationDelay: "200ms" }}>
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-mono uppercase tracking-widest text-muted-foreground font-semibold">
          {t("landing.your_region")}
        </span>
      </div>
      <p className="text-sm text-foreground/80 font-light">
        {t("landing.region_subtitle")}
      </p>

      <Select value={activeRegion} onValueChange={(v) => setActiveRegion(v as RegionCode)}>
        <SelectTrigger className="w-full sm:max-w-xs h-11 text-sm rounded-xl">
          <SelectValue>
            <span className="flex items-center gap-2">
              <FlagEmoji code={current.code} size="sm" />
              <span className="font-medium">{getRegionName(current.code)}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[360px]">
          {sorted.map((region) => {
            const available = isRegionActive(region.code);
            return (
              <SelectItem
                key={region.code}
                value={region.code}
                disabled={!available}
                className={!available ? "opacity-40" : ""}
              >
                <span className="flex items-center gap-2 w-full">
                  <FlagEmoji code={region.code} size="sm" />
                  <span className={available ? "" : "line-through decoration-muted-foreground/40"}>
                    {getRegionName(region.code)}
                  </span>
                  {!available ? (
                    <span className="ml-auto text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">
                      {t("landing.region_soon", "coming soon")}
                    </span>
                  ) : null}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
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
            <p className="text-xs font-mono uppercase tracking-widest text-primary">
              {t("landing.waitlist_eyebrow")}
            </p>
            <h2 className="font-serif text-xl md:text-2xl text-foreground">
              {t("landing.waitlist_title")}
            </h2>
            {stats && (
              <div className="space-y-1.5 max-w-md">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-mono uppercase tracking-widest text-muted-foreground">
                    {t("waitlist.counter_label")}
                  </span>
                  <span className="font-serif text-foreground" data-testid="welcome-waitlist-counter">
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
                  <div className="h-full bg-primary transition-all duration-500" style={{ width: `${percent}%` }} />
                </div>
                <p className="text-sm text-muted-foreground font-light">
                  {full ? t("waitlist.counter_full") : t("waitlist.counter_remaining", { count: remaining })}
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
  const { activeRegion } = useActiveRegion();

  const [quizOpen, setQuizOpen] = useState(false);
  const [quizDone, setQuizDone] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(QUESTIONS.length).fill(null));
  const [revealed, setRevealed] = useState(false);

  const q = QUESTIONS[currentQ];
  const score = answers.filter((a, i) => a === QUESTIONS[i].correctIndex).length;
  const baseLang = locale.split("-")[0];

  function openQuiz() {
    setCurrentQ(0);
    setAnswers(Array(QUESTIONS.length).fill(null));
    setRevealed(false);
    setQuizDone(false);
    setQuizOpen(true);
  }

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
      setQuizDone(true);
    }
  }

  function goToRegister() {
    setQuizOpen(false);
    const params = new URLSearchParams({ lang: baseLang, region: activeRegion });
    navigate(`/register?${params.toString()}`);
  }

  function getScoreLabel() {
    const pct = score / QUESTIONS.length;
    if (pct === 1) return t("welcome.result_flawless");
    if (pct >= 0.75) return t("welcome.result_accomplished");
    if (pct >= 0.4) return t("welcome.result_promising");
    return t("welcome.result_nascent");
  }

  function getScoreMessage() {
    const pct = score / QUESTIONS.length;
    if (pct === 1) return t("welcome.result_msg_flawless");
    if (pct >= 0.75) return t("welcome.result_msg_accomplished");
    if (pct >= 0.4) return t("welcome.result_msg_promising");
    return t("welcome.result_msg_nascent");
  }

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

  const optionLabels = ["A", "B", "C"];

  return (
    <LandingLayout>
      <SEOHead
        title={t("seo.landing.title", "Cortéa — The Art of Conduct")}
        description={t("seo.landing.description")}
        locale={locale}
        path="/"
        jsonLd={webAppJsonLd}
      />

      <div className="flex-1 flex flex-col items-center justify-center px-6 md:px-12 lg:px-24 py-12 max-w-4xl mx-auto w-full space-y-16">

        {/* 1. Hero */}
        <div className="space-y-6 text-center animate-in fade-in duration-700">
          <p className="text-xs font-mono uppercase tracking-[0.4em] text-muted-foreground font-semibold">
            {t("app.tagline")}
          </p>
          <h1 className="text-5xl md:text-7xl font-serif text-foreground leading-tight">
            {t("welcome.hero_title_1")}<br />
            <span className="text-primary">{t("welcome.hero_title_2")}</span>
          </h1>
          <p className="text-xl text-foreground/85 font-light leading-relaxed max-w-xl mx-auto">
            {t("welcome.hero_subtitle")}
          </p>
        </div>

        {/* 2. Three modules */}
        <div id="region-detect-sentinel" className="w-full border-t border-border pt-12 space-y-6 animate-in fade-in duration-700" style={{ animationDelay: "150ms" }}>
          <p className="text-center text-xs font-mono uppercase tracking-[0.35em] text-muted-foreground font-semibold">
            {t("welcome.modules_eyebrow", "What you will find inside")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { icon: BookOpen, labelKey: "nav.atelier" as const, descKey: "welcome.module_atelier_desc" as const, href: "/atelier", cardCls: "bg-primary/[0.07] border-primary/55",    iconCls: "bg-primary/25 text-primary",      titleCls: "text-primary" },
              { icon: Shield,   labelKey: "nav.counsel" as const, descKey: "welcome.module_counsel_desc" as const, href: "/counsel", cardCls: "bg-violet-500/[0.07] border-violet-500/55", iconCls: "bg-violet-500/25 text-violet-700", titleCls: "text-violet-800" },
              { icon: Compass,  labelKey: "nav.compass" as const, descKey: "welcome.module_compass_desc" as const, href: "/compass", cardCls: "bg-sky-500/[0.07] border-sky-500/55",      iconCls: "bg-sky-500/25 text-sky-700",      titleCls: "text-sky-800" },
            ].map(({ icon: Icon, labelKey, descKey, href, cardCls, iconCls, titleCls }) => (
              <Link key={labelKey} href={href}>
                <div className={`group relative flex flex-col gap-4 p-6 rounded-xl border-2 ${cardCls} hover:shadow-md transition-all duration-200 cursor-pointer h-full`}>
                  <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${iconCls} shrink-0`}>
                    <Icon className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className={`font-serif text-lg ${titleCls}`}>{t(labelKey)}</h3>
                    <p className="text-sm text-foreground/80 font-light leading-relaxed">{t(descKey)}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest font-semibold ${titleCls} group-hover:opacity-80 transition-opacity`}>
                    {t("common.explore", "Explore")}
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 3. Audience section */}
        <div className="w-full border-t border-border/30 pt-12 space-y-6 animate-in fade-in duration-700" style={{ animationDelay: "200ms" }}>
          <h2 className="text-center font-serif text-2xl text-foreground">
            {t("welcome.audience_section_title")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { headingKey: "welcome.audience_everyday_heading",     bodyKey: "welcome.audience_everyday_body",     Icon: User,      iconCls: "text-emerald-800 bg-emerald-400/30",  cardCls: "bg-emerald-50/80 border-emerald-500/55" },
              { headingKey: "welcome.audience_curious_heading",      bodyKey: "welcome.audience_curious_body",      Icon: Globe,     iconCls: "text-sky-800 bg-sky-400/30",          cardCls: "bg-sky-50/80 border-sky-500/55" },
              { headingKey: "welcome.audience_refined_heading",      bodyKey: "welcome.audience_refined_body",      Icon: Star,      iconCls: "text-violet-800 bg-violet-400/30",    cardCls: "bg-violet-50/80 border-violet-500/55" },
              { headingKey: "welcome.audience_professional_heading", bodyKey: "welcome.audience_professional_body", Icon: Briefcase, iconCls: "text-amber-800 bg-amber-400/30",      cardCls: "bg-amber-50/80 border-amber-500/55" },
            ].map(({ headingKey, bodyKey, Icon, iconCls, cardCls }) => (
              <div key={headingKey} className={`flex gap-4 items-start px-5 py-5 rounded-xl border-2 ${cardCls}`}>
                <span className={`mt-0.5 shrink-0 flex items-center justify-center w-10 h-10 rounded-full ${iconCls}`} aria-hidden="true">
                  <Icon className="w-5 h-5" />
                </span>
                <div className="space-y-1.5">
                  <h3 className="font-serif text-base text-foreground font-semibold">{t(headingKey as Parameters<typeof t>[0])}</h3>
                  <p className="text-sm text-foreground/80 font-light leading-relaxed">{t(bodyKey as Parameters<typeof t>[0])}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-foreground/75 font-light leading-relaxed max-w-2xl text-center mx-auto pt-2">
            {t("welcome.foundation_sentence")}
          </p>
        </div>

        {/* 4. Region picker */}
        <div className="w-full border-t border-border/30 pt-12">
          <RegionPicker />
        </div>

        {/* 5. Begin button + sign in */}
        <div className="flex flex-col items-center gap-5 animate-in fade-in duration-700" style={{ animationDelay: "400ms" }}>
          <Button
            size="lg"
            className="font-serif text-lg px-10 py-6 bg-primary hover:bg-primary/90 text-primary-foreground gap-3 rounded-sm"
            onClick={openQuiz}
          >
            {t("welcome.begin")}
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </Button>
          <p className="text-base text-foreground/80 font-light">
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

        {/* 6. Join the Founding 100 */}
        <div className="w-full border-t border-border/30 pt-12">
          <WaitlistHeroBanner />
        </div>

        {/* 7. Membership CTA */}
        <Link href="/membership">
          <div
            data-testid="link-welcome-upgrade-cta"
            className="group relative overflow-hidden rounded-xl border-2 border-amber-500/60 bg-gradient-to-br from-amber-50/80 via-card to-card hover:border-amber-500/80 hover:from-amber-50 transition-all duration-300 cursor-pointer animate-in fade-in duration-700"
            style={{ animationDelay: "550ms" }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500/40 via-amber-400/60 to-amber-500/40" aria-hidden="true" />
            <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
              <div className="shrink-0 flex items-center justify-center w-14 h-14 rounded-sm bg-amber-500/25 border-2 border-amber-500/50">
                <Crown className="h-6 w-6 text-amber-700" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-xs font-mono uppercase tracking-widest text-amber-800 font-semibold">
                  {t("home.upgrade_eyebrow")}
                </p>
                <h2 className="font-serif text-xl md:text-2xl text-foreground">
                  {t("home.upgrade_title")}
                </h2>
                <p className="text-base text-foreground/80 font-light leading-relaxed">
                  {t("home.upgrade_description")}
                </p>
              </div>
              <div className="shrink-0">
                <span className="inline-flex items-center gap-2 px-5 py-3 rounded-sm bg-amber-500/20 border-2 border-amber-500/60 text-amber-800 text-sm font-semibold tracking-wide group-hover:bg-amber-500/30 transition-colors">
                  {t("home.upgrade_cta")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
            </div>
          </div>
        </Link>

      </div>

      {/* ── Quiz Modal ── */}
      <Dialog open={quizOpen} onOpenChange={(open) => { if (!open) { setQuizOpen(false); } }}>
        <DialogContent className="max-w-2xl w-full p-0 overflow-hidden rounded-sm border border-border bg-background">
          <DialogTitle className="sr-only">
            {quizDone ? t("welcome.result_title") : `${t("welcome.quiz_scenario")} ${q.id} ${t("welcome.quiz_of")} ${QUESTIONS.length}`}
          </DialogTitle>

          {!quizDone ? (
            /* ── Question screen ── */
            <div className="flex flex-col p-8 space-y-8">
              {/* Header: back + progress */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    if (currentQ === 0) { setQuizOpen(false); }
                    else { setCurrentQ(currentQ - 1); setRevealed(answers[currentQ - 1] !== null); }
                  }}
                  className="flex items-center gap-1.5 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  aria-label={t("welcome.quiz_back")}
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  {t("welcome.quiz_back")}
                </button>
                <div className="flex items-center gap-2 flex-1">
                  {QUESTIONS.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                        i < currentQ ? "bg-primary" : i === currentQ ? "bg-primary/50" : "bg-border"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Country badge + question number */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground/60">
                    {t("welcome.quiz_scenario")} {q.id} {t("welcome.quiz_of")} {QUESTIONS.length}
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 border border-border/50 text-xs text-foreground/70">
                    <FlagEmoji code={q.countryCode as RegionCode} size="sm" />
                    {q.country}
                    <span className="text-muted-foreground/50">·</span>
                    <span className="font-mono">{q.facet}</span>
                  </span>
                </div>
                <p className="text-xl md:text-2xl font-serif text-foreground leading-relaxed">
                  {q.scenario}
                </p>
              </div>

              {/* Answer options */}
              <div className="space-y-3">
                {q.options.map((option, idx) => {
                  let variant: "correct" | "incorrect" | "neutral" | "dimmed" = "neutral";
                  if (revealed) {
                    if (idx === q.correctIndex) variant = "correct";
                    else if (idx === answers[currentQ]) variant = "incorrect";
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
                          ? "border-border/40 bg-muted/20 text-muted-foreground opacity-40"
                          : "border-border bg-card hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
                      }`}
                    >
                      <span className={`font-mono text-sm mt-0.5 font-bold shrink-0 ${
                        variant === "correct" ? "text-green-600" :
                        variant === "incorrect" ? "text-red-500" : "text-muted-foreground"
                      }`}>
                        {optionLabels[idx]}
                      </span>
                      <span className="text-base font-light leading-relaxed">{option}</span>
                      {revealed && idx === q.correctIndex && (
                        <CheckCircle2 className="w-5 h-5 text-green-600 ml-auto shrink-0 mt-0.5" aria-hidden="true" />
                      )}
                      {revealed && idx === answers[currentQ] && idx !== q.correctIndex && (
                        <XCircle className="w-5 h-5 text-red-500 ml-auto shrink-0 mt-0.5" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation + next */}
              {revealed && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-400 space-y-4">
                  <div className={`px-5 py-4 rounded-sm border text-sm leading-relaxed ${
                    answers[currentQ] === q.correctIndex
                      ? "border-green-300/60 bg-green-50/40 text-green-900"
                      : "border-amber-300/60 bg-amber-50/40 text-amber-900"
                  }`}>
                    <span className="font-semibold font-mono text-xs uppercase tracking-wider mr-2">
                      {answers[currentQ] === q.correctIndex ? t("welcome.quiz_correct") : t("welcome.quiz_not_quite")}
                    </span>
                    <span className="font-light">{q.explanation}</span>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={advance}
                      className="font-serif bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-sm px-6"
                    >
                      {currentQ < QUESTIONS.length - 1 ? t("welcome.quiz_next") : t("welcome.quiz_result")}
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── Result screen ── */
            <div className="flex flex-col items-center p-8 space-y-8 text-center">
              <div className="space-y-4">
                <p className="text-xs font-mono uppercase tracking-[0.4em] text-muted-foreground/70">
                  {t("welcome.result_title")}
                </p>
                <div className="text-8xl font-serif text-primary">
                  {score}<span className="text-4xl text-muted-foreground">/{QUESTIONS.length}</span>
                </div>
                <h2 className="text-3xl font-serif text-foreground">{getScoreLabel()}</h2>
                <p className="text-base text-foreground/60 font-light leading-relaxed max-w-md mx-auto">
                  {getScoreMessage()}
                </p>
              </div>

              <div className="w-full border border-border rounded-sm p-6 space-y-5 text-left bg-card">
                <div className="space-y-2">
                  <h3 className="font-serif text-xl text-foreground">{t("welcome.join_heading")}</h3>
                  <p className="text-sm text-foreground/60 font-light leading-relaxed">
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
                      <div className="font-serif text-base text-foreground">{t(labelKey as Parameters<typeof t>[0])}</div>
                      <div className="text-sm text-foreground/55 font-light">{t(descKey as Parameters<typeof t>[0])}</div>
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
                onClick={openQuiz}
                className="text-sm text-muted-foreground/60 hover:text-muted-foreground underline underline-offset-4 font-mono"
              >
                {t("welcome.repeat")}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </LandingLayout>
  );
}
