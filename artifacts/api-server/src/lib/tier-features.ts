export type SubscriptionTier = "guest" | "student" | "traveller" | "ambassador" | "concierge";

export interface TierFeatures {
  tier: SubscriptionTier;
  displayName: string;
  maxRegions: number | null;
  allRegionsUnlocked: boolean;
  fullCulturalCompass: boolean;
  aiCounselUnlimited: boolean;
  scenarioDifficultyMax: number | null;
  mirrorAccess: boolean;
  innerCircleAccess: boolean;
  sensoryAwarenessAccess: boolean;
  studentPillarAccess: boolean;
  conciergeAccess: boolean;
}

export const TIER_FEATURES: Record<SubscriptionTier, TierFeatures> = {
  guest: {
    tier: "guest",
    displayName: "The Guest",
    maxRegions: 1,
    allRegionsUnlocked: false,
    fullCulturalCompass: false,
    aiCounselUnlimited: false,
    scenarioDifficultyMax: 2,
    mirrorAccess: false,
    innerCircleAccess: false,
    sensoryAwarenessAccess: false,
    studentPillarAccess: false,
    conciergeAccess: false,
  },
  student: {
    tier: "student",
    displayName: "The Student",
    maxRegions: null,
    allRegionsUnlocked: true,
    fullCulturalCompass: true,
    aiCounselUnlimited: false,
    scenarioDifficultyMax: 3,
    mirrorAccess: false,
    innerCircleAccess: false,
    sensoryAwarenessAccess: false,
    studentPillarAccess: true,
    conciergeAccess: false,
  },
  traveller: {
    tier: "traveller",
    displayName: "The Traveller",
    maxRegions: null,
    allRegionsUnlocked: true,
    fullCulturalCompass: true,
    aiCounselUnlimited: true,
    scenarioDifficultyMax: null,
    mirrorAccess: false,
    innerCircleAccess: false,
    sensoryAwarenessAccess: false,
    studentPillarAccess: true,
    conciergeAccess: false,
  },
  ambassador: {
    tier: "ambassador",
    displayName: "The Ambassador",
    maxRegions: null,
    allRegionsUnlocked: true,
    fullCulturalCompass: true,
    aiCounselUnlimited: true,
    scenarioDifficultyMax: null,
    mirrorAccess: true,
    innerCircleAccess: true,
    sensoryAwarenessAccess: true,
    studentPillarAccess: true,
    conciergeAccess: false,
  },
  concierge: {
    tier: "concierge",
    displayName: "The Concierge",
    maxRegions: null,
    allRegionsUnlocked: true,
    fullCulturalCompass: true,
    aiCounselUnlimited: true,
    scenarioDifficultyMax: null,
    mirrorAccess: true,
    innerCircleAccess: true,
    sensoryAwarenessAccess: true,
    studentPillarAccess: true,
    conciergeAccess: true,
  },
};

/**
 * Tiers that auto-grant a 14-day free trial when checked-out for the first time.
 * Excludes Student (entry-level) and Concierge (white-glove premium anchor).
 */
export const TRIAL_ELIGIBLE_TIERS: SubscriptionTier[] = ["traveller", "ambassador"];
export const TRIAL_DAYS = 14;

/**
 * Upgrade ladder used by the referral reward system: a successful referral
 * grants both parties one month at the next tier.
 */
export const TIER_UPGRADE_LADDER: Partial<Record<SubscriptionTier, SubscriptionTier>> = {
  guest: "traveller",
  student: "traveller",
  traveller: "ambassador",
  ambassador: "concierge",
};

/**
 * Numeric rank used to compare two tiers (higher = more access). Lets the
 * webhook decide whether a Stripe-driven tier change should overwrite the
 * effective tier or be deferred until the active referral reward expires.
 */
export const TIER_RANK: Record<SubscriptionTier, number> = {
  guest: 0,
  student: 1,
  traveller: 2,
  ambassador: 3,
  concierge: 4,
};

export function maxTier(a: SubscriptionTier, b: SubscriptionTier): SubscriptionTier {
  return TIER_RANK[a] >= TIER_RANK[b] ? a : b;
}

export function hasFeatureAccess(
  userTier: SubscriptionTier,
  feature: keyof Omit<TierFeatures, "tier" | "displayName" | "maxRegions" | "scenarioDifficultyMax">
): boolean {
  return Boolean(TIER_FEATURES[userTier][feature]);
}

export function canAccessRegion(userTier: SubscriptionTier, userActiveRegion: string, requestedRegion: string): boolean {
  if (TIER_FEATURES[userTier].allRegionsUnlocked) return true;
  return requestedRegion === userActiveRegion;
}

export function getTierFeatures(tier: SubscriptionTier): TierFeatures {
  return TIER_FEATURES[tier] ?? TIER_FEATURES.guest;
}
