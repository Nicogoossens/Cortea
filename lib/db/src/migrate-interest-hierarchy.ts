/**
 * Interest hierarchy migration — adds parent_slug to interest_catalog.
 * Idempotent: uses ADD COLUMN IF NOT EXISTS.
 *
 * Run: pnpm --filter @workspace/db migrate-interest-hierarchy
 */
import { db } from "./index.js";
import { sql } from "drizzle-orm";

const steps: Array<{ name: string; query: string }> = [
  {
    name: "interest_catalog: parent_slug",
    query: `ALTER TABLE interest_catalog ADD COLUMN IF NOT EXISTS parent_slug TEXT`,
  },
];

async function run() {
  console.log(`Running interest-hierarchy migration (${steps.length} step)\n`);
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
  console.log(`\nMigration complete.`);
}

run().catch((err) => {
  console.error("\nMigration failed:", err.message);
  process.exit(1);
});
