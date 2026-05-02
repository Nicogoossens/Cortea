import { pgTable, serial, text, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const userCountryInterestsTable = pgTable(
  "user_country_interests",
  {
    id:          serial("id").primaryKey(),
    user_id:     text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    region_code: text("region_code").notNull(),
    added_at:    timestamp("added_at").notNull().defaultNow(),
    hidden_at:   timestamp("hidden_at"),
  },
  (table) => [
    uniqueIndex("uci_user_region_idx").on(table.user_id, table.region_code),
    index("uci_user_active_idx").on(table.user_id, table.hidden_at),
  ],
);

export type UserCountryInterest = typeof userCountryInterestsTable.$inferSelect;
