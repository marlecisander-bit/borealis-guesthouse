-- Run after database/schema.sql and database/media-storage.sql.
-- Adds CMS workflow, attribution, role-aware RLS, and an audit-log foundation.

DO $$ BEGIN
  CREATE TYPE public.content_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

ALTER TABLE public.page_sections
  ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

ALTER TABLE public.room_types ADD COLUMN IF NOT EXISTS slug VARCHAR(255), ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'draft', ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id), ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id), ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE public.amenities ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'draft', ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id), ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id), ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS slug VARCHAR(255), ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'draft', ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id), ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id), ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE public.transfers ADD COLUMN IF NOT EXISTS slug VARCHAR(255), ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'draft', ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id), ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id), ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE public.media_assets ADD COLUMN IF NOT EXISTS caption TEXT, ADD COLUMN IF NOT EXISTS focal_x DECIMAL(5,4), ADD COLUMN IF NOT EXISTS focal_y DECIMAL(5,4), ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ, ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id), ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.is_property_admin(target_property UUID, allowed_roles TEXT[] DEFAULT ARRAY['owner','manager','editor','staff'])
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE lower(email)=lower(auth.jwt()->>'email') AND property_id=target_property AND role=ANY(allowed_roles)); $$;

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Published pages are public" ON public.pages;
CREATE POLICY "Published pages are public" ON public.pages FOR SELECT USING (status='published' OR public.is_property_admin(property_id));
DROP POLICY IF EXISTS "Editors manage pages" ON public.pages;
CREATE POLICY "Editors manage pages" ON public.pages FOR ALL TO authenticated USING (public.is_property_admin(property_id,ARRAY['owner','manager','editor'])) WITH CHECK (public.is_property_admin(property_id,ARRAY['owner','manager','editor']));

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read property audit logs" ON public.audit_logs;
CREATE POLICY "Admins read property audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_property_admin(property_id));
DROP POLICY IF EXISTS "Admins create property audit logs" ON public.audit_logs;
CREATE POLICY "Admins create property audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (public.is_property_admin(property_id));
