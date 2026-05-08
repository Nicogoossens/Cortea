/**
 * Seed the country_archetype_extensions table.
 * Stores country-level pillar-weight overrides that sit on top of the
 * universal ARCHETYPE_WEIGHTS in learning-engine-pure.ts.
 *
 * Priority countries: BE, FR, JP, GB, DE, NL, US, AE, IT, ES, SG, CH, AT
 * Archetypes:         diplomate | urbanist | aesthete | scholar | cosmopolite | virtuose
 * Pillars:            P1 (Presence/Appearance) · P2 (Knowledge) · P3 (Communication) · P4 (Social Skills)
 *
 * Usage:
 *   node_modules/.pnpm/node_modules/.bin/tsx artifacts/api-server/src/scripts/seed-country-archetype-extensions.ts
 *
 * Idempotent — upserts on (country_code, archetype). Safe to run repeatedly.
 * Targets PROD_DATABASE_URL when set, otherwise DATABASE_URL.
 */
import { db, pool } from "@workspace/db";
import { countryArchetypeExtensionsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

interface Entry {
  country_code: string;
  archetype: string;
  pillar_weights: Record<string, number>;
}

/**
 * Cultural calibration rationale (§9.8 — Country Archetype Extensions):
 *
 * BE (Belgium): Formal, protocol-heavy → diplomate/scholar slightly boosted on P2/P3.
 * FR (France):  Aesthetics + oratory → aesthete/cosmopolite stronger on P1/P3.
 * JP (Japan):   High ceremony + composure → diplomate/aesthete heavily on P1; P3 understated.
 * GB (UK):      Understatement + club culture → urbanist/scholar slight P2/P4 tilt.
 * DE (Germany): Precision + knowledge → scholar/cosmopolite P2 boost.
 * NL (Netherlands): Direct, practical → diplomate P3 reduced, urbanist P4 up.
 * US (USA):     Networking-first → cosmopolite/urbanist P4 boosted.
 * AE (UAE):     Hospitality + hierarchy → diplomate P4 up, aesthete P1 high.
 * IT (Italy):   Style + bella figura → aesthete P1 very high, virtuose P1/P3.
 * ES (Spain):   Social warmth → cosmopolite P4 up, urbanist P3 up.
 * SG (Singapore): Multi-cultural formality → cosmopolite balanced; scholar P2 up.
 * CH (Switzerland): Precision + discretion → scholar P2/P3, diplomate P2 boosted.
 * AT (Austria): Ceremonial + cultural → aesthete P1, scholar P2 up.
 */
const ENTRIES: Entry[] = [

  // ── BE (Belgium) ──────────────────────────────────────────────────────────
  { country_code: "BE", archetype: "diplomate",   pillar_weights: { P1: 1.0, P2: 1.3, P3: 1.5, P4: 1.2 } },
  { country_code: "BE", archetype: "urbanist",    pillar_weights: { P1: 1.2, P2: 1.0, P3: 1.0, P4: 1.5 } },
  { country_code: "BE", archetype: "aesthete",    pillar_weights: { P1: 1.5, P2: 1.0, P3: 0.9, P4: 1.2 } },
  { country_code: "BE", archetype: "scholar",     pillar_weights: { P1: 1.0, P2: 1.8, P3: 1.3, P4: 1.0 } },
  { country_code: "BE", archetype: "cosmopolite", pillar_weights: { P1: 1.1, P2: 1.2, P3: 1.2, P4: 1.1 } },
  { country_code: "BE", archetype: "virtuose",    pillar_weights: { P1: 1.8, P2: 1.0, P3: 1.0, P4: 1.2 } },

  // ── FR (France) ───────────────────────────────────────────────────────────
  { country_code: "FR", archetype: "diplomate",   pillar_weights: { P1: 1.0, P2: 1.2, P3: 2.0, P4: 1.0 } },
  { country_code: "FR", archetype: "urbanist",    pillar_weights: { P1: 1.5, P2: 1.0, P3: 1.2, P4: 1.5 } },
  { country_code: "FR", archetype: "aesthete",    pillar_weights: { P1: 2.5, P2: 0.9, P3: 0.8, P4: 1.2 } },
  { country_code: "FR", archetype: "scholar",     pillar_weights: { P1: 0.9, P2: 2.0, P3: 1.8, P4: 0.9 } },
  { country_code: "FR", archetype: "cosmopolite", pillar_weights: { P1: 1.5, P2: 1.2, P3: 1.5, P4: 1.0 } },
  { country_code: "FR", archetype: "virtuose",    pillar_weights: { P1: 2.2, P2: 1.0, P3: 1.2, P4: 1.0 } },

  // ── JP (Japan) ────────────────────────────────────────────────────────────
  { country_code: "JP", archetype: "diplomate",   pillar_weights: { P1: 1.8, P2: 1.2, P3: 0.8, P4: 2.0 } },
  { country_code: "JP", archetype: "urbanist",    pillar_weights: { P1: 1.5, P2: 1.2, P3: 0.9, P4: 1.8 } },
  { country_code: "JP", archetype: "aesthete",    pillar_weights: { P1: 2.5, P2: 1.0, P3: 0.7, P4: 1.5 } },
  { country_code: "JP", archetype: "scholar",     pillar_weights: { P1: 1.2, P2: 2.2, P3: 1.0, P4: 1.5 } },
  { country_code: "JP", archetype: "cosmopolite", pillar_weights: { P1: 1.5, P2: 1.3, P3: 1.0, P4: 1.5 } },
  { country_code: "JP", archetype: "virtuose",    pillar_weights: { P1: 2.2, P2: 1.0, P3: 0.8, P4: 1.5 } },

  // ── GB (United Kingdom) ───────────────────────────────────────────────────
  { country_code: "GB", archetype: "diplomate",   pillar_weights: { P1: 1.0, P2: 1.2, P3: 1.8, P4: 1.2 } },
  { country_code: "GB", archetype: "urbanist",    pillar_weights: { P1: 1.2, P2: 1.2, P3: 1.0, P4: 2.0 } },
  { country_code: "GB", archetype: "aesthete",    pillar_weights: { P1: 1.8, P2: 1.0, P3: 0.9, P4: 1.2 } },
  { country_code: "GB", archetype: "scholar",     pillar_weights: { P1: 0.9, P2: 2.2, P3: 1.5, P4: 1.2 } },
  { country_code: "GB", archetype: "cosmopolite", pillar_weights: { P1: 1.1, P2: 1.2, P3: 1.3, P4: 1.5 } },
  { country_code: "GB", archetype: "virtuose",    pillar_weights: { P1: 1.8, P2: 1.0, P3: 1.0, P4: 1.5 } },

  // ── DE (Germany) ─────────────────────────────────────────────────────────
  { country_code: "DE", archetype: "diplomate",   pillar_weights: { P1: 0.9, P2: 1.5, P3: 1.5, P4: 1.0 } },
  { country_code: "DE", archetype: "urbanist",    pillar_weights: { P1: 1.0, P2: 1.2, P3: 1.0, P4: 1.5 } },
  { country_code: "DE", archetype: "aesthete",    pillar_weights: { P1: 1.5, P2: 1.2, P3: 0.9, P4: 1.0 } },
  { country_code: "DE", archetype: "scholar",     pillar_weights: { P1: 0.8, P2: 2.5, P3: 1.5, P4: 0.9 } },
  { country_code: "DE", archetype: "cosmopolite", pillar_weights: { P1: 1.0, P2: 1.5, P3: 1.2, P4: 1.2 } },
  { country_code: "DE", archetype: "virtuose",    pillar_weights: { P1: 1.5, P2: 1.5, P3: 0.9, P4: 1.0 } },

  // ── NL (Netherlands) ─────────────────────────────────────────────────────
  { country_code: "NL", archetype: "diplomate",   pillar_weights: { P1: 0.9, P2: 1.2, P3: 1.8, P4: 1.0 } },
  { country_code: "NL", archetype: "urbanist",    pillar_weights: { P1: 1.2, P2: 1.0, P3: 1.0, P4: 2.0 } },
  { country_code: "NL", archetype: "aesthete",    pillar_weights: { P1: 1.8, P2: 1.0, P3: 0.9, P4: 1.0 } },
  { country_code: "NL", archetype: "scholar",     pillar_weights: { P1: 0.9, P2: 2.0, P3: 1.5, P4: 1.0 } },
  { country_code: "NL", archetype: "cosmopolite", pillar_weights: { P1: 1.0, P2: 1.2, P3: 1.2, P4: 1.5 } },
  { country_code: "NL", archetype: "virtuose",    pillar_weights: { P1: 1.8, P2: 1.0, P3: 1.0, P4: 1.2 } },

  // ── US (United States) ───────────────────────────────────────────────────
  { country_code: "US", archetype: "diplomate",   pillar_weights: { P1: 0.9, P2: 1.0, P3: 1.5, P4: 1.8 } },
  { country_code: "US", archetype: "urbanist",    pillar_weights: { P1: 1.2, P2: 1.0, P3: 1.2, P4: 2.0 } },
  { country_code: "US", archetype: "aesthete",    pillar_weights: { P1: 1.8, P2: 0.9, P3: 1.0, P4: 1.5 } },
  { country_code: "US", archetype: "scholar",     pillar_weights: { P1: 0.9, P2: 2.0, P3: 1.5, P4: 1.2 } },
  { country_code: "US", archetype: "cosmopolite", pillar_weights: { P1: 1.0, P2: 1.0, P3: 1.2, P4: 2.0 } },
  { country_code: "US", archetype: "virtuose",    pillar_weights: { P1: 1.8, P2: 0.9, P3: 1.2, P4: 1.5 } },

  // ── AE (UAE) ─────────────────────────────────────────────────────────────
  { country_code: "AE", archetype: "diplomate",   pillar_weights: { P1: 1.5, P2: 1.0, P3: 1.2, P4: 2.2 } },
  { country_code: "AE", archetype: "urbanist",    pillar_weights: { P1: 1.5, P2: 1.0, P3: 1.0, P4: 2.0 } },
  { country_code: "AE", archetype: "aesthete",    pillar_weights: { P1: 2.5, P2: 0.8, P3: 0.8, P4: 1.5 } },
  { country_code: "AE", archetype: "scholar",     pillar_weights: { P1: 1.0, P2: 1.8, P3: 1.0, P4: 1.5 } },
  { country_code: "AE", archetype: "cosmopolite", pillar_weights: { P1: 1.5, P2: 1.0, P3: 1.0, P4: 2.0 } },
  { country_code: "AE", archetype: "virtuose",    pillar_weights: { P1: 2.2, P2: 0.9, P3: 0.9, P4: 1.8 } },

  // ── IT (Italy) ────────────────────────────────────────────────────────────
  { country_code: "IT", archetype: "diplomate",   pillar_weights: { P1: 1.2, P2: 1.0, P3: 1.8, P4: 1.5 } },
  { country_code: "IT", archetype: "urbanist",    pillar_weights: { P1: 1.8, P2: 1.0, P3: 1.2, P4: 1.8 } },
  { country_code: "IT", archetype: "aesthete",    pillar_weights: { P1: 3.0, P2: 0.8, P3: 0.8, P4: 1.2 } },
  { country_code: "IT", archetype: "scholar",     pillar_weights: { P1: 1.0, P2: 2.0, P3: 1.5, P4: 1.0 } },
  { country_code: "IT", archetype: "cosmopolite", pillar_weights: { P1: 1.5, P2: 1.0, P3: 1.5, P4: 1.5 } },
  { country_code: "IT", archetype: "virtuose",    pillar_weights: { P1: 2.8, P2: 0.9, P3: 1.2, P4: 1.2 } },

  // ── ES (Spain) ────────────────────────────────────────────────────────────
  { country_code: "ES", archetype: "diplomate",   pillar_weights: { P1: 1.0, P2: 1.0, P3: 1.8, P4: 1.8 } },
  { country_code: "ES", archetype: "urbanist",    pillar_weights: { P1: 1.5, P2: 1.0, P3: 1.5, P4: 2.0 } },
  { country_code: "ES", archetype: "aesthete",    pillar_weights: { P1: 2.2, P2: 0.9, P3: 1.0, P4: 1.5 } },
  { country_code: "ES", archetype: "scholar",     pillar_weights: { P1: 0.9, P2: 1.8, P3: 1.5, P4: 1.2 } },
  { country_code: "ES", archetype: "cosmopolite", pillar_weights: { P1: 1.2, P2: 1.0, P3: 1.5, P4: 2.0 } },
  { country_code: "ES", archetype: "virtuose",    pillar_weights: { P1: 2.0, P2: 0.9, P3: 1.5, P4: 1.5 } },

  // ── SG (Singapore) ────────────────────────────────────────────────────────
  { country_code: "SG", archetype: "diplomate",   pillar_weights: { P1: 1.2, P2: 1.5, P3: 1.5, P4: 1.5 } },
  { country_code: "SG", archetype: "urbanist",    pillar_weights: { P1: 1.5, P2: 1.2, P3: 1.0, P4: 1.8 } },
  { country_code: "SG", archetype: "aesthete",    pillar_weights: { P1: 2.0, P2: 1.2, P3: 0.9, P4: 1.2 } },
  { country_code: "SG", archetype: "scholar",     pillar_weights: { P1: 1.0, P2: 2.5, P3: 1.5, P4: 1.2 } },
  { country_code: "SG", archetype: "cosmopolite", pillar_weights: { P1: 1.2, P2: 1.5, P3: 1.5, P4: 1.5 } },
  { country_code: "SG", archetype: "virtuose",    pillar_weights: { P1: 1.8, P2: 1.2, P3: 1.0, P4: 1.5 } },

  // ── CH (Switzerland) ─────────────────────────────────────────────────────
  { country_code: "CH", archetype: "diplomate",   pillar_weights: { P1: 1.0, P2: 1.8, P3: 1.5, P4: 1.0 } },
  { country_code: "CH", archetype: "urbanist",    pillar_weights: { P1: 1.2, P2: 1.2, P3: 1.0, P4: 1.5 } },
  { country_code: "CH", archetype: "aesthete",    pillar_weights: { P1: 1.8, P2: 1.2, P3: 0.9, P4: 1.0 } },
  { country_code: "CH", archetype: "scholar",     pillar_weights: { P1: 0.9, P2: 2.5, P3: 1.5, P4: 0.9 } },
  { country_code: "CH", archetype: "cosmopolite", pillar_weights: { P1: 1.0, P2: 1.5, P3: 1.5, P4: 1.2 } },
  { country_code: "CH", archetype: "virtuose",    pillar_weights: { P1: 1.8, P2: 1.2, P3: 1.0, P4: 1.0 } },

  // ── AT (Austria) ─────────────────────────────────────────────────────────
  { country_code: "AT", archetype: "diplomate",   pillar_weights: { P1: 1.2, P2: 1.5, P3: 1.5, P4: 1.0 } },
  { country_code: "AT", archetype: "urbanist",    pillar_weights: { P1: 1.5, P2: 1.2, P3: 1.0, P4: 1.5 } },
  { country_code: "AT", archetype: "aesthete",    pillar_weights: { P1: 2.5, P2: 1.0, P3: 0.9, P4: 1.0 } },
  { country_code: "AT", archetype: "scholar",     pillar_weights: { P1: 1.0, P2: 2.2, P3: 1.5, P4: 1.0 } },
  { country_code: "AT", archetype: "cosmopolite", pillar_weights: { P1: 1.2, P2: 1.5, P3: 1.5, P4: 1.0 } },
  { country_code: "AT", archetype: "virtuose",    pillar_weights: { P1: 2.2, P2: 1.2, P3: 1.0, P4: 1.0 } },
];

async function main() {
  console.log(`[seed-country-archetype-extensions] Upserting ${ENTRIES.length} entries…`);

  for (const entry of ENTRIES) {
    await db
      .insert(countryArchetypeExtensionsTable)
      .values(entry)
      .onConflictDoUpdate({
        target: [
          countryArchetypeExtensionsTable.country_code,
          countryArchetypeExtensionsTable.archetype,
        ],
        set: {
          pillar_weights: sql`excluded.pillar_weights`,
        },
      });
  }

  console.log(`[seed-country-archetype-extensions] Done. ${ENTRIES.length} entries upserted.`);

  // Validation: confirm key entries present
  const result = await db.execute(sql`
    SELECT country_code, archetype, pillar_weights
    FROM country_archetype_extensions
    WHERE country_code IN ('BE', 'JP', 'FR')
    ORDER BY country_code, archetype
  `);
  console.log("[seed-country-archetype-extensions] Sample validation (BE, JP, FR):");
  for (const row of result.rows as { country_code: string; archetype: string; pillar_weights: Record<string, number> }[]) {
    console.log(`  ${row.country_code}/${row.archetype}: ${JSON.stringify(row.pillar_weights)}`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error("[seed-country-archetype-extensions] Failed:", err);
  process.exit(1);
});
