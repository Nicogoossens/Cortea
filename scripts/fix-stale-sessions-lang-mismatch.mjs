/**
 * One-time data fix — Task #293: Fix Atelier language switching
 *
 * Closes open learning-track sessions whose `lang` column records a requested
 * language (e.g. 'en') but whose served_question_ids actually reference
 * questions in a different language (e.g. 'nl').
 *
 * These sessions were created before the `lang` column was guarded during
 * session lookup, meaning a Dutch-content session could be silently reused for
 * a user who had switched their UI language to English.
 *
 * This script sets `completed_at = NOW()` on all such sessions so that
 * findOpenSession and the transactional re-check both treat them as expired.
 * A fresh session with correctly-matched content will be created on the next
 * request.
 *
 * Usage:
 *   DATABASE_URL=<postgres-url> node scripts/fix-stale-sessions-lang-mismatch.mjs
 *
 * Safe to run multiple times (idempotent: only touches rows still open).
 *
 * Status: EXECUTED on 2026-05-04 against development DB — 1 row closed (id=12,
 * region=BE, started_at=2026-05-03). Production DB should be checked and this
 * script re-run against it if needed.
 */

import pg from "pg";

const { Client } = pg;

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  const result = await client.query(`
    UPDATE learning_track_sessions
    SET    completed_at = NOW()
    WHERE  completed_at IS NULL
      AND  EXISTS (
             SELECT 1
             FROM   jsonb_array_elements_text(served_question_ids) AS qid
             JOIN   learning_track_questions ltq ON ltq.id::text = qid
             WHERE  ltq.lang != learning_track_sessions.lang
             LIMIT  1
           )
    RETURNING id, region_code, lang, started_at
  `);

  if (result.rowCount === 0) {
    console.log("No stale sessions found — nothing to close.");
  } else {
    console.log(`Closed ${result.rowCount} stale session(s):`);
    for (const row of result.rows) {
      console.log(`  id=${row.id}  region=${row.region_code}  lang=${row.lang}  started_at=${row.started_at}`);
    }
  }
} finally {
  await client.end();
}
