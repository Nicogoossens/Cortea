import { pgTable, serial, text, integer, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export interface LearningTrackOption {
  text: string;
  answer_tier: 1 | 2 | 3;
  motivation: string;
}

export const learningTrackQuestionsTable = pgTable(
  "learning_track_questions",
  {
    id:                 serial("id").primaryKey(),
    register:           text("register").notNull(),
    research_pillar:    text("research_pillar"),
    phase:              integer("phase").notNull(),
    level:              integer("level").notNull(),
    region_code:        text("region_code").notNull(),
    demographic:        text("demographic").notNull(),
    question_text:      text("question_text").notNull(),
    historical_context: text("historical_context"),
    options:            jsonb("options").$type<LearningTrackOption[]>().notNull().default([]),
    lang:               text("lang").notNull().default("nl"),
    created_at:         timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("ltq_lookup_idx").on(
      table.region_code,
      table.register,
      table.phase,
      table.research_pillar,
      table.demographic,
      table.level,
    ),
  ],
);

export const insertLearningTrackQuestionSchema = createInsertSchema(learningTrackQuestionsTable);
export type InsertLearningTrackQuestion = z.infer<typeof insertLearningTrackQuestionSchema>;
export type LearningTrackQuestion = typeof learningTrackQuestionsTable.$inferSelect;
