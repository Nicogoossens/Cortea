-- Migration 0010: Audit table for removed CC protocol records
-- Captures a snapshot of every CC record that an admin deletes, preserving the
-- audit trail even after the source row is hard-deleted from culture_protocols.

CREATE TABLE IF NOT EXISTS cc_protocol_removals (
  id              SERIAL PRIMARY KEY,
  protocol_id     INTEGER NOT NULL,
  removed_by      TEXT NOT NULL,
  removed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Snapshot fields preserved from the deleted row
  region_code     TEXT,
  pillar_code     TEXT,
  subcategory     TEXT,
  rule_cc         TEXT,
  rule_raw        TEXT,
  urgency         INTEGER,
  source_book     TEXT,
  source_page     TEXT
);

CREATE INDEX IF NOT EXISTS cc_removals_removed_by_idx ON cc_protocol_removals (removed_by);
CREATE INDEX IF NOT EXISTS cc_removals_removed_at_idx ON cc_protocol_removals (removed_at DESC);
