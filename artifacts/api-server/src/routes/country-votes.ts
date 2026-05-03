import { Router } from "express";
import { db } from "@workspace/db";
import { countryVotesTable, compassRegionsTable, usersTable } from "@workspace/db";
import { and, eq, sql, desc, inArray } from "drizzle-orm";
import { z } from "zod";
import { requireAuthUser, getResolvedUserId } from "../lib/auth-middleware";

const router = Router();

const VOTES_PER_USER_PER_PERIOD = 5;

function currentPeriodYm(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

const COUNTRY_NAMES: Record<string, { name: string; flag: string }> = {
  RS: { name: "Servië", flag: "🇷🇸" },
  LT: { name: "Litouwen", flag: "🇱🇹" },
  SK: { name: "Slowakije", flag: "🇸🇰" },
  BD: { name: "Bangladesh", flag: "🇧🇩" },
  MM: { name: "Myanmar", flag: "🇲🇲" },
  BT: { name: "Bhutan", flag: "🇧🇹" },
  KW: { name: "Koeweit", flag: "🇰🇼" },
  DZ: { name: "Algerije", flag: "🇩🇿" },
  DO: { name: "Dominicaanse Republiek", flag: "🇩🇴" },
  PA: { name: "Panama", flag: "🇵🇦" },
  AF: { name: "Afghanistan", flag: "🇦🇫" },
  AL: { name: "Albanië", flag: "🇦🇱" },
  AM: { name: "Armenië", flag: "🇦🇲" },
  AO: { name: "Angola", flag: "🇦🇴" },
  AZ: { name: "Azerbeidzjan", flag: "🇦🇿" },
  BA: { name: "Bosnië en Herzegovina", flag: "🇧🇦" },
  BB: { name: "Barbados", flag: "🇧🇧" },
  BF: { name: "Burkina Faso", flag: "🇧🇫" },
  BI: { name: "Burundi", flag: "🇧🇮" },
  BJ: { name: "Benin", flag: "🇧🇯" },
  BN: { name: "Brunei", flag: "🇧🇳" },
  BO: { name: "Bolivia", flag: "🇧🇴" },
  BS: { name: "Bahama's", flag: "🇧🇸" },
  BY: { name: "Belarus", flag: "🇧🇾" },
  BZ: { name: "Belize", flag: "🇧🇿" },
  CD: { name: "DR Congo", flag: "🇨🇩" },
  CF: { name: "Centraal-Afrikaanse Republiek", flag: "🇨🇫" },
  CG: { name: "Congo-Brazzaville", flag: "🇨🇬" },
  CI: { name: "Ivoorkust", flag: "🇨🇮" },
  CM: { name: "Kameroen", flag: "🇨🇲" },
  CV: { name: "Kaapverdië", flag: "🇨🇻" },
  DJ: { name: "Djibouti", flag: "🇩🇯" },
  DM: { name: "Dominica", flag: "🇩🇲" },
  EC: { name: "Ecuador", flag: "🇪🇨" },
  ER: { name: "Eritrea", flag: "🇪🇷" },
  GA: { name: "Gabon", flag: "🇬🇦" },
  GD: { name: "Grenada", flag: "🇬🇩" },
  GE: { name: "Georgië", flag: "🇬🇪" },
  GM: { name: "Gambia", flag: "🇬🇲" },
  GN: { name: "Guinee", flag: "🇬🇳" },
  GQ: { name: "Equatoriaal-Guinea", flag: "🇬🇶" },
  GT: { name: "Guatemala", flag: "🇬🇹" },
  GW: { name: "Guinee-Bissau", flag: "🇬🇼" },
  GY: { name: "Guyana", flag: "🇬🇾" },
  HN: { name: "Honduras", flag: "🇭🇳" },
  HT: { name: "Haïti", flag: "🇭🇹" },
  IQ: { name: "Irak", flag: "🇮🇶" },
  IR: { name: "Iran", flag: "🇮🇷" },
  JM: { name: "Jamaica", flag: "🇯🇲" },
  KG: { name: "Kirgizië", flag: "🇰🇬" },
  KM: { name: "Comoren", flag: "🇰🇲" },
  KN: { name: "Saint Kitts en Nevis", flag: "🇰🇳" },
  KP: { name: "Noord-Korea", flag: "🇰🇵" },
  KZ: { name: "Kazachstan", flag: "🇰🇿" },
  LA: { name: "Laos", flag: "🇱🇦" },
  LC: { name: "Saint Lucia", flag: "🇱🇨" },
  LI: { name: "Liechtenstein", flag: "🇱🇮" },
  LR: { name: "Liberia", flag: "🇱🇷" },
  LS: { name: "Lesotho", flag: "🇱🇸" },
  LV: { name: "Letland", flag: "🇱🇻" },
  LY: { name: "Libië", flag: "🇱🇾" },
  MC: { name: "Monaco", flag: "🇲🇨" },
  MD: { name: "Moldavië", flag: "🇲🇩" },
  ME: { name: "Montenegro", flag: "🇲🇪" },
  MG: { name: "Madagaskar", flag: "🇲🇬" },
  MK: { name: "Noord-Macedonië", flag: "🇲🇰" },
  ML: { name: "Mali", flag: "🇲🇱" },
  MR: { name: "Mauritanië", flag: "🇲🇷" },
  MW: { name: "Malawi", flag: "🇲🇼" },
  MZ: { name: "Mozambique", flag: "🇲🇿" },
  NA: { name: "Namibië", flag: "🇳🇦" },
  NE: { name: "Niger", flag: "🇳🇪" },
  NI: { name: "Nicaragua", flag: "🇳🇮" },
  PG: { name: "Papoea-Nieuw-Guinea", flag: "🇵🇬" },
  PY: { name: "Paraguay", flag: "🇵🇾" },
  SB: { name: "Salomonseilanden", flag: "🇸🇧" },
  SC: { name: "Seychellen", flag: "🇸🇨" },
  SD: { name: "Soedan", flag: "🇸🇩" },
  SL: { name: "Sierra Leone", flag: "🇸🇱" },
  SM: { name: "San Marino", flag: "🇸🇲" },
  SO: { name: "Somalië", flag: "🇸🇴" },
  SR: { name: "Suriname", flag: "🇸🇷" },
  SS: { name: "Zuid-Soedan", flag: "🇸🇸" },
  ST: { name: "Sao Tomé en Principe", flag: "🇸🇹" },
  SV: { name: "El Salvador", flag: "🇸🇻" },
  SY: { name: "Syrië", flag: "🇸🇾" },
  SZ: { name: "Eswatini", flag: "🇸🇿" },
  TD: { name: "Tsjaad", flag: "🇹🇩" },
  TG: { name: "Togo", flag: "🇹🇬" },
  TJ: { name: "Tadzjikistan", flag: "🇹🇯" },
  TL: { name: "Oost-Timor", flag: "🇹🇱" },
  TM: { name: "Turkmenistan", flag: "🇹🇲" },
  TT: { name: "Trinidad en Tobago", flag: "🇹🇹" },
  UG: { name: "Oeganda", flag: "🇺🇬" },
  UZ: { name: "Oezbekistan", flag: "🇺🇿" },
  VC: { name: "Saint Vincent en de Grenadines", flag: "🇻🇨" },
  VE: { name: "Venezuela", flag: "🇻🇪" },
  VU: { name: "Vanuatu", flag: "🇻🇺" },
  WS: { name: "Samoa", flag: "🇼🇸" },
  YE: { name: "Jemen", flag: "🇾🇪" },
  ZM: { name: "Zambia", flag: "🇿🇲" },
  ZW: { name: "Zimbabwe", flag: "🇿🇼" },
};

async function getVotableCountries(): Promise<Array<{ region_code: string; region_name: string; flag_emoji: string | null }>> {
  const rows = await db
    .select({
      region_code: compassRegionsTable.region_code,
      flag_emoji: compassRegionsTable.flag_emoji,
      is_published: compassRegionsTable.is_published,
    })
    .from(compassRegionsTable);
  const publishedCodes = new Set(rows.filter((r) => r.is_published).map((r) => r.region_code));
  const stubByCode = new Map(rows.filter((r) => !r.is_published).map((r) => [r.region_code, r]));
  const out: Array<{ region_code: string; region_name: string; flag_emoji: string | null }> = [];
  for (const code of Object.keys(COUNTRY_NAMES)) {
    if (publishedCodes.has(code)) continue;
    const stub = stubByCode.get(code);
    out.push({
      region_code: code,
      region_name: COUNTRY_NAMES[code].name,
      flag_emoji: stub?.flag_emoji ?? COUNTRY_NAMES[code].flag,
    });
  }
  out.sort((a, b) => a.region_name.localeCompare(b.region_name, "nl"));
  return out;
}

router.get("/votes/countries", requireAuthUser, async (_req, res) => {
  try {
    const list = await getVotableCountries();
    return res.json({ countries: list, period: currentPeriodYm(), max_votes: VOTES_PER_USER_PER_PERIOD });
  } catch (err) {
    return res.status(500).json({ error: "Unable to load votable countries." });
  }
});

router.get("/votes/me", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);
    const period = currentPeriodYm();
    const rows = await db
      .select({ region_code: countryVotesTable.region_code, created_at: countryVotesTable.created_at })
      .from(countryVotesTable)
      .where(and(eq(countryVotesTable.user_id, userId), eq(countryVotesTable.period_ym, period)));
    return res.json({ votes: rows, period, max_votes: VOTES_PER_USER_PER_PERIOD });
  } catch (err) {
    return res.status(500).json({ error: "Unable to load votes." });
  }
});

