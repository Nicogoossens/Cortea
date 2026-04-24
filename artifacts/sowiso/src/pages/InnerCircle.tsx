import { useMemo, useRef, useState, useCallback } from "react";
import { useGetProfile } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TierGate } from "@/components/TierGate";
import { LockOverlay } from "@/components/LockOverlay";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { Users, Globe, Link2, Download, Check } from "lucide-react";
import { toPng } from "html-to-image";

const SIMULATED_PRESENCE: { city: string; region: string; count: number; col: number; row: number }[] = [
  { city: "London",        region: "GB", count: 12, col: 2, row: 1 },
  { city: "Paris",         region: "FR", count: 9,  col: 4, row: 1 },
  { city: "New York",      region: "US", count: 11, col: 0, row: 2 },
  { city: "Dubai",         region: "AE", count: 7,  col: 6, row: 2 },
  { city: "Tokyo",         region: "JP", count: 6,  col: 8, row: 1 },
  { city: "Singapore",     region: "SG", count: 5,  col: 7, row: 3 },
  { city: "Amsterdam",     region: "NL", count: 4,  col: 3, row: 0 },
  { city: "Sydney",        region: "AU", count: 4,  col: 9, row: 4 },
  { city: "Milan",         region: "IT", count: 5,  col: 5, row: 2 },
  { city: "Hong Kong",     region: "CN", count: 8,  col: 7, row: 2 },
  { city: "Los Angeles",   region: "US", count: 6,  col: 1, row: 3 },
  { city: "Berlin",        region: "DE", count: 4,  col: 4, row: 0 },
  { city: "São Paulo",     region: "BR", count: 3,  col: 2, row: 4 },
  { city: "Johannesburg",  region: "ZA", count: 3,  col: 5, row: 4 },
  { city: "Toronto",       region: "CA", count: 5,  col: 0, row: 1 },
  { city: "Madrid",        region: "ES", count: 4,  col: 3, row: 2 },
];

function HexCell({ count, city, isActive }: { count: number; city: string; isActive: boolean }) {
  const size = Math.min(44, 28 + count * 1.4);
  const opacity = 0.3 + (count / 14) * 0.65;

  return (
    <div className="flex flex-col items-center gap-1 group cursor-default">
      <div
        className="transition-all duration-300 flex items-center justify-center"
        style={{
          width: size,
          height: size * 1.1547,
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          background: isActive
            ? `rgba(180, 140, 80, ${opacity})`
            : `rgba(100, 100, 120, ${opacity * 0.5})`,
          boxShadow: isActive ? `0 0 ${count * 2}px rgba(180, 140, 80, ${opacity * 0.4})` : "none",
        }}
        title={`${city}: ${count} members`}
      >
        <span className="text-[9px] font-mono font-bold text-white/80">{count}</span>
      </div>
      <span className="text-[8px] text-muted-foreground font-light opacity-0 group-hover:opacity-100 transition-opacity text-center leading-tight max-w-[56px] truncate">
        {city}
      </span>
    </div>
  );
}

