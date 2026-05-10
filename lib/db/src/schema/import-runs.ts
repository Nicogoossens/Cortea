import {
  pgTable,
  serial,
  text,
  integer,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

/**
 * One row per LTQ import attempt, written by the admin API route.
 * status lifecycle: queued → parsing → inserting → done | error
 */
export const importRunsTable = pgTable(
  "import_runs",
  {
    id:            serial("id").primaryKey(),
    file_id:       text("file_id").notNull(),
    file_name:     text("file_name").notNull(),
    /** queued | parsing | inserting | done | error */
    status:        text("status").notNull().default("queued"),
    inserted_count: integer("inserted_count").notNull().default(0),
    skipped_count:  integer("skipped_count").notNull().default(0),
    error_count:    integer("error_count").notNull().default(0),
    /** parse warnings + fatal error messages */
    errors_json:   jsonb("errors_json").$type<string[]>().default([]),
    triggered_by:  text("triggered_by"),
    started_at:    timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finished_at:   timestamp("finished_at", { withTimezone: true }),
  },
  (t) => [
    index("import_runs_started_idx").on(t.started_at),
  ],
);

export type ImportRun    = typeof importRunsTable.$inferSelect;
export type InsertImportRun = typeof importRunsTable.$inferInsert;
