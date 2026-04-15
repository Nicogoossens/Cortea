#!/usr/bin/env node
/**
 * SOWISO Elite Register Translation Worker
 * Detects missing i18n keys per language and auto-translates them via Anthropic Claude.
 * Writes results directly back into src/lib/i18n.tsx.
 *
 * Usage:
 *   node scripts/translate.mjs [--dry-run] [--lang nl] [--lang fr]
 *
 * Options:
 *   --dry-run   Print what would be added without writing the file
 *   --lang XX   Only translate one or more specific languages (e.g. --lang nl --lang fr)
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const i18nPath = join(__dirname, "../src/lib/i18n.tsx");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const langFilter = args.reduce((acc, arg, i) => {
  if (arg === "--lang" && args[i + 1]) acc.push(args[i + 1]);
  return acc;
}, []);

// ─── Config ─────────────────────────────────────────────────────────────────

const ANTHROPIC_BASE = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
const ANTHROPIC_KEY  = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;

if (!ANTHROPIC_KEY) {
  console.error("❌  AI_INTEGRATIONS_ANTHROPIC_API_KEY is not set.");
  process.exit(1);
}

const LANGUAGE_NAMES = {
  nl: "Dutch (formal, polished register — tu/u distinction, u preferred for formality)",
  fr: "French (formal, elegant register — vouvoiement (vous), sophistiqué)",
  de: "German (formal, refined register — Sie form, gepflegt und höflich)",
  es: "Spanish (formal, distinguished register — usted, refinado y elegante)",
  pt: "Portuguese (formal, cultured register — você/senhor(a), refinado)",
  it: "Italian (formal, refined register — Lei form, elegante e colto)",
  hi: "Hindi (formal, refined register — aap/आप form, परिष्कृत और भव्य)",
};

// Keys where the value should NOT be translated (proper nouns, unchanged across languages)
const SKIP_TRANSLATION_PATTERNS = [
  /^app\.name$/,
  /^app\.established$/,
  /^atelier\.duration$/,
];

function shouldSkip(key) {
  return SKIP_TRANSLATION_PATTERNS.some((pat) => pat.test(key));
}

// ─── Parse i18n.tsx ──────────────────────────────────────────────────────────

const source = readFileSync(i18nPath, "utf8");

/**
 * Extract all key→value pairs for a language block.
 * Returns a Map<key, value>.
 */
