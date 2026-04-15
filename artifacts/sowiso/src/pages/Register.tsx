import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n";
import { UserPlus, Send, Loader2, CheckCircle2, ArrowLeft, FlaskConical } from "lucide-react";

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
  const { t, locale } = useLanguage();
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    birth_year: "",
    gender_identity: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devVerifyUrl, setDevVerifyUrl] = useState<string | null>(null);

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
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          full_name: form.full_name.trim(),
          birth_year: parseInt(form.birth_year, 10),
          gender_identity: form.gender_identity || undefined,
          locale: locale.split("-")[0],
        }),
      });

      const body = await res.json() as { message?: string; error?: string; dev_verification_url?: string };

      if (!res.ok) {
        setError(body.error ?? t("common.error"));
        return;
      }

      if (body.dev_verification_url) setDevVerifyUrl(body.dev_verification_url);
      setSubmitted(true);
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto space-y-8 animate-in fade-in duration-500 py-12">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-serif text-foreground">{t("register.check_email")}</h1>
          <p className="text-muted-foreground leading-relaxed font-light">
            {t("register.sent_to")} <span className="font-medium text-foreground">{form.email}</span>
          </p>
          {!devVerifyUrl && (
            <p className="text-sm text-muted-foreground/70">
              {t("register.check_spam")}
            </p>
          )}
        </div>

        {devVerifyUrl && (
          <div className="border border-amber-300/60 bg-amber-50/60 rounded-sm p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-700">
              <FlaskConical className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="text-xs font-mono uppercase tracking-widest font-semibold">{t("auth.dev_mode")}</span>
            </div>
            <p className="text-xs text-amber-700/80 font-light leading-relaxed">
              {t("auth.dev_no_smtp_register")}
            </p>
            <Link href={devVerifyUrl.replace(/^https?:\/\/[^/]+/, "")}>
              <Button
                variant="outline"
                size="sm"
                className="w-full font-mono text-xs border-amber-400/60 text-amber-800 hover:bg-amber-100/60"
              >
                {t("auth.dev_complete_verification")}
              </Button>
            </Link>
          </div>
        )}

        <div className="text-center">
          <Link href="/">
            <Button variant="outline" className="font-serif gap-2">
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              {t("common.return_home")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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

      {/* SSO */}
      <div className="space-y-3">
        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-border/50" />
          <span className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">{t("auth.or_register_with")}</span>
          <div className="flex-1 h-px bg-border/50" />
        </div>

        {/* Replit Auth — functional SSO */}
        <button
          type="button"
          onClick={() => {
            const base = import.meta.env.BASE_URL as string;
            const returnTo = encodeURIComponent(`${base}replit-callback`.replace("//", "/"));
            window.location.href = `${API_BASE}/api/login?returnTo=${returnTo}`;
          }}
          className="w-full flex items-center justify-center gap-2.5 h-11 rounded-sm border border-primary/40 bg-primary/5 hover:bg-primary/10 text-foreground text-sm font-medium transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <rect width="100" height="100" rx="16" fill="currentColor" fillOpacity="0.1"/>
            <path d="M30 25h40v15H45v10h25v15H45v10h25v15H30V25z" fill="currentColor"/>
          </svg>
          {t("auth.sso_signin")}
        </button>

        <div className="grid grid-cols-3 gap-2">
          {[
            { name: "Google", logo: "G" },
            { name: "Apple", logo: "" },
            { name: "LinkedIn", logo: "in" },
          ].map(({ name, logo }) => (
            <div key={name} className="relative">
              <button
                type="button"
                disabled
                className="w-full flex items-center justify-center gap-2 h-10 rounded-sm border border-border/40 bg-muted/30 text-muted-foreground/40 text-sm font-medium cursor-not-allowed select-none"
                aria-label={`${name} — ${t("auth.coming_soon")}`}
              >
                <span className="font-bold text-xs">{logo}</span>
                <span className="text-xs">{name}</span>
              </button>
              <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[9px] font-mono uppercase tracking-widest bg-muted text-muted-foreground/60 px-1.5 py-0.5 rounded-[2px] whitespace-nowrap border border-border/30">
                {t("auth.coming_soon")}
              </span>
            </div>
          ))}
        </div>
        <p className="text-center text-[10px] text-muted-foreground/40 font-mono">
          {t("auth.social_coming_soon_register")}
        </p>
      </div>

      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px bg-border/50" />
        <span className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">{t("auth.or_via_email")}</span>
        <div className="flex-1 h-px bg-border/50" />
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

            {error && (
              <p className="text-sm text-destructive border border-destructive/30 rounded-sm px-4 py-2 bg-destructive/5" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full font-serif bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={!form.email.trim() || !form.full_name.trim() || !form.birth_year || loading}
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  {t("register.sending")}
                </>
              ) : (
                <>
                  {t("register.submit")}
                  <Send className="w-4 h-4 ml-2" aria-hidden="true" />
                </>
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
