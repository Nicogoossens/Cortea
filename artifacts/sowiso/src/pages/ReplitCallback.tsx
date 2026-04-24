import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLanguage, ALL_LOCALES, type SupportedLocale } from "@/lib/i18n";
import { useActiveRegion, COMPASS_REGIONS, type RegionCode } from "@/lib/active-region";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export default function ReplitCallback() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { t, setLocale } = useLanguage();
  const { setActiveRegion } = useActiveRegion();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");

    if (error || !code) {
      setLocation("/signin?error=auth_failed");
      return;
    }

    // Exchange the one-time code for a session cookie server-side.
    // The code is single-use; the session is stored in an HttpOnly cookie.
    fetch(`${API_BASE}/api/auth/redeem?code=${encodeURIComponent(code)}`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then(async (data: { userId: string; fullName: string | null; isAdmin: boolean }) => {
        // Check onboarding status using the session cookie that was just set
        const profileRes = await fetch(`${API_BASE}/api/users/profile`, {
          credentials: "include",
        });
        const profile = profileRes.ok ? await profileRes.json() as {
          onboarding_completed?: boolean;
          language_code?: string;
          active_region?: string;
        } : null;
        const isNewUser = profile?.onboarding_completed === false;

        login(data.userId, {
          name: data.fullName ?? undefined,
          isAdmin: data.isAdmin,
        });

        if (profile?.language_code) {
          const langCode = profile.language_code;
          const regionCode = profile.active_region;
          const resolved = ALL_LOCALES.find(
            (l) => l === `${langCode}-${regionCode}` || l.startsWith(langCode + "-")
          ) as SupportedLocale | undefined;
          if (resolved) setLocale(resolved);
        }
        if (profile?.active_region) {
          const validCodes = COMPASS_REGIONS.map((r) => r.code);
          if (validCodes.includes(profile.active_region as RegionCode)) {
            setActiveRegion(profile.active_region as RegionCode);
          }
        }

        setLocation(isNewUser ? "/onboarding" : "/");
      })
      .catch(() => {
        setLocation("/signin?error=auth_failed");
      });
  }, [login, setLocation, setLocale, setActiveRegion]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground font-light tracking-wide">
        {t("common.loading")}
      </p>
    </div>
  );
}
