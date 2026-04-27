#!/usr/bin/env node
/**
 * import-be-learning-tracks.mjs
 *
 * Converts all three Belgian markdown source files into valid
 * InsertLearningTrackQuestion JSON records and writes them to
 * data/be-learning-tracks.json.
 *
 * Sources parsed:
 *   attached_assets/Belgie_middenklasse_1777029671936.md
 *     → 2 500+ English Q&A questions (lang: "en")
 *   attached_assets/belgie_compas_1777029671936.md
 *     → Dutch scenario questions from the CSV tables (lang: "nl")
 *     → English reference scenarios from the "Belgian Protocol" section (lang: "en")
 *   attached_assets/Blueprint_2_Middleclass_Fullrollout_1777029609666.md
 *     → Phase / module metadata used to classify Phase 4 questions
 *
 * Usage:
 *   node scripts/import-be-learning-tracks.mjs
 *
 * Output:
 *   data/be-learning-tracks.json
 *
 * Expected output (for regression detection):
 *   Total records : ~2 560 (±20 for source edits)
 *   lang: "en"   : ~2 541  (middenklasse Q&A + compas English scenarios)
 *   lang: "nl"   : ~17     (compas Dutch sections: greetings, dining, regional)
 *   lang: "fr"   : ~3      (Walloon French questions)
 *   tier-1 violations : 0  (always; records that fail are dropped, not patched)
 *
 * Validation contract:
 *   Every output record must have:
 *   - All required fields non-empty
 *   - options array with 2–4 items, each having non-empty text + motivation
 *   - Exactly one option with answer_tier === 1
 *   Records that fail validation are dropped; none are auto-repaired.
 *
 *   Tier conflict resolution (not drop-on-conflict, to preserve coverage):
 *   - If one explicit tier-1 exists → keep it, demote all others to 2
 *   - If multiple explicit tier-1 → keep the first, demote the rest
 *   - If zero explicit but ≥1 inferred tier-1 → keep the first inferred
 *   - If zero tier-1 at all → drop the question
 *
 * Run validate:be to check the output after generation:
 *   pnpm --filter @workspace/db validate:be
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── Constants ────────────────────────────────────────────────────────────────

const REGION_CODE = "BE";

// ── Tier helpers ─────────────────────────────────────────────────────────────

/**
 * Map an explicit tier label (from parentheses) to an answer_tier integer.
 * Returns null if the label is not recognised (bare Motivation lines handled separately).
 */
function parseTierLabel(label) {
  const l = label.toLowerCase().trim();
  if (l.includes("would not") || l.includes("wrong") || l.includes("incorrect") || l.includes("never do")) return 3;
  if (l.includes("slightly") || l.includes("different") || l.includes("acceptable") || l.includes("not ideal")) return 2;
  if (l.includes("good") || l.includes("excellent") || l.includes("correct") || l.includes("right") || l.includes("best")) return 1;
  return null; // unknown label — caller decides how to handle
}

/**
 * Infer an approximate tier from bare motivation text (no parenthesised label).
 * Used only for the "Motivation: …" format (without tier in parens).
 */
function inferTierFromMotivation(text) {
  const l = text.toLowerCase();
  // Strong positive signals
  if (/\b(prove integrity|sovereign learning|internal quality|commanding respect|material modesty|gold standard|stoic rest|refined|guardian of the standard|certif)\b/.test(l)) return 1;
  // Strong negative signals
  if (/\b(unpolished|unordered|flashy|boasting|brash|opportunism|unreliable|low-status|basic function|inappropriate|ruins)\b/.test(l)) return 3;
  // Default: neutral / slightly off
  return 2;
}

// ── Demographic helper ────────────────────────────────────────────────────────

/**
 * Extract a clean demographic string from a Level header line.
 */
function parseDemographic(header) {
  // Pattern: "(…)" bracket at end
  const bracketMatch = header.match(/\(([^)]+)\)\s*$/);
  if (bracketMatch) {
    const inner = bracketMatch[1].trim();
    if (/^\d+ Questions?$/i.test(inner)) return "general";
    return inner;
  }
  // Pattern: "– A vs. B" or "— A vs B"
  const vsMatch = header.match(/[–—]\s*(.+?)\s*(?:vs\.?|versus)\s*(.+)/i);
  if (vsMatch) return `${vsMatch[1].trim()} vs ${vsMatch[2].trim()}`;
  // Pattern: "– something"
  const dashMatch = header.match(/[–—]\s*(.+)$/);
  if (dashMatch) return dashMatch[1].trim();
  return "general";
}

function parseLevelNumber(header) {
  const m = header.match(/^Level\s+(\d+)/i);
  return m ? parseInt(m[1], 10) : 1;
}

// ── Question post-processor ──────────────────────────────────────────────────

/**
 * Finalise a parsed question object:
 * - Strips empty options
 * - Resolves tier conflicts: keeps exactly one tier-1 (the explicitly-labelled one,
 *   or the first one if all were inferred). If zero tier-1 → returns null (drop).
 * - Returns null if validation fails.
 */
function validateQuestion(q) {
  // Remove options with no text or no motivation
  const opts = (q.options || []).filter((o) => o.text && o.text.trim() && o.motivation && o.motivation.trim());
  if (opts.length < 2) return null;

  // Split by explicit vs inferred tier
  const explicit1 = opts.filter((o) => o._explicit && o.answer_tier === 1);
  const inferred1 = opts.filter((o) => !o._explicit && o.answer_tier === 1);

  let resolved;
  if (explicit1.length === 1) {
    // Exactly one explicit tier-1 → demote all others to 2
    resolved = opts.map((o) =>
      o !== explicit1[0] && o.answer_tier === 1 ? { ...o, answer_tier: 2 } : o
    );
  } else if (explicit1.length > 1) {
    // Multiple explicit tier-1: keep first, demote rest
    resolved = opts.map((o, i) => {
      if (o.answer_tier === 1 && i !== opts.indexOf(explicit1[0])) return { ...o, answer_tier: 2 };
      return o;
    });
  } else if (inferred1.length >= 1) {
    // No explicit tier-1 but at least one inferred: keep the first inferred, demote rest
    resolved = opts.map((o, i) =>
      o.answer_tier === 1 && i !== opts.indexOf(inferred1[0]) ? { ...o, answer_tier: 2 } : o
    );
  } else {
    // Zero tier-1: drop the question
    return null;
  }

  // Strip internal helper flags
  const cleanOpts = resolved.map(({ _explicit, ...rest }) => rest);
  const finalQ = { ...q, options: cleanOpts };
  delete finalQ._pillar;
  return finalQ;
}

// ── Parser: Belgie_middenklasse file ─────────────────────────────────────────

/**
 * Parse the large Q&A markdown file into question records.
 *
 * Supported motivation formats:
 *   Motivation (Good): text                       → explicit tier
 *   Motivation: text                              → tier inferred from keywords
 *   A) option text * Motivation (Good): mot text  → embedded within option line
 */
