import { Router } from "express";
import { db } from "@workspace/db";
import { cultureProtocolsTable, compassRegionsTable, culturalOriginsTable } from "@workspace/db";
import { eq, and, or, isNull, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const DEFAULT_LOCALE = "en-GB";

function resolveLocaleContent(
  content: Record<string, Record<string, unknown>>,
  locale: string,
): Record<string, unknown> {
  if (content[locale]) return content[locale];
  const base = locale.split("-")[0].toLowerCase();
  if (content[base]) return content[base];
  const variantKey = Object.keys(content).find(
    (k) => k.toLowerCase().startsWith(base + "-"),
  );
  if (variantKey) return content[variantKey];
  if (content[DEFAULT_LOCALE]) return content[DEFAULT_LOCALE];
  if (content["en"]) return content["en"];
  const enKey = Object.keys(content).find((k) => k.toLowerCase().startsWith("en"));
  return enKey ? content[enKey] : {};
}

interface MehrabianWeight {
  nonverbal: number;
  tone: number;
  words: number;
  note: string;
}

const MEHRABIAN_WEIGHTS: Record<string, MehrabianWeight> = {
  JP: { nonverbal: 70, tone: 22, words: 8, note: "Posture, silence, and bowing convey most meaning. Words are secondary." },
  CN: { nonverbal: 60, tone: 30, words: 10, note: "Tone and composed demeanour signal respect. Face is preserved through bearing, not words alone." },
  AE: { nonverbal: 55, tone: 35, words: 10, note: "Physical presence and sincerity of bearing carry great weight. Spiritual composure is observed." },
  IN: { nonverbal: 55, tone: 30, words: 15, note: "Warmth in voice and respectful posture smooth social interactions significantly." },
  SG: { nonverbal: 50, tone: 30, words: 20, note: "Measured, composed behaviour signals education. Economy of expression is valued." },
  FR: { nonverbal: 45, tone: 35, words: 20, note: "Articulate speech and deliberate expression matter. Controlled elegance in gesture and tone." },
  IT: { nonverbal: 50, tone: 35, words: 15, note: "Expressive gesture is natural; manner of dress speaks before words do." },
  BR: { nonverbal: 50, tone: 35, words: 15, note: "Warmth and physical closeness are expected. Animated expression signals genuine engagement." },
  ES: { nonverbal: 48, tone: 37, words: 15, note: "Animated expression and vocal warmth are natural. Tone signals enthusiasm." },
  MX: { nonverbal: 48, tone: 37, words: 15, note: "Warmth in tone and personal greeting carry significant social weight." },
  ZA: { nonverbal: 48, tone: 35, words: 17, note: "Ubuntu is felt through warmth and genuine presence. Engage with your whole bearing." },
  PT: { nonverbal: 45, tone: 35, words: 20, note: "Measured and sincere tone is most trusted. Restraint signals depth of character." },
  AU: { nonverbal: 40, tone: 38, words: 22, note: "Easy, open posture and a relaxed direct tone win trust. Authenticity is paramount." },
  US: { nonverbal: 38, tone: 37, words: 25, note: "Confident body language and animated but controlled voice signal leadership." },
  GB: { nonverbal: 40, tone: 40, words: 20, note: "Composure is all. Restrained gesture and measured tone signal good breeding." },
  DE: { nonverbal: 35, tone: 35, words: 30, note: "Precision of speech is valued above warmth. Sincerity in expression outweighs affability." },
  CA: { nonverbal: 35, tone: 38, words: 27, note: "Clear verbal communication is primary. Direct, polite, precise speech is valued." },
  NL: { nonverbal: 32, tone: 35, words: 33, note: "Direct verbal communication is primary. Words are chosen precisely; meaning lives in the words." },
};

const VALID_SPHERES_CULTURE = ["business", "gastronomy", "arts_culture", "music_entertainment", "formal_events", "lifestyle_wellness", "travel_hospitality"] as const;
const SPHERE_CONTEXTS_CULTURE: Record<string, string[]> = {
  business: ["business", "professional"],
  gastronomy: ["dining", "gastronomy"],
  arts_culture: ["arts", "culture", "formal"],
  music_entertainment: ["entertainment", "social"],
  formal_events: ["formal", "ceremonial"],
  lifestyle_wellness: ["lifestyle", "social"],
  travel_hospitality: ["travel", "hospitality", "social"],
};

const ProtocolsQuerySchema = z.object({
  region_code: z.string().min(1),
  pillar: z.coerce.number().int().min(1).max(5).optional(),
  pillar_code: z.enum(["Z1", "Z2", "Z3", "Z4", "Z5"]).optional(),
  context: z.string().optional(),
  locale: z.string().optional(),
  situational_interests: z.string().optional(),
  verified_only: z.coerce.boolean().optional(),
});

// Maps the integer pillar (1-5) used by legacy records to the CC Screening
// Worker's 5-pillar code (Z1-Z5). Both schemes correspond to the same five
// universal etiquette pillars (Culture, Interaction, Table, Status, Appearance).
const PILLAR_TO_PILLAR_CODE: Record<number, string> = {
  1: "Z1",
  2: "Z2",
  3: "Z3",
  4: "Z4",
  5: "Z5",
};

const RegionCodeParamSchema = z.object({
  regionCode: z.string().min(1).max(10),
});

const CompassQuerySchema = z.object({
  locale: z.string().default(DEFAULT_LOCALE),
  situational_interests: z.string().optional(),
});

router.get("/culture/protocols", async (req, res) => {
  try {
    const parsed = ProtocolsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "A region must be specified to retrieve cultural protocols." });
    }

    const { region_code, pillar, pillar_code, context, locale, situational_interests, verified_only } = parsed.data;
    const conditions = [eq(cultureProtocolsTable.region_code, region_code)];

    // CC Screening records are recognised by source_book IS NOT NULL AND verified = true.
    const verifiedCCExpr = and(
      isNotNull(cultureProtocolsTable.source_book),
      eq(cultureProtocolsTable.verified, true),
    );

    if (verified_only) {
      conditions.push(verifiedCCExpr!);
    }

    if (pillar_code !== undefined) {
      // pillar_code filter targets verified CC records exclusively.
      conditions.push(eq(cultureProtocolsTable.pillar_code, pillar_code));
      conditions.push(verifiedCCExpr!);
    } else if (pillar !== undefined) {
      // Match legacy records by integer pillar OR verified CC records whose
      // pillar_code corresponds to the same pillar (Z1↔1 ... Z5↔5).
      const mappedCode = PILLAR_TO_PILLAR_CODE[pillar];
      conditions.push(
        or(
          eq(cultureProtocolsTable.pillar, pillar),
          and(
            eq(cultureProtocolsTable.pillar_code, mappedCode),
            verifiedCCExpr!,
          )!,
        )!,
      );
    }

    if (context !== undefined) {
      // CC records frequently leave context at its default "general"; keep them
      // in the result set so the Counsel still surfaces verified guidance.
      conditions.push(
        or(
          eq(cultureProtocolsTable.context, context),
          verifiedCCExpr!,
        )!,
      );
    }

    const spheres = (situational_interests ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => (VALID_SPHERES_CULTURE as readonly string[]).includes(s));

    const matchingContexts = new Set<string>();
    for (const sphere of spheres) {
      for (const ctx of SPHERE_CONTEXTS_CULTURE[sphere] ?? []) matchingContexts.add(ctx);
    }

    // CC-derived records (source_book IS NOT NULL) are only visible once verified=true.
    // Legacy curated records (source_book IS NULL) are always visible.
    const verificationGate = or(
      isNull(cultureProtocolsTable.source_book),
      eq(cultureProtocolsTable.verified, true),
    );

    const protocols = await db.select()
      .from(cultureProtocolsTable)
      .where(and(...conditions, verificationGate))
      .orderBy(sql`COALESCE(${cultureProtocolsTable.urgency}, 0) DESC`, cultureProtocolsTable.id);

    // Resolve locale-aware display text
    // lang is the base language code (e.g. "nl" from "nl-NL", "fr" from "fr-FR")
    const lang = locale ? locale.split("-")[0].toLowerCase() : "en";

    const enriched = protocols.map((p) => {
      const i18n = p.rule_cc_i18n as Record<string, string> | null;
      const display_rule =
        (lang !== "en" && i18n?.[lang])
          ? i18n[lang]
          : (p.rule_cc ?? p.rule_description);

      return { ...p, display_rule };
    });

    if (matchingContexts.size > 0) {
      enriched.sort((a, b) => {
        const aMatch = matchingContexts.has(a.context ?? "") ? 0 : 1;
        const bMatch = matchingContexts.has(b.context ?? "") ? 0 : 1;
        return aMatch - bMatch;
      });
    }

    return res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch culture protocols");
    return res.status(500).json({ error: "Cultural protocols are momentarily unavailable. Please allow a moment." });
  }
});

