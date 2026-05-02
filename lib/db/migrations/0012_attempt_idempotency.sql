-- Migration 0012: Idempotency guard on learning_track_attempts
--
-- Prevents the same (session_id, question_id) from being recorded twice,
-- which would otherwise let clients re-submit answers to inflate
-- answers_given/correct_answers and game the pass engine.

-- Drop any pre-existing duplicates first (keep the earliest attempt).
DELETE FROM learning_track_attempts a
USING learning_track_attempts b
WHERE a.session_id IS NOT NULL
  AND a.session_id = b.session_id
  AND a.question_id = b.question_id
  AND a.id > b.id;

CREATE UNIQUE INDEX IF NOT EXISTS lta_session_question_unique_idx
  ON learning_track_attempts (session_id, question_id)
  WHERE session_id IS NOT NULL;
