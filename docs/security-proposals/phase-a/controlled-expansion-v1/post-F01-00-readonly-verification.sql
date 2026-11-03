BEGIN READ ONLY;
SET LOCAL statement_timeout='10s';
SELECT conname,pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='public.cms_documents'::regclass ORDER BY conname;
SELECT r,has_function_privilege(r,'public.next_booking_reference(uuid)','EXECUTE') AS reference_helper,has_function_privilege(r,'public.expire_booking_holds(uuid)','EXECUTE') AS expiration_helper FROM unnest(ARRAY['anon','authenticated','service_role','postgres']) r;
COMMIT;
