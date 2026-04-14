import { useGetScenarios, getGetScenariosQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, BookOpen } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export default function Atelier() {
  const { t } = useLanguage();
  const { data: scenarios, isLoading } = useGetScenarios(undefined, { query: { queryKey: getGetScenariosQueryKey() } });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-4 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-serif text-foreground">{t("atelier.title")}</h1>
        <p className="text-muted-foreground text-lg font-light leading-relaxed">
          {t("atelier.subtitle")}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-label={t("common.loading")} aria-live="polite">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64 rounded-sm" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios?.map((scenario) => (
            <Link key={scenario.id} href={`/atelier/${scenario.id}`} aria-label={scenario.title}>
              <Card className="h-full border-border bg-card transition-all duration-300 hover:shadow-md hover:border-primary/40 cursor-pointer flex flex-col">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="bg-muted text-muted-foreground font-mono text-xs rounded-sm px-2">
                      {t("atelier.pillar")} {scenario.pillar}
                    </Badge>
                    <span className="text-xs font-medium uppercase tracking-widest text-primary">{scenario.region_code}</span>
                  </div>
                  <CardTitle className="font-serif text-xl line-clamp-2">{scenario.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-muted-foreground text-sm line-clamp-3">
                    {scenario.content_json.situation}
                  </p>
                </CardContent>
                <CardFooter className="pt-4 border-t border-border/50 text-xs text-muted-foreground flex justify-between items-center bg-muted/20">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{scenario.estimated_minutes || 2} {t("atelier.duration")}</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary">
                    <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>+{scenario.noble_score_impact} pt</span>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
          {(!scenarios || scenarios.length === 0) && (
            <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-border rounded-sm bg-muted/10">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" aria-hidden="true" />
              <p className="font-serif text-xl">{t("atelier.empty")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
