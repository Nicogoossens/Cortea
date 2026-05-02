-- Migration 0009: Add reviewed_by and reviewed_at audit columns to culture_protocols
-- These track which admin approved or removed each CC-extracted record and when.

ALTER TABLE culture_protocols
  ADD COLUMN IF NOT EXISTS reviewed_by TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
