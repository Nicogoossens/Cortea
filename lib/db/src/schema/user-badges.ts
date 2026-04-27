import { pgTable, serial, text, integer, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { badgesTable } from "./badges";

export const userBadgesTable = pgTable(
  "user_badges",
  {
    id:         serial("id").primaryKey(),
    user_id:    text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    badge_id:   integer("badge_id").notNull().references(() => badgesTable.id),
    awarded_at: timestamp("awarded_at").defaultNow(),
    visible:    boolean("visible").notNull().default(true),
  },
  (table) => [
    uniqueIndex("ub_user_badge_idx").on(table.user_id, table.badge_id),
  ],
);

export type UserBadge = typeof userBadgesTable.$inferSelect;
