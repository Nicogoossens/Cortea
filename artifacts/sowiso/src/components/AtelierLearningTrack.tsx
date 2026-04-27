import { useState, useCallback } from "react";
import {
  useGetLearningTrackSession,
  usePostLearningTrackAnswer,
  useGetLearningTrackProgress,
  getGetLearningTrackSessionQueryKey,
  getGetLearningTrackProgressQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FlagEmoji } from "@/lib/active-region";
import { SOCIAL_CLASS_CONFIG } from "@/lib/social-class-config";
import {
  BookOpen, RotateCcw, Trophy, ChevronRight,
  CheckCircle2, XCircle, AlertCircle, Sparkles, ArrowRight,
} from "lucide-react";
import type { RegionCode } from "@/lib/active-region";

interface Props {
  tier: "traveller" | "ambassador";
  activeRegion: RegionCode;
  lang: string;
}

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

export function AtelierLearningTrack({ tier, activeRegion, lang }: Props) {
  const queryClient = useQueryClient();

  const [register, setRegister] = useState<Register>("middle_class");
  const [phase, setPhase] = useState<number>(1);
  const [researchPillar, setResearchPillar] = useState<string>("P1");

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
  } | null>(null);

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
        });
        setAnswered(true);
        queryClient.invalidateQueries({ queryKey: getGetLearningTrackProgressQueryKey() });
      },
    },
  });

  const currentQuestion = session?.questions[currentQuestionIdx];

  function handleRegisterChange(r: Register) {
    setRegister(r);
    setPhase(1);
    setResearchPillar("P1");
    resetQuestion();
  }

  function handlePhaseChange(p: number) {
    setPhase(p);
    resetQuestion();
  }

  function handlePillarChange(p: string) {
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

  return (
    <div className="space-y-6">
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
              <CardContent className="py-12 text-center space-y-3">
                <BookOpen className="w-10 h-10 mx-auto opacity-20" aria-hidden="true" />
                <p className="font-serif text-lg text-foreground/70">
                  De leertrajecten voor{" "}
                  <span className="inline-flex items-center gap-1">
                    <FlagEmoji code={activeRegion} className="text-base" />
                    <span>{activeRegion}</span>
                  </span>{" "}
                  zijn in voorbereiding.
                </p>
                <p className="text-sm text-muted-foreground">
                  Wil je alvast een andere regio verkennen? Wijzig je actieve regio via de contextbalk.
                </p>
              </CardContent>
            </Card>
          ) : feedback?.mastered ? (
            <Card className="border-amber-400/40 bg-amber-50/20 dark:bg-amber-950/10">
              <CardContent className="py-12 text-center space-y-4">
                <Trophy className="w-12 h-12 mx-auto text-amber-500" aria-hidden="true" />
                <h3 className="font-serif text-2xl text-foreground">
                  Niveau voltooid — Meesterschap bereikt
                </h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  Je beheerst dit leertraject. De badge-verwerking volgt zodra het badge-systeem actief is.
                </p>
                <Button
                  variant="outline"
                  onClick={resetQuestion}
                  className="font-serif gap-2"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  Opnieuw starten
                </Button>
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

      {/* ── Progress overview (all pillars) for middle_class ── */}
      {register === "middle_class" && progressData && progressData.some((p) => p.register === "middle_class") && (
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
