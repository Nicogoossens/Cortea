import { Router } from "express";
import { db } from "@workspace/db";
import { cultureProtocolsTable, compassRegionsTable, culturalOriginsTable, usersTable } from "@workspace/db";
import { eq, and, or, isNull, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuthUser, resolveUserTier, getResolvedUserId } from "../lib/auth-middleware";
import { TIER_FEATURES, type SubscriptionTier, hasFeatureAccess, canAccessRegion } from "../lib/tier-features";

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
  LB: { nonverbal: 35, tone: 35, words: 30, note: "Hospitality, sophistication and resilience define Lebanese identity — beauty and pleasure must continue regardless of circumstance." },
  OM: { nonverbal: 50, tone: 25, words: 25, note: "Quiet dignity, deep tradition, and graciousness over spectacle — bearing carries meaning before words." },
  KE: { nonverbal: 40, tone: 30, words: 30, note: "Pride in heritage and entrepreneurial warmth — Kenyans engage through dignified, relational presence." },
  NG: { nonverbal: 30, tone: 40, words: 30, note: "Ambition, expressive confidence, and devotion — Nigerian conversation is animated and rich in tone." },
  ET: { nonverbal: 45, tone: 25, words: 30, note: "Pride in three thousand years of civilisation and proud independence — composure signals seriousness." },
  GH: { nonverbal: 35, tone: 35, words: 30, note: "Hospitality, dignity and peaceful pride — Ghanaian presence balances warmth and measured tone." },
  TZ: { nonverbal: 40, tone: 30, words: 30, note: "Peace, unity and unhurried dignity — Tanzanians value calm bearing and relational pace." },
  AR: { nonverbal: 25, tone: 40, words: 35, note: "European-style sophistication and intellectual passion — voice and articulate phrasing carry status." },
  CL: { nonverbal: 40, tone: 30, words: 30, note: "Modesty, hard work and quiet pride — Chileans favour measured composure over visible display." },
  PE: { nonverbal: 40, tone: 30, words: 30, note: "Profound pride in Andean civilisation and cultural inheritance — bearing carries respect." },
  CR: { nonverbal: 35, tone: 30, words: 35, note: "Pura vida — peaceful, family-centred and gentle — measured words and easy presence are valued." },
  UY: { nonverbal: 40, tone: 25, words: 35, note: "Quiet dignity and tranquilidad — Uruguayans favour reserved composure and considered phrasing." },
  CU: { nonverbal: 30, tone: 45, words: 25, note: "Resilience, deep musicality and joy in adversity — vocal warmth and tone carry the conversation." },
  NZ: { nonverbal: 35, tone: 30, words: 35, note: "Egalitarianism, modesty and quiet pride — New Zealanders distrust pretension and value plain words." },
  HR: { nonverbal: 40, tone: 30, words: 30, note: "Mediterranean dignity and strong national pride — composed presence signals seriousness." },
  RO: { nonverbal: 40, tone: 30, words: 30, note: "Resilience, Orthodox spirituality and Latin heritage — Romanians value composed, dignified bearing." },
  EE: { nonverbal: 50, tone: 20, words: 30, note: "Quiet self-reliance and deep nature connection — silence and composure speak louder than words." },
  SI: { nonverbal: 45, tone: 25, words: 30, note: "Quiet competence and Central European refinement — restrained presence is the cultural default." },
  MT: { nonverbal: 35, tone: 35, words: 30, note: "Catholic devotion and fortress-island resilience — warmth balanced with formal Mediterranean bearing." },
  LK: { nonverbal: 40, tone: 30, words: 30, note: "Hospitality and deep Buddhist devotion — gentle bearing and respectful tone smooth interactions." },
  KH: { nonverbal: 50, tone: 20, words: 30, note: "Buddhist gentleness and reverence for Angkor heritage — composure and quiet presence are paramount." },
  MV: { nonverbal: 45, tone: 25, words: 30, note: "Sunni Muslim devotion and refined hospitality — gracious bearing carries the cultural code." },
  NP: { nonverbal: 45, tone: 25, words: 30, note: "Hindu-Buddhist devotion and mountain-people resilience — calm presence and humility are valued." },
  BW: { nonverbal: 50, tone: 20, words: 30, note: "Botho — the Tswana humanity ethic — and conservative dignity favour composed, unhurried bearing." },
  RW: { nonverbal: 45, tone: 25, words: 30, note: "Reconciliation and dignity — Rwandans engage with measured composure and quiet seriousness." },
  MU: { nonverbal: 35, tone: 35, words: 30, note: "Multicultural harmony and family loyalty — Mauritians blend warmth with refined formality." },
  BG: { nonverbal: 30, tone: 40, words: 30, note: "Slavic Orthodox heritage and hospitality — voice and tone carry storytelling warmth." },
  UA: { nonverbal: 30, tone: 40, words: 30, note: "Resilience and pride in a 1,000-year heritage — vocal warmth and emphatic tone carry conviction." },
  CY: { nonverbal: 25, tone: 40, words: 35, note: "Mediterranean hospitality and Orthodox heritage — voice and articulate phrasing lead the encounter." },
  LU: { nonverbal: 35, tone: 25, words: 40, note: "Discreet European sophistication and multilingual openness — words are chosen precisely." },
  PK: { nonverbal: 30, tone: 40, words: 30, note: "Generous hospitality and family loyalty — poetic phrasing and warm tone are deeply admired." },
  MN: { nonverbal: 40, tone: 30, words: 30, note: "Nomadic pride and Buddhist heritage — composed steppe bearing carries the cultural memory." },
  BH: { nonverbal: 40, tone: 30, words: 30, note: "Pearl-trading heritage and refined Gulf hospitality — gracious patience and dignity are read first." },
  TN: { nonverbal: 25, tone: 40, words: 35, note: "Mediterranean Maghreb sophistication — humour, voice and articulate code-switching lead." },
  SN: { nonverbal: 35, tone: 40, words: 25, note: "Teranga hospitality and Sufi spirituality — melodic voice and storytelling carry social weight." },
  FJ: { nonverbal: 30, tone: 45, words: 25, note: "The Bula spirit — generous, gentle, communal warmth — vocal warmth and tone carry the welcome." },
  AT: { nonverbal: 52, tone: 23, words: 25, note: "Refined formality, intellectual seriousness, and deep pride in cultural heritage — Austria sees itself as the surviving heart of Mitteleuropa." },
  CZ: { nonverbal: 55, tone: 18, words: 27, note: "Quiet competence, dry wit, and deep cultural literacy — Czechs prize understatement, scepticism, and the well-made object." },
  DK: { nonverbal: 50, tone: 20, words: 30, note: "Egalitarian quiet, design intelligence, and well-earned trust — Denmark prizes restraint, social cohesion, and the well-made everyday object." },
  FI: { nonverbal: 60, tone: 12, words: 28, note: "Sisu — quiet endurance, honest competence, and the dignity of doing things properly without comment." },
  EG: { nonverbal: 40, tone: 35, words: 25, note: "Karam — generosity and unhurried Nile-valley hospitality carry the social contract." },
  RS: { nonverbal: 30, tone: 40, words: 30, note: "Slavic Orthodox heritage, fierce hospitality, and pride in a long history of empire, resistance, and cultural defiance." },
  LT: { nonverbal: 40, tone: 30, words: 30, note: "Quiet Baltic-forest spirituality and pride in being one of Europe's last Christianised nations — restrained dignity carries the room." },
  SK: { nonverbal: 40, tone: 25, words: 35, note: "Quiet Slavic-Catholic heritage and mountain-and-folk identity — Habsburg sophistication meets deep village tradition." },
  BD: { nonverbal: 25, tone: 45, words: 30, note: "Bengali cultural pride — language, literature, music, food — combined with Muslim hospitality and the deep memory of 1971." },
  MM: { nonverbal: 40, tone: 35, words: 25, note: "Theravada Buddhist devotion pervades daily life — composed bearing and gentle voice carry the cultural weight." },
  BT: { nonverbal: 45, tone: 30, words: 25, note: "Vajrayana Buddhist devotion and Gross National Happiness philosophy — calm presence and stewardship lead." },
  KW: { nonverbal: 40, tone: 30, words: 30, note: "Resilient mercantile heritage and refined Gulf hospitality — pride in pre-oil pearl-diving and trading roots." },
  DZ: { nonverbal: 25, tone: 40, words: 35, note: "Maghreb-Berber-Arab pride combined with deep memory of the long War of Independence — articulate voice and conviction lead." },
  DO: { nonverbal: 30, tone: 45, words: 25, note: "Caribbean-Spanish warmth and deep Catholic-syncretic religiosity — Santo Domingo as cradle of European America." },
  PA: { nonverbal: 25, tone: 40, words: 35, note: "Trans-isthmian crossroads identity — five centuries of trade between oceans and continents shape cosmopolitan urban sophistication." },
  AL: { nonverbal: 35, tone: 40, words: 25, note: "Besa — the deeply held code of honour, hospitality, and given word — combined with mountain-Highland resilience." },
  BA: { nonverbal: 30, tone: 40, words: 30, note: "Multicultural-multireligious heritage — Sarajevo of mosques, churches, synagogues, and cathedrals within 200 metres — combined with Slavic warmth." },
  MK: { nonverbal: 30, tone: 40, words: 30, note: "Slavic Orthodox heritage centred on Lake Ohrid and the legacy of Saints Cyril and Methodius, combined with Balkan-Mediterranean warmth." },
  LA: { nonverbal: 45, tone: 30, words: 25, note: "Theravada Buddhist serenity, gentle hospitality, and the unhurried bo pen yang approach — Laos cultivates calm and indirect communication." },
  BN: { nonverbal: 45, tone: 30, words: 25, note: "Devout Sunni Muslim faith, deep respect for one of the oldest continuous Islamic monarchies, and the Melayu Islam Beraja philosophy." },
  KZ: { nonverbal: 40, tone: 35, words: 25, note: "Steppe-nomadic heritage, Turkic-Islamic identity, and a careful balancing of Russian, Chinese, and Western relationships." },
  EC: { nonverbal: 35, tone: 40, words: 25, note: "Andean-indigenous heritage layered with Spanish-colonial Catholic depth, Pacific-coast openness, and Amazon biodiversity." },
  GT: { nonverbal: 35, tone: 40, words: 25, note: "Maya cultural depth — heart of the ancient Maya world with 22 living Mayan-speaking communities — combined with Spanish-colonial Catholic heritage." },
  BO: { nonverbal: 40, tone: 35, words: 25, note: "Plurinational indigenous identity — Aymara, Quechua, Guaraní, and 33 other recognised peoples — combined with Andean-altitude resilience." },
  JM: { nonverbal: 30, tone: 45, words: 25, note: "One Love — the Bob Marley-articulated Jamaican spirit of warmth, openness, and resilience — combined with deep Black-Caribbean cultural confidence." },
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

