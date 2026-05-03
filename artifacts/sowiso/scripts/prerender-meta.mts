/**
 * Post-build prerender script for Cortéa.
 *
 * For each public route this script:
 *   1. Injects SEO <head> tags (title, description, OG, hreflang, JSON-LD)
 *   2. Injects static page-body HTML into <div id="root"> so that search
 *      engines and AI crawlers see real content before any JS executes
 *   3. Generates a complete, dynamic sitemap.xml (including all published
 *      Compass country pages fetched from the database)
 *
 * Run automatically after `pnpm build` via the "prerender" postbuild script.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, "../dist/public");
const INDEX_HTML = path.join(DIST_DIR, "index.html");
const BASE_URL = "https://cortea.app";
const OG_IMAGE = `${BASE_URL}/opengraph.jpg`;

// Load EN translations so prerender meta is always in sync with translation files
const EN_TRANSLATIONS_PATH = path.resolve(__dirname, "../src/locales/en/translation.json");
const EN_T: Record<string, string> = JSON.parse(fs.readFileSync(EN_TRANSLATIONS_PATH, "utf-8"));

/** Get translated string by key; falls back to fallback arg or key itself */
function tr(key: string, fallback?: string): string {
  return EN_T[key] ?? fallback ?? key;
}

/** Append brand suffix when not already present */
function withBrand(title: string): string {
  return title.includes("Cortéa") ? title : `${title} — Cortéa`;
}

const HREFLANG_LOCALES = [
  "en-GB", "en-US", "nl", "fr", "de", "es", "pt", "it", "ar", "ja", "zh",
];

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

interface RegionRow {
  region_code: string;
  region_name: string;
  core_value: string | null;
  dining_etiquette: string | null;
  dress_code: string | null;
  language_notes: string | null;
  biggest_taboo: string | null;
  dos: string[] | null;
  donts: string[] | null;
  gift_protocol: string | null;
}

interface RouteMeta {
  path: string;
  title: string;
  description: string;
  bodyHtml: string;
  jsonLd?: object | object[];
}

// ────────────────────────────────────────────────────────────────────────────
// HTML helpers
// ────────────────────────────────────────────────────────────────────────────

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function card(title: string, body: string): string {
  return `<div style="border:1px solid #e2d9c8;border-radius:8px;padding:20px 24px;margin-bottom:16px;">
  <h3 style="margin:0 0 8px;font-size:1rem;font-weight:600;color:#4a3b2c;">${esc(title)}</h3>
  <p style="margin:0;color:#5a4a3a;line-height:1.6;">${esc(body)}</p>
</div>`;
}

function listItems(items: string[]): string {
  return items
    .map((i) => `<li style="padding:4px 0;color:#5a4a3a;">${esc(i)}</li>`)
    .join("\n");
}

function pageShell(content: string): string {
  return `<div style="min-height:100vh;background:#faf8f5;font-family:Georgia,serif;color:#3a2c1e;">
  <div style="max-width:900px;margin:0 auto;padding:48px 24px;">
    ${content}
  </div>
</div>`;
}

// ────────────────────────────────────────────────────────────────────────────
// Static body content per route
// ────────────────────────────────────────────────────────────────────────────

