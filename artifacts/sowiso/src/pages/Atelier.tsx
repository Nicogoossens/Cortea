import {
  useGetScenarios,
  getGetScenariosQueryKey,
  useGetNobleScore,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, TrendingUp, BookOpen, Lock, UserPlus } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useActiveRegion, FlagEmoji } from "@/lib/active-region";
import { useAuth } from "@/lib/auth";
import { useState } from "react";

const PILLARS = [0, 1, 2, 3, 4, 5] as const;
const GUEST_PILLAR1_LIMIT = 3;

function scoreToDifficultyMax(score: number): number {
  if (score >= 80) return 5;
  if (score >= 60) return 4;
  if (score >= 40) return 3;
  if (score >= 20) return 2;
  return 1;
}

export default function Atelier() {
  const { t } = useLanguage();
  const { activeRegion, getRegionName } = useActiveRegion();
  const { isAuthenticated } = useAuth();
  const [selectedPillar, setSelectedPillar] = useState<number>(0);

  const isGuest = !isAuthenticated;

  const { data: nobleScore } = useGetNobleScore();
  const difficultyMax = scoreToDifficultyMax(nobleScore?.total_score ?? 0);

  const queryParams = {
    region_code: activeRegion,
    ...(selectedPillar > 0 ? { pillar: selectedPillar } : {}),
    difficulty_max: difficultyMax,
    limit: 50,
  };

  const { data: scenarios, isLoading } = useGetScenarios(queryParams, {
    query: { queryKey: [...getGetScenariosQueryKey(), activeRegion, selectedPillar, difficultyMax] }
  });

  const PILLAR_DOMAIN_NAMES: Record<number, string> = {
    1: "pillar.1.name",
    2: "pillar.2.name",
    3: "pillar.3.name",
    4: "pillar.4.name",
    5: "pillar.5.name",
  };

  // For guests: first GUEST_PILLAR1_LIMIT Pillar-1 scenarios are accessible;
  // all Pillar 2+ scenarios are always locked.
  let guestP1Slots = GUEST_PILLAR1_LIMIT;
  const processedScenarios = (scenarios ?? []).map((s) => {
    if (!isGuest) return { scenario: s, locked: false };
    if (s.pillar === 1 && guestP1Slots > 0) {
      guestP1Slots--;
      return { scenario: s, locked: false };
    }
    return { scenario: s, locked: true };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-4 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-serif text-foreground">{t("atelier.title")}</h1>
        <p className="text-muted-foreground text-lg font-light leading-relaxed">
          {t("atelier.subtitle")}
        </p>
      </div>

      {/* Active region indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FlagEmoji code={activeRegion} />
        <span className="font-medium text-foreground/80">{getRegionName(activeRegion)}</span>
        <span className="text-muted-foreground/60 text-xs">{t("atelier.region")}</span>
      </div>

      {/* Guest preview banner */}
      {isGuest && (
        <div className="flex items-start gap-3 px-5 py-4 rounded-sm border border-border/40 bg-muted/20 text-sm">
          <BookOpen className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary/60" aria-hidden="true" />
          <p className="text-foreground/80">
            <span className="font-medium">{t("atelier.guest.preview_label")}</span> — {GUEST_PILLAR1_LIMIT} {t("atelier.guest.available")}{" "}
            <Link href="/register" className="text-primary underline underline-offset-2 hover:text-primary/80">
              {t("atelier.guest.register_link")}
            </Link>{" "}
            {t("atelier.guest.register_prompt")}
          </p>
        </div>
      )}

      {/* Pillar filter tabs */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("atelier.pillar")}>
        {PILLARS.map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={selectedPillar === p}
            onClick={() => setSelectedPillar(p)}
            className={`px-4 py-1.5 text-xs font-mono uppercase tracking-widest rounded-sm transition-colors border
              ${selectedPillar === p
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground"
              }`}
          >
            {p === 0 ? t("atelier.all_pillars") : `${t("atelier.pillar")} ${p} · ${t(PILLAR_DOMAIN_NAMES[p])}`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-label={t("common.loading")} aria-live="polite">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64 rounded-sm" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedScenarios.map(({ scenario, locked }) => {
            const isPillar3Plus = scenario.pillar >= 3;

            if (locked) {
              return (
                <div key={scenario.id} className="relative group">
                  {/* Blurred card visible underneath */}
                  <Card className="h-full border-border bg-card flex flex-col opacity-60 select-none pointer-events-none">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="bg-muted text-muted-foreground font-mono text-xs rounded-sm px-2">
                          {t("atelier.pillar")} {scenario.pillar} · {t(PILLAR_DOMAIN_NAMES[scenario.pillar] ?? "pillar.1.name")}
                        </Badge>
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
                    </CardFooter>
                  </Card>

                  {/* Lock overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-sm bg-card/80 backdrop-blur-[2px] border border-border/40 p-4 text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-primary" aria-hidden="true" />
                    </div>
                    {isPillar3Plus ? (
                      <>
                        <p className="text-sm font-medium text-foreground">{t("atelier.guest.locked_premium")}</p>
                        <Link href="/profile">
                          <Button size="sm" className="font-serif gap-1.5 rounded-sm text-xs">
                            {t("atelier.guest.upgrade")}
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-foreground">
                          {scenario.pillar === 1 ? t("atelier.guest.preview_done") : t("atelier.guest.locked_account")}
                        </p>
                        <div className="flex flex-col gap-1.5 w-full">
                          <Link href="/register">
                            <Button size="sm" className="font-serif gap-1.5 rounded-sm text-xs w-full">
                              <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                              {t("atelier.guest.create_account")}
                            </Button>
                          </Link>
                          <Link href="/signin">
                            <Button size="sm" variant="outline" className="font-serif rounded-sm text-xs w-full">
                              {t("atelier.guest.signin")}
                            </Button>
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <Link key={scenario.id} href={`/atelier/${scenario.id}`} aria-label={scenario.title}>
                <Card className="h-full border-border bg-card transition-all duration-300 hover:shadow-md hover:border-primary/40 cursor-pointer flex flex-col">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="bg-muted text-muted-foreground font-mono text-xs rounded-sm px-2">
                        {t("atelier.pillar")} {scenario.pillar} · {t(PILLAR_DOMAIN_NAMES[scenario.pillar] ?? "pillar.1.name")}
                      </Badge>
                      <span className="text-xs font-medium uppercase tracking-widest text-primary/60">{scenario.difficulty_level ? "·".repeat(scenario.difficulty_level) : ""}</span>
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
                      <span className="font-serif italic text-xs">{t("atelier.refines")}</span>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            );
          })}

          {(!scenarios || scenarios.length === 0) && (
            <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-border rounded-sm bg-muted/10 space-y-4">
              <BookOpen className="w-12 h-12 mx-auto opacity-20" aria-hidden="true" />
              <p className="font-serif text-xl">{t("atelier.empty")}</p>
              <p className="text-sm max-w-sm mx-auto">
                {t("atelier.empty_region_hint")}
                <span className="font-medium inline-flex items-center gap-1 ml-1">
                  <FlagEmoji code={activeRegion} />
                  {getRegionName(activeRegion)}
                </span>.
              </p>
              <Link href="/compass">
                <button className="text-sm underline underline-offset-2 text-primary/70 hover:text-primary transition-colors">
                  {t("atelier.change_region")}
                </button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
