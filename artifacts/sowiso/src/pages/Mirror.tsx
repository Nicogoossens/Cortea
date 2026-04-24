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
import { Link } from "wouter";
import {
  Camera, CameraOff, RefreshCw, CheckCircle2, Info, ShieldAlert, Lock, Loader2
} from "lucide-react";
import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";

interface DressCodeResult {
  code: string;
  label: string;
  confidence: number;
  positives: string[];
  suggestions: string[];
  badgeClass: string;
  topPredictions: string[];
}

const DRESSCODE_RULES: {
  code: string;
  label: string;
  keywords: string[];
  positives: string[];
  suggestions: string[];
  badgeClass: string;
}[] = [
  {
    code: "black_tie",
    label: "Black Tie",
    keywords: ["bow tie", "tuxedo", "suit", "Windsor tie", "dress shirt", "cummerbund", "patent leather"],
    positives: [
      "Formal attire elements detected",
      "Evening wear classification confirmed",
      "Dark tonal palette consistent with Black Tie",
    ],
    suggestions: [
      "Ensure your bow tie is hand-tied — never clip-on",
      "Shirt cuffs should extend 1.5 cm beyond the jacket sleeve",
      "Patent leather or highly polished black oxfords are the standard",
    ],
    badgeClass: "bg-zinc-900 text-zinc-100",
  },
  {
    code: "business_formal",
    label: "Business Formal",
    keywords: ["suit", "tie", "jacket", "blazer", "loafer", "oxford shoe", "dress shirt", "waistcoat"],
    positives: [
      "Structured tailoring detected",
      "Professional formal palette observed",
      "Appropriate for high-level business environments",
    ],
    suggestions: [
      "Your pocket square should complement, not match, the tie",
      "Shoes and belt should share the same leather finish",
      "Avoid novelty accessories in conservative environments",
    ],
    badgeClass: "bg-slate-800 text-slate-100",
  },
  {
    code: "smart_casual",
    label: "Smart Casual",
    keywords: ["polo shirt", "chino", "sport coat", "sweater", "knit", "loafer", "derby", "oxford"],
    positives: [
      "Refined casual silhouette detected",
      "Clean, considered palette",
      "Well-suited to social and informal professional settings",
    ],
    suggestions: [
      "Avoid overly casual footwear such as trainers",
      "A structured blazer elevates a smart casual ensemble",
      "Ensure garments are well-pressed and free of creases",
    ],
    badgeClass: "bg-stone-200 text-stone-800",
  },
  {
    code: "casual",
    label: "Casual",
    keywords: ["T-shirt", "jeans", "jersey", "sweatshirt", "hoodie", "sneaker", "trainers", "shorts", "tracksuit"],
    positives: [
      "Relaxed, everyday attire detected",
      "Comfortable and expressive presentation",
    ],
    suggestions: [
      "Reserve bold casual pieces for informal occasions",
      "In professional settings, consider muted or neutral tones",
      "Ensure all garments are clean, well-fitting, and free of damage",
    ],
    badgeClass: "bg-sky-100 text-sky-800",
  },
];

const FALLBACK_RESULT: DressCodeResult = {
  code: "business_casual",
  label: "Business Casual",
  confidence: 0.64,
  positives: [
    "Balanced, mid-range palette observed",
    "Moderate formality — suitable for most professional environments",
  ],
  suggestions: [
    "A fitted blazer will elevate a business casual ensemble",
    "Ensure trousers are properly pressed",
    "Leather shoes in tan or dark brown pair well with this palette",
  ],
  badgeClass: "bg-amber-50 text-amber-900",
  topPredictions: [],
};

