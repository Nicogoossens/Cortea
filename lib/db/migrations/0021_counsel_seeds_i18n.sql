-- Migration 0021: Add content_i18n column to counsel_region_seeds
-- Stores translated versions of the seed content (summary, principles,
-- do_examples, avoid_examples, register_notes) keyed by BCP-47 language code.
-- Translations are produced manually via scripts/translate-counsel-seeds.mjs
-- and triggered exclusively from the Admin panel (no automatic sweeper).

ALTER TABLE counsel_region_seeds
  ADD COLUMN IF NOT EXISTS content_i18n jsonb;

COMMENT ON COLUMN counsel_region_seeds.content_i18n IS
  'Translated seed content keyed by language code (nl, fr, de, es, pt, it, ar, ja, zh). Same shape as content column. Populated by scripts/translate-counsel-seeds.mjs on admin demand.';
