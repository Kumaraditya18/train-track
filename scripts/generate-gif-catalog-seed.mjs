#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildCuratedLibrary } from "./lib/exercise-library.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function esc(s) {
  return s.replace(/'/g, "''");
}

function pgTextArray(items) {
  return `array[${items.map((i) => `'${esc(i)}'`).join(", ")}]::text[]`;
}

const library = await buildCuratedLibrary(180);

const values = library
  .map(
    (e) =>
      `  ('${esc(e.name)}', '${esc(e.muscle_group)}', '${esc(e.instructions)}', '${esc(e.video_url)}', '${e.video_source}', '${esc(e.video_attribution)}', ${pgTextArray(e.focus_muscles)})`,
  )
  .join(",\n");

const sql = `-- Common gym exercises only — every row has a GIF (ExerciseGymGifsDB).
-- Regenerate: npm run generate:exercises
alter table public.exercises add column if not exists focus_muscles text[];

insert into public.exercises (name, muscle_group, instructions, video_url, video_source, video_attribution, focus_muscles) values
${values}
on conflict (name) do update set
  muscle_group = excluded.muscle_group,
  instructions = excluded.instructions,
  video_url = excluded.video_url,
  video_source = excluded.video_source,
  video_attribution = excluded.video_attribution,
  focus_muscles = excluded.focus_muscles;

-- ${library.length} exercises (all with GIF URLs)
`;

writeFileSync(join(root, "supabase/seed-exercises.sql"), sql);

const routineNames = {
  day1: [
    "Incline dumbbell press",
    "Machine shoulder press",
    "Machine chest press",
    "Lateral raise",
    "Pec deck fly",
    "Barbell shrug",
    "Push-up",
  ],
  day2: [
    "Pull-up",
    "Lat pulldown",
    "Barbell row",
    "Reverse-grip lat pulldown",
    "Seated cable row",
    "Face pull",
  ],
  day3: ["Barbell back squat", "Leg press", "Romanian deadlift", "Lying leg curl", "Standing calf raise"],
  day4: [
    "Barbell curl",
    "Dumbbell hammer curl",
    "Tricep rope pushdown",
    "EZ-bar skull crusher",
    "Cable crunch",
    "Plank",
  ],
  day5: [
    "Dumbbell flat bench press",
    "Pull-up",
    "Dumbbell shoulder press",
    "Seated cable row",
    "Lateral raise",
  ],
  day6: [
    "Bulgarian split squat",
    "Hip thrust",
    "Leg extension",
    "Seated leg curl",
    "Walking lunge",
  ],
};

const routineSql = `-- Kumar / Aadi 6-day split — uses friendly names from seed-exercises.sql (all have GIFs).
-- Regenerate: npm run generate:exercises

delete from public.routine_items
where routine_id in (select id from public.routines where name in ('Push day', 'Pull day', 'Leg day'));

delete from public.routines where name in ('Push day', 'Pull day', 'Leg day');

insert into public.routines (name, description, is_recommended_daily)
select 'Day 1 — Chest & shoulders', 'Chest & shoulders — compounds then accessories.', true
where not exists (select 1 from public.routines where name = 'Day 1 — Chest & shoulders');

insert into public.routines (name, description, is_recommended_daily)
select 'Day 2 — Back & rear delt', 'Vertical & horizontal pulls, rear delts.', false
where not exists (select 1 from public.routines where name = 'Day 2 — Back & rear delt');

insert into public.routines (name, description, is_recommended_daily)
select 'Day 3 — Legs', 'Squat, hinge, hamstrings, calves.', false
where not exists (select 1 from public.routines where name = 'Day 3 — Legs');

insert into public.routines (name, description, is_recommended_daily)
select 'Day 4 — Arms & abs', 'Arms + core.', false
where not exists (select 1 from public.routines where name = 'Day 4 — Arms & abs');

insert into public.routines (name, description, is_recommended_daily)
select 'Day 5 — Upper body', 'Push / pull mix.', false
where not exists (select 1 from public.routines where name = 'Day 5 — Upper body');

insert into public.routines (name, description, is_recommended_daily)
select 'Day 6 — Legs', 'Unilateral & glutes.', false
where not exists (select 1 from public.routines where name = 'Day 6 — Legs');

update public.routines set is_recommended_daily = (name = 'Day 1 — Chest & shoulders');

insert into public.routine_items (routine_id, exercise_id, sort_order, target_sets, rep_floor)
select r.id, e.id, v.ord, 3, 8
from public.routines r
join (values
${Object.entries({
  "Day 1 — Chest & shoulders": routineNames.day1,
  "Day 2 — Back & rear delt": routineNames.day2,
  "Day 3 — Legs": routineNames.day3,
  "Day 4 — Arms & abs": routineNames.day4,
  "Day 5 — Upper body": routineNames.day5,
  "Day 6 — Legs": routineNames.day6,
})
  .flatMap(([routine, names]) => names.map((exercise, i) => `  ('${esc(routine)}', '${esc(exercise)}', ${i + 1})`))
  .join(",\n")}
) as v(routine_name, exercise_name, ord) on r.name = v.routine_name
join public.exercises e on e.name = v.exercise_name
on conflict (routine_id, exercise_id) do nothing;
`;

writeFileSync(join(root, "supabase/seed-routines-aadi.sql"), routineSql);

writeFileSync(
  join(root, "supabase/seed-exercises-wger.sql"),
  `-- Deprecated: wger names rarely match GIFs and clutter the library.\n-- Use seed-exercises.sql (${library.length} common moves, all with GIFs).\n`,
);

console.log(`seed-exercises.sql: ${library.length} exercises`);
console.log(`seed-routines-aadi.sql: updated`);