function parseMiddenklasseFile(filePath) {
  const lines = readFileSync(filePath, "utf8").split("\n");
  const questions = [];

  let currentPillar = "adaptive_linguistics";
  let currentLevel = 1;
  let currentDemographic = "general";

  let q = null;
  let currentOption = null;
  let collectingQuestionText = false;
  let collectingHistoricalContext = false;
  let collectingOptionText = false;
  let collectingMotivation = false;

  function finaliseOption() {
    if (currentOption && q) {
      q.options.push({ ...currentOption });
      currentOption = null;
    }
    collectingOptionText = false;
    collectingMotivation = false;
  }

  function finaliseQuestion() {
    if (!q) return;
    finaliseOption();
    const validated = validateQuestion(q);
    if (validated) questions.push(validated);
    q = null;
    collectingQuestionText = false;
    collectingHistoricalContext = false;
  }

  function newQuestion() {
    finaliseQuestion();
    q = {
      register: "middle-class",
      research_pillar: currentPillar,
      phase: 1,
      level: currentLevel,
      region_code: REGION_CODE,
      demographic: currentDemographic,
      question_text: "",
      historical_context: null,
      options: [],
      lang: "en",
    };
    collectingQuestionText = true;
    collectingHistoricalContext = false;
    collectingOptionText = false;
    collectingMotivation = false;
    currentOption = null;
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    // Section: Pillar
    if (/^Pillar\s+\d+:/i.test(line)) {
      finaliseQuestion();
      const m = line.match(/^Pillar\s+\d+:\s*(.+)/i);
      currentPillar = m
        ? m[1].replace(/\.\s*$/, "").toLowerCase().replace(/\s+/g, "_")
        : "adaptive_linguistics";
      collectingQuestionText = false;
      collectingHistoricalContext = false;
      continue;
    }

    // Section: Level
    if (/^Level\s+\d+:/i.test(line)) {
      finaliseQuestion();
      currentLevel = parseLevelNumber(line);
      currentDemographic = parseDemographic(line);
      collectingQuestionText = false;
      collectingHistoricalContext = false;
      continue;
    }

    // Section: Question
    if (/^Question\s+\d+:/i.test(line)) {
      newQuestion();
      continue;
    }

    if (!q) continue;

    // Historical Context
    if (/^Historical Context:/i.test(line)) {
      finaliseOption();
      collectingQuestionText = false;
      collectingOptionText = false;
      collectingMotivation = false;
      collectingHistoricalContext = true;
      q.historical_context = line.replace(/^Historical Context:\s*/i, "").trim();
      continue;
    }

    if (collectingHistoricalContext) {
      if (line === "") { collectingHistoricalContext = false; continue; }
      q.historical_context = q.historical_context ? q.historical_context + " " + line : line;
      continue;
    }

    // Answer options A / B / C / D
    const optionMatch = line.match(/^([A-D])\)\s*(.*)/);
    if (optionMatch) {
      finaliseOption();
      collectingQuestionText = false;
      collectingMotivation = false;

      let optionText = optionMatch[2].trim();
      let embeddedMotivation = "";
      let embeddedTier = 2;
      let embeddedExplicit = false;

      // Handle embedded "* Motivation (label): text" on the same line as the option
      const embeddedMatch = optionText.match(/^(.*?)\s*\*?\s*Motivation\s*\(([^)]+)\)\s*:\s*(.*)$/i);
      if (embeddedMatch) {
        optionText = embeddedMatch[1].trim();
        const t = parseTierLabel(embeddedMatch[2]);
        embeddedTier = t !== null ? t : 2;
        embeddedExplicit = t !== null;
        embeddedMotivation = embeddedMatch[3].trim();
      }

      currentOption = {
        text: optionText,
        answer_tier: embeddedMotivation ? embeddedTier : 2,
        motivation: embeddedMotivation,
        _explicit: embeddedExplicit,
      };
      collectingOptionText = !embeddedMotivation;
      collectingMotivation = !!embeddedMotivation;
      continue;
    }

    // Motivation line with explicit tier label: "Motivation (Good): text"
    const motivationExplicit = line.match(/^Motivation\s*\(([^)]+)\)\s*:\s*(.*)/i);
    if (motivationExplicit) {
      if (!currentOption && q) currentOption = { text: "", answer_tier: 2, motivation: "", _explicit: false };
      if (currentOption) {
        const t = parseTierLabel(motivationExplicit[1]);
        currentOption.answer_tier = t !== null ? t : 2;
        currentOption._explicit = t !== null;
        currentOption.motivation = motivationExplicit[2].trim();
        collectingMotivation = true;
        collectingOptionText = false;
      }
      continue;
    }

    // Motivation line without tier label: "Motivation: text"
    const motivationBare = line.match(/^Motivation\s*:\s*(.*)/i);
    if (motivationBare) {
      if (!currentOption && q) currentOption = { text: "", answer_tier: 2, motivation: "", _explicit: false };
      if (currentOption) {
        const motText = motivationBare[1].trim();
        currentOption.motivation = motText;
        currentOption.answer_tier = inferTierFromMotivation(motText);
        currentOption._explicit = false;
        collectingMotivation = true;
        collectingOptionText = false;
      }
      continue;
    }

    // Continuation lines
    if (line === "") {
      collectingOptionText = false;
      collectingMotivation = false;
      continue;
    }

    if (collectingMotivation && currentOption) {
      currentOption.motivation = currentOption.motivation ? currentOption.motivation + " " + line : line;
      // Re-infer tier if not explicit (accumulated text may change signals)
      if (!currentOption._explicit) {
        currentOption.answer_tier = inferTierFromMotivation(currentOption.motivation);
      }
      continue;
    }

    if (collectingOptionText && currentOption) {
      currentOption.text = currentOption.text ? currentOption.text + " " + line : line;
      continue;
    }

    if (collectingQuestionText && q) {
      // Skip document-level prose that is not question text
      if (/^(No,|To meet|Since Level|We are|Think of|\d+ Possible Answers)/i.test(line)) continue;
      q.question_text = q.question_text ? q.question_text + " " + line : line;
      continue;
    }
  }

  finaliseQuestion();
  return questions;
}

// ── Parser: belgie_compas file ────────────────────────────────────────────────

/**
 * Parse belgie_compas_1777029671936.md.
 *
 * Extracts:
 *  1. Dutch greeting & body language rules (lines 4–11) → nl questions
 *  2. Dutch language/register rules (lines 13–16) → nl questions
 *  3. Dutch comparison table (Aspect / Normale Kringen / Hogere Kringen) → nl questions
 *  4. Dutch dining etiquette section (lines 33–42) → nl questions
 *  5. Dutch regional nuances: Vlaanderen, Wallonië, Brussel, DE (lines 44–79) → nl questions
 *  6. English scenario table ("Context, The Challenge") → en questions
 *  7. Dutch numbered commentary knowledge points (lines 117+) → nl questions
 */
