import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminFetch } from "@/lib/useAdminFetch";
import { RefreshCw, Tag, BarChart3, Upload } from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface UtmBreakdownRow {
  value: string;
  count: number;
}
interface UtmCombinedRow {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  count: number;
}
interface UtmAttributionData {
  total_users: number;
  attributed_users: number;
  unattributed_users: number;
  by_source: UtmBreakdownRow[];
  by_medium: UtmBreakdownRow[];
  by_campaign: UtmBreakdownRow[];
  by_content: UtmBreakdownRow[];
  by_term: UtmBreakdownRow[];
  top_combined: UtmCombinedRow[];
}

export function AttributionTab() {
  const adminFetch = useAdminFetch();
  const [data, setData] = useState<UtmAttributionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch(`${API_BASE}/api/admin/utm-attribution`);
      if (!res.ok) {
        setError(`Failed to load attribution data (HTTP ${res.status}).`);
        return;
      }
      setData(await res.json() as UtmAttributionData);
    } catch {
      setError("Network error while loading attribution data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function exportCsv() {
    if (!data) return;
    const lines: string[] = [];
    lines.push("dimension,value,count");
    const dump = (dim: string, rows: UtmBreakdownRow[]) =>
      rows.forEach((r) => lines.push(`${dim},"${r.value.replace(/"/g, '""')}",${r.count}`));
    dump("source", data.by_source);
    dump("medium", data.by_medium);
    dump("campaign", data.by_campaign);
    dump("content", data.by_content);
    dump("term", data.by_term);
    lines.push("");
    lines.push("utm_source,utm_medium,utm_campaign,count");
    for (const r of data.top_combined) {
      lines.push(`"${r.utm_source ?? ""}","${r.utm_medium ?? ""}","${r.utm_campaign ?? ""}",${r.count}`);
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cortea-utm-attribution-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function BreakdownTable({ title, rows }: { title: string; rows: UtmBreakdownRow[] }) {
    const max = rows.reduce((m, r) => Math.max(m, r.count), 0);
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono uppercase tracking-widest flex items-center gap-2">
            <Tag className="w-4 h-4" /> {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-xs text-muted-foreground font-light">No data yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {rows.map((r) => (
                <li key={r.value} className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex-1 truncate" title={r.value}>{r.value}</span>
                  <div className="w-32 h-1.5 bg-muted/50 rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-primary/70"
                      style={{ width: `${max > 0 ? (r.count / max) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="tabular-nums w-10 text-right text-muted-foreground">{r.count}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    );
  }

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

  const coverage = data.total_users > 0
    ? Math.round((data.attributed_users / data.total_users) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-lg font-serif text-foreground">Campaign Attribution</h2>
          <p className="text-xs text-muted-foreground font-light">
            Where registered users found Cortéa, captured from UTM parameters at sign-up.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={load} className="font-mono text-xs">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={exportCsv} className="font-mono text-xs">
            <Upload className="w-3.5 h-3.5 mr-1.5 rotate-180" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="py-4">
            <p className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Total users</p>
            <p className="text-2xl font-serif tabular-nums">{data.total_users}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="py-4">
            <p className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Attributed</p>
            <p className="text-2xl font-serif tabular-nums">{data.attributed_users}</p>
            <p className="text-xs font-mono text-muted-foreground">{coverage}% coverage</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="py-4">
            <p className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Unattributed</p>
            <p className="text-2xl font-serif tabular-nums">{data.unattributed_users}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <BreakdownTable title="By source" rows={data.by_source} />
        <BreakdownTable title="By medium" rows={data.by_medium} />
        <BreakdownTable title="By campaign" rows={data.by_campaign} />
        <BreakdownTable title="By content" rows={data.by_content} />
        <BreakdownTable title="By term" rows={data.by_term} />
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono uppercase tracking-widest flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Top source · medium · campaign
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.top_combined.length === 0 ? (
            <p className="text-xs text-muted-foreground font-light">No combined attribution data yet.</p>
          ) : (
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-1.5 pr-3 font-normal">source</th>
                  <th className="py-1.5 pr-3 font-normal">medium</th>
                  <th className="py-1.5 pr-3 font-normal">campaign</th>
                  <th className="py-1.5 pr-3 font-normal text-right">users</th>
                </tr>
              </thead>
              <tbody>
                {data.top_combined.map((r, i) => (
                  <tr key={i} className="border-t border-border/30">
                    <td className="py-1.5 pr-3">{r.utm_source ?? "—"}</td>
                    <td className="py-1.5 pr-3">{r.utm_medium ?? "—"}</td>
                    <td className="py-1.5 pr-3">{r.utm_campaign ?? "—"}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
