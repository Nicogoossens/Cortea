/**
 * Auto-tagger voor learning_track_questions — Task #392
 *
 * Verwerkt alle vragen met cultural_tags = '[]' en kent automatisch
 * tags toe op basis van de canonieke tagcatalogus (1.415 tags) via Claude.
 *
 * Gedrag:
 *   - Haalt ongetagde vragen op: WHERE cultural_tags = '[]'::jsonb
 *   - Laadt de volledige tagcatalogus in-memory (vocabulary voor AI)
 *   - Verwerkt in batches van 20 — één Claude-aanroep per batch
 *   - Valideert response: verwijder tag_ids die niet in de catalogus staan
 *   - Slaat max. 5 tags per vraag op — uitsluitend voor lege vragen
 *   - Logt per batch: getagd / overgeslagen / gemiddeld tags per vraag
 *   - 100% idempotent: getagde vragen worden nooit overschreven
 *
 * Gebruik:
 *   pnpm --filter @workspace/api-server auto-tag-questions
 *
 * Vereisten:
 *   AI_INTEGRATIONS_ANTHROPIC_BASE_URL + AI_INTEGRATIONS_ANTHROPIC_API_KEY
 *   DATABASE_URL of PROD_DATABASE_URL
 */
import { db, pool } from "@workspace/db";
import { learningTrackQuestionsTable, culturalTagsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const MODEL        = "claude-haiku-4-5";
const BATCH_SIZE   = 20;
const MAX_TAGS     = 5;
const CONFIDENCE_THRESHOLD = 0; // Claude returns only confident tags; no numeric threshold needed

interface TagEntry { tag_id: string; tag_scope: string; }

interface UntaggedQuestion {
  id: number;
  question_text: string;
  historical_context: string | null;
  register: string;
  research_pillar: string | null;
  demographic: string;
  region_code: string;
}

// ── Anthropic client ─────────────────────────────────────────────────────────

function getAnthropicConfig(): { base: string; key: string } {
  const base = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const key  = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  if (!base || !key) {
    throw new Error(
      "Anthropic env vars ontbreken: AI_INTEGRATIONS_ANTHROPIC_BASE_URL + AI_INTEGRATIONS_ANTHROPIC_API_KEY"
    );
  }
  return { base, key };
}

async function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
  const { base, key } = getAnthropicConfig();
  const resp = await fetch(`${base}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  if (!resp.ok) {
    throw new Error(`Anthropic API fout ${resp.status}: ${await resp.text()}`);
  }
  const data = (await resp.json()) as { content?: Array<{ text: string }> };
  return (data.content?.[0]?.text ?? "").trim();
}

// ── Tag loading ───────────────────────────────────────────────────────────────

async function loadCatalog(): Promise<{ tags: TagEntry[]; tagSet: Set<string> }> {
  const tags = await db
    .select({ tag_id: culturalTagsTable.tag_id, tag_scope: culturalTagsTable.tag_scope })
    .from(culturalTagsTable)
    .orderBy(culturalTagsTable.tag_id);

  if (tags.length === 0) {
    throw new Error(
      "cultural_tags tabel is leeg — voer eerst seed-cultural-tags uit:\n" +
      "  pnpm --filter @workspace/db seed-cultural-tags"
    );
  }

  const tagSet = new Set(tags.map((t) => t.tag_id));
  return { tags, tagSet };
}

// ── Question loading ──────────────────────────────────────────────────────────

async function loadUntaggedQuestions(): Promise<UntaggedQuestion[]> {
  const rows = await db
    .select({
      id:                 learningTrackQuestionsTable.id,
      question_text:      learningTrackQuestionsTable.question_text,
      historical_context: learningTrackQuestionsTable.historical_context,
      register:           learningTrackQuestionsTable.register,
      research_pillar:    learningTrackQuestionsTable.research_pillar,
      demographic:        learningTrackQuestionsTable.demographic,
      region_code:        learningTrackQuestionsTable.region_code,
    })
    .from(learningTrackQuestionsTable)
    .where(sql`${learningTrackQuestionsTable.cultural_tags} = '[]'::jsonb`)
    .orderBy(learningTrackQuestionsTable.id);
  return rows;
}

// ── AI tagging ────────────────────────────────────────────────────────────────

function buildSystemPrompt(tags: TagEntry[]): string {
  const tagList = tags
    .map((t) => `${t.tag_id} [${t.tag_scope}]`)
    .join("\n");

  return (
    `Je bent een culturele etiquetatagger voor het Cortéa leersysteem.\n` +
    `Je taak is om leervragen te voorzien van maximaal ${MAX_TAGS} relevante cultural_tag IDs.\n\n` +
    `Status-semantiek:\n` +
    `  excluded         — gedrag verboden of onaanvaardbaar in sommige landen\n` +
    `  free             — geen bijzondere culturele lading\n` +
    `  recommended      — cultureel passend en gewaardeerd\n` +
    `  not_recommended  — cultureel ongepast (niet illegaal)\n\n` +
    `Geef ALLEEN tags terug die DIRECT betrekking hebben op de vraag.\n` +
    `Geef een lege array als geen enkele tag van toepassing is.\n\n` +
    `Beschikbare tag_ids (${tags.length} totaal):\n${tagList}`
  );
}

interface QuestionTagResult {
  question_id: number;
  tags: string[];
}

async function tagBatch(
  questions: UntaggedQuestion[],
  systemPrompt: string,
  tagSet: Set<string>,
): Promise<QuestionTagResult[]> {
  const questionsJson = questions.map((q) => ({
    id: q.id,
    question_text: q.question_text,
    historical_context: q.historical_context ?? null,
    register: q.register,
    region_code: q.region_code,
    demographic: q.demographic,
    research_pillar: q.research_pillar ?? null,
  }));

  const userMessage =
    `Tag de volgende ${questions.length} vragen. Geef een JSON-array terug:\n` +
    `[\n` +
    `  { "question_id": <number>, "tags": ["tag_id1", "tag_id2"] },\n` +
    `  ...\n` +
    `]\n\n` +
    `Vragen:\n${JSON.stringify(questionsJson, null, 2)}`;

  let raw = await callClaude(systemPrompt, userMessage);

  raw = raw
    .replace(/^```(?:json)?\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error(`  ⚠ JSON parse fout voor batch, batch overgeslagen. Raw: ${raw.slice(0, 200)}`);
    return [];
  }

  if (!Array.isArray(parsed)) {
    console.error("  ⚠ Response is geen array, batch overgeslagen.");
    return [];
  }

  return (parsed as Array<unknown>).flatMap((item) => {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof (item as Record<string, unknown>).question_id !== "number" ||
      !Array.isArray((item as Record<string, unknown>).tags)
    ) {
      return [];
    }
    const { question_id, tags } = item as { question_id: number; tags: unknown[] };

    const validTags = (tags as string[])
      .filter((t) => typeof t === "string" && tagSet.has(t))
      .slice(0, MAX_TAGS);

    return [{ question_id, tags: validTags }];
  });
}

