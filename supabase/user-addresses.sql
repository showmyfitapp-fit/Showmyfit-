-- Run this once in Supabase → SQL Editor → Run.
-- Per-user saved delivery addresses for the location picker.

create table if not exists public.user_addresses (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users (id) on delete cascade,
  user_id text not null,
  label text not null default 'House',
  line1 text not null default '',
  street text not null default '',
  save_as text not null default '',
  area text not null default '',
  city text not null default '',
  receiver_name text not null default '',
  receiver_phone text not null default '',
  instructions text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists user_addresses_auth_user_id_idx
  on public.user_addresses (auth_user_id, created_at desc);

create index if not exists user_addresses_user_id_idx
  on public.user_addresses (user_id);

alter table public.user_addresses enable row level security;

drop policy if exists user_addresses_select on public.user_addresses;
drop policy if exists user_addresses_insert on public.user_addresses;
drop policy if exists user_addresses_update on public.user_addresses;
drop policy if exists user_addresses_delete on public.user_addresses;

create policy user_addresses_select
  on public.user_addresses
  for select
  using (auth.uid() = auth_user_id);

create policy user_addresses_insert
  on public.user_addresses
  for insert
  with check (auth.uid() = auth_user_id);

create policy user_addresses_update
  on public.user_addresses
  for update
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

create policy user_addresses_delete
  on public.user_addresses
  for delete
  using (auth.uid() = auth_user_id);

grant select, insert, update, delete on public.user_addresses to authenticated;
