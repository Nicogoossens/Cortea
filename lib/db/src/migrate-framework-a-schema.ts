/**
 * Master Framework v1.1 — Task A schema migration
 * Applies all DDL changes without drizzle-kit (avoids interactive prompts).
 * Idempotent: uses IF NOT EXISTS / IF column doesn't exist guards.
 *
 * Run: pnpm --filter @workspace/db migrate-framework-a-schema
 */
import { db } from "./index.js";
import { sql } from "drizzle-orm";

const steps: Array<{ name: string; query: string }> = [
  // ── New tables ─────────────────────────────────────────────────────────────
  {
    name: "CREATE interest_catalog",
    query: `
      CREATE TABLE IF NOT EXISTS interest_catalog (
        id             SERIAL PRIMARY KEY,
        slug           TEXT NOT NULL,
        taxonomy       TEXT NOT NULL,
        label_i18n_key TEXT NOT NULL,
        registers      JSONB NOT NULL DEFAULT '[]',
        region_codes   JSONB DEFAULT NULL,
        display_order  INTEGER NOT NULL DEFAULT 0,
        created_at     TIMESTAMPTZ DEFAULT NOW()
      )
    `,
  },
  {
    name: "CREATE UNIQUE INDEX ic_slug_idx",
    query: `CREATE UNIQUE INDEX IF NOT EXISTS ic_slug_idx ON interest_catalog (slug)`,
  },
  {
    name: "CREATE INDEX ic_taxonomy_idx",
    query: `CREATE INDEX IF NOT EXISTS ic_taxonomy_idx ON interest_catalog (taxonomy)`,
  },
  {
    name: "CREATE country_archetype_extensions",
    query: `
      CREATE TABLE IF NOT EXISTS country_archetype_extensions (
        id             SERIAL PRIMARY KEY,
        country_code   TEXT NOT NULL,
        archetype      TEXT NOT NULL,
        pillar_weights JSONB NOT NULL DEFAULT '{}',
        created_at     TIMESTAMPTZ DEFAULT NOW()
      )
    `,
  },
  {
    name: "CREATE UNIQUE INDEX cae_country_archetype_idx",
    query: `CREATE UNIQUE INDEX IF NOT EXISTS cae_country_archetype_idx ON country_archetype_extensions (country_code, archetype)`,
  },
  {
    name: "CREATE region_dimension_weights",
    query: `
      CREATE TABLE IF NOT EXISTS region_dimension_weights (
        id             SERIAL PRIMARY KEY,
        region_code    TEXT NOT NULL,
        attentiveness  DOUBLE PRECISION NOT NULL DEFAULT 1.0,
        composure      DOUBLE PRECISION NOT NULL DEFAULT 1.0,
        discernment    DOUBLE PRECISION NOT NULL DEFAULT 1.0,
        diplomacy      DOUBLE PRECISION NOT NULL DEFAULT 1.0,
        presence       DOUBLE PRECISION NOT NULL DEFAULT 1.0,
        created_at     TIMESTAMPTZ DEFAULT NOW()
      )
    `,
  },
  {
    name: "CREATE UNIQUE INDEX rdw_region_code_idx",
    query: `CREATE UNIQUE INDEX IF NOT EXISTS rdw_region_code_idx ON region_dimension_weights (region_code)`,
  },
  {
    name: "CREATE compass_history",
    query: `
      CREATE TABLE IF NOT EXISTS compass_history (
        id             SERIAL PRIMARY KEY,
        user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        attentiveness  INTEGER NOT NULL DEFAULT 50,
        composure      INTEGER NOT NULL DEFAULT 50,
        discernment    INTEGER NOT NULL DEFAULT 50,
        diplomacy      INTEGER NOT NULL DEFAULT 50,
        presence       INTEGER NOT NULL DEFAULT 50,
        recorded_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `,
  },
  {
    name: "CREATE INDEX ch_user_recorded_idx",
    query: `CREATE INDEX IF NOT EXISTS ch_user_recorded_idx ON compass_history (user_id, recorded_at)`,
  },

  // ── users: new columns ─────────────────────────────────────────────────────
  {
    name: "users: archetype",
    query: `ALTER TABLE users ADD COLUMN IF NOT EXISTS archetype TEXT`,
  },
  {
    name: "users: secondary_archetype",
    query: `ALTER TABLE users ADD COLUMN IF NOT EXISTS secondary_archetype TEXT`,
  },
  {
    name: "users: social_circles",
    query: `ALTER TABLE users ADD COLUMN IF NOT EXISTS social_circles JSONB NOT NULL DEFAULT '[]'`,
  },
  {
    name: "users: cultural_interests",
    query: `ALTER TABLE users ADD COLUMN IF NOT EXISTS cultural_interests JSONB NOT NULL DEFAULT '[]'`,
  },
  {
    name: "users: selected_interests",
    query: `ALTER TABLE users ADD COLUMN IF NOT EXISTS selected_interests JSONB NOT NULL DEFAULT '[]'`,
  },
  {
    name: "users: register_bias",
    query: `ALTER TABLE users ADD COLUMN IF NOT EXISTS register_bias TEXT`,
  },
  {
    name: "users: secondary_register",
    query: `ALTER TABLE users ADD COLUMN IF NOT EXISTS secondary_register TEXT`,
  },
  {
    name: "users: register_bias_signals",
    query: `ALTER TABLE users ADD COLUMN IF NOT EXISTS register_bias_signals JSONB NOT NULL DEFAULT '[]'`,
  },
  {
    name: "users: register_bias_locked",
    query: `ALTER TABLE users ADD COLUMN IF NOT EXISTS register_bias_locked BOOLEAN NOT NULL DEFAULT FALSE`,
  },
  {
    name: "users: elite_privacy_mode",
    query: `ALTER TABLE users ADD COLUMN IF NOT EXISTS elite_privacy_mode BOOLEAN NOT NULL DEFAULT FALSE`,
  },
  {
    name: "users: needs_recalibration",
    query: `ALTER TABLE users ADD COLUMN IF NOT EXISTS needs_recalibration BOOLEAN NOT NULL DEFAULT FALSE`,
  },

  // ── learning_track_questions: new columns ──────────────────────────────────
  {
    name: "ltq: register_relevance",
    query: `ALTER TABLE learning_track_questions ADD COLUMN IF NOT EXISTS register_relevance JSONB NOT NULL DEFAULT '[]'`,
  },
  {
    name: "ltq: applicable_archetypes",
    query: `ALTER TABLE learning_track_questions ADD COLUMN IF NOT EXISTS applicable_archetypes JSONB NOT NULL DEFAULT '[]'`,
  },
  {
    name: "ltq: social_circle_tags",
    query: `ALTER TABLE learning_track_questions ADD COLUMN IF NOT EXISTS social_circle_tags JSONB NOT NULL DEFAULT '[]'`,
  },
  {
    name: "ltq: cultural_interest_tags",
    query: `ALTER TABLE learning_track_questions ADD COLUMN IF NOT EXISTS cultural_interest_tags JSONB NOT NULL DEFAULT '[]'`,
  },
  {
    name: "ltq: primary_dimension",
    query: `ALTER TABLE learning_track_questions ADD COLUMN IF NOT EXISTS primary_dimension TEXT`,
  },
  {
    name: "ltq: secondary_dimension",
    query: `ALTER TABLE learning_track_questions ADD COLUMN IF NOT EXISTS secondary_dimension TEXT`,
  },

  // ── learning_track_sessions: is_placement ─────────────────────────────────
  {
    name: "lts: is_placement",
    query: `ALTER TABLE learning_track_sessions ADD COLUMN IF NOT EXISTS is_placement BOOLEAN NOT NULL DEFAULT FALSE`,
  },

  // ── learning_track_attempts: is_placement_question ─────────────────────────
  {
    name: "lta: is_placement_question",
    query: `ALTER TABLE learning_track_attempts ADD COLUMN IF NOT EXISTS is_placement_question BOOLEAN NOT NULL DEFAULT FALSE`,
  },

  // ── learning_track_progress: learning_intent ──────────────────────────────
  {
    name: "ltp: learning_intent",
    query: `ALTER TABLE learning_track_progress ADD COLUMN IF NOT EXISTS learning_intent TEXT NOT NULL DEFAULT 'competent'`,
  },

  // ── badges: kind ──────────────────────────────────────────────────────────
  {
    name: "badges: kind",
    query: `ALTER TABLE badges ADD COLUMN IF NOT EXISTS kind TEXT`,
  },
];

async function run() {
  console.log(`Running Framework A schema migration (${steps.length} steps)\n`);

  for (const step of steps) {
    try {
      await db.execute(sql.raw(step.query));
      console.log(`  ✓ ${step.name}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // "already exists" errors are safe to ignore (extra idempotency guard)
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
