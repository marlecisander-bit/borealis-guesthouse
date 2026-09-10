-- Amenities catalogue fields and safeguards.
-- Safe to run after the base schema even when the broader CMS migration has not
-- yet added its common content columns to amenities.

DO $$ BEGIN
  CREATE TYPE public.content_status AS ENUM ('draft','published','archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.amenities
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.amenities DROP CONSTRAINT IF EXISTS amenities_category_check;
ALTER TABLE public.amenities ADD CONSTRAINT amenities_category_check
  CHECK (category IN ('room','bathroom','food','outdoor','services','parking','accessibility','other'));

UPDATE public.amenities SET active = is_visible WHERE active IS DISTINCT FROM is_visible;

CREATE INDEX IF NOT EXISTS amenities_catalogue_idx
  ON public.amenities(property_id,status,active,category,sort_order);

-- Existing room links remain intact when an amenity is archived.
CREATE UNIQUE INDEX IF NOT EXISTS amenities_property_name_active_uidx
  ON public.amenities(property_id,lower(name)) WHERE status <> 'archived';

-- Self-contained authorization for installations that have not yet run the
-- complete CMS migration. The function executes on the server and never
-- exposes membership records to the browser.
CREATE OR REPLACE FUNCTION public.can_manage_amenities(target_property UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE lower(email) = lower(auth.jwt() ->> 'email')
      AND property_id = target_property
      AND role IN ('owner','manager','editor')
  );
$$;

REVOKE ALL ON FUNCTION public.can_manage_amenities(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_amenities(UUID) TO anon, authenticated;

ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "amenities_public_read" ON public.amenities;
CREATE POLICY "amenities_public_read"
  ON public.amenities FOR SELECT TO anon, authenticated
  USING (
    (status = 'published' AND is_visible = TRUE AND active = TRUE)
    OR public.can_manage_amenities(property_id)
  );

DROP POLICY IF EXISTS "amenities_admin_manage" ON public.amenities;
CREATE POLICY "amenities_admin_manage"
  ON public.amenities FOR ALL TO authenticated
  USING (public.can_manage_amenities(property_id))
  WITH CHECK (public.can_manage_amenities(property_id));