const VoteBody = z.object({ region_code: z.string().regex(/^[A-Z]{2}$/) });

router.post("/votes", requireAuthUser, async (req, res) => {
  try {
    const parsed = VoteBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid region_code." });
    const userId = getResolvedUserId(req);
    const period = currentPeriodYm();
    const code = parsed.data.region_code.toUpperCase();

    if (!COUNTRY_NAMES[code]) {
      const stub = await db
        .select({ region_code: compassRegionsTable.region_code, is_published: compassRegionsTable.is_published })
        .from(compassRegionsTable)
        .where(eq(compassRegionsTable.region_code, code))
        .limit(1);
      if (stub.length && stub[0].is_published) {
        return res.status(400).json({ error: "Dit land is al beschikbaar in de Compass." });
      }
      if (!stub.length) {
        return res.status(400).json({ error: "Onbekende landcode." });
      }
    } else {
      const published = await db
        .select({ is_published: compassRegionsTable.is_published })
        .from(compassRegionsTable)
        .where(eq(compassRegionsTable.region_code, code))
        .limit(1);
      if (published.length && published[0].is_published) {
        return res.status(400).json({ error: "Dit land is al beschikbaar in de Compass." });
      }
    }

    const existing = await db
      .select({ region_code: countryVotesTable.region_code })
      .from(countryVotesTable)
      .where(and(eq(countryVotesTable.user_id, userId), eq(countryVotesTable.period_ym, period)));
    if (existing.some((r) => r.region_code === code)) {
      return res.status(409).json({ error: "Je hebt al op dit land gestemd deze maand." });
    }
    if (existing.length >= VOTES_PER_USER_PER_PERIOD) {
      return res.status(409).json({ error: `Je hebt het maximum van ${VOTES_PER_USER_PER_PERIOD} stemmen voor deze maand bereikt.` });
    }
    await db.insert(countryVotesTable).values({ user_id: userId, region_code: code, period_ym: period });
    return res.json({ ok: true, region_code: code, period });
  } catch (err) {
    req.log?.error?.({ err }, "Failed to cast country vote");
    return res.status(500).json({ error: "Unable to record vote." });
  }
});

