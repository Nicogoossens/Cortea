/**
 * Welcome-banner session storage helpers.
 *
 * Extracted so that the key-generation and gate logic can be unit-tested
 * independently of the React component that renders the banner.
 */

/** How long (ms) the banner stays visible before auto-dismissing. */
export const WELCOME_DURATION_MS = 7_000;

/**
 * Return the sessionStorage key used to remember that the banner has already
 * been shown for this user in the current session.
 *
 * Two distinct keys are used so that upgrading from anonymous → named
 * (i.e. the user fills in their name) triggers the banner again on the next
 * page load.
 */
export function getWelcomeSessionKey(userId: string, hasName: boolean): string {
  return `welcome_shown_${hasName ? "named" : "anon"}_${userId}`;
}

/**
 * Decide whether the welcome banner should be shown right now.
 *
 * Returns `{ show: false }` when any pre-condition is not met, or when the
 * banner has already been shown this session.
 * Returns `{ show: true, key }` when the banner should be shown; the caller
 * is responsible for persisting `key` via `markWelcomeShown`.
 */
export function shouldShowWelcomeBanner(
  userId: string | null | undefined,
  hasProfile: boolean,
  hasScore: boolean,
  hasName: boolean,
): { show: false } | { show: true; key: string } {
  if (!userId || !hasProfile || !hasScore) return { show: false };
  const key = getWelcomeSessionKey(userId, hasName);
  if (sessionStorage.getItem(key)) return { show: false };
  return { show: true, key };
}

/**
 * Persist the fact that the banner has been shown for the given session key.
 * Call this immediately before (or as part of) displaying the banner so that
 * a re-render doesn't show it again.
 */
export function markWelcomeShown(key: string): void {
  sessionStorage.setItem(key, "1");
}
