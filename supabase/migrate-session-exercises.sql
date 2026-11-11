-- Run once in SQL Editor (after schema.sql) if you already created the project earlier.

create table if not exists public.session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  sort_order int not null,
  target_sets int not null default 3 check (target_sets > 0),
  rep_floor int not null default 5 check (rep_floor > 0),
  unique (session_id, exercise_id)
);

create index if not exists session_exercises_session
  on public.session_exercises (session_id, sort_order);

alter table public.session_exercises enable row level security;

drop policy if exists "session_exercises own" on public.session_exercises;
create policy "session_exercises own"
  on public.session_exercises for all
  to authenticated
  using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

-- First account ever becomes coach/admin (re-signup not needed for new projects).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bootstrap text := current_setting('app.admin_bootstrap_email', true);
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    case
      when not exists (select 1 from public.profiles) then 'admin'
      when bootstrap is not null and lower(new.email) = lower(bootstrap) then 'admin'
      else 'member'
    end
  );
  return new;
end;
$$;
