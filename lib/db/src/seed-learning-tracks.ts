/**
 * Learning Track Question Import
 *
 * Accepts either a pre-built JSON file or a canonical Markdown (.md) pillar file.
 * Processes records in batches of 500 for large datasets.
 *
 * Usage:
 *   tsx src/seed-learning-tracks.ts <path-to.json>
 *   tsx src/seed-learning-tracks.ts <path-to.md>
 */

import { db } from "./index.js";
import { learningTrackQuestionsTable, type InsertLearningTrackQuestion } from "./schema/learning-track-questions.js";
import { parseLearningTrackMd } from "./parse-learning-track-md.js";

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
    console.error("Usage:");
    console.error("  tsx seed-learning-tracks.ts <path-to.json>   — import from JSON array");
    console.error("  tsx seed-learning-tracks.ts <path-to.md>     — import from canonical MD pillar file");
    process.exit(1);
  }

  import("fs").then(async (fs) => {
    const raw = fs.readFileSync(filePath, "utf8");

    let questions: InsertLearningTrackQuestion[];

    if (filePath.endsWith(".md")) {
      console.log(`Parsing MD file: ${filePath}...`);
      const { questions: parsed, parseErrors } = parseLearningTrackMd(raw);
      if (parseErrors.length > 0) {
        console.warn(`  ${parseErrors.length} parse warning(s):`);
        parseErrors.forEach((e) => console.warn(`    ${e}`));
      }
      console.log(`  Parsed ${parsed.length} questions.`);
      questions = parsed;
    } else {
      questions = JSON.parse(raw) as InsertLearningTrackQuestion[];
      console.log(`  Loaded ${questions.length} questions from JSON.`);
    }

    if (questions.length === 0) {
      console.error("No questions to import. Exiting.");
      process.exit(1);
    }

    console.log(`Importing ${questions.length} learning track questions...`);
    const { inserted, skipped } = await importLearningTrackQuestions(questions);
    console.log(`Done. Inserted: ${inserted}, Skipped (already existed): ${skipped}`);
    process.exit(0);
  }).catch((err) => {
    console.error("Import failed:", err);
    process.exit(1);
  });
}
