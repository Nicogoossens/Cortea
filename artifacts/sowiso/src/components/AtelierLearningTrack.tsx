import { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  useGetLearningTrackSession,
  usePostLearningTrackAnswer,
  useGetLearningTrackProgress,
  getGetLearningTrackSessionQueryKey,
  getGetLearningTrackProgressQueryKey,
  getGetLearningTrackBadgesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FlagEmoji, useActiveRegion, COMPASS_REGIONS, ACTIVE_REGIONS } from "@/lib/active-region";
import { SOCIAL_CLASS_CONFIG } from "@/lib/social-class-config";
import {
  BookOpen, RotateCcw, Trophy, ChevronRight,
  CheckCircle2, XCircle, AlertCircle, Sparkles, ArrowRight,
  X, Compass,
} from "lucide-react";
import type { RegionCode } from "@/lib/active-region";

interface Props {
  tier: "traveller" | "ambassador";
  activeRegion: RegionCode;
  lang: string;
  ambitionLevel?: "casual" | "professional" | "diplomatic";
  gender?: string | null;
  ageGroup?: string | null;
}

const AMBITION_LABELS: Record<string, string> = {
  casual: "Casual",
  professional: "Professioneel",
  diplomatic: "Diplomatisch",
};

const START_CARD_KEY = "cortea_start_card_v1";

type Register = "middle_class" | "elite";

const MIDDLE_CLASS_PHASES = SOCIAL_CLASS_CONFIG.middle_class.phases;
const ELITE_PILLARS = SOCIAL_CLASS_CONFIG.elite.pillars;
const RESEARCH_PILLARS = SOCIAL_CLASS_CONFIG.middle_class.researchPillars;

function tierBadgeColor(tier: 1 | 2 | 3): string {
  if (tier === 1) return "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/30 dark:border-green-800/40";
  if (tier === 2) return "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-800/40";
  return "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/30 dark:border-red-800/40";
}

function progressPercent(level: number, streak: number): number {
  const base = ((level - 1) / 5) * 100;
  const streakBonus = Math.max(0, streak / 4) * (100 / 5);
  return Math.min(100, Math.round(base + streakBonus));
}

