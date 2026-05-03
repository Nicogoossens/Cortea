import { useMemo, useRef, useState, useCallback } from "react";
import { useGetProfile } from "@workspace/api-client-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TierGate } from "@/components/TierGate";
import { LockOverlay } from "@/components/LockOverlay";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { Users, Globe, Link2, Download, Check } from "lucide-react";
import { toPng } from "html-to-image";

function DownloadCard({ name, memberSince, nobleScore }: { name: string; memberSince: string; nobleScore?: number }) {
  const CARD_W = 480;
  const CARD_H = 280;
  const GOLD = "#b8965a";
  const GOLD_LIGHT = "#d4af70";
  const GOLD_MUTED = "rgba(184,150,90,0.18)";
  const BG_TOP = "#1a1510";
  const BG_BTM = "#100d08";
  const TEXT_PRIMARY = "#f5f0e8";
  const TEXT_MUTED = "rgba(245,240,232,0.52)";
  const TEXT_GOLD = "#c9a96e";

  const stripeCount = 28;
  const stripes = Array.from({ length: stripeCount });

  return (
    <div
      style={{
        width: CARD_W,
        height: CARD_H,
        background: `linear-gradient(145deg, ${BG_TOP} 0%, ${BG_BTM} 100%)`,
        borderRadius: 6,
        overflow: "hidden",
        position: "relative",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        boxSizing: "border-box",
      }}
    >
      {stripes.map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: (CARD_W / stripeCount) * i,
            width: 1,
            background: `rgba(184,150,90,${i % 2 === 0 ? 0.04 : 0.02})`,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `repeating-linear-gradient(
            60deg,
            rgba(184,150,90,0.035) 0px,
            rgba(184,150,90,0.035) 1px,
            transparent 1px,
            transparent 14px
          )`,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(184,150,90,0.12) 0%, transparent 70%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -40,
          left: -40,
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(184,150,90,0.08) 0%, transparent 70%)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, transparent 0%, ${GOLD} 30%, ${GOLD_LIGHT} 50%, ${GOLD} 70%, transparent 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 1,
          background: `linear-gradient(90deg, transparent 0%, ${GOLD_MUTED} 50%, transparent 100%)`,
        }}
      />

      <div style={{ position: "relative", padding: "28px 32px 24px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: TEXT_GOLD, marginBottom: 6, fontFamily: "'Arial', sans-serif", fontWeight: 600 }}>
                Cortéa · Ambassador
              </div>
              <div style={{ fontSize: 26, color: TEXT_PRIMARY, letterSpacing: "0.02em", lineHeight: 1.2 }}>
                {name}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{
                fontSize: 22,
                letterSpacing: "0.18em",
                color: GOLD,
                opacity: 0.22,
                fontFamily: "'Georgia', serif",
                lineHeight: 1,
              }}>
                ✦
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px 24px", marginTop: 4 }}>
            <div>
              <div style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: TEXT_MUTED, fontFamily: "'Arial', sans-serif", fontWeight: 600, marginBottom: 4 }}>Standing</div>
              <div style={{ fontSize: 13, color: TEXT_GOLD, fontFamily: "'Arial', sans-serif", fontWeight: 500 }}>Ambassador</div>
            </div>
            <div>
              <div style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: TEXT_MUTED, fontFamily: "'Arial', sans-serif", fontWeight: 600, marginBottom: 4 }}>Member Since</div>
              <div style={{ fontSize: 13, color: TEXT_PRIMARY, fontFamily: "'Arial', sans-serif", fontWeight: 300 }}>{memberSince}</div>
            </div>
            {nobleScore !== undefined && (
              <div>
                <div style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: TEXT_MUTED, fontFamily: "'Arial', sans-serif", fontWeight: 600, marginBottom: 4 }}>Noble Score</div>
                <div style={{ fontSize: 13, color: TEXT_PRIMARY, fontFamily: "'Arial', sans-serif", fontWeight: 400 }}>{nobleScore}</div>
              </div>
            )}
          </div>
        </div>

        <div>
          <div style={{ height: 1, background: `linear-gradient(90deg, ${GOLD_MUTED} 0%, transparent 100%)`, marginBottom: 16 }} />
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div style={{ fontSize: 8, color: TEXT_MUTED, fontFamily: "'Arial', sans-serif", letterSpacing: "0.12em", maxWidth: 260, lineHeight: 1.6 }}>
              This card is issued to verified Ambassadors of the Cortéa platform.<br />
              Discreet · Exclusive · Global
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 28, color: GOLD, opacity: 0.55, letterSpacing: "0.08em", lineHeight: 1 }}>
                Cortéa
              </div>
              <div style={{ fontSize: 7, letterSpacing: "0.28em", textTransform: "uppercase", color: TEXT_MUTED, fontFamily: "'Arial', sans-serif", marginTop: 3 }}>
                Inner Circle
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  usePageTitle("Inner Circle");
  const { data: profile } = useGetProfile();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const downloadCardRef = useRef<HTMLDivElement>(null);
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
    if (!downloadCardRef.current || downloading) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(downloadCardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#100d08",
      });
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
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: -10000,
          pointerEvents: "none",
          opacity: 0,
        }}
      >
        <div ref={downloadCardRef}>
          <DownloadCard name={name} memberSince={memberSince} nobleScore={profile?.noble_score} />
        </div>
      </div>

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
          <Card className="border-amber-400/20 bg-gradient-to-br from-amber-50/30 to-transparent dark:from-amber-900/10">
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
