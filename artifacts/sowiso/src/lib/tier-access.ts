/**
 * Tier-access gate helpers.
 *
 * These pure functions encode the subscription-tier rules so every page can
 * import them instead of duplicating the same ternary chains.  They have no
 * side effects and are easy to unit-test.
 */

export type SubscriptionTier = "guest" | "basic" | "student" | "traveller" | "ambassador" | "founding";

/** True for tiers that unlock every Counsel domain and every Compass region. */
export function hasFullAccess(tier: SubscriptionTier): boolean {
  return tier === "traveller" || tier === "ambassador" || tier === "founding";
}

/** True for tiers that have ambassador-level (top) access. */
export function hasAmbassadorAccess(tier: SubscriptionTier): boolean {
  return tier === "ambassador" || tier === "founding";
}

/** True for the registered-but-not-upgraded tier. */
export function hasBasicAccess(tier: SubscriptionTier, isAuthenticated: boolean): boolean {
  return isAuthenticated && !hasFullAccess(tier);
}

/**
 * Whether a Counsel domain is accessible for the given tier / state.
 *
 * @param tier              The user's subscription tier.
 * @param isAuthenticated   Whether the user is signed in at all.
 * @param isBasicLimitReached  Whether the 5-question cap has been reached.
 * @param isDomainFree      Whether the domain is in the free-domain list.
 */
export function isCounselDomainAccessible(
  tier: SubscriptionTier,
  isAuthenticated: boolean,
  isBasicLimitReached: boolean,
  isDomainFree: boolean,
): boolean {
  if (hasFullAccess(tier)) return true;
  if (hasBasicAccess(tier, isAuthenticated) && !isBasicLimitReached && isDomainFree) return true;
  return false;
}

/**
 * Whether a Compass region card is locked in the regions list view.
 *
 * A card is locked only when *all three* conditions apply:
 *   1. The user does not have full (Traveller/Ambassador) access, AND
 *   2. The user is a visitor (not authenticated), AND
 *   3. The region is not in the guest-unlocked list.
 */
export function isCompassRegionLocked(
  tier: SubscriptionTier,
  isAuthenticated: boolean,
  guestUnlockedRegions: string[],
  regionCode: string,
): boolean {
  if (hasFullAccess(tier)) return false;
  if (isAuthenticated) return false;
  return !guestUnlockedRegions.includes(regionCode);
}

/**
 * Whether the CompassRegion detail page should show a lock overlay.
 *
 * Only unauthenticated visitors are blocked on the detail page (for regions
 * outside the guest-unlocked set).  Any signed-in user — including Basic —
 * can read a region page.
 */
export function isCompassRegionDetailLocked(
  isAuthenticated: boolean,
  guestUnlockedRegions: string[],
  regionCode: string,
): boolean {
  if (isAuthenticated) return false;
  return !guestUnlockedRegions.includes(regionCode);
}
