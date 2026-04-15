#!/usr/bin/env node
/**
 * Extracts STATIC_TRANSLATIONS from i18n.tsx and writes per-locale JSON files.
 * Converts {var} → {{var}} for react-i18next interpolation.
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const I18N_FILE = resolve(ROOT, "artifacts/sowiso/src/lib/i18n.tsx");
const OUT_DIR = resolve(ROOT, "artifacts/sowiso/public/locales");

const LANGS = ["en", "nl", "fr", "de", "es", "pt", "it", "hi"];

const src = readFileSync(I18N_FILE, "utf8");

// Find the STATIC_TRANSLATIONS block
const staticStart = src.indexOf("const STATIC_TRANSLATIONS");
const blockStart = src.indexOf("{", staticStart);

// We'll extract per-language by finding each lang: { block
for (const lang of LANGS) {
  // Find "  lang: {" pattern  
  const langPattern = new RegExp(`\\b${lang}:\\s*\\{`);
  const langMatch = langPattern.exec(src.slice(blockStart));
  if (!langMatch) {
    console.warn(`Language ${lang} not found in STATIC_TRANSLATIONS`);
    continue;
  }

  const langStart = blockStart + langMatch.index + langMatch[0].length;
  
  // Now extract content until balanced closing brace
  let depth = 1;
  let pos = langStart;
  while (pos < src.length && depth > 0) {
    if (src[pos] === "{") depth++;
    else if (src[pos] === "}") depth--;
    pos++;
  }
  const langContent = src.slice(langStart, pos - 1);

  // Extract key-value pairs
  // Match: "key": "value" — value can contain escaped quotes and unicode
  const kvRegex = /"([^"\\]+(?:\\.[^"\\]*)*)"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  const translations = {};
  let m;
  while ((m = kvRegex.exec(langContent)) !== null) {
    const key = m[1];
    // Unescape the value: \" → " etc. and convert {var} → {{var}}
    const raw = m[2]
      .replace(/\\"/g, '"')
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\\\/g, "\\");
    // Convert single-brace interpolation {var} → {{var}} for react-i18next
    const value = raw.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, "{{$1}}");
    translations[key] = value;
  }

  if (Object.keys(translations).length === 0) {
    console.warn(`No translations found for ${lang}`);
    continue;
  }

  const outPath = resolve(OUT_DIR, lang, "translation.json");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(translations, null, 2), "utf8");
  console.log(`✓ ${lang}: ${Object.keys(translations).length} keys → ${outPath.replace(ROOT + "/", "")}`);
}

console.log("\nDone. Now generate ar and ja translations separately.");
