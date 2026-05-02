import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { KeyRound, Loader2, CheckCircle2, Eye, EyeOff, FlaskConical } from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function ResetPassword() {
  usePageTitle("Reset Password");
  const { t } = useLanguage();
  const { login } = useAuth();
  const [, navigate] = useLocation();

  const search = useSearch();
  const token = new URLSearchParams(search).get("token");

  // ── Request phase (no token in URL) ──────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setRequestLoading(true);
    setRequestError(null);

    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const body = await res.json() as { message?: string; error?: string; dev_reset_url?: string };

      if (!res.ok) {
        setRequestError(body.error ?? t("common.error"));
        return;
      }

      if (body.dev_reset_url) setDevResetUrl(body.dev_reset_url);
      setRequestSubmitted(true);
    } catch {
      setRequestError(t("common.error"));
    } finally {
      setRequestLoading(false);
    }
  }

  // ── Reset phase (token present in URL) ───────────────────────────────────────
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!password || !passwordConfirm) return;

    if (password !== passwordConfirm) {
      setResetError(t("register.error_password_mismatch"));
      return;
    }
    if (password.length < 8) {
      setResetError(t("register.error_password"));
      return;
    }

    setResetLoading(true);
    setResetError(null);

    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const body = await res.json() as {
        message?: string;
        error?: string;
        user_id?: string;
        full_name?: string | null;
        is_admin?: boolean;
      };

      if (!res.ok) {
        setResetError(body.error ?? t("common.error"));
        return;
      }

      login(body.user_id!, {
        name: body.full_name ?? undefined,
        isAdmin: body.is_admin,
      });

      setResetSuccess(true);
      setTimeout(() => navigate("/"), 1500);
    } catch {
      setResetError(t("common.error"));
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-10 animate-in fade-in duration-500 py-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-primary/5 rounded-full flex items-center justify-center mb-6">
          <KeyRound className="w-8 h-8 text-primary" aria-hidden="true" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif text-foreground">
          {token ? t("reset.set_password_title") : t("reset.title")}
        </h1>
        <p className="text-muted-foreground text-lg font-light leading-relaxed">
          {token ? t("reset.set_password_subtitle") : t("reset.subtitle")}
        </p>
      </div>

      {/* ── Request reset (no token) ── */}
      {!token && (
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-8">
            {requestSubmitted ? (
              <div className="space-y-4 text-center">
                <CheckCircle2 className="w-10 h-10 mx-auto text-primary" aria-hidden="true" />
                <p className="text-sm text-muted-foreground font-light leading-relaxed">
                  {t("reset.sent_body_prefix")}{" "}
                  <span className="font-medium text-foreground">{email}</span>.{" "}
                  {t("reset.sent_body_suffix")}
                </p>

                {devResetUrl && (
                  <div className="border border-amber-300/60 bg-amber-50/60 rounded-sm p-4 space-y-2 text-left mt-4">
                    <div className="flex items-center gap-2 text-amber-700">
                      <FlaskConical className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span className="text-xs font-mono uppercase tracking-widest font-semibold">{t("auth.dev_mode")}</span>
                    </div>
                    <p className="text-xs text-amber-700/80 font-light">{t("auth.dev_no_smtp_reset")}</p>
                    <Link href={devResetUrl.replace(/^https?:\/\/[^/]+/, "")}>
                      <Button variant="outline" size="sm" className="w-full font-mono text-xs border-amber-400/60 text-amber-800 hover:bg-amber-100/60">
                        {t("auth.dev_complete_reset")}
                      </Button>
                    </Link>
                  </div>
                )}

                <p className="text-xs text-muted-foreground/70 pt-2">
                  <Link href="/signin" className="text-primary hover:underline underline-offset-2">
                    {t("reset.return_to_signin")}
                  </Link>
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestReset} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground tracking-wide block">
                    {t("register.email_label")}
                  </label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder={t("register.email_placeholder")}
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setRequestError(null); }}
                    className="bg-background border-border/60 focus:border-primary/50 rounded-sm"
                    disabled={requestLoading}
                    required
                  />
                </div>

                {requestError && (
                  <p className="text-sm text-destructive border border-destructive/30 rounded-sm px-4 py-2 bg-destructive/5" role="alert">
                    {requestError}
                  </p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-serif bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={!email.trim() || requestLoading}
                  aria-busy={requestLoading}
                >
                  {requestLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                      {t("register.sending")}
                    </>
                  ) : (
                    t("reset.submit")
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground pt-1">
                  <Link href="/signin" className="text-primary hover:underline underline-offset-2">
                    {t("reset.return_to_signin")}
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Set new password (token present) ── */}
      {token && (
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-8">
            {resetSuccess ? (
              <div className="space-y-4 text-center">
                <CheckCircle2 className="w-10 h-10 mx-auto text-primary" aria-hidden="true" />
                <p className="text-sm text-muted-foreground font-light">{t("reset.success_body")}</p>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-foreground tracking-wide block">
                    {t("reset.new_password_label")}
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setResetError(null); }}
                      className="bg-background border-border/60 focus:border-primary/50 rounded-sm pr-10"
                      disabled={resetLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password-confirm" className="text-sm font-medium text-foreground tracking-wide block">
                    {t("register.password_confirm_label")}
                  </label>
                  <Input
                    id="password-confirm"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={passwordConfirm}
                    onChange={(e) => { setPasswordConfirm(e.target.value); setResetError(null); }}
                    className="bg-background border-border/60 focus:border-primary/50 rounded-sm"
                    disabled={resetLoading}
                    required
                  />
                </div>

                {resetError && (
                  <p className="text-sm text-destructive border border-destructive/30 rounded-sm px-4 py-2 bg-destructive/5" role="alert">
                    {resetError}
                  </p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-serif bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={!password || !passwordConfirm || resetLoading}
                  aria-busy={resetLoading}
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                      {t("register.sending")}
                    </>
                  ) : (
                    t("reset.set_password_submit")
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
