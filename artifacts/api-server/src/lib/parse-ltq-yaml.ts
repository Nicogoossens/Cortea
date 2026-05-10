/**
 * Parser for YAML-block LTQ files — Task #310
 *
 * File format: one or more ```yaml ... ``` fences, each containing one question.
 * Header comment lines (# === Q1: Title ===) are stripped before YAML parsing.
 *
 * Demographic normalisation:
 *   common_age_neutral → common
 *   men_19_30 / women_30_50 / … → kept as-is (already canonical)
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

    questions.push({
      register: (str(parsed.register, "middle_class")) as "middle_class" | "elite",
      research_pillar: str(parsed.research_pillar) || null,
      phase: Number(parsed.phase) || 1,
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
