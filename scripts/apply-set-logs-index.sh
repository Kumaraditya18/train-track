#!/usr/bin/env bash
# Apply index patch. Option A: psql + SUPABASE_DB_URL. Option B: paste SQL in Supabase SQL Editor.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PATCH="${ROOT}/supabase/patch-set-logs-user-time-index.sql"

if [[ -n "${SUPABASE_DB_URL:-}" ]]; then
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$PATCH"
  echo "Index applied via psql."
  exit 0
fi

echo "SUPABASE_DB_URL not set."
echo "Supabase Dashboard → SQL → New query → paste:"
echo ""
cat "$PATCH"
echo ""
echo "Or set SUPABASE_DB_URL (Session pooler URI from Database settings) and re-run this script."
