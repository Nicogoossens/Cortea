import {
  useGetCultureCompassRegion,
  getGetCultureCompassRegionQueryKey,
} from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertTriangle, CheckCircle2, Utensils, MessageSquare, Gift, Shirt, Zap } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { LockOverlay } from "@/components/LockOverlay";

const GUEST_UNLOCKED_REGIONS = ["GB"];

export default function CompassRegion() {
  const { code } = useParams<{ code: string }>();
  const { t, locale } = useLocale();
  const { isAuthenticated } = useAuth();
  const regionCode = code || "";

  const { data: detail, isLoading } = useGetCultureCompassRegion(
    regionCode,
    { locale },
    {
      query: {
        enabled: !!regionCode,
        queryKey: [...getGetCultureCompassRegionQueryKey(regionCode), locale],
      },
    }
  );

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

  if (!isAuthenticated && !GUEST_UNLOCKED_REGIONS.includes(regionCode)) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-16">
        <Link href="/compass" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
          {t("compass.back")}
        </Link>
        <div className="flex items-center gap-6">
          <div className="text-6xl drop-shadow-sm" aria-label={detail.region_name}>{detail.flag_emoji}</div>
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
            isAuthenticated={false}
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
        <div className="flex items-center gap-6">
          <div className="text-6xl drop-shadow-sm" aria-label={detail.region_name}>{detail.flag_emoji}</div>
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
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border/30 bg-muted/10">
              <CardTitle className="text-lg font-serif flex items-center gap-3">
                <Utensils className="w-5 h-5 text-muted-foreground" aria-hidden="true" /> {t("compass.dining_etiquette")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-muted-foreground leading-relaxed">
              {detail.dining_etiquette}
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
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

          <Card className="border-border shadow-sm">
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
    </div>
  );
}
