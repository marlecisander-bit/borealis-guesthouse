# Controlled startup attempt — current result

2026-10-19 (Europe/Tirane). **Overall: FAIL/BLOCKED — required pre-execution service inspection is not supported by pinned CLI 2.121.0. No Supabase service was started.** The earlier probe-only network PASS remains valid for those probes; it does not constitute actual-service inspection.

## Preflight recheck

- Docker daemon reachable: Engine 29.8.2, ARM64/aarch64, 10 CPUs and 8,319,504,384 bytes RAM; no containers.
- Pinned CLI binary SHA-256 still matches verified 2.121.0. Startup help ran only, using minimal PATH/HOME/TMPDIR environment under deny-all-network macOS sandbox. No application dotenv, production credentials or hosted API operation used.
- Local project remains borealis-local-only; no project-ref marker, no production reference in local config.
- Migration and seed replay disabled; seed paths empty; active migration directory has zero SQL files.
- Approved network ID unchanged: e1a8111682ffdc13c667d86f514dbd09265802dc73ba016dec63a6fc50bcabb1; internal=true, IPv6=false, default host binding 127.0.0.1, no attached containers.
- Ports 54320, 54321, 54322, 54323, 54324, 54327 and 54329 were available on loopback at inspection.
- No tracked source changes observed; setup reports/local preparation remain untracked. No publication operation performed.

## Exact blocking limitation

The installed CLI start --help exposes exclude/health-check options and custom --network-id, but no create-only/dry-run/pause-for-inspection option. Inspection of the pinned official implementation confirms:

