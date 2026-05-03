-- Migration 0014: Add correction_style_i18n jsonb column to scenarios
-- Stores per-language translations of the bespoke correction_style tip
-- (the canonical English text remains in correction_style).
-- Mirrors the title_i18n / content_i18n pattern used elsewhere on this table.

ALTER TABLE scenarios
  ADD COLUMN IF NOT EXISTS correction_style_i18n jsonb;

COMMENT ON COLUMN scenarios.correction_style_i18n IS
  'Per-language translations of correction_style. Shape: { "<lang>": "<translated tip>" }. English fallback is the correction_style column.';
