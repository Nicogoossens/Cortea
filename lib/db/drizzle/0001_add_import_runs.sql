CREATE TABLE "import_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_id" text NOT NULL,
	"file_name" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"inserted_count" integer DEFAULT 0 NOT NULL,
	"skipped_count" integer DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"errors_json" jsonb DEFAULT '[]'::jsonb,
	"triggered_by" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "import_runs_started_idx" ON "import_runs" USING btree ("started_at");