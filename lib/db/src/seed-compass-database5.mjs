#!/usr/bin/env node
/**
 * Parses attached_assets/Compas_database3_*.md and:
 *   1. Upserts each new country into compass_regions (en-GB locale, is_published=true)
 *   2. Writes the venues to artifacts/api-server/src/data/venues-extra2.ts
 *   3. Upserts an Origin & Chronicle row into cultural_origins for each country
 *   4. Writes the parsed Communicative Presence percentages to
 *      lib/db/.tmp-mehrabian-extra2.txt for splicing into culture.ts
 *
 * Run with:
 *   node lib/db/src/seed-compass-database3.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(__filename, "../../../../");

const MD_PATH = resolve(ROOT, "attached_assets/Compas_database5_1777809033319.md");
const VENUES_OUT = resolve(ROOT, "artifacts/api-server/src/data/venues-extra4.ts");
const MEHRABIAN_OUT = resolve(ROOT, "lib/db/.tmp-mehrabian-extra4.txt");

// Only countries from database5 NOT already covered by db1, db2 (seed-new-compass-countries),
// or db3 (seed-compass-database3).
// Only countries from database5 NOT yet published in compass_regions.
const COUNTRY_CODES = {
  Bulgaria: "BG",
  Ukraine: "UA",
  Cyprus: "CY",
  Luxembourg: "LU",
  Pakistan: "PK",
  Mongolia: "MN",
  Bahrain: "BH",
  Tunisia: "TN",
  Senegal: "SN",
  Fiji: "FJ",
  Albania: "AL",
  "Bosnia and Herzegovina": "BA",
  "North Macedonia": "MK",
  Laos: "LA",
  Brunei: "BN",
  Kazakhstan: "KZ",
  Ecuador: "EC",
  Guatemala: "GT",
  Bolivia: "BO",
  Jamaica: "JM",
};

const REGION_NAME_OVERRIDE = {};

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

const CP_LABELS = {
  "Presence & Posture": "nonverbal",
  "Voice Expression": "tone",
  "Language & Phrasing": "words",
};

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
  const re = new RegExp(`^\\*\\*[^*]*${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^*]*\\*\\*\\s*$`);
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
    const itemMatch = t.match(/^\d+\.\s+\*\*([^*]+)\*\*\s+—\s+\*([^*]+)\*\s*(?:`[^`]*`)?\s*$/);
    if (itemMatch) {
      flush();
      cur = {
        header: itemMatch[1].trim(),
        venue: itemMatch[2].trim(),
        description: "",
        tags: [],
        tip: "",
      };
      continue;
    }
    // Fallback: numbered item with no italic venue name (e.g. UA transport
    // entry that uses only a backticked status note in place of the venue).
    const itemFallback = t.match(/^\d+\.\s+\*\*([^*]+)\*\*\s+—\s+(.+?)\s*$/);
    if (itemFallback) {
      flush();
      const rawVenue = itemFallback[2].replace(/^`|`$/g, "").trim();
      cur = {
        header: itemFallback[1].trim(),
        venue: stripMd(rawVenue) || itemFallback[1].trim(),
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

function parseCommunicativePresence(lines) {
  const block = findSection(lines, "Communicative Presence");
  const result = { nonverbal: 0, tone: 0, words: 0 };
  for (const raw of block) {
    const t = raw.trim();
    if (!t.startsWith("- ")) continue;
    const stripped = stripMd(t.slice(2).trim());
    // Try "<Label> — 35%" or "<Label>: 35%"
    let m = stripped.match(/^(Presence & Posture|Voice Expression|Language & Phrasing)\s*[—:\-]\s*(\d+)\s*%/i);
    if (m) {
      result[CP_LABELS[normaliseCpLabel(m[1])]] = parseInt(m[2], 10);
      continue;
    }
    // Try "40% — <Label>" or "40% - <Label>"
    m = stripped.match(/^(\d+)\s*%\s*[—\-]\s*(Presence & Posture|Voice Expression|Language & Phrasing)/i);
    if (m) {
      result[CP_LABELS[normaliseCpLabel(m[2])]] = parseInt(m[1], 10);
      continue;
    }
  }
  return result;
}

function normaliseCpLabel(s) {
  const lower = s.toLowerCase();
  if (lower.startsWith("presence")) return "Presence & Posture";
  if (lower.startsWith("voice")) return "Voice Expression";
  if (lower.startsWith("language")) return "Language & Phrasing";
  return s;
}

function parseOriginChronicle(lines) {
  const block = findSection(lines, "Origin & Chronicle");
  // Preserve original markdown emphasis for content_md fidelity.
  return block.join("\n").replace(/^\n+|\n+$/g, "").trim();
}

function deriveNote(coreValue) {
  if (!coreValue) return "Composure and presence carry significant weight.";
  // First sentence, trimmed; cap at ~140 chars.
  const firstSentence = coreValue.split(/(?<=[.!?])\s/)[0].trim();
  const note = firstSentence.length > 160 ? firstSentence.slice(0, 157).trimEnd() + "…" : firstSentence;
  return note.endsWith(".") ? note : note + ".";
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

  const cp = parseCommunicativePresence(lines);
  const originChronicle = parseOriginChronicle(lines);

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
    communicative_presence: cp,
    origin_chronicle: originChronicle,
    note: deriveNote(coreValue),
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
  const header = `// AUTO-GENERATED by lib/db/src/seed-compass-database5.mjs — do not edit by hand.
// Source: attached_assets/Compas_database5_1777809033319.md
import type { Venue } from "./venues.js";

export const EXTRA_VENUES4: Venue[] = [
`;
  const body = allVenues.map((v) =>
    `  { id: ${jsonEsc(v.id)}, regionCode: ${jsonEsc(v.regionCode)}, category: ${jsonEsc(v.category)}, subcategory: ${jsonEsc(v.subcategory)}, name: ${jsonEsc(v.name)}, description: ${jsonEsc(v.description)}, occasionTags: ${JSON.stringify(v.occasionTags)}, tierBadge: ${jsonEsc(v.tierBadge)}, etiquetteTip: ${jsonEsc(v.etiquetteTip)} },`
  ).join("\n");
  writeFileSync(VENUES_OUT, header + body + "\n];\n");
}

function writeMehrabianFile(countries) {
  const lines = countries.map((c) => {
    const { nonverbal, tone, words } = c.communicative_presence;
    const note = c.note.replace(/"/g, '\\"');
    return `  ${c.region_code}: { nonverbal: ${nonverbal}, tone: ${tone}, words: ${words}, note: "${note}" },`;
  });
  writeFileSync(MEHRABIAN_OUT, lines.join("\n") + "\n");
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

      // Upsert Origin & Chronicle into cultural_origins. Schema requires
      // tradition / origin_summary / era / connected_rule, so map the task's
      // `title` to `tradition` and `content_md` to `origin_summary`.
      const tradition = `${c.region_name} — Origin & Chronicle`;
      await client.query(
        `DELETE FROM cultural_origins
          WHERE region_code = $1 AND domain = 'history' AND tradition = $2`,
        [c.region_code, tradition]
      );
      if (c.origin_chronicle) {
        await client.query(
          `INSERT INTO cultural_origins
             (region_code, domain, tradition, origin_summary, era, influences, connected_rule)
           VALUES ($1, 'history', $2, $3, $4, $5, $6)`,
          [
            c.region_code,
            tradition,
            c.origin_chronicle,
            "Historical chronicle",
            [],
            c.content.core_value || "See Origin & Chronicle for full context.",
          ]
        );
      }

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
  console.log(`Parsed ${countries.length} new countries with known ISO codes.`);

  for (const c of countries) {
    const venueCount = Object.values(c.venues).reduce((a, l) => a + l.length, 0);
    const cp = c.communicative_presence;
    const cpSum = cp.nonverbal + cp.tone + cp.words;
    console.log(
      `  ${c.region_code} ${c.region_name}: dos=${c.content.dos.length} donts=${c.content.donts.length} venues=${venueCount} cp=${cp.nonverbal}/${cp.tone}/${cp.words}=${cpSum}% origin=${c.origin_chronicle.length}c`
    );
  }

  const allVenues = countries.flatMap(buildVenueRecords);
  writeVenuesFile(allVenues);
  console.log(`Wrote ${allVenues.length} venues → ${VENUES_OUT}`);

  writeMehrabianFile(countries);
  console.log(`Wrote MEHRABIAN_WEIGHTS entries → ${MEHRABIAN_OUT}`);

  if (process.env.SKIP_DB === "1") {
    console.log("SKIP_DB=1 — skipping DB upsert.");
    return;
  }
  await upsertCompass(countries);
  console.log("Done.");
}

main().catch((err) => { console.error(err); process.exit(1); });
