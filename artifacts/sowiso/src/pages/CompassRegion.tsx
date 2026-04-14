import {
  useGetCultureCompassRegion,
  getGetCultureCompassRegionQueryKey,
} from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertTriangle, CheckCircle2, Utensils, MessageSquare, Gift, Shirt } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export default function CompassRegion() {
  const { code } = useParams<{ code: string }>();
  const { t, locale } = useLocale();
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

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500 pb-16">
      <Link href="/compass" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
        {t("compass.back")}
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/60">
        <div className="flex items-center gap-6">
          <div className="text-6xl drop-shadow-sm" aria-label={detail.region_name}>{detail.flag_emoji}</div>
          <div>
            <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-2">{detail.region_name}</h1>
            <p className="text-sm font-mono tracking-widest uppercase text-muted-foreground">{detail.region_code}</p>
          </div>
        </div>
      </div>

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
