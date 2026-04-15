import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Send, Loader2, MapPin, RotateCcw, ChevronDown, X, Lock, UserPlus, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useActiveRegion, COMPASS_REGIONS, FlagEmoji, type RegionCode, isRegionActive } from "@/lib/active-region";
import { useGetProfile } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useRegisterQuality } from "@/hooks/useRegisterQuality";

const DOMAIN_KEYS = [
  "counsel.domains.dining",
  "counsel.domains.introductions",
  "counsel.domains.dress_code",
  "counsel.domains.gifting",
  "counsel.domains.digital_protocol",
  "counsel.domains.hosting",
  "counsel.domains.apologies",
] as const;

type DomainKey = typeof DOMAIN_KEYS[number];

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const BASIC_QUESTION_LIMIT = 5;
const BASIC_FREE_DOMAINS: DomainKey[] = ["counsel.domains.dining"];

function getStoredQuestionCount(userId: string | null): number {
  if (!userId) return 0;
  return parseInt(localStorage.getItem(`counsel_q_${userId}`) ?? "0", 10);
}

function incrementStoredCount(userId: string | null): void {
  if (!userId) return;
  const count = getStoredQuestionCount(userId);
  localStorage.setItem(`counsel_q_${userId}`, String(count + 1));
}

export default function Counsel() {
  const { t, locale } = useLanguage();
  const { activeRegion, getRegionName } = useActiveRegion();
  const { result: qualityResult, checking: qualityChecking, check: checkQuality, reset: resetQuality } = useRegisterQuality(locale);
  const { data: profile } = useGetProfile();
  const { userId, isAuthenticated } = useAuth();

  const regionActive = isRegionActive(activeRegion);
  const tier = profile?.subscription_tier ?? "guest";
  const isRegistered = isAuthenticated && !!userId;
  const hasFullAccess = tier === "traveller" || tier === "ambassador";
  const hasBasicAccess = isRegistered && !hasFullAccess;
  const isGuest = !isRegistered;

  const [questionCount, setQuestionCount] = useState(0);
  useEffect(() => {
    setQuestionCount(getStoredQuestionCount(userId ?? null));
  }, [userId]);

  const questionsRemaining = Math.max(0, BASIC_QUESTION_LIMIT - questionCount);
  const basicLimitReached = hasBasicAccess && questionsRemaining === 0;

  const [query, setQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<DomainKey | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [sessionRegion, setSessionRegion] = useState<RegionCode | null>(null);
  const [showRegionPicker, setShowRegionPicker] = useState(false);

  const effectiveRegion: RegionCode = sessionRegion ?? activeRegion;
  const isOverriding = sessionRegion !== null;

  function isDomainAccessible(key: DomainKey): boolean {
    if (hasFullAccess) return true;
    if (hasBasicAccess && !basicLimitReached) return BASIC_FREE_DOMAINS.includes(key);
    return false;
  }

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

      if (hasBasicAccess) {
        incrementStoredCount(userId ?? null);
        setQuestionCount((c) => c + 1);
      }
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
    resetQuality();
  };

  const canSubmit = selectedDomain
    ? isDomainAccessible(selectedDomain) && (query.trim().length > 0 || selectedDomain !== null)
    : false;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="text-center space-y-4 mb-8">
        <div className="w-16 h-16 mx-auto bg-primary/5 rounded-full flex items-center justify-center mb-6">
          <Shield className="w-8 h-8 text-primary" aria-hidden="true" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif text-foreground">{t("counsel.title")}</h1>
        <p className="text-muted-foreground text-lg font-light leading-relaxed max-w-2xl mx-auto">
          {t("counsel.subtitle")}
        </p>
      </div>

      {/* ── Domain Overview — always visible ── */}
      <div className="space-y-3">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/70 px-0.5">
          {t("counsel.select_domain")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DOMAIN_KEYS.map((key) => {
            const label = t(key as Parameters<typeof t>[0]);
            const accessible = isDomainAccessible(key);
            const isSelected = selectedDomain === key;
            const isBasicFree = BASIC_FREE_DOMAINS.includes(key);

            return (
              <button
                key={key}
                onClick={() => {
                  if (!accessible) return;
                  setSelectedDomain(isSelected ? null : key);
                  setResponse(null);
                  setError(null);
                }}
                disabled={!accessible}
                aria-pressed={isSelected}
                className={`group relative flex items-center justify-between gap-3 px-5 py-4 rounded-sm border text-left transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : accessible
                    ? "border-border/60 hover:border-primary/40 hover:bg-muted/30 text-foreground cursor-pointer"
                    : "border-border/30 bg-muted/10 text-muted-foreground/50 cursor-default"
                }`}
              >
                <span className="font-light text-sm tracking-wide">{label}</span>
                <span className="flex items-center gap-1.5 shrink-0">
                  {!accessible && (
                    <Lock className="w-3.5 h-3.5 opacity-40" aria-hidden="true" />
                  )}
                  {hasBasicAccess && isBasicFree && !isSelected && accessible && (
                    <span className="text-[10px] font-mono uppercase tracking-widest text-primary/60 border border-primary/20 rounded-[2px] px-1.5 py-0.5">
                      {t("counsel.domains.remaining").replace("{count}", String(questionsRemaining))}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Access Gate: Guest (not registered) ── */}
      {isGuest && (
        <div className="border border-border/40 rounded-sm bg-muted/10 px-6 py-8 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t("nav.counsel")}</span>
          </div>
          <p className="text-muted-foreground font-light leading-relaxed">
            {t("counsel.gate.guest_desc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Link href="/signin">
              <div className="inline-flex items-center gap-2 text-sm text-primary cursor-pointer hover:underline underline-offset-2 group">
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                {t("counsel.gate.guest_cta")}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* ── Access Gate: Basic user limit reached ── */}
      {hasBasicAccess && basicLimitReached && (
        <div className="border border-border/40 rounded-sm bg-muted/10 px-6 py-8 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t("nav.counsel")}</span>
          </div>
          <p className="text-muted-foreground font-light leading-relaxed">
            {t("counsel.gate.limit_desc").replace("{count}", String(BASIC_QUESTION_LIMIT))}
          </p>
          <Link href="/membership">
            <div className="inline-flex items-center gap-2 mt-2 text-sm text-primary cursor-pointer hover:underline underline-offset-2 group">
              {t("counsel.gate.limit_cta")}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </div>
          </Link>
        </div>
      )}

      {/* ── Active consultation form ── */}
      {selectedDomain && isDomainAccessible(selectedDomain) && !response && !basicLimitReached && (
        <>
          {/* Region strip */}
          {regionActive && (
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

              {showRegionPicker && (
                <div className="flex flex-wrap gap-1.5 px-1 animate-in fade-in duration-150">
                  {COMPASS_REGIONS.map((region) => {
                    const isRegionSelected = region.code === effectiveRegion;
                    return (
                      <button
                        key={region.code}
                        onClick={() => { setSessionRegion(region.code); setShowRegionPicker(false); }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs border transition-all ${
                          isRegionSelected
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
          )}

          {!regionActive && (
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
          )}

          {regionActive && (
            <Card className="border-border bg-card shadow-sm">
              <CardContent className="p-6 md:p-8 space-y-6">
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
                    onChange={(e) => {
                      setQuery(e.target.value);
                      checkQuality(e.target.value);
                    }}
                  />
                  {qualityChecking && (
                    <p className="text-xs text-muted-foreground/50 font-mono flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {t("counsel.quality_checking")}
                    </p>
                  )}
                  {!qualityChecking && qualityResult && !qualityResult.pass && qualityResult.hint && (
                    <div className="border border-amber-200/60 bg-amber-50/40 dark:bg-amber-900/10 dark:border-amber-800/40 rounded-sm px-4 py-3 space-y-1">
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-400 tracking-wide uppercase">
                        {t("counsel.register_suggestion")}
                      </p>
                      <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                        {qualityResult.hint}
                      </p>
                    </div>
                  )}
                </div>

                {hasBasicAccess && (
                  <p className="text-xs text-muted-foreground/60 font-mono">
                    {t("counsel.consultations_remaining")
                      .replace("{remaining}", String(questionsRemaining))
                      .replace("{limit}", String(BASIC_QUESTION_LIMIT))}
                  </p>
                )}

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
                    disabled={!query.trim() || isSubmitting}
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
          )}
        </>
      )}

      {/* ── Response ── */}
      {response && (
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
