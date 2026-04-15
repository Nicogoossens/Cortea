import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export default function ReplitCallback() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");

    if (error || !code) {
      setLocation("/signin?error=auth_failed");
      return;
    }

    // Exchange the one-time code for a session token server-side.
    // The session token is never placed in a URL parameter.
    fetch(`${API_BASE}/api/auth/redeem?code=${encodeURIComponent(code)}`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: { token: string; userId: string; fullName: string | null; isAdmin: boolean }) => {
        login(data.userId, {
          name: data.fullName ?? undefined,
          sessionToken: data.token,
          isAdmin: data.isAdmin,
        });
        setLocation("/");
      })
      .catch(() => {
        setLocation("/signin?error=auth_failed");
      });
  }, [login, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground font-light tracking-wide">
        {t("common.loading")}
      </p>
    </div>
  );
}
