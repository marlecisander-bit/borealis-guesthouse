# Borealis Stage 2A PostgreSQL recovery plan

2026-10-19, Europe/Tirane. Canonical clone: `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Investigation/preparation complete. Recovery not executed.** All five containers remain stopped. Existing partial volumes, sealed configuration and receipt are unchanged. No SQL, volume mount, repair/reset/deletion, container creation/recreation/start, image download, production access or application change occurred.

## Root cause and upstream evidence

The reduced configuration omitted webhooks.sql but retained roles.sql. In the pinned official release self-hosted/v0.8.3, commit bc27d2661edd09a5d0b8d76ce33da6d4071a756e, webhooks.sql creates supabase_functions_admin with NOINHERIT CREATEROLE LOGIN NOREPLICATION, assigns its schema/function ownership and grants, and grants membership to postgres. roles.sql line7 then changes this role's password. The selected image does not supply this role before that statement, as demonstrated by the failure.

Official [webhooks.sql](https://github.com/supabase/supabase/blob/bc27d2661edd09a5d0b8d76ce33da6d4071a756e/docker/volumes/db/webhooks.sql) and [release Compose mounts](https://github.com/supabase/supabase/blob/bc27d2661edd09a5d0b8d76ce33da6d4071a756e/docker/docker-compose.yml) establish the dependency: mount webhooks.sql as init-scripts/98-webhooks.sql before init-scripts/99-roles.sql. Treating all webhook platform initialization as optional while keeping its role consumer was a preparation error.

This is one confirmed missing dependency, plus a broader incomplete initialization state: the failure prevented the entire later image migrations phase. It does not prove that another missing dependency will not appear at runtime.

## Correct order and missing dependencies

Read-only extraction of the stopped DB container's baked migrate.sh confirms set -eu, ON_ERROR_STOP and glob-ordered execution:

1. Entrypoint creates an empty cluster and temporary socket-only server.
2. migrate.sh establishes the postgres role, then runs init-scripts/*.sql as postgres.
3. Observed logs reached 00-schema.sql, initial-schema, auth-schema, storage-schema and post-setup, then 99-jwt.sql and 99-roles.sql. Proposed 98-webhooks.sql belongs after the baked initial scripts and before both 99 files; lexical order places 99-jwt before 99-roles.
4. After successful init scripts, migrate.sh sets the supabase_admin password and runs migrations/*.sql as supabase_admin, including baked permission/extension/role adjustments and postgres demotion. This phase was not reached.
5. Optional /etc/postgresql.schema.sql and statistics reset follow. Auth and Storage service-owned platform migrations occur only on their later startup.

The omitted upstream file supplies pg_net, supabase_functions schema, migration-marker/hooks tables, HTTP trigger helper, role ownership/grants, and pg_net extension event-trigger/grant behavior. A role-only guess is less faithful than restoring the release file. Staged full file creates no application webhook trigger or external destination; it does enable HTTP-capable platform helpers, so network denial remains essential. Platform marker INSERTs and role DDL are expected on future authorized initialization, not Borealis seed operations.

Baked inventory identifies initial auth/storage schemas and roles, anon/authenticated/service_role/authenticator and extension controls. Complete effective grants/extensions remain unverified until fresh startup and read-only assertions. Omitted _supabase/logs/pooler/realtime release overrides correspond to excluded services; do not add them blindly. Baked Realtime-related migrations may still run without a Realtime service. No extra service/image is proposed.

## Trust-authentication assessment

The exact DB command selects /etc/postgresql/postgresql.conf, which points hba_file at /etc/postgresql/pg_hba.conf and password_encryption at scram-sha-256. Read-only copies of these baked files are preserved with checksums in the proposal.

That HBA file uses trust for Unix-socket supabase_admin, peer mapping for other socket users, and trust for TCP 127.0.0.1/32 and ::1/128 **inside the container**. Private-network and remaining TCP addresses use scram-sha-256. Thus it would be incorrect to claim the image permits trust only over Unix sockets. The host's published 127.0.0.1 binding is a distinct network layer; do not assume a forwarded client matches PostgreSQL's container-loopback HBA entry. Effective client address and loaded HBA rules require later runtime read-only validation.

initdb also generates its own PGDATA HBA and emits its warning; the entrypoint appends host auth there. That generated file is not the explicit configured hba_file above. Temporary bootstrap uses listen_addresses='' (socket-only). No authentication policy is changed by this proposal. Future review must verify active config/includes and password enforcement for network clients, rather than infer policy from the warning alone.

## Partial volume and recovery comparison

Existing logs prove initdb and multiple schema scripts ran, with three ALTER ROLE successes before the error. This strongly establishes partial initialization on db-data; no direct volume-content inspection was made or is claimed. Named volume metadata exists, and DB exited3; the remaining four containers are still created/never started.

The exact cached entrypoint checks PGDATA/PG_VERSION and skips initialization when present. A successful initdb normally creates that marker before custom scripts run, so a restart is expected to skip these scripts; marker existence was not directly checked. migrate.sh's plain psql path has no automatic whole-bootstrap rollback or resume ledger. Some earlier statements committed; the failed roles.sql was not wrapped in a transaction. An in-place rerun can encounter non-idempotent schema/object creation and would require a detailed catalog inventory and explicit repair SQL.

| Option | Benefit | Risk / decision |
| --- | --- | --- |
| A: repair partial DB | Keeps current container/data | Unknown partial state; manual repair and skipped later migrations require SQL review and testing; not recommended |
| B: fresh disposable DB | Deterministic full bootstrap from pinned inputs; preserve failure evidence | Requires separately authorized stopped DB replacement and new volumes; recommended |

Use new DB-data **and DB-config** volumes, preserving both old ones. The config volume may contain generated encryption/config state from the failed run; sharing it weakens clean-replay reproducibility. Storage-data remains preserved and unused. No deletion or reset is necessary for the recommendation.

## Prepared correction and checksums

Separate ignored directory: `.local/borealis-supabase/controlled-compose/recovery-proposal/`. It is not mounted, active, sealed or executable by the current controller.

- platform-init/98-webhooks.sql: byte-identical official release source; SHA-256 `05a61316b899374253891cbba66ce073d9273f33983c3f47961eda3aa26c2823`.
- proposal-manifest.json: pinned source, transformation=none, effects, destination and hashes for read-only baked-script/authentication evidence.
- image-migrate.sh, image-pg_hba.conf, image-postgresql.conf: copied only from stopped container paths outside database volumes; no execution.
- README.md: non-active status and explicit gates.

Existing roles.sql SHA-256 `3ad717b225daa38aa982da26750f35641eb404e1eb5e69a763c22236ab96c1b2` and jwt.sql SHA-256 `c1d3f5c01e44646c2e533c5a1c111821cc49cb5a4c2534e08cddad61d8fb0339` remain unchanged. Existing preparation fingerprint remains `e29b2b05d9dbf686a192b04fa037bc1ead74deeace068c7b8c27bd33d59b0091`; no existing manifest/seal/receipt was rewritten. The old receipt is historical and cannot authorize a changed DB specification.

## Recovery procedure and other containers

After separate preparation authorization, produce a versioned revised configuration/policy/manifest set adding only the readonly 98-webhooks mount and fresh DB data/config volume names. Keep all five image digests, approved network ID, user/capability/security controls, loopback ports and local credentials unchanged. Update the controller's recovery lifecycle explicitly: current create refuses existing state/resources, start requires every target still created, and old receipt includes the old DB ID. Do not edit its ledger by hand or bypass gates.

The four unused Auth/REST/Storage/Kong containers can in principle retain exact IDs because internal DB hostname/credentials remain unchanged. They still require complete re-inspection and a new full-stack receipt referencing the replacement DB. Check network aliases, task labels and no duplicate DB identity. Only after explicit removal authorization may the old stopped DB container be removed without -v, preserving old volumes; create a new stopped DB with the same service identity and fresh volumes. If the controller cannot safely support this narrow replacement, stop and prepare that support rather than recreate all services automatically.

## Required authorization and gates

1. Authorize preparation of a versioned recovery configuration and controller/policy revision, with explicit new volume names and old-volume preservation. Review hashes, bootstrap effects, HBA assumptions and synthetic rejection tests. No infrastructure change is implied by this report.
2. Separately authorize removing only the failed stopped DB container (never its volumes), creating one replacement **stopped** DB container and two fresh named volumes; retain the other four IDs. No startup/SQL at this gate.
3. Re-inspect all five IDs, cached images, mounts, gateway, exact network identity, loopback ports, local-secret provenance and new sealed configuration. Generate a new receipt; archive the old receipt as historical evidence.
4. Separately authorize exact-ID startup/platform initialization and local health, catalog/user/HBA and IPv4/IPv6/DNS isolation checks. Stop owned IDs on failure; preserve all volumes. No Borealis SQL, seeds, users, bookings or website.

Stage 2B remains blocked until Stage 2A runtime checks pass and the independent application migration/dependency review is approved. No production credential, URL connection, Git publication, Netlify or global Docker change is involved.
