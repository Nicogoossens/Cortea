const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
export type UtmKey = (typeof UTM_KEYS)[number];
export type UtmParams = Partial<Record<UtmKey, string>>;

const SESSION_STORAGE_KEY = "cortea_utm";

export function captureUtmParams(): UtmParams {
  const params = new URLSearchParams(window.location.search);
  const utm: UtmParams = {};
  for (const key of UTM_KEYS) {
    const val = params.get(key);
    if (val) utm[key] = val;
  }
  if (Object.keys(utm).length > 0) {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(utm));
    } catch {
    }
  }
  return utm;
}

export function getStoredUtmParams(): UtmParams {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as UtmParams;
  } catch {
    return {};
  }
}

export function clearStoredUtmParams(): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
  }
}
