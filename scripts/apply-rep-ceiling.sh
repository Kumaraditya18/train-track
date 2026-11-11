#!/usr/bin/env bash
# Apply rep_ceiling migration + optional rep_floor data fix.
#
# DDL (ALTER TABLE) cannot run via PostgREST / service role. Use one of:
#   A) SUPABASE_ACCESS_TOKEN (sbp_… from Dashboard → Account → Access Tokens)
#      → curl Management API (same as SQL Editor).
#   B) SUPABASE_DB_URL (Session pooler URI) → psql.
#
# After columns exist, data fixes use curl + SUPABASE_SERVICE_ROLE_KEY.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIGRATION="${ROOT}/supabase/migrate-rep-ceiling.sql"

if [[ ! -f "${ROOT}/.env.local" ]]; then
  echo "Missing .env.local"
  exit 1
fi
set -a
# shellcheck disable=SC1091
source "${ROOT}/.env.local"
set +a

PROJECT_REF="${SUPABASE_PROJECT_REF:-}"
if [[ -z "$PROJECT_REF" && -n "${NEXT_PUBLIC_SUPABASE_URL:-}" ]]; then
  PROJECT_REF="$(python3 -c "import re,os; m=re.search(r'https://([^.]+)\\.supabase\\.co', os.environ['NEXT_PUBLIC_SUPABASE_URL']); print(m.group(1) if m else '')")"
fi

apply_via_psql() {
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$MIGRATION"
}

apply_via_management_api() {
  if [[ -z "$PROJECT_REF" ]]; then
    echo "Could not derive project ref from NEXT_PUBLIC_SUPABASE_URL"
    exit 1
  fi
  local body
  body="$(python3 -c "import json, pathlib; print(json.dumps({'query': pathlib.Path('${MIGRATION}').read_text()}))")"
  local http
  http="$(curl -s -w "%{http_code}" -o /tmp/supabase-migrate-rep-ceiling.json \
    -X POST "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query" \
    -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$body")"
  if [[ "$http" != "201" && "$http" != "200" ]]; then
    echo "Management API failed (HTTP ${http}):"
    cat /tmp/supabase-migrate-rep-ceiling.json
    echo
    exit 1
  fi
  echo "Migration applied via Management API (HTTP ${http})."
}

patch_rep_floor_via_rest() {
  if [[ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" || -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
    echo "Skipping REST patch: need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    return 0
  fi
  local hdr=(
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}"
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"
    -H "Content-Type: application/json"
    -H "Prefer: return=minimal"
  )
  for table in routine_items session_exercises; do
    curl -s -o /dev/null -w "${table} rep_floor 8→5: HTTP %{http_code}\n" \
      -X PATCH "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}?rep_floor=eq.8" \
      "${hdr[@]}" \
      -d '{"rep_floor":5}'
  done
}

verify_columns() {
  local code
  code="$(curl -s -o /dev/null -w "%{http_code}" \
    "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/routine_items?select=rep_floor,rep_ceiling&limit=1" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}")"
  if [[ "$code" != "200" ]]; then
    echo "Verify failed: routine_items select returned HTTP ${code} (columns may be missing)."
    exit 1
  fi
  echo "Verified: rep_ceiling column is readable via REST."
}

if [[ -n "${SUPABASE_DB_URL:-}" ]]; then
  apply_via_psql
elif [[ -n "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  apply_via_management_api
else
  echo "Set SUPABASE_ACCESS_TOKEN (sbp_…) or SUPABASE_DB_URL in .env.local, then re-run:"
  echo "  ${ROOT}/scripts/apply-rep-ceiling.sh"
  echo ""
  echo "Service role (sb_secret_…) cannot run DDL — only row reads/writes via /rest/v1."
  echo "Or paste this file in Supabase SQL Editor:"
  echo ""
  cat "$MIGRATION"
  exit 1
fi

verify_columns
patch_rep_floor_via_rest
