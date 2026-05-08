import { pgTable, serial, text, integer, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

/**
 * One row per question batch served by /api/learning-tracks/session.
 * Drives:
 *   - Daily-limit enforcement (count rows where started_at::date = today AND register = X)
 *   - Cooldown enforcement (most recent completed_at for this register)
 *   - Session-end summary screen (score = correct_answers / total_questions)
 *   - Remediation queue (repeat_question_ids carries the wrong answers from
 *     the previous failed session into the next one)
 *
 * `served_question_ids` is a snapshot of the questions actually delivered, so
 * the API can validate that submitted answers belong to the active session.
 */
export const learningTrackSessionsTable = pgTable(
  "learning_track_sessions",
  {
    id:                   serial("id").primaryKey(),
    user_id:              text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    register:             text("register").notNull(),
    region_code:          text("region_code").notNull(),
    research_pillar:      text("research_pillar"),
    phase:                integer("phase").notNull(),
    level:                integer("level").notNull(),
    is_remediation:       boolean("is_remediation").notNull().default(false),
    served_question_ids:  jsonb("served_question_ids").$type<number[]>().notNull().default([]),
    repeat_question_ids:  jsonb("repeat_question_ids").$type<number[]>().notNull().default([]),
    total_questions:      integer("total_questions").notNull().default(0),
    answers_given:        integer("answers_given").notNull().default(0),
    correct_answers:      integer("correct_answers").notNull().default(0),
    score_pct:            integer("score_pct"),                          // 0-100, set on completion
    passed:               boolean("passed"),                              // null until completed
    started_at:           timestamp("started_at").notNull().defaultNow(),
    completed_at:         timestamp("completed_at"),
    // Remediation lifecycle: when a follow-up remediation session is created
    // for a failed parent, we stamp `remediated_at` on the parent (so it is
    // not picked up again) and link the child via `remediates_session_id`.
    remediated_at:        timestamp("remediated_at"),
    remediates_session_id: integer("remediates_session_id"),
    lang:                 text("lang").notNull().default("en"),
    /**
     * Master Framework v1.1 — §6
     * True when this session was created by the placement-test flow.
     * Placement sessions write current_level directly (no pass-window).
     */
    is_placement:         boolean("is_placement").notNull().default(false),
  },
  (table) => [
    index("lts_user_register_started_idx").on(table.user_id, table.register, table.started_at),
    index("lts_user_register_completed_idx").on(table.user_id, table.register, table.completed_at),
  ],
);

export type LearningTrackSession = typeof learningTrackSessionsTable.$inferSelect;