router.delete("/votes/:regionCode", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);
    const period = currentPeriodYm();
    const code = String(req.params.regionCode || "").toUpperCase();
    if (!/^[A-Z]{2}$/.test(code)) return res.status(400).json({ error: "Invalid region_code." });
    await db
      .delete(countryVotesTable)
      .where(
        and(
          eq(countryVotesTable.user_id, userId),
          eq(countryVotesTable.region_code, code),
          eq(countryVotesTable.period_ym, period)
        )
      );
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: "Unable to remove vote." });
  }
});

// Admin overview — requires admin (mounted under same /api router; reuse admin middleware pattern locally)
router.get("/admin/votes/countries", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);
    const u = await db
      .select({ is_admin: usersTable.is_admin, suspended_at: usersTable.suspended_at })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    if (!u.length || !u[0].is_admin || u[0].suspended_at) {
      return res.status(403).json({ error: "Admin only." });
    }

    const period = String(req.query.period || currentPeriodYm());

    const tally = await db.execute(sql`
      SELECT region_code, COUNT(*)::int AS votes
      FROM country_votes
      WHERE period_ym = ${period}
      GROUP BY region_code
      ORDER BY votes DESC, region_code ASC
    `);

    const periods = await db.execute(sql`
      SELECT period_ym, COUNT(*)::int AS total_votes, COUNT(DISTINCT user_id)::int AS unique_voters
      FROM country_votes
      GROUP BY period_ym
      ORDER BY period_ym DESC
      LIMIT 24
    `);

    const rows = (tally.rows ?? tally) as Array<{ region_code: string; votes: number }>;
    const enriched = rows.map((r) => ({
      region_code: r.region_code,
      votes: r.votes,
      region_name: COUNTRY_NAMES[r.region_code]?.name ?? r.region_code,
      flag_emoji: COUNTRY_NAMES[r.region_code]?.flag ?? null,
    }));

    return res.json({
      period,
      current_period: currentPeriodYm(),
      tally: enriched,
      periods: (periods.rows ?? periods) as Array<{ period_ym: string; total_votes: number; unique_voters: number }>,
      total_votes: enriched.reduce((s, r) => s + r.votes, 0),
    });
  } catch (err) {
    req.log?.error?.({ err }, "Failed to load admin votes");
    return res.status(500).json({ error: "Unable to load votes overview." });
  }
});

export { router as countryVotesRouter };
