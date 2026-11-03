# Borealis official CLI final local startup result

2026-10-20 (Europe/Tirane), canonical clone `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Overall FAIL: actual wildcard publications detected after successful CLI startup. All nine new task-owned containers were stopped; all new and old volumes preserved. One authorized new attempt, no retry.** Production deployment remains unauthorized/NO-GO.

## Authorization and preflight

Owner explicitly accepted standard bridge egress and the residual temporary-exposure risk of post-start inspection; previous zero-egress/preactivation requirements superseded only for this new local environment. No firewall installation or daemon change occurred.

Workspace .local/borealis-cli-official; project borealis-cli-dev-20261020. CLI2.121.0 checksum6e8be5fb2802ccdd247d3b47823c31ed8d7e792255048594ba32ee79a55208dc; Docker CLI/Engine29.8.2 ARM64. Preparation/config/provenance and exact old resources passed checks. Dedicated clean HOME/TMPDIR, explicit local Docker Unix endpoint, no login/link/cloud token or production dotenv. Active application migration directory empty; migration/seed replay disabled;554xx ports free before startup. Original attempt marker preserved; separate attempt-v2.json and start-attempt-v2.py used.

## CLI startup and exact discrepancy

Pinned CLI start completed exit0 on existing approved network. Immediate sanitized inspect captured the complete new service set before failure handling. HostConfig requested blank HostIp; Docker NetworkSettings.Ports reported BOTH0.0.0.0 and:: for every published service:

| Service | Host ports | Effective addresses | Required |
| --- | --- | --- | --- |
| API/Kong | 55421 →8000/tcp | 0.0.0.0 and:: | 127.0.0.1 |
| PostgreSQL | 55422 →5432/tcp | 0.0.0.0 and:: | 127.0.0.1 |
| Studio | 55423 →3000/tcp | 0.0.0.0 and:: | 127.0.0.1 |
| Mail capture | 55424 →8025/tcp | 0.0.0.0 and:: | 127.0.0.1 |

Failure reason unsafe_effective_binding. This is confirmed effective Docker wildcard configuration, not merely an ambiguous request. Actual off-host reachability/OS firewall traversal was not tested and is not asserted. No further live checks were attempted after failure. Stop targeted only IDs with new project's exact ownership label; no cleanup/prune/removal.

## New container identities / final states

| Service | Exact new container ID | Final state |
| --- | --- | --- |
| studio | `bdcab5a8999e09650f14bdd0ab490d48bba4b84f2f8f470f6558dd236362332d` | exited |
| pg_meta | `e9e19ced3551b33f030aa99c618c64ffac3843df001f0568c0dbc208ddd1a282` | exited |
| storage | `83861b1206430500eaa42aee47718688f493e8d996532d8c75518731f953f865` | exited |
| rest | `2aa4cde8448183411742bbc634f0baf5d34f2d5cba020edf97e6d9392b5b97e7` | exited |
| realtime | `3feff51a730e9ba429a3b6cb3e2971f9f997f923c4e168e664958c68b1b04f36` | exited |
| inbucket | `6b05cd6ab0e126b213d83fc7150c26c47baa60d7166df35955abf4dd82b2fa2c` | exited |
| auth | `9d55e884f523e8b73c61a8d2ba818e56e7a67d7d6e039797b0d7190adf330ebc` | exited |
| kong | `696f89d93286fea0311084f8be902d18537b40bb4c2659d708483c9e3842828e` | exited |
| db | `7799add2332c50ea09bb9bfb3e2b556bd08520b0dc3e06dc97f448ba6ec3bf37` | exited |

All Running=false confirmed. Before shutdown, DB/Auth/Storage/Kong/Realtime/Studio/metadata/mail capture were Docker healthy; REST was running with no Docker health field in this CLI set. CLI completed its own readiness checks, but no claim of complete independent platform verification is made.

## Endpoints and service health decision

Intended endpoints are http://127.0.0.1:55421, PostgreSQL127.0.0.1:55422, Studiohttp://127.0.0.1:55423 and local mail capturehttp://127.0.0.1:55424. All are currently stopped and should not be used as working endpoints. Independent HTTP/DB connectivity, role/schema/extension/HBA/catalog/auth.users checks were NOT RUN because binding failure required immediate shutdown. No local credentials were displayed; private CLI log may contain local keys and must remain private.

## Network / volume identities

Network IDc4de25bcf8e3e36f0b4cc063f972c419718f37ea784a24cc720fc011ab8f5f15, name borealis-cli-dev-20261020, bridge Internal=false, IPv6 network allocation disabled. All nine were attached only to this exact network. Configured host_binding_ipv4 remains127.0.0.1, yet actual publication ignored that expected outcome in this run. Do not assume this default guarantees effective loopback. Cause needs reviewed CLI/Engine/Desktop analysis. No security setting was altered to force success.

New project-owned volumes retained:

- supabase_db_borealis-cli-dev-20261020 (driver local)
- supabase_storage_borealis-cli-dev-20261020 (driver local)

Volume labels and names recorded in final-attempt-v2-evidence.json. No custom volume was reused. Official platform initialization occurred; actual final schema/user counts are unverified because no read-only SQL was run. No Borealis SQL, migrations, seeds, rooms/bookings/users or other application data were configured/invoked. Disabled replay and empty migration directory establish no supplied application replay, not an independently queried empty catalog.

## Preservation and residual risk

Original five custom IDs remain stopped and their configuration snapshots match the pre-attempt baseline. Original partial/recovery DB volumes and Storage volume are still present and unchanged by this operation. No old network/image/container/volume deletion or reuse. New containers/volumes are stopped/preserved for evidence.

Transient public binding risk was explicitly accepted before this attempt and actually materialized in Docker mapping metadata. Runtime exposure lasted until post-start validation/owned shutdown; no claim that polling eliminated it. Standard bridge remains egress-enabled and is not a production firewall. Production reference was only a local blocklist value, never a target. No production credentials, remote project operation, website/browser or external integration was used.

Evidence: post-start-bindings-v2.json (actual requested/effective network mappings), attempt-v2.json, attempt-v2-result.json, final-attempt-v2-evidence.json. startup-v2.private.log captured CLI output mode600; no raw log or secret-bearing environment published. Historical first-attempt artifacts remain untouched.

## Remaining blockers and next requirements

Local infrastructure startup readiness FAIL. Before another attempt, separately authorize read-only investigation/preparation for explicit loopback publication in this exact CLI/Engine/Desktop combination, preserving stopped resources. Determine a supported per-project explicit-host binding mechanism or reviewed host restriction; do not change global settings, reset volumes or accept wildcards automatically. Any container/config change needs exact scope and new approval. Existing new volumes may be initialized; a later retry policy must acknowledge stopped existing official resources rather than recreate/reset implicitly.

Only after approved loopback-safe startup and independent health/API/DB/platform catalog/HBA checks pass may reviewed local migration reconstruction proceed. Existing duplicate timestamps, helper/RLS/dependency decisions and production034/035 exclusions remain. Migration replay and synthetic data require separate explicit approvals. No SQL repair/reset or app testing authorized by this result.

## Safe shutdown

All new and old services are already stopped; no shutdown action needed. For a separately approved future run, use an exact new-project ID/ownership-checked stop routine preserving volumes, or the pinned CLI's reviewed workdir-scoped stop behavior after confirming its data handling. Do not use --no-backup, reset, prune or broad cleanup. No restart command is recommended until the binding cause is resolved.

No Git commit/push/merge/deployment, Netlify or production settings changed. Stop point: report delivered, all services stopped, no automatic retry.
