import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { LogIn, Send, Loader2, CheckCircle2, ArrowLeft, FlaskConical, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function SignIn() {
  usePageTitle("Sign In");
  const { t } = useLanguage();
  const { login } = useAuth();
  const [, navigate] = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noPasswordSet, setNoPasswordSet] = useState(false);

  // Magic-link fallback state
  const [magicLinkOpen, setMagicLinkOpen] = useState(false);
  const [magicEmail, setMagicEmail] = useState("");
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicSubmitted, setMagicSubmitted] = useState(false);
  const [magicError, setMagicError] = useState<string | null>(null);
  const [devVerifyUrl, setDevVerifyUrl] = useState<string | null>(null);

  // Google OAuth status
  const [googleConfigured, setGoogleConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/google/status`)
      .then((r) => r.json())
      .then((d: { configured: boolean }) => setGoogleConfigured(d.configured))
      .catch(() => setGoogleConfigured(false));
  }, []);

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    setNoPasswordSet(false);

    try {
      const res = await fetch(`${API_BASE}/api/auth/signin-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const body = await res.json() as {
        message?: string;
        error?: string;
        no_password?: boolean;
        user_id?: string;
        full_name?: string | null;
        is_admin?: boolean;
      };

      if (!res.ok) {
        if (body.no_password) {
          setNoPasswordSet(true);
          setMagicEmail(email.trim());
          setMagicLinkOpen(true);
        }
        setError(body.error ?? t("common.error"));
        return;
      }

      login(body.user_id!, {
        name: body.full_name ?? undefined,
        isAdmin: body.is_admin,
      });
      navigate("/");
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!magicEmail.trim()) return;
    setMagicLoading(true);
    setMagicError(null);

    try {
      const res = await fetch(`${API_BASE}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: magicEmail.trim() }),
      });

      const body = await res.json() as { message?: string; error?: string; dev_verification_url?: string };

      if (!res.ok) {
        setMagicError(body.error ?? t("common.error"));
        return;
      }

      if (body.dev_verification_url) setDevVerifyUrl(body.dev_verification_url);
      setMagicSubmitted(true);
    } catch {
      setMagicError(t("common.error"));
    } finally {
      setMagicLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-10 animate-in fade-in duration-500 py-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-primary/5 rounded-full flex items-center justify-center mb-6">
          <LogIn className="w-8 h-8 text-primary" aria-hidden="true" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif text-foreground">{t("signin.title")}</h1>
        <p className="text-muted-foreground text-lg font-light leading-relaxed">
          {t("signin.subtitle")}
        </p>
      </div>

      {/* SSO options */}
      <div className="space-y-3">
        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-border/50" />
          <span className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">{t("auth.or_sign_with")}</span>
          <div className="flex-1 h-px bg-border/50" />
        </div>

        {/* Google OAuth — functional when configured */}
        {googleConfigured === true ? (
          <button
            type="button"
            onClick={() => {
              const base = import.meta.env.BASE_URL as string;
              const returnTo = encodeURIComponent(`${base}replit-callback`.replace("//", "/"));
              window.location.href = `${API_BASE}/api/auth/google?returnTo=${returnTo}`;
            }}
            className="w-full flex items-center justify-center gap-2.5 h-11 rounded-sm border border-border/60 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors shadow-sm"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Doorgaan met Google
          </button>
        ) : (
          <div className="relative">
            <button
              type="button"
              disabled
              className="w-full flex items-center justify-center gap-2 h-10 rounded-sm border border-border/40 bg-muted/30 text-muted-foreground/40 text-sm font-medium cursor-not-allowed select-none"
            >
              <svg width="14" height="14" viewBox="0 0 18 18" aria-hidden="true" className="opacity-40">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              <span className="text-xs">Google</span>
            </button>
            <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[9px] font-mono uppercase tracking-widest bg-muted text-muted-foreground/60 px-1.5 py-0.5 rounded-[2px] whitespace-nowrap border border-border/30">
              {t("auth.coming_soon")}
            </span>
          </div>
        )}

        {/* Replit SSO */}
        <button
          type="button"
          onClick={() => {
            const base = import.meta.env.BASE_URL as string;
            const returnTo = encodeURIComponent(`${base}replit-callback`.replace("//", "/"));
            window.location.href = `${API_BASE}/api/login?returnTo=${returnTo}`;
          }}
          className="w-full flex items-center justify-center gap-2.5 h-11 rounded-sm border border-primary/30 bg-primary/5 hover:bg-primary/10 text-foreground/70 text-sm font-medium transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <rect width="100" height="100" rx="16" fill="currentColor" fillOpacity="0.1"/>
            <path d="M30 25h40v15H45v10h25v15H45v10h25v15H30V25z" fill="currentColor"/>
          </svg>
          {t("auth.sso_signin")}
        </button>
      </div>

      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px bg-border/50" />
        <span className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">{t("auth.or_via_email")}</span>
        <div className="flex-1 h-px bg-border/50" />
      </div>

      {/* Primary: email + password form */}
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-8">
          <form onSubmit={handlePasswordSignIn} className="space-y-5" noValidate>
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
                onChange={(e) => { setEmail(e.target.value); setError(null); setNoPasswordSet(false); }}
                className="bg-background border-border/60 focus:border-primary/50 rounded-sm"
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground tracking-wide block">
                {t("signin.password_label")}
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); setNoPasswordSet(false); }}
                  className="bg-background border-border/60 focus:border-primary/50 rounded-sm pr-10"
                  disabled={loading}
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

            {error && (
              <p className="text-sm text-destructive border border-destructive/30 rounded-sm px-4 py-2 bg-destructive/5" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full font-serif bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={!email.trim() || !password || loading}
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  {t("register.sending")}
                </>
              ) : (
                t("signin.submit_password")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Magic-link fallback — collapsible */}
      <div className="border border-border/40 rounded-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setMagicLinkOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-left text-sm text-muted-foreground hover:bg-muted/20 transition-colors"
        >
          <span className="font-mono text-xs uppercase tracking-widest">{t("signin.magic_link_fallback")}</span>
          {magicLinkOpen ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
        </button>

        {magicLinkOpen && (
          <div className="border-t border-border/40 p-5 space-y-4 bg-muted/10 animate-in fade-in duration-200">
            {magicSubmitted ? (
              <div className="space-y-3 text-center">
                <CheckCircle2 className="w-8 h-8 mx-auto text-primary" aria-hidden="true" />
                <p className="text-sm text-muted-foreground font-light">
                  {t("signin.sent_body_prefix")} <span className="font-medium text-foreground">{magicEmail}</span>. {t("signin.sent_body_suffix")}
                </p>
                {devVerifyUrl && (
                  <div className="border border-amber-300/60 bg-amber-50/60 rounded-sm p-4 space-y-2 text-left">
                    <div className="flex items-center gap-2 text-amber-700">
                      <FlaskConical className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span className="text-xs font-mono uppercase tracking-widest font-semibold">{t("auth.dev_mode")}</span>
                    </div>
                    <p className="text-xs text-amber-700/80 font-light">{t("auth.dev_no_smtp_signin")}</p>
                    <Link href={devVerifyUrl.replace(/^https?:\/\/[^/]+/, "")}>
                      <Button variant="outline" size="sm" className="w-full font-mono text-xs border-amber-400/60 text-amber-800 hover:bg-amber-100/60">
                        {t("auth.dev_complete_signin")}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleMagicLink} className="space-y-3" noValidate>
                <p className="text-xs text-muted-foreground/70 font-light leading-relaxed">
                  {t("signin.magic_link_desc")}
                </p>
                <Input
                  type="email"
                  autoComplete="email"
                  aria-label={t("register.email_label")}
                  placeholder={t("register.email_placeholder")}
                  value={magicEmail}
                  onChange={(e) => { setMagicEmail(e.target.value); setMagicError(null); }}
                  className="bg-background border-border/60 focus:border-primary/50 rounded-sm text-sm"
                  disabled={magicLoading}
                />
                {magicError && (
                  <p className="text-xs text-destructive" role="alert">{magicError}</p>
                )}
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="w-full font-mono text-xs gap-2"
                  disabled={!magicEmail.trim() || magicLoading}
                >
                  {magicLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {t("signin.submit")}
                </Button>
              </form>
            )}
          </div>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {t("signin.no_account")}{" "}
        <Link href="/register" className="text-primary hover:underline underline-offset-2">
          {t("register.title")}
        </Link>
      </p>
    </div>
  );
}
