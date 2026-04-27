import { pgTable, serial, text, integer, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { usersTable } from "./users";

export const learningTrackProgressTable = pgTable(
  "learning_track_progress",
  {
    id:              serial("id").primaryKey(),
    user_id:         text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    register:        text("register").notNull(),
    research_pillar: text("research_pillar"),
    phase:           integer("phase").notNull(),
    current_level:   integer("current_level").notNull().default(1),
    questions_done:  integer("questions_done").notNull().default(0),
    correct_streak:  integer("correct_streak").notNull().default(0),
    mastered:        boolean("mastered").notNull().default(false),
    last_updated:    timestamp("last_updated").defaultNow(),
  },
  (table) => [
    /**
     * Two partial unique indexes to handle Postgres NULL semantics correctly:
     * - NULLs are not considered equal in standard unique indexes.
     * - "with pillar" covers middle_class rows (research_pillar IS NOT NULL).
     * - "no pillar" covers elite rows (research_pillar IS NULL).
     */
    uniqueIndex("ltp_user_with_pillar_idx")
      .on(table.user_id, table.register, table.research_pillar, table.phase)
      .where(sql`${table.research_pillar} IS NOT NULL`),
    uniqueIndex("ltp_user_no_pillar_idx")
      .on(table.user_id, table.register, table.phase)
      .where(sql`${table.research_pillar} IS NULL`),
  ],
);

export type LearningTrackProgress = typeof learningTrackProgressTable.$inferSelect;
