import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n";
import { LogIn, Send, Loader2, CheckCircle2, ArrowLeft, FlaskConical } from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function SignIn() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devVerifyUrl, setDevVerifyUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
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
          <h1 className="text-3xl font-serif text-foreground">{t("signin.sent_heading")}</h1>
          <p className="text-muted-foreground leading-relaxed font-light">
            {t("signin.sent_body_prefix")}{" "}
            <span className="font-medium text-foreground">{email}</span>.{" "}
            {t("signin.sent_body_suffix")}
          </p>
        </div>

        {devVerifyUrl && (
          <div className="border border-amber-300/60 bg-amber-50/60 rounded-sm p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-700">
              <FlaskConical className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="text-xs font-mono uppercase tracking-widest font-semibold">Development mode</span>
            </div>
            <p className="text-xs text-amber-700/80 font-light leading-relaxed">
              No SMTP is configured. Use the link below to sign in.
            </p>
            <Link href={devVerifyUrl.replace(/^https?:\/\/[^/]+/, "")}>
              <Button
                variant="outline"
                size="sm"
                className="w-full font-mono text-xs border-amber-400/60 text-amber-800 hover:bg-amber-100/60"
              >
                Complete Sign-In
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
          <LogIn className="w-8 h-8 text-primary" aria-hidden="true" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif text-foreground">{t("signin.title")}</h1>
        <p className="text-muted-foreground text-lg font-light leading-relaxed">
          {t("signin.subtitle")}
        </p>
      </div>

      {/* SSO coming soon */}
      <div className="space-y-3">
        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-border/50" />
          <span className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">of aanmelden met</span>
          <div className="flex-1 h-px bg-border/50" />
        </div>
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
                aria-label={`${name} — komt binnenkort`}
              >
                <span className="font-bold text-xs">{logo}</span>
                <span className="text-xs">{name}</span>
              </button>
              <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[9px] font-mono uppercase tracking-widest bg-muted text-muted-foreground/60 px-1.5 py-0.5 rounded-[2px] whitespace-nowrap border border-border/30">
                binnenkort
              </span>
            </div>
          ))}
        </div>
        <p className="text-center text-[10px] text-muted-foreground/40 font-mono">
          Aanmelden met sociale accounts is binnenkort beschikbaar.
        </p>
      </div>

      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px bg-border/50" />
        <span className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">of via e-mail</span>
        <div className="flex-1 h-px bg-border/50" />
      </div>

      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background border-border/60 focus:border-primary/50 rounded-sm"
                disabled={loading}
                required
              />
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
              disabled={!email.trim() || loading}
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  {t("register.sending")}
                </>
              ) : (
                <>
                  {t("signin.submit")}
                  <Send className="w-4 h-4 ml-2" aria-hidden="true" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        {t("signin.no_account")}{" "}
        <Link href="/register" className="text-primary hover:underline underline-offset-2">
          {t("register.title")}
        </Link>
      </p>
    </div>
  );
}
