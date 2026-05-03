-- Migration 0013: Add CHECK constraint on users.ambition_level
-- Ensures only the three current valid values can ever be stored.
-- All rows were backfilled to valid values in migration 0002.

ALTER TABLE users
  ADD CONSTRAINT users_ambition_level_check
  CHECK (ambition_level IN ('casual', 'professional', 'diplomatic'));

COMMENT ON COLUMN users.ambition_level IS
  'User ambition setting. Constrained to: casual, professional, diplomatic.';
