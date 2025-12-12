BEGIN;
create extension if not exists pgcrypto;

create table if not exists public.plays (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  track_id text not null,
  track_name text not null,
  artist_name text not null,
  preview_url text,
  duration_ms integer,
  source text not null default 'spotify',
  played_at timestamptz not null default now()
);

create index if not exists plays_user_id_idx on public.plays(user_id);
create index if not exists plays_played_at_idx on public.plays(played_at desc);
create index if not exists plays_track_id_idx on public.plays(track_id);

alter table public.plays enable row level security;

drop policy if exists "plays_select_own" on public.plays;
create policy "plays_select_own" on public.plays for select using (auth.uid() = user_id);

drop policy if exists "plays_insert_own" on public.plays;
create policy "plays_insert_own" on public.plays for insert with check (auth.uid() = user_id);
COMMIT;