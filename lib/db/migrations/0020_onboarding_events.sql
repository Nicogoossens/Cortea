-- Migration 0020: Onboarding events ledger
-- Append-only telemetry for the onboarding conversion funnel. Currently used
-- by step 5 (plan choice) to record selected_tier vs skipped, the recommended
-- tier, and the user's objectives, so we can surface conversion stats in the
-- admin dashboard instead of having to grep deployment logs.

CREATE TABLE IF NOT EXISTS onboarding_events (
  id serial PRIMARY KEY,
  user_id text,
  event_type text NOT NULL,
  action text NOT NULL,
  tier text,
  recommended_tier text,
  objectives jsonb,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS onboarding_events_event_type_idx ON onboarding_events(event_type);
CREATE INDEX IF NOT EXISTS onboarding_events_created_at_idx ON onboarding_events(created_at);

COMMENT ON TABLE onboarding_events IS 'Append-only telemetry for the onboarding conversion funnel (task-241).';
COMMENT ON COLUMN onboarding_events.event_type IS 'Onboarding event family, e.g. plan_choice.';
COMMENT ON COLUMN onboarding_events.action IS 'Action taken, e.g. selected_tier, skipped, skipped_unauth.';
COMMENT ON COLUMN onboarding_events.tier IS 'Tier the user picked (null when skipped).';
COMMENT ON COLUMN onboarding_events.recommended_tier IS 'Tier recommended by the onboarding heuristics at the time of the event.';
COMMENT ON COLUMN onboarding_events.objectives IS 'Snapshot of the user objectives at the time of the event.';
