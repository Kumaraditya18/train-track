#!/usr/bin/env node
/**
 * Match + push correct GIFs to Supabase via REST (curl-style fetch).
 *
 * Auth (first that works):
 *   SUPABASE_SERVICE_ROLE_KEY in .env.local  (Dashboard → API → service_role)
 *   or SUPABASE_ADMIN_EMAIL + SUPABASE_ADMIN_PASSWORD (coach account)
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gifPayload, loadGifCatalog, matchExerciseToGif } from "./lib/gif-match.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env.local");

function loadEnv() {
  if (!existsSync(envPath)) throw new Error("Missing .env.local");
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

async function getAccessToken(env) {
  if (env.SUPABASE_SERVICE_ROLE_KEY) return env.SUPABASE_SERVICE_ROLE_KEY;

  const email = env.SUPABASE_ADMIN_EMAIL;
  const password = env.SUPABASE_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Add SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ADMIN_EMAIL + SUPABASE_ADMIN_PASSWORD to .env.local",
    );
  }

  const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || "Sign-in failed");
  return data.access_token;
}

function restHeaders(env, token) {
  const key = env.SUPABASE_SERVICE_ROLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return {
    apikey: key,
    Authorization: `Bearer ${token}`,
  };
}

async function fetchAllExercises(env, token) {
  const headers = restHeaders(env, token);
  const rows = [];
  let from = 0;
  const page = 500;
  while (true) {
    const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/exercises?select=id,name,video_url&order=name&offset=${from}&limit=${page}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Fetch exercises ${res.status}: ${await res.text()}`);
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < page) break;
    from += page;
  }
  return rows;
}

async function patchExercise(env, token, id, body) {
  const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/exercises?id=eq.${id}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      ...restHeaders(env, token),
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${id} ${res.status}: ${await res.text()}`);
}

async function clearMovLinks(env, token) {
  const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/exercises?or=(video_url.ilike.*exercise-video*,video_url.ilike.*.mov)`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      ...restHeaders(env, token),
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ video_url: null, video_source: null, video_attribution: null }),
  });
  if (!res.ok) console.warn("Could not bulk-clear MOV links:", await res.text());
}

const env = loadEnv();
const token = await getAccessToken(env);
const index = await loadGifCatalog();
const exercises = await fetchAllExercises(env, token);

if (exercises.length === 0) {
  throw new Error("No exercises returned — check auth key / admin role.");
}

const map = {};
const unmatched = [];
const report = [];

for (const row of exercises) {
  const match = matchExerciseToGif(row.name, index);
  if (!match) {
    unmatched.push(row.name);
    if (row.video_url && (/\.mov/i.test(row.video_url) || row.video_url.includes("exercise-video"))) {
      await patchExercise(env, token, row.id, {
        video_url: null,
        video_source: null,
        video_attribution: null,
      });
    }
    continue;
  }
  const payload = gifPayload(row.name, match);
  map[row.name] = {
    gifUrl: payload.gifUrl,
    matchedName: payload.matchedName,
    method: payload.method,
    score: payload.score,
    focus_muscles: payload.focus_muscles,
    video_source: payload.video_source,
    video_attribution: payload.video_attribution,
  };
  report.push({
    ours: row.name,
    theirs: payload.matchedName,
    method: payload.method,
    score: payload.score,
  });

  await patchExercise(env, token, row.id, {
    video_url: payload.gifUrl,
    video_source: payload.video_source,
    video_attribution: payload.video_attribution,
    focus_muscles: payload.focus_muscles,
  });
}

await clearMovLinks(env, token);

writeFileSync(join(root, "src/data/exercise-gif-map.json"), JSON.stringify(map, null, 2));
writeFileSync(
  join(root, "supabase/seed-exercise-gifs.sql"),
  `-- Generated by scripts/push-exercise-gifs.mjs — use push script to apply remotely.\n-- Matched ${report.length}/${exercises.length}; unmatched ${unmatched.length}\n`,
);

console.log(`Patched ${report.length}/${exercises.length} exercises in Supabase`);
console.log(`Unmatched: ${unmatched.length}`);
if (unmatched.length) console.log(unmatched.slice(0, 25).join("\n"), unmatched.length > 25 ? "…" : "");

const fuzzy = report.filter((r) => r.method === "fuzzy");
console.log(`Fuzzy matches: ${fuzzy.length} (review if needed)`);
