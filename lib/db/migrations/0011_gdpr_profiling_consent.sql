-- Migration 0011: GDPR Art. 21 — right to object to behavioural profiling
-- Adds profiling_consent boolean to users table.
-- When false, Bolton / EQ / Mehrabian profile writes are suppressed for that user.
-- Default true preserves existing behaviour for all current users.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS profiling_consent boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN users.profiling_consent IS
  'GDPR Art. 21 opt-out flag. When false, behavioural profile (Bolton/EQ/Mehrabian) writes are skipped.';
