# Borealis Stage 2A host-port probe result

2026-10-20 (Europe/Tirane), canonical clone `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Experiment completed; internal-network host-port failure hypothesis SUPPORTED. Isolation probes PASS; host HTTP deliberately measured FAIL. Cleanup PASS.** No Supabase container was started/modified and no SQL, production request or infrastructure correction occurred.

## Preflight and identities

Read required connectivity, startup-v4 and local-stack reports. Existing five exact stopped Supabase IDs/configuration snapshots, preparation/image/local credential provenance, gateway and approved network checks passed. All original/recovery volumes present; no initial network peers. Commands used minimal PATH/HOME/TMPDIR; no production credentials or mounts. Selected temporary host port was free before creation.

Used only cached official BusyBox linux/arm64 image `busybox@sha256:bdf57e528e45e4433820e045b29b4597825a1c9e38353532d90a01445013f82e`; inspect verified exact config ID and architecture. No image pull or new network.

| Disposable role | Exact task-created ID | Final state |
| --- | --- | --- |
| server | `ffd6f87d10edd49d040f92489f45e516231110d64fe5e21290a56f20c4ac65f6` | removed |
| client | `3bcac86320a525adae8cfee6c9b2d9cceb50f4985fff1efaec5c590eac1a01c2` | removed |

Both probes were created and inspected before start, attached exclusively to borealis-local-only-isolated, exact network ID e1a8111682ffdc13c667d86f514dbd09265802dc73ba016dec63a6fc50bcabb1. No privileged/host mode, added capabilities, host mounts, project files/secrets/socket or automatic restart. Read-only rootfs, uid65534, cap-dropALL, no-new-privileges,32MiB/32PID limits and anonymous1MiB tmpfs. Only server requested host publication; client had none.

## Binding and results

Temporary requested publication: 127.0.0.1:53444 →8080/tcp. Fixed HTTP marker served from anonymous /tmp; internal client successfully retrieved it, proving the server was ready before host testing.

| Test | Result | Evidence |
| --- | --- | --- |
| Internal HTTP | PASS | Exact harmless marker received from server IP172.18.0.2:8080 |
| Internal Docker DNS | PASS | 127.0.0.11 resolved server name to172.18.0.2 |
| Mac loopback HTTP | FAIL | URLError, ECONNREFUSED errno61,7ms; no HTTP response/status |
| External IPv4 denial | PASS | 192.0.2.1:443 Network is unreachable, exit1 |
| External IPv6 denial | PASS | 2001:db8::1:443 Network is unreachable, exit1 |
| External DNS denial | PASS | example.com SERVFAIL, exit1 |
| Actual network attachments | PASS | Only approved network, actual NetworkID verified after start |
| Host binding restriction | PASS requested config | Only127.0.0.1 publication, no wildcard |

Host request explicitly disabled proxies and used numeric loopback. Safe errno61 is the installed macOS ECONNREFUSED constant; it is not a timeout or HTTP authentication rejection. Container wget emitted explicit network-unreachable diagnostics; numeric syscall errno was not exposed by that tool and is not invented. No production domain/IP was used.

Runtime NetworkSettings.Ports from the probe server, recorded separately from HostConfig request:

```json
{
  "8080/tcp": []
}
```

This distinction matters: the requested binding alone did not establish a working host listener/forwarder. Full non-secret probe outputs/spec summaries are preserved in ignored host-port-probe-results.json; no service secrets were mounted or printed.

## Conclusion and limits

High confidence that this **tested internal-only topology on this Docker Desktop host does not provide the requested host-loopback HTTP access**, despite healthy internal HTTP/DNS. The same failure reproduces with BusyBox independently of Kong/Auth/JWT/routing, strongly supporting the infrastructure-publication hypothesis for startup-v4. No evidence justifies changing Supabase gateway routing or HTTP client authentication as the first correction.

The experiment does not isolate every Docker Desktop/backend/host-policy component, and no non-internal-network control was authorized. Do not claim that every Docker release/internal network universally rejects publication. Source evidence from the previous investigation supports missing gateway/NAT programming as the mechanism; VM firewall/listener tracing was not done here. External denial remains bounded to tested paths, not every local host service.

## Cleanup and preservation

Both exact task-created IDs were removed in finally cleanup; no probe IDs remain. No broad prune or volume/network/image deletion. Approved network remains unchanged/empty. Temporary port can bind again, confirming no remaining listener at that endpoint. Final five Supabase Config/HostConfig/Mounts/network-name snapshots AND complete State objects equal their pre-experiment values. All original/recovery named volumes remain present; none was mounted or altered. Cached BusyBox image and approved network are retained as before.

Evidence/script: `.local/borealis-supabase/host-port-probe-results.json` and host-port-probe.py. No service configuration, image set, credential, receipt, seal or historical attempt marker changed.

## Smallest correction and exact next authorization

Keep internal-only Supabase isolation intact. First prepare/review a narrowly scoped alternative host-to-internal transport, rather than add an external bridge or disable internal=true. A diagnostic docker-exec HTTP read can validate Kong internally but cannot satisfy the host-loopback development requirement. A real app-facing correction needs an explicitly constrained local relay/Unix-socket or supported forwarding design with fixed upstream only, loopback-only host listener, no general proxy/CONNECT, no secondary network/privilege/socket exposure and independent denial validation. No executable safe relay or network change is claimed ready by this report.

Next authorize **design/preparation only** of that transport, including compatibility checks and concrete reviewed configuration. Any helper image download/container creation/network change or Supabase startup remains separately authorized work; no blanket permission is inferred from this experiment. Once a safe design is reviewed, authorize a disposable positive/negative transport test before changing services. Preserve all existing volumes/IDs and require new inspections if configuration changes. Stage2B remains blocked until working host access and complete platform/HBA/catalog/runtime-isolation checks pass.

No production access, Borealis SQL/migrations/seeds, website, Git publication/deployment, Netlify or global Docker changes occurred. Stop point: probes cleaned, five Supabase services still stopped.
