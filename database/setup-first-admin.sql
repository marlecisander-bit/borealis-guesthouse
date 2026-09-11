-- ONE-TIME ADMIN BOOTSTRAP
-- 1. In Supabase Dashboard, open Authentication > Users > Add user.
-- 2. Create the user with your real email and a strong password.
-- 3. Replace the email below with that exact email, then run this script once.
-- This script does not create or store passwords.

DO $$
DECLARE
  admin_email TEXT := 'marleci.sander@gmail.com';
  target_property_id UUID;
  auth_user_id UUID;
BEGIN
  IF admin_email = 'REPLACE_WITH_YOUR_EMAIL' THEN
    RAISE EXCEPTION 'Replace REPLACE_WITH_YOUR_EMAIL before running this script.';
  END IF;

  SELECT id INTO auth_user_id
  FROM auth.users
  WHERE lower(email) = lower(admin_email)
  LIMIT 1;

  IF auth_user_id IS NULL THEN
    RAISE EXCEPTION 'No Supabase Authentication user exists for %. Create it under Authentication > Users first.', admin_email;
  END IF;

  SELECT id INTO target_property_id
  FROM public.properties
  ORDER BY created_at
  LIMIT 1;

  IF target_property_id IS NULL THEN
    -- The bootstrap creates the live Borealis property. Leaving it on the
    -- schema's generic `draft` default makes every anonymous catalog and
    -- booking query look unconfigured even though Admin works correctly.
    INSERT INTO public.properties (name, location, currency, status)
    VALUES ('Borealis Guest House', 'Koman', 'EUR', 'published')
    RETURNING id INTO target_property_id;
  END IF;

  INSERT INTO public.admin_users (email, role, property_id)
  VALUES (lower(admin_email), 'owner', target_property_id)
  ON CONFLICT (email) DO UPDATE
  SET role = 'owner', property_id = EXCLUDED.property_id, updated_at = NOW();

  IF to_regclass('public.admin_profiles') IS NOT NULL THEN
    EXECUTE
      'INSERT INTO public.admin_profiles (user_id, property_id, role, display_name)
       VALUES ($1, $2, ''owner'', $3)
       ON CONFLICT (user_id, property_id) DO UPDATE SET role = ''owner'', is_active = TRUE, updated_at = NOW()'
    USING auth_user_id, target_property_id, split_part(admin_email, '@', 1);
  END IF;
END $$;

-- The route guard uses the signed-in user's JWT, so it must be able to read
-- its own legacy membership row. No user can read another admin's membership.
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_users_self_read" ON public.admin_users;
CREATE POLICY "admin_users_self_read"
  ON public.admin_users FOR SELECT TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email'));
