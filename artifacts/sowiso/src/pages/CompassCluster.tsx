import { useParams, Link } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  useGetCultureCompass,
  getGetCultureCompassQueryKey,
  useGetProfile,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle2, AlertTriangle, Lock, Crown } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { getCluster, getClusterBrief } from "@/lib/clusters";
import { COMPASS_REGIONS, FlagEmoji, useActiveRegion } from "@/lib/active-region";
import { useAuth } from "@/lib/auth";

const GUEST_UNLOCKED_REGIONS = ["GB"];

export default function CompassCluster() {
  usePageTitle("The Cultural Compass");
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useLocale();
  const cluster = getCluster(id ?? "");
  const { activeRegion } = useActiveRegion();

  const { isAuthenticated } = useAuth();
  const { data: profile } = useGetProfile();
  const tier = profile?.subscription_tier ?? "guest";
  const isVisitor = !isAuthenticated;
  const isAmbassador = tier === "ambassador";

  const { data: regions, isLoading } = useGetCultureCompass(
    { locale },
    { query: { queryKey: [...getGetCultureCompassQueryKey(), locale] } }
  );

  if (!cluster) {
    return (
      <div className="text-center py-20">
        <h2 className="font-serif text-2xl">{t("common.not_found")}</h2>
        <Link href="/compass" className="text-primary hover:underline mt-4 inline-block">
          {t("compass.back")}
        </Link>
      </div>
    );
  }

  const clusterRegions = regions?.filter((r) =>
    (cluster.members as string[]).includes(r.region_code)
  ) ?? [];

  const { dos, donts } = getClusterBrief(cluster, locale);

  function getCountryName(code: string): string {
    const region = COMPASS_REGIONS.find((r) => r.code === code);
    return region?.names[locale as keyof typeof region.names] ?? region?.names.en ?? code;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500 pb-16">
      <Link href="/compass" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
        {t("compass.back")}
      </Link>

      {/* Header */}
      <div className="pb-6 border-b border-border/60">
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          {cluster.members.map((code) => (
            <span key={code} className="flex flex-col items-center gap-0.5">
              <FlagEmoji code={code} className="text-3xl leading-none" />
              <span className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wide">{getCountryName(code)}</span>
            </span>
          ))}
        </div>
        <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-3">
          {t(cluster.nameKey as Parameters<typeof t>[0])}
        </h1>
        <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground max-w-xl leading-relaxed">
          {t(cluster.philosophyKey as Parameters<typeof t>[0])}
        </p>
      </div>

      {/* Quick Brief */}
      <section aria-labelledby="cluster-brief-heading" className="bg-primary/5 border border-primary/20 rounded-sm p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-primary/15">
          <div>
            <h2 id="cluster-brief-heading" className="text-sm font-mono uppercase tracking-widest text-primary font-semibold">
              {t("compass.cluster_brief")}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t("compass.cluster_brief_subtitle")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-green-700 dark:text-green-400">
              {t("compass.dos")}
            </h3>
            <ul className="space-y-2.5" aria-label={t("compass.dos")}>
              {dos.map((item, i) => (
                <li key={i} className="flex gap-3 items-start text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
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
              {donts.map((item, i) => (
                <li key={i} className="flex gap-3 items-start text-sm">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <span className="text-foreground/80 leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* High Society Sub-cluster */}
      {cluster.hasHighSociety && (
        <section className={`border rounded-sm p-6 space-y-4 ${isAmbassador ? "border-amber-300/40 bg-amber-50/20 dark:bg-amber-900/10" : "border-border/30 bg-muted/10"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className={`w-5 h-5 ${isAmbassador ? "text-amber-600" : "text-muted-foreground/30"}`} aria-hidden="true" />
              <h2 className={`text-sm font-mono uppercase tracking-widest font-semibold ${isAmbassador ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground/40"}`}>
                {t("compass.high_society")}
              </h2>
            </div>
            {!isAmbassador && (
              <div className="flex items-center gap-1.5 text-xs font-mono tracking-widest uppercase text-muted-foreground/40">
                <Lock className="h-3 w-3" aria-hidden="true" />
                <span>{t("compass.ambassador_only")}</span>
              </div>
            )}
          </div>

          {isAmbassador ? (
            <div className="space-y-4">
              <p className="text-sm text-foreground/70 leading-relaxed">
                {t("compass.high_society_desc")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {[
                  t("compass.hs_dining"),
                  t("compass.hs_dress"),
                  t("compass.hs_address"),
                  t("compass.hs_yacht"),
                ].map((item, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <Crown className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span className="text-foreground/70 leading-snug">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground/40 leading-relaxed blur-[3px] select-none" aria-hidden="true">
                {t("compass.high_society_desc")}
              </p>
              <Link href={isVisitor ? "/register" : "/membership"}>
                <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-primary hover:underline underline-offset-2 cursor-pointer">
                  <Crown className="w-3 h-3" />
                  {t("compass.unlock_ambassador")}
                </span>
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Member Countries */}
      <section className="space-y-5 pt-2">
        <h2 className="font-serif text-2xl border-b border-border pb-2">{t("compass.member_countries")}</h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cluster.members.map((code) => (
              <Skeleton key={code} className="h-28 rounded-sm" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cluster.members.map((code) => {
              const region = clusterRegions.find((r) => r.region_code === code);
              const isLocked = isVisitor && !GUEST_UNLOCKED_REGIONS.includes(code);
              const isUserRegion = code === activeRegion;
              const countryName = getCountryName(code);

              if (!region) {
                return (
                  <div key={code}>
                    <Card className="border-border/20 bg-muted/5 relative overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <FlagEmoji code={code} className="text-3xl leading-none opacity-20" />
                          <div>
                            <p className="text-sm font-serif text-muted-foreground/30">{countryName}</p>
                            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/30 mt-0.5">
                              {t("compass.coming_soon")}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </div>
                );
              }

              if (isLocked) {
                const lockHref = isVisitor ? "/register" : "/membership";
                return (
                  <Link key={code} href={lockHref}>
                    <Card className="border-border/30 bg-muted/10 cursor-pointer hover:border-primary/20 transition-colors group relative overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <FlagEmoji code={code} className="text-3xl leading-none opacity-30" />
                          <div>
                            <p className="text-sm font-serif text-muted-foreground/40">{countryName}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Lock className="w-3 h-3 text-muted-foreground/30" aria-hidden="true" />
                              <span className="text-xs text-muted-foreground/40">{t("compass.unlock_region")}</span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                );
              }

              return (
                <Link key={code} href={`/compass/${code}`}>
                  <Card className={`border-bg-card cursor-pointer transition-all group ${
                    isUserRegion
                      ? "border-primary/50 ring-1 ring-primary/20 bg-primary/[0.02]"
                      : "border-border hover:border-primary/40 hover:shadow-sm"
                  }`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FlagEmoji code={code} className="text-3xl leading-none" />
                          <div>
                            <CardTitle className="font-serif text-lg group-hover:text-primary transition-colors">
                              {region.region_name}
                            </CardTitle>
                            {countryName !== region.region_name && (
                              <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wide">{code}</p>
                            )}
                          </div>
                        </div>
                        {isUserRegion && (
                          <span className="text-[9px] font-bold uppercase tracking-widest bg-primary text-primary-foreground px-2 py-0.5 rounded-full shrink-0">
                            {t("compass.your_region")}
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground line-clamp-2">{region.core_value}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