// ── Saving ────────────────────────────────────────────────────────────────────

async function saveTags(results: QuestionTagResult[]): Promise<{ saved: number; empty: number }> {
  let saved = 0;
  let empty = 0;

  for (const r of results) {
    if (r.tags.length === 0) { empty++; continue; }

    await db
      .update(learningTrackQuestionsTable)
      .set({ cultural_tags: r.tags })
      .where(
        sql`${learningTrackQuestionsTable.id} = ${r.question_id}
            AND ${learningTrackQuestionsTable.cultural_tags} = '[]'::jsonb`,
      );
    saved++;
  }
  return { saved, empty };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("[auto-tag-questions] Starten…\n");

  const { tags, tagSet } = await loadCatalog();
  console.log(`  Catalogus geladen: ${tags.length} tags\n`);

  const questions = await loadUntaggedQuestions();
  console.log(`  Ongetagde vragen: ${questions.length}\n`);

  if (questions.length === 0) {
    console.log("  Niets te doen — alle vragen zijn al getagd.");
    await pool.end();
    return;
  }

  const systemPrompt = buildSystemPrompt(tags);

  let totalSaved  = 0;
  let totalEmpty  = 0;
  let totalErrors = 0;
  let batchNum    = 0;

  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE);
    batchNum++;

    try {
      const results = await tagBatch(batch, systemPrompt, tagSet);
      const { saved, empty } = await saveTags(results);
      totalSaved  += saved;
      totalEmpty  += empty;

      const avgTags = results.length > 0
        ? (results.reduce((s, r) => s + r.tags.length, 0) / results.length).toFixed(1)
        : "0";

      console.log(
        `  Batch ${batchNum} (${i + 1}–${Math.min(i + BATCH_SIZE, questions.length)}` +
        ` van ${questions.length}): ` +
        `${saved} getagd, ${empty} leeg, gem. ${avgTags} tags/vraag`
      );
    } catch (err) {
      totalErrors++;
      console.error(`  ⚠ Batch ${batchNum} fout:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`\n✓ Klaar`);
  console.log(`  Getagd:       ${totalSaved}`);
  console.log(`  Leeg gebleven: ${totalEmpty}`);
  console.log(`  Fouten:       ${totalErrors}`);
  console.log(`  Overgeslagen (reeds getagd): alle andere vragen ongewijzigd`);

  await pool.end();
}

main().catch((err) => {
  console.error("\n[auto-tag-questions] FOUT:", err instanceof Error ? err.message : err);
  process.exit(1);
});
