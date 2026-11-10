-- Only index the app needs: Home / Progress load logs with
--   user_id = ? AND logged_at >= ? ORDER BY logged_at DESC LIMIT N
create index if not exists set_logs_user_logged_at
  on public.set_logs (user_id, logged_at desc);

analyze public.set_logs;
