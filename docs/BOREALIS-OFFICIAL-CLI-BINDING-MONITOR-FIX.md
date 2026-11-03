# Borealis official CLI binding monitor correction

2026-10-20 (Europe/Tirane), canonical clone `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Offline validator/tests PASS; execution-readiness BLOCKED by the strict pre-activation requirement.** No startup, container/network/volume mutation, SQL or production access occurred. Original wrapper/attempt/seals and historical evidence remain unchanged.

## Previous rejection and Docker semantics

start-once.py compared every HostConfig.PortBindings entry using `b['HostIp']=='127.0.0.1'`. It neither checked effective NetworkSettings.Ports nor saved the transient inspect object before failing. Consequently an omitted requested address was rejected without proving public exposure. The old transient actual value remains unavailable; no claim of an observed wildcard listener is justified.

Matching Engine29.8.2 [configurePortBindingIPv4 source](https://github.com/moby/moby/blob/8af9fe3/daemon/libnetwork/drivers/bridge/port_mapping_linux.go) fills an unspecified host address from the network default in NAT mode. IPv6 family expansion is separately handled. Routed mode can ignore bindings; it is not accepted by this proposal. Empty HostIp alone is never evidence of safety.

Read-only network inspect reconfirmed exact c4de25bcf8e3e36f0b4cc063f972c419718f37ea784a24cc720fc011ab8f5f15, name borealis-cli-dev-20261020, Internal=false, IPv6=false, default127.0.0.1. This approved egress-enabled bridge is not air-gapped. It can supply a safe default for omitted requests but does not override an explicit wildcard request.

| Layer | Evidence | Availability |
| --- | --- | --- |
| Requested | HostConfig.PortBindings and network default | Created/stopped configuration; does not prove a listener |
| Effective Docker mapping | NetworkSettings.Ports and actual endpoint/network identity | Normally running/allocated endpoint; missing/ambiguous mapping cannot pass |
| Actual host listener | OS listener ownership/address plus harmless local connection | Running only; effective Docker mapping alone does not prove Desktop forwarding works |

No actual listener or live HTTP check was run here. A created container with pending effective ports is NOT VERIFIED, never treated as safe to activate solely by the validator.

## Prepared versioned validator

Separate ignored `.local/borealis-cli-official/binding-monitor-v2/monitor.py`; original start-once.py untouched. No startup/subprocess/stop operation is implemented. validate accepts structured inspect/network/identity/expected-service-port policy inputs, verifies exact approved network/bridge/NAT default, identity/name/image/ownership, sole network/no host mode/privilege/publish-all, and endpoint/credential blocklists.

For each reviewed expected port, explicit127 request or omitted empty-string request is permitted ONLY if its effective binding is exactly one127.0.0.1 mapping to the approved host port and exact approved network default is127.0.0.1. Explicit wildcard4/6, other loopback aliases, nonloopback, missing/duplicate/ambiguous effective mappings and extra publications reject. Unpublished image-exposed ports with null entries are not falsely treated as publications. Final effective pass requires Running=true.

A future integration must supply an independently reviewed exact service/name/image/port policy and a session identity ledger established only for newly created resources. The offline function does not certify a caller-supplied arbitrary identity policy. The original suffix-only ownership OR-label test must not be used for cleanup. shutdown_candidates requires exact ledger ID/name and project label; it only selects IDs and never stops anything.

Environment scans reject production host/reference, inherited cloud/deploy token variables and unapproved endpoint hosts without logging values. The existing sterile environment/provenance checks must remain; this scanner is not proof an arbitrary opaque secret is nonproduction. No production dotenv read or live credential comparison occurs.

## Sanitized evidence contract

Before rejection, a future integration must call evidence and persist only: exact container ID/name, reviewed service identifier, requested host IP/port, effective host IP/port, exact network ID/default, fixed stage and safe reason. No Config.Env, auth header, JWT, response body or raw log included. Effective validation returns per-port sanitized PASS rows. Recorder integration is deferred because no safe runnable activation monitor is claimed.

## Regression results

PASS: syntax and six unittest methods covering explicit127, empty request + verified default + loopback effective map, wildcard IPv4/IPv6/nonloopback/alternate loopback rejection, missing effective map, extra port/network, host mode, replacement ID, production endpoint, missing default, stale attempt/unauthorized startup and exact-owned cleanup selection. Secret sentinel excluded from evidence. All synthetic; no Docker writes or real listener.

Revised startup_gate rejects absent confirmation, a stale attempt marker, and even otherwise valid confirmation with preactivation_enforcement_not_established. Thus these tests do not accidentally authorize a second attempt. Unknown effective binding structures fail closed; active state must be verified explicitly.

## Safety limitation and safer prerequisite

A poll runs AFTER Docker may create/start a container and publish ports. During CLI automatic startup the wrapper cannot atomically inspect and deny an unsafe create/start before activation. Poll interval reduction/events cannot remove that race; CLI may also finish between polls. Immediate owned-stop on detection is damage containment, not proof that a public listener never remained active while awaiting validation.

Your requirement says to stop/propose a safer mechanism if early enforcement cannot be guaranteed. Accordingly no revised runnable startup wrapper was activated or offered. Do not run the old wrapper again and do not merely accept blank HostIp.

To retain the strict requirement, prepare/review an enforcing Docker API boundary that denies unsafe container-create/start/network-update requests BEFORE execution (for example an applicable daemon authorization mechanism or fully constrained local API mediation with direct-daemon bypass excluded). It must enforce explicit127/default-qualified NAT requests, exact project/images/services/networks/ports and all relevant mutation paths, not just inspect responses. Applicability to this Desktop version/CLI must be established. No such policy is installed or verified here; daemon authorization/global Docker changes remain outside authorization and may conflict with the chosen low-maintenance workflow.

An independently enforced host ingress barrier can mitigate external reachability, but does not prove the literal absence of a wildcard listener; do not call it equivalent without owner approval of that revised requirement. Alternatively the owner may explicitly choose trusted pinned CLI + verified default + post-start effective inspection/owned stop, acknowledging the transient-exposure/daemon-concurrency trust boundary. That is a policy change, not a technical fix meeting the current strict gate. This document does not make that choice on the owner's behalf.

## Hashes and next authorization

- monitor.py: `14c93c576e4baf3703c3b67e856b5af2a210b30d71f1ba7a41cdb23c0d214e9d`
- test_monitor.py: `01ca04457f29f4c8eedc09537c561cf1018fef3fac6da795e56b2a58e5354b07`

Before any second startup: choose/review the preactivation enforcement approach or explicitly approve the changed trusted-CLI/post-inspection safety boundary, then prepare a separate sealed second-attempt wrapper with pre-rejection evidence and exact-owned cleanup. Preserve first attempt marker; no manual overwrite/reset. Only after that concrete review authorize ONE new official CLI startup using retained bridge/cached images, no application SQL/fixtures/website/production/publishing. Present approval of a retry alone would not resolve the current enforcement gap.

No new resources changed; old custom stopped stack and all volumes remain preserved by scope. Existing bridge/images remain retained. Phase1 and production release remain incomplete/NO-GO.
