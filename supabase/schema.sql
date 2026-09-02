-- TM Watchlist — Supabase schema
-- Mirrors the Chrome extension's data model exactly (see extension src/store.js):
--   Watchlist -> Section[] -> Symbol[]
-- Unique key for a symbol row is (watchlist_id, section_id, ticker, exchange),
-- NEVER ticker alone — the same ticker can legitimately appear in multiple sections.
--
-- Run this once in the Supabase SQL editor (or via `supabase db push`).

-- ─────────────────────────────────────────────────────────────
-- Extensions needed for Supabase Cron (pg_cron + pg_net) later.
-- Safe to run now even though nothing schedules a job yet (§4/§5).
-- ─────────────────────────────────────────────────────────────
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- ─────────────────────────────────────────────────────────────
-- watchlists
-- ─────────────────────────────────────────────────────────────
create table if not exists public.watchlists (
  id               text primary key,               -- e.g. 'default', 'nifty50' or generated
  user_id          uuid not null references auth.users(id) on delete cascade,
  name             text not null,
  active_section_id text,                            -- nullable: null = "show all"
  sort_order       int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_watchlists_user on public.watchlists(user_id);

-- ─────────────────────────────────────────────────────────────
-- sections
-- ─────────────────────────────────────────────────────────────
create table if not exists public.sections (
  id             text primary key,                  -- e.g. 'sec_<ts>_<rand>' from extension
  watchlist_id   text not null references public.watchlists(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  name           text not null,
  is_collapsed   boolean not null default false,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_sections_watchlist on public.sections(watchlist_id);
create index if not exists idx_sections_user on public.sections(user_id);

-- ─────────────────────────────────────────────────────────────
-- symbols
-- Unique key: (watchlist_id, section_id, ticker, exchange) — NOT ticker alone.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.symbols (
  id             uuid primary key default gen_random_uuid(),
  watchlist_id   text not null references public.watchlists(id) on delete cascade,
  section_id     text not null references public.sections(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  ticker         text not null,
  exchange       text not null default 'NSE',        -- 'NSE' | 'BSE' | 'MCX' etc.
  color          text not null default 'none',       -- 'none' | 'red' | 'yellow' | 'green'
  note           text not null default '',
  sort_order     int not null default 0,
  added_at       timestamptz not null default now(), -- mirrors extension's addedAt
  updated_at     timestamptz not null default now(),
  constraint symbols_color_check check (color in ('none','red','yellow','green')),
  constraint symbols_unique_row unique (watchlist_id, section_id, ticker, exchange)
);

create index if not exists idx_symbols_user on public.symbols(user_id);
create index if not exists idx_symbols_section on public.symbols(section_id);
create index if not exists idx_symbols_watchlist_ticker on public.symbols(watchlist_id, ticker);

-- ─────────────────────────────────────────────────────────────
-- user_settings (1 row per user)
-- upstoxAccessToken lives here but is never selectable by the client (see RLS below) —
-- only a service-role key (used by the Edge Function / server routes) can read it.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.user_settings (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  is_compact         boolean not null default false,
  show_live_badges   boolean not null default true,
  active_watchlist_id text,
  upstox_access_token text,          -- encrypted-at-rest by Supabase; access further locked by RLS
  upstox_token_updated_at timestamptz,
  telegram_chat_id   bigint,
  telegram_link_code text,           -- one-time code used during /start deep link, cleared once linked
  updated_at         timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- alerts
-- Condition schema is generic ({type, operator, value, field}) so new
-- condition types can be added later without a table rewrite (§5).
-- ─────────────────────────────────────────────────────────────
create table if not exists public.alerts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  -- scope: exactly one of symbol-scope or section-scope is set
  watchlist_id   text references public.watchlists(id) on delete cascade,
  section_id     text references public.sections(id) on delete cascade,   -- set => applies to every symbol in section
  ticker         text,                                                     -- set when scoped to a single symbol
  exchange       text,
  condition      jsonb not null,      -- { type, operator, value, field }
  status         text not null default 'active' check (status in ('active','paused')),
  cooldown_secs  int not null default 86400,   -- default: don't re-fire same condition within 1 trading day
  last_fired_at  timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_alerts_user on public.alerts(user_id);
create index if not exists idx_alerts_status on public.alerts(status) where status = 'active';

-- ─────────────────────────────────────────────────────────────
-- alert_history — append-only log of firings, shown on the Alerts page
-- so firings are visible even if the Telegram message was missed/blocked.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.alert_history (
  id             uuid primary key default gen_random_uuid(),
  alert_id       uuid references public.alerts(id) on delete set null,
  user_id        uuid not null references auth.users(id) on delete cascade,
  ticker         text not null,
  exchange       text not null,
  condition      jsonb not null,       -- snapshot of the condition that fired
  cmp_at_fire    numeric,
  fired_at       timestamptz not null default now(),
  telegram_sent  boolean not null default false,
  telegram_error text
);

create index if not exists idx_alert_history_user on public.alert_history(user_id, fired_at desc);

-- ─────────────────────────────────────────────────────────────
-- updated_at trigger helper (used for last-write-wins conflict resolution, §3)
-- ─────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_watchlists_updated_at on public.watchlists;
create trigger trg_watchlists_updated_at before update on public.watchlists
  for each row execute function public.set_updated_at();

drop trigger if exists trg_sections_updated_at on public.sections;
create trigger trg_sections_updated_at before update on public.sections
  for each row execute function public.set_updated_at();

drop trigger if exists trg_symbols_updated_at on public.symbols;
create trigger trg_symbols_updated_at before update on public.symbols
  for each row execute function public.set_updated_at();

drop trigger if exists trg_alerts_updated_at on public.alerts;
create trigger trg_alerts_updated_at before update on public.alerts
  for each row execute function public.set_updated_at();

drop trigger if exists trg_user_settings_updated_at on public.user_settings;
create trigger trg_user_settings_updated_at before update on public.user_settings
  for each row execute function public.set_updated_at();

-- auto-create a user_settings row whenever a new auth user signs up
-- (covers both the website sign-up and the extension's magic-link auth, §3)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_settings (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- Row Level Security — every table is owner-only, no exceptions,
-- except upstox_access_token which is additionally hidden from the
-- client even for the owning user (service-role only).
-- ─────────────────────────────────────────────────────────────
alter table public.watchlists enable row level security;
alter table public.sections enable row level security;
alter table public.symbols enable row level security;
alter table public.user_settings enable row level security;
alter table public.alerts enable row level security;
alter table public.alert_history enable row level security;

create policy "watchlists_owner_all" on public.watchlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "sections_owner_all" on public.sections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "symbols_owner_all" on public.symbols
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "alerts_owner_all" on public.alerts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "alert_history_owner_read" on public.alert_history
  for select using (auth.uid() = user_id);
-- inserts to alert_history come only from the service-role Edge Function (RLS bypassed there),
-- so no insert/update/delete policy is granted to regular users.

-- user_settings: owner can read/write their own row EXCEPT the token columns.
-- We achieve "hide token from client" via a column-privilege revoke rather than
-- RLS (RLS is row-level, not column-level) plus a public view that omits it.
create policy "user_settings_owner_all" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

revoke select (upstox_access_token) on public.user_settings from authenticated, anon;

-- Client-safe view: what the website's dashboard/settings UI actually queries.
-- Never expose upstox_access_token here.
create or replace view public.user_settings_public as
select
  user_id,
  is_compact,
  show_live_badges,
  active_watchlist_id,
  (upstox_access_token is not null and upstox_access_token <> '') as upstox_connected,
  upstox_token_updated_at,
  telegram_chat_id is not null as telegram_connected,
  updated_at
from public.user_settings;

alter view public.user_settings_public set (security_invoker = true);

-- ─────────────────────────────────────────────────────────────
-- Realtime: enable logical replication for sync (extension <-> website, §3)
-- ─────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.watchlists;
alter publication supabase_realtime add table public.sections;
alter publication supabase_realtime add table public.symbols;
alter publication supabase_realtime add table public.alerts;
alter publication supabase_realtime add table public.alert_history;
