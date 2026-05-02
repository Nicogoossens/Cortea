-- Migration 0011: Remediation lifecycle on learning_track_sessions
--
-- Adds two columns so a failed session is "consumed" by exactly one follow-up
-- remediation session, instead of being picked up forever by lastFailedSession.
--   • remediated_at         — stamped on the FAILED parent when its child
--                              remediation session is created
--   • remediates_session_id — set on the CHILD remediation row, pointing to
--                              the failed parent it remediates

ALTER TABLE learning_track_sessions
  ADD COLUMN IF NOT EXISTS remediated_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS remediates_session_id INTEGER NULL;

-- Backfill: every already-completed remediation row was created from an
-- earlier failure. Mark each pre-existing failed session as "remediated"
-- if a later remediation session for the same track exists, so we don't
-- re-trigger remediation on next /session call after deploy.
UPDATE learning_track_sessions f
SET remediated_at = COALESCE(f.remediated_at, NOW())
WHERE f.passed = false
  AND f.is_remediation = false
  AND f.remediated_at IS NULL
  AND EXISTS (
    SELECT 1 FROM learning_track_sessions r
    WHERE r.user_id = f.user_id
      AND r.register = f.register
      AND r.region_code = f.region_code
      AND COALESCE(r.research_pillar, '') = COALESCE(f.research_pillar, '')
      AND r.phase = f.phase
      AND r.is_remediation = true
      AND r.started_at >= f.completed_at
  );
