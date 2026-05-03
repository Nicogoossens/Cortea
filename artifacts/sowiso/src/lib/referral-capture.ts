/**
 * Captures `?ref=CRT-XXXXX` from the URL into sessionStorage so the code
 * survives navigation and is attached to the user's account on first sign-in.
 */
const STORAGE_KEY = "cortea_referral";

export function captureReferralCode(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("ref");
    if (code && /^[A-Z0-9-]{4,32}$/i.test(code)) {
      sessionStorage.setItem(STORAGE_KEY, code.toUpperCase());
      return code.toUpperCase();
    }
  } catch {
    /* SSR/test safety */
  }
  return getStoredReferralCode();
}

export function getStoredReferralCode(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearStoredReferralCode(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
