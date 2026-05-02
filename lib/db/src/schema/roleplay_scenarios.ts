import { pgTable, serial, text, integer, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export interface RoleplayQuestion {
  question: string;
  options: { text: string; correct: boolean; explanation: string }[];
}

export interface RoleplayRole {
  name: string;
  description: string;
  questions: RoleplayQuestion[];
}

export const roleplayScenarioTable = pgTable("roleplay_scenarios", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  context: text("context").notNull(),
  situation: text("situation").notNull(),
  pillar: integer("pillar").notNull().default(1),
  difficulty_level: integer("difficulty_level").notNull().default(1),
  estimated_minutes: integer("estimated_minutes").notNull().default(15),
  role_a: json("role_a").$type<RoleplayRole>().notNull(),
  role_b: json("role_b").$type<RoleplayRole>().notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertRoleplayScenarioSchema = createInsertSchema(roleplayScenarioTable).omit({ id: true, created_at: true });
export type InsertRoleplayScenario = z.infer<typeof insertRoleplayScenarioSchema>;
export type RoleplayScenario = typeof roleplayScenarioTable.$inferSelect;