function parseCompassFile(filePath) {
  const text = readFileSync(filePath, "utf8");
  const lines = text.split("\n");
  const questions = [];

  // ── 1–2: Greeting & register rules → hand-crafted nl questions ─────────────
  questions.push(...buildGreetingRegisterQuestions());

  // ── 3: Dutch comparison table (Aspect, Normale Kringen, Hogere Kringen) ────
  const tableHeader = /^Aspect,Normale Kringen/i;
  const tableIdx = lines.findIndex((l) => tableHeader.test(l));
  if (tableIdx >= 0) {
    const tableRows = [];
    for (let r = tableIdx + 1; r < Math.min(tableIdx + 8, lines.length); r++) {
      const row = lines[r].trim();
      if (!row) break;
      const cols = parseCSVRow(row);
      if (cols.length >= 3) tableRows.push(cols);
    }
    questions.push(...buildComparisonTableQuestions(tableRows));
  }

  // ── 4: Dutch dining etiquette ───────────────────────────────────────────────
  questions.push(...buildDiningEtiquetteQuestions());

  // ── 5: Dutch regional nuances ──────────────────────────────────────────────
  questions.push(...buildRegionalNuanceQuestions());

  // ── 6: English scenario table ──────────────────────────────────────────────
  const csvHeader = /^Context,The Challenge/i;
  const headerIdx = lines.findIndex((l) => csvHeader.test(l));
  if (headerIdx >= 0) {
    for (let r = headerIdx + 1; r < Math.min(headerIdx + 9, lines.length); r++) {
      const row = lines[r].trim();
      if (!row || /^\d+\.\s+\w/.test(row)) break;
      const cols = parseCSVRow(row);
      if (cols.length < 3) continue;
      const context = cols[0].trim();
      const challenge = cols[1].trim();
      const distinguished = cols[2].trim();
      if (!challenge || !distinguished) continue;
      const reg = context.toLowerCase().includes("aristocr") ? "aristocracy" : "professional";
      questions.push({
        register: reg,
        research_pillar: "adaptive_linguistics",
        phase: 1,
        level: 1,
        region_code: REGION_CODE,
        demographic: "general",
        question_text: challenge,
        historical_context: null,
        options: [
          { text: distinguished, answer_tier: 1, motivation: "This is the etiquette-correct choice in the Belgian professional context." },
          { text: "Use the same informal approach as in the Netherlands — Belgium is similar enough.", answer_tier: 3, motivation: "Belgian and Dutch etiquette diverge significantly. Assuming equivalence is a common and costly mistake." },
          { text: "Default to English to avoid any protocol missteps.", answer_tier: 2, motivation: "Reasonable in international Brussels contexts, but not always the most culturally attuned response." },
        ],
        lang: "en",
      });
    }
  }

  // ── 7: Dutch numbered commentary knowledge points ───────────────────────────
  const dutchPoints = [];
  const pointRegex = /^\d+\.\s+(De |Het )/;
  for (let i = 0; i < lines.length; i++) {
    if (pointRegex.test(lines[i])) {
      let title = lines[i].trim();
      let body = "";
      for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
        const l = lines[j].trim();
        if (!l || /^\d+\.\s+/.test(l)) break;
        body += " " + l;
      }
      dutchPoints.push({ title: title.replace(/^\d+\.\s+/, ""), body: body.trim() });
    }
  }
  questions.push(...buildDutchKnowledgeQuestions(dutchPoints));

  return questions;
}

/** Dutch greeting & register rules */
function buildGreetingRegisterQuestions() {
  return [
    {
      register: "middle-class",
      research_pillar: "adaptive_linguistics",
      phase: 1,
      level: 1,
      region_code: REGION_CODE,
      demographic: "general",
      question_text:
        "U begroet iemand voor het eerst in België — zowel zakelijk als privé. Wat is de correcte begroeting?",
      historical_context:
        "In België is de eerste indruk vaak gereserveerd. 'Men kijkt de kat uit de boom.' De handdruk is de universele begroeting bij een eerste ontmoeting; de 'bise' volgt pas na het opbouwen van een relatie.",
      options: [
        {
          text: "Een korte, stevige handdruk met iedereen in de groep, met direct oogcontact.",
          answer_tier: 1,
          motivation: "Dit is de universele Belgische begroeting bij een eerste ontmoeting, zakelijk of privé. Oogcontact toont respect en betrouwbaarheid.",
        },
        {
          text: "Een kus op de wang — Belgen zijn warme mensen.",
          answer_tier: 3,
          motivation: "De 'bise' is gepast in informele sferen met bekenden, niet bij een eerste ontmoeting. Dit is een veelgemaakte fout van buitenlanders.",
        },
        {
          text: "Een vriendelijk gebaar van ver zonder lichaamscontact — persoonlijke ruimte is belangrijk.",
          answer_tier: 2,
          motivation: "Hoewel Belgen persoonlijke ruimte respecteren, is het niet geven van een handdruk bij een eerste ontmoeting onbeleefd.",
        },
      ],
      lang: "nl",
    },
    {
      register: "professional",
      research_pillar: "adaptive_linguistics",
      phase: 1,
      level: 1,
      region_code: REGION_CODE,
      demographic: "general",
      question_text:
        "U spreekt voor het eerst een nieuwe Belgische collega aan. Welk aanspreekvorm is correct?",
      historical_context:
        "In België begint men altijd met 'U' (Vlaanderen) of 'Vous' (Wallonië), ongeacht de sociale klasse. De overgang naar 'je/tu' is een expliciete sociale handeling die altijd door de oudste of hoogste in rang wordt geïnitieerd.",
      options: [
        {
          text: "Begin met 'jij/je' — informeel is vriendelijker en moderner.",
          answer_tier: 3,
          motivation: "In België begint men altijd formeel ('U'/'Vous') en wacht op het aanbod van de andere partij om over te schakelen naar 'jij'. Te snel informeel is een faux-pas.",
        },
        {
          text: "Begin altijd met 'U' (of 'Vous' in Wallonië) totdat de ander 'je' voorstelt.",
          answer_tier: 1,
          motivation: "Dit is de gouden regel. De formele aanspreking respecteert de hiërarchie en laat de andere partij het initiatief nemen voor informalisering.",
        },
        {
          text: "Gebruik de voornaam direct, maar houd 'U' als aanspreekvorm.",
          answer_tier: 2,
          motivation: "Een compromis, maar ook dit is in strikt formele contexten niet ideaal. Wacht op het aanbod van de andere partij voor alle vormen van informalisering.",
        },
      ],
      lang: "nl",
    },
    {
      register: "middle-class",
      research_pillar: "adaptive_linguistics",
      phase: 1,
      level: 1,
      region_code: REGION_CODE,
      demographic: "general",
      question_text:
        "U staat met een groep mensen te praten in een Belgische sociale setting. Welke lichaamshouding vermijdt u?",
      historical_context:
        "Belgische lichaamstaal is subtiel en gereserveerd. Uitbundige gebaren of een nonchalante houding worden snel als onbeleefd of arrogant geïnterpreteerd.",
      options: [
        {
          text: "Handen in uw zakken terwijl u praat.",
          answer_tier: 3,
          motivation: "Dit wordt in België ervaren als ongeïnteresseerd of zelfs brutaal. De handen zichtbaar houden toont respect voor de gesprekspartner.",
        },
        {
          text: "Rechtop staan met de handen zichtbaar aan de zijkant of gevouwen voor u.",
          answer_tier: 1,
          motivation: "Dit is de correcte, respectvolle houding in Belgische sociale settings. Het toont aandacht en openheid.",
        },
        {
          text: "Uitbundig gebaren om uw verhaal te benadrukken.",
          answer_tier: 2,
          motivation: "Matig gebaren is aanvaardbaar, maar uitbundig gestikuleren wordt in België eerder als ongepast dan als expressief beschouwd.",
        },
      ],
      lang: "nl",
    },
  ];
}

