-- Additive launch tables/columns. Safe to re-run.
-- Does not change existing order/delivery flows.

alter table public.orders add column if not exists cod_collected boolean default false;
alter table public.orders add column if not exists cod_collected_at timestamptz;
alter table public.orders add column if not exists refund_id text;
alter table public.orders add column if not exists refund_amount numeric;
alter table public.orders add column if not exists cancel_reason text;
alter table public.orders add column if not exists payment_attempt_id text;
alter table public.orders add column if not exists tax numeric default 0;
alter table public.orders add column if not exists fees numeric default 0;

create index if not exists orders_payment_id_seller_idx
  on public.orders (payment_id, seller_id);

alter table public.delivery_partners
  add column if not exists availability_status text default 'offline';

alter table public.delivery_jobs add column if not exists pod_photo_url text;
alter table public.delivery_jobs add column if not exists pod_lat numeric;
alter table public.delivery_jobs add column if not exists pod_lng numeric;
alter table public.delivery_jobs add column if not exists fail_reason text;

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id text not null,
  actor_id text,
  actor_role text,
  source text,
  from_status text,
  to_status text,
  reason text,
  created_at timestamptz default now()
);

create index if not exists order_events_order_id_idx on public.order_events (order_id);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text default 'razorpay',
  event_type text,
  payment_id text,
  razorpay_order_id text,
  amount numeric,
  payload jsonb,
  created_at timestamptz default now()
);

create index if not exists payment_events_payment_id_idx on public.payment_events (payment_id);

create table if not exists public.return_requests (
  id uuid primary key default gen_random_uuid(),
  order_id text not null,
  order_number text,
  product_id text,
  product_name text,
  user_id text not null,
  seller_id text,
  status text not null default 'requested',
  answers jsonb not null default '{}'::jsonb,
  images jsonb not null default '[]'::jsonb,
  rejection_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists return_requests_order_id_idx on public.return_requests (order_id);
create index if not exists return_requests_user_id_idx on public.return_requests (user_id);

alter table public.products add column if not exists stock_reserved integer default 0;
alter table public.products add column if not exists stock_sold integer default 0;
alter table public.products add column if not exists stock_damaged integer default 0;
alter table public.products add column if not exists stock_returned integer default 0;

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  order_id text,
  user_id text,
  category text,
  message text,
  status text not null default 'open',
  created_at timestamptz default now()
);

alter table public.order_events enable row level security;
alter table public.payment_events enable row level security;
alter table public.return_requests enable row level security;
alter table public.support_tickets enable row level security;

drop policy if exists order_events_authenticated_all on public.order_events;
create policy order_events_authenticated_all on public.order_events
  for all to authenticated using (true) with check (true);

drop policy if exists payment_events_authenticated_all on public.payment_events;
create policy payment_events_authenticated_all on public.payment_events
  for all to authenticated using (true) with check (true);

drop policy if exists return_requests_authenticated_all on public.return_requests;
create policy return_requests_authenticated_all on public.return_requests
  for all to authenticated using (true) with check (true);

drop policy if exists support_tickets_authenticated_all on public.support_tickets;
create policy support_tickets_authenticated_all on public.support_tickets
  for all to authenticated using (true) with check (true);
