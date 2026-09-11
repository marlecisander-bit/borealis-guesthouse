-- Consistent publication lifecycle metadata for CMS-managed public content.
ALTER TABLE public.room_types ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ, ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ, ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE public.transfer_routes ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ, ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE public.cms_documents ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ, ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE public.homepage_sections ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ, ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.apply_content_lifecycle_timestamps()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published') THEN
    NEW.published_at := NOW();
    NEW.archived_at := NULL;
  ELSIF NEW.status = 'archived' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'archived') THEN
    NEW.archived_at := NOW();
  ELSIF NEW.status = 'draft' THEN
    NEW.archived_at := NULL;
  END IF;
  RETURN NEW;
END $$;

DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['room_types','experiences','transfer_routes','tourism_articles','content_pages','cms_documents','homepage_sections'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS content_lifecycle_timestamps ON public.%I', table_name);
    EXECUTE format('CREATE TRIGGER content_lifecycle_timestamps BEFORE INSERT OR UPDATE OF status ON public.%I FOR EACH ROW EXECUTE FUNCTION public.apply_content_lifecycle_timestamps()', table_name);
  END LOOP;
END $$;
