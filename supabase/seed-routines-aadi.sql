-- Kumar / Aadi 6-day split — uses friendly names from seed-exercises.sql (all have GIFs).
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
  ('Day 1 — Chest & shoulders', 'Incline dumbbell press', 1),
  ('Day 1 — Chest & shoulders', 'Machine shoulder press', 2),
  ('Day 1 — Chest & shoulders', 'Machine chest press', 3),
  ('Day 1 — Chest & shoulders', 'Lateral raise', 4),
  ('Day 1 — Chest & shoulders', 'Pec deck fly', 5),
  ('Day 1 — Chest & shoulders', 'Barbell shrug', 6),
  ('Day 1 — Chest & shoulders', 'Push-up', 7),
  ('Day 2 — Back & rear delt', 'Pull-up', 1),
  ('Day 2 — Back & rear delt', 'Lat pulldown', 2),
  ('Day 2 — Back & rear delt', 'Barbell row', 3),
  ('Day 2 — Back & rear delt', 'Reverse-grip lat pulldown', 4),
  ('Day 2 — Back & rear delt', 'Seated cable row', 5),
  ('Day 2 — Back & rear delt', 'Face pull', 6),
  ('Day 3 — Legs', 'Barbell back squat', 1),
  ('Day 3 — Legs', 'Leg press', 2),
  ('Day 3 — Legs', 'Romanian deadlift', 3),
  ('Day 3 — Legs', 'Lying leg curl', 4),
  ('Day 3 — Legs', 'Standing calf raise', 5),
  ('Day 4 — Arms & abs', 'Barbell curl', 1),
  ('Day 4 — Arms & abs', 'Dumbbell hammer curl', 2),
  ('Day 4 — Arms & abs', 'Tricep rope pushdown', 3),
  ('Day 4 — Arms & abs', 'EZ-bar skull crusher', 4),
  ('Day 4 — Arms & abs', 'Cable crunch', 5),
  ('Day 4 — Arms & abs', 'Plank', 6),
  ('Day 5 — Upper body', 'Dumbbell flat bench press', 1),
  ('Day 5 — Upper body', 'Pull-up', 2),
  ('Day 5 — Upper body', 'Dumbbell shoulder press', 3),
  ('Day 5 — Upper body', 'Seated cable row', 4),
  ('Day 5 — Upper body', 'Lateral raise', 5),
  ('Day 6 — Legs', 'Bulgarian split squat', 1),
  ('Day 6 — Legs', 'Hip thrust', 2),
  ('Day 6 — Legs', 'Leg extension', 3),
  ('Day 6 — Legs', 'Seated leg curl', 4),
  ('Day 6 — Legs', 'Walking lunge', 5)
) as v(routine_name, exercise_name, ord) on r.name = v.routine_name
join public.exercises e on e.name = v.exercise_name
on conflict (routine_id, exercise_id) do nothing;
