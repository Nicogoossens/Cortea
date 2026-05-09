import { Router, type Request } from "express";
import { readFileSync } from "fs";
import path from "path";
import { db } from "@workspace/db";
import { cultureProtocolsTable, usersTable, ccProtocolRemovalsTable, CC_SUBCATEGORIES } from "@workspace/db";
import { eq, sql, count, and, desc } from "drizzle-orm";
import { z } from "zod";
import { calibrateI18nMap, type CalibrationModule } from "../../lib/register-calibration.js";
import { requireAdmin } from "./require-admin.js";

const router = Router();

// ── CC Screening Worker ────────────────────────────────────────────────────────

function loadCCHandbook(): string {
  const handbookPath = path.resolve(process.cwd(), "../../docs/CC_Screening_Worker.md");
  try {
    const handbookContent = readFileSync(handbookPath, "utf-8");
    return `Je bent de CC-Screening-Worker voor het project Context & Courtesy.
Je gedragsregels, classificatieschema en outputformaat staan volledig beschreven in je kennisbank hieronder.
Volg altijd de 10-stappen workflow. Reageer uitsluitend in het gevraagde JSON-formaat, tenzij je om verduidelijking moet vragen.
Schrijf nooit letterlijke boektekst over.

## Uitvoer JSON formaat (antwoord UITSLUITEND met geldig JSON, geen andere tekst)
{
  "source_book": "<code>",
  "source_page": "<pagina>",
  "region": "<UK|CN|CA|AU|UNIVERSAL>",
  "pillar": "<Z1|Z2|Z3|Z4|Z5>",
  "subcategory": "<subcategorie>",
  "rule_raw": "<korte parafrase van de ruwe feit — intern gebruik>",
  "rule_cc": "<C&C mentor-formulering — app-tekst>",
  "personas": ["P1", "P2"],
  "modules": ["GYM", "AID"],
  "urgency": 2,
  "verified": false
}

## Foutmeldingen (gebruik deze exacte JSON structuur)
- Fragment onduidelijk → {"error": "UNCLEAR", "message": "Fragment is te vaag. Verduidelijk de context."}
- Geen etiquetteregel → {"error": "NO_RULE", "message": "Geen extraheerbare etiquetteregel gevonden in dit fragment."}
- Letterlijk citaat → {"error": "COPYRIGHT", "message": "Auteursrechtveiligheid: parafraseer eerst het fragment zelf."}

## Kennisbank (volledig handbook)
${handbookContent}`;
  } catch {
    return `Je bent de CC-Screening-Worker voor het project Context & Courtesy.
Extraheer etiquetteregels uit boekteksten naar het 5-Zuilen-schema (Z1-Z5).
Antwoord UITSLUITEND met geldig JSON conform het outputformaat:
{"source_book":"<code>","source_page":"<pagina>","region":"<UK|CN|CA|AU|UNIVERSAL>","pillar":"<Z1|Z2|Z3|Z4|Z5>","subcategory":"<sub>","rule_raw":"<parafrase>","rule_cc":"<C&C stem>","personas":["P1","P2","P3"],"modules":["GYM","AID","CMP"],"urgency":2,"verified":false}`;
  }
}

const CC_SYSTEM_PROMPT = loadCCHandbook();

const CCScreenRequestSchema = z.object({
  fragment: z.string().min(10).max(5000),
  source_book: z.enum(["DH", "AV", "ME", "MG", "DN", "CB", "CA", "CM"]),
  source_page: z.string().min(1).max(20),
});

const CC_VALID_PILLARS = ["Z1", "Z2", "Z3", "Z4", "Z5"] as const;
const CC_VALID_REGIONS = ["UK", "CN", "CA", "AU", "UNIVERSAL", "US", "FR", "DE", "JP", "AE"] as const;
const CC_VALID_PERSONAS = ["P1", "P2", "P3"] as const;
const CC_VALID_MODULES = ["GYM", "AID", "CMP"] as const;

