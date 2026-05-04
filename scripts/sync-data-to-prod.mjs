#!/usr/bin/env node
/**
 * sync-data-to-prod.mjs — one-way upsert of content tables from dev → prod.
 *
 * Migrates all generated content from the development database to production.
 * Skips `users` and `worker_runs` tables.
 *
 * Usage:
 *   node scripts/sync-data-to-prod.mjs [options]
 *
 * Options:
 *   --table <name>   Only sync this table (default: all tables)
 *   --dry-run        Show counts; do not write to prod
 *   --batch-size <n> Rows per upsert batch (default: 500)
 *
 * Requires:
 *   DATABASE_URL       — development database
 *   PROD_DATABASE_URL  — production database
 */

import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pg = require(path.resolve(__dirname, "../lib/db/node_modules/pg"));
const { Pool } = pg;

// ── CLI flags ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flagStr  = (n) => { const i = args.indexOf(n); return i !== -1 && args[i+1] ? args[i+1] : null; };
const flagBool = (n) => args.includes(n);

const FLAG_TABLE      = flagStr("--table");
const FLAG_DRY        = flagBool("--dry-run");
const FLAG_BATCH_SIZE = flagStr("--batch-size") ? parseInt(flagStr("--batch-size"), 10) : 500;

// ── Table configuration ───────────────────────────────────────────────────────
// conflict_col:        single unique column → ON CONFLICT ("col")
// conflict_constraint: named constraint   → ON CONFLICT ON CONSTRAINT "name"
// no_update_cols:      columns to skip in the SET clause (e.g. primary key when
//                      using a compound unique constraint as the conflict target)
// order_col:           stable column to ORDER BY for deterministic batch pagination.
const ALL_TABLES = [
  { name: "compass_regions",          conflict_col: "region_code",   order_col: "region_code" },
  {
    name: "culture_protocols",
    conflict_constraint: "culture_protocols_region_pillar_rule_key",
    no_update_cols: ["id"],   // never overwrite the PK of an existing prod row
    order_col: "id",
  },
  {
    name: "scenarios",
    conflict_constraint: "scenarios_region_pillar_title_key",
    no_update_cols: ["id"],
    order_col: "id",
  },
  { name: "badges",                   conflict_col: "slug",          order_col: "slug" },
  { name: "counsel_region_seeds",     conflict_col: "id",            order_col: "id" },
  {
    name: "translations",
    conflict_cols: ["language_code", "key"], // unique index, not a named constraint
    no_insert_cols: ["id"],   // let prod DB auto-generate IDs; dev IDs may clash
    no_update_cols: ["id"],
    order_col: "id",
  },
  // LTQ last — largest table, depends on nothing.
  // question_hash is GENERATED ALWAYS (computed by DB); exclude from INSERT
  // but keep as the conflict target so duplicates are correctly detected.
  {
    name: "learning_track_questions",
    conflict_col: "question_hash",
    no_insert_cols: ["question_hash"],
    order_col: "id",
  },
];

// ── Guards ────────────────────────────────────────────────────────────────────
if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL is not set.");
  process.exit(1);
}
if (!process.env.PROD_DATABASE_URL) {
  console.error(
    "Error: PROD_DATABASE_URL is not set.\n" +
    "Add it as a secret in the Replit environment (Settings → Secrets).\n" +
    "Copy the connection string from your Replit deployment database settings.",
  );
  process.exit(1);
}

const devPool  = new Pool({ connectionString: process.env.DATABASE_URL,      max: 3 });
const prodPool = new Pool({ connectionString: process.env.PROD_DATABASE_URL, max: 3 });

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n) { return n.toLocaleString(); }

