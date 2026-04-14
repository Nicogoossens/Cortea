import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const zuil_voortgangTable = pgTable("zuil_voortgang", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").notNull(),
  pillar: integer("pillar").notNull(),
  score: integer("score").notNull().default(0),
  current_title: text("current_title").notNull().default("The Aware"),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const insertZuilVoortgangSchema = createInsertSchema(zuil_voortgangTable).omit({ id: true });
export type InsertZuilVoortgang = z.infer<typeof insertZuilVoortgangSchema>;
export type ZuilVoortgang = typeof zuil_voortgangTable.$inferSelect;
