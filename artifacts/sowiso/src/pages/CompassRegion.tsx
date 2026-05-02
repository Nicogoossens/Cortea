import {
  useGetCultureCompassRegion,
  getGetCultureCompassRegionQueryKey,
  useGetCultureProtocols,
  getGetCultureProtocolsQueryKey,
  useGetProfile,
  type CultureProtocol,
} from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertTriangle, CheckCircle2, Utensils, MessageSquare, Gift, Shirt, Zap, MapPin, ShoppingBag, Dumbbell, Hotel, Car, LifeBuoy, BookOpen } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { LockOverlay } from "@/components/LockOverlay";
import { FlagEmoji } from "@/lib/active-region";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useState, useEffect } from "react";
import { VenueCard, type Venue, type VenueCategory, type OccasionTag } from "@/components/VenueCard";
import { isCompassRegionDetailLocked } from "@/lib/tier-access";

type PillarCode = "Z1" | "Z2" | "Z3" | "Z4" | "Z5";

const CC_PILLAR_ORDER: PillarCode[] = ["Z1", "Z2", "Z3", "Z4", "Z5"];

const CC_PILLAR_META: Record<PillarCode, { titleKey: string; descKey: string }> = {
  Z1: { titleKey: "compass.cc.z1.title", descKey: "compass.cc.z1.desc" },
  Z2: { titleKey: "compass.cc.z2.title", descKey: "compass.cc.z2.desc" },
  Z3: { titleKey: "compass.cc.z3.title", descKey: "compass.cc.z3.desc" },
  Z4: { titleKey: "compass.cc.z4.title", descKey: "compass.cc.z4.desc" },
  Z5: { titleKey: "compass.cc.z5.title", descKey: "compass.cc.z5.desc" },
};

