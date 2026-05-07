import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useLanguage, type SupportedLocale } from "@/lib/i18n";
import { useAccessibility } from "@/lib/accessibility";
import { hasStoredLocalePreference, hasSupportedBrowserLocale } from "@/lib/language-provider";
import { ALL_LOCALES } from "@/lib/i18n-locales";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

const AGE_FONT_GROUPS = new Set(["senior_elder", "established_practitioner"]);

/**
 * After the user logs in (or on cold start with a stored session) this
 * component applies two server-side preferences:
 *  1. `language_code` — overrides the localStorage locale so the UI matches
 *     the profile the user last saved (cross-device), BUT only when no local
 *     preference is already stored and the browser has no supported locale.
 *  2. `age_group`     — server-side Noble Score age estimation.
 * Auth is via HttpOnly session cookie (credentials: 'include').
 */
export function UserPreferencesSync() {
  const { isAuthenticated, userId, login } = useAuth();
  const { locale, setLocale } = useLanguage();
  const { autoApplyAgeFont } = useAccessibility();
  const syncedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      syncedRef.current = null;
      return;
    }

    if (syncedRef.current === userId) return;
    syncedRef.current = userId;

    fetch(`${API_BASE}/api/users/profile`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .catch(() => null)
      .then((profile: { language_code?: string; age_group?: string; is_admin?: boolean; id?: string; full_name?: string } | null) => {
        if (!profile) return;

        if (profile.language_code && !hasStoredLocalePreference() && !hasSupportedBrowserLocale()) {
          const serverLang = profile.language_code;
          const matchedLocale = ALL_LOCALES.find(
            (l) => l === serverLang || l.startsWith(serverLang + "-")
          ) as SupportedLocale | undefined;
          if (matchedLocale && matchedLocale !== locale) {
            setLocale(matchedLocale);
          }
        }

        if (profile.age_group && AGE_FONT_GROUPS.has(profile.age_group)) {
          autoApplyAgeFont("large");
        }

        if (profile.is_admin !== undefined) {
          login(profile.id ?? "", { isAdmin: profile.is_admin });
        }
      });
  }, [isAuthenticated, userId, locale, setLocale, autoApplyAgeFont, login]);

  return null;
}