/** Dutch questions from the comparison table rows */
function buildComparisonTableQuestions(rows) {
  const templates = [
    {
      aspect: /kledij/i,
      question_text:
        "U wordt uitgenodigd op een informeel zakelijk diner in België. Welke kledijkeuze past het best bij de middenklasse-norm?",
      historical_context:
        "In de Belgische middenklasse is de kledijnorm 'Casual Stylish': verzorgd maar niet overdreven formeel. In hogere kringen geldt 'Conservative Luxury': kwaliteitsstoffen zonder opvallende logo's.",
      options: [
        { text: "Nette jeans met een overhemd of blouse — verzorgd maar toegankelijk.", answer_tier: 1, motivation: "Dit is de 'Casual Stylish' norm van de Belgische middenklasse: verzorgd maar niet overdreven formeel." },
        { text: "Een pak of mantelpak met stropdas — veilig is veilig.", answer_tier: 2, motivation: "Soms te formeel voor een informeel diner, maar toont in elk geval respect voor de gastheer." },
        { text: "Vrijetijdskleding of een joggingbroek — het is tenslotte informeel.", answer_tier: 3, motivation: "Dit toont een gebrek aan respect voor de 'publieke arena'. In België is 'informeel' niet hetzelfde als 'onverzorgd'." },
      ],
      lang: "nl",
      level: 1,
    },
    {
      aspect: /conversatie/i,
      question_text:
        "U bent te gast op een Belgisch diner in hogere kringen. Welk gespreksonderwerp vermijdt u absoluut?",
      historical_context:
        "In hogere Belgische kringen zijn geld, salaris en politieke voorkeur taboe gespreksonderwerpen. Bescheidenheid over bezit is de norm — 'inconspicuous consumption' is de ongeschreven regel.",
      options: [
        { text: "Uw recente vakantie en reiservaringen.", answer_tier: 2, motivation: "Aanvaardbaar als u focust op de culturele ervaring en niet op de kosten. Vermijd 'het was duur maar de moeite waard'." },
        { text: "Hoeveel u verdient en hoe succesvol uw bedrijf is dit jaar.", answer_tier: 3, motivation: "In hogere Belgische kringen is praten over geld of salaris een ernstige breuk met de sociale code. Bescheidenheid over bezit is de absolute norm." },
        { text: "Kunst, cultuur en de lokale gastronomie.", answer_tier: 1, motivation: "Dit zijn veilige en gewaardeerde gespreksonderwerpen in hogere Belgische kringen. Ze tonen cultuur en interesse zonder in de taboegebieden te treden." },
      ],
      lang: "nl",
      level: 3,
    },
    {
      aspect: /punctualiteit/i,
      question_text:
        "U bent uitgenodigd op een sociaal evenement bij Belgische middenklasse-vrienden. Het begint om 19u. Wanneer arriveert u?",
      historical_context:
        "In de Belgische middenklasse bestaat 'het academisch kwartiertje' — 5 tot 10 minuten speling is sociaal aanvaard bij sociale events. In hogere kringen is stiptheid echter een teken van respect, en te laat komen zonder bericht een faux-pas.",
      options: [
        { text: "Om 19u stipt — punctualiteit is een deugd.", answer_tier: 2, motivation: "Aanvaardbaar, maar in informele sociale settings een minuut of vijf later kan soms zelfs de gastheer de kans geven om de finishing touches te doen." },
        { text: "Om 19u05 tot 19u10 — het 'academisch kwartiertje' is een Belgische traditie.", answer_tier: 1, motivation: "In de Belgische middenklasse is dit de sociaal geaccepteerde norm voor informele events. Stipt te vroeg kan de gastheer in verlegenheid brengen." },
        { text: "Om 19u30 — de gastheer heeft dan zeker alles klaar.", answer_tier: 3, motivation: "30 minuten te laat zonder bericht is zelfs bij het 'academisch kwartiertje' te veel. Dit is onbeleefd in alle Belgische sociale lagen." },
      ],
      lang: "nl",
      level: 1,
    },
  ];

  const result = [];
  for (const row of rows) {
    const aspect = row[0];
    for (const t of templates) {
      if (t.aspect.test(aspect)) {
        result.push({
          register: "middle-class",
          research_pillar: "social_navigation",
          phase: 1,
          level: t.level,
          region_code: REGION_CODE,
          demographic: "general",
          question_text: t.question_text,
          historical_context: t.historical_context,
          options: t.options,
          lang: t.lang,
        });
        break;
      }
    }
  }
  return result;
}

/** Dutch dining etiquette questions from the tafelmanieren section */
function buildDiningEtiquetteQuestions() {
  return [
    {
      register: "middle-class",
      research_pillar: "social_navigation",
      phase: 1,
      level: 2,
      region_code: REGION_CODE,
      demographic: "general",
      question_text:
        "U zit aan tafel bij een formeel Belgisch diner. Hoe houdt u uw handen korrect?",
      historical_context:
        "In België worden tafelmanieren gezien als de 'lakmoesproef' van iemands opvoeding. De handplaatsing boven tafel met polsen op de rand is een fundamentele norm die in alle sociale lagen wordt verwacht.",
      options: [
        { text: "Handen altijd boven tafel, polsen rustend op de rand — ellebogen van tafel.", answer_tier: 1, motivation: "Dit is de Belgische norm, aangeleerd van jongs af. Het toont 'opvoeding' en respect voor de tafel en de gastheer." },
        { text: "Handen op schoot — dit geeft een ontspannen en informele uitstraling.", answer_tier: 3, motivation: "In België worden handen op schoot snel opgemerkt als een teken van slechte opvoeding. Dit is een veelgemaakte fout van niet-Belgen." },
        { text: "Ellebogen op tafel leunen voor een ontspannen, betrokken houding.", answer_tier: 2, motivation: "Ellebogen op tafel zijn in formele Belgische settings niet aanvaardbaar. Polsen zijn goed; ellebogen niet." },
      ],
      lang: "nl",
    },
    {
      register: "middle-class",
      research_pillar: "social_navigation",
      phase: 1,
      level: 2,
      region_code: REGION_CODE,
      demographic: "general",
      question_text:
        "U wordt brood geserveerd aan tafel tijdens een Belgisch diner. Hoe handelt u correct?",
      historical_context:
        "Het broodprotocol is een van de meest herkenbare etiquette-punten aan de Belgische tafel. Snijden van brood met een mes is een teken van slechte tafelmanieren in formele settings.",
      options: [
        { text: "Snijd het brood met een mes in nette sneetjes voordat u het besmeert.", answer_tier: 3, motivation: "In België wordt brood nooit gesneden met een mes. Dit is een duidelijk teken van onbekendheid met de lokale tafelmanieren." },
        { text: "Breek een klein stukje af met uw handen en besmeer dat stukje individueel.", answer_tier: 1, motivation: "Dit is de correcte Belgische broodetiquette. Elk stukje wordt apart gebroken en individueel gesmeerd — niet het hele sneetje tegelijk." },
        { text: "Breek het halve broodje in twee en besmeer beide helften direct.", answer_tier: 2, motivation: "Beter dan snijden, maar in formele settings is het de bedoeling om kleine stukjes per keer te breken en te smeren." },
      ],
      lang: "nl",
    },
    {
      register: "middle-class",
      research_pillar: "social_navigation",
      phase: 1,
      level: 2,
      region_code: REGION_CODE,
      demographic: "general",
      question_text:
        "U verlaat de tafel tijdelijk tijdens een Belgisch diner. Waar legt u uw servet?",
      historical_context:
        "De servetplaatsing is een subtiel maar duidelijk signaal aan de gastheer en de bediening. Links van het bord betekent 'ik kom terug'; op de stoel is in formele settings onelegant.",
      options: [
        { text: "Op de stoel — zo raakt het niet in de weg.", answer_tier: 2, motivation: "Dit is in informele settings aanvaardbaar maar in formele Belgische diners onelegant. De correcte plek is links van het bord." },
        { text: "Links van het bord, losjes gevouwen.", answer_tier: 1, motivation: "Dit is het correcte signaal: ik kom terug. De bediening begrijpt dit zonder woorden." },
        { text: "Op het bord — dan weet de bediening dat ik klaar ben.", answer_tier: 3, motivation: "Een servet op het bord legt signaleert dat u klaar bent met eten, niet dat u even weg bent. Dit leidt tot verwarring en mogelijk het verwijderen van uw bord." },
      ],
      lang: "nl",
    },
  ];
}

