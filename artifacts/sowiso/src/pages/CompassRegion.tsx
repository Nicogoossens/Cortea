import {
  useGetCultureCompassRegion,
  getGetCultureCompassRegionQueryKey,
  useGetCultureProtocols,
  getGetCultureProtocolsQueryKey,
  useGetCulturalOrigins,
  getGetCulturalOriginsQueryKey,
  useGetProfile,
  type CultureProtocol,
} from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertTriangle, CheckCircle2, Utensils, MessageSquare, Gift, Shirt, Zap, MapPin, ShoppingBag, Dumbbell, Hotel, Car, LifeBuoy, BookOpen, ChevronDown, ChevronUp, Search, X, Landmark, Users, Crown, ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { LockOverlay } from "@/components/LockOverlay";
import { FlagEmoji, COMPASS_REGIONS } from "@/lib/active-region";
import { SEOHead } from "@/components/SEOHead";
import { useState, useEffect } from "react";
import { VenueCard, type Venue, type VenueCategory, type OccasionTag } from "@/components/VenueCard";
import { isCompassRegionDetailLocked } from "@/lib/tier-access";
import { useSavedVenues } from "@/lib/saved-venues";

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

const DOMAIN_ORDER = ["dining", "business", "greetings", "gift-giving", "dress"];

type VenueCategoryTab = {
  id: VenueCategory;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
};

const CATEGORY_TABS: VenueCategoryTab[] = [
  { id: "shops", labelKey: "compass.local.tab_shops", icon: ShoppingBag },
  { id: "dining", labelKey: "compass.local.tab_dining", icon: Utensils },
  { id: "activities", labelKey: "compass.local.tab_activities", icon: Dumbbell },
  { id: "accommodations", labelKey: "compass.local.tab_accommodations", icon: Hotel },
  { id: "transport", labelKey: "compass.local.tab_transport", icon: Car },
];

const OCCASION_LABEL_KEYS: Record<OccasionTag, string> = {
  business: "compass.local.occasion_business",
  romantic: "compass.local.occasion_romantic",
  family: "compass.local.occasion_family",
  social: "compass.local.occasion_social",
};

