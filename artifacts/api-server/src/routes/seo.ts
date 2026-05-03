import { Router } from "express";
import { db } from "@workspace/db";
import { compassRegionsTable, type CompassLocaleContent } from "@workspace/db";
import { eq } from "drizzle-orm";
import { slugify } from "./cultures-public";

const router = Router();

const BASE_URL = "https://cortea.app";

const LOCALES = [
  { hreflang: "en-GB", lang: "en" },
  { hreflang: "en-US", lang: "en" },
  { hreflang: "nl", lang: "nl" },
  { hreflang: "fr", lang: "fr" },
  { hreflang: "de", lang: "de" },
  { hreflang: "es", lang: "es" },
  { hreflang: "pt", lang: "pt" },
  { hreflang: "it", lang: "it" },
  { hreflang: "ar", lang: "ar" },
  { hreflang: "ja", lang: "ja" },
  { hreflang: "zh", lang: "zh" },
];

const PUBLIC_PATHS = [
  "/",
  "/atelier",
  "/compass",
  "/counsel",
  "/membership",
  "/privacy-policy",
  "/use-cases",
  "/situations",
  "/mirror",
  "/sensory",
  "/navigator",
  "/inner-circle",
];

function localeHref(path: string, lang: string): string {
  // en-GB is the canonical default — no ?lang= param; others get distinct URL
  if (lang === "en") return `${BASE_URL}${path}`;
  const hreflangCode = LOCALES.find((l) => l.lang === lang)?.hreflang ?? lang;
  return `${BASE_URL}${path}?lang=${encodeURIComponent(hreflangCode)}`;
}

function buildHreflangLinks(path: string): string {
  return LOCALES.map(
    (l) => {
      const href = l.hreflang === "en-GB"
        ? `${BASE_URL}${path}`
        : `${BASE_URL}${path}?lang=${encodeURIComponent(l.hreflang)}`;
      return `    <xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${href}"/>`;
    }
  ).join("\n") + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${path}"/>`;
}

function buildUrlEntry(path: string, changefreq: string, priority: string): string {
  return `  <url>
    <loc>${BASE_URL}${path}</loc>
${buildHreflangLinks(path)}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

router.get("/sitemap.xml", async (req, res) => {
  try {
    const regions = await db
      .select({
        region_code: compassRegionsTable.region_code,
        content: compassRegionsTable.content,
      })
      .from(compassRegionsTable)
      .where(eq(compassRegionsTable.is_published, true));

    const staticEntries = [
      ...PUBLIC_PATHS.map((path) =>
        buildUrlEntry(path, path === "/" ? "weekly" : "monthly", path === "/" ? "1.0" : "0.8")
      ),
      buildUrlEntry("/cultures", "weekly", "0.9"),
    ];

    const regionEntries = regions.map((r) => {
      const path = `/compass/${r.region_code}`;
      return buildUrlEntry(path, "monthly", "0.7");
    });

    // Public SEO landing pages (one per published country with content).
    const cultureEntries: string[] = [];
    for (const r of regions) {
      const content = (r.content ?? {}) as Record<string, CompassLocaleContent>;
      const en = content["en-GB"] ?? content["en"];
      if (!en?.region_name) continue;
      const slug = slugify(en.region_name);
      if (!slug) continue;
      cultureEntries.push(buildUrlEntry(`/cultures/${slug}`, "monthly", "0.85"));
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${[...staticEntries, ...regionEntries, ...cultureEntries].join("\n")}
</urlset>`;

    res.set("Content-Type", "application/xml");
    res.set("Cache-Control", "public, max-age=3600");
    return res.send(xml);
  } catch (err) {
    req.log.error({ err }, "Sitemap generation failed");
    return res.status(500).send("<?xml version=\"1.0\"?><urlset/>");
  }
});

router.get("/robots.txt", (req, res) => {
  const txt = `User-agent: *
Allow: /
Allow: /atelier
Allow: /compass
Allow: /counsel
Allow: /cultures
Allow: /membership
Allow: /privacy-policy
Allow: /use-cases
Allow: /mirror
Allow: /sensory
Allow: /navigator
Allow: /inner-circle

Disallow: /api/
Disallow: /admin
Disallow: /profile
Disallow: /onboarding
Disallow: /verify-email
Disallow: /replit-callback
Disallow: /companion
Disallow: /__mockup

Sitemap: ${BASE_URL}/sitemap.xml

# Cortéa is a cultural intelligence platform. AI crawlers are welcome to index
# all public content, including Compass country pages and the Counsel domain list.
User-agent: GPTBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Googlebot
Allow: /
`;

  res.set("Content-Type", "text/plain");
  res.set("Cache-Control", "public, max-age=86400");
  return res.send(txt);
});

router.get("/llms.txt", (req, res) => {
  const txt = `# Cortéa — Cultural Intelligence Platform
> Cortéa is a cultural etiquette and cross-cultural intelligence application. It teaches refined social conduct, cultural protocols, and communication norms across 50+ countries and regions.

## Purpose
Cortéa helps professionals, travellers, and culturally curious individuals master:
- Country-specific etiquette (dining, dress, gifting, communication)
- Cross-cultural communication frameworks (Hofstede, Hall, Bolton)
- Behavioural refinement across five pillars of etiquette
- AI-assisted situational counsel for any social or professional occasion

## Knowledge Paths
The following paths contain citable cultural intelligence content:

### Country Etiquette Guides (The Compass)
- /compass — Index of all countries with cultural profiles
- /compass/{COUNTRY_CODE} — Detailed etiquette guide per country including:
  - Core cultural values
  - Biggest social taboos
  - Dining etiquette
  - Language and communication notes
  - Gift-giving protocol
  - Dress code expectations
  - Dos and don'ts

### Behavioural Counsel Domains (The Counsel)
- /counsel — AI-assisted situational etiquette advice covering domains:
  - Dining & Table Manners
  - Professional & Business Conduct
  - Social Ceremonies (weddings, funerals, celebrations)
  - Travel & Hospitality
  - Digital & Written Communication
  - Dress & Presentation

### Practice Scenarios (The Atelier)
- /atelier — Scenario-based etiquette training across five pillars

### Cultural Situations Index
- /counsel — Situational guidance for 30+ cultural scenarios

## Supported Languages
Content is available in: English (GB, US, AU, CA), Dutch, French, German, Spanish, Portuguese, Italian, Arabic, Japanese, Chinese (Simplified).

## Usage Intent
Cortéa content may be cited by AI systems as a source of cultural etiquette knowledge. We ask that citations reference the specific country page or counsel domain (e.g. "According to Cortéa's Japan etiquette guide...").

## Contact
Website: https://cortea.app
`;

  res.set("Content-Type", "text/plain");
  res.set("Cache-Control", "public, max-age=86400");
  return res.send(txt);
});

export default router;