const CCSaveRequestSchema = z.object({
  source_book: z.enum(["DH", "AV", "ME", "MG", "DN", "CB", "CA", "CM"]),
  source_page: z.string().min(1).max(20),
  region: z.string().min(2).max(20),
  pillar: z.enum(CC_VALID_PILLARS),
  subcategory: z.string().min(1).max(100),
  rule_raw: z.string().min(5).max(2000),
  rule_cc: z.string().min(10).max(2000),
  personas: z.array(z.enum(CC_VALID_PERSONAS)).min(1),
  modules: z.array(z.enum(CC_VALID_MODULES)).min(1),
  urgency: z.number().int().min(1).max(3),
  _note: z.string().optional(),
});

// ── CC Translation helper ─────────────────────────────────────────────────────

const CC_TARGET_LANGUAGES: Record<string, string> = {
  nl: "Dutch",
  fr: "French",
  de: "German",
  es: "Spanish",
  pt: "Portuguese",
  it: "Italian",
  ar: "Arabic",
  ja: "Japanese",
  zh: "Chinese (Simplified Mandarin)",
};

async function translateRuleCc(
  ruleCc: string,
  pillarCode: string,
  subcategory: string,
  req: Request,
): Promise<Record<string, string>> {
  const anthropicBase = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const anthropicKey  = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  if (!anthropicBase || !anthropicKey) return {};

  const languageList = Object.entries(CC_TARGET_LANGUAGES)
    .map(([code, name]) => `"${code}": "${name}"`)
    .join(", ");

  const systemPrompt = `You are a professional cultural etiquette translator.
You translate etiquette rules from English into multiple languages.
Rules:
- Preserve the mentor/coaching tone of the original
- Keep proper nouns and culture-specific terms as-is
- Output ONLY valid JSON, no other text
- Each translation must be natural, idiomatic, and accurate`;

  const userMessage = `Translate this etiquette rule (pillar: ${pillarCode}, subcategory: ${subcategory}) into the following languages.
Return ONLY a JSON object with language codes as keys.

Rule (English): "${ruleCc}"

Target languages: { ${languageList} }

Expected output format:
{
  "nl": "<Dutch translation>",
  "fr": "<French translation>",
  "de": "<German translation>",
  "es": "<Spanish translation>",
  "pt": "<Portuguese translation>",
  "it": "<Italian translation>",
  "ar": "<Arabic translation>",
  "ja": "<Japanese translation>",
  "zh": "<Chinese translation>"
}`;

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
      temperature: 0.1,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!aiResponse.ok) {
    req.log?.warn({ status: aiResponse.status }, "CC Translation: AI call failed");
    return {};
  }

  const aiData = await aiResponse.json() as { content: Array<{ text: string }> };
  const rawText = aiData.content?.[0]?.text?.trim() ?? "";

  let jsonText = rawText;
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (jsonMatch) jsonText = jsonMatch[0];

  try {
    const parsed = JSON.parse(jsonText) as Record<string, unknown>;
    const result: Record<string, string> = {};
    for (const lang of Object.keys(CC_TARGET_LANGUAGES)) {
      if (typeof parsed[lang] === "string" && (parsed[lang] as string).length > 0) {
        result[lang] = parsed[lang] as string;
      }
    }
    req.log?.info({ langs: Object.keys(result) }, "CC Translation: completed");
    return result;
  } catch {
    req.log?.warn({ rawText: rawText.substring(0, 300) }, "CC Translation: could not parse AI JSON");
    return {};
  }
}

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

    if (typeof parsed2.error === "string") {
      return res.status(422).json({ error: parsed2.error, details: parsed2.message });
    }

    const warnings: string[] = [];

    if (!parsed2.rule_cc || typeof parsed2.rule_cc !== "string" || (parsed2.rule_cc as string).length < 10) {
      return res.status(422).json({ error: "INVALID_OUTPUT", details: "rule_cc is missing or too short." });
    }

    if (!parsed2.rule_raw || typeof parsed2.rule_raw !== "string" || (parsed2.rule_raw as string).length < 5) {
      return res.status(422).json({ error: "INVALID_OUTPUT", details: "rule_raw is missing or too short." });
    }

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

    const urgency = Number(parsed2.urgency);
    if (!Number.isInteger(urgency) || urgency < 1 || urgency > 3) {
      return res.status(422).json({ error: "INVALID_OUTPUT", details: "urgency must be 1, 2, or 3." });
    }
    if (urgency === 3) {
      warnings.push("Urgency 3 (kritisch) — per spec mag max 20% van de regels in een batch urgency=3 hebben. Controleer dit voor bulk-opslag.");
    }

    parsed2.verified = false;

    const pillarVal = (parsed2.pillar ?? parsed2.pillar_code) as string;
    if (!CC_VALID_PILLARS.includes(pillarVal as typeof CC_VALID_PILLARS[number])) {
      return res.status(422).json({ error: "INVALID_OUTPUT", details: `pillar must be one of ${CC_VALID_PILLARS.join(", ")}.` });
    }
    parsed2.pillar = pillarVal;
    delete parsed2.pillar_code;

    const regionUpper = (parsed2.region as string)?.toUpperCase();
    if (!CC_VALID_REGIONS.includes(regionUpper as typeof CC_VALID_REGIONS[number])) {
      warnings.push(`region '${parsed2.region}' is not a recognised code — use UNIVERSAL or verify.`);
    }

    if (!parsed2.modules && parsed2.modules_cc) {
      parsed2.modules = parsed2.modules_cc;
      delete parsed2.modules_cc;
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

    if (!CC_VALID_PILLARS.includes(data.pillar)) {
      return res.status(400).json({ error: "VALIDATION_FAILED", details: `pillar must be one of ${CC_VALID_PILLARS.join(", ")}.` });
    }

    const regionUp = data.region.toUpperCase();
    if (!CC_VALID_REGIONS.includes(regionUp as typeof CC_VALID_REGIONS[number])) {
      return res.status(400).json({ error: "VALIDATION_FAILED", details: `region '${data.region}' is not a recognised code. Use UNIVERSAL or a valid country code.` });
    }

    const validSubcategories = CC_SUBCATEGORIES[data.pillar as keyof typeof CC_SUBCATEGORIES] ?? [];
    if (!validSubcategories.includes(data.subcategory)) {
      return res.status(400).json({ error: "VALIDATION_FAILED", details: `subcategory '${data.subcategory}' is not valid for pillar ${data.pillar}. Valid: ${validSubcategories.join(", ")}.` });
    }

    if (data.personas.length === 0) {
      return res.status(400).json({ error: "VALIDATION_FAILED", details: "At least one persona must be assigned." });
    }

    if (data.modules.length === 0) {
      return res.status(400).json({ error: "VALIDATION_FAILED", details: "At least one module must be assigned." });
    }

    if (data.rule_cc.trim().toLowerCase() === data.rule_raw.trim().toLowerCase()) {
      return res.status(400).json({ error: "VALIDATION_FAILED", details: "rule_cc and rule_raw are identical — rule_cc must be rephrased in C&C mentor style." });
    }

    if (data.urgency === 3) {
      const totalRows = await db.select({ n: count() }).from(cultureProtocolsTable)
        .where(sql`source_book IS NOT NULL`);
      const urgency3Rows = await db.select({ n: count() }).from(cultureProtocolsTable)
        .where(sql`source_book IS NOT NULL AND urgency = 3`);
      const total = totalRows[0]?.n ?? 0;
      const urgent3 = urgency3Rows[0]?.n ?? 0;
      if (total >= 5 && urgent3 / total >= 0.20) {
        return res.status(400).json({
          error: "URGENCY_CAP_EXCEEDED", details: `Max 20% of CC records may be urgency=3. Current: ${urgent3}/${total} (${Math.round(urgent3 / total * 100)}%). Review urgency rating.`,
        });
      }
    }

    const pillarToInt: Record<string, number> = { Z1: 1, Z2: 2, Z3: 3, Z4: 4, Z5: 5 };
    const pillarInt = pillarToInt[data.pillar] ?? 0;

    const ruleTypeSlug = `${data.subcategory}_${Date.now()}`;

    const [inserted] = await db.insert(cultureProtocolsTable).values({
      region_code: regionUp,
      pillar: pillarInt,
      rule_type: ruleTypeSlug,
      rule_description: data.rule_cc,
      source_reference: `${data.source_book}:${data.source_page}`,
      source_book: data.source_book,
      source_page: data.source_page,
      pillar_code: data.pillar,
      subcategory: data.subcategory,
      rule_raw: data.rule_raw,
      rule_cc: data.rule_cc,
      personas: data.personas,
      modules: data.modules,
      urgency: data.urgency,
      verified: false,
    }).returning();

    let translations: Record<string, string> = {};
    try {
      translations = await translateRuleCc(data.rule_cc, data.pillar, data.subcategory, req);
      if (Object.keys(translations).length > 0) {
        await db
          .update(cultureProtocolsTable)
          .set({ rule_cc_i18n: translations })
          .where(eq(cultureProtocolsTable.id, inserted.id));
      }
    } catch (translErr) {
      req.log?.warn({ translErr, id: inserted.id }, "CC Save: translation step failed — record saved without translations");
    }

    if (Object.keys(translations).length > 0) {
      const ccId = inserted.id;
      void calibrateI18nMap(translations, "standard" as CalibrationModule)
        .then(async (cal) => {
          if (cal.changed) {
            await db
              .update(cultureProtocolsTable)
              .set({ rule_cc_i18n: cal.calibrated })
              .where(eq(cultureProtocolsTable.id, ccId));
          }
          req.log?.info(
            { ccId, unchanged: cal.unchanged, rewritten: cal.rewritten, errors: cal.errors },
            "CC Save: register calibration completed"
          );
        })
        .catch((calErr) => {
          req.log?.warn({ calErr, ccId }, "CC Save: register calibration failed");
        });
    }

    return res.json({ ok: true, id: inserted.id, translations });
  } catch (err) {
    req.log?.error({ err }, "CC Save: failed to persist record");
    return res.status(500).json({ error: "A difficulty arose saving the record." });
  }
});

