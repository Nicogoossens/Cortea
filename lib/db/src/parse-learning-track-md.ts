/**
 * Shared parser for canonical Learning Track Markdown files.
 *
 * File format (one .md file per pillar):
 *   - Metadata header (bold keys, before the first level heading):
 *       **Region:** BE
 *       **Register:** middle_class  (or elite)
 *       **Phase:** 1
 *       **Pillar:** P1
 *       **Lang:** en
 *       **Demographic:** common
 *   - Fallback: if bold keys are absent, metadata is derived from the first
 *       heading line, e.g.  "# BE Elite Phase 1 — P1 Voice"
 *   - Level sections (any of):
 *       ## Level N: Title   |  # Level N  |  ## L1  |  ## The Foundation
 *   - Question blocks: ### QN: Title
 *       **Scenario:** ...
 *       **A) ✅ Good** / **B) 🟡 Slightly different** / **C) ❌ Would not do that**
 *       > option text
 *       *motivation text*
 *       **Historical Context:** ...
 *
 * Elite vs. middle_class pillar/research_pillar semantics
 * ────────────────────────────────────────────────────────
 * middle_class: **Pillar:** → research_pillar (P1–P4); phase comes from **Phase:**
 * elite:        **Pillar:** → phase derivation only (P1→phase 1 … P5→phase 5);
 *               research_pillar is stored as NULL so the selection engine's
 *               `research_pillar IS NULL` filter for elite sessions matches.
 *               If **Phase:** is also present it wins over the pillar-derived value.
 *
 * Exactly one tier-1 (✅) option is required per question.
 * Emoji → answer_tier: ✅ = 1 (Good), 🟡 = 2 (Slightly different), ❌ = 3 (Would not do that)
 */

import type { InsertLearningTrackQuestion } from "./schema/learning-track-questions.js";

export interface ParseResult {
  questions: InsertLearningTrackQuestion[];
  parseErrors: string[];
}

// ── Level heading helpers ─────────────────────────────────────────────────────

/**
 * Maps level-title keywords to their 1-based level integer.
 * Covers both elite ("The Initiate"…"The Master") and
 * middle-class ("The Foundation"…"The Mastery") naming.
 */
const LEVEL_TITLE_MAP: Record<string, number> = {
  initiate: 1, apprentice: 2, practitioner: 3, specialist: 4, master: 5,
  foundation: 1, practice: 2, confidence: 3, fluency: 4, mastery: 5,
};

/**
 * Detects whether a (already-trimmed) line is a level heading and returns the
 * 1-based level number, or null if not a level heading.
 *
 * Recognised forms (any heading depth # / ## / ###):
 *   ## Level 3          # Level 3: Title    ### Level 3 — …
 *   ## L3               # L3:               ### L3 — …
 *   ## The Foundation   # The Mastery       ### Foundation
 */
