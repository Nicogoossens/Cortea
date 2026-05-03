import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  doublePrecision,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

/**
 * Per-run telemetry for the background AI sweepers (ui-translation,
 * register-calibration, scenario-translation, and the calibration scripts they
 * spawn). Every Anthropic-driven worker run inserts exactly one row at the end
 * of its pass so we can answer "AI translation spend by sweeper, last 7 days"
 * with a single SQL query, and so the sweepers themselves can enforce a
 * per-day USD budget cap to prevent runaway loops.
 */
export const workerRunsTable = pgTable(
  "worker_runs",
  {
    id: serial("id").primaryKey(),
    // Stable sweeper identifier, e.g. "ui-translation", "register-calibration",
    // "scenario-translation", "register-ui-audit". Used as the GROUP BY key
    // for daily/weekly spend reports and for the per-sweeper budget cap.
    sweeper: text("sweeper").notNull(),
    started_at: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    finished_at: timestamp("finished_at", { withTimezone: true }),
    elapsed_ms: integer("elapsed_ms"),
    items_processed: integer("items_processed").notNull().default(0),
    input_tokens: integer("input_tokens").notNull().default(0),
    output_tokens: integer("output_tokens").notNull().default(0),
    estimated_usd: doublePrecision("estimated_usd").notNull().default(0),
    model: text("model"),
    // ok | budget_capped | failed | partial
    status: text("status").notNull().default("ok"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  },
  (t) => [
    index("worker_runs_sweeper_started_idx").on(t.sweeper, t.started_at),
  ],
);

export type WorkerRun = typeof workerRunsTable.$inferSelect;
export type InsertWorkerRun = typeof workerRunsTable.$inferInsert;
