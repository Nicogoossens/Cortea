/**
 * Pure (DB-free) decision helpers for the Task #209 adaptive engine.
 *
 * These are imported BOTH by the production engine/route handlers AND by
 * the cross-package vitest suite in `artifacts/sowiso/src/__tests__`. By
 * keeping them in their own module (no @workspace/db import) the same
 * function executes in both code paths, so the tests exercise the real
 * production decisions rather than a parallel re-implementation.
 */

export type Register = "middle_class" | "elite";

export interface PureRegisterConfig {
  sessionSize: number;
  dailyLimit: number;
  cooldownMinutes: number;
  crossDemographicFromLevel: number;
  maxLevel: number;
}

/** Default knobs (env overrides are applied in `learning-engine.ts`). */
export const DEFAULT_REGISTER_CONFIG: Record<Register, PureRegisterConfig> = {
  middle_class: { sessionSize: 8, dailyLimit: 9999, cooldownMinutes: 5, crossDemographicFromLevel: 3, maxLevel: 5 },
  elite:        { sessionSize: 5, dailyLimit: 9999, cooldownMinutes: 5, crossDemographicFromLevel: 2, maxLevel: 5 },
};

/** Cross-demographic reservation = floor(size/4), gated by level + non-common demographic. */
export function computeReserve(size: number, level: number, fromLevel: number, demographic: string): number {
  const must = level >= fromLevel && demographic !== "common";
  return must ? Math.max(1, Math.floor(size / 4)) : 0;
}

/** Window-based pass evaluation: ≥pct correct in the last `size` attempts. */
export function shouldLevelUp(window: Array<0 | 1>, required: [number, number]): boolean {
  const [size, pct] = required;
  if (window.length < size) return false;
  const last = window.slice(-size);
  const correct = last.filter((x) => x === 1).length;
  return (correct / size) * 100 >= pct;
}

/** Mastery clamp: never advance past maxLevel; flag mastered. */
export function applyLevelUp(currentLevel: number, maxLevel: number) {
  if (currentLevel >= maxLevel) {
    return { currentLevel: maxLevel, mastered: true, nextAction: "mastered" as const };
  }
  return { currentLevel: currentLevel + 1, mastered: false, nextAction: "level_up" as const };
}

/** Per-day daily-limit + cooldown-window decision (HTTP 429 source of truth). */
export function isSessionAllowed(
  cfg: PureRegisterConfig,
  todayCount: number,
  minutesSinceLast: number,
):
  | { allowed: true }
  | { allowed: false; reason: "daily_limit" | "cooldown" } {
  if (todayCount >= cfg.dailyLimit) return { allowed: false, reason: "daily_limit" };
  if (minutesSinceLast < cfg.cooldownMinutes) return { allowed: false, reason: "cooldown" };
  return { allowed: true };
}

/** Origin-lock: PATCH /users/profile/origin returns 403 ORIGIN_LOCKED on change attempts. */
export function patchOriginStatus(opts: {
  locked: boolean;
  currentValue: string | null;
  incoming: string | null;
}):
  | { status: 200 }
  | { status: 403; code: "ORIGIN_LOCKED" } {
  if (opts.locked && opts.incoming && opts.incoming !== opts.currentValue) {
    return { status: 403, code: "ORIGIN_LOCKED" };
  }
  return { status: 200 };
}

/** active_region must be ∈ user's country interests (when interests exist). */
export function checkActiveRegion(interests: string[], incoming: string):
  | { status: 200 }
  | { status: 403; code: "REGION_NOT_IN_INTERESTS" } {
  if (interests.length > 0 && !interests.includes(incoming)) {
    return { status: 403, code: "REGION_NOT_IN_INTERESTS" };
  }
  return { status: 200 };
}

/**
 * Remediation planner: max-2-repetition rule + similar-replacement fill.
 * A question already retried ≥ 2 times is dropped from forcedIds AND the
 * candidate pool, then a similar same-level question fills the slot.
 */
export function planRemediationSession(opts: {
  remediationIds: number[];
  repetitionCounts: Record<number, number>;
  candidatePool: Array<{ id: number }>;
  size: number;
}) {
  const forced: number[] = [];
  const exclude: number[] = [];
  for (const id of opts.remediationIds) {
    if ((opts.repetitionCounts[id] ?? 0) < 2) forced.push(id);
    else exclude.push(id);
  }
  const excludeSet = new Set([...exclude, ...forced]);
  const replacements = opts.candidatePool
    .filter((q) => !excludeSet.has(q.id))
    .slice(0, opts.size - forced.length);
  return { forced, exclude, served: [...forced, ...replacements.map((q) => q.id)] };
}

