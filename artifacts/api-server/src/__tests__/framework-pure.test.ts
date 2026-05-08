/**
 * Unit tests — Master Framework v1.1 pure helpers (Task #314).
 *
 * All functions under test are import-free (no DB) so these run
 * fast under vitest without any DB setup.
 */
import { describe, it, expect } from "vitest";
import {
  projectBehaviorToCompass,
  inferRegisterBias,
  weightedArchetypeProgress,
  blendCompassScores,
  updateBehaviorProfileFromSession,
  type PureBehaviorProfile,
  type PureRegisterBiasSignal,
} from "../lib/learning-engine-pure";

// ─── projectBehaviorToCompass ─────────────────────────────────────────────────

describe("projectBehaviorToCompass", () => {
  const baseProfile: PureBehaviorProfile = {
    listening_score: 80,
    assertiveness_style: "assertive",
    conflict_mode: "collaborate",
    eq_dimensions: {
      self_awareness: 70,
      self_regulation: 60,
      empathy: 75,
      social_skill: 65,
    },
    nonverbal_awareness: 55,
  };

  it("maps assertive + collaborate correctly", () => {
    const scores = projectBehaviorToCompass(baseProfile);
    // attentiveness = listening_score = 80
    expect(scores.attentiveness).toBe(80);
    // composure = 0.6*80 + 0.4*60 = 48+24 = 72
    expect(scores.composure).toBe(72);
    // discernment = self_awareness = 70
    expect(scores.discernment).toBe(70);
    // diplomacy = 0.5*90 + 0.5*75 = 45+37.5 = 83 (rounded)
    expect(scores.diplomacy).toBe(83);
    // presence = 0.5*65 + 0.5*55 = 32.5+27.5 = 60
    expect(scores.presence).toBe(60);
  });

  it("clamps all outputs to [0, 100]", () => {
    const extremeProfile: PureBehaviorProfile = {
      listening_score: 120,
      assertiveness_style: "aggressive",
      conflict_mode: "compete",
      eq_dimensions: {
        self_awareness: 200,
        self_regulation: -50,
        empathy: 150,
        social_skill: -10,
      },
      nonverbal_awareness: -20,
    };
    const scores = projectBehaviorToCompass(extremeProfile);
    for (const v of Object.values(scores)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  it("maps passive assertiveness to lower composure", () => {
    const passiveProfile = { ...baseProfile, assertiveness_style: "passive" as const };
    const aggressive     = { ...baseProfile, assertiveness_style: "aggressive" as const };
    const scoresPassive  = projectBehaviorToCompass(passiveProfile);
    const scoresAgress   = projectBehaviorToCompass(aggressive);
    expect(scoresPassive.composure).toBeGreaterThan(scoresAgress.composure);
  });

  it("maps compete conflict mode to lower diplomacy", () => {
    const collab   = { ...baseProfile, conflict_mode: "collaborate" as const };
    const compete  = { ...baseProfile, conflict_mode: "compete" as const };
    const sCollab  = projectBehaviorToCompass(collab);
    const sCompete = projectBehaviorToCompass(compete);
    expect(sCollab.diplomacy).toBeGreaterThan(sCompete.diplomacy);
  });
});

// ─── inferRegisterBias ────────────────────────────────────────────────────────

describe("inferRegisterBias", () => {
  it("returns 'balanced' for empty signals", () => {
    expect(inferRegisterBias([])).toBe("balanced");
  });

  it("returns 'elite' when sum > 20", () => {
    const signals: PureRegisterBiasSignal[] = [
      { signal: "social_circle_elite", weight: 20, recorded_at: "2025-01-01T00:00:00Z" },
      { signal: "onboarding_world_choice", weight: 15, recorded_at: "2025-01-01T00:00:00Z" },
    ];
    expect(inferRegisterBias(signals)).toBe("elite");
  });

  it("returns 'middle_class' when sum < -20", () => {
    const signals: PureRegisterBiasSignal[] = [
      { signal: "social_circle_middle", weight: -15, recorded_at: "2025-01-01T00:00:00Z" },
      { signal: "cultural_interest_middle", weight: -10, recorded_at: "2025-01-01T00:00:00Z" },
    ];
    expect(inferRegisterBias(signals)).toBe("middle_class");
  });

  it("returns 'balanced' when sum is between -20 and +20", () => {
    const signals: PureRegisterBiasSignal[] = [
      { signal: "social_circle_elite",   weight: 10, recorded_at: "2025-01-01T00:00:00Z" },
      { signal: "social_circle_middle", weight: -5, recorded_at: "2025-01-01T00:00:00Z" },
    ];
    expect(inferRegisterBias(signals)).toBe("balanced");
  });

  it("handles exactly +20 as balanced (exclusive threshold)", () => {
    const signals: PureRegisterBiasSignal[] = [
      { signal: "s1", weight: 10, recorded_at: "2025-01-01T00:00:00Z" },
      { signal: "s2", weight: 10, recorded_at: "2025-01-01T00:00:00Z" },
    ];
    // sum = 20, NOT > 20 → balanced
    expect(inferRegisterBias(signals)).toBe("balanced");
  });

  it("handles exactly -20 as balanced (exclusive threshold)", () => {
    const signals: PureRegisterBiasSignal[] = [
      { signal: "s1", weight: -20, recorded_at: "2025-01-01T00:00:00Z" },
    ];
    // sum = -20, NOT < -20 → balanced
    expect(inferRegisterBias(signals)).toBe("balanced");
  });
});

// ─── weightedArchetypeProgress ────────────────────────────────────────────────

describe("weightedArchetypeProgress", () => {
  it("returns 0 for empty pillar scores", () => {
    expect(weightedArchetypeProgress({}, "diplomate")).toBe(0);
  });

  it("returns 0 for null archetype with equal weights", () => {
    const scores = { P1: 100, P2: 0 };
    // unknown archetype → all weights 1.0 → (100+0)/2 = 50
    expect(weightedArchetypeProgress(scores, null)).toBe(50);
  });

  it("applies heavier weight to P3 for diplomate archetype", () => {
    const scoresPriP3 = { P1: 60, P2: 60, P3: 100, P4: 60 };
    const scoresNoPri = { P1: 60, P2: 60, P3: 60, P4: 60 };
    const withBoost    = weightedArchetypeProgress(scoresPriP3, "diplomate");
    const withoutBoost = weightedArchetypeProgress(scoresNoPri, "diplomate");
    expect(withBoost).toBeGreaterThan(withoutBoost);
  });

  it("clamps result to [0, 100]", () => {
    const scores = { P1: 100, P2: 100, P3: 100, P4: 100 };
    expect(weightedArchetypeProgress(scores, "diplomate")).toBeLessThanOrEqual(100);
    expect(weightedArchetypeProgress(scores, "diplomate")).toBeGreaterThanOrEqual(0);
  });

  it("handles unknown archetype gracefully (equal weights)", () => {
    const scores = { P1: 80, P2: 40 };
    // (80+40)/2 = 60
    expect(weightedArchetypeProgress(scores, "unknown_type")).toBe(60);
  });
});

// ─── blendCompassScores ───────────────────────────────────────────────────────

describe("blendCompassScores", () => {
  it("moves scores toward incoming by alpha", () => {
    const existing = { attentiveness: 50, composure: 50, discernment: 50, diplomacy: 50, presence: 50 };
    const incoming = { attentiveness: 70, composure: 70, discernment: 70, diplomacy: 70, presence: 70 };
    const blended = blendCompassScores(existing, incoming, 0.25);
    // 50 + 0.25*(70-50) = 55
    expect(blended.attentiveness).toBe(55);
    expect(blended.composure).toBe(55);
  });

  it("no change when existing === incoming", () => {
    const same = { attentiveness: 60, composure: 60, discernment: 60, diplomacy: 60, presence: 60 };
    const blended = blendCompassScores(same, same);
    expect(blended).toEqual(same);
  });

  it("clamps output to [0, 100]", () => {
    const existing = { attentiveness: 0,   composure: 100, discernment: 50, diplomacy: 50, presence: 50 };
    const incoming = { attentiveness: -50, composure: 200, discernment: 50, diplomacy: 50, presence: 50 };
    const blended = blendCompassScores(existing, incoming, 1.0);
    for (const v of Object.values(blended)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});

// ─── updateBehaviorProfileFromSession ────────────────────────────────────────

describe("updateBehaviorProfileFromSession", () => {
  const base: PureBehaviorProfile = {
    listening_score: 50,
    assertiveness_style: "assertive",
    conflict_mode: "collaborate",
    eq_dimensions: { self_awareness: 50, self_regulation: 50, empathy: 50, social_skill: 50 },
    nonverbal_awareness: 50,
  };

  it("increases listening_score on high-score session (≥75%)", () => {
    const updated = updateBehaviorProfileFromSession(base, 80);
    expect(updated.listening_score).toBeGreaterThan(base.listening_score);
  });

  it("decreases listening_score on low-score session (<50%)", () => {
    const updated = updateBehaviorProfileFromSession(base, 40);
    expect(updated.listening_score).toBeLessThan(base.listening_score);
  });

  it("makes no change on mid-range score (50–74%)", () => {
    const updated = updateBehaviorProfileFromSession(base, 65);
    expect(updated.listening_score).toBe(base.listening_score);
    expect(updated.eq_dimensions.empathy).toBe(base.eq_dimensions.empathy);
  });

  it("preserves assertiveness_style and conflict_mode (non-numeric fields)", () => {
    const updated = updateBehaviorProfileFromSession(base, 80);
    expect(updated.assertiveness_style).toBe(base.assertiveness_style);
    expect(updated.conflict_mode).toBe(base.conflict_mode);
  });

  it("clamps to [0, 100] — does not go negative", () => {
    const minProfile: PureBehaviorProfile = {
      ...base,
      listening_score: 1,
      eq_dimensions: { self_awareness: 1, self_regulation: 1, empathy: 1, social_skill: 1 },
      nonverbal_awareness: 1,
    };
    const updated = updateBehaviorProfileFromSession(minProfile, 0, 10);
    expect(updated.listening_score).toBeGreaterThanOrEqual(0);
    expect(updated.nonverbal_awareness).toBeGreaterThanOrEqual(0);
  });
});