function ProximityMap({ highlighted }: { highlighted?: string }) {
  const cols = 10;
  const rows = 5;

  const grid = useMemo(() => {
    const map: Record<string, { city: string; region: string; count: number }> = {};
    SIMULATED_PRESENCE.forEach((p) => {
      map[`${p.col},${p.row}`] = { city: p.city, region: p.region, count: p.count };
    });
    return map;
  }, []);

  return (
    <div className="overflow-x-auto">
      <div
        className="grid gap-1 mx-auto"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, maxWidth: 520, minWidth: 320 }}
      >
        {Array.from({ length: rows }).map((_, row) =>
          Array.from({ length: cols }).map((_, col) => {
            const key = `${col},${row}`;
            const cell = grid[key];
            if (cell) {
              return (
                <HexCell
                  key={key}
                  count={cell.count}
                  city={cell.city}
                  isActive={!highlighted || cell.region === highlighted}
                />
              );
            }
            return (
              <div
                key={key}
                className="mx-auto opacity-10"
                style={{
                  width: 28,
                  height: 32,
                  clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  background: "rgba(120,120,140,0.2)",
                }}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

export default function InnerCircle() {
  const { data: profile } = useGetProfile();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const tier = profile?.subscription_tier ?? "guest";
  const hasAccess = isAuthenticated && tier === "ambassador";

  const handleCopyLink = useCallback(() => {
    if (copied) return;
    const url = `${window.location.origin}/inner-circle`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      setCopied(false);
    });
  }, [copied]);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = "cortea-calling-card.png";
      link.href = dataUrl;
      link.click();
    } catch {
      // Silent failure — browser may block on strict CSP environments
    } finally {
      setDownloading(false);
    }
  }, [downloading]);

  const totalMembers = SIMULATED_PRESENCE.reduce((sum, p) => sum + p.count, 0);
  const topCity = [...SIMULATED_PRESENCE].sort((a, b) => b.count - a.count)[0];

  if (!hasAccess) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-serif text-foreground">{t("inner_circle.title")}</h1>
            <Badge variant="outline" className="font-mono text-xs tracking-widest uppercase border-amber-400/40 text-amber-600">Ambassador</Badge>
          </div>
          <p className="text-muted-foreground text-lg font-light max-w-2xl">
            {t("inner_circle.gated_subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <div className="relative rounded-sm overflow-hidden bg-muted border border-border p-8 flex flex-col items-center justify-center gap-6 min-h-[240px]">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted-foreground blur-[2px]" aria-hidden="true">
                <Users className="h-10 w-10 opacity-20" />
                <p className="text-sm font-light">Members present across the world.</p>
              </div>
              <LockOverlay
                requiredTier="ambassador"
                teaser="See where fellow Ambassadors are active, and share your own discreet digital calling card."
                isAuthenticated={isAuthenticated}
                variant="section"
              />
            </div>
          </div>
          <div className="lg:col-span-2">
            <TierGate feature="The Inner Circle" requiredTier="ambassador" isAuthenticated={isAuthenticated} teaser="Discover where the community moves. Share a refined digital calling card with peers of equal standing." />
          </div>
        </div>
      </div>
    );
  }

  const name = profile?.full_name ?? "Anonymous Ambassador";
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : "Recently";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-serif text-foreground">{t("inner_circle.title")}</h1>
          <Badge variant="outline" className="font-mono text-xs tracking-widest uppercase border-amber-400/40 text-amber-600">Ambassador</Badge>
        </div>
        <p className="text-muted-foreground text-lg font-light max-w-2xl">
          {t("inner_circle.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="uppercase tracking-widest text-xs font-semibold">{t("inner_circle.ambassador_presence")}</CardDescription>
                <span className="text-xs font-mono text-muted-foreground">{totalMembers} members · {SIMULATED_PRESENCE.length} cities</span>
              </div>
              <CardTitle className="font-serif text-lg">{t("inner_circle.global_distribution")}</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <ProximityMap />
              <p className="text-xs text-muted-foreground font-light mt-4 leading-relaxed text-center">
                {t("inner_circle.map_note")}
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-3">
            <Card className="border-border/40">
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-2xl font-serif text-foreground">{totalMembers}</p>
                <p className="text-xs text-muted-foreground font-light uppercase tracking-widest mt-1">{t("inner_circle.ambassadors")}</p>
              </CardContent>
            </Card>
            <Card className="border-border/40">
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-2xl font-serif text-foreground">{SIMULATED_PRESENCE.length}</p>
                <p className="text-xs text-muted-foreground font-light uppercase tracking-widest mt-1">{t("inner_circle.cities")}</p>
              </CardContent>
            </Card>
            <Card className="border-border/40">
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-lg font-serif text-foreground truncate">{topCity?.city}</p>
                <p className="text-xs text-muted-foreground font-light uppercase tracking-widest mt-1">{t("inner_circle.most_active")}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card ref={cardRef} className="border-amber-400/20 bg-gradient-to-br from-amber-50/30 to-transparent dark:from-amber-900/10">
            <CardHeader className="pb-2">
              <CardDescription className="uppercase tracking-widest text-xs font-semibold text-amber-700/70">{t("inner_circle.calling_card")}</CardDescription>
              <CardTitle className="font-serif text-xl text-foreground">{name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-0.5">{t("inner_circle.standing")}</p>
                  <p className="font-medium text-amber-700">Ambassador</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-0.5">{t("inner_circle.member_since")}</p>
                  <p className="font-light text-foreground">{memberSince}</p>
                </div>
                {profile?.noble_score !== undefined && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-0.5">Noble Score</p>
                    <p className="font-medium text-foreground">{profile.noble_score}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-0.5">{t("inner_circle.platform")}</p>
                  <p className="font-light text-foreground">Cortéa</p>
                </div>
              </div>

              <div className="pt-3 border-t border-border/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="font-light">{t("inner_circle.privacy_note")}</span>
                </div>
              </div>

              <div
                className="w-full h-20 rounded-sm border border-amber-400/20 flex items-center justify-center"
                style={{
                  background: "repeating-linear-gradient(60deg, rgba(180,140,60,0.05) 0px, rgba(180,140,60,0.05) 1px, transparent 1px, transparent 12px)",
                }}
                aria-label="Decorative calling card pattern"
              >
                <span className="font-serif text-3xl tracking-widest text-amber-600/30 select-none">Cortéa</span>
              </div>

            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 text-xs border-border/50"
              onClick={handleCopyLink}
              disabled={copied}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  {t("inner_circle.link_copied")}
                </>
              ) : (
                <>
                  <Link2 className="h-3.5 w-3.5" />
                  {t("inner_circle.copy_link")}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 text-xs border-border/50"
              onClick={handleDownload}
              disabled={downloading}
            >
              <Download className="h-3.5 w-3.5" />
              {t("inner_circle.download_card")}
            </Button>
          </div>

          <Card className="border-border/30 bg-muted/10">
            <CardContent className="flex items-start gap-3 py-4 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span className="font-light leading-relaxed">{t("inner_circle.data_note")}</span>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
