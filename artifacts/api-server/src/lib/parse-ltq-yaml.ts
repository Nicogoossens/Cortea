/**
 * Parser for YAML-block LTQ files — Task #310
 *
 * File format: one or more ```yaml ... ``` fences, each containing one question.
 * Header comment lines (# === Q1: Title ===) are stripped before YAML parsing.
 *
 * Demographic normalisation:
 *   common_age_neutral → common
 *   men_19_30 / women_30_50 / … → kept as-is (already canonical)
 *
 * Elite vs. middle_class pillar/research_pillar semantics
 * ────────────────────────────────────────────────────────
 * middle_class: research_pillar set from YAML `research_pillar` field (P1–P4)
 * elite:        research_pillar forced to NULL; phase is derived from the
 *               numeric suffix of the pillar field when `phase` is absent
 *               (P1 → phase 1, …, P5 → phase 5).  This aligns with the
 *               selection engine's `research_pillar IS NULL` filter for elite.
 */
import yaml from "js-yaml";
import type { InsertLearningTrackQuestion } from "@workspace/db";

export interface ParseResult {
  questions: InsertLearningTrackQuestion[];
  parseErrors: string[];
}

interface RawOption {
  text?: unknown;
  answer_tier?: unknown;
  motivation?: unknown;
}

interface RawQuestion {
  question_text?: unknown;
  options?: RawOption[];
  historical_context?: unknown;
  register?: unknown;
  phase?: unknown;
  level?: unknown;
  research_pillar?: unknown;
  demographic?: unknown;
  region_code?: unknown;
  lang?: unknown;
  primary_dimension?: unknown;
  secondary_dimension?: unknown;
}

const DEMOGRAPHIC_ALIASES: Record<string, string> = {
  common_age_neutral: "common",
  common: "common",
  neutral: "common",
};

function normaliseDemographic(raw: unknown): string {
  if (!raw || typeof raw !== "string") return "common";
  const s = raw.toLowerCase().replace(/-/g, "_");
  return DEMOGRAPHIC_ALIASES[s] ?? s;
}

function str(v: unknown, fallback = ""): string {
  if (v == null) return fallback;
  return String(v).trim();
}

/**
 * Derive phase number from a pillar string like "P1" → 1.
 * Returns null if the string doesn't match the pattern.
 */
function phaseFromPillar(pillar: unknown): number | null {
  if (!pillar || typeof pillar !== "string") return null;
  const m = pillar.trim().match(/^P([1-5])$/i);
  return m ? parseInt(m[1], 10) : null;
}

export function parseLtqYaml(content: string): ParseResult {
  const parseErrors: string[] = [];
  const questions: InsertLearningTrackQuestion[] = [];

  const blockRe = /```yaml\s*\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  let blockIndex = 0;

  while ((match = blockRe.exec(content)) !== null) {
    blockIndex++;
    const rawYaml = match[1];

    let parsed: RawQuestion;
    try {
      const cleaned = rawYaml.replace(/^#[^\n]*\n/gm, "");
      parsed = yaml.load(cleaned) as RawQuestion;
    } catch (err) {
      parseErrors.push(`Block ${blockIndex}: YAML parse error — ${err}`);
      continue;
    }

    if (!parsed || typeof parsed !== "object") {
      parseErrors.push(`Block ${blockIndex}: Empty or invalid YAML block`);
      continue;
    }

    const questionText = str(parsed.question_text);
    if (!questionText) {
      parseErrors.push(`Block ${blockIndex}: Missing question_text`);
      continue;
    }

    const regionCode = str(parsed.region_code).toUpperCase();
    if (!regionCode) {
      parseErrors.push(`Block ${blockIndex}: "${questionText.slice(0, 40)}" — missing region_code`);
      continue;
    }

    const rawOptions: RawOption[] = Array.isArray(parsed.options) ? parsed.options : [];
    if (rawOptions.length < 2) {
      parseErrors.push(`Block ${blockIndex}: "${questionText.slice(0, 40)}" — fewer than 2 options`);
      continue;
    }

    const tier1Count = rawOptions.filter((o) => Number(o.answer_tier) === 1).length;
    if (tier1Count !== 1) {
      parseErrors.push(`Block ${blockIndex}: "${questionText.slice(0, 40)}" — ${tier1Count} Good answers (need exactly 1)`);
      continue;
    }

    const options = rawOptions.map((o) => ({
      text: str(o.text),
      answer_tier: (Number(o.answer_tier) ?? 2) as 1 | 2 | 3,
      motivation: str(o.motivation),
    }));

    if (options.some((o) => !o.text)) {
      parseErrors.push(`Block ${blockIndex}: "${questionText.slice(0, 40)}" — option with empty text`);
      continue;
    }

    const register = (str(parsed.register, "middle_class")) as "middle_class" | "elite";
    const rawPillar = str(parsed.research_pillar);

    // Phase: explicit > derived from pillar (elite only) > default 1
    let phase = Number(parsed.phase) || 0;
    if (!phase && register === "elite") {
      phase = phaseFromPillar(rawPillar) ?? 1;
    }
    if (!phase) phase = 1;

    // research_pillar: null for elite; pillar string for middle_class
    const research_pillar =
      register === "elite" ? null : (rawPillar || null);

    questions.push({
      register,
      research_pillar,
      phase,
      level: Number(parsed.level) || 1,
      region_code: regionCode,
      demographic: normaliseDemographic(parsed.demographic),
      question_text: questionText,
      historical_context: str(parsed.historical_context) || null,
      options,
      lang: str(parsed.lang, "en"),
      primary_dimension: str(parsed.primary_dimension) || null,
      secondary_dimension: str(parsed.secondary_dimension) || null,
    });
  }

  return { questions, parseErrors };
}
