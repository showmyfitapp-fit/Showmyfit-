-- Additive ops columns. Safe to re-run.
alter table public.orders add column if not exists commission numeric default 0;
alter table public.orders add column if not exists net_payable numeric default 0;
alter table public.orders add column if not exists refund_reason text;
alter table public.orders add column if not exists refund_status text;
alter table public.orders add column if not exists refunded_at timestamptz;

alter table public.products add column if not exists stock_updated_at timestamptz;
alter table public.products add column if not exists low_stock_threshold integer default 3;

alter table public.return_requests add column if not exists inspection_outcome text;
alter table public.return_requests add column if not exists quantity integer default 1;
alter table public.return_requests add column if not exists reviewed_by text;
alter table public.return_requests add column if not exists reviewed_at timestamptz;
alter table public.return_requests add column if not exists admin_note text;
alter table public.return_requests add column if not exists customer_message text;
alter table public.orders add column if not exists payment_fee numeric default 0;
alter table public.orders add column if not exists coupon_code text;

alter table public.support_tickets add column if not exists evidence jsonb default '[]'::jsonb;
alter table public.support_tickets add column if not exists sla_due_at timestamptz;
alter table public.support_tickets add column if not exists resolution_code text;

alter table public.delivery_partners add column if not exists last_lat numeric;
alter table public.delivery_partners add column if not exists last_lng numeric;
