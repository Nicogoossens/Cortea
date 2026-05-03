import { useEffect, useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Users, Trophy, Shield, BarChart3, Eye, EyeOff, Unlink, RefreshCw, Link2, Copy as CopyIcon, CheckCircle2, Loader2,
} from "lucide-react";
import { Link, useLocation } from "wouter";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface PillarData {
  id: number;
  pillar: number;
  score: number;
  current_title: string;
}

interface CompletionData {
  id: number;
  scenario_id: number;
  role: string;
  score: number;
  completed_at: string;
}

interface CompanionUser {
  id: string;
  name: string;
  noble_score: number | null;
  pillars: PillarData[];
  roleplay_completions: CompletionData[];
}

interface CompanionData {
  linked: boolean;
  link_id?: number;
  my_share_enabled?: boolean;
  companion_share_enabled?: boolean;
  me?: CompanionUser;
  companion?: CompanionUser;
}

const PILLAR_NAMES: Record<number, string> = {
  1: "Presence",
  2: "Dining",
  3: "Correspondence",
  4: "Travel",
  5: "Ceremony",
};

function NobleScoreMeter({ score, label }: { score: number | null; label: string }) {
  const MAX = 1000;
  const pct = score !== null ? Math.min((score / MAX) * 100, 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
        {score !== null
          ? <span className="text-2xl font-serif text-foreground">{score}</span>
          : <span className="text-sm text-muted-foreground italic">hidden</span>
        }
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function PillarGrid({ pillars }: { pillars: PillarData[] }) {
  if (pillars.length === 0) {
    return <p className="text-sm text-muted-foreground italic">No pillar progress recorded yet.</p>;
  }
  return (
    <div className="space-y-2">
      {pillars.sort((a, b) => a.pillar - b.pillar).map((p) => (
        <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground w-4">{p.pillar}</span>
            <span className="text-sm text-foreground">{PILLAR_NAMES[p.pillar] ?? `Pillar ${p.pillar}`}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground italic">{p.current_title}</span>
            <span className="text-sm font-medium text-primary">{p.score}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function RoleplayHistory({ completions }: { completions: CompletionData[] }) {
  if (completions.length === 0) {
    return <p className="text-sm text-muted-foreground italic">No roleplay scenarios completed yet.</p>;
  }
  return (
    <div className="space-y-2">
      {completions.slice(0, 5).map((c) => (
        <div key={c.id} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs rounded-sm px-1.5">
              Role {c.role}
            </Badge>
            <span className="text-sm text-muted-foreground">Scenario #{c.scenario_id}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {new Date(c.completed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </span>
            <span className="text-sm font-medium text-primary">{c.score} pts</span>
          </div>
        </div>
      ))}
      {completions.length > 5 && (
        <p className="text-xs text-muted-foreground text-right">+{completions.length - 5} more</p>
      )}
    </div>
  );
}

function UnlinkedView() {
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generateInvite() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/invitations/generate`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as { token: string };
      setInviteLink(`${window.location.origin}${import.meta.env.BASE_URL}invite/${data.token}`);
    } catch {
      setError("Kon geen uitnodiging aanmaken. Probeer het opnieuw.");
    } finally {
      setGenerating(false);
    }
  }

  async function copyLink() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2 max-w-2xl">
        <h1 className="text-4xl font-serif text-foreground">Companion</h1>
        <p className="text-muted-foreground text-lg font-light leading-relaxed">
          Connect with another member to share your refinement journey and explore roleplay scenarios together.
        </p>
      </div>
      <div className="border border-border/40 rounded-sm p-10 space-y-6 bg-muted/10 max-w-lg">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Link2 className="w-7 h-7 text-primary" aria-hidden="true" />
          </div>
        </div>
        <div className="space-y-2 text-center">
          <p className="font-serif text-xl text-foreground">No companion linked</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Generate an invitation link and share it with a trusted colleague to connect as companions.
          </p>
        </div>

        {!inviteLink ? (
          <div className="flex flex-col items-center gap-3">
            <Button
              onClick={generateInvite}
              disabled={generating}
              className="font-mono uppercase tracking-widest text-xs gap-2"
            >
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {generating ? "Bezig…" : "Nieuwe uitnodiging aanmaken"}
            </Button>
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="font-mono uppercase tracking-widest text-xs text-muted-foreground">
                Beheer uitnodigingen in profiel
              </Button>
            </Link>
            {error && <p className="text-xs text-destructive font-mono">{error}</p>}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider text-center">
              Uw nieuwe uitnodigingslink
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-background border border-border/40 rounded-sm px-3 py-2 truncate select-all text-foreground/80">
                {inviteLink}
              </code>
              <Button variant="outline" size="sm" onClick={copyLink} className="shrink-0 font-mono text-xs">
                {copied
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  : <CopyIcon className="w-3.5 h-3.5" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground/60 font-light text-center">
              Geldig voor 7 dagen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Companion() {
  usePageTitle("Companion Dashboard");
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const [data, setData] = useState<CompanionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingShare, setTogglingShare] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    fetch(`${API_BASE}/api/companion`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  async function toggleShare() {
    if (!data) return;
    setTogglingShare(true);
    try {
      const res = await fetch(`${API_BASE}/api/companion/share`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !data.my_share_enabled }),
      });
      if (res.ok) {
        const updated = await res.json();
        setData((d) => d ? { ...d, my_share_enabled: updated.my_share_enabled } : d);
      }
    } finally {
      setTogglingShare(false);
    }
  }

  async function handleUnlink() {
    setUnlinking(true);
    try {
      const res = await fetch(`${API_BASE}/api/companion`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setData({ linked: false });
        setShowUnlinkConfirm(false);
      }
    } finally {
      setUnlinking(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
        <Users className="w-12 h-12 text-muted-foreground/30" aria-hidden="true" />
        <p className="font-serif text-xl text-muted-foreground">Please sign in to view your companion dashboard.</p>
        <Link href="/signin"><Button variant="outline" className="font-mono uppercase tracking-widest text-xs">Sign In</Button></Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-sm" />
          <Skeleton className="h-64 rounded-sm" />
        </div>
      </div>
    );
  }

  if (!data?.linked) {
    return <UnlinkedView />;
  }

  const me = data.me!;
  const companion = data.companion!;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="space-y-1 max-w-2xl">
          <h1 className="text-4xl font-serif text-foreground">Companion</h1>
          <p className="text-muted-foreground font-light leading-relaxed">
            Your shared refinement journey with{" "}
            <span className="text-foreground font-medium">{companion.name}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleShare}
            disabled={togglingShare}
            className="font-mono uppercase tracking-widest text-xs gap-2"
          >
            {data.my_share_enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {data.my_share_enabled ? "Sharing On" : "Sharing Off"}
          </Button>
          {!showUnlinkConfirm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUnlinkConfirm(true)}
              className="font-mono uppercase tracking-widest text-xs gap-2 text-muted-foreground hover:text-destructive"
            >
              <Unlink className="w-3.5 h-3.5" />
              Disconnect
            </Button>
          )}
          {showUnlinkConfirm && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Confirm?</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleUnlink}
                disabled={unlinking}
                className="font-mono uppercase tracking-widest text-xs"
              >
                {unlinking ? "…" : "Yes, disconnect"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUnlinkConfirm(false)}
                className="font-mono uppercase tracking-widest text-xs"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {!data.my_share_enabled && (
        <div className="px-4 py-3 rounded-sm border border-amber-500/20 bg-amber-50/30 dark:bg-amber-900/10 text-sm text-foreground/70">
          Your progress is currently hidden from your companion. Enable sharing to allow them to see your Noble Score and pillar progress.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-serif text-lg">Your Progress</CardTitle>
              <Trophy className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <NobleScoreMeter score={me.noble_score} label="Noble Score" />
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Pillar Progress</p>
              <PillarGrid pillars={me.pillars} />
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Roleplay History</p>
              <RoleplayHistory completions={me.roleplay_completions} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-serif text-lg">{companion.name}</CardTitle>
              <Shield className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            </div>
            {!data.companion_share_enabled && (
              <CardDescription className="text-xs italic">
                Your companion has chosen to keep their progress private.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {data.companion_share_enabled ? (
              <>
                <NobleScoreMeter score={companion.noble_score} label="Noble Score" />
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Pillar Progress</p>
                  <PillarGrid pillars={companion.pillars} />
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Roleplay History</p>
                  <RoleplayHistory completions={companion.roleplay_completions} />
                </div>
              </>
            ) : (
              <div className="py-8 text-center space-y-2">
                <EyeOff className="w-8 h-8 mx-auto text-muted-foreground/30" aria-hidden="true" />
                <p className="text-sm text-muted-foreground italic">Progress not shared</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="border-t border-border/40 pt-6">
        <Link href="/atelier">
          <Button variant="outline" className="font-mono uppercase tracking-widest text-xs gap-2">
            <BarChart3 className="w-3.5 h-3.5" />
            Explore Roleplay Scenarios in the Atelier
          </Button>
        </Link>
      </div>
    </div>
  );
}
