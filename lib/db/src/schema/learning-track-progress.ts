import { pgTable, serial, text, integer, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
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
    uniqueIndex("ltp_user_register_pillar_phase_idx").on(
      table.user_id,
      table.register,
      table.research_pillar,
      table.phase,
    ),
  ],
);

export type LearningTrackProgress = typeof learningTrackProgressTable.$inferSelect;
