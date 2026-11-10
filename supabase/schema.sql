-- Train with Aadi — run the FULL file in Supabase SQL Editor (new project).
-- Do not run patch-coach-instructions.sql until after this succeeds once.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  muscle_group text,
  instructions text,
  video_url text,
  video_source text,
  video_attribution text,
  focus_muscles text[],
  created_at timestamptz not null default now(),
  constraint exercises_name_unique unique (name)
);

create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_recommended_daily boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.routine_items (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  sort_order int not null,
  target_sets int not null default 3 check (target_sets > 0),
  rep_floor int not null default 8 check (rep_floor > 0),
  unique (routine_id, exercise_id)
);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  routine_id uuid references public.routines (id) on delete set null,
  title text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  sort_order int not null,
  target_sets int not null default 3 check (target_sets > 0),
  rep_floor int not null default 8 check (rep_floor > 0),
  unique (session_id, exercise_id)
);

create index if not exists session_exercises_session
  on public.session_exercises (session_id, sort_order);

create table if not exists public.set_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  set_index int not null check (set_index >= 1),
  weight_kg numeric(8, 2) not null check (weight_kg >= 0),
  reps int not null check (reps >= 0),
  logged_at timestamptz not null default now()
);

create index if not exists set_logs_user_exercise_time
  on public.set_logs (user_id, exercise_id, logged_at desc);
create index if not exists set_logs_user_logged_at
  on public.set_logs (user_id, logged_at desc);
create index if not exists workout_sessions_user_started
  on public.workout_sessions (user_id, started_at desc);

alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.routines enable row level security;
alter table public.routine_items enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.session_exercises enable row level security;
alter table public.set_logs enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles update own name" on public.profiles;
create policy "profiles update own name"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "exercises read all authenticated" on public.exercises;
create policy "exercises read all authenticated"
  on public.exercises for select
  to authenticated
  using (true);

drop policy if exists "exercises admin write" on public.exercises;
create policy "exercises admin write"
  on public.exercises for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "routines read authenticated" on public.routines;
create policy "routines read authenticated"
  on public.routines for select
  to authenticated
  using (true);

drop policy if exists "routines admin write" on public.routines;
create policy "routines admin write"
  on public.routines for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "routine_items read authenticated" on public.routine_items;
create policy "routine_items read authenticated"
  on public.routine_items for select
  to authenticated
  using (true);

drop policy if exists "routine_items admin write" on public.routine_items;
create policy "routine_items admin write"
  on public.routine_items for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "sessions own" on public.workout_sessions;
create policy "sessions own"
  on public.workout_sessions for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

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

drop policy if exists "set_logs own" on public.set_logs;
create policy "set_logs own"
  on public.set_logs for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
