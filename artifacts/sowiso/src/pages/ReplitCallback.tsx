import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";

export default function ReplitCallback() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const uid = params.get("uid");
    const name = params.get("name") ? decodeURIComponent(params.get("name")!) : undefined;
    const isAdmin = params.get("admin") === "1";
    const error = params.get("error");

    if (error || !token || !uid) {
      setLocation("/signin?error=auth_failed");
      return;
    }

    login(uid, { name, sessionToken: token, isAdmin });
    setLocation("/");
  }, [login, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground font-light tracking-wide">
        {t("common.loading")}
      </p>
    </div>
  );
}
