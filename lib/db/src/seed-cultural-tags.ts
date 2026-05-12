/**
 * Seed cultural_tags + cultural_tag_matrix from Google Drive world-v2 CSV.
 *
 * Bron: cortea-tags-master-world-v2.csv (Drive file ID 1gkUC_xHyBTkNp74gEdaBPSiX8RneyY4F)
 * 199 landen · ~293.000 rijen · 1.415 canonieke tags
 *
 * Gebruik:
 *   pnpm --filter @workspace/db seed-cultural-tags
 *
 * Vereisten:
 *   - Tabellen cultural_tags + cultural_tag_matrix bestaan (migrate-cultural-tags)
 *   - Replit google-drive integratie geconfigureerd
 *   - DATABASE_URL of PROD_DATABASE_URL gezet
 *
 * Gedrag:
 *   - Idempotent: heruitvoerbaar zonder dataverlies
 *   - Upsert naar cultural_tags (tag_id, tag_scope)
 *   - Upsert naar cultural_tag_matrix (alle kolommen behalve reviewed_at + needs_review)
 *   - reviewed_at en needs_review worden NOOIT overschreven (handmatige reviews bewaard)
 *   - Voortgang gelogd elke 50 batches; eindtelling na afloop
 */

import { db, pool } from "./index.js";
import { culturalTagsTable, culturalTagMatrixTable } from "./schema/index.js";
import { sql } from "drizzle-orm";
// @ts-ignore — connectors-sdk is workspace-wide, not declared in this package's deps
import { ReplitConnectors } from "@replit/connectors-sdk";

const DRIVE_FILE_ID = "1gkUC_xHyBTkNp74gEdaBPSiX8RneyY4F";
const MATRIX_BATCH = 500;
const TAG_BATCH    = 200;
const LOG_EVERY    = 50;

// ── CSV column order (confirmed from world-v2) ────────────────────────────────
// tag_id, country_iso, status, volatility, tag_scope, source, country_review_status, note_short

interface CsvRow {
  tag_id:                string;
  country_iso:           string;
  status:                string;
  volatility:            string;
  tag_scope:             string;
  source:                string;
  country_review_status: string;
  note_short:            string | null;
}

