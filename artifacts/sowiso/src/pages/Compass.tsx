import {
  useGetCultureCompass,
  getGetCultureCompassQueryKey,
  useGetProfile,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Compass as CompassIcon, Globe, Lock, LayoutGrid, List } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { CULTURE_CLUSTERS } from "@/lib/clusters";
import { COMPASS_REGIONS, FlagEmoji } from "@/lib/active-region";
import { useState } from "react";

const GUEST_UNLOCKED_REGIONS = ["GB"];

export default function Compass() {
  const { t, locale } = useLocale();
  const { data: profile } = useGetProfile();
  const [view, setView] = useState<"clusters" | "regions">("clusters");

  const tier = profile?.subscription_tier ?? "guest";
  const allUnlocked = tier === "traveller" || tier === "ambassador";

  const { data: regions, isLoading } = useGetCultureCompass(
    { locale },
    { query: { queryKey: [...getGetCultureCompassQueryKey(), locale] } }
  );

  const regionMap = new Map(regions?.map((r) => [r.region_code, r]) ?? []);

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
        {!allUnlocked && (
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground border-l-2 border-muted pl-3">
            {t("compass.guest_hint")}{" "}
            <Link href="/membership">
              <span className="text-primary cursor-pointer hover:underline underline-offset-2">{t("compass.guest_cta")}</span>
            </Link>
          </p>
        )}
      </div>

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
          {CULTURE_CLUSTERS.map((cluster) => (
            <Link key={cluster.id} href={`/compass/cluster/${cluster.id}`} aria-label={t(cluster.nameKey as Parameters<typeof t>[0])}>
              <Card className="h-full border-border bg-card transition-all duration-300 hover:shadow-md hover:border-primary/40 cursor-pointer overflow-hidden group">
                <div className="h-1.5 w-full bg-primary/15 group-hover:bg-primary/30 transition-colors" aria-hidden="true" />
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap gap-1 mb-3">
                    {cluster.members.map((code) => (
                      <span key={code} className="text-xl" aria-hidden="true">
                        <FlagEmoji code={code} />
                      </span>
                    ))}
                  </div>
                  <CardTitle className="font-serif text-xl group-hover:text-primary transition-colors">
                    {t(cluster.nameKey as Parameters<typeof t>[0])}
                  </CardTitle>
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mt-1 leading-relaxed">
                    {t(cluster.philosophyKey as Parameters<typeof t>[0])}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="space-y-1.5">
                    {cluster.dos.slice(0, 2).map((item, i) => (
                      <div key={i} className="flex gap-2 text-xs text-foreground/70">
                        <span className="text-green-600 font-bold flex-shrink-0">+</span>
                        <span className="leading-snug">{item}</span>
                      </div>
                    ))}
                    {cluster.donts.slice(0, 1).map((item, i) => (
                      <div key={i} className="flex gap-2 text-xs text-foreground/70">
                        <span className="text-red-600 font-bold flex-shrink-0">×</span>
                        <span className="leading-snug">{item}</span>
                      </div>
                    ))}
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
          ))}
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
                const isLocked = !allUnlocked && !GUEST_UNLOCKED_REGIONS.includes(region.region_code);

                if (isLocked) {
                  return (
                    <Link key={region.region_code} href="/membership" aria-label={`Unlock ${region.region_name}`}>
                      <Card className="h-full border-border bg-card/60 overflow-hidden group cursor-pointer hover:border-primary/20 transition-all duration-300 relative">
                        <div className="h-2 w-full bg-muted" aria-hidden="true" />
                        <CardHeader>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-4xl opacity-30" aria-label={region.region_name}>{region.flag_emoji}</span>
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
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-background/90 border border-border/60 rounded-sm px-4 py-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                            This domain belongs to The Traveller
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                }

                return (
                  <Link key={region.region_code} href={`/compass/${region.region_code}`} aria-label={`${t("compass.explore")} ${region.region_name}`}>
                    <Card className="h-full border-border bg-card transition-all duration-300 hover:shadow-md hover:border-primary/40 cursor-pointer overflow-hidden group">
                      <div className="h-2 w-full bg-muted group-hover:bg-primary/20 transition-colors" aria-hidden="true" />
                      <CardHeader>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-4xl" aria-label={region.region_name}>{region.flag_emoji}</span>
                          <span className="text-xs font-mono tracking-widest uppercase text-muted-foreground">{region.region_code}</span>
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
