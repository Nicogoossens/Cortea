import { Router, type Request, type Response, type NextFunction } from "express";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "@workspace/db";
import { usersTable, scenariosTable, cultureProtocolsTable, compassRegionsTable, translationsTable, nobleScoreLogTable, zuil_voortgangTable, type CompassLocaleMap } from "@workspace/db";
import { runAtelierSeed } from "@workspace/db/seed";
import { runCompassSeed } from "@workspace/db/seed-compass";
import { eq, ilike, or, desc, sql, count } from "drizzle-orm";
import { z } from "zod";

const execAsync = promisify(exec);
const __currentDir = path.dirname(fileURLToPath(import.meta.url));
// In the compiled bundle (dist/index.mjs) __currentDir ends with /dist — 3 levels to workspace root.
// In development (src/routes/admin.ts via tsx) it ends with /routes — 4 levels to workspace root.
const WORKSPACE_ROOT = __currentDir.endsWith("/dist")
  ? path.resolve(__currentDir, "../../../")
  : path.resolve(__currentDir, "../../../../");

const router = Router();

/**
 * Middleware: verifies Bearer token and confirms the user has is_admin=true.
 */
async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Authentication is required." });
      return;
    }
    const token = authHeader.slice(7).trim();
    if (!token) {
      res.status(401).json({ error: "Authentication is required." });
      return;
    }
    const [user] = await db
      .select({ id: usersTable.id, is_admin: usersTable.is_admin })
      .from(usersTable)
      .where(eq(usersTable.session_token, token))
      .limit(1);
    if (!user) {
      res.status(401).json({ error: "The authorisation token is not recognised." });
      return;
    }
    if (!user.is_admin) {
      res.status(403).json({ error: "This section is restricted to administrators." });
      return;
    }
    (req as Request & { resolvedUserId: string }).resolvedUserId = user.id;
    next();
  } catch (err) {
    res.status(500).json({ error: "A difficulty arose validating your session." });
  }
}

const SearchQuerySchema = z.object({
  q: z.string().optional().default(""),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

/** GET /admin/users — list / search users with true pagination */
router.get("/admin/users", requireAdmin, async (req, res) => {
  try {
    const parsed = SearchQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid query parameters." });
    }
    const { q, page, limit } = parsed.data;
    const offset = (page - 1) * limit;

    const whereClause = q
      ? or(ilike(usersTable.email, `%${q}%`), ilike(usersTable.full_name, `%${q}%`))
      : undefined;

    const [totalRow] = await db
      .select({ total: count() })
      .from(usersTable)
      .where(whereClause);

    const rows = await db
      .select({
        id: usersTable.id,
        full_name: usersTable.full_name,
        email: usersTable.email,
        email_verified: usersTable.email_verified,
        subscription_tier: usersTable.subscription_tier,
        subscription_status: usersTable.subscription_status,
        noble_score: usersTable.noble_score,
        is_admin: usersTable.is_admin,
        suspended_at: usersTable.suspended_at,
        created_at: usersTable.created_at,
        language_code: usersTable.language_code,
        country_of_origin: usersTable.country_of_origin,
        active_region: usersTable.active_region,
        objectives: usersTable.objectives,
        onboarding_completed: usersTable.onboarding_completed,
      })
      .from(usersTable)
      .where(whereClause)
      .orderBy(desc(usersTable.created_at))
      .limit(limit)
      .offset(offset);

    const total = totalRow?.total ?? 0;
    return res.json({ users: rows, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    req.log.error({ err }, "Admin: failed to list users");
    return res.status(500).json({ error: "A difficulty arose listing users." });
  }
});

/** GET /admin/users/:id — get full user detail */
router.get("/admin/users/:id", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!user) return res.status(404).json({ error: "User not found." });
    const { session_token: _st, verification_token: _vt, ...safeUser } = user;
    return res.json(safeUser);
  } catch (err) {
    req.log.error({ err }, "Admin: failed to get user");
    return res.status(500).json({ error: "A difficulty arose retrieving the user." });
  }
});

