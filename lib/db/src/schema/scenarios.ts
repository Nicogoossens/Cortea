import { pgTable, serial, text, integer, json, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export interface ScenarioOption {
  text: string;
  correct: boolean;
  explanation: string;
}

export interface ScenarioContent {
  situation: string;
  question: string;
  options: ScenarioOption[];
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
  behavioral_tags: json("behavioral_tags").$type<string[]>(),
  bolton_cluster: integer("bolton_cluster"),
  correction_style: text("correction_style"),
}, (t) => [
  unique("scenarios_region_pillar_title_key").on(t.region_code, t.pillar, t.title),
]);

export const insertScenarioSchema = createInsertSchema(scenariosTable).omit({ id: true });
export type InsertScenario = z.infer<typeof insertScenarioSchema>;
export type Scenario = typeof scenariosTable.$inferSelect;
