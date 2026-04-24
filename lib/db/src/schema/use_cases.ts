import { pgTable, serial, text, integer, json, jsonb, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export interface PillarWeights {
  1?: number;
  2?: number;
  3?: number;
  4?: number;
  5?: number;
}

export interface ComponentScores {
  atelier: number | null;
  counsel: number | null;
  mirror: number | null;
  compass: number | null;
}

export const useCasesTable = pgTable("use_cases", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  region_code: text("region_code").notNull(),
  flag_emoji: text("flag_emoji").notNull().default("🌍"),
  formality_level: text("formality_level").notNull().default("formal"),
  domain_tags: json("domain_tags").$type<string[]>().notNull().default([]),
  pillar_weights: json("pillar_weights").$type<PillarWeights>().notNull().default({}),
  description: text("description").notNull().default(""),
  cover_context: text("cover_context").notNull().default(""),
  primary_tool: text("primary_tool").notNull().default("atelier"),
});

export const userUseCaseRatingsTable = pgTable("user_use_case_ratings", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").notNull(),
  use_case_id: integer("use_case_id").notNull(),
  readiness_score: real("readiness_score").notNull().default(0),
  component_scores: jsonb("component_scores").$type<ComponentScores>().notNull().default({ atelier: null, counsel: null, mirror: null, compass: null }),
  computed_at: timestamp("computed_at").notNull().defaultNow(),
});

export const counselQualityLogTable = pgTable("counsel_quality_log", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").notNull(),
  domain: text("domain").notNull().default("general"),
  score: real("score").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const mirrorScanLogTable = pgTable("mirror_scan_log", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").notNull(),
  detected_category: text("detected_category").notNull(),
  confidence: real("confidence").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

/** Append-only historical log — never updated or deleted; one row per score computation. */
export const useCaseRatingLogTable = pgTable("use_case_rating_log", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").notNull(),
  use_case_id: integer("use_case_id").notNull(),
  readiness_score: real("readiness_score").notNull(),
  component_scores: jsonb("component_scores").$type<ComponentScores>().notNull(),
  computed_at: timestamp("computed_at").notNull().defaultNow(),
});

export const insertUseCaseSchema = createInsertSchema(useCasesTable).omit({ id: true });
export type InsertUseCase = z.infer<typeof insertUseCaseSchema>;
export type UseCase = typeof useCasesTable.$inferSelect;

export const insertUserUseCaseRatingSchema = createInsertSchema(userUseCaseRatingsTable).omit({ id: true });
export type InsertUserUseCaseRating = z.infer<typeof insertUserUseCaseRatingSchema>;
export type UserUseCaseRating = typeof userUseCaseRatingsTable.$inferSelect;

export const insertCounselQualityLogSchema = createInsertSchema(counselQualityLogTable).omit({ id: true });
export type InsertCounselQualityLog = z.infer<typeof insertCounselQualityLogSchema>;
export type CounselQualityLog = typeof counselQualityLogTable.$inferSelect;

export const insertMirrorScanLogSchema = createInsertSchema(mirrorScanLogTable).omit({ id: true });
export type InsertMirrorScanLog = z.infer<typeof insertMirrorScanLogSchema>;
export type MirrorScanLog = typeof mirrorScanLogTable.$inferSelect;

export const insertUseCaseRatingLogSchema = createInsertSchema(useCaseRatingLogTable).omit({ id: true });
export type InsertUseCaseRatingLog = z.infer<typeof insertUseCaseRatingLogSchema>;
export type UseCaseRatingLog = typeof useCaseRatingLogTable.$inferSelect;
