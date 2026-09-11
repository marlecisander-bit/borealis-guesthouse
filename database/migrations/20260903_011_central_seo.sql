-- Redirect records are intentionally inactive infrastructure for future slug changes.
CREATE TABLE IF NOT EXISTS public.seo_redirects (
 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
 source_path TEXT NOT NULL, destination_path TEXT NOT NULL, redirect_code SMALLINT NOT NULL DEFAULT 301 CHECK(redirect_code IN (301,302,307,308)),
 is_active BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
 UNIQUE(property_id,source_path), CHECK(source_path LIKE '/%'), CHECK(destination_path LIKE '/%' OR destination_path LIKE 'https://%')
);
ALTER TABLE public.seo_redirects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS seo_redirects_admin_manage ON public.seo_redirects;
CREATE POLICY seo_redirects_admin_manage ON public.seo_redirects FOR ALL TO authenticated USING(public.can_manage_property(property_id,ARRAY['owner','manager','editor']::public.admin_role[])) WITH CHECK(public.can_manage_property(property_id,ARRAY['owner','manager','editor']::public.admin_role[]));
DROP TRIGGER IF EXISTS set_seo_redirects_updated_at ON public.seo_redirects;
CREATE TRIGGER set_seo_redirects_updated_at BEFORE UPDATE ON public.seo_redirects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
