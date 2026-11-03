# Borealis Stage 2A post-removal hotfix result

2026-10-19 (Europe/Tirane). Canonical clone `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Preparation PASS. No infrastructure mutation executed.** Original failed DB is absent; exactly four project containers remain created/never started. All three original volumes exist; both proposed recovery-v1 DB volumes remain absent. Docker inspection found no running containers or attached network peers. The failed replacement produced no DB process, SQL or platform initialization; earlier failed initial-start platform effects remain confined to the preserved old volumes.

## Mechanism and compatibility

Installed Docker Compose v5.6.0 create --help supports --pull never, --no-build and --no-recreate; it does not support --no-deps. Removing that flag from the full five-service model was not accepted as a sufficient safety guarantee.

New separate model runtime/recovery-v2/db-only.compose.json contains exactly one service, db, with no depends_on, extends or included models. Its only volume declarations are the two fresh recovery-v1 DB volumes. Other service definitions and Storage volume are absent. An actual read-only Compose config parse confirms the resulting model has exactly the db service.

The future reviewed command is:

```text
docker compose --project-directory <controlled-compose> --env-file /dev/null -f <recovery-v2/db-only.compose.json> create --pull never --no-build --no-recreate db
```

It has no up/run/start, dependency service, remove-orphans or force-recreate path. Existing four containers are outside this model; orphan containers are not removed. Current cached DB image declares no other service dependency. The model preserves DB name/project labels so the existing internal hostname remains consistent. Actual creation remains untested and requires separate approval; no Docker API alternative is needed for this strictly single-service model.

## Revision and controller

Separate ignored owner-only runtime/recovery-v2 directory contains recovery.py, db-only.compose.json (local secrets, mode600), baseline.json, revision.lock.json and test_hotfix.py. Existing recovery-v1 controller/seal, historical replacement journal, original ledger and receipts were not rewritten.

The new controller verifies original and v1 seals, original ledger/receipt hashes, and the preserved journal hash before its own revision. It admits only the exact DB-only projection of the already approved recovery-v1 configuration. Thus images, credentials, 98-webhooks script, role/JWT scripts, internal network, localhost publication, users, capabilities and other security settings cannot drift silently.

Operations:

- preflight: recognizes missing old DB and exact four unchanged created peers; checks old volumes exist, fresh volumes absent, no unexpected project resources or peers. No removal command exists.
- create: requires new token CREATE_MISSING_STOPPED_DB_V2. Writes a new v2 intent journal before creation; any existing v2 journal/state rejects a second attempt. Creates DB only, checks five never-started IDs and original-volume existence, and writes separate v2 state. Failures preserve journal/resources without automatic retry or cleanup.
- inspect: applies the existing full five-service stopped inspector against approved recovery-v1 configuration, verifies gateway and preserved peer IDs, then writes a new v2 receipt scoped STOPPED_ONLY_NO_STARTUP.

There is **no start operation**. Neither old nor new receipts enable automatic startup. A separate reviewed startup handoff remains required. Historical v1 lifecycle state is not manually edited; future v2 state is written only by its controller operation.

## Preserved identities

| Service | Unchanged container ID |
| --- | --- |
| Auth | 8ab9c783fa1bd919223176bb179841ac6acb8b7edfdb58f57f6c237356981b91 |
| REST | 8949d74edb50e2d152d7fe16b6c7e78936a16c763d90dcb81d98bd8f842036d6 |
| Storage | d0561e270eb1a0a78fa9a60b8dd38adcd67abd9834d3a918e9235d4b3abcb54b |
| Kong | 4c2bc800f2edd1f565d6b45795712a5b51a0c31dd7686265fa70a4cc26fd9494 |

Old volumes preserved: borealis-local-controlled_db-data, borealis-local-controlled_db-config, borealis-local-controlled_storage-data. New volumes remain absent: borealis-local-controlled_db-data-recovery-v1 and borealis-local-controlled_db-config-recovery-v1.

Approved network remains borealis-local-only-isolated, exact ID e1a8111682ffdc13c667d86f514dbd09265802dc73ba016dec63a6fc50bcabb1, internal/IPv6-disabled with loopback binding default. DB-only proposal retains 127.0.0.1:54322; preserved Kong retains 127.0.0.1:54321. No authentication/network/capability setting was loosened.

## Non-mutating regression results

PASS: six unittest methods covering exact single-service command/model, six unsafe model variants (public port, privilege, image substitution, host networking, old volume reuse, added Auth service), no-confirm creation rejection with Docker calls forbidden, stale-receipt rejection, actual post-removal baseline plus missing-peer/missing-old-volume/fresh-volume-present rejection, and second-attempt journal rejection.

PASS: installed create help compatibility, actual read-only Compose parse with only db resolved, and full read-only hotfix preflight. No create dry-run or live mutation was used as a test. Creation-success/partial-failure runtime behavior remains unexercised; tests establish model restriction/rejection behavior, not a runtime recovery PASS. All image and local-secret checks reuse sealed existing provenance without printing values.

## Hashes

- recovery.py: `46ec75216f82b3fc3a375523f8ea173d43a5f71f98a9ae4ffd495b9d7e00c7e0`
- db-only.compose.json: `a0349cd021284bbacaa7a1fc7e75baf8448db728a445cde4abcea0b1cae12157`
- baseline.json: `1c0e0784822c5c5c07112bcfb2f463cba2c69d4d5aabedf2cd11c148e110deff`

Revision seal SHA-256: `335102fb47098ea071ef7d332db54b61a9899a2f7efbf48cdd17d07fab375899`.

## Remaining risks and next authorization

Docker daemon access by unrelated processes remains a TOCTOU boundary. The controller serializes with the existing controller lock and rechecks resources, but does not modify daemon policy. A failed creation may leave fresh volumes or a stopped container; its intent journal then forbids another automatic attempt. Preserve all such resources and request review. Runtime bootstrap/health/authentication/egress remain untested; existing trust-authentication findings and network restrictions are unchanged.

Authorize only recovery-v2 create with CREATE_MISSING_STOPPED_DB_V2: create exactly one stopped DB and its two named fresh volumes, preserve all four peer IDs/old volumes, then run recovery-v2 inspect and issue a new stopped receipt/report. No removal, startup or SQL is included. Startup needs a separate reviewed handoff and explicit authorization after inspection PASS.

No production access, app SQL/seeds/website, source changes, Git publication, deployment, Netlify or global Docker changes occurred. Stop point: preparation only; DB remains absent.
