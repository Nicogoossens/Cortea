#!/usr/bin/env node
/**
 * i18n audit script — checks translation keys across per-locale JSON files
 * against the English source of truth.
 *
 * Pass/fail is scoped to the gamification namespaces introduced for the
 * Wardrobe + Story Mode rollout (home.streak / home.quest_* / home.avatar_*,
 * wardrobe.*, counsel.oeps.*, scenario.story_mode|classic_mode|story_choose|
 * story_tap, nav.wardrobe). Other gaps are reported as warnings.
 *
 * Run: node scripts/i18n-audit.mjs
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesDir = join(__dirname, "../src/locales");

const allLangs = readdirSync(localesDir).filter((d) =>
  statSync(join(localesDir, d)).isDirectory()
);

if (!allLangs.includes("en")) {
  console.error("Could not find English translations directory.");
  process.exit(1);
}

function loadKeys(lang) {
  const file = join(localesDir, lang, "translation.json");
  return new Set(Object.keys(JSON.parse(readFileSync(file, "utf8"))));
}

const enKeys = [...loadKeys("en")];

const NEW_NAMESPACE_MATCHERS = [
  /^nav\.wardrobe$/,
  /^home\.streak/,
  /^home\.daily_quests$/,
  /^home\.quest_/,
  /^home\.avatar_/,
  /^wardrobe\./,
  /^counsel\.oeps\./,
  /^scenario\.(story_mode|classic_mode|story_choose|story_tap)$/,
];

const isNewKey = (k) => NEW_NAMESPACE_MATCHERS.some((re) => re.test(k));
const newKeys = enKeys.filter(isNewKey);

console.log(`\nSOWISO i18n Audit — ${enKeys.length} English keys (${newKeys.length} new gamification keys)\n`);
console.log("Languages checked:", allLangs.join(", "));
console.log("─".repeat(60));

let blockingMissing = 0;
let warningMissing = 0;

for (const lang of allLangs.filter((l) => l !== "en")) {
  const langKeys = loadKeys(lang);
  const missingNew = newKeys.filter((k) => !langKeys.has(k));
  const missingOther = enKeys.filter(
    (k) => !isNewKey(k) && !langKeys.has(k)
  );

  if (missingNew.length === 0 && missingOther.length === 0) {
    console.log(`✓  ${lang.padEnd(4)} — complete (${langKeys.size} keys)`);
    continue;
  }

  if (missingNew.length === 0) {
    console.log(
      `✓  ${lang.padEnd(4)} — gamification complete; ${missingOther.length} other key(s) missing (warning)`
    );
    warningMissing += missingOther.length;
  } else {
    console.log(
      `✗  ${lang.padEnd(4)} — missing ${missingNew.length} new gamification key(s):`
    );
    missingNew.forEach((k) => console.log(`       • ${k}`));
    blockingMissing += missingNew.length;
    if (missingOther.length) {
      console.log(`     (plus ${missingOther.length} other missing key(s) — warning)`);
      warningMissing += missingOther.length;
    }
  }
}

console.log("─".repeat(60));
if (warningMissing > 0) {
  console.log(`!  ${warningMissing} non-gamification translation gap(s) reported as warnings.`);
}
if (blockingMissing === 0) {
  console.log("\n✓  All gamification translations complete. No missing keys in tracked namespaces.\n");
  process.exit(0);
} else {
  console.log(`\n✗  ${blockingMissing} missing gamification translation(s) found.\n`);
  process.exit(1);
}
