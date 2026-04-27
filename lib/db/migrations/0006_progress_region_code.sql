-- Migration: Add region_code to learning_track_progress
-- Applied: 2026-04-27
-- Method: Applied via raw SQL

-- 1. Add region_code column (default 'GB' for existing rows)
ALTER TABLE learning_track_progress
  ADD COLUMN IF NOT EXISTS region_code TEXT NOT NULL DEFAULT 'GB';

-- 2. Drop old partial unique indexes (do not include region_code)
DROP INDEX IF EXISTS ltp_user_with_pillar_idx;
DROP INDEX IF EXISTS ltp_user_no_pillar_idx;

-- 3. Re-create indexes with region_code included
CREATE UNIQUE INDEX IF NOT EXISTS ltp_user_with_pillar_idx
  ON learning_track_progress (user_id, register, region_code, research_pillar, phase)
  WHERE research_pillar IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ltp_user_no_pillar_idx
  ON learning_track_progress (user_id, register, region_code, phase)
  WHERE research_pillar IS NULL;
