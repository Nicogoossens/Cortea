-- Migration 0022: Add explicit_language_choice flag to users
-- Distinguishes a deliberate user language selection (via the language switcher)
-- from the registration default. When true, the stored language is applied on
-- every new device sign-in instead of falling back to the browser locale.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS explicit_language_choice boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN users.explicit_language_choice IS
  'True when the user has deliberately selected a language via the in-app switcher. When true, language_code is applied on new-device sign-in regardless of browser locale. False = registration default, browser locale wins on new devices.';
