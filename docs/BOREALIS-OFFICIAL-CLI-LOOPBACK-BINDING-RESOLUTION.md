# Borealis official CLI loopback binding resolution

2026-10-20 (Europe/Tirane), canonical clone `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Investigation complete; no supported activatable correction established for this exact runtime.** No restart, container/network/volume changes, SQL or production access occurred. Do not invent a config key, intercept Docker commands or accept wildcard bindings.

## Root cause: established facts versus unresolved layer

1. Pinned Supabase CLI2.121.0 StartPortBindingSpec has hostPort/containerPort/protocol. formatPortBindingFlag emits `${hostPort}:${containerPort}` (and optional /udp); buildStartContainerCreateArgs supplies it to docker create -p. It does NOT explicitly request127.0.0.1,0.0.0.0 or::. The recorded HostConfig.HostIp empty string agrees with omitted-host syntax. [Pinned source](https://github.com/supabase/cli/blob/v2.121.0/apps/cli/src/command-internal/db-bootstrap/docker-create-args.ts).
2. Docker's matching8af9fe3 [configurePortBindingIPv4/IPv6 implementation](https://github.com/moby/moby/blob/8af9fe3/daemon/libnetwork/drivers/bridge/port_mapping_linux.go) uses the network default when HostIP is omitted, in NAT mode. Empty is not universally wildcard by definition; with all-address default it expands broadly, while a correct127 default should constrain it.
3. This network's exact ID/default was re-inspected: c4de25bcf8e3e36f0b4cc063f972c419718f37ea784a24cc720fc011ab8f5f15 and host_binding_ipv4=127.0.0.1. Pinned [bridge config parser](https://github.com/moby/moby/blob/8af9fe3/daemon/libnetwork/drivers/bridge/bridge_linux.go) recognizes DefaultBindingIP. Official CLI create arguments use the specified network and all recorded actual attachments matched this network.
4. Nevertheless, saved RUNNING NetworkSettings.Ports reports0.0.0.0 AND:: for API55421/DB55422/Studio55423/mail55424. That is the security failure, regardless of desired defaults. Off-host traffic was not tested.
5. Exact internal source of the disagreement is **unresolved**. Existing metadata cannot establish whether Docker CLI request conversion, Engine port-mapper/default propagation or Desktop forwarding/reporting behavior caused it. No evidence justifies blaming a particular component conclusively. Docker Desktop backend publishes host sockets/forwards into its VM; it is an additional layer, but no live backend trace was collected. [Desktop architecture](https://docs.docker.com/desktop/features/networking/).

The previous monitor's requested-IP false rejection is a separate issue; the later effective wildcard evidence is real and must continue failing.

## Official support and options

[Supabase local-development guidance](https://supabase.com/docs/guides/local-development) explicitly recommends a user-defined network with com.docker.network.bridge.host_binding_ipv4=127.0.0.1 and start --network-id. That is already the attempted supported project-scoped method. Repeating it without new evidence is not a correction.

Installed2.121.0 start help exposes --network-id and service exclusion, but no per-service host-IP/--bind-address flag. The reviewed generated config/service builders use numeric published ports; no supported config field that prepends127 to these ports was established. api_url/site_url/hostname/listen addresses inside containers do not set host publication. Do not put `127.0.0.1:55421` into a numeric config port or invent SUPABASE_BIND_HOST. No upgrade was performed; no later version is asserted to fix it without review.

| Alternative | Result |
| --- | --- |
| A: explicit per-service CLI config | Not supported by the inspected pinned interface/builders; cannot recommend a nonexistent option |
| B: project-scoped loopback-default network | Official supported solution, but observed ineffective here; retain stopped and investigate runtime before reuse |
| C: host publication restrictions | PF/managed policy can restrict reachability, but does not convert actual wildcard binding into explicit127; prior draft not activated, and current requirement remains exact loopback |
| D: wrapper supplying explicit IP | Docker supports explicit `-p127.0.0.1:host:container`, but a parent wrapper cannot change unmodified CLI child argv through a supported CLI option. PATH shims/command interception/API rewriting rejected. Taking over container creation returns to custom lifecycle maintenance and is not selected. |

No source patch, daemon setting, API workaround, extra network or automatic acceptance prepared. Runtime replacement/update (including the officially mentioned macOS runtime alternatives) would require separate compatibility/licensing/resource review; do not install or switch merely on speculation.

## Recommended next step and preservation

Smallest useful next step is a separately authorized **disposable binding diagnostic**, not another Supabase startup. Use cached official BusyBox, at most two probes on the same approved standard bridge, distinct free high ports: compare omitted requested HostIp with explicit127 publication, inspect actual mappings and clean only probe IDs. If omitted fails but explicit passes, that isolates the default-path limitation and supports an upstream/runtime fix; it still does not give pinned CLI an explicit binding option. If both fail, investigate Desktop/runtime publication. If both pass, compare the CLI's exact Docker create request/source against probe behavior without intercepting/replaying secret-bearing commands. Do not change services based on this report.

Current nine official containers remain stopped with exact IDs from STARTUP-FINAL report. Read-only preservation checks passed. DB volume supabase_db_borealis-cli-dev-20261020 and Storage volume supabase_storage_borealis-cli-dev-20261020 remain present. All five old custom IDs/volumes/network are stopped/preserved. New evidence: .local/borealis-cli-official/loopback-resolution/preservation-evidence.json and resolution-manifest.json; pinned reviewed source hashes recorded.

Port bindings are container-create configuration; Docker has no ordinary supported in-place docker update switch to change them. Simply restarting these stopped containers would retain the requested publication configuration. Safe future reuse is conditional on a demonstrated runtime/default fix and fresh inspection. If explicit publication ultimately requires container replacement, obtain exact-ID replacement approval and preserve named volumes/secret/config compatibility. Never reset or auto-adopt custom volumes. No volume deletion/recreation/repair is necessary or authorized now.

## Static/synthetic validation

PASS: existing corrected binding validator's six offline unittest methods: explicit loopback/qualified empty request, wildcard4/6 and nonloopback rejection, unexpected port/network/host mode, ID replacement, production endpoint, default/unknown effective mapping, stale attempt/unauthorized startup and owned cleanup selection. No Docker mutation paths in validator. Read-only exact nine stopped IDs, all five custom stopped IDs, network identity/default and both official plus all custom volumes verified. Existing app migrations/seeds remain disabled; no SQL was executed.

These tests validate fail-closed policy, not a working correction. They cannot prove an explicit binding will work in this runtime without the separately approved probe. No pretend successful supported fix or new startup controller was sealed.

## Risks and exact authorization

Remaining blockers: default-versus-effective publication mismatch, supported CLI inability to request explicit IP, no independent host connectivity/baseline catalog/HBA checks. Local stack egress remains approved; production exclusion depends on clean identity/configuration and no production targets, not a firewall claim. Release remains NO-GO.

Approve only the narrow cached-image disposable omitted-versus-explicit binding experiment described above, with exact standard network, free high host ports, post-create/running inspection, no secret/project mounts, no Supabase startup and exact probe cleanup. It uses the previously accepted transient publication diagnostic boundary; explicit wildcard/reachability testing would require clear scope. No new network/image download or global change is included.

After evidence, separately approve preparation of a concrete supported runtime/CLI correction if one is established, then any required exact container replacement (volumes preserved), then one startup attempt. Do not rerun startup while no supported correction exists. Original history/seals/attempt markers remain unchanged.

No production access, website, Git commit/push/merge/deployment, Netlify or global Docker changes occurred. Stop point: limitation documented; infrastructure unchanged.