const PatchUserBodySchema = z.object({
  email_verified: z.boolean().optional(),
  suspended_at: z.string().nullable().optional(),
  subscription_tier: z.enum(["guest", "traveller", "ambassador"]).optional(),
  subscription_status: z.string().optional(),
  is_admin: z.boolean().optional(),
});

/** PATCH /admin/users/:id — update user status / tier */
router.patch("/admin/users/:id", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const parsed = PatchUserBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid data provided.", details: parsed.error.flatten().fieldErrors });
    }

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: "User not found." });

    const data = parsed.data;
    const updatePayload: Record<string, unknown> = {};
    if (data.email_verified !== undefined) updatePayload.email_verified = data.email_verified;
    if (data.suspended_at !== undefined) {
      updatePayload.suspended_at = data.suspended_at ? new Date(data.suspended_at) : null;
    }
    if (data.subscription_tier !== undefined) updatePayload.subscription_tier = data.subscription_tier;
    if (data.subscription_status !== undefined) updatePayload.subscription_status = data.subscription_status;
    if (data.is_admin !== undefined) updatePayload.is_admin = data.is_admin;

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({ error: "No updatable fields were provided." });
    }

    const [updated] = await db
      .update(usersTable)
      .set(updatePayload)
      .where(eq(usersTable.id, id))
      .returning();

    const { session_token: _st, verification_token: _vt, ...safeUser } = updated;
    return res.json(safeUser);
  } catch (err) {
    req.log.error({ err }, "Admin: failed to patch user");
    return res.status(500).json({ error: "A difficulty arose updating the user." });
  }
});

/** PATCH /admin/users/:id/suspend — suspend a user account */
router.patch("/admin/users/:id/suspend", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: "User not found." });

    const [updated] = await db
      .update(usersTable)
      .set({ suspended_at: new Date() })
      .where(eq(usersTable.id, id))
      .returning();

    const { session_token: _st, verification_token: _vt, ...safeUser } = updated;
    return res.json(safeUser);
  } catch (err) {
    req.log?.error({ err }, "Admin: failed to suspend user");
    return res.status(500).json({ error: "A difficulty arose suspending the user." });
  }
});

/** PATCH /admin/users/:id/unsuspend — reinstate a suspended user */
router.patch("/admin/users/:id/unsuspend", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: "User not found." });

    const [updated] = await db
      .update(usersTable)
      .set({ suspended_at: null })
      .where(eq(usersTable.id, id))
      .returning();

    const { session_token: _st, verification_token: _vt, ...safeUser } = updated;
    return res.json(safeUser);
  } catch (err) {
    req.log?.error({ err }, "Admin: failed to unsuspend user");
    return res.status(500).json({ error: "A difficulty arose reinstating the user." });
  }
});

/** DELETE /admin/users/:id — permanently remove a user and all their data */
router.delete("/admin/users/:id", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const requesterId = (req as Request & { resolvedUserId: string }).resolvedUserId;

    if (id === requesterId) {
      return res.status(400).json({ error: "An administrator may not delete their own account through this endpoint." });
    }

    const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: "User not found." });

    await db.transaction(async (tx) => {
      await tx.delete(nobleScoreLogTable).where(eq(nobleScoreLogTable.user_id, id));
      await tx.delete(zuil_voortgangTable).where(eq(zuil_voortgangTable.user_id, id));
      await tx.delete(usersTable).where(eq(usersTable.id, id));
    });

    return res.json({ message: "The user's record has been permanently removed." });
  } catch (err) {
    req.log?.error({ err }, "Admin: failed to delete user");
    return res.status(500).json({ error: "A difficulty arose deleting the user." });
  }
});

// ── Content Management ────────────────────────────────────────────────────────

