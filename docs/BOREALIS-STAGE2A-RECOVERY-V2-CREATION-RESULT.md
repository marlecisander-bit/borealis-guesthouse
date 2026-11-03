# Borealis Stage 2A recovery-v2 creation result

2026-10-19 (Europe/Tirane). Canonical clone `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Overall PASS: exactly one replacement DB created stopped; all five containers passed inspection and remain created/never started.** Zero running containers. No SQL, platform initialization, application migration/seed, production request or website startup occurred.

## Preflight and execution

Recovery-v2 preflight passed: revision/v1/original preparation seals; original ledger/receipt and historical journal hashes; missing old DB; exact four preserved created peers; three original volumes present/two fresh volumes absent; no unexpected project resources or network peers. Installed Compose v5.6.0 and supported create flags verified. The reviewed DB-only model contains one service with no dependencies; cached digest-pinned ARM64 images and local credential/gateway provenance passed existing validators. No running containers or hosted-link marker found. Commands used credential-minimal environments; production dotenv was not loaded.

Only reviewed operations executed:

```text
recovery.py create --confirm CREATE_MISSING_STOPPED_DB_V2
recovery.py inspect
```

The DB-only Compose create used --pull never --no-build --no-recreate. No removal, image substitution, pull, recreation or start command ran. Historical replacement journal and original lifecycle files were not manually rewritten.

## Actual container identities

| Service | Exact container ID | State |
| --- | --- | --- |
| db | `3a5d753746d8d1909b95831f47f11acd39160fe0ea771a08fe3ff3379fb2afe7` | created; never started |
| auth | `8ab9c783fa1bd919223176bb179841ac6acb8b7edfdb58f57f6c237356981b91` | created; never started |
| rest | `8949d74edb50e2d152d7fe16b6c7e78936a16c763d90dcb81d98bd8f842036d6` | created; never started |
| storage | `d0561e270eb1a0a78fa9a60b8dd38adcd67abd9834d3a918e9235d4b3abcb54b` | created; never started |
| gateway | `4c2bc800f2edd1f565d6b45795712a5b51a0c31dd7686265fa70a4cc26fd9494` | created; never started |

All five have Running=false, zero StartedAt and unchanged reviewed image configuration. The four peer IDs match their original baseline. Configuration fingerprints and exact immutable image references are recorded in private sanitized creation-inspection-evidence.json and inspection-receipt.json; cached image architecture is linux/arm64.

## Volumes and mounts

Exactly two fresh volumes were created and attached only to the new DB:

- borealis-local-controlled_db-data-recovery-v1 → /var/lib/postgresql
- borealis-local-controlled_db-config-recovery-v1 → /etc/postgresql-custom

All three original local volumes remain present with verified project ownership/volume labels:

- borealis-local-controlled_db-data
- borealis-local-controlled_db-config
- borealis-local-controlled_storage-data

Neither original partial DB volume is attached to the replacement DB. Storage retains its original volume. No existing volume was deleted/reset/reused. No DB process initialized the new volumes. Docker-managed image filesystem population during volume creation is distinct from PostgreSQL initialization; no claim that volume directories contain zero bytes is made. Named-volume CreatedAt/driver/labels are recorded as identity evidence; Docker volumes do not expose container-style immutable IDs.

DB retains only approved read-only initialization binds and socket tmpfs. Official 98-webhooks.sql is mounted at /docker-entrypoint-initdb.d/init-scripts/98-webhooks.sql, source/hash checked against pinned upstream, SHA-256 05a61316b899374253891cbba66ce073d9273f33983c3f47961eda3aa26c2823. Roles/JWT scripts and hashes remain unchanged. No application SQL or production directories are mounted.

## Network, ports and security

All five request only borealis-local-only-isolated; independently verified network ID e1a8111682ffdc13c667d86f514dbd09265802dc73ba016dec63a6fc50bcabb1, internal=true, IPv6=false. Created containers may have empty endpoint NetworkID until startup; actual attached runtime endpoint/egress validation remains deferred. No host/secondary network, privileged mode, added capabilities, unknown environment/mounts, DNS/proxy override or host devices. All capabilities dropped, no-new-privileges retained and restart policy no.

Requested host ports: DB 127.0.0.1:54322 →5432/tcp; Kong 127.0.0.1:54321 →8000/tcp. Auth/REST/Storage publish none. No wildcard binding. Gateway copy hash, uid/gid1001/1001 and mode600 passed read-back checks. Private local credential provenance and original configuration remain unchanged; no values printed.

## New receipt and evidence

PASS receipt: runtime/recovery-v2/inspection-receipt.json, scope STOPPED_ONLY_NO_STARTUP. Receipt SHA-256 `23b583b0a449c97059afd8cc94068746227844e3f82358ea18923dbfc0467212`.

Revision fingerprint `1cfc6e397f59f5a4caec88559eeb7712461f9672b8f28adc2c6b8e484c19c7b3`.

New state: runtime/recovery-v2/lifecycle-state.json. Its phase remains created; the separate PASS receipt records successful inspection (this controller does not rewrite phase to inspected). Do not manually change the phase to make another controller accept it.

Sanitized evidence: runtime/recovery-v2/creation-inspection-evidence.json, mode600. Contains exact IDs, states/zero timestamps, config hashes, images, requested networks/ports/mounts and volume metadata. No credentials or raw environment values. The new intent journal remains preserved as a second-attempt guard. No old receipt is reused for startup.

## Discrepancies and next authorization

No stopped inspection discrepancy found. Runtime PostgreSQL/platform bootstrap, Auth/Storage migrations, Kong parsing, health, effective HBA and network egress remain untested because no service started.

Recovery-v2 intentionally has no start operation. Next authorize preparation/review of an exact-ID startup handoff that validates this new receipt and handles its scoped state without manual ledger edits, then separately authorize these five IDs' startup/platform initialization plus harmless local health/catalog/auth-user/HBA/network checks. Do not invoke original or v1 start with stale IDs/receipts. Borealis SQL/migrations/seeds, test users/bookings and website remain outside authorization.

No Git commit/push/merge/deploy, Netlify or global Docker changes occurred. Stop point: five created containers, zero running; no further operation performed.
