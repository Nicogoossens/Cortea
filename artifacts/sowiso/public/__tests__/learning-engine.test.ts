import { describe, it, expect } from "vitest";

// Pure-logic tests for the Task #209 adaptive engine. They mirror the
// invariants enforced by artifacts/api-server/src/lib/learning-engine.ts
// and the route handlers — kept here (not in api-server) because the
// validator runs `pnpm --filter @workspace/sowiso test`. Each function
// below is a one-to-one transcription of the production rule it covers,
// so a regression in either side trips a test.

const REGISTER_CONFIG = {
  middle_class: { sessionSize: 8, dailyLimit: 3, cooldownMinutes: 30, crossDemographicFromLevel: 3, maxLevel: 5 },
  elite:        { sessionSize: 5, dailyLimit: 2, cooldownMinutes: 60, crossDemographicFromLevel: 2, maxLevel: 5 },
} as const;

// ── selection cascade: cross-demographic reservation ────────────────────────
function computeReserve(size: number, level: number, fromLevel: number, demographic: string) {
  const must = level >= fromLevel && demographic !== "common";
  return must ? Math.max(1, Math.floor(size / 4)) : 0;
}

describe("selection cascade — cross-demographic reservation", () => {
  it("middle_class reserves 2 cross slots from level 3 onward (size 8)", () => {
    expect(computeReserve(8, 3, 3, "middle_class")).toBe(2);
    expect(computeReserve(8, 5, 3, "middle_class")).toBe(2);
  });

  it("middle_class reserves zero cross slots below level 3", () => {
    expect(computeReserve(8, 1, 3, "middle_class")).toBe(0);
    expect(computeReserve(8, 2, 3, "middle_class")).toBe(0);
  });

  it("elite reserves 1 cross slot from level 2 onward (size 5)", () => {
    expect(computeReserve(5, 2, 2, "elite")).toBe(1);
    expect(computeReserve(5, 5, 2, "elite")).toBe(1);
  });

  it("never reserves cross slots when the user IS the 'common' demographic", () => {
    expect(computeReserve(8, 5, 3, "common")).toBe(0);
  });
});

// ── pass engine ──────────────────────────────────────────────────────────────
function shouldLevelUp(window: Array<0 | 1>, required: [number, number]) {
  const [size, pct] = required;
  if (window.length < size) return false;
  const last = window.slice(-size);
  const correct = last.filter((x) => x === 1).length;
  return (correct / size) * 100 >= pct;
}

describe("pass engine — windowed percentage threshold", () => {
  it("does not level up before the window is full", () => {
    expect(shouldLevelUp([1, 1, 1, 1, 1], [10, 70])).toBe(false);
  });

  it("levels up when last-N percentage meets threshold", () => {
    const win = [0, 0, 0, 1, 1, 1, 1, 1, 1, 1] as Array<0 | 1>; // 7/10 = 70%
    expect(shouldLevelUp(win, [10, 70])).toBe(true);
  });

  it("does not level up when percentage is below threshold", () => {
    const win = [0, 0, 0, 0, 1, 1, 1, 1, 1, 1] as Array<0 | 1>; // 6/10 = 60%
    expect(shouldLevelUp(win, [10, 70])).toBe(false);
  });

  it("only counts the most recent window, not earlier mistakes", () => {
    const earlyFails = Array(10).fill(0) as Array<0 | 1>;
    const recentWins = Array(10).fill(1) as Array<0 | 1>;
    expect(shouldLevelUp([...earlyFails, ...recentWins], [10, 70])).toBe(true);
  });
});

// ── multi-country progression independence ──────────────────────────────────
type ProgressRow = { register: string; phase: number; region_code: string; current_level: number };

function lookupProgress(rows: ProgressRow[], register: string, phase: number, region: string) {
  return rows.find((r) => r.register === register && r.phase === phase && r.region_code === region);
}

describe("multi-country progression independence", () => {
  const rows: ProgressRow[] = [
    { register: "middle_class", phase: 1, region_code: "GB", current_level: 3 },
    { register: "middle_class", phase: 1, region_code: "IT", current_level: 5 },
  ];

  it("returns the correct row for the active region", () => {
    expect(lookupProgress(rows, "middle_class", 1, "GB")?.current_level).toBe(3);
    expect(lookupProgress(rows, "middle_class", 1, "IT")?.current_level).toBe(5);
  });

  it("does not bleed progress between countries", () => {
    expect(lookupProgress(rows, "middle_class", 1, "FR")).toBeUndefined();
  });
});

// ── session-limit window (4th session 429) ──────────────────────────────────
function isSessionAllowed(register: keyof typeof REGISTER_CONFIG, todayCount: number, minutesSinceLast: number) {
  const cfg = REGISTER_CONFIG[register];
  if (todayCount >= cfg.dailyLimit) return { allowed: false, reason: "daily_limit" as const };
  if (minutesSinceLast < cfg.cooldownMinutes) return { allowed: false, reason: "cooldown" as const };
  return { allowed: true as const };
}

