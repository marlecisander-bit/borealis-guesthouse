-- Broaden language tags to BCP 47-style values and keep defaults usable.
ALTER TABLE public.languages DROP CONSTRAINT IF EXISTS languages_code_check;
ALTER TABLE public.languages DROP CONSTRAINT IF EXISTS languages_default_must_be_enabled;
ALTER TABLE public.languages ADD CONSTRAINT languages_code_check CHECK(code ~ '^[A-Za-z]{2,8}(-[A-Za-z0-9]{1,8})*$');
ALTER TABLE public.languages ADD CONSTRAINT languages_default_must_be_enabled CHECK(NOT is_default OR enabled);
CREATE UNIQUE INDEX IF NOT EXISTS languages_property_code_ci_uidx ON public.languages(property_id,lower(code));
CREATE INDEX IF NOT EXISTS languages_public_order_idx ON public.languages(property_id,enabled,sort_order);
CREATE INDEX IF NOT EXISTS translations_entity_locale_idx ON public.translations(property_id,entity_type,entity_id,language_id,status,field_name);
