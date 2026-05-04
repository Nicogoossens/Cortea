import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/**
 * Per-region, per-domain knowledge seeds for the Counsel module.
 *
 * Seeds are produced by `scripts/counsel-seed-worker.mjs`, which distils the
 * Atelier learning_track_questions for a given region into a structured
 * knowledge object per Counsel domain (gastronomy, business, dress_code, etc.).
 * The Counsel route reads `status='active'` rows as an additional context block
 * alongside the existing hardcoded REGION_CONTEXT — seeds never replace those
 * static blocks.
 *
 * Lifecycle: draft → reviewed → active. The worker writes drafts; an admin
 * promotes them to active via the Admin UI when satisfied with the eval_score.
 */
export const counselRegionSeedsTable = pgTable(
  "counsel_region_seeds",
  {
    id: serial("id").primaryKey(),
    region_code: text("region_code").notNull(),
    /**
     * Counsel domain key — must match VALID_COUNSEL_DOMAINS in counsel.ts:
     * gastronomy | business | eloquence | formal_events | dress_code | cultural_knowledge
     */
    domain: text("domain").notNull(),
    /**
     * Structured distilled knowledge produced by the LLM.
     * Shape (current):
     *   {
     *     summary: string,           // 1–2 sentence regional framing for the domain
     *     principles: string[],      // 3–6 culturally specific guiding principles
     *     do_examples: string[],     // 3–6 concrete recommended behaviours
     *     avoid_examples: string[],  // 3–6 concrete behaviours to avoid
     *     register_notes?: string,   // optional tone/register observations
     *   }
     */
    content: jsonb("content").$type<Record<string, unknown>>().notNull(),
    /**
     * Translated seed content keyed by BCP-47 language code
     * (nl, fr, de, es, pt, it, ar, ja, zh). Same shape as `content`.
     * Populated by scripts/translate-counsel-seeds.mjs on admin demand.
     */
    content_i18n: jsonb("content_i18n").$type<Record<string, Record<string, unknown>>>(),
    /** Raw quality score from the evaluation pass (0–100). NULL until evaluated. */
    eval_score: integer("eval_score"),
    /** Free-form rationale from the eval pass; useful for admin review. */
    eval_notes: text("eval_notes"),
    /** draft | reviewed | active */
    status: text("status").notNull().default("draft"),
    seeded_at: timestamp("seeded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewed_at: timestamp("reviewed_at", { withTimezone: true }),
    promoted_at: timestamp("promoted_at", { withTimezone: true }),
  },
  (t) => [
    // One active row per (region, domain) is the common read path; we enforce
    // uniqueness on the (region, domain) pair so re-runs UPSERT instead of
    // accumulating duplicates.
    uniqueIndex("counsel_region_seeds_region_domain_key").on(
      t.region_code,
      t.domain,
    ),
    index("counsel_region_seeds_status_idx").on(t.status, t.region_code),
  ],
);

export type CounselRegionSeed = typeof counselRegionSeedsTable.$inferSelect;
export type InsertCounselRegionSeed = typeof counselRegionSeedsTable.$inferInsert;
