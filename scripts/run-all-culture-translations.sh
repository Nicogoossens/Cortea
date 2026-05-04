#!/usr/bin/env bash
# Runs all 8 missing language translations sequentially (rate-limit safe).
# Idempotent: already-translated rows are skipped automatically.

set -e
SCRIPT="node scripts/translate-culture-protocols.mjs --batch-size 500"

echo "=== Culture Protocol Translation Runner ==="
echo "Started: $(date)"
echo ""

for LANG in nl fr de es it ar ja pt; do
  echo "────────────── $LANG ──────────────"
  $SCRIPT --lang "$LANG"
  echo ""
done

echo "=== All languages complete: $(date) ==="
