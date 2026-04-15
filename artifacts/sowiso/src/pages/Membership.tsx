import { useState, useEffect } from "react";
import { useGetProfile } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, ArrowRight, Crown, Globe, Sparkles, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type SubscriptionTier = "guest" | "traveller" | "ambassador";

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
  const { t } = useLanguage();
  const { data: profile, isLoading: profileLoading } = useGetProfile();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [billing, setBilling] = useState<BillingInterval>("monthly");
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [managingBilling, setManagingBilling] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgrade") === "success") {
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
        headers: { "Content-Type": "application/json" },
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
      const res = await fetch(`${API_BASE}/api/subscription/portal`, { method: "POST" });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setManagingBilling(false);
    }
  };

  const tierOrder: SubscriptionTier[] = ["guest", "traveller", "ambassador"];

  const getPriceId = (plan: Plan): string | null =>
    billing === "monthly" ? plan.monthlyPriceId : plan.yearlyPriceId;

  const getAmount = (plan: Plan): number | null =>
    billing === "monthly" ? plan.monthlyAmount : plan.yearlyAmount;

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-96 rounded-sm" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tierOrder.map((tier) => {
            const meta = TIER_META[tier];
            const plan = plans.find((p) => p.tier === tier);
            const isCurrentTier = tier === currentTier;
            const isAmbassador = tier === "ambassador";
            const Icon = meta.icon;
            const priceId = plan ? getPriceId(plan) : null;
            const amount = plan ? getAmount(plan) : null;

            return (
              <Card
                key={tier}
                className={`relative overflow-hidden transition-all duration-300 ${
                  isAmbassador
                    ? "border-[#9b7c4a]/30 bg-gradient-to-b from-card to-[#9b7c4a]/5"
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
                    plan?.displayName ?? (tier === "guest" ? "The Guest" : tier === "traveller" ? "The Traveller" : "The Ambassador")
                  }</h2>

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
                          backgroundColor: isAmbassador ? "#9b7c4a" : undefined,
                          borderColor: isAmbassador ? "#9b7c4a" : undefined,
                        }}
                        onClick={() => handleCheckout(priceId, tier)}
                        disabled={!!checkingOut || !priceId}
                        aria-label={`Select ${tier} membership`}
                      >
                        {checkingOut === tier ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            {tier === "traveller" ? t("membership.cta_traveller") : t("membership.cta_ambassador")}
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
