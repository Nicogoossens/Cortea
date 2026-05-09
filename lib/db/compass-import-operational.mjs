#!/usr/bin/env node
/**
 * Operational verification of the compass MD import pipeline.
 * Uses same pattern as lib/db/src/seed-compass-database3.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __filename = fileURLToPath(import.meta.url);

// ── Paste scoreContent + parseCompassMd inline (TypeScript stripped) ──────────

function stripMd(s) {
  return s.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").trim();
}

function splitCountries(md) {
  const lines = md.split("\n");
  const sections = [];
  let cur = null;
  for (const line of lines) {
    const m = line.match(/^##\s+(\S+)\s+(.+)$/);
    if (m && /[\u{1F1E6}-\u{1F1FF}]/u.test(m[1])) {
      if (cur) sections.push(cur);
      cur = { name: m[2].trim(), flag: m[1], lines: [] };
    } else if (cur) {
      cur.lines.push(line);
    }
  }
  if (cur) sections.push(cur);
  return sections;
}

function findSection(lines, heading) {
  const idx = lines.findIndex(l => l.trim() === `### ${heading}`);
  if (idx < 0) return [];
  const out = [];
  for (let i = idx + 1; i < lines.length; i++) {
    if (lines[i].startsWith("### ") || lines[i].startsWith("## ") || lines[i].startsWith("# ")) break;
    out.push(lines[i]);
  }
  return out;
}

function findSubsection(blockLines, heading) {
  const re = new RegExp(`^\\*\\*[^*]*${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^*]*\\*\\*\\s*$`);
  const idx = blockLines.findIndex(l => re.test(l.trim()));
  if (idx < 0) return "";
  const out = [];
  for (let i = idx + 1; i < blockLines.length; i++) {
    const t = blockLines[i].trim();
    if (t.startsWith("**") && t.endsWith("**")) break;
    if (t.startsWith("###")) break;
    out.push(t);
  }
  return out.filter(Boolean).join(" ").trim();
}

function findBulletList(blockLines, heading) {
  const re = new RegExp(`^\\*\\*${heading}\\*\\*\\s*$`);
  const idx = blockLines.findIndex(l => re.test(l.trim()));
  if (idx < 0) return [];
  const out = [];
  for (let i = idx + 1; i < blockLines.length; i++) {
    const t = blockLines[i].trim();
    if (!t) { if (out.length) break; else continue; }
    if (t.startsWith("**") && t.endsWith("**")) break;
    if (t.startsWith("- ")) out.push(stripMd(t.slice(2).trim()));
    else if (out.length) break;
  }
  return out;
}

function scoreContent(c) {
  const textFields = [c.core_value, c.biggest_taboo, c.dining_etiquette, c.language_notes, c.gift_protocol, c.dress_code];
  const filledFields = textFields.filter(f => f && f.trim().length > 0).length;
  const charCount = textFields.reduce((sum, f) => sum + (f?.length ?? 0), 0);
  const bullets = (c.dos?.length ?? 0) + (c.donts?.length ?? 0);
  return filledFields * 200 + charCount + bullets * 50;
}

// ── COUNTRY_CODES (abridged — just enough to verify the pipeline) ─────────────
// (Full map lives in compass-md-parser.ts; this script validates the logic)
const COUNTRY_CODES_PATH = resolve("/home/runner/workspace/artifacts/api-server/src/lib/compass-md-parser.ts");
const parserSrc = readFileSync(COUNTRY_CODES_PATH, "utf-8");
// Extract country codes by evaluating the COUNTRY_CODES object from the TS source
const COUNTRY_CODES_MATCH = parserSrc.match(/export const COUNTRY_CODES[^=]*=\s*(\{[\s\S]+?\n\};)/m);
let COUNTRY_CODES = {};
if (COUNTRY_CODES_MATCH) {
  // Parse the object literal — strip TS comments and evaluate
  const objSrc = COUNTRY_CODES_MATCH[1]
    .replace(/\/\/[^\n]*/g, "")  // strip line comments
    .replace(/\/\*[\s\S]*?\*\//g, ""); // strip block comments
  try {
    COUNTRY_CODES = new Function(`return (${objSrc})`)();
  } catch {}
}

function parseCompassMd(mdTexts) {
  const byCode = new Map();
  const skipped = [];
  const errors = [];

  for (const md of mdTexts) {
    for (const section of splitCountries(md)) {
      const code = COUNTRY_CODES[section.name];
      if (!code) {
        if (!skipped.includes(section.name)) skipped.push(section.name);
        continue;
      }
      try {
        const lines = section.lines;
        const briefingLines = findSection(lines, "Quick Briefing");
        const dos = findBulletList(briefingLines, "Do");
        const donts = findBulletList(briefingLines, "Avoid");
        const coreValue = stripMd(findSection(lines, "Core Value").filter(Boolean).join(" "));
        const biggestTaboo = stripMd(findSection(lines, "Biggest Taboo").filter(Boolean).join(" "));
        const protocolBlock = findSection(lines, "Essential Protocols");
        const diningEtiquette = stripMd(findSubsection(protocolBlock, "Table Manners"));
        const languageNotes = stripMd(findSubsection(protocolBlock, "Language Notes"));
        const giftProtocol = stripMd(findSubsection(protocolBlock, "Gift Protocol"));
        const dressCode = stripMd(findSubsection(protocolBlock, "Dress Code"));
        byCode.set(code, {
          region_code: code, flag_emoji: section.flag, region_name: section.name,
          content_en_gb: { region_name: section.name, core_value: coreValue, biggest_taboo: biggestTaboo,
            dining_etiquette: diningEtiquette, language_notes: languageNotes,
            gift_protocol: giftProtocol, dress_code: dressCode, dos, donts },
        });
      } catch (err) {
        errors.push(`${section.name} (${code}): ${err.message}`);
      }
    }
  }
  return { countries: Array.from(byCode.values()), skipped, errors };
}

