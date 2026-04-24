import {
  useGetCultureCompass,
  getGetCultureCompassQueryKey,
  useGetProfile,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Compass as CompassIcon, Globe, Lock, LayoutGrid, List, Clock } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { CULTURE_CLUSTERS, getClusterBrief } from "@/lib/clusters";
import { COMPASS_REGIONS, FlagEmoji, useActiveRegion } from "@/lib/active-region";
import { LockOverlay } from "@/components/LockOverlay";
import { useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ActiveContextChips } from "@/components/ActiveContextChips";

const GUEST_UNLOCKED_REGIONS = ["GB"];

export default function Compass() {
  usePageTitle("The Cultural Compass");
  const { t, locale } = useLocale();
  const { isAuthenticated } = useAuth();
  const { data: profile } = useGetProfile();
  const { activeRegion } = useActiveRegion();
  const [view, setView] = useState<"clusters" | "regions">("clusters");

  const tier = profile?.subscription_tier ?? "guest";
  const isVisitor = !isAuthenticated;
  const allUnlocked = tier === "traveller" || tier === "ambassador";

  const { data: regions, isLoading } = useGetCultureCompass(
    { locale },
    { query: { queryKey: [...getGetCultureCompassQueryKey(), locale] } }
  );

  const activeClusterId = CULTURE_CLUSTERS.find((c) =>
    (c.members as string[]).includes(activeRegion)
  )?.id;

  function getCountryName(code: string): string {
    const region = COMPASS_REGIONS.find((r) => r.code === code);
    return region?.names[locale as keyof typeof region.names] ?? region?.names.en ?? code;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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
      </div>

      {/* Active context chips */}
      <ActiveContextChips />

      {/* View Toggle */}
      <div className="flex gap-2 border-b border-border pb-0">
        <button
          onClick={() => setView("clusters")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            view === "clusters"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          aria-pressed={view === "clusters"}
        >
          <LayoutGrid className="w-4 h-4" aria-hidden="true" />
          {t("compass.view_clusters")}
        </button>
        <button
          onClick={() => setView("regions")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            view === "regions"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          aria-pressed={view === "regions"}>
          <List className="w-4 h-4" aria-hidden="true" />
          {t("compass.view_regions")}
        </button>
      </div>

      {/* ── CLUSTERS VIEW ── */}
      {view === "clusters" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {CULTURE_CLUSTERS.map((cluster) => {
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
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        {t("compass.your_region")}
                      </span>
                    </div>
                  )}
                  <div className={`h-1.5 w-full transition-colors ${isActive ? "bg-primary/40" : "bg-primary/15 group-hover:bg-primary/30"}`} aria-hidden="true" />
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap gap-2 mb-2 items-center">
                      {cluster.members.map((code) => (
                        <span key={code} className="flex items-center gap-1">
                          <FlagEmoji code={code} className="text-2xl leading-none" />
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
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" aria-label={t("common.loading")} aria-live="polite">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 rounded-sm" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {regions?.map((region) => {
                const isLocked = !allUnlocked && isVisitor && !GUEST_UNLOCKED_REGIONS.includes(region.region_code);
                const isUserRegion = region.region_code === activeRegion;

                if (isLocked) {
                  const lockHref = isAuthenticated ? "/membership" : "/register";
                  return (
                    <Link key={region.region_code} href={lockHref} aria-label={`Unlock ${region.region_name}`}>
                      <Card className="h-full border-border bg-card/60 overflow-hidden group cursor-pointer hover:border-primary/20 transition-all duration-300 relative">
                        <div className="h-2 w-full bg-muted" aria-hidden="true" />
                        <CardHeader>
                          <div className="flex justify-between items-center mb-2">
                            <FlagEmoji code={region.region_code} className="text-3xl sm:text-4xl leading-none opacity-30" ariaLabel={region.region_name} />
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
                          <FlagEmoji code={region.region_code} className="text-3xl sm:text-4xl leading-none opacity-40" ariaLabel={region.region_name} />
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

                return (
                  <Link key={region.region_code} href={`/compass/${region.region_code}`} aria-label={`${t("compass.explore")} ${region.region_name}`}>
                    <Card className={`h-full border-border bg-card transition-all duration-300 hover:shadow-md cursor-pointer overflow-hidden group ${
                      isUserRegion ? "border-primary/50 ring-1 ring-primary/20" : "hover:border-primary/40"
                    }`}>
                      <div className={`h-2 w-full transition-colors ${isUserRegion ? "bg-primary/30" : "bg-muted group-hover:bg-primary/20"}`} aria-hidden="true" />
                      <CardHeader>
                        <div className="flex justify-between items-center mb-2">
                          <FlagEmoji code={region.region_code} className="text-3xl sm:text-4xl leading-none" ariaLabel={region.region_name} />
                          <div className="flex items-center gap-2">
                            {isUserRegion && (
                              <span className="text-[9px] font-bold uppercase tracking-widest bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                {t("compass.your_region")}
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
              {(!regions || regions.length === 0) && (
                <div className="col-span-full py-16 text-center text-muted-foreground border border-dashed border-border rounded-sm bg-muted/5">
                  <Globe className="w-12 h-12 mx-auto mb-4 opacity-20" aria-hidden="true" />
                  <p className="font-serif text-xl">The cartographers are expanding the compass.</p>
                  <p className="text-sm mt-2">New regions will be available shortly.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
