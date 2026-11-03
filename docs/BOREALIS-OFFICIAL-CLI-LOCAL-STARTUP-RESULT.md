# Borealis official CLI local startup result

2026-10-20 (Europe/Tirane). Canonical clone `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Overall FAIL at port-binding monitor. One authorized startup attempt; no retry.** New official CLI stack did not reach verification. CLI rollback removed its transient newly created containers; no new project containers/volumes remain. Existing custom five containers and all original/recovery volumes remain stopped/preserved. New approved bridge and official images remain cached.

## Project, tooling and approved policy

Workspace `.local/borealis-cli-official`, project_id borealis-cli-dev-20261020. CLI2.121.0 exact previously pinned SHA256; Docker CLI/Engine29.8.2 arm64,10CPU/~7.75GiB daemon memory. Official CLI init/config provenance and preparation guard passed. Dedicated HOME/TMPDIR and explicit local Docker Unix endpoint used; no cloud token/login/link/profile or production dotenv loaded. No hosted project marker, application migrations/seeds disabled, active migration directory empty, separate554xx ports free before execution.

Owner explicitly approved standard **egress-enabled** bridge and official CLI create/start lifecycle. New network name borealis-cli-dev-20261020, ID c4de25bcf8e3e36f0b4cc063f972c419718f37ea784a24cc720fc011ab8f5f15: bridge, Internal=false, IPv6 disabled, com.docker.network.bridge.host_binding_ipv4=127.0.0.1. It is not air-gapped and does not independently block arbitrary production requests. Only local platform startup/infrastructure registry downloads were invoked.

## Execution and exact evidence limit

Activated only this new network, then invoked pinned CLI start with explicit new workdir/network ID. CLI provisioned its nine official images and began Starting database. A monitoring guard rejected a requested HostConfig binding whose HostIp was not explicitly127.0.0.1. It recorded public_port_binding, terminated the CLI and allowed its rollback; CLI exited130. No remaining new stack container needed an additional stop.

**This does not prove a public listener existed.** CLI -p hostPort:containerPort may represent HostIp as empty while Docker applies the network's loopback default. The guard compared requested HostConfig rather than effective NetworkSettings.Ports and was stricter than the reviewed default-binding policy. The transient offending inspect object/actual mapping was not saved before interruption, so exact HostIp/port/runtime listener cannot be reconstructed from this artifact. This is a monitor diagnostic/design limitation, not a confirmed unsafe Docker publication or a Supabase service-health failure.

No policy was weakened and no retry was made. Next work should review requested-versus-effective binding validation, record sanitized container/name/network/requested AND actual ports before rejection, and test the revised policy without running a stack. Accept an omitted requested address only if independently inspected exact loopback network default and actual running bindings prove127.0.0.1; continue rejecting wildcard/nonloopback/unexplained mappings. Do not silently accept blank as safe.

## Official image identities

Images selected by pinned CLI, cached from official public.ecr.aws/supabase namespace. All nine inspected linux/arm64; no emulation or substitute images.

| Image | Immutable digest | Platform |
| --- | --- | --- |
| `public.ecr.aws/supabase/postgres:17.11.0.004` | `sha256:b15d862126dd2dac02da524696ccfde2dcce2ceaee0a58973b2727befe492706` | linux/arm64 |
| `public.ecr.aws/supabase/storage-api:v1.82.1` | `sha256:ec2ad41411eac8fc2b769b4bb00d1af32ae37eca3745c15bdb329db27d218934` | linux/arm64 |
| `public.ecr.aws/supabase/realtime:v2.143.4` | `sha256:35e99d3f1cbba5aa5585e8ac3cf70ecc54909ee4aee0626effed93c60fb41439` | linux/arm64 |
| `public.ecr.aws/supabase/studio:2026.10.12-sha-3699278` | `sha256:948770ec467f00e6ae34c35018ef7cb23d7b30eb806b42c2cc0d7bcfdcf8a7a8` | linux/arm64 |
| `public.ecr.aws/supabase/postgres-meta:v0.100.0` | `sha256:145325b7e39f8ef4931d6e8cfd3f6f4d655de09d72a2ccc96d9513542c2202bd` | linux/arm64 |
| `public.ecr.aws/supabase/mailpit:v1.31.3` | `sha256:ed9b00c609e77e99c79b93f1178255ebc271868920f2c69a8d166bd5634ed10d` | linux/arm64 |
| `public.ecr.aws/supabase/gotrue:v2.197.0` | `sha256:1736a63078f5922b198c4cbe50f80ab9a2d3b54fe8b7b6cfb2e9dc5dbbc12c6b` | linux/arm64 |
| `public.ecr.aws/supabase/postgrest:v16.4` | `sha256:d155c6718ed9a9f990d159a2ab7c0a3f16944dbb6d0a0344557421042acfe0df` | linux/arm64 |
| `public.ecr.aws/supabase/kong:2.8.1` | `sha256:1b53405d8680a09d6f44494b7990bf7da2ea43f84a258c59717d4539abf09f6d` | linux/arm64 |

Config IDs and RepoDigests recorded privately in startup-final-evidence.json. Original custom images remain intact. No unrelated image pull or optional external integration enabled.

## Resources and health

| Check | Result |
| --- | --- |
| New unlinked workspace/config/credential-minimal preflight | PASS |
| New ordinary bridge/loopback default | PASS configuration |
| Official cached image ARM64 identities | PASS |
| Requested publication monitor | FAIL; effective binding not captured |
| PostgreSQL platform initialization/health | NOT VERIFIED; interrupted during database startup |
| Auth/REST/Storage/gateway/Studio/mail-capture health | NOT VERIFIED |
| Host API55421 / DB55422 connectivity | NOT RUN |
| Actual running network/port verification | INCOMPLETE |
| Borealis migration/seed execution | Disabled; no application SQL supplied or invoked |
| Empty DB/Auth-user catalog assertion | NOT RUN; no running new database remains |
| Old custom resources preserved | PASS |

No new persistent container IDs or volume identities remain to list: CLI rollback cleaned its newly created resources. Exact transient DB ID was not retained by the monitor. No pre-existing resource was deleted. New bridge remains empty and preserved. Official platform initialization might have begun before interruption; no claim that zero platform SQL executed is made. Application SQL/migrations/seeds, synthetic users/bookings were never configured or executed. Catalog emptiness is unverified rather than inferred from disabled replay.

## Preservation and diagnostics

Old exact five custom IDs/configuration receipt checks still pass; all Running=false. All original partial DB-data/config, initialized recovery DB-data/config and Storage volume remain present. They were never reused by the official project. No global settings, old networks/images/volumes or production configuration changed.

Evidence under `.local/borealis-cli-official`: startup-attempt.json, network-created.json, startup-process-result.json, startup-final-evidence.json; startup.private.log is mode600 and must not be pasted unredacted. New start-once.py is local one-attempt orchestration, not an approved production tool. All output containing potential local credentials is captured privately. Historical preparation policy remains recorded as pending in its immutable file; this run's owner approval is recorded in startup-attempt.json rather than altering the old manifest silently.

## Remaining requirements

Phase1 is incomplete. Separately authorize a preparation-only monitor correction for effective loopback binding validation and sanitized pre-rejection evidence. Then authorize a new single official CLI startup using the retained empty bridge/cached images, without resets or old-resource changes. The original one-attempt marker remains; do not bypass it manually. If necessary use a new reviewed attempt record/controller revision.

After startup health/host connectivity and actual bindings pass, verify read-only auth.users/public catalog and platform roles/schemas/extensions/HBA/password behavior. Only then proceed to a reviewed uniquely versioned Borealis migration manifest, separate explicit local replay approval, then fixture/mutation approval. Original timestamp collisions/helpers/RLS/dependency and production-property034/035 exclusions remain unresolved.

No automatic cleanup/restart is needed now. Do not run broad stop/reset/prune; no new service is running. Preserve bridge/images/evidence until next approved step. Production release remains NO-GO. No production requests, application website/browser, Git commit/push/merge/deployment or Netlify change occurred.
