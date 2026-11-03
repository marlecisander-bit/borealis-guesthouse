# Borealis Stage 2A recovery replacement result

2026-10-19, Europe/Tirane. Canonical clone `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Overall FAIL: failed DB container removed as authorized; replacement creation failed. No DB container currently exists for this project.** Four preserved services remain created/never started; no running service, new volume, SQL or initialization. No retry, automatic recreation or corrective configuration edit occurred.

## Preflight

PASS: recovery-v1 revision hashes, original preparation seal, unchanged original ledger/receipt, exact stopped DB ID and exit3, original four created peers/configuration hashes, cached pinned ARM64 images/local credential provenance, exact internal network and no unexpected peers/project resources. Original volumes existed and fresh names were absent. No hosted-link marker or active application migration file found. Commands used credential-minimal Docker subprocess environments; production dotenv was not loaded or modified.

## Authorized operation and precise failure

Ran only recovery.py replace --confirm REPLACE_FAILED_DB_PRESERVE_VOLUMES_V1 after read-only preflight. The controller successfully removed exact failed DB ID:

`4bdc30b2124a60bf0f55dac00f295a5f0a51345456e1f4541e77e2ac047cc694`

It did not use -v. The following Compose create command failed; sanitized controller result was docker_operation_failed_compose. The reviewed controller includes --no-deps, which the installed docker compose create --help does not support. This is a controller/CLI compatibility defect missed by the earlier static/synthetic checks. No mutating command was rerun to obtain raw error output; unsupported-flag diagnosis is based on the reviewed command and read-only installed help.

New replacement DB ID: **none**. New DB/config volumes: **not created**. The replacement journal remains at approved_before_remove: it is a write-ahead intent marker, not proof the removed container still exists. Read-only Docker metadata confirms the actual four-container state. No lifecycle ledger was edited manually.

## Four preserved containers

| Service | Exact preserved ID | State |
| --- | --- | --- |
| gateway | `4c2bc800f2edd1f565d6b45795712a5b51a0c31dd7686265fa70a4cc26fd9494` | created; never started |
| storage | `d0561e270eb1a0a78fa9a60b8dd38adcd67abd9834d3a918e9235d4b3abcb54b` | created; never started |
| rest | `8949d74edb50e2d152d7fe16b6c7e78936a16c763d90dcb81d98bd8f842036d6` | created; never started |
| auth | `8ab9c783fa1bd919223176bb179841ac6acb8b7edfdb58f57f6c237356981b91` | created; never started |

Each preserved ID/configuration fingerprint matches the baseline, with Running=false and zero StartedAt. Images, environment, mounts and gateway configuration are unchanged under original/recovery seal checks. No re-inspection receipt can be issued for an incomplete five-service set.

## Volumes, bootstrap and isolation

All original named-volume resources still exist with expected local driver/project ownership:

- borealis-local-controlled_db-data
- borealis-local-controlled_db-config
- borealis-local-controlled_storage-data

No volume content was mounted, read, repaired, reset or deleted. The partial DB volumes are preserved and no replacement DB is attached to them. Future names borealis-local-controlled_db-data-recovery-v1 and borealis-local-controlled_db-config-recovery-v1 remain absent.

Official 98-webhooks.sql remains staged and checksum-verified at 05a61316b899374253891cbba66ce073d9273f33983c3f47961eda3aa26c2823; it was not mounted into a new DB or executed. Roles/JWT scripts and all five image identities remain unchanged.

Approved internal network identity remains e1a8111682ffdc13c667d86f514dbd09265802dc73ba016dec63a6fc50bcabb1. The preserved services request only borealis-local-only-isolated. Gateway retains requested 127.0.0.1:54321 →8000 binding; Auth/REST/Storage have none. DB port54322 has no project container publisher after removal. No public binding, host network, additional capability or global Docker setting was introduced. Runtime isolation/health tests were not run because startup is prohibited.

## Evidence and receipt

Sanitized evidence: runtime/recovery-v1/replacement-failure-evidence.json, mode600, includes preserved IDs/configuration hashes, volume metadata and final state. Existing replacement-journal.json is preserved. Original ledger and inspection receipt hashes and both preparation/revision seals remain unchanged. No new recovery lifecycle-state.json or inspection-receipt.json was produced. Old receipts cannot authorize startup or replacement recovery.

## Required next authorization

Authorize preparation of a new reviewed controller revision for the **post-removal** state, retaining the original four IDs and all old volumes. Correct the unsupported create flag using the installed Compose interface, explicitly prove only DB creation is possible, and add synthetic tests for installed command compatibility plus partial-operation recovery. Do not simply rerun replace: its preflight expects the now-removed old container.

After review, separately authorize creation of exactly one stopped DB and its two fresh volumes, with no further removal, followed by full five-container stopped inspection/new receipt. Startup/platform SQL remains a later separate authorization. No correction or retry is performed by this report.

No production requests/credentials, SQL/migrations/seeds, application startup/source changes, Git publication, deployment, Netlify or global Docker changes occurred.
