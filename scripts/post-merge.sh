#!/bin/bash
set -e

echo "=== SOWISO post-merge setup ==="

echo "--- Installing dependencies ---"
pnpm install --frozen-lockfile

echo "--- Pushing DB schema ---"
pnpm --filter db push

echo "--- Seeding Atelier content (idempotent) ---"
pnpm --filter db seed

echo "--- Seeding Compass regions (idempotent) ---"
pnpm --filter db seed:compass

echo "--- Seeding UI translations (idempotent upsert) ---"
node scripts/seed-translations.mjs

echo "--- Ensuring admin account ---"
node scripts/ensure-admin.mjs

echo "--- Translating untranslated scenarios (skips already-translated rows) ---"
node scripts/scenario-translate.mjs || echo "  Warning: scenario-translate encountered errors (non-fatal)"

echo "=== Post-merge complete ==="
