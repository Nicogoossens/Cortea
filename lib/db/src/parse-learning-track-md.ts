/**
 * Shared parser for canonical Learning Track Markdown files.
 *
 * File format (one .md file per pillar):
 *   - Metadata header (first ~15 lines):
 *       **Region:** BE
 *       **Register:** middle_class
 *       **Phase:** 1
 *       **Pillar:** P1
 *       **Lang:** en
 *       **Demographic:** common
 *   - Level sections:  ## Level N: Title
 *   - Question blocks: ### QN: Title
 *       **Scenario:** ...
 *       **A) ✅ Good** / **B) 🟡 Slightly different** / **C) ❌ Would not do that**
 *       > option text
 *       *motivation text*
 *       **Historical Context:** ...
 *
 * Exactly one tier-1 (✅) option is required per question.
 * Emoji → answer_tier: ✅ = 1 (Good), 🟡 = 2 (Slightly different), ❌ = 3 (Would not do that)
 */

import type { InsertLearningTrackQuestion } from "./schema/learning-track-questions.js";

export interface ParseResult {
  questions: InsertLearningTrackQuestion[];
  parseErrors: string[];
}

export function parseLearningTrackMd(content: string): ParseResult {
  const lines = content.split(/\r?\n/);
  const parseErrors: string[] = [];
  const questions: InsertLearningTrackQuestion[] = [];

  // ── Header metadata defaults ───────────────────────────────────────────────
  let region_code = "";
  let register: "middle_class" | "elite" = "middle_class";
  let phase = 1;
  let research_pillar: string | null = null;
  let lang = "en";
  let demographic = "common";

  const META_RE = /^\s*\*\*([A-Za-z_]+):\*\*\s+(.+?)\s*$/;
  for (let i = 0; i < Math.min(lines.length, 50); i++) {
    const m = lines[i].match(META_RE);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    if (key === "region") region_code = val.toUpperCase();
    else if (key === "register") register = val as "middle_class" | "elite";
    else if (key === "phase") phase = parseInt(val, 10) || 1;
    else if (key === "pillar") research_pillar = val;
    else if (key === "lang") lang = val.toLowerCase();
    else if (key === "demographic") demographic = val;
  }

  // ── State machine ──────────────────────────────────────────────────────────
  const EMOJI_TIER: Record<string, 1 | 2 | 3> = { "✅": 1, "🟡": 2, "❌": 3 };

  let currentLevel = 1;
  let inQuestion = false;
  let qLineNum = 0;
  let qText = "";
  let qHistCtx = "";
  let qOptions: { text: string; answer_tier: 1 | 2 | 3; motivation: string }[] = [];
  let optTier: 1 | 2 | 3 | null = null;
  let optText = "";
  let optMotivation = "";

  function commitOption() {
    if (optTier !== null) {
      qOptions.push({ text: optText.trim(), answer_tier: optTier, motivation: optMotivation.trim() });
    }
    optTier = null;
    optText = "";
    optMotivation = "";
  }

  function commitQuestion() {
    if (!inQuestion || !qText) return;
    commitOption();
    if (qOptions.length < 2) {
      parseErrors.push(`Line ~${qLineNum}: "${qText.slice(0, 50)}" — fewer than 2 options`);
      return;
    }
    const tier1 = qOptions.filter((o) => o.answer_tier === 1).length;
    if (tier1 !== 1) {
      parseErrors.push(`Line ~${qLineNum}: "${qText.slice(0, 50)}" — ${tier1} Good answers (need exactly 1)`);
      return;
    }
    if (qOptions.some((o) => !o.text)) {
      parseErrors.push(`Line ~${qLineNum}: "${qText.slice(0, 50)}" — option with empty text`);
      return;
    }
    questions.push({
      register,
      research_pillar,
      phase,
      level: currentLevel,
      region_code,
      demographic,
      question_text: qText.trim(),
      historical_context: qHistCtx || null,
      options: qOptions,
      lang,
    });
  }

  function resetQuestion() {
    inQuestion = false;
    qText = "";
    qHistCtx = "";
    qOptions = [];
    optTier = null;
    optText = "";
    optMotivation = "";
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;

    if (line === "" || line === "---") continue;

    if (
      line.startsWith("<sub>") ||
      line.includes("[AUTO-GENERATED") ||
      line.startsWith("*Focus:") ||
      line.startsWith("| ") ||
      /^\|[-|: ]+\|/.test(line) ||
      line.startsWith("## How to read") ||
      line.startsWith("## Levels in")
    ) continue;

    const levelM = line.match(/^##\s+Level\s+(\d+)\b/i);
    if (levelM) {
      commitQuestion();
      resetQuestion();
      currentLevel = parseInt(levelM[1], 10);
      continue;
    }

    if (/^###\s+Q\d+/.test(line)) {
      commitQuestion();
      resetQuestion();
      inQuestion = true;
      qLineNum = lineNum;
      continue;
    }

    if (!inQuestion) continue;

    const scenM = line.match(/^\*\*Scenario:\*\*\s+(.*)/);
    if (scenM) { qText = scenM[1].trim(); continue; }

    const optM = line.match(/^\*\*[A-Ca-c]\)\s*(✅|🟡|❌)/u);
    if (optM) {
      commitOption();
      optTier = EMOJI_TIER[optM[1]] ?? 2;
      continue;
    }

    const quoteM = line.match(/^>\s*(.*)/);
    if (quoteM && optTier !== null) {
      let t = quoteM[1].trim().replace(/^["\u201C]|["\u201D]$/g, "").trim();
      optText = optText ? `${optText} ${t}` : t;
      continue;
    }

    if (line.startsWith("*") && !line.startsWith("**") && optTier !== null) {
      const m = line.replace(/^\*/, "").replace(/\*\.?\s*$/, "").trim();
      if (m) optMotivation = optMotivation ? `${optMotivation} ${m}` : m;
      continue;
    }

    const histM = line.match(/^\*\*Historical Context:\*\*\s*(.*)/);
    if (histM) {
      commitOption();
      qHistCtx = histM[1].trim();
      continue;
    }
  }

  commitQuestion();
  return { questions, parseErrors };
}
