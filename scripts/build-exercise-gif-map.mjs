#!/usr/bin/env node
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

const index = await loadGifCatalog();
const names = collectExerciseNames();
const map = {};
const unmatched = [];

for (const name of names) {
  const match = matchExerciseToGif(name, index);
  if (!match) {
    unmatched.push(name);
    continue;
  }
  const payload = gifPayload(name, match);
  map[name] = {
    gifUrl: payload.gifUrl,
    matchedName: payload.matchedName,
    method: payload.method,
    score: payload.score,
    focus_muscles: payload.focus_muscles,
    video_source: payload.video_source,
    video_attribution: payload.video_attribution,
  };
}

writeFileSync(join(root, "src/data/exercise-gif-map.json"), JSON.stringify(map, null, 2));
console.log(`Map: ${Object.keys(map).length}/${names.length}; unmatched ${unmatched.length}`);
if (unmatched.length) console.log("Unmatched sample:", unmatched.slice(0, 20).join(" | "));
