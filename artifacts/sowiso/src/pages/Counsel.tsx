import { useState } from "react";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Shield, Send, Loader2, MapPin, RotateCcw } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useActiveRegion, FlagEmoji, isRegionActive } from "@/lib/active-region";

const DOMAIN_KEYS = [
  "counsel.domains.dining",
  "counsel.domains.introductions",
  "counsel.domains.dress_code",
  "counsel.domains.gifting",
  "counsel.domains.digital_protocol",
  "counsel.domains.hosting",
  "counsel.domains.apologies",
] as const;

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Counsel() {
  const { t } = useLanguage();
  const { activeRegion, getRegionName } = useActiveRegion();

  const regionActive = isRegionActive(activeRegion);

  const [query, setQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!query.trim() && !selectedDomain) return;
    setIsSubmitting(true);
    setError(null);

    const domainLabel = selectedDomain ? t(selectedDomain as Parameters<typeof t>[0]) : undefined;

    try {
      const res = await fetch(`${API_BASE}/api/counsel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim() || undefined,
          domain: domainLabel,
          region_code: activeRegion,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Request failed");
      }

      const body = await res.json() as { guidance: string };
      setResponse(body.guidance);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setQuery("");
    setSelectedDomain(null);
    setResponse(null);
    setError(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-4 mb-12">
        <div className="w-16 h-16 mx-auto bg-primary/5 rounded-full flex items-center justify-center mb-6">
          <Shield className="w-8 h-8 text-primary" aria-hidden="true" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif text-foreground">{t("counsel.title")}</h1>
        <p className="text-muted-foreground text-lg font-light leading-relaxed max-w-2xl mx-auto">
          {t("counsel.subtitle")}
        </p>
      </div>

      {/* Etiquette region — read-only context note, changed via top-right bar */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-muted/40 border border-border/40 rounded-sm text-sm">
        <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          {t("counsel.region_context")}
        </span>
        <FlagEmoji code={activeRegion} />
        <span className="font-medium text-foreground/80">{getRegionName(activeRegion)}</span>
        <span className="ml-auto text-[10px] text-muted-foreground/60 hidden sm:block">
          {t("counsel.region_hint")}
        </span>
      </div>

      {!regionActive ? (
        <Card className="border-border/50 bg-muted/20 shadow-sm">
          <CardContent className="p-8 flex flex-col items-center text-center gap-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground border border-muted-foreground/20 rounded-[2px] px-2.5 py-1.5">
              <FlagEmoji code={activeRegion} />
              <span>{getRegionName(activeRegion)}</span>
              <span className="border-l border-current/20 pl-2 ml-0.5">{t("region.in_preparation")}</span>
            </div>
            <p className="text-muted-foreground font-light leading-relaxed max-w-lg">
              {t("counsel.region_unavailable")}
            </p>
          </CardContent>
        </Card>
      ) : !response ? (
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-6 md:p-8 space-y-8">
            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-foreground tracking-wide">
                {t("counsel.select_domain")}
              </legend>
              <div className="flex flex-wrap gap-2" role="group" aria-label={t("counsel.select_domain")}>
                {DOMAIN_KEYS.map((key) => {
                  const label = t(key);
                  const isSelected = selectedDomain === key;
                  return (
                    <Badge
                      key={key}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer px-4 py-1.5 rounded-sm transition-all text-sm font-normal ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:bg-muted/50 text-muted-foreground"
                      }`}
                      onClick={() => setSelectedDomain(isSelected ? null : key)}
                      role="checkbox"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === " " || e.key === "Enter")
                          setSelectedDomain(isSelected ? null : key);
                      }}
                    >
                      {label}
                    </Badge>
                  );
                })}
              </div>
            </fieldset>

            <div className="space-y-4">
              <label
                htmlFor="counsel-query"
                className="text-sm font-medium text-foreground tracking-wide block"
              >
                {t("counsel.placeholder")}
              </label>
              <Textarea
                id="counsel-query"
                placeholder={t("counsel.placeholder")}
                className="min-h-[150px] resize-none bg-background border-border/60 focus:border-primary/50 text-base p-4 rounded-sm"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive border border-destructive/30 rounded-sm px-4 py-2 bg-destructive/5" role="alert">
                {error}
              </p>
            )}

            <div className="flex justify-end pt-4 border-t border-border/30">
              <Button
                size="lg"
                className="font-serif px-8 bg-primary hover:bg-primary/90 text-primary-foreground w-full md:w-auto"
                onClick={handleSubmit}
                disabled={(!query.trim() && !selectedDomain) || isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                    <span>{t("counsel.consulting")}</span>
                  </>
                ) : (
                  <>
                    {t("counsel.request")}
                    <Send className="w-4 h-4 ml-2" aria-hidden="true" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-4" aria-live="polite" aria-atomic="true">
          <Card className="border-primary/20 bg-card shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" aria-hidden="true" />
            <CardHeader className="pb-2 pt-8 px-8">
              <CardDescription className="uppercase tracking-widest text-xs font-semibold text-primary">
                {t("counsel.guidance")}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 pt-4">
              <p className="text-xl leading-relaxed font-serif text-foreground">{response}</p>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button variant="outline" onClick={handleReset} className="font-serif gap-2">
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              {t("counsel.request")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
