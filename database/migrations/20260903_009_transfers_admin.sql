-- Transfer product management, public booking add-ons and optional schedules.
ALTER TABLE public.transfer_routes
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS full_description TEXT,
  ADD COLUMN IF NOT EXISTS cover_media_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS duration_label TEXT,
  ADD COLUMN IF NOT EXISTS bookable BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS availability_mode TEXT NOT NULL DEFAULT 'on_request',
  ADD COLUMN IF NOT EXISTS available_days SMALLINT[] NOT NULL DEFAULT '{}'::SMALLINT[],
  ADD COLUMN IF NOT EXISTS window_start TIME,
  ADD COLUMN IF NOT EXISTS window_end TIME;

UPDATE public.transfer_routes SET short_description=COALESCE(short_description,description,'') WHERE short_description IS NULL;

ALTER TABLE public.transfer_routes DROP CONSTRAINT IF EXISTS transfer_routes_availability_mode_check;
ALTER TABLE public.transfer_routes ADD CONSTRAINT transfer_routes_availability_mode_check CHECK(availability_mode IN ('always','scheduled','on_request'));
ALTER TABLE public.transfer_routes DROP CONSTRAINT IF EXISTS transfer_routes_available_days_check;
ALTER TABLE public.transfer_routes ADD CONSTRAINT transfer_routes_available_days_check CHECK(available_days <@ ARRAY[0,1,2,3,4,5,6]::SMALLINT[]);

-- Replace the legacy price enum with a text column so pricing can evolve safely.
ALTER TABLE public.transfer_routes ALTER COLUMN price_type DROP DEFAULT;
ALTER TABLE public.transfer_routes ALTER COLUMN price_type TYPE TEXT USING price_type::TEXT;
ALTER TABLE public.transfer_routes ALTER COLUMN price_type SET DEFAULT 'fixed_vehicle';
UPDATE public.transfer_routes SET price_type=CASE price_type WHEN 'fixed' THEN 'fixed_vehicle' WHEN 'from' THEN 'fixed_vehicle' ELSE price_type END;
ALTER TABLE public.transfer_routes DROP CONSTRAINT IF EXISTS transfer_routes_price_type_check;
ALTER TABLE public.transfer_routes ADD CONSTRAINT transfer_routes_price_type_check CHECK(price_type IN ('fixed_vehicle','per_passenger','on_request'));

CREATE INDEX IF NOT EXISTS transfer_routes_public_idx ON public.transfer_routes(property_id,status,is_visible,active,sort_order);
