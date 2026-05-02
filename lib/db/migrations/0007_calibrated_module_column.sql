-- Migration: Add calibrated_module column to translations
-- Applied: 2026-05-02
-- Tracks which module register (standard | elite) was last applied to each row
-- by the register-calibration-worker. Enables precise per-register idempotency
-- so rows stamped with a different register are always re-processed.

ALTER TABLE translations
  ADD COLUMN IF NOT EXISTS calibrated_module TEXT
    CHECK (calibrated_module IN ('standard', 'elite'));
