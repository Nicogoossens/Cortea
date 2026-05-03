import { useState, useEffect } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, CheckCircle2, Loader2, ShoppingBag, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Guide {
  id: string;
  title: string;
  description: string | null;
  pillar: string;
  region_code: string | null;
  price_cents: number;
  tier_required: string | null;
}

interface PurchasedGuide extends Guide {
  purchased_at: string;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export default function Guides() {
  usePageTitle("Guides");
  const { t } = useLanguage();
  const { isAuthenticated, getAuthHeaders } = useAuth();

  const [guides, setGuides] = useState<Guide[]>([]);
  const [purchased, setPurchased] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("purchase") === "success") {
      setPurchaseSuccess(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Scroll to the deep-linked guide (e.g. /guides#<id>) once cards have rendered.
  // Used by the "My Guides" section on the Profile page so each purchased
  // item opens directly at its card with a brief highlight ring.
  useEffect(() => {
    if (loading || guides.length === 0) return;
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const el = document.getElementById(`guide-${hash}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-primary/60", "ring-offset-2");
    const timer = window.setTimeout(() => {
      el.classList.remove("ring-2", "ring-primary/60", "ring-offset-2");
    }, 2400);
    return () => window.clearTimeout(timer);
  }, [loading, guides.length]);

  useEffect(() => {
    const fetchGuides = fetch(`${API_BASE}/api/guides`).then((r) => r.json()).catch(() => []);

    const fetchPurchased = isAuthenticated
      ? fetch(`${API_BASE}/api/guides/purchased`, { headers: getAuthHeaders(), credentials: "include" })
          .then((r) => r.ok ? r.json() : [])
          .catch(() => [])
      : Promise.resolve([]);

    Promise.all([fetchGuides, fetchPurchased]).then(([allGuides, ownedGuides]: [Guide[], PurchasedGuide[]]) => {
      setGuides(Array.isArray(allGuides) ? allGuides : []);
      setPurchased(new Set((Array.isArray(ownedGuides) ? ownedGuides : []).map((g) => g.id)));
      setLoading(false);
    });
  }, [isAuthenticated]);

  const handleBuy = async (guide: Guide) => {
    if (!isAuthenticated) {
      window.location.href = `${API_BASE}/signin`;
      return;
    }
    setBuying(guide.id);
    try {
      const res = await fetch(`${API_BASE}/api/guides/${guide.id}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
      else setBuying(null);
    } catch {
      setBuying(null);
    }
  };

  const pillarLabels: Record<string, string> = {
    internship: t("guides.pillar.internship"),
    exchange: t("guides.pillar.exchange"),
    dining: t("guides.pillar.dining"),
    interview: t("guides.pillar.interview"),
    networking: t("guides.pillar.networking"),
    travel: t("guides.pillar.travel"),
    business: t("guides.pillar.business"),
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">

      {purchaseSuccess && (
        <div className="flex items-center gap-3 px-5 py-4 bg-primary/5 border border-primary/20 rounded-sm" role="status">
          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
          <p className="text-sm text-foreground font-light">{t("guides.purchase_success")}</p>
        </div>
      )}

      <div className="space-y-4">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{t("guides.eyebrow")}</p>
        <h1 className="text-4xl md:text-5xl font-serif text-foreground">{t("guides.title")}</h1>
        <p className="text-muted-foreground text-lg font-light leading-relaxed max-w-2xl">
          {t("guides.subtitle")}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-64 rounded-sm" />)}
        </div>
      ) : guides.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto" aria-hidden="true" />
          <p className="text-muted-foreground font-light">{t("guides.empty")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((guide) => {
            const isOwned = purchased.has(guide.id);
            return (
              <Card
                key={guide.id}
                id={`guide-${guide.id}`}
                className={`relative overflow-hidden transition-all duration-300 scroll-mt-24 ${
                  isOwned ? "border-primary/30 bg-primary/5" : "border-border bg-card hover:border-border/80"
                }`}
              >
                {isOwned && (
                  <div className="absolute top-3 right-3">
                    <span className="text-[10px] font-mono uppercase tracking-widest bg-primary/10 text-primary px-2 py-1 rounded-[2px] border border-primary/20 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                      {t("guides.badge_owned")}
                    </span>
                  </div>
                )}
                <div className="h-0.5 w-full bg-primary/20" aria-hidden="true" />
                <CardHeader className="pb-2 pt-6 px-5">
                  <div className="flex items-start gap-2 mb-3">
                    <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-wider rounded-[2px] shrink-0">
                      {pillarLabels[guide.pillar] ?? guide.pillar}
                    </Badge>
                    {guide.region_code && (
                      <Badge variant="secondary" className="text-[10px] font-mono rounded-[2px] shrink-0">
                        {guide.region_code}
                      </Badge>
                    )}
                  </div>
                  <h2 className="font-serif text-lg text-foreground leading-snug">{guide.title}</h2>
                </CardHeader>
                <CardContent className="px-5 pb-6 space-y-4">
                  {guide.description && (
                    <p className="text-sm text-muted-foreground font-light leading-relaxed">
                      {guide.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <span className="font-serif text-xl text-foreground">{formatPrice(guide.price_cents)}</span>
                    {isOwned ? (
                      <div className="flex items-center gap-1.5 text-primary text-sm font-light">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        {t("guides.access_label")}
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="font-serif gap-1.5 group"
                        onClick={() => handleBuy(guide)}
                        disabled={!!buying}
                        aria-label={`Purchase ${guide.title}`}
                      >
                        {buying === guide.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                            {t("guides.cta_buy")}
                            <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
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
          {t("guides.footer_note")}
        </p>
      </div>
    </div>
  );
}
