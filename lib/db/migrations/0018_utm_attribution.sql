-- Migration 0018: Add UTM attribution columns to users
-- Captures UTM parameters from registration to track marketing attribution.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS utm_source   text,
  ADD COLUMN IF NOT EXISTS utm_medium   text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content  text,
  ADD COLUMN IF NOT EXISTS utm_term     text;

COMMENT ON COLUMN users.utm_source   IS 'UTM source captured at registration (e.g. google, newsletter)';
COMMENT ON COLUMN users.utm_medium   IS 'UTM medium captured at registration (e.g. cpc, email)';
COMMENT ON COLUMN users.utm_campaign IS 'UTM campaign captured at registration (e.g. spring_sale)';
COMMENT ON COLUMN users.utm_content  IS 'UTM content captured at registration (e.g. banner_a)';
COMMENT ON COLUMN users.utm_term     IS 'UTM term captured at registration (e.g. cultural+etiquette)';
