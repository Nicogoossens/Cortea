-- Migration: Learning Track Tables
-- Applied: 2026-04-27
-- Method: Applied via raw SQL (drizzle-kit push skipped — hangs on interactive prompt
--         for existing scenarios unique constraint). All statements use IF NOT EXISTS.

-- 1. learning_track_questions: stores adaptive questions per register/pillar/phase/level
CREATE TABLE IF NOT EXISTS learning_track_questions (
  id                 SERIAL PRIMARY KEY,
  register           TEXT NOT NULL,
  research_pillar    TEXT,
  phase              INTEGER NOT NULL,
  level              INTEGER NOT NULL,
  region_code        TEXT NOT NULL,
  demographic        TEXT NOT NULL,
  question_text      TEXT NOT NULL,
  historical_context TEXT,
  options            JSONB NOT NULL DEFAULT '[]',
  lang               TEXT NOT NULL DEFAULT 'nl',
  created_at         TIMESTAMP DEFAULT NOW(),
  question_hash      TEXT GENERATED ALWAYS AS (
    md5(
      region_code || '|' || register || '|' ||
      COALESCE(research_pillar, '') || '|' ||
      phase::text || '|' || level::text || '|' ||
      demographic || '|' || lang || '|' || question_text
    )
  ) STORED
);

-- Lookup index for session queries
CREATE INDEX IF NOT EXISTS ltq_lookup_idx
  ON learning_track_questions (region_code, register, phase, research_pillar, demographic, level);

-- Unique index for idempotent seed imports (onConflictDoNothing targets this)
CREATE UNIQUE INDEX IF NOT EXISTS ltq_hash_idx
  ON learning_track_questions (question_hash);

-- 2. learning_track_progress: tracks per-user adaptive progression
CREATE TABLE IF NOT EXISTS learning_track_progress (
  id              SERIAL PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  register        TEXT NOT NULL,
  research_pillar TEXT,
  phase           INTEGER NOT NULL,
  current_level   INTEGER NOT NULL DEFAULT 1,
  questions_done  INTEGER NOT NULL DEFAULT 0,
  correct_streak  INTEGER NOT NULL DEFAULT 0,
  mastered        BOOLEAN NOT NULL DEFAULT FALSE,
  last_updated    TIMESTAMP DEFAULT NOW()
);

-- Partial unique indexes for correct NULL semantics in Postgres:
-- Standard unique indexes treat NULL != NULL, so we use two partial indexes:
--   - one for middle_class (research_pillar IS NOT NULL)
--   - one for elite (research_pillar IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS ltp_user_with_pillar_idx
  ON learning_track_progress (user_id, register, research_pillar, phase)
  WHERE research_pillar IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ltp_user_no_pillar_idx
  ON learning_track_progress (user_id, register, phase)
  WHERE research_pillar IS NULL;
