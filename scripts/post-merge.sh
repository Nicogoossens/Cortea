#!/bin/bash
set -e

echo "=== SOWISO post-merge setup ==="

echo "--- Installing dependencies ---"
pnpm install --frozen-lockfile

echo "--- Applying schema additions (idempotent) ---"
psql "$DATABASE_URL" -c "ALTER TABLE culture_protocols ADD COLUMN IF NOT EXISTS reviewed_by text;" 2>/dev/null || true
psql "$DATABASE_URL" -c "ALTER TABLE culture_protocols ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;" 2>/dev/null || true
psql "$DATABASE_URL" -c "ALTER TABLE users ADD COLUMN IF NOT EXISTS profiling_consent boolean NOT NULL DEFAULT true;" 2>/dev/null || true

echo "--- Seeding Atelier scenarios (idempotent upsert) ---"
pnpm --filter @workspace/db tsx src/seed.ts

echo "--- Seeding UI translations (idempotent upsert) ---"
node scripts/seed-translations.mjs

echo "--- Ensuring admin account ---"
node scripts/ensure-admin.mjs

echo "=== Post-merge complete ==="