1. [container-lifecycle.ts](https://github.com/supabase/cli/blob/v2.121.0/apps/cli/src/command-internal/db-bootstrap/container-lifecycle.ts), createContainer (lines 667–727), constructs the spec, creates volumes/container, copies secret/bootstrap files, then calls dockerStartContainer directly before returning. No user inspection callback, policy assertion on inspected Docker state, or supported pause appears between create and start.
2. [start-database.ts](https://github.com/supabase/cli/blob/v2.121.0/apps/cli/src/command-internal/db-bootstrap/start-database.ts) calls that same createContainer path for Postgres (line 183).
3. The main start handler calls createContainer for the service sequence. Explicit network selection configures a requested network; it is not a pre-execution inspection of actual attachments or port bindings.

The request explicitly requires stopping if the CLI cannot guarantee or permit inspection before service execution. Therefore no CLI start was attempted. I did not intercept Docker commands, race a post-start inspection, change CLI source, loosen isolation, or introduce a custom startup workaround. Additional source inspection files are saved under ignored .local/borealis-tools/downloads/network-audit.

## Provisioning, health and empty-state results

| Item | Result |
| --- | --- |
| Supabase service image tags/digests/architecture | Not provisioned; stopped at security prerequisite rather than downloading unused service images |
| Probe image | Existing BusyBox 1.37.0 linux/arm64 digest bdf57e528e45e4433820e045b29b4597825a1c9e38353532d90a01445013f82e retained |
| Service containers/health | None created; health not tested |
| Published API/DB/Auth/Storage ports | None; planned ports remain unbound by this task |
| Actual service network/port inspection | Cannot occur through normal pinned CLI start before execution; blocking condition |
| Container egress | Earlier probe evidence preserved; no new service-level test possible |
| Empty database | No local Supabase database exists; no application tables, data, bookings, rooms or users were created. Catalog queries not run. |
| Production | Not contacted; no hostname/IP probe, credentials use, SQL or hosted operation |

## Next steps and Stage 2B boundary

A separately reviewed startup mechanism that genuinely separates create → inspect/assert → start is needed to meet the current policy, or a CLI version with a supported pre-start inspection gate must be evaluated. A changed pinned version or custom orchestration is a separate decision; neither was implemented here. Keeping the existing CLI while merely promising post-start inspection would not satisfy the current requirement.

Once that mechanism is concretely reviewed and authorized, provision only required official service images/digests, enforce the approved network/loopback-only binding checks before execution, preserve minimal local-only credentials and disabled application replay/seed, then perform local health and empty-catalog checks. Stop on any failure without changing network restrictions.

Stage 2B remains blocked until a successful empty-stack Stage 2A report AND separate approval for reviewed local application SQL/fixtures. No migration, seed, authentication mutation or website authorization is inferred from this attempt.

## Shutdown

No service was started; no stack shutdown is necessary. No task-created service containers or volumes require cleanup. Keep the earlier empty internal network and probe image unless separately removing those specific resources. Do not run global prune, db reset, or deletion flags. A safe exact-stack shutdown procedure must be reviewed with whichever startup mechanism is later approved; no generic stop command was executed against an absent stack.

---

## Previous network verification and earlier attempts

# Stage 2A probe-only verification update

2026-10-19 (Europe/Tirane). **PASS for the tested prepared-network isolation configuration.** This supersedes the earlier unverified network gate below; Supabase services remain NOT STARTED and require separate authorization.

## Image provenance and architecture

One image downloaded: Docker Official Image `docker.io/library/busybox:1.37.0`, linux/arm64. [Official image source](https://hub.docker.com/_/busybox).

Immutable local RepoDigest and image ID: `sha256:bdf57e528e45e4433820e045b29b4597825a1c9e38353532d90a01445013f82e`. Every probe used the digest reference with --pull never after initial download. No Supabase or unrelated image downloaded. The probe image remains cached; no deletion/prune requested.

## Network and disposable containers

Network `borealis-local-only-isolated` retained ID `e1a8111682ffdc13c667d86f514dbd09265802dc73ba016dec63a6fc50bcabb1`, internal bridge, IPv6 disabled, subnet 172.18.0.0/16, bridge gateway 172.18.0.1; default host binding 127.0.0.1. No global Docker/network settings changed.

Two disposable roles used the same image: borealis-isolation-peer (temporary HTTP marker server on container port 8080) and borealis-isolation-client. Inspect assertions required exactly the prepared network, no host/default-bridge attachments, no published ports, no privileged mode and no host bind mounts. Read-only rootfs, user 65534:65534, all capabilities dropped, no-new-privileges, 32-process/32-MiB limits. Only an anonymous 1-MiB /tmp tmpfs was supplied; no Docker socket, project directory, credential or production file mounted. Docker built-in network files remained standard runtime-managed files.

Containers were created and their attachment/security configuration inspected before start. External probes ran only after the internal network and container attachment checks passed. The client routing table showed only the connected internal subnet, with no IPv4 default route and no usable IPv6 external route.

## Test evidence

| Test | Result | Evidence |
| --- | --- | --- |
| Peer HTTP positive control | PASS | HTTP marker borealis-internal-probe returned from peer 172.18.0.2:8080 |
| Internal DNS positive control | PASS | Docker resolver 127.0.0.11 resolved peer name to 172.18.0.2 |
| External IPv4 denial | PASS | 192.0.2.1:443 returned Network is unreachable, exit 1 |
| External IPv6 denial | PASS | [2001:db8::1]:443 returned Network is unreachable, exit 1 |
| External DNS denial | PASS | example.com lookup through 127.0.0.11 returned SERVFAIL, exit 1; no external service connection attempted |
| Docker Desktop host alias | PASS for tested resolution | host.docker.internal returned SERVFAIL |
| Direct Desktop resolver/gateway paths | PASS for tested paths | 192.168.65.7:3128 and 192.168.65.254:3128 returned Network is unreachable |
| Default-bridge path | PASS for tested path | 172.17.0.1:3128 returned Network is unreachable |
| Network attachments | PASS | Exactly the named internal network; no host or secondary bridge attached |
| Published probe ports | PASS | None; no host exposure |

Only documentation addresses were used as external numeric targets. Host/bridge checks used private local Docker addresses, not production. No production hostname/IP lookup or request occurred. The image registry download was the sole infrastructure-image provisioning operation.

An initial netcat attempt returned a silent nonzero status and was treated as inconclusive, not a pass. Its containers were cleaned up; the diagnostic repeat used wget and reported explicit routing errors. A final run added the positive internal DNS control and direct local host/default-bridge-path tests. No observed isolation failure was bypassed, and no policy changed between runs.

Limits: this verifies the tested unprivileged containers on this network at this time, not every possible host service/port, malicious privileged-container behavior or future Supabase configuration. The bridge gateway itself remains part of the local connected subnet; it was not proved unreachable. Do not interpret PASS as a universal host firewall guarantee. No externally routed default/host-network path or external DNS resolution was observed. Future service containers must retain the same controls and be inspected before execution; any host proxy/alternate network must remain excluded.

## Cleanup and preserved evidence

All disposable containers from every attempt were removed by their exact task-created IDs in a finally block, including after inconclusive tooling. Final network Containers map is empty; Docker lists no remaining containers. No user containers/volumes/images/networks were removed. The prepared internal network and one cached probe image remain.

Evidence/script: `.local/borealis-supabase/network-probe-results.json` and `network-probe.py`. JSON contains final inspection, test outputs and cleanup results; no service credentials. Previous network-only evidence is also preserved. Only this report and ignored local probe artifacts changed; original SQL, source, production .env.local and disabled local replay settings were not modified.

## Remaining requirements before local stack startup

1. Obtain separate authorization to provision official required Supabase images and start the empty stack. This probe task does not authorize startup.
2. Resolve and record each required service's immutable image digest/ARM64 identity; do not provision optional services unnecessarily.
3. Recheck no hosted link, project_id borealis-local-only, disabled migration/seed, empty active migrations and credential-minimal CLI environment. Keep production dotenv outside any command environment.
4. Use explicit approved network ID; inspect actual service container specs/attachments and final host bindings. Reject host mode, additional networks, external DNS/proxy overrides and 0.0.0.0/:: published bindings. The loopback default is not proof of actual future bindings.
5. Preserve egress denial through provisioning/startup; no network exception for failed health checks. Verify local API/Postgres/Auth/Storage health, no Borealis tables/data, and continuing network isolation before declaring Stage 2A complete.
6. Application migration replay, synthetic fixtures, user creation, bookings, website and Stage 2B remain outside authorization.

No Supabase stack exists to shut down. Optional removal of the retained empty network remains `docker network rm borealis-local-only-isolated` only after inspecting that no future containers use it. No cleanup command was run beyond disposable probes.

---

## Earlier Stage 2A attempt — historical record

# Borealis Stage 2A local stack result

2026-10-19 (Europe/Tirane). Canonical clone: `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Result: BLOCKED at Phase 2 isolation verification. Empty local Supabase stack was NOT started.** No application SQL, migrations, seed, users, rooms, bookings, website, hosted project request, Git publication or deployment occurred.

Read local development plan, Stage 1 report and migration provenance manifest. All command work used the canonical clone. Production reference was used only for local blocklist/config checks, never as a network target.

## Phase 1 preflight

| Check | Result / evidence |
| --- | --- |
| Docker daemon | PASS; reachable, Engine 29.8.2 |
| ARM64 | PASS; client arm64, engine arm64/aarch64 |
| Supabase CLI | PASS; 2.121.0 executable unchanged from verified SHA-256; offline help executed under OS network denial |
| Project identifier | PASS; borealis-local-only |
| Hosted linkage | PASS for local workspace; no project-ref/link marker found; no login/link invoked |
| Migration replay | PASS; db.migrations.enabled=false |
| Seed execution | PASS; db.seed.enabled=false, sql_paths=[] |
| Active migration directory | PASS; zero SQL files |
| Original SQL | PASS; manifest source checksums unchanged |
| Credential inheritance | CLI help invoked with allowlisted PATH/HOME/TMPDIR and outbound network denied. Network creation/inspection used that same minimal environment. No environment/credential dumps. No startup process exists. Production .env.local was not loaded or changed. Docker inspection commands do not load app dotenv. |
| Local ports | PASS at inspection: 54320, 54321, 54322, 54323, 54324, 54327, 54329 could bind on 127.0.0.1; not reserved permanently |
| Docker resources | 10 CPUs, 8,319,504,384 bytes RAM (~7.75 GiB); zero images, containers, volumes/cache. Adequate nominal allocation for further local provisioning; actual stack memory/health not measured. |
| Git | No tracked changes; expected local preparation and setup documents untracked; no fetch/push/commit |

Current Docker Desktop was previously identified as 4.95.0. This run queried engine readiness; it did not launch Desktop or accept any settings.

## Pinned CLI networking inspection

Fetched official v2.121.0 source metadata and selected source files into `.local/borealis-tools/downloads/network-audit/`; no code executed from these source files. Offline CLI start --help confirms global --network-id support.

Reviewed [pinned start handler](https://github.com/supabase/cli/blob/v2.121.0/apps/cli/src/commands/start/start.handler.ts) resolves explicit --network-id before environment override/generated network. It notes that Docker Desktop supplies host.docker.internal. Reviewed [container argument builder](https://github.com/supabase/cli/blob/v2.121.0/apps/cli/src/command-internal/db-bootstrap/docker-create-args.ts) accepts a network ID and published-port specifications. Custom bridge defaults can govern bindings where callers omit host addresses; an actual container inspect is still required before asserting every port is loopback-only.

Docker's ordinary bridge permits outbound masquerading, so default bridge is not acceptable. A host macOS sandbox does not control Docker VM/container networking. See [official bridge documentation](https://docs.docker.com/engine/network/drivers/bridge/).

## Prepared network and evidence

Created only a container-free Docker network:

- Name: borealis-local-only-isolated
- ID: e1a8111682ffdc13c667d86f514dbd09265802dc73ba016dec63a6fc50bcabb1
- Driver: bridge
- Internal: true
- IPv6: disabled
- Default port binding: com.docker.network.bridge.host_binding_ipv4=127.0.0.1
- Labels: borealis.stage=2a; borealis.purpose=local-only-isolation
- Attached containers: none

Raw non-secret Docker network inspection saved as `.local/borealis-supabase/stage2a-network-evidence.json`. Original local config and disabled replay flags were not changed. No other Docker network/daemon settings changed.

**This is configuration evidence, not a passed container-egress test.** Internal bridge networking is a useful boundary, but host/gateway reachability, Docker Desktop DNS forwarding, possible host proxy paths, IPv6 behavior and service port publishing require container-level verification. No empirical test has shown that the proposed network blocks every arbitrary internet destination or indirect host path. No production destination was probed.

## Why execution stopped

The request requires verified container isolation before provisioning images and starting the Supabase stack. Docker currently has zero images. A container probe cannot run without provisioning an image, and no verified probe environment exists. I did not reorder those gates, pull an unrelated helper image, start the stack to discover its networking afterward, or assert Internal=true proves complete egress isolation.

A harmless non-service probe using a pinned required official Supabase image could establish more evidence, but it must be explicitly included in a revised gate sequence: first approve a specific probe image/procedure under the prepared restricted network, then verify egress before any service processes. Host/gateway restrictions may additionally require a VM/container firewall policy. No firewall weakening or global Docker setting change was attempted.

## Phases 3–5

| Requested verification | Result |
| --- | --- |
| Official service image tags/digests | NOT PROVISIONED; zero images, no digests to report |
| Image architecture | NOT VERIFIED; ARM64 Docker runtime is verified |
| Container identities/health | NOT STARTED; zero containers |
| Published service bindings | NONE; no published services exist |
| Local API/Postgres/Auth/Storage health | NOT TESTED; no stack exists |
| Runtime endpoints/local-only resolution | NOT TESTED; config proposes localhost ports only |
| Effective container egress | UNVERIFIED; blocking gate |
| Empty application database | No database or volumes created; no SQL/seed/migrations ran. Database catalog emptiness not queried because no database exists. |
| Persistent external connections | No task-created service/container connections exist; no host-wide connection audit claimed |
| Production safety | No production project requests, credentials use or data operations performed |

Final docker system df: images 0, containers 0, local volumes 0, build cache 0. Only the empty internal network persists from this stage.

## Requirements before continuing Stage 2A / Stage 2B

1. Review and explicitly approve a narrow **network-probe provisioning exception to the ordering**, identifying one required official Supabase ARM64 image/tag/digest and allowing a temporary non-service process. No application SQL or stack service startup in that probe.
2. Confirm an enforceable container/VM outbound policy including host-gateway/proxy and DNS paths, with no production target probes. Test raw public IPv4/IPv6/documentation destinations and DNS behavior; include positive local peer/host-port checks so failures are not mistaken for isolation. Probe cannot gain Docker socket/privileged access or attach a second external network.
3. Verify CLI-created service specs retain only the approved network, no host mode, no extra egress network, and loopback-only published addresses before service execution. If this cannot be guaranteed, use a reviewed create-before-start orchestration rather than running unchecked CLI start.
4. Only after isolation gate passes, provision required official service images separately, record ARM64 platform manifests/digests, and preserve denial during startup. Use minimal environment and explicit --network-id/workdir; capture status/start output privately because it can contain local keys.
5. Complete empty-stack API/Postgres/Auth/Storage health checks and catalog checks for absence of Borealis tables/data. Keep migration/seed disabled, active directory empty, and no users/rooms/bookings created.
6. Stage 2B application SQL/seed requires separate approval after successful 2A health/isolation report and migration review. Existing helper/policy/type/order conflicts and draft seed TODOs remain unresolved. Website/fonts/launcher are outside this 2A startup authorization.

## Safe shutdown / cleanup

There is no local stack to shut down. Do not use global prune, reset, --no-backup or blanket container deletion.

For the one task-created empty network, inspect that Containers is still empty before optional removal:

```bash
docker network inspect borealis-local-only-isolated
docker network rm borealis-local-only-isolated
```

Removal was not executed. If a future approved stack is started, review the pinned CLI stop help and target exact local workdir/network, preserve data by omitting --no-backup, and stop only borealis-local-only resources. No shutdown command that assumes an active stack is recommended at this blocked stage.

No source, original SQL, production .env.local, Netlify or tracked configuration was modified. The requested report and local network/source evidence are the additions from this run.
