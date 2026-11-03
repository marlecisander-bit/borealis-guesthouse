# Borealis Docker loopback diagnostic result

2026-10-20 (Europe/Tirane), canonical clone `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Experiment PASS; default-binding path identified with high confidence. Cleanup PASS.** Omitted HostIp produced wildcard mappings; explicit127.0.0.1 produced only loopback. Both localhost HTTP requests returned200 and exact harmless marker. No Supabase service started/modified.

## Preflight and probe identities

Confirmed exact nine official + five historical custom containers stopped, unchanged configuration receipts/IDs, all official/custom volumes present, approved bridge identity/default unchanged and empty, pinned BusyBox linux/arm64 cached. Minimal PATH/HOME/TMPDIR plus explicitly pinned local Docker Unix socket; no cloud tokens or production dotenv inherited. Two distinct high ports were free before creation.

Image: busybox@sha256:bdf57e528e45e4433820e045b29b4597825a1c9e38353532d90a01445013f82e. No download/new network. Probe IDs:

- A omitted: b931f345e65835193bc4c2bfbe6e8023266d137dad636c61e586ca4f26d7ce3c — removed.
- B explicit: eb924ecf890adcf919bff085cdfb308e49318974575e625c8af14c32137eb983 — removed.

Same harmless BusyBox HTTP server8080, read-only rootfs/user65534, all capabilities dropped/no-new-privileges,32MiB/32PID limits and1MiB anonymous tmpfs. No privilege/host mode/project/secret/Docker socket mount, added capability or restart. Requested settings inspected before each start; effective mapping immediately after.

## Exact result

| Probe | Publish argument | Requested HostIp | Effective bindings | Localhost HTTP |
| --- | --- | --- | --- | --- |
| A | 54125:8080 | empty string | 0.0.0.0:54125 and [::]:54125 |200, exact marker,4ms |
| B | 127.0.0.1:54126:8080 |127.0.0.1 |127.0.0.1:54126 only |200, exact marker,1ms |

Both had only approved network borealis-cli-dev-20261020, IDc4de25bcf8e3e36f0b4cc063f972c419718f37ea784a24cc720fc011ab8f5f15; no additional port. Its host_binding_ipv4 option remained127.0.0.1, IPv6 network allocation disabled. IPv6 wildcard publication is independent of whether containers receive IPv6 addresses.

Host HTTP used numeric127 and ProxyHandler({}), timeout4s. No errno during successful requests. No off-host reachability or production target probed. A's wildcard mapping was the expressly accepted expected diagnostic outcome, not an unexpected additional exposure. It was removed after recording its one host request; B remained strict loopback.

## Root cause and confidence

**DEFAULT_PATH_RELATED**, high confidence for this exact Engine/Desktop/network combination. The omitted-IP problem reproduces independently of Supabase and explicit Docker host-IP works. This rules out Kong/Auth credentials/routing as the cause of wildcard publication and establishes a working explicit-publication primitive.

It does not identify the exact internal Engine/Desktop bug or guarantee every other runtime/network behaves identically. Network-default metadata alone remains insufficient in this environment. Pinned Supabase CLI's omitted-IP create path still cannot deliver the required explicit binding through a verified public per-service option. Do not infer this experiment fixed the official stack.

## Cleanup and preservation

Only the two task-created IDs were removed; no probes remain. Original fourteen IDs, complete state objects and configuration snapshots equal pre-test evidence. All volumes and full approved network inspection equal pre-test state. No Supabase startup, reset, SQL, network mutation or broad cleanup.

Immediate bind-without-reuse checks initially failed on both recently used ports; this is not evidence of active listeners. Follow-up localhost connect_ex returned ECONNREFUSED61 on both, and lsof -sTCP:LISTEN found none. Residual TIME_WAIT is a plausible reason for failed immediate reuse, not directly proved. No unexpected listener remains in these checks. No extra listener/probe was created to test cleanup.

Script/evidence: .local/borealis-cli-official/loopback-resolution/probe.py and probe-results.json. All outputs are non-secret probe data; private file mode600. Cached image, existing network and all service resources retained.

## Supported correction options and next authorization

Docker explicit127 publication works. The simplest CLI-preserving resolution remains an upstream/runtime correction restoring the documented default behavior, or a reviewed supported CLI version/option that explicitly includes127. Neither has been established or installed. Do not introduce command interception, API rewriting, source patch, global daemon change or automatic wildcard acceptance.

Separately authorize read-only investigation/preparation of an upstream/runtime fix or supported CLI explicit-host feature, using this reproducible evidence. An upgrade/runtime switch requires its own version/architecture/compatibility/licensing and migration plan before installation; do not assume latest fixes it. If none exists, report that the current pinned official workflow cannot meet explicit-loopback requirements without an approved alternative architecture. Host firewall reachability restrictions remain a distinct owner decision and do not change wildcard mapping metadata.

Current stopped official containers retain omitted-IP bindings; restarting them is not a fix. Any necessary future replacement needs exact-ID approval, preserved named DB/Storage volumes and reviewed CLI ownership/config compatibility, no reset. No next Supabase startup is authorized by this probe result. Stage1 infrastructure and Stage2B remain incomplete.

No production access, website, application SQL/migrations/seeds, Git publication/deployment, Netlify or global Docker changes occurred. Stop point: probes removed, report delivered, all Supabase services stopped.
