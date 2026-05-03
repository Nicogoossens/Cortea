#!/usr/bin/env node
/**
 * Parses attached_assets/Compas_database_*.md and:
 *   1. Upserts each country into compass_regions (en-GB locale, is_published=true)
 *   2. Writes the venues to artifacts/api-server/src/data/venues-extra.ts
 *
 * Run with:
 *   pnpm --filter @workspace/db exec tsx ../../scripts/seed-new-compass-countries.mjs
 *   (or)  node scripts/seed-new-compass-countries.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(__filename, "../../../../");

const MD_PATH = resolve(ROOT, "attached_assets/Compas_database_1777803018272.md");
const VENUES_OUT = resolve(ROOT, "artifacts/api-server/src/data/venues-extra.ts");

const COUNTRY_CODES = {
  Austria: "AT", "Czech Republic": "CZ", Denmark: "DK", Finland: "FI",
  Greece: "GR", Hungary: "HU", Iceland: "IS", Ireland: "IE",
  Norway: "NO", Poland: "PL", Sweden: "SE", Russia: "RU",
  "Türkiye (Turkey)": "TR", "South Korea": "KR", Thailand: "TH",
  Vietnam: "VN", Indonesia: "ID", Malaysia: "MY", Philippines: "PH",
  "Hong Kong": "HK", Taiwan: "TW", "Saudi Arabia": "SA",
  Qatar: "QA", Egypt: "EG", Morocco: "MA", Israel: "IL", Jordan: "JO",
};

const REGION_NAME_OVERRIDE = {
  TR: "Türkiye",
  KR: "South Korea",
};

const TAG_MAP = {
  business: "business",
  romantic: "romantic",
  family: "family",
  friendly: "social",
  social: "social",
};

const CATEGORY_KEYS = {
  shops: "shops",
  dining: "dining",
  activities: "activities",
  stays: "accommodations",
  transport: "transport",
};

const CATEGORY_HEADER_RE = /^\*\*[^\w]*\s*(Shops|Dining|Activities|Stays|Transport)\*\*/i;

function stripMd(s) {
  return s.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").trim();
}

