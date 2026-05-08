/**
 * Seed the region_dimension_weights table.
 * Applies culturally-calibrated multipliers per Compass dimension (§9.7).
 *
 * Usage:
 *   pnpm --filter @workspace/api-server tsx src/scripts/seed-region-weights.ts
 *
 * Idempotent — upserts on region_code. Safe to run repeatedly.
 * Targets PROD_DATABASE_URL when set, otherwise DATABASE_URL.
 */
import { db, pool } from "@workspace/db";
import { regionDimensionWeightsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

interface RegionWeight {
  region_code: string;
  attentiveness: number;
  composure: number;
  discernment: number;
  diplomacy: number;
  presence: number;
}

const WEIGHTS: RegionWeight[] = [
  // ── Noord-Europees cluster: BE, NL, DE, SE, DK ────────────────────────────
  // Discernment + Composure high; Presence understated
  { region_code: "BE", attentiveness: 1.0, composure: 1.2, discernment: 1.2, diplomacy: 1.0, presence: 0.8 },
  { region_code: "NL", attentiveness: 1.0, composure: 1.2, discernment: 1.2, diplomacy: 1.0, presence: 0.8 },
  { region_code: "DE", attentiveness: 1.0, composure: 1.2, discernment: 1.2, diplomacy: 1.0, presence: 0.8 },
  { region_code: "SE", attentiveness: 1.0, composure: 1.2, discernment: 1.2, diplomacy: 1.0, presence: 0.8 },
  { region_code: "DK", attentiveness: 1.0, composure: 1.2, discernment: 1.2, diplomacy: 1.0, presence: 0.8 },
  { region_code: "NO", attentiveness: 1.0, composure: 1.2, discernment: 1.2, diplomacy: 1.0, presence: 0.8 },
  { region_code: "FI", attentiveness: 1.0, composure: 1.2, discernment: 1.2, diplomacy: 1.0, presence: 0.8 },
  { region_code: "AT", attentiveness: 1.0, composure: 1.2, discernment: 1.2, diplomacy: 1.0, presence: 0.8 },
  { region_code: "CH", attentiveness: 1.0, composure: 1.2, discernment: 1.2, diplomacy: 1.0, presence: 0.8 },

  // ── Anglo cluster: GB, IE, US, AU, CA ────────────────────────────────────
  // Diplomacy + Composure elevated; directness in presentation
  { region_code: "GB", attentiveness: 1.0, composure: 1.1, discernment: 1.0, diplomacy: 1.2, presence: 1.0 },
  { region_code: "IE", attentiveness: 1.0, composure: 1.1, discernment: 1.0, diplomacy: 1.2, presence: 1.0 },
  { region_code: "US", attentiveness: 1.0, composure: 1.1, discernment: 1.0, diplomacy: 1.2, presence: 1.0 },
  { region_code: "AU", attentiveness: 1.0, composure: 1.1, discernment: 1.0, diplomacy: 1.2, presence: 1.0 },
  { region_code: "CA", attentiveness: 1.0, composure: 1.1, discernment: 1.0, diplomacy: 1.2, presence: 1.0 },
  { region_code: "NZ", attentiveness: 1.0, composure: 1.1, discernment: 1.0, diplomacy: 1.2, presence: 1.0 },

  // ── Latijns cluster: FR, IT, ES, PT ──────────────────────────────────────
  // Presence + Diplomacy elevated; expressive, social warmth
  { region_code: "FR", attentiveness: 1.0, composure: 1.0, discernment: 1.0, diplomacy: 1.1, presence: 1.2 },
  { region_code: "IT", attentiveness: 1.0, composure: 1.0, discernment: 1.0, diplomacy: 1.1, presence: 1.2 },
  { region_code: "ES", attentiveness: 1.0, composure: 1.0, discernment: 1.0, diplomacy: 1.1, presence: 1.2 },
  { region_code: "PT", attentiveness: 1.0, composure: 1.0, discernment: 1.0, diplomacy: 1.1, presence: 1.2 },
  { region_code: "BR", attentiveness: 1.0, composure: 1.0, discernment: 1.0, diplomacy: 1.1, presence: 1.2 },
  { region_code: "MX", attentiveness: 1.0, composure: 1.0, discernment: 1.0, diplomacy: 1.1, presence: 1.2 },
  { region_code: "AR", attentiveness: 1.0, composure: 1.0, discernment: 1.0, diplomacy: 1.1, presence: 1.2 },
  { region_code: "GR", attentiveness: 1.0, composure: 1.0, discernment: 1.0, diplomacy: 1.1, presence: 1.2 },

  // ── Confuciaans-Oost cluster: JP, KR, CN ─────────────────────────────────
  // Attentiveness + Discernment very high; Presence deeply understated
  { region_code: "JP", attentiveness: 1.3, composure: 1.0, discernment: 1.2, diplomacy: 1.0, presence: 0.8 },
  { region_code: "KR", attentiveness: 1.3, composure: 1.0, discernment: 1.2, diplomacy: 1.0, presence: 0.8 },
  { region_code: "CN", attentiveness: 1.3, composure: 1.0, discernment: 1.2, diplomacy: 1.0, presence: 0.8 },
  { region_code: "TW", attentiveness: 1.3, composure: 1.0, discernment: 1.2, diplomacy: 1.0, presence: 0.8 },
  { region_code: "SG", attentiveness: 1.2, composure: 1.0, discernment: 1.2, diplomacy: 1.0, presence: 0.9 },
  { region_code: "HK", attentiveness: 1.2, composure: 1.0, discernment: 1.2, diplomacy: 1.0, presence: 0.9 },

  // ── Arabisch cluster: AE, SA, EG ─────────────────────────────────────────
  // Diplomacy + Presence elevated; hospitality and dignity
  { region_code: "AE", attentiveness: 1.0, composure: 1.0, discernment: 1.0, diplomacy: 1.2, presence: 1.1 },
  { region_code: "SA", attentiveness: 1.0, composure: 1.0, discernment: 1.0, diplomacy: 1.2, presence: 1.1 },
  { region_code: "EG", attentiveness: 1.0, composure: 1.0, discernment: 1.0, diplomacy: 1.2, presence: 1.1 },
  { region_code: "QA", attentiveness: 1.0, composure: 1.0, discernment: 1.0, diplomacy: 1.2, presence: 1.1 },
  { region_code: "KW", attentiveness: 1.0, composure: 1.0, discernment: 1.0, diplomacy: 1.2, presence: 1.1 },
  { region_code: "MA", attentiveness: 1.0, composure: 1.0, discernment: 1.0, diplomacy: 1.2, presence: 1.1 },

  // ── Zuid-Aziatisch cluster: IN, PK, BD ───────────────────────────────────
  // Attentiveness + Diplomacy elevated; hierarchy and respect
  { region_code: "IN", attentiveness: 1.2, composure: 1.0, discernment: 1.0, diplomacy: 1.1, presence: 1.0 },
  { region_code: "PK", attentiveness: 1.2, composure: 1.0, discernment: 1.0, diplomacy: 1.1, presence: 1.0 },
  { region_code: "BD", attentiveness: 1.2, composure: 1.0, discernment: 1.0, diplomacy: 1.1, presence: 1.0 },
  { region_code: "LK", attentiveness: 1.2, composure: 1.0, discernment: 1.0, diplomacy: 1.1, presence: 1.0 },

  // ── Overige prioriteitslanden: default 1.0 ───────────────────────────────
  { region_code: "ZA", attentiveness: 1.0, composure: 1.0, discernment: 1.0, diplomacy: 1.0, presence: 1.0 },
  { region_code: "NG", attentiveness: 1.0, composure: 1.0, discernment: 1.0, diplomacy: 1.0, presence: 1.0 },
  { region_code: "GH", attentiveness: 1.0, composure: 1.0, discernment: 1.0, diplomacy: 1.0, presence: 1.0 },
  { region_code: "KE", attentiveness: 1.0, composure: 1.0, discernment: 1.0, diplomacy: 1.0, presence: 1.0 },
  { region_code: "IL", attentiveness: 1.0, composure: 1.0, discernment: 1.0, diplomacy: 1.0, presence: 1.0 },
  { region_code: "TR", attentiveness: 1.0, composure: 1.0, discernment: 1.0, diplomacy: 1.0, presence: 1.0 },
  { region_code: "PL", attentiveness: 1.0, composure: 1.0, discernment: 1.0, diplomacy: 1.0, presence: 1.0 },
  { region_code: "CZ", attentiveness: 1.0, composure: 1.0, discernment: 1.0, diplomacy: 1.0, presence: 1.0 },
  { region_code: "HU", attentiveness: 1.0, composure: 1.0, discernment: 1.0, diplomacy: 1.0, presence: 1.0 },
  { region_code: "RO", attentiveness: 1.0, composure: 1.0, discernment: 1.0, diplomacy: 1.0, presence: 1.0 },
  { region_code: "TH", attentiveness: 1.0, composure: 1.0, discernment: 1.0, diplomacy: 1.0, presence: 1.0 },
  { region_code: "ID", attentiveness: 1.0, composure: 1.0, discernment: 1.0, diplomacy: 1.0, presence: 1.0 },
  { region_code: "MY", attentiveness: 1.0, composure: 1.0, discernment: 1.0, diplomacy: 1.0, presence: 1.0 },
  { region_code: "PH", attentiveness: 1.0, composure: 1.0, discernment: 1.0, diplomacy: 1.0, presence: 1.0 },
  { region_code: "VN", attentiveness: 1.0, composure: 1.0, discernment: 1.0, diplomacy: 1.0, presence: 1.0 },
  { region_code: "RU", attentiveness: 1.0, composure: 1.0, discernment: 1.0, diplomacy: 1.0, presence: 1.0 },
];

async function main() {
  console.log(`[seed-region-weights] Upserting ${WEIGHTS.length} region entries…`);

  for (const w of WEIGHTS) {
    await db
      .insert(regionDimensionWeightsTable)
      .values(w)
      .onConflictDoUpdate({
        target: regionDimensionWeightsTable.region_code,
        set: {
          attentiveness: sql`excluded.attentiveness`,
          composure:     sql`excluded.composure`,
          discernment:   sql`excluded.discernment`,
          diplomacy:     sql`excluded.diplomacy`,
          presence:      sql`excluded.presence`,
        },
      });
  }

  console.log(`[seed-region-weights] Done. ${WEIGHTS.length} regions upserted.`);

  // Validation: JP vs BE acceptance criterion (§criterion 13)
  const result = await db.execute(sql`
    SELECT region_code, attentiveness, discernment, presence
    FROM region_dimension_weights
    WHERE region_code IN ('JP', 'BE')
    ORDER BY region_code
  `);
  console.log("[seed-region-weights] JP vs BE validation:");
  for (const row of result.rows as { region_code: string; attentiveness: number; discernment: number; presence: number }[]) {
    console.log(`  ${row.region_code}: attentiveness=${row.attentiveness}, discernment=${row.discernment}, presence=${row.presence}`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error("[seed-region-weights] Failed:", err);
  process.exit(1);
});
