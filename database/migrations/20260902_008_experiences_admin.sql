-- Experience products, media, SEO and extensible availability.
DO $$ BEGIN CREATE TYPE public.content_status AS ENUM ('draft','published','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS full_description TEXT,
  ADD COLUMN IF NOT EXISTS cover_media_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS duration_label TEXT,
  ADD COLUMN IF NOT EXISTS pricing_type TEXT NOT NULL DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS meeting_point TEXT,
  ADD COLUMN IF NOT EXISTS included_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS excluded_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS important_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS booking_notice TEXT,
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS bookable BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS availability_mode TEXT NOT NULL DEFAULT 'on_request',
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE public.experiences DROP CONSTRAINT IF EXISTS experiences_pricing_type_check;
ALTER TABLE public.experiences ADD CONSTRAINT experiences_pricing_type_check CHECK(pricing_type IN ('per_person','per_group','fixed','on_request'));
ALTER TABLE public.experiences DROP CONSTRAINT IF EXISTS experiences_availability_mode_check;
ALTER TABLE public.experiences ADD CONSTRAINT experiences_availability_mode_check CHECK(availability_mode IN ('always','on_request','specific_dates','recurring'));
ALTER TABLE public.experiences DROP CONSTRAINT IF EXISTS experiences_price_nonnegative_check;
ALTER TABLE public.experiences ADD CONSTRAINT experiences_price_nonnegative_check CHECK(price >= 0);
CREATE UNIQUE INDEX IF NOT EXISTS experiences_property_slug_uidx ON public.experiences(property_id,slug) WHERE slug IS NOT NULL AND status <> 'archived';
CREATE INDEX IF NOT EXISTS experiences_public_idx ON public.experiences(property_id,status,active,sort_order);

CREATE TABLE IF NOT EXISTS public.experience_images(
 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
 experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE, media_asset_id UUID NOT NULL REFERENCES public.media_assets(id) ON DELETE RESTRICT,
 sort_order INTEGER NOT NULL DEFAULT 0, is_cover BOOLEAN NOT NULL DEFAULT FALSE, status public.content_status NOT NULL DEFAULT 'published',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
 UNIQUE(experience_id,media_asset_id)
);
ALTER TABLE public.experience_availability
  ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS availability_type TEXT NOT NULL DEFAULT 'specific_date',
  ADD COLUMN IF NOT EXISTS day_of_week SMALLINT,
  ADD COLUMN IF NOT EXISTS start_time TIME,
  ADD COLUMN IF NOT EXISTS end_time TIME,
  ADD COLUMN IF NOT EXISTS slot_capacity INTEGER,
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.experience_availability DROP CONSTRAINT IF EXISTS experience_availability_type_check;
ALTER TABLE public.experience_availability ADD CONSTRAINT experience_availability_type_check CHECK(availability_type IN ('specific_date','recurring_day','time_slot'));
ALTER TABLE public.experience_availability DROP CONSTRAINT IF EXISTS experience_availability_day_check;
ALTER TABLE public.experience_availability ADD CONSTRAINT experience_availability_day_check CHECK(day_of_week IS NULL OR day_of_week BETWEEN 0 AND 6);

CREATE OR REPLACE FUNCTION public.can_manage_experiences(target_property UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.admin_users WHERE lower(email)=lower(auth.jwt()->>'email') AND property_id=target_property AND role IN ('owner','manager','editor')); $$;
REVOKE ALL ON FUNCTION public.can_manage_experiences(UUID) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.can_manage_experiences(UUID) TO authenticated;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY; ALTER TABLE public.experience_images ENABLE ROW LEVEL SECURITY; ALTER TABLE public.experience_availability ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS experiences_public_read ON public.experiences; CREATE POLICY experiences_public_read ON public.experiences FOR SELECT TO anon,authenticated USING((status='published' AND active) OR public.can_manage_experiences(property_id));
DROP POLICY IF EXISTS experiences_admin_manage ON public.experiences; CREATE POLICY experiences_admin_manage ON public.experiences FOR ALL TO authenticated USING(public.can_manage_experiences(property_id)) WITH CHECK(public.can_manage_experiences(property_id));
DROP POLICY IF EXISTS experience_images_public_read ON public.experience_images; CREATE POLICY experience_images_public_read ON public.experience_images FOR SELECT TO anon,authenticated USING(status='published' OR public.can_manage_experiences(property_id));
DROP POLICY IF EXISTS experience_images_admin_manage ON public.experience_images; CREATE POLICY experience_images_admin_manage ON public.experience_images FOR ALL TO authenticated USING(public.can_manage_experiences(property_id)) WITH CHECK(public.can_manage_experiences(property_id));
DROP POLICY IF EXISTS experience_availability_admin_manage ON public.experience_availability; CREATE POLICY experience_availability_admin_manage ON public.experience_availability FOR ALL TO authenticated USING(public.can_manage_experiences(property_id)) WITH CHECK(public.can_manage_experiences(property_id));
