import { Link } from "wouter";
import { useGetProfile, useGetNobleScore, useGetPillarProgress, useCreateProfile } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Compass, Shield, ArrowRight, Scan, Crown } from "lucide-react";
import { useEffect } from "react";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { levelKey } from "@/lib/content-labels";

export default function Home() {
  const { t } = useLanguage();
  const { userId } = useAuth();
  const { data: profile, isLoading: isProfileLoading, error: profileError } = useGetProfile();
  const { data: nobleScore, isLoading: isScoreLoading } = useGetNobleScore();
  const { data: pillars, isLoading: isPillarsLoading } = useGetPillarProgress();

  const createProfile = useCreateProfile();

  useEffect(() => {
    if (profileError && "status" in profileError && profileError.status === 404 && userId) {
      createProfile.mutate({
        data: {
          language_code: "en",
          ambition_level: "professional",
        },
      });
    }
  }, [profileError, userId, createProfile]);

  const isLoading = isProfileLoading || isScoreLoading || isPillarsLoading;

  const isAmbassador = profile?.subscription_tier === "ambassador";
  const mirrorHref = !userId ? "/signin" : isAmbassador ? "/mirror" : "/membership";

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500" aria-label={t("common.loading")} aria-live="polite">
        <div className="space-y-2">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48 rounded-sm" />
          <Skeleton className="h-48 rounded-sm md:col-span-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-sm" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-serif text-foreground">
          {t("home.greeting")}
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl font-light">
          {t("home.continue_studies")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <Card className="bg-card border-border shadow-sm overflow-hidden relative group" aria-label={t("home.standing")}>
          <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: nobleScore?.level_color || "var(--primary)" }} aria-hidden="true" />
          <CardHeader className="pb-2">
            <CardDescription className="uppercase tracking-widest text-xs font-semibold">{t("home.standing")}</CardDescription>
            <CardTitle className="font-serif text-3xl">{t(levelKey(nobleScore?.level_name))}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t(levelKey(nobleScore?.level_name))}</span>
                {!nobleScore?.next_level_threshold && <span>{t("profile.current_title")}</span>}
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden" role="progressbar" aria-label={t(levelKey(nobleScore?.level_name))} aria-valuemin={0} aria-valuemax={100} aria-valuenow={nobleScore?.next_level_threshold ? Math.round((nobleScore.total_score / nobleScore.next_level_threshold) * 100) : 100}>
                <div
                  className="h-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${nobleScore?.next_level_threshold ? (nobleScore.total_score / nobleScore.next_level_threshold) * 100 : 100}%`,
                    backgroundColor: nobleScore?.level_color || "var(--primary)"
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-card border-border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="font-serif text-xl">{t("profile.domain_mastery")}</CardTitle>
            <CardDescription>{t("profile.domain_subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {pillars?.map((pillar) => (
                <div key={pillar.pillar} className="space-y-2">
                  <div className="text-sm font-medium leading-tight">{pillar.pillar_domain}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">{pillar.current_title}</div>
                  <div
                    className="h-1 w-full bg-muted rounded-full overflow-hidden"
                    role="progressbar"
                    aria-label={pillar.pillar_domain}
                    aria-valuenow={pillar.progress_percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full bg-primary transition-all duration-1000"
                      style={{ width: `${pillar.progress_percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="font-serif text-2xl border-b border-border pb-2">{t("home.continue_studies")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

          <Link href="/atelier" className="group">
            <Card className="h-full border-border bg-card transition-all duration-300 hover:shadow-md hover:border-primary/30 cursor-pointer">
              <CardHeader>
                <div className="h-12 w-12 rounded-sm bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  <BookOpen className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <CardTitle className="font-serif text-xl group-hover:text-primary transition-colors">{t("nav.atelier")}</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {t("atelier.subtitle")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end">
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" aria-hidden="true" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/counsel" className="group">
            <Card className="h-full border-border bg-card transition-all duration-300 hover:shadow-md hover:border-primary/30 cursor-pointer">
              <CardHeader>
                <div className="h-12 w-12 rounded-sm bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  <Shield className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <CardTitle className="font-serif text-xl group-hover:text-primary transition-colors">{t("nav.counsel")}</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {t("counsel.subtitle")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end">
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" aria-hidden="true" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/compass" className="group">
            <Card className="h-full border-border bg-card transition-all duration-300 hover:shadow-md hover:border-primary/30 cursor-pointer">
              <CardHeader>
                <div className="h-12 w-12 rounded-sm bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  <Compass className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <CardTitle className="font-serif text-xl group-hover:text-primary transition-colors">{t("nav.compass")}</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {t("compass.subtitle")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end">
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" aria-hidden="true" />
              </CardContent>
            </Card>
          </Link>

          <Link href={mirrorHref} className="group">
            <Card className="h-full border-amber-200/50 bg-card transition-all duration-300 hover:shadow-md hover:border-amber-400/40 cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-400/60 to-amber-600/30" aria-hidden="true" />
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-sm bg-amber-50/60 flex items-center justify-center group-hover:bg-amber-100/60 transition-colors">
                    <Scan className="h-6 w-6 text-amber-700/70" aria-hidden="true" />
                  </div>
                  {!isAmbassador && (
                    <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-amber-700/60 border border-amber-300/50 rounded-[2px] px-1.5 py-0.5 bg-amber-50/50">
                      <Crown className="h-2.5 w-2.5" aria-hidden="true" />
                      {t("mirror.tier_label")}
                    </span>
                  )}
                </div>
                <CardTitle className="font-serif text-xl text-amber-900/80 group-hover:text-amber-900 transition-colors">{t("nav.mirror")}</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {isAmbassador ? t("mirror.subtitle") : t("mirror.access_prompt")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end">
                <ArrowRight className="h-5 w-5 text-amber-400/60 group-hover:text-amber-600 transition-all group-hover:translate-x-1" aria-hidden="true" />
              </CardContent>
            </Card>
          </Link>

        </div>
      </div>
    </div>
  );
}
