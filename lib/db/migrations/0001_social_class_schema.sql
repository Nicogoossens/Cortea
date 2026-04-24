-- Migration: Social Class Schema — Elite & Middenklasse Framework
-- Applied: 2026-04-24
-- Method: Applied via raw SQL (project uses drizzle-kit push; this file documents changes)
-- All columns are nullable or have safe defaults — existing rows unaffected.

-- 1. scenarios: social class register
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS social_class text NOT NULL DEFAULT 'universal';
ALTER TABLE scenarios DROP CONSTRAINT IF EXISTS scenarios_social_class_check;
ALTER TABLE scenarios ADD CONSTRAINT scenarios_social_class_check
  CHECK (social_class IN ('universal','elite','middle_class'));

-- 2. scenarios: middle class demographic bracket
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS demographic_bracket text;
ALTER TABLE scenarios DROP CONSTRAINT IF EXISTS scenarios_demographic_bracket_check;
ALTER TABLE scenarios ADD CONSTRAINT scenarios_demographic_bracket_check
  CHECK (demographic_bracket IS NULL OR demographic_bracket IN (
    'common','men_19_30','women_19_30','men_30_50','women_30_50','men_50plus','women_50plus'
  ));

-- 3. scenarios: interaction pair (no check constraint — values defined by content pipeline)
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS interaction_pair text;

-- 4. scenarios: phase 4/5 module code
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS phase_module text;
ALTER TABLE scenarios DROP CONSTRAINT IF EXISTS scenarios_phase_module_check;
ALTER TABLE scenarios ADD CONSTRAINT scenarios_phase_module_check
  CHECK (phase_module IS NULL OR phase_module IN ('MOD_A','MOD_B','MOD_C','MOD_D','MOD_E','MOD_F','MOD_G'));

-- 5. scenarios: middle class research pillar tag
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS research_pillar text;
ALTER TABLE scenarios DROP CONSTRAINT IF EXISTS scenarios_research_pillar_check;
ALTER TABLE scenarios ADD CONSTRAINT scenarios_research_pillar_check
  CHECK (research_pillar IS NULL OR research_pillar IN ('P1','P2','P3','P4'));

-- 6. culture_protocols: social class register
ALTER TABLE culture_protocols ADD COLUMN IF NOT EXISTS social_class text NOT NULL DEFAULT 'universal';
ALTER TABLE culture_protocols DROP CONSTRAINT IF EXISTS culture_protocols_social_class_check;
ALTER TABLE culture_protocols ADD CONSTRAINT culture_protocols_social_class_check
  CHECK (social_class IN ('universal','elite','middle_class'));

-- 7. content_coverage: new table tracking build status per country × register
CREATE TABLE IF NOT EXISTS content_coverage (
  region_code  text NOT NULL,
  social_class text NOT NULL,
  status       text NOT NULL DEFAULT 'draft',
  notes        text,
  CONSTRAINT content_coverage_pkey PRIMARY KEY (region_code, social_class),
  CONSTRAINT content_coverage_social_class_check CHECK (social_class IN ('universal','elite','middle_class')),
  CONSTRAINT content_coverage_status_check CHECK (status IN ('draft','active','complete'))
);
