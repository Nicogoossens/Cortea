import { useGetProfile } from "@workspace/api-client-react";

const INTEREST_CATEGORIES = [
  "interests_sports",
  "interests_cuisine",
  "interests_dress_code",
  "social_circles",
  "cultural_interests",
] as const;

const DISMISS_KEY = "profile_completeness_dismissed_at";
const DISMISS_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export function useProfileCompleteness() {
  const { data: profile } = useGetProfile();

  if (!profile || !profile.onboarding_completed) {
    return { isIncomplete: false, emptyCount: 0 };
  }

  const emptyCategories = INTEREST_CATEGORIES.filter((cat) => {
    const val = profile[cat as keyof typeof profile];
    return !Array.isArray(val) || (val as string[]).length === 0;
  });

  return {
    isIncomplete: emptyCategories.length >= 2,
    emptyCount: emptyCategories.length,
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
