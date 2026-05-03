import { SEOHead } from "@/components/SEOHead";
import {
  useGetScenarios,
  getGetScenariosQueryKey,
  useGetNobleScore,
  useGetProfile,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation, useSearch } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, TrendingUp, BookOpen, Lock, Globe, GraduationCap, LayoutList, Users2, Play, Sparkles, Flame, Award } from "lucide-react";
import { startSession, loadSession, clearSession, type AtelierSession } from "@/lib/atelier-session";
import { useLanguage } from "@/lib/i18n";
import { useActiveRegion, FlagEmoji } from "@/lib/active-region";
import { TierGate } from "@/components/TierGate";
import { LockOverlay } from "@/components/LockOverlay";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { ActiveContextChips } from "@/components/ActiveContextChips";
import { AtelierLearningTrack } from "@/components/AtelierLearningTrack";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const PILLARS = [0, 1, 2, 3, 4, 5] as const;

const GUEST_DIFFICULTY_MAX = 2;
const GUEST_FREE_SCENARIO_CAP = 3;

function scoreToDifficultyMax(score: number): number {
  if (score >= 80) return 5;
  if (score >= 60) return 4;
  if (score >= 40) return 3;
  if (score >= 20) return 2;
  return 1;
}

interface RoleplayScenarioSummary {
  id: number;
  title: string;
  context: string;
  situation: string;
  pillar: number;
  difficulty_level: number;
  estimated_minutes: number;
}

type AtelierView = "scenarios" | "tracks" | "roleplay";

