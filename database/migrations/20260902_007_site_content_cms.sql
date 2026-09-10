-- Structured CMS documents, centralized contact data and controlled navigation.
DO $$ BEGIN CREATE TYPE public.content_status AS ENUM ('draft','published','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS public.cms_documents (
 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
 document_key TEXT NOT NULL CHECK(document_key IN ('about','contact','footer')), data JSONB NOT NULL DEFAULT '{}'::jsonb,
 draft_data JSONB,
 status public.content_status NOT NULL DEFAULT 'draft', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
 UNIQUE(property_id,document_key)
);
CREATE TABLE IF NOT EXISTS public.navigation_items (
 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
 location TEXT NOT NULL DEFAULT 'header', label TEXT NOT NULL, href TEXT NOT NULL, status public.content_status NOT NULL DEFAULT 'published',
 sort_order INTEGER NOT NULL DEFAULT 0, is_visible BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
 UNIQUE(property_id,location,href)
);
CREATE OR REPLACE FUNCTION public.can_manage_site_content(target_property UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.admin_users WHERE lower(email)=lower(auth.jwt()->>'email') AND property_id=target_property AND role IN ('owner','manager','editor')); $$;
REVOKE ALL ON FUNCTION public.can_manage_site_content(UUID) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.can_manage_site_content(UUID) TO authenticated;
ALTER TABLE public.cms_documents ENABLE ROW LEVEL SECURITY; ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE t TEXT; BEGIN FOREACH t IN ARRAY ARRAY['cms_documents','navigation_items'] LOOP
 EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',t||'_public',t); EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon,authenticated USING(status=''published'' OR public.can_manage_site_content(property_id))',t||'_public',t);
 EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',t||'_admin',t); EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING(public.can_manage_site_content(property_id)) WITH CHECK(public.can_manage_site_content(property_id))',t||'_admin',t);
END LOOP; END $$;
