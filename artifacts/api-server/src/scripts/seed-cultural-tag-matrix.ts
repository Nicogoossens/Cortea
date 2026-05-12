/**
 * Seed the cultural_tag_matrix table — 86.315 rijen (61 landen × 1.415 tags).
 * Bron: attached_assets/cortea-tags-master_*.csv
 * Drive: cortea/Bibliotheek/03_Data_Specs/cortea-tags-master-world-v2.csv
 *
 * Kolommen in CSV: tag_id, country_iso, status, volatility, tag_scope, source, note_short
 *
 * Idempotent — upsert op (tag_id, country_iso) PRIMARY KEY.
 * reviewed_at / needs_review worden NIET overschreven als ze al gezet zijn.
 *
 * Usage:
 *   pnpm --filter @workspace/api-server tsx src/scripts/seed-cultural-tag-matrix.ts
 *
 * Targets PROD_DATABASE_URL when set, otherwise DATABASE_URL.
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { db, pool } from "@workspace/db";
import { culturalTagMatrixTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const __dirname = dirname(fileURLToPath(import.meta.url));

function findCsv(): string {
  const candidates = [
    join(__dirname, "../../../../../attached_assets/cortea-tags-master_1778503569352.csv"),
    join(__dirname, "../../../../attached_assets/cortea-tags-master_1778503569352.csv"),
    join(process.cwd(), "attached_assets/cortea-tags-master_1778503569352.csv"),
  ];
  for (const p of candidates) {
    try {
      readFileSync(p, { encoding: "utf8", flag: "r" });
      return p;
    } catch {
      continue;
    }
  }
  throw new Error(
    "cortea-tags-master CSV not found.\n" +
    "Drive: cortea/Bibliotheek/03_Data_Specs/cortea-tags-master-world-v2.csv"
  );
}

interface MatrixRow {
  tag_id: string;
  country_iso: string;
  status: string;
  volatility: string;
  source: string;
  note_short: string | null;
}

function parseCsv(csvPath: string): MatrixRow[] {
  const lines = readFileSync(csvPath, "utf8").split("\n");
  const rows: MatrixRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(",");
    const tag_id      = cols[0]?.trim();
    const country_iso = cols[1]?.trim();
    const status      = cols[2]?.trim();
    const volatility  = cols[3]?.trim() || "stable";
    const source      = cols[5]?.trim() || "baseline";
    const note_short  = cols[6]?.trim() || null;

    if (!tag_id || !country_iso || !status) continue;
    rows.push({ tag_id, country_iso, status, volatility, source, note_short: note_short || null });
  }
  return rows;
}

async function main() {
  const csvPath = findCsv();
  console.log(`[seed-tag-matrix] Reading CSV: ${csvPath}`);

  const rows = parseCsv(csvPath);
  console.log(`[seed-tag-matrix] Upserting ${rows.length} rows in batches of 500…`);

  const BATCH = 500;
  let upserted = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    await db
      .insert(culturalTagMatrixTable)
      .values(batch.map((r) => ({
        tag_id:                r.tag_id,
        country_iso:           r.country_iso,
        status:                r.status,
        volatility:            r.volatility,
        source:                r.source,
        country_review_status: "inherited",
        note_short:            r.note_short,
        needs_review:          false,
      })))
      .onConflictDoUpdate({
        target: [culturalTagMatrixTable.tag_id, culturalTagMatrixTable.country_iso],
        set: {
          status:     sql`excluded.status`,
          volatility: sql`excluded.volatility`,
          source:     sql`excluded.source`,
          note_short: sql`excluded.note_short`,
          updated_at: sql`now()`,
        },
      });
    upserted += batch.length;
    if (upserted % 5000 === 0 || upserted === rows.length) {
      process.stdout.write(`\r  ${upserted}/${rows.length}`);
    }
  }

  console.log(`\n[seed-tag-matrix] Done. ${upserted} rows upserted.`);

  const counts = await db.execute(
    sql`SELECT status, count(*)::int FROM cultural_tag_matrix GROUP BY status ORDER BY count DESC`
  );
  console.log("[seed-tag-matrix] Counts by status:");
  for (const row of counts.rows as { status: string; count: number }[]) {
    console.log(`  ${row.status}: ${row.count}`);
  }

  const countries = await db.execute(
    sql`SELECT count(DISTINCT country_iso)::int as countries FROM cultural_tag_matrix`
  );
  console.log(`[seed-tag-matrix] Countries covered: ${(countries.rows[0] as {countries: number}).countries}`);

  await pool.end();
}

main().catch((err) => {
  console.error("[seed-tag-matrix] Failed:", err);
  process.exit(1);
});
