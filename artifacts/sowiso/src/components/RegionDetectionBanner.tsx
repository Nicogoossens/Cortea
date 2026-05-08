import { useEffect, useState, useRef } from "react";
import { X, MapPin, LocateFixed, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveRegion, FlagEmoji, isRegionActive, type RegionCode } from "@/lib/active-region";
import { useLanguage } from "@/lib/i18n";

const SESSION_DISMISSED_KEY = "cortea_region_detect_dismissed";
const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const SENTINEL_ID = "region-detect-sentinel";
const SCROLL_DELAY_MS = 3000;

interface BBox {
  latMin: number; latMax: number;
  lngMin: number; lngMax: number;
  region: RegionCode;
}

const BBOXES: BBox[] = [
  { latMin: 49, latMax: 61, lngMin: -8, lngMax: 2, region: "GB" },
  { latMin: 18, latMax: 53, lngMin: 73, lngMax: 135, region: "CN" },
  { latMin: 43, latMax: 83, lngMin: -140, lngMax: -52, region: "CA" },
  { latMin: 24, latMax: 49, lngMin: -125, lngMax: -66, region: "US" },
  { latMin: 42, latMax: 51, lngMin: -5, lngMax: 8, region: "FR" },
  { latMin: 47, latMax: 55, lngMin: 6, lngMax: 15, region: "DE" },
  { latMin: 24, latMax: 46, lngMin: 123, lngMax: 146, region: "JP" },
  { latMin: 22, latMax: 26, lngMin: 51, lngMax: 56, region: "AE" },
  { latMin: 1, latMax: 2, lngMin: 103, lngMax: 104, region: "SG" },
  { latMin: 8, latMax: 37, lngMin: 68, lngMax: 97, region: "IN" },
  { latMin: -33, latMax: 5, lngMin: -73, lngMax: -35, region: "BR" },
  { latMin: -35, latMax: -22, lngMin: 17, lngMax: 33, region: "ZA" },
  { latMin: -44, latMax: -10, lngMin: 113, lngMax: 154, region: "AU" },
  { latMin: 14, latMax: 32, lngMin: -118, lngMax: -87, region: "MX" },
];

function regionFromCoords(lat: number, lng: number): RegionCode | null {
  for (const b of BBOXES) {
    if (lat >= b.latMin && lat <= b.latMax && lng >= b.lngMin && lng <= b.lngMax) {
      return b.region;
    }
  }
  return null;
}

async function detectViaGps(): Promise<RegionCode | null> {
  if (!("geolocation" in navigator)) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(regionFromCoords(pos.coords.latitude, pos.coords.longitude)),
      () => resolve(null),
      { timeout: 5000, maximumAge: 300_000 },
    );
  });
}

async function detectViaIp(): Promise<RegionCode | null> {
  try {
    const res = await fetch(`${API_BASE}/api/detect-region`);
    if (!res.ok) return null;
    const body = await res.json() as { region?: string; ip_detected?: boolean };
    return (body.ip_detected && body.region) ? (body.region as RegionCode) : null;
  } catch {
    return null;
  }
}

type GpsState = "idle" | "requesting" | "done";

export default function RegionDetectionBanner() {
  const { t } = useLanguage();
  const { activeRegion, setDetectedRegion, getRegionName } = useActiveRegion();
  const [suggestedRegion, setSuggestedRegion] = useState<RegionCode | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [gpsState, setGpsState] = useState<GpsState>("idle");
  const pendingRegionRef = useRef<RegionCode | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_DISMISSED_KEY)) return;

    detectViaIp().then((region) => {
      if (!region || region === activeRegion || !isRegionActive(region)) {
        sessionStorage.setItem(SESSION_DISMISSED_KEY, "1");
        return;
      }

      pendingRegionRef.current = region;

      const sentinel = document.getElementById(SENTINEL_ID);
      if (!sentinel) {
        setSuggestedRegion(region);
        setVisible(true);
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            observer.disconnect();
            timerRef.current = setTimeout(() => {
              if (pendingRegionRef.current) {
                setSuggestedRegion(pendingRegionRef.current);
                setVisible(true);
              }
            }, SCROLL_DELAY_MS);
          }
        },
        { threshold: 0.2 },
      );
      observer.observe(sentinel);

      return () => {
        observer.disconnect();
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    });
  }, []);

  if (!suggestedRegion || !visible || dismissed) return null;

  const handleConfirm = () => {
    setDetectedRegion(suggestedRegion);
    sessionStorage.setItem(SESSION_DISMISSED_KEY, "1");
    setDismissed(true);
  };

  const handleGps = async () => {
    setGpsState("requesting");
    const gpsRegion = await detectViaGps();
    setGpsState("done");
    if (gpsRegion && isRegionActive(gpsRegion)) setSuggestedRegion(gpsRegion);
  };

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_DISMISSED_KEY, "1");
    setDismissed(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
      aria-modal="true"
      role="dialog"
      aria-labelledby="region-detect-title"
      onClick={(e) => { if (e.target === e.currentTarget) handleDismiss(); }}
    >
      <div className="bg-card border border-border shadow-2xl rounded-xl p-6 mx-4 w-full max-w-md space-y-4 animate-in zoom-in-95 duration-200">

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-primary" aria-hidden="true" />
            </div>
            <p id="region-detect-title" className="text-sm font-medium text-foreground leading-snug">
              {t("detect.banner_prefix")}{" "}
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <FlagEmoji code={suggestedRegion} size="sm" />
                {getRegionName(suggestedRegion)}
              </span>
              {t("detect.banner_suffix")}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
            aria-label={t("detect.dismiss")}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground font-light leading-relaxed">
          {t("detect.purpose")}
        </p>

        <div className="flex items-center gap-2 text-xs text-muted-foreground/70 border-t border-border/40 pt-3">
          <Lock className="w-3 h-3 shrink-0" aria-hidden="true" />
          <span className="italic">{t("detect.not_stored")}</span>
          {gpsState === "idle" && (
            <button
              onClick={handleGps}
              className="ml-auto inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground transition-colors whitespace-nowrap"
            >
              <LocateFixed className="w-3 h-3" aria-hidden="true" />
              {t("detect.use_gps")}
            </button>
          )}
          {gpsState === "requesting" && (
            <span className="ml-auto italic">{t("detect.gps_requesting")}</span>
          )}
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Button
            size="sm"
            variant="default"
            className="flex-1 font-mono text-xs uppercase tracking-wide rounded-lg"
            onClick={handleConfirm}
          >
            {t("detect.confirm")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs rounded-lg text-muted-foreground"
            onClick={handleDismiss}
          >
            {t("detect.dismiss")}
          </Button>
        </div>

      </div>
    </div>
  );
}
