# Borealis Stage 2A Compose preparation result

Verified 2026-10-19 (Europe/Tirane). Work in canonical clone `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Preparation PASS; stopped-container creation and service execution NOT performed and NOT authorized by this report.** Five required service images are provisioned; resolved configuration, private local credentials, platform bootstrap, gateway and lifecycle controller are prepared and statically checked. No volumes, SQL, application migrations/seeds, auth users, bookings, application startup, production requests, Git publication or Netlify changes occurred.

## 1. Selected upstream/component set

Official [self-hosted/v0.8.3](https://github.com/supabase/supabase/tree/self-hosted/v0.8.3/docker), immutable commit `bc27d2661edd09a5d0b8d76ce33da6d4071a756e`, including its official `docker-compose.kong.yml` override. The gateway is Kong from that same release, not an arbitrary mix with the current Envoy default.

Reduced to Postgres, GoTrue, PostgREST, Storage and Kong. Supabase's [official self-hosting guidance](https://supabase.com/docs/guides/self-hosting/docker) permits removing unused services/dependencies. Image transformations are disabled to remove imgproxy; Studio, Realtime, functions, mail, pooler and analytics are omitted. This targets the authorized DB/API/Auth/Storage platform only, not full hosted-feature parity. Runtime compatibility/health has not been exercised.

Pinned Supabase CLI remains 2.121.0, unused for startup. Docker Compose v5.6.0 and Docker ARM64 daemon are available. No global Docker configuration changed.

## 2. Image provenance / immutable ARM64 identities

Each tag was selected from the pinned official main Compose or Kong override. Registry multi-platform manifest was resolved first; only its unique linux/arm64 manifest was pulled by digest. Local image inspect confirmed linux/arm64 and captured image config ID. Exactly five service images were downloaded; pre-existing BusyBox probe remains. No image was run.

| Component | Repository/tag | ARM64 immutable manifest digest | Config ID |
| --- | --- | --- | --- |
| Postgres | `supabase/postgres:17.6.1.136` | `sha256:a9946f08d31e8eb1149229c94e5c26603a9233116807cbbd93d75179cbac516a` | `sha256:a9946f08d31e8eb1149229c94e5c26603a9233116807cbbd93d75179cbac516a` |
| GoTrue Auth | `supabase/gotrue:v2.197.0` | `sha256:3439d5affb9e96395d1348521f4c675eea7096d8d76d18d4e31fcc08df802116` | `sha256:3439d5affb9e96395d1348521f4c675eea7096d8d76d18d4e31fcc08df802116` |
| PostgREST | `postgrest/postgrest:v14.18` | `sha256:dfa6464b877fa7b1b0be85740f6ce6985144b509a6edb5f09c5ee67e687e8c1f` | `sha256:dfa6464b877fa7b1b0be85740f6ce6985144b509a6edb5f09c5ee67e687e8c1f` |
| Storage | `supabase/storage-api:v1.81.0` | `sha256:a1249fe15965769752f81eec9313af1636cd2b1ff5622bf99ecf283a6a84c099` | `sha256:a1249fe15965769752f81eec9313af1636cd2b1ff5622bf99ecf283a6a84c099` |
| Kong | `kong/kong:3.9.3` | `sha256:593eb498a15df86e7753dc589aa84fdcec374598edd213ca9ab4d66c04a36813` | `sha256:593eb498a15df86e7753dc589aa84fdcec374598edd213ca9ab4d66c04a36813` |

Lock: `.local/borealis-supabase/controlled-compose/images.lock.json`; registry manifests saved under upstream/. No :latest references, emulation, silent version substitutions or extra service image dependencies were introduced.

## 3. Platform initialization and provenance

The selected Supabase Postgres image contains platform initialization for Supabase roles/schemas/extensions, distinct from Borealis SQL. Offline image-archive inspection (no container) inventoried 61 baked initialization/extension-control files, including references to anon/authenticated/service_role/authenticator/Auth/Storage administration roles. Layer order was taken from Docker's saved-image manifest, not physical archive order. Inventory is tied to the immutable image config ID in upstream/platform-image-inventory.json.

Two release scripts are prepared byte-identically and mounted individually at the release's init-scripts paths, without masking the image's baked directory:

| Upstream file | Prepared path | SHA-256 |
| --- | --- | --- |
| `docker/volumes/db/roles.sql` | `runtime/platform-init/roles.sql` | `3ad717b225daa38aa982da26750f35641eb404e1eb5e69a763c22236ab96c1b2` |
| `docker/volumes/db/jwt.sql` | `runtime/platform-init/jwt.sql` | `c1d3f5c01e44646c2e533c5a1c111821cc49cb5a4c2534e08cddad61d8fb0339` |

roles.sql assigns passwords to existing platform roles from the future local POSTGRES_PASSWORD environment; jwt.sql assigns local JWT expiry. No SQL was executed. Auth and Storage may initialize/update their own PLATFORM schemas on first authorized start; such platform initialization is required for Supabase behavior and is not a Borealis migration. No application data/seed or real users are included.

Optional webhook/pg_net trigger setup, analytics, pooler and Realtime initialization overrides were not mounted. No application SQL under database/ was edited, mounted or run. Future Borealis migration compatibility remains separately gated by the existing manifest/order review.

DB runtime preserves the official image's DB bootstrap identity supabase_admin. It runs under verified OS postgres uid100/gid101 with ALL capabilities dropped; the data named volume targets image-owned /var/lib/postgresql (allowing PGDATA creation as postgres), a second image-owned config volume preserves encryption configuration, and a uid100/gid101 socket tmpfs avoids privileged chown/setuid. These ownership choices are supported by offline final-layer metadata, not by an actual initialized volume. They require runtime verification and will not be relaxed to privileged/host mode if startup fails.

## 4. Fresh local credentials

Fresh cryptographic random DB password and HS256 signer were generated locally using Python secrets. Local anon/service-role JWTs were signed with that signer and carry only the local project reference/issuer and expected roles. Static validation verifies signatures, issuer/reference/role, expiry, generation provenance hashes and file permissions. No production credential was read/reused, no Cloud login/link, no external provider/recipient/payment/calendar integration.

Private files under runtime/ are owner-only (credential/config files mode600, runtime directory mode700); all are Git-ignored by .local/.gitignore. No values printed. Production .env.local is unchanged; separate .env.borealis-local was not activated for the website. Local service-role credentials belong ONLY to this isolated platform and are not populated into the app's server integration settings.

Private resolved Compose, normalized Compose, gateway and local credential files contain necessary LOCAL runtime secrets; do not paste their content or run unredacted compose config/status/log dumps. Provenance/seal files contain hashes, not credential values. Public upstream example defaults were not reused.

## 5. Gateway readiness

Prepared runtime/kong.yml is derived from the same release's Kong declarative template. Retained only Auth open/secured routes, REST routes (including upstream admin-only OpenAPI root policy), and Storage. Only freshly generated local anon/service consumers and their ACLs remain. All upstream hosts are internal auth/rest/storage. The release's legacy authorization expression preserves a user JWT when supplied and otherwise uses the local API key; authenticated routing/plugin structure and local key consumers were checked statically. No Dashboard/meta/functions/Realtime routes or public admin listener.

Source/rendered hashes and transformations are in gateway-manifest.json. No shell eval is used. The private host config remains mode600. Rather than weaken file permissions for a bind mount, future create will tar-copy it into the STOPPED gateway with image-verified Kong uid/gid1001 and mode600. Inspection and every pre-start check read back its hash/ownership. Gateway config parsing by the actual Kong binary remains deferred because no service container was created/run.

## 6. Configuration and lifecycle controller

Prepared directory: `.local/borealis-supabase/controlled-compose/`.

- runtime/compose.resolved.json: five digest-pinned linux/arm64 services, sole approved internal network, no implicit pull, restart=no; explicit 127.0.0.1:54322 DB and 127.0.0.1:54321 API bindings. Auth/REST/Storage have no published ports.
- bootstrap-review.json, upstream-source-manifest.json, transformations.json: byte/source hashes and explicit derivation decisions.
- service-policy.json, gateway-copy-policy.json, application-tables.blocklist.json: exact permitted environment/settings, private copy ownership and future application-table metadata check.
- inspect_policy.py: fail-closed static/image/network/stopped-container checks; rejects unknown environment, mounts, capabilities/security options, DNS/proxy/host overrides, image drift and public port bindings.
- lifecycle.py: separate preflight/create/inspect/start/verify/stop operations, serialized by a local lock. Exact-ID state ledger and sealed-config inspection receipt; no recreate-capable command after inspection. Startup refuses missing/stale receipts and rechecks code/config hashes, mounted bootstrap, copied gateway bytes, ownership, IDs/network before each start.
- preparation.lock.json: reviewed preparation hash seal, including code, configuration, credentials/provenance and bootstrap/gateway manifests. This is drift detection, not protection against a malicious host administrator rewriting both files and seal.
- test_controls.py: synthetic container/state tests; actual container/network/volume operations are mocked. Cached image metadata reads are real/read-only.

Supported controller operations (not permission to execute mutating ones):

| Operation | Behavior |
| --- | --- |
| preflight | Read-only sealed configuration, local credential/gateway validation, cached image and exact network checks |
| create | Requires explicit operation confirmation; refuses existing project resources, creates stopped containers with --pull never/--no-build/--no-recreate; installs private gateway file; never starts a service |
| inspect | Inspects all stopped task IDs, mounts/labels/images/users/environment/network requests/ports and gateway bytes; records private receipt |
| start | Requires separate explicit confirmation AND passed matching receipt; starts exact inspected IDs in DB → Auth/REST → Storage → gateway order, waiting for local health; no Compose up/recreate |
| verify | Local health/catalog/gateway checks plus internal DNS and documentation-address IPv4/IPv6/external-DNS denial; no Borealis SQL changes |
| stop | Requires operation confirmation; only ledger-recorded IDs with expected task ownership labels, preserves volumes; also used automatically on health/isolation failure |

Diagnostics retain sanitized status/exit-code/health/network/port summaries, not raw service logs, environment or HTTP bodies. No broad prune/reset/delete operation is implemented. Storage retains its official default root account inside an unprivileged container with all capabilities dropped and no-new-privileges; no privileged mode, host socket or host network. This identity and its writable data volume still require actual runtime inspection.

Important Docker boundary: prior created probe metadata shows NetworkID is empty until endpoint allocation at start. Pre-start validation therefore checks the sole requested network name/mode plus the independently inspected exact Docker network ID; running validation requires actual endpoint NetworkID to match. The code does not falsely claim a connected endpoint already exists while stopped. Concurrent Docker daemon changes remain a trust/TOCTOU risk; no unrelated client should modify this stack during create/inspect/start. The controller detects drift and stops, but does not change global daemon authorization policy.

## 7. Static/non-mutating verification results

| Check | Result |
| --- | --- |
| Official image identity/architecture lock | PASS, all five cached linux/arm64 |
| Resolved Compose config parse | PASS under minimal env, explicit project directory and --env-file /dev/null; image/environment/network/host binding consistency checked; normalized output saved privately |
| Bootstrap source/target hashes | PASS, byte-identical release scripts; no SQL executed |
| Local JWT/provenance/permissions | PASS; no values displayed |
| Gateway route/key/hash structure | PASS statically; actual Kong parser/startup untested |
| Preparation seal / read-only lifecycle preflight | PASS |
| Seven template policy rejection variants | PASS |
| Seven synthetic test methods including 15 actual-container variants | PASS; rejects wrong network/host mode, public binding, extra network, added privilege/capability, DNS/host override, restart changes, already-running state, wrong image/user/command, unknown env/proxy, unexpected mounts/volume ownership/peers, and stale/missing inspection state |
| Controller no-confirm create/start negative tests | PASS: explicit_operation_authorization_required; no Docker mutations |
| Existing internal network | PASS: exact ID e1a8111682ffdc13c667d86f514dbd09265802dc73ba016dec63a6fc50bcabb1; Internal=true; IPv6 disabled; 127.0.0.1 binding default |
| Service create/start/health/SQL | NOT RUN, expressly excluded |

No restriction was removed to pass a test. Parser/tooling issues were corrected in preparation code; all execution gates remain active. No automatic approval marker was generated.

## 8. Remaining blockers / risks

No known static preparation blocker remains for a separately authorized **stopped-container creation/inspection trial**. This is not a runtime PASS. Actual image filesystem/entrypoint behavior, local platform initialization, Auth/Storage schema evolution, Kong parser/readiness, restrictive capability compatibility and egress must still pass after later authorization. No service processes ran, so those properties cannot honestly be declared tested.

If creation inspection fails, leave everything stopped and report. If later startup/health fails, stop only recorded local IDs, preserve volumes and sanitized evidence, and review the specific cause. Do not add privileged mode/public networking/external DNS or silently change component versions. Future Realtime/full application compatibility and existing Borealis migration conflicts remain outside this preparation.

## 9. Exact next authorization

Approve **creation of exactly five stopped local service containers and their project-owned named volumes**, plus installing the private gateway config into the stopped gateway and running the read-only stopped-container inspector. Scope: this sealed configuration/image set and exact approved network only; no service execution, SQL, seed or user creation.

After creation, require a reviewed PASS receipt/report before separately authorizing startup of those exact IDs and harmless platform health/catalog/network checks. Explicit controller confirmation tokens are safeguards, not a replacement for your authorization. This task did not invoke any confirmation token or create/start operation.

## 10. Preparation-only rollback proposal — not executed

There are no service containers or volumes from this task to shut down/delete. Preserve the existing internal network/BusyBox probe and Stage 1 tools unless separately removing them.

For rollback, privately archive this preparation directory first (owner-only; contains local secrets). It includes files that already existed as drafts and were expanded; no byte-for-byte pre-edit backup of every earlier draft is available, so do not claim an automatic exact draft restoration or delete the whole .local tree. Archived preparation disables further use without losing provenance.

After verifying no containers/images depend on them, remove only the five newly provisioned digest references listed in images.lock.json with non-forced image removal. Do not use prune or remove BusyBox/other projects' images. Restore/delete only specifically reviewed local preparation files; preserve production .env.local, earlier reports, original application/database files and the pinned CLI. No application/dependency/Git/global Docker/Netlify rollback is necessary because none was changed.

Final status: preparation delivered and validated; **stop before container creation** remains in force.
