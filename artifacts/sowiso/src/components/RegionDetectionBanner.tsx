import { useEffect, useState } from "react";
import { X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveRegion, FlagEmoji, type RegionCode } from "@/lib/active-region";
import { useLanguage } from "@/lib/i18n";

const SESSION_KEY = "sowiso_region_detect_dismissed";
const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function RegionDetectionBanner() {
  const { t } = useLanguage();
  const { activeRegion, setActiveRegion, getRegionName } = useActiveRegion();
  const [detectedRegion, setDetectedRegion] = useState<RegionCode | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;

    fetch(`${API_BASE}/api/detect-region`)
      .then((r) => r.json())
      .then((body: { region?: string; ip_detected?: boolean }) => {
        if (body.ip_detected && body.region && body.region !== activeRegion) {
          setDetectedRegion(body.region as RegionCode);
        } else {
          sessionStorage.setItem(SESSION_KEY, "1");
        }
      })
      .catch(() => {});
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
