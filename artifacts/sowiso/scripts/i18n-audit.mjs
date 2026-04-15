#!/usr/bin/env node
/**
 * i18n audit script — checks all translation keys in STATIC_TRANSLATIONS.
 * Run: node scripts/i18n-audit.mjs
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const i18nPath = join(__dirname, "../src/lib/i18n.tsx");
const source = readFileSync(i18nPath, "utf8");

/**
 * Extract all key→value pairs for a language block using a line-by-line depth tracker.
 * This handles arbitrarily large blocks and values that contain { or }.
 */
function extractLangBlock(src, lang) {
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

    // Count braces carefully — but only count structural braces, not those inside strings.
    // Since all values are simple strings (no embedded { in structural positions), this works:
    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;
    depth += opens - closes;

    if (depth <= 0) break;
    blockLines.push(line);
  }

  const kvRegex = /^\s+"([^"]+)":\s+"((?:[^"\\]|\\.)*)"/;
  const map = new Set();
  for (const line of blockLines) {
    const m = line.match(kvRegex);
    if (m) map.add(m[1]);
  }
  return map;
}

// Detect all language codes present in the file
const langCodeRegex = /^  (\w{2}): \{/gm;
const allLangs = [];
let lm;
while ((lm = langCodeRegex.exec(source)) !== null) {
  allLangs.push(lm[1]);
}

if (!allLangs.includes("en")) {
  console.error("Could not find English translations block.");
  process.exit(1);
}

const enKeys = [...extractLangBlock(source, "en")];

console.log(`\nSOWISO i18n Audit — ${enKeys.length} English keys\n`);
console.log("Languages checked:", allLangs.join(", "));
console.log("─".repeat(60));

let missing = 0;

for (const lang of allLangs.filter((l) => l !== "en")) {
  const langKeys = extractLangBlock(source, lang);
  const missingKeys = enKeys.filter((k) => !langKeys.has(k));
  if (missingKeys.length === 0) {
    console.log(`✓  ${lang.padEnd(4)} — complete (${langKeys.size} keys)`);
  } else {
    console.log(`✗  ${lang.padEnd(4)} — missing ${missingKeys.length} key(s):`);
    missingKeys.forEach((k) => console.log(`       • ${k}`));
    missing += missingKeys.length;
  }
}

console.log("─".repeat(60));
if (missing === 0) {
  console.log("\n✓  All translations complete. No missing keys.\n");
  process.exit(0);
} else {
  console.log(`\n✗  ${missing} missing translation(s) found.\n`);
  process.exit(1);
}
