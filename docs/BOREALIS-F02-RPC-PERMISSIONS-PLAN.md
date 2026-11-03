# F02 — internal writer permission remediation plan

2026-10-21 (Europe/Tirane). Canonical repository: `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`. **DESIGN ONLY — no SQL executed, no application changes, no deployment.**

**Decision: GO for isolated ACL testing; NO-GO for production application until owner/call-graph/role inheritance gates pass.** Only two exact function signatures are changed. No booking RPC body or public application flow is redesigned.

## Exact objects and call graph

- `public.next_booking_reference(uuid)`: SECURITY DEFINER, search_path=public, increments `public.booking_reference_counters(property_id,reference_year,last_value)` and returns the reference. Recorded source SHA256 `a36821c05e3b4275e4f3167034adb1aefaec3c2b73e59ab0a359479b0139580b`; explicit EXECUTE to anon/authenticated/service_role, no internal caller check.
- `public.expire_booking_holds(uuid)`: SECURITY DEFINER, search_path=public, updates expired held bookings to cancelled. Recorded source SHA256 `96ea54817e0a23b4242aeedca83508ce6b28163b56f4dd17ca3440d820e48872`; PUBLIC plus explicit anon/authenticated/service_role EXECUTE. Reservation/item/notification triggers may run as consequences; it is not a read-only function.
- `create_booking_hold(uuid,date,date,integer,jsonb,jsonb)` calls expiry and next reference. `create_booking_package_hold` wraps it; latest `create_multi_room_booking_package_hold(jsonb,date,date,integer,jsonb,jsonb)` wraps package creation. All are recorded SECURITY DEFINER. Standalone `create_experience_booking_hold(uuid,date,time,integer,jsonb)` calls next reference. Older migration032 definition does too; migration033 is the current reconciled standalone version.
- Admin booking overloads call shared hold logic; confirm functions do not need anonymous permission on the internal reference helper merely because the transaction began anonymously.

No TypeScript direct call to either helper was found. Public entry points remain `/api/bookings/hold`, `/api/bookings/experience`, `/api/bookings/confirm`, `/api/pricing`; admin booking repository calls create_admin_booking. Preserve their exact grants/signatures and existing validation. Older public functions/overloads must remain inventoried but are not indiscriminately revoked here.

## Narrow proposed SQL

[F02-internal-writer-acls.sql.proposed](security-proposals/phase-a/F02-internal-writer-acls.sql.proposed) contains one transaction: revoke EXECUTE on the two helpers from PUBLIC,anon,authenticated; retain explicit trusted service_role EXECUTE. No data update, helper-body change, booking transaction change, role-membership change, new scheduler or migration replay.

SECURITY DEFINER runs with its owner's privileges. A caller entering an approved definer booking function does not need its original anon role to retain permission on each nested helper, provided the effective function owner has EXECUTE. Verify the actual owner chain first; do not infer it merely from the SQL language or grantor text. [PostgreSQL function security](https://www.postgresql.org/docs/current/sql-createfunction.html). Grants inherited through another role or PUBLIC are additive; inspect them and stop if this small ACL delta would not deny direct access. [PostgreSQL GRANT](https://www.postgresql.org/docs/current/sql-grant.html).

Trusted expiry remains callable from the existing definer hold transaction and separately from a server using service_role. The reviewed source has lazy expiry; no new scheduled expiry worker is required or authorized here. Keep service-role credentials server-only. If a newly identified legitimate scheduled caller uses authenticated instead, do not retain blanket authenticated EXECUTE: design a separately authorized narrow server capability and retest before promotion.

## Prerequisites and proposed metadata preflight

Capture pg_get_functiondef, pg_proc.proowner/prosecdef/proconfig/proacl, exact pg_get_function_identity_arguments, current table/function ownership, schema CREATE grants and effective inherited privileges for all nested paths. Verify schema/table/trigger versions against recorded hashes, including later overloads, and capture exact current ACLs for controlled recovery. Do not assert live production owner metadata from this task; no SQL was run.

Function identity must resolve exactly with to_regprocedure; no wildcard ALL FUNCTIONS/SCHEMA-wide REVOKE. Actual anon/authenticated membership must not inherit service_role or the function-owning role. Any unknown wrapper, exposed arbitrary-function executor or trigger owner incompatibility is NO-GO, not a reason to regrant broadly. Existing F01/F03 changes are independent; test their combined bundle after individual acceptance.

## Synthetic role-based acceptance

| Case | Before | Required after |
| --- | --- | --- |
| anon direct next_booking_reference | Catalog allows invocation; not invoked in production |42501/no counter change |
| authenticated non-member/O/M/E/S direct next reference | Catalog allows all authenticated roles |42501 even for an owner; browser identity is not the internal writer authority |
| anon/auth direct expiry | Catalog permits, including via PUBLIC |42501, no booking/status/item/notification changes |
| nested public room/package/multi-room booking | Existing intended flow |Succeeds against synthetic inventory; one reference per intended booking, correct rows and rollback |
| nested standalone experience hold | Existing intended flow |Succeeds; shared capacity and next reference remain correct |
| nested admin booking overloads | SQL role check then shared hold |Approved O/M/S succeeds; editor/non-member/cross-property denied by unchanged authorization |
| wrong/expired confirm token | Existing token validation |Still denied; no new permission created |
| service-role expiry | Intended trusted server capability |Expires only elapsed synthetic holds in target property; active/future/other-property holds unchanged |
| concurrent holds/reference allocation | Existing counter transaction |Unique intended references; no partial counter/booking state after exceptions according to tested transaction semantics |
| inheritance/old overload/direct REST RPC | Effective privileges may exceed simple ACL view |Denial confirmed through SQL role harness AND isolated PostgREST, not only UI routes |
| public quote/read-only functions | Out of change scope |Exact pre/post privilege and body hashes unchanged |

The separate synthetic-denial SQL examples provide exact negative assertions. Positive tests must run the existing booking SQL scenarios plus two-connection concurrency tests on synthetic inventory, never production. Rollback-only SQL transactions are not enough for mail/provider safety if real triggers invoke external effects: use fake endpoints/blank real credentials and network isolation first.

## Deployment, interruption and recovery

No app release is needed if metadata confirms the documented nested-owner model. After isolated proof, apply the exact ACL transaction during a monitored low-traffic window with short lock/statement timeouts, refresh PostgREST schema cache and verify metadata/public informational reads. Do not create production bookings as a smoke test. Normal bookings should have no interruption; unexpected owner/grant/schema-cache differences can break nested transactions, hence the strict preflight.

An already-running call authorized before revocation may complete; ACL changes do not retroactively undo writes or revoke copied references. If nested execution fails, retain public-helper denial and restore only the verified internal owner/service permission needed, or pause the affected operation until a forward correction. Do not automatically restore anon/authenticated/PUBLIC grants. Counter values/reference gaps are not reset and are not repaired by an ACL rollback. Any data recovery is separately reviewed.

**GO/NO-GO:** candidate SQL is exact but unexecuted. Production NO-GO until nested effective-owner proof, current ACL/inheritance capture, isolated positive booking/expiry tests and negative direct-RPC tests pass. No function execution, role change, production SQL or implementation occurred in this task.
