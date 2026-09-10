-- Structured homepage CMS. No arbitrary HTML, CSS or layout definitions are stored.
DO $$ BEGIN CREATE TYPE public.content_status AS ENUM ('draft','published','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.homepage_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL, title TEXT, subtitle TEXT, body TEXT, eyebrow TEXT, cta_label TEXT, cta_link TEXT,
  background_media_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL, status public.content_status NOT NULL DEFAULT 'draft',
  sort_order INTEGER NOT NULL DEFAULT 0, is_visible BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, archived_at TIMESTAMPTZ, UNIQUE(property_id,section_key)
);
CREATE TABLE IF NOT EXISTS public.homepage_highlights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  title TEXT NOT NULL, description TEXT, icon_reference TEXT, link_url TEXT, status public.content_status NOT NULL DEFAULT 'draft',
  sort_order INTEGER NOT NULL DEFAULT 0, is_visible BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, archived_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  author_name TEXT, origin TEXT, quote TEXT NOT NULL, rating NUMERIC(2,1), source_label TEXT,
  status public.content_status NOT NULL DEFAULT 'draft', sort_order INTEGER NOT NULL DEFAULT 0, is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, archived_at TIMESTAMPTZ
);

ALTER TABLE public.homepage_sections DROP CONSTRAINT IF EXISTS homepage_sections_section_key_check;
ALTER TABLE public.homepage_sections
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.homepage_sections ADD CONSTRAINT homepage_sections_section_key_check CHECK(section_key IN (
  'hero','property_highlights','intro','featured_rooms','featured_experiences','explore_koman','transfers','gallery','reviews','location','final_cta'
));

CREATE TABLE IF NOT EXISTS public.homepage_section_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.homepage_sections(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('room_type','experience','tourism_article','transfer_route','media_asset')),
  entity_id UUID NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(section_id,entity_type,entity_id)
);
CREATE INDEX IF NOT EXISTS homepage_section_links_lookup_idx ON public.homepage_section_links(property_id,section_id,entity_type,sort_order);

CREATE TABLE IF NOT EXISTS public.homepage_drafts (
  property_id UUID PRIMARY KEY REFERENCES public.properties(id) ON DELETE CASCADE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE OR REPLACE FUNCTION public.can_manage_homepage(target_property UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
SELECT EXISTS(SELECT 1 FROM public.admin_users WHERE lower(email)=lower(auth.jwt()->>'email') AND property_id=target_property AND role IN ('owner','manager','editor'));
$$;
REVOKE ALL ON FUNCTION public.can_manage_homepage(UUID) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.can_manage_homepage(UUID) TO authenticated;

ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY; ALTER TABLE public.homepage_highlights ENABLE ROW LEVEL SECURITY; ALTER TABLE public.homepage_section_links ENABLE ROW LEVEL SECURITY; ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_drafts ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE t TEXT; BEGIN FOREACH t IN ARRAY ARRAY['homepage_sections','homepage_highlights','reviews'] LOOP
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',t||'_cms_read',t); EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon,authenticated USING((status=''published'' AND is_visible) OR public.can_manage_homepage(property_id))',t||'_cms_read',t);
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',t||'_cms_manage',t); EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING(public.can_manage_homepage(property_id)) WITH CHECK(public.can_manage_homepage(property_id))',t||'_cms_manage',t);
END LOOP; END $$;
DROP POLICY IF EXISTS "homepage_section_links_cms_read" ON public.homepage_section_links;
CREATE POLICY "homepage_section_links_cms_read" ON public.homepage_section_links FOR SELECT TO anon,authenticated USING(EXISTS(SELECT 1 FROM public.homepage_sections s WHERE s.id=section_id AND ((s.status='published' AND s.is_visible) OR public.can_manage_homepage(s.property_id))));
DROP POLICY IF EXISTS "homepage_section_links_cms_manage" ON public.homepage_section_links;
CREATE POLICY "homepage_section_links_cms_manage" ON public.homepage_section_links FOR ALL TO authenticated USING(public.can_manage_homepage(property_id)) WITH CHECK(public.can_manage_homepage(property_id));
DROP POLICY IF EXISTS "homepage_drafts_cms_manage" ON public.homepage_drafts;
CREATE POLICY "homepage_drafts_cms_manage" ON public.homepage_drafts FOR ALL TO authenticated USING(public.can_manage_homepage(property_id)) WITH CHECK(public.can_manage_homepage(property_id));
