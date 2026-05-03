import { useState } from "react";
import { Bookmark, ChevronDown, ChevronUp, Loader2, MapPin, Star } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export type VenueCategory = "shops" | "dining" | "activities" | "accommodations" | "transport";
export type OccasionTag = "business" | "romantic" | "family" | "social";

export interface Venue {
  id: string;
  regionCode: string;
  category: VenueCategory;
  subcategory: string;
  name: string;
  description: string;
  occasionTags: OccasionTag[];
  tierBadge: string;
  etiquetteTip: string;
}

const OCCASION_TAG_KEYS: Record<OccasionTag, string> = {
  business: "compass.local.occasion_business",
  romantic: "compass.local.occasion_romantic",
  family: "compass.local.occasion_family",
  social: "compass.local.occasion_social",
};

const OCCASION_COLORS: Record<OccasionTag, string> = {
  business: "border-blue-500/40 text-blue-400 bg-blue-500/10",
  romantic: "border-rose-500/40 text-rose-400 bg-rose-500/10",
  family: "border-amber-500/40 text-amber-400 bg-amber-500/10",
  social: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
};

interface VenueCardProps {
  venue: Venue;
  /** When true, renders a filled bookmark icon. */
  isSaved?: boolean;
  /** When provided, the bookmark button is shown and toggling fires the handler. */
  onToggleSave?: (venue: Venue) => void | Promise<void>;
  /** Disables the bookmark control while a save is in flight. */
  saving?: boolean;
}

export function VenueCard({ venue, isSaved = false, onToggleSave, saving = false }: VenueCardProps) {
  const [tipOpen, setTipOpen] = useState(false);
  const { t } = useLocale();

  return (
    <div className="border border-border/50 rounded-sm bg-card hover:border-border/80 transition-colors">
      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 border border-border/40 rounded-[2px] px-1.5 py-0.5">
                {venue.subcategory}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-primary/70 border border-primary/20 rounded-[2px] px-1.5 py-0.5 bg-primary/5 flex items-center gap-1">
                <Star className="w-2.5 h-2.5" aria-hidden="true" />
                {venue.tierBadge}
              </span>
            </div>
            <h4 className="font-serif text-base text-foreground leading-snug">
              {venue.name}
            </h4>
          </div>

          {onToggleSave && (
            <button
              type="button"
              onClick={() => { if (!saving) void onToggleSave(venue); }}
              disabled={saving}
              aria-pressed={isSaved}
              aria-label={isSaved
                ? t("compass.local.unsave_aria", { name: venue.name })
                : t("compass.local.save_aria", { name: venue.name })}
              title={isSaved ? t("compass.local.unsave", "Remove from saved") : t("compass.local.save", "Save venue")}
              className={`flex-shrink-0 p-1.5 rounded-sm border transition-colors disabled:opacity-50 ${
                isSaved
                  ? "border-primary/40 text-primary bg-primary/10 hover:bg-primary/15"
                  : "border-border/40 text-muted-foreground/60 hover:text-primary hover:border-primary/30"
              }`}
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Bookmark
                  className="w-3.5 h-3.5"
                  fill={isSaved ? "currentColor" : "none"}
                  aria-hidden="true"
                />
              )}
            </button>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {venue.description}
        </p>

        {/* Occasion tags (dining only) */}
        {venue.occasionTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5" aria-label={t("compass.local.occasion_tags_aria")}>
            {venue.occasionTags.map((tag) => (
              <span
                key={tag}
                className={`text-[10px] font-mono uppercase tracking-wide border rounded-[2px] px-1.5 py-0.5 ${OCCASION_COLORS[tag]}`}
              >
                {t(OCCASION_TAG_KEYS[tag])}
              </span>
            ))}
          </div>
        )}

        {/* Etiquette tip toggle */}
        <button
          type="button"
          onClick={() => setTipOpen((v) => !v)}
          className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary/60 hover:text-primary transition-colors mt-1"
          aria-expanded={tipOpen}
        >
          <MapPin className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
          <span>{t("compass.local.etiquette_tip")}</span>
          {tipOpen
            ? <ChevronUp className="w-3 h-3 ml-auto" aria-hidden="true" />
            : <ChevronDown className="w-3 h-3 ml-auto" aria-hidden="true" />}
        </button>

        {tipOpen && (
          <div
            className="text-sm text-muted-foreground bg-primary/5 border border-primary/15 rounded-sm p-3 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-150"
            role="note"
            aria-label={t("compass.local.etiquette_tip")}
          >
            <span className="text-primary font-medium text-xs font-mono uppercase tracking-widest block mb-1.5">
              {t("compass.local.etiquette")}
            </span>
            {venue.etiquetteTip}
          </div>
        )}
      </div>
    </div>
  );
}
