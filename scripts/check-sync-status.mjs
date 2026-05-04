#!/usr/bin/env node
/**
 * check-sync-status.mjs — compare row counts between dev and prod databases.
 *
 * Usage:
 *   node scripts/check-sync-status.mjs
 *
 * Requires:
 *   DATABASE_URL       — development database (always set)
 *   PROD_DATABASE_URL  — production database (set as a secret)
 */

import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pg = require(path.resolve(__dirname, "../lib/db/node_modules/pg"));
const { Pool } = pg;

const TABLES = [
  { name: "learning_track_questions", conflict: "question_hash" },
  { name: "culture_protocols",        conflict: "id" },
  { name: "translations",             conflict: "id" },
  { name: "compass_regions",          conflict: "region_code" },
  { name: "scenarios",                conflict: "id" },
  { name: "badges",                   conflict: "slug" },
  { name: "counsel_region_seeds",     conflict: "id" },
];

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL is not set.");
  process.exit(1);
}
if (!process.env.PROD_DATABASE_URL) {
  console.error(
    "Error: PROD_DATABASE_URL is not set.\n" +
    "Add it as a secret in the Replit environment.\n" +
    "You can find the connection string in your Replit deployment database settings.",
  );
  process.exit(1);
}

const devPool  = new Pool({ connectionString: process.env.DATABASE_URL });
const prodPool = new Pool({ connectionString: process.env.PROD_DATABASE_URL });

async function count(pool, table) {
  const { rows } = await pool.query(`SELECT COUNT(*) AS n FROM ${table}`);
  return Number(rows[0]?.n ?? 0);
}

async function main() {
  console.log("┌─────────────────────────────────────────────────────────────┐");
  console.log("│           Cortéa — Dev vs Prod Sync Status                  │");
  console.log("└─────────────────────────────────────────────────────────────┘\n");

  const colW = 30;
  console.log(
    "  " +
    "Tabel".padEnd(colW) +
    "Dev".padStart(10) +
    "Prod".padStart(10) +
    "Delta".padStart(10),
  );
  console.log("  " + "─".repeat(colW + 30));

  let totalDelta = 0;
  for (const { name } of TABLES) {
    let devN = 0, prodN = 0;
    try { devN  = await count(devPool,  name); } catch { devN  = -1; }
    try { prodN = await count(prodPool, name); } catch { prodN = -1; }
    const delta  = devN >= 0 && prodN >= 0 ? devN - prodN : null;
    const marker = delta === null ? "  ?" : delta === 0 ? "  ✓" : delta > 0 ? `+${delta}` : String(delta);
    if (delta !== null) totalDelta += Math.abs(delta);

    const devStr  = devN  < 0 ? "(error)" : devN.toLocaleString();
    const prodStr = prodN < 0 ? "(error)" : prodN.toLocaleString();
    console.log(
      "  " +
      name.padEnd(colW) +
      devStr.padStart(10) +
      prodStr.padStart(10) +
      marker.padStart(10),
    );
  }

  console.log("  " + "─".repeat(colW + 30));
  if (totalDelta === 0) {
    console.log("\n  ✅  Dev en prod zijn gesynchroniseerd.\n");
  } else {
    console.log(`\n  ⚠️   ${totalDelta.toLocaleString()} rijen verschillen. Voer sync-data-to-prod.mjs uit om te synchroniseren.\n`);
  }

  await devPool.end();
  await prodPool.end();
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