function extractLangBlock(src, lang) {
  // Find the language block — it starts at "  XX: {" and ends at the matching closing "  },"
  // We use a simple line-by-line approach since the file is well-structured.
  const lines = src.split("\n");
  const startPattern = new RegExp(`^  ${lang}: \\{`);
  let depth = 0;
  let inBlock = false;
  const blockLines = [];

  for (const line of lines) {
    if (!inBlock && startPattern.test(line)) {
      inBlock = true;
      depth = 1;
      continue;
    }
    if (!inBlock) continue;

    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;
    depth += opens - closes;

    if (depth <= 0) break;
    blockLines.push(line);
  }

  const kvRegex = /^\s+"([^"]+)":\s+"((?:[^"\\]|\\.)*)"/;
  const map = new Map();
  for (const line of blockLines) {
    const m = line.match(kvRegex);
    if (m) map.set(m[1], m[2]);
  }
  return map;
}

const enMap = extractLangBlock(source, "en");
const allLangs = Object.keys(LANGUAGE_NAMES);
const targetLangs = langFilter.length > 0 ? langFilter.filter((l) => allLangs.includes(l)) : allLangs;

console.log(`\nSOWISO Translation Worker`);
console.log(`English keys: ${enMap.size}`);
console.log(`Target languages: ${targetLangs.join(", ")}`);
if (dryRun) console.log(`Mode: DRY RUN — no files will be written\n`);
else console.log(`Mode: LIVE — i18n.tsx will be updated\n`);
console.log("─".repeat(60));

// ─── Translation via Anthropic ───────────────────────────────────────────────

async function translateBatch(lang, keysToTranslate) {
  const langDesc = LANGUAGE_NAMES[lang];
  const enEntries = keysToTranslate.map((k) => `${k}: ${enMap.get(k)}`).join("\n");

  const systemPrompt = `You are the voice of SOWISO — an elite etiquette intelligence platform. 
Your tone is formal, composed, and distinguished. 

Translate the following English i18n key-value pairs into ${langDesc}.

Rules:
- Preserve the exact key names (left of the colon)
- Translate only the values (right of the colon)
- Maintain the same level of formality and elegance as the English original
- Preserve placeholder tokens like {n}, {limit}, {current}, {total} exactly as-is
- For names like "SOWISO", "The Atelier", "The Counsel", "The Compass", "The Guest", "The Traveller", "The Ambassador", "The Aware", "The Composed", "The Refined", "The Distinguished", "The Sovereign" — keep these proper nouns in English
- Keep "Noble Score" in English
- Return ONLY a JSON object mapping key → translated value. No markdown, no explanation.

Example output format:
{
  "app.tagline": "L'art de la conduite",
  "nav.dashboard": "Le Tableau de Bord"
}`;

  const userMessage = `Translate these English values to ${lang}:\n\n${enEntries}`;

  const response = await fetch(`${ANTHROPIC_BASE}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text ?? "";

  try {
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}") + 1;
    return JSON.parse(text.slice(jsonStart, jsonEnd));
  } catch {
    throw new Error(`Failed to parse JSON response: ${text.slice(0, 200)}`);
  }
}

// ─── Update i18n.tsx ─────────────────────────────────────────────────────────

function injectTranslations(src, lang, translations) {
  const lines = src.split("\n");
  const startPattern = new RegExp(`^  ${lang}: \\{`);
  let depth = 0;
  let inBlock = false;
  let insertIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!inBlock && startPattern.test(line)) {
      inBlock = true;
      depth = 1;
      continue;
    }
    if (!inBlock) continue;

    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;
    depth += opens - closes;

    if (depth <= 0) {
      insertIndex = i;
      break;
    }
  }

  if (insertIndex === -1) {
    throw new Error(`Could not find closing brace for language block: ${lang}`);
  }

  const newLines = Object.entries(translations)
    .map(([k, v]) => `    "${k}": "${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}",`);

  // Add blank line separator if there are lines to insert
  if (newLines.length > 0) {
    newLines.unshift(""); // blank separator line
  }

  lines.splice(insertIndex, 0, ...newLines);
  return lines.join("\n");
}

// ─── Main ────────────────────────────────────────────────────────────────────

const BATCH_SIZE = 40; // Translate in chunks to avoid token limits

let updatedSource = source;
let totalAdded = 0;

for (const lang of targetLangs) {
  const langMap = extractLangBlock(updatedSource, lang);
  const missingKeys = [...enMap.keys()].filter(
    (k) => !langMap.has(k) && !shouldSkip(k)
  );

  if (missingKeys.length === 0) {
    console.log(`✓  ${lang.padEnd(4)} — already complete (${langMap.size} keys)`);
    continue;
  }

  console.log(`\n⟳  ${lang.padEnd(4)} — translating ${missingKeys.length} missing key(s)…`);

  let allTranslations = {};

  // Process in batches
  for (let i = 0; i < missingKeys.length; i += BATCH_SIZE) {
    const batch = missingKeys.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(missingKeys.length / BATCH_SIZE);

    if (totalBatches > 1) {
      process.stdout.write(`     batch ${batchNum}/${totalBatches}… `);
    }

    try {
      const translated = await translateBatch(lang, batch);
      allTranslations = { ...allTranslations, ...translated };
      if (totalBatches > 1) console.log("done");
    } catch (err) {
      console.error(`\n  ✗  Batch ${batchNum} failed: ${err.message}`);
      // Continue with next batch
    }
  }

  const addedCount = Object.keys(allTranslations).length;
  totalAdded += addedCount;

  if (dryRun) {
    console.log(`\n  Would add ${addedCount} key(s) to [${lang}]:`);
    Object.entries(allTranslations).forEach(([k, v]) => {
      console.log(`    "${k}": "${v}"`);
    });
  } else {
    updatedSource = injectTranslations(updatedSource, lang, allTranslations);
    console.log(`  ✓  Added ${addedCount} key(s) to [${lang}]`);
  }
}

console.log("\n" + "─".repeat(60));

if (!dryRun && totalAdded > 0) {
  writeFileSync(i18nPath, updatedSource, "utf8");
  console.log(`\n✓  i18n.tsx updated — ${totalAdded} translation(s) added across ${targetLangs.length} language(s).\n`);
} else if (dryRun && totalAdded > 0) {
  console.log(`\n  DRY RUN complete — ${totalAdded} translation(s) would be added. Run without --dry-run to apply.\n`);
} else {
  console.log(`\n✓  All translations already complete. Nothing to do.\n`);
}
