#!/usr/bin/env node
/**
 * Imports English exercise names from wger.de (open API) into seed SQL.
 * Does not duplicate names already in seed-exercises.sql.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

function categoryToMuscle(categoryName) {
  if (!categoryName) return "General";
  const c = categoryName.toLowerCase();
  if (c.includes("chest")) return "Chest";
  if (c.includes("back")) return "Back";
  if (c.includes("shoulder")) return "Shoulders";
  if (c.includes("arm") || c.includes("biceps") || c.includes("triceps")) return "Arms";
  if (c.includes("leg") || c.includes("calves")) return "Legs";
  if (c.includes("abs") || c.includes("core")) return "Core";
  if (c.includes("cardio")) return "Cardio";
  return categoryName;
}

function esc(s) {
  return s.replace(/'/g, "''");
}

const existing = new Set();
const localSeed = readFileSync(join(root, "supabase/seed-exercises.sql"), "utf8");
for (const m of localSeed.matchAll(/\('([^']+)', '/g)) existing.add(m[1]);

const rows = [];
let url = "https://wger.de/api/v2/exerciseinfo/?language=2&limit=100";
while (url) {
  const res = await fetch(url);
  const data = await res.json();
  for (const ex of data.results) {
    const en = ex.translations?.find((t) => t.language === 2) ?? ex.translations?.[0];
    if (!en?.name) continue;
    const name = en.name.trim();
    if (!name || existing.has(name) || rows.some((r) => r.name === name)) continue;
    const muscle = categoryToMuscle(ex.category?.name);
    const instructions = stripHtml(en.description) || "See form GIF when available (run seed-exercise-gifs.sql).";
    rows.push({
      name,
      muscle,
      instructions,
      videoUrl: null,
      attribution: null,
    });
  }
  url = data.next;
  process.stderr.write(`imported ${rows.length}…\n`);
}

rows.sort((a, b) => a.name.localeCompare(b.name));

const values = rows
  .map(
    (r) =>
      `  ('${esc(r.name)}', '${esc(r.muscle)}', '${esc(r.instructions)}'${
        r.videoUrl ? `, '${esc(r.videoUrl)}', 'wger', '${esc(r.attribution ?? "")}'` : ", null, null, null"
      })`,
  )
  .join(",\n");

const sql = `-- Auto-generated from wger.de API. Run after seed-exercises.sql. Safe to re-run.
alter table public.exercises add column if not exists video_url text;
alter table public.exercises add column if not exists video_source text;
alter table public.exercises add column if not exists video_attribution text;

insert into public.exercises (name, muscle_group, instructions, video_url, video_source, video_attribution) values
${values}
on conflict (name) do update set
  muscle_group = excluded.muscle_group,
  instructions = case when exercises.instructions is null or exercises.instructions = '' then excluded.instructions else exercises.instructions end,
  video_url = coalesce(exercises.video_url, excluded.video_url),
  video_source = coalesce(exercises.video_source, excluded.video_source),
  video_attribution = coalesce(exercises.video_attribution, excluded.video_attribution);

-- ${rows.length} wger exercises added (${rows.filter((r) => r.videoUrl).length} with video links)
`;

writeFileSync(join(root, "supabase/seed-exercises-wger.sql"), sql);
console.log(`Wrote supabase/seed-exercises-wger.sql (${rows.length} exercises)`);
