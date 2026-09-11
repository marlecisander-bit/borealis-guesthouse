-- Keep every administrator inside their own property's storage prefix.
-- Object names are written as: <property_id>/<optional folders>/<uuid>.<ext>
DROP POLICY IF EXISTS "Admins can upload public media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update public media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete public media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload property media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update property media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete property media" ON storage.objects;

CREATE POLICY "Admins can upload property media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'public-media'
    AND EXISTS (
      SELECT 1 FROM public.admin_profiles profile
      WHERE profile.user_id = auth.uid()
        AND profile.is_active
        AND profile.property_id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Admins can update property media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'public-media'
    AND EXISTS (
      SELECT 1 FROM public.admin_profiles profile
      WHERE profile.user_id = auth.uid()
        AND profile.is_active
        AND profile.property_id::text = (storage.foldername(name))[1]
    )
  )
  WITH CHECK (
    bucket_id = 'public-media'
    AND EXISTS (
      SELECT 1 FROM public.admin_profiles profile
      WHERE profile.user_id = auth.uid()
        AND profile.is_active
        AND profile.property_id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Admins can delete property media"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'public-media'
    AND EXISTS (
      SELECT 1 FROM public.admin_profiles profile
      WHERE profile.user_id = auth.uid()
        AND profile.is_active
        AND profile.property_id::text = (storage.foldername(name))[1]
    )
  );
