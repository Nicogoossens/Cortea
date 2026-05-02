import { pgTable, serial, text, integer, timestamp, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const questsTable = pgTable("quests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  title_nl: text("title_nl"),
  title_fr: text("title_fr"),
  title_de: text("title_de"),
  description: text("description").notNull(),
  description_nl: text("description_nl"),
  description_fr: text("description_fr"),
  description_de: text("description_de"),
  pillar: integer("pillar"),
  noble_score_reward: integer("noble_score_reward").notNull().default(3),
  day_of_week: integer("day_of_week"),
  is_active: boolean("is_active").notNull().default(true),
});

export const questCompletionsTable = pgTable("quest_completions", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").notNull(),
  quest_id: integer("quest_id").notNull(),
  completed_on: date("completed_on").notNull(),
  completed_at: timestamp("completed_at").notNull().defaultNow(),
});

export const insertQuestSchema = createInsertSchema(questsTable).omit({ id: true });
export type InsertQuest = z.infer<typeof insertQuestSchema>;
export type Quest = typeof questsTable.$inferSelect;

export const insertQuestCompletionSchema = createInsertSchema(questCompletionsTable).omit({ id: true, completed_at: true });
export type InsertQuestCompletion = z.infer<typeof insertQuestCompletionSchema>;
export type QuestCompletion = typeof questCompletionsTable.$inferSelect;
