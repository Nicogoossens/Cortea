import { useGetScenario, useSubmitScenarioAnswer, getGetScenarioQueryKey } from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Check, X, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/i18n";

export default function Scenario() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const scenarioId = parseInt(id || "0", 10);

  const { data: scenario, isLoading } = useGetScenario(scenarioId, {
    query: { enabled: !!scenarioId, queryKey: getGetScenarioQueryKey(scenarioId) }
  });

  const submitAnswer = useSubmitScenarioAnswer();

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [result, setResult] = useState<{
    mentor_feedback: string;
    score_delta: number;
    level_up: boolean;
    new_level_name?: string;
  } | null>(null);
  const startTime = useRef(Date.now());

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
          time_taken_seconds: timeTaken
        }
      },
      {
        onSuccess: (data) => {
          setResult(data);
        }
      }
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <Link href="/atelier" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
        {t("scenario.return_atelier")}
      </Link>

      <div className="space-y-6">
        <div className="flex items-center gap-3 text-sm text-primary font-mono tracking-widest uppercase">
          <span>{t("scenario.pillar")} {scenario.pillar}</span>
          <span className="w-1 h-1 rounded-full bg-primary/50" aria-hidden="true" />
          <span>{scenario.region_code}</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-serif text-foreground">{scenario.title}</h1>

        <div className="prose prose-stone dark:prose-invert max-w-none text-lg font-light leading-relaxed bg-card p-6 md:p-8 rounded-sm border border-border shadow-sm">
          {scenario.content_json.situation}
        </div>

        <h2 className="text-xl font-serif mt-8 mb-6">{scenario.content_json.question}</h2>

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
        <Card className="mt-8 border-primary/20 bg-primary/5 shadow-md animate-in slide-in-from-bottom-4" aria-live="polite" aria-atomic="true">
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-primary" aria-hidden="true" />
              {t("scenario.mentor_counsel")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg leading-relaxed font-serif italic text-foreground/90">
              "{result.mentor_feedback}"
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-t border-border/50 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-widest font-mono">{t("scenario.impact")}</span>
                <div className={`text-sm font-mono uppercase tracking-widest ${result.score_delta > 0 ? "text-green-600" : result.score_delta < 0 ? "text-red-600" : "text-muted-foreground"}`}>
                  {result.score_delta > 0 ? "Refined" : result.score_delta < 0 ? "Reconsidered" : "Observed"}
                </div>
              </div>

              {result.level_up && result.new_level_name && (
                <div className="bg-secondary/20 text-secondary-foreground px-4 py-2 rounded-sm text-center border border-secondary/30">
                  <div className="text-xs uppercase tracking-widest mb-1 opacity-80">{t("scenario.promotion")}</div>
                  <div className="font-serif font-medium">{t("scenario.elevated_to")} {result.new_level_name}</div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="bg-background/50 border-t border-border/50 py-4 flex justify-end">
            <Button variant="outline" onClick={() => setLocation("/atelier")} className="font-serif">
              {t("scenario.return_atelier")}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
