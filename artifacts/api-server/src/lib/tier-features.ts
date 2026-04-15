export type SubscriptionTier = "guest" | "traveller" | "ambassador";

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
  },
};

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
  return TIER_FEATURES[tier];
}
