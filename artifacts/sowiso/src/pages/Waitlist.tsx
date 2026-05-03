import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/i18n";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, Check, Crown, Sparkles, Globe, Briefcase, GraduationCap } from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Segment = "business" | "expat" | "student" | "elite" | "other";

interface Stats {
  claimed: number;
  total: number;
  remaining: number;
}

interface SignupResult {
  email: string;
  name: string;
  segment: string;
  founderCode: string | null;
  founderPosition: number | null;
  hasFounderCode: boolean;
}

const SEGMENT_OPTIONS: { value: Segment; labelKey: string; descKey: string; icon: typeof Globe }[] = [
  { value: "business", labelKey: "waitlist.segment.business", descKey: "waitlist.segment.business_desc", icon: Briefcase },
  { value: "expat", labelKey: "waitlist.segment.expat", descKey: "waitlist.segment.expat_desc", icon: Globe },
  { value: "student", labelKey: "waitlist.segment.student", descKey: "waitlist.segment.student_desc", icon: GraduationCap },
  { value: "elite", labelKey: "waitlist.segment.elite", descKey: "waitlist.segment.elite_desc", icon: Crown },
  { value: "other", labelKey: "waitlist.segment.other", descKey: "waitlist.segment.other_desc", icon: Sparkles },
];

export default function Waitlist() {
  const { t, locale } = useLanguage();
  const [stats, setStats] = useState<Stats | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [segment, setSegment] = useState<Segment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SignupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = () =>
      fetch(`${API_BASE}/api/waitlist/stats`)
        .then((r) => r.json())
        .then((d: Stats) => setStats(d))
        .catch(() => setStats(null));
    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!segment || !name.trim() || !email.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), segment, locale: locale.split("-")[0] }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? t("waitlist.error_generic"));
        setSubmitting(false);
        return;
      }
      const data = (await res.json()) as SignupResult;
      setResult(data);
      // Refresh counter
      fetch(`${API_BASE}/api/waitlist/stats`).then((r) => r.json()).then(setStats).catch(() => {});
    } catch {
      setError(t("waitlist.error_generic"));
    } finally {
      setSubmitting(false);
    }
  }

  const claimedCount = stats?.claimed ?? 0;
  const totalCount = stats?.total ?? 100;
  const percent = Math.min(100, Math.round((claimedCount / totalCount) * 100));
  const founderSpotsAvailable = (stats?.remaining ?? 100) > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title={t("waitlist.seo_title", "Join the Cortéa Founding 100 — Waitlist")}
        description={t("waitlist.seo_description", "Reserve your seat at Cortéa. The first 100 founding members receive one month of The Traveller, complimentary.")}
        path="/waitlist"
        locale={locale}
      />

      <header className="px-6 md:px-12 py-5 border-b border-border/30">
        <Link href="/">
          <span className="font-serif text-2xl md:text-3xl tracking-widest text-foreground uppercase cursor-pointer">
            {t("app.name")}
          </span>
        </Link>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 md:px-12 py-16 md:py-24 space-y-12">
        <div className="space-y-4">
          <p className="text-xs font-mono uppercase tracking-widest text-primary">
            {t("waitlist.eyebrow")}
          </p>
          <h1 className="text-4xl md:text-5xl font-serif text-foreground leading-tight">
            {t("waitlist.title")}
          </h1>
          <p className="text-lg text-muted-foreground font-light leading-relaxed max-w-2xl">
            {t("waitlist.subtitle")}
          </p>
        </div>

        {/* Live counter */}
        <Card className="px-6 py-5 border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              {t("waitlist.counter_label")}
            </span>
            <span className="font-serif text-foreground" data-testid="waitlist-counter">
              <span className="text-2xl text-primary">{claimedCount}</span>
              <span className="text-sm text-muted-foreground"> / {totalCount}</span>
            </span>
          </div>
          <div className="h-2 bg-muted/40 rounded-full overflow-hidden" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground font-light">
            {founderSpotsAvailable
              ? t("waitlist.counter_remaining", { count: stats?.remaining ?? 100 })
              : t("waitlist.counter_full")}
          </p>
        </Card>

        {result ? (
          <Card className="p-8 border-primary/30 bg-card animate-in fade-in slide-in-from-bottom-4 duration-500" data-testid="waitlist-confirmation">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <h2 className="font-serif text-2xl text-foreground">{t("waitlist.confirmed_title")}</h2>
            </div>
            {result.hasFounderCode && result.founderCode ? (
              <>
                <p className="text-muted-foreground font-light leading-relaxed mb-6">
                  {t("waitlist.confirmed_founder_body", { position: result.founderPosition ?? 0 })}
                </p>
                <div className="text-center py-6 bg-foreground text-background rounded-sm">
                  <p className="text-xs font-mono uppercase tracking-widest opacity-70 mb-2">
                    {t("waitlist.your_code")}
                  </p>
                  <p className="font-mono text-2xl tracking-widest" data-testid="founder-code">{result.founderCode}</p>
                </div>
                <p className="mt-6 text-sm text-muted-foreground font-light leading-relaxed">
                  {t("waitlist.confirmed_howto")}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground font-light leading-relaxed">
                {t("waitlist.confirmed_waitlist_body")}
              </p>
            )}
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8" data-testid="waitlist-form">
            <div className="space-y-3">
              <Label htmlFor="waitlist-name" className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                {t("waitlist.field_name")}
              </Label>
              <Input
                id="waitlist-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={120}
                placeholder={t("waitlist.field_name_placeholder")}
                data-testid="input-name"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="waitlist-email" className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                {t("waitlist.field_email")}
              </Label>
              <Input
                id="waitlist-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={t("waitlist.field_email_placeholder")}
                data-testid="input-email"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                {t("waitlist.field_segment")}
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SEGMENT_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const selected = segment === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSegment(opt.value)}
                      className={`text-left px-4 py-3 border rounded-sm transition-all flex items-start gap-3 ${
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-border/80"
                      }`}
                      data-testid={`segment-${opt.value}`}
                      aria-pressed={selected}
                    >
                      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${selected ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
                      <div>
                        <div className="font-serif text-sm text-foreground">{t(opt.labelKey)}</div>
                        <div className="text-xs text-muted-foreground font-light mt-0.5">{t(opt.descKey)}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive font-light" role="alert" data-testid="error-message">
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={submitting || !segment || !name.trim() || !email.trim()}
              className="w-full font-serif gap-2"
              data-testid="button-submit"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                founderSpotsAvailable ? t("waitlist.cta_founder") : t("waitlist.cta_waitlist")
              )}
            </Button>

            <p className="text-xs text-muted-foreground/70 font-light text-center leading-relaxed">
              {t("waitlist.legal_note")}
            </p>
          </form>
        )}

        {/* Social proof / what you get */}
        <div className="border-t border-border/30 pt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {(["benefit_1", "benefit_2", "benefit_3"] as const).map((key) => (
            <div key={key} className="space-y-2">
              <p className="text-xs font-mono uppercase tracking-widest text-primary">
                {t(`waitlist.${key}_eyebrow`)}
              </p>
              <p className="text-sm text-foreground font-serif">
                {t(`waitlist.${key}_title`)}
              </p>
              <p className="text-sm text-muted-foreground font-light leading-relaxed">
                {t(`waitlist.${key}_body`)}
              </p>
            </div>
          ))}
        </div>
      </main>

      <footer className="px-6 md:px-12 py-6 border-t border-border/20 text-center">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40">
          {t("app.established")}
        </p>
      </footer>
    </div>
  );
}