/** GET /admin/content/status — row counts + translation coverage per table */
router.get("/admin/content/status", requireAdmin, async (req, res) => {
  try {
    const [scenarios] = await db.select({ total: count() }).from(scenariosTable);
    const [protocols] = await db.select({ total: count() }).from(cultureProtocolsTable);
    const [regions] = await db.select({ total: count() }).from(compassRegionsTable);

    const translationsByLang = await db
      .select({ lang: translationsTable.language_code, total: count() })
      .from(translationsTable)
      .groupBy(translationsTable.language_code);

    // Scenario translation coverage: count how many have title_i18n for each lang
    const allScenarios = await db
      .select({ title_i18n: sql<Record<string, string> | null>`title_i18n` })
      .from(scenariosTable);

    const scenarioLangs = ["nl", "fr", "de", "es", "pt", "it", "ar", "ja"];
    const scenarioTranslationCoverage: Record<string, number> = {};
    for (const lang of scenarioLangs) {
      scenarioTranslationCoverage[lang] = allScenarios.filter(
        (s) => s.title_i18n && s.title_i18n[lang]
      ).length;
    }

    return res.json({
      scenarios: scenarios.total,
      culture_protocols: protocols.total,
      compass_regions: regions.total,
      translations: translationsByLang.reduce((acc, r) => {
        acc[r.lang] = r.total;
        return acc;
      }, {} as Record<string, number>),
      scenario_translation_coverage: scenarioTranslationCoverage,
      total_scenarios: allScenarios.length,
    });
  } catch (err) {
    req.log?.error({ err }, "Admin: failed to get content status");
    return res.status(500).json({ error: "A difficulty arose retrieving content status." });
  }
});

