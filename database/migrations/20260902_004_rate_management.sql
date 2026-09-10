-- Borealis rate management. Run after the base schema and admin bootstrap.
DO $$ BEGIN CREATE TYPE public.content_status AS ENUM ('draft','published','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.rates
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
UPDATE public.rates SET title=COALESCE(title,'Base rate');
CREATE UNIQUE INDEX IF NOT EXISTS rates_one_current_base_uidx ON public.rates(property_id,room_type_id) WHERE status<>'archived';

CREATE TABLE IF NOT EXISTS public.seasonal_rate_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, nightly_price NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR', active BOOLEAN NOT NULL DEFAULT TRUE, status public.content_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, archived_at TIMESTAMPTZ,
  CHECK(end_date>=start_date), CHECK(nightly_price>=0), CHECK(currency ~ '^[A-Z]{3}$')
);
CREATE INDEX IF NOT EXISTS seasonal_rate_periods_lookup_idx ON public.seasonal_rate_periods(property_id,status,active,start_date,end_date);

CREATE TABLE IF NOT EXISTS public.seasonal_rate_room_types (
  period_id UUID NOT NULL REFERENCES public.seasonal_rate_periods(id) ON DELETE CASCADE,
  room_type_id UUID NOT NULL REFERENCES public.room_types(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  PRIMARY KEY(period_id,room_type_id)
);
CREATE INDEX IF NOT EXISTS seasonal_rate_room_types_lookup_idx ON public.seasonal_rate_room_types(property_id,room_type_id,period_id);

CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  room_type_id UUID REFERENCES public.room_types(id) ON DELETE CASCADE, name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK(rule_type IN ('weekend_price','minimum_stay','maximum_stay','extra_guest_fee','discount_percentage','fixed_discount','closed_to_arrival','closed_to_departure')),
  start_date DATE, end_date DATE, amount NUMERIC(10,2), percentage NUMERIC(5,2), nights INTEGER, weekdays SMALLINT[],
  currency VARCHAR(3) DEFAULT 'EUR', active BOOLEAN NOT NULL DEFAULT TRUE, status public.content_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, archived_at TIMESTAMPTZ,
  CHECK(end_date IS NULL OR start_date IS NULL OR end_date>=start_date), CHECK(amount IS NULL OR amount>=0),
  CHECK(percentage IS NULL OR percentage BETWEEN 0 AND 100), CHECK(nights IS NULL OR nights>0)
);
CREATE INDEX IF NOT EXISTS pricing_rules_lookup_idx ON public.pricing_rules(property_id,room_type_id,status,active,start_date,end_date);

CREATE OR REPLACE FUNCTION public.can_manage_rates(target_property UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
SELECT EXISTS(SELECT 1 FROM public.admin_users WHERE lower(email)=lower(auth.jwt()->>'email') AND property_id=target_property AND role IN ('owner','manager'));
$$;
REVOKE ALL ON FUNCTION public.can_manage_rates(UUID) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.can_manage_rates(UUID) TO authenticated;

ALTER TABLE public.rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasonal_rate_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasonal_rate_room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE t TEXT; BEGIN FOREACH t IN ARRAY ARRAY['rates','seasonal_rate_periods','seasonal_rate_room_types','pricing_rules'] LOOP
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',t||'_rate_admin',t);
  EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING(public.can_manage_rates(property_id)) WITH CHECK(public.can_manage_rates(property_id))',t||'_rate_admin',t);
END LOOP; END $$;

