-- HuCo — Supabase schema
-- Paste this entire file into Supabase → SQL Editor → New query → Run.
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE throughout).

-- ─── Profiles ──────────────────────────────────────────────────────────────────────────────
-- Extends auth.users; one row per registered user.
create table if not exists public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  name        text        not null,
  username    text unique not null,
  email       text        not null,
  avatar      text,
  push_token  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists profiles_username_idx on public.profiles (username);

-- ─── User data ────────────────────────────────────────────────────────────────────────
-- All app state stored as JSONB columns — one row per user.
-- This matches AppContext.tsx which upserts the full state blob on every change.
create table if not exists public.user_data (
  user_id     uuid references auth.users on delete cascade primary key,
  library     jsonb       default '[]'::jsonb,
  watchlist   jsonb       default '[]'::jsonb,
  inbox       jsonb       default '[]'::jsonb,
  sent_recs   jsonb       default '[]'::jsonb,
  contacts    jsonb       default '[]'::jsonb,
  circles     jsonb       default '[]'::jsonb,
  updated_at  timestamptz default now()
);

-- ─── Row Level Security ────────────────────────────────────────────────────────────────────
alt table public.profiles  enable row level security;
alter table public.user_data enable row level security;

-- Each user can only read and write their own rows.
create policy "profiles: own row"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "user_data: own row"
  on public.user_data for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Auto-updated timestamps ──────────────────────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger user_data_updated_at
  before update on public.user_data
  for each row execute function public.handle_updated_at();

-- ─── Auto-provision user_data on first profile insert ────────────────────────────────────────────
-- Creates an empty user_data row as soon as a profile is inserted,
-- so the first AppContext sync can use UPDATE instead of relying solely on UPSERT.
create or replace function public.handle_new_profile()
returns trigger language plpgsql as $$
begin
  insert into public.user_data (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_profile_created on public.profiles;
create trigger on_profile_created
  after insert on public.profiles
  for each row execute function public.handle_new_profile();
