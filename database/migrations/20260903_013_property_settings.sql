-- Non-secret property identity and public contact settings.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS legal_name TEXT,
  ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
  ADD COLUMN IF NOT EXISTS facebook_url TEXT;
