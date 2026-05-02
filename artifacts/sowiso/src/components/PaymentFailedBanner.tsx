import { useState, useEffect } from "react";
import { AlertTriangle, X, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { Link } from "wouter";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const DISMISSED_KEY = "sowiso_payment_failed_dismissed";

interface SubscriptionStatus {
  tier: string;
  status: string;
  paymentFailed: boolean;
}

export default function PaymentFailedBanner() {
  const { isAuthenticated, getAuthHeaders } = useAuth();
  const { t } = useLanguage();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setShow(false);
      return;
    }

    const wasDismissed = sessionStorage.getItem(DISMISSED_KEY) === "true";
    if (wasDismissed) return;

    fetch(`${API_BASE}/api/subscription/status`, { headers: getAuthHeaders() })
      .then((r) => r.ok ? r.json() : null)
      .then((data: SubscriptionStatus | null) => {
        if (data?.paymentFailed) setShow(true);
      })
      .catch(() => null);
  }, [isAuthenticated, getAuthHeaders]);

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
    setShow(false);
  };

  if (!show || dismissed) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl mx-auto px-4"
    >
      <div className="flex items-start gap-3 bg-card border border-amber-500/30 rounded-sm px-5 py-4 shadow-lg shadow-black/20">
        <AlertTriangle
          className="h-4 w-4 text-amber-500 shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground font-light leading-snug">
            {t("subscription.payment_failed_notice")}
          </p>
          <Link
            href="/membership"
            className="inline-flex items-center gap-1 text-xs text-amber-500 hover:text-amber-400 font-mono uppercase tracking-wider mt-1.5 transition-colors"
          >
            {t("subscription.payment_failed_cta")}
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0 p-0.5"
          aria-label={t("subscription.payment_failed_dismiss")}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
