-- Run this once in Supabase → SQL Editor → Run.
-- Creates orders, notifications, and delivery tables (no Firestore).

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null,
  order_group_id text not null,
  pickup_code text not null default '',
  pickup_otp text,
  pickup_verified boolean default false,
  pickup_verified_at timestamptz,
  delivery_otp text,
  delivery_otp_verified boolean default false,
  delivery_partner_id text,
  delivery_partner_name text,
  user_id text not null,
  customer_name text,
  customer_email text,
  customer_phone text,
  customer_address text,
  customer_location jsonb,
  seller_id text not null,
  seller_name text,
  store_address text,
  store_phone text,
  store_location jsonb,
  items jsonb not null default '[]'::jsonb,
  status text not null default 'placed',
  payment_status text not null default 'paid',
  payment_method text,
  payment_id text,
  razorpay_order_id text,
  subtotal numeric default 0,
  discount numeric default 0,
  shipping numeric default 0,
  total numeric default 0,
  distance_km numeric,
  eta_minutes numeric,
  pack_by_deadline timestamptz,
  placed_at timestamptz default now(),
  accepted_at timestamptz,
  packed_at timestamptz,
  out_for_delivery_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_seller_id_idx on public.orders (seller_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

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
  name text,
  phone text,
  created_at timestamptz default now()
);

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

create index if not exists delivery_jobs_order_id_idx on public.delivery_jobs (order_id);
create index if not exists delivery_jobs_status_idx on public.delivery_jobs (status);

alter table public.orders enable row level security;
alter table public.notifications enable row level security;
alter table public.delivery_partners enable row level security;
alter table public.delivery_jobs enable row level security;

drop policy if exists orders_authenticated_all on public.orders;
create policy orders_authenticated_all on public.orders
  for all to authenticated using (true) with check (true);

drop policy if exists notifications_authenticated_all on public.notifications;
create policy notifications_authenticated_all on public.notifications
  for all to authenticated using (true) with check (true);

drop policy if exists delivery_partners_authenticated_all on public.delivery_partners;
create policy delivery_partners_authenticated_all on public.delivery_partners
  for all to authenticated using (true) with check (true);

drop policy if exists delivery_jobs_authenticated_all on public.delivery_jobs;
create policy delivery_jobs_authenticated_all on public.delivery_jobs
  for all to authenticated using (true) with check (true);
