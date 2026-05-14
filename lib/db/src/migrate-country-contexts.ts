/**
 * user_country_contexts schema migration — Task #404
 * Maakt aan:
 *   - user_country_contexts (leercontext per land × gebruiker)
 *
 * Idempotent: gebruikt IF NOT EXISTS guards.
 * Run: pnpm --filter @workspace/db migrate-country-contexts
 */
import { db } from "./index.js";
import { sql } from "drizzle-orm";

const steps: Array<{ name: string; query: string }> = [
  {
    name: "CREATE user_country_contexts",
    query: `
      CREATE TABLE IF NOT EXISTS user_country_contexts (
        id                 SERIAL PRIMARY KEY,
        user_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        region_code        TEXT NOT NULL,
        context_type       TEXT NOT NULL,
        target_demographic TEXT,
        created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `,
  },
  {
    name: "CREATE UNIQUE INDEX ucc_user_region_type_demo_idx",
    query: `
      CREATE UNIQUE INDEX IF NOT EXISTS ucc_user_region_type_demo_idx
      ON user_country_contexts (user_id, region_code, context_type, COALESCE(target_demographic, ''))
    `,
  },
  {
    name: "CREATE INDEX ucc_user_region_idx",
    query: `
      CREATE INDEX IF NOT EXISTS ucc_user_region_idx
      ON user_country_contexts (user_id, region_code)
    `,
  },
];

async function run() {
  console.log(`Running country-contexts schema migration (${steps.length} steps)\n`);

  for (const step of steps) {
    try {
      await db.execute(sql.raw(step.query));
      console.log(`  ✓ ${step.name}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("already exists")) {
        console.log(`  ~ ${step.name} (already exists, skipped)`);
      } else {
        console.error(`  ✗ ${step.name}: ${msg}`);
        throw err;
      }
    }
  }

  console.log("\nMigration complete.");
}

run().catch((err) => {
  console.error("\nMigration failed:", err.message);
  process.exit(1);
});
