# Borealis Stage 2A stopped-container result

Verified 2026-10-19 (Europe/Tirane), canonical clone `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Overall PASS: exactly five approved service containers created and inspected while stopped.** Every container is in `created` state, Running=false, RestartCount=0, with a zero StartedAt timestamp. No container process, service health check, SQL, migration, seed, user, booking or website was executed. No production Supabase or Netlify request, Git publication or global Docker setting change.

## Preflight and operation scope

Ran the existing sealed lifecycle controller's preflight, then only:

```text
lifecycle.py create --confirm CREATE_STOPPED_LOCAL_ONLY
lifecycle.py inspect
```

Preflight passed: daemon available; five exact digest-pinned linux/arm64 images cached; preparation lock/file hashes unchanged; local secret signatures/provenance and private permissions correct; exact approved internal network; no existing project containers/volumes; loopback service ports available. Local CLI configuration still uses borealis-local-only, has no hosted link, migration/seed replay disabled and empty active migration directory. Docker subprocesses used allowlisted PATH/HOME/TMPDIR, not production dotenv or inherited cloud integration variables.

The controller used Compose create with --pull never, --no-build and --no-recreate, then copied the prepared private gateway configuration into the stopped gateway. No Compose up/run, Supabase start, Docker start, rebuild or image substitution occurred. Creation included the three approved project volumes; no database engine initialized them.

## Container IDs and image identities

All inspected images are linux/arm64 and match the cached release lock for self-hosted/v0.8.3. The full immutable image references are recorded here; Docker image config identities were checked separately against images.lock.json.

| Service | Container ID | Immutable image reference | State |
| --- | --- | --- | --- |
| auth | `8ab9c783fa1bd919223176bb179841ac6acb8b7edfdb58f57f6c237356981b91` | `supabase/gotrue@sha256:3439d5affb9e96395d1348521f4c675eea7096d8d76d18d4e31fcc08df802116` | created; never started |
| db | `4bdc30b2124a60bf0f55dac00f295a5f0a51345456e1f4541e77e2ac047cc694` | `supabase/postgres@sha256:a9946f08d31e8eb1149229c94e5c26603a9233116807cbbd93d75179cbac516a` | created; never started |
| gateway | `4c2bc800f2edd1f565d6b45795712a5b51a0c31dd7686265fa70a4cc26fd9494` | `kong/kong@sha256:593eb498a15df86e7753dc589aa84fdcec374598edd213ca9ab4d66c04a36813` | created; never started |
| rest | `8949d74edb50e2d152d7fe16b6c7e78936a16c763d90dcb81d98bd8f842036d6` | `postgrest/postgrest@sha256:dfa6464b877fa7b1b0be85740f6ce6985144b509a6edb5f09c5ee67e687e8c1f` | created; never started |
| storage | `d0561e270eb1a0a78fa9a60b8dd38adcd67abd9834d3a918e9235d4b3abcb54b` | `supabase/storage-api@sha256:a1249fe15965769752f81eec9313af1636cd2b1ff5622bf99ecf283a6a84c099` | created; never started |

Ownership validated: Compose project borealis-local-controlled, correct unique service label and task owner controlled-compose. Prepared local-only/stage labels are present. No pre-existing resource was adopted.

## Actual isolation/security inspection

- NetworkMode is borealis-local-only-isolated for every container; only that network is requested in NetworkSettings. No host network or additional bridge/network.
- Independently inspected network identity is `e1a8111682ffdc13c667d86f514dbd09265802dc73ba016dec63a6fc50bcabb1`; Internal=true, IPv6 disabled, default host binding 127.0.0.1. No running endpoints are attached.
- Docker leaves NetworkID empty for created containers until endpoint allocation. This is the expected created-state stub, confirmed by prior probe evidence. Requested network/mode plus the independently verified exact object are validated now; actual connected NetworkID and runtime egress must be rechecked only after separately authorized startup.
- All privileged flags false; all Linux capabilities dropped, no added capabilities; no-new-privileges enforced. No host PID/IPC/UTS namespaces, host devices, external DNS overrides, extra host mappings, secondary mounts or Docker socket.
- Actual image-default-plus-reviewed environment matches exactly; unknown variables/proxy/integration overrides rejected. No environment values or credentials are included in this report.
- Actual users/entrypoints/commands and rootfs/tmpfs settings match the sealed image/configuration. DB uses OS postgres; Auth uses supabase; REST uses uid1000; gateway uses kong. Storage retains its official default root identity inside an unprivileged capability-dropped container.
- Restart policy is disabled (`no`) for all five. No automatic startup on daemon restart is configured.

### Host port bindings

| Service | Docker HostConfig binding |
| --- | --- |
| db | 127.0.0.1:54322 → 5432/tcp |
| gateway | 127.0.0.1:54321 → 8000/tcp |
| auth | None |
| rest | None |
| storage | None |

These are verified requested bindings; no service is listening while containers remain created. No 0.0.0.0 or IPv6 wildcard publication. Actual runtime listeners and gateway reachability were not tested.

## Volume/mount validation

Exactly three project-owned local named volumes were created:

- `borealis-local-controlled_db-config` — driver local; expected Compose project and volume labels verified.
- `borealis-local-controlled_db-data` — driver local; expected Compose project and volume labels verified.
- `borealis-local-controlled_storage-data` — driver local; expected Compose project and volume labels verified.

DB mounts the approved data/config volumes plus the two read-only platform roles/JWT files. The data volume targets /var/lib/postgresql; config volume targets /etc/postgresql-custom. DB's socket tmpfs matches the reviewed uid100/gid101/mode3775 settings. Storage mounts only its named data volume at /var/lib/storage. Auth, REST and gateway have no host data/config bind mounts. Every actual mount destination/source/type/read-only flag and named-volume ownership label passed the inspector; no production/project-source directories or credentials were mounted.

Named volumes exist as Docker-managed filesystem resources; no Postgres/Auth/Storage process has initialized a database, applied platform SQL or created application data. Runtime filesystem permissions still require later service startup/health verification.

## Gateway and credential checks

The prepared private Kong file was copied into the stopped gateway via tar archive preserving the reviewed owner. Read-back verified:

- Path /etc/kong/kong.yml
- uid/gid 1001/1001
- Mode 600
- Exact SHA-256 match to gateway-manifest.json

No Kong binary or entrypoint was run. Parser/readiness tests remain deferred. Local host credential/config files retain owner-only permissions from preflight. Production .env.local is unchanged; no credentials were printed or introduced into application configuration.

## PASS receipt and evidence

A successful stopped-container receipt was written by the sealed controller:

- `.local/borealis-supabase/controlled-compose/runtime/inspection-receipt.json`
- Lifecycle state: runtime/lifecycle-state.json, phase inspected
- Sanitized actual inspection evidence: runtime/stopped-container-evidence.json (mode600)
- Image provenance: images.lock.json

Preparation fingerprint: `e29b2b05d9dbf686a192b04fa037bc1ead74deeace068c7b8c27bd33d59b0091`.

Receipt file SHA-256: `5363632da44efe3fd26969a91772ae6928f0adc93e6aa4f8b492eec2c7e9bcab`.

Per-container configuration fingerprints (hashes cover the reviewed actual configuration without displaying secrets):

| Service | Configuration SHA-256 |
| --- | --- |
| auth | `99b9f841bad61a9c73163f38ce0046de0c3eef88006b82734e427ffa562b5e00` |
| db | `2984004e12ed759271407f5ca99edcd6a782370218a2d0f47793088bab11766d` |
| gateway | `a51a4c6615d7ed9e008e8937bfc17c8562c75f901655510075b00ed0e8223abb` |
| rest | `60558b5e1a02c27fbed0d536f7c9076910e8417df9af9d743f6d6fe1a7af60f7` |
| storage | `d0bdd52226bf50889deb95810160fd179c22f99d6663f94664494b38876060f8` |

The receipt permits the controller to validate an eventual startup request; it does NOT itself authorize startup. Any change to IDs, preparation, container settings, bootstrap or copied gateway configuration invalidates that gate. Concurrent external Docker modifications remain a trust/TOCTOU limitation; re-inspection is mandatory immediately before later exact-ID starts.

## Discrepancies and next authorization

No stopped-container inspection discrepancy found. All five containers are preserved in created state; no recreation/deletion/reset or correction was needed.

Next required authorization: start only these five inspected IDs, in the sealed controller's dependency order, and perform harmless LOCAL platform health, empty-catalog/auth-user and network-isolation checks. That would allow necessary Supabase platform initialization on the new local volumes, but must continue to exclude Borealis SQL/migrations/seeds, test-user/booking creation, the website, production access and all deployment/publication actions.

Runtime compatibility is not yet established: Postgres/bootstrap permissions, Auth/Storage platform initialization, Kong parsing, actual endpoint allocation, service readiness and service-container egress remain to be tested under that separate authorization. If later checks fail, stop only task-owned IDs and preserve volumes/diagnostics; do not weaken isolation.

Current stopping point: **five created containers, zero running containers; no startup authorized or performed.**
