#!/bin/bash
set -e

echo "=== SOWISO post-merge setup ==="

echo "--- Installing dependencies ---"
pnpm install --frozen-lockfile

echo "--- Seeding UI translations (idempotent upsert) ---"
node scripts/seed-translations.mjs

echo "--- Ensuring admin account ---"
node scripts/ensure-admin.mjs

echo "=== Post-merge complete ==="