function landingBody(): string {
  return pageShell(`
    <h1 style="font-size:2.5rem;margin-bottom:12px;">Cortéa — The Art of Conduct</h1>
    <p style="font-size:1.15rem;color:#6a5a48;margin-bottom:40px;line-height:1.7;">
      Master cultural etiquette and refined social conduct across 50&plus; countries.
      Practise real scenarios, consult AI counsel, and build your Noble Score.
    </p>
    <h2 style="font-size:1.4rem;margin-bottom:24px;color:#3a2c1e;">What Cortéa offers</h2>
    <div style="display:grid;gap:16px;">
      ${card("The Atelier", "Scenario-based etiquette practice across five pillars: Dining, Dress, Digital, Professional, and Social. Refine your instincts with AI-guided feedback.")}
      ${card("The Cultural Compass", "Detailed cultural guides for 50+ countries — dining customs, dress codes, communication norms, gift-giving protocol, and social taboos.")}
      ${card("The Counsel", "Discreet AI etiquette adviser for any situation: table protocol, professional correspondence, diplomatic occasions, and everyday social dilemmas.")}
      ${card("The Mirror", "On-device AI dress-code analysis. Receive private feedback on your attire for any occasion or venue — Ambassador members only.")}
      ${card("The Sensory", "Real-time ambient noise monitoring. Know when your environment meets the standard for refined dining, gallery visits, or boardroom meetings.")}
      ${card("The Navigator", "Pre-trip cultural intelligence with personalised arrival briefings for upcoming travel destinations — Ambassador members only.")}
    </div>
    <p style="margin-top:40px;font-size:0.9rem;color:#9a8a7a;">
      Available for professionals, travellers, and the culturally curious. Begin with a complimentary Guest account.
    </p>`);
}

function atelierBody(): string {
  return pageShell(`
    <h1 style="font-size:2.5rem;margin-bottom:12px;">The Atelier — Etiquette Practice Scenarios</h1>
    <p style="font-size:1.1rem;color:#6a5a48;margin-bottom:36px;line-height:1.7;">
      Scenario-based cultural etiquette training across five pillars of refined conduct. Each scenario presents a real-world situation and asks you to select the correct response, building instinct alongside knowledge.
    </p>
    <h2 style="font-size:1.3rem;margin-bottom:20px;">The Five Pillars</h2>
    <div style="display:grid;gap:14px;">
      ${card("Dining", "Table manners, host protocols, toasting customs, cutlery usage, and the unwritten rules of shared meals across cultures.")}
      ${card("Dress", "Occasion-appropriate attire, dress codes for diplomatic and ceremonial events, and cultural modesty norms.")}
      ${card("Digital", "Professional email correspondence, meeting etiquette, response timing expectations, and digital communication norms.")}
      ${card("Professional", "Boardroom protocol, business card exchange, negotiation styles, hierarchy acknowledgement, and meeting conduct.")}
      ${card("Social", "Gift-giving protocol, greeting customs, forms of address, personal space norms, and social taboos by culture.")}
    </div>`);
}

function compassBody(regions: RegionRow[]): string {
  const regionList = regions
    .map((r) => `<li style="padding:6px 0;"><a href="/compass/${r.region_code}" style="color:#8B6914;text-decoration:none;font-size:1rem;">${esc(r.region_name)}</a></li>`)
    .join("\n");
  return pageShell(`
    <h1 style="font-size:2.5rem;margin-bottom:12px;">The Cultural Compass</h1>
    <p style="font-size:1.1rem;color:#6a5a48;margin-bottom:36px;line-height:1.7;">
      Detailed cultural etiquette guides for every major country and region. Explore dining customs, dress codes, communication norms, gift-giving protocol, and social taboos.
    </p>
    <h2 style="font-size:1.3rem;margin-bottom:20px;">Available Country Guides</h2>
    <ul style="list-style:none;padding:0;column-count:2;column-gap:24px;">
      ${regionList}
    </ul>`);
}

