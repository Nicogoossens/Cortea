/**
 * Admin LTQ Import routes — Task #311
 *
 * GET  /api/admin/import/todo-files  — list MD files in all to-do/<CC>/ subfolders
 * POST /api/admin/import/ltq         — trigger async import for one file or whole folder
 * GET  /api/admin/import/runs        — last 50 import-run log rows
 * GET  /api/admin/import/runs/:id    — single run (for polling)
 */

import { Router } from "express";
import { db } from "@workspace/db";
import { importRunsTable, learningTrackQuestionsTable } from "@workspace/db";
import type { InsertLearningTrackQuestion } from "@workspace/db";
import { parseLearningTrackMd } from "@workspace/db/parse-learning-track-md";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "./require-admin.js";
import {
  listFilesInFolder,
  listFoldersInFolder,
  downloadFileAsText,
  moveFileToFolder,
  resolveDoneFolder,
} from "../../lib/google-drive.js";
import { parseLtqYaml } from "../../lib/parse-ltq-yaml.js";

const router = Router();

// Known Drive folder IDs (from import-ltq.ts)
const TODO_ROOT  = process.env.DRIVE_IMPORT_TODO_FOLDER_ID  ?? "1DLe3E3XMxXFHLAge7kA4bggMmnU2j4Qt";
const DONE_ROOT  = process.env.DRIVE_IMPORT_DONE_FOLDER_ID  ?? "1yhaSbrCf5nh8fo0ukm1gbHGT2oqQMjRJ";

// ─── GET /api/admin/import/todo-files ─────────────────────────────────────────

router.get("/admin/import/todo-files", requireAdmin, async (_req, res) => {
  try {
    const folders = await listFoldersInFolder(TODO_ROOT);
    const results = await Promise.all(
      folders.map(async (folder) => {
        const files = await listFilesInFolder(folder.id);
        return { folder_id: folder.id, folder_name: folder.name, files };
      }),
    );
    res.json({ folders: results });
  } catch (err) {
    console.error("[admin-import] todo-files error:", err);
    res.status(500).json({ error: "Failed to list Drive files.", detail: String(err) });
  }
});

// ─── POST /api/admin/import/ltq ───────────────────────────────────────────────

const ImportBody = z.object({
  file_id:          z.string().min(1),
  file_name:        z.string().min(1),
  source_folder_id: z.string().optional(),
});

router.post("/admin/import/ltq", requireAdmin, async (req, res) => {
  const parse = ImportBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid body.", detail: parse.error.issues });
    return;
  }
  const { file_id, file_name, source_folder_id } = parse.data;
  const triggeredBy = (req as unknown as { resolvedUserId?: string }).resolvedUserId ?? null;

  // Create run row (status = queued)
  const [run] = await db
    .insert(importRunsTable)
    .values({ file_id, file_name, status: "queued", triggered_by: triggeredBy })
    .returning({ id: importRunsTable.id });

  // Fire-and-forget async job
  runImportJob(run.id, file_id, file_name, source_folder_id ?? null).catch((err) => {
    console.error(`[import-job ${run.id}] unhandled:`, err);
  });

  res.json({ run_id: run.id });
});

// ─── GET /api/admin/import/runs ───────────────────────────────────────────────

router.get("/admin/import/runs", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(importRunsTable)
      .orderBy(desc(importRunsTable.started_at))
      .limit(50);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to load import runs.", detail: String(err) });
  }
});

// ─── GET /api/admin/import/runs/:id ───────────────────────────────────────────

router.get("/admin/import/runs/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id." }); return; }
  const [row] = await db.select().from(importRunsTable).where(eq(importRunsTable.id, id)).limit(1);
  if (!row) { res.status(404).json({ error: "Run not found." }); return; }
  res.json(row);
});

// ─── Async import job ─────────────────────────────────────────────────────────

const BATCH_SIZE = 500;

async function batchInsert(
  questions: InsertLearningTrackQuestion[],
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0; let skipped = 0;
  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch  = questions.slice(i, i + BATCH_SIZE);
    const result = await db
      .insert(learningTrackQuestionsTable)
      .values(batch)
      .onConflictDoNothing()
      .returning({ id: learningTrackQuestionsTable.id });
    inserted += result.length;
    skipped  += batch.length - result.length;
  }
  return { inserted, skipped };
}

async function runImportJob(
  runId: number,
  fileId: string,
  fileName: string,
  sourceFolderId: string | null,
): Promise<void> {
  const setStatus = (status: string) =>
    db.update(importRunsTable).set({ status }).where(eq(importRunsTable.id, runId));

  try {
    // 1 — parsing
    await setStatus("parsing");
    const content = await downloadFileAsText(fileId);

    let questions: InsertLearningTrackQuestion[];
    let parseErrors: string[];

    if (content.includes("```yaml")) {
      const r = parseLtqYaml(content);
      questions   = r.questions;
      parseErrors = r.parseErrors;
    } else {
      const r = parseLearningTrackMd(content);
      questions   = r.questions;
      parseErrors = r.parseErrors;
    }

    if (questions.length === 0) {
      await db.update(importRunsTable).set({
        status:      "error",
        error_count: 1,
        errors_json: [`No questions parsed from ${fileName}`, ...parseErrors.slice(0, 20)],
        finished_at: new Date(),
      }).where(eq(importRunsTable.id, runId));
      return;
    }

    // 2 — inserting
    await db.update(importRunsTable)
      .set({ status: "inserting", error_count: parseErrors.length, errors_json: parseErrors.slice(0, 50) })
      .where(eq(importRunsTable.id, runId));

    const { inserted, skipped } = await batchInsert(questions);

    // 3 — move file to done/
    // resolveDoneFolder(sourceFolderId) expects a source country folder (e.g. to-do/BE),
    // reads its name ("BE"), then finds the matching done/BE subfolder.
    // Fall back to DONE_ROOT when no sourceFolderId is available.
    let moveError: string | null = null;
    try {
      let doneFolder: string | null = null;
      if (sourceFolderId) {
        doneFolder = await resolveDoneFolder(sourceFolderId).catch(() => null);
      }
      if (!doneFolder) doneFolder = DONE_ROOT;
      await moveFileToFolder(fileId, doneFolder);
    } catch (err) {
      moveError = `Move to done/ failed: ${String(err)}`;
    }

    const finalErrors = [
      ...parseErrors.slice(0, 50),
      ...(moveError ? [moveError] : []),
    ];

    await db.update(importRunsTable).set({
      status:         "done",
      inserted_count: inserted,
      skipped_count:  skipped,
      error_count:    parseErrors.length + (moveError ? 1 : 0),
      errors_json:    finalErrors,
      finished_at:    new Date(),
    }).where(eq(importRunsTable.id, runId));

  } catch (err) {
    await db.update(importRunsTable).set({
      status:      "error",
      error_count: 1,
      errors_json: [String(err)],
      finished_at: new Date(),
    }).where(eq(importRunsTable.id, runId)).catch(() => {});
  }
}

export default router;