router.get("/culture/compass", async (req, res) => {
  try {
    const queryParsed = CompassQuerySchema.safeParse(req.query);
    const locale = queryParsed.success ? queryParsed.data.locale : DEFAULT_LOCALE;
    const rawSpheres = queryParsed.success ? (queryParsed.data.situational_interests ?? "") : "";

    const matchedSpheres = rawSpheres
      .split(",")
      .map((s) => s.trim())
      .filter((s) => (VALID_SPHERES_CULTURE as readonly string[]).includes(s));

    const rows = await db.select()
      .from(compassRegionsTable)
      .where(eq(compassRegionsTable.is_published, true));

    const entries = rows.map((row) => {
      const content = (row.content as unknown as Record<string, Record<string, unknown>>);
      const has_content = Object.keys(content).length > 0;
      const localeContent = resolveLocaleContent(content, locale);

      // Determine which sphere keys actually have matching content in this specific region.
      // A sphere matches only when at least one of its mapped content fields is non-empty.
      const sphere_highlights: string[] = [];
      for (const sphere of matchedSpheres) {
        const fields = SPHERE_TO_COMPASS_FIELDS[sphere] ?? [];
        const hasContent = fields.some((field) => {
          const value = localeContent[field];
          if (Array.isArray(value)) return value.length > 0;
          return typeof value === "string" && value.length > 0;
        });
        if (hasContent) sphere_highlights.push(sphere);
      }

      return {
        region_code: row.region_code,
        flag_emoji: row.flag_emoji,
        region_name: localeContent.region_name ?? row.region_code,
        core_value: localeContent.core_value ?? "",
        biggest_taboo: localeContent.biggest_taboo ?? "",
        has_content,
        sphere_highlights,
      };
    });

    // Published countries with content first, then coming-soon
    entries.sort((a, b) => (b.has_content ? 1 : 0) - (a.has_content ? 1 : 0));

    return res.json(entries);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch compass");
    return res.status(500).json({ error: "The Cultural Compass is momentarily unavailable." });
  }
});

