-- Migration 0016: companion_messages
-- Adds a private notes/messaging table between linked companions.
-- Each row is one note from sender_id to recipient_id, scoped to a companion link.

CREATE TABLE IF NOT EXISTS companion_messages (
  id serial PRIMARY KEY,
  link_id integer NOT NULL,
  sender_id text NOT NULL,
  recipient_id text NOT NULL,
  body text NOT NULL,
  read_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS companion_messages_recipient_idx
  ON companion_messages (recipient_id);

CREATE INDEX IF NOT EXISTS companion_messages_link_idx
  ON companion_messages (link_id);
