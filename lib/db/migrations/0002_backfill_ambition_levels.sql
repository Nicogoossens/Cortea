-- Migration: Backfill legacy ambition_level values
-- Applied: 2026-04-26
-- Reason: The ambition pill selector was reduced from 6 options to 3.
--         Users who previously chose curious/aspirational/distinguished have no
--         matching pill and see a blank selector. This migration maps them to the
--         nearest current equivalent so every user has a valid, visible selection.
--
-- Mapping:
--   curious      → casual
--   aspirational → professional
--   distinguished→ diplomatic

UPDATE users
  SET ambition_level = 'casual'
  WHERE ambition_level = 'curious';

UPDATE users
  SET ambition_level = 'professional'
  WHERE ambition_level = 'aspirational';

UPDATE users
  SET ambition_level = 'diplomatic'
  WHERE ambition_level = 'distinguished';
