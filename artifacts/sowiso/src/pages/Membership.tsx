import { useState, useEffect } from "react";
import { useGetProfile } from "@workspace/api-client-react";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, ArrowRight, Crown, Globe, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type SubscriptionTier = "guest" | "student" | "traveller" | "ambassador" | "concierge";

interface Plan {
  productId: string;
  tier: SubscriptionTier;
  displayName: string;
  description: string | null;
  monthlyPriceId: string | null;
  monthlyAmount: number | null;
  yearlyPriceId: string | null;
  yearlyAmount: number | null;
  currency: string;
  trialDays?: number;
}

const TIER_META: Record<SubscriptionTier, {
  taglineKey: string;
  icon: typeof Globe;
  accent: string;
  featureKeys: string[];
}> = {
  guest: {
    taglineKey: "membership.guest.tagline",
    icon: Sparkles,
    accent: "var(--muted-foreground)",
    featureKeys: [
      "membership.guest.feature1",
      "membership.guest.feature2",
      "membership.guest.feature3",
    ],
  },
  student: {
    taglineKey: "membership.student.tagline",
    icon: Globe,
    accent: "#4a7c9b",
    featureKeys: [
      "membership.student.feature1",
      "membership.student.feature2",
      "membership.student.feature3",
      "membership.student.feature4",
    ],
  },
  traveller: {
    taglineKey: "membership.traveller.tagline",
    icon: Globe,
    accent: "var(--primary)",
    featureKeys: [
      "membership.traveller.feature1",
      "membership.traveller.feature2",
      "membership.traveller.feature3",
      "membership.traveller.feature4",
    ],
  },
  ambassador: {
    taglineKey: "membership.ambassador.tagline",
    icon: Crown,
    accent: "#9b7c4a",
    featureKeys: [
      "membership.ambassador.feature1",
      "membership.ambassador.feature2",
      "membership.ambassador.feature3",
      "membership.ambassador.feature4",
    ],
  },
  concierge: {
    taglineKey: "membership.concierge.tagline",
    icon: Crown,
    accent: "#6b4a9b",
    featureKeys: [
      "membership.concierge.feature1",
      "membership.concierge.feature2",
      "membership.concierge.feature3",
      "membership.concierge.feature4",
      "membership.concierge.feature5",
    ],
  },
};

function formatPrice(amount: number | null, currency: string): string {
  if (amount === null) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amount / 100);
}

type BillingInterval = "monthly" | "yearly";

