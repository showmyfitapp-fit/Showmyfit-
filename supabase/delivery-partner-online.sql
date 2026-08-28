-- Run in Supabase → SQL Editor → Run.
-- Adds Swiggy/Zomato-style online status for delivery partners.
-- Safe to re-run.

alter table public.delivery_partners
  add column if not exists is_online boolean not null default false;

alter table public.delivery_partners
  add column if not exists last_online_at timestamptz;

create index if not exists delivery_partners_is_online_idx
  on public.delivery_partners (is_online);