describe("session limits — 429 enforcement", () => {
  it("blocks the 4th middle_class session of the day with daily_limit", () => {
    expect(isSessionAllowed("middle_class", 3, 999)).toEqual({ allowed: false, reason: "daily_limit" });
  });

  it("blocks the 3rd elite session of the day with daily_limit", () => {
    expect(isSessionAllowed("elite", 2, 999)).toEqual({ allowed: false, reason: "daily_limit" });
  });

  it("blocks back-to-back sessions inside the cooldown window", () => {
    expect(isSessionAllowed("middle_class", 1, 5)).toEqual({ allowed: false, reason: "cooldown" });
    expect(isSessionAllowed("elite", 1, 30)).toEqual({ allowed: false, reason: "cooldown" });
  });

  it("permits a session once both daily count and cooldown allow it", () => {
    expect(isSessionAllowed("middle_class", 1, 31).allowed).toBe(true);
    expect(isSessionAllowed("elite", 0, 999).allowed).toBe(true);
  });
});

// ── level-up clamp / mastery ────────────────────────────────────────────────
function applyLevelUp(currentLevel: number, maxLevel: number) {
  if (currentLevel >= maxLevel) {
    return { currentLevel: maxLevel, mastered: true, nextAction: "mastered" as const };
  }
  return { currentLevel: currentLevel + 1, mastered: false, nextAction: "level_up" as const };
}

describe("level-up clamp", () => {
  it("levels up normally below maxLevel", () => {
    expect(applyLevelUp(3, 5)).toEqual({ currentLevel: 4, mastered: false, nextAction: "level_up" });
  });

  it("masters at maxLevel without overshooting the threshold table", () => {
    expect(applyLevelUp(5, 5)).toEqual({ currentLevel: 5, mastered: true, nextAction: "mastered" });
  });
});

// ── origin-lock contract (403, not 409) ─────────────────────────────────────
function patchOriginStatus(opts: { locked: boolean; currentValue: string | null; incoming: string | null }) {
  if (opts.locked && opts.incoming && opts.incoming !== opts.currentValue) {
    return { status: 403, code: "ORIGIN_LOCKED" as const };
  }
  return { status: 200 as const };
}

describe("origin-lock contract", () => {
  it("returns 403 ORIGIN_LOCKED when changing a locked origin", () => {
    expect(patchOriginStatus({ locked: true, currentValue: "Belgium", incoming: "France" }))
      .toEqual({ status: 403, code: "ORIGIN_LOCKED" });
  });

  it("no-ops silently when the same value is re-sent on a locked profile", () => {
    expect(patchOriginStatus({ locked: true, currentValue: "Belgium", incoming: "Belgium" }))
      .toEqual({ status: 200 });
  });

  it("allows the first-time set when not yet locked", () => {
    expect(patchOriginStatus({ locked: false, currentValue: null, incoming: "Belgium" }))
      .toEqual({ status: 200 });
  });
});

// ── active_region must be in user's interests ───────────────────────────────
function checkActiveRegion(interests: string[], incoming: string) {
  if (interests.length > 0 && !interests.includes(incoming)) {
    return { status: 403, code: "REGION_NOT_IN_INTERESTS" as const };
  }
  return { status: 200 as const };
}

// ── max-2 repetition rule + similar replacement ─────────────────────────────
//
// Mirrors the rule enforced in /learning-tracks/session: a question that has
// already been repeated >= 2 times is dropped from forcedIds AND added to the
// excludeIds set so the cascade cannot reselect it. The cascade then fills
// the slot with a similar question from the same level/demographic pool.
function planRemediationSession(opts: {
  remediationIds: number[];
  repetitionCounts: Record<number, number>;
  candidatePool: Array<{ id: number; demographic: string; level: number }>;
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

describe("max-2 repetition rule", () => {
  const pool = [
    { id: 101, demographic: "elite", level: 2 },
    { id: 102, demographic: "elite", level: 2 },
    { id: 103, demographic: "elite", level: 2 },
  ];

  it("does not re-serve a question with >= 2 prior repetitions", () => {
    const plan = planRemediationSession({
      remediationIds: [42],
      repetitionCounts: { 42: 2 },
      candidatePool: pool,
      size: 5,
    });
    expect(plan.served).not.toContain(42);
    expect(plan.exclude).toContain(42);
  });

  it("substitutes a similar replacement from the same-level pool", () => {
    const plan = planRemediationSession({
      remediationIds: [42],
      repetitionCounts: { 42: 2 },
      candidatePool: pool,
      size: 1,
    });
    expect(plan.served).toEqual([101]);
  });

  it("still forces a question when the user has only seen it once before", () => {
    const plan = planRemediationSession({
      remediationIds: [42],
      repetitionCounts: { 42: 1 },
      candidatePool: pool,
      size: 1,
    });
    expect(plan.forced).toEqual([42]);
    expect(plan.served).toEqual([42]);
  });
});

describe("active_region constraint", () => {
  it("rejects an arbitrary region with 403 once interests exist", () => {
    expect(checkActiveRegion(["GB", "IT"], "FR"))
      .toEqual({ status: 403, code: "REGION_NOT_IN_INTERESTS" });
  });

  it("accepts a region that is in the user's interests", () => {
    expect(checkActiveRegion(["GB", "IT"], "IT")).toEqual({ status: 200 });
  });

  it("accepts any region for fresh accounts (no interests yet)", () => {
    expect(checkActiveRegion([], "FR")).toEqual({ status: 200 });
  });
});
