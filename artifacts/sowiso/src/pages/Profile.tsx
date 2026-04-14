import {
  useGetProfile,
  useGetNobleScore,
  useGetPillarProgress,
  useGetNobleScoreLog,
  getGetProfileQueryKey,
  getGetNobleScoreQueryKey,
  getGetPillarProgressQueryKey,
  getGetNobleScoreLogQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Calendar, Globe, Target, Clock } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/lib/i18n";

export default function Profile() {
  const { t } = useLanguage();
  const { data: profile, isLoading: profileLoading } = useGetProfile({ query: { queryKey: getGetProfileQueryKey() } });
  const { data: nobleScore, isLoading: scoreLoading } = useGetNobleScore({ query: { queryKey: getGetNobleScoreQueryKey() } });
  const { data: pillars, isLoading: pillarsLoading } = useGetPillarProgress({ query: { queryKey: getGetPillarProgressQueryKey() } });
  const { data: logs, isLoading: logsLoading } = useGetNobleScoreLog({ limit: 10 }, { query: { queryKey: getGetNobleScoreLogQueryKey({ limit: 10 }) } });

  const isLoading = profileLoading || scoreLoading || pillarsLoading || logsLoading;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8" aria-label={t("common.loading")} aria-live="polite">
        <Skeleton className="h-32 w-full rounded-sm" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-sm" />
          <Skeleton className="h-64 rounded-sm md:col-span-2" />
        </div>
        <Skeleton className="h-96 rounded-sm" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500 pb-16">

      <div className="flex flex-col md:flex-row gap-8 items-start md:items-center p-8 bg-card border border-border shadow-sm rounded-sm">
        <div
          className="w-24 h-24 rounded-full bg-muted border-4 border-background flex items-center justify-center shadow-sm flex-shrink-0 text-3xl font-serif text-muted-foreground"
          aria-label={`${t("profile.title")} ${profile?.id.substring(0, 2).toUpperCase() || "SO"}`}
        >
          {profile?.id.substring(0, 2).toUpperCase() || "SO"}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-serif text-foreground">{t("profile.title")}</h1>
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono uppercase tracking-widest border border-primary/20">
              {profile?.subscription_tier}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground pt-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" aria-hidden="true" />
              <span className="capitalize">{profile?.ambition_level} {t("profile.ambition")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" aria-hidden="true" />
              <span>{t("profile.active_region")}: <span className="uppercase">{profile?.active_region}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              <span>{t("profile.member_since")} {profile?.created_at ? format(new Date(profile.created_at), "MMMM yyyy") : "Recently"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="space-y-6">
          <Card className="bg-card border-border shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: nobleScore?.level_color || "var(--primary)" }} aria-hidden="true" />
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" aria-hidden="true" />
                {t("profile.noble_standing")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-4">
                <div className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-2">{t("profile.current_title")}</div>
                <div className="text-3xl font-serif" style={{ color: nobleScore?.level_color || "inherit" }}>
                  {nobleScore?.level_name}
                </div>
              </div>

              <div className="space-y-2">
                <div
                  className="h-1.5 w-full bg-muted rounded-full overflow-hidden"
                  role="progressbar"
                  aria-label={t("profile.noble_standing")}
                  aria-valuenow={nobleScore?.total_score ?? 0}
                  aria-valuemin={0}
                  aria-valuemax={nobleScore?.next_level_threshold ?? 100}
                >
                  <div
                    className="h-full transition-all duration-1000"
                    style={{
                      width: `${nobleScore?.next_level_threshold ? (nobleScore.total_score / nobleScore.next_level_threshold) * 100 : 100}%`,
                      backgroundColor: nobleScore?.level_color || "var(--primary)"
                    }}
                  />
                </div>
                {nobleScore?.next_level_threshold && (
                  <div className="text-xs text-right text-muted-foreground">
                    {t("profile.next_rank")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2 bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-xl">{t("profile.domain_mastery")}</CardTitle>
            <CardDescription>{t("profile.domain_subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {pillars?.map((pillar) => (
                <div key={pillar.pillar} className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-40 flex-shrink-0">
                    <div className="text-sm font-medium">{pillar.pillar_domain}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">{t("atelier.pillar")} {pillar.pillar}</div>
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-serif italic text-foreground/80">{pillar.current_title}</span>
                    </div>
                    <div
                      className="h-1 w-full bg-muted rounded-full overflow-hidden"
                      role="progressbar"
                      aria-label={pillar.pillar_domain}
                      aria-valuenow={pillar.progress_percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full bg-primary/70 transition-all duration-1000"
                        style={{ width: `${pillar.progress_percent}%` }}
                      />
                    </div>
                    {pillar.next_title && (
                      <div className="text-[10px] text-right text-muted-foreground uppercase tracking-wider mt-1">
                        {t("profile.next")}: {pillar.next_title}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
            {t("profile.recent_log")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs && logs.length > 0 ? (
            <div className="relative border-l border-border/50 ml-3 md:ml-4 space-y-8 pb-4" aria-label={t("profile.recent_log")}>
              {logs.map((log) => (
                <div key={log.id} className="relative pl-6 md:pl-8">
                  <div className={`absolute w-3 h-3 rounded-full left-[-6px] top-1.5 ring-4 ring-background
                    ${log.score_delta > 0 ? "bg-green-500" : log.score_delta < 0 ? "bg-red-500" : "bg-muted-foreground"}`}
                    aria-hidden="true"
                  />
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-1">
                    <div className="text-sm font-medium text-foreground">{log.trigger}</div>
                    <div className="text-xs font-mono text-muted-foreground">
                      <time dateTime={log.timestamp}>{format(new Date(log.timestamp), "MMM d, yyyy HH:mm")}</time>
                    </div>
                  </div>
                  <div className={`text-xs font-mono uppercase tracking-widest ${log.score_delta > 0 ? "text-green-600" : log.score_delta < 0 ? "text-red-600" : "text-muted-foreground"}`}>
                    {log.score_delta > 0 ? "Refined" : log.score_delta < 0 ? "Reconsidered" : "Observed"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="font-serif text-lg">{t("profile.no_history")}</p>
              <p className="text-sm mt-1">{t("profile.visit_atelier")}</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
