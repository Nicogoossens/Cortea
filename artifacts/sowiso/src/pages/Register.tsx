import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage, type SupportedLocale, ALL_LOCALES } from "@/lib/i18n";
import { useActiveRegion, type RegionCode, COMPASS_REGIONS } from "@/lib/active-region";
import { useAuth } from "@/lib/auth";
import { UserPlus, Loader2, Eye, EyeOff } from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const GENDER_OPTION_KEYS = [
  { value: "", key: "register.gender_prefer_not" },
  { value: "male", key: "register.gender_male" },
  { value: "female", key: "register.gender_female" },
  { value: "non_binary", key: "register.gender_non_binary" },
  { value: "other", key: "register.gender_other" },
] as const;

const currentYear = new Date().getFullYear();

export default function Register() {
  const { t, locale, setLocale } = useLanguage();
  const { activeRegion, setActiveRegion } = useActiveRegion();
  const { login } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const langParam = params.get("lang");
    const regionParam = params.get("region");

    if (langParam) {
      const matchedLocale = ALL_LOCALES.find(
        (l) => l === langParam || l.startsWith(langParam + "-")
      ) as SupportedLocale | undefined;
      if (matchedLocale && matchedLocale !== locale) {
        setLocale(matchedLocale);
      }
    }

    if (regionParam) {
      const validCodes = COMPASS_REGIONS.map((r) => r.code);
      if (validCodes.includes(regionParam as RegionCode) && regionParam !== activeRegion) {
        setActiveRegion(regionParam as RegionCode);
      }
    }
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [form, setForm] = useState({
    email: "",
    full_name: "",
    birth_year: "",
    gender_identity: "",
    password: "",
    password_confirm: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError(null);
  }

  function validate() {
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return t("register.error_email");
    }
    if (!form.full_name.trim() || form.full_name.trim().length < 2) {
      return t("register.error_name");
    }
    if (!form.birth_year) {
      return t("register.error_birth_year");
    }
    const yr = parseInt(form.birth_year, 10);
    if (isNaN(yr) || yr < 1900 || yr > currentYear - 13) {
      return t("register.error_birth_year_invalid");
    }
    if (!form.password || form.password.length < 8) {
      return t("register.error_password");
    }
    if (form.password !== form.password_confirm) {
      return t("register.error_password_mismatch");
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setLoading(true);
    setError(null);

    try {
      const baseLang = locale.split("-")[0];
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          full_name: form.full_name.trim(),
          birth_year: parseInt(form.birth_year, 10),
          gender_identity: form.gender_identity || undefined,
          locale: baseLang,
          language_code: baseLang,
          active_region: activeRegion,
          password: form.password,
        }),
      });

      const body = await res.json() as {
        message?: string;
        error?: string;
        user_id?: string;
        full_name?: string | null;
        session_token?: string;
        is_admin?: boolean;
      };

      if (!res.ok) {
        setError(body.error ?? t("common.error"));
        return;
      }

      // If we got a session_token back, the account is immediately activated
      if (body.session_token && body.user_id) {
        login(body.user_id, {
          name: body.full_name ?? undefined,
          sessionToken: body.session_token,
          isAdmin: body.is_admin,
        });
        navigate("/onboarding");
        return;
      }

      // Fallback: navigate to sign-in
      navigate("/signin");
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  const formComplete = form.email.trim() && form.full_name.trim() && form.birth_year && form.password && form.password_confirm;

  return (
    <div className="max-w-md mx-auto space-y-10 animate-in fade-in duration-500 py-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-primary/5 rounded-full flex items-center justify-center mb-6">
          <UserPlus className="w-8 h-8 text-primary" aria-hidden="true" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif text-foreground">{t("register.title")}</h1>
        <p className="text-muted-foreground text-lg font-light leading-relaxed">
          {t("register.subtitle")}
        </p>
      </div>

      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            <div className="space-y-2">
              <label htmlFor="full_name" className="text-sm font-medium text-foreground tracking-wide block">
                {t("register.name_label")} <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <Input
                id="full_name"
                type="text"
                autoComplete="name"
                placeholder={t("register.name_placeholder")}
                value={form.full_name}
                onChange={(e) => update("full_name", e.target.value)}
                className="bg-background border-border/60 focus:border-primary/50 rounded-sm"
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground tracking-wide block">
                {t("register.email_label")} <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder={t("register.email_placeholder")}
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="bg-background border-border/60 focus:border-primary/50 rounded-sm"
                disabled={loading}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="birth_year" className="text-sm font-medium text-foreground tracking-wide block">
                  {t("register.birth_year_label")} <span className="text-destructive" aria-hidden="true">*</span>
                </label>
                <Input
                  id="birth_year"
                  type="number"
                  autoComplete="bday-year"
                  placeholder="1985"
                  min={1900}
                  max={currentYear - 13}
                  value={form.birth_year}
                  onChange={(e) => update("birth_year", e.target.value)}
                  className="bg-background border-border/60 focus:border-primary/50 rounded-sm"
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="gender_identity" className="text-sm font-medium text-foreground tracking-wide block">
                  {t("register.gender_label")}
                </label>
                <select
                  id="gender_identity"
                  value={form.gender_identity}
                  onChange={(e) => update("gender_identity", e.target.value)}
                  disabled={loading}
                  className="w-full h-10 px-3 rounded-sm border border-border/60 bg-background text-sm text-foreground focus:outline-none focus:border-primary/50 disabled:opacity-50"
                >
                  {GENDER_OPTION_KEYS.map((o) => (
                    <option key={o.value} value={o.value}>{t(o.key)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground tracking-wide block">
                {t("register.password_label")} <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="min. 8 tekens"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  className="bg-background border-border/60 focus:border-primary/50 rounded-sm pr-10"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password_confirm" className="text-sm font-medium text-foreground tracking-wide block">
                {t("register.password_confirm_label")} <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <Input
                  id="password_confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="herhaal wachtwoord"
                  value={form.password_confirm}
                  onChange={(e) => update("password_confirm", e.target.value)}
                  className="bg-background border-border/60 focus:border-primary/50 rounded-sm pr-10"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive border border-destructive/30 rounded-sm px-4 py-2 bg-destructive/5" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full font-serif bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={!formComplete || loading}
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  {t("register.sending")}
                </>
              ) : (
                t("register.submit")
              )}
            </Button>

            <p className="text-xs text-muted-foreground/60 text-center font-light">
              {t("register.required_note")}
            </p>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        {t("register.already_member")}{" "}
        <Link href="/signin" className="text-primary hover:underline underline-offset-2">
          {t("signin.title")}
        </Link>
      </p>
    </div>
  );
}
