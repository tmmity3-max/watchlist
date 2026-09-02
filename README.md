# TM Watchlist — Companion Website

This is **Step 1–2** of the build order in the master prompt: Supabase schema + Auth +
RLS, and a Dashboard that reads/writes that schema end-to-end (no live prices or
alerts yet — those are steps 3–5).

## What's here

- `supabase/schema.sql` — the full Postgres schema: `watchlists`, `sections`,
  `symbols` (unique key `(watchlist_id, section_id, ticker, exchange)`, never
  `ticker` alone), `user_settings` (Upstox token + Telegram link, token hidden
  from the client via a `user_settings_public` view), `alerts` (generic
  `{type, operator, value, field}` condition column), `alert_history`. RLS is
  owner-only on every table. `pg_cron`/`pg_net` extensions are enabled up front
  for the Step-3 scheduled job. Realtime is enabled on the sync-relevant tables.
- Next.js 14 (App Router, JS, Tailwind, dark theme) with Supabase Auth
  (email/password + magic link) and a middleware-based session guard.
- `/dashboard` — full CRUD: multiple watchlists, a Super Watchlist aggregate
  view, sections, symbols, color tags, notes, compact toggle. CMP / Prev Day
  High / Today's Move / RVOL columns are stubbed (`—`) — that's Step 3.
- `/alerts`, `/settings` — read the real tables/view already, with the still-
  to-build pieces (condition builder, Telegram connect) clearly marked.
- Realtime subscription on `watchlists`/`sections`/`symbols` so changes from
  the extension (once its sync loop is added) or another tab show up live.

## Setup

1. Create a free Supabase project.
2. In the SQL editor, run `supabase/schema.sql` once.
3. In Authentication settings, make sure "Confirm email" matches what you
   want (magic link + signup both use `emailRedirectTo` back to
   `/auth/callback`).
4. Copy `.env.local.example` to `.env.local` and fill in your project's URL
   and anon key (Project Settings → API).
5. `npm install && npm run dev`, then visit `/signup` to create your account.
6. Deploy to Vercel (Hobby plan, free): import the repo, add the same two env
   vars, deploy. No custom domain needed to start.

## Next steps (build order §9, steps 3–6)

- **Step 3**: Supabase Edge Function + `pg_cron` schedule that calls Upstox,
  writes CMP/prev-day-OHLC/RVOL somewhere the dashboard can read (a `quotes`
  table or a Realtime broadcast), and replaces the `LiveBadges` stub in
  `components/WatchlistBoard.js`.
- **Step 4**: Alert condition builder UI on `/alerts` writing to the `alerts`
  table (schema's already there), plus the same Edge Function evaluating
  active alerts and inserting into `alert_history`.
- **Step 5**: Telegram bot + `t.me/<bot>?start=<code>` linking flow, writing
  `telegram_chat_id` onto `user_settings`, and sending on each new
  `alert_history` row.
- **Step 6**: extension-side push/pull sync loop (§3) against these same
  tables — nothing on the website needs to change for that.
