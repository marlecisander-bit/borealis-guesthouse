# Borealis Stage 2A startup-v2 result

2026-10-19 (Europe/Tirane), canonical clone `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Overall FAIL: all five services reached Docker healthy, but subsequent local verification failed. The controller stopped all five exact task-owned IDs; all volumes are preserved.** No retry or corrective change occurred.

## Preflight and startup

Read required fingerprint fix/investigation, recovery-v2 creation and PostgreSQL recovery reports. Startup-v2 seal/validation record and historical receipt/state hashes passed, as did exact IDs/images/configuration, OOM false/null semantics (daemon unsupported capability/cgroup2), corrected bootstrap, credential/gateway checks, expected stopped DB/never-started peers, original/recovery volumes, exact internal network and loopback ports. No hosted-link marker; migration/seed replay disabled, active migration directory empty. Production dotenv was not loaded.

Ran only sealed startup-v2 with RESUME_INITIALIZED_DB_EXACT_IDS_V2 under minimal PATH/HOME/TMPDIR. All five pinned IDs were started in DB/Auth/REST/Storage/Kong dependency order. Each reached Docker healthy before post-health verification. No image/container/volume replacement or recreation.

## Exact started IDs and final state

| Service | Exact ID started | Final state | Final exit code |
| --- | --- | --- | --- |
| db | `3a5d753746d8d1909b95831f47f11acd39160fe0ea771a08fe3ff3379fb2afe7` | exited | 0 |
| auth | `8ab9c783fa1bd919223176bb179841ac6acb8b7edfdb58f57f6c237356981b91` | exited | 0 |
| rest | `8949d74edb50e2d152d7fe16b6c7e78936a16c763d90dcb81d98bd8f842036d6` | exited | 255 |
| storage | `d0561e270eb1a0a78fa9a60b8dd38adcd67abd9834d3a918e9235d4b3abcb54b` | exited | 0 |
| gateway | `4c2bc800f2edd1f565d6b45795712a5b51a0c31dd7686265fa70a4cc26fd9494` | exited | 0 |

Final unhealthy Docker health metadata was observed after shutdown; it does not negate the earlier observed healthy state or independently diagnose the verification failure. REST exit255 is a shutdown-state observation, not proof that REST caused the failure. All Running=false confirmed.

## Verification failure and diagnostic limit

Controller output: startup_handoff_validation_failed. This generic handler masks exceptions outside its named Failure/Reject classes. Named checks such as unexpected_users_or_public_tables, egress_denial_not_demonstrated and local_api_health_failed would have produced their specific reason; no such reason was retained. An HTTP, subprocess/timeout or other unexpected exception is possible, but the exact failing subcheck cannot be established from saved sanitized evidence. No successful health-evidence.json was produced.

The failure occurred after all five service health gates, during post-health validation. Raw HTTP response bodies, SQL output or traceback were not retained by the sealed controller. Existing filtered Kong error logs did not identify a cause. Do not infer a successful catalog/network check or label the error harmless. No failed check was rerun after shutdown.

Smallest recommended next step: separately authorize investigation/preparation of stage-specific sanitized exception reporting (exception type/status/operation, never secrets/body), and review the existing local gateway/SQL/probe implementation against logs/read-only metadata. Preserve current volumes, IDs, historical receipts and attempt marker. Another startup or controller reseal requires separate reviewed authorization; do not remove the retry guard or relax security to proceed.

## Bootstrap, schema and authentication findings

PostgreSQL resumed its previously initialized recovery volume and reached healthy. Earlier corrected bootstrap completion remains supported by existing logs. Auth and Storage ran their official platform initialization as authorized. No Borealis migrations/seeds/RPCs or test users/bookings were invoked.

Required roles/schemas/extensions, effective HBA/password enforcement, network-client behavior, zero auth users and absence of Borealis rooms/bookings/application tables remain **not verified to completion**. The inherited verifier includes limited read-only auth-user/application-table counts, but successful results are not persisted before later failure; no claim of successful counts is made. Additional requested role/HBA assertions were not reached because failure mandated shutdown. Static socket/loopback trust versus network SCRAM findings remain unchanged.

## Networking and ports

Controller checked sole approved network before/after each start and after health: borealis-local-only-isolated, ID e1a8111682ffdc13c667d86f514dbd09265802dc73ba016dec63a6fc50bcabb1. Actual running NetworkID enforcement remained active. No extra/host network or public binding was introduced. HostConfig publication remains DB127.0.0.1:54322→5432 and Kong127.0.0.1:54321→8000; others publish none. All final normalized configuration snapshots match the historical receipt under the single-field rule.

End-to-end loopback API/database access and IPv4/IPv6/external-DNS denial tests were not verified to completion; no runtime isolation PASS is claimed from configuration alone. Prior internal-network probe evidence retains its bounded scope. Production reference was used only for local blocklist validation, never as a DNS/request target.

## Preservation and evidence

runtime/startup-v2/resume-result-evidence.json records exact IDs/states/exit codes, port/network metadata and normalized receipt-match booleans without credentials. attempt.json and status.json remain preserved; runtime/diagnostic-summary.json records sanitized generic failure summary. Original/v1/v2 receipts/seals and configuration were not modified. All original partial DB volumes, recovery DB-data/config volumes and Storage volume remain present; no reset/deletion/repair occurred.

## Safe shutdown and Stage 2B requirements

All five services are already stopped. Future owned-ID shutdown, if needed after separately approved execution:

```bash
env -i PATH="$PATH" HOME="$HOME" TMPDIR="${TMPDIR:-/tmp}" python3 .local/borealis-supabase/controlled-compose/runtime/startup-v2/startup.py stop --confirm STOP_RECOVERY_V2_EXACT_IDS_V2
```

This validates pinned inputs/ownership and preserves volumes; do not use prune/reset/blanket cleanup. Current attempt marker correctly prevents automatic retry, and peer states are now exited rather than never-started. A reviewed future resume policy must account for those states explicitly without manual ledger edits.

Stage 2B remains blocked: identify the post-health failure, review a sanitized diagnostic/resume revision, separately authorize exact-ID startup and complete role/schema/extension/HBA/catalog/network checks. Then independently resolve/approve application migration compatibility before any Borealis SQL or fixtures. No production requests/credentials, website, Git commit/push/merge/deployment, Netlify or global Docker changes occurred.