/** Multi-country progress lookup — independent per (register, phase, region). */
export interface ProgressRow { register: string; phase: number; region_code: string; current_level: number }
export function lookupProgress(rows: ProgressRow[], register: string, phase: number, region: string) {
  return rows.find((r) => r.register === register && r.phase === phase && r.region_code === region);
}

/**
 * Canonical-ISO origin matcher. The user's `country_of_origin` is stored as
 * a free-text string (English country name OR ISO-2 code, depending on
 * which form the UI captured). To compare it against an ISO-2 region code
 * deterministically we normalize via a name->ISO map, falling back to a
 * direct ISO equality check. Substring matches are NOT used (they cause
 * false positives like "Benin".includes("in") -> India).
 */
export function originMatchesRegion(
  origin: string | null | undefined,
  regionCode: string,
  nameToIso: Record<string, string>,
): boolean {
  if (!origin) return false;
  const o = origin.trim();
  if (!o) return false;
  const r = regionCode.trim().toUpperCase();
  if (!r) return false;
  if (o.toUpperCase() === r) return true;
  const mapped = nameToIso[o.toLowerCase()];
  return !!mapped && mapped.toUpperCase() === r;
}

// ─── Master Framework v1.1 — pure helpers ─────────────────────────────────────

/**
 * BehaviorProfile shape (mirrors users schema, kept local so this
 * module stays import-free).
 */
export interface PureBehaviorProfile {
  listening_score: number;
  assertiveness_style: "assertive" | "passive" | "aggressive" | "passive_aggressive";
  conflict_mode: "avoid" | "compete" | "collaborate" | "accommodate";
  eq_dimensions: {
    self_awareness:  number;
    self_regulation: number;
    empathy:         number;
    social_skill:    number;
  };
  nonverbal_awareness: number;
}

export interface PureCompassScores {
  attentiveness: number;
  composure:     number;
  discernment:   number;
  diplomacy:     number;
  presence:      number;
}

/**
 * §9.3 — Project BehaviorProfile attributes onto Compass dimensions (0–100).
 *
 * Mapping:
 *   attentiveness = listening_score
 *   composure     = 0.6×assertiveness_map + 0.4×self_regulation
 *   discernment   = self_awareness
 *   diplomacy     = 0.5×conflict_mode_map + 0.5×empathy
 *   presence      = 0.5×social_skill + 0.5×nonverbal_awareness
 *
 * Assertiveness map → composure: assertive=80, passive=40, aggressive=25, passive_aggressive=30
 * Conflict-mode map → diplomacy: collaborate=90, accommodate=70, avoid=45, compete=25
 *
 * All outputs are clamped [0, 100] and rounded to the nearest integer.
 */
export function projectBehaviorToCompass(profile: PureBehaviorProfile): PureCompassScores {
  const assertivenessMap: Record<string, number> = {
    assertive: 80, passive: 40, aggressive: 25, passive_aggressive: 30,
  };
  const conflictMap: Record<string, number> = {
    collaborate: 90, accommodate: 70, avoid: 45, compete: 25,
  };

  const clamp = (v: number) => Math.min(100, Math.max(0, Math.round(v)));
  const assertivenessScore = assertivenessMap[profile.assertiveness_style] ?? 50;
  const conflictScore      = conflictMap[profile.conflict_mode] ?? 50;

  return {
    attentiveness: clamp(profile.listening_score),
    composure:     clamp(0.6 * assertivenessScore + 0.4 * (profile.eq_dimensions.self_regulation ?? 50)),
    discernment:   clamp(profile.eq_dimensions.self_awareness ?? 50),
    diplomacy:     clamp(0.5 * conflictScore + 0.5 * (profile.eq_dimensions.empathy ?? 50)),
    presence:      clamp(0.5 * (profile.eq_dimensions.social_skill ?? 50) + 0.5 * profile.nonverbal_awareness),
  };
}

export interface PureRegisterBiasSignal {
  signal:      string;
  weight:      number;  // positive = elite-leaning, negative = middle_class-leaning
  recorded_at: string;
}

