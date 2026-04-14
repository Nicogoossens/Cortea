import { useState } from "react";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Shield, Send, Loader2, MapPin, RotateCcw, ChevronDown, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useActiveRegion, COMPASS_REGIONS, FlagEmoji, type RegionCode } from "@/lib/active-region";

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

  const [query, setQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Session-only region override — does NOT mutate the stored profile region. */
  const [sessionRegion, setSessionRegion] = useState<RegionCode | null>(null);
  const [showRegionPicker, setShowRegionPicker] = useState(false);

  /** The effective region for this consultation. */
  const effectiveRegion: RegionCode = sessionRegion ?? activeRegion;
  const isOverriding = sessionRegion !== null;

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
          region_code: effectiveRegion,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Request failed");
      }

      const body = await res.json() as { guidance: string };
      setResponse(body.guidance);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setQuery("");
    setSelectedDomain(null);
    setResponse(null);
    setError(null);
    setShowRegionPicker(false);
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

      {/* ── Region context strip with session override ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-muted/40 border border-border/40 rounded-sm text-sm flex-wrap gap-y-1.5">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            {isOverriding ? t("counsel.session_override_label") : t("counsel.region_context")}
          </span>
          <FlagEmoji code={effectiveRegion} />
          <span className="font-medium text-foreground/80">{getRegionName(effectiveRegion)}</span>
          {isOverriding && (
            <button
              onClick={() => { setSessionRegion(null); setShowRegionPicker(false); }}
              className="ml-auto flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-primary hover:text-primary/70 border border-primary/20 rounded-[2px] px-1.5 py-0.5 transition-colors"
              aria-label={t("counsel.session_override_reset")}
            >
              <X className="w-3 h-3" aria-hidden="true" />
              {t("counsel.session_override_reset")}
            </button>
          )}
          {!isOverriding && (
            <button
              onClick={() => setShowRegionPicker((v) => !v)}
              aria-expanded={showRegionPicker}
              className="ml-auto flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 hover:text-primary border border-muted-foreground/20 rounded-[2px] px-1.5 py-0.5 transition-colors"
            >
              {t("counsel.session_override_change")}
              <ChevronDown className={`w-3 h-3 transition-transform ${showRegionPicker ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Session region picker — appears inline when requested */}
        {showRegionPicker && (
          <div className="flex flex-wrap gap-1.5 px-1 animate-in fade-in duration-150">
            {COMPASS_REGIONS.map((region) => {
              const isSelected = region.code === effectiveRegion;
              return (
                <button
                  key={region.code}
                  onClick={() => { setSessionRegion(region.code); setShowRegionPicker(false); }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs border transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/30"
                  }`}
                >
                  <FlagEmoji code={region.flag} />
                  {getRegionName(region.code)}
                </button>
              );
            })}
          </div>
        )}

        {isOverriding && (
          <p className="text-[10px] text-muted-foreground/50 font-mono px-1">
            {t("counsel.session_override_hint")}
          </p>
        )}
      </div>

      {!response ? (
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