const GUEST_UNLOCKED_REGIONS = ["GB"];

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type VenueCategoryTab = {
  id: VenueCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const CATEGORY_TABS: VenueCategoryTab[] = [
  { id: "shops", label: "Winkels", icon: ShoppingBag },
  { id: "dining", label: "Dinen", icon: Utensils },
  { id: "activities", label: "Activiteiten", icon: Dumbbell },
  { id: "accommodations", label: "Verblijven", icon: Hotel },
  { id: "transport", label: "Transport", icon: Car },
];

const OCCASION_LABELS: Record<OccasionTag, string> = {
  business: "Zakelijk",
  romantic: "Romantisch",
  family: "Familiair",
  social: "Vriendschappelijk",
};

function TheLocalSection({ regionCode }: { regionCode: string }) {
  const [activeTab, setActiveTab] = useState<VenueCategory>("shops");
  const [occasionFilter, setOccasionFilter] = useState<OccasionTag | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/venues?region=${encodeURIComponent(regionCode)}`)
      .then((r) => r.ok ? r.json() : { venues: [] })
      .then((data: { venues: Venue[] }) => {
        setVenues(data.venues ?? []);
      })
      .catch(() => setVenues([]))
      .finally(() => setLoading(false));
  }, [regionCode]);

  const tabVenues = venues.filter((v) => v.category === activeTab);
  const filteredVenues = activeTab === "dining" && occasionFilter
    ? tabVenues.filter((v) => v.occasionTags.includes(occasionFilter))
    : tabVenues;

  const occasionTags: OccasionTag[] = ["business", "romantic", "family", "social"];

  return (
    <section aria-labelledby="the-local-heading" className="space-y-6 pt-4 border-t border-border/40">
      <div className="flex items-center gap-3">
        <MapPin className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
        <div>
          <h2 id="the-local-heading" className="font-serif text-2xl text-foreground">
            The Local
          </h2>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/60 mt-0.5">
            Gecureerde venues & aanbevelingen
          </p>
        </div>
      </div>

      {/* Category tabs */}
      <div
        className="flex overflow-x-auto gap-0 rounded-sm border border-border/50 divide-x divide-border/50 bg-muted/10"
        role="tablist"
        aria-label="Venue categorieën"
      >
        {CATEGORY_TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          const count = venues.filter((v) => v.category === id).length;
          return (
            <button
              key={id}
              id={`tab-${id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${id}`}
              onClick={() => {
                setActiveTab(id);
                setOccasionFilter(null);
              }}
              className={`flex-1 min-w-[90px] flex flex-col items-center gap-1 px-3 py-3 text-xs font-mono uppercase tracking-widest transition-all whitespace-nowrap ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-primary-foreground" : "text-muted-foreground/70"}`} aria-hidden="true" />
              <span>{label}</span>
              {count > 0 && (
                <span className={`text-[9px] font-mono ${isActive ? "text-primary-foreground/70" : "text-muted-foreground/50"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Occasion filter — dining only */}
      {activeTab === "dining" && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter op gelegenheid">
          <button
            type="button"
            onClick={() => setOccasionFilter(null)}
            className={`px-3 py-1.5 rounded-sm text-xs font-mono uppercase tracking-widest border transition-all ${
              occasionFilter === null
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            Alle
          </button>
          {occasionTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setOccasionFilter(occasionFilter === tag ? null : tag)}
              className={`px-3 py-1.5 rounded-sm text-xs font-mono uppercase tracking-widest border transition-all ${
                occasionFilter === tag
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {OCCASION_LABELS[tag]}
            </button>
          ))}
        </div>
      )}

      {/* Venue cards */}
      <div
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
      >
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-36 w-full" />
            ))}
          </div>
        ) : filteredVenues.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            <MapPin className="w-6 h-6 mx-auto mb-2 opacity-30" aria-hidden="true" />
            <p>Geen venues gevonden voor deze selectie.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVenues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function CompassRegion() {
  const { code } = useParams<{ code: string }>();
  const { t, locale } = useLocale();
  const { isAuthenticated } = useAuth();
  const { data: profile } = useGetProfile();
  const regionCode = code || "";

  const spheres = profile?.situational_interests ?? [];
  const spheresParam = spheres.length > 0 ? spheres.join(",") : undefined;

  const compassParams = { locale, ...(spheresParam ? { situational_interests: spheresParam } : {}) };

  const { data: detail, isLoading } = useGetCultureCompassRegion(
    regionCode,
    compassParams,
    {
      query: {
        enabled: !!regionCode,
        queryKey: [...getGetCultureCompassRegionQueryKey(regionCode), locale, spheresParam],
      },
    }
  );

  usePageTitle(detail?.region_name ?? "The Cultural Compass");

  const protocolsParams = {
    region_code: regionCode,
    locale,
    ...(spheresParam ? { situational_interests: spheresParam } : {}),
  };

  const { data: protocols } = useGetCultureProtocols(protocolsParams, {
    query: {
      enabled: !!regionCode,
      queryKey: [...getGetCultureProtocolsQueryKey(protocolsParams), locale, spheresParam],
    },
  });

  const ccProtocolsParams = {
    region_code: regionCode,
    locale,
    verified_only: true,
    ...(spheresParam ? { situational_interests: spheresParam } : {}),
  };

  const { data: ccProtocols } = useGetCultureProtocols(
    ccProtocolsParams,
    {
      query: {
        enabled: !!regionCode,
        queryKey: [...getGetCultureProtocolsQueryKey(ccProtocolsParams), locale, spheresParam, "verified"],
      },
    }
  );

  const sphereHighlights = new Set<string>(detail?.sphere_highlights ?? []);

  const verifiedCCRecords: CultureProtocol[] = (ccProtocols ?? []).filter(
    (p) => p.verified === true && !!p.source_book && !!p.pillar_code,
  );

  const firstAidRecords = verifiedCCRecords.filter((p) => p.urgency === 3);
  const recordsByPillar = CC_PILLAR_ORDER.reduce<Record<PillarCode, CultureProtocol[]>>(
    (acc, code) => {
      acc[code] = verifiedCCRecords.filter((p) => p.pillar_code === code);
      return acc;
    },
    { Z1: [], Z2: [], Z3: [], Z4: [], Z5: [] },
  );

  const ccDisplay = (p: CultureProtocol): string =>
    p.display_rule ?? p.rule_cc ?? p.rule_description;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8" aria-label={t("common.loading")} aria-live="polite">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-6 items-center">
          <Skeleton className="h-20 w-20 rounded-sm" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="text-center py-20">
        <h2 className="font-serif text-2xl">{t("common.not_found")}</h2>
        <Link href="/compass" className="text-primary hover:underline mt-4 inline-block">
          {t("compass.back")}
        </Link>
      </div>
    );
  }

  if (isCompassRegionDetailLocked(isAuthenticated, GUEST_UNLOCKED_REGIONS, regionCode)) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-16">
        <Link href="/compass" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
          {t("compass.back")}
        </Link>
        <div className="flex items-center gap-4 md:gap-6">
          <FlagEmoji code={detail.region_code} className="text-4xl sm:text-6xl drop-shadow-sm flex-shrink-0" ariaLabel={detail.region_name} />
          <div>
            <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-2">{detail.region_name}</h1>
            <p className="text-sm font-mono tracking-widest uppercase text-muted-foreground">{detail.region_code}</p>
          </div>
        </div>
        <div className="relative min-h-[200px]">
          <div className="pointer-events-none select-none opacity-40 blur-[2px] space-y-6">
            <div className="bg-primary/5 border border-primary/20 rounded-sm p-6 h-40" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-border/40 rounded-sm p-6 h-28" />
              <div className="border border-border/40 rounded-sm p-6 h-28" />
            </div>
          </div>
          <LockOverlay
            variant="section"
            requiredTier="traveller"
            teaser={t("compass.lock.teaser")}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </div>
    );
  }

  const quickDos = detail.dos.slice(0, 5);
  const quickDonts = detail.donts.slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500 pb-16">
      <Link href="/compass" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
        {t("compass.back")}
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/60">
        <div className="flex items-center gap-4 md:gap-6">
          <FlagEmoji code={detail.region_code} className="text-4xl sm:text-6xl drop-shadow-sm flex-shrink-0" ariaLabel={detail.region_name} />
          <div>
            <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-2">{detail.region_name}</h1>
            <p className="text-sm font-mono tracking-widest uppercase text-muted-foreground">{detail.region_code}</p>
          </div>
        </div>
      </div>

      {/* Quick Brief */}
      <section aria-labelledby="quick-brief-heading" className="bg-primary/5 border border-primary/20 rounded-sm p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-primary/15">
          <Zap className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
          <div>
            <h2 id="quick-brief-heading" className="text-sm font-mono uppercase tracking-widest text-primary font-semibold">
              {t("compass.quick_brief")}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t("compass.quick_brief_subtitle")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-green-700 dark:text-green-400">
              {t("compass.dos")}
            </h3>
            <ul className="space-y-2.5" aria-label={t("compass.dos")}>
              {quickDos.map((item, i) => (
                <li key={i} className="flex gap-3 items-start text-sm">
                  <span className="text-green-600 mt-0.5 flex-shrink-0 font-bold" aria-hidden="true">+</span>
                  <span className="text-foreground/80 leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-red-700 dark:text-red-400">
              {t("compass.donts")}
            </h3>
            <ul className="space-y-2.5" aria-label={t("compass.donts")}>
              {quickDonts.map((item, i) => (
                <li key={i} className="flex gap-3 items-start text-sm">
                  <span className="text-red-600 mt-0.5 flex-shrink-0 font-bold" aria-hidden="true">×</span>
                  <span className="text-foreground/80 leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* First Aid — urgency 3 verified CC records */}
      {firstAidRecords.length > 0 && (
        <section
          aria-labelledby="first-aid-heading"
          className="bg-destructive/5 border border-destructive/30 rounded-sm p-6 md:p-8 space-y-5"
        >
          <div className="flex items-center gap-3 pb-4 border-b border-destructive/15">
            <LifeBuoy className="w-4 h-4 text-destructive flex-shrink-0" aria-hidden="true" />
            <div>
              <h2 id="first-aid-heading" className="text-sm font-mono uppercase tracking-widest text-destructive font-semibold">
                {t("compass.cc.first_aid")}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t("compass.cc.first_aid_subtitle")}</p>
            </div>
          </div>
          <ul className="space-y-3" aria-label={t("compass.cc.first_aid")}>
            {firstAidRecords.map((p) => (
              <li key={p.id} className="flex gap-3 items-start text-sm">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div className="space-y-1">
                  <p className="text-foreground/90 leading-relaxed">{ccDisplay(p)}</p>
                  {p.source_book && (
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
                      {t("compass.cc.source_label")} · {p.source_book}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Core Value + Taboo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono uppercase tracking-widest text-primary flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> {t("compass.core_value")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-serif text-xl leading-relaxed">{detail.core_value}</p>
          </CardContent>
        </Card>

        <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono uppercase tracking-widest text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" aria-hidden="true" /> {t("compass.taboo")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-serif text-xl leading-relaxed">{detail.biggest_taboo}</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed protocols */}
      <div className="space-y-6 pt-4">
        <h2 className="font-serif text-2xl border-b border-border pb-2">{t("compass.protocols")}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className={`shadow-sm ${sphereHighlights.has("dining_etiquette") ? "border-primary/40" : "border-border"}`}>
            <CardHeader className="pb-3 border-b border-border/30 bg-muted/10">
              <CardTitle className="text-lg font-serif flex items-center gap-3">
                <Utensils className="w-5 h-5 text-muted-foreground" aria-hidden="true" /> {t("compass.dining_etiquette")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-muted-foreground leading-relaxed">
              {detail.dining_etiquette}
            </CardContent>
          </Card>

          <Card className={`shadow-sm ${sphereHighlights.has("language_notes") ? "border-primary/40" : "border-border"}`}>
            <CardHeader className="pb-3 border-b border-border/30 bg-muted/10">
              <CardTitle className="text-lg font-serif flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-muted-foreground" aria-hidden="true" /> {t("compass.language_notes")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-muted-foreground leading-relaxed">
              {detail.language_notes}
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border/30 bg-muted/10">
              <CardTitle className="text-lg font-serif flex items-center gap-3">
                <Gift className="w-5 h-5 text-muted-foreground" aria-hidden="true" /> {t("compass.gift_protocol")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-muted-foreground leading-relaxed">
              {detail.gift_protocol}
            </CardContent>
          </Card>

          <Card className={`shadow-sm ${sphereHighlights.has("dress_code") ? "border-primary/40" : "border-border"}`}>
            <CardHeader className="pb-3 border-b border-border/30 bg-muted/10">
              <CardTitle className="text-lg font-serif flex items-center gap-3">
                <Shirt className="w-5 h-5 text-muted-foreground" aria-hidden="true" /> {t("compass.dress_code")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-muted-foreground leading-relaxed">
              {detail.dress_code}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sphere-sorted etiquette rules from the protocols database */}
      {protocols && protocols.length > 0 && (() => {
        const doRules = protocols.filter((p) => {
          const rt = p.rule_type.toLowerCase();
          return rt === "do" || rt === "dos";
        });
        const dontRules = protocols.filter((p) => {
          const rt = p.rule_type.toLowerCase();
          return rt === "dont" || rt === "don't" || rt === "donts";
        });
        if (doRules.length === 0 && dontRules.length === 0) return null;
        return (
          <section aria-labelledby="etiquette-rules-heading" className="space-y-4 pt-2 border-t border-border/40">
            <h2 id="etiquette-rules-heading" className="font-serif text-2xl border-b border-border pb-2 pt-4">
              {t("compass.dos")} &amp; {t("compass.donts")}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {doRules.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-green-700 dark:text-green-400">
                    {t("compass.dos")}
                  </h3>
                  <ul className="space-y-2" aria-label={t("compass.dos")}>
                    {doRules.map((p) => (
                      <li key={p.id} className="flex gap-3 items-start text-sm">
                        <span className="text-green-600 mt-0.5 flex-shrink-0 font-bold" aria-hidden="true">+</span>
                        <span className="text-foreground/80 leading-snug">{p.display_rule ?? p.rule_description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {dontRules.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-red-700 dark:text-red-400">
                    {t("compass.donts")}
                  </h3>
                  <ul className="space-y-2" aria-label={t("compass.donts")}>
                    {dontRules.map((p) => (
                      <li key={p.id} className="flex gap-3 items-start text-sm">
                        <span className="text-red-600 mt-0.5 flex-shrink-0 font-bold" aria-hidden="true">×</span>
                        <span className="text-foreground/80 leading-snug">{p.display_rule ?? p.rule_description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        );
      })()}

      {/* Verified CC Screening records grouped by 5-Pillar code (Z1–Z5) */}
      {verifiedCCRecords.length > 0 && (
        <section aria-labelledby="cc-pillars-heading" className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-border pb-2 gap-3 flex-wrap">
            <h2 id="cc-pillars-heading" className="font-serif text-2xl">
              {t("compass.cc.heading")}
            </h2>
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70 inline-flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" aria-hidden="true" />
              {t("compass.cc.heading_subtitle")}
            </span>
          </div>

          <div className="space-y-6">
            {CC_PILLAR_ORDER.map((code) => {
              const records = recordsByPillar[code];
              if (records.length === 0) return null;
              return (
                <Card key={code} className="border-border shadow-sm">
                  <CardHeader className="pb-3 border-b border-border/30 bg-muted/10">
                    <CardTitle className="text-lg font-serif flex items-baseline gap-3">
                      <span className="text-xs font-mono uppercase tracking-widest text-primary">
                        {code}
                      </span>
                      {t(CC_PILLAR_META[code].titleKey as Parameters<typeof t>[0])}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t(CC_PILLAR_META[code].descKey as Parameters<typeof t>[0])}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ul className="space-y-3" aria-label={t(CC_PILLAR_META[code].titleKey as Parameters<typeof t>[0])}>
                      {records.map((p) => (
                        <li key={p.id} className="flex gap-3 items-start">
                          <span className="text-primary/70 mt-1.5 flex-shrink-0" aria-hidden="true">•</span>
                          <div className="space-y-1 flex-1">
                            <p className="text-sm text-foreground/85 leading-relaxed">{ccDisplay(p)}</p>
                            <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
                              {p.subcategory && (
                                <span className="px-1.5 py-0.5 border border-border/40 rounded-[2px]">
                                  {p.subcategory.replace(/_/g, " ")}
                                </span>
                              )}
                              {p.source_book && (
                                <span>{t("compass.cc.source_label")} · {p.source_book}</span>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Communication Presence — Mehrabian cultural calibration */}
      {detail.mehrabian_weight && (
        <section aria-labelledby="communication-presence-heading" className="space-y-5 pt-2">
          <h2 id="communication-presence-heading" className="font-serif text-2xl border-b border-border pb-2">
            {t("compass.communication_presence")}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("compass.communication_presence_note")}
          </p>
          <div className="space-y-4">
            {[
              { label: t("compass.presence_nonverbal"), value: detail.mehrabian_weight.nonverbal },
              { label: t("compass.presence_tone"), value: detail.mehrabian_weight.tone },
              { label: t("compass.presence_words"), value: detail.mehrabian_weight.words },
            ].map(({ label, value }) => (
              <div key={label} className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-medium text-foreground/80">{label}</span>
                  <span className="text-sm font-mono text-primary tabular-nums">{value}%</span>
                </div>
                <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden" role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
                  <div
                    className="h-full bg-primary/70 rounded-full transition-all duration-500"
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Full dos and don'ts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
        <div className="space-y-4">
          <h3 className="font-serif text-xl text-green-700 dark:text-green-500 border-b border-border pb-2">
            {t("compass.dos")}
          </h3>
          <ul className="space-y-3" aria-label={t("compass.dos")}>
            {detail.dos.map((item, i) => (
              <li key={i} className="flex gap-3 text-muted-foreground items-start">
                <span className="text-green-600 mt-1 flex-shrink-0" aria-hidden="true">•</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="font-serif text-xl text-red-700 dark:text-red-500 border-b border-border pb-2">
            {t("compass.donts")}
          </h3>
          <ul className="space-y-3" aria-label={t("compass.donts")}>
            {detail.donts.map((item, i) => (
              <li key={i} className="flex gap-3 text-muted-foreground items-start">
                <span className="text-red-600 mt-1 flex-shrink-0" aria-hidden="true">×</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* The Local — curated venues */}
      <TheLocalSection regionCode={regionCode} />
    </div>
  );
}
