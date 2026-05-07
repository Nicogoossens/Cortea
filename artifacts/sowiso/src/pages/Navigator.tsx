import { useState, useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
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
import { MapPin, Plus, Trash2, Bell } from "lucide-react";
import { NAVIGATOR_KEY, NavigatorTrip, daysUntil, loadTrips, getAlerts } from "@/lib/navigator-utils";

function saveTrips(trips: NavigatorTrip[]) {
  localStorage.setItem(NAVIGATOR_KEY, JSON.stringify(trips));
}

function getRegion(code: string): CompassRegion | undefined {
  return COMPASS_REGIONS.find((r) => r.code === code);
}

export default function Navigator() {
  const { data: profile } = useGetProfile();
  const { isAuthenticated } = useAuth();
  const { t, locale } = useLanguage();

  const tier = profile?.subscription_tier ?? "guest";
  const hasAccess = isAuthenticated && tier === "ambassador";

  const [trips, setTrips] = useState<NavigatorTrip[]>(loadTrips);
  const [destination, setDestination] = useState<string>(COMPASS_REGIONS[0].code);
  const [departureDate, setDepartureDate] = useState<string>("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { saveTrips(trips); }, [trips]);

  const addTrip = () => {
    if (!departureDate) return;
    const newTrip: NavigatorTrip = { id: Date.now().toString(), regionCode: destination, departureDate };
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
            <div className="relative rounded-xl overflow-hidden bg-muted border-2 border-primary/30 p-8 flex flex-col items-center justify-center gap-6 min-h-[240px]">
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
      <SEOHead
        title={t("seo.navigator.title", "The Navigator — Cultural Arrival Briefings")}
        description={t("seo.navigator.description", "Pre-trip cultural intelligence for Ambassador members. Receive personalised etiquette briefings for upcoming travel destinations.")}
        path="/navigator"
        locale={locale}
      />
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
                      {region && <FlagEmoji code={region.code} size="sm" />}
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
                    {region && <FlagEmoji code={region.code} size="sm" />}
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