const SPHERE_TO_COMPASS_FIELDS: Record<string, string[]> = {
  gastronomy: ["dining_etiquette"],
  business: ["language_notes"],
  formal_events: ["dress_code"],
  lifestyle_wellness: ["dos", "donts"],
  arts_culture: ["dos", "donts"],
  travel_hospitality: ["dos", "donts"],
  music_entertainment: ["dos", "donts"],
};

router.get("/culture/compass/:regionCode", async (req, res) => {
  try {
    const paramParsed = RegionCodeParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      return res.status(400).json({ error: "The region code provided is not valid." });
    }

    const queryParsed = CompassQuerySchema.safeParse(req.query);
    const locale = queryParsed.success ? queryParsed.data.locale : DEFAULT_LOCALE;
    const rawSpheres = queryParsed.success ? (queryParsed.data.situational_interests ?? "") : "";
    const spheres = rawSpheres.split(",").map((s) => s.trim()).filter(Boolean);

    const regionCode = paramParsed.data.regionCode.toUpperCase();

    const rows = await db.select()
      .from(compassRegionsTable)
      .where(and(
        eq(compassRegionsTable.region_code, regionCode),
        eq(compassRegionsTable.is_published, true),
      ));

    if (rows.length === 0) {
      return res.status(404).json({
        error: `The region '${regionCode}' is not yet within our compass. Further regions are being added in due course.`,
      });
    }

    const row = rows[0];
    const content = (row.content as unknown as Record<string, Record<string, unknown>>);
    const localeContent = resolveLocaleContent(content, locale);

    const mehrabian = MEHRABIAN_WEIGHTS[regionCode] ?? null;

    const highlightedFields = new Set<string>();
    for (const sphere of spheres) {
      for (const field of SPHERE_TO_COMPASS_FIELDS[sphere] ?? []) highlightedFields.add(field);
    }

    return res.json({
      region_code: row.region_code,
      flag_emoji: row.flag_emoji,
      region_name: localeContent.region_name ?? row.region_code,
      core_value: localeContent.core_value ?? "",
      biggest_taboo: localeContent.biggest_taboo ?? "",
      dining_etiquette: localeContent.dining_etiquette ?? "",
      language_notes: localeContent.language_notes ?? "",
      gift_protocol: localeContent.gift_protocol ?? "",
      dress_code: localeContent.dress_code ?? "",
      dos: localeContent.dos ?? [],
      donts: localeContent.donts ?? [],
      mehrabian_weight: mehrabian,
      sphere_highlights: Array.from(highlightedFields),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch compass region");
    return res.status(500).json({ error: "The Cultural Compass is momentarily unavailable." });
  }
});

const CulturalOriginsQuerySchema = z.object({
  region_code: z.string().min(1).max(10),
  domain: z.string().optional(),
});

router.get("/culture/origins", async (req, res) => {
  try {
    const parsed = CulturalOriginsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "A valid region code must be specified." });
    }

    const { region_code, domain } = parsed.data;
    const regionCode = region_code.toUpperCase();

    const conditions = [eq(culturalOriginsTable.region_code, regionCode)];
    if (domain) {
      conditions.push(eq(culturalOriginsTable.domain, domain));
    }

    const rows = await db.select()
      .from(culturalOriginsTable)
      .where(and(...conditions))
      .orderBy(culturalOriginsTable.domain, culturalOriginsTable.id);

    return res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch cultural origins");
    return res.status(500).json({ error: "Cultural origins are momentarily unavailable." });
  }
});

export default router;
