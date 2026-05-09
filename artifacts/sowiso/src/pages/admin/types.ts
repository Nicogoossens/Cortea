export interface AdminUser {
  id: string;
  full_name: string | null;
  email: string | null;
  email_verified: boolean;
  subscription_tier: string;
  subscription_status: string;
  noble_score: number;
  is_admin: boolean;
  suspended_at: string | null;
  created_at: string;
  language_code: string;
  country_of_origin: string | null;
  active_region: string | null;
  onboarding_completed: boolean;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
}

export interface ContentStatus {
  scenarios: number;
  culture_protocols: number;
  compass_regions: number;
  learning_track_questions: number;
  learning_track_questions_by_region: Record<string, number>;
  translations: Record<string, number>;
  scenario_translation_coverage: Record<string, number>;
  total_scenarios: number;
}

export type ActionState = "idle" | "loading" | "done" | "error";
export type AdminTab = "users" | "content" | "cc_screening" | "integrations" | "use_cases" | "attribution" | "onboarding" | "translation" | "counsel_seeds" | "votes";

export interface CounselSeedRow {
  id: number;
  region_code: string;
  domain: string;
  status: string;
  eval_score: number | null;
  eval_notes: string | null;
  seeded_at: string;
  reviewed_at: string | null;
  promoted_at: string | null;
  content: Record<string, unknown>;
}

export interface UseCase {
  id: number;
  slug: string;
  title: string;
  region_code: string;
  flag_emoji: string;
  formality_level: string;
  domain_tags: string[];
  pillar_weights: Record<string, number>;
  description: string;
  cover_context: string;
  primary_tool: string;
}

export const EMPTY_USE_CASE: Omit<UseCase, "id"> = {
  slug: "",
  title: "",
  region_code: "",
  flag_emoji: "🌍",
  formality_level: "formal",
  domain_tags: [],
  pillar_weights: {},
  description: "",
  cover_context: "",
  primary_tool: "atelier",
};
