import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminFetch } from "@/lib/useAdminFetch";
import { RefreshCw, Tag, BarChart3 } from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface OnboardingFunnelSeriesPoint {
  bucket: string;
  reached: number;
  selected_tier: number;
  skipped: number;
  skipped_unauth: number;
  recommendation_followed: number;
  recommendation_eligible: number;
}

interface OnboardingFunnelData {
  window_days: number;
  bucket: "day" | "week";
  totals: {
    reached: number;
    by_action: Record<string, number>;
    by_tier: Record<string, number>;
    recommendation_followed: number;
    recommendation_eligible: number;
  };
  series: OnboardingFunnelSeriesPoint[];
}

export function OnboardingFunnelTab() {
  const adminFetch = useAdminFetch();
  const [data, setData] = useState<OnboardingFunnelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bucket, setBucket] = useState<"day" | "week">("day");
  const [days, setDays] = useState(30);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE}/api/admin/onboarding-funnel?bucket=${bucket}&days=${days}`;
      const res = await adminFetch(url);
      if (!res.ok) {
        setError(`Failed to load onboarding funnel (HTTP ${res.status}).`);
        return;
      }
      setData(await res.json() as OnboardingFunnelData);
    } catch {
      setError("Network error while loading onboarding funnel.");
    } finally {
      setLoading(false);
    }
  }, [bucket, days]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-sm" />)}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-destructive/5 border-destructive/30">
        <CardContent className="py-6 space-y-3">
          <p className="text-sm text-destructive font-mono">{error}</p>
          <Button size="sm" variant="outline" onClick={load} className="font-mono text-xs">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const reached = data.totals.reached;
  const selected = data.totals.by_action.selected_tier ?? 0;
  const skipped = (data.totals.by_action.skipped ?? 0) + (data.totals.by_action.skipped_unauth ?? 0);
  const pct = (n: number) => reached > 0 ? Math.round((n / reached) * 100) : 0;
  const recFollowed = data.totals.recommendation_followed;
  const recEligible = data.totals.recommendation_eligible;
  const recPct = recEligible > 0 ? Math.round((recFollowed / recEligible) * 100) : 0;

  const tierEntries = Object.entries(data.totals.by_tier).sort((a, b) => b[1] - a[1]);
  const maxTier = tierEntries.reduce((m, [, n]) => Math.max(m, n), 0);
  const maxSeries = data.series.reduce((m, p) => Math.max(m, p.reached), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-lg font-serif text-foreground">Onboarding · Plan Choice</h2>
          <p className="text-xs text-muted-foreground font-light">
            Conversion at step 5 of onboarding: how many users land here, what they pick,
            and how often they follow the recommended tier.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="text-xs font-mono px-2 py-1 rounded-sm border border-border bg-background"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last 365 days</option>
          </select>
          <select
            value={bucket}
            onChange={(e) => setBucket(e.target.value as "day" | "week")}
            className="text-xs font-mono px-2 py-1 rounded-sm border border-border bg-background"
          >
            <option value="day">Per day</option>
            <option value="week">Per week</option>
          </select>
          <Button size="sm" variant="outline" onClick={load} className="font-mono text-xs">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="py-4">
            <p className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Reached step 5</p>
            <p className="text-2xl font-serif tabular-nums">{reached}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="py-4">
            <p className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Selected a tier</p>
            <p className="text-2xl font-serif tabular-nums">{selected}</p>
            <p className="text-xs font-mono text-muted-foreground">{pct(selected)}%</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="py-4">
            <p className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Skipped</p>
            <p className="text-2xl font-serif tabular-nums">{skipped}</p>
            <p className="text-xs font-mono text-muted-foreground">{pct(skipped)}%</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="py-4">
            <p className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Followed recommendation</p>
            <p className="text-2xl font-serif tabular-nums">{recFollowed}</p>
            <p className="text-xs font-mono text-muted-foreground">{recPct}% of {recEligible}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono uppercase tracking-widest flex items-center gap-2">
            <Tag className="w-4 h-4" /> Tier selected
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tierEntries.length === 0 ? (
            <p className="text-xs text-muted-foreground font-light">No tier selections in this window.</p>
          ) : (
            <ul className="space-y-1.5">
              {tierEntries.map(([tier, n]) => (
                <li key={tier} className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex-1 truncate">{tier}</span>
                  <div className="w-32 h-1.5 bg-muted/50 rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-primary/70"
                      style={{ width: `${maxTier > 0 ? (n / maxTier) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="tabular-nums w-10 text-right text-muted-foreground">{n}</span>
                  <span className="tabular-nums w-12 text-right text-muted-foreground/70">
                    {selected > 0 ? Math.round((n / selected) * 100) : 0}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono uppercase tracking-widest flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Per {bucket}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.series.length === 0 ? (
            <p className="text-xs text-muted-foreground font-light">No events in this window.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-1.5 pr-3 font-normal">{bucket}</th>
                    <th className="py-1.5 pr-3 font-normal text-right">reached</th>
                    <th className="py-1.5 pr-3 font-normal text-right">selected</th>
                    <th className="py-1.5 pr-3 font-normal text-right">skipped</th>
                    <th className="py-1.5 pr-3 font-normal text-right">rec. followed</th>
                    <th className="py-1.5 pr-3 font-normal w-32">trend</th>
                  </tr>
                </thead>
                <tbody>
                  {data.series.map((p) => {
                    const skippedTotal = p.skipped + p.skipped_unauth;
                    return (
                      <tr key={p.bucket} className="border-t border-border/30">
                        <td className="py-1.5 pr-3">{p.bucket}</td>
                        <td className="py-1.5 pr-3 text-right tabular-nums">{p.reached}</td>
                        <td className="py-1.5 pr-3 text-right tabular-nums">{p.selected_tier}</td>
                        <td className="py-1.5 pr-3 text-right tabular-nums">{skippedTotal}</td>
                        <td className="py-1.5 pr-3 text-right tabular-nums">
                          {p.recommendation_followed}
                          <span className="text-muted-foreground/70"> / {p.recommendation_eligible}</span>
                        </td>
                        <td className="py-1.5 pr-3">
                          <div className="h-1.5 bg-muted/50 rounded-sm overflow-hidden">
                            <div
                              className="h-full bg-primary/70"
                              style={{ width: `${maxSeries > 0 ? (p.reached / maxSeries) * 100 : 0}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