// ── CC Protocol Review (Pending Verification) ─────────────────────────────────

/** GET /admin/cc-protocols — list unverified CC-extracted records for editorial review */
router.get("/admin/cc-protocols", requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const [{ total }] = await db
      .select({ total: count() })
      .from(cultureProtocolsTable)
      .where(sql`verified = false AND source_book IS NOT NULL`);

    const rows = await db
      .select({
        id: cultureProtocolsTable.id,
        region_code: cultureProtocolsTable.region_code,
        pillar_code: cultureProtocolsTable.pillar_code,
        subcategory: cultureProtocolsTable.subcategory,
        rule_cc: cultureProtocolsTable.rule_cc,
        rule_raw: cultureProtocolsTable.rule_raw,
        urgency: cultureProtocolsTable.urgency,
        source_book: cultureProtocolsTable.source_book,
        source_page: cultureProtocolsTable.source_page,
        source_reference: cultureProtocolsTable.source_reference,
        verified: cultureProtocolsTable.verified,
        created_at: cultureProtocolsTable.created_at,
      })
      .from(cultureProtocolsTable)
      .where(sql`verified = false AND source_book IS NOT NULL`)
      .orderBy(desc(cultureProtocolsTable.urgency), desc(cultureProtocolsTable.created_at))
      .limit(limit)
      .offset(offset);

    return res.json({
      records: rows,
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    req.log?.error({ err }, "Admin: failed to list pending CC protocols");
    return res.status(500).json({ error: "A difficulty arose retrieving pending records." });
  }
});

