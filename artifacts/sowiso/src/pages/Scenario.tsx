import { useGetScenario, useSubmitScenarioAnswer, getGetScenarioQueryKey } from "@workspace/api-client-react";
import { useParams, useLocation, Link } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Check, X, ShieldAlert, BookOpen, FileText, Sparkles, Flame, Shirt } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { levelKey } from "@/lib/content-labels";
import { useToast } from "@/hooks/use-toast";

type ScenarioMode = "classic" | "story";

function scoreDeltaKey(delta: number): string {
  if (delta > 0) return "profile.log.refined";
  if (delta < 0) return "profile.log.reconsidered";
  return "profile.log.observed";
}

const REGIONS_WITH_ORIGINS = [
  "GB", "CN", "CA",
  "JP", "DE", "FR", "IT", "BE", "CH", "SG", "IN",
  "MX", "BR", "ES", "CO", "AE", "US", "NL", "PT", "ZA",
];

export default function Scenario() {
  usePageTitle("Practice Scenario");
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const scenarioId = parseInt(id || "0", 10);
  const lang = locale.split("-")[0];

  const { data: scenario, isLoading } = useGetScenario(scenarioId, { lang }, {
    query: { enabled: !!scenarioId, queryKey: getGetScenarioQueryKey(scenarioId, { lang }), staleTime: 0 }
  });

  const submitAnswer = useSubmitScenarioAnswer();

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [result, setResult] = useState<{
    mentor_feedback: string;
    score_delta: number;
    level_up: boolean;
    new_level_name?: string | null;
    new_unlock?: { id: string; name: string; region: string; pillar: number; unlocked_at: string } | null;
    streak_milestone?: number | null;
  } | null>(null);
  const [mode, setMode] = useState<ScenarioMode>(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("scenario_mode") : null;
    return (stored === "story" || stored === "classic") ? stored : "classic";
  });
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("scenario_mode", mode);
  }, [mode]);

  useEffect(() => {
    startTime.current = Date.now();
  }, [scenarioId]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6" aria-label={t("common.loading")} aria-live="polite">
        <Skeleton className="h-8 w-24 mb-8" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-32 w-full" />
        <div className="space-y-4 mt-8">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="text-center py-20">
        <ShieldAlert className="w-12 h-12 mx-auto text-muted-foreground mb-4" aria-hidden="true" />
        <h2 className="font-serif text-2xl">{t("scenario.not_found")}</h2>
        <Button variant="link" onClick={() => setLocation("/atelier")} className="mt-4">
          {t("scenario.return_atelier")}
        </Button>
      </div>
    );
  }

  const handleSelect = (index: number) => {
    if (result) return;
    setSelectedOption(index);
  };

  const handleSubmit = () => {
    if (selectedOption === null || result) return;

    const timeTaken = Math.floor((Date.now() - startTime.current) / 1000);

    submitAnswer.mutate(
      {
        data: {
          scenario_id: scenarioId,
          selected_option_index: selectedOption,
          time_taken_seconds: timeTaken,
          lang,
        }
      },
      {
        onSuccess: (data) => {
          setResult(data);
          if (data.new_unlock) {
            toast({
              title: t("scenario.unlock_toast_title"),
              description: t("scenario.unlock_toast_desc", { name: data.new_unlock.name }),
            });
          }
          if (data.streak_milestone) {
            toast({
              title: t("scenario.streak_toast_title", { days: data.streak_milestone }),
              description: t("scenario.streak_toast_desc"),
            });
          }
        }
      }
    );
  };

  const regionCode = scenario.region_code?.toUpperCase() ?? "";
  const hasOriginsForRegion = REGIONS_WITH_ORIGINS.includes(regionCode);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between gap-4 mb-4">
        <Link href="/atelier" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
          {t("scenario.return_atelier")}
        </Link>

        <div className="inline-flex items-center rounded-sm border border-border/60 p-0.5 bg-muted/20" role="tablist" aria-label={t("scenario.story_mode")}>
          <button
            onClick={() => setMode("classic")}
            role="tab"
            aria-selected={mode === "classic"}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest rounded-[2px] transition-all ${
              mode === "classic" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="w-3 h-3" aria-hidden="true" />
            {t("scenario.classic_mode")}
          </button>
          <button
            onClick={() => setMode("story")}
            role="tab"
            aria-selected={mode === "story"}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest rounded-[2px] transition-all ${
              mode === "story" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="w-3 h-3" aria-hidden="true" />
            {t("scenario.story_mode")}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3 text-sm text-primary font-mono tracking-widest uppercase">
          <span>{t("scenario.pillar")} {scenario.pillar}</span>
          <span className="w-1 h-1 rounded-full bg-primary/50" aria-hidden="true" />
          <span>{scenario.region_code}</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-serif text-foreground">{scenario.title}</h1>

        {mode === "story" ? (
          <div className="relative space-y-6 animate-in fade-in duration-500">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" aria-hidden="true" />
            <div className="pl-6 md:pl-8">
              <div className="text-[10px] font-mono uppercase tracking-widest text-primary/60 mb-2">
                {t("scenario.pillar")} {scenario.pillar} · {scenario.region_code}
              </div>
              <p className="font-serif text-xl md:text-2xl leading-relaxed text-foreground/90 italic first-letter:text-5xl first-letter:float-left first-letter:font-serif first-letter:mr-2 first-letter:leading-none first-letter:text-primary">
                {scenario.content_json.situation}
              </p>
            </div>
            <div className="pl-6 md:pl-8 pt-2">
              <p className="font-serif text-lg text-foreground/80">
                {scenario.content_json.question}
              </p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 mt-3">
                {t("scenario.story_choose")}
              </p>
            </div>
          </div>
        ) : (
          <div className="prose prose-stone dark:prose-invert max-w-none text-lg font-light leading-relaxed bg-card p-6 md:p-8 rounded-sm border border-border shadow-sm">
            {scenario.content_json.situation}
          </div>
        )}

        {mode === "classic" && <h2 className="text-xl font-serif mt-8 mb-6">{scenario.content_json.question}</h2>}

        <div className="space-y-4" role="radiogroup" aria-label={scenario.content_json.question}>
          {scenario.content_json.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const showCorrect = result && option.correct;
            const showIncorrect = result && isSelected && !option.correct;

            let cardClass = "border-border cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5";
            if (isSelected && !result) cardClass = "border-primary bg-primary/5 ring-1 ring-primary/20";
            if (showCorrect) cardClass = "border-green-600/50 bg-green-500/5 dark:bg-green-500/10";
            if (showIncorrect) cardClass = "border-red-600/50 bg-red-500/5 dark:bg-red-500/10";
            if (result && !isSelected && !option.correct) cardClass = "border-border/50 opacity-50 cursor-default";

            return (
              <Card
                key={index}
                className={cardClass}
                onClick={() => handleSelect(index)}
                role="radio"
                aria-checked={isSelected}
                tabIndex={result ? -1 : 0}
                onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") handleSelect(index); }}
              >
                <CardContent className="p-4 md:p-6 flex gap-4">
                  <div className="pt-1 flex-shrink-0" aria-hidden="true">
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center
                      ${isSelected && !result ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"}
                      ${showCorrect ? "border-green-600 bg-green-600 text-white" : ""}
                      ${showIncorrect ? "border-red-600 bg-red-600 text-white" : ""}
                    `}>
                      {showCorrect && <Check className="w-4 h-4" />}
                      {showIncorrect && <X className="w-4 h-4" />}
                      {!result && isSelected && <div className="w-2.5 h-2.5 rounded-full bg-current" />}
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className={`text-base ${result && !isSelected && !option.correct ? "text-muted-foreground" : "text-foreground"}`}>
                      {option.text}
                    </p>
                    {result && (showCorrect || showIncorrect) && (
                      <p className={`text-sm mt-3 pt-3 border-t ${showCorrect ? "border-green-600/20 text-green-700 dark:text-green-400" : "border-red-600/20 text-red-700 dark:text-red-400"}`}>
                        {option.explanation}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {!result && (
        <div className="pt-6 flex justify-end">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={selectedOption === null || submitAnswer.isPending}
            className="w-full md:w-auto font-serif tracking-wide px-10 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {submitAnswer.isPending ? t("scenario.submitting") : t("scenario.confirm")}
          </Button>
        </div>
      )}

      {result && (
        <>
          <Card className="mt-8 border-primary/20 bg-primary/5 shadow-md animate-in slide-in-from-bottom-4" aria-live="polite" aria-atomic="true">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-primary" aria-hidden="true" />
                {t("scenario.mentor_counsel")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg leading-relaxed font-serif italic text-foreground/90">
                "{t(result.mentor_feedback)}"
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-t border-border/50 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-widest font-mono">{t("scenario.impact")}</span>
                  <div className={`text-sm font-mono uppercase tracking-widest ${result.score_delta > 0 ? "text-green-600" : result.score_delta < 0 ? "text-red-600" : "text-muted-foreground"}`}>
                    {t(scoreDeltaKey(result.score_delta))}
                  </div>
                </div>

                {result.level_up && result.new_level_name && (
                  <div className="bg-secondary/20 text-secondary-foreground px-4 py-2 rounded-sm text-center border border-secondary/30">
                    <div className="text-xs uppercase tracking-widest mb-1 opacity-80">{t("scenario.promotion")}</div>
                    <div className="font-serif font-medium">{t("scenario.elevated_to")} {t(levelKey(result.new_level_name))}</div>
                  </div>
                )}
              </div>

              {result.new_unlock && (
                <div
                  className="flex items-start gap-4 p-4 rounded-sm border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-amber-500/5 animate-in fade-in zoom-in-95 duration-700"
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-sm bg-amber-500/20 flex items-center justify-center">
                    <Shirt className="w-5 h-5 text-amber-700 dark:text-amber-400" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-mono text-amber-700 dark:text-amber-400 mb-1">
                      <Sparkles className="w-3 h-3" aria-hidden="true" />
                      {t("scenario.unlock_banner_label")}
                    </div>
                    <div className="font-serif text-lg text-foreground">{result.new_unlock.name}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{t("scenario.unlock_banner_desc")}</div>
                  </div>
                </div>
              )}

              {result.streak_milestone && (
                <div
                  className="flex items-start gap-4 p-4 rounded-sm border border-orange-500/40 bg-gradient-to-br from-orange-500/10 to-orange-500/5 animate-in fade-in zoom-in-95 duration-700"
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-sm bg-orange-500/20 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-orange-700 dark:text-orange-400" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs uppercase tracking-widest font-mono text-orange-700 dark:text-orange-400 mb-1">
                      {t("scenario.streak_banner_label")}
                    </div>
                    <div className="font-serif text-lg text-foreground">
                      {t("scenario.streak_banner_title", { days: result.streak_milestone })}
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5">{t("scenario.streak_banner_desc")}</div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-background/50 border-t border-border/50 py-4 flex justify-end">
              <Button variant="outline" onClick={() => setLocation("/atelier")} className="font-serif">
                {t("scenario.return_atelier")}
              </Button>
            </CardFooter>
          </Card>

          {/* Verdiep je verder — deeplink to Compass historical context */}
          {hasOriginsForRegion && regionCode && (
            <Link
              href={`/compass/${regionCode}`}
              className="group block animate-in slide-in-from-bottom-4 duration-500"
              aria-label={t("scenario.go_deeper_cta", { region: regionCode })}
            >
              <div className="border border-border/50 hover:border-primary/40 bg-muted/20 hover:bg-primary/5 rounded-sm p-5 flex items-start gap-4 transition-all">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-9 h-9 rounded-sm bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <BookOpen className="w-4 h-4 text-primary" aria-hidden="true" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono uppercase tracking-widest text-primary mb-1">{t("scenario.go_deeper")}</p>
                  <p className="text-sm text-foreground/80 leading-snug">{t("scenario.go_deeper_desc")}</p>
                </div>
                <ArrowLeft className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0 rotate-180 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </div>
            </Link>
          )}
        </>
      )}
    </div>
  );
}
