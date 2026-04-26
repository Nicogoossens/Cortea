import pg from "pg";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

const __dir = dirname(fileURLToPath(import.meta.url));
const SQL_FILE = resolve(__dir, "../migrations/0002_backfill_ambition_levels.sql");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    console.log("[migrate-0002] Starting ambition_level backfill migration…");
    console.log(`[migrate-0002] SQL source: ${SQL_FILE}`);

    const sql = readFileSync(SQL_FILE, "utf-8")
      .split("\n")
      .filter(line => !line.trim().startsWith("--") && line.trim().length > 0)
      .join("\n");

    const before = await client.query<{ ambition_level: string; count: string }>(
      `SELECT ambition_level, COUNT(*)::int AS count
         FROM users
        WHERE ambition_level IN ('curious','aspirational','distinguished')
        GROUP BY ambition_level`
    );

    if (before.rows.length === 0) {
      console.log("[migrate-0002] Before: no legacy rows found — migration already applied or never needed.");
    } else {
      console.log("[migrate-0002] Before:", before.rows);
    }

    await client.query("BEGIN");

    const statements = sql.split(";").map(s => s.trim()).filter(Boolean);
    let totalUpdated = 0;
    for (const stmt of statements) {
      const result = await client.query(stmt);
      totalUpdated += result.rowCount ?? 0;
      console.log(`[migrate-0002] Executed: "${stmt.replace(/\s+/g, " ").slice(0, 60)}…" — rowCount=${result.rowCount}`);
    }

    await client.query("COMMIT");
    console.log(`[migrate-0002] Transaction committed. Total rows updated: ${totalUpdated}`);

    const after = await client.query<{ ambition_level: string; count: string }>(
      `SELECT ambition_level, COUNT(*)::int AS count
         FROM users
        WHERE ambition_level IN ('curious','aspirational','distinguished')
        GROUP BY ambition_level`
    );

    if (after.rows.length === 0) {
      console.log("[migrate-0002] Verification PASSED — zero legacy rows remain.");
    } else {
      console.error("[migrate-0002] Verification FAILED — legacy rows still present:", after.rows);
      process.exit(1);
    }

    const all = await client.query<{ ambition_level: string; count: string }>(
      `SELECT ambition_level, COUNT(*)::int AS count FROM users GROUP BY ambition_level ORDER BY count DESC`
    );
    console.log("[migrate-0002] Current distribution:", all.rows);
    console.log("[migrate-0002] Migration complete.");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("[migrate-0002] Migration failed, rolled back.", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
