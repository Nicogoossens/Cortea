-- 0018_session_master_badge.sql
-- Adds the "Session Master" badge awarded for completing a full Atelier
-- session (sequential session mode). Universal register, not scoped to any
-- region/pillar/phase. Idempotent via ON CONFLICT (slug) DO NOTHING.

INSERT INTO badges (slug, title, description, badge_type, register, research_pillar, phase, region_code, icon_url) VALUES
  ('session-master', 'Session Master', 'Completed a full Atelier session in one sitting.', 'session', 'universal', NULL, NULL, NULL, NULL)
ON CONFLICT (slug) DO NOTHING;