export function AtelierLearningTrack({ tier, activeRegion, lang, ambitionLevel = "casual", gender, ageGroup }: Props) {
  const queryClient = useQueryClient();
  const { setActiveRegion, getRegionName } = useActiveRegion();

  const [register, setRegister] = useState<Register>(() => {
    if (ambitionLevel === "diplomatic" && tier === "ambassador") return "elite";
    return "middle_class";
  });
  const [phase, setPhase] = useState<number>(1);
  const [researchPillar, setResearchPillar] = useState<string>("P1");

  const hasAppliedAutoSelect = useRef(false);
  const hasManuallyChanged = useRef(false);

  const [showStartCard, setShowStartCard] = useState<boolean>(
    () => !localStorage.getItem(START_CARD_KEY)
  );

  function dismissStartCard() {
    localStorage.setItem(START_CARD_KEY, "1");
    setShowStartCard(false);
  }

  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    answer_tier: 1 | 2 | 3;
    motivation: string;
    historical_context: string | null;
    level_up: boolean;
    mastered: boolean;
    repeat: boolean;
    new_badges: Array<{ id: number; slug: string; title: string; description: string; badge_type: string }>;
  } | null>(null);

  useEffect(() => {
    if (!progressData || hasAppliedAutoSelect.current || hasManuallyChanged.current) return;
    hasAppliedAutoSelect.current = true;

    if (ambitionLevel === "professional") {
      const highestMastered = progressData
        .filter((p) => p.mastered && p.register === "middle_class")
        .reduce((max, p) => Math.max(max, p.phase), 0);
      // Default minimum for professional is Fase 2, even without prior progress
      const suggestedPhase = Math.min(Math.max(highestMastered + 1, 2), 5);
      setPhase(suggestedPhase);
    } else if (ambitionLevel === "diplomatic" && tier === "ambassador") {
      // register already "elite" via useState initializer — nothing else needed
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressData]);

  const sessionParams = {
    register,
    phase,
    region_code: activeRegion,
    lang: lang.split("-")[0],
    ...(register === "middle_class" ? { research_pillar: researchPillar } : {}),
  };

  const { data: session, isLoading: sessionLoading } = useGetLearningTrackSession(sessionParams, {
    query: { queryKey: [...getGetLearningTrackSessionQueryKey(sessionParams)], staleTime: 0 },
  });

  const { data: progressData } = useGetLearningTrackProgress();

  const { mutate: submitAnswer, isPending: submitting } = usePostLearningTrackAnswer({
    mutation: {
      onSuccess: (result) => {
        setFeedback({
          correct: result.correct,
          answer_tier: result.answer_tier,
          motivation: result.motivation,
          historical_context: result.historical_context ?? null,
          level_up: result.level_up,
          mastered: result.mastered,
          repeat: result.repeat,
          new_badges: result.new_badges ?? [],
        });
        setAnswered(true);
        queryClient.invalidateQueries({ queryKey: getGetLearningTrackProgressQueryKey() });
        if (result.mastered && (result.new_badges ?? []).length > 0) {
          queryClient.invalidateQueries({ queryKey: getGetLearningTrackBadgesQueryKey() });
        }
      },
    },
  });

  const currentQuestion = session?.questions[currentQuestionIdx];

  function handleRegisterChange(r: Register) {
    hasManuallyChanged.current = true;
    setRegister(r);
    setPhase(1);
    setResearchPillar("P1");
    resetQuestion();
  }

  function handlePhaseChange(p: number) {
    hasManuallyChanged.current = true;
    setPhase(p);
    resetQuestion();
  }

  function handlePillarChange(p: string) {
    hasManuallyChanged.current = true;
    setResearchPillar(p);
    resetQuestion();
  }

  function resetQuestion() {
    setSelectedOptionIdx(null);
    setAnswered(false);
    setFeedback(null);
    setCurrentQuestionIdx(0);
  }

  function handleConfirm() {
    if (selectedOptionIdx === null || !currentQuestion) return;
    submitAnswer({
      data: {
        question_id: currentQuestion.id,
        selected_option_index: selectedOptionIdx,
        register,
        research_pillar: register === "middle_class" ? researchPillar : null,
        phase,
      },
    });
  }

  function handleNext() {
    if (feedback?.mastered) return;
    const nextIdx = currentQuestionIdx + 1;
    if (session && nextIdx < session.questions.length) {
      setCurrentQuestionIdx(nextIdx);
      setSelectedOptionIdx(null);
      setAnswered(false);
      setFeedback(null);
    } else {
      queryClient.invalidateQueries({ queryKey: getGetLearningTrackSessionQueryKey(sessionParams) });
      resetQuestion();
    }
  }

  const getProgressForCurrentTrack = useCallback(() => {
    if (!progressData) return null;
    return progressData.find(
      (p) =>
        p.register === register &&
        p.phase === phase &&
        (register === "middle_class" ? p.research_pillar === researchPillar : !p.research_pillar),
    );
  }, [progressData, register, phase, researchPillar]);

  const currentProgress = getProgressForCurrentTrack();

  const phaseOptions = register === "middle_class"
    ? MIDDLE_CLASS_PHASES.map((ph) => ({ value: ph.phase, label: ph.domainName, subtitle: ph.focus.split(" — ")[0] }))
    : ELITE_PILLARS.map((p) => ({ value: p.pillar, label: p.domainName, subtitle: p.internalName }));

  const pillarEntries = Object.entries(RESEARCH_PILLARS).filter(([key]) =>
    ["P1", "P2", "P3"].includes(key)
  );

  function getPillarProgress(pillar: string) {
    if (!progressData) return null;
    return progressData.find(
      (p) => p.register === "middle_class" && p.phase === phase && p.research_pillar === pillar,
    );
  }

  const currentPhaseName = register === "middle_class"
    ? (MIDDLE_CLASS_PHASES.find((p) => p.phase === phase)?.domainName ?? `Fase ${phase}`)
    : (ELITE_PILLARS.find((p) => p.pillar === phase)?.domainName ?? `Pillar ${phase}`);

  const activeRegionsList = COMPASS_REGIONS.filter((r) => ACTIVE_REGIONS.has(r.code) && r.code !== activeRegion);

  return (
    <div className="space-y-6">
      {/* ── "Jouw startpunt" personalized card ── */}
      {showStartCard && (
        <div className="relative flex items-start gap-4 px-5 py-4 rounded-sm border border-primary/20 bg-primary/5 text-sm animate-in fade-in duration-300">
          <Compass className="w-5 h-5 mt-0.5 flex-shrink-0 text-primary/60" aria-hidden="true" />
          <div className="flex-1 space-y-1">
            <p className="font-medium text-foreground/90">
              Op basis van jouw profiel{" "}
              <span className="text-muted-foreground font-normal">
                ({[
                  AMBITION_LABELS[ambitionLevel] ?? ambitionLevel,
                  getRegionName(activeRegion),
                  gender ?? null,
                  ageGroup ?? null,
                ].filter(Boolean).join(" · ")})
              </span>{" "}
              adviseren we te starten bij{" "}
              <span className="font-serif text-primary">
                {register === "elite" ? "Elite — " : ""}{currentPhaseName}
              </span>.
            </p>
            <button
              onClick={dismissStartCard}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Kies zelf je startpunt
            </button>
          </div>
          <button
            onClick={dismissStartCard}
            aria-label="Kaart sluiten"
            className="flex-shrink-0 p-1 rounded-sm text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* ── Register selector (Ambassador sees both) ── */}
      {tier === "ambassador" && (
        <div className="flex gap-2" role="tablist" aria-label="Learning track register">
          {(["middle_class", "elite"] as Register[]).map((r) => (
            <button
              key={r}
              role="tab"
              aria-selected={register === r}
              onClick={() => handleRegisterChange(r)}
              className={`px-5 py-2 text-xs font-mono uppercase tracking-widest rounded-sm border transition-colors ${
                register === r
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {r === "middle_class" ? "Middenklasse" : "Elite"}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Phase / Pillar selector ── */}
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {register === "middle_class" ? "Fase" : "Pillar"}
            </p>
            <div className="space-y-1.5">
              {phaseOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handlePhaseChange(opt.value)}
                  className={`w-full text-left px-3 py-2.5 rounded-sm border text-sm transition-all ${
                    phase === opt.value
                      ? "border-primary bg-primary/5 text-primary font-medium"
                      : "border-border/40 text-foreground/70 hover:border-primary/30 hover:text-foreground hover:bg-muted/20"
                  }`}
                >
                  <span className="font-serif">{opt.label}</span>
                  <span className="block text-[10px] font-mono text-muted-foreground/70 mt-0.5 truncate">
                    {opt.subtitle}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {register === "middle_class" && (
            <div className="space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Research Pillar
              </p>
              <div className="space-y-1.5">
                {pillarEntries.map(([key, label]) => {
                  const pp = getPillarProgress(key);
                  const level = pp?.current_level ?? 1;
                  const mastered = pp?.mastered ?? false;
                  return (
                    <button
                      key={key}
                      onClick={() => handlePillarChange(key)}
                      className={`w-full text-left px-3 py-2 rounded-sm border text-xs transition-all ${
                        researchPillar === key && register === "middle_class"
                          ? "border-primary bg-primary/5 text-primary font-medium"
                          : "border-border/40 text-foreground/70 hover:border-primary/30 hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-semibold">{key}</span>
                        {mastered ? (
                          <Trophy className="w-3 h-3 text-amber-500" aria-label="Mastered" />
                        ) : (
                          <span className="text-[10px] text-muted-foreground/60">Lvl {level}/5</span>
                        )}
                      </div>
                      <span className="font-light text-muted-foreground/80 truncate">{label}</span>
                      <div className="mt-1.5 h-1 bg-border/30 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${mastered ? "bg-amber-500" : "bg-primary/60"}`}
                          style={{ width: `${mastered ? 100 : ((level - 1) / 5) * 100}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Question card ── */}
        <div className="lg:col-span-2 space-y-4">
          {sessionLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-32 rounded-sm" />
              <Skeleton className="h-12 rounded-sm" />
              <Skeleton className="h-12 rounded-sm" />
              <Skeleton className="h-12 rounded-sm" />
            </div>
          ) : !session?.has_questions ? (
            <Card className="border-dashed border-border/50 bg-card/40">
              <CardContent className="py-10 space-y-5">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-8 h-8 opacity-20 flex-shrink-0" aria-hidden="true" />
                  <div>
                    <p className="font-serif text-lg text-foreground/80">
                      <span className="inline-flex items-center gap-1.5">
                        <FlagEmoji code={activeRegion} className="text-base" />
                        <span>{getRegionName(activeRegion)}</span>
                      </span>{" "}
                      — inhoud volgt binnenkort.
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Leertrajecten voor deze regio zijn in voorbereiding.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
                    Beschikbare regio's
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {activeRegionsList.map((region) => (
                      <button
                        key={region.code}
                        onClick={() => setActiveRegion(region.code)}
                        title={getRegionName(region.code)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-border/50 text-xs text-foreground/70 hover:border-primary/40 hover:text-foreground hover:bg-muted/20 transition-all"
                      >
                        <FlagEmoji code={region.code} className="text-sm" />
                        <span className="font-mono">{region.code}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Link href="/profile">
                  <Button variant="outline" size="sm" className="gap-2 font-serif text-xs">
                    <Compass className="w-3.5 h-3.5" aria-hidden="true" />
                    Regio wijzigen in profiel
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : feedback?.mastered ? (
            <Card className="border-amber-400/40 bg-amber-50/20 dark:bg-amber-950/10">
              <CardContent className="py-10 text-center space-y-5">
                <Trophy className="w-12 h-12 mx-auto text-amber-500" aria-hidden="true" />
                <h3 className="font-serif text-2xl text-foreground">
                  Niveau voltooid — Meesterschap bereikt
                </h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  Je beheerst dit leertraject volledig.
                  {feedback.new_badges.length > 0
                    ? " Je hebt een badge verdiend."
                    : ""}
                </p>

                {/* Badge notification */}
                {feedback.new_badges.length > 0 && (
                  <div className="space-y-2 max-w-xs mx-auto text-left">
                    {feedback.new_badges.map((badge) => (
                      <div
                        key={badge.slug}
                        className="flex items-start gap-3 px-4 py-3 rounded-sm border border-amber-300/50 bg-amber-50/40 dark:bg-amber-950/20"
                      >
                        <span className="text-xl shrink-0" aria-hidden="true">
                          {badge.badge_type === "pillar" ? "🏅"
                            : badge.badge_type === "phase" ? "🏆"
                            : badge.badge_type === "country" ? "🌟"
                            : "🎖️"}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-foreground leading-tight">{badge.title}</p>
                          <p className="text-[10px] text-muted-foreground/70 mt-0.5 leading-snug">{badge.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <Button
                    variant="outline"
                    onClick={resetQuestion}
                    className="font-serif gap-2"
                  >
                    <RotateCcw className="w-4 h-4" aria-hidden="true" />
                    Opnieuw starten
                  </Button>
                  {feedback.new_badges.length > 0 && (
                    <Link href="/profile#badges">
                      <Button variant="default" className="font-serif gap-2">
                        <Trophy className="w-4 h-4" aria-hidden="true" />
                        Bekijk mijn badges
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Progress indicator */}
              <div className="flex items-center justify-between text-xs font-mono text-muted-foreground/70">
                <span>
                  Vraag {currentQuestionIdx + 1} van {session?.questions.length ?? 0}
                  {" · "}
                  Level {currentProgress?.current_level ?? 1}
                  {" · "}
                  {register === "middle_class"
                    ? (RESEARCH_PILLARS[researchPillar] ?? researchPillar)
                    : (ELITE_PILLARS.find((p) => p.pillar === phase)?.internalName ?? "")}
                </span>
                {session?.repeat && (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <RotateCcw className="w-3 h-3" aria-hidden="true" />
                    Herhaling
                  </span>
                )}
              </div>

              {/* Level up banner */}
              {feedback?.level_up && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-sm border border-green-300/40 bg-green-50/40 dark:bg-green-950/20 text-green-700 dark:text-green-400 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300">
                  <Sparkles className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  Level {(currentProgress?.current_level ?? 2)} bereikt!
                </div>
              )}

              {/* Repeat banner */}
              {session?.repeat && !feedback && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-sm border border-amber-300/40 bg-amber-50/30 dark:bg-amber-950/10 text-amber-700 dark:text-amber-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  Laten we dit nog eens bekijken — dezelfde type vragen opnieuw.
                </div>
              )}

              {/* Question card */}
              {currentQuestion && (
                <Card className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-widest rounded-sm">
                        {register === "middle_class"
                          ? `${researchPillar} · ${MIDDLE_CLASS_PHASES.find((p) => p.phase === phase)?.domainName}`
                          : ELITE_PILLARS.find((p) => p.pillar === phase)?.domainName}
                      </Badge>
                    </div>
                    <CardTitle className="font-serif text-lg leading-snug font-normal">
                      {currentQuestion.question_text}
                    </CardTitle>
                    {currentQuestion.historical_context && !answered && (
                      <p className="text-xs text-muted-foreground/60 font-light italic mt-1 leading-relaxed">
                        {currentQuestion.historical_context}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    {currentQuestion.options.map((opt, idx) => {
                      const isSelected = selectedOptionIdx === idx;
                      const isAnswered = answered;
                      const isCorrectAnswer = isAnswered && feedback && idx === selectedOptionIdx && feedback.answer_tier === 1;
                      const isWrongAnswer = isAnswered && feedback && idx === selectedOptionIdx && feedback.answer_tier === 3;
                      const isAcceptable = isAnswered && feedback && idx === selectedOptionIdx && feedback.answer_tier === 2;

                      return (
                        <button
                          key={idx}
                          disabled={isAnswered}
                          onClick={() => !isAnswered && setSelectedOptionIdx(idx)}
                          className={`w-full text-left px-4 py-3 rounded-sm border text-sm transition-all duration-200 flex items-start gap-3 ${
                            isCorrectAnswer
                              ? "border-green-400/60 bg-green-50/50 dark:bg-green-950/20 text-foreground"
                              : isWrongAnswer
                                ? "border-red-400/60 bg-red-50/50 dark:bg-red-950/20 text-foreground"
                                : isAcceptable
                                  ? "border-amber-400/60 bg-amber-50/50 dark:bg-amber-950/20 text-foreground"
                                  : isSelected
                                    ? "border-primary bg-primary/5 text-foreground"
                                    : isAnswered
                                      ? "border-border/30 text-muted-foreground/50 cursor-not-allowed"
                                      : "border-border/50 hover:border-primary/40 hover:bg-muted/20 text-foreground cursor-pointer"
                          }`}
                          aria-pressed={isSelected}
                        >
                          <span className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors ${
                            isCorrectAnswer ? "border-green-500 bg-green-500" :
                            isWrongAnswer ? "border-red-500 bg-red-500" :
                            isAcceptable ? "border-amber-500 bg-amber-500" :
                            isSelected ? "border-primary bg-primary/20" :
                            "border-border/60"
                          }`}>
                            {(isCorrectAnswer) && <CheckCircle2 className="w-3 h-3 text-white" aria-hidden="true" />}
                            {(isWrongAnswer) && <XCircle className="w-3 h-3 text-white" aria-hidden="true" />}
                            {(isAcceptable) && <AlertCircle className="w-3 h-3 text-white" aria-hidden="true" />}
                          </span>
                          <span className="leading-snug">{opt.text}</span>
                        </button>
                      );
                    })}

                    {/* Feedback block */}
                    {answered && feedback && (
                      <div className={`mt-1 p-4 rounded-sm border space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300 ${tierBadgeColor(feedback.answer_tier)}`}>
                        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-widest">
                          {feedback.answer_tier === 1 && <><CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Uitstekend</>}
                          {feedback.answer_tier === 2 && <><AlertCircle className="w-4 h-4" aria-hidden="true" /> Aanvaardbaar</>}
                          {feedback.answer_tier === 3 && <><XCircle className="w-4 h-4" aria-hidden="true" /> Niet correct</>}
                        </div>
                        <p className="text-sm leading-relaxed">{feedback.motivation}</p>
                        {feedback.historical_context && (
                          <p className="text-xs opacity-80 font-light italic leading-relaxed border-t border-current/20 pt-2 mt-2">
                            {feedback.historical_context}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-1">
                      {!answered ? (
                        <Button
                          onClick={handleConfirm}
                          disabled={selectedOptionIdx === null || submitting}
                          className="font-serif gap-2 flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          {submitting ? "Verwerken…" : "Bevestig antwoord"}
                          {!submitting && <ChevronRight className="w-4 h-4" aria-hidden="true" />}
                        </Button>
                      ) : !feedback?.mastered ? (
                        <Button
                          onClick={handleNext}
                          className="font-serif gap-2 flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          {currentQuestionIdx + 1 < (session?.questions.length ?? 0)
                            ? "Volgende vraag"
                            : "Nieuwe sessie starten"}
                          <ArrowRight className="w-4 h-4" aria-hidden="true" />
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Overall progress bar */}
              {currentProgress && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest">
                    <span>Voortgang</span>
                    <span>
                      {currentProgress.mastered
                        ? "Voltooid"
                        : `Level ${currentProgress.current_level} / 5 · ${currentProgress.questions_done} vragen`}
                    </span>
                  </div>
                  <div className="h-1.5 bg-border/30 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${currentProgress.mastered ? "bg-amber-500" : "bg-primary/70"}`}
                      style={{ width: `${currentProgress.mastered ? 100 : progressPercent(currentProgress.current_level, currentProgress.correct_streak)}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Progress overview (all pillars) for middle_class — always shown so "not started" is visible ── */}
      {register === "middle_class" && (
        <div className="space-y-3 pt-2 border-t border-border/30">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
            Voortgang per Research Pillar — Fase {phase}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {pillarEntries.map(([key, label]) => {
              const pp = getPillarProgress(key);
              const level = pp?.current_level ?? 0;
              const mastered = pp?.mastered ?? false;
              const started = !!pp;
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium">
                      {key} <span className="font-light text-muted-foreground/70">{label}</span>
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground/60">
                      {mastered ? "✓ Voltooid" : started ? `Level ${level} / 5` : "Nog niet gestart"}
                    </span>
                  </div>
                  <div className="h-1 bg-border/30 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${mastered ? "bg-amber-500" : started ? "bg-primary/60" : "bg-transparent"}`}
                      style={{ width: `${mastered ? 100 : started ? ((level - 1) / 5) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
