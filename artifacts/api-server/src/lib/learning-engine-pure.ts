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
  middle_class: { sessionSize: 8, dailyLimit: 3, cooldownMinutes: 30, crossDemographicFromLevel: 3, maxLevel: 5 },
  elite:        { sessionSize: 5, dailyLimit: 2, cooldownMinutes: 60, crossDemographicFromLevel: 2, maxLevel: 5 },
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
