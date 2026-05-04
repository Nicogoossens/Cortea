#!/usr/bin/env node
/**
 * Counsel Seed Batch Orchestrator
 *
 * Runs counsel-seed-worker.mjs for every published compass_region that is
 * missing a seed for the given domain (or all domains).
 *
 * Usage:
 *   node scripts/counsel-seed-batch.mjs [--domain <name>] [--force]
 *
 * Flags:
 *   --domain <name>   Only process one domain (default: all 6)
 *   --force           Re-generate even if a seed already exists (overwrites drafts)
 */

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const _require  = createRequire(import.meta.url);
const dbPkgPath = path.resolve(__dirname, "../lib/db/package.json");
const pg        = _require(path.resolve(path.dirname(dbPkgPath), "node_modules/pg"));
const { Pool }  = pg;

// ── CLI ────────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function flag(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
}
const DOMAIN = flag("--domain");
const FORCE  = args.includes("--force");

const COUNSEL_DOMAINS = [
  "gastronomy",
  "business",
  "eloquence",
  "formal_events",
  "dress_code",
  "cultural_knowledge",
];

if (DOMAIN && !COUNSEL_DOMAINS.includes(DOMAIN)) {
  console.error(`Invalid domain: ${DOMAIN}. Must be one of: ${COUNSEL_DOMAINS.join(", ")}`);
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Run a single counsel-seed-worker ─────────────────────────────────────────
function runWorker(region, domain) {
  return new Promise((resolve) => {
    const workerArgs = [
      "scripts/counsel-seed-worker.mjs",
      "--region", region,
      "--domain", domain,
    ];
    const child = spawn("node", workerArgs, {
      cwd: path.resolve(__dirname, ".."),
      env: { ...process.env },
      stdio: "inherit",
    });
    child.on("close", (code) => {
      if (code !== 0) {
        console.warn(`  [WARN] Worker ${region}/${domain} exited with code ${code} — continuing batch`);
      }
      resolve();
    });
    child.on("error", (err) => {
      console.warn(`  [WARN] Worker spawn error ${region}/${domain}: ${err.message} — continuing batch`);
      resolve();
    });
  });
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log("Counsel Seed Batch Orchestrator");
  console.log(`Domain : ${DOMAIN ?? "ALL"}`);
  console.log(`Force  : ${FORCE}`);
  console.log("─".repeat(60));

  const { rows: allRegions } = await pool.query(
    `SELECT region_code FROM compass_regions WHERE is_published = true ORDER BY region_code`
  );
  console.log(`Published regions: ${allRegions.length}`);

  const domains = DOMAIN ? [DOMAIN] : COUNSEL_DOMAINS;

  for (const domain of domains) {
    console.log(`\n[${domain}] checking coverage…`);

    let targetRegions;
    if (FORCE) {
      targetRegions = allRegions.map((r) => r.region_code);
    } else {
      const { rows: seeded } = await pool.query(
        `SELECT DISTINCT region_code FROM counsel_region_seeds WHERE domain = $1`,
        [domain]
      );
      const seededSet = new Set(seeded.map((r) => r.region_code));
      targetRegions = allRegions
        .map((r) => r.region_code)
        .filter((code) => !seededSet.has(code));
    }

    console.log(`  Regions to process: ${targetRegions.length}`);
    if (targetRegions.length === 0) {
      console.log(`  ✓ All regions already have seeds for [${domain}]`);
      continue;
    }

    for (let i = 0; i < targetRegions.length; i++) {
      const region = targetRegions[i];
      console.log(`  [${i + 1}/${targetRegions.length}] ${region}/${domain}…`);
      await runWorker(region, domain);
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  await pool.end();
  console.log("\n" + "─".repeat(60));
  console.log("Batch orchestrator complete.");
}

main().catch(async (err) => {
  console.error("Fatal:", err.stack ?? err.message);
  try { await pool.end(); } catch {}
  process.exit(1);
});
