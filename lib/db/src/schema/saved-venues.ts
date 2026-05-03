import { pgTable, serial, text, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const savedVenuesTable = pgTable(
  "saved_venues",
  {
    id:       serial("id").primaryKey(),
    user_id:  text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    venue_id: text("venue_id").notNull(),
    saved_at: timestamp("saved_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("saved_venues_user_venue_idx").on(table.user_id, table.venue_id),
    index("saved_venues_user_idx").on(table.user_id),
  ],
);

export type SavedVenue = typeof savedVenuesTable.$inferSelect;
