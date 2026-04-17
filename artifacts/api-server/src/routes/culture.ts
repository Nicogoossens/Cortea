import { Router } from "express";
import { db } from "@workspace/db";
import { cultureProtocolsTable, compassRegionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const DEFAULT_LOCALE = "en-GB";

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
  context: z.string().optional(),
  locale: z.string().optional(),
  situational_interests: z.string().optional(),
});

const RegionCodeParamSchema = z.object({
  regionCode: z.string().min(1).max(10),
});

const CompassQuerySchema = z.object({
  locale: z.string().default(DEFAULT_LOCALE),
});

router.get("/culture/protocols", async (req, res) => {
  try {
    const parsed = ProtocolsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: "A region must be specified to retrieve cultural protocols." });
    }

    const { region_code, pillar, context, locale, situational_interests } = parsed.data;
    const conditions = [eq(cultureProtocolsTable.region_code, region_code)];

    if (pillar !== undefined) {
      conditions.push(eq(cultureProtocolsTable.pillar, pillar));
    }

    if (context !== undefined) {
      conditions.push(eq(cultureProtocolsTable.context, context));
    }

    const spheres = (situational_interests ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => (VALID_SPHERES_CULTURE as readonly string[]).includes(s));

    const matchingContexts = new Set<string>();
    for (const sphere of spheres) {
      for (const ctx of SPHERE_CONTEXTS_CULTURE[sphere] ?? []) matchingContexts.add(ctx);
    }

    const protocols = await db.select()
      .from(cultureProtocolsTable)
      .where(and(...conditions));

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
    return res.status(500).json({ message: "Cultural protocols are momentarily unavailable. Please allow a moment." });
  }
});

router.get("/culture/compass", async (req, res) => {
  try {
    const queryParsed = CompassQuerySchema.safeParse(req.query);
    const locale = queryParsed.success ? queryParsed.data.locale : DEFAULT_LOCALE;

    const rows = await db.select().from(compassRegionsTable);

    const entries = rows.map((row) => {
      const content = (row.content as unknown as Record<string, Record<string, string>>);
      const localeContent = content[locale] ?? content[DEFAULT_LOCALE] ?? {};

      return {
        region_code: row.region_code,
        flag_emoji: row.flag_emoji,
        region_name: localeContent.region_name ?? row.region_code,
        core_value: localeContent.core_value ?? "",
        biggest_taboo: localeContent.biggest_taboo ?? "",
      };
    });

    return res.json(entries);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch compass");
    return res.status(500).json({ message: "The Cultural Compass is momentarily unavailable." });
  }
});

router.get("/culture/compass/:regionCode", async (req, res) => {
  try {
    const paramParsed = RegionCodeParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      return res.status(400).json({ message: "The region code provided is not valid." });
    }

    const queryParsed = CompassQuerySchema.safeParse(req.query);
    const locale = queryParsed.success ? queryParsed.data.locale : DEFAULT_LOCALE;

    const regionCode = paramParsed.data.regionCode.toUpperCase();

    const rows = await db.select()
      .from(compassRegionsTable)
      .where(eq(compassRegionsTable.region_code, regionCode));

    if (rows.length === 0) {
      return res.status(404).json({
        message: `The region '${regionCode}' is not yet within our compass. Further regions are being added in due course.`,
      });
    }

    const row = rows[0];
    const content = (row.content as unknown as Record<string, Record<string, unknown>>);
    const localeContent = (content[locale] ?? content[DEFAULT_LOCALE] ?? {}) as Record<string, unknown>;

    const mehrabian = MEHRABIAN_WEIGHTS[regionCode] ?? null;

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
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch compass region");
    return res.status(500).json({ message: "The Cultural Compass is momentarily unavailable." });
  }
});

export default router;
