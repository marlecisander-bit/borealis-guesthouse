-- Adds explicit activation for base room rates. Run after 20260902_004_rate_management.sql.
ALTER TABLE public.rates ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;
CREATE INDEX IF NOT EXISTS rates_public_pricing_lookup_idx ON public.rates(property_id,room_type_id,status,is_visible,active);

DROP POLICY IF EXISTS rates_public_read ON public.rates;
CREATE POLICY rates_public_read ON public.rates FOR SELECT TO anon,authenticated USING(status='published' AND is_visible AND active);
DROP POLICY IF EXISTS seasonal_rates_public_read ON public.seasonal_rate_periods;
CREATE POLICY seasonal_rates_public_read ON public.seasonal_rate_periods FOR SELECT TO anon,authenticated USING(status='published' AND active);
DROP POLICY IF EXISTS seasonal_rate_links_public_read ON public.seasonal_rate_room_types;
CREATE POLICY seasonal_rate_links_public_read ON public.seasonal_rate_room_types FOR SELECT TO anon,authenticated USING(EXISTS(SELECT 1 FROM public.seasonal_rate_periods period WHERE period.id=seasonal_rate_room_types.period_id AND period.status='published' AND period.active));
DROP POLICY IF EXISTS pricing_rules_public_read ON public.pricing_rules;
CREATE POLICY pricing_rules_public_read ON public.pricing_rules FOR SELECT TO anon,authenticated USING(status='published' AND active AND rule_type='minimum_stay');