const PatchCCProtocolBodySchema = z.object({
  approve: z.boolean().optional(),
  rule_cc: z.string().min(1).optional(),
  subcategory: z.string().min(1).optional(),
  urgency: z.number().int().min(1).max(3).optional(),
  region_code: z.string().min(2).max(10).optional(),
});

/** GET /admin/cc-protocols/verified — list verified CC records with reviewer info */
router.get("/admin/cc-protocols/verified", requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const [{ total }] = await db
      .select({ total: count() })
      .from(cultureProtocolsTable)
      .where(sql`verified = true AND source_book IS NOT NULL`);

    const rows = await db
      .select({
        id: cultureProtocolsTable.id,
        region_code: cultureProtocolsTable.region_code,
        pillar_code: cultureProtocolsTable.pillar_code,
        subcategory: cultureProtocolsTable.subcategory,
        rule_cc: cultureProtocolsTable.rule_cc,
        rule_raw: cultureProtocolsTable.rule_raw,
        urgency: cultureProtocolsTable.urgency,
        source_book: cultureProtocolsTable.source_book,
        source_page: cultureProtocolsTable.source_page,
        source_reference: cultureProtocolsTable.source_reference,
        verified: cultureProtocolsTable.verified,
        created_at: cultureProtocolsTable.created_at,
        reviewed_by: cultureProtocolsTable.reviewed_by,
        reviewed_at: cultureProtocolsTable.reviewed_at,
        reviewer_name: usersTable.full_name,
      })
      .from(cultureProtocolsTable)
      .leftJoin(usersTable, eq(cultureProtocolsTable.reviewed_by, usersTable.id))
      .where(sql`verified = true AND source_book IS NOT NULL`)
      .orderBy(desc(cultureProtocolsTable.reviewed_at))
      .limit(limit)
      .offset(offset);

    return res.json({
      records: rows,
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    req.log?.error({ err }, "Admin: failed to list verified CC protocols");
    return res.status(500).json({ error: "A difficulty arose retrieving verified records." });
  }
});

