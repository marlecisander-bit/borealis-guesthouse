# Borealis Stage 2A DNS fingerprint investigation

2026-10-20 (Europe/Tirane), canonical clone `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Investigation and inactive correction preparation PASS. No infrastructure mutation or startup.** Five exact containers remain stopped; historical receipts/controllers/seals and all volumes are preserved.

## Exact differences and reconstruction

| Field | Historical DB type/value | Current DB type/value |
| --- | --- | --- |
| HostConfig.Dns | null | array [] |
| HostConfig.DnsSearch | null | array [] |
| HostConfig.DnsOptions | null | array [] |

Auth/REST/Storage/Kong have historical and current empty arrays for all three fields. There is no configured resolver/search/option value in these lists. Restoring ONLY these DB DNS fields to historical null plus the already verified OOM false representation reconstructs the exact original receipt fingerprint. Equivalent reconstruction passed for all five, proving no other fingerprint-covered security field changed. Mounts, credentials/environment, image/ID, capabilities, ownership, ports/restart and remaining configuration retain strict equality.

## Docker implementation evidence

Matching installed Engine29.8.2 commit8af9fe3 [buildSandboxOptions source](https://github.com/moby/moby/blob/8af9fe3/daemon/container_operations.go) checks len(HostConfig.DNS), len(DNSSearch) and len(DNSOptions). Only nonzero lengths supply per-container overrides; otherwise each falls back to the same daemon configuration path. Go nil and empty slices both have length0, establishing equivalent override selection. This establishes effective equivalence, not the precise code location/time that changed JSON null into an empty array. No documentation guarantee of byte-stable inspect representation is asserted.

Read-only copies of Docker-managed /etc/resolv.conf from each stopped container contain identical directives: nameserver127.0.0.11, options ndots:0, no search directive. This is generated resolver-file evidence, not a live DNS test or proof of no daemon forwarding. No live probes or database-volume mounts were used.

## Security assessment

All three changes are **expected-equivalent empty representation**, with no new per-container resolver/search/options. They do not themselves add a route, resolver destination, host mapping or extra network. Empty/null both inherit the same daemon defaults; therefore neither proves external DNS is impossible. A future daemon DNS configuration change could affect both equally and requires runtime denial checks. Docker Desktop/host gateway reachability remains independently bounded by internal-network policy/probes, not DNS-field normalization.

Approved exact internal network identity remains e1a8111682ffdc13c667d86f514dbd09265802dc73ba016dec63a6fc50bcabb1. Live attachments/routes, IPv4/IPv6/external-DNS denial must still pass after separately approved startup. No effective DNS bypass was observed in stopped metadata, but runtime isolation is not declared verified.

## Stable verification model

Separate two responsibilities: canonical immutable/security configuration and explicit dynamic-runtime assertions. Fingerprint full Config/HostConfig/Mounts, image/ID and requested network names; preserve exact equality except independently justified scalar/list representations. Verify actual running NetworkID, approved endpoints, ownership and loopback host publications separately. Keep dynamic state/health/timestamps/IP allocation out of the static fingerprint, while explicitly validating them in runtime gates. Unknown new fields/values must fail, not disappear through a reduced allowlist.

The proposed rules add ONLY these three present DNS fields: null or exactly empty list → empty list. Nonempty DNS servers, search domains or options are rejected; wrong types and missing fields reject. Existing OomKillDisable false/null rule remains independently gated on daemon capability/cgroup behavior. There is no generic null/empty rule.

## Separate inactive controller revision

Prepared runtime/startup-v4: startup.py, diagnostics.py, handoff.json, resume-baseline.json, dns-validation.json, startup.lock.json and tests. Historical startup-v3 and v2 code/seals/receipts/attempts are untouched. dns-validation.json records exact comparisons, provenance and canonical fingerprints derived only after exact historical receipt reconstruction. It is a versioned validation record, not an overwritten receipt or automatic execution approval.

The proposal binds original historical receipt/state hashes and transitive preparation seals, retains exact approved images/credentials/network/ports/mounts/security/ownership and all stage-specific diagnostics. Actual runtime NetworkID and documentation-address IPv4/IPv6/DNS checks remain unchanged. Per-revision attempt markers still prohibit automatic retry. No create/remove/recreate/reset path exists.

New explicit gate RESUME_DNS_CANONICAL_EXACT_IDS_V4 exists only for a separately authorized future attempt. Its presence is not activation/authorization; it was not invoked. Proposal preflight was read-only. Existing exited-state policy/volume preservation and exact-owned failure-stop behavior remain.

## Regression results

PASS: Python syntax; eleven startup/security test methods and three diagnostics methods (fourteen total), plus real read-only proposal preflight. New cases cover null/empty equality independently for each DNS field and rejection of resolver/search/option lists, strings, booleans, objects and integers. Existing tests reject additional/host network, wrong NetworkID, public ports, ID/image/privilege/mount/environment/credential drift, stale/tampered receipt, unauthorized startup and automatic retry. Simulated start/health/SQL/failure-stop operations were mocked; no real starts or queries occurred. Diagnostic tests retain secret-sentinel redaction and exception classification.

Private configuration remains owner-readable only, directory700/files600; reports contain no credentials. Synthetic success output is not live service-health evidence.

## Revision hashes

- startup.py: `e818ac900ce3da0e59e811081492db30268513dab6b38493ee367e29d3896adc`
- diagnostics.py: `89b420367d807a411ab26e490ab16c798ce0c92e45590a67153ad6e9d58b0c70`
- handoff.json: `230c8d614a9e09b213737e7b56317fa8922e31f02208f84fa32e217a8c3c582e`
- resume-baseline.json: `adca6c0e4043c382f4c337c3cb8363e60689d900e511d42c5edb9af7ed3479ee`
- dns-validation.json: `13f40a11476fbcaaaeb6e6b5386a4e93d738a148a0a25deb1c31f27a32d6e6fd`

Seal SHA-256: `98000f432aefb4cc02fc87f72c181c9db1cb4605530dbeaedb9f0a6d83949366`.

## Remaining risks and next authorization

The earlier post-health failure is still unresolved; DNS canonicalization addresses preflight representation only. Container health, catalog/roles/schemas/extensions, effective HBA/network-client password enforcement, loopback connectivity and runtime egress remain incomplete. Identical resolver files are not a substitute for DNS denial. No assertion is made that every host gateway path is unreachable. Concurrent Docker daemon clients remain a TOCTOU boundary.

Separately authorize activation/use of startup-v4 for one exact-ID resume with RESUME_DNS_CANONICAL_EXACT_IDS_V4, required local official platform initialization and harmless staged verification, and owned stop on any failure. Preserve all volumes and historical evidence; no automatic retry, receipt rewrite, image change, reset or security relaxation. Broader roles/HBA assertions require explicit completion before Stage2B readiness. No Borealis SQL/seeds/bookings/users/website is included.

No production access, Git publication, deployment, Netlify or global Docker changes occurred. Stop point: all containers stopped; startup-v4 inactive pending separate authorization.