/** Dutch regional nuance questions from the four Belgian regions */
function buildRegionalNuanceQuestions() {
  return [
    {
      register: "professional",
      research_pillar: "adaptive_linguistics",
      phase: 4,
      level: 1,
      region_code: REGION_CODE,
      demographic: "general",
      question_text:
        "U werkt voor het eerst samen met Vlaamse collega's in Antwerpen. Welke communicatiestijl sluit het best aan?",
      historical_context:
        "Vlamingen worden omschreven als 'bescheiden pragmatici'. De sociale code 'Doe maar gewoon, dan doe je al gek genoeg' weerspiegelt hun weerstand tegen overdreven status of emotie. Dit contrasteert sterk met de warmere maar formele Waalse stijl.",
      options: [
        { text: "Gereserveerd en efficiënt — ga snel ter zake en respecteer hun privacy.", answer_tier: 1, motivation: "Vlamingen zijn pragmatisch en hechten waarde aan efficiëntie. Te snel persoonlijk worden is een sociale misstap in Vlaamse professionele context." },
        { text: "Warm, uitbundig en expressief — toon meteen uw enthousiasme.", answer_tier: 2, motivation: "Vlamingen waarderen eerlijkheid en directheid, maar overdaad aan emotie of expressiviteit wekt argwaan." },
        { text: "Formeel en hiërarchisch — gebruik altijd titels en wacht op instructies.", answer_tier: 3, motivation: "Dit is eerder het Waalse of Brusselse register. Vlamingen zijn directer en minder hiërarchisch in hun dagelijkse communicatie." },
      ],
      lang: "nl",
    },
    {
      register: "professional",
      research_pillar: "adaptive_linguistics",
      phase: 4,
      level: 1,
      region_code: REGION_CODE,
      demographic: "general",
      question_text:
        "U legt een eerste contact met Waalse zakenpartners in Luik. Wat is de grootste culturele valkuil?",
      historical_context:
        "In Wallonië ('De Warme Formalisten') is gastvrijheid een culturele pijler. Diners duren langer en zijn uitbundiger. Het gebruik van titels is hier meer ingeburgerd dan in Vlaanderen, maar de omgang is hartelijker.",
      options: [
        { text: "Te snel zakelijk worden zonder eerst een persoonlijke band op te bouwen.", answer_tier: 1, motivation: "In Wallonië bouwt men eerst een persoonlijke relatie op voordat men ter zake komt. Overslaan van dit relationele proces wordt als koud en respectloos ervaren." },
        { text: "Te informeel zijn en voornamen gebruiken bij de eerste ontmoeting.", answer_tier: 2, motivation: "Dit is ook een risico, maar minder bepalend dan het ontbreken van relationele opbouw. Titels zijn in Wallonië inderdaad gebruikelijker." },
        { text: "Niet genoeg Frans spreken — Walen weigeren in het Nederlands te communiceren.", answer_tier: 3, motivation: "Hoewel Frans de voorkeurstaal is in Wallonië, weigeren Walen zelden te communiceren in een andere taal als de wil er is. Het gebrek aan relationele investering is de grotere valkuil." },
      ],
      lang: "nl",
    },
    {
      register: "professional",
      research_pillar: "adaptive_linguistics",
      phase: 4,
      level: 2,
      region_code: REGION_CODE,
      demographic: "general",
      question_text:
        "U bent aanwezig op een eerste professionele vergadering in Brussel. Wat onderscheidt Brusselse etiquette van de andere regio's?",
      historical_context:
        "Brussel is een smeltkroes waar Belgische regels worden gemengd met internationale etiquette (EU/NAVO). De stad is officieel tweetalig, maar in de praktijk dominant Franstalig met een grote internationale gemeenschap.",
      options: [
        { text: "Meertaligheid en het schakelen tussen talen zijn de norm — oogcontact en herhalen van de naam zijn cruciaal.", answer_tier: 1, motivation: "In Brussel is men gewend aan een internationale context. Moeiteloos schakelen tussen talen en diplomatisch formuleren zijn de kernvaardigheden." },
        { text: "Brusselaars zijn het meest formeel — gebruik altijd titels en wacht op het initiatief van de gastheer.", answer_tier: 2, motivation: "Formaliteit is aanwezig, maar in Brussel is het meer gebonden aan professionele status dan aan traditie. Dit is een versimpeling." },
        { text: "Brussel volgt dezelfde regels als Vlaanderen — begin gewoon in het Nederlands.", answer_tier: 3, motivation: "Brussel is geen Vlaamse stad. Nederlands starten kan als taalnationalisme overkomen. Linguïstische neutraliteit is de standaard." },
      ],
      lang: "nl",
    },
    {
      register: "professional",
      research_pillar: "adaptive_linguistics",
      phase: 4,
      level: 1,
      region_code: REGION_CODE,
      demographic: "general",
      question_text:
        "U werkt samen met iemand uit de Duitstalige Gemeenschap in de Oostkantons. Wat is een cruciaal verschil met de andere Belgische regio's?",
      historical_context:
        "De Duitstalige Gemeenschap combineert Belgische hartelijkheid met een meer Germaanse discipline. Punctualiteit is hier heiliger dan in de rest van België, en formaliteit in aanspreekvorm is de norm.",
      options: [
        { text: "Punctualiteit is heilig — 5 minuten te laat is hier een grotere belediging dan elders in België.", answer_tier: 1, motivation: "In de Duitstalige Gemeenschap is punctualiteit een fundamentele waarde die sterker aanwezig is dan in andere Belgische regio's. Men gebruikt altijd de achternaam tot expliciet anders gevraagd." },
        { text: "Men is informeler dan in Brussel — voornamen zijn snel de norm.", answer_tier: 3, motivation: "Het tegendeel is waar. De Duitstalige Gemeenschap is formeler qua aanspreekvorm: men gebruikt altijd de achternaam tot expliciet anders gevraagd." },
        { text: "Er is geen significant verschil met Vlaamse etiquette.", answer_tier: 2, motivation: "Er zijn overeenkomsten, maar de Germaanse invloed op discipline, punctualiteit en formaliteit maakt de Duitstalige Gemeenschap duidelijk onderscheidend." },
      ],
      lang: "nl",
    },
  ];
}

