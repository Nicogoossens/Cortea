import { useState, useEffect } from "react";
import { useGetProfile } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TierGate } from "@/components/TierGate";
import { LockOverlay } from "@/components/LockOverlay";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { COMPASS_REGIONS, CompassRegion } from "@/lib/active-region";
import { FlagEmoji } from "@/lib/active-region";
import { MapPin, Plus, Trash2, Bell, BookOpen, Utensils, Hand } from "lucide-react";

const NAVIGATOR_KEY = "sowiso_navigator_trips";

interface Trip {
  id: string;
  regionCode: string;
  departureDate: string;
}

interface TripAlert {
  type: "core_values" | "table_manners" | "greeting";
  label: string;
  daysUntil: number;
  icon: React.ElementType;
  content: string[];
}

const REGION_INTEL: Record<string, { coreValues: string[]; tableManners: string[]; greetings: string[] }> = {
  GB: {
    coreValues: ["Understatement is a virtue — avoid extravagant displays of wealth or emotion.", "Punctuality is an unspoken obligation; arriving late implies disrespect.", "Queuing is sacred; never cut in line under any circumstance."],
    tableManners: ["Hold your fork in the left hand and knife in the right — always.", "Do not speak with food in your mouth; wait until your plate is clear.", "Bread should be torn, never cut; butter one piece at a time."],
    greetings: ["A firm but brief handshake is standard for first introductions.", "Use 'Mr', 'Mrs', or professional titles until invited to use first names.", "Eye contact signals sincerity; avoid prolonged staring."],
  },
  FR: {
    coreValues: ["La distinction matters — dress with intention at all times.", "Intellectual discourse is valued; arrive with an opinion, not just pleasantries.", "Privacy is paramount — personal questions are considered intrusive."],
    tableManners: ["Keep both wrists on the table edge — never in your lap.", "Wine is never poured by oneself; wait for your host or refill others first.", "Finishing every morsel on your plate is a compliment to the chef."],
    greetings: ["La bise (cheek kiss) is standard among acquaintances in social settings.", "Bonjour must precede every interaction — to skip it is considered rude.", "Shake hands firmly on arrival and departure in professional contexts."],
  },
  DE: {
    coreValues: ["Directness is respected — ambiguity is perceived as dishonest.", "Punctuality is non-negotiable; being late without advance notice is a serious offence.", "Privacy is highly valued; personal questions are considered impolite."],
    tableManners: ["Wait until the host says 'Guten Appetit' before eating.", "Hands should remain visible on the table at all times.", "Do not switch knife and fork hands — European style is expected."],
    greetings: ["A firm handshake with direct eye contact is the standard greeting.", "Use formal titles (Herr, Frau, Dr.) until explicitly invited to use first names.", "Greet each person individually; group waves are considered dismissive."],
  },
  JP: {
    coreValues: ["Harmony (wa) overrides individual assertion — avoid confrontation.", "Silence is a sign of consideration, not discomfort; do not rush to fill it.", "The exchange of business cards (meishi) is ceremonial — handle them with both hands."],
    tableManners: ["Say 'itadakimasu' before eating and 'gochisousama deshita' after.", "Do not pass food chopstick to chopstick — it mirrors funeral rites.", "Slurping noodles is acceptable and signals enjoyment."],
    greetings: ["A bow is the standard greeting; depth signals respect level.", "Avoid initiating a handshake unless the other party extends first.", "Business cards must be presented and received with both hands, face up."],
  },
  CN: {
    coreValues: ["Face (mianzi) governs social interaction — never cause public embarrassment.", "Relationships (guanxi) precede business; invest in the personal before the professional.", "Seniority commands deference — acknowledge elders and superiors first."],
    tableManners: ["Wait for the host or the eldest guest to eat first.", "Leaving food on your plate signals abundance; an empty plate may invite more.", "Pouring tea for others before yourself is a mark of respect."],
    greetings: ["Nod or bow slightly; a light handshake is acceptable in business settings.", "Address by title and surname; first names are reserved for close relationships.", "Avoid aggressive eye contact with elders — a slight downward gaze shows deference."],
  },
  AE: {
    coreValues: ["Hospitality (diyafa) is a sacred obligation — refusing offered food or drink is impolite.", "Religious observance shapes all social timing; be aware of prayer times.", "Modesty in dress and behaviour is expected, particularly for women."],
    tableManners: ["Accept all food and drink offered with the right hand.", "Alcohol may not be served — never assume it will be present.", "It is polite to leave a little food on your plate to signal satisfaction."],
    greetings: ["'As-salamu alaykum' is the standard greeting; respond 'Wa alaykum assalam'.", "Handshakes among men are common; do not initiate physical contact with a woman unless she extends her hand.", "Business cards should be presented and received with the right hand."],
  },
  US: {
    coreValues: ["Informality is the norm — first names are used quickly in professional settings.", "Directness is valued; get to the point without excessive preamble.", "Personal space is larger than in many cultures — maintain a comfortable distance."],
    tableManners: ["The fork switches to the right hand after cutting — the American style.", "Elbows off the table; keep your free hand in your lap.", "Tipping 18–22% is a social obligation at restaurants, not optional."],
    greetings: ["A firm handshake with direct eye contact and a smile is standard.", "First names are expected within moments of introduction.", "Maintain roughly an arm's length of personal space."],
  },
  IT: {
    coreValues: ["La bella figura — always present yourself at your best, in appearance and conduct.", "Family and personal relationships take precedence over punctuality.", "Food is culture; treating a meal casually is a serious faux pas."],
    tableManners: ["Never add cheese to a seafood pasta — it is considered sacrilege.", "Cappuccino is a morning drink only; ordering it after lunch marks you as a tourist.", "Bread accompanies the meal, it does not precede it as an appetiser."],
    greetings: ["Two cheek kisses (left first) are standard among friends and acquaintances.", "Handshakes are firm in business; maintain eye contact throughout.", "Titles matter — use Dottore, Ingegnere, or Professore where appropriate."],
  },
  ES: {
    coreValues: ["Social warmth and personal connection precede business.", "Lunch is the main meal; dinner rarely begins before 9 or 10 pm.", "Directness is balanced with charm — bluntness without warmth is considered rude."],
    tableManners: ["Meals are prolonged affairs; rushing signals disrespect.", "Tapas are shared; do not claim a dish as your own.", "Tipping is appreciated but not obligatory — round up modestly."],
    greetings: ["Two cheek kisses are standard in social settings.", "Handshakes in business; maintain warm, sustained eye contact.", "Use usted (formal 'you') until invited to switch to tú."],
  },
  NL: {
    coreValues: ["Directness is a virtue — Dutch communication is frank without being rude.", "Egalitarianism governs; titles and hierarchy are downplayed.", "Punctuality is respected; always confirm and honour meeting times."],
    tableManners: ["Wait until everyone is served before eating.", "Keep your hands visible on the table.", "Splitting the bill ('going Dutch') is entirely normal and expected."],
    greetings: ["Three kisses (right cheek, left cheek, right cheek) among friends.", "Firm handshake in professional contexts.", "First names are used quickly; formality is brief."],
  },
  AU: {
    coreValues: ["Tall poppy syndrome — avoid overt displays of superiority or status.", "Informality and egalitarianism define Australian social culture.", "Humour and self-deprecation are valued; take yourself too seriously at your peril."],
    tableManners: ["Relaxed dining culture; formal rules are fewer than in Europe.", "BYO (bring your own) is common at restaurants — check in advance.", "Tipping is appreciated but not obligatory."],
    greetings: ["A relaxed handshake is standard for first meetings.", "First names are used almost immediately.", "Casual warmth is the norm — excessive formality can seem standoffish."],
  },
  CA: {
    coreValues: ["Politeness and restraint are foundational — aggression is poorly received.", "Multicultural sensitivity is paramount; read the room carefully.", "Punctuality is respected but not as rigidly enforced as in Northern Europe."],
    tableManners: ["Dining etiquette mirrors the US; fork switches to right hand after cutting.", "Restaurant tipping of 15–20% is standard.", "Wait until everyone is served before beginning."],
    greetings: ["Handshakes are standard in professional settings.", "First names are used quickly and warmly.", "Personal space is similar to the US — roughly arm's length."],
  },
  IN: {
    coreValues: ["Hierarchy and seniority command respect — greet elders and seniors first.", "Relationship and trust-building precedes business.", "Religious and dietary practices vary enormously — ask before assuming."],
    tableManners: ["Eat with the right hand only — the left is considered unclean.", "Accepting food when offered is a sign of respect.", "It is polite to leave a small amount of food on your plate."],
    greetings: ["Namaste (palms pressed together) is the traditional greeting.", "Handshakes are common in business; do not initiate physical contact with women.", "Address by title and surname until invited to use first names."],
  },
  SG: {
    coreValues: ["A blend of Chinese, Malay, Indian, and Western norms requires cultural sensitivity.", "Efficiency and punctuality are highly valued.", "Social harmony is prized; avoid confrontation or public disagreement."],
    tableManners: ["Hawker centre dining is communal — be considerate of shared space.", "Chopsticks are standard; learn the basics before arrival.", "Tipping is not expected or customary."],
    greetings: ["Handshakes are standard in professional settings.", "Address by title and surname; follow the other party's lead.", "Chinese contacts may exchange business cards with both hands — mirror them."],
  },
  BR: {
    coreValues: ["Warmth and personal connection are essential before business.", "Brazilians are tactile — physical closeness during conversation is normal.", "Flexibility with time is common; a 30-minute delay is not an offence."],
    tableManners: ["Using hands to eat is considered impolite; use cutlery even for casual food.", "Toast with 'Saúde' — maintain eye contact while clinking glasses.", "Leaving food on the plate is acceptable and not impolite."],
    greetings: ["Warm hugs or cheek kisses are standard among acquaintances.", "Handshakes with sustained eye contact in formal settings.", "First names are used almost immediately."],
  },
  ZA: {
    coreValues: ["Ubuntu — 'I am because we are' — underpins communal values.", "Respect for elders is paramount; greet the oldest first.", "Cultural context varies enormously; adapt to your specific setting."],
    tableManners: ["Wait to be seated by your host.", "Grace may be said before meals in many households — follow your host's lead.", "Tipping 10–15% is standard and expected in restaurants."],
    greetings: ["Handshake with a snap in some African traditions — learn and mirror it.", "Titles and surnames in formal settings.", "Warmth and engagement are expected; coldness is read as hostility."],
  },
  MX: {
    coreValues: ["Personalismo — personal relationships and trust are essential.", "Formality in speech (usted) is expected until the other party relaxes it.", "Hospitality is generous — refusing food or drink is impolite."],
    tableManners: ["'Buen provecho' is said before eating, similar to 'bon appétit'.", "Keep your wrists on the table edge.", "Tortillas are bread — they do not require utensils."],
    greetings: ["Handshake with sustained eye contact in professional settings.", "Abrazo (hug) among male friends is common.", "Cheek kiss among women or between men and women in social settings."],
  },
  PT: {
    coreValues: ["Saudade (longing) permeates culture — Portugese are nostalgic and reflective.", "Formal address is retained longer than in Spain — use senhor/senhora.", "Personal relationships matter greatly; loyalty is highly valued."],
    tableManners: ["Bacalhau (salt cod) is culturally significant — never dismiss it.", "Tipping 5–10% is appreciated; not obligatory.", "Wait for the host to begin eating."],
    greetings: ["Two cheek kisses in social settings.", "Handshake with sustained eye contact in business.", "First names follow only after an explicit invitation."],
  },
};

