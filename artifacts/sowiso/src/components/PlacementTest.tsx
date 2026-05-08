import { useState, useCallback } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BookOpen,
  Award,
  ChevronRight,
  Loader2,
} from "lucide-react";
import type { RegionCode } from "@/lib/active-region";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface PlacementQuestion {
  id: number;
  question_text: string;
  historical_context: string | null;
  options: { text: string }[];
}

interface StartResponse {
  session_id: number;
  placement_root_id: number;
  current_level: number;
  lo: number;
  hi: number;
  total_answered: number;
  max_questions: number;
  questions: PlacementQuestion[];
}

interface AnswerResponse {
  correct: boolean;
  answer_tier: 1 | 2 | 3;
  motivation: string;
  historical_context: string | null;
  batch_complete: boolean;
  answered_in_batch: number;
  batch_size: number;
  placement_done?: boolean;
  placement_level?: number;
  total_answered?: number;
  next_level?: number;
  lo?: number;
  hi?: number;
  next_session_id?: number;
  questions?: PlacementQuestion[];
}

interface CompleteResponse {
  placement_level: number;
  noble_score_added: number;
  badge: { id: number; slug: string; title: string; description: string } | null;
  skipped_content_note: string | null;
}

type Phase =
  | "idle"
  | "loading"
  | "question"
  | "answered"
  | "batch_transition"
  | "completing"
  | "result"
  | "skip_confirm"
  | "error";

interface Props {
  register: "middle_class" | "elite";
  activeRegion: RegionCode;
  phase?: number;
  pillar?: string | null;
  lang: string;
  onSkip: () => void;
  onComplete: (placementLevel: number) => void;
}