async function getColumns(pool, table) {
  const { rows } = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name   = $1
     ORDER BY ordinal_position`,
    [table],
  );
  return rows.map((r) => r.column_name);
}

async function count(pool, table) {
  const { rows } = await pool.query(`SELECT COUNT(*) AS n FROM "${table}"`);
  return Number(rows[0]?.n ?? 0);
}

async function syncTable({ name, conflict_col, conflict_cols, conflict_constraint, no_insert_cols, no_update_cols, order_col }) {
  console.log(`\n  ── ${name} ${"─".repeat(Math.max(0, 50 - name.length))}`);

  const devCount = await count(devPool, name);
  console.log(`     Dev rows  : ${fmt(devCount)}`);
  if (devCount === 0) {
    console.log("     Skipping  : no rows in dev.");
    return { table: name, inserted: 0, updated: 0, skipped: 0 };
  }

  // Fetch column list from dev
  const columns = await getColumns(devPool, name);
  if (conflict_col && !columns.includes(conflict_col)) {
    console.error(`     Error: conflict column "${conflict_col}" not found in ${name}.`);
    return { table: name, inserted: 0, updated: 0, skipped: 0 };
  }

  // Build the ON CONFLICT target clause
  const conflictTarget = conflict_constraint
    ? `ON CONSTRAINT "${conflict_constraint}"`
    : conflict_cols
      ? `(${conflict_cols.map((c) => `"${c}"`).join(", ")})`
      : `("${conflict_col}")`;

  // Columns excluded from INSERT (e.g. serial PKs that prod auto-generates)
  const skipInsert = new Set(no_insert_cols ?? []);
  const insertCols = columns.filter((c) => !skipInsert.has(c));

  // Columns to skip in the SET clause: conflict col(s) + explicit no_update_cols
  const skipSet = new Set([
    ...(conflict_col  ? [conflict_col]  : []),
    ...(conflict_cols ?? []),
    ...(no_update_cols ?? []),
  ]);
  const updateCols = insertCols.filter((c) => !skipSet.has(c));

  const colList   = insertCols.map((c) => `"${c}"`).join(", ");
  const setClause = updateCols.map((c) => `"${c}" = EXCLUDED."${c}"`).join(", ");

  let offset   = 0;
  let inserted = 0;
  let updated  = 0;

  while (offset < devCount) {
    const { rows } = await devPool.query(
      `SELECT * FROM "${name}" ORDER BY "${order_col}" LIMIT $1 OFFSET $2`,
      [FLAG_BATCH_SIZE, offset],
    );
    if (rows.length === 0) break;

    if (FLAG_DRY) {
      inserted += rows.length; // treat all as would-be inserts in dry-run
      offset   += rows.length;
      continue;
    }

    // Build multi-row INSERT with DO UPDATE; use RETURNING to distinguish inserts vs updates.
    // xmax = 0 → newly inserted row; xmax != 0 → updated (conflict resolved with DO UPDATE).
    const valueClauses = rows.map((_, rowIdx) => {
      const start = rowIdx * insertCols.length;
      const params = insertCols.map((_, ci) => `$${start + ci + 1}`).join(", ");
      return `(${params})`;
    });
    // pg returns JSONB columns as JS objects; re-stringify them so the
    // parameterized query receives a valid JSON string for those columns.
    const flatValues = rows.flatMap((row) =>
      insertCols.map((c) => {
        const val = row[c] ?? null;
        if (val !== null && typeof val === "object" && !Buffer.isBuffer(val) && !(val instanceof Date)) {
          return JSON.stringify(val);
        }
        return val;
      }),
    );

    const sql =
      `INSERT INTO "${name}" (${colList}) VALUES ${valueClauses.join(",")} ` +
      `ON CONFLICT ${conflictTarget} DO UPDATE SET ${setClause} ` +
      `RETURNING (xmax::text::bigint = 0) AS was_inserted`;

    const result = await prodPool.query(sql, flatValues);
    for (const row of result.rows) {
      if (row.was_inserted) inserted++;
      else updated++;
    }

    offset += rows.length;
    const processed = offset < devCount ? offset : devCount;
    process.stdout.write(
      `\r     Progress  : ${fmt(processed)} / ${fmt(devCount)} (${fmt(inserted)} new, ${fmt(updated)} updated)`,
    );
  }

  if (!FLAG_DRY) {
    process.stdout.write("\n");
    const skipped = devCount - inserted - updated;
    console.log(
      `     Done      : ${fmt(inserted)} inserted, ${fmt(updated)} updated` +
      (skipped > 0 ? `, ${fmt(skipped)} unchanged` : "") + ".",
    );
  } else {
    console.log(`     Dry-run   : would process ${fmt(devCount)} rows.`);
  }

  return { table: name, inserted, updated, skipped: devCount - inserted - updated };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n┌─────────────────────────────────────────────────────────────┐");
  console.log("│         Cortéa — Dev → Prod Data Sync                       │");
  if (FLAG_DRY) {
    console.log("│                    [DRY RUN — geen wijzigingen]             │");
  }
  console.log("└─────────────────────────────────────────────────────────────┘");

  const tables = FLAG_TABLE
    ? ALL_TABLES.filter((t) => t.name === FLAG_TABLE)
    : ALL_TABLES;

  if (tables.length === 0) {
    console.error(`\nError: unknown table "${FLAG_TABLE}". Valid: ${ALL_TABLES.map((t) => t.name).join(", ")}`);
    process.exit(1);
  }

  const startedAt = Date.now();
  const results   = [];

  for (const table of tables) {
    const result = await syncTable(table);
    results.push(result);
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  const totalInserted = results.reduce((s, r) => s + (r.inserted ?? 0), 0);
  const totalUpdated  = results.reduce((s, r) => s + (r.updated  ?? 0), 0);

  console.log(`\n  ── Samenvatting ${"─".repeat(42)}`);
  for (const r of results) {
    const detail = FLAG_DRY
      ? `${fmt(r.inserted)} rijen`
      : `${fmt(r.inserted)} nieuw, ${fmt(r.updated)} bijgewerkt`;
    console.log(`     ${r.table.padEnd(32)} ${detail}`);
  }
  console.log(`  ${"─".repeat(55)}`);
  if (FLAG_DRY) {
    console.log(`     Totaal${" ".repeat(24)} ${fmt(totalInserted)} rijen`);
  } else {
    console.log(`     Totaal${" ".repeat(14)} ${fmt(totalInserted)} nieuw, ${fmt(totalUpdated)} bijgewerkt`);
  }
  console.log(`     Tijd   : ${elapsed}s\n`);

  if (FLAG_DRY) {
    console.log("  ℹ️  Dry-run — voer zonder --dry-run uit om daadwerkelijk te synchroniseren.\n");
  } else {
    console.log("  ✅  Synchronisatie voltooid.\n");
  }

  await devPool.end();
  await prodPool.end();
}

main().catch((err) => {
  console.error("\nFatal:", err.message);
  process.exit(1);
});