// ── Main ──────────────────────────────────────────────────────────────────────
const assetsDir = "/home/runner/workspace/attached_assets";
const files = readdirSync(assetsDir)
  .filter(f => /^Compas_database.*\.md$/i.test(f)).sort();

const mdTexts = files.map(f => readFileSync(join(assetsDir, f), "utf-8"));
const { countries, skipped, errors } = parseCompassMd(mdTexts);

console.log(`\n=== PARSER RESULTS ===`);
console.log(`  Files          : ${files.length}`);
console.log(`  Countries      : ${countries.length} unique (last-seen-wins)`);
console.log(`  Skipped        : ${skipped.length}`);
console.log(`  Parse errors   : ${errors.length}`);

// Sample quality scores
console.log(`\n  Quality samples (5):`);
countries.slice(0, 5).forEach(c => {
  const s = scoreContent(c.content_en_gb);
  const filled = [c.content_en_gb.core_value, c.content_en_gb.biggest_taboo,
    c.content_en_gb.dining_etiquette, c.content_en_gb.language_notes,
    c.content_en_gb.gift_protocol, c.content_en_gb.dress_code].filter(Boolean).length;
  console.log(`    ${c.region_code} ${c.flag_emoji} ${c.region_name}: score=${s}, fields=${filled}/6, dos=${c.content_en_gb.dos.length}, donts=${c.content_en_gb.donts.length}`);
});

// ── DB upsert ─────────────────────────────────────────────────────────────────
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) { console.error("DATABASE_URL not set"); process.exit(1); }

const client = new pg.Client({ connectionString: dbUrl });
await client.connect();

const { rows: [{ n: before }] } = await client.query("SELECT COUNT(*)::int AS n FROM compass_regions WHERE is_published = true");
console.log(`\n=== DB BEFORE: ${before} published regions ===`);

let imported = 0, updated = 0, preserved = 0;

for (const country of countries) {
  const enGbContent = country.content_en_gb;

  // Try insert
  const res = await client.query(
    `INSERT INTO compass_regions (region_code, flag_emoji, content, is_published)
     VALUES ($1, $2, $3::jsonb, true)
     ON CONFLICT (region_code) DO NOTHING
     RETURNING region_code`,
    [country.region_code, country.flag_emoji, JSON.stringify({ "en-GB": enGbContent })]
  );

  if (res.rows.length > 0) {
    imported++;
  } else {
    // Read existing and score
    const ex = await client.query(
      `SELECT content->'en-GB' AS en_gb FROM compass_regions WHERE region_code = $1 LIMIT 1`,
      [country.region_code]
    );
    const existingEnGb = ex.rows[0]?.en_gb;
    const incomingScore = scoreContent(enGbContent);
    const existingScore = existingEnGb ? scoreContent(existingEnGb) : -1;

    if (incomingScore > existingScore) {
      await client.query(
        `UPDATE compass_regions
         SET content    = jsonb_set(COALESCE(content,'{}'), '{en-GB}', $2::jsonb),
             flag_emoji = $3,
             is_published = true
         WHERE region_code = $1`,
        [country.region_code, JSON.stringify(enGbContent), country.flag_emoji]
      );
      updated++;
    } else {
      preserved++;
    }
  }
}

const { rows: [{ n: after }] } = await client.query("SELECT COUNT(*)::int AS n FROM compass_regions WHERE is_published = true");

// Spot-check: sample newly imported rows
const { rows: sample } = await client.query(`
  SELECT region_code, flag_emoji,
         content->'en-GB'->>'core_value'   AS cv,
         content->'en-GB'->>'biggest_taboo' AS bt
  FROM compass_regions
  WHERE region_code IN ('IS','HK','TR','MA','RO','UA','KR','TH') AND is_published = true
  ORDER BY region_code
`);

console.log(`\n=== DB AFTER: ${after} published regions ===`);
console.log(`  New inserted             : ${imported}`);
console.log(`  Updated (incoming richer): ${updated}`);
console.log(`  Preserved (existing richer or equal): ${preserved}`);

console.log(`\n=== SPOT-CHECK (8 countries) ===`);
sample.forEach(r => {
  const cv = (r.cv || "[empty]").slice(0, 55);
  const bt = (r.bt || "[empty]").slice(0, 40);
  console.log(`  ${r.region_code} ${r.flag_emoji}: cv="${cv}..." | taboo="${bt}..."`);
});

await client.end();
console.log(`\n✓ Operational verification complete`);
