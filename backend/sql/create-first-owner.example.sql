-- 1. First create the user in Supabase Dashboard > Authentication > Users.
-- 2. Copy that user's UUID and replace the placeholder below.
-- 3. Run this statement in Supabase SQL Editor.

insert into public.admin_users (user_id, role, display_name, is_active)
values ('UUID_REAL_DEL_USUARIO', 'owner', 'Propietario', true)
on conflict (user_id) do update
set
  role = 'owner',
  is_active = true,
  display_name = excluded.display_name;