function getDefaultIntel() {
  return {
    coreValues: ["Research local customs and taboos before departure.", "Learn a few key phrases in the local language.", "Dress appropriately for local sensibilities."],
    tableManners: ["Follow your host's lead at table.", "Observe before participating — watch how locals eat.", "Express gratitude for meals offered."],
    greetings: ["Observe how locals greet each other before engaging.", "A respectful nod or smile works in most cultures.", "Use the local greeting if you know it."],
  };
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getAlerts(trip: Trip): TripAlert[] {
  const days = daysUntil(trip.departureDate);
  const intel = REGION_INTEL[trip.regionCode] ?? getDefaultIntel();
  const alerts: TripAlert[] = [];

  if (days <= 7 && days > 3) {
    alerts.push({ type: "core_values", label: "Core Values & Taboos", daysUntil: days, icon: BookOpen, content: intel.coreValues });
  }
  if (days <= 3 && days > 0) {
    alerts.push({ type: "core_values", label: "Core Values & Taboos", daysUntil: days, icon: BookOpen, content: intel.coreValues });
    alerts.push({ type: "table_manners", label: "Table Manners", daysUntil: days, icon: Utensils, content: intel.tableManners });
  }
  if (days <= 0 && days > -14) {
    alerts.push({ type: "core_values", label: "Core Values & Taboos", daysUntil: days, icon: BookOpen, content: intel.coreValues });
    alerts.push({ type: "table_manners", label: "Table Manners", daysUntil: days, icon: Utensils, content: intel.tableManners });
    alerts.push({ type: "greeting", label: "Greeting Protocol", daysUntil: days, icon: Hand, content: intel.greetings });
  }

  return alerts;
}

function loadTrips(): Trip[] {
  try {
    const stored = localStorage.getItem(NAVIGATOR_KEY);
    if (stored) return JSON.parse(stored) as Trip[];
  } catch { /* ignore */ }
  return [];
}

function saveTrips(trips: Trip[]) {
  localStorage.setItem(NAVIGATOR_KEY, JSON.stringify(trips));
}

function getRegion(code: string): CompassRegion | undefined {
  return COMPASS_REGIONS.find((r) => r.code === code);
}

export default function Navigator() {
  const { data: profile } = useGetProfile();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const tier = profile?.subscription_tier ?? "guest";
  const hasAccess = isAuthenticated && tier === "ambassador";

  const [trips, setTrips] = useState<Trip[]>(loadTrips);
  const [destination, setDestination] = useState<string>(COMPASS_REGIONS[0].code);
  const [departureDate, setDepartureDate] = useState<string>("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { saveTrips(trips); }, [trips]);

  const addTrip = () => {
    if (!departureDate) return;
    const newTrip: Trip = { id: Date.now().toString(), regionCode: destination, departureDate };
    setTrips((prev) => [newTrip, ...prev]);
    setShowForm(false);
    setDepartureDate("");
  };

  const removeTrip = (id: string) => setTrips((prev) => prev.filter((t) => t.id !== id));

  const today = new Date().toISOString().split("T")[0];

  if (!hasAccess) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-serif text-foreground">{t("navigator.title")}</h1>
            <Badge variant="outline" className="font-mono text-xs tracking-widest uppercase border-amber-400/40 text-amber-600">Ambassador</Badge>
          </div>
          <p className="text-muted-foreground text-lg font-light max-w-2xl">
            {t("navigator.gated_subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <div className="relative rounded-sm overflow-hidden bg-muted border border-border p-8 flex flex-col items-center justify-center gap-6 min-h-[240px]">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted-foreground blur-[2px]" aria-hidden="true">
                <MapPin className="h-10 w-10 opacity-20" />
                <p className="text-sm font-light">{t("navigator.first_trip_teaser")}</p>
              </div>
              <LockOverlay
                requiredTier="ambassador"
                teaser={t("navigator.lock_teaser")}
                isAuthenticated={isAuthenticated}
                variant="section"
              />
            </div>
          </div>
          <div className="lg:col-span-2">
            <TierGate feature="The Navigator" requiredTier="ambassador" isAuthenticated={isAuthenticated} teaser={t("navigator.tier_teaser")} />
          </div>
        </div>
      </div>
    );
  }

  const tripsWithAlerts = trips.map((t) => ({ trip: t, alerts: getAlerts(t) }));
  const tripsWithActiveAlerts = tripsWithAlerts.filter(({ alerts }) => alerts.length > 0);
  const upcomingTrips = tripsWithAlerts.filter(({ alerts }) => alerts.length === 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-serif text-foreground">{t("navigator.title")}</h1>
          <Badge variant="outline" className="font-mono text-xs tracking-widest uppercase border-amber-400/40 text-amber-600">Ambassador</Badge>
        </div>
        <p className="text-muted-foreground text-lg font-light max-w-2xl">
          {t("navigator.subtitle")}
        </p>
      </div>

      {tripsWithActiveAlerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs uppercase tracking-widest font-semibold text-muted-foreground flex items-center gap-2">
            <Bell className="h-3.5 w-3.5" />
            {t("navigator.active_briefings")}
          </h2>
          {tripsWithActiveAlerts.map(({ trip, alerts }) => {
            const region = getRegion(trip.regionCode);
            const days = daysUntil(trip.departureDate);
            return (
              <Card key={trip.id} className="border-amber-400/30 bg-amber-500/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {region && <FlagEmoji code={region.code} />}
                      <CardTitle className="font-serif text-lg">{region?.names.en ?? trip.regionCode}</CardTitle>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs border-amber-400/40 text-amber-600">
                      {days < 0 ? t("navigator.arrived") : days === 0 ? t("navigator.departure_today") : t("navigator.d_minus", { count: days })}
                    </Badge>
                  </div>
                  <CardDescription>{new Date(trip.departureDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {alerts.map((alert) => (
                    <div key={alert.type} className="space-y-2">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-muted-foreground">
                        <alert.icon className="h-3.5 w-3.5" />
                        {alert.type === "core_values" ? t("navigator.core_values") : alert.type === "table_manners" ? t("navigator.table_manners") : t("navigator.greeting_protocol")}
                      </div>
                      <ul className="space-y-1.5">
                        {alert.content.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                            <span className="font-light leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-widest font-semibold text-muted-foreground flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" />
            {t("navigator.upcoming_journeys")}
          </h2>
          <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)} className="flex items-center gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            {t("navigator.add_journey")}
          </Button>
        </div>

        {showForm && (
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-lg">{t("navigator.new_journey")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">{t("navigator.destination")}</label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-3 py-2 rounded-sm border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                >
                  {COMPASS_REGIONS.map((r) => (
                    <option key={r.code} value={r.code}>{r.names.en}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">{t("navigator.departure_date")}</label>
                <input
                  type="date"
                  value={departureDate}
                  min={today}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-sm border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={addTrip} disabled={!departureDate} size="sm">{t("navigator.log_journey")}</Button>
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>{t("common.cancel")}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {upcomingTrips.length === 0 && !showForm && (
          <Card className="border-border/40 bg-muted/10">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <MapPin className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground font-light">{t("navigator.no_trips")}</p>
            </CardContent>
          </Card>
        )}

        {upcomingTrips.length > 0 && (
          <div className="space-y-2">
            {upcomingTrips.map(({ trip }) => {
              const region = getRegion(trip.regionCode);
              const days = daysUntil(trip.departureDate);
              return (
                <div key={trip.id} className="flex items-center justify-between px-4 py-3 rounded-sm border border-border/40 bg-muted/10 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3">
                    {region && <FlagEmoji code={region.code} />}
                    <div>
                      <p className="text-sm font-medium text-foreground">{region?.names.en ?? trip.regionCode}</p>
                      <p className="text-xs text-muted-foreground font-light">
                        {new Date(trip.departureDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                        {" · "}
                        {days > 0 ? t("navigator.days_away", { count: days }) : t("navigator.arrived")}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => removeTrip(trip.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors p-1" aria-label={t("navigator.remove_journey")}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
