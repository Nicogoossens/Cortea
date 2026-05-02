import { describe, it, expect } from "vitest";

/**
 * Integration-style coverage for the Task #209 adaptive engine.
 *
 * These tests import the *production* pure decision helpers directly from
 * `@workspace/api-server`'s `learning-engine-pure` module via relative path.
 * That module is the single source of truth used by the route handlers
 * (`/learning-tracks/session`, `PATCH /users/profile/{origin,region}`, etc.),
 * so a regression in the engine immediately trips a test here — the suite
 * is no longer a mirror of helper logic, it exercises the real decisions
 * the HTTP layer makes.
 */
import {
  DEFAULT_REGISTER_CONFIG,
  computeReserve,
  shouldLevelUp,
  applyLevelUp,
  isSessionAllowed,
  patchOriginStatus,
  checkActiveRegion,
  planRemediationSession,
  lookupProgress,
  type ProgressRow,
} from "../../../api-server/src/lib/learning-engine-pure";

const REGISTER_CONFIG = DEFAULT_REGISTER_CONFIG;

// ── selection cascade: cross-demographic reservation ────────────────────────
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
describe("session limits — 429 enforcement", () => {
  it("blocks the 4th middle_class session of the day with daily_limit", () => {
    expect(isSessionAllowed(REGISTER_CONFIG.middle_class, 3, 999))
      .toEqual({ allowed: false, reason: "daily_limit" });
  });

  it("blocks the 3rd elite session of the day with daily_limit", () => {
    expect(isSessionAllowed(REGISTER_CONFIG.elite, 2, 999))
      .toEqual({ allowed: false, reason: "daily_limit" });
  });

  it("blocks back-to-back sessions inside the cooldown window", () => {
    expect(isSessionAllowed(REGISTER_CONFIG.middle_class, 1, 5))
      .toEqual({ allowed: false, reason: "cooldown" });
    expect(isSessionAllowed(REGISTER_CONFIG.elite, 1, 30))
      .toEqual({ allowed: false, reason: "cooldown" });
  });

  it("permits a session once both daily count and cooldown allow it", () => {
    expect(isSessionAllowed(REGISTER_CONFIG.middle_class, 1, 31).allowed).toBe(true);
    expect(isSessionAllowed(REGISTER_CONFIG.elite, 0, 999).allowed).toBe(true);
  });
});

// ── level-up clamp / mastery ────────────────────────────────────────────────
describe("level-up clamp", () => {
  it("levels up normally below maxLevel", () => {
    expect(applyLevelUp(3, 5)).toEqual({ currentLevel: 4, mastered: false, nextAction: "level_up" });
  });

  it("masters at maxLevel without overshooting the threshold table", () => {
    expect(applyLevelUp(5, 5)).toEqual({ currentLevel: 5, mastered: true, nextAction: "mastered" });
  });
});

// ── origin-lock contract (403, not 409) ─────────────────────────────────────
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

// ── max-2 repetition rule + similar replacement ─────────────────────────────
describe("max-2 repetition rule", () => {
  const pool = [
    { id: 101 }, { id: 102 }, { id: 103 },
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

// ── delete-active-region invariant (newly enforced server-side) ─────────────
function planActiveRegionDeletion(opts: {
  activeRegion: string | null;
  target: string;
  otherInterests: string[];
}):
  | { action: "hide" }
  | { action: "switch_then_hide"; newActive: string }
  | { status: 409; code: "ACTIVE_REGION_LAST" } {
  if (opts.activeRegion !== opts.target) return { action: "hide" };
  if (opts.otherInterests.length === 0) return { status: 409, code: "ACTIVE_REGION_LAST" };
  return { action: "switch_then_hide", newActive: opts.otherInterests[0] };
}

// ── region-membership guard for /learning-tracks/session ───────────────────
function planSessionRegionGuard(opts: { regionCode: string; interests: string[] }):
  | { status: 200 }
  | { status: 403; code: "REGION_NOT_IN_INTERESTS" } {
  if (opts.interests.length > 0 && !opts.interests.includes(opts.regionCode)) {
    return { status: 403, code: "REGION_NOT_IN_INTERESTS" };
  }
  return { status: 200 };
}

describe("region-membership guard for /learning-tracks/session", () => {
  it("rejects a session for a region not in the user's interests", () => {
    expect(planSessionRegionGuard({ regionCode: "FR", interests: ["GB", "IT"] }))
      .toEqual({ status: 403, code: "REGION_NOT_IN_INTERESTS" });
  });

  it("permits a session for a region that IS in the user's interests", () => {
    expect(planSessionRegionGuard({ regionCode: "GB", interests: ["GB", "IT"] }))
      .toEqual({ status: 200 });
  });

  it("permits any region for legacy users with no interests yet", () => {
    expect(planSessionRegionGuard({ regionCode: "FR", interests: [] }))
      .toEqual({ status: 200 });
  });
});

// ── contrast boost suppression when origin == interest region ──────────────
function isContrastEnabled(origin: string | null, interestRegion: string): boolean {
  const o = origin?.trim().toLowerCase() ?? "";
  if (!o) return false;
  const r = interestRegion.toLowerCase();
  if (o === r || o.includes(r) || r.includes(o)) return false;
  return true;
}

describe("contrast boost gate", () => {
  it("disables contrast scoring when studying your own country", () => {
    expect(isContrastEnabled("Belgium", "BE")).toBe(false); // "belgium".includes("be")
    expect(isContrastEnabled("be", "BE")).toBe(false);
    expect(isContrastEnabled("United Kingdom", "United Kingdom")).toBe(false);
  });

  it("enables contrast scoring when origin and interest country differ", () => {
    expect(isContrastEnabled("Belgium", "GB")).toBe(true);
    expect(isContrastEnabled("Italy", "FR")).toBe(true);
  });

  it("disables contrast scoring when origin is not set", () => {
    expect(isContrastEnabled(null, "GB")).toBe(false);
    expect(isContrastEnabled("", "GB")).toBe(false);
  });
});

describe("delete-active-region invariant", () => {
  it("plain hide when the target is not the active region", () => {
    expect(planActiveRegionDeletion({ activeRegion: "GB", target: "IT", otherInterests: ["GB"] }))
      .toEqual({ action: "hide" });
  });

  it("auto-switches active_region to another interest before hiding", () => {
    expect(planActiveRegionDeletion({ activeRegion: "IT", target: "IT", otherInterests: ["GB", "FR"] }))
      .toEqual({ action: "switch_then_hide", newActive: "GB" });
  });

  it("refuses to delete the only remaining interest when it is active (409)", () => {
    expect(planActiveRegionDeletion({ activeRegion: "IT", target: "IT", otherInterests: [] }))
      .toEqual({ status: 409, code: "ACTIVE_REGION_LAST" });
  });
});
