#!/usr/bin/env node
/**
 * Maps every exercise in seed SQL files to open wger.de form videos (linked, not hosted).
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");
const supabaseDir = join(root, "supabase");

function collectExerciseNames() {
  const names = new Set();
  const re = /\('([^']+)', '(?:Legs|Chest|Back|Shoulders|Arms|Core)'/g;
  for (const file of readdirSync(supabaseDir)) {
    if (!file.endsWith(".sql")) continue;
    const text = readFileSync(join(supabaseDir, file), "utf8");
    for (const m of text.matchAll(re)) names.add(m[1]);
  }
  return [...names].sort();
}

const WGER_ALIASES = {
  "Barbell back squat": ["barbell squat", "squats on multipress", "squats"],
  "Conventional deadlift": ["deadlift", "romanian deadlift"],
  "Barbell bench press": ["bench press"],
  "Incline dumbbell press": ["incline bench press dumbbell", "incline dumbbell"],
  "Incline barbell bench press": ["incline bench press barbell"],
  "Barbell row": ["bent over row", "rowing", "barbell bent over"],
  "Overhead press": ["military press", "shoulder press"],
  "Dumbbell shoulder press": ["dumbbell shoulder press"],
  "Machine shoulder press": ["shoulder press"],
  "Seated cable row": ["seated row", "cable row", "rowing seated"],
  "Lat pulldown": ["lat pull", "pulldown"],
  "Reverse-grip lat pulldown": ["reverse grip", "chin"],
  "Tricep rope pushdown": ["triceps pushdown", "pushdown"],
  "Barbell curl": ["biceps curls with barbell", "biceps curl"],
  "Dumbbell hammer curl": ["hammer curl"],
  "EZ-bar skull crusher": ["skull crusher", "triceps extension"],
  "Walking lunge": ["lunges walking", "barbell lunges walking"],
  "Bulgarian split squat": ["split squat"],
  "Push-up": ["push ups"],
  "Chin-up": ["chin ups", "chin-up"],
  "Pull-up": ["pull-ups", "pull ups"],
  "Hanging leg raise": ["hanging leg raises"],
  "Cable crunch": ["cable crunches"],
  "Face pull": ["face pulls"],
  "Lying leg curl": ["leg curls laying"],
  "Seated leg curl": ["leg curls sitting"],
  "Leg extension": ["leg extensions"],
  "Machine chest press": ["chest press"],
  "Pec deck fly": ["butterfly", "pec deck"],
  "Barbell shrug": ["shrugs"],
  "Reverse pec deck fly": ["reverse fly", "rear delt"],
  "Standing calf raise": ["calf raises standing"],
  "Hip thrust": ["hip thrust"],
  "Leg press": ["leg press"],
  "Romanian deadlift": ["romanian deadlift"],
  "Plank": ["plank"],
  "Close-grip bench press": ["close grip bench"],
  "Chest-supported row": ["chest supported row"],
  "Cable chest fly": ["cable fly", "fly"],
  "Dumbbell flat bench press": ["dumbbell bench press"],
  "Dumbbell goblet squat": ["goblet squat"],
  "Front squat": ["front squats"],
};

function norm(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function score(a, b) {
  const na = norm(a);
  const nb = norm(b);
  if (na === nb) return 100;
  if (na.includes(nb) || nb.includes(na)) return 82;
  const aw = new Set(na.split(" ").filter((w) => w.length > 2));
  const bw = new Set(nb.split(" ").filter((w) => w.length > 2));
  let shared = 0;
  for (const w of aw) if (bw.has(w)) shared++;
  if (shared === 0) return 0;
  return (shared / Math.max(aw.size, bw.size)) * 75;
}

async function fetchAllExerciseInfo() {
  const out = [];
  let url = "https://wger.de/api/v2/exerciseinfo/?language=2&limit=100";
  while (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`wger ${res.status}`);
    const data = await res.json();
    out.push(...data.results);
    url = data.next;
  }
  return out;
}

const ourNames = collectExerciseNames();
const catalog = await fetchAllExerciseInfo();

/** Only exercises that actually have video files */
const withVideo = catalog
  .map((ex) => {
    const en = ex.translations?.find((t) => t.language === 2) ?? ex.translations?.[0];
    const vid = ex.videos?.[0];
    if (!en?.name || !vid?.video) return null;
    return {
      wgerName: en.name,
      url: vid.video,
      author: vid.license_author || ex.license_author || "wger",
      license: ex.license?.short_name || "CC-BY-SA",
    };
  })
  .filter(Boolean);

const entries = [];
const usedWger = new Set();

for (const name of ourNames) {
  const aliases = [name, ...(WGER_ALIASES[name] ?? [])];
  let best = null;
  let bestScore = 0;
  for (const candidate of withVideo) {
    if (usedWger.has(candidate.url)) continue;
    let s = 0;
    for (const alias of aliases) {
      s = Math.max(s, score(alias, candidate.wgerName));
    }
    if (s > bestScore) {
      bestScore = s;
      best = candidate;
    }
  }
  if (best && bestScore >= 38) {
    usedWger.add(best.url);
    entries.push({
      name,
      wgerName: best.wgerName,
      url: best.url,
      author: best.author,
      license: best.license,
      score: Math.round(bestScore),
    });
  }
}

const sql = [
  "-- wger.de open exercise videos (streamed from wger, not re-hosted). Re-run anytime.",
  "alter table public.exercises add column if not exists video_url text;",
  "alter table public.exercises add column if not exists video_source text;",
  "alter table public.exercises add column if not exists video_attribution text;",
  "",
  ...entries.map(
    (e) => `update public.exercises set
  video_url = '${e.url.replace(/'/g, "''")}',
  video_source = 'wger',
  video_attribution = '${`${e.wgerName} · ${e.author} · ${e.license} (wger.de)`.replace(/'/g, "''")}'
where name = '${e.name.replace(/'/g, "''")}';`,
  ),
  "",
  `-- Matched ${entries.length} of ${ourNames.length} exercises (${withVideo.length} videos in wger catalog)`,
].join("\n");

writeFileSync(join(root, "supabase/seed-exercise-videos.sql"), sql);
console.log(`Wrote ${entries.length}/${ourNames.length} links → supabase/seed-exercise-videos.sql`);
