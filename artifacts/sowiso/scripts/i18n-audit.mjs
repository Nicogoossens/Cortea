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

// Extract language blocks by parsing the STATIC_TRANSLATIONS object
const blockRegex = /^\s{2}(\w{2}):\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/gm;
const keyRegex = /"([^"]+)":\s*"[^"]*"/g;

const langs = {};
let match;
while ((match = blockRegex.exec(source)) !== null) {
  const lang = match[1];
  const block = match[2];
  const keys = [];
  let km;
  while ((km = keyRegex.exec(block)) !== null) {
    keys.push(km[1]);
  }
  langs[lang] = new Set(keys);
}

const allLangs = Object.keys(langs);
if (!langs["en"]) {
  console.error("Could not parse English translations block.");
  process.exit(1);
}

const enKeys = [...langs["en"]];
let missing = 0;

console.log(`\nSOWISO i18n Audit — ${enKeys.length} English keys\n`);
console.log("Languages checked:", allLangs.join(", "));
console.log("─".repeat(60));

for (const lang of allLangs.filter((l) => l !== "en")) {
  const langKeys = langs[lang] || new Set();
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
