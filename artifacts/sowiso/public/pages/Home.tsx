import { Link } from "wouter";
import { useGetProfile, useGetNobleScore, useGetPillarProgress, useCreateProfile } from "@workspace/api-client-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Compass, Shield, ArrowRight, X, MapPin, Bell, Scan, Crown, Flame, ShirtIcon, Check } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { levelKey } from "@/lib/content-labels";
import { COMPASS_REGIONS, FlagEmoji } from "@/lib/active-region";
import { GarmentAvatar } from "@/components/GarmentAvatar";
import { WelcomeBanner } from "@/components/WelcomeBanner";

import { NAVIGATOR_KEY, NavigatorTrip, daysUntil } from "@/lib/navigator-utils";

const TRIP_ALERT_DISMISS_PREFIX = "trip_alert_dismissed";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface DailyQuest {
  id: number;
  title: string;
  title_nl?: string | null;
  title_fr?: string | null;
  title_de?: string | null;
  description: string;
  description_nl?: string | null;
  description_fr?: string | null;
  description_de?: string | null;
  pillar?: number | null;
  noble_score_reward: number;
  completed: boolean;
}

function StreakWidget({ streak }: { streak: number }) {
  const { t } = useLanguage();
  if (streak === 0) return null;
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground border-b border-border/40 pb-3 mb-1">
      <Flame className={`h-4 w-4 ${streak >= 7 ? "text-amber-500" : streak >= 3 ? "text-orange-400" : "text-muted-foreground/60"}`} aria-hidden="true" />
      <span className="font-mono uppercase tracking-widest text-xs">
        {t("home.streak")}
      </span>
      <span className={`text-xs font-semibold ${streak >= 7 ? "text-amber-600" : streak >= 3 ? "text-orange-500" : "text-foreground/60"}`}>
        {streak} {streak === 1 ? "day" : "days"}
      </span>
    </div>
  );
}

interface MiniUseCase {
  id: number;
  slug: string;
  title: string;
  flag_emoji: string;
  formality_level: string;
  region_code: string | null;
  readiness_score: number | null;
}

interface LearningTrackProgressRow {
  register: string;
  region_code: string | null;
  phase: number;
  current_level: number;
  questions_done: number;
  correct_streak: number;
  mastered: boolean;
}

interface EarnedBadge {
  id: number;
  slug: string;
  title: string;
  description: string;
  badge_type: string;
  register: string;
  research_pillar: string | null;
  phase: number | null;
  region_code: string | null;
  icon_url: string | null;
  awarded_at: string;
}

