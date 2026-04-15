#!/usr/bin/env node
/**
 * Translates all UI translation keys to a target language using Claude via
 * the Replit AI Integrations proxy (no SDK import required).
 *
 * Usage: node scripts/translate-ui.mjs --lang ar [--force]
 * Output: artifacts/sowiso/src/locales/{lang}/translation.json
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SRC_LOCALES = resolve(ROOT, "artifacts/sowiso/src/locales");
const PUB_LOCALES = resolve(ROOT, "artifacts/sowiso/public/locales");

const args = process.argv.slice(2);
const langIdx = args.indexOf("--lang");
const LANG = langIdx !== -1 ? args[langIdx + 1] : null;
const FORCE = args.includes("--force");

if (!LANG) {
  console.error("Usage: node scripts/translate-ui.mjs --lang <code> [--force]");
  process.exit(1);
}

const LANG_CONFIG = {
  ar: {
    name: "Arabic",
    register: "formal Modern Standard Arabic (الفصحى المعاصرة), right-to-left, polished and respectful register suitable for a premium etiquette application",
  },
  ja: {
    name: "Japanese",
    register: "formal keigo (敬語) Japanese, polished and respectful register suitable for a premium etiquette application, using kanji/hiragana/katakana as appropriate",
  },
};

if (!LANG_CONFIG[LANG]) {
  console.error(`Unsupported language: ${LANG}. Supported: ${Object.keys(LANG_CONFIG).join(", ")}`);
  process.exit(1);
}

const outPath = resolve(SRC_LOCALES, LANG, "translation.json");
if (existsSync(outPath) && !FORCE) {
  let existing = {};
  try { existing = JSON.parse(readFileSync(outPath, "utf8")); } catch {}
  if (Object.keys(existing).length > 300) {
    console.log(`${LANG} translations already exist (${Object.keys(existing).length} keys). Use --force to retranslate.`);
    process.exit(0);
  }
}

// Read English source — prefer src/locales, fall back to public/locales
const enSrcPath = existsSync(resolve(SRC_LOCALES, "en", "translation.json"))
  ? resolve(SRC_LOCALES, "en", "translation.json")
  : resolve(PUB_LOCALES, "en", "translation.json");

const enKeys = JSON.parse(readFileSync(enSrcPath, "utf8"));
const allKeys = Object.keys(enKeys);
console.log(`Translating ${allKeys.length} keys to ${LANG_CONFIG[LANG].name}…`);

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

// ── Chunked translation ────────────────────────────────────────────────────
const CHUNK_SIZE = 80;
const chunks = [];
for (let i = 0; i < allKeys.length; i += CHUNK_SIZE) {
  chunks.push(allKeys.slice(i, i + CHUNK_SIZE));
}

const config = LANG_CONFIG[LANG];
const systemPrompt = [
  `You are a professional translator producing ${config.register}.`,
  `You will be given a JSON object mapping translation keys to English UI strings for an etiquette intelligence app called SOWISO.`,
  `Translate ONLY the values into ${config.name}. Keep the keys exactly as-is.`,
  `Rules:`,
  `- Preserve {{variable}} placeholders EXACTLY (double-brace format) — do not translate or alter them.`,
  `- Preserve proper nouns: SOWISO, The Atelier, The Counsel, The Compass.`,
  `- Preserve punctuation style (ellipsis: …, em-dash: —).`,
  `- Preserve abbreviations like "Est." for "established".`,
  `- For currency symbols, dates, and numbers, use the target locale conventions.`,
  `- Return ONLY valid JSON with no commentary or markdown fences.`,
].join("\n");

const result = {};

for (let i = 0; i < chunks.length; i++) {
  const chunk = chunks[i];
  const chunkObj = {};
  for (const k of chunk) chunkObj[k] = enKeys[k];

  console.log(`  Chunk ${i + 1}/${chunks.length} (${chunk.length} keys)…`);

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
      for (const k of chunk) {
        if (!(k in parsed)) {
          console.warn(`    Warning: key "${k}" missing — using English fallback`);
          parsed[k] = enKeys[k];
        }
      }
    } catch (err) {
      console.warn(`    Attempt ${attempts} failed: ${err.message}`);
      if (attempts === 3) {
        console.warn(`    Using English fallback for chunk ${i + 1}`);
        parsed = chunkObj;
      }
    }
  }

  Object.assign(result, parsed);
  if (i < chunks.length - 1) await new Promise((r) => setTimeout(r, 400));
}

// Write to src/locales/{lang}/translation.json (bundled resources)
mkdirSync(resolve(SRC_LOCALES, LANG), { recursive: true });
writeFileSync(outPath, JSON.stringify(result, null, 2), "utf8");
console.log(`\n✓ ${LANG}: ${Object.keys(result).length} keys → src/locales/${LANG}/translation.json`);

// Also mirror to public/locales/{lang}/translation.json for HttpBackend fallback
mkdirSync(resolve(PUB_LOCALES, LANG), { recursive: true });
writeFileSync(resolve(PUB_LOCALES, LANG, "translation.json"), JSON.stringify(result, null, 2), "utf8");
console.log(`  mirrored → public/locales/${LANG}/translation.json`);
