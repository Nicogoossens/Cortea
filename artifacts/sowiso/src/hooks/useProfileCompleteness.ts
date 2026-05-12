import { useGetProfile } from "@workspace/api-client-react";

const CATEGORY_MAP = [
  { key: "interests_sports",     i18nKey: "interests.category.sports" },
  { key: "interests_cuisine",    i18nKey: "interests.category.cuisine" },
  { key: "interests_dress_code", i18nKey: "interests.category.dress_code" },
  { key: "social_circles",       i18nKey: "interests.category.social_circles" },
  { key: "cultural_interests",   i18nKey: "interests.category.cultural_interests" },
] as const;

const DISMISS_KEY = "profile_completeness_dismissed_at";
const DISMISS_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export function useProfileCompleteness(): {
  isIncomplete: boolean;
  emptyCategories: string[];
  isLoading: boolean;
} {
  const { data: profile, isLoading } = useGetProfile();

  if (isLoading) {
    return { isIncomplete: false, emptyCategories: [], isLoading: true };
  }

  if (!profile || !profile.onboarding_completed) {
    return { isIncomplete: false, emptyCategories: [], isLoading: false };
  }

  const emptyCategories = CATEGORY_MAP
    .filter(({ key }) => {
      const val = (profile as Record<string, unknown>)[key];
      return !Array.isArray(val) || (val as unknown[]).length === 0;
    })
    .map(({ i18nKey }) => i18nKey);

  return {
    isIncomplete: emptyCategories.length >= 2,
    emptyCategories,
    isLoading: false,
  };
}

export function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    if (isNaN(ts)) return false;
    return Date.now() - ts < DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

export function setDismissed(): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {}
}

export function resetProfileCompletenessDismiss(): void {
  try {
    localStorage.removeItem(DISMISS_KEY);
  } catch {}
}
