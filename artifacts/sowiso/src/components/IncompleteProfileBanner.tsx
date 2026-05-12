import { useState } from "react";
import { AlertTriangle, X, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useLocation } from "wouter";
import { useProfileCompleteness, isDismissed, setDismissed } from "@/hooks/useProfileCompleteness";

export function IncompleteProfileBanner() {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const { isIncomplete, emptyCount } = useProfileCompleteness();
  const [dismissed, setLocalDismissed] = useState(() => isDismissed());

  if (!isIncomplete || dismissed) return null;

  function handleDismiss() {
    setDismissed();
    setLocalDismissed(true);
  }

  function handleCta() {
    navigate("/profile", { state: { scrollTo: "my-interests" } });
  }

  const bodyKey =
    emptyCount === 1
      ? "profile_completeness.banner_body_one"
      : emptyCount === 2
        ? "profile_completeness.banner_body_two"
        : "profile_completeness.banner_body_many";

  return (
    <div
      role="alert"
      className="relative flex items-start gap-3 rounded-sm border border-amber-400/40 bg-amber-500/[0.07] px-4 py-3 text-sm animate-in fade-in duration-300"
    >
      <AlertTriangle
        className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400"
        aria-hidden="true"
      />

      <div className="flex-1 min-w-0">
        <p className="font-medium text-amber-900/90 dark:text-amber-200 text-xs uppercase tracking-widest font-mono mb-0.5">
          {t("profile_completeness.banner_title")}
        </p>
        <p className="text-foreground/80 font-light leading-snug">
          {t(bodyKey as Parameters<typeof t>[0])}
        </p>
        <button
          type="button"
          onClick={handleCta}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 transition-colors"
        >
          {t("profile_completeness.cta")}
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label={t("profile_completeness.dismiss")}
        className="flex-shrink-0 p-1 text-amber-600/60 hover:text-amber-800 dark:hover:text-amber-200 transition-colors rounded-sm"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