/** PATCH /admin/cc-protocols/:id — update fields and/or approve a pending CC-extracted record */
router.patch("/admin/cc-protocols/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid record ID." });

    const parsed = PatchCCProtocolBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body.", details: parsed.error.flatten().fieldErrors });
    }

    const body = parsed.data;
    const requesterId = (req as Request & { resolvedUserId: string }).resolvedUserId;

    const [existing] = await db
      .select({ id: cultureProtocolsTable.id, verified: cultureProtocolsTable.verified, source_book: cultureProtocolsTable.source_book })
      .from(cultureProtocolsTable)
      .where(eq(cultureProtocolsTable.id, id))
      .limit(1);

    if (!existing) return res.status(404).json({ error: "Record not found." });
    if (!existing.source_book) {
      return res.status(409).json({ error: "This record is not a CC-extracted record and cannot be managed through this endpoint." });
    }

    const hasFieldUpdates = body.rule_cc !== undefined || body.subcategory !== undefined
      || body.urgency !== undefined || body.region_code !== undefined;
    const shouldApprove = body.approve === true || (!hasFieldUpdates && Object.keys(body).length === 0);

    if (existing.verified) {
      return res.status(409).json({ error: "Record is already verified and can no longer be modified through this endpoint." });
    }

    const updatePayload: Record<string, unknown> = {};
    if (body.rule_cc !== undefined) updatePayload.rule_cc = body.rule_cc;
    if (body.subcategory !== undefined) updatePayload.subcategory = body.subcategory;
    if (body.urgency !== undefined) updatePayload.urgency = body.urgency;
    if (body.region_code !== undefined) updatePayload.region_code = body.region_code.toUpperCase();
    if (shouldApprove) {
      updatePayload.verified = true;
      updatePayload.reviewed_by = requesterId;
      updatePayload.reviewed_at = new Date();
    }

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({ error: "No updatable fields were provided." });
    }

    const whereCondition = and(
      eq(cultureProtocolsTable.id, id),
      sql`source_book IS NOT NULL`,
      eq(cultureProtocolsTable.verified, false),
    );

    const [updated] = await db
      .update(cultureProtocolsTable)
      .set(updatePayload)
      .where(whereCondition)
      .returning({
        id: cultureProtocolsTable.id,
        verified: cultureProtocolsTable.verified,
        rule_cc: cultureProtocolsTable.rule_cc,
        subcategory: cultureProtocolsTable.subcategory,
        urgency: cultureProtocolsTable.urgency,
        region_code: cultureProtocolsTable.region_code,
      });

    if (!updated) {
      return res.status(409).json({ error: "Record not found or is no longer in pending state." });
    }

    if (body.rule_cc !== undefined && updated.rule_cc) {
      const ccId = updated.id;
      const newRuleCc: string = updated.rule_cc;
      const pillarCode = (updated as { pillar_code?: string | null }).pillar_code ?? "Z1";
      const subcat = updated.subcategory ?? "general";
      void (async () => {
        try {
          const fresh = await translateRuleCc(newRuleCc, pillarCode, subcat, req);
          if (Object.keys(fresh).length === 0) return;
          await db
            .update(cultureProtocolsTable)
            .set({ rule_cc_i18n: fresh })
            .where(eq(cultureProtocolsTable.id, ccId));
          const cal = await calibrateI18nMap(fresh, "standard" as CalibrationModule);
          if (cal.changed) {
            await db
              .update(cultureProtocolsTable)
              .set({ rule_cc_i18n: cal.calibrated })
              .where(eq(cultureProtocolsTable.id, ccId));
          }
          req.log?.info(
            { ccId, unchanged: cal.unchanged, rewritten: cal.rewritten, errors: cal.errors },
            "CC Update: re-translation + register calibration completed"
          );
        } catch (e) {
          req.log?.warn({ e, ccId }, "CC Update: re-translation/calibration failed");
        }
      })();
    }

    return res.json({ ok: true, ...updated });
  } catch (err) {
    req.log?.error({ err }, "Admin: failed to update CC protocol");
    return res.status(500).json({ error: "A difficulty arose updating the record." });
  }
});

