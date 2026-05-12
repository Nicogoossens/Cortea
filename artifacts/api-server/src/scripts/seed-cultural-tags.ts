/**
 * Seed the cultural_tags table — canonical tag registry.
 * 1.415 unique tags (global / regional / national) from the master CSV.
 *
 * Source: attached_assets/cortea-tags-master_*.csv
 * Drive:  cortea/Bibliotheek/03_Data_Specs/cortea-tags-master-world-v2.csv
 *
 * Usage:
 *   pnpm --filter @workspace/api-server tsx src/scripts/seed-cultural-tags.ts
 *
 * Idempotent — upserts on tag_id. Safe to run repeatedly.
 * Targets PROD_DATABASE_URL when set, otherwise DATABASE_URL.
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { db, pool } from "@workspace/db";
import { culturalTagsTable } from "@workspace/db";
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
    "cortea-tags-master CSV not found. Expected at attached_assets/cortea-tags-master_*.csv\n" +
    "Drive location: cortea/Bibliotheek/03_Data_Specs/cortea-tags-master-world-v2.csv"
  );
}

interface TagRow {
  tag_id: string;
  tag_scope: string;
}

function parseCsv(csvPath: string): TagRow[] {
  const lines = readFileSync(csvPath, "utf8").split("\n");
  const seen = new Map<string, string>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(",");
    const tag_id = cols[0]?.trim();
    const tag_scope = cols[4]?.trim();
    if (!tag_id || !tag_scope) continue;
    if (!seen.has(tag_id)) {
      seen.set(tag_id, tag_scope);
    }
  }

  return Array.from(seen.entries()).map(([tag_id, tag_scope]) => ({ tag_id, tag_scope }));
}

async function main() {
  const csvPath = findCsv();
  console.log(`[seed-cultural-tags] Reading CSV from: ${csvPath}`);

  const tags = parseCsv(csvPath);
  console.log(`[seed-cultural-tags] Upserting ${tags.length} unique tags…`);

  const BATCH = 200;
  let upserted = 0;

  for (let i = 0; i < tags.length; i += BATCH) {
    const batch = tags.slice(i, i + BATCH);
    await db
      .insert(culturalTagsTable)
      .values(batch)
      .onConflictDoUpdate({
        target: culturalTagsTable.tag_id,
        set: {
          tag_scope: sql`excluded.tag_scope`,
        },
      });
    upserted += batch.length;
    process.stdout.write(`\r  ${upserted}/${tags.length}`);
  }

  console.log(`\n[seed-cultural-tags] Done. ${upserted} tags upserted.`);

  const counts = await db.execute(
    sql`SELECT tag_scope, count(*)::int FROM cultural_tags GROUP BY tag_scope ORDER BY tag_scope`
  );
  console.log("[seed-cultural-tags] Counts by scope:");
  for (const row of counts.rows as { tag_scope: string; count: number }[]) {
    console.log(`  ${row.tag_scope}: ${row.count}`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error("[seed-cultural-tags] Failed:", err);
  process.exit(1);
});
