# Borealis official CLI startup security decision

2026-10-20 (Europe/Tirane), canonical clone `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Decision: prepare a reserved-port PF inbound barrier for owner/admin review and disposable validation. Do not activate it or start Supabase yet.** No available control has been demonstrated to satisfy every requested guarantee on this Mac. In particular, reserved-port prevention plus post-start monitoring cannot guarantee prevention on arbitrary unexpected ports without an additional enforcing boundary.

## Evidence and host compatibility

Reviewed official CLI startup failure, binding-monitor correction and architecture decision; original wrapper rejected requested HostIp instead of effective mapping. Existing approved standard bridge remains egress-enabled with loopback default. Docker Desktop on macOS publishes through com.docker.backend and routes into its Linux VM. Consequently protecting host ingress to backend listeners is relevant; a firewall only inside the VM or an app sandbox on the CLI is not automatically a host publication barrier. [Docker Desktop networking](https://docs.docker.com/desktop/features/networking/).

Host reports macOS27.0.1 Apple Silicon; native /sbin/pfctl and /etc/pf.conf exist. The installed pf.conf has Apple wildcard anchor hooks and warns against flushing system rules. Presence of PF/anchor text does not prove an active or correctly ordered ruleset. No PF state/rules were changed. Local pf.conf manual confirms quick rule ordering and interface-skip semantics; effective parent rules, skip settings, NAT/redirection and existing states require admin inspection.

Apple describes PF as an advanced user/site-admin feature, not a stable product API, and warns that system rules may conflict with custom rules. For distributed products it recommends Network Extension. This single-owner local admin use is the relevant candidate; it still needs host-specific testing. [TN3165](https://developer.apple.com/documentation/technotes/tn3165-packet-filter-is-not-api).

## Available preventive controls

| Control | Benefits | Limits / impact |
| --- | --- | --- |
| Explicit loopback/default publication | Supported Docker configuration; minimal impact | Default does not stop explicit wildcard override; actual mapping still needs verification |
| Reserved-port PF anchor | In-kernel deny before listener startup; IPv4/IPv6, all nonlo0 interfaces; no Docker daemon edit | Requires admin, reachable parent anchor/ordering, state audit and real traffic proof; affects any application using the same reserved ports |
| macOS application firewall | Built-in application inbound policy | Not assumed to protect published containers; Docker backend shared across projects, coarse identity scope; local exception behavior requires proof |
| Managed Network Extension/endpoint firewall | Supported process/flow filtering architecture with possible address/port rules | Installation/system-extension approval, product capabilities/licensing; backend shared identity; greater complexity, not installed or verified |
| CLI process sandbox | Useful for credential/egress isolation of host child | Docker daemon/backend creates listeners elsewhere; not a sufficient publication firewall |
| Daemon/API authorization | Can reject unexpected ports before create/start | More complex; global daemon change or fully constrained API mediation; no verified setup and outside this task |

Do not assume application-firewall enablement or a security product automatically covers this path. [Apple firewall overview](https://support.apple.com/guide/security/firewall-security-in-macos-seca0e83763f/web). No app-firewall policy inspected/modified here.

## Concrete inactive PF proposal

Draft: `.local/borealis-cli-official/inbound-policy-proposal/borealis.pf.draft`.

```pf
block in quick on ! lo0 proto { tcp udp } from any to self port { 55420 55421 55422 55423 55424 55425 55426 55427 55429 }
```

The draft blocks inbound TCP/UDP to reserved local addresses/ports on every nonlo0 interface, without creating a pass rule that overrides stricter existing localhost rules. No inet qualifier means both address families. It does not authorize wider range/publication; disabled optional service ports are guarded defensively. Active port manifest still must reject any unapproved publication. Host traffic to127.0.0.1 remains subject to existing policy and must pass an actual test.

This changes host packet filtering, not Docker network/daemon configuration. It does NOT bind an offending socket back to loopback: a wildcard listener could exist but external packets should be denied. If literal absence of wildcard listeners remains required, PF ingress denial is not equivalent; use a preactivation API policy instead. This distinction requires owner acceptance before execution.

No rule is loaded into com.apple or other system-owned anchors. An admin must identify a safe dedicated parent anchor hook at appropriate priority. Do not assume dropping a rules file into /etc/pf.anchors activates it; do not reuse an Apple wildcard namespace or reload/flush the entire ruleset blindly. No install command is offered before the effective ruleset is reviewed.

## Static checks performed

Prepared draft only; native pfctl -n -f syntax-only parse and pfctl -s info were attempted. Results are recorded in static-checks.json. The status query requires /dev/pf access denied to the current process; no sudo/password/activation was attempted. Syntax-only result: 0. Status result: 1. A syntax parse, even if successful, proves neither active anchor reachability nor packet enforcement. No live probe or listener created.

No existing network, container, volume, credential, receipt or Docker setting was modified. Draft checksum: `5ed6bc59093141aede49e22e13a47d90e384b0b34c9c1b5dacf3477a5d999bb8`.

## Required preventive-enforcement validation

1. Owner/admin reviews current PF enable/reference status, full parent/anchor order, early quick passes, skip interfaces, rdr/NAT and state entries. Inspect only initially; do not dump unrelated private connections into reports. Verify no unrelated process uses the reserved ports. If safe narrow integration is impossible without affecting unrelated policy, stop.
2. Separately approve installation/activation of a dedicated port-scoped anchor before ANY probe startup, with a captured rule hash and PF enable reference. Preserve all system rules and existing states except narrowly approved task-port states if necessary; never flush global states/rules. Review safe unload/release sequence and persistence expectations.
3. With a separately authorized disposable cached-image probe on the approved egress-enabled bridge, publish one approved port deliberately to wildcard IPv4 (and IPv6 in an independently compatible setup if enabled). This intentionally unsafe-looking listener is permitted only behind the already active reviewed barrier. Inspect requested/effective bindings and host listener addresses/owner; prove external access denied and host127 HTTP succeeds with exact marker.
4. Use a separate authorized physical LAN peer for nonloopback ingress, with a positive-control peer route/service test so failure is not merely bad Wi-Fi/client firewall. Test host LAN IPv4, relevant IPv6 and VPN/interface paths. Same-Mac connection to its own LAN IP is not a substitute for real off-host traffic. No production destination used. If no independent peer/IPv6 validation is possible, mark that scope NOT VERIFIED and do not claim full protection.
5. Record PF rule counters/log-only metadata for test ports, verify anchor actually traversed and new packet blocks match. Audit scoped pre-existing state bypass. Prove localhost API-style and DB-style stream connectivity and no unexpected ports. Remove only task-owned probe/listener resources after test; retain firewall protection until all guarded listeners stop.
6. Freeze reviewed active policy hash, network default/id, pinned CLI/images/config and port manifest. New startup controller requires admin-confirmed active policy and test receipt BEFORE CLI start; continuously checks PF status, rule/parent hashes, interface conditions and task service port mappings; records sanitized evidence before stopping exact new resources on failure. Historical attempt markers remain unchanged.

## Continuous enforcement and residual risks

A loaded PF rule enforces packets while active; a polling watcher merely detects its removal. It cannot atomically prevent exposure after privileged rule removal, a system reload/order change or a state-bypass transition. Apple/system services can manipulate PF. Continuous absolute fail-closed behavior against such changes is NOT established; do not promise it from polling. Treat a stable administrator-managed ruleset as an explicit trust assumption, or choose stronger dedicated VM/managed enforcement if that assumption is unacceptable. On watcher failure stop only new services immediately, preserve volumes/evidence, no retry; this is containment with a residual detection window.

Port-scoped rules do not distinguish Docker projects. Other services attempting the same554xx ports would also be blocked externally. Restrict to reserved free ports and refuse conflicts. Other projects on other ports should be unaffected, but parent-anchor integration and testing must confirm that. Docker Desktop backend-wide blocking would affect unrelated projects and is rejected here.

Unexpected-port prevention is unresolved: PF protecting only known ports cannot prevent the trusted CLI publishing some other port before the monitor detects it. Protecting all backend ports can affect unrelated Docker projects; PF packet rules have no Supabase-project identity. Do not assert all ten requirements met by the draft. Options are an enforcing API allowlist, a dedicated dev VM/backend isolated from other projects, or explicit owner acceptance of trusted pinned CLI/port manifest plus immediate post-start rejection for unexpected ports. None is activated/selected silently.

Ingress protection does not stop outbound production access on the approved egress-enabled bridge. Preserve credential-minimal unlinked platform, disabled integrations/migrations, no app/browser, production blocklists. Browser/Next egress and production-free runtime remain separately required before app testing.

## Simplest recommended method and exact approvals

For this single Mac, the least added machinery is **official pinned CLI + verified loopback-default bridge + an admin-managed reserved-port inbound PF barrier + corrected effective-binding diagnostics**, conditional on an empirical test receipt and acceptance of the identified trust boundaries. It avoids a custom transport relay and global Docker edits. It is not execution-ready or a proven hard guarantee today.

Approve next only: administrator READ-ONLY PF/rules/state/port review and preparation of the exact dedicated-anchor integration/rollback plan. If password or interactive approval is needed, owner completes that step. Then separately approve installing/activating the reviewed host rules and ONE disposable publication test including an authorized external peer, exact image/container/ports and cleanup. Do not combine those approvals with Supabase startup.

Before second CLI startup, explicitly resolve unexpected-port and privileged-rule-change guarantees: accept the documented trusted-CLI/admin-stable-policy boundary, or approve design of API-level prevention/dedicated containment. Only after that and a passed firewall test approve one new official CLI attempt, separate log/ledger, no SQL/fixtures/app/production/publishing. Do not bypass old attempt state or interpret this report as authorization.

Rollback of a future approved policy must stop only new services/listeners first, verify ports idle, remove only the task-owned anchor/hook and release only its PF enable reference; do not disable PF globally, flush rules/states or alter other anchors. No rollback needed now because nothing was activated.

No production access, SQL/migrations/seeds, website, Git publication/deployment, Netlify or global Docker change occurred. First owner/admin review gate remains pending.
