import { Link } from "wouter";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  WELCOME_DURATION_MS,
  markWelcomeShown,
  shouldShowWelcomeBanner,
} from "@/lib/welcome-banner";

/** How long the fade-out animation takes before the banner is fully removed. */
export const WELCOME_FADE_OUT_MS = 400;
/** Tiny delay between mount and fade-in so the CSS transition triggers. */
export const WELCOME_FADE_IN_MS = 30;

export interface WelcomeBannerProps {
  userId: string | null | undefined;
  hasProfile: boolean;
  hasScore: boolean;
  firstName: string | null | undefined;
  /** Aria-label / heading shown to named users. */
  namedLabel: string;
  /** Aria-label / heading shown to anonymous users. */
  anonLabel: string;
  /** Optional sub-line about the user's score. */
  scoreLine?: string | null;
  /** Optional sub-line about the next rank. */
  nextRankLine?: string | null;
  /** Link text for the "complete your profile" CTA (anon only). */
  promptLabel: string;
  /** Aria-label for the dismiss button. */
  dismissLabel: string;
}

/**
 * Self-contained welcome banner.
 *
 * Behaviour:
 *  - On first visit (per user, per name-state) shows itself, fades in after
 *    `WELCOME_FADE_IN_MS`, then auto-dismisses after `WELCOME_DURATION_MS`.
 *  - Dismiss starts a `WELCOME_FADE_OUT_MS` fade-out before unmounting.
 *  - Tracks visibility via `welcome_shown_(anon|named)_<userId>` keys in
 *    `sessionStorage` so subsequent visits in the same session are suppressed.
 */
export function WelcomeBanner({
  userId,
  hasProfile,
  hasScore,
  firstName,
  namedLabel,
  anonLabel,
  scoreLine,
  nextRankLine,
  promptLabel,
  dismissLabel,
}: WelcomeBannerProps) {
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeVisible, setWelcomeVisible] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDismiss = () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    setWelcomeVisible(false);
    dismissFadeRef.current = setTimeout(
      () => setShowWelcome(false),
      WELCOME_FADE_OUT_MS,
    );
  };

  useEffect(() => {
    const result = shouldShowWelcomeBanner(
      userId,
      hasProfile,
      hasScore,
      !!firstName,
    );
    if (!result.show) return;
    markWelcomeShown(result.key);

    setShowWelcome(true);
    const fadeIn = setTimeout(
      () => setWelcomeVisible(true),
      WELCOME_FADE_IN_MS,
    );
    const fadeOut = setTimeout(() => handleDismiss(), WELCOME_DURATION_MS);
    dismissTimerRef.current = fadeOut;

    return () => {
      clearTimeout(fadeIn);
      clearTimeout(fadeOut);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, firstName, hasProfile, hasScore]);

  useEffect(
    () => () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      if (dismissFadeRef.current) clearTimeout(dismissFadeRef.current);
    },
    [],
  );

  if (!showWelcome) return null;

  const heading = firstName ? namedLabel : anonLabel;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={heading}
      data-testid="welcome-banner"
      data-visible={welcomeVisible ? "true" : "false"}
      className={[
        "relative flex items-start gap-4 rounded-sm border border-primary/20 bg-primary/5 px-5 py-4",
        "transition-all duration-400",
        welcomeVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-2 pointer-events-none",
      ].join(" ")}
    >
      <div className="flex-1 min-w-0">
        <p className="font-serif text-xl text-foreground leading-snug">
          {heading}
        </p>
        {scoreLine && (
          <p className="mt-0.5 text-sm text-muted-foreground font-light">
            {scoreLine}
          </p>
        )}
        {nextRankLine && (
          <p className="mt-0.5 text-sm text-primary/70 font-light">
            {nextRankLine}
          </p>
        )}
        {!firstName && (
          <Link
            href="/profile"
            onClick={handleDismiss}
            className="mt-1.5 inline-block text-sm text-primary/80 hover:text-primary underline-offset-2 hover:underline transition-colors font-light"
          >
            {promptLabel}
          </Link>
        )}
      </div>
      <button
        onClick={handleDismiss}
        aria-label={dismissLabel}
        className="shrink-0 mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
