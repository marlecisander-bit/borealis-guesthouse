-- READ ONLY: execute independently after each accepted expansion; do not invoke CMS RPCs.
BEGIN READ ONLY;
SET LOCAL statement_timeout='10s';
SELECT conname,pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid='public.cms_documents'::regclass ORDER BY conname;
SELECT p.proname,pg_get_function_identity_arguments(p.oid) AS signature,pg_get_userbyid(p.proowner) AS owner,p.prosecdef,p.proconfig,p.proacl::text,pg_get_functiondef(p.oid) AS definition FROM pg_proc p WHERE p.pronamespace='public'::regnamespace AND p.proname IN ('borealis_admin_cms_documents','borealis_save_cms_document');
SELECT r,has_function_privilege(r,'public.borealis_admin_cms_documents(uuid,text)','EXECUTE') AS private_read,has_function_privilege(r,'public.borealis_save_cms_document(uuid,text,jsonb,public.content_status)','EXECUTE') AS private_save FROM unnest(ARRAY['anon','authenticated','service_role','postgres']) r;
SELECT r,has_function_privilege(r,'public.next_booking_reference(uuid)','EXECUTE') AS reference_helper,has_function_privilege(r,'public.expire_booking_holds(uuid)','EXECUTE') AS expiration_helper FROM unnest(ARRAY['anon','authenticated','service_role','postgres']) r;
COMMIT;
