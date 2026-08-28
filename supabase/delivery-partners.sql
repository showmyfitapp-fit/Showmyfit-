-- Paste into Supabase → SQL Editor → Run.
-- Creates delivery + notification tables (safe if they already exist).

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  type text,
  title text,
  message text,
  order_id text,
  order_number text,
  customer_name text,
  total numeric,
  items jsonb default '[]'::jsonb,
  read boolean default false,
  created_at timestamptz default now()
);

create index if not exists notifications_user_read_idx
  on public.notifications (user_id, read);

create table if not exists public.delivery_partners (
  id text primary key,
  auth_user_id text,
  name text,
  phone text,
  created_at timestamptz default now()
);

alter table public.delivery_partners
  add column if not exists auth_user_id text;

alter table public.delivery_partners
  add column if not exists is_online boolean not null default false;

alter table public.delivery_partners
  add column if not exists last_online_at timestamptz;

create index if not exists delivery_partners_is_online_idx
  on public.delivery_partners (is_online);

create table if not exists public.delivery_jobs (
  id uuid primary key default gen_random_uuid(),
  order_id text not null,
  order_number text,
  seller_id text,
  seller_name text,
  store_phone text,
  pick_address text,
  pick_location jsonb,
  drop_address text,
  drop_location jsonb,
  customer_name text,
  customer_phone text,
  items jsonb default '[]'::jsonb,
  total numeric default 0,
  pickup_otp text,
  pickup_verified boolean default false,
  delivery_partner_id text,
  delivery_partner_name text,
  status text not null default 'available',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.notifications enable row level security;
alter table public.delivery_partners enable row level security;
alter table public.delivery_jobs enable row level security;

drop policy if exists notifications_authenticated_all on public.notifications;
create policy notifications_authenticated_all on public.notifications
  for all to authenticated using (true) with check (true);

drop policy if exists delivery_partners_authenticated_all on public.delivery_partners;
create policy delivery_partners_authenticated_all on public.delivery_partners
  for all to authenticated using (true) with check (true);

drop policy if exists delivery_jobs_authenticated_all on public.delivery_jobs;
create policy delivery_jobs_authenticated_all on public.delivery_jobs
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.notifications to authenticated;
grant select, insert, update, delete on public.delivery_partners to authenticated;
grant select, insert, update, delete on public.delivery_jobs to authenticated;
