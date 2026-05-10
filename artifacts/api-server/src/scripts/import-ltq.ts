/**
 * LTQ Import CLI — Task #310
 *
 * Reads MD files from Google Drive, parses them (auto-detects canonical MD or
 * YAML-block format), inserts into learning_track_questions with idempotent
 * onConflictDoNothing, then moves each processed file to the done/ folder.
 *
 * Usage:
 *   pnpm --filter @workspace/api-server exec tsx src/scripts/import-ltq.ts \
 *     --folder <drive-folder-id> [--done-folder <id>]
 *
 *   pnpm --filter @workspace/api-server exec tsx src/scripts/import-ltq.ts \
 *     --file <drive-file-id> [--done-folder <id>]
 *
 * done-folder resolution (highest priority first):
 *   1. --done-folder <id>           explicit flag
 *   2. DRIVE_IMPORT_DONE_FOLDER_ID  env var (treated as done/ root — the
 *                                   matching country subfolder is found automatically)
 *   3. Auto-derived from --folder   looks up the done/<CC> sibling via Drive API
 *
 * Google Drive folder structure:
 *   My Drive/cortea/import/
 *     to-do/<CC>/   ← place new MD files here  (CC = ISO country code, e.g. BE)
 *     done/<CC>/    ← files are moved here after a successful import
 *
 * Known folder IDs:
 *   to-do root : 1DLe3E3XMxXFHLAge7kA4bggMmnU2j4Qt   (DRIVE_IMPORT_TODO_FOLDER_ID)
 *   done  root : 1yhaSbrCf5nh8fo0ukm1gbHGT2oqQMjRJ   (DRIVE_IMPORT_DONE_FOLDER_ID)
 *   to-do/BE   : 1ulQLkZoELNG1bKSjUoJYzPi_HQz_5IfY
 *   done/BE    : 1igOihIBrjTN4sC6UPXEHCPgQ5jWDYn8c
 */

import { db, pool, learningTrackQuestionsTable } from "@workspace/db";
import type { InsertLearningTrackQuestion } from "@workspace/db";
import { parseLearningTrackMd } from "@workspace/db/parse-learning-track-md";
import {
  listFilesInFolder,
  downloadFileAsText,
  moveFileToFolder,
  resolveDoneFolder,
} from "../lib/google-drive.js";
import { parseLtqYaml } from "../lib/parse-ltq-yaml.js";

// ── CLI argument parsing ──────────────────────────────────────────────────────

const args = process.argv.slice(2);

function getArg(flag: string): string | null {
  const idx = args.indexOf(flag);
  return idx >= 0 ? (args[idx + 1] ?? null) : null;
}

const targetFolder = getArg("--folder");
const targetFile   = getArg("--file");
const explicitDone = getArg("--done-folder");

if (!targetFolder && !targetFile) {
  console.error("Usage:");
  console.error("  tsx src/scripts/import-ltq.ts --folder <drive-folder-id> [--done-folder <id>]");
  console.error("  tsx src/scripts/import-ltq.ts --file   <drive-file-id>   [--done-folder <id>]");
  process.exit(1);
}

// ── Done-folder resolution ────────────────────────────────────────────────────
// Resolved once (lazily) the first time it is needed.
// For --folder mode the env-var done-root is treated as a root and the matching
// country subfolder is found automatically; an explicit --done-folder always wins.

let _resolvedDoneFolder: string | null | undefined = undefined;

async function getDoneFolder(sourceFolderId: string | null): Promise<string | null> {
  if (_resolvedDoneFolder !== undefined) return _resolvedDoneFolder;

  if (explicitDone) {
    _resolvedDoneFolder = explicitDone;
    return _resolvedDoneFolder;
  }

  // Auto-derive: find done/<CC> sibling via API (requires sourceFolderId)
  if (sourceFolderId) {
    const auto = await resolveDoneFolder(sourceFolderId);
    if (auto) {
      console.log(`  ℹ️  Auto-resolved done/ folder: ${auto}`);
      _resolvedDoneFolder = auto;
      return _resolvedDoneFolder;
    }
  }

  // Fallback: use DRIVE_IMPORT_DONE_FOLDER_ID as-is (done/ root, not country subfolder)
  _resolvedDoneFolder = process.env.DRIVE_IMPORT_DONE_FOLDER_ID ?? null;
  return _resolvedDoneFolder;
}

// ── Batch insert (idempotent) ─────────────────────────────────────────────────

const BATCH_SIZE = 500;

async function batchInsert(
  questions: InsertLearningTrackQuestion[],
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped  = 0;
  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch  = questions.slice(i, i + BATCH_SIZE);
    const result = await db
      .insert(learningTrackQuestionsTable)
      .values(batch)
      .onConflictDoNothing()
      .returning({ id: learningTrackQuestionsTable.id });
    inserted += result.length;
    skipped  += batch.length - result.length;
    const end = Math.min(i + BATCH_SIZE, questions.length);
    process.stdout.write(`\r    Batch ${Math.ceil((i + 1) / BATCH_SIZE)}: ${end}/${questions.length}`);
  }
  process.stdout.write("\n");
  return { inserted, skipped };
}

