import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useActiveRegion, FlagEmoji } from "@/lib/active-region";
import { useGetProfile } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Lock, Crown, ArrowRight } from "lucide-react";
import { SITUATIONS } from "@/lib/situations";

export default function Situations() {
  usePageTitle("Situations");
  const { t, locale } = useLocale();
  const { activeRegion } = useActiveRegion();
  const { data: profile } = useGetProfile();
  const { isAuthenticated } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);

  const tier = profile?.subscription_tier ?? "guest";
  const isGuest = !isAuthenticated;
  const isAmbassador = tier === "ambassador";

  const selectedSituation = SITUATIONS.find((s) => s.id === selected);

  const regionTips = selectedSituation?.tips.byRegion[activeRegion] ?? [];
  const allTips = selectedSituation
    ? [...selectedSituation.tips.universal, ...regionTips]
    : [];

  if (isGuest) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-16">
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-serif text-foreground">{t("situations.title")}</h1>
          <p className="text-muted-foreground text-lg font-light leading-relaxed">
            {t("situations.subtitle")}
          </p>
        </div>
        <div className="relative">
          <div className="pointer-events-none select-none grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 opacity-60">
            {SITUATIONS.slice(0, 8).map((sit) => {
              const Icon = sit.icon;
              return (
                <div key={sit.id} className="flex flex-col items-center gap-2 p-4 rounded-sm border border-border/60 text-center bg-background">
                  <Icon className="w-6 h-6 text-primary/70" aria-hidden="true" />
                  <span className="text-xs font-medium leading-tight">{t(sit.nameKey as Parameters<typeof t>[0])}</span>
                </div>
              );
            })}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
        </div>
        <div className="text-center space-y-4 pt-2 pb-4">
          <div className="flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>The Traveller</span>
          </div>
          <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-sm mx-auto">
            {t("situations.lock.teaser")}
          </p>
          <Link href="/register">
            <div className="inline-flex items-center gap-2 text-sm text-primary cursor-pointer hover:underline underline-offset-2 group">
              {t("lock.cta.register")}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </div>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-16">
      {/* Header */}
      <div className="space-y-4 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-serif text-foreground">{t("situations.title")}</h1>
        <p className="text-muted-foreground text-lg font-light leading-relaxed">
          {t("situations.subtitle")}
        </p>
      </div>

      {/* Situation grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {SITUATIONS.map((sit) => {
          const Icon = sit.icon;
          const isLocked = sit.ambassadorOnly && !isAmbassador;
          const isActive = selected === sit.id;

          return (
            <button
              key={sit.id}
              onClick={() => {
                if (isLocked) return;
                setSelected(isActive ? null : sit.id);
              }}
              disabled={isLocked}
              aria-pressed={isActive}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-sm border text-center transition-all group ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : isLocked
                  ? "border-border/30 bg-muted/10 text-muted-foreground/40 cursor-default"
                  : "border-border/60 hover:border-primary/40 hover:bg-muted/20 text-foreground cursor-pointer"
              }`}
            >
              <Icon
                className={`w-6 h-6 ${isActive ? "text-primary-foreground" : isLocked ? "text-muted-foreground/30" : "text-primary/70"}`}
                aria-hidden="true"
              />
              <span className="text-xs font-medium leading-tight">
                {t(sit.nameKey as Parameters<typeof t>[0])}
              </span>
              {sit.ambassadorOnly && !isAmbassador && (
                <div className="absolute top-1.5 right-1.5">
                  <Crown className="w-3 h-3 text-amber-400/60" aria-hidden="true" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Ambassador gate for Yacht */}
      {selected === null && (
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/50">
          <Crown className="w-3 h-3 inline-block mr-1 text-amber-400/60" aria-hidden="true" />
          {t("situations.ambassador_note")}{" "}
          <Link href="/membership">
            <span className="text-primary hover:underline cursor-pointer">{t("situations.ambassador_cta")}</span>
          </Link>
        </p>
      )}

      {/* Situation Detail */}
      {selectedSituation && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <div className="border-b border-border pb-4">
            <h2 className="font-serif text-2xl">
              {t(selectedSituation.nameKey as Parameters<typeof t>[0])}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t(selectedSituation.descKey as Parameters<typeof t>[0])}
            </p>
            {regionTips.length > 0 && (
              <p className="text-xs font-mono uppercase tracking-widest text-primary mt-2 flex items-center gap-1.5">
                <FlagEmoji code={activeRegion} />
                {t("situations.region_tips", { region: activeRegion })}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Do's */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-widest text-green-700 dark:text-green-400 border-b border-border pb-2">
                {t("compass.dos")}
              </h3>
              <ul className="space-y-3">
                {allTips.map((tip, i) => (
                  <li key={i} className="flex gap-2 items-start text-sm">
                    <span className="text-green-600 font-bold flex-shrink-0 mt-0.5">+</span>
                    <span className="text-foreground/80 leading-snug">{tip.do}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Don'ts */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-widest text-red-700 dark:text-red-400 border-b border-border pb-2">
                {t("compass.donts")}
              </h3>
              <ul className="space-y-3">
                {allTips.map((tip, i) => (
                  <li key={i} className="flex gap-2 items-start text-sm">
                    <span className="text-red-600 font-bold flex-shrink-0 mt-0.5">×</span>
                    <span className="text-foreground/80 leading-snug">{tip.dont}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CTA to Counsel */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-medium text-foreground">{t("situations.counsel_cta")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("situations.counsel_cta_desc")}</p>
              </div>
              <Link href={`/counsel?situation=${encodeURIComponent(t(selectedSituation.nameKey as Parameters<typeof t>[0]))}`}>
                <span className="text-sm font-mono uppercase tracking-widest text-primary hover:underline underline-offset-2 cursor-pointer whitespace-nowrap">
                  {t("situations.open_counsel")} →
                </span>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
