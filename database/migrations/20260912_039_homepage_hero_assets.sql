-- Dedicated Hero records; normal media_assets and its upload rules are untouched.
CREATE TABLE IF NOT EXISTS public.homepage_hero_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('desktop_hero', 'mobile_hero')),
  original_path TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 25165824),
  width INTEGER,
  height INTEGER,
  variants JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (original_path LIKE property_id::text || '/hero/%/original/%')
);
CREATE INDEX IF NOT EXISTS homepage_hero_assets_property_idx ON public.homepage_hero_assets(property_id, kind);
ALTER TABLE public.homepage_hero_assets ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.homepage_hero_assets TO anon;
GRANT SELECT, INSERT, UPDATE ON public.homepage_hero_assets TO authenticated;
DROP POLICY IF EXISTS hero_assets_public_read ON public.homepage_hero_assets;
CREATE POLICY hero_assets_public_read ON public.homepage_hero_assets FOR SELECT TO anon, authenticated USING (status = 'ready');
DROP POLICY IF EXISTS hero_assets_admin_read ON public.homepage_hero_assets;
CREATE POLICY hero_assets_admin_read ON public.homepage_hero_assets FOR SELECT TO authenticated USING (public.can_manage_homepage(property_id));
DROP POLICY IF EXISTS hero_assets_admin_insert ON public.homepage_hero_assets;
CREATE POLICY hero_assets_admin_insert ON public.homepage_hero_assets FOR INSERT TO authenticated WITH CHECK (public.can_manage_homepage(property_id));
DROP POLICY IF EXISTS hero_assets_admin_update ON public.homepage_hero_assets;
CREATE POLICY hero_assets_admin_update ON public.homepage_hero_assets FOR UPDATE TO authenticated USING (public.can_manage_homepage(property_id)) WITH CHECK (public.can_manage_homepage(property_id));
-- Existing property-prefixed public-media storage policies already cover these paths.
-- Do not change bucket limits or normal media records. Originals are never deleted
-- or overwritten by the Hero upload/remove workflow.
