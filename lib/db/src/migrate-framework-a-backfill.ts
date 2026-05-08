/**
 * Master Framework v1.1 — Task A backfill
 *
 * Migrates legacy interest fields → selected_interests for existing users.
 * Idempotent: skips users whose selected_interests is already non-empty.
 *
 * Run: pnpm --filter @workspace/db migrate-framework-a
 */
import { db } from "./index.js";
import { usersTable } from "./schema/users.js";
import { sql } from "drizzle-orm";

async function run() {
  console.log("Starting Framework A backfill: legacy interests → selected_interests");

  // Fetch users who still have empty selected_interests but have legacy data
  const users = await db
    .select({
      id: usersTable.id,
      interests_sports: usersTable.interests_sports,
      interests_cuisine: usersTable.interests_cuisine,
      interests_dress_code: usersTable.interests_dress_code,
      situational_interests: usersTable.situational_interests,
      selected_interests: usersTable.selected_interests,
    })
    .from(usersTable);

  let skipped = 0;
  let migrated = 0;

  for (const user of users) {
    // Skip if already migrated (selected_interests non-empty)
    if (user.selected_interests && user.selected_interests.length > 0) {
      skipped++;
      continue;
    }

    // Merge all legacy interest arrays, deduplicate
    const merged = Array.from(new Set([
      ...(user.interests_sports ?? []),
      ...(user.interests_cuisine ?? []),
      ...(user.interests_dress_code ?? []),
      ...(user.situational_interests ?? []),
    ]));

    if (merged.length === 0) {
      skipped++;
      continue;
    }

    await db
      .update(usersTable)
      .set({ selected_interests: merged })
      .where(sql`${usersTable.id} = ${user.id}`);

    migrated++;
    console.log(`  ✓ ${user.id} — merged ${merged.length} interests`);
  }

  console.log(`\nBackfill complete: ${migrated} migrated, ${skipped} skipped.`);
}

run().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
