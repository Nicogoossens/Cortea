import { pgTable, serial, text, integer, boolean, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { usersTable } from "./users";
import { learningTrackQuestionsTable } from "./learning-track-questions";

/**
 * Records every answer the user gives in any learning-track session.
 * The percentage-over-window pass engine reads from this table:
 * "last N attempts at the current level for this (register, region, pillar, phase)".
 *
 * Attempts persist forever — they are the canonical source of truth for both
 * progression decisions and the "this question has already been repeated N times" rule.
 */
export const learningTrackAttemptsTable = pgTable(
  "learning_track_attempts",
  {
    id:               serial("id").primaryKey(),
    user_id:          text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    question_id:      integer("question_id").notNull().references(() => learningTrackQuestionsTable.id, { onDelete: "cascade" }),
    register:         text("register").notNull(),
    region_code:      text("region_code").notNull(),
    research_pillar:  text("research_pillar"),
    phase:            integer("phase").notNull(),
    level:            integer("level").notNull(),
    answer_tier:      integer("answer_tier").notNull(),         // 1 best | 2 acceptable | 3 wrong
    is_correct:       boolean("is_correct").notNull(),
    is_repetition:    boolean("is_repetition").notNull().default(false),
    session_id:       integer("session_id"),                    // soft FK to learning_track_sessions
    attempted_at:     timestamp("attempted_at").notNull().defaultNow(),
  },
  (table) => [
    index("lta_progress_window_idx").on(
      table.user_id,
      table.register,
      table.region_code,
      table.research_pillar,
      table.phase,
      table.level,
      table.attempted_at,
    ),
    index("lta_user_question_idx").on(table.user_id, table.question_id),
    // Idempotency guard: at most one attempt per (session, question). Stops
    // clients from resubmitting the same question to inflate counters.
    uniqueIndex("lta_session_question_unique_idx")
      .on(table.session_id, table.question_id)
      .where(sql`${table.session_id} IS NOT NULL`),
  ],
);

export type LearningTrackAttempt = typeof learningTrackAttemptsTable.$inferSelect;
