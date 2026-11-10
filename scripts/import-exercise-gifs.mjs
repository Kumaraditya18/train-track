#!/usr/bin/env node
/** Regenerates supabase/seed-exercise-gifs.sql using strict matcher (prefer push-exercise-gifs.mjs). */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gifPayload, loadGifCatalog, matchExerciseToGif } from "./lib/gif-match.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function collectExerciseNames() {
  const names = new Set();
  for (const file of readdirSync(join(root, "supabase"))) {
    if (!file.endsWith(".sql")) continue;
    const text = readFileSync(join(root, "supabase", file), "utf8");
    for (const m of text.matchAll(/\('([^']+)',\s*'/g)) names.add(m[1]);
  }
  return [...names].sort();
}

function esc(s) {
  return s.replace(/'/g, "''");
}

function pgTextArray(items) {
  if (!items?.length) return "null";
  return `array[${items.map((i) => `'${esc(i)}'`).join(", ")}]::text[]`;
}

const index = await loadGifCatalog();
const ourNames = collectExerciseNames();
const entries = [];

for (const name of ourNames) {
  const match = matchExerciseToGif(name, index);
  if (!match) continue;
  entries.push(gifPayload(name, match));
}

const updates = entries
  .map(
    (e) => `update public.exercises set
  video_url = '${esc(e.gifUrl)}',
  video_source = 'gifdb',
  video_attribution = '${esc(e.video_attribution)}',
  focus_muscles = ${pgTextArray(e.focus_muscles)}
where name = '${esc(e.name)}';`,
  )
  .join("\n");

const sql = `-- Strict GIF map. Prefer: node scripts/push-exercise-gifs.mjs
alter table public.exercises add column if not exists focus_muscles text[];

${updates}

update public.exercises
set video_url = null, video_source = null, video_attribution = null
where video_url ilike '%exercise-video%' or video_url ilike '%.mov';

-- ${entries.length}/${ourNames.length} matched
`;

writeFileSync(join(root, "supabase/seed-exercise-gifs.sql"), sql);
console.log(`Wrote seed-exercise-gifs.sql (${entries.length}/${ourNames.length})`);
