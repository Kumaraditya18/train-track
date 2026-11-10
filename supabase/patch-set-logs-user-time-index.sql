-- Range scans for "this week + last week" (user_id equality, logged_at >= since).
-- Complements set_logs_user_exercise_time for per-exercise lookups.
create index if not exists set_logs_user_logged_at
  on public.set_logs (user_id, logged_at desc);

analyze public.set_logs;