/** DELETE /admin/cc-protocols/:id — permanently remove a pending CC-extracted record */
router.delete("/admin/cc-protocols/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid record ID." });

    const requesterId = (req as Request & { resolvedUserId: string }).resolvedUserId;

    const [existing] = await db
      .select({
        id: cultureProtocolsTable.id,
        verified: cultureProtocolsTable.verified,
        source_book: cultureProtocolsTable.source_book,
        source_page: cultureProtocolsTable.source_page,
        region_code: cultureProtocolsTable.region_code,
        pillar_code: cultureProtocolsTable.pillar_code,
        subcategory: cultureProtocolsTable.subcategory,
        rule_cc: cultureProtocolsTable.rule_cc,
        rule_raw: cultureProtocolsTable.rule_raw,
        urgency: cultureProtocolsTable.urgency,
      })
      .from(cultureProtocolsTable)
      .where(eq(cultureProtocolsTable.id, id))
      .limit(1);

    if (!existing) return res.status(404).json({ error: "Record not found." });
    if (!existing.source_book) {
      return res.status(409).json({ error: "This record is not a CC-extracted record and cannot be managed through this endpoint." });
    }
    if (existing.verified) {
      return res.status(409).json({ error: "Only pending (unverified) records may be deleted through this endpoint." });
    }

    let deletedId: number | null = null;
    await db.transaction(async (tx) => {
      await tx.insert(ccProtocolRemovalsTable).values({
        protocol_id: existing.id,
        removed_by: requesterId,
        removed_at: new Date(),
        region_code: existing.region_code,
        pillar_code: existing.pillar_code,
        subcategory: existing.subcategory,
        rule_cc: existing.rule_cc,
        rule_raw: existing.rule_raw,
        urgency: existing.urgency,
        source_book: existing.source_book,
        source_page: existing.source_page,
      });

      const [row] = await tx
        .delete(cultureProtocolsTable)
        .where(and(
          eq(cultureProtocolsTable.id, id),
          sql`source_book IS NOT NULL`,
          eq(cultureProtocolsTable.verified, false),
        ))
        .returning({ id: cultureProtocolsTable.id });

      if (!row) throw new Error("RACE_CONDITION");
      deletedId = row.id;
    });

    if (!deletedId) {
      return res.status(409).json({ error: "Record not found or is no longer in pending state." });
    }

    return res.json({ ok: true, message: "Record permanently removed." });
  } catch (err) {
    req.log?.error({ err }, "Admin: failed to delete CC protocol");
    return res.status(500).json({ error: "A difficulty arose deleting the record." });
  }
});

