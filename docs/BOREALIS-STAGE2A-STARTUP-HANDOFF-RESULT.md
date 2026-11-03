# Borealis Stage 2A startup handoff result

2026-10-19 (Europe/Tirane). Canonical clone `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Preparation PASS. No startup or SQL executed.** All five exact approved containers remain created/never started. Current images, bootstrap mounts, fresh DB volumes, preserved partial volumes, local credential provenance, gateway and network checks passed. No hosted-link marker found; production dotenv remains untouched.

## Current state and receipt

| Service | Exact ID | State |
| --- | --- | --- |
| db | `3a5d753746d8d1909b95831f47f11acd39160fe0ea771a08fe3ff3379fb2afe7` | created; never started |
| auth | `8ab9c783fa1bd919223176bb179841ac6acb8b7edfdb58f57f6c237356981b91` | created; never started |
| rest | `8949d74edb50e2d152d7fe16b6c7e78936a16c763d90dcb81d98bd8f842036d6` | created; never started |
| storage | `d0561e270eb1a0a78fa9a60b8dd38adcd67abd9834d3a918e9235d4b3abcb54b` | created; never started |
| gateway | `4c2bc800f2edd1f565d6b45795712a5b51a0c31dd7686265fa70a4cc26fd9494` | created; never started |

Recovery-v2 receipt SHA-256: `23b583b0a449c97059afd8cc94068746227844e3f82358ea18923dbfc0467212`.

Recovery-v2 state SHA-256: `67b578c66b82bc12a679dff8ee6dc2ee711ac2c1f194dbeb9120d24a14dae3e3`.

Receipt IDs, configuration snapshots and preparation fingerprint match. Its STOPPED_ONLY_NO_STARTUP scope and state phase created remain unchanged; this new handoff treats that receipt only as inspected-configuration evidence, never as execution authorization. Original/v1/v2 seals and historical ledgers/receipts were not modified.

## Prepared controller

Separate owner-only ignored directory: runtime/startup-v1. Files: startup.py, handoff.json, startup.lock.json and test_startup.py. No existing controller was rewritten.

The startup seal binds the controller and handoff baseline. Handoff pins exact recovery-v2 receipt/state byte hashes and five IDs; transitive validation verifies original/v1/v2 preparation seals, bootstrap, images, gateway and local secrets. Before startup it reruns the full actual stopped-container inspector and checks free loopback ports. Before and after each exact-ID start and health wait it revalidates fingerprints, network identity/attachments, ports and ownership. No recreate/replace/Compose up/run operation exists.

Future dependency order is DB → Auth → REST → Storage → Kong, with local Docker health gates between starts. Actual running endpoints must match the approved network ID; no host/secondary network, public host publication, environment/proxy drift or unexpected network peer is accepted. Runtime environment endpoint scanning supplements sealed full configuration snapshots; informational upstream image labels are not treated as network requests.

An owner-only attempt marker is written before the first start. Any later start attempt rejects that marker, including after failure. No automatic retry occurs. Failure captures sanitized status/exit/health/network summaries via the existing diagnostic routine, then stops only freshly ownership-checked ledger IDs, in reverse dependency order, preserving all volumes. Separate status files are written under startup-v1; historical lifecycle state is never edited.

After health passes, the controller delegates existing reviewed local health/catalog/egress checks with recovery-v2 inputs and the new ownership-only stop handler. This future operation includes read-only local auth-user/application-table counts, local gateway Auth/Storage responses, internal DNS positive control and documentation-address IPv4/IPv6/external-DNS denial tests. It does not mount/apply Borealis SQL or execute application RPCs. These checks were not executed in this preparation.

## Validation

PASS: Python AST syntax validation and seven unittest methods. Tests cover real read-only stopped preflight, synthetic ID/network/public-port/production-endpoint changes, receipt/hash tampering, no-confirm startup with Docker calls forbidden, simulated five-ID ordered success, simulated first-health failure with exactly one start/no retry and owned-stop invocation, and attempt-marker retry rejection. All simulated startup/health/stop/save paths were mocked; a success line printed by the simulated test is not a claim that live services started.

Initial tests caught an endpoint-scan false positive caused by informational image labels. The new controller was corrected to scan runtime environment values, retaining full fingerprint validation; its new seal was updated and all tests rerun successfully. No existing seal/security restriction was changed.

Final real read-only preflight PASS; five created/zero-started states reconfirmed. No container start/stop/creation/removal, SQL, migration, seed, website, production request, Git publication, Netlify or global Docker change occurred.

## Hashes

- startup.py: `cefddf5a026bab7062b875a9c2fcce9636e5890a53ce63cf3ee0859e0b44da47`
- handoff.json: `230c8d614a9e09b213737e7b56317fa8922e31f02208f84fa32e217a8c3c582e` 

## Remaining risks

Runtime bootstrap and pg_net compatibility, Auth/Storage platform evolution, Kong parsing, effective HBA and service-container egress remain untested. A local hash seal detects accidental drift but is not a hostile-administrator boundary. Unrelated Docker clients remain a TOCTOU risk despite controller serialization/rechecks. If the controller process is forcibly killed, automatic cleanup cannot be guaranteed; use the explicit owned-ID shutdown after inspection. Stop failures are surfaced, never replaced with broad cleanup. Preserve diagnostics/volumes and review failures; do not reset or weaken network/authentication/capability restrictions.

The inherited health/catalog/isolation suite has the scope documented above; it is not a complete hosted-feature, database-role or HBA audit. Additional assertions beyond that suite should be prepared/reviewed before claiming those broader properties. Existing Google Fonts/app-launcher and application migration conflicts remain outside this handoff.

## Exact future authorization and shutdown

Separately authorize startup of only the five IDs above through startup.py start --confirm START_RECOVERY_V2_EXACT_IDS_V1, including required local Supabase PLATFORM initialization and harmless local health/catalog/network checks, with safe owned-ID stop on failure. This report does not authorize execution. No Borealis SQL, seeds, test users/bookings or website is included.

After such authorization, use a minimal environment and canonical repository directory. Safe future shutdown command (not run):

```bash
env -i PATH="$PATH" HOME="$HOME" TMPDIR="${TMPDIR:-/tmp}" python3 .local/borealis-supabase/controlled-compose/runtime/startup-v1/startup.py stop --confirm STOP_RECOVERY_V2_EXACT_IDS_V1
```

It validates pinned inputs, rechecks ownership before each exact-ID stop and preserves all volumes. Do not use prune/reset/Compose down/old-controller startup. If drift prevents safe shutdown validation, inspect exact task identities and obtain reviewed corrective action; do not bypass gates.

Stop point: handoff prepared and tested; all services remain never started.
