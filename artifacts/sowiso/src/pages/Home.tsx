import { Link } from "wouter";
import { useGetProfile, useGetNobleScore, useGetPillarProgress, useCreateProfile } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Compass, Shield, ArrowRight, Scan, Crown, X, MapPin, Bell } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { levelKey } from "@/lib/content-labels";
import { LockOverlay } from "@/components/LockOverlay";
import { COMPASS_REGIONS, FlagEmoji } from "@/lib/active-region";

const NAVIGATOR_KEY = "sowiso_navigator_trips";

interface NavigatorTrip {
  id: string;
  regionCode: string;
  departureDate: string;
}

function daysUntilDate(dateStr: string): number {
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

const WELCOME_DURATION_MS = 7000;

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

interface MiniUseCase {
  id: number;
  slug: string;
  title: string;
  flag_emoji: string;
  formality_level: string;
  readiness_score: number | null;
}

export default function Home() {
  const { t } = useLanguage();
  const { userId, isAuthenticated } = useAuth();
  const { data: profile, isLoading: isProfileLoading, error: profileError } = useGetProfile();
  const { data: nobleScore, isLoading: isScoreLoading } = useGetNobleScore();
  const { data: pillars, isLoading: isPillarsLoading } = useGetPillarProgress();

  const createProfile = useCreateProfile();

  const { data: useCasesShortlist } = useQuery<MiniUseCase[]>({
    queryKey: ["use-cases-home", userId],
    enabled: !!userId,
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/use-cases`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      const all: MiniUseCase[] = await res.json();
      return all
        .filter(uc => uc.readiness_score !== null)
        .sort((a, b) => (b.readiness_score ?? 0) - (a.readiness_score ?? 0))
        .slice(0, 3);
    },
  });

  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeVisible, setWelcomeVisible] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [alertTrips, setAlertTrips] = useState<NavigatorTrip[]>([]);

  useEffect(() => {
    if (!isAuthenticated || profile?.subscription_tier !== "ambassador") {
      setAlertTrips([]);
      return;
    }
    try {
      const stored = localStorage.getItem(NAVIGATOR_KEY);
      if (stored) {
        const trips = JSON.parse(stored) as NavigatorTrip[];
        const active = trips.filter((trip) => {
          const days = daysUntilDate(trip.departureDate);
          return days <= 7 && days > -14;
        });
        setAlertTrips(active);
      } else {
        setAlertTrips([]);
      }
    } catch { setAlertTrips([]); }
  }, [isAuthenticated, profile?.subscription_tier]);

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

  useEffect(() => {
    if (!userId || !profile || !nobleScore) return;
    const sessionKey = `welcome_shown_${firstName ? "named" : "anon"}_${userId}`;
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, "1");

    setShowWelcome(true);
    const fadeIn = setTimeout(() => setWelcomeVisible(true), 30);
    const fadeOut = setTimeout(() => handleDismiss(), WELCOME_DURATION_MS);
    dismissTimerRef.current = fadeOut;

    return () => {
      clearTimeout(fadeIn);
      clearTimeout(fadeOut);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, profile?.full_name, nobleScore?.total_score]);

  useEffect(() => () => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    if (dismissFadeRef.current) clearTimeout(dismissFadeRef.current);
  }, []);

  const handleDismiss = () => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    setWelcomeVisible(false);
    dismissFadeRef.current = setTimeout(() => setShowWelcome(false), 400);
  };

  const isLoading = isProfileLoading || isScoreLoading || isPillarsLoading;

  const isAmbassador = profile?.subscription_tier === "ambassador";
  const mirrorHref = !userId ? "/signin" : isAmbassador ? "/mirror" : "/membership";

  const firstName = profile?.full_name?.split(" ")[0] ?? "";
  const levelLabel = t(levelKey(nobleScore?.level_name));

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

      {showWelcome && (
        <div
          role="status"
          aria-live="polite"
          aria-label={firstName ? t("home.welcome_back", { name: firstName }) : t("home.welcome_back_anonymous")}
          className={[
            "relative flex items-start gap-4 rounded-sm border border-primary/20 bg-primary/5 px-5 py-4",
            "transition-all duration-400",
            welcomeVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none",
          ].join(" ")}
        >
          <div className="flex-1 min-w-0">
            <p className="font-serif text-xl text-foreground leading-snug">
              {firstName ? t("home.welcome_back", { name: firstName }) : t("home.welcome_back_anonymous")}
            </p>
            {nobleScore?.total_score !== undefined && (
              <p className="mt-0.5 text-sm text-muted-foreground font-light">
                {t("home.welcome_back_score", { score: nobleScore.total_score, level: levelLabel })}
              </p>
            )}
            {nobleScore?.next_level_name && nobleScore.next_level_threshold - nobleScore.total_score > 0 && (
              <p className="mt-0.5 text-sm text-primary/70 font-light">
                {t("home.welcome_back_next_rank", {
                  remaining: nobleScore.next_level_threshold - nobleScore.total_score,
                  next_level: t(levelKey(nobleScore.next_level_name)),
                })}
              </p>
            )}
            {!firstName && (
              <Link
                href="/profile"
                onClick={handleDismiss}
                className="mt-1.5 inline-block text-sm text-primary/80 hover:text-primary underline-offset-2 hover:underline transition-colors font-light"
              >
                {t("home.welcome_back_prompt")}
              </Link>
            )}
          </div>
          <button
            onClick={handleDismiss}
            aria-label={t("home.welcome_back_dismiss")}
            className="shrink-0 mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {isAuthenticated && isAmbassador && alertTrips.length > 0 && (
        <Link href="/navigator" className="block group">
          <div className="rounded-sm border border-amber-400/30 bg-amber-500/5 px-5 py-4 transition-all duration-300 hover:border-amber-400/50 hover:bg-amber-500/8 cursor-pointer">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-amber-700/70 mb-3">
              <Bell className="h-3.5 w-3.5" aria-hidden="true" />
              {t("home.navigator_alert_heading")}
            </div>
            <div className="space-y-2">
              {alertTrips.map((trip) => {
                const days = daysUntilDate(trip.departureDate);
                const region = COMPASS_REGIONS.find((r) => r.code === trip.regionCode);
                return (
                  <div key={trip.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 font-light text-sm text-foreground">
                      {region && <FlagEmoji code={region.code} />}
                      <span>{region?.names.en ?? trip.regionCode}</span>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs border-amber-400/40 text-amber-600 shrink-0">
                      {days < 0 ? t("navigator.arrived") : days === 0 ? t("navigator.departure_today") : t("navigator.d_minus", { count: days })}
                    </Badge>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-amber-700/60 group-hover:text-amber-700/80 transition-colors">
              {t("home.navigator_alert_cta")} →
            </p>
          </div>
        </Link>
      )}

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
                  {t("mirror.subtitle")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end">
                <ArrowRight className="h-5 w-5 text-amber-400/60 group-hover:text-amber-600 transition-all group-hover:translate-x-1" aria-hidden="true" />
              </CardContent>
              {!isAmbassador && (
                <LockOverlay
                  requiredTier="ambassador"
                  teaser={t("mirror.lock.teaser")}
                  isAuthenticated={isAuthenticated}
                />
              )}
            </Card>
          </Link>

        </div>
      </div>

      {/* ── Your situations shortcut row ── */}
      {useCasesShortlist && useCasesShortlist.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h2 className="font-serif text-2xl flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary/70" aria-hidden="true" />
              Your situations
            </h2>
            <Link href="/use-cases" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {useCasesShortlist.map((uc) => {
              const score = uc.readiness_score ?? 0;
              const getColor = (s: number) => s >= 75 ? "#16a34a" : s >= 50 ? "#ca8a04" : s >= 25 ? "#ea580c" : "#dc2626";
              return (
                <Link key={uc.id} href="/use-cases">
                  <Card className="group border-border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-300 cursor-pointer">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl flex-shrink-0">{uc.flag_emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium leading-snug group-hover:text-primary transition-colors truncate">{uc.title}</div>
                          <div className="text-xs text-muted-foreground capitalize mt-0.5">{uc.formality_level.replace(/_/g, " ")}</div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <span className="text-sm font-semibold" style={{ color: getColor(score) }}>{score}%</span>
                        </div>
                      </div>
                      <div className="mt-2 h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full transition-all duration-700 rounded-full" style={{ width: `${score}%`, backgroundColor: getColor(score) }} />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
