import { useState } from "react";
import { Link } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { BookOpen, Compass, Shield, Scan, ArrowLeft, ArrowRight, Lock, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

interface ComponentScores {
  atelier: number | null;
  counsel: number | null;
  mirror: number | null;
  compass: number | null;
}

interface UseCase {
  id: number;
  slug: string;
  title: string;
  region_code: string;
  flag_emoji: string;
  formality_level: string;
  domain_tags: string[];
  pillar_weights: Record<string, number>;
  description: string;
  cover_context: string;
  primary_tool: string;
  readiness_score: number | null;
  component_scores: ComponentScores | null;
}

const FORMALITY_LABELS: Record<string, string> = {
  white_tie: "White Tie",
  black_tie: "Black Tie",
  morning_dress: "Morning Dress",
  formal: "Formal",
  business_formal: "Business Formal",
  smart_casual: "Smart Casual",
  business_casual: "Business Casual",
  ceremonial: "Ceremonial",
};

const FORMALITY_COLORS: Record<string, string> = {
  white_tie: "bg-zinc-900 text-zinc-100",
  black_tie: "bg-zinc-800 text-zinc-100",
  morning_dress: "bg-slate-700 text-slate-100",
  formal: "bg-slate-600 text-slate-100",
  business_formal: "bg-blue-800 text-blue-100",
  ceremonial: "bg-purple-800 text-purple-100",
  smart_casual: "bg-teal-700 text-teal-100",
  business_casual: "bg-teal-600 text-teal-100",
};

const TOOL_ICONS: Record<string, React.ReactNode> = {
  atelier: <BookOpen className="h-4 w-4" />,
  counsel: <Shield className="h-4 w-4" />,
  compass: <Compass className="h-4 w-4" />,
  mirror: <Scan className="h-4 w-4" />,
};

const TOOL_HREFS: Record<string, string> = {
  atelier: "/atelier",
  counsel: "/counsel",
  compass: "/compass",
  mirror: "/mirror",
};

const TOOL_LABELS: Record<string, string> = {
  atelier: "Atelier",
  counsel: "Counsel",
  compass: "Compass",
  mirror: "Mirror",
};

function CircularProgress({ score, size = 72 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 75) return "#16a34a";
    if (s >= 50) return "#ca8a04";
    if (s >= 25) return "#ea580c";
    return "#dc2626";
  };

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={4}
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor(score)}
          strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <span className="absolute text-sm font-semibold" style={{ color: getColor(score) }}>
        {score}%
      </span>
    </div>
  );
}

function ContributionBar({ label, score, icon }: { label: string; score: number | null; icon: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className="font-medium text-foreground">
          {score !== null ? `${score}%` : "—"}
        </span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-700"
          style={{ width: `${score ?? 0}%` }}
        />
      </div>
    </div>
  );
}