export function PlacementTest({
  register,
  activeRegion,
  phase = 1,
  pillar = null,
  lang,
  onSkip,
  onComplete,
}: Props) {
  const { t } = useLanguage();

  const [uiPhase, setUiPhase] = useState<Phase>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<PlacementQuestion[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [lastAnswer, setLastAnswer] = useState<AnswerResponse | null>(null);

  const [totalAnswered, setTotalAnswered] = useState(0);
  const [maxQuestions] = useState(12);
  const [currentLevel, setCurrentLevel] = useState(3);

  const [result, setResult] = useState<CompleteResponse | null>(null);

  const handleError = useCallback((msg: string) => {
    setErrorMessage(msg);
    setUiPhase("error");
  }, []);

  const loadSession = useCallback((data: StartResponse) => {
    setSessionId(data.session_id);
    setQuestions(data.questions);
    setCurrentQuestionIdx(0);
    setSelectedOptionIdx(null);
    setLastAnswer(null);
    setTotalAnswered(data.total_answered);
    setCurrentLevel(data.current_level);
    setUiPhase("question");
  }, []);

  const resumeSession = useCallback(async (openSessionId: number) => {
    setUiPhase("loading");
    try {
      const resp = await fetch(`${API_BASE}/api/sessions/placement/${openSessionId}`, {
        credentials: "include",
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({})) as { error?: string };
        handleError(body.error ?? t("placement.error_generic"));
        return;
      }
      const data = await resp.json() as StartResponse;
      loadSession(data);
    } catch {
      handleError(t("placement.error_generic"));
    }
  }, [handleError, t, loadSession]);

  const startAssessment = useCallback(async () => {
    setUiPhase("loading");
    setErrorMessage(null);
    try {
      const resp = await fetch(`${API_BASE}/api/sessions/placement/start`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          register,
          region_code: activeRegion,
          pillar: pillar ?? null,
          phase,
          lang: lang.split("-")[0],
        }),
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({})) as { error?: string; code?: string; session_id?: number };
        if (resp.status === 409 && body.code === "PLACEMENT_IN_PROGRESS") {
          if (body.session_id) {
            await resumeSession(body.session_id);
          } else {
            handleError(t("placement.error_generic"));
          }
          return;
        }
        if (resp.status === 422 && body.code === "NO_QUESTIONS") {
          handleError(t("placement.error_no_questions"));
          return;
        }
        handleError(body.error ?? t("placement.error_generic"));
        return;
      }

      const data = await resp.json() as StartResponse;
      loadSession(data);
    } catch {
      handleError(t("placement.error_generic"));
    }
  }, [register, activeRegion, pillar, phase, lang, handleError, t, resumeSession, loadSession]);

  const submitAnswer = useCallback(async () => {
    if (selectedOptionIdx === null || sessionId === null) return;
    const question = questions[currentQuestionIdx];
    if (!question) return;

    setUiPhase("answered");
    try {
      const resp = await fetch(`${API_BASE}/api/sessions/placement/answer`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          question_id: question.id,
          selected_option_index: selectedOptionIdx,
        }),
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({})) as { error?: string };
        handleError(body.error ?? t("placement.error_generic"));
        return;
      }

      const data = await resp.json() as AnswerResponse;
      setLastAnswer(data);
      setTotalAnswered((prev) => prev + 1);

      if (data.batch_complete && data.placement_done) {
        await completeSession(data.placement_level ?? 1);
        return;
      }
    } catch {
      handleError(t("placement.error_generic"));
    }
  }, [selectedOptionIdx, sessionId, questions, currentQuestionIdx, handleError, t]);

  const abortAndSkip = useCallback(async () => {
    if (sessionId !== null) {
      try {
        await fetch(`${API_BASE}/api/sessions/placement/abort`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
      } catch {
        // Best-effort — proceed with skip even if abort request fails
      }
    }
    onSkip();
  }, [sessionId, onSkip]);

  const completeSession = useCallback(async (_placementLevel: number) => {
    if (sessionId === null) return;
    setUiPhase("completing");
    try {
      const resp = await fetch(`${API_BASE}/api/sessions/placement/complete`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({})) as { error?: string };
        handleError(body.error ?? t("placement.error_generic"));
        return;
      }

      const data = await resp.json() as CompleteResponse;
      setResult(data);
      setUiPhase("result");
    } catch {
      handleError(t("placement.error_generic"));
    }
  }, [sessionId, register, activeRegion, pillar, phase, handleError, t]);

  const handleNext = useCallback(async () => {
    if (!lastAnswer) return;

    if (lastAnswer.batch_complete && !lastAnswer.placement_done) {
      setUiPhase("batch_transition");
      if (lastAnswer.next_session_id && lastAnswer.questions) {
        setSessionId(lastAnswer.next_session_id);
        setQuestions(lastAnswer.questions);
        setCurrentQuestionIdx(0);
        setSelectedOptionIdx(null);
        setLastAnswer(null);
        if (lastAnswer.next_level !== undefined) setCurrentLevel(lastAnswer.next_level);
        setUiPhase("question");
      } else {
        handleError(t("placement.error_generic"));
      }
      return;
    }

    const nextIdx = currentQuestionIdx + 1;
    if (nextIdx < questions.length) {
      setCurrentQuestionIdx(nextIdx);
      setSelectedOptionIdx(null);
      setLastAnswer(null);
      setUiPhase("question");
    }
  }, [lastAnswer, currentQuestionIdx, questions, handleError, t]);

  const currentQuestion = questions[currentQuestionIdx];
  const isAnswered = uiPhase === "answered";
  const isLoading = uiPhase === "loading" || uiPhase === "completing" || uiPhase === "batch_transition";

  function tierBadge(tier: 1 | 2 | 3) {
    if (tier === 1) return "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-800/40";
    if (tier === 2) return "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-800/40";
    return "text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950/30 dark:border-rose-800/40";
  }

  if (uiPhase === "idle") {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-xs font-medium text-primary/80 tracking-wide uppercase">
            {t("placement.mode_label")}
          </div>
          <h2 className="text-2xl font-serif text-foreground">{t("placement.title")}</h2>
          <p className="text-muted-foreground text-sm font-light leading-relaxed max-w-md mx-auto">
            {t("placement.subtitle")}
          </p>
        </div>

        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          <Button onClick={startAssessment} className="w-full">
            {t("placement.confirm")}
            <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
          </Button>
          <button
            type="button"
            onClick={() => setUiPhase("skip_confirm")}
            className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
          >
            {t("placement.skip_title")}
          </button>
        </div>
      </div>
    );
  }

  if (uiPhase === "skip_confirm") {
    return (
      <div className="space-y-6 animate-in fade-in duration-200 max-w-md mx-auto">
        <div className="flex items-start gap-3 p-4 rounded-sm border border-amber-500/30 bg-amber-50/50 dark:bg-amber-900/10">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{t("placement.skip_title")}</p>
            <p className="text-xs text-muted-foreground font-light leading-relaxed">{t("placement.skip_body")}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setUiPhase("idle")} className="flex-1">
            {t("placement.skip_cancel")}
          </Button>
          <Button variant="destructive" onClick={() => void abortAndSkip()} className="flex-1">
            {t("placement.skip_confirm")}
          </Button>
        </div>
      </div>
    );
  }

  if (uiPhase === "error") {
    return (
      <div className="space-y-4 text-center py-8 animate-in fade-in duration-200">
        <XCircle className="w-10 h-10 text-destructive mx-auto" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">{errorMessage ?? t("placement.error_generic")}</p>
        <Button variant="outline" size="sm" onClick={() => setUiPhase("idle")}>
          {t("placement.retry")}
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 animate-in fade-in duration-200">
        <Loader2 className="w-8 h-8 animate-spin text-primary/60" aria-hidden="true" />
        <p className="text-sm text-muted-foreground font-light">
          {uiPhase === "batch_transition" ? t("placement.batch_loading") : t("placement.loading")}
        </p>
      </div>
    );
  }

  if (uiPhase === "result" && result) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300 max-w-md mx-auto text-center">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-xs font-medium text-primary/80 tracking-wide uppercase">
            {t("placement.mode_label")}
          </div>
          <h2 className="text-2xl font-serif text-foreground">{t("placement.result_title")}</h2>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full border-2 border-primary/30 flex items-center justify-center bg-primary/5">
            <span className="text-3xl font-serif text-primary">{result.placement_level}</span>
          </div>
          <p className="text-lg font-medium text-foreground">
            {t("placement.result_level", { level: String(result.placement_level) })}
          </p>
        </div>

        {result.badge && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-sm border border-primary/20 bg-primary/5">
            <Award className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">{t("placement.result_badge")}</p>
              <p className="text-xs text-muted-foreground">{result.badge.title}</p>
            </div>
          </div>
        )}

        {result.noble_score_added > 0 && (
          <p className="text-sm text-muted-foreground">
            {t("placement.result_noble_added", { points: String(result.noble_score_added) })}
          </p>
        )}

        {result.skipped_content_note && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{t("placement.result_library_note")}</p>
            <Link
              to="/atelier"
              className="inline-flex items-center gap-1 text-sm text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
            >
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              {t("placement.result_library_link")}
            </Link>
          </div>
        )}

        <Button className="w-full" onClick={() => onComplete(result.placement_level)}>
          {t("placement.complete_cta")}
          <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
        </Button>
      </div>
    );
  }

  if ((uiPhase === "question" || uiPhase === "answered") && currentQuestion) {
    const displayAnswered = totalAnswered;

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-xs font-medium text-primary/80 tracking-wide uppercase">
            {t("placement.mode_label")}
          </div>
          <div className="text-xs text-muted-foreground">
            {t("placement.question_counter", {
              current: String(displayAnswered + 1),
              max: String(maxQuestions),
            })}
          </div>
        </div>

        <div className="w-full bg-border/30 rounded-full h-1">
          <div
            className="bg-primary h-1 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (displayAnswered / maxQuestions) * 100)}%` }}
            role="progressbar"
            aria-valuenow={displayAnswered}
            aria-valuemax={maxQuestions}
          />
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground/70 uppercase tracking-wide font-light">
            {t("placement.level_indicator", { level: String(currentLevel) })}
          </p>
          <p className="text-base font-medium text-foreground leading-relaxed">
            {currentQuestion.question_text}
          </p>
          {currentQuestion.historical_context && !isAnswered && (
            <p className="text-xs text-muted-foreground font-light leading-relaxed mt-2">
              {currentQuestion.historical_context}
            </p>
          )}
        </div>

        <div className="space-y-2">
          {currentQuestion.options.map((opt, idx) => {
            let optStyle = "w-full text-left px-4 py-3 rounded-sm border text-sm transition-all duration-150 ";
            if (!isAnswered) {
              optStyle +=
                selectedOptionIdx === idx
                  ? "border-primary bg-primary/10 text-foreground font-medium"
                  : "border-border/60 bg-background hover:border-primary/40 hover:bg-primary/5 text-foreground/90 cursor-pointer";
            } else if (lastAnswer) {
              const isSelected = selectedOptionIdx === idx;
              if (isSelected && lastAnswer.correct) {
                optStyle += `border ${tierBadge(1)} font-medium`;
              } else if (isSelected && !lastAnswer.correct) {
                optStyle += `border ${tierBadge(lastAnswer.answer_tier)} font-medium`;
              } else {
                optStyle += "border-border/30 bg-muted/20 text-muted-foreground cursor-default";
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={isAnswered}
                onClick={() => !isAnswered && setSelectedOptionIdx(idx)}
                className={optStyle}
                aria-pressed={selectedOptionIdx === idx}
              >
                <span className="flex items-center gap-3">
                  <span className="w-5 h-5 shrink-0 rounded-full border border-current/40 flex items-center justify-center text-xs font-mono">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {opt.text}
                </span>
              </button>
            );
          })}
        </div>

        {isAnswered && lastAnswer && (
          <div
            className={`p-3 rounded-sm border text-sm flex items-start gap-2 animate-in fade-in duration-200 ${
              lastAnswer.correct
                ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-950/20"
                : "border-rose-200 bg-rose-50 dark:border-rose-800/40 dark:bg-rose-950/20"
            }`}
          >
            {lastAnswer.correct ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <p className="leading-relaxed text-foreground/80">{lastAnswer.motivation}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => setUiPhase("skip_confirm")}
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground underline underline-offset-2 transition-colors"
          >
            {t("placement.skip_title")}
          </button>

          {!isAnswered ? (
            <Button
              onClick={submitAnswer}
              disabled={selectedOptionIdx === null}
              size="sm"
            >
              {t("placement.confirm")}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              size="sm"
            >
              {t("placement.next")}
              <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
