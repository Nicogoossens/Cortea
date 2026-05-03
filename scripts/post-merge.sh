#!/bin/bash
set -e

echo "=== SOWISO post-merge setup ==="

echo "--- Installing dependencies ---"
pnpm install --frozen-lockfile

echo "--- Applying schema additions (idempotent) ---"
psql "$DATABASE_URL" -c "ALTER TABLE culture_protocols ADD COLUMN IF NOT EXISTS reviewed_by text;" 2>/dev/null || true
psql "$DATABASE_URL" -c "ALTER TABLE culture_protocols ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;" 2>/dev/null || true
psql "$DATABASE_URL" -c "ALTER TABLE users ADD COLUMN IF NOT EXISTS profiling_consent boolean NOT NULL DEFAULT true;" 2>/dev/null || true
psql "$DATABASE_URL" -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'users'::regclass AND conname = 'users_ambition_level_check') THEN ALTER TABLE users ADD CONSTRAINT users_ambition_level_check CHECK (ambition_level IN ('casual', 'professional', 'diplomatic')); END IF; END \$\$;"
psql "$DATABASE_URL" -f lib/db/migrations/0016_companion_messages.sql 2>/dev/null || true

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

echo "=== Post-merge complete ==="
