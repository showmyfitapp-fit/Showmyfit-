-- Add multiple delivery partners by login email.
-- Replace the emails in the list, then run in Supabase → SQL Editor.
-- Users must already exist in public.profiles.

insert into public.delivery_partners (id, auth_user_id, name, phone)
select
  p.id::text,
  coalesce(p.auth_user_id::text, p.id::text),
  coalesce(p.display_name, p.email, 'Delivery partner'),
  coalesce(p.phone, '')
from public.profiles p
where lower(p.email) in (
  lower('jsakhil70@gmail.com'),
  lower('gauthamshowmyfit@gmail.com'),
  lower('gipsonshowmyfit@gmail.com'),
)
on conflict (id) do update
  set auth_user_id = excluded.auth_user_id,
      name = excluded.name,
      phone = excluded.phone;
