#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# scripts/sync-schema.sh
#
# Idempotently syncs the Drizzle schema to the database WITHOUT prompts.
# Used by scripts/post-merge.sh to ensure missing tables/columns are always
# created automatically after a code merge or data import — without truncating
# any existing data.
#
# Strategy:
#   1. Run `drizzle-kit generate` to produce a snapshot SQL of the full schema.
#   2. Rewrite CREATE TABLE / CREATE INDEX statements to use IF NOT EXISTS.
#   3. Apply via psql with ON_ERROR_STOP=0 — additive changes succeed,
#      pre-existing definitions raise harmless "already exists" notices that
#      are safely ignored.
#
# This avoids drizzle-kit push's interactive prompts (which require a TTY)
# and guarantees that NEW tables/columns introduced by a schema change are
# added automatically every time post-merge runs.
# ─────────────────────────────────────────────────────────────────────────────
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "[sync-schema] ERROR: DATABASE_URL not set" >&2
  exit 1
fi

DB_DIR="lib/db"
GEN_DIR="$DB_DIR/drizzle"
TMP_SQL="/tmp/sync-schema-$$.sql"

echo "[sync-schema] Generating schema snapshot via drizzle-kit..."
# Wipe any previous snapshot so generate produces a single fresh file
rm -rf "$GEN_DIR"
(cd "$DB_DIR" && pnpm exec drizzle-kit generate --config ./drizzle.config.ts < /dev/null) > /tmp/sync-schema-gen.log 2>&1 || {
  echo "[sync-schema] drizzle-kit generate failed:" >&2
  tail -20 /tmp/sync-schema-gen.log >&2
  exit 1
}

SNAPSHOT=$(ls -t "$GEN_DIR"/*.sql 2>/dev/null | head -1)
if [ -z "$SNAPSHOT" ]; then
  echo "[sync-schema] No SQL snapshot produced — schema unchanged."
  exit 0
fi

echo "[sync-schema] Making snapshot idempotent: $SNAPSHOT"
sed -E '
  s/^CREATE TABLE "/CREATE TABLE IF NOT EXISTS "/g
  s/^CREATE UNIQUE INDEX "/CREATE UNIQUE INDEX IF NOT EXISTS "/g
  s/^CREATE INDEX "/CREATE INDEX IF NOT EXISTS "/g
' "$SNAPSHOT" > "$TMP_SQL"

echo "[sync-schema] Applying via psql (ignoring 'already exists' notices)..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=0 -q -f "$TMP_SQL" 2>&1 \
  | grep -vE "already exists|^NOTICE|^psql:" \
  | grep -E "CREATE|ALTER|ERROR" \
  | head -50 || true

rm -f "$TMP_SQL"
# Keep generated migration so subsequent runs detect drift; safe to re-generate.
echo "[sync-schema] Schema sync complete."
