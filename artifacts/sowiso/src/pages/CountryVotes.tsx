import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Vote, Check, Search, Lock, Globe, Calendar } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { usePageTitle } from "@/hooks/usePageTitle";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type VotableCountry = { region_code: string; region_name: string; flag_emoji: string | null };
type Vote = { region_code: string; created_at: string };

export default function CountryVotes() {
  usePageTitle("Stem op nieuwe landen");
  const { isAuthenticated } = useAuth();
  const [countries, setCountries] = useState<VotableCountry[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [period, setPeriod] = useState<string>("");
  const [maxVotes, setMaxVotes] = useState(5);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, m] = await Promise.all([
        fetch(`${API_BASE}/api/votes/countries`, { credentials: "include" }),
        fetch(`${API_BASE}/api/votes/me`, { credentials: "include" }),
      ]);
      if (c.ok) {
        const data = await c.json();
        setCountries(data.countries || []);
        setMaxVotes(data.max_votes || 5);
        setPeriod(data.period || "");
      }
      if (m.ok) {
        const data = await m.json();
        setVotes(data.votes || []);
        if (data.period) setPeriod(data.period);
        if (data.max_votes) setMaxVotes(data.max_votes);
      }
    } catch {
      setError("Kon de lijst niet laden. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) refresh();
  }, [isAuthenticated, refresh]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-6">
        <Lock className="w-12 h-12 mx-auto text-muted-foreground/40" aria-hidden="true" />
        <h1 className="text-2xl font-serif">Stem op nieuwe landen</h1>
        <p className="text-muted-foreground font-light">
          Alleen geregistreerde gebruikers kunnen stemmen op de landen die als volgende worden toegevoegd.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/signin"><Button className="font-serif">Aanmelden</Button></Link>
          <Link href="/register"><Button variant="outline" className="font-serif">Registreren</Button></Link>
        </div>
      </div>
    );
  }

  const votedCodes = new Set(votes.map((v) => v.region_code));
  const remaining = Math.max(0, maxVotes - votes.length);

  const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const filtered = countries.filter((c) => {
    if (!query.trim()) return true;
    const q = normalize(query.trim());
    return normalize(c.region_name).includes(q) || normalize(c.region_code).includes(q);
  });

  async function castVote(code: string) {
    if (busy) return;
    setBusy(code);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/votes`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region_code: code }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Kon je stem niet opslaan.");
      } else {
        await refresh();
      }
    } finally {
      setBusy(null);
    }
  }

  async function removeVote(code: string) {
    if (busy) return;
    setBusy(code);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/votes/${code}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Kon stem niet verwijderen.");
      } else {
        await refresh();
      }
    } finally {
      setBusy(null);
    }
  }

  const periodLabel = (() => {
    if (!period) return "";
    const [y, m] = period.split("-");
    const months = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
    const mi = parseInt(m, 10) - 1;
    return `${months[mi] || m} ${y}`;
  })();

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Vote className="w-6 h-6 text-primary" aria-hidden="true" />
          <h1 className="text-3xl font-serif text-foreground">Stem op nieuwe landen</h1>
        </div>
        <p className="text-muted-foreground font-light text-sm">
          Help bepalen welke landen we als volgende uitwerken. Je hebt elke maand {maxVotes} stemmen.
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono text-muted-foreground">Stemperiode:</span>
              <span className="font-serif">{periodLabel || period}</span>
            </div>
            <div className="text-sm">
              <span className="font-serif text-2xl text-primary">{votes.length}</span>
              <span className="text-muted-foreground"> / {maxVotes} stemmen gebruikt</span>
              {remaining > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">({remaining} resterend)</span>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-light">
            Stemmen worden elke kalendermaand gereset. Je kunt je keuze altijd aanpassen.
          </p>
        </CardContent>
      </Card>

      {votes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-wider">Jouw keuzes deze maand</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {votes.map((v) => {
              const c = countries.find((x) => x.region_code === v.region_code);
              return (
                <div key={v.region_code} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{c?.flag_emoji || "🏳"}</span>
                    <div>
                      <div className="font-serif">{c?.region_name || v.region_code}</div>
                      <div className="text-xs font-mono text-muted-foreground">{v.region_code}</div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeVote(v.region_code)}
                    disabled={busy === v.region_code}
                    className="text-xs"
                  >
                    Verwijder
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-md border border-destructive/30 bg-destructive/5 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Nog te verwerken landen
          </CardTitle>
          <CardDescription>
            Klik op een land om je stem uit te brengen. Landen die al beschikbaar zijn in de Compass staan niet in deze lijst.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Zoek een land…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 font-light">
              Geen landen gevonden.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filtered.map((c) => {
                const isVoted = votedCodes.has(c.region_code);
                const canVote = !isVoted && remaining > 0;
                return (
                  <button
                    key={c.region_code}
                    onClick={() => isVoted ? removeVote(c.region_code) : castVote(c.region_code)}
                    disabled={(!canVote && !isVoted) || busy === c.region_code}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors
                      ${isVoted
                        ? "border-primary bg-primary/10 hover:bg-primary/15"
                        : canVote
                          ? "border-border hover:border-primary/50 hover:bg-accent/30"
                          : "border-border/50 opacity-50 cursor-not-allowed"
                      }`}
                  >
                    <span className="text-2xl">{c.flag_emoji || "🏳"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-serif truncate">{c.region_name}</div>
                      <div className="text-xs font-mono text-muted-foreground">{c.region_code}</div>
                    </div>
                    {isVoted && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
