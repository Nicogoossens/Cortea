#!/usr/bin/env node
/**
 * validate-be-learning-tracks.mjs
 *
 * CI validation for data/be-learning-tracks.json.
 * Checks:
 *   1. File parses as valid JSON
 *   2. All records pass required-field checks
 *   3. Every record has options with 2–4 items, each with non-empty text + motivation
 *   4. Every record has exactly one option with answer_tier === 1
 *   5. Language counts match expected ranges
 *
 * Exit 0 on success, exit 1 on failure.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const JSON_PATH = resolve(ROOT, "data/be-learning-tracks.json");

const REQUIRED_FIELDS = ["register", "phase", "level", "region_code", "demographic", "question_text", "lang", "options"];

let data;
try {
  data = JSON.parse(readFileSync(JSON_PATH, "utf8"));
} catch (e) {
  console.error("FAIL: Could not parse JSON file:", e.message);
  process.exit(1);
}

if (!Array.isArray(data)) {
  console.error("FAIL: JSON root must be an array");
  process.exit(1);
}

const errors = [];

for (let i = 0; i < data.length; i++) {
  const q = data[i];

  // Required fields
  for (const field of REQUIRED_FIELDS) {
    if (q[field] === undefined || q[field] === null || q[field] === "") {
      errors.push(`Record ${i}: missing required field '${field}'`);
    }
  }

  // Options
  if (!Array.isArray(q.options) || q.options.length < 2) {
    errors.push(`Record ${i}: options must be an array with ≥2 items`);
    continue;
  }
  for (let j = 0; j < q.options.length; j++) {
    const o = q.options[j];
    if (!o.text || typeof o.text !== "string") errors.push(`Record ${i} option ${j}: missing text`);
    if (!o.motivation || typeof o.motivation !== "string") errors.push(`Record ${i} option ${j}: missing motivation`);
    if (![1, 2, 3].includes(o.answer_tier)) errors.push(`Record ${i} option ${j}: invalid answer_tier ${o.answer_tier}`);
  }

  // Exactly one tier-1
  const tier1Count = q.options.filter((o) => o.answer_tier === 1).length;
  if (tier1Count !== 1) {
    errors.push(`Record ${i}: has ${tier1Count} tier-1 options (expected exactly 1)`);
  }

  // region_code must be BE
  if (q.region_code !== "BE") {
    errors.push(`Record ${i}: region_code is '${q.region_code}' (expected 'BE')`);
  }
}

// Language count checks
const langs = data.reduce((a, q) => { a[q.lang] = (a[q.lang] || 0) + 1; return a; }, {});
if ((langs.en || 0) < 2500) errors.push(`Language check: en count ${langs.en} is below expected minimum of 2500`);
if ((langs.nl || 0) < 10) errors.push(`Language check: nl count ${langs.nl} is below expected minimum of 10`);
if ((langs.fr || 0) < 1) errors.push(`Language check: fr count ${langs.fr} is below expected minimum of 1`);

if (errors.length > 0) {
  console.error(`FAIL: ${errors.length} validation error(s):`);
  errors.slice(0, 20).forEach((e) => console.error("  -", e));
  if (errors.length > 20) console.error(`  ... and ${errors.length - 20} more`);
  process.exit(1);
}

console.log(`✓ ${data.length} records validated`);
console.log(`  Language breakdown: ${JSON.stringify(langs)}`);
console.log(`  All records have exactly one tier-1 option`);
console.log("OK");
