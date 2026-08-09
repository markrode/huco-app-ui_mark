-- HuCo -- Supabase schema
-- Paste this entire file into Supabase -> SQL Editor -> New query -> Run.
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE throughout).
--
-- MIGRATION NOTE: if you deployed a version where recommendations.id was
-- TEXT, drop that table first (drop table public.recommendations;) --
-- create table if not exists will NOT alter an existing table.

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
-- id is generated server-side (never trust client-chosen keys).
-- sender_* display fields are stamped server-side by the stamp_sender trigger.
create table if not exists public.recommendations (
  id              uuid          primary key default gen_random_uuid(),
  sender_id       uuid          references auth.users on delete cascade not null,
  recipient_id    uuid          references auth.users on delete cascade not null,
  movie           jsonb         not null,
  user_rating     jsonb         not null,
  sender_name     text          not null default '',
  sender_username text          not null default '',
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

-- Contact lookup: expose ONLY safe columns through a view.
-- RLS is row-level, not column-level -- a broad SELECT policy on profiles
-- would leak email and push_token to every authenticated user.
drop policy if exists "profiles: search" on public.profiles;
drop view if exists public.profiles_public;

-- security_definer view: reads bypass profiles RLS but only these 4 columns exist.
create view public.profiles_public as
  select id, name, username, avatar from public.profiles;

revoke all    on public.profiles_public from anon;
grant  select on public.profiles_public to authenticated;

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

-- Only the authenticated sender can insert (and never to themselves).
drop policy if exists "recommendations: sender insert" on public.recommendations;
create policy "recommendations: sender insert"
  on public.recommendations for insert
  with check (auth.uid() = sender_id and recipient_id <> sender_id);

-- Stamp sender identity server-side: display fields can never be spoofed
-- by a malicious client (they are overwritten from the sender's profile).
create or replace function public.stamp_sender()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select p.name, p.username, coalesce(p.avatar, '')
    into new.sender_name, new.sender_username, new.sender_avatar
  from public.profiles p where p.id = new.sender_id;
  if new.sender_name is null then
    raise exception 'sender has no profile';
  end if;
  return new;
end;
$$;

drop trigger if exists recs_stamp_sender on public.recommendations;
create trigger recs_stamp_sender
  before insert on public.recommendations
  for each row execute function public.stamp_sender();

-- Basic anti-spam: cap outgoing recommendations per sender per hour.
create or replace function public.check_rec_rate_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.recommendations
      where sender_id = new.sender_id
        and sent_at > now() - interval '1 hour') >= 100 then
    raise exception 'rate limit exceeded';
  end if;
  return new;
end;
$$;

drop trigger if exists recs_rate_limit on public.recommendations;
create trigger recs_rate_limit
  before insert on public.recommendations
  for each row execute function public.check_rec_rate_limit();

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
