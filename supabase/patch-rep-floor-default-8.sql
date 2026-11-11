-- Default rep floor 8 (not 5); align existing rows that were migrated to 5.
alter table public.routine_items alter column rep_floor set default 8;
alter table public.session_exercises alter column rep_floor set default 8;

update public.routine_items set rep_floor = 8 where rep_floor = 5;
update public.session_exercises set rep_floor = 8 where rep_floor = 5;