/**
 * §4.2 — Infer register bias from the accumulated signal stack.
 *
 * Sums all signal weights. Thresholds:
 *   sum > +20  → "elite"
 *   sum < -20  → "middle_class"
 *   otherwise  → "balanced"
 */
export function inferRegisterBias(
  signals: PureRegisterBiasSignal[],
): "elite" | "middle_class" | "balanced" {
  if (signals.length === 0) return "balanced";
  const sum = signals.reduce((acc, s) => acc + s.weight, 0);
  if (sum > 20)  return "elite";
  if (sum < -20) return "middle_class";
  return "balanced";
}

/**
 * §8.1 — Weighted archetype progress across pillars (0–100).
 *
 * Each archetype assigns importance multipliers to learning pillars.
 * Returns a normalized progress score that weights mastered slots
 * by archetype-specific importance rather than a simple average.
 *
 * pillarScores: map of pillar key → mastery score 0–100.
 * archetype: user's primary archetype (e.g. "diplomate", "urbanist").
 * Unknown archetypes fall back to equal weights.
 */
export function weightedArchetypeProgress(
  pillarScores: Record<string, number>,
  archetype: string | null | undefined,
): number {
  const ARCHETYPE_WEIGHTS: Record<string, Record<string, number>> = {
    diplomate:   { P1: 1.0, P2: 1.5, P3: 2.0, P4: 1.2 },
    urbanist:    { P1: 1.5, P2: 1.0, P3: 1.0, P4: 2.0 },
    aesthete:    { P1: 2.0, P2: 1.0, P3: 0.8, P4: 1.5 },
    scholar:     { P1: 1.0, P2: 2.0, P3: 1.5, P4: 1.0 },
    cosmopolite: { P1: 1.2, P2: 1.2, P3: 1.2, P4: 1.2 },
  };

  const weights = ARCHETYPE_WEIGHTS[archetype?.toLowerCase() ?? ""] ?? {};
  const pillars = Object.keys(pillarScores);
  if (pillars.length === 0) return 0;

  let totalWeight = 0;
  let weightedSum = 0;
  for (const pillar of pillars) {
    const w = weights[pillar] ?? 1.0;
    totalWeight += w;
    weightedSum += (pillarScores[pillar] ?? 0) * w;
  }

  if (totalWeight === 0) return 0;
  return Math.min(100, Math.max(0, Math.round(weightedSum / totalWeight)));
}

/**
 * §9.3 — Blend new Compass scores into existing ones via exponential
 * moving average (α=0.25). Scores shift gradually rather than jumping
 * on a single session result.
 */
export function blendCompassScores(
  existing: PureCompassScores,
  incoming: PureCompassScores,
  alpha = 0.25,
): PureCompassScores {
  const clamp = (v: number) => Math.min(100, Math.max(0, Math.round(v)));
  const blend = (e: number, i: number) => clamp(e + alpha * (i - e));
  return {
    attentiveness: blend(existing.attentiveness, incoming.attentiveness),
    composure:     blend(existing.composure,     incoming.composure),
    discernment:   blend(existing.discernment,   incoming.discernment),
    diplomacy:     blend(existing.diplomacy,     incoming.diplomacy),
    presence:      blend(existing.presence,      incoming.presence),
  };
}

/**
 * §9.3 — Nudge BehaviorProfile values based on session performance.
 *
 * scorePct ≥ 75 → +strength nudge (improving)
 * 50 ≤ scorePct < 75 → no change
 * scorePct < 50 → −strength nudge (degrading)
 *
 * Returns an updated copy; never mutates the original.
 */
export function updateBehaviorProfileFromSession(
  profile: PureBehaviorProfile,
  scorePct: number,
  strength = 2,
): PureBehaviorProfile {
  const clamp = (v: number) => Math.min(100, Math.max(0, v));
  const delta = scorePct >= 75 ? strength : scorePct < 50 ? -strength : 0;
  if (delta === 0) return profile;

  const eq = profile.eq_dimensions;
  return {
    ...profile,
    listening_score: clamp(profile.listening_score + delta),
    eq_dimensions: {
      self_awareness:  clamp(eq.self_awareness  + delta),
      self_regulation: clamp(eq.self_regulation + delta),
      empathy:         clamp(eq.empathy         + delta),
      social_skill:    clamp(eq.social_skill     + delta),
    },
    nonverbal_awareness: clamp(profile.nonverbal_awareness + delta),
  };
}
