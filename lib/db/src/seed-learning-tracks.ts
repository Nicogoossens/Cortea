/**
 * Learning Track Question Import Scaffold
 *
 * Provides an idempotent batch-import function for learning track questions.
 * Processes records in batches of 500 to handle datasets of 7,000+ questions.
 *
 * Usage once the question dataset is ready:
 *   const data = JSON.parse(fs.readFileSync("data/be-learning-tracks.json", "utf8"));
 *   await importLearningTrackQuestions(data);
 */

import { db } from "./index.js";
import { learningTrackQuestionsTable, type InsertLearningTrackQuestion } from "./schema/learning-track-questions.js";

const BATCH_SIZE = 500;

export async function importLearningTrackQuestions(
  questions: InsertLearningTrackQuestion[],
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE);
    const result = await db
      .insert(learningTrackQuestionsTable)
      .values(batch)
      .onConflictDoNothing()
      .returning({ id: learningTrackQuestionsTable.id });

    inserted += result.length;
    skipped += batch.length - result.length;

    const progress = Math.min(i + BATCH_SIZE, questions.length);
    console.log(`  Batch ${Math.ceil((i + 1) / BATCH_SIZE)}: ${progress}/${questions.length} processed`);
  }

  return { inserted, skipped };
}

if (process.argv[1] && process.argv[1].includes("seed-learning-tracks")) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: tsx seed-learning-tracks.ts <path-to-json-file>");
    process.exit(1);
  }

  import("fs").then(async (fs) => {
    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw) as InsertLearningTrackQuestion[];
    console.log(`Importing ${data.length} learning track questions from ${filePath}...`);
    const { inserted, skipped } = await importLearningTrackQuestions(data);
    console.log(`Done. Inserted: ${inserted}, Skipped (already existed): ${skipped}`);
    process.exit(0);
  }).catch((err) => {
    console.error("Import failed:", err);
    process.exit(1);
  });
}
