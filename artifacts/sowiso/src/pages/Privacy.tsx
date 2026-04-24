import { useState, useEffect } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePrivacy, cleanupScenarioAnswers } from "@/lib/privacy";
import { useLanguage } from "@/lib/i18n";
import { Shield, Camera, Mic, MapPin, EyeOff, Eye, Trash2, CheckCircle2, Info, RefreshCw } from "lucide-react";

function ToggleRow({
  label,
  description,
  enabled,
  onToggle,
  icon: Icon,
  disabled,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  icon: React.ElementType;
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 py-4 border-b border-border/30 last:border-0 ${disabled ? "opacity-50" : ""}`}>
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground font-light mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        disabled={disabled}
        aria-pressed={enabled}
        aria-label={`${enabled ? "Disable" : "Enable"} ${label}`}
        className={`relative flex-shrink-0 mt-0.5 inline-flex h-5 w-9 items-center rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
          enabled ? "bg-primary border-primary" : "bg-muted border-border"
        } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export default function Privacy() {
  usePageTitle("Privacy");
  const { settings, updateSetting, setIncognito, refreshFromServer } = usePrivacy();
  const { t } = useLanguage();
  const [cleanedUp, setCleanedUp] = useState(false);
  const [cleanedCount, setCleanedCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    refreshFromServer();
  }, [refreshFromServer]);

  const handleSync = async () => {
    setSyncing(true);
    setSynced(false);
    const success = await refreshFromServer();
    setSyncing(false);
    if (success) {
      setSynced(true);
      setTimeout(() => setSynced(false), 3000);
    }
  };

  const handleCleanup = () => {
    const keysToRemove = Object.keys(localStorage).filter(
      (k) => k.startsWith("scenario_answer_") || k.startsWith("counsel_q_")
    );
    const count = keysToRemove.length;
    cleanupScenarioAnswers();
    setCleanedCount(count);
    setCleanedUp(true);
    setTimeout(() => setCleanedUp(false), 4000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-serif text-foreground">{t("privacy.title")}</h1>
            <Badge variant="outline" className="font-mono text-xs tracking-widest uppercase border-border/60 text-muted-foreground">
              <Shield className="h-3 w-3 mr-1" />
              {t("privacy.badge")}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {synced && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium animate-in fade-in duration-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t("privacy.synced")}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 text-muted-foreground"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? t("privacy.syncing") : t("privacy.sync_now")}
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground text-lg font-light max-w-2xl">
          {t("privacy.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">

          <Card className={settings.incognito ? "border-foreground/30 bg-foreground/5" : "border-border"}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="uppercase tracking-widest text-xs font-semibold">{t("privacy.master_switch")}</CardDescription>
                {settings.incognito && (
                  <Badge className="font-mono text-xs" variant="secondary">{t("privacy.active")}</Badge>
                )}
              </div>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                {settings.incognito ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
                {t("privacy.incognito_mode")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground font-light leading-relaxed">
                {t("privacy.incognito_desc")}
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setIncognito(!settings.incognito)}
                  variant={settings.incognito ? "destructive" : "default"}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {settings.incognito ? (
                    <><Eye className="h-3.5 w-3.5" /> {t("privacy.deactivate_incognito")}</>
                  ) : (
                    <><EyeOff className="h-3.5 w-3.5" /> {t("privacy.activate_incognito")}</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="uppercase tracking-widest text-xs font-semibold">{t("privacy.sensor_controls")}</CardDescription>
              <CardTitle className="font-serif text-lg">{t("privacy.individual_perms")}</CardTitle>
            </CardHeader>
            <CardContent className="pt-1">
              <ToggleRow
                label={t("privacy.camera")}
                description={t("privacy.camera_desc")}
                enabled={settings.cameraEnabled}
                onToggle={() => updateSetting("cameraEnabled", !settings.cameraEnabled)}
                icon={Camera}
                disabled={settings.incognito}
              />
              <ToggleRow
                label={t("privacy.microphone")}
                description={t("privacy.mic_desc")}
                enabled={settings.microphoneEnabled}
                onToggle={() => updateSetting("microphoneEnabled", !settings.microphoneEnabled)}
                icon={Mic}
                disabled={settings.incognito}
              />
              <ToggleRow
                label={t("privacy.location")}
                description={t("privacy.location_desc")}
                enabled={settings.locationEnabled}
                onToggle={() => updateSetting("locationEnabled", !settings.locationEnabled)}
                icon={MapPin}
                disabled={settings.incognito}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="uppercase tracking-widest text-xs font-semibold">{t("privacy.data_management")}</CardDescription>
              <CardTitle className="font-serif text-lg">{t("privacy.cleanup_title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground font-light leading-relaxed">
                {t("privacy.cleanup_desc")}
              </p>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleCleanup}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("privacy.clear_local")}
                </Button>
                {cleanedUp && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium animate-in fade-in duration-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {cleanedCount > 0
                      ? (cleanedCount === 1 ? t("privacy.records_removed", { count: cleanedCount }) : t("privacy.records_removed_plural", { count: cleanedCount }))
                      : t("privacy.nothing_to_clear")}
                  </span>
                )}
              </div>
              <ToggleRow
                label={t("privacy.auto_cleanup")}
                description={t("privacy.auto_cleanup_desc")}
                enabled={settings.autoCleanup}
                onToggle={() => updateSetting("autoCleanup", !settings.autoCleanup)}
                icon={Trash2}
              />
            </CardContent>
          </Card>

        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border/30 bg-muted/10">
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-lg text-muted-foreground">{t("privacy.data_transparency")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { labelKey: "privacy.data_camera_label", detailKey: "privacy.data_camera_detail" },
                { labelKey: "privacy.data_mic_label", detailKey: "privacy.data_mic_detail" },
                { labelKey: "privacy.data_location_label", detailKey: "privacy.data_location_detail" },
                { labelKey: "privacy.data_scenarios_label", detailKey: "privacy.data_scenarios_detail" },
                { labelKey: "privacy.data_calling_card_label", detailKey: "privacy.data_calling_card_detail" },
              ].map(({ labelKey, detailKey }) => (
                <div key={labelKey} className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-widest">
                    <Info className="h-3 w-3 text-muted-foreground" />
                    {t(labelKey)}
                  </div>
                  <p className="text-xs text-muted-foreground font-light leading-relaxed pl-4">{t(detailKey)}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/30 bg-muted/10">
            <CardContent className="flex items-start gap-3 py-4 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span className="font-light leading-relaxed">
                {t("privacy.settings_note")}
              </span>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
