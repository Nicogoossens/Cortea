import { Router } from "express";
import { db } from "@workspace/db";
import { cultureProtocolsTable, compassRegionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const DEFAULT_LOCALE = "en-GB";

const ProtocolsQuerySchema = z.object({
  region_code: z.string().min(1),
  pillar: z.coerce.number().int().min(1).max(5).optional(),
  context: z.string().optional(),
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

    const { region_code, pillar, context } = parsed.data;
    const conditions = [eq(cultureProtocolsTable.region_code, region_code)];

    if (pillar !== undefined) {
      conditions.push(eq(cultureProtocolsTable.pillar, pillar));
    }

    if (context !== undefined) {
      conditions.push(eq(cultureProtocolsTable.context, context));
    }

    const protocols = await db.select()
      .from(cultureProtocolsTable)
      .where(and(...conditions));

    return res.json(protocols);
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
      const content = (row.content as Record<string, Record<string, string>>);
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
    const content = (row.content as Record<string, Record<string, unknown>>);
    const localeContent = (content[locale] ?? content[DEFAULT_LOCALE] ?? {}) as Record<string, unknown>;

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
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch compass region");
    return res.status(500).json({ message: "The Cultural Compass is momentarily unavailable." });
  }
});

export default router;
