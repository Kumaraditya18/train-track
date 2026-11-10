# Train & Track

Mobile-friendly web app (PWA) for coach-led routines, set logging, weekly max tracking, and progressive overload hints. Exercise form cues are written by the coach in Admin — no paid AI APIs.

## Stack

- **Next.js** (App Router) — UI + server actions  
- **Supabase** (free tier) — auth, Postgres, row-level security  
- **Vercel** (free tier) — hosting  
## Local setup

1. Create a [Supabase](https://supabase.com) project (free).
2. In the SQL editor, run [`supabase/schema.sql`](./supabase/schema.sql).  
   If you already ran an older schema, run [`supabase/patch-coach-instructions.sql`](./supabase/patch-coach-instructions.sql) instead.
3. Copy `.env.example` → `.env.local` and fill in **Project URL** + **anon key** from Supabase **Project Settings → API**.
4. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### First admin (Aadi / coach)

After your first account signup, promote yourself in Supabase SQL:

```sql
update public.profiles set role = 'admin' where id = '<your-user-uuid>';
```

Find your UUID under **Authentication → Users**.

## Deploy (free)

1. Push the repo to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add the same two Supabase variables as `.env.local`.
4. In Supabase **Authentication → URL configuration**, set **Site URL** to your Vercel domain and add it to **Redirect URLs** (`https://your-app.vercel.app/auth/callback`).

## Install on phone

Open the site in Chrome (Android) or Safari (iOS) → **Add to Home Screen**. The included service worker caches the app shell for quicker loads (API calls still need network).

## Project layout

```
src/app/actions/     Server mutations (auth, workouts, admin)
src/lib/training/    Domain types + weekly max + overload copy
src/lib/data/        Read models for pages
src/components/      UI by feature (shell, workout, admin)
supabase/schema.sql  Database source of truth
```

## License

Private / personal use unless you decide otherwise.
