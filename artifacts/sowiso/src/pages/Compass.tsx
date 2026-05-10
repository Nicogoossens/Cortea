import {
  useGetCultureCompass,
  getGetCultureCompassQueryKey,
  useGetProfile,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Compass as CompassIcon, Globe, Lock, LayoutGrid, List, Clock, Search, X } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { CULTURE_CLUSTERS, getClusterBrief } from "@/lib/clusters";
import { COMPASS_REGIONS, FlagEmoji, useActiveRegion } from "@/lib/active-region";
import { LockOverlay } from "@/components/LockOverlay";
import { useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { ActiveContextChips } from "@/components/ActiveContextChips";
import { hasFullAccess as tierHasFullAccess, isCompassRegionLocked as calcRegionLocked, type SubscriptionTier } from "@/lib/tier-access";

const GUEST_UNLOCKED_REGIONS = ["GB"];

export default function Compass() {
  const { t, locale } = useLocale();
  const compassJsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "Cortéa — The Cultural Compass",
    "url": "https://cortea.app/compass",
    "description": "Cultural protocols, unwritten rules, and customs for every country worldwide.",
    "teaches": "International cultural etiquette",
  };
  const { isAuthenticated } = useAuth();
  const { data: profile } = useGetProfile();
  const { activeRegion } = useActiveRegion();
  const [view, setView] = useState<"clusters" | "regions">(() => {
    try { return (localStorage.getItem("compass_view") as "clusters" | "regions") || "clusters"; } catch { return "clusters"; }
  });
  const [searchQuery, setSearchQuery] = useState("");

  const tier = (profile?.subscription_tier ?? "guest") as SubscriptionTier;
  const isVisitor = !isAuthenticated;
  const allUnlocked = tierHasFullAccess(tier);

  const spheres = profile?.situational_interests ?? [];
  const spheresParam = spheres.join(",") || undefined;

  const { data: regions, isLoading } = useGetCultureCompass(
    { locale, ...(spheresParam ? { situational_interests: spheresParam } : {}) },
    { query: { queryKey: [...getGetCultureCompassQueryKey(), locale, spheresParam ?? ""] } }
  );

  const normalize = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const trimmedQuery = searchQuery.trim();
  const filteredRegions = (() => {
    if (!regions) return regions;
    const q = normalize(trimmedQuery);
    if (!q) return regions;
    return regions.filter((r) => {
      if (normalize(r.region_code).includes(q)) return true;
      if (normalize(r.region_name ?? "").includes(q)) return true;
      const localName = COMPASS_REGIONS.find((cr) => cr.code === r.region_code)?.names;
      if (localName) {
        for (const v of Object.values(localName)) {
          if (typeof v === "string" && normalize(v).includes(q)) return true;
        }
      }
      return false;
    });
  })();

  const activeClusterId = CULTURE_CLUSTERS.find((c) =>
    (c.members as string[]).includes(activeRegion)
  )?.id;

  /** Active cluster always floats to position 0; all others keep their original order. */
  const sortedClusters = activeClusterId
    ? [
        ...CULTURE_CLUSTERS.filter((c) => c.id === activeClusterId),
        ...CULTURE_CLUSTERS.filter((c) => c.id !== activeClusterId),
      ]
    : CULTURE_CLUSTERS;

  function getCountryName(code: string): string {
    const region = COMPASS_REGIONS.find((r) => r.code === code);
    return region?.names[locale as keyof typeof region.names] ?? region?.names.en ?? code;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SEOHead
        title={t("seo.compass.title", "The Cultural Compass")}
        description={t("seo.compass.description")}
        locale={locale}
        path="/compass"
        jsonLd={compassJsonLd}
      />
      <div className="space-y-4 max-w-3xl">
        <div className="flex items-center gap-3 text-primary mb-2">
          <CompassIcon className="w-8 h-8" aria-hidden="true" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif text-foreground">{t("compass.title")}</h1>
        <p className="text-muted-foreground text-lg font-light leading-relaxed">
          {t("compass.subtitle")}
        </p>
        {isVisitor && (
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground border-l-2 border-muted pl-3">
            {t("compass.guest_hint")}{" "}
            <Link href="/register">
              <span className="text-primary cursor-pointer hover:underline underline-offset-2">{t("compass.guest_cta")}</span>
            </Link>
          </p>
        )}
        {!isVisitor && !allUnlocked && (
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground border-l-2 border-muted pl-3">
            {t("compass.registered_hint")}{" "}
            <Link href="/membership">
              <span className="text-primary cursor-pointer hover:underline underline-offset-2">{t("compass.registered_cta")}</span>
            </Link>
          </p>
        )}
        {!isVisitor && (
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground border-l-2 border-primary/40 pl-3">
            {t("home.votes_title")}{" "}
            <Link href="/votes">
              <span className="text-primary cursor-pointer hover:underline underline-offset-2">{t("home.votes_eyebrow")} →</span>
            </Link>
          </p>
        )}
      </div>

      {/* Active context chips */}
      <ActiveContextChips />

      {/* View Toggle */}
      <div className="inline-flex rounded-sm border border-border bg-muted/40 p-1 gap-1" role="group" aria-label="View mode">
        <button
          onClick={() => { setView("clusters"); try { localStorage.setItem("compass_view", "clusters"); } catch {} }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[3px] transition-all ${
            view === "clusters"
              ? "bg-background text-foreground shadow-sm border border-border/60"
              : "text-muted-foreground hover:text-foreground hover:bg-background/60"
          }`}
          aria-pressed={view === "clusters"}
        >
          <LayoutGrid className="w-4 h-4" aria-hidden="true" />
          {t("compass.view_clusters")}
        </button>
        <button
          onClick={() => { setView("regions"); try { localStorage.setItem("compass_view", "regions"); } catch {} }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[3px] transition-all ${
            view === "regions"
              ? "bg-background text-foreground shadow-sm border border-border/60"
              : "text-muted-foreground hover:text-foreground hover:bg-background/60"
          }`}
          aria-pressed={view === "regions"}
        >
          <List className="w-4 h-4" aria-hidden="true" />
          {t("compass.view_regions")}
        </button>
      </div>

      {/* ── CLUSTERS VIEW ── */}
      {view === "clusters" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {sortedClusters.map((cluster) => {
            const isActive = cluster.id === activeClusterId;
            const { dos, donts } = getClusterBrief(cluster, locale);
            return (
              <Link key={cluster.id} href={`/compass/cluster/${cluster.id}`} aria-label={t(cluster.nameKey as Parameters<typeof t>[0])}>
                <Card className={`h-full border-bg-card transition-all duration-300 hover:shadow-md cursor-pointer overflow-hidden group relative ${
                  isActive
                    ? "border-primary/60 ring-2 ring-primary/30 bg-primary/[0.03]"
                    : "border-border hover:border-primary/40"
                }`}>
                  {isActive && (
                    <div className="absolute top-3 right-3 z-10">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground px-3 py-1 rounded-full shadow-md ring-2 ring-primary/20">
                        <FlagEmoji code={activeRegion} size="sm" />
                        {t("compass.your_region")}
                      </span>
                    </div>
                  )}
                  <div className={`h-1.5 w-full transition-colors ${isActive ? "bg-primary/40" : "bg-primary/15 group-hover:bg-primary/30"}`} aria-hidden="true" />
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap gap-2 mb-2 items-center">
                      {cluster.members.map((code) => (
                        <span key={code} className="flex items-center gap-1">
                          <FlagEmoji code={code} size="lg" />
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground/60 mb-1 leading-relaxed">
                      {cluster.members.map((code) => getCountryName(code)).join(" · ")}
                    </p>
                    <CardTitle className="font-serif text-xl group-hover:text-primary transition-colors">
                      {t(cluster.nameKey as Parameters<typeof t>[0])}
                    </CardTitle>
                    <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mt-1 leading-relaxed">
                      {t(cluster.philosophyKey as Parameters<typeof t>[0])}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                      <div className="space-y-1">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-green-700/70 dark:text-green-500/70 mb-0.5">{t("compass.dos")}</p>
                        {dos.slice(0, 5).map((item, i) => (
                          <div key={i} className="flex gap-1.5 items-start text-[11px] text-foreground/65">
                            <span className="text-green-600 font-bold flex-shrink-0 leading-none mt-0.5">+</span>
                            <span className="leading-tight line-clamp-2">{item}</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-red-700/70 dark:text-red-500/70 mb-0.5">{t("compass.donts")}</p>
                        {donts.slice(0, 5).map((item, i) => (
                          <div key={i} className="flex gap-1.5 items-start text-[11px] text-foreground/65">
                            <span className="text-red-600 font-bold flex-shrink-0 leading-none mt-0.5">×</span>
                            <span className="leading-tight line-clamp-2">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border/30 flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground/60">
                        {cluster.members.length} {t("compass.countries")}
                      </span>
                      <span className="text-xs font-mono uppercase tracking-widest text-primary/70 group-hover:text-primary transition-colors">
                        {t("compass.explore")} →
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── ALL REGIONS VIEW ── */}
      {view === "regions" && (
        <>
          {/* Teaser explaining the country cards */}
          <div className="border-l-2 border-primary/40 bg-primary/[0.03] pl-4 py-3 pr-4 rounded-r-sm">
            <p className="text-[10px] font-mono uppercase tracking-widest text-primary/70 mb-1">
              {t("compass.regions_teaser_eyebrow")}
            </p>
            <p className="text-sm text-foreground/80 font-light leading-relaxed">
              {t("compass.regions_teaser_body")}
            </p>
          </div>

          {/* Search input */}
          <div className="relative max-w-md pt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("compass.search_placeholder", "Search countries…")}
              aria-label={t("compass.search_aria", "Search countries")}
              className="w-full h-10 pl-10 pr-10 text-sm bg-card border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 placeholder:text-muted-foreground/50"
              data-testid="input-compass-search"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground/60 hover:text-foreground transition-colors"
                aria-label={t("compass.search_clear", "Clear search")}
                data-testid="button-compass-search-clear"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {trimmedQuery && filteredRegions && (
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground -mt-4">
              {filteredRegions.length} {t("compass.countries")}
            </p>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" aria-label={t("common.loading")} aria-live="polite">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 rounded-sm" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {filteredRegions?.map((region) => {
                const isLocked = calcRegionLocked(tier, isAuthenticated, GUEST_UNLOCKED_REGIONS, region.region_code);
                const isUserRegion = region.region_code === activeRegion;

                if (isLocked) {
                  const lockHref = isAuthenticated ? "/membership" : "/register";
                  return (
                    <Link key={region.region_code} href={lockHref} aria-label={`Unlock ${region.region_name}`}>
                      <Card className="h-full border-border bg-card/60 overflow-hidden group cursor-pointer hover:border-primary/20 transition-all duration-300 relative">
                        <div className="h-2 w-full bg-muted" aria-hidden="true" />
                        <CardHeader>
                          <div className="flex justify-between items-center mb-2">
                            <FlagEmoji code={region.region_code} size="lg" className="opacity-30" ariaLabel={region.region_name} />
                            <div className="flex items-center gap-1.5 text-xs font-mono tracking-widest uppercase text-muted-foreground/50">
                              <Lock className="h-3 w-3" aria-hidden="true" />
                              <span>The Traveller</span>
                            </div>
                          </div>
                          <CardTitle className="font-serif text-2xl text-muted-foreground/50">{region.region_name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 opacity-30">
                          <div>
                            <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-1 font-semibold">{t("compass.core_value")}</h4>
                            <p className="text-sm font-medium text-foreground blur-[4px]">{region.core_value}</p>
                          </div>
                          <div className="pt-3 border-t border-border/50">
                            <h4 className="text-xs uppercase tracking-widest text-destructive/80 mb-1 font-semibold">{t("compass.taboo")}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2 blur-[4px]">{region.biggest_taboo}</p>
                          </div>
                        </CardContent>
                        <LockOverlay
                          requiredTier="traveller"
                          teaser={t("compass.lock.teaser")}
                          isAuthenticated={isAuthenticated}
                        />
                      </Card>
                    </Link>
                  );
                }

                if (!region.has_content) {
                  return (
                    <Card key={region.region_code} className="h-full border-border/50 border-dashed bg-card/40 overflow-hidden" aria-label={`${region.region_name} — coming soon`}>
                      <div className="h-2 w-full bg-muted/40" aria-hidden="true" />
                      <CardHeader>
                        <div className="flex justify-between items-center mb-2">
                          <FlagEmoji code={region.region_code} size="lg" className="opacity-40" ariaLabel={region.region_name} />
                          <div className="flex items-center gap-1.5 text-xs font-mono tracking-widest uppercase text-muted-foreground/50">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            <span>{t("compass.coming_soon")}</span>
                          </div>
                        </div>
                        <CardTitle className="font-serif text-2xl text-muted-foreground/40">{region.region_name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground/40 font-light italic">
                          {t("compass.coming_soon_desc")}
                        </p>
                      </CardContent>
                    </Card>
                  );
                }

                const hasSphereHighlight = (region.sphere_highlights?.length ?? 0) > 0;

                return (
                  <Link key={region.region_code} href={`/compass/${region.region_code}`} aria-label={`${t("compass.explore")} ${region.region_name}`}>
                    <Card className={`h-full border-border bg-card transition-all duration-300 hover:shadow-md cursor-pointer overflow-hidden group ${
                      isUserRegion ? "border-primary/50 ring-1 ring-primary/20" : "hover:border-primary/40"
                    }`}>
                      <div className={`h-2 w-full transition-colors ${isUserRegion ? "bg-primary/30" : "bg-muted group-hover:bg-primary/20"}`} aria-hidden="true" />
                      <CardHeader>
                        <div className="flex justify-between items-center mb-2">
                          <FlagEmoji code={region.region_code} size="lg" ariaLabel={region.region_name} />
                          <div className="flex items-center gap-2">
                            {isUserRegion && (
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground px-3 py-1 rounded-full shadow-md ring-2 ring-primary/20">
                                <FlagEmoji code={region.region_code} size="sm" />
                                {t("compass.your_region")}
                              </span>
                            )}
                            {!isUserRegion && hasSphereHighlight && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium tracking-wide text-muted-foreground/80 bg-muted/60 border border-border/60 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/50 flex-shrink-0" aria-hidden="true" />
                                {t("compass.sphere_match")}
                              </span>
                            )}
                            <span className="text-xs font-mono tracking-widest uppercase text-muted-foreground">{region.region_code}</span>
                          </div>
                        </div>
                        <CardTitle className="font-serif text-2xl group-hover:text-primary transition-colors">{region.region_name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-1 font-semibold">{t("compass.core_value")}</h4>
                          <p className="text-sm font-medium text-foreground">{region.core_value}</p>
                        </div>
                        <div className="pt-3 border-t border-border/50">
                          <h4 className="text-xs uppercase tracking-widest text-destructive/80 mb-1 font-semibold">{t("compass.taboo")}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">{region.biggest_taboo}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
              {(!filteredRegions || filteredRegions.length === 0) && (
                <div className="col-span-full py-16 text-center text-muted-foreground border border-dashed border-border rounded-sm bg-muted/5">
                  <Globe className="w-12 h-12 mx-auto mb-4 opacity-20" aria-hidden="true" />
                  {trimmedQuery ? (
                    <>
                      <p className="font-serif text-xl">{t("compass.search_no_results", "No countries match your search.")}</p>
                      <p className="text-sm mt-2">"{trimmedQuery}"</p>
                    </>
                  ) : (
                    <>
                      <p className="font-serif text-xl">The cartographers are expanding the compass.</p>
                      <p className="text-sm mt-2">New regions will be available shortly.</p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
