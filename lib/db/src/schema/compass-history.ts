import { pgTable, serial, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Daily snapshots of the user's Refinement Compass scores (0–100 per dimension).
 * Used to render the 30-day evolution overlay on the radar chart.
 * Written by the compass-history cron job and on session completion.
 */
export const compassHistoryTable = pgTable(
  "compass_history",
  {
    id:            serial("id").primaryKey(),
    user_id:       text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    attentiveness: integer("attentiveness").notNull().default(50),
    composure:     integer("composure").notNull().default(50),
    discernment:   integer("discernment").notNull().default(50),
    diplomacy:     integer("diplomacy").notNull().default(50),
    presence:      integer("presence").notNull().default(50),
    recorded_at:   timestamp("recorded_at").notNull().defaultNow(),
  },
  (table) => [
    index("ch_user_recorded_idx").on(table.user_id, table.recorded_at),
  ],
);

export const insertCompassHistorySchema = createInsertSchema(compassHistoryTable);
export type InsertCompassHistory = z.infer<typeof insertCompassHistorySchema>;
export type CompassHistory = typeof compassHistoryTable.$inferSelect;
