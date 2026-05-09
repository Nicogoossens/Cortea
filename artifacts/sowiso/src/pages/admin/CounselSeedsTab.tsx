import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminFetch } from "@/lib/useAdminFetch";
import { Loader2, RefreshCw } from "lucide-react";
import type { CounselSeedRow } from "./types";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function CounselSeedsTab({ authHeaders }: { authHeaders: Record<string, string> }) {
  const adminFetch = useAdminFetch();
  const [seeds, setSeeds] = useState<CounselSeedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch(`${API_BASE}/api/admin/counsel-seeds`, {
        headers: authHeaders,
      });
      if (!res.ok) {
        setError(`Failed to load seeds (HTTP ${res.status}).`);
        return;
      }
      const data = await res.json() as { seeds: CounselSeedRow[] };
      setSeeds(data.seeds ?? []);
    } catch {
      setError("Network error while loading counsel seeds.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const act = async (id: number, action: "promote" | "demote") => {
    setActionId(id);
    try {
      const res = await adminFetch(`${API_BASE}/api/admin/counsel-seeds/${id}/${action}`, {
        method: "POST",
        headers: authHeaders,
      });
      if (!res.ok) {
        setError(`Action failed (HTTP ${res.status}).`);
        return;
      }
      const data = await res.json() as { seed: CounselSeedRow };
      setSeeds((prev) => prev.map((s) => s.id === id ? data.seed : s));
    } catch {
      setError("Network error during seed action.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          Counsel region seeds — distillates of Atelier knowledge per region & domain
        </p>
        <Button size="sm" variant="outline" className="font-mono text-xs" onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/40">
          <CardContent className="py-3 text-sm text-destructive font-mono">{error}</CardContent>
        </Card>
      )}

      {loading && seeds.length === 0 && (
        <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-sm" />)}</div>
      )}

      {!loading && seeds.length === 0 && !error && (
        <Card><CardContent className="py-8 text-center text-muted-foreground font-light text-sm">
          No counsel seeds yet. Run <code className="font-mono">scripts/counsel-seed-worker.mjs --region &lt;CODE&gt;</code>.
        </CardContent></Card>
      )}

      {seeds.length > 0 && (
        <div className="border border-border rounded-sm overflow-hidden">
          <table className="w-full text-xs font-mono">
            <thead className="bg-muted/40 text-muted-foreground uppercase tracking-widest">
              <tr>
                <th className="text-left px-3 py-2">Region</th>
                <th className="text-left px-3 py-2">Domain</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-right px-3 py-2">Score</th>
                <th className="text-left px-3 py-2">Seeded</th>
                <th className="text-right px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {seeds.map((s) => (
                <tr key={s.id} className="border-t border-border/60">
                  <td className="px-3 py-2 text-foreground">{s.region_code}</td>
                  <td className="px-3 py-2 text-foreground">{s.domain}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-sm uppercase text-[10px] tracking-widest ${
                      s.status === "active" ? "bg-green-100 text-green-700" :
                      s.status === "reviewed" ? "bg-blue-100 text-blue-700" :
                      "bg-muted text-muted-foreground"
                    }`}>{s.status}</span>
                  </td>
                  <td className="px-3 py-2 text-right text-foreground">{s.eval_score ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{new Date(s.seeded_at).toISOString().split("T")[0]}</td>
                  <td className="px-3 py-2 text-right">
                    {s.status !== "active" ? (
                      <Button size="sm" variant="outline" className="font-mono text-[10px] h-7" disabled={actionId === s.id} onClick={() => void act(s.id, "promote")}>
                        {actionId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Promote"}
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="font-mono text-[10px] h-7 text-muted-foreground" disabled={actionId === s.id} onClick={() => void act(s.id, "demote")}>
                        {actionId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Demote"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