export default function Atelier() {
  const { t, locale } = useLanguage();
  const atelierJsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "Cortéa — The Atelier",
    "url": "https://cortea.app/atelier",
    "description": "Scenario-based etiquette training for cross-cultural encounters, boardrooms, and diplomatic occasions.",
    "teaches": "Cultural etiquette and social conduct",
  };
  const { isAuthenticated } = useAuth();
  const { activeRegion, getRegionName } = useActiveRegion();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const showSummary = new URLSearchParams(search).get("session_summary") === "1";
  const [summarySession, setSummarySession] = useState<AtelierSession | null>(null);
  const [sessionMasterAwarded, setSessionMasterAwarded] = useState<boolean>(false);
  const [selectedPillar, setSelectedPillar] = useState<number>(0);
  // Default to the structured learning tracks — scenarios are no longer a
  // standalone end-user surface; they live behind the session flow only.
  const [view, setView] = useState<AtelierView>("tracks");

  useEffect(() => {
    if (showSummary) {
      setSummarySession(loadSession());
    } else {
      setSummarySession(null);
      setSessionMasterAwarded(false);
    }
  }, [showSummary]);

  useEffect(() => {
    if (!showSummary || !summarySession) return;
    if (!summarySession.completed) return;
    if (!isAuthenticated) return;
    let cancelled = false;
    fetch(`${API_BASE}/api/atelier/session/complete`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answered: summarySession.answered,
        total: summarySession.ids.length,
        correct: summarySession.correct,
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data && data.awarded_badge) setSessionMasterAwarded(true);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [showSummary, summarySession, isAuthenticated]);
  const [roleplayScenarios, setRoleplayScenarios] = useState<RoleplayScenarioSummary[]>([]);
  const [roleplayLoading, setRoleplayLoading] = useState(false);

  const { data: nobleScore } = useGetNobleScore();
  const { data: profile } = useGetProfile();

  useEffect(() => {
    if (view !== "roleplay") return;
    setRoleplayLoading(true);
    fetch(`${API_BASE}/api/roleplay/scenarios`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setRoleplayScenarios(data))
      .catch(() => setRoleplayScenarios([]))
      .finally(() => setRoleplayLoading(false));
  }, [view]);

  const tier = profile?.subscription_tier ?? "guest";
  const isVisitor = !isAuthenticated;
  const hasFullAccess = tier === "traveller" || tier === "ambassador";
  const scoreDifficultyMax = scoreToDifficultyMax(nobleScore?.total_score ?? 0);
  const difficultyMax = isVisitor
    ? Math.min(scoreDifficultyMax, GUEST_DIFFICULTY_MAX)
    : hasFullAccess
      ? 5
      : scoreDifficultyMax;

  const lang = locale.split("-")[0];

  const spheres = profile?.situational_interests ?? [];
  const spheresParam = spheres.length > 0 ? spheres.join(",") : undefined;

  const queryParams = {
    region_code: activeRegion,
    ...(isVisitor
      ? {}
      : selectedPillar > 0
        ? { pillar: selectedPillar }
        : {}),
    difficulty_max: 5,
    limit: 50,
    lang,
    ...(spheresParam ? { situational_interests: spheresParam } : {}),
  };

  const { data: allScenarios, isLoading } = useGetScenarios(queryParams, {
    query: {
      queryKey: [...getGetScenariosQueryKey(), activeRegion, isVisitor ? 0 : selectedPillar, lang, spheresParam],
      staleTime: 0,
    }
  });

  const PILLAR_DOMAIN_NAMES: Record<number, string> = {
    1: "pillar.1.name",
    2: "pillar.2.name",
    3: "pillar.3.name",
    4: "pillar.4.name",
    5: "pillar.5.name",
  };

  const sortByPillar = <T extends { pillar: number; difficulty_level: number | null }>(arr: T[]): T[] =>
    [...arr].sort((a, b) => (a.pillar - b.pillar) || ((a.difficulty_level ?? 0) - (b.difficulty_level ?? 0)));

  const accessibleScenarios = isVisitor
    ? allScenarios?.slice(0, GUEST_FREE_SCENARIO_CAP)
    : sortByPillar(allScenarios?.filter((s) => s.difficulty_level <= difficultyMax) ?? []);
  const lockedScenarios = isVisitor
    ? allScenarios?.slice(GUEST_FREE_SCENARIO_CAP)
    : sortByPillar(allScenarios?.filter((s) => s.difficulty_level > difficultyMax) ?? []);
  const hasLockedScenarios = (lockedScenarios?.length ?? 0) > 0;

  // Fallback detection: the API sets is_regional=false on any scenario that
  // was supplied as a universal GB supplement. Show the banner whenever at
  // least one fallback scenario is present (covers both full-fallback and
  // mixed-fallback cases, e.g. 1 regional + 15 GB).
  const isUsingFallback =
    !!allScenarios &&
    allScenarios.length > 0 &&
    allScenarios.some((s) => s.is_regional === false);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SEOHead
        title={t("seo.atelier.title", "The Atelier — Etiquette Practice")}
        description={t("seo.atelier.description")}
        locale={locale}
        path="/atelier"
        jsonLd={atelierJsonLd}
      />
      <div className="space-y-4 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-serif text-foreground">{t("atelier.title")}</h1>
        <p className="text-muted-foreground text-lg font-light leading-relaxed">
          {t("atelier.subtitle")}
        </p>
      </div>

      {/* Active context chips */}
      <ActiveContextChips />

      {/* Fallback banner — shown when region has no own scenarios yet */}
      {isUsingFallback && (
        <div className="flex items-start gap-3 px-5 py-4 rounded-sm border border-amber-500/20 bg-amber-50/30 dark:bg-amber-900/10 text-sm">
          <Globe className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600/70 dark:text-amber-400/70" aria-hidden="true" />
          <p className="text-foreground/70">
            {t("atelier.fallback_banner", { region: getRegionName(activeRegion) })}
          </p>
        </div>
      )}

      {/* Visitor preview banner — shown only to unauthenticated visitors */}
      {isVisitor && (
        <div className="flex items-start gap-3 px-5 py-4 rounded-sm border border-border/40 bg-muted/20 text-sm">
          <BookOpen className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary/60" aria-hidden="true" />
          <p className="text-foreground/80">
            <span className="font-medium">{t("atelier.guest.preview_label")}</span> —{" "}
            <Link href="/register" className="text-primary underline underline-offset-2 hover:text-primary/80">
              {t("atelier.guest.register_link")}
            </Link>{" "}
            {t("atelier.guest.register_prompt")}
          </p>
        </div>
      )}

      {/* Visitor teaser — fills the otherwise-empty page with a preview of
          what registered users get. Three feature cards + a faded mock of a
          live learning session with a lock-overlay register CTA. */}
      {isVisitor && <VisitorAtelierTeaser t={t} />}

      {/* View toggle: Learning Tracks / Roleplay (Scenarios tab intentionally
          removed — the scenario library is no longer a standalone end-user
          surface; sessions are the canonical entry point). */}
      {!isVisitor && (
        <div className="flex items-center gap-1 border border-border/40 rounded-sm p-0.5 w-fit flex-wrap" role="tablist" aria-label="Atelier view">
          <button
            role="tab"
            aria-selected={view === "tracks"}
            onClick={() => setView("tracks")}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-mono uppercase tracking-widest rounded-[2px] transition-colors ${
              view === "tracks"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
            {t("atelier.tab_learning_tracks")}
          </button>
          <button
            role="tab"
            aria-selected={view === "roleplay"}
            onClick={() => setView("roleplay")}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-mono uppercase tracking-widest rounded-[2px] transition-colors ${
              view === "roleplay"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users2 className="w-3.5 h-3.5" aria-hidden="true" />
            Rollenspel
          </button>
        </div>
      )}

      {/* Learning Tracks paywall for free users (was previously bypassed because
          scenarios served as the free-tier surface). */}
      {!isVisitor && !hasFullAccess && view === "tracks" && (
        <TierGate feature="Learning Tracks" requiredTier="traveller" isAuthenticated={isAuthenticated} />
      )}

      {/* Learning Tracks panel */}
      {hasFullAccess && view === "tracks" && (
        <AtelierLearningTrack
          tier={tier as "traveller" | "ambassador"}
          activeRegion={activeRegion}
          lang={locale}
          ambitionLevel={profile?.ambition_level as "casual" | "professional" | "diplomatic" | undefined}
          gender={profile?.gender}
          ageGroup={profile?.age_group}
        />
      )}

      {/* Roleplay panel */}
      {view === "roleplay" && (
        <div className="space-y-6">
          <div className="flex items-start gap-3 px-5 py-4 rounded-sm border border-border/40 bg-muted/20 text-sm">
            <Users2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary/60" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">Professioneel Rollenspel</p>
              <p className="text-foreground/70 leading-relaxed">
                Elk scenario kent twee afzonderlijke rollen. Doorloop uw eigen rol onafhankelijk en laat achteraf een reflectie achter voor uw companion.
                Beide partijen kunnen elkaars voortgang inzien via het{" "}
                <Link href="/companion" className="text-primary underline underline-offset-2">Companion Dashboard</Link>.
              </p>
            </div>
          </div>

          {roleplayLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-52 rounded-sm" />)}
            </div>
          ) : roleplayScenarios.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground border border-dashed border-border rounded-sm bg-muted/10 space-y-3">
              <Users2 className="w-12 h-12 mx-auto opacity-20" aria-hidden="true" />
              <p className="font-serif text-xl">No roleplay scenarios yet</p>
              <p className="text-sm max-w-sm mx-auto">Roleplay scenarios will appear here as they are added.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roleplayScenarios.map((s) => (
                <Link key={s.id} href={`/atelier/roleplay/${s.id}`}>
                  <Card className="h-full border-border bg-card transition-all duration-300 hover:shadow-md hover:border-primary/40 cursor-pointer flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="bg-muted text-muted-foreground font-mono text-xs rounded-sm px-2">
                          Pillar {s.pillar}
                        </Badge>
                        <span className="text-xs font-mono text-primary/60">{"·".repeat(s.difficulty_level)}</span>
                      </div>
                      <CardTitle className="font-serif text-xl line-clamp-2">{s.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">{s.context}</p>
                      <p className="text-muted-foreground text-sm line-clamp-3">{s.situation}</p>
                    </CardContent>
                    <CardFooter className="pt-4 border-t border-border/50 text-xs text-muted-foreground flex justify-between items-center bg-muted/20">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>~{s.estimated_minutes} min</span>
                      </div>
                      <div className="flex items-center gap-1 text-primary">
                        <Users2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span className="font-serif italic text-xs">2 rollen</span>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pillar filter tabs — hidden for unauthenticated visitors and when showing tracks */}
      {!isVisitor && view === "scenarios" && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("atelier.pillar")}>
          {PILLARS.map((p) => (
            <button
              key={p}
              role="tab"
              aria-selected={selectedPillar === p}
              onClick={() => setSelectedPillar(p)}
              className={`px-4 py-1.5 text-xs font-mono uppercase tracking-widest rounded-sm transition-colors border
                ${selectedPillar === p
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground"
                }`}
            >
              {p === 0 ? t("atelier.all_pillars") : `${t("atelier.pillar")} ${p} · ${t(PILLAR_DOMAIN_NAMES[p] as Parameters<typeof t>[0])}`}
            </button>
          ))}
        </div>
      )}

      {/* Session summary card — shown after a session ends or is stopped */}
      {showSummary && summarySession && summarySession.answered > 0 && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="font-serif text-2xl flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
              {t("atelier.session.summary_title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="border border-border/50 rounded-sm p-4 bg-card/50">
                <div className="text-xs uppercase tracking-widest font-mono text-muted-foreground mb-1">
                  {t("atelier.session.summary_answered")}
                </div>
                <div className="text-2xl font-serif">{summarySession.answered}</div>
              </div>
              <div className="border border-border/50 rounded-sm p-4 bg-card/50">
                <div className="text-xs uppercase tracking-widest font-mono text-muted-foreground mb-1">
                  {t("atelier.session.summary_correct")}
                </div>
                <div className="text-2xl font-serif">
                  <span className="text-green-700 dark:text-green-400">{summarySession.correct}</span>
                  <span className="text-muted-foreground"> · </span>
                  <span className="text-red-700 dark:text-red-400">{summarySession.incorrect}</span>
                </div>
              </div>
              <div className="border border-border/50 rounded-sm p-4 bg-card/50">
                <div className="text-xs uppercase tracking-widest font-mono text-muted-foreground mb-1">
                  {t("atelier.session.summary_accuracy")}
                </div>
                <div className="text-2xl font-serif">
                  {Math.round((summarySession.correct / summarySession.answered) * 100)}%
                </div>
              </div>
            </div>

            {summarySession.unlocks.length > 0 && (
              <div className="border border-amber-500/40 bg-amber-500/5 rounded-sm p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-mono text-amber-700 dark:text-amber-400 mb-2">
                  <Sparkles className="w-3 h-3" aria-hidden="true" />
                  {t("atelier.session.summary_unlocks")}
                </div>
                <ul className="space-y-1">
                  {summarySession.unlocks.map((u) => (
                    <li key={u.id} className="font-serif text-foreground">{u.name}</li>
                  ))}
                </ul>
              </div>
            )}

            {sessionMasterAwarded && (
              <div className="border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-sm p-4 flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-sm bg-amber-500/20 flex items-center justify-center">
                  <Award className="w-5 h-5 text-amber-700 dark:text-amber-400" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-mono text-amber-700 dark:text-amber-400 mb-1">
                    <Sparkles className="w-3 h-3" aria-hidden="true" />
                    {t("atelier.session.summary_master_label")}
                  </div>
                  <div className="font-serif text-lg text-foreground">
                    {t("atelier.session.summary_master_title")}
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {t("atelier.session.summary_master_desc")}
                  </div>
                </div>
              </div>
            )}

            {summarySession.streakMilestone && (
              <div className="border border-orange-500/40 bg-orange-500/5 rounded-sm p-4 flex items-center gap-3">
                <Flame className="w-5 h-5 text-orange-700 dark:text-orange-400" aria-hidden="true" />
                <span className="font-serif text-foreground">
                  {t("atelier.session.summary_streak", { days: summarySession.streakMilestone })}
                </span>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-wrap gap-3 justify-end border-t border-border/50 bg-background/30 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                clearSession();
                setSummarySession(null);
                setLocation("/atelier");
              }}
              className="font-serif"
            >
              {t("atelier.session.summary_overview")}
            </Button>
            <Button
              onClick={() => {
                if (!accessibleScenarios || accessibleScenarios.length === 0) return;
                const ids = accessibleScenarios.map((s) => s.id);
                startSession(ids, selectedPillar);
                setLocation(`/atelier/${ids[0]}?session=1`);
              }}
              disabled={!accessibleScenarios || accessibleScenarios.length === 0}
              className="font-serif"
            >
              <Play className="w-4 h-4 mr-2" aria-hidden="true" />
              {t("atelier.session.summary_new")}
            </Button>
          </CardFooter>
        </Card>
      )}

      {view === "scenarios" && (isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-label={t("common.loading")} aria-live="polite">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64 rounded-sm" />)}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Start Session — sequentiële scenario-sessie */}
          {!isVisitor && (
            accessibleScenarios && accessibleScenarios.length > 0 ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 border border-primary/30 bg-primary/5 rounded-sm">
                <div className="space-y-1">
                  <p className="font-serif text-lg text-foreground">{t("atelier.session.start")}</p>
                  <p className="text-sm text-muted-foreground">{t("atelier.session.start_hint")}</p>
                </div>
                <Button
                  size="lg"
                  onClick={() => {
                    const ids = accessibleScenarios.map((s) => s.id);
                    startSession(ids, selectedPillar);
                    setLocation(`/atelier/${ids[0]}?session=1`);
                  }}
                  className="font-serif tracking-wide"
                >
                  <Play className="w-4 h-4 mr-2" aria-hidden="true" />
                  {t("atelier.session.start")}
                </Button>
              </div>
            ) : (
              <div className="px-5 py-4 border border-border/40 bg-muted/20 rounded-sm text-sm text-muted-foreground">
                {t("atelier.session.empty_hint")}
              </div>
            )
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accessibleScenarios?.map((scenario) => (
              <Link key={scenario.id} href={`/atelier/${scenario.id}`} aria-label={scenario.title}>
                <Card className="h-full border-border bg-card transition-all duration-300 hover:shadow-md hover:border-primary/40 cursor-pointer flex flex-col">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="bg-muted text-muted-foreground font-mono text-xs rounded-sm px-2">
                        {t("atelier.pillar")} {scenario.pillar} · {t(PILLAR_DOMAIN_NAMES[scenario.pillar] as Parameters<typeof t>[0] ?? "pillar.1.name")}
                      </Badge>
                      <span className="text-xs font-medium uppercase tracking-widest text-primary/60">{scenario.difficulty_level ? "·".repeat(scenario.difficulty_level) : ""}</span>
                    </div>
                    <CardTitle className="font-serif text-xl line-clamp-2">{scenario.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-muted-foreground text-sm line-clamp-3">
                      {scenario.content_json.situation}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-4 border-t border-border/50 text-xs text-muted-foreground flex justify-between items-center bg-muted/20">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{scenario.estimated_minutes || 2} {t("atelier.duration")}</span>
                    </div>
                    <div className="flex items-center gap-1 text-primary">
                      <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                      <span className="font-serif italic text-xs">{t("atelier.refines")}</span>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
            {(!accessibleScenarios || accessibleScenarios.length === 0) && !hasLockedScenarios && (
              <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-border rounded-sm bg-muted/10 space-y-4">
                <BookOpen className="w-12 h-12 mx-auto opacity-20" aria-hidden="true" />
                <p className="font-serif text-xl">{t("atelier.empty")}</p>
                <p className="text-sm max-w-sm mx-auto">
                  {t("atelier.empty_region_hint")}
                  <span className="font-medium inline-flex items-center gap-1 ml-1">
                    <FlagEmoji code={activeRegion} size="sm" />
                    {getRegionName(activeRegion)}
                  </span>.
                </p>
                {/* Region changes must happen on the profile page so the
                    user's persisted preference is updated, not the volatile
                    session region. Linking to /compass here previously sent
                    the user to a screen that could not actually change the
                    active region from this empty state. */}
                <Link href="/profile?focus=region">
                  <button className="text-sm underline underline-offset-2 text-primary/70 hover:text-primary transition-colors">
                    {t("atelier.change_region")}
                  </button>
                </Link>
              </div>
            )}
          </div>

          {hasLockedScenarios && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border/50" />
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  <Lock className="h-3 w-3" aria-hidden="true" />
                  <span>{t("atelier.locked_label")}</span>
                </div>
                <div className="flex-1 h-px bg-border/50" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lockedScenarios?.slice(0, 3).map((scenario) => {
                  const lockHref = isAuthenticated ? "/membership" : "/register";
                  return (
                    <Link key={scenario.id} href={lockHref} aria-label={`Locked: ${scenario.title}`}>
                      <Card className="h-full border-border/50 bg-card/60 overflow-hidden relative cursor-pointer hover:border-primary/20 transition-all duration-300 flex flex-col group">
                        <CardHeader className="pb-4">
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline" className="bg-muted/50 text-muted-foreground/50 font-mono text-xs rounded-sm px-2">
                              {t("atelier.pillar")} {scenario.pillar}
                            </Badge>
                            <Lock className="h-3.5 w-3.5 text-muted-foreground/40" aria-hidden="true" />
                          </div>
                          <CardTitle className="font-serif text-xl line-clamp-2 text-muted-foreground/50 blur-[3px]">{scenario.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1">
                          <p className="text-muted-foreground/30 text-sm line-clamp-3 blur-[4px]">
                            {scenario.content_json.situation}
                          </p>
                        </CardContent>
                        <CardFooter className="pt-4 border-t border-border/30 text-xs text-muted-foreground/30 flex justify-between items-center bg-muted/10">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{scenario.estimated_minutes || 2} {t("atelier.duration")}</span>
                          </div>
                        </CardFooter>
                        <LockOverlay
                          requiredTier="traveller"
                          teaser={t("atelier.lock.teaser")}
                          isAuthenticated={isAuthenticated}
                        />
                      </Card>
                    </Link>
                  );
                })}
              </div>

              <TierGate feature="Advanced Scenarios" requiredTier="traveller" isAuthenticated={isAuthenticated} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * VisitorAtelierTeaser
 * --------------------
 * Inline preview block shown to unauthenticated visitors so the Atelier
 * page does not feel empty. Three feature cards summarise what registered
 * users get, followed by a faded "behind glass" mock of a live learning
 * session with a lock-overlay register CTA on top.
 */
function VisitorAtelierTeaser({
  t,
}: {
  t: (k: string, v?: Record<string, string | number> | string) => string;
}) {
  return (
    <section className="space-y-8" aria-labelledby="atelier-visitor-teaser-heading">
      <header className="space-y-1">
        <h2
          id="atelier-visitor-teaser-heading"
          className="font-serif text-2xl text-foreground flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
          {t("atelier.guest.teaser.heading")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("atelier.guest.teaser.subtitle")}
        </p>
      </header>

      {/* Three feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-base flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" aria-hidden="true" />
              {t("atelier.guest.teaser.feat1.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed">
            {t("atelier.guest.teaser.feat1.body")}
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              {t("atelier.guest.teaser.feat2.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed">
            {t("atelier.guest.teaser.feat2.body")}
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-base flex items-center gap-2">
              <Users2 className="w-4 h-4 text-primary" aria-hidden="true" />
              {t("atelier.guest.teaser.feat3.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed">
            {t("atelier.guest.teaser.feat3.body")}
          </CardContent>
        </Card>
      </div>

      {/* Faded mock of a live session, with a lock-overlay register CTA. */}
      <div className="relative rounded-sm border border-border/40 bg-muted/10 overflow-hidden">
        {/* Mock content (decorative — visually only, behind a fade + lock) */}
        <div
          aria-hidden="true"
          className="p-6 space-y-5 blur-[2px] opacity-70 select-none pointer-events-none"
        >
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            <span className="px-2 py-0.5 rounded-sm bg-primary/10 text-primary">
              {t("atelier.guest.teaser.mock.register_label")}
            </span>
            <span>·</span>
            <span>{t("atelier.guest.teaser.mock.phase_label")}</span>
            <span>·</span>
            <span>{t("atelier.guest.teaser.mock.pillar_label")}</span>
          </div>

          <div>
            <h3 className="font-serif text-xl text-foreground mb-2">
              {t("atelier.guest.teaser.mock.question")}
            </h3>
            <div className="space-y-2">
              {[
                "atelier.guest.teaser.mock.opt1",
                "atelier.guest.teaser.mock.opt2",
                "atelier.guest.teaser.mock.opt3",
                "atelier.guest.teaser.mock.opt4",
              ].map((k) => (
                <div
                  key={k}
                  className="flex items-center gap-3 px-4 py-3 rounded-sm border border-border/40 bg-background/50 text-sm text-foreground/80"
                >
                  <span className="w-4 h-4 rounded-full border border-border/60 flex-shrink-0" />
                  <span>{t(k)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Faux pillar ladder */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/30">
            <span>P1</span>
            <span className="flex gap-1.5" aria-hidden="true">
              <span className="w-2 h-2 rounded-full bg-foreground/70" />
              <span className="w-2 h-2 rounded-full bg-foreground/70" />
              <span className="w-2 h-2 rounded-full bg-foreground/40" />
              <span className="w-2 h-2 rounded-full border border-foreground/40" />
              <span className="w-2 h-2 rounded-full border border-foreground/40" />
            </span>
            <span className="ml-2">3 / 5</span>
          </div>
        </div>

        {/* Lock + CTA overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-background/60 to-background/85">
          <div className="text-center space-y-4 px-6 max-w-md">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 border border-primary/30">
              <Lock className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
            <h3 className="font-serif text-xl text-foreground">
              {t("atelier.guest.teaser.cta_title")}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("atelier.guest.teaser.cta_body")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <Button asChild>
                <Link href="/register">{t("atelier.guest.create_account")}</Link>
              </Button>
              <Link
                href="/sign-in"
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                {t("atelier.guest.signin")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
