import { pgTable, serial, text, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const LEERCONTEXT_TYPES = ["informeel", "zakelijk", "professioneel", "romantisch", "sociaal"] as const;
export type LeercontextType = typeof LEERCONTEXT_TYPES[number];

export const TARGET_DEMOGRAPHICS = [
  "men_19_30", "men_30_50", "men_50plus",
  "women_19_30", "women_30_50", "women_50plus",
  "common",
] as const;
export type TargetDemographic = typeof TARGET_DEMOGRAPHICS[number];

export const userCountryContextsTable = pgTable(
  "user_country_contexts",
  {
    id:                 serial("id").primaryKey(),
    user_id:            text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    region_code:        text("region_code").notNull(),
    context_type:       text("context_type").notNull(),
    target_demographic: text("target_demographic"),
    created_at:         timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("ucc_user_region_type_demo_idx").on(
      table.user_id,
      table.region_code,
      table.context_type,
      table.target_demographic,
    ),
    index("ucc_user_region_idx").on(table.user_id, table.region_code),
  ],
);

export type UserCountryContext = typeof userCountryContextsTable.$inferSelect;

/**
 * Extended interest row returned by GET /api/users/country-interests.
 * Contexts are joined server-side so the frontend never needs N+1 fetches.
 */
export type UserCountryInterestWithContexts = {
  id: number;
  user_id: string;
  region_code: string;
  added_at: Date;
  hidden_at: Date | null;
  contexts: UserCountryContext[];
};
