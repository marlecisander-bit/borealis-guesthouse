-- Borealis CMS core normalization.
--
-- This migration deliberately reuses the existing CMS tables. It makes the
-- current homepage implementation consistently multi-property, aligns its
-- authorization with admin_profiles, and enforces same-property media links.

-- ---------------------------------------------------------------------------
-- Canonical authorization
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.can_manage_property(
  target_property UUID,
  allowed_roles public.admin_role[] DEFAULT ARRAY['owner','manager','editor','staff']::public.admin_role[]
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_profiles profile
    WHERE profile.user_id = auth.uid()
      AND profile.property_id = target_property
      AND profile.is_active = TRUE
      AND profile.role = ANY(allowed_roles)
  );
$$;

REVOKE ALL ON FUNCTION public.can_manage_property(UUID, public.admin_role[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_property(UUID, public.admin_role[]) TO authenticated;

-- Retain the existing function name for compatibility, but remove its legacy
-- dependency on email-based admin_users records.
CREATE OR REPLACE FUNCTION public.can_manage_homepage(target_property UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.can_manage_property(
    target_property,
    ARRAY['owner','manager','editor']::public.admin_role[]
  );
$$;

REVOKE ALL ON FUNCTION public.can_manage_homepage(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_homepage(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Homepage structure and lifecycle
-- ---------------------------------------------------------------------------

-- is_visible is the existing enabled flag. Keep one source of truth rather
-- than adding a second boolean with identical meaning.
ALTER TABLE public.homepage_sections
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

ALTER TABLE public.homepage_sections
  DROP CONSTRAINT IF EXISTS homepage_sections_section_key_check;

-- Application keys remain stable. In the editorial UI, property_highlights is
-- labelled "Highlights" and featured_experiences is labelled "Experiences".
ALTER TABLE public.homepage_sections
  ADD CONSTRAINT homepage_sections_section_key_check CHECK (
    section_key IN (
      'hero',
      'property_highlights',
      'intro',
      'featured_rooms',
      'featured_experiences',
      'explore_koman',
      'transfers',
      'gallery',
      'reviews',
      'location',
      'final_cta'
    )
  );

CREATE INDEX IF NOT EXISTS homepage_sections_public_lookup_idx
  ON public.homepage_sections(property_id, status, is_visible, sort_order)
  WHERE status = 'published' AND is_visible = TRUE;

ALTER TABLE public.homepage_highlights
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

ALTER TABLE public.seo_metadata
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

ALTER TABLE public.translations
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Existing published records predate lifecycle timestamps.
UPDATE public.homepage_sections SET published_at = COALESCE(published_at, updated_at, created_at) WHERE status = 'published';
UPDATE public.homepage_highlights SET published_at = COALESCE(published_at, updated_at, created_at) WHERE status = 'published';
UPDATE public.media_assets SET published_at = COALESCE(published_at, updated_at, created_at) WHERE status = 'published';
UPDATE public.site_settings SET published_at = COALESCE(published_at, updated_at, created_at) WHERE status = 'published';
UPDATE public.seo_metadata SET published_at = COALESCE(published_at, updated_at, created_at) WHERE status = 'published';
UPDATE public.translations SET published_at = COALESCE(published_at, updated_at, created_at) WHERE status = 'published';

DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'homepage_sections',
    'homepage_highlights',
    'media_assets',
    'site_settings',
    'seo_metadata',
    'translations'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS content_lifecycle_timestamps ON public.%I', table_name);
    EXECUTE format(
      'CREATE TRIGGER content_lifecycle_timestamps BEFORE INSERT OR UPDATE OF status ON public.%I FOR EACH ROW EXECUTE FUNCTION public.apply_content_lifecycle_timestamps()',
      table_name
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Same-property media integrity
-- ---------------------------------------------------------------------------

-- These unique indexes provide composite FK targets without replacing the
-- existing UUID primary keys.
CREATE UNIQUE INDEX IF NOT EXISTS media_assets_property_id_id_uidx
  ON public.media_assets(property_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS homepage_sections_property_id_id_uidx
  ON public.homepage_sections(property_id, id);

ALTER TABLE public.homepage_sections
  DROP CONSTRAINT IF EXISTS homepage_sections_property_media_fk;
ALTER TABLE public.homepage_sections
  ADD CONSTRAINT homepage_sections_property_media_fk
  FOREIGN KEY (property_id, background_media_id)
  REFERENCES public.media_assets(property_id, id)
  ON DELETE SET NULL (background_media_id)
  NOT VALID;

ALTER TABLE public.site_settings
  DROP CONSTRAINT IF EXISTS site_settings_property_media_fk;
ALTER TABLE public.site_settings
  ADD CONSTRAINT site_settings_property_media_fk
  FOREIGN KEY (property_id, media_asset_id)
  REFERENCES public.media_assets(property_id, id)
  ON DELETE SET NULL (media_asset_id)
  NOT VALID;

ALTER TABLE public.seo_metadata
  DROP CONSTRAINT IF EXISTS seo_metadata_property_og_media_fk;
ALTER TABLE public.seo_metadata
  ADD CONSTRAINT seo_metadata_property_og_media_fk
  FOREIGN KEY (property_id, og_image_id)
  REFERENCES public.media_assets(property_id, id)
  ON DELETE SET NULL (og_image_id)
  NOT VALID;

ALTER TABLE public.homepage_sections VALIDATE CONSTRAINT homepage_sections_property_media_fk;
ALTER TABLE public.site_settings VALIDATE CONSTRAINT site_settings_property_media_fk;
ALTER TABLE public.seo_metadata VALIDATE CONSTRAINT seo_metadata_property_og_media_fk;

ALTER TABLE public.homepage_section_links
  DROP CONSTRAINT IF EXISTS homepage_section_links_property_section_fk;
ALTER TABLE public.homepage_section_links
  ADD CONSTRAINT homepage_section_links_property_section_fk
  FOREIGN KEY (property_id, section_id)
  REFERENCES public.homepage_sections(property_id, id)
  ON DELETE CASCADE
  NOT VALID;
ALTER TABLE public.homepage_section_links
  VALIDATE CONSTRAINT homepage_section_links_property_section_fk;

-- ---------------------------------------------------------------------------
-- Core RLS policies
-- ---------------------------------------------------------------------------

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_section_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Replace the homepage feature migration's legacy policies.
DROP POLICY IF EXISTS homepage_sections_cms_read ON public.homepage_sections;
DROP POLICY IF EXISTS homepage_sections_cms_manage ON public.homepage_sections;
DROP POLICY IF EXISTS homepage_highlights_cms_read ON public.homepage_highlights;
DROP POLICY IF EXISTS homepage_highlights_cms_manage ON public.homepage_highlights;
DROP POLICY IF EXISTS reviews_cms_read ON public.reviews;
DROP POLICY IF EXISTS reviews_cms_manage ON public.reviews;
DROP POLICY IF EXISTS homepage_section_links_cms_read ON public.homepage_section_links;
DROP POLICY IF EXISTS homepage_section_links_cms_manage ON public.homepage_section_links;
DROP POLICY IF EXISTS homepage_drafts_cms_manage ON public.homepage_drafts;

DROP POLICY IF EXISTS homepage_sections_public_read ON public.homepage_sections;
CREATE POLICY homepage_sections_public_read ON public.homepage_sections
  FOR SELECT TO anon, authenticated
  USING (status = 'published' AND is_visible = TRUE);
DROP POLICY IF EXISTS homepage_sections_admin_manage ON public.homepage_sections;
CREATE POLICY homepage_sections_admin_manage ON public.homepage_sections
  FOR ALL TO authenticated
  USING (public.can_manage_property(property_id, ARRAY['owner','manager','editor']::public.admin_role[]))
  WITH CHECK (public.can_manage_property(property_id, ARRAY['owner','manager','editor']::public.admin_role[]));

DROP POLICY IF EXISTS homepage_highlights_public_read ON public.homepage_highlights;
CREATE POLICY homepage_highlights_public_read ON public.homepage_highlights
  FOR SELECT TO anon, authenticated
  USING (status = 'published' AND is_visible = TRUE);
DROP POLICY IF EXISTS homepage_highlights_admin_manage ON public.homepage_highlights;
CREATE POLICY homepage_highlights_admin_manage ON public.homepage_highlights
  FOR ALL TO authenticated
  USING (public.can_manage_property(property_id, ARRAY['owner','manager','editor']::public.admin_role[]))
  WITH CHECK (public.can_manage_property(property_id, ARRAY['owner','manager','editor']::public.admin_role[]));

DROP POLICY IF EXISTS homepage_section_links_public_read ON public.homepage_section_links;
CREATE POLICY homepage_section_links_public_read ON public.homepage_section_links
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.homepage_sections section
      WHERE section.id = section_id
        AND section.property_id = homepage_section_links.property_id
        AND section.status = 'published'
        AND section.is_visible = TRUE
    )
  );
DROP POLICY IF EXISTS homepage_section_links_admin_manage ON public.homepage_section_links;
CREATE POLICY homepage_section_links_admin_manage ON public.homepage_section_links
  FOR ALL TO authenticated
  USING (public.can_manage_property(property_id, ARRAY['owner','manager','editor']::public.admin_role[]))
  WITH CHECK (public.can_manage_property(property_id, ARRAY['owner','manager','editor']::public.admin_role[]));

-- Draft payloads have no public policy and therefore remain private.
DROP POLICY IF EXISTS homepage_drafts_admin_manage ON public.homepage_drafts;
CREATE POLICY homepage_drafts_admin_manage ON public.homepage_drafts
  FOR ALL TO authenticated
  USING (public.can_manage_property(property_id, ARRAY['owner','manager','editor']::public.admin_role[]))
  WITH CHECK (public.can_manage_property(property_id, ARRAY['owner','manager','editor']::public.admin_role[]));

-- Recreate explicit public policies for the remaining core tables. Existing
-- canonical admin policies from migration 001 remain in force.
DROP POLICY IF EXISTS media_assets_public_read ON public.media_assets;
DROP POLICY IF EXISTS "Public can read published media" ON public.media_assets;
CREATE POLICY media_assets_public_read ON public.media_assets
  FOR SELECT TO anon, authenticated
  USING (status = 'published' AND is_visible = TRUE);

DROP POLICY IF EXISTS site_settings_public_read ON public.site_settings;
CREATE POLICY site_settings_public_read ON public.site_settings
  FOR SELECT TO anon, authenticated
  USING (status = 'published' AND is_public = TRUE);

DROP POLICY IF EXISTS seo_metadata_public_read ON public.seo_metadata;
CREATE POLICY seo_metadata_public_read ON public.seo_metadata
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS languages_public_read ON public.languages;
CREATE POLICY languages_public_read ON public.languages
  FOR SELECT TO anon, authenticated
  USING (enabled = TRUE);

DROP POLICY IF EXISTS translations_public_read ON public.translations;
CREATE POLICY translations_public_read ON public.translations
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

-- Operational/private tables intentionally receive no anonymous policy here.

-- ---------------------------------------------------------------------------
-- Migration assertions
-- ---------------------------------------------------------------------------

DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'properties',
    'admin_profiles',
    'media_assets',
    'site_settings',
    'homepage_sections',
    'homepage_highlights',
    'homepage_section_links',
    'homepage_drafts',
    'seo_metadata',
    'languages',
    'translations'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_class relation
      JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
      WHERE namespace.nspname = 'public'
        AND relation.relname = table_name
        AND relation.relrowsecurity = TRUE
    ) THEN
      RAISE EXCEPTION 'Expected RLS to be enabled on public.%', table_name;
    END IF;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'homepage_sections_property_media_fk'
      AND convalidated = TRUE
  ) THEN
    RAISE EXCEPTION 'Homepage media property constraint was not validated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'homepage_section_links_property_section_fk'
      AND convalidated = TRUE
  ) THEN
    RAISE EXCEPTION 'Homepage section-link property constraint was not validated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'homepage_sections'
      AND indexdef ILIKE '%(property_id, section_key)%'
  ) THEN
    RAISE EXCEPTION 'Homepage property/section unique index is missing';
  END IF;
END $$;
