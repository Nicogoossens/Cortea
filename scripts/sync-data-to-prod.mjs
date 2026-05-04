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
// conflict_col: the unique/primary key column to upsert on.
// order_col:    stable column to ORDER BY for deterministic batch pagination.
const ALL_TABLES = [
  { name: "compass_regions",          conflict_col: "region_code",   order_col: "region_code" },
  { name: "culture_protocols",        conflict_col: "id",            order_col: "id" },
  { name: "scenarios",                conflict_col: "id",            order_col: "id" },
  { name: "badges",                   conflict_col: "slug",          order_col: "slug" },
  { name: "counsel_region_seeds",     conflict_col: "id",            order_col: "id" },
  { name: "translations",             conflict_col: "id",            order_col: "id" },
  // LTQ last — largest table, depends on nothing
  { name: "learning_track_questions", conflict_col: "question_hash", order_col: "id" },
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

async function syncTable({ name, conflict_col, order_col }) {
  console.log(`\n  ── ${name} ─────────────────────────────────────────────`);

  const devCount = await count(devPool, name);
  console.log(`     Dev rows  : ${fmt(devCount)}`);
  if (devCount === 0) {
    console.log("     Skipping  : no rows in dev.");
    return { table: name, inserted: 0, skipped: devCount };
  }

  // Fetch column list from dev
  const columns = await getColumns(devPool, name);
  if (!columns.includes(conflict_col)) {
    console.error(`     Error: conflict column "${conflict_col}" not found in ${name}.`);
    return { table: name, inserted: 0, skipped: devCount };
  }

  // Build the upsert template (ON CONFLICT DO NOTHING — safe for initial sync)
  const colList   = columns.map((c) => `"${c}"`).join(", ");
  const placeholders = (offset) => columns.map((_, i) => `$${offset + i + 1}`).join(", ");

  let offset  = 0;
  let total   = 0;

  while (offset < devCount) {
    const { rows } = await devPool.query(
      `SELECT * FROM "${name}" ORDER BY "${order_col}" LIMIT $1 OFFSET $2`,
      [FLAG_BATCH_SIZE, offset],
    );
    if (rows.length === 0) break;

    if (FLAG_DRY) {
      total   += rows.length;
      offset  += rows.length;
      continue;
    }

    // Build a multi-row INSERT for this batch
    const valueClauses = rows.map((_, rowIdx) => `(${placeholders(rowIdx * columns.length)})`);
    const flatValues   = rows.flatMap((row) => columns.map((c) => row[c] ?? null));

    const sql =
      `INSERT INTO "${name}" (${colList}) VALUES ${valueClauses.join(",")} ` +
      `ON CONFLICT ("${conflict_col}") DO NOTHING`;

    const result = await prodPool.query(sql, flatValues);
    total  += result.rowCount ?? 0;
    offset += rows.length;

    process.stdout.write(`\r     Upserted  : ${fmt(total)} / ${fmt(devCount)}`);
  }

  if (!FLAG_DRY) {
    process.stdout.write("\n");
    console.log(`     Done      : ${fmt(total)} rows upserted (${fmt(devCount - total)} skipped / already in prod).`);
  } else {
    console.log(`     Dry-run   : would upsert ${fmt(devCount)} rows.`);
  }

  return { table: name, inserted: total, total: devCount };
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

  console.log(`\n  ── Samenvatting ${"─".repeat(42)}`);
  for (const r of results) {
    console.log(`     ${r.table.padEnd(32)} ${fmt(r.inserted ?? 0).padStart(8)} rijen`);
  }
  console.log(`  ${"─".repeat(55)}`);
  console.log(`     Totaal${" ".repeat(24)} ${fmt(totalInserted).padStart(8)} rijen`);
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