function parseCsvLine(line: string): string[] {
  // Simple RFC-4180 parser — handles quoted fields with commas inside
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

async function downloadCsv(): Promise<string> {
  console.log("Downloaden van Google Drive …");
  const connectors = new ReplitConnectors();
  const resp = await connectors.proxy(
    "google-drive",
    `/drive/v3/files/${DRIVE_FILE_ID}?alt=media`,
    { method: "GET" },
  );
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Drive download mislukt (${resp.status}): ${text}`);
  }
  const text = await resp.text();
  console.log(`  → ${(text.length / 1_048_576).toFixed(1)} MB ontvangen`);
  return text;
}

async function upsertTags(tags: Map<string, string>): Promise<void> {
  const entries = [...tags.entries()].map(([tag_id, tag_scope]) => ({ tag_id, tag_scope }));
  console.log(`\nUpserting ${entries.length} unieke tags naar cultural_tags …`);
  let done = 0;
  for (let i = 0; i < entries.length; i += TAG_BATCH) {
    const batch = entries.slice(i, i + TAG_BATCH);
    await db
      .insert(culturalTagsTable)
      .values(batch)
      .onConflictDoUpdate({
        target: culturalTagsTable.tag_id,
        set: { tag_scope: sql`excluded.tag_scope` },
      });
    done += batch.length;
  }
  console.log(`  ✓ ${done} tags upserted`);
}

async function upsertMatrix(rows: CsvRow[]): Promise<void> {
  console.log(`\nUpserting ${rows.length} rijen naar cultural_tag_matrix …`);
  let done = 0;
  let batchNum = 0;

  for (let i = 0; i < rows.length; i += MATRIX_BATCH) {
    const batch = rows.slice(i, i + MATRIX_BATCH);
    batchNum++;

    await db
      .insert(culturalTagMatrixTable)
      .values(
        batch.map((r) => ({
          tag_id:                r.tag_id,
          country_iso:           r.country_iso,
          status:                r.status,
          volatility:            r.volatility || "stable",
          source:                r.source     || "baseline",
          country_review_status: r.country_review_status || "inherited",
          note_short:            r.note_short || null,
          updated_at:            new Date(),
        })),
      )
      .onConflictDoUpdate({
        target: [culturalTagMatrixTable.tag_id, culturalTagMatrixTable.country_iso],
        set: {
          status:                sql`excluded.status`,
          volatility:            sql`excluded.volatility`,
          source:                sql`excluded.source`,
          country_review_status: sql`excluded.country_review_status`,
          note_short:            sql`excluded.note_short`,
          updated_at:            sql`excluded.updated_at`,
          // reviewed_at en needs_review worden NIET aangeraakt
        },
      });

    done += batch.length;
    if (batchNum % LOG_EVERY === 0) {
      const pct = ((done / rows.length) * 100).toFixed(1);
      console.log(`  batch ${batchNum} — ${done.toLocaleString()} / ${rows.length.toLocaleString()} (${pct}%)`);
    }
  }
  console.log(`  ✓ ${done.toLocaleString()} matrix-rijen upserted`);
}

async function main(): Promise<void> {
  const csvText = await downloadCsv();

  const lines = csvText.split("\n");
  const header = lines[0].trim().split(",").map((h) => h.trim().toLowerCase());

  const colIdx = {
    tag_id:                header.indexOf("tag_id"),
    country_iso:           header.indexOf("country_iso"),
    status:                header.indexOf("status"),
    volatility:            header.indexOf("volatility"),
    tag_scope:             header.indexOf("tag_scope"),
    source:                header.indexOf("source"),
    country_review_status: header.indexOf("country_review_status"),
    note_short:            header.indexOf("note_short"),
  };

  // Valideer header
  const missing = Object.entries(colIdx).filter(([, idx]) => idx === -1).map(([k]) => k);
  if (missing.length > 0) {
    throw new Error(`CSV header mist kolommen: ${missing.join(", ")}\nHeader: ${lines[0]}`);
  }

  console.log(`CSV geladen: ${lines.length - 1} rijen (excl. header)`);

  const tagMap  = new Map<string, string>(); // tag_id → tag_scope
  const matrixRows: CsvRow[] = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = parseCsvLine(line);
    const tag_id    = fields[colIdx.tag_id]?.trim();
    const country   = fields[colIdx.country_iso]?.trim();
    const status    = fields[colIdx.status]?.trim();
    const tag_scope = fields[colIdx.tag_scope]?.trim();

    if (!tag_id || !country || !status || !tag_scope) { skipped++; continue; }

    tagMap.set(tag_id, tag_scope);
    matrixRows.push({
      tag_id,
      country_iso:           country,
      status,
      volatility:            fields[colIdx.volatility]?.trim()            || "stable",
      tag_scope,
      source:                fields[colIdx.source]?.trim()                || "baseline",
      country_review_status: fields[colIdx.country_review_status]?.trim() || "inherited",
      note_short:            fields[colIdx.note_short]?.trim()            || null,
    });
  }

  if (skipped > 0) console.warn(`  ⚠ ${skipped} rijen overgeslagen (ontbrekende verplichte velden)`);

  await upsertTags(tagMap);
  await upsertMatrix(matrixRows);

  // Eindtelling
  const tagResult    = await db.execute(sql`SELECT COUNT(*)::int AS count FROM cultural_tags`);
  const matrixResult = await db.execute(sql`SELECT COUNT(*)::int AS count FROM cultural_tag_matrix`);
  const tagCount    = (tagResult.rows[0] as { count: number }).count;
  const matrixCount = (matrixResult.rows[0] as { count: number }).count;

  console.log(`\n✓ Klaar`);
  console.log(`  cultural_tags:       ${tagCount} rijen`);
  console.log(`  cultural_tag_matrix: ${matrixCount} rijen`);

  await pool.end();
}

main().catch((err) => {
  console.error("\nFOUT:", err.message ?? err);
  process.exit(1);
});
