#!/usr/bin/env node
/**
 * Upsert curated GIF library to Supabase (batched REST — fast).
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildCuratedLibrary } from "./lib/exercise-library.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env.local");
const BATCH = 50;

function loadEnv() {
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

function headers(env, token, extra = {}) {
  const key = env.SUPABASE_SERVICE_ROLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return { apikey: key, Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...extra };
}

async function upsertBatch(env, token, rows) {
  const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/exercises?on_conflict=name`;
  const res = await fetch(url, {
    method: "POST",
    headers: headers(env, token, { Prefer: "resolution=merge-duplicates,return=minimal" }),
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`Batch upsert: ${await res.text()}`);
}

async function fetchIds(env, token) {
  const rows = [];
  let offset = 0;
  while (true) {
    const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/exercises?select=id,name&order=name&limit=500&offset=${offset}`;
    const res = await fetch(url, { headers: headers(env, token) });
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < 500) break;
    offset += 500;
  }
  return rows;
}

async function fetchLoggedExerciseIds(env, token) {
  const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/set_logs?select=exercise_id`;
  const res = await fetch(url, { headers: headers(env, token) });
  const rows = await res.json();
  return new Set((rows ?? []).map((r) => r.exercise_id));
}

async function deleteByIds(env, token, ids) {
  if (ids.length === 0) return;
  const chunk = ids.slice(0, 100);
  const idList = chunk.map((id) => `"${id}"`).join(",");
  const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/exercises?id=in.(${idList})`;
  const res = await fetch(url, { method: "DELETE", headers: headers(env, token) });
  if (!res.ok) throw new Error(`Delete: ${await res.text()}`);
  if (ids.length > 100) await deleteByIds(env, token, ids.slice(100));
}

if (!existsSync(envPath)) throw new Error("Missing .env.local");
const env = loadEnv();
const token = env.SUPABASE_SERVICE_ROLE_KEY;
if (!token) throw new Error("SUPABASE_SERVICE_ROLE_KEY required in .env.local");

const t0 = Date.now();
const library = await buildCuratedLibrary(70);
const keepNames = new Set(library.map((e) => e.name));

const payload = library.map((e) => ({
  name: e.name,
  muscle_group: e.muscle_group,
  instructions: e.instructions,
  video_url: e.video_url,
  video_source: e.video_source,
  video_attribution: e.video_attribution,
  focus_muscles: e.focus_muscles,
}));

for (let i = 0; i < payload.length; i += BATCH) {
  await upsertBatch(env, token, payload.slice(i, i + BATCH));
}

const [existing, loggedIds] = await Promise.all([fetchIds(env, token), fetchLoggedExerciseIds(env, token)]);
const toRemove = existing.filter((r) => !keepNames.has(r.name) && !loggedIds.has(r.id)).map((r) => r.id);
await deleteByIds(env, token, toRemove);

writeFileSync(
  join(root, "src/data/exercise-gif-map.json"),
  JSON.stringify(
    Object.fromEntries(
      library.map((e) => [
        e.name,
        {
          gifUrl: e.video_url,
          matchedName: e.catalog_name,
          method: "catalog",
          score: 100,
          focus_muscles: e.focus_muscles,
          video_source: e.video_source,
          video_attribution: e.video_attribution,
        },
      ]),
    ),
    null,
    2,
  ),
);

const sec = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`Done in ${sec}s — ${library.length} exercises upserted, ${toRemove.length} pruned.`);
