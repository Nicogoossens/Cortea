import { pgTable, serial, text, integer, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export interface RoleplayAnswer {
  question_index: number;
  selected_option_index: number;
  correct: boolean;
}

export const roleplayCompletionsTable = pgTable("roleplay_completions", {
  id: serial("id").primaryKey(),
  scenario_id: integer("scenario_id").notNull(),
  user_id: text("user_id").notNull(),
  role: text("role").notNull(),
  answers: json("answers").$type<RoleplayAnswer[]>().notNull().default([]),
  score: integer("score").notNull().default(0),
  completed_at: timestamp("completed_at").notNull().defaultNow(),
});

export const insertRoleplayCompletionSchema = createInsertSchema(roleplayCompletionsTable).omit({ id: true, completed_at: true });
export type InsertRoleplayCompletion = z.infer<typeof insertRoleplayCompletionSchema>;
export type RoleplayCompletion = typeof roleplayCompletionsTable.$inferSelect;
