-- Migration 0017: Add calling_card_tagline to users
-- Allows Ambassadors to set a short personal tagline (max 100 chars)
-- shown on their Digital Calling Card on the Inner Circle page.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS calling_card_tagline text;

COMMENT ON COLUMN users.calling_card_tagline IS
  'Optional Ambassador-set personal tagline (max 100 chars) shown on the Digital Calling Card.';
