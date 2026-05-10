-- HuCo — Supabase schema
-- Run this in your Supabase SQL Editor after creating your project.

-- Profiles extend Supabase auth.users
create table if not exists public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  name        text not null,
  username    text unique not null,
  email       text not null,
  avatar      text,
  push_token  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Store all per-user app state in a single JSON row for simplicity
create table if not exists public.user_data (
  user_id     uuid references auth.users on delete cascade primary key,
  library     jsonb default '[]'::jsonb,
  watchlist   jsonb default '[]'::jsonb,
  inbox       jsonb default '[]'::jsonb,
  sent_recs   jsonb default '[]'::jsonb,
  contacts    jsonb default '[]'::jsonb,
  circles     jsonb default '[]'::jsonb,
  updated_at  timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles  enable row level security;
alter table public.user_data enable row level security;

-- Policies: each user can only read/write their own data
create policy "profiles: own row"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "user_data: own row"
  on public.user_data for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-update updated_at
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
