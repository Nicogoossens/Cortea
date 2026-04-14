import { useEffect, useState } from "react";
import { X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveRegion, FlagEmoji, type RegionCode } from "@/lib/active-region";
import { useLanguage } from "@/lib/i18n";

const SESSION_KEY = "sowiso_region_detect_dismissed";
const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

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

export default function RegionDetectionBanner() {
  const { t } = useLanguage();
  const { activeRegion, setActiveRegion, getRegionName } = useActiveRegion();
  const [detectedRegion, setDetectedRegion] = useState<RegionCode | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;

    (async () => {
      const gps = await detectViaGps();
      const region = gps ?? (await detectViaIp());

      if (region && region !== activeRegion) {
        setDetectedRegion(region);
      } else {
        sessionStorage.setItem(SESSION_KEY, "1");
      }
    })();
  }, []);

  if (!detectedRegion || dismissed) return null;

  const handleConfirm = () => {
    setActiveRegion(detectedRegion);
    sessionStorage.setItem(SESSION_KEY, "1");
    setDismissed(true);
  };

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setDismissed(true);
  };

  return (
    <div
      role="banner"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md bg-card border border-border shadow-lg rounded-sm px-4 py-3 flex items-center gap-3 animate-in slide-in-from-bottom-4"
    >
      <MapPin className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug">
          {t("detect.banner_prefix")}{" "}
          <span className="font-medium inline-flex items-center gap-1">
            <FlagEmoji code={detectedRegion} />
            {getRegionName(detectedRegion)}
          </span>{" "}
          {t("detect.banner_suffix")}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          size="sm"
          variant="default"
          className="h-7 text-xs font-mono uppercase tracking-wide px-3 rounded-sm"
          onClick={handleConfirm}
        >
          {t("detect.confirm")}
        </Button>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label={t("detect.dismiss")}
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