// ── Per-file processor ────────────────────────────────────────────────────────

interface FileResult {
  parsed:   number;
  inserted: number;
  skipped:  number;
  warnings: number;
  moved:    boolean;
}

async function processFile(
  fileId: string,
  fileName: string,
  sourceFolderId: string | null,
): Promise<FileResult> {
  console.log(`\n  📄 ${fileName}`);

  const content = await downloadFileAsText(fileId);

  let questions: InsertLearningTrackQuestion[];
  let parseErrors: string[];

  if (content.includes("```yaml")) {
    const result = parseLtqYaml(content);
    questions   = result.questions;
    parseErrors = result.parseErrors;
    console.log(`     Format: YAML-block`);
  } else {
    const result = parseLearningTrackMd(content);
    questions   = result.questions;
    parseErrors = result.parseErrors;
    console.log(`     Format: Canonical MD`);
  }

  if (parseErrors.length > 0) {
    console.warn(`     ⚠️  ${parseErrors.length} parse warning(s):`);
    parseErrors.slice(0, 10).forEach((e) => console.warn(`        ${e}`));
    if (parseErrors.length > 10) console.warn(`        … and ${parseErrors.length - 10} more`);
  }

  console.log(`     Parsed:  ${questions.length} questions`);

  if (questions.length === 0) {
    console.error(`     ❌ No questions — skipping insert and move`);
    return { parsed: 0, inserted: 0, skipped: 0, warnings: parseErrors.length, moved: false };
  }

  const { inserted, skipped } = await batchInsert(questions);
  console.log(`     ✅ Inserted: ${inserted}  |  Skipped (dup): ${skipped}`);

  let moved = false;
  const doneFolder = await getDoneFolder(sourceFolderId);
  if (doneFolder) {
    try {
      await moveFileToFolder(fileId, doneFolder);
      console.log(`     📁 Moved to done/`);
      moved = true;
    } catch (err) {
      console.warn(`     ⚠️  Could not move file: ${err}`);
    }
  } else {
    console.warn(
      `     ⚠️  No done-folder resolved — set --done-folder or DRIVE_IMPORT_DONE_FOLDER_ID`,
    );
  }

  return { parsed: questions.length, inserted, skipped, warnings: parseErrors.length, moved };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║  LTQ Import — Google Drive → Postgres    ║");
  console.log("╚══════════════════════════════════════════╝");

  // sourceFolderId is the actual country folder used for auto done-derivation.
  // In --file mode we fetch the file's parent folder so resolveDoneFolder still
  // locates the correct done/<CC> sibling automatically.
  let sourceFolderId: string | null = targetFolder ?? null;

  let files: { id: string; name: string }[];

  if (targetFile) {
    // Fetch parent folder so resolveDoneFolder can locate the done/<CC> sibling
    if (!sourceFolderId) {
      try {
        const { getFileMetadata } = await import("../lib/google-drive.js");
        const meta = await getFileMetadata(targetFile);
        sourceFolderId = meta.parents?.[0] ?? null;
      } catch {
        // Non-fatal: fallback to env-var done-folder
      }
    }
    files = [{ id: targetFile, name: `(single file: ${targetFile})` }];
  } else {
    console.log(`\nListing files in folder: ${targetFolder}`);
    const listed = await listFilesInFolder(targetFolder!);
    files = listed.map((f) => ({ id: f.id, name: f.name }));
    console.log(`Found ${files.length} markdown file(s)`);
  }

  if (files.length === 0) {
    console.log("\nNothing to import. Exiting.");
    await pool.end();
    process.exit(0);
  }

  const totals = { parsed: 0, inserted: 0, skipped: 0, warnings: 0, moved: 0, errors: 0 };

  for (const file of files) {
    try {
      const result = await processFile(file.id, file.name, sourceFolderId);
      totals.parsed   += result.parsed;
      totals.inserted += result.inserted;
      totals.skipped  += result.skipped;
      totals.warnings += result.warnings;
      if (result.moved) totals.moved++;
    } catch (err) {
      console.error(`\n  ❌ Fatal error on ${file.name}: ${err}`);
      totals.errors++;
    }
  }

  console.log("\n══════════════════════════════════════════");
  console.log("  SUMMARY");
  console.log(`  Files processed : ${files.length}`);
  console.log(`  Files moved     : ${totals.moved}`);
  console.log(`  Questions parsed: ${totals.parsed}`);
  console.log(`  Inserted (new)  : ${totals.inserted}`);
  console.log(`  Skipped (dup)   : ${totals.skipped}`);
  console.log(`  Parse warnings  : ${totals.warnings}`);
  console.log(`  Fatal errors    : ${totals.errors}`);
  console.log("══════════════════════════════════════════");

  await pool.end();
  process.exit(totals.errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
