import type { ElementType } from "react";
import { Briefcase, UtensilsCrossed, Palette, Music2, Star, Leaf, Plane } from "lucide-react";

export interface ObjectiveOption {
  key: string;
  labelKey: string;
}

export const OBJECTIVE_OPTIONS: ObjectiveOption[] = [
  { key: "business",        labelKey: "objective.business" },
  { key: "elite",           labelKey: "objective.elite" },
  { key: "romantic",        labelKey: "objective.romantic" },
  { key: "world_traveller", labelKey: "objective.world_traveller" },
];

export interface SphereOption {
  key: string;
  icon: ElementType;
  labelKey: string;
}

export const SPHERE_OPTIONS: SphereOption[] = [
  { key: "business",            icon: Briefcase,       labelKey: "profile.sphere.business" },
  { key: "gastronomy",          icon: UtensilsCrossed, labelKey: "profile.sphere.gastronomy" },
  { key: "arts_culture",        icon: Palette,         labelKey: "profile.sphere.arts_culture" },
  { key: "music_entertainment", icon: Music2,           labelKey: "profile.sphere.music_entertainment" },
  { key: "formal_events",       icon: Star,            labelKey: "profile.sphere.formal_events" },
  { key: "lifestyle_wellness",  icon: Leaf,            labelKey: "profile.sphere.lifestyle_wellness" },
  { key: "travel_hospitality",  icon: Plane,           labelKey: "profile.sphere.travel_hospitality" },
];
