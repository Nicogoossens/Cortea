-- Migration: Badge & Erkenningssysteem
-- Applied: 2026-04-27
-- Method: Applied via raw SQL (drizzle-kit push skipped — hangs on existing scenarios constraint)
-- All statements use IF NOT EXISTS / ON CONFLICT DO NOTHING.

-- 1. badges: master catalogue of all possible badges
CREATE TABLE IF NOT EXISTS badges (
  id              SERIAL PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  badge_type      TEXT NOT NULL,   -- "pillar" | "phase" | "country" | "ambassador"
  register        TEXT NOT NULL,   -- "middle_class" | "elite"
  research_pillar TEXT,            -- "P1" | "P2" | "P3" (NULL for phase/country/ambassador)
  phase           INTEGER,         -- NULL for country/ambassador badges
  region_code     TEXT,            -- NULL for universal ambassador badge
  icon_url        TEXT,            -- App Storage URL (nullable — uses generated SVG if absent)
  created_at      TIMESTAMP DEFAULT NOW()
);

-- 2. user_badges: awarded badges per user (idempotent via UNIQUE constraint)
CREATE TABLE IF NOT EXISTS user_badges (
  id          SERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id    INTEGER NOT NULL REFERENCES badges(id),
  awarded_at  TIMESTAMP DEFAULT NOW(),
  visible     BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT ub_user_badge_unique UNIQUE (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS ub_user_idx ON user_badges (user_id);

-- Seed: 568 badges covering all 21 ACTIVE_REGIONS × 5 phases × middle_class pillars
-- + elite phase badges + country badges + ambassador badge
-- Applied via code_execution seed loop (see 0005_badge_seed.sql note)
-- Idempotent: ON CONFLICT (slug) DO NOTHING
