/**
 * Seed placement-acceleration badges (§6 Master Framework v1.1).
 * Creates one generic badge + per-register variants for the 5 Compass pillars.
 *
 * Usage:
 *   pnpm --filter @workspace/api-server tsx src/scripts/seed-placement-badges.ts
 *
 * Idempotent — upserts on slug. Safe to run repeatedly.
 * Targets PROD_DATABASE_URL when set, otherwise DATABASE_URL.
 */
import { db, pool } from "@workspace/db";
import { badgesTable } from "@workspace/db";
import { sql } from "drizzle-orm";

interface BadgeSeed {
  slug: string;
  title: string;
  description: string;
  badge_type: string;
  kind: string;
  register: string;
  research_pillar: string | null;
}

const PILLARS = [
  { code: "P1", name: "Attentiveness", label: "The Art of Attention" },
  { code: "P2", name: "Composure",     label: "Composure Under Pressure" },
  { code: "P3", name: "Discernment",   label: "Refined Discernment" },
  { code: "P4", name: "Diplomacy",     label: "Diplomatic Finesse" },
  { code: "P5", name: "Presence",      label: "Commanding Presence" },
];

const REGISTERS = ["middle_class", "elite"];

const BADGES: BadgeSeed[] = [
  // ── Generic fallback ──────────────────────────────────────────────────────
  {
    slug:            "placement-acceleration",
    title:           "Acceleration Badge",
    description:     "Awarded for completing the placement calibration and demonstrating existing social mastery. Your learning path has been advanced accordingly.",
    badge_type:      "achievement",
    kind:            "placement",
    register:        "both",
    research_pillar: null,
  },

  // ── Per-register generic ──────────────────────────────────────────────────
  {
    slug:            "placement-acceleration-middle_class",
    title:           "Foundation Accelerator",
    description:     "Your placement results reflect a solid grounding in social awareness. Your path through the Atelier begins at an advanced level.",
    badge_type:      "achievement",
    kind:            "placement",
    register:        "middle_class",
    research_pillar: null,
  },
  {
    slug:            "placement-acceleration-elite",
    title:           "Refinement Accelerator",
    description:     "Your placement results confirm a cultivated understanding of elevated conduct. Your Atelier journey begins in the advanced register.",
    badge_type:      "achievement",
    kind:            "placement",
    register:        "elite",
    research_pillar: null,
  },

  // ── Per-pillar × per-register ─────────────────────────────────────────────
  ...PILLARS.flatMap((pillar) =>
    REGISTERS.map((register): BadgeSeed => ({
      slug:            `placement-${pillar.code.toLowerCase()}-${register}`,
      title:           `${pillar.label} — ${register === "elite" ? "Elite" : "Foundation"} Track`,
      description:     `Placement recognised an existing command of ${pillar.name.toLowerCase()}. Your exercises in this pillar begin at the advanced tier.`,
      badge_type:      "achievement",
      kind:            "placement",
      register,
      research_pillar: pillar.code,
    }))
  ),
];

async function main() {
  console.log(`[seed-placement-badges] Upserting ${BADGES.length} placement badges…`);

  for (const badge of BADGES) {
    await db
      .insert(badgesTable)
      .values(badge)
      .onConflictDoUpdate({
        target: badgesTable.slug,
        set: {
          title:           sql`excluded.title`,
          description:     sql`excluded.description`,
          badge_type:      sql`excluded.badge_type`,
          kind:            sql`excluded.kind`,
          register:        sql`excluded.register`,
          research_pillar: sql`excluded.research_pillar`,
        },
      });
  }

  console.log(`[seed-placement-badges] Done. ${BADGES.length} badges upserted.`);

  const result = await db.execute(
    sql`SELECT slug, register, research_pillar FROM badges WHERE kind = 'placement' ORDER BY slug`
  );
  console.log(`[seed-placement-badges] Verified ${result.rows.length} placement badges in DB.`);

  await pool.end();
}

main().catch((err) => {
  console.error("[seed-placement-badges] Failed:", err);
  process.exit(1);
});
