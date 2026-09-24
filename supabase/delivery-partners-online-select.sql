-- Allow checkout and pack flows to notify online riders in-app.
-- Safe to run even if orders-delivery-rls.sql was already applied.

drop policy if exists delivery_partners_select on public.delivery_partners;
create policy delivery_partners_select on public.delivery_partners
  for select to authenticated
  using (
    public.is_admin_user()
    or id = any(public.app_user_keys())
    or auth_user_id = any(public.app_user_keys())
    or is_online = true
  );
