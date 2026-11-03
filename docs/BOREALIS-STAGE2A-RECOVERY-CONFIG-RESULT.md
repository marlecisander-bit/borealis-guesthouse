# Borealis Stage 2A recovery configuration result

Verified 2026-10-19 (Europe/Tirane), canonical clone `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Preparation PASS; revision not activated.** No Docker resource mutation, SQL, volume mount/initialization, image download, application change or production request occurred. DB remains exited3; other four services remain created/never started. All existing volumes remain preserved.

## Revision and provenance

Separate owner-only directory: `.local/borealis-supabase/controlled-compose/runtime/recovery-v1/`.

- compose.resolved.json: private local-secret-bearing revised proposal, mode600.
- 98-webhooks.sql: byte-identical to the staged proposal AND pinned official source at Supabase self-hosted/v0.8.3 commit bc27d2661edd09a5d0b8d76ce33da6d4071a756e, SHA-256 `05a61316b899374253891cbba66ce073d9273f33983c3f47961eda3aa26c2823`.
- baseline.json: original IDs/configuration fingerprints and original ledger/receipt hashes; no secret values.
- recovery.py: separately gated recovery lifecycle; no operation executed except read-only preflight.
- revision.lock.json: hashes of revision configuration, bootstrap, baseline and controller, status PREPARED_NOT_ACTIVE. This local seal detects drift; it is not protection against a malicious host administrator.
- test_recovery.py: synthetic validation tests; no resource mutations.

Official source reference: [webhooks.sql](https://github.com/supabase/supabase/blob/bc27d2661edd09a5d0b8d76ce33da6d4071a756e/docker/volumes/db/webhooks.sql). No SQL semantics changed. The new bind mounts this file read-only at /docker-entrypoint-initdb.d/init-scripts/98-webhooks.sql with create_host_path=false. Baked initial-schema/Auth/Storage/post-setup files precede it; 99-jwt.sql and 99-roles.sql follow. Existing roles/JWT files, all five image digests, credentials and the other four service definitions are byte-equivalent in configuration values to the original. Original Borealis SQL/migrations and production .env.local were untouched.

Expected platform effects are pg_net, supabase_functions schema/tables, platform migration-marker rows, HTTP trigger helper, supabase_functions_admin and its grants/ownership, and extension grant event-trigger behavior. No application webhook trigger or external destination is supplied. The later baked image migration phase must still complete successfully at future initialization. Full runtime compatibility remains unproven.

## Volumes and network

New proposed volumes (NOT CREATED):

- borealis-local-controlled_db-data-recovery-v1
- borealis-local-controlled_db-config-recovery-v1

Existing preserved volumes:

- borealis-local-controlled_db-data — partial data, never reused in revision.
- borealis-local-controlled_db-config — partial generated configuration, never reused in revision.
- borealis-local-controlled_storage-data — retained unchanged for Storage.

The original two DB volume declarations are absent from the revised Compose document; fresh logical volume keys are db-data-recovery-v1 and db-config-recovery-v1. Old volumes remain Docker-managed resources outside this revised declaration. No volume removal operation is implemented. Replacement refuses if proposed fresh volumes already exist, rather than risk reusing initialized data.

Exact approved network remains borealis-local-only-isolated, ID e1a8111682ffdc13c667d86f514dbd09265802dc73ba016dec63a6fc50bcabb1; internal=true, IPv6=false. Only 127.0.0.1:54322 DB and 127.0.0.1:54321 gateway publication remain. No capability, user, restart, host namespace, DNS, authentication or network restriction was loosened.

## Recovery controller behavior

The revision imports the unchanged existing lifecycle/inspection implementation and verifies its original preparation seal before its own revision seal. It requires the original ledger/receipt hashes to remain unchanged. The original lifecycle ledger is never edited by this recovery path; new state and receipt reside only in recovery-v1. Future mutation operations use the same controller lock to exclude concurrent controller operations.

- preflight: read-only checks, exact failed DB/exited3, untouched created peers, baseline fingerprints, no unexpected network peers and revision provenance.
- replace: requires REPLACE_FAILED_DB_PRESERVE_VOLUMES_V1. Rechecks exact five project resources, old-volume existence and fresh-volume absence; journals intent; removes only the exact old DB container without -v; creates DB only via Compose create --pull never --no-build --no-recreate --no-deps db. Does not execute any process. Checks replacement identity and unchanged four peer IDs; records new revision ledger, never original ledger. A failure preserves resources/journal for review; no cleanup/reset/retry is automatic.
- inspect: existing stopped-container inspector applied to revised configuration, including new mount/volumes and gateway read-back; writes a NEW revision inspection receipt for all five IDs.
- start: requires START_RECOVERY_V1_INSPECTED_IDS plus new matching receipt/seal/IDs; then delegates exact-ID dependency-ordered startup and local verification to the existing lifecycle controller. Original receipt is not accepted. Startup is NOT authorized or tested in this preparation.
- stop: requires STOP_RECOVERY_V1_OWNED_IDS; uses only revision-ledger task-owned IDs and preserves volumes.

No automatic startup, image pulls or recreate-capable command follows inspection. Auth/REST/Storage/Kong are retained; only DB replacement is contemplated. A later broad change requires a new review rather than expanding this revision silently.

## Verification results

PASS: five unittest methods, including eight unsafe configuration variants, SQL provenance/order, stale-receipt rejection, and no-confirm replace/start/stop rejection with Docker calls forbidden. Unsafe variants cover wildcard publication, privileged mode, image substitution, host networking, old data-volume reuse, external proxy, hosted production endpoint and automatic restart. Exact-whitelist comparison additionally rejects ANY unapproved configuration difference, including credentials/extra networks.

PASS: read-only revision preflight using cached images, original seal, gateway/local credential checks, exact existing network and baseline stopped-container fingerprints. PASS: Compose config JSON parse with explicit project directory, --env-file /dev/null and minimal environment; resolved secret-bearing output was captured privately and not displayed.

Original preparation fingerprint remains e29b2b05d9dbf686a192b04fa037bc1ead74deeace068c7b8c27bd33d59b0091. Original state/receipt hash preservation is an enforced preflight gate. Revised live create/inspect/start behavior is not runtime-tested because mutations are excluded; synthetic tests establish rejection behavior, not successful infrastructure recovery.

## Trust authentication and remaining risks

Recovery plan findings remain: baked HBA trusts supabase_admin over Unix sockets, uses peer mapping for other socket users, trusts container-loopback TCP and requires SCRAM for network TCP. No HBA/entrypoint/authentication setting changes were made. Future runtime checks must verify effective HBA/includes/client addresses; host loopback publishing is not proof of container-loopback authentication behavior.

Restoring the full official file enables HTTP-capable platform helpers, which must remain behind unchanged container egress denial. Runtime bootstrap, pg_net/event-trigger compatibility and later migrations remain unverified. No correction may bypass these gates with public networking, added privileges or different images. Docker daemon access by unrelated clients remains a TOCTOU trust boundary.

Failure between removal and replacement can leave no DB container or partial newly created resources; the journal and all volumes must be preserved, with separate recovery review. No automatic rollback is safe in that case. Do not rerun replace or edit ledger manually. Old receipt remains historical; new configuration cannot inherit its startup approval.

## Exact next authorization

Authorize only this sealed recovery-v1 stopped replacement trial: remove exact failed stopped DB ID 4bdc30b2124a60bf0f55dac00f295a5f0a51345456e1f4541e77e2ac047cc694 without volume deletion; create one stopped DB using the two named fresh volumes and official bootstrap mount; preserve the four existing IDs, all old volumes and credentials; run stopped inspection and produce the new revision receipt/report. No startup, SQL or volume initialization is included.

After a reviewed stopped-inspection PASS, separately authorize startup/platform initialization and harmless local health/catalog/HBA/network checks of those exact IDs. Stage 2B Borealis SQL/seeds and the website remain separately blocked. No Git publication, Netlify or global Docker operation is included.
