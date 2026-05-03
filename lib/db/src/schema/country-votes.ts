import { pgTable, serial, text, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";

export const countryVotesTable = pgTable(
  "country_votes",
  {
    id: serial("id").primaryKey(),
    user_id: text("user_id").notNull(),
    region_code: text("region_code").notNull(),
    period_ym: text("period_ym").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniq_user_region_period: uniqueIndex("country_votes_user_region_period_uq").on(
      table.user_id,
      table.region_code,
      table.period_ym
    ),
    idx_period: index("country_votes_period_idx").on(table.period_ym),
    idx_user_period: index("country_votes_user_period_idx").on(table.user_id, table.period_ym),
  })
);

export type CountryVote = typeof countryVotesTable.$inferSelect;
export type InsertCountryVote = typeof countryVotesTable.$inferInsert;
