import { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  useGetLearningTrackSession,
  usePostLearningTrackAnswer,
  useGetLearningTrackProgress,
  useGetLearningTrackNext,
  getGetLearningTrackSessionQueryKey,
  getGetLearningTrackProgressQueryKey,
  getGetLearningTrackBadgesQueryKey,
  getGetLearningTrackNextQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveRegion } from "@/lib/active-region";
import { useLanguage } from "@/lib/i18n";
import { SOCIAL_CLASS_CONFIG } from "@/lib/social-class-config";
import {
  BookOpen, RotateCcw, Trophy, ChevronRight,
  CheckCircle2, XCircle, AlertCircle, Sparkles, ArrowRight,
  X, Compass, Lock,
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


function startCardKey(ambition: string) {
  return `cortea_start_card_v1_${ambition}`;
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

export function AtelierLearningTrack({ tier, activeRegion, lang, ambitionLevel = "casual", gender, ageGroup }: Props) {
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const { setActiveRegion, getRegionName } = useActiveRegion();

  const [register, setRegister] = useState<Register>(() => {
    if (ambitionLevel === "diplomatic" && tier === "ambassador") return "elite";
    return "middle_class";
  });
  const [phase, setPhase] = useState<number>(() => {
    if (ambitionLevel === "professional") return 2;
    return 1;
  });
  const [researchPillar, setResearchPillar] = useState<string>("P1");

  const hasManuallyChanged = useRef(false);
  const lastAutoKey = useRef<string>("");
  // Tracks which session_id we have already aligned currentQuestionIdx to.
  // Without this, reloading mid-session always shows question[0] which has
  // already been answered → 409 ANSWER_ALREADY_RECORDED on the next submit.
  const syncedSessionId = useRef<number | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [showStartCard, setShowStartCard] = useState<boolean>(
    () => !localStorage.getItem(startCardKey(ambitionLevel))
  );

  useEffect(() => {
    setShowStartCard(!localStorage.getItem(startCardKey(ambitionLevel)));
  }, [ambitionLevel]);

  function dismissStartCard() {
    localStorage.setItem(startCardKey(ambitionLevel), "1");
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
    /** Set on the final answer of the session — drives the summary screen. */
    session_complete?: boolean;
    session_score_pct?: number | null;
    session_passed?: boolean | null;
    next_action?: "level_up" | "continue" | "remediation" | "mastered";
  } | null>(null);
  /** When the server returns 429 (daily cap or cooldown) we surface a banner. */
  const [limitInfo, setLimitInfo] = useState<{
    reason: "daily_limit" | "cooldown";
    retryAfterSeconds: number;
    sessionsToday: number;
    dailyLimit: number;
  } | null>(null);
  /**
   * When the server returns 403 we distinguish two cases so the user is
   * routed to the right remedy:
   *   - `tier`   → upgrade card, deep-links to /membership
   *   - `region` → "add this country to your interests" card, deep-links
   *                to the profile country picker.
   */
  const [accessDenial, setAccessDenial] = useState<
    | { kind: "tier"; register: Register }
    | { kind: "region"; regionCode: string }
    | null
  >(null);
  /** True once the user clicks "Show context" on a repetition question. */
  // Repetition gate: when a question is a repeat, the user MUST explicitly
  // acknowledge the study_context before the answer options become tappable.
  // Resets every time a new question is shown.
  const [studyAcknowledged, setStudyAcknowledged] = useState(false);

  const sessionParams = {
    register,
    phase,
    region_code: activeRegion,
    lang: lang.split("-")[0],
    ...(register === "middle_class" ? { research_pillar: researchPillar } : {}),
  };

  const { data: session, isLoading: sessionLoading, error: sessionError } = useGetLearningTrackSession(sessionParams, {
    query: {
      queryKey: [...getGetLearningTrackSessionQueryKey(sessionParams)],
      staleTime: 0,
      retry: (count, err: unknown) => {
        // Don't retry on 429 (limit must expire) or 403 (must change tier
        // / interests first — retry just thrashes the API).
        const status = (err as { status?: number } | null)?.status;
        return status !== 429 && status !== 403 && count < 2;
      },
    },
  });

  // Surface 429 limit + 403 access-denial responses. ApiError exposes the
  // parsed JSON body on `.data` (older code looked at `.body`, which was
  // always undefined — kept as a fallback so legacy patched errors still
  // work during a partial deploy).
  useEffect(() => {
    if (!sessionError) {
      setLimitInfo(null);
      setAccessDenial(null);
      return;
    }
    const e = sessionError as {
      status?: number;
      data?: { reason?: string; retry_after_seconds?: number; sessions_today?: number; daily_limit?: number; code?: string };
      body?: { reason?: string; retry_after_seconds?: number; sessions_today?: number; daily_limit?: number; code?: string };
    };
    const payload = e?.data ?? e?.body;
    if (e?.status === 429 && (payload?.reason === "daily_limit" || payload?.reason === "cooldown")) {
      setLimitInfo({
        reason: payload.reason,
        retryAfterSeconds: payload.retry_after_seconds ?? 0,
        sessionsToday: payload.sessions_today ?? 0,
        dailyLimit: payload.daily_limit ?? 0,
      });
      setAccessDenial(null);
      return;
    }
    if (e?.status === 403) {
      setLimitInfo(null);
      if (payload?.code === "REGION_NOT_IN_INTERESTS") {
        setAccessDenial({ kind: "region", regionCode: activeRegion });
      } else {
        setAccessDenial({ kind: "tier", register });
      }
      return;
    }
    setLimitInfo(null);
    setAccessDenial(null);
  }, [sessionError, activeRegion, register]);

  const { data: progressData } = useGetLearningTrackProgress();

  // Resume mid-session: align the local question pointer with the server's
  // answers_given the first time we see a given session_id. Otherwise a
  // page reload (or React Query refetch on focus) re-renders question[0],
  // which is already in the attempts table → /answer returns 409 and the UI
  // gets stuck. Per-session_id guard so the user's manual handleNext()
  // advances are never overwritten.
  useEffect(() => {
    const sid = (session as { session_id?: number; answers_given?: number } | undefined)?.session_id;
    const answersGiven = (session as { answers_given?: number } | undefined)?.answers_given ?? 0;
    if (sid == null) return;
    if (syncedSessionId.current === sid) return;
    syncedSessionId.current = sid;
    const total = session?.questions?.length ?? 0;
    // Resume on the first un-answered question; clamp into bounds. If the
    // session is fully answered we just leave it on the last item — the
    // session-complete summary card will take over the UI from feedback.
    const target = Math.min(Math.max(answersGiven, 0), Math.max(total - 1, 0));
    setCurrentQuestionIdx(target);
    setSelectedOptionIdx(null);
    setAnswered(false);
    setFeedback(null);
  }, [session]);

  // ── Auto-walk: /learning-tracks/next tells us which (phase, pillar) the
  // student should attempt next given their progress in this register × region.
  // The student no longer picks freely; the system walks them sequentially.
  // Manual override is available behind the "Advanced" toggle below.
  const nextSlotParams = { register, region_code: activeRegion };
  const { data: nextSlot, error: nextSlotError, refetch: refetchNextSlot } = useGetLearningTrackNext(nextSlotParams, {
    query: {
      queryKey: getGetLearningTrackNextQueryKey(nextSlotParams),
      staleTime: 0,
      retry: (count, err: unknown) => {
        const status = (err as { status?: number } | null)?.status;
        return status !== 403 && count < 2;
      },
    },
  });

  // /next can also 403 (tier or region) before /session even fires, e.g. on
  // first paint after the user upgrades a region away from their tier. Mirror
  // the session-error logic so the explainer card shows up either way.
  useEffect(() => {
    if (!nextSlotError) {
      // /next succeeded (or hasn't fired yet). If /session is also clear,
      // drop any stale denial card so the UI doesn't get stuck after the
      // user upgrades or adds the region to interests in another tab.
      if (!sessionError) setAccessDenial(null);
      return;
    }
    const e = nextSlotError as { status?: number; data?: { code?: string }; body?: { code?: string } };
    if (e?.status !== 403) return;
    const payload = e?.data ?? e?.body;
    if (payload?.code === "REGION_NOT_IN_INTERESTS") {
      setAccessDenial({ kind: "region", regionCode: activeRegion });
    } else {
      setAccessDenial({ kind: "tier", register });
    }
  }, [nextSlotError, sessionError, activeRegion, register]);

  useEffect(() => {
    if (!nextSlot || hasManuallyChanged.current) return;
    // Each (register, region) yields its own auto-target; re-apply when it
    // changes (e.g., after the student masters a slot and the server
    // returns the next one).
    const key = `${nextSlot.register}::${nextSlot.region_code}::${nextSlot.phase}::${nextSlot.research_pillar ?? ""}`;
    if (lastAutoKey.current === key) return;
    lastAutoKey.current = key;
    setPhase(nextSlot.phase);
    if (nextSlot.research_pillar) {
      setResearchPillar(nextSlot.research_pillar);
    }
  }, [nextSlot]);

  const { mutate: submitAnswer, isPending: submitting } = usePostLearningTrackAnswer({
    mutation: {
      onSuccess: (result) => {
        const r = result as typeof result & {
          session_complete?: boolean;
          session_score_pct?: number | null;
          session_passed?: boolean | null;
          next_action?: "level_up" | "continue" | "remediation" | "mastered";
        };
        setFeedback({
          correct: r.correct,
          answer_tier: r.answer_tier,
          motivation: r.motivation,
          historical_context: r.historical_context ?? null,
          level_up: r.level_up,
          mastered: r.mastered,
          repeat: r.repeat,
          new_badges: r.new_badges ?? [],
          session_complete: r.session_complete,
          session_score_pct: r.session_score_pct ?? null,
          session_passed: r.session_passed ?? null,
          next_action: r.next_action,
        });
        setAnswered(true);
        queryClient.invalidateQueries({ queryKey: getGetLearningTrackProgressQueryKey() });
        // Refresh the auto-walk pointer: when the student masters this slot,
        // the next call to /learning-tracks/next will return the next pillar
        // (or next phase) and the effect above will advance the UI.
        queryClient.invalidateQueries({ queryKey: getGetLearningTrackNextQueryKey({ register, region_code: activeRegion }) });
        if (r.mastered && (r.new_badges ?? []).length > 0) {
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
    setStudyAcknowledged(false);
  }

  // Repetition UX: a freshly opened repeat question requires the student to
  // explicitly acknowledge the study_context before the answer options
  // become tappable. Reset the gate every time the visible question changes.
  useEffect(() => {
    setStudyAcknowledged(false);
  }, [currentQuestionIdx, session?.session_id]);

  function handleConfirm() {
    if (selectedOptionIdx === null || !currentQuestion) return;
    const sessionId = (session as { session_id?: number } | undefined)?.session_id;
    submitAnswer({
      data: {
        question_id: currentQuestion.id,
        selected_option_index: selectedOptionIdx,
        register,
        research_pillar: register === "middle_class" ? researchPillar : null,
        phase,
        ...(sessionId ? { session_id: sessionId } : {}),
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

  // Per-country progression isolation (Task #209): every progress lookup
  // MUST be scoped by region_code so progress on IT does not bleed into UK.
  const getProgressForCurrentTrack = useCallback(() => {
    if (!progressData) return null;
    return progressData.find(
      (p) =>
        p.register === register &&
        p.phase === phase &&
        p.region_code === activeRegion &&
        (register === "middle_class" ? p.research_pillar === researchPillar : !p.research_pillar),
    );
  }, [progressData, register, phase, researchPillar, activeRegion]);

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
      (p) =>
        p.register === "middle_class" &&
        p.phase === phase &&
        p.region_code === activeRegion &&
        p.research_pillar === pillar,
    );
  }

  // ── Progression gate ─────────────────────────────────────────────────────
  // Students must follow the curve. They cannot jump to a phase or pillar
  // beyond the auto-walk pointer (which always points at the next slot they
  // have earned). While a batch is in progress, every other slot is also
  // frozen so the student finishes their current 8 questions before picking
  // anything else — otherwise badges and session scoring break down.
  const PILLAR_ORDER = ["P1", "P2", "P3"];
  const inProgressSession =
    !!session?.has_questions &&
    (((session as { answers_given?: number }).answers_given ?? 0) <
      ((session as { total_questions?: number }).total_questions ?? 0));
  const autoPhase = nextSlot?.phase ?? 1;
  const autoPillarIdx = nextSlot?.research_pillar
    ? PILLAR_ORDER.indexOf(nextSlot.research_pillar)
    : 0;
  const allComplete = !!nextSlot?.all_complete;

  function isPhaseLocked(p: number): "session" | "progression" | null {
    if (allComplete) return null;
    if (inProgressSession && p !== phase) return "session";
    if (p > autoPhase) return "progression";
    return null;
  }

  function isPillarLocked(key: string): "session" | "progression" | null {
    if (allComplete) return null;
    if (inProgressSession && key !== researchPillar) return "session";
    // If the currently selected phase is itself ahead of the auto-walk
    // (shouldn't happen because the phase column blocks it, but guard
    // anyway), every pillar is locked.
    if (phase > autoPhase) return "progression";
    if (phase < autoPhase) return null; // earlier phases are fully revisitable
    return PILLAR_ORDER.indexOf(key) > autoPillarIdx ? "progression" : null;
  }

  const currentPhaseName = register === "middle_class"
    ? (MIDDLE_CLASS_PHASES.find((p) => p.phase === phase)?.domainName ?? `Fase ${phase}`)
    : (ELITE_PILLARS.find((p) => p.pillar === phase)?.domainName ?? `Pillar ${phase}`);

  // Only show countries the user has actively opted into (excluding the one
  // currently in focus). Falls back to empty list while interests are loading
  // — the empty-state copy in the panel handles that gracefully.
  return (
    <div className="space-y-6">
      {/* ── "Jouw startpunt" personalized card ── */}
      {showStartCard && (
        <div className="relative flex items-start gap-4 px-5 py-4 rounded-sm border border-primary/20 bg-primary/5 text-sm animate-in fade-in duration-300">
          <Compass className="w-5 h-5 mt-0.5 flex-shrink-0 text-primary/60" aria-hidden="true" />
          <div className="flex-1 space-y-1">
            <p className="font-medium text-foreground/90">
              {t("atelier.track.start_card_intro")}{" "}
              <span className="text-muted-foreground font-normal">
                ({[
                  t(`atelier.track.ambition_${ambitionLevel}`),
                  getRegionName(activeRegion),
                  gender ?? null,
                  ageGroup ?? null,
                ].filter(Boolean).join(" · ")})
              </span>{" "}
              {t("atelier.track.start_card_recommendation")}{" "}
              <span className="font-serif text-primary">
                {register === "elite" ? `${t("atelier.track.register_elite")} — ` : ""}{currentPhaseName}
              </span>.
            </p>
            <button
              onClick={dismissStartCard}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
            >
              {t("atelier.track.start_card_choose")}
            </button>
          </div>
          <button
            onClick={dismissStartCard}
            aria-label={t("atelier.track.start_card_close")}
            className="flex-shrink-0 p-1 rounded-sm text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* ── Register selector ──
          Always visible so non-ambassador users (Traveller) still SEE the
          Elite track exists; the Elite tab is locked with an upgrade CTA. */}
      <div className="flex gap-2" role="tablist" aria-label="Learning track register">
        {(["middle_class", "elite"] as Register[]).map((r) => {
          const isEliteLocked = r === "elite" && tier !== "ambassador";
          const isSelected = register === r;
          if (isEliteLocked) {
            return (
              <Link
                key={r}
                href="/membership"
                role="tab"
                aria-selected={false}
                aria-disabled={true}
                title={t("atelier.track.tier_locked_title_ambassador")}
                data-testid="tab-elite-locked"
                className="px-5 py-2 text-xs font-mono uppercase tracking-widest rounded-sm border border-amber-500/40 bg-amber-500/[0.06] text-amber-700 dark:text-amber-300 hover:bg-amber-500/15 hover:border-amber-500/60 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Lock className="w-3 h-3" aria-hidden="true" />
                {t("atelier.track.register_elite")}
              </Link>
            );
          }
          return (
            <button
              key={r}
              role="tab"
              aria-selected={isSelected}
              onClick={() => handleRegisterChange(r)}
              className={`px-5 py-2 text-xs font-mono uppercase tracking-widest rounded-sm border transition-colors ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {r === "middle_class" ? t("atelier.track.register_middle_class") : t("atelier.track.register_elite")}
            </button>
          );
        })}
      </div>

      {/* ── Auto-walk header: "Next up" + progress + reset-to-auto link ──
          When the user is on the auto-recommended path the header reflects
          whatever /next returned. When they manually override, it reflects
          their current selection so the header always describes the slot
          actually loaded into the question card. */}
      {nextSlot && !nextSlot.all_complete && (() => {
        const onAutoPath = !hasManuallyChanged.current;
        const headerPhase = onAutoPath ? nextSlot.phase : phase;
        const headerPillar = onAutoPath ? nextSlot.research_pillar : (register === "middle_class" ? researchPillar : null);
        const headerPhaseName = register === "middle_class"
          ? (MIDDLE_CLASS_PHASES.find((p) => p.phase === headerPhase)?.domainName ?? `Phase ${headerPhase}`)
          : (ELITE_PILLARS.find((p) => p.pillar === headerPhase)?.domainName ?? `Pillar ${headerPhase}`);
        const headerLevel = onAutoPath ? nextSlot.current_level : (currentProgress?.current_level ?? 1);
        return (
          <div className="rounded-sm border border-primary/20 bg-primary/[0.03] px-5 py-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-1">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  {t("atelier.track.next_up_label")}
                </p>
                <p className="font-serif text-base text-foreground">
                  {headerPhaseName}
                  {register === "middle_class" && headerPillar && (
                    <span className="text-muted-foreground"> · {RESEARCH_PILLARS[headerPillar] ?? headerPillar}</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("atelier.track.level_label")} {headerLevel}/5
                  {nextSlot.total_slots > 0 && (
                    <> · {nextSlot.completed_slots}/{nextSlot.total_slots} {t("atelier.track.slots_mastered")}</>
                  )}
                </p>
              </div>
              {!onAutoPath && (
                <button
                  onClick={() => {
                    hasManuallyChanged.current = false;
                    lastAutoKey.current = "";
                    refetchNextSlot();
                    resetQuestion();
                  }}
                  className="text-xs text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  {t("atelier.track.return_to_auto")}
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── All-mastered celebration ── */}
      {nextSlot?.all_complete && (
        <div className="rounded-sm border border-amber-300/50 bg-amber-50/30 dark:bg-amber-950/10 px-5 py-6 text-center space-y-2">
          <Trophy className="w-8 h-8 mx-auto text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <p className="font-serif text-lg text-foreground">
            {t("atelier.track.all_mastered_title")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("atelier.track.all_mastered_desc")}
          </p>
        </div>
      )}

      {/* ── Advanced override (default closed) ── */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setShowAdvanced((s) => !s)}
          className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground/70 hover:text-foreground transition-colors"
        >
          {showAdvanced ? "− " : "+ "}{t("atelier.track.advanced_toggle")}
        </button>
        {showAdvanced && (
          <div className="space-y-3 pt-2 border-t border-border/30">
            <p className="text-[11px] text-muted-foreground/80 font-light leading-relaxed flex items-start gap-2">
              <Lock className="w-3 h-3 mt-0.5 flex-shrink-0 text-muted-foreground/60" aria-hidden="true" />
              <span>
                {inProgressSession
                  ? t("atelier.track.locked_session")
                  : t("atelier.track.locked_progression_hint")}
              </span>
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                {register === "middle_class" ? t("atelier.track.section_phase") : "Pillar"}
              </p>
              <div className="space-y-1.5">
                {phaseOptions.map((opt) => {
                  const lockReason = isPhaseLocked(opt.value);
                  const isLocked = lockReason !== null;
                  const isActive = phase === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => !isLocked && handlePhaseChange(opt.value)}
                      disabled={isLocked}
                      title={
                        lockReason === "session"
                          ? t("atelier.track.locked_session")
                          : lockReason === "progression"
                            ? t("atelier.track.locked_progression")
                            : undefined
                      }
                      aria-disabled={isLocked}
                      className={`w-full text-left px-3 py-2 rounded-sm border text-sm transition-all ${
                        isActive
                          ? "border-primary bg-primary/5 text-primary font-medium"
                          : isLocked
                            ? "border-border/30 text-muted-foreground/50 bg-muted/10 cursor-not-allowed"
                            : "border-border/40 text-foreground/70 hover:border-primary/30 hover:text-foreground hover:bg-muted/20"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        {isLocked && <Lock className="w-3 h-3 flex-shrink-0" aria-hidden="true" />}
                        <span className="font-serif">{opt.label}</span>
                      </span>
                      <span className="block text-[10px] font-mono text-muted-foreground/70 mt-0.5 truncate">
                        {opt.subtitle}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            {register === "middle_class" && (
              <div className="space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  {t("atelier.track.section_pillar")}
                </p>
                <div className="space-y-1.5">
                  {Object.entries(RESEARCH_PILLARS).map(([key, label]) => {
                    const pp = getPillarProgress(key);
                    const level = pp?.current_level ?? 1;
                    const mastered = pp?.mastered ?? false;
                    const lockReason = isPillarLocked(key);
                    const isLocked = lockReason !== null;
                    const isActive = researchPillar === key;
                    return (
                      <button
                        key={key}
                        onClick={() => !isLocked && handlePillarChange(key)}
                        disabled={isLocked}
                        title={
                          lockReason === "session"
                            ? t("atelier.track.locked_session")
                            : lockReason === "progression"
                              ? t("atelier.track.locked_progression")
                              : undefined
                        }
                        aria-disabled={isLocked}
                        className={`w-full text-left px-3 py-2 rounded-sm border text-xs transition-all ${
                          isActive
                            ? "border-primary bg-primary/5 text-primary font-medium"
                            : isLocked
                              ? "border-border/30 text-muted-foreground/50 bg-muted/10 cursor-not-allowed"
                              : "border-border/40 text-foreground/70 hover:border-primary/30 hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-semibold flex items-center gap-1.5">
                            {isLocked && <Lock className="w-3 h-3 flex-shrink-0" aria-hidden="true" />}
                            {key}
                          </span>
                          {mastered ? (
                            <Trophy className="w-3 h-3 text-amber-500" aria-label="Mastered" />
                          ) : (
                            <span className="text-[10px] text-muted-foreground/60">Lvl {level}/5</span>
                          )}
                        </div>
                        <span className="font-light text-muted-foreground/80 truncate">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            </div>
          </div>
        )}
      </div>

      {/* ── Question card (full width) ── */}
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-4">
          {sessionLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-32 rounded-sm" />
              <Skeleton className="h-12 rounded-sm" />
              <Skeleton className="h-12 rounded-sm" />
              <Skeleton className="h-12 rounded-sm" />
            </div>
          ) : limitInfo ? (
            // ── 429 daily-cap or cooldown banner ─────────────────────────────
            <Card className="border-amber-300/50 bg-amber-50/30 dark:bg-amber-950/10">
              <CardContent className="py-8 text-center space-y-3">
                <AlertCircle className="w-8 h-8 mx-auto text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <h3 className="font-serif text-lg text-foreground">
                  {limitInfo.reason === "daily_limit"
                    ? t("atelier.track.daily_limit_title")
                    : t("atelier.track.cooldown_title")}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  {limitInfo.reason === "daily_limit"
                    ? t("atelier.track.daily_limit_desc", { sessions: limitInfo.sessionsToday, limit: limitInfo.dailyLimit })
                    : t("atelier.track.cooldown_desc", { minutes: Math.max(1, Math.ceil(limitInfo.retryAfterSeconds / 60)) })}
                </p>
              </CardContent>
            </Card>
          ) : accessDenial ? (
            // ── 403 tier-gate or region-not-in-interests explainer ───────────
            <Card className="border-primary/30 bg-primary/[0.04]">
              <CardContent className="py-8 text-center space-y-4">
                <Lock className="w-8 h-8 mx-auto text-primary/70" aria-hidden="true" />
                <h3 className="font-serif text-lg text-foreground">
                  {accessDenial.kind === "tier"
                    ? t(
                        accessDenial.register === "elite"
                          ? "atelier.track.tier_locked_title_ambassador"
                          : "atelier.track.tier_locked_title_traveller",
                      )
                    : t("atelier.track.region_locked_title", { region: getRegionName(accessDenial.regionCode as RegionCode) })}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  {accessDenial.kind === "tier"
                    ? t(
                        accessDenial.register === "elite"
                          ? "atelier.track.tier_locked_desc_ambassador"
                          : "atelier.track.tier_locked_desc_traveller",
                      )
                    : t("atelier.track.region_locked_desc", { region: getRegionName(accessDenial.regionCode as RegionCode) })}
                </p>
                <Link href={accessDenial.kind === "tier" ? "/membership" : "/profile#interests"}>
                  <Button variant="default" className="font-serif gap-2 mt-1">
                    {accessDenial.kind === "tier"
                      ? t("atelier.track.tier_locked_cta")
                      : t("atelier.track.region_locked_cta")}
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : !session?.has_questions ? (
            <Card className="border-dashed border-border/50 bg-card/40">
              <CardContent className="py-8 space-y-4">
                <div className="flex items-start gap-3">
                  <BookOpen className="w-6 h-6 opacity-30 flex-shrink-0 mt-1" aria-hidden="true" />
                  <div className="space-y-1">
                    <p className="font-serif text-base text-foreground/80">
                      {t("atelier.track.no_content_suffix").replace(/^—\s*/, "")}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t("atelier.track.no_content_desc")}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(true)}
                  className="text-xs font-mono uppercase tracking-widest text-primary/80 hover:text-primary transition-colors"
                >
                  ↑ {t("atelier.track.no_content_try_other")}
                </button>
              </CardContent>
            </Card>
          ) : feedback?.mastered ? (
            <Card className="border-amber-400/40 bg-amber-50/20 dark:bg-amber-950/10">
              <CardContent className="py-10 text-center space-y-5">
                <Trophy className="w-12 h-12 mx-auto text-amber-500" aria-hidden="true" />
                <h3 className="font-serif text-2xl text-foreground">
                  {t("atelier.track.mastered_title")}
                </h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  {t("atelier.track.mastered_desc")}
                  {feedback.new_badges.length > 0
                    ? ` ${t("atelier.track.mastered_badge_earned")}`
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
                    {t("atelier.track.restart")}
                  </Button>
                  {feedback.new_badges.length > 0 && (
                    <Link href="/profile#badges">
                      <Button variant="default" className="font-serif gap-2">
                        <Trophy className="w-4 h-4" aria-hidden="true" />
                        {t("atelier.track.view_badges")}
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
                  {t("atelier.track.question_progress", { current: currentQuestionIdx + 1, total: session?.questions.length ?? 0, level: currentProgress?.current_level ?? 1 })}
                  {" · "}
                  {register === "middle_class"
                    ? (RESEARCH_PILLARS[researchPillar] ?? researchPillar)
                    : (ELITE_PILLARS.find((p) => p.pillar === phase)?.internalName ?? "")}
                </span>
                {session?.repeat && (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <RotateCcw className="w-3 h-3" aria-hidden="true" />
                    {t("atelier.track.revision")}
                  </span>
                )}
              </div>

              {/* Level up banner */}
              {feedback?.level_up && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-sm border border-green-300/40 bg-green-50/40 dark:bg-green-950/20 text-green-700 dark:text-green-400 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300">
                  <Sparkles className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  {t("atelier.track.level_up", { level: currentProgress?.current_level ?? 2 })}
                </div>
              )}

              {/* Repeat banner */}
              {session?.repeat && !feedback && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-sm border border-amber-300/40 bg-amber-50/30 dark:bg-amber-950/10 text-amber-700 dark:text-amber-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  {t("atelier.track.repeat_message")}
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
                    {/* Repetition study panel: when the question is a repeat, the
                        study_context (the historical_context tied to the missed
                        rule) is shown prominently as a "review this first" block,
                        replacing the small subtle line. The user can still
                        proceed without expanding, but the affordance is loud. */}
                    {(currentQuestion as { is_repetition?: boolean; study_context?: string | null }).is_repetition && (currentQuestion as { study_context?: string | null }).study_context && !answered ? (
                      <div className="mt-2 p-3 rounded-sm border border-amber-300/50 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                          <BookOpen className="w-3 h-3" aria-hidden="true" />
                          {t("atelier.track.study_first")}
                        </p>
                        <p className="text-xs text-foreground/80 leading-relaxed">
                          {(currentQuestion as { study_context?: string | null }).study_context}
                        </p>
                        {!studyAcknowledged && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setStudyAcknowledged(true)}
                            className="mt-1 h-7 text-[11px] font-mono uppercase tracking-wider border-amber-400/60 text-amber-800 hover:bg-amber-100/50 dark:text-amber-300 dark:hover:bg-amber-900/30"
                          >
                            {t("atelier.track.study_acknowledge")}
                          </Button>
                        )}
                      </div>
                    ) : currentQuestion.historical_context && !answered && (
                      <p className="text-xs text-muted-foreground/60 font-light italic mt-1 leading-relaxed">
                        {currentQuestion.historical_context}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    {(() => {
                      const isRepeat = (currentQuestion as { is_repetition?: boolean }).is_repetition === true;
                      const hasContext = !!(currentQuestion as { study_context?: string | null }).study_context;
                      const gateOpen = !isRepeat || !hasContext || studyAcknowledged || answered;
                      if (gateOpen) return null;
                      return (
                        <p className="text-xs text-muted-foreground italic">
                          {t("atelier.track.study_gate_hint")}
                        </p>
                      );
                    })()}
                    {currentQuestion.options.map((opt, idx) => {
                      const isSelected = selectedOptionIdx === idx;
                      const isAnswered = answered;
                      const isRepeat = (currentQuestion as { is_repetition?: boolean }).is_repetition === true;
                      const hasContext = !!(currentQuestion as { study_context?: string | null }).study_context;
                      const gateLocked = isRepeat && hasContext && !studyAcknowledged && !isAnswered;
                      const isCorrectAnswer = isAnswered && feedback && idx === selectedOptionIdx && feedback.answer_tier === 1;
                      const isWrongAnswer = isAnswered && feedback && idx === selectedOptionIdx && feedback.answer_tier === 3;
                      const isAcceptable = isAnswered && feedback && idx === selectedOptionIdx && feedback.answer_tier === 2;

                      return (
                        <button
                          key={idx}
                          disabled={isAnswered || gateLocked}
                          aria-disabled={gateLocked}
                          onClick={() => !isAnswered && !gateLocked && setSelectedOptionIdx(idx)}
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
                          {feedback.answer_tier === 1 && <><CheckCircle2 className="w-4 h-4" aria-hidden="true" /> {t("atelier.track.feedback_excellent")}</>}
                          {feedback.answer_tier === 2 && <><AlertCircle className="w-4 h-4" aria-hidden="true" /> {t("atelier.track.feedback_acceptable")}</>}
                          {feedback.answer_tier === 3 && <><XCircle className="w-4 h-4" aria-hidden="true" /> {t("atelier.track.feedback_incorrect")}</>}
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
                          {submitting ? t("atelier.track.processing") : t("atelier.track.confirm_answer")}
                          {!submitting && <ChevronRight className="w-4 h-4" aria-hidden="true" />}
                        </Button>
                      ) : feedback?.session_complete ? null /* summary card below */ : !feedback?.mastered ? (
                        <Button
                          onClick={handleNext}
                          className="font-serif gap-2 flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          {currentQuestionIdx + 1 < (session?.questions.length ?? 0)
                            ? t("atelier.track.next_question")
                            : t("atelier.track.new_session")}
                          <ArrowRight className="w-4 h-4" aria-hidden="true" />
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ── Session-end summary ───────────────────────────────────────
                  Shown the moment the last answer comes back with
                  session_complete = true. Surfaces the percentage, pass/fail
                  and the engine's chosen next_action so the user knows
                  whether they're levelling up, repeating, or done. */}
              {feedback?.session_complete && !feedback.mastered && (
                // Three visual states (not two): pass, fail/remediation, and
                // "window not yet complete" — the engine has insufficient
                // attempts at this level to make any pass/fail call yet, so
                // we must not paint this as a failure.
                <Card className={`border-2 ${
                  feedback.session_passed
                    ? "border-green-400/50 bg-green-50/30 dark:bg-green-950/10"
                    : feedback.session_passed === null
                      ? "border-border/40 bg-muted/10"
                      : "border-amber-400/50 bg-amber-50/30 dark:bg-amber-950/10"
                }`}>
                  <CardContent className="py-7 text-center space-y-4">
                    {feedback.session_passed ? (
                      <CheckCircle2 className="w-10 h-10 mx-auto text-green-600 dark:text-green-400" aria-hidden="true" />
                    ) : feedback.session_passed === null ? (
                      <ArrowRight className="w-10 h-10 mx-auto text-muted-foreground" aria-hidden="true" />
                    ) : (
                      <RotateCcw className="w-10 h-10 mx-auto text-amber-600 dark:text-amber-400" aria-hidden="true" />
                    )}
                    <div className="space-y-1">
                      <h3 className="font-serif text-xl text-foreground">
                        {feedback.next_action === "level_up"
                          ? t("atelier.track.session_passed_level_up", { level: feedback.session_passed ? (currentProgress?.current_level ?? 1) + 1 : (currentProgress?.current_level ?? 1) })
                          : feedback.session_passed
                            ? t("atelier.track.session_passed")
                            : feedback.session_passed === null
                              ? t("atelier.track.session_in_progress")
                              : feedback.next_action === "remediation"
                                ? t("atelier.track.session_remediation_title")
                                : t("atelier.track.session_failed")}
                      </h3>
                      <p className="font-mono text-3xl text-foreground/90">
                        {feedback.session_score_pct ?? 0}<span className="text-base text-muted-foreground">%</span>
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      {feedback.next_action === "level_up"
                        ? t("atelier.track.session_next_level_up")
                        : feedback.session_passed === null
                          ? t("atelier.track.session_next_keep_going")
                          : feedback.next_action === "remediation"
                            ? t("atelier.track.session_next_remediation")
                            : t("atelier.track.session_next_continue")}
                    </p>
                    <div className="flex items-center justify-center gap-3 flex-wrap pt-1">
                      <Button
                        onClick={() => {
                          // Force-fetch a new session
                          queryClient.invalidateQueries({ queryKey: getGetLearningTrackSessionQueryKey(sessionParams) });
                          resetQuestion();
                        }}
                        className="font-serif gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {feedback.next_action === "remediation"
                          ? t("atelier.track.start_remediation")
                          : t("atelier.track.start_next_session")}
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Overall progress bar */}
              {currentProgress && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest">
                    <span>{t("atelier.track.progress_label")}</span>
                    <span>
                      {currentProgress.mastered
                        ? t("atelier.track.completed")
                        : t("atelier.track.progress_detail", { level: currentProgress.current_level, questions: currentProgress.questions_done })}
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
            {t("atelier.track.progress_overview", { phase })}
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
                      {mastered ? `✓ ${t("atelier.track.completed")}` : started ? `Level ${level} / 5` : t("atelier.track.not_started")}
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