function TheLocalSection({ regionCode }: { regionCode: string }) {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<VenueCategory>("shops");
  const [occasionFilter, setOccasionFilter] = useState<OccasionTag | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useLocale();
  const { savedIds, pendingId, toggleSave } = useSavedVenues(isAuthenticated);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [regionCode]);

  useEffect(() => {
    setLoading(true);
    setSearchQuery("");
    fetch(`${API_BASE}/api/venues?region=${encodeURIComponent(regionCode)}`)
      .then((r) => r.ok ? r.json() : { venues: [] })
      .then((data: { venues: Venue[] }) => {
        setVenues(data.venues ?? []);
      })
      .catch(() => setVenues([]))
      .finally(() => setLoading(false));
  }, [regionCode]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matchesQuery = (v: Venue): boolean => {
    if (!normalizedQuery) return true;
    return (
      v.name.toLowerCase().includes(normalizedQuery) ||
      v.description.toLowerCase().includes(normalizedQuery) ||
      v.subcategory.toLowerCase().includes(normalizedQuery)
    );
  };

  const searchedVenues = venues.filter(matchesQuery);
  const tabVenues = searchedVenues.filter((v) => v.category === activeTab);
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
            {t("compass.local.heading")}
          </h2>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/60 mt-0.5">
            {t("compass.local.subtitle")}
          </p>
        </div>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" aria-hidden="true" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("compass.local.search_placeholder")}
          aria-label={t("compass.local.search_aria")}
          className="w-full pl-9 pr-9 py-2.5 rounded-sm border border-border/50 bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            aria-label={t("compass.local.search_clear")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Category tabs */}
      <div
        className="flex overflow-x-auto scrollbar-hide gap-0 rounded-sm border border-border/50 divide-x divide-border/50 bg-muted/10"
        role="tablist"
        aria-label={t("compass.local.categories_aria")}
      >
        {CATEGORY_TABS.map(({ id, labelKey, icon: Icon }) => {
          const isActive = activeTab === id;
          const count = searchedVenues.filter((v) => v.category === id).length;
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
              className={`flex-1 min-w-[72px] sm:min-w-[90px] flex flex-col items-center gap-1 px-2 sm:px-3 py-3 text-[10px] sm:text-xs font-mono uppercase tracking-widest transition-all whitespace-nowrap ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-primary-foreground" : "text-muted-foreground/70"}`} aria-hidden="true" />
              <span>{t(labelKey)}</span>
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
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("compass.local.occasion_filter_aria")}>
          <button
            type="button"
            onClick={() => setOccasionFilter(null)}
            className={`px-3 py-1.5 rounded-sm text-xs font-mono uppercase tracking-widest border transition-all ${
              occasionFilter === null
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {t("compass.local.all")}
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
              {t(OCCASION_LABEL_KEYS[tag])}
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
            <p>{normalizedQuery ? t("compass.local.empty_search") : t("compass.local.empty")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVenues.map((venue) => (
              <VenueCard
                key={venue.id}
                venue={venue}
                isSaved={savedIds.has(venue.id)}
                saving={pendingId === venue.id}
                onToggleSave={isAuthenticated ? toggleSave : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function domainLabel(domain: string, t: (k: string) => string): string {
  const key = `compass.origins_domain_${domain}`;
  const translated = t(key);
  return translated !== key ? translated : domain.charAt(0).toUpperCase() + domain.slice(1);
}

function OriginsSection({ regionCode, t }: { regionCode: string; t: (k: string, v?: Record<string, string | number> | string) => string }) {
  const [open, setOpen] = useState(false);

  const { data: origins, isLoading } = useGetCulturalOrigins(
    { region_code: regionCode },
    {
      query: {
        enabled: !!regionCode,
        queryKey: getGetCulturalOriginsQueryKey({ region_code: regionCode }),
      },
    }
  );

  const grouped: Record<string, typeof origins> = {};
  if (origins) {
    for (const o of origins) {
      if (!grouped[o.domain]) grouped[o.domain] = [];
      grouped[o.domain]!.push(o);
    }
  }

  const sortedDomains = DOMAIN_ORDER.filter((d) => grouped[d]).concat(
    Object.keys(grouped).filter((d) => !DOMAIN_ORDER.includes(d))
  );

  return (
    <section aria-labelledby="origins-heading" className="space-y-4 pt-4 border-t border-border/40">
      <button
        id="origins-heading"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 group py-2"
        aria-expanded={open}
        aria-controls="origins-panel"
      >
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-primary flex-shrink-0" aria-hidden="true" />
          <div className="text-left">
            <h2 className="font-serif text-2xl text-foreground group-hover:text-primary transition-colors">
              {t("compass.origins_title")}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">{t("compass.origins_subtitle")}</p>
          </div>
        </div>
        {open
          ? <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
          : <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
        }
      </button>

      {open && (
        <div id="origins-panel" className="space-y-8 animate-in fade-in duration-300">
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          )}

          {!isLoading && origins && origins.length === 0 && (
            <p className="text-sm text-muted-foreground italic py-4">{t("compass.origins_empty")}</p>
          )}

          {!isLoading && sortedDomains.map((domain) => (
            <div key={domain} className="space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-primary/70 border-b border-border pb-2">
                {domainLabel(domain, t)}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {grouped[domain]!.map((origin) => (
                  <Card key={origin.id} className="border-border/60 shadow-sm bg-card hover:border-primary/30 transition-colors">
                    <CardHeader className="pb-3 border-b border-border/20 bg-muted/5">
                      <CardTitle className="text-base font-serif leading-snug">{origin.tradition}</CardTitle>
                      <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground mt-1">
                        <span className="text-primary/60 uppercase tracking-widest">{t("compass.origins_era")}:</span>
                        {origin.era}
                      </span>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">{origin.origin_summary}</p>

                      {origin.influences && origin.influences.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground/70">
                            {t("compass.origins_influences")}
                          </span>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {origin.influences.map((inf) => (
                              <span key={inf} className="px-2 py-0.5 text-xs rounded-sm bg-primary/8 text-primary/80 border border-primary/15 font-light">
                                {inf}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-2 border-t border-border/30 space-y-1">
                        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground/70">
                          {t("compass.origins_connected_rule")}
                        </span>
                        <p className="text-sm font-serif italic text-foreground/80 leading-relaxed">
                          "{origin.connected_rule}"
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function CompassRegion() {
  const { code } = useParams<{ code: string }>();
  const { t, locale } = useLocale();
  const { isAuthenticated } = useAuth();
  const { data: profile } = useGetProfile();
  const regionCode = code || "";

  useEffect(() => {
    if (!isAuthenticated || !regionCode) return;
    fetch(`${API_BASE}/api/compass/${regionCode}/visited`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
  }, [isAuthenticated, regionCode]);

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

  if (isCompassRegionDetailLocked(isAuthenticated, GUEST_UNLOCKED_REGIONS, regionCode)) {
    const staticRegion = COMPASS_REGIONS.find((r) => r.code === regionCode);
    const displayName = detail?.region_name ?? staticRegion?.names.en ?? regionCode;
    const displayCode = detail?.region_code ?? regionCode;
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-16">
        <Link href="/compass" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
          {t("compass.back")}
        </Link>
        <div className="flex items-center gap-4 md:gap-6">
          <FlagEmoji code={displayCode} size="lg" className="drop-shadow-sm flex-shrink-0" ariaLabel={displayName} />
          <div>
            <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-2">{displayName}</h1>
            <p className="text-sm font-mono tracking-widest uppercase text-muted-foreground">{displayCode}</p>
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

  const quickDos = detail.dos.slice(0, 5);
  const quickDonts = detail.donts.slice(0, 5);

  const regionJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Place",
      "name": detail.region_name,
      "description": t("seo.compass_region.description_template", "Cultural etiquette guide for {country}").replace("{country}", detail.region_name),
      "url": `https://cortea.app/compass/${detail.region_code}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": `${detail.region_name} Etiquette Guide`,
      "description": `Key cultural etiquette topics for ${detail.region_name}`,
      "url": `https://cortea.app/compass/${detail.region_code}`,
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Core Cultural Values" },
        { "@type": "ListItem", "position": 2, "name": "Social Taboos" },
        { "@type": "ListItem", "position": 3, "name": "Dining Etiquette" },
        { "@type": "ListItem", "position": 4, "name": "Language & Communication" },
        { "@type": "ListItem", "position": 5, "name": "Gift-Giving Protocol" },
        { "@type": "ListItem", "position": 6, "name": "Dress Code" },
        { "@type": "ListItem", "position": 7, "name": "Dos & Don'ts" },
      ],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500 pb-16">
      <SEOHead
        title={detail.region_name}
        description={t("seo.compass_region.description_template", "Cultural etiquette guide for {country}").replace("{country}", detail.region_name)}
        locale={locale}
        path={`/compass/${detail.region_code}`}
        jsonLd={regionJsonLd}
      />
      <Link href="/compass" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
        {t("compass.back")}
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/60">
        <div className="flex items-center gap-4 md:gap-6">
          <FlagEmoji code={detail.region_code} size="lg" className="drop-shadow-sm flex-shrink-0" ariaLabel={detail.region_name} />
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

      {/* Oorsprong & Kroniek — Historical origins */}
      <OriginsSection regionCode={regionCode} t={t} />

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

      {/* Region History — currently only Belgium has authored content. */}
      {regionCode === "BE" && <BelgianHistorySection t={t} />}
    </div>
  );
}

/**
 * BelgianHistorySection
 * --------------------
 * Curated, foreigner-oriented historical context for Belgium.
 * Content is intentionally hard-coded in English (English is the working
 * default of the platform per product decision) so it does not depend on the
 * translation pipeline. UI chrome (titles / CTAs) IS translated so it slots
 * cleanly into the rest of the page.
 *
 * Three blocks:
 *  1. A general "A Brief History of Belgium" — read-only narrative.
 *  2. "Everyday Heritage & Folk Culture" — links to The Atelier in the
 *     middle_class register.
 *  3. "Statecraft, Court & Diplomacy" — links to The Atelier in the elite
 *     register (subscription-gated; the link still navigates so the user sees
 *     what's behind the paywall).
 */
function BelgianHistorySection({
  t,
}: {
  t: (k: string, v?: Record<string, string | number> | string) => string;
}) {
  return (
    <section className="pt-12 space-y-6" aria-labelledby="region-history-heading">
      <header className="space-y-1">
        <h2
          id="region-history-heading"
          className="font-serif text-2xl text-foreground flex items-center gap-2"
        >
          <Landmark className="w-5 h-5 text-primary" aria-hidden="true" />
          {t("compass.history.heading")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("compass.history.subtitle")}
        </p>
      </header>

      {/* 1. Brief overview — neutral narrative */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" aria-hidden="true" />
            {t("compass.history.brief.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Belgium is a young country built on very old land. The territory
            sat for centuries at the crossroads of Latin and Germanic Europe,
            governed in turn by the Dukes of Burgundy, the Spanish and Austrian
            Habsburgs, revolutionary France and, briefly, the Kingdom of the
            Netherlands. Independence was declared in 1830 after a Brussels
            uprising and recognised by the Great Powers in 1839 on the
            condition of perpetual neutrality — a clause Germany violated in
            1914.
          </p>
          <p>
            The country's prosperity was forged in the 19th century: Belgium
            was the first nation on the European mainland to industrialise,
            with coal and steel from Wallonia and textiles from Ghent. That
            wealth, and the controversial colonial enterprise in the Congo
            (1885–1960, personal property of King Leopold II until 1908), still
            shape contemporary debates about heritage, monuments and
            restitution.
          </p>
          <p>
            Two world wars left deep marks — Ypres, the Ardennes, Bastogne —
            and pushed Belgium to become a founding architect of European
            cooperation. Brussels hosts the European Commission, the Council
            and NATO; the country is officially trilingual (Dutch, French,
            German) and federalised since 1993 into Regions and Communities.
            Visitors quickly notice that "Belgian" identity is layered:
            Flemish, Walloon, Brusseler and Belgian all coexist, and switching
            language at the right moment is itself an act of etiquette.
          </p>
        </CardContent>
      </Card>

      {/* 2. Everyday heritage → middle_class register */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" aria-hidden="true" />
            {t("compass.history.everyday.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Day-to-day Belgian culture is shaped by the guild towns of Flanders
            and the mining valleys of Wallonia. The famous love of beer, fries,
            chocolate and chips-with-mussels is not folklore tourism: it
            descends directly from monastic brewing traditions, the Trappist
            abbeys, and the working-class kitchens of Liège and Charleroi.
            Cycling, brass bands, neighbourhood ducasses, carnival in Binche
            and Aalst, and the Ommegang in Brussels are still living rituals,
            not museum pieces.
          </p>
          <p>
            Civic life runs on a quiet code: understated dress, first-name
            informality only after invitation, three kisses on the cheek among
            friends in most regions (one in parts of West Flanders), and a
            strong preference for compromise over confrontation — the national
            sport of "Belgian compromise" was perfected in centuries of
            negotiating between languages, faiths and trades.
          </p>
          <p className="pt-1">
            <Link
              href="/atelier?register=middle_class"
              className="inline-flex items-center gap-1.5 text-primary hover:underline underline-offset-4 font-medium"
            >
              {t("compass.history.everyday.cta")}
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </p>
        </CardContent>
      </Card>

      {/* 3. Elite history → elite register (subscription-gated downstream) */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            {t("compass.history.elite.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Above the everyday register sits a second, older Belgium: that of
            the court, the diplomatic corps and the great houses. The Belgian
            monarchy (Saxe-Coburg-Gotha, since 1831) is constitutional but
            ceremonially active — royal audiences, the Te Deum on the National
            Day, and the king's New Year addresses to the diplomatic corps and
            the constituted bodies remain set-piece occasions with their own
            dress codes and forms of address.
          </p>
          <p>
            Brussels' role as the de-facto capital of Europe and the seat of
            NATO means that diplomatic protocol is a working language here.
            Knowing how to title a baron, how to seat a chef de mission, when
            to switch from French to English, and how to behave at a reception
            at the Palais d'Egmont or the Cercle de Lorraine is not snobbery —
            it is the operating system of a small country that has long
            punched above its weight by being unfailingly correct.
          </p>
          <p className="text-xs italic text-muted-foreground/80">
            {t("compass.history.elite.locked_hint")}
          </p>
          <p className="pt-1">
            <Link
              href="/atelier?register=elite"
              className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 hover:underline underline-offset-4 font-medium"
            >
              {t("compass.history.elite.cta")}
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
