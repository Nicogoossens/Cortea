import { Link } from "wouter";
import { Lock, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const TIER_NAMES: Record<"traveller" | "ambassador", string> = {
  traveller: "The Traveller",
  ambassador: "The Ambassador",
};

interface LockOverlayProps {
  requiredTier: "traveller" | "ambassador";
  teaser: string;
  isAuthenticated: boolean;
  variant?: "card" | "section";
}

export function LockOverlay({ requiredTier, teaser, isAuthenticated, variant = "card" }: LockOverlayProps) {
  const { t } = useLanguage();
  const href = isAuthenticated ? "/membership" : "/register";
  const ctaText = isAuthenticated ? t("lock.cta.upgrade") : t("lock.cta.register");

  if (variant === "section") {
    return (
      <div className="absolute inset-0 bg-background/85 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-10 rounded-sm">
        <div className="text-center space-y-4 max-w-sm px-8">
          <div className="flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{TIER_NAMES[requiredTier]}</span>
          </div>
          <p className="text-sm text-muted-foreground font-light leading-relaxed">{teaser}</p>
          <Link href={href}>
            <div className="inline-flex items-center gap-2 text-sm text-primary cursor-pointer hover:underline underline-offset-2 group/cta mt-1">
              {ctaText}
              <ArrowRight className="h-4 w-4 group-hover/cta:translate-x-0.5 transition-transform" aria-hidden="true" />
            </div>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
      <div className="bg-background/96 border border-border/70 rounded-sm shadow-md px-5 py-4 space-y-2 max-w-[230px] text-center pointer-events-none">
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          <Lock className="h-3 w-3" aria-hidden="true" />
          <span>{TIER_NAMES[requiredTier]}</span>
        </div>
        <p className="text-xs text-muted-foreground font-light leading-relaxed">{teaser}</p>
        <p className="text-xs text-primary font-light">
          {ctaText}
          <ArrowRight className="inline h-3 w-3 ml-0.5 translate-y-[-1px]" aria-hidden="true" />
        </p>
      </div>
    </div>
  );
}
