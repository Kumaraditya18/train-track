# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16, React 19, Tailwind CSS 4, Supabase (auth + Postgres), PWA via service worker.

## Users

Members logging gym sessions with a coach (“Aadi”); coach/admin manages exercises and routines. Typical use: phone at the rack, between sets, often one-handed.

## Product Purpose

Let athletes log sets, follow coach-picked routines, track weekly bests, and get progressive-overload hints—without spreadsheet friction.

## Positioning

Coach-authored daily pick plus in-session logging and week-over-week weight targets in one mobile-first PWA tied to a named training relationship.

## Operating Context

Runs in mobile browsers; installable to home screen. Requires Supabase project with schema from `supabase/schema.sql`.

## Capabilities and Constraints

- Email/password auth; profiles with `member` or `admin` role.
- Workout sessions from routines or custom titles; per-set weight/reps logging.
- Admin CRUD for exercises and routines (including daily recommendation flag).
- Progressive overload hints and progress history by ISO week.
- Environment: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (inferred: standard Supabase public keys).

## Brand Commitments

Product name **Train with Aadi**; voice is direct, training-floor practical.

## Evidence on Hand

No marketing photography in repo; UI is product-only.

## Product Principles

1. Logging must stay fast between sets.
2. Coach curation (daily pick) stays visible on home.
3. Numbers (kg, reps, weeks) stay legible at arm’s length.
4. Works offline-tolerant where the PWA allows; data lives in Supabase.

## Accessibility & Inclusion

Touch targets and contrast for dim gym lighting; keyboard focus on forms.
