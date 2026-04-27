import { db } from "@workspace/db";
import { badgesTable, userBadgesTable, learningTrackProgressTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

export interface AwardedBadge {
  id: number;
  slug: string;
  title: string;
  description: string;
  badge_type: string;
  register: string;
  research_pillar: string | null;
  phase: number | null;
  region_code: string | null;
  icon_url: string | null;
  awarded_at: Date;
}

/**
 * Checks for newly eligible badges after a pillar is mastered and awards them
 * idempotently (UNIQUE constraint on user_badges prevents duplicates).
 *
 * Awarded in order:
 * 1. Pillar badge — the specific pillar just mastered
 * 2. Phase badge — if all required pillars of the phase are now mastered
 * 3. Country badge — if all 5 phases are now phase-badged for this region/register
 *
 * Returns the list of newly awarded badges (empty if none, e.g. already awarded).
 */
export async function checkAndAwardBadges(
  userId: string,
  register: string,
  pillar: string | null,
  phase: number,
  regionCode: string,
): Promise<AwardedBadge[]> {
  const newBadges: AwardedBadge[] = [];

  // 1. Pillar badge (only for middle_class — elite has no pillars)
  if (register === "middle_class" && pillar) {
    const awarded = await awardBadgeBySlug(
      userId,
      `mc-${regionCode.toLowerCase()}-ph${phase}-${pillar.toLowerCase()}`,
    );
    if (awarded) newBadges.push(awarded);
  }

  // 2. Phase badge — check if all required pillars are mastered
  const phaseBadgeAwarded = await maybeAwardPhaseBadge(userId, register, phase, regionCode);
  if (phaseBadgeAwarded) newBadges.push(phaseBadgeAwarded);

  // 3. Country badge — check if all 5 phases are phase-badged
  const countryBadgeAwarded = await maybeAwardCountryBadge(userId, register, regionCode);
  if (countryBadgeAwarded) newBadges.push(countryBadgeAwarded);

  return newBadges;
}

/**
 * Awards a pillar badge by slug. Returns the badge if newly awarded, null if already held.
 */
async function awardBadgeBySlug(userId: string, slug: string): Promise<AwardedBadge | null> {
  const [badge] = await db.select().from(badgesTable).where(eq(badgesTable.slug, slug)).limit(1);
  if (!badge) return null;

  try {
    await db.insert(userBadgesTable).values({ user_id: userId, badge_id: badge.id });
    return {
      id: badge.id,
      slug: badge.slug,
      title: badge.title,
      description: badge.description,
      badge_type: badge.badge_type,
      register: badge.register,
      research_pillar: badge.research_pillar,
      phase: badge.phase,
      region_code: badge.region_code,
      icon_url: badge.icon_url,
      awarded_at: new Date(),
    };
  } catch {
    // UNIQUE constraint violation — already awarded; not an error
    return null;
  }
}

/**
 * Awards a phase badge if all required pillars for this phase are mastered.
 * - middle_class: needs P1, P2, P3 mastered
 * - elite: needs the single phase track mastered (pillar = null)
 */
async function maybeAwardPhaseBadge(
  userId: string,
  register: string,
  phase: number,
  regionCode: string,
): Promise<AwardedBadge | null> {
  const slug = register === "middle_class"
    ? `mc-${regionCode.toLowerCase()}-ph${phase}-phase`
    : `elite-${regionCode.toLowerCase()}-ph${phase}-phase`;

  // Check prerequisite mastery
  if (register === "middle_class") {
    const masteredPillars = await db
      .select({ pillar: learningTrackProgressTable.research_pillar })
      .from(learningTrackProgressTable)
      .where(and(
        eq(learningTrackProgressTable.user_id, userId),
        eq(learningTrackProgressTable.register, "middle_class"),
        eq(learningTrackProgressTable.phase, phase),
        eq(learningTrackProgressTable.mastered, true),
        sql`${learningTrackProgressTable.research_pillar} IS NOT NULL`,
      ));

    const masteredSet = new Set(masteredPillars.map((r) => r.pillar));
    if (!masteredSet.has("P1") || !masteredSet.has("P2") || !masteredSet.has("P3")) {
      return null;
    }
  } else {
    // elite: single track per phase
    const [row] = await db
      .select()
      .from(learningTrackProgressTable)
      .where(and(
        eq(learningTrackProgressTable.user_id, userId),
        eq(learningTrackProgressTable.register, "elite"),
        eq(learningTrackProgressTable.phase, phase),
        eq(learningTrackProgressTable.mastered, true),
        sql`${learningTrackProgressTable.research_pillar} IS NULL`,
      ))
      .limit(1);

    if (!row) return null;
  }

  return awardBadgeBySlug(userId, slug);
}

/**
 * Awards a country badge if all 5 phases have a phase badge for this region/register.
 */
async function maybeAwardCountryBadge(
  userId: string,
  register: string,
  regionCode: string,
): Promise<AwardedBadge | null> {
  const phaseSlugs = [1, 2, 3, 4, 5].map((ph) =>
    register === "middle_class"
      ? `mc-${regionCode.toLowerCase()}-ph${ph}-phase`
      : `elite-${regionCode.toLowerCase()}-ph${ph}-phase`,
  );

  // Check all phase badges are held
  const heldPhaseBadges = await db
    .select({ slug: badgesTable.slug })
    .from(userBadgesTable)
    .innerJoin(badgesTable, eq(userBadgesTable.badge_id, badgesTable.id))
    .where(and(
      eq(userBadgesTable.user_id, userId),
      sql`${badgesTable.slug} = ANY(${JSON.stringify(phaseSlugs)}::text[])`,
    ));

  if (heldPhaseBadges.length < 5) return null;

  const countrySlug = register === "middle_class"
    ? `mc-${regionCode.toLowerCase()}-country`
    : `elite-${regionCode.toLowerCase()}-country`;

  return awardBadgeBySlug(userId, countrySlug);
}

/**
 * Fetches all badges awarded to a user, ordered by most recent first.
 */
export async function getUserBadges(userId: string): Promise<AwardedBadge[]> {
  const rows = await db
    .select({
      id: badgesTable.id,
      slug: badgesTable.slug,
      title: badgesTable.title,
      description: badgesTable.description,
      badge_type: badgesTable.badge_type,
      register: badgesTable.register,
      research_pillar: badgesTable.research_pillar,
      phase: badgesTable.phase,
      region_code: badgesTable.region_code,
      icon_url: badgesTable.icon_url,
      awarded_at: userBadgesTable.awarded_at,
    })
    .from(userBadgesTable)
    .innerJoin(badgesTable, eq(userBadgesTable.badge_id, badgesTable.id))
    .where(eq(userBadgesTable.user_id, userId))
    .orderBy(sql`${userBadgesTable.awarded_at} DESC`);

  return rows as AwardedBadge[];
}

/**
 * Fetches the full badge catalogue (for badge gallery / profile display of unearned badges).
 */
export async function getAllBadges() {
  return db.select().from(badgesTable).orderBy(
    badgesTable.register,
    badgesTable.region_code,
    badgesTable.phase,
    badgesTable.research_pillar,
  );
}
