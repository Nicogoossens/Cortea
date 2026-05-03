CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"full_name" text,
	"username" text,
	"avatar_url" text,
	"email" text,
	"email_verified" boolean DEFAULT false NOT NULL,
	"verification_token" text,
	"token_expires_at" timestamp,
	"birth_year" integer,
	"gender_identity" text,
	"gender_expression" text,
	"noble_score" integer DEFAULT 0 NOT NULL,
	"ambition_level" text DEFAULT 'casual' NOT NULL,
	"subscription_tier" text DEFAULT 'guest' NOT NULL,
	"stripe_customer_id" text,
	"language_code" text DEFAULT 'en' NOT NULL,
	"active_region" text DEFAULT 'GB' NOT NULL,
	"region_history" json DEFAULT '[]'::json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"suspended_at" timestamp,
	"session_token" text,
	"country_of_origin" text,
	"country_of_origin_locked_at" timestamp,
	"objectives" json DEFAULT '[]'::json NOT NULL,
	"interests_sports" json DEFAULT '[]'::json NOT NULL,
	"interests_cuisine" json DEFAULT '[]'::json NOT NULL,
	"interests_dress_code" json DEFAULT '[]'::json NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"oauth_provider" text,
	"oauth_provider_id" text,
	"payment_customer_id" text,
	"subscription_status" text DEFAULT 'active' NOT NULL,
	"subscription_current_period_end" timestamp,
	"payment_failed_at" timestamp,
	"trial_ends_at" timestamp,
	"behavior_profile" jsonb,
	"situational_interests" json DEFAULT '[]'::json NOT NULL,
	"privacy_settings" jsonb,
	"profiling_consent" boolean DEFAULT true NOT NULL,
	"password_hash" text,
	"daily_streak" integer DEFAULT 0 NOT NULL,
	"last_activity_date" text,
	"avatar_state" json,
	"wardrobe_unlocks" json DEFAULT '[]'::json NOT NULL,
	"calling_card_tagline" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"utm_content" text,
	"utm_term" text,
	CONSTRAINT "users_ambition_level_check" CHECK ("users"."ambition_level" IN ('casual', 'professional', 'diplomatic'))
);
--> statement-breakpoint
CREATE TABLE "culture_protocols" (
	"id" serial PRIMARY KEY NOT NULL,
	"region_code" text NOT NULL,
	"pillar" integer DEFAULT 0 NOT NULL,
	"rule_type" text DEFAULT '' NOT NULL,
	"rule_description" text DEFAULT '' NOT NULL,
	"gender_applicability" text DEFAULT 'all' NOT NULL,
	"context" text DEFAULT 'general' NOT NULL,
	"source_reference" text,
	"valid_from" timestamp,
	"valid_until" timestamp,
	"source_book" text,
	"source_page" text,
	"pillar_code" text,
	"subcategory" text,
	"rule_raw" text,
	"rule_cc" text,
	"rule_cc_i18n" jsonb,
	"personas" jsonb,
	"modules" jsonb,
	"urgency" integer DEFAULT 2,
	"verified" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"social_class" text DEFAULT 'universal' NOT NULL,
	CONSTRAINT "culture_protocols_region_pillar_rule_key" UNIQUE("region_code","pillar","rule_type"),
	CONSTRAINT "culture_protocols_urgency_check" CHECK ("culture_protocols"."urgency" IS NULL OR ("culture_protocols"."urgency" >= 1 AND "culture_protocols"."urgency" <= 3)),
	CONSTRAINT "culture_protocols_pillar_code_check" CHECK ("culture_protocols"."pillar_code" IS NULL OR "culture_protocols"."pillar_code" IN ('Z1','Z2','Z3','Z4','Z5')),
	CONSTRAINT "culture_protocols_social_class_check" CHECK ("culture_protocols"."social_class" IN ('universal','elite','middle_class'))
);
--> statement-breakpoint
CREATE TABLE "scenarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"title_i18n" json,
	"pillar" integer NOT NULL,
	"region_code" text NOT NULL,
	"age_group" text DEFAULT '18-30' NOT NULL,
	"gender_applicability" text DEFAULT 'all' NOT NULL,
	"context" text DEFAULT 'social' NOT NULL,
	"difficulty_level" integer DEFAULT 1 NOT NULL,
	"estimated_minutes" integer DEFAULT 5 NOT NULL,
	"noble_score_impact" integer DEFAULT 5 NOT NULL,
	"content_json" json NOT NULL,
	"content_i18n" json,
	"behavioral_tags" jsonb,
	"bolton_cluster" integer,
	"correction_style" text,
	"correction_style_i18n" jsonb,
	"social_class" text DEFAULT 'universal' NOT NULL,
	"demographic_bracket" text,
	"interaction_pair" text,
	"phase_module" text,
	"research_pillar" text,
	CONSTRAINT "scenarios_region_pillar_title_key" UNIQUE("region_code","pillar","title"),
	CONSTRAINT "scenarios_social_class_check" CHECK ("scenarios"."social_class" IN ('universal','elite','middle_class')),
	CONSTRAINT "scenarios_demographic_bracket_check" CHECK ("scenarios"."demographic_bracket" IS NULL OR "scenarios"."demographic_bracket" IN ('common','men_19_30','women_19_30','men_30_50','women_30_50','men_50plus','women_50plus')),
	CONSTRAINT "scenarios_phase_module_check" CHECK ("scenarios"."phase_module" IS NULL OR "scenarios"."phase_module" IN ('MOD_A','MOD_B','MOD_C','MOD_D','MOD_E','MOD_F','MOD_G')),
	CONSTRAINT "scenarios_research_pillar_check" CHECK ("scenarios"."research_pillar" IS NULL OR "scenarios"."research_pillar" IN ('P1','P2','P3','P4'))
);
--> statement-breakpoint
CREATE TABLE "zuil_voortgang" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"pillar" integer NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"current_title" text DEFAULT 'The Aware' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"language_code" text NOT NULL,
	"formality_register" text DEFAULT 'high' NOT NULL,
	"rtl_flag" boolean DEFAULT false NOT NULL,
	"region_link" text,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"quality_reviewed_at" timestamp,
	"calibrated_module" text
);
--> statement-breakpoint
CREATE TABLE "noble_score_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"scenario_id" integer,
	"score_delta" integer NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"trigger" text NOT NULL,
	"level_name_after" text
);
--> statement-breakpoint
CREATE TABLE "compass_regions" (
	"region_code" text PRIMARY KEY NOT NULL,
	"flag_emoji" text NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "counsel_quality_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"domain" text DEFAULT 'general' NOT NULL,
	"score" real NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mirror_scan_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"detected_category" text NOT NULL,
	"confidence" real NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "use_case_rating_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"use_case_id" integer NOT NULL,
	"readiness_score" real NOT NULL,
	"component_scores" jsonb NOT NULL,
	"computed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "use_cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"region_code" text NOT NULL,
	"flag_emoji" text DEFAULT '🌍' NOT NULL,
	"formality_level" text DEFAULT 'formal' NOT NULL,
	"domain_tags" json DEFAULT '[]'::json NOT NULL,
	"pillar_weights" json DEFAULT '{}'::json NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"cover_context" text DEFAULT '' NOT NULL,
	"primary_tool" text DEFAULT 'atelier' NOT NULL,
	CONSTRAINT "use_cases_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_use_case_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"use_case_id" integer NOT NULL,
	"readiness_score" real DEFAULT 0 NOT NULL,
	"component_scores" jsonb DEFAULT '{"atelier":null,"counsel":null,"mirror":null,"compass":null}'::jsonb NOT NULL,
	"computed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_coverage" (
	"region_code" text NOT NULL,
	"social_class" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"notes" text,
	CONSTRAINT "content_coverage_pkey" PRIMARY KEY("region_code","social_class"),
	CONSTRAINT "content_coverage_social_class_check" CHECK ("content_coverage"."social_class" IN ('universal','elite','middle_class')),
	CONSTRAINT "content_coverage_status_check" CHECK ("content_coverage"."status" IN ('draft','active','complete'))
);
--> statement-breakpoint
CREATE TABLE "learning_track_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"register" text NOT NULL,
	"research_pillar" text,
	"phase" integer NOT NULL,
	"level" integer NOT NULL,
	"region_code" text NOT NULL,
	"demographic" text NOT NULL,
	"question_text" text NOT NULL,
	"historical_context" text,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"lang" text DEFAULT 'en' NOT NULL,
	"interest_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"question_hash" text GENERATED ALWAYS AS (md5(region_code || '|' || register || '|' || COALESCE(research_pillar, '') || '|' || phase::text || '|' || level::text || '|' || demographic || '|' || lang || '|' || question_text)) STORED
);
--> statement-breakpoint
CREATE TABLE "learning_track_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"register" text NOT NULL,
	"research_pillar" text,
	"phase" integer NOT NULL,
	"region_code" text DEFAULT 'GB' NOT NULL,
	"current_level" integer DEFAULT 1 NOT NULL,
	"questions_done" integer DEFAULT 0 NOT NULL,
	"correct_streak" integer DEFAULT 0 NOT NULL,
	"mastered" boolean DEFAULT false NOT NULL,
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "learning_track_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"question_id" integer NOT NULL,
	"register" text NOT NULL,
	"region_code" text NOT NULL,
	"research_pillar" text,
	"phase" integer NOT NULL,
	"level" integer NOT NULL,
	"answer_tier" integer NOT NULL,
	"is_correct" boolean NOT NULL,
	"is_repetition" boolean DEFAULT false NOT NULL,
	"session_id" integer,
	"attempted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_track_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"register" text NOT NULL,
	"region_code" text NOT NULL,
	"research_pillar" text,
	"phase" integer NOT NULL,
	"level" integer NOT NULL,
	"is_remediation" boolean DEFAULT false NOT NULL,
	"served_question_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"repeat_question_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_questions" integer DEFAULT 0 NOT NULL,
	"answers_given" integer DEFAULT 0 NOT NULL,
	"correct_answers" integer DEFAULT 0 NOT NULL,
	"score_pct" integer,
	"passed" boolean,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"remediated_at" timestamp,
	"remediates_session_id" integer
);
--> statement-breakpoint
CREATE TABLE "user_country_interests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"region_code" text NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	"hidden_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"badge_type" text NOT NULL,
	"register" text NOT NULL,
	"research_pillar" text,
	"phase" integer,
	"region_code" text,
	"icon_url" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "badges_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"badge_id" integer NOT NULL,
	"awarded_at" timestamp DEFAULT now(),
	"visible" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guides" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"pillar" text NOT NULL,
	"region_code" text,
	"price_cents" integer NOT NULL,
	"stripe_price_id" text,
	"tier_required" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchased_guides" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"guide_id" text NOT NULL,
	"purchased_at" timestamp DEFAULT now() NOT NULL,
	"stripe_payment_intent_id" text
);
--> statement-breakpoint
CREATE TABLE "quest_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"quest_id" integer NOT NULL,
	"completed_on" date NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quests" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"title_nl" text,
	"title_fr" text,
	"title_de" text,
	"description" text NOT NULL,
	"description_nl" text,
	"description_fr" text,
	"description_de" text,
	"pillar" integer,
	"noble_score_reward" integer DEFAULT 3 NOT NULL,
	"day_of_week" integer,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cultural_origins" (
	"id" serial PRIMARY KEY NOT NULL,
	"region_code" text NOT NULL,
	"domain" text NOT NULL,
	"tradition" text NOT NULL,
	"origin_summary" text NOT NULL,
	"era" text NOT NULL,
	"influences" text[] DEFAULT '{}' NOT NULL,
	"connected_rule" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"inviter_id" text NOT NULL,
	"invitee_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "companion_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_a_id" text NOT NULL,
	"user_b_id" text NOT NULL,
	"share_progress_a" boolean DEFAULT true NOT NULL,
	"share_progress_b" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companion_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"link_id" integer NOT NULL,
	"sender_id" text NOT NULL,
	"recipient_id" text NOT NULL,
	"body" text NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roleplay_scenarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"context" text NOT NULL,
	"situation" text NOT NULL,
	"pillar" integer DEFAULT 1 NOT NULL,
	"difficulty_level" integer DEFAULT 1 NOT NULL,
	"estimated_minutes" integer DEFAULT 15 NOT NULL,
	"role_a" json NOT NULL,
	"role_b" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roleplay_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"scenario_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"answers" json DEFAULT '[]'::json NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roleplay_reflections" (
	"id" serial PRIMARY KEY NOT NULL,
	"scenario_id" integer NOT NULL,
	"author_id" text NOT NULL,
	"target_user_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cc_protocol_removals" (
	"id" serial PRIMARY KEY NOT NULL,
	"protocol_id" integer NOT NULL,
	"removed_by" text NOT NULL,
	"removed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"region_code" text,
	"pillar_code" text,
	"subcategory" text,
	"rule_cc" text,
	"rule_raw" text,
	"urgency" integer,
	"source_book" text,
	"source_page" text
);
--> statement-breakpoint
CREATE TABLE "saved_venues" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"venue_id" text NOT NULL,
	"saved_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "worker_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"sweeper" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"elapsed_ms" integer,
	"items_processed" integer DEFAULT 0 NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"estimated_usd" double precision DEFAULT 0 NOT NULL,
	"model" text,
	"status" text DEFAULT 'ok' NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
ALTER TABLE "learning_track_progress" ADD CONSTRAINT "learning_track_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_track_attempts" ADD CONSTRAINT "learning_track_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_track_attempts" ADD CONSTRAINT "learning_track_attempts_question_id_learning_track_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."learning_track_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_track_sessions" ADD CONSTRAINT "learning_track_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_country_interests" ADD CONSTRAINT "user_country_interests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchased_guides" ADD CONSTRAINT "purchased_guides_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchased_guides" ADD CONSTRAINT "purchased_guides_guide_id_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."guides"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_venues" ADD CONSTRAINT "saved_venues_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "translations_lang_key_idx" ON "translations" USING btree ("language_code","key");--> statement-breakpoint
CREATE INDEX "ltq_lookup_idx" ON "learning_track_questions" USING btree ("region_code","register","phase","research_pillar","demographic","level");--> statement-breakpoint
CREATE UNIQUE INDEX "ltq_hash_idx" ON "learning_track_questions" USING btree ("question_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "ltp_user_with_pillar_idx" ON "learning_track_progress" USING btree ("user_id","register","region_code","research_pillar","phase") WHERE "learning_track_progress"."research_pillar" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "ltp_user_no_pillar_idx" ON "learning_track_progress" USING btree ("user_id","register","region_code","phase") WHERE "learning_track_progress"."research_pillar" IS NULL;--> statement-breakpoint
CREATE INDEX "lta_progress_window_idx" ON "learning_track_attempts" USING btree ("user_id","register","region_code","research_pillar","phase","level","attempted_at");--> statement-breakpoint
CREATE INDEX "lta_user_question_idx" ON "learning_track_attempts" USING btree ("user_id","question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lta_session_question_unique_idx" ON "learning_track_attempts" USING btree ("session_id","question_id") WHERE "learning_track_attempts"."session_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "lts_user_register_started_idx" ON "learning_track_sessions" USING btree ("user_id","register","started_at");--> statement-breakpoint
CREATE INDEX "lts_user_register_completed_idx" ON "learning_track_sessions" USING btree ("user_id","register","completed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uci_user_region_idx" ON "user_country_interests" USING btree ("user_id","region_code");--> statement-breakpoint
CREATE INDEX "uci_user_active_idx" ON "user_country_interests" USING btree ("user_id","hidden_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ub_user_badge_idx" ON "user_badges" USING btree ("user_id","badge_id");--> statement-breakpoint
CREATE INDEX "companion_messages_recipient_idx" ON "companion_messages" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "companion_messages_link_idx" ON "companion_messages" USING btree ("link_id");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_venues_user_venue_idx" ON "saved_venues" USING btree ("user_id","venue_id");--> statement-breakpoint
CREATE INDEX "saved_venues_user_idx" ON "saved_venues" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "worker_runs_sweeper_started_idx" ON "worker_runs" USING btree ("sweeper","started_at");