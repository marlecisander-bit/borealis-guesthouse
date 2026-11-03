# Borealis Stage 2A startup-v4 result

2026-10-20 (Europe/Tirane), canonical clone `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Overall FAIL: loopback Auth API connectivity failed. All five exact task-owned containers were stopped safely; all original/recovery volumes preserved. One authorized attempt only, no retry or corrective change.**

## Preflight and execution

Read required DNS/startup-v3/diagnostic/fingerprint-fix reports. Sealed startup-v4 preflight passed: code/validation hashes, historical recovery-v2 receipt/state, exact exited IDs, cached pinned images, unchanged canonical configurations, corrected official bootstrap, local credential/gateway provenance, original/recovery volumes, internal network identity, loopback bindings and free host ports. No hosted-link marker; application migration/seed replay disabled, active migrations empty. Reviewed OOM and three-field DNS canonicalization remained in force; no unrelated normalization. Minimal environment used; production dotenv not loaded.

Ran only startup-v4 start --confirm RESUME_DNS_CANONICAL_EXACT_IDS_V4. All five existing IDs started in dependency order and reached Docker healthy; no creation/recreation/pull/reset/configuration change. The verifier then stopped at its first failed stage and the controller stopped only owned IDs.

## Exact IDs and final states

| Service | ID started | Final state | Exit code after shutdown |
| --- | --- | --- | --- |
| db | `3a5d753746d8d1909b95831f47f11acd39160fe0ea771a08fe3ff3379fb2afe7` | exited | 0 |
| auth | `8ab9c783fa1bd919223176bb179841ac6acb8b7edfdb58f57f6c237356981b91` | exited | 0 |
| rest | `8949d74edb50e2d152d7fe16b6c7e78936a16c763d90dcb81d98bd8f842036d6` | exited | 255 |
| storage | `d0561e270eb1a0a78fa9a60b8dd38adcd67abd9834d3a918e9235d4b3abcb54b` | exited | 0 |
| gateway | `4c2bc800f2edd1f565d6b45795712a5b51a0c31dd7686265fa70a4cc26fd9494` | exited | 0 |

Final exit codes/health metadata reflect shutdown and are not attributed as the failure cause. All Running=false confirmed; canonical receipt comparisons still match for every container.

## Per-stage evidence

| Stage | Result | Elapsed ms | Failure classification |
| --- | --- | --- | --- |
| runtime_configuration | PASS | 6397 | — |
| all_service_health | PASS | 0 | — |
| empty_catalog | PASS | 3073 | — |
| auth_http | FAIL | 7 | connection |

Exact failing stage: auth_http, category http_loopback, exception URLError, classification connection, safe numeric code null. GET target was the fixed approved localhost API Auth-health path, not production. Failure occurred before any HTTP response/status was obtained. The classifier does not retain an underlying errno/reason, so connection-refused versus other transport details cannot be established from the artifact. No response body/headers/tokens or raw exception string recorded.

This locates the failure at host-loopback access to Kong/Auth routing; it does not show Auth's internal health failed. All five Docker health checks passed. A Docker internal-network publishing issue, host forwarding/listener or transport policy issue is possible; no cause is asserted without evidence. Do not disable isolation or add public networking to test a hypothesis. No live request was repeated after shutdown.

Artifacts: runtime/startup-v4/verification-stages.json and final-result-evidence.json; attempt/status and existing sanitized diagnostic summary preserved. Generic final CLI message does not replace the precise per-stage URLError evidence.

## Requested check decisions

| Check | Decision |
| --- | --- |
| PostgreSQL health | PASS before verification failure |
| Auth health | PASS via Docker health |
| REST health | PASS via Docker health |
| Storage health | PASS via Docker health |
| Kong health | PASS via Docker health |
| Loopback API connectivity | FAIL at Auth-health request |
| Loopback database TCP connectivity | NOT VERIFIED |
| Known Borealis tables / rooms / bookings | PASS: blocklisted public application table count0 |
| Auth users | PASS: auth.users count0 |
| Other application records / complete schema inventory | NOT VERIFIED beyond known-table count |
| Required platform roles | NOT VERIFIED |
| Required schemas/extensions | NOT VERIFIED beyond auth.users query |
| Effective HBA/password enforcement | NOT VERIFIED |
| Sole approved actual running network | PASS during runtime_configuration |
| No host/secondary network | PASS during runtime_configuration |
| Loopback-only host publications | PASS configured HostConfig bindings |
| External IPv4/IPv6 denial | NOT VERIFIED; stages not reached |
| External DNS denial | NOT VERIFIED; stage not reached |
| Unexpected proxy/custom DNS/gateway config | PASS sealed configuration checks; full host-gateway path denial NOT VERIFIED |

The empty-catalog stage executed only read-only SELECT counts and required exact 0|0. It does not establish absence of arbitrary unknown application tables or every possible data record. No application RPC, Borealis migration/seed, booking or test-user creation ran. Official platform service initialization was permitted; broader platform inventory assertions were not reached because failure required shutdown.

## Network and security

Approved internal network borealis-local-only-isolated, ID e1a8111682ffdc13c667d86f514dbd09265802dc73ba016dec63a6fc50bcabb1, remained sole actual network for all running services. HostConfig binds only DB127.0.0.1:54322→5432 and Kong127.0.0.1:54321→8000; others publish none. HostConfig publishing is not proof of successful host connectivity, as this failure demonstrates. No security rule was relaxed. Previous probe denial evidence is not substituted for skipped runtime probes.

## Remaining blockers and Stage 2B

Stage 2B **NOT READY**. Separately authorize read-only investigation/preparation focused on host-to-internal-network loopback publication and gateway listener/routing/transport evidence, optionally improve safe errno reporting without logging raw exception text. Do not start services or retry within that investigation. A later controller/configuration change and another startup each require reviewed authorization; historical attempt markers remain intact. Required role/schema/extension/HBA/password and remaining network checks must be completed after safe connectivity works.

All five are already stopped. Future owned shutdown, if needed after separately approved execution:

```bash
env -i PATH="$PATH" HOME="$HOME" TMPDIR="${TMPDIR:-/tmp}" python3 .local/borealis-supabase/controlled-compose/runtime/startup-v4/startup.py stop --confirm STOP_DNS_CANONICAL_EXACT_IDS_V4
```

Preserves volumes and checks exact ownership; no prune/reset/delete. No production access/credentials, website, Git commit/push/merge/deployment, Netlify or global Docker change occurred.
