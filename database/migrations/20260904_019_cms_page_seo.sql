-- One CMS-owned SEO record for every primary public page.
CREATE TABLE IF NOT EXISTS public.page_seo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  page_key TEXT NOT NULL CHECK (page_key IN ('homepage','rooms','experiences','transfers','explore-koman','about','contact')),
  slug TEXT NOT NULL,
  seo_title TEXT,
  meta_description TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  canonical_override TEXT,
  noindex BOOLEAN NOT NULL DEFAULT FALSE,
  status public.content_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(property_id,page_key),
  UNIQUE(property_id,slug),
  CHECK (slug = '' OR slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CHECK (canonical_override IS NULL OR canonical_override = '' OR canonical_override LIKE 'https://%')
);

ALTER TABLE public.page_seo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS page_seo_public_read ON public.page_seo;
CREATE POLICY page_seo_public_read ON public.page_seo FOR SELECT TO anon,authenticated
  USING(status='published' OR public.can_manage_property(property_id,ARRAY['owner','manager','editor']::public.admin_role[]));
DROP POLICY IF EXISTS page_seo_admin_manage ON public.page_seo;
CREATE POLICY page_seo_admin_manage ON public.page_seo FOR ALL TO authenticated
  USING(public.can_manage_property(property_id,ARRAY['owner','manager','editor']::public.admin_role[]))
  WITH CHECK(public.can_manage_property(property_id,ARRAY['owner','manager','editor']::public.admin_role[]));
DROP TRIGGER IF EXISTS set_page_seo_updated_at ON public.page_seo;
CREATE TRIGGER set_page_seo_updated_at BEFORE UPDATE ON public.page_seo FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Inactive redirects preserve slug history for a later redirect-management workflow.
CREATE OR REPLACE FUNCTION public.capture_page_seo_slug_change() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF OLD.slug IS DISTINCT FROM NEW.slug AND OLD.status='published' THEN
    INSERT INTO public.seo_redirects(property_id,source_path,destination_path,redirect_code,is_active,created_by,updated_by)
    VALUES(OLD.property_id,CASE WHEN OLD.slug='' THEN '/' ELSE '/'||OLD.slug END,CASE WHEN NEW.slug='' THEN '/' ELSE '/'||NEW.slug END,301,FALSE,NEW.updated_by,NEW.updated_by)
    ON CONFLICT(property_id,source_path) DO UPDATE SET destination_path=EXCLUDED.destination_path,updated_by=EXCLUDED.updated_by,updated_at=NOW();
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS capture_page_seo_slug_change ON public.page_seo;
CREATE TRIGGER capture_page_seo_slug_change BEFORE UPDATE OF slug ON public.page_seo FOR EACH ROW EXECUTE FUNCTION public.capture_page_seo_slug_change();

INSERT INTO public.page_seo(property_id,page_key,slug,seo_title,meta_description,status)
SELECT p.id,v.page_key,v.slug,v.title,v.description,'published'::public.content_status
FROM public.properties p CROSS JOIN (VALUES
 ('homepage','','Borealis Guest House | Lakeside Stay in Koman','Stay by Koman Lake at Borealis Guest House. Discover rooms, local experiences and convenient transfers.'),
 ('rooms','rooms','Rooms','Explore comfortable rooms by Koman Lake at Borealis Guest House.'),
 ('experiences','experiences','Experiences','Discover lake and nature experiences from Borealis in Koman.'),
 ('transfers','transfers','Transfers','Plan private transfers to Borealis Guest House and destinations around Koman.'),
 ('explore-koman','explore-koman','Explore Koman','Practical, thoughtful guides to Koman Lake and the surrounding region.'),
 ('about','about','About Borealis','Discover the story, setting and hospitality behind Borealis Guest House in Koman.'),
 ('contact','contact','Contact Borealis','Contact Borealis Guest House about rooms, transfers, experiences and directions to Koman.')
) AS v(page_key,slug,title,description)
ON CONFLICT(property_id,page_key) DO NOTHING;
