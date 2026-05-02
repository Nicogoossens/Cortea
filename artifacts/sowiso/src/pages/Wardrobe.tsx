import { useGetProfile } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ShirtIcon, Lock, ArrowLeft, Star } from "lucide-react";
import { levelKey } from "@/lib/content-labels";

interface WardrobeItem {
  id: string;
  name: string;
  region: string;
  pillar: number;
  unlocked_at: string;
}

interface AvatarState {
  rank_badge: string;
  style_tier: number;
}

const ALL_WARDROBE_ITEMS: Array<{
  id: string;
  name_en: string;
  region: string;
  pillar: number;
  min_score: number;
  description_en: string;
}> = [
  { id: "italian_suit", name_en: "Italian Suit", region: "IT", pillar: 2, min_score: 20, description_en: "The cornerstone of European tailoring — structured, understated, and immaculate." },
  { id: "arabic_thobe", name_en: "Arabic Thobe", region: "SA", pillar: 2, min_score: 40, description_en: "The pristine white thobe — an emblem of dignity, purity, and the highest social regard." },
  { id: "japanese_hakama", name_en: "Japanese Hakama", region: "JP", pillar: 2, min_score: 60, description_en: "The pleated ceremonial garment — worn at the most formal of occasions with composed reverence." },
  { id: "scottish_tartan", name_en: "Scottish Tartan", region: "GB", pillar: 2, min_score: 80, description_en: "The tartan — each thread a family lineage, each pattern a legacy worn with quiet pride." },
];

const REGION_FLAGS: Record<string, string> = {
  IT: "🇮🇹",
  SA: "🇸🇦",
  JP: "🇯🇵",
  GB: "🇬🇧",
  FR: "🇫🇷",
  DE: "🇩🇪",
};

function AvatarDisplay({ avatarState, streak }: { avatarState?: AvatarState | null; streak: number }) {
  const tier = avatarState?.style_tier ?? 1;
  const tierColors = [
    "from-stone-200 to-stone-300",
    "from-teal-100 to-teal-200",
    "from-violet-100 to-violet-200",
    "from-amber-100 to-amber-200",
    "from-rose-100 to-rose-200",
  ];
  const ringColors = [
    "ring-stone-300",
    "ring-teal-300",
    "ring-violet-300",
    "ring-amber-400",
    "ring-rose-400",
  ];

  const tierColor = tierColors[Math.min(tier - 1, 4)];
  const ringColor = ringColors[Math.min(tier - 1, 4)];

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`relative w-28 h-28 rounded-full bg-gradient-to-br ${tierColor} ring-2 ${ringColor} flex items-center justify-center shadow-md`}>
        <ShirtIcon className="w-12 h-12 text-foreground/30" aria-hidden="true" />
        {tier >= 3 && (
          <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-sm">
            <Star className="w-3.5 h-3.5 text-primary-foreground fill-primary-foreground" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="text-center space-y-0.5">
        <p className="font-serif text-base text-foreground">{avatarState?.rank_badge ?? "The Aware"}</p>
        <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
          Style Tier {tier}
          {streak > 0 && <span className="ml-2 text-primary">· {streak}d streak</span>}
        </p>
      </div>
    </div>
  );
}

export default function Wardrobe() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { data: profile, isLoading } = useGetProfile();

  const wardrobeItems: WardrobeItem[] = (profile as { wardrobe_unlocks?: WardrobeItem[] } | undefined)?.wardrobe_unlocks ?? [];
  const avatarState: AvatarState | null = (profile as { avatar_state?: AvatarState | null } | undefined)?.avatar_state ?? null;
  const streak: number = (profile as { daily_streak?: number } | undefined)?.daily_streak ?? 0;
  const unlockedIds = new Set(wardrobeItems.map((w) => w.id));

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48 rounded-sm" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

      <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
        {t("nav.dashboard")}
      </Link>

      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-serif text-foreground">{t("wardrobe.title")}</h1>
        <p className="text-muted-foreground text-lg max-w-2xl font-light">
          {t("wardrobe.subtitle")}
        </p>
      </div>

      <div className="flex items-center justify-center py-8 border border-border/50 rounded-sm bg-card">
        <AvatarDisplay avatarState={avatarState} streak={streak} />
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="font-serif text-2xl">{t("wardrobe.title")}</h2>
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground border border-border/50 rounded-[2px] px-2 py-0.5">
            {wardrobeItems.length} / {ALL_WARDROBE_ITEMS.length} {t("wardrobe.unlocked")}
          </span>
        </div>

        {wardrobeItems.length === 0 && (
          <div className="py-12 text-center space-y-4 border border-dashed border-border rounded-sm bg-muted/10">
            <ShirtIcon className="w-12 h-12 mx-auto opacity-20" aria-hidden="true" />
            <p className="font-serif text-xl text-muted-foreground">{t("wardrobe.empty")}</p>
            <p className="text-sm text-muted-foreground/70 max-w-sm mx-auto">{t("wardrobe.empty_hint")}</p>
            <Link href="/atelier">
              <button className="text-sm underline underline-offset-2 text-primary/70 hover:text-primary transition-colors">
                {t("wardrobe.go_to_atelier")}
              </button>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ALL_WARDROBE_ITEMS.map((item) => {
            const isUnlocked = unlockedIds.has(item.id);
            const unlockedItem = wardrobeItems.find((w) => w.id === item.id);
            const flag = REGION_FLAGS[item.region] ?? "🌍";

            return (
              <Card
                key={item.id}
                className={`overflow-hidden transition-all duration-300 ${
                  isUnlocked
                    ? "border-primary/20 bg-card hover:border-primary/40 hover:shadow-md"
                    : "border-border/40 bg-muted/10"
                }`}
              >
                <div className={`h-1.5 w-full ${isUnlocked ? "bg-primary" : "bg-muted"}`} aria-hidden="true" />
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className={`text-3xl ${isUnlocked ? "" : "opacity-20 grayscale"}`}>
                      {flag}
                    </div>
                    {!isUnlocked && (
                      <Lock className="w-4 h-4 text-muted-foreground/40" aria-hidden="true" />
                    )}
                    {isUnlocked && (
                      <span className="text-[10px] font-mono uppercase tracking-widest text-primary border border-primary/30 rounded-[2px] px-1.5 py-0.5">
                        {t("wardrobe.unlocked")}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className={`font-serif text-lg leading-tight ${isUnlocked ? "text-foreground" : "text-muted-foreground/40 blur-[1px]"}`}>
                      {isUnlocked ? item.name_en : "···········"}
                    </h3>
                    <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                      {item.region} · {t("wardrobe.pillar_required").replace("2 — The Presence", `${item.pillar}`)}
                    </p>
                  </div>

                  {isUnlocked ? (
                    <p className="text-xs text-muted-foreground/80 font-light leading-relaxed">
                      {item.description_en}
                    </p>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground/50 font-light">
                        {t("wardrobe.pillar_required")}
                      </p>
                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-muted-foreground/20 rounded-full" style={{ width: "0%" }} />
                      </div>
                    </div>
                  )}

                  {isUnlocked && unlockedItem && (
                    <p className="text-[10px] font-mono text-muted-foreground/50">
                      {t("wardrobe.unlock_at").replace("{{date}}", new Date(unlockedItem.unlocked_at).toLocaleDateString())}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {!isAuthenticated && (
        <div className="text-center py-8 space-y-4">
          <p className="text-muted-foreground">{t("wardrobe.pillar_required")}</p>
          <Link href="/register">
            <button className="text-sm underline underline-offset-2 text-primary/70 hover:text-primary transition-colors">
              {t("lock.cta.register")}
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
