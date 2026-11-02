-- Optional additive inventory ledger columns. Safe to re-run.
alter table public.products add column if not exists stock_reserved integer default 0;
alter table public.products add column if not exists stock_sold integer default 0;
alter table public.products add column if not exists stock_damaged integer default 0;
alter table public.products add column if not exists stock_returned integer default 0;
