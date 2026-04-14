import {
  useGetCultureCompass,
  getGetCultureCompassQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Compass as CompassIcon, Globe } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export default function Compass() {
  const { t, locale } = useLocale();

  const { data: regions, isLoading } = useGetCultureCompass(
    { locale },
    { query: { queryKey: [...getGetCultureCompassQueryKey(), locale] } }
  );

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
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" aria-label={t("common.loading")} aria-live="polite">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 rounded-sm" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {regions?.map((region) => (
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
          ))}
          {(!regions || regions.length === 0) && (
            <div className="col-span-full py-16 text-center text-muted-foreground border border-dashed border-border rounded-sm bg-muted/5">
              <Globe className="w-12 h-12 mx-auto mb-4 opacity-20" aria-hidden="true" />
              <p className="font-serif text-xl">The cartographers are expanding the compass.</p>
              <p className="text-sm mt-2">New regions will be available shortly.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
