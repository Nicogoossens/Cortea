import { useState } from "react";
import { useLocation } from "wouter";
import { useLocale } from "@/lib/i18n";
import { LOCALE_GROUPS } from "@/lib/i18n-locales";
import { useActiveRegion, FlagEmoji } from "@/lib/active-region";
import { useAuth } from "@/lib/auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type DialogTarget = "language" | "region" | null;

export function ActiveContextChips() {
  const { locale, t } = useLocale();
  const { activeRegion, getRegionName } = useActiveRegion();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const [dialogTarget, setDialogTarget] = useState<DialogTarget>(null);

  const allLocales = LOCALE_GROUPS.flatMap((g) => g.locales);
  const currentLocale = allLocales.find((l) => l.locale === locale);
  const languageLabel = currentLocale?.languageLabel ?? "English";

  const langLabel = t("context.active_language");
  const regionLabel = t("context.active_region");

  const chipBase =
    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono transition-colors cursor-pointer";
  const chipIdle =
    "border-border/60 bg-muted/30 text-foreground/70 hover:border-primary/40 hover:bg-primary/5 hover:text-foreground";

  function handleConfirm() {
    if (dialogTarget === "language") {
      navigate("/profile?focus=language");
    } else if (dialogTarget === "region") {
      navigate("/profile?focus=region");
    }
    setDialogTarget(null);
  }

  const dialogTitle =
    dialogTarget === "language"
      ? "Change your language preference"
      : "Change your learning region";

  const dialogDescription =
    dialogTarget === "language"
      ? "To change your language, we'll take you to your profile settings where you can update your preference. Your choice is saved automatically."
      : "To change your learning region, we'll take you to your profile settings where you can update it. Your choice is saved automatically.";

  return (
    <>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2" aria-label="Active session context">
          {/* Language chip — opens confirmation before redirecting to profile */}
          <button
            type="button"
            onClick={() => isAuthenticated ? setDialogTarget("language") : navigate("/profile?focus=language")}
            className={`${chipBase} ${chipIdle}`}
            aria-label={`${langLabel}: ${languageLabel}. Click to change.`}
          >
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">{langLabel}:</span>
            <FlagEmoji code={currentLocale?.flag ?? "US"} size="sm" />
            <span>{languageLabel}</span>
          </button>

          {/* Region chip — opens confirmation before redirecting to profile */}
          <button
            type="button"
            onClick={() => isAuthenticated ? setDialogTarget("region") : navigate("/profile?focus=region")}
            className={`${chipBase} ${chipIdle}`}
            aria-label={`${regionLabel}: ${getRegionName(activeRegion)}. Click to change.`}
          >
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">{regionLabel}:</span>
            <FlagEmoji code={activeRegion} size="sm" />
            <span>{getRegionName(activeRegion)}</span>
          </button>
        </div>
      </div>

      {/* Confirmation dialog */}
      <AlertDialog open={dialogTarget !== null} onOpenChange={(open) => { if (!open) setDialogTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>{dialogDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDialogTarget(null)}>
              Stay here
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Go to profile settings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