/** POST /admin/content/seed — trigger idempotent seed scripts */
router.post("/admin/content/seed", requireAdmin, async (req, res) => {
  try {
    const results: string[] = [];
    let anyFailed = false;

    const run = async (label: string, cmd: string, timeoutMs = 120_000) => {
      try {
        const { stdout, stderr } = await execAsync(cmd, {
          cwd: WORKSPACE_ROOT,
          env: { ...process.env },
          timeout: timeoutMs,
        });
        results.push(`[${label}] OK\n${stdout.trim()}`);
        if (stderr.trim()) results.push(`[${label}] stderr: ${stderr.trim()}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push(`[${label}] ERROR: ${msg}`);
        anyFailed = true;
      }
    };

    try {
      await runAtelierSeed();
      results.push("[Atelier] OK");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push(`[Atelier] ERROR: ${msg}`);
      anyFailed = true;
    }

    try {
      await runCompassSeed();
      results.push("[Compass] OK");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push(`[Compass] ERROR: ${msg}`);
      anyFailed = true;
    }

    await run("Translations", "node scripts/seed-translations.mjs");
    await run("Admin", "node scripts/ensure-admin.mjs");
    await run("Scenario Translations", "node scripts/scenario-translate.mjs", 600_000);

    return res.status(anyFailed ? 207 : 200).json({ ok: !anyFailed, results });
  } catch (err) {
    req.log?.error({ err }, "Admin: seed failed");
    return res.status(500).json({ error: "A difficulty arose triggering the seed." });
  }
});

// ── JSON Bulk Import ──────────────────────────────────────────────────────────

const ScenarioImportSchema = z.object({
  title: z.string().min(1),
  pillar: z.number().int().min(1).max(5),
  region_code: z.string().length(2),
  age_group: z.string().default("all"),
  gender_applicability: z.string().default("all"),
  context: z.string().default("social"),
  difficulty_level: z.number().int().min(1).max(5).default(1),
  estimated_minutes: z.number().int().min(1).max(60).default(5),
  noble_score_impact: z.number().int().min(1).max(20).default(5),
  bolton_cluster: z.number().int().min(1).max(3).nullable().optional(),
  behavioral_tags: z.array(z.string()).optional().default([]),
  correction_style: z.string().nullable().optional(),
  content_json: z.object({
    situation: z.string().min(1),
    question: z.string().min(1),
    options: z.array(z.object({
      text: z.string().min(1),
      correct: z.boolean(),
      explanation: z.string().min(1),
      behavior_signal: z.string().optional(),
    })).min(2).max(6),
  }),
});

const CompassRegionImportSchema = z.object({
  region_code: z.string().length(2),
  flag_emoji: z.string().optional(),
  content: z.record(z.string(), z.unknown()),
});

const BulkImportBodySchema = z.object({
  type: z.enum(["scenarios", "compass_regions"]),
  items: z.array(z.unknown()).min(1).max(500),
});

/** POST /admin/content/import — bulk upsert scenarios or compass regions from JSON */
router.post("/admin/content/import", requireAdmin, async (req, res) => {
  try {
    const parsed = BulkImportBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid import payload.",
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { type, items } = parsed.data;
    let inserted = 0;
    const errors: string[] = [];

    const newScenarioIds: number[] = [];

    if (type === "scenarios") {
      for (let i = 0; i < items.length; i++) {
        const result = ScenarioImportSchema.safeParse(items[i]);
        if (!result.success) {
          errors.push(`Item ${i}: ${JSON.stringify(result.error.flatten().fieldErrors)}`);
          continue;
        }
        const rows = await db
          .insert(scenariosTable)
          .values(result.data)
          .onConflictDoNothing({ target: [scenariosTable.region_code, scenariosTable.pillar, scenariosTable.title] })
          .returning({ id: scenariosTable.id });
        if (rows.length > 0) {
          newScenarioIds.push(rows[0].id);
          inserted++;
        }
      }

      // Spawn translation worker in the background for newly inserted scenarios only
      if (newScenarioIds.length > 0) {
        const minId = Math.min(...newScenarioIds);
        const maxId = Math.max(...newScenarioIds);
        const child = spawn(
          "node",
          ["scripts/scenario-translate.mjs", "--from", String(minId), "--to", String(maxId)],
          { cwd: WORKSPACE_ROOT, env: { ...process.env }, detached: true, stdio: "ignore" },
        );
        child.unref();
        req.log?.info({ newScenarioIds, minId, maxId }, "Admin: scenario translate worker spawned in background");
      }
    } else if (type === "compass_regions") {
      for (let i = 0; i < items.length; i++) {
        const result = CompassRegionImportSchema.safeParse(items[i]);
        if (!result.success) {
          errors.push(`Item ${i}: ${JSON.stringify(result.error.flatten().fieldErrors)}`);
          continue;
        }
        const { region_code, flag_emoji, content } = result.data;
        const typedContent = content as CompassLocaleMap;
        await db
          .insert(compassRegionsTable)
          .values({ region_code, flag_emoji: flag_emoji ?? "", content: typedContent })
          .onConflictDoUpdate({
            target: compassRegionsTable.region_code,
            set: {
              content: typedContent,
              ...(flag_emoji ? { flag_emoji } : {}),
            },
          });
        inserted++;
      }
    }

    return res.json({
      ok: true,
      inserted,
      errors_count: errors.length,
      errors: errors.slice(0, 20),
      ...(newScenarioIds.length > 0 && {
        translation_queued: true,
        translation_scenario_ids: newScenarioIds,
        translation_note: "Translations into 8 languages are being generated in the background. This may take a few minutes.",
      }),
    });
  } catch (err) {
    req.log?.error({ err }, "Admin: import failed");
    return res.status(500).json({ error: "A difficulty arose during bulk import." });
  }
});

// ── CC Screening Worker ────────────────────────────────────────────────────────

const CC_SYSTEM_PROMPT = `Je bent de CC-Screening-Worker voor het project Context & Courtesy.

## Absolute gedragsregels
- NOOIT letterlijke tekst overnemen uit het bronwerk — enkel parafraseren
- ALTIJD in C&C-stem schrijven: discrete, hoogopgeleide mentor; correcties als suggestie, nooit als veroordeling
- ALTIJD het 5-Zuilen-schema volgen (Z1–Z5)
- NOOIT interpretaties toevoegen — enkel wat de bron stelt
- ALTIJD broncode meegeven (source_book + source_page)

## Het 5-Zuilen-schema
- Z1 · Cultuur & Traditie: religious_impact, holidays, gift_giving, taboos, color_symbolism, alternative_behavior
- Z2 · Interactie & Taal: forms_of_address, greeting_ritual, communication_context, safe_smalltalk, topics_to_avoid, nonverbal_style
- Z3 · Tafelmanieren: cutlery_use, seating_order, payment_ritual, consumption_sounds, table_posture, wine_and_drinks
- Z4 · Relaties & Status: gender_nuances, seniority_business, hierarchy_social, networking, relationship_gifts, conflict_face_saving
- Z5 · Verschijning: dress_code_business, dress_code_social, modest_dress, eye_contact_personal_space, touch_etiquette, accessories_symbols

## Persona-matrix
- P1: 18–30 jaar · Sociale navigatie & zelfverzekerdheid · Modern-beleefd
- P2: 30–55 jaar · Leiderschap & professionele excellentie · Elegant-strak
- P3: 55+ jaar · Protocol & culturele nuances · Klassiek-formeel

## Module-mapping
- GYM: Interactieve oefening / scenario
- AID: Directe 30-seconden hulp ter plaatse (First Aid)
- CMP: Cultureel advies & vergelijking (Cultural Compass)

## Bronnenregister
- DH: Debrett's Handbook (UK)
- AV: Amy Vanderbilt Complete Book of Etiquette (Universeel West)
- ME: Modern Etiquette for a Better Life (Universeel West)
- MG: Guide to the Modern Gentleman (UK)
- DN: Debrett's New Guide to Etiquette & Modern Manners (UK)
- CB: Chinese Business Etiquette (China)
- CA: Culture Smart! Australia (Australia)
- CM: The Culture Map (Cross-cultureel)

## C&C Stemvoorbeelden
- Z1: ❌ "Never give clocks in China" → ✅ "Een attente gast in China kiest bij een cadeau zorgvuldig — uurwerken dragen een symbolische connotatie die het beter vermijdt."
- Z2: ❌ "Don't interrupt in Japan" → ✅ "In een Japans gesprek onderstreept een moment van stilte de ernst van uw overweging — haast u niet om de stilte te vullen."
- Z3: ❌ "Always wait for the host" → ✅ "Een verfijnde gast wacht geduldig tot de gastheer het eerste gebaar maakt alvorens met de maaltijd aan te vangen."
- Z4: ❌ "Never correct in public in China" → ✅ "Een diplomatiek leider reserveert constructieve feedback voor een discrete, één-op-één setting."

## 10-stappen workflow
Stap 1: Identificeer boek en pagina (source_book, source_page)
Stap 2: Bepaal regio (UK / CN / CA / AU / UNIVERSAL)
Stap 3: Classificeer onder Zuil (Z1–Z5)
Stap 4: Bepaal subcategorie
Stap 5: Parafraseer ruwe feit (rule_raw) — GEEN citaat
Stap 6: Schrijf C&C mentor-formulering (rule_cc)
Stap 7: Wijs persona's toe (P1/P2/P3)
Stap 8: Wijs modules toe (GYM/AID/CMP)
Stap 9: Stel urgentie in (1=nice-to-know, 2=belangrijk, 3=kritisch/taboe)
Stap 10: Output JSON

## Foutmeldingen
- Fragment onduidelijk → antwoord met: {"error": "UNCLEAR", "message": "Fragment is te vaag. Verduidelijk de context."}
- Geen etiquetteregel → antwoord met: {"error": "NO_RULE", "message": "Geen extraheerbare etiquetteregel gevonden in dit fragment."}
- Letterlijk citaat detectie → antwoord met: {"error": "COPYRIGHT", "message": "Auteursrechtveiligheid: parafraseer eerst het fragment zelf."}
- Ambigu zuil → voeg toe: "_note": "ook relevant voor Zx"

## Output JSON formaat (antwoord UITSLUITEND met geldig JSON, geen andere tekst)
{
  "source_book": "<code>",
  "source_page": "<pagina>",
  "region": "<UK|CN|CA|AU|UNIVERSAL>",
  "pillar_code": "<Z1|Z2|Z3|Z4|Z5>",
  "subcategory": "<subcategorie>",
  "rule_raw": "<korte parafrase van de ruwe feit — intern gebruik>",
  "rule_cc": "<C&C mentor-formulering — app-tekst>",
  "personas": ["P1", "P2"],
  "modules_cc": ["GYM", "AID"],
  "urgency": 2,
  "verified": false
}`;

const CCScreenRequestSchema = z.object({
  fragment: z.string().min(10).max(5000),
  source_book: z.enum(["DH", "AV", "ME", "MG", "DN", "CB", "CA", "CM"]),
  source_page: z.string().min(1).max(20),
});

const CCSaveRequestSchema = z.object({
  source_book: z.string(),
  source_page: z.string(),
  region: z.string(),
  pillar_code: z.string(),
  subcategory: z.string(),
  rule_raw: z.string(),
  rule_cc: z.string(),
  personas: z.array(z.string()),
  modules_cc: z.array(z.string()),
  urgency: z.number().int().min(1).max(3),
  verified: z.boolean().default(false),
  _note: z.string().optional(),
});

/** POST /admin/cc-screen — run CC Screening Worker on a text fragment */
router.post("/admin/cc-screen", requireAdmin, async (req, res) => {
  try {
    const parsed = CCScreenRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request.", details: parsed.error.flatten().fieldErrors });
    }

    const { fragment, source_book, source_page } = parsed.data;
    const anthropicBase = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
    const anthropicKey  = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
    if (!anthropicBase || !anthropicKey) {
      return res.status(503).json({ error: "AI integration not configured." });
    }

    const userMessage = `Verwerk het volgende tekstfragment uit bronboek ${source_book}, pagina ${source_page}:

---
${fragment}
---

Volg de 10-stappen workflow en geef de output als geldig JSON-object.`;

    const aiResponse = await fetch(`${anthropicBase}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 2000,
        temperature: 0.2,
        system: CC_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      req.log?.error({ status: aiResponse.status, errText }, "CC Screening: AI call failed");
      return res.status(502).json({ error: "AI service error." });
    }

    const aiData = await aiResponse.json() as { content: Array<{ text: string }> };
    const rawText = aiData.content?.[0]?.text?.trim() ?? "";

    // Extract JSON from response (handle markdown fences)
    let jsonText = rawText;
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonText = jsonMatch[0];
    else jsonText = rawText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

    let parsed2: Record<string, unknown>;
    try {
      parsed2 = JSON.parse(jsonText);
    } catch {
      return res.status(422).json({ error: "AI returned invalid JSON.", raw: rawText.substring(0, 500) });
    }

    // Handle AI-reported errors
    if (typeof parsed2.error === "string") {
      return res.status(422).json({ error: parsed2.error, message: parsed2.message });
    }

    // ── Quality validation ─────────────────────────────────────────────────────
    const warnings: string[] = [];

    // 1. rule_cc must not be empty
    if (!parsed2.rule_cc || typeof parsed2.rule_cc !== "string" || (parsed2.rule_cc as string).length < 10) {
      return res.status(422).json({ error: "INVALID_OUTPUT", message: "rule_cc is missing or too short." });
    }

    // 2. rule_raw must not be empty
    if (!parsed2.rule_raw || typeof parsed2.rule_raw !== "string" || (parsed2.rule_raw as string).length < 5) {
      return res.status(422).json({ error: "INVALID_OUTPUT", message: "rule_raw is missing or too short." });
    }

    // 3. Copyright heuristic — check if rule_cc contains long quoted sequences from fragment
    const fragmentWords = fragment.toLowerCase().split(/\s+/);
    const ruleCcWords = (parsed2.rule_cc as string).toLowerCase().split(/\s+/);
    let consecutiveMatches = 0;
    let maxConsecutive = 0;
    for (const word of ruleCcWords) {
      if (fragmentWords.includes(word) && word.length > 4) {
        consecutiveMatches++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveMatches);
      } else {
        consecutiveMatches = 0;
      }
    }
    if (maxConsecutive >= 8) {
      warnings.push("rule_cc may contain near-literal text from the source. Review before saving.");
    }

    // 4. Urgency validation
    const urgency = Number(parsed2.urgency);
    if (!Number.isInteger(urgency) || urgency < 1 || urgency > 3) {
      return res.status(422).json({ error: "INVALID_OUTPUT", message: "urgency must be 1, 2, or 3." });
    }

    // 5. verified must always be false
    parsed2.verified = false;

    // 6. Pillar validation
    const validPillars = ["Z1", "Z2", "Z3", "Z4", "Z5"];
    if (!validPillars.includes(parsed2.pillar_code as string)) {
      return res.status(422).json({ error: "INVALID_OUTPUT", message: `pillar_code must be one of ${validPillars.join(", ")}.` });
    }

    // 7. Region must be specific (not continent-level)
    const validRegions = ["UK", "CN", "CA", "AU", "UNIVERSAL", "US", "FR", "DE", "JP", "AE"];
    if (!validRegions.includes((parsed2.region as string)?.toUpperCase())) {
      warnings.push(`region '${parsed2.region}' is not a recognised code — use UNIVERSAL or verify.`);
    }

    return res.json({ ok: true, record: parsed2, warnings });
  } catch (err) {
    req.log?.error({ err }, "CC Screening: unexpected error");
    return res.status(500).json({ error: "A difficulty arose processing the fragment." });
  }
});

/** POST /admin/cc-save — persist an approved CC record to culture_protocols */
router.post("/admin/cc-save", requireAdmin, async (req, res) => {
  try {
    const parsed = CCSaveRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid record.", details: parsed.error.flatten().fieldErrors });
    }

    const data = parsed.data;

    // Map pillar_code (Z1–Z5) to integer for legacy pillar column
    const pillarCodeToInt: Record<string, number> = { Z1: 1, Z2: 2, Z3: 3, Z4: 4, Z5: 5 };
    const pillarInt = pillarCodeToInt[data.pillar_code] ?? 0;

    // Build a unique rule_type from subcategory + first words of rule_raw
    const ruleTypeSlug = `${data.subcategory}_${Date.now()}`;

    const [inserted] = await db.insert(cultureProtocolsTable).values({
      region_code: data.region,
      pillar: pillarInt,
      rule_type: ruleTypeSlug,
      rule_description: data.rule_cc,
      source_reference: `${data.source_book}:${data.source_page}`,
      // CC fields
      source_book: data.source_book,
      source_page: data.source_page,
      pillar_code: data.pillar_code,
      subcategory: data.subcategory,
      rule_raw: data.rule_raw,
      rule_cc: data.rule_cc,
      personas: data.personas,
      modules_cc: data.modules_cc,
      urgency: data.urgency,
      verified: false,
    }).returning();

    return res.json({ ok: true, id: inserted.id });
  } catch (err) {
    req.log?.error({ err }, "CC Save: failed to persist record");
    return res.status(500).json({ error: "A difficulty arose saving the record." });
  }
});

export default router;
