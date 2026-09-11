-- Manual translation workflow metadata; translated values remain plain text or controlled JSON.
ALTER TABLE public.translations ADD COLUMN IF NOT EXISTS value_json JSONB;
ALTER TABLE public.translations ADD COLUMN IF NOT EXISTS is_complete BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.translations ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS translations_public_locale_idx ON public.translations(language_id,entity_type,entity_id,status,field_name);
