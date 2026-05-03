#!/usr/bin/env node
/**
 * Translates UI translation keys to a target language using Claude via the
 * Replit AI Integrations proxy.
 *
 * The system prompt is anchored on the SOWISO social-class registers
 * (Elite + Middle Class) defined in `lib/db/src/schema/social-class-config.ts`,
 * so every translation is produced with the correct tone for the active
 * register variant of the source string.
 *
 * Usage:
 *   node scripts/translate-ui.mjs --lang ar               # all keys, all 9 langs work
 *   node scripts/translate-ui.mjs --lang ar --missing     # only fill in missing keys
 *   node scripts/translate-ui.mjs --all --missing         # fill missing keys for every locale
 *   node scripts/translate-ui.mjs --lang ar --force       # rewrite even if file already has keys
 *   node scripts/translate-ui.mjs --lang ar --register middle_class
 *
 * Output: artifacts/sowiso/src/locales/{lang}/translation.json
 *         + mirrored copy in artifacts/sowiso/public/locales/{lang}/translation.json
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import {
  REGISTER_DESCRIPTIONS,
  isValidRegister,
} from "./lib/register-prompts.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SRC_LOCALES = resolve(ROOT, "artifacts/sowiso/src/locales");
const PUB_LOCALES = resolve(ROOT, "artifacts/sowiso/public/locales");

const args = process.argv.slice(2);
const langIdx = args.indexOf("--lang");
const LANG = langIdx !== -1 ? args[langIdx + 1] : null;
const ALL = args.includes("--all");
const FORCE = args.includes("--force");
const MISSING = args.includes("--missing");
const regIdx = args.indexOf("--register");
const REGISTER = regIdx !== -1 ? args[regIdx + 1] : "elite"; // elite | middle_class

if (!LANG && !ALL) {
  console.error("Usage: node scripts/translate-ui.mjs --lang <code> [--missing] [--force] [--register elite|middle_class]");
  console.error("       node scripts/translate-ui.mjs --all --missing");
  process.exit(1);
}

// All 9 non-English locales the SOWISO front-end ships with.
const LANG_CONFIG = {
  nl: { name: "Dutch (Nederlands)" },
  fr: { name: "French (Français)" },
  de: { name: "German (Deutsch)" },
  es: { name: "Spanish (Español)" },
  pt: { name: "Portuguese (Português)" },
  it: { name: "Italian (Italiano)" },
  ar: { name: "Arabic (العربية)", rtl: true },
  ja: { name: "Japanese (日本語)" },
  zh: { name: "Chinese (中文)" },
};

if (!isValidRegister(REGISTER)) {
  console.error(`Unsupported --register: ${REGISTER}. Use 'elite' or 'middle_class'.`);
  process.exit(1);
}

const TARGET_LANGS = ALL
  ? Object.keys(LANG_CONFIG)
  : (LANG_CONFIG[LANG] ? [LANG] : (() => {
      console.error(`Unsupported language: ${LANG}. Supported: ${Object.keys(LANG_CONFIG).join(", ")}`);
      process.exit(1);
    })());

// Read English source — prefer src/locales, fall back to public/locales
const enSrcPath = existsSync(resolve(SRC_LOCALES, "en", "translation.json"))
  ? resolve(SRC_LOCALES, "en", "translation.json")
  : resolve(PUB_LOCALES, "en", "translation.json");
const enKeys = JSON.parse(readFileSync(enSrcPath, "utf8"));

// ── Anthropic via Replit AI Integrations proxy ─────────────────────────────
const AI_BASE = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
const AI_KEY  = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
if (!AI_BASE || !AI_KEY) {
  console.error("AI_INTEGRATIONS_ANTHROPIC_BASE_URL and AI_INTEGRATIONS_ANTHROPIC_API_KEY must be set.");
  process.exit(1);
}

async function callClaude(systemPrompt, userPrompt) {
  const res = await fetch(`${AI_BASE}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": AI_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

function buildSystemPrompt(langName) {
  return [
    `You are a professional translator producing a ${langName} translation`,
    `of UI strings for SOWISO, an etiquette intelligence application.`,
    ``,
    `Both supported social-class registers are defined below. Apply the`,
    `${REGISTER === "elite" ? "ELITE" : "MIDDLE CLASS"} variant to every translation in this batch.`,
    ``,
    REGISTER_DESCRIPTIONS.elite,
    ``,
    REGISTER_DESCRIPTIONS.middle_class,
    ``,
    `Active register for this batch: ${REGISTER.toUpperCase()}`,
    ``,
    `Output rules:`,
    `- Translate ONLY the values; keep keys exactly as-is.`,
    `- Preserve {{variable}} and {n}/{limit}/{current}/{total} placeholders EXACTLY.`,
    `- Keep proper nouns in English: SOWISO, Cortéa, The Atelier, The Counsel, The Compass,`,
    `  The Mirror, The Navigator, Noble Score, The Guest, The Traveller, The Ambassador,`,
    `  The Aware, The Composed, The Refined, The Distinguished, The Sovereign.`,
    `- Preserve punctuation style (ellipsis: …, em-dash: —).`,
    `- Use locale conventions for currency, dates, and numbers.`,
    `- Return ONLY a valid JSON object — no markdown fences, no commentary.`,
  ].join("\n");
}

// ── Per-language translation pass ──────────────────────────────────────────
const CHUNK_SIZE = 80;
let grandTotalAdded = 0;
let grandTotalFailed = 0;

for (const targetLang of TARGET_LANGS) {
  const config = LANG_CONFIG[targetLang];
  const outPath = resolve(SRC_LOCALES, targetLang, "translation.json");

  let existing = {};
  if (existsSync(outPath)) {
    try { existing = JSON.parse(readFileSync(outPath, "utf8")); } catch {}
  }

  // Decide which keys to translate.
  const allKeys = Object.keys(enKeys);
  let keysToTranslate;
  if (FORCE) {
    keysToTranslate = allKeys;
  } else if (MISSING || Object.keys(existing).length > 0) {
    keysToTranslate = allKeys.filter((k) => !(k in existing));
  } else {
    keysToTranslate = allKeys;
  }

  if (keysToTranslate.length === 0) {
    console.log(`[${targetLang}] complete — ${Object.keys(existing).length} keys, 0 missing.`);
    continue;
  }

  const t0 = Date.now();
  console.log(`[${targetLang}] translating ${keysToTranslate.length} key(s) (${REGISTER} register, ${config.name})…`);

  const chunks = [];
  for (let i = 0; i < keysToTranslate.length; i += CHUNK_SIZE) {
    chunks.push(keysToTranslate.slice(i, i + CHUNK_SIZE));
  }

  const systemPrompt = buildSystemPrompt(config.name);
  const result = { ...existing };
  let added = 0;
  let failed = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkObj = {};
    for (const k of chunk) chunkObj[k] = enKeys[k];

    let attempts = 0;
    let parsed = null;
    while (attempts < 3 && !parsed) {
      attempts++;
      try {
        const userPrompt = `Translate the values of this JSON object into ${config.name}:\n\n${JSON.stringify(chunkObj, null, 2)}\n\nReturn ONLY the translated JSON object.`;
        const text = await callClaude(systemPrompt, userPrompt);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found in response");
        parsed = JSON.parse(jsonMatch[0]);
      } catch (err) {
        if (attempts === 3) {
          console.warn(`  [${targetLang}] chunk ${i + 1}/${chunks.length} failed after ${attempts} attempts: ${err.message}`);
          failed += chunk.length;
        }
      }
    }

    if (parsed) {
      for (const k of chunk) {
        if (k in parsed) { result[k] = parsed[k]; added++; }
      }
    }
    if (i < chunks.length - 1) await new Promise((r) => setTimeout(r, 400));
  }

  mkdirSync(resolve(SRC_LOCALES, targetLang), { recursive: true });
  writeFileSync(outPath, JSON.stringify(result, null, 2), "utf8");
  mkdirSync(resolve(PUB_LOCALES, targetLang), { recursive: true });
  writeFileSync(resolve(PUB_LOCALES, targetLang, "translation.json"), JSON.stringify(result, null, 2), "utf8");

  const elapsedMs = Date.now() - t0;
  console.log(
    `[${targetLang}] done — added ${added}, failed ${failed}, total ${Object.keys(result).length} keys, ${elapsedMs}ms.`
  );
  grandTotalAdded += added;
  grandTotalFailed += failed;
}

console.log(`\n✓ translate-ui complete — added ${grandTotalAdded} key(s), failed ${grandTotalFailed} across ${TARGET_LANGS.length} locale(s).`);