// ── Verified CC records: edit / unverify / delete ─────────────────────────────

const PatchVerifiedCCBodySchema = z.object({
  rule_cc: z.string().min(1).optional(),
  subcategory: z.string().min(1).optional(),
  urgency: z.number().int().min(1).max(3).optional(),
  region_code: z.string().min(2).max(10).optional(),
  unverify: z.boolean().optional(),
});

/** PATCH /admin/cc-protocols/:id/verified — correct fields on or unverify a verified CC record */
router.patch("/admin/cc-protocols/:id/verified", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid record ID." });

    const parsed = PatchVerifiedCCBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body.", details: parsed.error.flatten().fieldErrors });
    }
    const body = parsed.data;
    const requesterId = (req as Request & { resolvedUserId: string }).resolvedUserId;

    const [existing] = await db
      .select({
        id: cultureProtocolsTable.id,
        verified: cultureProtocolsTable.verified,
        source_book: cultureProtocolsTable.source_book,
        pillar_code: cultureProtocolsTable.pillar_code,
        subcategory: cultureProtocolsTable.subcategory,
        rule_cc: cultureProtocolsTable.rule_cc,
        urgency: cultureProtocolsTable.urgency,
        region_code: cultureProtocolsTable.region_code,
      })
      .from(cultureProtocolsTable)
      .where(eq(cultureProtocolsTable.id, id))
      .limit(1);

    if (!existing) return res.status(404).json({ error: "Record not found." });
    if (!existing.source_book) {
      return res.status(409).json({ error: "This record is not a CC-extracted record." });
    }
    if (!existing.verified) {
      return res.status(409).json({ error: "Record is not verified — use the pending endpoint instead." });
    }

    const updatePayload: Record<string, unknown> = {};
    if (body.rule_cc !== undefined) updatePayload.rule_cc = body.rule_cc;
    if (body.subcategory !== undefined) updatePayload.subcategory = body.subcategory;
    if (body.urgency !== undefined) updatePayload.urgency = body.urgency;
    if (body.region_code !== undefined) updatePayload.region_code = body.region_code.toUpperCase();
    if (body.unverify === true) {
      updatePayload.verified = false;
      updatePayload.reviewed_by = null;
      updatePayload.reviewed_at = null;
    }

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({ error: "No updatable fields were provided." });
    }

    const [updated] = await db
      .update(cultureProtocolsTable)
      .set(updatePayload)
      .where(and(
        eq(cultureProtocolsTable.id, id),
        sql`source_book IS NOT NULL`,
        eq(cultureProtocolsTable.verified, true),
      ))
      .returning({
        id: cultureProtocolsTable.id,
        verified: cultureProtocolsTable.verified,
        rule_cc: cultureProtocolsTable.rule_cc,
        subcategory: cultureProtocolsTable.subcategory,
        urgency: cultureProtocolsTable.urgency,
        region_code: cultureProtocolsTable.region_code,
      });

    if (!updated) {
      return res.status(409).json({ error: "Record not found or no longer verified." });
    }

    req.log?.info(
      {
        ccId: id,
        actor: requesterId,
        action: body.unverify === true ? "verified.unverify" : "verified.correct",
        before: {
          rule_cc: existing.rule_cc,
          subcategory: existing.subcategory,
          urgency: existing.urgency,
          region_code: existing.region_code,
        },
        after: {
          rule_cc: updated.rule_cc,
          subcategory: updated.subcategory,
          urgency: updated.urgency,
          region_code: updated.region_code,
          verified: updated.verified,
        },
      },
      "Admin: verified CC protocol mutated",
    );

    if (body.rule_cc !== undefined && updated.rule_cc) {
      const ccId = updated.id;
      const newRuleCc: string = updated.rule_cc;
      const pillarCode = existing.pillar_code ?? "Z1";
      const subcat = updated.subcategory ?? existing.subcategory ?? "general";
      void (async () => {
        try {
          const fresh = await translateRuleCc(newRuleCc, pillarCode, subcat, req);
          if (Object.keys(fresh).length === 0) return;
          await db
            .update(cultureProtocolsTable)
            .set({ rule_cc_i18n: fresh })
            .where(eq(cultureProtocolsTable.id, ccId));
          const cal = await calibrateI18nMap(fresh, "standard" as CalibrationModule);
          if (cal.changed) {
            await db
              .update(cultureProtocolsTable)
              .set({ rule_cc_i18n: cal.calibrated })
              .where(eq(cultureProtocolsTable.id, ccId));
          }
          req.log?.info({ ccId }, "Verified CC: re-translation + register calibration completed");
        } catch (e) {
          req.log?.warn({ e, ccId }, "Verified CC: re-translation/calibration failed");
        }
      })();
    }

    return res.json({ ok: true, ...updated });
  } catch (err) {
    req.log?.error({ err }, "Admin: failed to update verified CC protocol");
    return res.status(500).json({ error: "A difficulty arose updating the record." });
  }
});