function splitCountries(md) {
  // Split on "## " headings that are countries (have a flag emoji)
  const lines = md.split("\n");
  const sections = [];
  let cur = null;
  for (const line of lines) {
    const m = line.match(/^##\s+(\S+)\s+(.+)$/);
    if (m && /[\u{1F1E6}-\u{1F1FF}]/u.test(m[1])) {
      if (cur) sections.push(cur);
      const name = m[2].trim();
      cur = { name, flag: m[1], lines: [] };
    } else if (cur) {
      cur.lines.push(line);
    }
  }
  if (cur) sections.push(cur);
  return sections;
}

function findSection(lines, heading) {
  const idx = lines.findIndex((l) => l.trim() === `### ${heading}`);
  if (idx < 0) return [];
  const out = [];
  for (let i = idx + 1; i < lines.length; i++) {
    if (lines[i].startsWith("### ") || lines[i].startsWith("## ") || lines[i].startsWith("# ")) break;
    out.push(lines[i]);
  }
  return out;
}

function findSubsection(blockLines, heading) {
  // heading like "🍽 Table Manners" — finds **emoji Heading** then collects until next ** or empty cluster end
  const re = new RegExp(`^\\*\\*[^*]*${heading.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}[^*]*\\*\\*\\s*$`);
  const idx = blockLines.findIndex((l) => re.test(l.trim()));
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
  const idx = blockLines.findIndex((l) => re.test(l.trim()));
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

function parseLocalVenues(localLines) {
  // Returns { shops:[...], dining:[...], activities:[...], stays:[...], transport:[...] }
  const out = { shops: [], dining: [], activities: [], stays: [], transport: [] };
  let cat = null;
  let cur = null;
  const flush = () => { if (cur && cat) out[cat].push(cur); cur = null; };
  for (const raw of localLines) {
    const line = raw.replace(/\s+$/, "");
    const t = line.trim();
    const cm = t.match(CATEGORY_HEADER_RE);
    if (cm) {
      flush();
      cat = cm[1].toLowerCase();
      continue;
    }
    if (!cat) continue;
    const itemMatch = t.match(/^\d+\.\s+\*\*([^*]+)\*\*\s+—\s+\*([^*]+)\*\s*$/);
    if (itemMatch) {
      flush();
      cur = {
        header: itemMatch[1].trim(), // "GRAND HOTEL · ✦ IMPERIAL"
        venue: itemMatch[2].trim(),  // "Hotel Sacher, Vienna"
        description: "",
        tags: [],
        tip: "",
      };
      continue;
    }
    if (!cur) continue;
    const tagsMatch = t.match(/^\*Tags:\s*(.+?)\*\s*$/);
    if (tagsMatch) {
      cur.tags = tagsMatch[1].split(/[·,]/).map((s) => s.trim().toLowerCase()).filter(Boolean);
      continue;
    }
    const tipMatch = t.match(/^>\s*Etiquette tip:\s*(.+)$/i);
    if (tipMatch) {
      cur.tip = stripMd(tipMatch[1].trim());
      continue;
    }
    if (t.startsWith(">") || t.startsWith("*Tags") || t.startsWith("---")) continue;
    if (t) {
      cur.description += (cur.description ? " " : "") + stripMd(t);
    }
  }
  flush();
  return out;
}

function parseCountry(section) {
  const code = COUNTRY_CODES[section.name];
  if (!code) return null;
  const lines = section.lines;

  const briefingLines = findSection(lines, "Quick Briefing");
  const dos = findBulletList(briefingLines, "Do");
  const donts = findBulletList(briefingLines, "Avoid");

  const coreValue = stripMd(findSection(lines, "Core Value").filter(Boolean).join(" "));
  const biggestTaboo = stripMd(findSection(lines, "Biggest Taboo").filter(Boolean).join(" "));

  const protocolBlock = findSection(lines, "Essential Protocols");
  const tableManners = stripMd(findSubsection(protocolBlock, "Table Manners"));
  const languageNotes = stripMd(findSubsection(protocolBlock, "Language Notes"));
  const giftProtocol = stripMd(findSubsection(protocolBlock, "Gift Protocol"));
  const dressCode = stripMd(findSubsection(protocolBlock, "Dress Code"));

  const localBlock = findSection(lines, "The Local");
  const venueGroups = parseLocalVenues(localBlock);

  return {
    region_code: code,
    flag_emoji: section.flag,
    region_name: REGION_NAME_OVERRIDE[code] ?? section.name,
    content: {
      core_value: coreValue,
      biggest_taboo: biggestTaboo,
      dining_etiquette: tableManners,
      language_notes: languageNotes,
      gift_protocol: giftProtocol,
      dress_code: dressCode,
      dos,
      donts,
    },
    venues: venueGroups,
  };
}

function buildVenueRecords(country) {
  const records = [];
  const code = country.region_code.toLowerCase();
  const catShort = { shops: "s", dining: "d", activities: "a", stays: "ac", transport: "t" };
  for (const [grp, list] of Object.entries(country.venues)) {
    list.forEach((v, idx) => {
      const headerParts = v.header.split(/·/).map((s) => s.trim().replace(/✦\s*/g, "").trim());
      const subcategory = headerParts[0] || grp;
      const tierBadge = headerParts.slice(1).filter(Boolean).join(" · ") || "Heritage";
      const occasionTags = Array.from(new Set(
        v.tags.map((t) => TAG_MAP[t]).filter(Boolean)
      ));
      records.push({
        id: `${code}-${catShort[grp]}-${idx + 1}`,
        regionCode: country.region_code,
        category: CATEGORY_KEYS[grp],
        subcategory: titleCase(subcategory),
        name: v.venue,
        description: v.description,
        occasionTags: occasionTags.length ? occasionTags : ["social"],
        tierBadge: titleCase(tierBadge),
        etiquetteTip: v.tip,
      });
    });
  }
  return records;
}

function titleCase(s) {
  return s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

function jsonEsc(s) {
  return JSON.stringify(s ?? "");
}

function writeVenuesFile(allVenues) {
  const header = `// AUTO-GENERATED by scripts/seed-new-compass-countries.mjs — do not edit by hand.
// Source: attached_assets/Compas_database_1777803018272.md
import type { Venue } from "./venues.js";

export const EXTRA_VENUES: Venue[] = [
`;
  const body = allVenues.map((v) =>
    `  { id: ${jsonEsc(v.id)}, regionCode: ${jsonEsc(v.regionCode)}, category: ${jsonEsc(v.category)}, subcategory: ${jsonEsc(v.subcategory)}, name: ${jsonEsc(v.name)}, description: ${jsonEsc(v.description)}, occasionTags: ${JSON.stringify(v.occasionTags)}, tierBadge: ${jsonEsc(v.tierBadge)}, etiquetteTip: ${jsonEsc(v.etiquetteTip)} },`
  ).join("\n");
  writeFileSync(VENUES_OUT, header + body + "\n];\n");
}

async function upsertCompass(countries) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    for (const c of countries) {
      const content = {
        "en-GB": {
          region_name: c.region_name,
          ...c.content,
        },
      };
      await client.query(
        `INSERT INTO compass_regions (region_code, flag_emoji, content, is_published)
         VALUES ($1, $2, $3::jsonb, true)
         ON CONFLICT (region_code) DO UPDATE SET
           flag_emoji = EXCLUDED.flag_emoji,
           content = EXCLUDED.content,
           is_published = true`,
        [c.region_code, c.flag_emoji, JSON.stringify(content)]
      );
      console.log(`  ✓ upserted ${c.region_code} (${c.region_name})`);
    }
  } finally {
    await client.end();
  }
}

async function main() {
  console.log("Reading", MD_PATH);
  const md = readFileSync(MD_PATH, "utf8");
  const sections = splitCountries(md);
  console.log(`Found ${sections.length} country sections.`);

  const countries = sections.map(parseCountry).filter(Boolean);
  console.log(`Parsed ${countries.length} countries with known ISO codes.`);

  // Sanity print
  for (const c of countries) {
    const venueCount = Object.values(c.venues).reduce((a, l) => a + l.length, 0);
    console.log(`  ${c.region_code} ${c.region_name}: dos=${c.content.dos.length} donts=${c.content.donts.length} venues=${venueCount}`);
  }

  // 1. Write venues file
  const allVenues = countries.flatMap(buildVenueRecords);
  writeVenuesFile(allVenues);
  console.log(`Wrote ${allVenues.length} venues → ${VENUES_OUT}`);

  // 2. Upsert compass entries
  if (process.env.SKIP_DB === "1") {
    console.log("SKIP_DB=1 — skipping DB upsert.");
    return;
  }
  await upsertCompass(countries);
  console.log("Done.");
}

main().catch((err) => { console.error(err); process.exit(1); });