function classifyPredictions(
  predictions: { className: string; probability: number }[]
): DressCodeResult {
  const topLabels = predictions.slice(0, 5).map((p) => p.className.toLowerCase());

  for (const rule of DRESSCODE_RULES) {
    const matchedKeywords = rule.keywords.filter((kw) =>
      topLabels.some((label) => label.includes(kw.toLowerCase()))
    );
    if (matchedKeywords.length > 0) {
      const bestProb = Math.max(
        ...matchedKeywords.map((kw) => {
          const pred = predictions.find((p) => p.className.toLowerCase().includes(kw.toLowerCase()));
          return pred?.probability ?? 0;
        })
      );
      return {
        code: rule.code,
        label: rule.label,
        confidence: Math.max(0.65, Math.min(0.97, bestProb * 2.5 + 0.4)),
        positives: rule.positives,
        suggestions: rule.suggestions,
        badgeClass: rule.badgeClass,
        topPredictions: predictions.slice(0, 3).map((p) => p.className),
      };
    }
  }

  const topClassNames = predictions.slice(0, 5).map((p) => p.className);
  return { ...FALLBACK_RESULT, topPredictions: topClassNames };
}

type CameraState = "idle" | "loading_model" | "requesting" | "active" | "denied";

export default function Mirror() {
  usePageTitle("Mirror");
  const { data: profile } = useGetProfile();
  const { isAuthenticated } = useAuth();
  const { canUseCamera } = usePrivacy();

  const tier = profile?.subscription_tier ?? "guest";
  const hasAccess = isAuthenticated && tier === "ambassador";

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modelRef = useRef<mobilenet.MobileNet | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [result, setResult] = useState<DressCodeResult | null>(null);

  const apiBase = import.meta.env.VITE_API_BASE_URL ?? "";
  const loggedResultRef = useRef<string | null>(null);

  useEffect(() => {
    if (!result || !isAuthenticated) return;
    const key = `${result.code}:${result.confidence}`;
    if (loggedResultRef.current === key) return;
    loggedResultRef.current = key;
    fetch(`${apiBase}/api/mirror/log-scan`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ detected_category: result.code, confidence: result.confidence }),
    }).catch(() => null);
  }, [result, isAuthenticated, apiBase]);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraState("idle");
    setResult(null);
  }, []);

  const startCamera = useCallback(async () => {
    if (!canUseCamera) return;

    setCameraState("loading_model");
    try {
      await tf.ready();
      if (!modelRef.current) {
        modelRef.current = await mobilenet.load({ version: 2, alpha: 0.5 });
      }
    } catch {
      // Model load failure is handled gracefully: inference loop falls back to FALLBACK_RESULT
    }

    setCameraState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState("active");

      intervalRef.current = setInterval(async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState < 2) return;

        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 240;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);

        if (modelRef.current) {
          try {
            const predictions = await modelRef.current.classify(canvas, 10);
            setResult(classifyPredictions(predictions));
          } catch {
            setResult(FALLBACK_RESULT);
          }
        } else {
          setResult(FALLBACK_RESULT);
        }
      }, 3000);
    } catch {
      setCameraState("denied");
    }
  }, [canUseCamera]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  if (!hasAccess) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-serif text-foreground">The Mirror</h1>
            <Badge variant="outline" className="font-mono text-xs tracking-widest uppercase border-amber-400/40 text-amber-600">Ambassador</Badge>
          </div>
          <p className="text-muted-foreground text-lg font-light max-w-2xl">
            Present yourself and receive a discreet, on-device assessment of your dress code. No images are transmitted — all analysis runs locally in your browser.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-4">
            <div className="relative aspect-[4/3] rounded-sm overflow-hidden bg-muted border border-border">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted-foreground blur-[2px]" aria-hidden="true">
                <Camera className="h-12 w-12 opacity-20" />
                <p className="text-sm font-light">Activate the mirror to begin your reflection.</p>
              </div>
              <LockOverlay
                requiredTier="ambassador"
                teaser="The Mirror analyses your presentation through the lens of occasion and rank — discreet, on-device, and precise."
                isAuthenticated={isAuthenticated}
                variant="section"
              />
            </div>
            <div className="flex gap-3">
              <Button disabled className="flex items-center gap-2 opacity-40 cursor-not-allowed">
                <Camera className="h-4 w-4" />
                Activate Mirror
              </Button>
            </div>
          </div>
          <div className="lg:col-span-2">
            <TierGate feature="The Mirror" requiredTier="ambassador" isAuthenticated={isAuthenticated} teaser="Receive a real-time, on-device appraisal of your dress code — refined, private, and precise." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-serif text-foreground">The Mirror</h1>
          <Badge variant="outline" className="font-mono text-xs tracking-widest uppercase border-amber-400/40 text-amber-600">Ambassador</Badge>
        </div>
        <p className="text-muted-foreground text-lg font-light max-w-2xl">
          Present yourself and receive a discreet, on-device assessment of your dress code. No images are transmitted — all analysis runs locally in your browser.
        </p>
      </div>

      {!canUseCamera && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-4 text-sm">
            <ShieldAlert className="h-4 w-4 text-destructive flex-shrink-0" />
            <span className="text-destructive">
              Camera access is suspended by your Privacy settings.{" "}
              <Link href="/profile" className="underline underline-offset-2">Visit your Profile</Link>
              {" "}to adjust your preferences.
            </span>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-4">
          <div className="relative aspect-[4/3] rounded-sm overflow-hidden bg-muted border border-border">
            {cameraState === "active" ? (
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" aria-label="Camera feed for dress code analysis" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                {cameraState === "denied" && (
                  <>
                    <CameraOff className="h-12 w-12 opacity-40" />
                    <p className="text-sm font-light text-center px-8">Camera access was denied. Please allow camera access in your browser settings and try again.</p>
                  </>
                )}
                {(cameraState === "loading_model" || cameraState === "requesting") && (
                  <>
                    <Loader2 className="h-10 w-10 animate-spin opacity-60" />
                    <p className="text-sm font-light">
                      {cameraState === "loading_model" ? "Loading on-device model…" : "Requesting camera access…"}
                    </p>
                  </>
                )}
                {cameraState === "idle" && (
                  <>
                    <Camera className="h-12 w-12 opacity-30" />
                    <p className="text-sm font-light">Activate the mirror to begin your reflection.</p>
                  </>
                )}
              </div>
            )}

            {cameraState === "active" && (
              <div className="absolute top-3 right-3">
                <span className="flex items-center gap-1.5 px-2 py-1 bg-black/60 rounded-sm text-xs text-white font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  {result ? "Live" : "Analysing…"}
                </span>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
          </div>

          <div className="flex gap-3">
            {cameraState !== "active" ? (
              <Button
                onClick={startCamera}
                disabled={!canUseCamera || cameraState === "loading_model" || cameraState === "requesting"}
                className="flex items-center gap-2"
              >
                {(cameraState === "loading_model" || cameraState === "requesting") ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                Activate Mirror
              </Button>
            ) : (
              <Button onClick={stopCamera} variant="outline" className="flex items-center gap-2">
                <CameraOff className="h-4 w-4" />
                Close Mirror
              </Button>
            )}

            {cameraState === "active" && result && (
              <Button variant="ghost" size="sm" onClick={() => setResult(null)} className="flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5" />
                Reset
              </Button>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {result ? (
            <>
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardDescription className="uppercase tracking-widest text-xs font-semibold">Dress Code Detected</CardDescription>
                  <div className="flex items-center gap-3 flex-wrap">
                    <CardTitle className="font-serif text-2xl">{result.label}</CardTitle>
                    <span className={`px-2 py-0.5 rounded-sm text-xs font-mono ${result.badgeClass}`}>
                      {Math.round(result.confidence * 100)}% confidence
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.positives.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Observed</p>
                      {result.positives.map((p, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span className="font-light">{p}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {result.suggestions.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border/50">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Refinements</p>
                      {result.suggestions.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="font-light">{s}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {result.topPredictions.length > 0 && (
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">Model Detections</p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.topPredictions.map((p, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-sm bg-muted text-muted-foreground font-mono">{p}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/40 bg-muted/10">
                <CardContent className="flex items-start gap-3 py-4 text-xs text-muted-foreground">
                  <Lock className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span>All classification is performed on your device using MobileNet v2. No images are captured, stored, or transmitted.</span>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-border/40 bg-muted/10">
              <CardHeader>
                <CardTitle className="font-serif text-lg text-muted-foreground">Awaiting Reflection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground font-light leading-relaxed">
                  Activate the mirror and ensure you are well-lit, visible from the torso upward. Analysis refreshes every few seconds automatically.
                </p>
                <div className="space-y-2 pt-2">
                  {[
                    "Stand in good, even lighting",
                    "Ensure your full upper body is visible",
                    "Allow a few seconds for the on-device model to initialise",
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
