import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n";
import { useActiveRegion, FlagEmoji } from "@/lib/active-region";
import { useGetProfile } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { LockOverlay } from "@/components/LockOverlay";
import { Utensils, Briefcase, Heart, Star, Anchor, Hand, Gift, Lock, Crown, ArrowRight } from "lucide-react";

interface Situation {
  id: string;
  icon: React.ElementType;
  nameKey: string;
  descKey: string;
  ambassadorOnly?: boolean;
  tips: {
    universal: { do: string; dont: string }[];
    byRegion: Record<string, { do: string; dont: string }[]>;
  };
}

const SITUATIONS: Situation[] = [
  {
    id: "restaurant",
    icon: Utensils,
    nameKey: "situations.restaurant.name",
    descKey: "situations.restaurant.desc",
    tips: {
      universal: [
        { do: "Wait to be seated; do not choose your own table at a formal restaurant.", dont: "Do not begin eating before the host invites everyone to start." },
        { do: "Place the napkin on your lap immediately upon sitting.", dont: "Do not tuck the napkin into your collar." },
        { do: "Order from left to right on the menu; the entrée precedes the main course.", dont: "Do not speak with food in your mouth or gesture with cutlery." },
        { do: "Taste food before seasoning; the chef's work deserves respect.", dont: "Do not ask for a doggy bag at a fine dining establishment." },
        { do: "Signal the end of your meal by placing cutlery at five o'clock on the plate.", dont: "Do not reach across another guest — ask for items to be passed." },
      ],
      byRegion: {
        JP: [
          { do: "Say 'Itadakimasu' before eating and 'Gochisousama deshita' after.", dont: "Do not pass food directly between chopsticks — a funeral ritual." },
        ],
        CN: [
          { do: "Wait for the host to invite you to eat before beginning.", dont: "Do not flip a whole fish — turn only the top portion to the other side." },
        ],
        FR: [
          { do: "Wine is selected by the host; defer unless asked your preference.", dont: "Do not ask for a to-go box — the meal ends at the table." },
        ],
        AE: [
          { do: "Accept all offered dishes graciously; refusal can offend.", dont: "Do not use the left hand for eating or passing dishes." },
        ],
        GB: [
          { do: "Follow your host's lead in ordering; do not over-order.", dont: "Do not place elbows on the table during the meal." },
        ],
      },
    },
  },
  {
    id: "meeting",
    icon: Briefcase,
    nameKey: "situations.meeting.name",
    descKey: "situations.meeting.desc",
    tips: {
      universal: [
        { do: "Arrive two to five minutes early; punctuality is professionalism.", dont: "Do not check your phone during a meeting — your attention is owed." },
        { do: "Exchange business cards with care — present with both hands in Asian contexts.", dont: "Do not interrupt a senior colleague or the client." },
        { do: "Prepare your materials thoroughly; credibility is earned by preparation.", dont: "Do not undermine a colleague in front of others." },
        { do: "Summarise decisions clearly at the meeting's close.", dont: "Do not make promises you cannot deliver." },
        { do: "Follow up with a written summary within 24 hours.", dont: "Do not remain seated when a senior person enters the room." },
      ],
      byRegion: {
        DE: [
          { do: "Arrive precisely on time — not early, not late.", dont: "Do not make jokes in a first business meeting." },
        ],
        JP: [
          { do: "Allow silences; they signal thought, not discomfort.", dont: "Do not push for decisions in the first meeting." },
        ],
        AE: [
          { do: "Relationship-building precedes all business discussion.", dont: "Do not schedule important meetings during prayer times." },
        ],
        US: [
          { do: "Be direct and concise; executives value their time.", dont: "Do not over-formalize — casual professionalism is the standard." },
        ],
      },
    },
  },
  {
    id: "wedding",
    icon: Heart,
    nameKey: "situations.wedding.name",
    descKey: "situations.wedding.desc",
    tips: {
      universal: [
        { do: "Dress according to the dress code stated on the invitation.", dont: "Do not wear white, ivory, or cream as a guest — it belongs to the bride." },
        { do: "Arrive before the ceremony begins; late entry is conspicuous.", dont: "Do not give unsolicited speeches or draw attention from the couple." },
        { do: "Bring a gift from the wedding list or give a thoughtful cash gift.", dont: "Do not bring uninvited guests." },
        { do: "Congratulate the couple and their families warmly.", dont: "Do not discuss past relationships of either partner." },
        { do: "Follow the seating plan; it has been arranged with care.", dont: "Do not over-indulge at the reception and become conspicuous." },
      ],
      byRegion: {
        IN: [
          { do: "Wear vibrant colours — bright attire is a compliment.", dont: "Do not wear white or black — both are associated with mourning." },
        ],
        CN: [
          { do: "Give monetary gifts in red envelopes.", dont: "Do not give clocks, pears, or shoes — all unlucky in Chinese culture." },
        ],
        AE: [
          { do: "Dress modestly; men and women may celebrate in separate spaces.", dont: "Do not bring alcohol unless the hosts have indicated it is welcome." },
        ],
      },
    },
  },
  {
    id: "gala",
    icon: Star,
    nameKey: "situations.gala.name",
    descKey: "situations.gala.desc",
    tips: {
      universal: [
        { do: "Arrive within 15 minutes of the stated time — no earlier, no later.", dont: "Do not arrive before the host is ready to receive guests." },
        { do: "Dress to the theme precisely; black tie means black tie.", dont: "Do not confuse business formal with black tie attire." },
        { do: "Introduce yourself graciously when meeting new guests.", dont: "Do not discuss business aggressively at a gala — it is a social occasion." },
        { do: "Give every person your full attention when conversing.", dont: "Do not scan the room while speaking to someone — it signals disinterest." },
        { do: "Thank the host personally before departing.", dont: "Do not leave before the guest of honour without notice." },
      ],
      byRegion: {
        GB: [
          { do: "Wait for the formal toast before drinking.", dont: "Do not begin eating the seated dinner before the host." },
        ],
        FR: [
          { do: "Conversation and wit are the currency of the evening.", dont: "Do not discuss money, salary, or personal wealth." },
        ],
        AE: [
          { do: "Greet senior guests first; seniority governs the social order.", dont: "Do not wear revealing attire even at formal galas." },
        ],
      },
    },
  },
  {
    id: "greeting",
    icon: Hand,
    nameKey: "situations.greeting.name",
    descKey: "situations.greeting.desc",
    tips: {
      universal: [
        { do: "Make direct eye contact when greeting — it conveys sincerity.", dont: "Do not initiate physical contact before reading the room." },
        { do: "Use titles and surnames until invited otherwise.", dont: "Do not mispronounce a name — if unsure, ask respectfully." },
        { do: "Offer a firm handshake when it is culturally appropriate.", dont: "Do not use a limp or excessively crushing handshake." },
        { do: "Wait to be introduced before approaching senior figures.", dont: "Do not interrupt someone who is being introduced." },
        { do: "Smile naturally; warmth is universally received positively.", dont: "Do not look away while being spoken to." },
      ],
      byRegion: {
        JP: [
          { do: "Bow at approximately 30 degrees for a formal greeting.", dont: "Do not initiate a handshake unless the Japanese person offers first." },
        ],
        FR: [
          { do: "Two cheek kisses (la bise) are standard in social contexts.", dont: "Do not skip the greeting of everyone present when entering a room." },
        ],
        IN: [
          { do: "Use 'Namaste' with hands pressed together in traditional settings.", dont: "Do not use the left hand to shake hands or hand over items." },
        ],
        AE: [
          { do: "Use the right hand for all greetings — the left is considered unclean.", dont: "Do not extend your hand to a woman unless she offers hers first." },
        ],
      },
    },
  },
  {
    id: "gifting",
    icon: Gift,
    nameKey: "situations.gifting.name",
    descKey: "situations.gifting.desc",
    tips: {
      universal: [
        { do: "Choose gifts that reflect thoughtfulness about the recipient.", dont: "Do not give overly extravagant gifts in professional contexts — it creates awkwardness." },
        { do: "Wrap the gift beautifully; presentation signals the care taken.", dont: "Do not give impersonal gifts — generic vouchers feel like afterthoughts." },
        { do: "Present the gift at the appropriate moment — typically at the end of a visit.", dont: "Do not expect a gift to be opened immediately in all cultures." },
        { do: "Accompany a gift with a handwritten card.", dont: "Do not give gifts that are culturally inauspicious without researching first." },
        { do: "Express genuine pleasure when receiving a gift, regardless of your reaction.", dont: "Do not immediately offer a reciprocal gift — it can seem transactional." },
      ],
      byRegion: {
        JP: [
          { do: "Give gifts with both hands and a slight bow.", dont: "Do not give gifts in sets of four — four (shi) sounds like death." },
        ],
        CN: [
          { do: "Red wrapping or red envelopes for monetary gifts signal good fortune.", dont: "Do not give clocks, umbrellas, shoes, or pears — all carry bad omens." },
        ],
        AE: [
          { do: "Give high-quality gifts that reflect generosity and refinement.", dont: "Do not give alcohol or gifts featuring dogs or pigs." },
        ],
        DE: [
          { do: "Give practical, quality gifts — Germans appreciate utility and craftsmanship.", dont: "Do not give overly personal gifts in professional settings." },
        ],
      },
    },
  },
  {
    id: "yacht",
    icon: Anchor,
    nameKey: "situations.yacht.name",
    descKey: "situations.yacht.desc",
    ambassadorOnly: true,
    tips: {
      universal: [
        { do: "Dress appropriately for yacht etiquette: smart-casual or as specified by the host.", dont: "Do not wear hard-soled shoes on a yacht — they damage the teak deck." },
        { do: "Ask before moving between areas of the vessel.", dont: "Do not use the owner's personal spaces without explicit invitation." },
        { do: "Offer to help with light tasks — hauling lines or stowing provisions — unless you are a guest of honour.", dont: "Do not operate equipment without the captain's or crew's instruction." },
        { do: "Follow the host's lead for all decisions — this is their domain.", dont: "Do not bring uninvited guests or pets aboard." },
        { do: "Dispose of all waste properly; maritime environmental standards apply.", dont: "Do not play music loudly in anchorage — sound carries far over water." },
      ],
      byRegion: {
        FR: [
          { do: "The Côte d'Azur demands refined dress even in a sailing context.", dont: "Do not be conspicuously early or late — timing matters in French social settings." },
        ],
        GB: [
          { do: "A firm handshake and introduction are appropriate with the captain and crew.", dont: "Do not discuss the cost or value of the yacht." },
        ],
        AE: [
          { do: "Dress modestly when in view of non-Western settings or approaching shore.", dont: "Do not bring alcohol without confirming your host's preference." },
        ],
      },
    },
  },
];

