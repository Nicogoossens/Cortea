import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const nobleScoreLogTable = pgTable("noble_score_log", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").notNull(),
  scenario_id: integer("scenario_id"),
  score_delta: integer("score_delta").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  trigger: text("trigger").notNull(),
});

export const insertNobleScoreLogSchema = createInsertSchema(nobleScoreLogTable).omit({ id: true });
export type InsertNobleScoreLog = z.infer<typeof insertNobleScoreLogSchema>;
export type NobleScoreLog = typeof nobleScoreLogTable.$inferSelect;
