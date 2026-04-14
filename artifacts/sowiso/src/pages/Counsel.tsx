import { useState } from "react";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Shield, Send, Loader2, MapPin } from "lucide-react";
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

export default function Counsel() {
  const { t } = useLanguage();
  const { activeRegion, setActiveRegion, getRegionName } = useActiveRegion();

  const [query, setQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [sessionRegion, setSessionRegion] = useState<RegionCode>(activeRegion);
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!query.trim() && !selectedDomain) return;

    setIsSubmitting(true);

    const regionName = getRegionName(sessionRegion);
    const domainLabel = selectedDomain ? t(selectedDomain) : "";

    setTimeout(() => {
      setResponse(
        `In ${regionName}, matters of ${domainLabel.toLowerCase() || "etiquette"} require particular attentiveness. The situation you describe calls for restraint and deliberate grace. One must err on the side of understatement — a calm demeanour and a genuine acknowledgement of the other party's position will serve far better than insistence on one's own view. Allow a moment of pause before responding, and let your conduct reflect an awareness of local custom. A quiet, respectful pivot in the conversation will resolve this with your standing intact.`
      );
      setIsSubmitting(false);
    }, 2000);
  };

  const handleReset = () => {
    setQuery("");
    setSelectedDomain(null);
    setResponse(null);
    setSessionRegion(activeRegion);
    setShowRegionPicker(false);
  };

  const handleRegionSelect = (code: RegionCode) => {
    setSessionRegion(code);
    setActiveRegion(code);
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

      {/* Etiquette region context banner */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary/5 border border-primary/15 rounded-sm">
        <div className="flex items-center gap-2 text-sm text-foreground/80">
          <MapPin className="w-4 h-4 text-primary/70" aria-hidden="true" />
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground mr-1">
            {t("counsel.region_context")}
          </span>
          <FlagEmoji code={sessionRegion} />
          <span className="font-medium">{getRegionName(sessionRegion)}</span>
        </div>
        {!response && (
          <button
            onClick={() => setShowRegionPicker((v) => !v)}
            className="text-xs text-primary/70 hover:text-primary underline-offset-2 hover:underline transition-colors font-mono"
          >
            {t("counsel.change_region")}
          </button>
        )}
      </div>

      {/* Region picker (inline) */}
      {showRegionPicker && !response && (
        <Card className="border-border bg-card shadow-sm animate-in fade-in duration-200">
          <CardContent className="p-4">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
              {t("region.choose")}
            </div>
            <div className="flex flex-wrap gap-2">
              {COMPASS_REGIONS.map((region) => {
                const isSelected = region.code === sessionRegion;
                return (
                  <button
                    key={region.code}
                    onClick={() => handleRegionSelect(region.code)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs border transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    <FlagEmoji code={region.flag} />
                    {getRegionName(region.code)}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
                aria-required="false"
              />
            </div>

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
                    <span aria-live="assertive">{t("counsel.consulting")}</span>
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
        <div
          className="space-y-8 animate-in slide-in-from-bottom-4"
          aria-live="polite"
          aria-atomic="true"
        >
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
            <Button variant="outline" onClick={handleReset} className="font-serif">
              {t("counsel.request")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