export default function Situations() {
  const { t, locale } = useLocale();
  const { activeRegion } = useActiveRegion();
  const { data: profile } = useGetProfile();
  const { isAuthenticated } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);

  const tier = profile?.subscription_tier ?? "guest";
  const isGuest = !isAuthenticated;
  const isAmbassador = tier === "ambassador";

  const selectedSituation = SITUATIONS.find((s) => s.id === selected);

  const regionTips = selectedSituation?.tips.byRegion[activeRegion] ?? [];
  const allTips = selectedSituation
    ? [...selectedSituation.tips.universal, ...regionTips]
    : [];

  if (isGuest) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-16">
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-serif text-foreground">{t("situations.title")}</h1>
          <p className="text-muted-foreground text-lg font-light leading-relaxed">
            {t("situations.subtitle")}
          </p>
        </div>
        <div className="relative">
          <div className="pointer-events-none select-none grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 opacity-60">
            {SITUATIONS.slice(0, 8).map((sit) => {
              const Icon = sit.icon;
              return (
                <div key={sit.id} className="flex flex-col items-center gap-2 p-4 rounded-sm border border-border/60 text-center bg-background">
                  <Icon className="w-6 h-6 text-primary/70" aria-hidden="true" />
                  <span className="text-xs font-medium leading-tight">{t(sit.nameKey as Parameters<typeof t>[0])}</span>
                </div>
              );
            })}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
        </div>
        <div className="text-center space-y-4 pt-2 pb-4">
          <div className="flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>The Traveller</span>
          </div>
          <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-sm mx-auto">
            {t("situations.lock.teaser")}
          </p>
          <Link href="/register">
            <div className="inline-flex items-center gap-2 text-sm text-primary cursor-pointer hover:underline underline-offset-2 group">
              {t("lock.cta.register")}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </div>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-16">
      {/* Header */}
      <div className="space-y-4 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-serif text-foreground">{t("situations.title")}</h1>
        <p className="text-muted-foreground text-lg font-light leading-relaxed">
          {t("situations.subtitle")}
        </p>
      </div>

      {/* Situation grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {SITUATIONS.map((sit) => {
          const Icon = sit.icon;
          const isLocked = sit.ambassadorOnly && !isAmbassador;
          const isActive = selected === sit.id;

          return (
            <button
              key={sit.id}
              onClick={() => {
                if (isLocked) return;
                setSelected(isActive ? null : sit.id);
              }}
              disabled={isLocked}
              aria-pressed={isActive}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-sm border text-center transition-all group ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : isLocked
                  ? "border-border/30 bg-muted/10 text-muted-foreground/40 cursor-default"
                  : "border-border/60 hover:border-primary/40 hover:bg-muted/20 text-foreground cursor-pointer"
              }`}
            >
              <Icon
                className={`w-6 h-6 ${isActive ? "text-primary-foreground" : isLocked ? "text-muted-foreground/30" : "text-primary/70"}`}
                aria-hidden="true"
              />
              <span className="text-xs font-medium leading-tight">
                {t(sit.nameKey as Parameters<typeof t>[0])}
              </span>
              {sit.ambassadorOnly && !isAmbassador && (
                <div className="absolute top-1.5 right-1.5">
                  <Crown className="w-3 h-3 text-amber-400/60" aria-hidden="true" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Ambassador gate for Yacht */}
      {selected === null && (
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/50">
          <Crown className="w-3 h-3 inline-block mr-1 text-amber-400/60" aria-hidden="true" />
          {t("situations.ambassador_note")}{" "}
          <Link href="/membership">
            <span className="text-primary hover:underline cursor-pointer">{t("situations.ambassador_cta")}</span>
          </Link>
        </p>
      )}

      {/* Situation Detail */}
      {selectedSituation && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <div className="border-b border-border pb-4">
            <h2 className="font-serif text-2xl">
              {t(selectedSituation.nameKey as Parameters<typeof t>[0])}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t(selectedSituation.descKey as Parameters<typeof t>[0])}
            </p>
            {regionTips.length > 0 && (
              <p className="text-xs font-mono uppercase tracking-widest text-primary mt-2 flex items-center gap-1.5">
                <FlagEmoji code={activeRegion} />
                {t("situations.region_tips", { region: activeRegion })}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Do's */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-widest text-green-700 dark:text-green-400 border-b border-border pb-2">
                {t("compass.dos")}
              </h3>
              <ul className="space-y-3">
                {allTips.map((tip, i) => (
                  <li key={i} className="flex gap-2 items-start text-sm">
                    <span className="text-green-600 font-bold flex-shrink-0 mt-0.5">+</span>
                    <span className="text-foreground/80 leading-snug">{tip.do}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Don'ts */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-widest text-red-700 dark:text-red-400 border-b border-border pb-2">
                {t("compass.donts")}
              </h3>
              <ul className="space-y-3">
                {allTips.map((tip, i) => (
                  <li key={i} className="flex gap-2 items-start text-sm">
                    <span className="text-red-600 font-bold flex-shrink-0 mt-0.5">×</span>
                    <span className="text-foreground/80 leading-snug">{tip.dont}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CTA to Counsel */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-medium text-foreground">{t("situations.counsel_cta")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("situations.counsel_cta_desc")}</p>
              </div>
              <Link href={`/counsel?situation=${encodeURIComponent(t(selectedSituation.nameKey as Parameters<typeof t>[0]))}`}>
                <span className="text-sm font-mono uppercase tracking-widest text-primary hover:underline underline-offset-2 cursor-pointer whitespace-nowrap">
                  {t("situations.open_counsel")} →
                </span>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
