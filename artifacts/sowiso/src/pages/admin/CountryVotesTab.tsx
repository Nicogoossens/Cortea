import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/i18n";
import { useAdminFetch } from "@/lib/useAdminFetch";
import { Vote } from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type VoteTally = { region_code: string; region_name: string; flag_emoji: string | null; votes: number };
type PeriodSummary = { period_ym: string; total_votes: number; unique_voters: number };

export function CountryVotesTab({ authHeaders }: { authHeaders: Record<string, string> }) {
  const { t } = useLanguage();
  const adminFetch = useAdminFetch();
  const [period, setPeriod] = useState<string>("");
  const [currentPeriod, setCurrentPeriod] = useState<string>("");
  const [tally, setTally] = useState<VoteTally[]>([]);
  const [periods, setPeriods] = useState<PeriodSummary[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async (p?: string) => {
    setLoading(true);
    setErr(null);
    try {
      const url = p ? `${API_BASE}/api/admin/votes/countries?period=${encodeURIComponent(p)}` : `${API_BASE}/api/admin/votes/countries`;
      const res = await adminFetch(url, { headers: authHeaders });
      if (!res.ok) {
        setErr(`Kon overzicht niet laden (${res.status}).`);
        return;
      }
      const data = await res.json();
      setPeriod(data.period || "");
      setCurrentPeriod(data.current_period || "");
      setTally(data.tally || []);
      setPeriods(data.periods || []);
      setTotalVotes(data.total_votes || 0);
    } catch {
      setErr(t("admin.settings.load_error"));
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => { load(); }, [load]);

  const periodLabel = (ym: string) => {
    if (!ym) return "";
    const [y, m] = ym.split("-");
    const months = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
    const mi = parseInt(m, 10) - 1;
    return `${months[mi] || m} ${y}`;
  };

  const maxVotes = tally.reduce((m, t) => Math.max(m, t.votes), 0) || 1;

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Vote className="w-5 h-5" />
            Country votes — period overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-xs font-mono text-muted-foreground">Period:</label>
            <select
              value={period}
              onChange={(e) => load(e.target.value)}
              className="text-sm font-mono px-2 py-1 rounded-sm border border-border bg-background"
            >
              {(periods.length ? periods : [{ period_ym: period || currentPeriod, total_votes: 0, unique_voters: 0 }]).map((p) => (
                <option key={p.period_ym} value={p.period_ym}>
                  {periodLabel(p.period_ym)} {p.period_ym === currentPeriod ? "(huidig)" : ""}
                </option>
              ))}
            </select>
            <span className="text-xs font-mono text-muted-foreground ml-auto">
              {totalVotes} totaal stemmen · {tally.length} landen
            </span>
          </div>

          {err && (
            <div className="p-3 rounded-md border border-destructive/30 bg-destructive/5 text-sm text-destructive">{err}</div>
          )}

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 rounded-sm" />)}
            </div>
          ) : tally.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center font-light">
              Nog geen stemmen voor deze periode.
            </p>
          ) : (
            <div className="space-y-1">
              {tally.map((t, idx) => (
                <div key={t.region_code} className="flex items-center gap-3 py-2 px-3 rounded-sm hover:bg-accent/30">
                  <span className="text-xs font-mono text-muted-foreground w-6 text-right">{idx + 1}.</span>
                  <span className="text-xl">{t.flag_emoji || "🏳"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-serif text-sm truncate">{t.region_name}</div>
                    <div className="text-xs font-mono text-muted-foreground">{t.region_code}</div>
                  </div>
                  <div className="w-32 hidden sm:block">
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${(t.votes / maxVotes) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-mono tabular-nums w-12 text-right">{t.votes}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {periods.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-serif text-base">Maandelijkse activiteit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {periods.map((p) => (
                <div key={p.period_ym} className="flex items-center gap-3 text-sm py-1.5 px-2 rounded-sm hover:bg-accent/30">
                  <button
                    onClick={() => load(p.period_ym)}
                    className={`font-mono w-24 text-left hover:text-primary ${p.period_ym === period ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {periodLabel(p.period_ym)}
                  </button>
                  <span className="text-xs font-mono text-muted-foreground">
                    {p.total_votes} stemmen · {p.unique_voters} {p.unique_voters === 1 ? "stemmer" : "stemmers"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
