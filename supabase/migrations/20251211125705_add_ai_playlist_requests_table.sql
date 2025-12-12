BEGIN;
create extension if not exists pgcrypto;

create table if not exists public.ai_playlist_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists ai_playlist_requests_user_id_idx on public.ai_playlist_requests(user_id);
create index if not exists ai_playlist_requests_created_at_idx on public.ai_playlist_requests(created_at desc);

alter table public.ai_playlist_requests enable row level security;

drop policy if exists "ai_playlist_requests_select_own" on public.ai_playlist_requests;
create policy "ai_playlist_requests_select_own" on public.ai_playlist_requests for select using (auth.uid() = user_id);

drop policy if exists "ai_playlist_requests_insert_own" on public.ai_playlist_requests;
create policy "ai_playlist_requests_insert_own" on public.ai_playlist_requests for insert with check (auth.uid() = user_id);
COMMIT;