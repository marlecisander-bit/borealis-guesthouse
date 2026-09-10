-- Run this file once in the Supabase SQL editor after database/schema.sql.
-- It extends the existing media table and creates the public image bucket.

ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS placement VARCHAR(50) NOT NULL DEFAULT 'gallery',
  ADD COLUMN IF NOT EXISTS related_slug VARCHAR(255),
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_media_public_placement
  ON public.media_assets (placement, related_slug, is_published, display_order);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-media',
  'public-media',
  TRUE,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published media" ON public.media_assets;
CREATE POLICY "Public can read published media"
  ON public.media_assets FOR SELECT
  USING (is_published = TRUE);

DROP POLICY IF EXISTS "Admins can insert media" ON public.media_assets;
CREATE POLICY "Admins can insert media"
  ON public.media_assets FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE lower(email) = lower(auth.jwt() ->> 'email')
      AND property_id = media_assets.property_id
  ));

DROP POLICY IF EXISTS "Admins can update media" ON public.media_assets;
CREATE POLICY "Admins can update media"
  ON public.media_assets FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE lower(email) = lower(auth.jwt() ->> 'email') AND property_id = media_assets.property_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE lower(email) = lower(auth.jwt() ->> 'email') AND property_id = media_assets.property_id));

DROP POLICY IF EXISTS "Admins can delete media" ON public.media_assets;
CREATE POLICY "Admins can delete media"
  ON public.media_assets FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE lower(email) = lower(auth.jwt() ->> 'email') AND property_id = media_assets.property_id));

DROP POLICY IF EXISTS "Admins can upload public media" ON storage.objects;
CREATE POLICY "Admins can upload public media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'public-media'
    AND EXISTS (SELECT 1 FROM public.admin_users WHERE lower(email) = lower(auth.jwt() ->> 'email'))
  );

DROP POLICY IF EXISTS "Admins can update public media" ON storage.objects;
CREATE POLICY "Admins can update public media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'public-media'
    AND EXISTS (SELECT 1 FROM public.admin_users WHERE lower(email) = lower(auth.jwt() ->> 'email'))
  );

DROP POLICY IF EXISTS "Admins can delete public media" ON storage.objects;
CREATE POLICY "Admins can delete public media"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'public-media'
    AND EXISTS (SELECT 1 FROM public.admin_users WHERE lower(email) = lower(auth.jwt() ->> 'email'))
  );