export default function Home() {
  usePageTitle("Home");
  const { t, language } = useLanguage();
  const { userId, isAuthenticated, isAdmin, getAuthHeaders } = useAuth();
  const { data: profile, isLoading: isProfileLoading, error: profileError } = useGetProfile();
  const { data: nobleScore, isLoading: isScoreLoading } = useGetNobleScore();
  const { data: pillars, isLoading: isPillarsLoading } = useGetPillarProgress();

  const createProfile = useCreateProfile();

  const { data: allUseCases } = useQuery<MiniUseCase[]>({
    queryKey: ["use-cases-home", userId],
    enabled: !!userId,
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/use-cases`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const useCasesShortlist = allUseCases
    ? allUseCases
        .filter(uc => uc.readiness_score !== null)
        .sort((a, b) => (b.readiness_score ?? 0) - (a.readiness_score ?? 0))
        .slice(0, 3)
    : undefined;

  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeVisible, setWelcomeVisible] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [alertTrips, setAlertTrips] = useState<NavigatorTrip[]>([]);
  const [allTrips, setAllTrips] = useState<NavigatorTrip[]>([]);
  const [tripAlertDismissed, setTripAlertDismissed] = useState(false);
  const [atelierProgress, setAtelierProgress] = useState<LearningTrackProgressRow[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [streak, setStreak] = useState(0);
  const [dailyQuests, setDailyQuests] = useState<DailyQuest[] | null>(null);
  const [questsLoading, setQuestsLoading] = useState(false);
  const [completingQuest, setCompletingQuest] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setAlertTrips([]);
      setAllTrips([]);
      return;
    }
    try {
      const stored = localStorage.getItem(NAVIGATOR_KEY);
      if (stored) {
        const trips = JSON.parse(stored) as NavigatorTrip[];
        setAllTrips(trips);
        if (profile?.subscription_tier === "ambassador") {
          const active = trips.filter((trip) => {
            const days = daysUntil(trip.departureDate);
            return days <= 7 && days > -14;
          });
          setAlertTrips(active);
          if (active.length > 0) {
            const today = new Date().toISOString().slice(0, 10);
            const ids = active.map((t) => t.id).sort().join(",");
            const dismissKey = `${TRIP_ALERT_DISMISS_PREFIX}_${ids}_${today}`;
            if (sessionStorage.getItem(dismissKey)) {
              setTripAlertDismissed(true);
            }
          }
        }
      } else {
        setAlertTrips([]);
        setAllTrips([]);
      }
    } catch { setAlertTrips([]); setAllTrips([]); }
  }, [isAuthenticated, profile?.subscription_tier]);

  useEffect(() => {
    if (!userId) return;
    fetch(`${API_BASE}/api/learning-tracks/progress`, { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => setAtelierProgress(Array.isArray(data) ? data : []))
      .catch(() => setAtelierProgress([]));
    fetch(`${API_BASE}/api/learning-tracks/badges`, { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => setEarnedBadges(Array.isArray(data) ? data : []))
      .catch(() => setEarnedBadges([]));
  }, [userId]);

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

  const handleDismissTripAlert = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const today = new Date().toISOString().slice(0, 10);
    const ids = alertTrips.map((t) => t.id).sort().join(",");
    const dismissKey = `${TRIP_ALERT_DISMISS_PREFIX}_${ids}_${today}`;
    sessionStorage.setItem(dismissKey, "1");
    setTripAlertDismissed(true);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch(`${API_BASE}/api/streak`, { headers: getAuthHeaders() })
      .then((r) => r.ok ? r.json() : null)
      .then((data: { streak?: number } | null) => {
        if (data?.streak !== undefined) setStreak(data.streak);
      })
      .catch(() => null);
  }, [isAuthenticated, getAuthHeaders]);

  useEffect(() => {
    setQuestsLoading(true);
    fetch(`${API_BASE}/api/quests/daily`, {
      headers: isAuthenticated ? getAuthHeaders() : {},
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data: DailyQuest[] | null) => {
        if (data) setDailyQuests(data);
      })
      .catch(() => null)
      .finally(() => setQuestsLoading(false));
  }, [isAuthenticated, getAuthHeaders]);

  const handleCompleteQuest = useCallback(async (questId: number) => {
    if (!isAuthenticated || completingQuest !== null) return;
    setCompletingQuest(questId);
    try {
      const res = await fetch(`${API_BASE}/api/quests/complete`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ quest_id: questId }),
      });
      if (res.ok) {
        setDailyQuests((prev) =>
          prev?.map((q) => q.id === questId ? { ...q, completed: true } : q) ?? null
        );
      }
    } catch {
      // silent
    } finally {
      setCompletingQuest(null);
    }
  }, [isAuthenticated, getAuthHeaders, completingQuest]);

  const lang = (language ?? "en").split("-")[0];
  const getQuestTitle = (q: DailyQuest) => {
    if (lang === "nl" && q.title_nl) return q.title_nl;
    if (lang === "fr" && q.title_fr) return q.title_fr;
    if (lang === "de" && q.title_de) return q.title_de;
    return q.title;
  };

  const isLoading = isProfileLoading || isScoreLoading || isPillarsLoading;

  const totalQuestionsDone = atelierProgress.reduce((sum, r) => sum + r.questions_done, 0);
  const tracksMastered = atelierProgress.filter(r => r.mastered).length;
  const completionPct = atelierProgress.length > 0
    ? Math.round((tracksMastered / atelierProgress.length) * 100)
    : 0;

  const regionBreakdown = Object.entries(
    atelierProgress
      .filter(r => r.region_code && r.questions_done > 0)
      .reduce<Record<string, { questions: number; mastered: number; total: number }>>((acc, r) => {
        const code = r.region_code!;
        if (!acc[code]) acc[code] = { questions: 0, mastered: 0, total: 0 };
        acc[code].questions += r.questions_done;
        acc[code].mastered += r.mastered ? 1 : 0;
        acc[code].total += 1;
        return acc;
      }, {})
  ).sort((a, b) => b[1].questions - a[1].questions);

  const isAmbassador = profile?.subscription_tier === "ambassador";
  const firstName = profile?.full_name?.split(" ")[0] ?? "";
  const levelLabel = t(levelKey(nobleScore?.level_name));

  const wardrobeUnlocks = ((profile as { wardrobe_unlocks?: Array<{ id: string }> } | undefined)?.wardrobe_unlocks ?? []);
  const wardrobeCount = wardrobeUnlocks.length;
  const wardrobeUnlockedIds = new Set(wardrobeUnlocks.map((w) => w.id));
  const avatarTier = ((profile as { avatar_state?: { style_tier?: number } } | undefined)?.avatar_state?.style_tier) ?? 1;

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

      <WelcomeBanner
        userId={userId}
        hasProfile={!!profile}
        hasScore={!!nobleScore}
        firstName={firstName}
        namedLabel={firstName ? t("home.welcome_back", { name: firstName }) : ""}
        anonLabel={t("home.welcome_back_anonymous")}
        scoreLine={
          nobleScore?.total_score !== undefined
            ? t("home.welcome_back_score", { score: nobleScore.total_score, level: levelLabel })
            : null
        }
        nextRankLine={
          nobleScore?.next_level_name && nobleScore.next_level_threshold - nobleScore.total_score > 0
            ? t("home.welcome_back_next_rank", {
                remaining: nobleScore.next_level_threshold - nobleScore.total_score,
                next_level: t(levelKey(nobleScore.next_level_name)),
              })
            : null
        }
        promptLabel={t("home.welcome_back_prompt")}
        dismissLabel={t("home.welcome_back_dismiss")}
      />


      {isAuthenticated && isAmbassador && alertTrips.length > 0 && !tripAlertDismissed && (
        <div className="relative group">
          <Link href="/navigator" className="block">
            <div className="rounded-sm border border-amber-400/30 bg-amber-500/5 px-5 py-4 transition-all duration-300 hover:border-amber-400/50 hover:bg-amber-500/8 cursor-pointer pr-12">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-amber-700/70 mb-3">
                <Bell className="h-3.5 w-3.5" aria-hidden="true" />
                {t("home.navigator_alert_heading")}
              </div>
              <div className="space-y-2">
                {alertTrips.map((trip) => {
                  const days = daysUntil(trip.departureDate);
                  const region = COMPASS_REGIONS.find((r) => r.code === trip.regionCode);
                  return (
                    <div key={trip.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 font-light text-sm text-foreground">
                        {region && <FlagEmoji code={region.code} size="sm" />}
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
          <button
            onClick={handleDismissTripAlert}
            aria-label={t("home.navigator_alert_dismiss")}
            className="absolute top-3 right-3 text-amber-700/40 hover:text-amber-700/80 transition-colors p-1"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-serif text-foreground">
          {t("home.greeting")}
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl font-light">
          {t("home.continue_studies")}
        </p>
      </div>

      {(!isAuthenticated || (profile?.subscription_tier ?? "guest") === "guest") && (
        <Link href="/membership">
          <div
            data-testid="link-home-upgrade-cta"
            className="group relative overflow-hidden rounded-sm border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-card to-card hover:border-amber-500/50 hover:from-amber-500/10 transition-all duration-300 cursor-pointer"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500/40 via-amber-400/60 to-amber-500/40" aria-hidden="true" />
            <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
              <div className="shrink-0 flex items-center justify-center w-14 h-14 rounded-sm bg-amber-500/10 border border-amber-500/20">
                <Crown className="h-6 w-6 text-amber-600" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-amber-700/70">
                  {t("home.upgrade_eyebrow")}
                </p>
                <h2 className="font-serif text-xl md:text-2xl text-foreground">
                  {t("home.upgrade_title")}
                </h2>
                <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-2xl">
                  {t("home.upgrade_description")}
                </p>
              </div>
              <div className="shrink-0">
                <span className="inline-flex items-center gap-2 px-5 py-3 rounded-sm bg-amber-500/10 border border-amber-500/30 text-amber-700 text-sm font-medium tracking-wide group-hover:bg-amber-500/20 transition-colors">
                  {t("home.upgrade_cta")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Streak widget — subtle, above the grid */}
      {isAuthenticated && streak > 0 && (
        <StreakWidget streak={streak} />
      )}

      <div className="grid grid-cols-1 gap-8">

        <Card className="bg-card border-border shadow-sm overflow-hidden relative group" aria-label={t("home.standing")}>
          <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: nobleScore?.level_color || "var(--primary)" }} aria-hidden="true" />
          <CardHeader className="pb-2">
            <CardDescription className="uppercase tracking-widest text-xs font-semibold">{t("home.standing")}</CardDescription>
            <CardTitle className="font-serif text-3xl">{t(levelKey(nobleScore?.level_name))}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
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
              {nobleScore?.next_level_name && nobleScore.next_level_threshold - nobleScore.total_score > 0 && (
                <p className="text-xs text-muted-foreground font-light">
                  {t("home.welcome_back_next_rank", {
                    remaining: nobleScore.next_level_threshold - nobleScore.total_score,
                    next_level: t(levelKey(nobleScore.next_level_name)),
                  })}
                </p>
              )}
              {isAuthenticated && (
                <div className="pt-2 border-t border-border/60 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">{t("home.questions_answered")}</p>
                      <p className="text-xl font-serif mt-0.5">{totalQuestionsDone}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">{t("home.atelier_progress")}</p>
                      <p className="text-xl font-serif mt-0.5">{completionPct}%</p>
                    </div>
                  </div>
                  {regionBreakdown.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">{t("home.region_breakdown")}</p>
                      {regionBreakdown.slice(0, 3).map(([code, stats]) => {
                        const region = COMPASS_REGIONS.find(r => r.code === code);
                        const allMastered = stats.mastered === stats.total && stats.total > 0;
                        return (
                          <div key={code} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <FlagEmoji code={code} size="sm" className="shrink-0" />
                              <span className="text-xs font-light truncate">
                                {region?.names[language] ?? code}
                              </span>
                              {allMastered && (
                                <span className="text-[10px] text-primary shrink-0" aria-label={t("home.region_all_mastered")}>✓</span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground/60 shrink-0">
                              {t("home.region_questions", { count: stats.questions })} · {t("home.region_tracks", { mastered: stats.mastered, total: stats.total })}
                            </span>
                          </div>
                        );
                      })}
                      {regionBreakdown.length > 3 && (
                        <Link href="/atelier" className="block text-[10px] text-muted-foreground/60 hover:text-primary transition-colors mt-0.5">
                          {t("home.region_more", { count: regionBreakdown.length - 3 })}
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}

              {isAuthenticated && isAdmin && (
                <Link href="/wardrobe" className="flex items-center justify-between gap-3 pt-2 border-t border-border/30 group/avatar">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0 rounded-full bg-muted/30 ring-1 ring-border/40 p-1 transition-all group-hover/avatar:ring-primary/40">
                      <GarmentAvatar
                        unlockedIds={wardrobeUnlockedIds}
                        size="sm"
                        ariaLabel={t("home.avatar_rank")}
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ShirtIcon className="w-3.5 h-3.5" aria-hidden="true" />
                        <span className="font-mono uppercase tracking-wider">{t("home.avatar_rank")}</span>
                      </span>
                      <span className="text-[10px] text-muted-foreground/60 font-mono uppercase tracking-widest">
                        {t("home.avatar_tier", { tier: avatarTier })}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-primary/70 group-hover/avatar:text-primary font-mono uppercase tracking-widest transition-colors">
                    {wardrobeCount > 0 ? t("home.avatar_items", { count: wardrobeCount }) : t("home.avatar_wardrobe")}
                  </span>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

      </div>

      {isAuthenticated && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h2 className="font-serif text-2xl">{t("home.badges_earned")}</h2>
            <Link href="/atelier" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              {t("home.view_in_atelier")} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {earnedBadges.length === 0 ? (
            <p className="text-sm text-muted-foreground/60 font-light italic">{t("home.no_badges")}</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {earnedBadges.slice(0, 5).map((badge) => (
                <Link key={badge.id} href="/atelier">
                  <div className="flex items-center gap-2 rounded-sm border border-border bg-card px-3 py-2 hover:border-primary/30 hover:shadow-sm transition-all duration-200 cursor-pointer">
                    {badge.icon_url ? (
                      <img src={badge.icon_url} alt="" className="w-5 h-5 object-contain" aria-hidden="true" />
                    ) : (
                      <span className="text-base" aria-hidden="true">🎖</span>
                    )}
                    <span className="text-sm font-light">{badge.title}</span>
                  </div>
                </Link>
              ))}
              {earnedBadges.length > 5 && (
                <Link href="/atelier">
                  <div className="flex items-center gap-2 rounded-sm border border-border/50 bg-muted/40 px-3 py-2 hover:border-primary/20 transition-all duration-200 cursor-pointer">
                    <span className="text-xs text-muted-foreground font-mono">+{earnedBadges.length - 5}</span>
                  </div>
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* Daily Quests */}
      {(dailyQuests !== null && dailyQuests.length > 0) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl border-b border-border pb-2 flex-1">{t("home.daily_quests")}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {questsLoading
              ? [1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-sm" />)
              : dailyQuests.map((quest) => (
                <div
                  key={quest.id}
                  className={`p-4 rounded-sm border transition-all ${
                    quest.completed
                      ? "border-primary/20 bg-primary/5"
                      : "border-border/60 bg-card hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className={`text-sm font-medium leading-snug ${quest.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {getQuestTitle(quest)}
                    </p>
                    {quest.completed ? (
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-label={t("home.quest_complete")} />
                    ) : (
                      isAuthenticated && (
                        <button
                          onClick={() => handleCompleteQuest(quest.id)}
                          disabled={completingQuest === quest.id}
                          className="shrink-0 text-[10px] font-mono uppercase tracking-widest text-primary/70 border border-primary/20 rounded-[2px] px-1.5 py-0.5 hover:bg-primary/5 transition-colors disabled:opacity-50"
                        >
                          {completingQuest === quest.id ? "…" : t("home.quest_mark_done")}
                        </button>
                      )
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-auto">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-primary/60">
                      {t("home.quest_reward", { points: quest.noble_score_reward })}
                    </span>
                    {quest.pillar && (
                      <span className="text-[10px] font-mono text-muted-foreground/50">
                        · {t("home.quest_pillar", { num: quest.pillar })}
                      </span>
                    )}
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      <div className="space-y-6">
        <h2 className="font-serif text-2xl border-b border-border pb-2">{t("home.continue_studies")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

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

        </div>
      </div>

      {/* ── Your situations shortcut row ── */}
      {useCasesShortlist && useCasesShortlist.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h2 className="font-serif text-2xl flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary/70" aria-hidden="true" />
              {t("home.situations")}
            </h2>
            <Link href="/use-cases" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              {t("home.situations_view_all")} <ArrowRight className="h-3.5 w-3.5" />
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

      {/* ── Registered journeys row (all authenticated users) ── */}
      {isAuthenticated && allTrips.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h2 className="font-serif text-2xl flex items-center gap-2">
              <MapPin className="h-5 w-5 text-amber-600/60" aria-hidden="true" />
              {t("home.journeys")}
            </h2>
            <Link href="/navigator" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              {t("home.navigator_alert_cta")} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {allTrips.map((trip) => {
              const region = COMPASS_REGIONS.find(r => r.code === trip.regionCode);
              const days = daysUntil(trip.departureDate);
              const departureLabel = days < 0
                ? t("navigator.arrived")
                : days === 0
                  ? t("navigator.departure_today")
                  : t("navigator.d_minus", { count: days });
              const isPast = days < -30;
              const regionUseCases = (allUseCases ?? []).filter(
                uc => uc.region_code === trip.regionCode && uc.readiness_score !== null
              );
              const readinessPct = regionUseCases.length > 0
                ? Math.round(
                    regionUseCases.reduce((sum, uc) => sum + (uc.readiness_score ?? 0), 0) /
                    regionUseCases.length
                  )
                : null;
              return (
                <Link key={trip.id} href="/navigator">
                  <Card className={`group border-border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-300 cursor-pointer ${isPast ? "opacity-60" : ""}`}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-3">
                        <span className="flex-shrink-0">{region && <FlagEmoji code={region.code} size="lg" />}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium leading-snug group-hover:text-primary transition-colors truncate">
                            {(region?.names as Record<string, string> | undefined)?.[language] ?? region?.names.en ?? trip.regionCode}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {new Date(trip.departureDate).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge variant="outline" className={`font-mono text-xs ${days < 0 ? "border-muted text-muted-foreground" : "border-amber-400/40 text-amber-600"}`}>
                            {departureLabel}
                          </Badge>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {readinessPct !== null ? `${readinessPct}% ${t("home.ready")}` : "—"}
                          </span>
                        </div>
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
