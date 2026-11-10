#!/usr/bin/env bash
# Benchmark the same filters the app uses (run locally: source .env.local first).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env.local ]]; then
  echo "Missing .env.local"
  exit 1
fi
set -a
# shellcheck disable=SC1091
source .env.local
set +a

if [[ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" || -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  echo "Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
  exit 1
fi

USER_ID="${1:-}"
if [[ -z "$USER_ID" ]]; then
  USER_ID="$(curl -s \
    "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?select=id&limit=1" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    | python3 -c "import json,sys; print(json.load(sys.stdin)[0]['id'])")"
fi

SINCE="$(node <<'NODE'
const tz = 'Asia/Kolkata';
const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(new Date());
const y=+parts.find(p=>p.type==='year').value, m=+parts.find(p=>p.type==='month').value, d=+parts.find(p=>p.type==='day').value;
function isoWeekKey(date=new Date()){
  const p=new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  const yy=+p.find(x=>x.type==='year').value, mm=+p.find(x=>x.type==='month').value, dd=+p.find(x=>x.type==='day').value;
  const dt=new Date(Date.UTC(yy,mm-1,dd)); const dn=dt.getUTCDay()||7; dt.setUTCDate(dt.getUTCDate()+4-dn);
  const ys=new Date(Date.UTC(dt.getUTCFullYear(),0,1));
  const w=Math.ceil(((dt-ys)/86400000+1)/7);
  return `${dt.getUTCFullYear()}-W${String(w).padStart(2,'0')}`;
}
function prev(k){const m=/^(\d{4})-W(\d{2})$/.exec(k);const yy=+m[1],w=+m[2];const j4=new Date(Date.UTC(yy,0,4,12));const jd=j4.getUTCDay()||7;const mon=new Date(j4);mon.setUTCDate(j4.getUTCDate()-jd+1+(w-1)*7-7);return isoWeekKey(mon);}
function monYmd(k){const m=/^(\d{4})-W(\d{2})$/.exec(k);const yy=+m[1],w=+m[2];const j4=new Date(Date.UTC(yy,0,4,12));const jd=j4.getUTCDay()||7;const mon=new Date(j4);mon.setUTCDate(j4.getUTCDate()-jd+1+(w-1)*7);return{year:mon.getUTCFullYear(),month:mon.getUTCMonth()+1,day:mon.getUTCDate()};}
const cur=isoWeekKey(); const pk=prev(cur); const mon=monYmd(pk);
const ms=Date.UTC(mon.year,mon.month-1,mon.day,0,0,0)-5.5*3600000;
console.log(new Date(ms).toISOString());
NODE
)"

ENC_SINCE="$(python3 -c "import urllib.parse; print(urllib.parse.quote('''$SINCE'''))")"
BASE="${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/set_logs"
QS="user_id=eq.${USER_ID}&logged_at=gte.${ENC_SINCE}&order=logged_at.desc&limit=96"

echo "user_id=$USER_ID"
echo "since=$SINCE (2-week window start, IST)"
echo ""
echo "=== Lean select (app default) ==="
for i in 1 2 3 4 5; do
  curl -s -o /tmp/bench.json -w "  run $i: %{time_total}s  %{size_download} bytes\n" \
    "${BASE}?${QS}&select=id,exercise_id,set_index,weight_kg,reps,logged_at" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"
done
python3 -c "import json; d=json.load(open('/tmp/bench.json')); print('  rows:', len(d))"
