import { useState, useRef, useEffect, useCallback } from "react";
import { useGetProfile } from "@workspace/api-client-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TierGate } from "@/components/TierGate";
import { LockOverlay } from "@/components/LockOverlay";
import { useAuth } from "@/lib/auth";
import { usePrivacy } from "@/lib/privacy";
import { useLanguage } from "@/lib/i18n";
import { Link } from "wouter";
import { Mic, MicOff, Volume2, ShieldAlert, AlertTriangle, CheckCircle2 } from "lucide-react";

type VenueContext = "restaurant" | "gallery" | "conference";

const VENUE_THRESHOLDS: Record<VenueContext, { label: string; maxDb: number; description: string }> = {
  restaurant: { label: "Restaurant", maxDb: 65, description: "Convivial yet composed. Conversation should carry no further than your table." },
  gallery: { label: "Gallery", maxDb: 45, description: "Hushed reverence. Voices should barely disturb the contemplative silence." },
  conference: { label: "Conference", maxDb: 70, description: "Professional clarity. Measured tones suit the boardroom register." },
};

function DecibelBar({ db, maxDb, thresholdLabel }: { db: number; maxDb: number; thresholdLabel: string }) {
  const pct = Math.min(100, Math.max(0, (db / 100) * 100));
  const safe = db <= maxDb;
  const warning = db > maxDb - 5 && db <= maxDb;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs text-muted-foreground font-mono">
        <span>0 dB</span>
        <span className={`font-semibold text-base ${safe ? (warning ? "text-amber-600" : "text-foreground") : "text-destructive"}`}>
          {db.toFixed(1)} dB
        </span>
        <span>100 dB</span>
      </div>
      <div className="relative h-3 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-100 ${
            !safe ? "bg-destructive" : warning ? "bg-amber-400" : "bg-emerald-500"
          }`}
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-foreground/40"
          style={{ left: `${(maxDb / 100) * 100}%` }}
          title={`${thresholdLabel}: ${maxDb} dB`}
        />
      </div>
      <div className="flex justify-end">
        <span className="text-xs text-muted-foreground font-mono">{thresholdLabel}: {maxDb} dB</span>
      </div>
    </div>
  );
}

export default function Sensory() {
  usePageTitle("Sensory");
  const { data: profile } = useGetProfile();
  const { isAuthenticated } = useAuth();
  const { canUseMicrophone } = usePrivacy();
  const { t } = useLanguage();

  const tier = profile?.subscription_tier ?? "guest";
  const hasAccess = isAuthenticated && tier === "ambassador";

  const [venue, setVenue] = useState<VenueContext>("restaurant");
  const [isListening, setIsListening] = useState(false);
  const [db, setDb] = useState(0);
  const [denied, setDenied] = useState(false);
  const [tooLoud, setTooLoud] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const vibrateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastVibrateRef = useRef<number>(0);
  const VIBRATE_COOLDOWN_MS = 5000;

  const stopListening = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (contextRef.current) contextRef.current.close();
    if (vibrateTimeoutRef.current) clearTimeout(vibrateTimeoutRef.current);
    streamRef.current = null;
    contextRef.current = null;
    analyserRef.current = null;
    lastVibrateRef.current = 0;
    setIsListening(false);
    setDb(0);
    setTooLoud(false);
  }, []);

  const measureLoop = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    const rms = Math.sqrt(data.reduce((sum, v) => sum + v * v, 0) / data.length);
    const decibels = 20 * Math.log10(rms / 128 + 0.001) + 60;
    const clamped = Math.max(0, Math.min(100, decibels));

    setDb(clamped);

    animFrameRef.current = requestAnimationFrame(measureLoop);
  }, []);

  useEffect(() => {
    if (!isListening) return;
    const threshold = VENUE_THRESHOLDS[venue].maxDb;
    if (db > threshold) {
      setTooLoud(true);
      const now = Date.now();
      if ("vibrate" in navigator && now - lastVibrateRef.current > VIBRATE_COOLDOWN_MS) {
        lastVibrateRef.current = now;
        navigator.vibrate([200, 100, 200]);
      }
    } else {
      setTooLoud(false);
    }
  }, [db, venue, isListening]);

  const startListening = useCallback(async () => {
    if (!canUseMicrophone) return;
    setDenied(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      contextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      setIsListening(true);
      animFrameRef.current = requestAnimationFrame(measureLoop);
    } catch {
      setDenied(true);
    }
  }, [canUseMicrophone, measureLoop]);

  useEffect(() => () => stopListening(), [stopListening]);

  if (!hasAccess) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-serif text-foreground">{t("sensory.title")}</h1>
            <Badge variant="outline" className="font-mono text-xs tracking-widest uppercase border-amber-400/40 text-amber-600">Ambassador</Badge>
          </div>
          <p className="text-muted-foreground text-lg font-light max-w-2xl">
            {t("sensory.gated_subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <div className="relative rounded-sm overflow-hidden bg-muted border border-border p-8 flex flex-col items-center justify-center gap-6 min-h-[240px]">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted-foreground blur-[2px]" aria-hidden="true">
                <Volume2 className="h-10 w-10 opacity-20" />
                <p className="text-sm font-light">{t("sensory.activate")}.</p>
              </div>
              <LockOverlay
                requiredTier="ambassador"
                teaser="Monitor your ambient sound level and receive discreet haptic alerts when the setting demands silence."
                isAuthenticated={isAuthenticated}
                variant="section"
              />
            </div>
          </div>
          <div className="lg:col-span-2">
            <TierGate feature="Sensory Awareness" requiredTier="ambassador" isAuthenticated={isAuthenticated} teaser="Know when to lower your voice. Receive a discreet alert when ambient sound exceeds the threshold for your venue." />
          </div>
        </div>
      </div>
    );
  }

  const venueInfo = VENUE_THRESHOLDS[venue];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-serif text-foreground">{t("sensory.title")}</h1>
          <Badge variant="outline" className="font-mono text-xs tracking-widest uppercase border-amber-400/40 text-amber-600">Ambassador</Badge>
        </div>
        <p className="text-muted-foreground text-lg font-light max-w-2xl">
          {t("sensory.subtitle")}
        </p>
      </div>

      {!canUseMicrophone && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-4 text-sm">
            <ShieldAlert className="h-4 w-4 text-destructive flex-shrink-0" />
            <span className="text-destructive">
              {t("sensory.mic_disabled")}{" "}
              <Link href="/privacy" className="underline underline-offset-2">Visit Privacy</Link>
              {" "}to adjust your preferences.
            </span>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="uppercase tracking-widest text-xs font-semibold">{t("sensory.venue_context")}</CardDescription>
              <CardTitle className="font-serif text-xl">{t("sensory.where_are_you")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(Object.keys(VENUE_THRESHOLDS) as VenueContext[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setVenue(v)}
                  className={`w-full text-left px-4 py-3 rounded-sm border transition-all ${
                    venue === v
                      ? "border-primary/40 bg-primary/5 text-foreground"
                      : "border-border/40 bg-muted/20 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{VENUE_THRESHOLDS[v].label}</span>
                    <span className="text-xs font-mono text-muted-foreground">≤ {VENUE_THRESHOLDS[v].maxDb} dB</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 font-light">{VENUE_THRESHOLDS[v].description}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            {!isListening ? (
              <Button onClick={startListening} disabled={!canUseMicrophone} className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                {t("sensory.activate")}
              </Button>
            ) : (
              <Button onClick={stopListening} variant="outline" className="flex items-center gap-2">
                <MicOff className="h-4 w-4" />
                {t("sensory.stop")}
              </Button>
            )}
          </div>

          {denied && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="flex items-center gap-3 py-4 text-sm text-destructive">
                <MicOff className="h-4 w-4 flex-shrink-0" />
                {t("sensory.mic_denied")}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          {isListening ? (
            <>
              <Card className={`border transition-all duration-300 ${tooLoud ? "border-destructive/50 bg-destructive/5" : "border-border"}`}>
                <CardHeader className="pb-2">
                  <CardDescription className="uppercase tracking-widest text-xs font-semibold">
                    {t("sensory.live_reading")} — {venueInfo.label}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <DecibelBar db={db} maxDb={venueInfo.maxDb} thresholdLabel={t("sensory.threshold")} />

                  <div className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm ${
                    tooLoud ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-700"
                  }`}>
                    {tooLoud ? (
                      <>
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <span className="font-medium">{t("sensory.exceeds_range", { venue: venueInfo.label })}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                        <span className="font-medium">{t("sensory.within_range", { venue: venueInfo.label })}</span>
                      </>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground font-light leading-relaxed">
                    {t("sensory.privacy_note")}
                  </p>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-border/40 bg-muted/10">
              <CardHeader>
                <CardTitle className="font-serif text-lg text-muted-foreground">{t("sensory.awaiting")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground font-light leading-relaxed">
                  {t("sensory.awaiting_desc")}
                </p>
                <div className="space-y-2 pt-2">
                  {[
                    "No audio is recorded or transmitted",
                    "Haptic feedback requires a supported device",
                    "Analysis runs entirely in your browser",
                  ].map((tip, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="h-1 w-1 rounded-full bg-primary/50 flex-shrink-0" />
                      <span className="font-light">{tip}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
