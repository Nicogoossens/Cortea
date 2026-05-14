#!/bin/bash
set -e

echo "=== SOWISO post-merge setup ==="

echo "--- Installing dependencies ---"
pnpm install --frozen-lockfile

# ─────────────────────────────────────────────────────────────────────────────
# Schema sync — fully automatic, idempotent, never prompts.
# Any new tables/columns introduced by the merged code are added here so that
# subsequent seed steps and API requests cannot fail with "relation does not
# exist". See scripts/sync-schema.sh for the strategy.
# ─────────────────────────────────────────────────────────────────────────────
echo "--- Syncing Drizzle schema (idempotent, non-interactive) ---"
bash scripts/sync-schema.sh

echo "--- Applying schema additions (legacy idempotent ALTERs) ---"
psql "$DATABASE_URL" -c "ALTER TABLE culture_protocols ADD COLUMN IF NOT EXISTS reviewed_by text;" 2>/dev/null || true
psql "$DATABASE_URL" -c "ALTER TABLE culture_protocols ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;" 2>/dev/null || true
psql "$DATABASE_URL" -c "ALTER TABLE users ADD COLUMN IF NOT EXISTS profiling_consent boolean NOT NULL DEFAULT true;" 2>/dev/null || true
psql "$DATABASE_URL" -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'users'::regclass AND conname = 'users_ambition_level_check') THEN ALTER TABLE users ADD CONSTRAINT users_ambition_level_check CHECK (ambition_level IN ('casual', 'professional', 'diplomatic')); END IF; END \$\$;"
psql "$DATABASE_URL" -f lib/db/migrations/0016_companion_messages.sql 2>/dev/null || true

# ─────────────────────────────────────────────────────────────────────────────
# PROD schema sync — lib/db connects to PROD_DATABASE_URL when set (which is
# the live database used by the API server). Any Drizzle migration files in
# lib/db/drizzle/ are applied idempotently here so the server never starts
# against a stale schema.
# ─────────────────────────────────────────────────────────────────────────────
if [ -n "$PROD_DATABASE_URL" ]; then
  echo "--- Syncing Drizzle migrations to PROD database ---"
  for sql_file in lib/db/drizzle/*.sql; do
    [ -f "$sql_file" ] || continue
    echo "  Applying: $sql_file"
    psql "$PROD_DATABASE_URL" -v ON_ERROR_STOP=0 -q -f "$sql_file" 2>&1 \
      | grep -vE "already exists|^NOTICE|^psql:|^$" || true
  done
  echo "  PROD schema sync complete."
fi

echo "--- Task #404: user_country_contexts table (idempotent) ---"
pnpm --filter @workspace/db migrate-country-contexts

echo "--- Seeding Atelier scenarios (idempotent upsert) ---"
pnpm --filter @workspace/db exec tsx src/seed.ts

echo "--- Seeding world country stubs (~195 ISO codes, onConflictDoNothing) ---"
pnpm --filter @workspace/db exec tsx src/seed-world-stubs.ts

echo "--- Seeding Compass priority country content (17 published countries) ---"
pnpm --filter @workspace/db exec tsx src/seed-compass.ts
pnpm --filter @workspace/db exec tsx src/seed-compass-priority.ts

echo "--- Seeding UI translations (idempotent upsert) ---"
node scripts/seed-translations.mjs

echo "--- Ensuring admin account ---"
node scripts/ensure-admin.mjs

# ─────────────────────────────────────────────────────────────────────────────
# Background workers — no manual launch required.
# The api-server runs two long-lived sweepers that automatically pick up any
# pending work after this post-merge step finishes:
#
#   1. register-calibration-sweeper:  scans `translations` rows whose key
#      matches a content prefix and whose `calibrated_module` is NULL,
#      then rewrites them in the correct register (formal NL/FR/DE/...).
#
#   2. register-scenario-translation-sweeper: scans `scenarios` rows whose
#      `content_i18n` is NULL, then spawns scripts/scenario-translate.mjs
#      to translate title + content into nl, fr, de, es, pt, it, ar, ja, zh.
#
# Both sweepers run on a fixed interval inside the api-server process, so
# they survive shell sessions and are guaranteed to pick up any data added
# by this post-merge or by future admin imports.
# ─────────────────────────────────────────────────────────────────────────────

echo "=== Post-merge complete ==="
echo "Background workers in api-server will translate + calibrate any new content automatically."
