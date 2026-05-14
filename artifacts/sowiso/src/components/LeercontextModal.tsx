import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { X, Plus, Loader2 } from "lucide-react";

export type LeercontextType = "informeel" | "zakelijk" | "professioneel" | "romantisch" | "sociaal";
export type TargetGender = "men" | "women" | null;
export type TargetAge = "19_30" | "30_50" | "50plus" | null;

export interface UserCountryContext {
  id: number;
  user_id: string;
  region_code: string;
  context_type: string;
  target_demographic: string | null;
  created_at: string;
}

interface LeercontextModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  regionCode: string;
  regionName: string;
  contexts: UserCountryContext[];
  apiBase: string;
  t: (key: string, fallback?: string) => string;
  onCreated: (ctx: UserCountryContext) => void;
  onDeleted: (id: number) => void;
}

const CONTEXT_TYPES: LeercontextType[] = ["informeel", "zakelijk", "professioneel", "romantisch", "sociaal"];

function buildDemographic(gender: TargetGender, age: TargetAge): string | null {
  if (!gender && !age) return null;
  if (gender && age) return `${gender}_${age}`;
  return null;
}

function parseDemographic(demo: string | null): { gender: string | null; age: string | null } {
  if (!demo || demo === "common") return { gender: null, age: null };
  const m = demo.match(/^(men|women)_(19_30|30_50|50plus)$/);
  if (!m) return { gender: null, age: null };
  return { gender: m[1], age: m[2] };
}

function formatContextLabel(ctx: UserCountryContext, t: (key: string, fallback?: string) => string): string {
  const typePart = t(`leercontext.type.${ctx.context_type}`, ctx.context_type);
  if (!ctx.target_demographic) return typePart;
  const { gender, age } = parseDemographic(ctx.target_demographic);
  const genderLabel = gender === "men"
    ? t("leercontext.gender.men_short", "M")
    : gender === "women" ? t("leercontext.gender.women_short", "V") : null;
  const ageLabel = age === "19_30" ? "19–30"
    : age === "30_50" ? "30–50"
    : age === "50plus" ? "50+" : null;
  if (genderLabel && ageLabel) return `${typePart} · ${genderLabel} ${ageLabel}`;
  if (genderLabel) return `${typePart} · ${genderLabel}`;
  if (ageLabel) return `${typePart} · ${ageLabel}`;
  return typePart;
}

export function LeercontextModal({
  open,
  onOpenChange,
  regionCode,
  regionName,
  contexts,
  apiBase,
  t,
  onCreated,
  onDeleted,
}: LeercontextModalProps) {
  const [selectedType, setSelectedType] = useState<LeercontextType>("zakelijk");
  const [selectedGender, setSelectedGender] = useState<TargetGender>(null);
  const [selectedAge, setSelectedAge] = useState<TargetAge>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const demographic = buildDemographic(selectedGender, selectedAge);
    try {
      const res = await fetch(
        `${apiBase}/api/users/country-interests/${encodeURIComponent(regionCode)}/contexts`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            context_type: selectedType,
            target_demographic: demographic ?? undefined,
          }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body?.code === "CONTEXT_DUPLICATE") {
          setError(t("leercontext.error.duplicate", "Deze context bestaat al voor dit land."));
        } else {
          setError(body?.error ?? t("leercontext.error.save_failed", "Opslaan mislukt."));
        }
        return;
      }
      const created: UserCountryContext = await res.json();
      onCreated(created);
      setSelectedGender(null);
      setSelectedAge(null);
    } catch {
      setError(t("leercontext.error.save_failed", "Opslaan mislukt."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    setDeleting(id);
    try {
      const res = await fetch(
        `${apiBase}/api/users/country-interests/${encodeURIComponent(regionCode)}/contexts/${id}`,
        { method: "DELETE", credentials: "include" },
      );
      if (res.ok) onDeleted(id);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">
            {t("leercontext.modal_title", "Leercontext")} — {regionName}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t("leercontext.modal_desc", "Stel in met wie u wilt oefenen in dit land. Elke context beïnvloedt welke vragen u krijgt.")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* ── Contextype pill-keuze ── */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              {t("leercontext.context_type_label", "Type scenario")}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CONTEXT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`px-2.5 py-1 rounded-sm text-xs font-medium border transition-colors ${
                    selectedType === type
                      ? "bg-primary/15 border-primary/50 text-primary"
                      : "bg-background border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  {t(`leercontext.type.${type}`, type.charAt(0).toUpperCase() + type.slice(1))}
                </button>
              ))}
            </div>
          </div>

          {/* ── Target demographic ── */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              {t("leercontext.who_label", "Met wie oefent u?")}
              <span className="ml-1 normal-case font-normal tracking-normal">{t("leercontext.optional", "(optioneel)")}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Gender */}
              <div className="flex gap-1">
                {(["men", "women"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSelectedGender(selectedGender === g ? null : g)}
                    className={`px-2.5 py-1 rounded-sm text-xs border transition-colors ${
                      selectedGender === g
                        ? "bg-primary/15 border-primary/50 text-primary"
                        : "bg-background border-border/50 text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    {g === "men" ? t("leercontext.gender.men", "Man") : t("leercontext.gender.women", "Vrouw")}
                  </button>
                ))}
              </div>
              {/* Age */}
              <div className="flex gap-1">
                {(["19_30", "30_50", "50plus"] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setSelectedAge(selectedAge === a ? null : a)}
                    className={`px-2.5 py-1 rounded-sm text-xs border transition-colors ${
                      selectedAge === a
                        ? "bg-primary/15 border-primary/50 text-primary"
                        : "bg-background border-border/50 text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    {a === "19_30" ? "19–30" : a === "30_50" ? "30–50" : "50+"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          {/* ── Opslaan knop ── */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="w-3 h-3" aria-hidden="true" />
            )}
            {t("leercontext.add_button", "Context toevoegen")}
          </button>

          {/* ── Bestaande contexten ── */}
          {contexts.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-border/30">
              <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                {t("leercontext.active_label", "Actieve contexten")}
              </div>
              <div className="flex flex-col gap-1.5">
                {contexts.map((ctx) => (
                  <div
                    key={ctx.id}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-sm border border-border/40 bg-muted/10 text-xs"
                  >
                    <span className="text-foreground">{formatContextLabel(ctx, t)}</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(ctx.id)}
                      disabled={deleting === ctx.id}
                      aria-label={t("leercontext.delete_aria", "Context verwijderen")}
                      className="ml-2 p-0.5 rounded-sm hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                    >
                      {deleting === ctx.id
                        ? <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                        : <X className="w-3 h-3" aria-hidden="true" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { formatContextLabel };