function compassRegionBody(r: RegionRow): string {
  const dosList = r.dos ? `<ul style="list-style:none;padding:0;">${listItems(r.dos)}</ul>` : "";
  const dontsList = r.donts ? `<ul style="list-style:none;padding:0;">${listItems(r.donts)}</ul>` : "";
  return pageShell(`
    <h1 style="font-size:2.5rem;margin-bottom:8px;">${esc(r.region_name)} Etiquette Guide</h1>
    <p style="font-size:1rem;color:#8B6914;margin-bottom:32px;font-style:italic;">${r.core_value ? esc(r.core_value) : "Cultural intelligence for travellers and professionals"}</p>
    ${r.dining_etiquette ? card("Dining Etiquette", r.dining_etiquette) : ""}
    ${r.dress_code ? card("Dress Code", r.dress_code) : ""}
    ${r.language_notes ? card("Language & Communication", r.language_notes) : ""}
    ${r.biggest_taboo ? card("Biggest Taboo", r.biggest_taboo) : ""}
    ${r.gift_protocol ? card("Gift-Giving Protocol", r.gift_protocol) : ""}
    ${dosList ? `<div style="border:1px solid #e2d9c8;border-radius:8px;padding:20px 24px;margin-bottom:16px;"><h3 style="margin:0 0 8px;color:#2a5c2a;">Dos</h3>${dosList}</div>` : ""}
    ${dontsList ? `<div style="border:1px solid #e2d9c8;border-radius:8px;padding:20px 24px;margin-bottom:16px;"><h3 style="margin:0 0 8px;color:#8B2020;">Don\'ts</h3>${dontsList}</div>` : ""}
    <p style="margin-top:32px;font-size:0.9rem;color:#9a8a7a;">
      Source: Cortéa Cultural Intelligence Database — updated continuously.
    </p>`);
}

function counselBody(): string {
  return pageShell(`
    <h1 style="font-size:2.5rem;margin-bottom:12px;">The Counsel — AI Etiquette Adviser</h1>
    <p style="font-size:1.1rem;color:#6a5a48;margin-bottom:36px;line-height:1.7;">
      Discreet, AI-powered etiquette guidance for any situation. Ask anything — from the correct fork to use at a state dinner, to navigating a cross-cultural negotiation, to the appropriate gift for a host in Kyoto.
    </p>
    <div style="display:grid;gap:14px;">
      ${card("Dining Protocol", "Table manners, seating arrangements, wine service, toasting customs, and the etiquette of shared meals in every culture.")}
      ${card("Professional Conduct", "Business correspondence, meeting protocol, forms of address, hierarchy norms, and international negotiation styles.")}
      ${card("Social Ceremony", "Wedding traditions, mourning customs, religious occasion protocol, and formal social events across cultures.")}
      ${card("Travel & Arrival", "Cultural briefings for any destination: what to expect, what to avoid, and how to make the right impression from the first moment.")}
      ${card("Digital Communication", "Email etiquette, response timing, messaging norms, and the unwritten rules of professional digital conduct.")}
    </div>`);
}

function membershipBody(): string {
  return pageShell(`
    <h1 style="font-size:2.5rem;margin-bottom:12px;">Membership — Cortéa</h1>
    <p style="font-size:1.1rem;color:#6a5a48;margin-bottom:36px;line-height:1.7;">
      Choose your level of cultural refinement. Begin complimentary, or unlock the full depth of Cortéa at any time.
    </p>
    <div style="display:grid;gap:16px;">
      ${card("Guest — Complimentary", "Access to the Cultural Compass, limited Atelier scenarios, and five AI Counsel questions per month. No credit card required.")}
      ${card("Traveller", "Unlimited Atelier scenarios across all five pillars, full Compass access for all regions, and unlimited AI Counsel guidance.")}
      ${card("Ambassador", "Everything in Traveller, plus The Mirror (AI dress-code analysis), The Sensory (ambient noise monitoring), The Navigator (cultural arrival briefings), and The Inner Circle community.")}
    </div>
    <h2 style="font-size:1.3rem;margin:36px 0 16px;">Frequently Asked Questions</h2>
    ${card("Is the Guest plan truly free?", "Yes — no credit card is required. The Guest tier gives you genuine access to explore Cortéa with no time limit.")}
    ${card("Can I cancel at any time?", "Memberships are month-to-month and may be cancelled at any time from your profile settings.")}
    ${card("Is my data kept private?", "All AI Counsel conversations are private. Mirror analysis is processed on-device and never stored on our servers.")}`);
}

function useCasesBody(): string {
  return pageShell(`
    <h1 style="font-size:2.5rem;margin-bottom:12px;">Use Case Library</h1>
    <p style="font-size:1.1rem;color:#6a5a48;margin-bottom:36px;line-height:1.7;">
      Real-world cultural etiquette situations, curated for professionals and frequent travellers. Track your readiness score as you practise scenarios across every domain.
    </p>
    <div style="display:grid;gap:14px;">
      ${card("Business & Professional", "Boardroom introductions, negotiation styles, client hospitality, and cross-cultural team management.")}
      ${card("Dining & Entertaining", "Hosting a business dinner, attending a state banquet, navigating a traditional tea ceremony, or dining at a Michelin-starred restaurant.")}
      ${card("Travel & Arrival", "Airport greetings, hotel etiquette, cultural site visits, and tipping customs across 50+ countries.")}
      ${card("Social & Ceremonial", "Wedding attendance, funeral customs, religious occasions, and formal invitations across cultures.")}
      ${card("Digital & Correspondence", "Professional email, video call etiquette, messaging norms, and response-time expectations by culture.")}
    </div>`);
}

function situationsBody(): string {
  return pageShell(`
    <h1 style="font-size:2.5rem;margin-bottom:12px;">Etiquette Scenarios — The Atelier</h1>
    <p style="font-size:1.1rem;color:#6a5a48;margin-bottom:36px;line-height:1.7;">
      Practise cultural etiquette through scenario-based training. Each situation presents a real-world challenge; you choose the correct response across five pillars of refined conduct.
    </p>
    <div style="display:grid;gap:14px;">
      ${card("Dining", "Table manners, toasting customs, host protocols, and the unwritten rules of shared meals across cultures.")}
      ${card("Dress", "Occasion-appropriate attire, dress codes for diplomatic and ceremonial events.")}
      ${card("Digital", "Professional email, meeting conduct, messaging norms.")}
      ${card("Professional", "Boardroom protocol, business card exchange, negotiation styles.")}
      ${card("Social", "Gift-giving, greeting customs, forms of address, and social taboos.")}
    </div>`);
}

function mirrorBody(): string {
  return pageShell(`
    <h1 style="font-size:2.5rem;margin-bottom:12px;">The Mirror — AI Dress Code Assessment</h1>
    <p style="font-size:1.1rem;color:#6a5a48;margin-bottom:36px;line-height:1.7;">
      On-device AI dress-code analysis for Ambassador members. Receive discreet, private feedback on your attire for any occasion or venue — processed entirely on your device, never stored on our servers.
    </p>
    ${card("Black Tie & White Tie", "Formal occasion dress-code verification for evening events, state dinners, and diplomatic receptions.")}
    ${card("Business & Professional", "Boardroom-ready attire assessment for client meetings, presentations, and professional settings.")}
    ${card("Cultural & Religious Sites", "Guidance on appropriate attire for temples, mosques, cathedrals, and culturally sensitive venues.")}
    <p style="margin-top:24px;font-size:0.9rem;color:#9a8a7a;">Available to Ambassador members. <a href="/membership" style="color:#8B6914;">View membership plans →</a></p>`);
}

function sensoryBody(): string {
  return pageShell(`
    <h1 style="font-size:2.5rem;margin-bottom:12px;">The Sensory — Ambient Noise Awareness</h1>
    <p style="font-size:1.1rem;color:#6a5a48;margin-bottom:36px;line-height:1.7;">
      Real-time ambient noise monitoring for Ambassador members. Know when your environment exceeds the accepted threshold for refined dining, gallery visits, or professional meetings.
    </p>
    ${card("Fine Dining", "Continuous monitoring against the accepted noise threshold for Michelin-starred restaurants and private dining rooms.")}
    ${card("Gallery & Museum Visits", "Real-time awareness of your contribution to the acoustic environment in cultural institutions.")}
    ${card("Boardrooms & Client Meetings", "Professional noise-level guidance for client-facing environments and boardroom settings.")}
    <p style="margin-top:24px;font-size:0.9rem;color:#9a8a7a;">Available to Ambassador members. <a href="/membership" style="color:#8B6914;">View membership plans →</a></p>`);
}

function navigatorBody(): string {
  return pageShell(`
    <h1 style="font-size:2.5rem;margin-bottom:12px;">The Navigator — Cultural Arrival Briefings</h1>
    <p style="font-size:1.1rem;color:#6a5a48;margin-bottom:36px;line-height:1.7;">
      Pre-trip cultural intelligence for Ambassador members. Receive personalised etiquette briefings for your upcoming travel destinations — delivered before you board.
    </p>
    ${card("Arrival Protocol", "What to expect at customs, taxi etiquette, hotel check-in norms, and the first impressions that define a visit.")}
    ${card("Business Meetings", "Local meeting customs, forms of address, gift-giving protocol, and hierarchy norms for your destination.")}
    ${card("Social & Dining", "Restaurant etiquette, tipping customs, dress expectations, and the social norms of your destination country.")}
    <p style="margin-top:24px;font-size:0.9rem;color:#9a8a7a;">Available to Ambassador members. <a href="/membership" style="color:#8B6914;">View membership plans →</a></p>`);
}

function innerCircleBody(): string {
  return pageShell(`
    <h1 style="font-size:2.5rem;margin-bottom:12px;">The Inner Circle — Ambassador Community</h1>
    <p style="font-size:1.1rem;color:#6a5a48;margin-bottom:36px;line-height:1.7;">
      Exclusive community for Cortéa Ambassador members. Connect with fellow cultural practitioners, share insights from your travels, and access your personalised calling card.
    </p>
    ${card("Cultural Exchange", "Share observations, ask questions, and learn from fellow Ambassadors with experience across every continent.")}
    ${card("Personalised Calling Card", "Your Cortéa profile card: Noble Score, cultural regions practised, and your etiquette specialisations — shareable with peers.")}
    ${card("Exclusive Insights", "First access to new Compass country guides, Atelier scenario sets, and cultural intelligence reports.")}
    <p style="margin-top:24px;font-size:0.9rem;color:#9a8a7a;">Available to Ambassador members. <a href="/membership" style="color:#8B6914;">View membership plans →</a></p>`);
}

function privacyBody(): string {
  return pageShell(`
    <h1 style="font-size:2.5rem;margin-bottom:12px;">Privacy Policy</h1>
    <p style="font-size:1.1rem;color:#6a5a48;margin-bottom:36px;line-height:1.7;">
      Cortéa is committed to protecting your privacy. This policy explains how we collect, use, and protect your personal data.
    </p>
    ${card("Data We Collect", "Account information (name, email), usage data (scenarios practised, Noble Score), and optional cultural preferences. Mirror analysis is processed on-device and never transmitted.")}
    ${card("How We Use Your Data", "To provide and improve the Cortéa service, personalise your cultural intelligence experience, and communicate membership information.")}
    ${card("Data Retention & Deletion", "You may request deletion of your account and all associated data at any time by contacting us or through your profile settings.")}
    ${card("Third-Party Services", "We use industry-standard infrastructure providers. No personal data is sold or shared with advertisers.")}
    ${card("Contact", "For privacy enquiries, contact us at privacy@cortea.app.")}`);
}

// ────────────────────────────────────────────────────────────────────────────
// Head meta builder
// ────────────────────────────────────────────────────────────────────────────

function buildHeadTags(route: RouteMeta): string {
  const canonicalUrl = `${BASE_URL}${route.path}`;
  const desc = esc(route.description);
  const titleEsc = esc(route.title);

  // Each locale gets a distinct URL: en-GB = canonical (no param), others = ?lang=BCP47
  const hreflang = HREFLANG_LOCALES
    .map((l) => {
      const href = l === "en-GB"
        ? canonicalUrl
        : `${canonicalUrl}?lang=${encodeURIComponent(l)}`;
      return `  <link rel="alternate" hreflang="${l}" href="${href}" />`;
    })
    .join("\n");

  const jsonLdArray = route.jsonLd
    ? (Array.isArray(route.jsonLd) ? route.jsonLd : [route.jsonLd])
    : [];

  const jsonLdTags = jsonLdArray
    .map((s) => `  <script type="application/ld+json">${JSON.stringify(s)}</script>`)
    .join("\n");

  return `  <title>${titleEsc}</title>
  <meta name="description" content="${desc}" />
  <link rel="canonical" href="${canonicalUrl}" />
${hreflang}
  <link rel="alternate" hreflang="x-default" href="${canonicalUrl}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Cortéa" />
  <meta property="og:title" content="${titleEsc}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:image" content="${OG_IMAGE}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${titleEsc}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="${OG_IMAGE}" />
${jsonLdTags}`;
}

function buildHtml(baseHtml: string, route: RouteMeta): string {
  // 1. Inject head tags
  let html = baseHtml.replace(/<head>/, `<head>\n${buildHeadTags(route)}`);
  // 2. Inject body content into the React root — crawlers see this immediately;
  //    React's createRoot will replace it once JS loads.
  html = html.replace(
    /<div id="root"><\/div>/,
    `<div id="root">${route.bodyHtml}</div>`,
  );
  return html;
}

function writeRoute(routePath: string, html: string): void {
  const segments = routePath === "/" ? [] : routePath.split("/").filter(Boolean);
  const dir = path.join(DIST_DIR, ...segments);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html, "utf-8");
}

// ────────────────────────────────────────────────────────────────────────────
// Sitemap builder
// ────────────────────────────────────────────────────────────────────────────

function sitemapUrl(urlPath: string, changefreq: string, priority: string): string {
  const loc = `${BASE_URL}${urlPath}`;
  const alts = HREFLANG_LOCALES
    .map((l) => {
      const href = l === "en-GB" ? loc : `${loc}?lang=${encodeURIComponent(l)}`;
      return `    <xhtml:link rel="alternate" hreflang="${l}" href="${href}"/>`;
    })
    .join("\n");
  return `  <url>
    <loc>${loc}</loc>
${alts}
    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}"/>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

// ────────────────────────────────────────────────────────────────────────────
// Database helpers
// ────────────────────────────────────────────────────────────────────────────

async function fetchRegions(): Promise<RegionRow[]> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn("  ⚠  DATABASE_URL not set — Compass pages will use code-only fallback names");
    return [];
  }
  const pool = new pg.Pool({ connectionString: dbUrl });
  try {
    const result = await pool.query<RegionRow>(`
      SELECT
        region_code,
        COALESCE(content->'en-GB'->>'region_name', region_code)  AS region_name,
        content->'en-GB'->>'core_value'                          AS core_value,
        content->'en-GB'->>'dining_etiquette'                    AS dining_etiquette,
        content->'en-GB'->>'dress_code'                          AS dress_code,
        content->'en-GB'->>'language_notes'                      AS language_notes,
        content->'en-GB'->>'biggest_taboo'                       AS biggest_taboo,
        content->'en-GB'->>'gift_protocol'                       AS gift_protocol,
        (content->'en-GB'->'dos')::jsonb                         AS dos,
        (content->'en-GB'->'donts')::jsonb                       AS donts
      FROM compass_regions
      WHERE is_published = true
      ORDER BY region_code
    `);
    return result.rows;
  } catch (err) {
    console.warn("  ⚠  Could not fetch compass regions:", (err as Error).message);
    return [];
  } finally {
    await pool.end();
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────────

async function run(): Promise<void> {
  if (!fs.existsSync(INDEX_HTML)) {
    console.error(`❌  index.html not found at ${INDEX_HTML}. Run \`pnpm build\` first.`);
    process.exit(1);
  }

  const baseHtml = fs.readFileSync(INDEX_HTML, "utf-8");

  console.log("🔍  Fetching published Compass regions from database…");
  const regions = await fetchRegions();
  console.log(`    Found ${regions.length} published regions.`);

  // ── Static routes ──────────────────────────────────────────────────────────
  const staticRoutes: RouteMeta[] = [
    {
      path: "/",
      title: "Cortéa — The Art of Conduct",
      description: "Master cultural etiquette and social refinement across 50+ countries. Practice real scenarios, consult AI counsel, and build your Noble Score.",
      bodyHtml: landingBody(),
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Cortéa",
        "url": BASE_URL,
        "applicationCategory": "EducationalApplication",
        "description": "Cultural intelligence platform for etiquette, cross-cultural communication, and social refinement.",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "GBP" },
      },
    },
    {
      path: "/atelier",
      title: withBrand(tr("seo.atelier.title")),
      description: tr("seo.atelier.description"),
      bodyHtml: atelierBody(),
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Course",
        "name": "Cultural Etiquette Training — The Atelier",
        "description": "Scenario-based etiquette training across five pillars of refined conduct.",
        "provider": { "@type": "Organization", "name": "Cortéa", "url": BASE_URL },
      },
    },
    {
      path: "/compass",
      title: withBrand(tr("seo.compass.title")),
      description: tr("seo.compass.description"),
      bodyHtml: compassBody(regions),
    },
    {
      path: "/counsel",
      title: withBrand(tr("seo.counsel.title")),
      description: tr("seo.counsel.description"),
      bodyHtml: counselBody(),
    },
    {
      path: "/membership",
      title: withBrand(tr("seo.membership.title")),
      description: tr("seo.membership.description"),
      bodyHtml: membershipBody(),
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            { "@type": "Question", "name": "Is the Guest plan free?", "acceptedAnswer": { "@type": "Answer", "text": "Yes — no credit card required. The Guest tier gives genuine access with no time limit." } },
            { "@type": "Question", "name": "What does the Traveller plan include?", "acceptedAnswer": { "@type": "Answer", "text": "Unlimited Atelier scenarios across all five pillars, full Compass access, and unlimited AI Counsel." } },
            { "@type": "Question", "name": "What does the Ambassador plan include?", "acceptedAnswer": { "@type": "Answer", "text": "Everything in Traveller, plus The Mirror, The Sensory, The Navigator, and The Inner Circle." } },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Cortéa Membership",
          "url": `${BASE_URL}/membership`,
          "applicationCategory": "EducationalApplication",
          "offers": [
            { "@type": "Offer", "name": "Guest", "price": "0", "priceCurrency": "GBP" },
            { "@type": "Offer", "name": "Traveller", "priceSpecification": { "@type": "UnitPriceSpecification", "priceType": "https://schema.org/RecurringCharge" } },
            { "@type": "Offer", "name": "Ambassador", "priceSpecification": { "@type": "UnitPriceSpecification", "priceType": "https://schema.org/RecurringCharge" } },
          ],
        },
      ],
    },
    {
      path: "/use-cases",
      title: withBrand(tr("seo.use_cases.title")),
      description: tr("seo.use_cases.description"),
      bodyHtml: useCasesBody(),
    },
    {
      path: "/situations",
      title: "Etiquette Scenarios — The Atelier — Cortéa",
      description: "Scenario-based etiquette practice across five pillars: Dining, Dress, Digital, Professional, and Social. Refine your cultural instincts with AI-guided feedback.",
      bodyHtml: situationsBody(),
    },
    {
      path: "/mirror",
      title: withBrand(tr("seo.mirror.title")),
      description: tr("seo.mirror.description"),
      bodyHtml: mirrorBody(),
    },
    {
      path: "/sensory",
      title: withBrand(tr("seo.sensory.title")),
      description: tr("seo.sensory.description"),
      bodyHtml: sensoryBody(),
    },
    {
      path: "/navigator",
      title: withBrand(tr("seo.navigator.title")),
      description: tr("seo.navigator.description"),
      bodyHtml: navigatorBody(),
    },
    {
      path: "/inner-circle",
      title: withBrand(tr("seo.inner_circle.title")),
      description: tr("seo.inner_circle.description"),
      bodyHtml: innerCircleBody(),
    },
    {
      path: "/privacy-policy",
      title: withBrand(tr("seo.privacy_policy.title", "Privacy Policy")),
      description: tr("seo.privacy_policy.description", "Cortéa privacy policy: how we collect, use, and protect your personal data."),
      bodyHtml: privacyBody(),
    },
  ];

  // ── Compass region routes ──────────────────────────────────────────────────
  const compassRoutes: RouteMeta[] = regions.map((r) => ({
    path: `/compass/${r.region_code}`,
    title: `${r.region_name} Etiquette Guide — Cortéa`,
    description: `Cultural etiquette guide for ${r.region_name}: dining customs, dress codes, gift-giving protocol, communication norms, and social taboos.`,
    bodyHtml: compassRegionBody(r),
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Place",
        "name": r.region_name,
        "description": `Cultural etiquette guide for ${r.region_name}`,
        "url": `${BASE_URL}/compass/${r.region_code}`,
      },
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": `${r.region_name} Etiquette Guide`,
        "url": `${BASE_URL}/compass/${r.region_code}`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Core Cultural Values" },
          { "@type": "ListItem", "position": 2, "name": "Social Taboos" },
          { "@type": "ListItem", "position": 3, "name": "Dining Etiquette" },
          { "@type": "ListItem", "position": 4, "name": "Language & Communication" },
          { "@type": "ListItem", "position": 5, "name": "Gift-Giving Protocol" },
          { "@type": "ListItem", "position": 6, "name": "Dress Code" },
          { "@type": "ListItem", "position": 7, "name": "Dos & Don'ts" },
        ],
      },
    ],
  }));

  const allRoutes = [...staticRoutes, ...compassRoutes];

  console.log(`📄  Generating prerendered HTML for ${allRoutes.length} routes…`);
  for (const route of allRoutes) {
    const html = buildHtml(baseHtml, route);
    writeRoute(route.path, html);
    console.log(`  ✓ ${route.path}`);
  }

  // ── Sitemap ─────────────────────────────────────────────────────────────────
  console.log("\n🗺   Generating sitemap.xml…");
  const sitemapEntries = [
    sitemapUrl("/", "weekly", "1.0"),
    sitemapUrl("/atelier", "monthly", "0.8"),
    sitemapUrl("/compass", "monthly", "0.8"),
    sitemapUrl("/counsel", "monthly", "0.8"),
    sitemapUrl("/membership", "monthly", "0.7"),
    sitemapUrl("/use-cases", "monthly", "0.6"),
    sitemapUrl("/situations", "monthly", "0.6"),
    sitemapUrl("/privacy-policy", "yearly", "0.3"),
    ...regions.map((r) => sitemapUrl(`/compass/${r.region_code}`, "monthly", "0.7")),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${sitemapEntries.join("\n")}
</urlset>`;

  fs.writeFileSync(path.join(DIST_DIR, "sitemap.xml"), sitemap, "utf-8");
  console.log(`  ✓ sitemap.xml (${sitemapEntries.length} URLs)`);
  console.log(`\n✅  Prerendered ${allRoutes.length} routes in ${DIST_DIR}`);
}

run().catch((err) => {
  console.error("❌  Prerender failed:", err);
  process.exit(1);
});
