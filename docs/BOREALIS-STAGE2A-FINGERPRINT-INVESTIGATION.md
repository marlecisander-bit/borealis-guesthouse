# Borealis Stage 2A fingerprint investigation

2026-10-19 (Europe/Tirane), canonical clone `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Exact fingerprint cause identified; inactive normalization proposal prepared. No restart authorized or performed.** All five exact IDs remain stopped; DB exited0 after controller shutdown, other four created/never started. All three original and both recovery volumes remain present. Approved internal network identity unchanged; no attached peers or running services. No hosted-link marker found; sealed local credential provenance checks passed without production dotenv access.

## Exact differing field and proof

`HostConfig.OomKillDisable`: stopped-receipt input **false**, current post-start input **null**.

Replacing only the current null with false reproduces the exact original stopped DB receipt SHA-256 `748ab33e8522d66ad47b1491d822deaef4f214b02c6c87aa63a388d9c23a15fb`. Current unnormalized fingerprint is `e3f39045d196bbe92e4de281108e2f426e9fa6b3ed0f5fb4fdcc40d27ec61d41`. Mount array order is identical. This is cryptographic reconstruction of the historical comparison input, not a guess based on an unrelated container.

No other fingerprint-covered field needs alteration: exact ID/image, Config (including command, entrypoint, environment and ownership labels), remaining HostConfig (ports, security/capabilities, restart, namespaces, requested network and mounts) and full Mounts metadata reconstruct the prior hash unchanged.

The snapshot intentionally excludes State/health/timestamps and runtime IP/endpoint values; NetworkSettings contributes only sorted network names. Separate controller checks require actual connected NetworkID for running containers. Endpoint allocation, health status and timestamps therefore did not cause this hash failure. Current final network/port metadata remains available in prior startup evidence; no broader runtime-isolation PASS is claimed.

## Classification and security implications

| Field/change | Class | Finding |
| --- | --- | --- |
| OomKillDisable false → null | A: runtime representation change | Explicit false became unset/null after start; neither requests OOM-kill disabling. Fingerprinting treated representation as drift. Exact Docker-internal conversion site is not established. |
| State/timestamps/health/endpoint allocation | A: expected lifecycle metadata | Outside snapshot; did not cause mismatch. Running network identity still requires separate checks. |
| All other snapshot inputs | No demonstrated drift | Exact receipt reconstructed without changing them. |
| Last unhealthy Docker health state | D: unresolved health evidence | Separate from fingerprint cause; no successful readiness/catalog checks established. |

This is a narrowly identified controller comparison defect. Do not generalize null/empty equivalence to arbitrary fields or disregard OOM policy changes: true must remain rejected. No evidence supports a security configuration deviation in fingerprint-covered settings. Runtime routing/egress and effective DB authentication remain unverified.

## PostgreSQL bootstrap evidence

Existing logs show the official corrected 98-webhooks, JWT and roles scripts, followed by baked platform migrations through 20260421000001_rescope_pg_graphql_access_trigger.sql, and the init-process-complete marker. Filtered existing log evidence contains zero ERROR:/FATAL: markers; absence of those markers is not proof of full database health. Auth/REST/Storage/Kong never ran.

The reviewed entrypoint skips initialization when PGDATA/PG_VERSION exists. Completed initdb/bootstrap strongly indicates the recovery volume is initialized and a future start should skip initial scripts. The marker was not directly inspected: no volume mount or database query occurred. Never restart by pretending DB is still never-started, and do not reset a successfully initialized volume merely to satisfy the old state gate.

Future separately authorized read-only checks must establish DB readiness, active HBA/includes/client address and password requirements, roles/grants/auth/storage/public/supabase_functions schemas, pg_net/required extensions, empty auth.users and application catalog, then remaining service health and gateway connectivity plus runtime IPv4/IPv6/DNS/default-route isolation. Health-check command output should also be investigated privately before declaring the recorded unhealthy state benign.

## Minimal inactive correction

New separate ignored owner-readable `runtime/fingerprint-v1-proposal/` contains normalize.py, test_normalize.py, private current-inputs evidence, sanitized evidence.json and proposal.lock.json. No existing controller, seal, ledger or receipt was changed.

normalize.py preserves the original full snapshot inputs and canonicalizes **only** OomKillDisable null/false to false, rejecting true and wrong types. Exact expected Config/HostConfig field sets reject unknown/missing fields. All other values compare exactly. It contains no Docker call, startup operation or receipt writer. Runtime endpoint/actual network/egress checks remain required separately; ignoring runtime-only fields in a fingerprint is not sufficient network validation.

The proposal is not installed into startup-v1 and does not authorize receipt reissuance. A future reviewed version must bind the normalized full private baseline and known field schema, verify old hash reconstruction/provenance, preserve all strict live checks and define an initialized-but-stopped DB resume state. Unknown differences must still fail closed. Historical receipts remain historical; issue a new scoped receipt only after complete read-only inspection under the revised policy. Never edit existing receipt hashes in place.

## Tests and provenance

PASS: Python syntax validation and five non-mutating test methods. Tests cover false/null equivalence, state/health/timestamp and endpoint/IP assignment transitions, nine security variants (image, extra network, wildcard host port, privileged mode, mount flag, credential/environment, OOM-disable true, unknown Config field, unknown HostConfig field), tampered expected fingerprint, and existing no-confirm startup rejection with Docker calls forbidden. Separate running NetworkID enforcement remains in the existing sealed startup controller; the isolated normalization function alone is not a replacement for that enforcement.

Exact reconstruction and current-state checks used read-only Docker inspect/cp-independent metadata/log access; no SQL, database-volume mount, container operation or live egress test occurred. Private captured full inspect inputs include local environment secrets and must not be pasted; mode600, directory700 and existing Git ignore rules apply. Sanitized report/evidence contain no values.

Proposal hashes:

- normalize.py: `5b1e5acdb573a9d2befe3bb685b614e7259d5b2dd18c066a5bf60feb9c8d86b4`
- test_normalize.py: `747bc6626e3b61a14d0dc494f73ba0613d56b6429ceb2eddf7da1d714b3e5c5c`
- evidence.json: `8f8c0ebb9f73617e6d07bfd275b7b2757214d38730ad18f811204f7b892ef0dd`
- current-inputs.private.json: `3bdcb8b47b2ac6eb2186f55fa919b9106c27c29d4967a8fe4f2fd32a2f68f9d9`

## Preservation and next authorization

DB ID remains 3a5d753746d8d1909b95831f47f11acd39160fe0ea771a08fe3ff3379fb2afe7; original Auth/REST/Storage/Kong IDs match the recovery-v2 receipt. No resource/volume/configuration was altered. Original preparation/v1/v2/startup seals and receipts remain preserved.

Next authorize preparation of a versioned normalized startup/resume controller, new read-only inspection and scoped receipt, and investigation of existing health output. Require explicit initialized-volume resume gates and immutable IDs, no recreation/reset, network/port/security/credential checks and failure-stop handling. Then separately authorize exact-ID restart/platform health/catalog/authentication/isolation checks. No restart or configuration activation is included here.

No production access, Borealis migrations/seeds, website, Git publication, Netlify or global Docker changes occurred. Stop point: all containers stopped; proposal inactive.
