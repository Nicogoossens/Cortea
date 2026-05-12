/**
 * Cultural tag-matrix schema migration — Task #392
 * Maakt aan:
 *   - cultural_tags          (canonieke tag registry, 1.415 rijen)
 *   - cultural_tag_matrix    (tag × land × status, ~293.000 rijen)
 *   - kolom cultural_tags op learning_track_questions (JSONB, default [])
 *
 * Idempotent: gebruikt IF NOT EXISTS / IF column doesn't exist guards.
 * Run: pnpm --filter @workspace/db migrate-cultural-tags
 */
import { db } from "./index.js";
import { sql } from "drizzle-orm";

const steps: Array<{ name: string; query: string }> = [
  // ── Tabel: cultural_tags ───────────────────────────────────────────────────
  {
    name: "CREATE cultural_tags",
    query: `
      CREATE TABLE IF NOT EXISTS cultural_tags (
        tag_id     TEXT PRIMARY KEY,
        tag_scope  TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `,
  },
  {
    name: "CREATE INDEX ct_scope_idx",
    query: `CREATE INDEX IF NOT EXISTS ct_scope_idx ON cultural_tags (tag_scope)`,
  },

  // ── Tabel: cultural_tag_matrix ─────────────────────────────────────────────
  {
    name: "CREATE cultural_tag_matrix",
    query: `
      CREATE TABLE IF NOT EXISTS cultural_tag_matrix (
        tag_id                TEXT    NOT NULL,
        country_iso           TEXT    NOT NULL,
        status                TEXT    NOT NULL,
        volatility            TEXT    NOT NULL DEFAULT 'stable',
        source                TEXT    NOT NULL DEFAULT 'baseline',
        country_review_status TEXT    NOT NULL DEFAULT 'inherited',
        note_short            TEXT,
        reviewed_at           TIMESTAMPTZ,
        needs_review          BOOLEAN NOT NULL DEFAULT FALSE,
        updated_at            TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (tag_id, country_iso)
      )
    `,
  },
  {
    name: "CREATE INDEX ctm_country_status_idx",
    query: `CREATE INDEX IF NOT EXISTS ctm_country_status_idx ON cultural_tag_matrix (country_iso, status)`,
  },
  {
    name: "CREATE INDEX ctm_volatility_review_idx",
    query: `CREATE INDEX IF NOT EXISTS ctm_volatility_review_idx ON cultural_tag_matrix (volatility, needs_review)`,
  },

  // ── Kolom op learning_track_questions ──────────────────────────────────────
  {
    name: "ltq: cultural_tags JSONB column",
    query: `ALTER TABLE learning_track_questions ADD COLUMN IF NOT EXISTS cultural_tags JSONB NOT NULL DEFAULT '[]'`,
  },
  {
    name: "CREATE INDEX ltq_cultural_tags_gin_idx",
    query: `CREATE INDEX IF NOT EXISTS ltq_cultural_tags_gin_idx ON learning_track_questions USING GIN (cultural_tags)`,
  },
];

async function run() {
  console.log(`Running cultural tag-matrix schema migration (${steps.length} steps)\n`);

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

  console.log(`\nMigration complete. Volgende stap: pnpm --filter @workspace/db seed-cultural-tags`);
}

run().catch((err) => {
  console.error("\nMigration failed:", err.message);
  process.exit(1);
});