router.get("/culture/protocols", requireAuthUser, async (req, res) => {
  try {
    const userTierRow = await resolveUserTier(req);
    const tier = (userTierRow?.subscription_tier ?? "guest") as SubscriptionTier;
    if (!TIER_FEATURES[tier].fullCulturalCompass) {
      return res.status(403).json({ code: "TIER_REQUIRED", error: "A paid subscription is required to access cultural protocols." });
    }

    const parsed = ProtocolsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "A region must be specified to retrieve cultural protocols." });
    }

    const region_code_raw = parsed.data.region_code.toUpperCase();
    if (!canAccessRegion(tier, userTierRow?.active_region ?? "", region_code_raw)) {
      return res.status(403).json({ error: "Your current membership does not include access to this region." });
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

router.get("/culture/compass/:regionCode", requireAuthUser, async (req, res) => {
  try {
    const userTierRow = await resolveUserTier(req);
    const tier = (userTierRow?.subscription_tier ?? "guest") as SubscriptionTier;
    if (!TIER_FEATURES[tier].fullCulturalCompass) {
      return res.status(403).json({ code: "TIER_REQUIRED", error: "A paid subscription is required to access the Cultural Compass." });
    }

    const paramParsed = RegionCodeParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      return res.status(400).json({ error: "The region code provided is not valid." });
    }

    const queryParsed = CompassQuerySchema.safeParse(req.query);
    const locale = queryParsed.success ? queryParsed.data.locale : DEFAULT_LOCALE;
    const rawSpheres = queryParsed.success ? (queryParsed.data.situational_interests ?? "") : "";
    const spheres = rawSpheres.split(",").map((s) => s.trim()).filter(Boolean);

    const regionCode = paramParsed.data.regionCode.toUpperCase();

    if (!canAccessRegion(tier, userTierRow?.active_region ?? "", regionCode)) {
      return res.status(403).json({ error: "Your current membership does not include access to this region." });
    }

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

router.get("/culture/origins", requireAuthUser, async (req, res) => {
  try {
    const userTierRow = await resolveUserTier(req);
    const tier = (userTierRow?.subscription_tier ?? "guest") as SubscriptionTier;
    if (!TIER_FEATURES[tier].fullCulturalCompass) {
      return res.status(403).json({ code: "TIER_REQUIRED", error: "A paid subscription is required to access cultural origins." });
    }

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
