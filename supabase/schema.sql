-- HuCo -- Supabase schema
-- Paste this entire file into Supabase -> SQL Editor -> New query -> Run.
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE throughout).

-- Profiles
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

-- User data
-- All app state stored as JSONB columns -- one row per user.
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

-- Cross-user recommendations
-- Inserted by the sender; read by the recipient via Realtime + hydration.
create table if not exists public.recommendations (
  id              text          primary key,
  sender_id       uuid          references auth.users on delete cascade not null,
  recipient_id    uuid          references auth.users on delete cascade not null,
  movie           jsonb         not null,
  user_rating     jsonb         not null,
  sender_name     text          not null,
  sender_username text          not null,
  sender_avatar   text          not null default '',
  sent_at         timestamptz   default now()
);

create index if not exists recs_recipient_idx on public.recommendations (recipient_id, sent_at desc);
create index if not exists recs_sender_idx    on public.recommendations (sender_id);

-- Row Level Security
alter table public.profiles        enable row level security;
alter table public.user_data       enable row level security;
alter table public.recommendations enable row level security;

-- Each user can only read and write their own rows.
drop policy if exists "profiles: own row" on public.profiles;
create policy "profiles: own row"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Authenticated users can search all profiles by username (contact lookup).
drop policy if exists "profiles: search" on public.profiles;
create policy "profiles: search"
  on public.profiles for select
  using (auth.role() = 'authenticated');

drop policy if exists "user_data: own row" on public.user_data;
create policy "user_data: own row"
  on public.user_data for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Sender and recipient can each see their own recommendation rows.
drop policy if exists "recommendations: own rows" on public.recommendations;
create policy "recommendations: own rows"
  on public.recommendations for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

-- Only the authenticated sender can insert.
drop policy if exists "recommendations: sender insert" on public.recommendations;
create policy "recommendations: sender insert"
  on public.recommendations for insert
  with check (auth.uid() = sender_id);

-- Auto-updated timestamps
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists user_data_updated_at on public.user_data;
create trigger user_data_updated_at
  before update on public.user_data
  for each row execute function public.handle_updated_at();

-- Auto-provision user_data on first profile insert
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
