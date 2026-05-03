import { Router } from "express";
import { db } from "@workspace/db";
import { compassRegionsTable, type CompassLocaleContent } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const DEFAULT_LOCALE = "en-GB";
const DEFAULT_TEASER_DOS = 3;
const DEFAULT_TEASER_DONTS = 3;

/**
 * Static cluster definitions used for "related countries" suggestions on the
 * public Cultures landing pages. Mirrors the shape of
 * artifacts/sowiso/src/lib/clusters.ts but kept independent to avoid
 * cross-artifact imports.
 */
const REGION_CLUSTERS: Record<string, string[]> = {
  GB: ["US", "AU", "CA"],
  US: ["GB", "AU", "CA"],
  AU: ["GB", "US", "CA"],
  CA: ["US", "GB", "AU"],
  FR: ["DE", "NL", "BE", "CH"],
  DE: ["NL", "FR", "CH", "BE"],
  NL: ["BE", "DE", "FR", "CH"],
  BE: ["NL", "FR", "DE", "CH"],
  CH: ["DE", "FR", "IT", "AT"],
  IT: ["ES", "PT", "FR", "GR"],
  ES: ["PT", "IT", "FR", "MX"],
  PT: ["ES", "BR", "IT", "FR"],
  JP: ["CN", "KR", "SG", "TW"],
  CN: ["JP", "SG", "KR", "TW"],
  SG: ["MY", "JP", "CN", "TH"],
  AE: ["SA", "QA", "OM", "BH"],
  SA: ["AE", "QA", "OM", "BH"],
  IN: ["LK", "NP", "PK", "SG"],
  MX: ["CO", "BR", "ES", "PE"],
  BR: ["MX", "CO", "PT", "AR"],
  CO: ["MX", "BR", "PE", "ES"],
  ZA: ["KE", "NG", "GH", "ET"],
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveLocaleContent(
  content: Record<string, CompassLocaleContent>,
  locale: string,
): Partial<CompassLocaleContent> {
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

interface PublicCultureSummary {
  slug: string;
  region_code: string;
  region_name: string;
  flag_emoji: string;
  core_value: string;
  biggest_taboo: string;
}

interface PublicCultureDetail extends PublicCultureSummary {
  /** Short localized teaser line shown above the fold. */
  teaser: string;
  dining_etiquette: string;
  language_notes: string;
  gift_protocol: string;
  dress_code: string;
  /** Truncated dos/don'ts — full lists are gated behind the conversion CTA. */
  dos_preview: string[];
  donts_preview: string[];
  dos_total: number;
  donts_total: number;
  /** 3-5 culturally adjacent countries for internal linking. */
  related: PublicCultureSummary[];
}

const QuerySchema = z.object({
  locale: z.string().default(DEFAULT_LOCALE),
});

/**
 * Build a slug → region row index for all *published* compass regions.
 * The slug is computed from the canonical English region_name. We also
 * accept the lowercased region_code as a fallback slug (e.g. "gb").
 */
async function loadPublishedRegionsBySlug(): Promise<
  Map<string, { row: typeof compassRegionsTable.$inferSelect; englishName: string }>
> {
  const rows = await db
    .select()
    .from(compassRegionsTable)
    .where(eq(compassRegionsTable.is_published, true));

  const map = new Map<string, { row: typeof compassRegionsTable.$inferSelect; englishName: string }>();
  for (const row of rows) {
    const content = (row.content ?? {}) as Record<string, CompassLocaleContent>;
    const enContent = content[DEFAULT_LOCALE] ?? content["en"] ?? {};
    const englishName = enContent.region_name ?? row.region_code;
    const entry = { row, englishName };
    map.set(slugify(englishName), entry);
    map.set(row.region_code.toLowerCase(), entry);
  }
  return map;
}

function buildSummary(
  row: typeof compassRegionsTable.$inferSelect,
  locale: string,
  englishName: string,
): PublicCultureSummary {
  const content = (row.content ?? {}) as Record<string, CompassLocaleContent>;
  const localeContent = resolveLocaleContent(content, locale);
  return {
    slug: slugify(englishName),
    region_code: row.region_code,
    region_name: localeContent.region_name ?? englishName,
    flag_emoji: row.flag_emoji,
    core_value: localeContent.core_value ?? "",
    biggest_taboo: localeContent.biggest_taboo ?? "",
  };
}

router.get("/cultures", async (req, res) => {
  try {
    const parsed = QuerySchema.safeParse(req.query);
    const locale = parsed.success ? parsed.data.locale : DEFAULT_LOCALE;

    const indexed = await loadPublishedRegionsBySlug();
    const seen = new Set<string>();
    const summaries: PublicCultureSummary[] = [];
    for (const { row, englishName } of indexed.values()) {
      if (seen.has(row.region_code)) continue;
      seen.add(row.region_code);
      const summary = buildSummary(row, locale, englishName);
      // Only include regions that have meaningful content (skip pure stubs).
      if (!summary.core_value && !summary.biggest_taboo) continue;
      summaries.push(summary);
    }
    summaries.sort((a, b) => a.region_name.localeCompare(b.region_name));

    res.set("Cache-Control", "public, max-age=600");
    return res.json({ cultures: summaries });
  } catch (err) {
    req.log.error({ err }, "Failed to list public cultures");
    return res.status(500).json({ error: "Cultural directory is momentarily unavailable." });
  }
});

router.get("/cultures/:slug", async (req, res) => {
  try {
    const slug = String(req.params.slug ?? "").toLowerCase();
    if (!slug || slug.length > 80) {
      return res.status(400).json({ error: "A valid country slug is required." });
    }
    const parsed = QuerySchema.safeParse(req.query);
    const locale = parsed.success ? parsed.data.locale : DEFAULT_LOCALE;

    const indexed = await loadPublishedRegionsBySlug();
    const match = indexed.get(slug);
    if (!match) {
      return res.status(404).json({ error: "This country is not yet within our compass." });
    }

    const { row, englishName } = match;
    const content = (row.content ?? {}) as Record<string, CompassLocaleContent>;
    const localeContent = resolveLocaleContent(content, locale);

    const dosAll: string[] = Array.isArray(localeContent.dos) ? localeContent.dos : [];
    const dontsAll: string[] = Array.isArray(localeContent.donts) ? localeContent.donts : [];

    // Related countries: first try the static cluster, then top up with
    // alphabetical neighbours so the section never feels empty.
    const clusterCodes = REGION_CLUSTERS[row.region_code] ?? [];
    const related: PublicCultureSummary[] = [];
    const usedCodes = new Set<string>([row.region_code]);

    for (const code of clusterCodes) {
      const sibling = indexed.get(code.toLowerCase());
      if (!sibling || usedCodes.has(sibling.row.region_code)) continue;
      const summary = buildSummary(sibling.row, locale, sibling.englishName);
      if (!summary.core_value && !summary.biggest_taboo) continue;
      related.push(summary);
      usedCodes.add(sibling.row.region_code);
      if (related.length >= 4) break;
    }

    if (related.length < 3) {
      for (const { row: candidate, englishName: candidateEnglish } of indexed.values()) {
        if (usedCodes.has(candidate.region_code)) continue;
        const summary = buildSummary(candidate, locale, candidateEnglish);
        if (!summary.core_value && !summary.biggest_taboo) continue;
        related.push(summary);
        usedCodes.add(candidate.region_code);
        if (related.length >= 4) break;
      }
    }

    const summary = buildSummary(row, locale, englishName);
    const teaserSource =
      (localeContent.dining_etiquette ?? "").split(". ")[0] ||
      (localeContent.language_notes ?? "").split(". ")[0] ||
      summary.core_value;

    const detail: PublicCultureDetail = {
      ...summary,
      teaser: teaserSource ? teaserSource.trim().replace(/\.$/, "") + "." : "",
      dining_etiquette: localeContent.dining_etiquette ?? "",
      language_notes: localeContent.language_notes ?? "",
      gift_protocol: localeContent.gift_protocol ?? "",
      dress_code: localeContent.dress_code ?? "",
      dos_preview: dosAll.slice(0, DEFAULT_TEASER_DOS),
      donts_preview: dontsAll.slice(0, DEFAULT_TEASER_DONTS),
      dos_total: dosAll.length,
      donts_total: dontsAll.length,
      related,
    };

    res.set("Cache-Control", "public, max-age=600");
    return res.json(detail);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch public culture");
    return res.status(500).json({ error: "This cultural guide is momentarily unavailable." });
  }
});

export default router;
export { slugify };