function UseCaseDetail({ useCase, onClose }: { useCase: UseCase; onClose: () => void }) {
  const cs = useCase.component_scores;
  const primaryHref = TOOL_HREFS[useCase.primary_tool] ?? "/atelier";

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-sm shadow-xl w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-2xl">{useCase.flag_emoji}</div>
              <h2 className="font-serif text-2xl text-foreground leading-snug">{useCase.title}</h2>
              <Badge variant="outline" className={`text-xs ${FORMALITY_COLORS[useCase.formality_level] ?? ""}`}>
                {FORMALITY_LABELS[useCase.formality_level] ?? useCase.formality_level}
              </Badge>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {useCase.readiness_score !== null && (
                <CircularProgress score={useCase.readiness_score} size={72} />
              )}
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {useCase.cover_context && (
            <blockquote className="border-l-2 border-primary/30 pl-4 text-sm text-muted-foreground italic leading-relaxed">
              {useCase.cover_context}
            </blockquote>
          )}

          <p className="text-sm text-foreground/80 leading-relaxed">{useCase.description}</p>

          {cs && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Readiness Breakdown</h3>
              <div className="space-y-3">
                <ContributionBar label="Atelier" score={cs.atelier} icon={TOOL_ICONS.atelier} />
                <ContributionBar label="Counsel" score={cs.counsel} icon={TOOL_ICONS.counsel} />
                <ContributionBar label="Mirror" score={cs.mirror} icon={TOOL_ICONS.mirror} />
                <ContributionBar label="Compass" score={cs.compass} icon={TOOL_ICONS.compass} />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {useCase.domain_tags.map((tag) => (
              <span key={tag} className="text-[10px] uppercase tracking-widest text-muted-foreground border border-border/50 rounded-[2px] px-2 py-0.5">
                {tag.replace(/_/g, " ")}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Best practised in:{" "}
              <span className="font-medium text-foreground capitalize">{TOOL_LABELS[useCase.primary_tool] ?? useCase.primary_tool}</span>
            </p>
            <Link href={primaryHref}>
              <Button size="sm" className="gap-2" onClick={onClose}>
                {TOOL_ICONS[useCase.primary_tool]}
                Practice now
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniContributionBars({ scores, locked }: { scores: ComponentScores | null; locked: boolean }) {
  const tools: Array<{ key: keyof ComponentScores; label: string; icon: React.ReactNode }> = [
    { key: "atelier",  label: "Atelier",  icon: TOOL_ICONS.atelier  },
    { key: "counsel",  label: "Counsel",  icon: TOOL_ICONS.counsel  },
    { key: "mirror",   label: "Mirror",   icon: TOOL_ICONS.mirror   },
    { key: "compass",  label: "Compass",  icon: TOOL_ICONS.compass  },
  ];

  if (locked) {
    return (
      <div className="relative space-y-1.5 mt-2">
        {tools.map(t => (
          <div key={t.key} className="flex items-center gap-2">
            <span className="text-muted-foreground/40 shrink-0">{t.icon}</span>
            <div className="flex-1 h-1 bg-muted/30 rounded-full" />
            <Lock className="h-2.5 w-2.5 text-muted-foreground/30 shrink-0" />
          </div>
        ))}
        <div className="absolute inset-0 backdrop-blur-[2px] rounded-sm" />
      </div>
    );
  }

  if (!scores) {
    return (
      <div className="space-y-1.5 mt-2">
        {tools.map(t => (
          <div key={t.key} className="flex items-center gap-2">
            <span className="text-muted-foreground/50 shrink-0">{t.icon}</span>
            <div className="flex-1 h-1 bg-muted/20 rounded-full" />
            <span className="text-[10px] text-muted-foreground/40 w-5 text-right">—</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1.5 mt-2">
      {tools.map(t => {
        const val = scores[t.key];
        return (
          <div key={t.key} className="flex items-center gap-2">
            <span className="text-muted-foreground/60 shrink-0">{t.icon}</span>
            <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary/70 transition-all duration-700 rounded-full"
                style={{ width: `${val ?? 0}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground/70 w-6 text-right tabular-nums">
              {val !== null ? `${val}` : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function UseCaseCard({ useCase, onSelect, isAuthenticated }: {
  useCase: UseCase;
  onSelect: (uc: UseCase) => void;
  isAuthenticated: boolean;
}) {
  const hasScore = useCase.readiness_score !== null;
  const scoreBlurred = !isAuthenticated;

  return (
    <button
      className="group text-left w-full"
      onClick={() => onSelect(useCase)}
      aria-label={`View ${useCase.title}`}
    >
      <Card className="h-full border-border bg-card transition-all duration-300 hover:shadow-md hover:border-primary/30 cursor-pointer overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="text-xl">{useCase.flag_emoji}</div>
              <CardTitle className="font-serif text-lg leading-tight group-hover:text-primary transition-colors">
                {useCase.title}
              </CardTitle>
              <Badge
                variant="outline"
                className={`text-[10px] uppercase tracking-widest font-medium ${FORMALITY_COLORS[useCase.formality_level] ?? "bg-muted text-muted-foreground"}`}
              >
                {FORMALITY_LABELS[useCase.formality_level] ?? useCase.formality_level}
              </Badge>
            </div>
            <div className="flex-shrink-0 mt-1">
              {scoreBlurred ? (
                <div className="relative flex items-center justify-center" style={{ width: 56, height: 56 }}>
                  <div className="w-14 h-14 rounded-full border-4 border-muted/40 bg-muted/20 flex items-center justify-center">
                    <Lock className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                </div>
              ) : hasScore ? (
                <CircularProgress score={useCase.readiness_score!} size={56} />
              ) : (
                <div className="w-14 h-14 rounded-full border-4 border-muted/30 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">—</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <CardDescription className="text-sm leading-relaxed line-clamp-2">
            {useCase.description}
          </CardDescription>

          <MiniContributionBars
            scores={useCase.component_scores}
            locked={scoreBlurred}
          />

          <div className="flex flex-wrap gap-1.5 pt-1">
            {useCase.domain_tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] uppercase tracking-widest text-muted-foreground/70 border border-border/40 rounded-[2px] px-1.5 py-0.5">
                {tag.replace(/_/g, " ")}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-end">
            <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
              View details <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

export default function UseCases() {
  usePageTitle("Use Cases");
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [selected, setSelected] = useState<UseCase | null>(null);

  const { data: useCases, isLoading } = useQuery<UseCase[]>({
    queryKey: ["use-cases"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/use-cases`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch use cases");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="space-y-2">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-52 rounded-sm" />)}
        </div>
      </div>
    );
  }

  return (
    <>
      {selected && (
        <UseCaseDetail useCase={selected} onClose={() => setSelected(null)} />
      )}

      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-serif text-foreground">Use Case Library</h1>
          <p className="text-muted-foreground text-lg max-w-2xl font-light">
            Curated real-world situations to practise. Your readiness score reflects progress across all tools.
          </p>
        </div>

        {!isAuthenticated && (
          <div className="flex items-center gap-3 rounded-sm border border-border bg-muted/30 px-5 py-4 text-sm text-muted-foreground">
            <Lock className="h-4 w-4 shrink-0" />
            <span>
              <Link href="/signin" className="text-primary underline-offset-2 hover:underline">Sign in</Link>
              {" "}to see your personalised readiness scores for each situation.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {useCases?.map((uc) => (
            <UseCaseCard
              key={uc.id}
              useCase={uc}
              onSelect={setSelected}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      </div>
    </>
  );
}
