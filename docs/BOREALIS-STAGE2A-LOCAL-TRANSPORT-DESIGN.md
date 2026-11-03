# Borealis Stage 2A safe local transport design

2026-10-20 (Europe/Tirane). Canonical clone `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Design prepared; no transport implementation or activation.** No listeners, containers, networks, exec processes, SQL, Supabase startup or infrastructure changes created by this task. Existing IDs, volumes, seals/receipts and attempt markers preserved.

## Confirmed failure and requirements

The authorized BusyBox experiment retrieved the exact HTTP marker internally and resolved internal DNS, but host127.0.0.1:53444 failed ECONNREFUSED61 in7ms. External documentation IPv4/IPv6 destinations were unreachable and external DNS returned SERVFAIL; probes cleaned. This reproduces the issue independently of Kong. It supports a local publication-path limitation on this topology; it does not prove every internal Docker bridge behaves identically.

Required interfaces remain host127.0.0.1:54321 for Kong API and127.0.0.1:54322 for PostgreSQL. Preserve five container IDs, all volumes and network e1a8111682ffdc13c667d86f514dbd09265802dc73ba016dec63a6fc50bcabb1. No external route/DNS, wildcard listener, extra network, privileged process/container, mounted Docker socket or global Docker change is acceptable.

## Alternatives

| Candidate | Security / compatibility | Operation and reproducibility | Decision |
| --- | --- | --- | --- |
| A: host loopback relay with fixed Docker exec streams | No container route/network change; host controller is Docker-privileged trust boundary. Raw stream supports HTTP and PostgreSQL in principle. | Existing CLI/images; per-connection exec overhead; requires robust EOF/cancellation/limits and binary tests. | Preferred candidate, gated on tests |
| B: forwarding sidecar | Same internal network plus normal publication reproduces failing path; external secondary network would create prohibited route/host exposure. Shared Unix-socket volume could avoid that but would require new mounts/containers. | More image/process/configuration maintenance; current service IDs cannot acquire new mounts. | Reject dual-network/publication workaround; unnecessary complexity |
| C: Desktop supported publishing | Standard loopback -p already failed; no verified supported internal-network-specific override preserving all guarantees established. | Global daemon/VM policy or external network changes are outside requirements. | No ready safe fix; do not weaken internal=true |
| D: local transport without published ports | Docker exec stdio is a supported control-plane stream. Unix-socket bridges are possible but existing services expose TCP and current IDs cannot gain new socket mounts. | Used as the transport inside A; standalone exec checks alone do not provide host TCP endpoints. | Adopt fixed exec-stream variant only |

Docker documents [exec -i and user selection](https://docs.docker.com/reference/cli/docker/container/exec/): an exec command runs only while its container primary process runs. [Desktop architecture](https://docs.docker.com/desktop/features/networking/) separates host/VM forwarding from container networking. These support the building blocks; they do not certify a custom relay's security or correctness.

## Preferred architecture and exact allowed paths

1. Host client →127.0.0.1:54321 → trusted host relay → local Docker Unix control socket/CLI exec stream → unprivileged connector in exact DB container → inspected Kong IPv4:8000 on the approved internal network.
2. Host client →127.0.0.1:54322 → same mechanism → connector in exact DB container → DB's inspected internal IPv4:5432.
3. Responses return only along the same accepted stream. Backend bytes are never interpreted as commands, URLs, Docker requests or connection targets.

DB connector ID: 3a5d753746d8d1909b95831f47f11acd39160fe0ea771a08fe3ff3379fb2afe7. Kong target ID: 4c2bc800f2edd1f565d6b45795712a5b51a0c31dd7686265fa70a4cc26fd9494. Fixed connector user100:101; no exec --privileged, no TTY, no detached/background service, no container filesystem writes. Target numeric IPv4 is resolved only from fresh Docker inspect of these exact IDs/network; clients cannot select it. No DNS needed by the connector. Existing bash /dev/tcp and byte-copy tools are candidate image-provided primitives, not a proven connector implementation. Their availability, fixed script, raw binary/half-close semantics and cleanup must be verified separately.

Use PostgreSQL's inspected internal IPv4, **never127.0.0.1 or Unix socket inside DB**. That is essential to avoid intentionally selecting its loopback/socket trust rule. The source will be the connector container's internal address; future checks must prove effective SCRAM/password enforcement and reject wrong/absent passwords. Do not proxy as supabase_admin, embed a DB password, inject credentials or rewrite protocol authentication. Relay is transparent bytes only; client supplies normal local credentials.

No general HTTP proxy, CONNECT, destination argument, URL fetcher, control API or shell supplied by clients. HTTP Host/Location/body bytes do not determine the relay upstream. HTTP redirects are not followed by the transport. Clients/browser may follow links themselves, requiring separate host egress denial.

## Isolation boundaries

| Boundary | Initiation and permitted reachability | Risk/control |
| --- | --- | --- |
| Host relay | Accepts two numeric-loopback sockets; calls local Docker Unix API through pinned CLI only | Host Docker access can control the daemon and is powerful. Keep trusted code/minimal env, no network-reachable Docker API/remote DOCKER_HOST or SSH context; no socket is mounted into containers or forwarded to clients. Process compromise remains a serious host trust risk. |
| Connector | Initiates only fixed internal Kong8000 or DB5432 after exact-ID/network inspection | Shares DB's existing network/capability boundary; adds no route or DNS. Fixed reviewed argv/script and env -i prevent shell/environment injection; stream data goes only to stdin, never eval. It cannot accept container-originated new connections. |
| Backend | Sends response bytes on established internal TCP connection | No server-selected destination or reverse-forward API; bytes cannot ask relay to create host/external connections. Exploits against trusted relay remain a threat requiring minimal parser-free copying. |
| Host clients | Can access two approved forwarded services | Loopback is not user authentication; other local processes may connect. API/RLS and DB password still required. HTTP gateway intentionally exposes its configured API, not just health. No claim that all local users are trusted. |
| Browser / Next.js | Outside container isolation | Require separate fail-closed local environment/build artifacts and OS outbound deny; browser asset/redirect URLs may otherwise reach production/internet. Relay does not authorize website startup or solve those restrictions. |

Container ability to reach connected-subnet host gateway existed before this design; exec streaming adds no new host listener reachable via a container network and must not introduce host mappings/proxies. Keep original host-gateway-path denial requirements and rerun bounded probes. No socket mount, secondary network or host-mode service permitted. A trusted host process inherently talks to the local Docker API; if the requirement were to forbid even trusted host Docker API access, this candidate would not satisfy it and another reviewed transport would be needed.

## Prepared configuration and fail-closed controller specification

Ignored transport-design-v1/policy.json fixes two listeners/destinations, exact connector/target IDs/network, user, no TTY/privilege/mount/proxy/DNS/extra network, sterile host/exec environments and mandatory outbound-deny/runtime checks. policy.py validates only that exact design. It creates no listener/subprocess and is not a runnable transport. design.lock.json records hashes.

Future controller requirements:

- Verify all existing controller/preparation seals and historical receipt canonicalization; exact image/IDs/security/mounts/gateway/volumes/network before any exec/listener. Bind a new transport receipt to full argv/script hashes, CLI path/version/hash, local Unix socket identity and approved destination mapping.
- Refuse inherited DOCKER_HOST/context/TLS/SSH/proxy/cloud env. Pin local Desktop Unix endpoint explicitly after review; no arbitrary endpoint option. Container exec inherits DB env by default, so invoke a fixed env -i wrapper before the connector. No production dotenv is read.
- Enforce a proven host process outbound-deny policy allowing only two loopback listeners, required Unix Docker IPC and local workers. No internet/host-network connection function in the relay; reject fallback TCP Docker API. Host sandbox does not replace container isolation.
- Start upstream exact IDs with existing staged gates first. After DB/Kong ready and denial checks pass, inspect actual host ports: refuse any pre-existing listener including a newly functional Docker publisher; do not kill/hijack it. Bind only127.0.0.1, never localhost dual-stack or wildcard; no reuse-port.
- Validate each accepted connection against immutable mapping; re-inspect exact IDs/network before exec. Use Docker exec interactive/noTTY as user100:101, with a fixed local executable/script and numeric target selected from inspected endpoint. No client bytes in argv, shell source or env. Reject config keys not explicitly approved.
- Enforce bounded concurrent streams, startup/connect/idle timeouts and backpressure. Half-close both directions correctly; never merge stderr into binary stdout. Diagnostics log only stage/category/errno/status/duration, not payload or credentials.
- Track exact host PID/process-group start identities and exec handles privately. On failure close listeners first, terminate/drain only task-owned connectors, verify no orphan exec/cat children, stop exact task-owned services as policy requires, preserve all volumes/diagnostics. Do not rely solely on killing Docker CLI: daemon-side exec may survive disconnect and needs a validated cancellation/cleanup method. This is a key implementation gate.
- Do not set the relay up as a persistent daemon/login item or automatic retry. Require new explicit per-attempt authorization and preserve historical attempt markers.

The old startup-v4 verifier cannot simply be rerun: it starts services then checks host HTTP before the relay exists and its attempt marker blocks retries. A future version must separate internal health/egress → transport bring-up → host API/DB checks → full platform/catalog/HBA assertions. Do not mark an internal exec HTTP result as satisfying host access. Publish new code/transport validation seals; never edit old receipts in place.

## Validation procedure before use

1. Offline code review and synthetic tests: destination/ID/network/port/command/env policies, response-byte injection attempts, binary framing, EOF/half-close, limits, safe error reporting and exact-owned failure cleanup.
2. Separately authorized disposable internal-only probes: prove fixed raw exec stream works for HTTP and arbitrary binary data, host127 endpoints function, nonloopback/destination/CONNECT attempts cannot alter routing, connector cleanup verified and no extra network/routes/DNS introduced. Use cached trusted tools only or obtain explicit provisioning approval.
3. Verify host outbound deny permits required local IPC yet denies documentation IPv4/IPv6 and external DNS; independently verify container denial. No production probe targets.
4. Separately authorize five-service startup/transport trial. Confirm exact IDs/volumes unchanged, API auth/RLS preserved, DB network SCRAM with wrong/absent password rejected and correct LOCAL credentials accepted without printing them. Read-only catalog/HBA/role/schema/extension checks, bounded container egress/host-path controls. Stop on any failure, no retry or policy weakening.
5. Only later approve app launcher/browser isolation/fonts/migration review. This design alone does not authorize website or Stage2B SQL.

## Static/synthetic results and remaining gates

PASS: exact design policy plus two unittest methods including eleven unsafe variants: nonloopback listener, arbitrary target, extra network, privileged mode, Docker socket mount, production endpoint, unapproved service port, DNS override, proxy, startup activation and unknown key. No live network calls in policy/tests. These are design rejection tests, not proof that an unimplemented relay enforces the policy at runtime.

Unresolved gates: bidirectional raw exec/TTY-free behavior, cancellation/no orphan processes, image tool availability, socket sandbox compatibility, performance/concurrency, DB password enforcement from same-container internal IP, host-listener ownership and full response-byte safety. If any cannot be met without an external route, privilege or socket exposure, reject the implementation. A per-connection exec is acceptable initially for low-volume development if tests pass, not a production architecture.

## Rollback and exact authorization

No runtime rollback needed now: only ignored design files and this report were created. Preserve existing reports, .env.local, service configuration/volumes and network. Future rollback must stop only relay listeners/connectors by private identity ledger, confirm host ports free and no orphan execs, then stop exact approved services if part of that attempt; do not remove volumes/networks/images or prune.

Next authorize **implementation preparation only** of the fixed-destination host relay/controller and its offline tests, with no listener/container startup or network changes. After review, separately authorize a disposable exec-stream transport experiment including its exact probe lifecycle and host listeners. Only after that PASS authorize integrating a new receipt-aware service startup/transport controller. This report grants no activation, Docker exec, SQL or networking permission.

No production access, SQL/migrations/seeds, website, Git publication/deployment, Netlify or global Docker changes occurred. Stop point: design/policy artifacts only, no runnable relay/listener.
