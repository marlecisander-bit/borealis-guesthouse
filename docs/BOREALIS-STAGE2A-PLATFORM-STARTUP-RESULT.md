# Borealis Stage 2A platform startup result

2026-10-19 (Europe/Tirane). Canonical clone `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Overall FAIL: sealed controller rejected container_configuration_or_id_changed during PostgreSQL startup and stopped the task-owned DB. All five services are now stopped.** No retry or corrective configuration edit occurred; all old/new volumes are preserved.

## Preflight and exact startup scope

Read startup-handoff, recovery-v2 creation and PostgreSQL recovery reports. Startup-v1 preflight passed: code/seal, pinned v2 receipt/state hashes and exact IDs, five created/never-started states, cached ARM64 image/configuration identities, corrected bootstrap, local secrets/gateway, fresh and old volumes, exact internal network, free loopback ports and no unexpected peers/running services. No hosted-link marker; application migration/seed replay disabled and active migrations empty. Minimal PATH/HOME/TMPDIR environment used; production dotenv was not loaded.

Executed only startup.py start --confirm START_RECOVERY_V2_EXACT_IDS_V1. Only PostgreSQL ID 3a5d753746d8d1909b95831f47f11acd39160fe0ea771a08fe3ff3379fb2afe7 was started. The other four IDs were never started. No image, container or volume was recreated/replaced/deleted.

## Final service state

| Service | Exact ID | Final state | Last Docker health state |
| --- | --- | --- | --- |
| db | `3a5d753746d8d1909b95831f47f11acd39160fe0ea771a08fe3ff3379fb2afe7` | exited | unhealthy |
| auth | `8ab9c783fa1bd919223176bb179841ac6acb8b7edfdb58f57f6c237356981b91` | created | None |
| rest | `8949d74edb50e2d152d7fe16b6c7e78936a16c763d90dcb81d98bd8f842036d6` | created | None |
| storage | `d0561e270eb1a0a78fa9a60b8dd38adcd67abd9834d3a918e9235d4b3abcb54b` | created | None |
| gateway | `4c2bc800f2edd1f565d6b45795712a5b51a0c31dd7686265fa70a4cc26fd9494` | created | None |

DB exit0 is the final stopped process result, not a platform-health PASS. Last Docker health status was unhealthy; controller terminated on fingerprint validation before successful health advancement. Auth/REST/Storage/Kong health, gateway/API and TCP connectivity checks were not reached.

## Initialization reached and precise failure

Sanitized existing DB logs show 98-webhooks.sql, 99-jwt.sql and 99-roles.sql ran, followed by baked migrations through 20260421000001_rescope_pg_graphql_access_trigger.sql. Log contains “PostgreSQL init process complete; ready for start up.” The previous missing-role error did not recur in the filtered error evidence. This establishes completion of entrypoint initialization according to logs; it does not replace a live schema/catalog audit.

Controller failed with container_configuration_or_id_changed. Exact DB ID is unchanged; its current configuration snapshot differs from the stopped receipt. Fingerprint covers Config, HostConfig and Mounts as well as identity/network names. Testing all permutations of current Mounts ordering did NOT reproduce the receipt hash, so ordering alone is not established as the explanation. No assertion of harmless metadata drift or malicious configuration change is justified by this evidence. The precise field difference remains unresolved because prior full raw inspect metadata was not retained in the receipt, only its hash and sanitized selected fields.

Do not weaken or bypass this check. Prepare a separately reviewed comparison against the sealed desired configuration and cached image defaults, accounting explicitly for Docker runtime-assigned fields and preserving all security checks. Do not rewrite receipts or retry a never-started flow against the now-initialized DB.

## Platform/authentication/catalog results

Live role/schema/extension/HBA/catalog/auth-user queries were NOT RUN: startup security gate failed first. Platform initialization logs are encouraging but required effective role/schema/extension assertions, password requirements for network clients, absence of application tables and auth users remain UNVERIFIED. No Borealis SQL/migration/seed, application RPC, test user or booking was executed. Prior authentication findings (socket/loopback trust vs network SCRAM) remain static evidence only; no authentication setting changed.

## Network and ports

Preflight verified only approved internal network borealis-local-only-isolated, ID e1a8111682ffdc13c667d86f514dbd09265802dc73ba016dec63a6fc50bcabb1, IPv6 disabled. HostConfig bindings remain DB127.0.0.1:54322→5432 and gateway127.0.0.1:54321→8000; other services have none. No wildcard bindings or extra network were introduced. Current evidence retains endpoint IDs after stop, but complete live five-service attachment, default-route, IPv4/IPv6/DNS denial and local-only listener tests were NOT REACHED. Prior probe PASS is not substituted for those checks. No production hostname/IP was used as a target.

## Evidence, preservation and corrections

Private sanitized artifacts under runtime/startup-v1: platform-startup-evidence.json, failure-analysis.json, attempt.json and status.json. Existing runtime/diagnostic-summary.json captures the controller failure summary. Original/v1/v2 receipt/state files and seals remain unchanged. No secrets/raw environment/log dump displayed. All original partial DB volumes, fresh recovery DB volumes and Storage volume are preserved.

Next required authorization: investigation/preparation only for the exact fingerprint mismatch and DB health failure, with read-only stopped-container/image/log evidence; determine a safe initialized-volume resume policy. Any controller correction/reseal, new inspection receipt, runtime database queries or subsequent startup needs separately reviewed authorization. Do not reset volumes, replace images, add privileges or relax isolation/authentication to bypass failure.

## Safe shutdown and Stage 2B

All task-owned services are already stopped. Future receipt-aware owned shutdown (not additionally run here):

```bash
env -i PATH="$PATH" HOME="$HOME" TMPDIR="${TMPDIR:-/tmp}" python3 .local/borealis-supabase/controlled-compose/runtime/startup-v1/startup.py stop --confirm STOP_RECOVERY_V2_EXACT_IDS_V1
```

This validates pinned inputs and exact ownership, preserves volumes and performs no recreate/reset. If validation fails, inspect the exact IDs and obtain reviewed correction rather than broad cleanup.

Stage 2B is blocked until fingerprint/health causes are resolved, an authorized startup passes all local platform/catalog/authentication/network checks, and separate Borealis migration compatibility review is approved. No application SQL/seeds/website or Git commit/push/merge/deployment, Netlify, production or global Docker change occurred.
