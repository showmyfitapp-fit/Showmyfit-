-- Ensures delivery partner online-status columns exist.
-- Safe to re-run.

alter table public.delivery_partners
  add column if not exists auth_user_id text;

alter table public.delivery_partners
  add column if not exists is_online boolean not null default false;

alter table public.delivery_partners
  add column if not exists last_online_at timestamptz;

create index if not exists delivery_partners_is_online_idx
  on public.delivery_partners (is_online);