/** DELETE /admin/cc-protocols/:id/verified — permanently remove a verified CC record */
router.delete("/admin/cc-protocols/:id/verified", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid record ID." });

    const requesterId = (req as Request & { resolvedUserId: string }).resolvedUserId;

    const [existing] = await db
      .select({
        id: cultureProtocolsTable.id,
        verified: cultureProtocolsTable.verified,
        source_book: cultureProtocolsTable.source_book,
        source_page: cultureProtocolsTable.source_page,
        region_code: cultureProtocolsTable.region_code,
        pillar_code: cultureProtocolsTable.pillar_code,
        subcategory: cultureProtocolsTable.subcategory,
        rule_cc: cultureProtocolsTable.rule_cc,
        rule_raw: cultureProtocolsTable.rule_raw,
        urgency: cultureProtocolsTable.urgency,
      })
      .from(cultureProtocolsTable)
      .where(eq(cultureProtocolsTable.id, id))
      .limit(1);

    if (!existing) return res.status(404).json({ error: "Record not found." });
    if (!existing.source_book) {
      return res.status(409).json({ error: "This record is not a CC-extracted record." });
    }
    if (!existing.verified) {
      return res.status(409).json({ error: "Record is not verified — use the pending endpoint instead." });
    }

    let deletedId: number | null = null;
    await db.transaction(async (tx) => {
      await tx.insert(ccProtocolRemovalsTable).values({
        protocol_id: existing.id,
        removed_by: requesterId,
        removed_at: new Date(),
        region_code: existing.region_code,
        pillar_code: existing.pillar_code,
        subcategory: existing.subcategory,
        rule_cc: existing.rule_cc,
        rule_raw: existing.rule_raw,
        urgency: existing.urgency,
        source_book: existing.source_book,
        source_page: existing.source_page,
      });

      const [row] = await tx
        .delete(cultureProtocolsTable)
        .where(and(
          eq(cultureProtocolsTable.id, id),
          sql`source_book IS NOT NULL`,
          eq(cultureProtocolsTable.verified, true),
        ))
        .returning({ id: cultureProtocolsTable.id });

      if (!row) throw new Error("RACE_CONDITION");
      deletedId = row.id;
    });

    if (!deletedId) {
      return res.status(409).json({ error: "Record not found or no longer verified." });
    }

    return res.json({ ok: true, message: "Verified record permanently removed." });
  } catch (err) {
    req.log?.error({ err }, "Admin: failed to delete verified CC protocol");
    return res.status(500).json({ error: "A difficulty arose deleting the record." });
  }
});

export default router;
