import { pgTable, serial, text, integer, json, jsonb, unique, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export interface ScenarioOption {
  text: string;
  /**
   * answer_tier is the canonical correctness signal for new content.
   * 1 = Good / Correct, 2 = Slightly Different / Acceptable, 3 = Would not do that / Incorrect.
   * Replaces the legacy `correct` boolean. Old rows may only have `correct`.
   */
  answer_tier?: 1 | 2 | 3;
  /**
   * Backwards-compatible alias kept so existing consumers continue to work.
   * For new content use answer_tier. For reading, treat correct = (answer_tier === 1).
   */
  correct?: boolean;
  explanation: string;
  behavior_signal?: string;
}

export interface ScenarioContent {
  situation: string;
  question: string;
  options: ScenarioOption[];
  historical_context?: string;
}

export const scenariosTable = pgTable("scenarios", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  title_i18n: json("title_i18n").$type<Record<string, string>>(),
  pillar: integer("pillar").notNull(),
  region_code: text("region_code").notNull(),
  age_group: text("age_group").notNull().default("18-30"),
  gender_applicability: text("gender_applicability").notNull().default("all"),
  context: text("context").notNull().default("social"),
  difficulty_level: integer("difficulty_level").notNull().default(1),
  estimated_minutes: integer("estimated_minutes").notNull().default(5),
  noble_score_impact: integer("noble_score_impact").notNull().default(5),
  content_json: json("content_json").$type<ScenarioContent>().notNull(),
  content_i18n: json("content_i18n").$type<Record<string, ScenarioContent>>(),
  // Behavioral psychology layer (Bolton clusters)
  behavioral_tags: jsonb("behavioral_tags").$type<string[]>(),
  bolton_cluster: integer("bolton_cluster"),
  correction_style: text("correction_style"),
  // Social class register
  social_class: text("social_class").notNull().default("universal"),
  // Middle class structural columns
  demographic_bracket: text("demographic_bracket"),
  interaction_pair: text("interaction_pair"),
  phase_module: text("phase_module"),
  research_pillar: text("research_pillar"),
}, (t) => [
  unique("scenarios_region_pillar_title_key").on(t.region_code, t.pillar, t.title),
  check("scenarios_social_class_check", sql`${t.social_class} IN ('universal','elite','middle_class')`),
  check("scenarios_demographic_bracket_check", sql`${t.demographic_bracket} IS NULL OR ${t.demographic_bracket} IN ('common','men_19_30','women_19_30','men_30_50','women_30_50','men_50plus','women_50plus')`),
  check("scenarios_phase_module_check", sql`${t.phase_module} IS NULL OR ${t.phase_module} IN ('MOD_A','MOD_B','MOD_C','MOD_D','MOD_E','MOD_F','MOD_G')`),
  check("scenarios_research_pillar_check", sql`${t.research_pillar} IS NULL OR ${t.research_pillar} IN ('P1','P2','P3','P4')`),
]);

export const insertScenarioSchema = createInsertSchema(scenariosTable).omit({ id: true });
export type InsertScenario = z.infer<typeof insertScenarioSchema>;
export type Scenario = typeof scenariosTable.$inferSelect;
