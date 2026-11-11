-- Rep band for progressive overload: rep_floor = min reps, rep_ceiling = max before adding weight.
alter table public.routine_items
  add column if not exists rep_ceiling int not null default 12 check (rep_ceiling > 0);

alter table public.session_exercises
  add column if not exists rep_ceiling int not null default 12 check (rep_ceiling > 0);

alter table public.routine_items drop constraint if exists routine_items_rep_band;
alter table public.routine_items
  add constraint routine_items_rep_band check (rep_ceiling >= rep_floor);

alter table public.session_exercises drop constraint if exists session_exercises_rep_band;
alter table public.session_exercises
  add constraint session_exercises_rep_band check (rep_ceiling >= rep_floor);

alter table public.routine_items alter column rep_floor set default 8;
alter table public.session_exercises alter column rep_floor set default 8;
