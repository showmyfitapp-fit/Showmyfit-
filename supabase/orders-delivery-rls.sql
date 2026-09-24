-- Run in Supabase → SQL Editor after orders-delivery.sql
-- Tightens RLS and enables realtime for seller / rider workflows.

alter table public.orders add column if not exists cancelled_at timestamptz;

create or replace function public.app_user_keys()
returns text[]
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  keys text[] := array[auth.uid()::text];
  email text := lower(coalesce(auth.jwt()->>'email', ''));
begin
  if email <> '' then
    keys := keys || email;
  end if;

  begin
    keys := keys || array(
      select distinct val
      from unnest(array[
        (select p.id::text from public.profiles p
          where p.id::text = auth.uid()::text or p.auth_user_id::text = auth.uid()::text
          limit 1),
        (select p.auth_user_id::text from public.profiles p
          where p.id::text = auth.uid()::text or p.auth_user_id::text = auth.uid()::text
          limit 1)
      ]) as val
      where val is not null
    );
  exception
    when undefined_table then
      null;
  end;

  return array(select distinct unnest(keys) as key where key is not null and key <> '');
end;
$$;

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
  );
$$;

create or replace function public.is_delivery_partner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.delivery_partners dp
    where dp.id = any(public.app_user_keys())
       or dp.auth_user_id = any(public.app_user_keys())
  );
$$;

grant execute on function public.app_user_keys() to authenticated;
grant execute on function public.is_admin_user() to authenticated;
grant execute on function public.is_delivery_partner() to authenticated;

drop policy if exists orders_authenticated_all on public.orders;
drop policy if exists orders_select_related on public.orders;
drop policy if exists orders_insert_customer on public.orders;
drop policy if exists orders_update_related on public.orders;

create policy orders_select_related on public.orders
  for select to authenticated
  using (
    public.is_admin_user()
    or user_id = any(public.app_user_keys())
    or seller_id = any(public.app_user_keys())
    or delivery_partner_id = any(public.app_user_keys())
    or public.is_delivery_partner()
  );

create policy orders_insert_customer on public.orders
  for insert to authenticated
  with check (user_id = any(public.app_user_keys()) or public.is_admin_user());

create policy orders_update_related on public.orders
  for update to authenticated
  using (
    public.is_admin_user()
    or seller_id = any(public.app_user_keys())
    or delivery_partner_id = any(public.app_user_keys())
    or public.is_delivery_partner()
  )
  with check (
    public.is_admin_user()
    or seller_id = any(public.app_user_keys())
    or delivery_partner_id = any(public.app_user_keys())
    or public.is_delivery_partner()
  );

drop policy if exists notifications_authenticated_all on public.notifications;
drop policy if exists notifications_select_own on public.notifications;
drop policy if exists notifications_insert_authenticated on public.notifications;
drop policy if exists notifications_update_own on public.notifications;

create policy notifications_select_own on public.notifications
  for select to authenticated
  using (user_id = any(public.app_user_keys()) or public.is_admin_user());

create policy notifications_insert_authenticated on public.notifications
  for insert to authenticated
  with check (true);

create policy notifications_update_own on public.notifications
  for update to authenticated
  using (user_id = any(public.app_user_keys()) or public.is_admin_user())
  with check (user_id = any(public.app_user_keys()) or public.is_admin_user());

drop policy if exists delivery_partners_authenticated_all on public.delivery_partners;
drop policy if exists delivery_partners_select on public.delivery_partners;
drop policy if exists delivery_partners_insert_admin on public.delivery_partners;
drop policy if exists delivery_partners_update_own on public.delivery_partners;

create policy delivery_partners_select on public.delivery_partners
  for select to authenticated
  using (
    public.is_admin_user()
    or id = any(public.app_user_keys())
    or auth_user_id = any(public.app_user_keys())
    or is_online = true
  );

create policy delivery_partners_insert_admin on public.delivery_partners
  for insert to authenticated
  with check (public.is_admin_user());

create policy delivery_partners_update_own on public.delivery_partners
  for update to authenticated
  using (
    public.is_admin_user()
    or id = any(public.app_user_keys())
    or auth_user_id = any(public.app_user_keys())
  )
  with check (
    public.is_admin_user()
    or id = any(public.app_user_keys())
    or auth_user_id = any(public.app_user_keys())
  );

drop policy if exists delivery_jobs_authenticated_all on public.delivery_jobs;
drop policy if exists delivery_jobs_select on public.delivery_jobs;
drop policy if exists delivery_jobs_insert on public.delivery_jobs;
drop policy if exists delivery_jobs_update on public.delivery_jobs;

create policy delivery_jobs_select on public.delivery_jobs
  for select to authenticated
  using (
    public.is_admin_user()
    or seller_id = any(public.app_user_keys())
    or delivery_partner_id = any(public.app_user_keys())
    or (status = 'available' and public.is_delivery_partner())
  );

create policy delivery_jobs_insert on public.delivery_jobs
  for insert to authenticated
  with check (
    public.is_admin_user()
    or seller_id = any(public.app_user_keys())
  );

create policy delivery_jobs_update on public.delivery_jobs
  for update to authenticated
  using (
    public.is_admin_user()
    or seller_id = any(public.app_user_keys())
    or delivery_partner_id = any(public.app_user_keys())
    or (status = 'available' and public.is_delivery_partner())
  )
  with check (
    public.is_admin_user()
    or seller_id = any(public.app_user_keys())
    or delivery_partner_id = any(public.app_user_keys())
    or public.is_delivery_partner()
  );

do $$
begin
  alter publication supabase_realtime add table public.orders;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.delivery_jobs;
exception
  when duplicate_object then null;
end $$;
