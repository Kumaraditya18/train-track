-- ONLY if public.exercises already exists (you ran an older schema.sql with Grok).
-- Fresh project? Run schema.sql instead — NOT this file.

alter table public.exercises add column if not exists instructions text;

drop table if exists public.exercise_guides;
