-- Read-only deployment verification. Does not create bookings, content or users.
BEGIN READ ONLY;
SET LOCAL statement_timeout='10s';
DO $permissions$
DECLARE r text; f regprocedure;
BEGIN
 IF EXISTS(SELECT 1 FROM pg_class WHERE oid IN ('public.rental_allocations'::regclass,'public.rental_payment_receipts'::regclass) AND (NOT relrowsecurity OR pg_get_userbyid(relowner)<>'postgres')) THEN RAISE EXCEPTION 'Rental table RLS/owner mismatch'; END IF;
 FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF has_table_privilege(r,'public.rental_allocations','SELECT') OR has_table_privilege(r,'public.rental_allocations','INSERT') OR has_table_privilege(r,'public.rental_payment_receipts','INSERT') OR has_function_privilege(r,'public.rental_quote_internal(jsonb,text)','EXECUTE') THEN RAISE EXCEPTION 'Private rental access exposed to %',r; END IF;
 END LOOP;
 FOREACH f IN ARRAY ARRAY['public.rental_payment_balance(uuid)'::regprocedure,'public.record_rental_payment(uuid,numeric,text,text)'::regprocedure] LOOP
  IF has_function_privilege('anon',f,'EXECUTE') OR has_function_privilege('service_role',f,'EXECUTE') OR NOT has_function_privilege('authenticated',f,'EXECUTE') THEN RAISE EXCEPTION 'Receipt RPC grant mismatch'; END IF;
 END LOOP;
END $permissions$;
SELECT current_database(),current_user,current_setting('server_version');
SELECT table_name,column_name,data_type FROM information_schema.columns
WHERE table_schema='public' AND (table_name='experiences' AND column_name='rental_config' OR table_name='booking_items' AND column_name='rental_snapshot');
SELECT relname,relrowsecurity,pg_get_userbyid(relowner) AS owner FROM pg_class
WHERE oid IN ('public.rental_allocations'::regclass,'public.rental_payment_receipts'::regclass);
SELECT role,has_table_privilege(role,'public.rental_allocations','SELECT') AS allocation_select,
 has_table_privilege(role,'public.rental_allocations','INSERT') AS allocation_insert,
 has_table_privilege(role,'public.rental_payment_receipts','INSERT') AS receipt_insert,
 has_function_privilege(role,'public.rental_quote_internal(jsonb,text)','EXECUTE') AS private_quote,
 has_function_privilege(role,'public.quote_equipment_rental(jsonb,text)','EXECUTE') AS public_quote,
 has_function_privilege(role,'public.create_equipment_rental_hold(jsonb,jsonb)','EXECUTE') AS standalone_hold,
 has_function_privilege(role,'public.create_rental_room_package_hold(jsonb,date,date,integer,jsonb,jsonb)','EXECUTE') AS room_hold,
 has_function_privilege(role,'public.record_rental_payment(uuid,numeric,text,text)','EXECUTE') AS receipt_rpc
FROM unnest(ARRAY['anon','authenticated']) role;
SELECT proname,pg_get_function_identity_arguments(oid) AS arguments,pg_get_userbyid(proowner) AS owner,prosecdef,proconfig
FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname IN ('rental_quote_internal','quote_equipment_rental','get_equipment_rental_times','create_equipment_rental_hold','create_rental_room_package_hold','record_rental_payment','rental_payment_balance');
SELECT tgname,pg_get_triggerdef(oid) FROM pg_trigger WHERE NOT tgisinternal AND tgname IN ('guard_rental_configuration','a_guard_rental_item','allocate_rental_item','a_guard_rental_booking_lifecycle','zzz_enrich_rental_notification','guard_experience_booking_item') ORDER BY tgname;
COMMIT;
