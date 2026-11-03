-- Idempotent correction for projects that installed the first revision of 040.
-- Explicitly remove platform default grants; internal tenant checks remain mandatory.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='10s';
REVOKE ALL ON FUNCTION public.rental_payment_balance(uuid) FROM PUBLIC,anon,service_role;
REVOKE ALL ON FUNCTION public.record_rental_payment(uuid,numeric,text,text) FROM PUBLIC,anon,service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
