-- Run this in Supabase → SQL Editor if user_addresses already exists.
alter table public.user_addresses
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists map_address text;