/**
 * Minimalistic CSV row parser that handles quoted fields with doubled quotes.
 */
function parseCSVRow(row) {
  const cols = [];
  let current = "";
  let inQuote = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      if (inQuote && row[i + 1] === '"') { current += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === "," && !inQuote) {
      cols.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cols.push(current);
  return cols;
}

/**
 * Build Dutch Q&A questions from the numbered knowledge points extracted
 * from the compas file. Each point becomes one Dutch (nl) question.
 */
function buildDutchKnowledgeQuestions(points) {
  const templates = [
    {
      titleMatch: /stilte/i,
      question_text: "Een Belgische collega zegt niets na uw voorstel en laat een lange stilte vallen. Wat betekent dit het meest waarschijnlijk?",
      options: [
        {
          text: "Hij stemt in — in België betekent stilte instemming.",
          answer_tier: 3,
          motivation: "Dit is een veelgemaakte misinterpretatie. Belgische stilte is bijna nooit instemming.",
        },
        {
          text: "Hij denkt nog na. Dring niet aan — de beslissing komt later, via een derde of per mail.",
          answer_tier: 1,
          motivation: "Belgen, vooral Vlamingen, gebruiken stilte strategisch als teken van serieuze overweging, niet als instemming of weigering.",
        },
        {
          text: "Hij is beleefd aan het weigeren — Belgen zeggen nooit rechtstreeks nee.",
          answer_tier: 2,
          motivation: "Hoewel Belgen soms indirect zijn, is stilte niet automatisch een beleefde weigering. Context en relatie bepalen de betekenis.",
        },
      ],
      historical_context:
        "De Belgische stilte als communicatiemiddel is cultureel uniek. Een niet-Belg die aandringt na een stilte, overtreedt een ongeschreven regel.",
      lang: "nl",
      register: "professional",
      phase: 1,
      level: 2,
    },
    {
      titleMatch: /onderscheid.*kennis.*vriend|kennis.*vriend/i,
      question_text: "Een Belgische zakenrelatie nodigt u na twee jaar uit voor een zakenlunch. U denkt dat jullie nu vrienden zijn. Is dat zo?",
      options: [
        {
          text: "Ja — een uitnodiging na twee jaar bevestigt vriendschap in België.",
          answer_tier: 3,
          motivation: "Dit is een veelgemaakte fout. In België onderscheidt men streng tussen 'kennis' en 'vriend'. Een zakenlunch maakt u geen vriend.",
        },
        {
          text: "Nee — een echte vriendschap blijkt pas wanneer u thuis wordt uitgenodigd en aan de partner wordt voorgesteld.",
          answer_tier: 1,
          motivation: "In België wordt vriendschap nooit hardop benoemd, maar blijkt uit concrete daden: uitgenodigd worden thuis is de drempel.",
        },
        {
          text: "Waarschijnlijk wel, maar het is beleefd om dit niet expliciet te benoemen.",
          answer_tier: 2,
          motivation: "Bescheiden, maar onjuist. De Belgische drempel voor echte vriendschap ligt veel hoger dan in veel andere culturen.",
        },
      ],
      historical_context:
        "In België is een thuisbezoek een significante sociale promotie, geen vanzelfsprekendheid. Dit onderscheid is cultureel diepgeworteld en verwarrend voor buitenlanders.",
      lang: "nl",
      register: "professional",
      phase: 1,
      level: 2,
    },
    {
      titleMatch: /cadeau/i,
      question_text: "U brengt bloemen mee als cadeau bij een Belgisch gezin thuis. Welk type bloemen vermijdt u absoluut?",
      options: [
        {
          text: "Rozen — te romantisch voor een eerste thuisbezoek.",
          answer_tier: 2,
          motivation: "Rozen kunnen inderdaad een verkeerde boodschap sturen in sommige contexten, maar zijn niet het grootste protocol-risico.",
        },
        {
          text: "Chrysanten — in België symbool voor de dood en rouw.",
          answer_tier: 1,
          motivation: "Chrysanten worden in België strikt geassocieerd met rouw en begrafenissen. Ze meebrengen als cadeau is een ernstige faux-pas.",
        },
        {
          text: "Tulpen — te alledaags voor een formeel bezoek.",
          answer_tier: 3,
          motivation: "Tulpen zijn een volkomen aanvaardbare keuze voor een thuisbezoek. Het vermijden van chrysanten is het echte protocol-punt.",
        },
      ],
      historical_context:
        "In België worden cadeaus zelden direct geopend in aanwezigheid van de gever. In hogere kringen wordt een handgeschreven bedankbriefje binnen 48 uur verwacht.",
      lang: "nl",
      register: "middle-class",
      phase: 1,
      level: 2,
    },
    {
      titleMatch: /humor/i,
      question_text: "U bent op een Belgisch feestje met zowel Vlamingen als Walen. Welk type humor is sociaal het veiligst?",
      options: [
        {
          text: "Grappen over de communautaire spanningen tussen Vlamingen en Walen — dit breekt het ijs.",
          answer_tier: 3,
          motivation: "Dit is het enige absolute taboe in gemengd Belgisch gezelschap. Grappen over de taaldiscussie worden zelden goed ontvangen.",
        },
        {
          text: "Milde zelfspot en droge ironie — en aansluiten bij Belgische grappen over België zelf.",
          answer_tier: 1,
          motivation: "Belgen lachen graag om zichzelf en hun land. Zelfspot is een bindmiddel in Belgische sociale kringen.",
        },
        {
          text: "Geen humor gebruiken — de Belgen zijn te formeel voor grappen.",
          answer_tier: 2,
          motivation: "Belgen waarderen humor zeker, maar droge ironie en zelfspot zijn de sleutel — niet openlijk formalisme.",
        },
      ],
      historical_context:
        "Zelfspot en droge ironie zijn bindmiddel in Belgische sociale kringen. Een buitenstaander die dit mist, wordt als 'te serieus' of 'te Nederlands' beschouwd.",
      lang: "nl",
      register: "middle-class",
      phase: 1,
      level: 2,
    },
    {
      titleMatch: /zakelijk diner|privédiner/i,
      question_text: "U bent gastheer bij een zakelijk diner in België. Wanneer bespreekt u zakelijke onderwerpen?",
      options: [
        {
          text: "Direct bij aankomst — efficiëntie is in België een teken van respect.",
          answer_tier: 3,
          motivation: "In de Belgische zakencultuur wordt business pas na het hoofdgerecht besproken. Direct beginnen wordt als ongepast beschouwd.",
        },
        {
          text: "Na het hoofdgerecht — de maaltijd zelf is de relatieopbouwfase.",
          answer_tier: 1,
          motivation: "Bij een zakelijk diner in België is het protocol: eerst genieten, daarna zaken. Het initiatief om te betalen ligt bij de uitnodiger.",
        },
        {
          text: "Wanneer de wijn is ingeschonken — dat is het informele startsignaal.",
          answer_tier: 2,
          motivation: "Dit varieert per context, maar in formele Belgische settings is na het hoofdgerecht de geaccepteerde norm.",
        },
      ],
      historical_context:
        "In hogere kringen betaalt de gastheer stilzwijgend, zonder zichtbare transactie. Het betwisten van de rekening is een sociale faux-pas.",
      lang: "nl",
      register: "professional",
      phase: 1,
      level: 3,
    },
    {
      titleMatch: /digitale etiquette|WhatsApp|LinkedIn/i,
      question_text: "Een Belgische klant stuurt u een niet-urgente WhatsApp op zondagavond. Hoe reageert u?",
      options: [
        {
          text: "Meteen antwoorden om te tonen dat u altijd beschikbaar bent.",
          answer_tier: 2,
          motivation: "Dit signaleert een gebrek aan grenzen. In de Belgische middenklasse is 'kwaliteit van leven' een teken van een succesvolle professional.",
        },
        {
          text: "Maandagochtend tijdens professionele uren een verzorgd antwoord sturen.",
          answer_tier: 1,
          motivation: "Dit handhaaft de privé/zakelijk-grens en beschermt uw professioneel imago. De klant verwacht geen onmiddellijk antwoord op een niet-urgente vraag.",
        },
        {
          text: "Het bericht negeren en er nooit meer op terugkomen.",
          answer_tier: 3,
          motivation: "Dit is onbetrouwbaar. Ook al wacht u tot maandag, u moet de communicatie uiteindelijk erkennen.",
        },
      ],
      historical_context:
        "Een Belg die niet reageert op een LinkedIn-verzoek wijst u niet af — hij kent u gewoon nog niet goed genoeg. Digitale etiquette volgt dezelfde regels als fysieke: discretie en timing zijn alles.",
      lang: "nl",
      register: "professional",
      phase: 1,
      level: 2,
    },
  ];

  const result = [];
  for (const p of points) {
    for (const t of templates) {
      if (t.titleMatch.test(p.title)) {
        result.push({
          register: t.register,
          research_pillar: "adaptive_linguistics",
          phase: t.phase,
          level: t.level,
          region_code: REGION_CODE,
          demographic: "general",
          question_text: t.question_text,
          historical_context: t.historical_context,
          options: t.options,
          lang: t.lang,
        });
        break;
      }
    }
  }
  return result;
}

// ── Parser: Blueprint file ────────────────────────────────────────────────────

/**
 * Parse Blueprint_2_Middleclass_Fullrollout_1777029609666.md.
 *
 * The Blueprint is a structural specification document, not a content source.
 * This parser extracts the Phase 4 / Phase 5 module definitions and builds
 * a map used to validate and enrich records from other sources.
 *
 * Returns an object: { phases: Map<number, { modules: string[] }> }
 */
function parseBlueprintFile(filePath) {
  const text = readFileSync(filePath, "utf8");
  const meta = {
    phases: new Map(),
    modules: {},
  };

  // Extract module definitions: "### Module X — Name"
  const moduleRegex = /###\s+Module\s+([A-G])\s*[—–-]+\s*(.+)/g;
  let m;
  while ((m = moduleRegex.exec(text)) !== null) {
    const code = m[1].toUpperCase();
    const name = m[2].trim();
    meta.modules[code] = name;
  }

  // Extract phase → audience mapping from the table
  // | Phase | Audience | Priority | Scope |
  const phaseRowRegex = /\|\s*Phase\s+(\d+)[–-]?(\d+)?\s*\|\s*(\w[^|]+)\|/g;
  while ((m = phaseRowRegex.exec(text)) !== null) {
    const phaseFrom = parseInt(m[1], 10);
    const phaseTo = m[2] ? parseInt(m[2], 10) : phaseFrom;
    const audience = m[3].trim();
    for (let p = phaseFrom; p <= phaseTo; p++) {
      meta.phases.set(p, { audience });
    }
  }

  return meta;
}

// ── Walloon French questions ──────────────────────────────────────────────────

/**
 * French-language (lang: "fr") questions covering Walloon etiquette.
 * Authored directly from the compas source material (Wallonie section).
 */
function buildWalloonFrenchQuestions() {
  return [
    {
      register: "professional",
      research_pillar: "adaptive_linguistics",
      phase: 4,
      level: 2,
      region_code: REGION_CODE,
      demographic: "general",
      question_text:
        "Vous commencez une collaboration avec des partenaires wallons à Liège. Comment construisez-vous la relation professionnelle ?",
      historical_context:
        "En Wallonie, la relation personnelle précède toujours la relation d'affaires. Les dîners durent plus longtemps et sont plus chaleureux qu'en Flandre. L'utilisation des titres (Monsieur/Madame) reste plus répandue qu'au nord du pays.",
      options: [
        {
          text: "Passez directement à l'agenda professionnel — l'efficacité est une marque de respect.",
          answer_tier: 3,
          motivation:
            "En Wallonie, aborder les affaires sans avoir établi un rapport personnel préalable est perçu comme froid et irrespectueux. C'est une erreur fréquente des non-Belges.",
        },
        {
          text: "Construisez d'abord un lien personnel lors de repas informels avant d'aborder les sujets professionnels.",
          answer_tier: 1,
          motivation:
            "L'hospitalité est une valeur centrale de la culture wallonne. Bâtir une relation via des interactions sociales est une condition préalable, pas une option.",
        },
        {
          text: "Envoyez une lettre formelle avec votre proposition avant de vous rencontrer.",
          answer_tier: 2,
          motivation:
            "Cela témoigne d'un respect formel, mais manque de la chaleur personnelle attendue dans la culture d'affaires wallonne. Le contact direct est préférable.",
        },
      ],
      lang: "fr",
    },
    {
      register: "professional",
      research_pillar: "adaptive_linguistics",
      phase: 4,
      level: 1,
      region_code: REGION_CODE,
      demographic: "general",
      question_text:
        "Vous arrivez à une réception professionnelle à Namur. Comment saluez-vous une personne que vous connaissez peu ?",
      historical_context:
        "En Wallonie, la 'bise' (les baisers sur la joue) s'impose plus rapidement qu'en Flandre. La tradition des trois baisers (gauche-droite-gauche) est plus répandue dans les cercles wallons et bruxellois traditionnels.",
      options: [
        {
          text: "Une poignée de main ferme suffit — c'est professionnel et neutre.",
          answer_tier: 2,
          motivation:
            "Acceptable dans un contexte très formel, mais en Wallonie la 'bise' s'impose rapidement même en contexte professionnel. Rester à la poignée de main peut paraître froid.",
        },
        {
          text: "Attendez son initiative pour la 'bise' : un ou trois baisers selon les usages locaux.",
          answer_tier: 1,
          motivation:
            "Laisser l'initiative à l'autre personne est la règle d'or. En Wallonie, trois baisers (gauche-droite-gauche) est la norme pour les personnes que l'on connaît bien.",
        },
        {
          text: "Embrassez directement — c'est la manière chaleureuse de se saluer en Wallonie.",
          answer_tier: 3,
          motivation:
            "Initier une 'bise' sans attendre le signal de l'autre personne est une violation de la règle de l'initiative. Cela peut créer de la gêne, même en Wallonie.",
        },
      ],
      lang: "fr",
    },
    {
      register: "middle-class",
      research_pillar: "social_navigation",
      phase: 4,
      level: 2,
      region_code: REGION_CODE,
      demographic: "general",
      question_text:
        "Vous êtes invité à dîner chez des Wallons. Que devez-vous apporter comme cadeau ?",
      historical_context:
        "En Belgique, les cadeaux sont rarement ouverts immédiatement en présence du donateur. Dans les milieux plus aisés, une lettre de remerciement manuscrite dans les 48 heures est attendue, pas optionnelle.",
      options: [
        {
          text: "Des chrysanthèmes — des fleurs élégantes et durables.",
          answer_tier: 3,
          motivation:
            "Les chrysanthèmes sont en Belgique le symbole du deuil. Les offrir est une faute grave de protocole, quelle que soit la région.",
        },
        {
          text: "Un bon vin ou des chocolats belges de qualité.",
          answer_tier: 1,
          motivation:
            "Ce sont les choix classiques et sûrs. Évitez les nombres impairs de fleurs (association avec le deuil) et tout ce qui porte ostensiblement les logos de marques luxueuses.",
        },
        {
          text: "Rien — l'invitation elle-même est déjà un honneur suffisant.",
          answer_tier: 2,
          motivation:
            "Dans certains milieux informels c'est acceptable, mais une invitation à dîner en Wallonie est une promotion sociale significative. Arriver les mains vides peut décevoir l'hôte.",
        },
      ],
      lang: "fr",
    },
  ];
}

// ── Brussels bilingual questions ──────────────────────────────────────────────

/**
 * Brussels-specific questions covering the capital's unique bilingual/diplomatic register.
 * Authored from the compas source material.
 */
function buildBrusselsQuestions() {
  return [
    {
      register: "professional",
      research_pillar: "adaptive_linguistics",
      phase: 4,
      level: 3,
      region_code: REGION_CODE,
      demographic: "general",
      question_text:
        "You are at a professional reception in Brussels. You do not know your counterpart's language preference. How do you open the conversation?",
      historical_context:
        "Brussels is officially bilingual (French/Dutch) but is predominantly French-speaking in practice, with a large international community. Language mistakes are rarely taken as offence, but language awareness is deeply appreciated.",
      options: [
        {
          text: "Open in English or with a bilingual greeting ('Bonjour/Goeidag') and let them signal their preferred language.",
          answer_tier: 1,
          motivation:
            "Linguistic neutrality is the Brussels professional standard. A neutral or bilingual opening allows the other person to choose without awkwardness.",
        },
        {
          text: "Open in Dutch — you are in Belgium and Dutch is an official language.",
          answer_tier: 2,
          motivation:
            "Technically correct but can feel presumptuous. Brussels is majority French-speaking in practice; defaulting to Dutch may come across as tone-deaf.",
        },
        {
          text: "Ask directly: 'Do you speak French or Dutch?' before saying anything else.",
          answer_tier: 3,
          motivation:
            "Too abrupt as an opener. A neutral bilingual greeting achieves the same goal more diplomatically.",
        },
      ],
      lang: "en",
    },
  ];
}

// ── Main ─────────────────────────────────────────────────────────────────────

const middenklassePath = resolve(ROOT, "attached_assets/Belgie_middenklasse_1777029671936.md");
const compassPath     = resolve(ROOT, "attached_assets/belgie_compas_1777029671936.md");
const blueprintPath   = resolve(ROOT, "attached_assets/Blueprint_2_Middleclass_Fullrollout_1777029609666.md");
const outDir          = resolve(ROOT, "data");
const outPath         = resolve(outDir, "be-learning-tracks.json");

// 1. Parse middenklasse Q&A content (English, Phase 1)
console.log("Parsing Belgie_middenklasse …");
const middenklasseQuestions = parseMiddenklasseFile(middenklassePath);
console.log(`  → ${middenklasseQuestions.length} valid questions`);

// 2. Parse compas file (Dutch + English scenario tables)
console.log("Parsing belgie_compas …");
const compassQuestions = parseCompassFile(compassPath);
console.log(`  → ${compassQuestions.length} questions (scenario table + knowledge points)`);

// 3. Parse blueprint file (structural metadata — no content questions)
console.log("Parsing Blueprint …");
const blueprintMeta = parseBlueprintFile(blueprintPath);
console.log(`  → Modules extracted: ${Object.keys(blueprintMeta.modules).join(", ")}`);
console.log(`  → Phase mapping: Phases ${[...blueprintMeta.phases.keys()].sort().join(", ")} defined`);

// 4. Walloon French questions
console.log("Building Walloon French (fr) questions …");
const frenchQuestions = buildWalloonFrenchQuestions();
console.log(`  → ${frenchQuestions.length} French questions`);

// 5. Brussels questions
console.log("Building Brussels questions …");
const brusselsQuestions = buildBrusselsQuestions();
console.log(`  → ${brusselsQuestions.length} Brussels questions`);

// Merge all sources
const allQuestions = [
  ...middenklasseQuestions,
  ...compassQuestions,
  ...frenchQuestions,
  ...brusselsQuestions,
];

// Deduplicate by content hash
const seen = new Set();
const deduped = allQuestions.filter((q) => {
  const key = `${q.region_code}|${q.register}|${q.phase}|${q.level}|${q.demographic}|${q.lang}|${q.question_text.slice(0, 120)}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

console.log(`\nTotal after dedup: ${deduped.length} (${allQuestions.length - deduped.length} duplicates removed)`);

// Final strict validation — no auto-repair, fail fast
let dropped = 0;
const output = [];

for (const q of deduped) {
  const required = ["register", "phase", "level", "region_code", "demographic", "question_text", "lang"];
  const missing = required.filter((f) => !q[f] && q[f] !== 0);
  if (missing.length > 0) { dropped++; continue; }

  if (!Array.isArray(q.options) || q.options.length < 2) { dropped++; continue; }

  const tier1Count = q.options.filter((o) => o.answer_tier === 1).length;
  if (tier1Count !== 1) { dropped++; continue; }

  const hasEmptyMot = q.options.some((o) => !o.motivation || !o.text);
  if (hasEmptyMot) { dropped++; continue; }

  output.push(q);
}

console.log(`\nFinal: ${output.length} valid records, ${dropped} dropped`);

// Language breakdown
const langs = output.reduce((a, q) => { a[q.lang] = (a[q.lang] || 0) + 1; return a; }, {});
console.log("Language breakdown:", langs);

// Tier-1 integrity check
const multiTier1 = output.filter((q) => q.options.filter((o) => o.answer_tier === 1).length !== 1).length;
console.log("Questions with exactly one tier-1:", output.length - multiTier1, `(${multiTier1} violations)`);

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, JSON.stringify(output, null, 2), "utf8");
console.log(`\n✓ Written ${output.length} questions to ${outPath}`);