function detectLevel(line: string): number | null {
  if (!/^#{1,3}\s/.test(line)) return null;
  const body = line.replace(/^#{1,3}\s+/, "").trim();

  // "Level N" variants
  const numM = body.match(/^Level\s+(\d+)\b/i);
  if (numM) return parseInt(numM[1], 10);

  // "LN" shorthand: L1, L2, …, L5
  const shortM = body.match(/^L([1-5])\b/i);
  if (shortM) return parseInt(shortM[1], 10);

  // Title-based: "The Foundation", "Foundation", "The Master", …
  // First word after optional "The " must be in the title map.
  const titleM = body.match(/^(?:The\s+)?(\w+)\b/i);
  if (titleM) {
    const word = titleM[1].toLowerCase();
    if (LEVEL_TITLE_MAP[word] !== undefined) return LEVEL_TITLE_MAP[word];
  }

  return null;
}

/** Returns true when a line could be the start of a level section. */
function isLevelLine(line: string): boolean {
  return detectLevel(line) !== null;
}

// ── Title-line metadata fallback ──────────────────────────────────────────────

const VALID_REGIONS = [
  "GB", "US", "AE", "CN", "JP", "FR", "DE", "NL", "AU", "CA",
  "IT", "IN", "ES", "PT", "SG", "BR", "ZA", "MX", "CO", "BE", "CH",
];
const VALID_PILLARS = ["P1", "P2", "P3", "P4", "P5"];

interface TitleMeta {
  region_code?: string;
  register?: "middle_class" | "elite";
  phase?: number;
  pillar?: string;
  demographic?: string;
}

/**
 * Scans the first few lines for a heading line (# …) and tries to extract
 * metadata that is absent from the bold-key block.  Used as a last-resort
 * fallback so files without bold headers can still be imported.
 */
function extractMetadataFromTitle(lines: string[]): TitleMeta {
  for (const line of lines.slice(0, 8)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("#")) continue;
    const text = trimmed.replace(/^#+\s*/, "").trim();
    if (!text) continue;

    const result: TitleMeta = {};

    // Region
    const regionM = text.match(
      /\b(GB|US|AE|CN|JP|FR|DE|NL|AU|CA|IT|IN|ES|PT|SG|BR|ZA|MX|CO|BE|CH)\b/i,
    );
    if (regionM) result.region_code = regionM[1].toUpperCase();

    // Register
    if (/\belite\b/i.test(text)) result.register = "elite";
    else if (/\bmiddle[_\s-]?class\b/i.test(text)) result.register = "middle_class";

    // Phase
    const phaseM = text.match(/\bPhase\s+(\d+)\b/i);
    if (phaseM) result.phase = parseInt(phaseM[1], 10);

    // Pillar (P1–P5)
    const pillarM = text.match(/\bP([1-5])\b/);
    if (pillarM) result.pillar = `P${pillarM[1]}`;

    if (Object.keys(result).length > 0) return result;
  }
  return {};
}

// ── Main parser ───────────────────────────────────────────────────────────────

export function parseLearningTrackMd(content: string): ParseResult {
  const lines = content.split(/\r?\n/);
  const parseErrors: string[] = [];
  const questions: InsertLearningTrackQuestion[] = [];

  // ── Header metadata defaults ─────────────────────────────────────────────
  let region_code = "";
  let register: "middle_class" | "elite" = "middle_class";
  let phaseRaw: string | null = null;
  let phase = 1;
  let pillarRaw: string | null = null; // raw value from **Pillar:** key
  let lang = "en";
  let demographic = "common";

  // Find where the header ends: first level heading or EOF.
  const firstLevelIdx = lines.findIndex((l) => isLevelLine(l.trim()));
  const headerEnd = firstLevelIdx >= 0 ? firstLevelIdx : lines.length;

  const META_RE = /^\s*\*\*([A-Za-z_]+):\*\*\s+(.+?)\s*$/;
  for (let i = 0; i < headerEnd; i++) {
    const m = lines[i].match(META_RE);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    if (key === "region") region_code = val.toUpperCase();
    else if (key === "register") register = val as "middle_class" | "elite";
    else if (key === "phase") { phaseRaw = val; phase = parseInt(val, 10); }
    else if (key === "pillar") pillarRaw = val;
    else if (key === "lang") lang = val.toLowerCase();
    else if (key === "demographic") demographic = val;
  }

  // ── Title-line fallback ───────────────────────────────────────────────────
  // Apply title-derived values only when the bold-key block is silent.
  const titleMeta = extractMetadataFromTitle(lines);
  if (!region_code && titleMeta.region_code) region_code = titleMeta.region_code;
  if (register === "middle_class" && titleMeta.register) register = titleMeta.register;
  if (phaseRaw === null && titleMeta.phase !== undefined) {
    phase = titleMeta.phase;
    phaseRaw = String(titleMeta.phase);
  }
  if (!pillarRaw && titleMeta.pillar) pillarRaw = titleMeta.pillar;

  // ── Elite: derive phase from pillar if Phase header was absent ───────────
  // For elite, **Pillar:** encodes the phase number (P1 = phase 1, …, P5 = phase 5).
  // research_pillar is always NULL for elite (the selection engine filters IS NULL).
  let research_pillar: string | null = null;
  if (register === "elite") {
    if (phaseRaw === null && pillarRaw && VALID_PILLARS.includes(pillarRaw)) {
      phase = parseInt(pillarRaw.slice(1), 10);
      phaseRaw = String(phase);
    }
    // research_pillar stays null for elite — intentional
  } else {
    // middle_class: pillar maps directly to research_pillar
    research_pillar = pillarRaw;
  }

  // ── Validation ────────────────────────────────────────────────────────────
  if (!region_code) {
    parseErrors.push("Missing required metadata: **Region:**");
  } else if (!VALID_REGIONS.includes(region_code)) {
    parseErrors.push(`Unrecognised **Region:** "${region_code}" — must be one of ${VALID_REGIONS.join(", ")}`);
  }

  // Pillar required for middle_class; optional (for phase derivation) for elite
  if (register === "middle_class") {
    if (!research_pillar) {
      parseErrors.push("Missing required metadata: **Pillar:** (required for middle_class)");
    } else if (!VALID_PILLARS.includes(research_pillar)) {
      parseErrors.push(`Invalid **Pillar:** "${research_pillar}" — must be one of ${VALID_PILLARS.join(", ")}`);
    }
  }

  if (phaseRaw === null) {
    parseErrors.push("Missing required metadata: **Phase:** (or derivable from **Pillar:** on elite)");
  } else if (isNaN(phase) || phase < 1) {
    parseErrors.push(`Invalid **Phase:** "${phaseRaw}" — must be a positive integer`);
  }

  const regionInvalid = !!region_code && !VALID_REGIONS.includes(region_code);
  const pillarInvalid =
    register === "middle_class" &&
    !!research_pillar &&
    !VALID_PILLARS.includes(research_pillar);

  if (!region_code || regionInvalid || pillarInvalid || phaseRaw === null || isNaN(phase) || phase < 1) {
    return { questions: [], parseErrors };
  }
  // middle_class also requires a valid pillar
  if (register === "middle_class" && !research_pillar) {
    return { questions: [], parseErrors };
  }

  // ── State machine ─────────────────────────────────────────────────────────
  const EMOJI_TIER: Record<string, 1 | 2 | 3> = { "✅": 1, "🟡": 2, "❌": 3 };

  const parseTagList = (v: string): string[] =>
    v.split(",").map((s) => s.trim()).filter(Boolean);

  let currentLevel = 1;
  let inQuestion = false;
  let qLineNum = 0;
  let qText = "";
  let qHistCtx = "";
  let qOptions: { text: string; answer_tier: 1 | 2 | 3; motivation: string }[] = [];
  let optTier: 1 | 2 | 3 | null = null;
  let optText = "";
  let optMotivation = "";
  // Per-question personalization fields
  let qPrimaryDimension: string | null = null;
  let qSecondaryDimension: string | null = null;
  let qInterestTags: string[] = [];
  let qApplicableArchetypes: string[] = [];
  let qSocialCircleTags: string[] = [];
  let qCulturalInterestTags: string[] = [];

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
      primary_dimension:      qPrimaryDimension,
      secondary_dimension:    qSecondaryDimension,
      interest_tags:          qInterestTags,
      applicable_archetypes:  qApplicableArchetypes,
      social_circle_tags:     qSocialCircleTags,
      cultural_interest_tags: qCulturalInterestTags,
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
    qPrimaryDimension = null;
    qSecondaryDimension = null;
    qInterestTags = [];
    qApplicableArchetypes = [];
    qSocialCircleTags = [];
    qCulturalInterestTags = [];
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

    const level = detectLevel(line);
    if (level !== null) {
      commitQuestion();
      resetQuestion();
      currentLevel = level;
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
      const t = quoteM[1].trim().replace(/^["\u201C]|["\u201D]$/g, "").trim();
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

    // Per-question personalization fields
    const pdM = line.match(/^\*\*Primary Dimension:\*\*\s*(.*)/i);
    if (pdM) { qPrimaryDimension = pdM[1].trim() || null; continue; }

    const sdM = line.match(/^\*\*Secondary Dimension:\*\*\s*(.*)/i);
    if (sdM) { qSecondaryDimension = sdM[1].trim() || null; continue; }

    const itM = line.match(/^\*\*Interest Tags?:\*\*\s*(.*)/i);
    if (itM) { qInterestTags = parseTagList(itM[1]); continue; }

    const aaM = line.match(/^\*\*(?:Applicable )?Archetypes?:\*\*\s*(.*)/i);
    if (aaM) { qApplicableArchetypes = parseTagList(aaM[1]); continue; }

    const scM = line.match(/^\*\*Social Circles?:\*\*\s*(.*)/i);
    if (scM) { qSocialCircleTags = parseTagList(scM[1]); continue; }

    const ciM = line.match(/^\*\*Cultural Interests?:\*\*\s*(.*)/i);
    if (ciM) { qCulturalInterestTags = parseTagList(ciM[1]); continue; }
  }

  commitQuestion();
  return { questions, parseErrors };
}