export default function Membership() {
  const { t, locale } = useLanguage();
  const { getAuthHeaders } = useAuth();
  const { data: profile, isLoading: profileLoading } = useGetProfile();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [billing, setBilling] = useState<BillingInterval>("monthly");
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [managingBilling, setManagingBilling] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [status, setStatus] = useState<{
    tier: string;
    status: string;
    inTrial: boolean;
    trialEndsAt: string | null;
    renewalDate: string | null;
  } | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelDone, setCancelDone] = useState<string | null>(null);

  // Pull current subscription state so we can show trial countdown +
  // a one-click cancel option without leaving the membership page.
  useEffect(() => {
    fetch(`${API_BASE}/api/subscription/status`, { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setStatus(d))
      .catch(() => setStatus(null));
  }, [getAuthHeaders]);

  const handleCancel = async () => {
    if (!confirm(t("membership.cancel_confirm", "Are you sure you want to cancel your membership?"))) return;
    setCancelling(true);
    try {
      const res = await fetch(`${API_BASE}/api/subscription/cancel`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const j = await res.json();
      if (res.ok) {
        setCancelDone(j.duringTrial ? "trial" : "period");
        // Refresh status panel
        const s = await fetch(`${API_BASE}/api/subscription/status`, { headers: getAuthHeaders() });
        if (s.ok) setStatus(await s.json());
      }
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgrade") === "success") {
      setUpgradeSuccess(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/subscription/plans`)
      .then((r) => r.json())
      .then((data: unknown) => setPlans(Array.isArray(data) ? (data as Plan[]) : []))
      .catch(() => setPlans([]))
      .finally(() => setPlansLoading(false));
  }, []);

  const currentTier = (profile?.subscription_tier ?? "guest") as SubscriptionTier;

  const handleCheckout = async (priceId: string | null, tier: SubscriptionTier) => {
    if (!priceId) return;
    if (tier === currentTier) return;
    setCheckingOut(tier);
    try {
      const res = await fetch(`${API_BASE}/api/subscription/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ priceId }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setCheckingOut(null);
    }
  };

  const handleManageBilling = async () => {
    setManagingBilling(true);
    try {
      const res = await fetch(`${API_BASE}/api/subscription/portal`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setManagingBilling(false);
    }
  };

  const tierOrder: SubscriptionTier[] = ["guest", "student", "traveller", "ambassador", "concierge"];

  const getPriceId = (plan: Plan): string | null =>
    billing === "monthly" ? plan.monthlyPriceId : plan.yearlyPriceId;

  const getAmount = (plan: Plan): number | null =>
    billing === "monthly" ? plan.monthlyAmount : plan.yearlyAmount;

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
      <SEOHead
        title={t("seo.membership.title", "Membership — Cortéa")}
        description={t("seo.membership.description")}
        path="/membership"
        locale={locale}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Cortéa",
            "url": "https://cortea.app",
            "applicationCategory": "EducationalApplication",
            "offers": [
              {
                "@type": "Offer",
                "name": "Basic",
                "description": "Free access to The Atelier (limited scenarios), The Compass country guides, and 5 Counsel questions.",
                "price": "0",
                "priceCurrency": "GBP"
              },
              {
                "@type": "Offer",
                "name": "Traveller",
                "description": "Full access to The Atelier, Compass, and unlimited Counsel questions.",
                "priceSpecification": {
                  "@type": "UnitPriceSpecification",
                  "price": "9.99",
                  "priceCurrency": "GBP",
                  "unitText": "MONTH"
                }
              },
              {
                "@type": "Offer",
                "name": "Ambassador",
                "description": "All Traveller features plus The Mirror, The Sensory, The Navigator, and The Inner Circle.",
                "priceSpecification": {
                  "@type": "UnitPriceSpecification",
                  "price": "19.99",
                  "priceCurrency": "GBP",
                  "unitText": "MONTH"
                }
              }
            ]
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What is included in the free Basic plan?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "The Basic plan includes limited access to The Atelier scenario practice, all Compass country etiquette guides, and up to 5 AI Counsel questions per month. No credit card required."
                }
              },
              {
                "@type": "Question",
                "name": "What does the Traveller plan include?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "The Traveller plan includes unlimited access to all Atelier scenarios across all five etiquette pillars, full Compass country guides, and unlimited AI Counsel questions for any cultural situation."
                }
              },
              {
                "@type": "Question",
                "name": "What additional features does the Ambassador plan provide?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "The Ambassador plan includes everything in Traveller plus exclusive access to The Mirror (AI dress code analysis), The Sensory (ambient noise awareness), The Navigator (pre-trip briefings), and The Inner Circle community."
                }
              },
              {
                "@type": "Question",
                "name": "Can I cancel my subscription at any time?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, you can cancel your Cortéa subscription at any time. Your access continues until the end of your current billing period."
                }
              }
            ]
          }
        ]}
      />

      {upgradeSuccess && (
        <div className="flex items-center gap-3 px-5 py-4 bg-primary/5 border border-primary/20 rounded-sm" role="status">
          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
          <p className="text-sm text-foreground font-light">{t("membership.upgrade_success")}</p>
        </div>
      )}

      {/* Active subscription / trial dashboard panel.
          Surfaces trial status, renewal date, and the one-click cancel
          required by the brief. Hidden for guests. */}
      {status && status.tier !== "guest" && (
        <div className="rounded-sm border border-border/60 bg-card p-5 space-y-3" data-testid="subscription-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                {t("membership.current_standing", "Your current standing")}
              </p>
              <p className="font-serif text-lg text-foreground capitalize">{status.tier}</p>
              {status.inTrial && status.trialEndsAt && (
                <p className="text-sm text-primary font-light">
                  {t("membership.trial_active", { date: new Date(status.trialEndsAt).toLocaleDateString() })}
                </p>
              )}
              {!status.inTrial && status.renewalDate && status.status !== "cancel_at_period_end" && status.status !== "canceled" && (
                <p className="text-xs text-muted-foreground font-light">
                  {t("membership.renews_on", { date: new Date(status.renewalDate).toLocaleDateString() })}
                </p>
              )}
              {status.status === "cancel_at_period_end" && status.renewalDate && (
                <p className="text-xs text-amber-500 font-light">
                  {t("membership.access_until", { date: new Date(status.renewalDate).toLocaleDateString() })}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleManageBilling}
                disabled={managingBilling}
                data-testid="manage-billing-btn"
              >
                {managingBilling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("membership.manage", "Manage billing")}
              </Button>
              {status.status !== "cancel_at_period_end" && status.status !== "canceled" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="text-muted-foreground hover:text-foreground"
                  data-testid="cancel-subscription-btn"
                >
                  {cancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("membership.cancel_cta", "Cancel membership")}
                </Button>
              )}
            </div>
          </div>
          {cancelDone && (
            <p className="text-xs text-foreground/80 font-light italic" role="status">
              {cancelDone === "trial"
                ? t("membership.cancel_done_trial", "Your trial has been ended; no charge will be made. A confirmation has been sent.")
                : t("membership.cancel_done_period", "Your membership will end at the close of the current period. A confirmation has been sent.")}
            </p>
          )}
        </div>
      )}

      <div className="space-y-4">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{t("membership.eyebrow")}</p>
        <h1 className="text-4xl md:text-5xl font-serif text-foreground">{t("membership.title")}</h1>
        <p className="text-muted-foreground text-lg font-light leading-relaxed max-w-2xl">
          {t("membership.subtitle")}
        </p>
      </div>

      <div className="flex items-center gap-1 p-1 bg-muted/40 border border-border/40 rounded-sm w-fit">
        <button
          onClick={() => setBilling("monthly")}
          className={`px-5 py-2 text-sm font-medium rounded-[2px] transition-all ${
            billing === "monthly"
              ? "bg-background text-foreground shadow-sm border border-border/60"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("membership.billing_monthly")}
        </button>
        <button
          onClick={() => setBilling("yearly")}
          className={`px-5 py-2 text-sm font-medium rounded-[2px] transition-all flex items-center gap-2 ${
            billing === "yearly"
              ? "bg-background text-foreground shadow-sm border border-border/60"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("membership.billing_yearly")}
          <span className="text-[10px] font-mono uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded-[2px]">
            {t("membership.billing_yearly_save")}
          </span>
        </button>
      </div>

      {plansLoading || profileLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-96 rounded-sm" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {tierOrder.map((tier) => {
            const meta = TIER_META[tier];
            const plan = plans.find((p) => p.tier === tier);
            const isCurrentTier = tier === currentTier;
            const isAmbassador = tier === "ambassador";
            const isConcierge = tier === "concierge";
            const isStudent = tier === "student";
            const Icon = meta.icon;
            const priceId = plan ? getPriceId(plan) : null;
            const amount = plan ? getAmount(plan) : null;
            const trialDays = plan?.trialDays ?? 0;

            return (
              <Card
                key={tier}
                className={`relative overflow-hidden transition-all duration-300 ${
                  isConcierge
                    ? "border-[#6b4a9b]/40 bg-gradient-to-b from-card to-[#6b4a9b]/10 shadow-md"
                    : isAmbassador
                    ? "border-[#9b7c4a]/30 bg-gradient-to-b from-card to-[#9b7c4a]/5"
                    : isStudent
                    ? "border-[#4a7c9b]/30 bg-gradient-to-b from-card to-[#4a7c9b]/5"
                    : isCurrentTier
                    ? "border-primary/30 bg-card"
                    : "border-border bg-card hover:border-border/80"
                }`}
              >
                {isCurrentTier && (
                  <div className="absolute top-4 right-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest bg-primary/10 text-primary px-2 py-1 rounded-[2px] border border-primary/20">
                      {t("membership.current_badge")}
                    </span>
                  </div>
                )}

                <div
                  className="h-1 w-full"
                  style={{ backgroundColor: meta.accent + "60" }}
                  aria-hidden="true"
                />

                <CardHeader className="pb-2 pt-8 px-6">
                  <div className="mb-4">
                    <Icon
                      className="h-7 w-7"
                      style={{ color: meta.accent }}
                      aria-hidden="true"
                    />
                  </div>
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
                    {t(meta.taglineKey)}
                  </p>
                  <h2 className="font-serif text-2xl text-foreground">{
                    plan?.displayName ?? (
                      tier === "guest" ? "The Guest"
                      : tier === "student" ? "The Student"
                      : tier === "traveller" ? "The Traveller"
                      : tier === "ambassador" ? "The Ambassador"
                      : "The Concierge"
                    )
                  }</h2>
                  {trialDays > 0 && !isCurrentTier && (
                    <div className="mt-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest bg-primary/10 text-primary px-1.5 py-0.5 rounded-[2px] border border-primary/20">
                        {t("membership.trial_badge", { days: trialDays }) || `${trialDays}-day free trial`}
                      </span>
                    </div>
                  )}

                  <div className="pt-4">
                    {tier === "guest" ? (
                      <div className="font-serif text-3xl text-foreground">{t("membership.price_free")}</div>
                    ) : amount !== null ? (
                      <div className="flex items-baseline gap-1">
                        <span className="font-serif text-3xl text-foreground">{formatPrice(amount, plan?.currency ?? "eur")}</span>
                        <span className="text-sm text-muted-foreground font-light">
                          /{billing === "monthly" ? t("membership.billing_per_month") : t("membership.billing_per_year")}
                        </span>
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-sm font-light italic">{t("membership.price_not_configured")}</div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="px-6 pb-8 space-y-6">
                  <ul className="space-y-3" aria-label={`Features of ${tier}`}>
                    {meta.featureKeys.map((featureKey) => (
                      <li key={featureKey} className="flex items-start gap-2.5">
                        <Check
                          className="h-4 w-4 mt-0.5 flex-shrink-0"
                          style={{ color: meta.accent }}
                          aria-hidden="true"
                        />
                        <span className="text-sm text-muted-foreground font-light">{t(featureKey)}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-2">
                    {tier === "guest" ? (
                      <div className="text-xs text-center text-muted-foreground/60 font-mono uppercase tracking-widest py-2">
                        {t("membership.current_standing")}
                      </div>
                    ) : isCurrentTier ? (
                      <Button
                        variant="outline"
                        className="w-full font-serif"
                        onClick={handleManageBilling}
                        disabled={managingBilling}
                      >
                        {managingBilling ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          t("membership.manage")
                        )}
                      </Button>
                    ) : (
                      <Button
                        className="w-full font-serif gap-2 group"
                        style={{
                          backgroundColor: isConcierge ? "#6b4a9b" : isAmbassador ? "#9b7c4a" : undefined,
                          borderColor: isConcierge ? "#6b4a9b" : isAmbassador ? "#9b7c4a" : undefined,
                        }}
                        onClick={() => handleCheckout(priceId, tier)}
                        disabled={!!checkingOut || !priceId}
                        aria-label={`Select ${tier} membership`}
                      >
                        {checkingOut === tier ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            {tier === "traveller"
                              ? t("membership.cta_traveller")
                              : tier === "student"
                              ? t("membership.cta_student")
                              : tier === "concierge"
                              ? t("membership.cta_concierge")
                              : t("membership.cta_ambassador")}
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="border-t border-border/30 pt-8 text-center">
        <p className="text-xs text-muted-foreground/60 font-mono uppercase tracking-widest">
          {t("membership.footer_note")}
        </p>
      </div>

    </div>
  );
}
