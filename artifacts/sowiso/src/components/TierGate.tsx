import { Link } from "wouter";
import { ArrowRight, Lock } from "lucide-react";

interface TierGateProps {
  feature: string;
  requiredTier: "traveller" | "ambassador";
  children?: React.ReactNode;
  inline?: boolean;
}

const TIER_NAMES: Record<"traveller" | "ambassador", string> = {
  traveller: "The Traveller",
  ambassador: "The Ambassador",
};

const TIER_PHRASES: Record<"traveller" | "ambassador", string> = {
  traveller: "Expand your world",
  ambassador: "Refine your presence",
};

export function TierGate({ feature, requiredTier, children, inline = false }: TierGateProps) {
  if (inline) {
    return (
      <div className="relative">
        <div className="pointer-events-none select-none opacity-40 blur-[2px]" aria-hidden="true">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Link href="/membership">
            <div className="flex items-center gap-2 px-4 py-2 bg-background/95 border border-border/60 rounded-sm shadow-sm text-sm cursor-pointer hover:border-primary/40 transition-all group">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <span className="text-muted-foreground font-light">
                This domain belongs to{" "}
                <span className="font-medium text-foreground">{TIER_NAMES[requiredTier]}</span>
                {". "}
              </span>
              <span className="text-primary text-xs group-hover:underline underline-offset-2">
                {TIER_PHRASES[requiredTier]}
                <ArrowRight className="inline h-3 w-3 ml-0.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </span>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border/40 rounded-sm bg-muted/10 px-6 py-8 space-y-3">
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{feature}</span>
      </div>
      <p className="text-muted-foreground font-light leading-relaxed">
        This domain belongs to the repertoire of{" "}
        <span className="text-foreground font-medium">{TIER_NAMES[requiredTier]}</span>.
        {" "}Shall we expand your access?
      </p>
      <Link href="/membership">
        <div className="inline-flex items-center gap-2 mt-2 text-sm text-primary cursor-pointer hover:underline underline-offset-2 group">
          {TIER_PHRASES[requiredTier]}
          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
        </div>
      </Link>
    </div>
  );
}
