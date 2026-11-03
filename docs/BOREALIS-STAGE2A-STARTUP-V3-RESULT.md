# Borealis Stage 2A startup-v3 result

2026-10-20 (Europe/Tirane). Canonical clone `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Overall FAIL at mandatory preflight. No container started and no startup attempt/retry performed.** All five remain exited. The sealed controller rejected PostgreSQL configuration; no gate bypass, receipt modification or corrective change occurred.

## Exact failure

Stage: preflight.configuration_fingerprint. Category: policy_rejection. Exception class: Failure. Safe reason: container_configuration_or_id_changed. No HTTP status applies. The error occurred before post-health stage instrumentation, so no per-stage elapsed timing was retained by the existing controller for this preflight failure. No startup-v3 attempt marker exists.

Read-only follow-up confirmed exact IDs unchanged; DB normalized snapshot mismatches the recovery-v2 receipt, while Auth/REST/Storage/Kong match. Startup-v3 input seal/historical receipt/provenance validation passed before the mismatch. Required reports were read. No live HTTP, SQL/catalog, authentication or network probes were run.

## Final states

| Service | Exact ID | Final state | Receipt match |
| --- | --- | --- | --- |
| db | `3a5d753746d8d1909b95831f47f11acd39160fe0ea771a08fe3ff3379fb2afe7` | exited | False |
| auth | `8ab9c783fa1bd919223176bb179841ac6acb8b7edfdb58f57f6c237356981b91` | exited | True |
| rest | `8949d74edb50e2d152d7fe16b6c7e78936a16c763d90dcb81d98bd8f842036d6` | exited | True |
| storage | `d0561e270eb1a0a78fa9a60b8dd38adcd67abd9834d3a918e9235d4b3abcb54b` | exited | True |
| gateway | `4c2bc800f2edd1f565d6b45795712a5b51a0c31dd7686265fa70a4cc26fd9494` | exited | True |

## Read-only evidence

Compared current DB Config/HostConfig/Mounts against the earlier private captured inspect evidence. Differing paths only (no values):

- HostConfig.DnsSearch
- HostConfig.Dns
- HostConfig.DnsOptions

This path comparison is supplementary evidence, not an approved normalization or proof of harmlessness. The historical receipt remains authoritative; do not accept a newly observed difference without a separately reviewed explanation. Full private metadata/credentials were not printed.

All original and recovery named volumes were rechecked present: True. No volume mount/reset/deletion, container recreation/removal, image pull or service operation occurred. Seals, receipts, historical ledgers and attempt markers are preserved.

Sanitized evidence: runtime/startup-v3/preflight-failure-result.json, mode600. It records exact IDs, states, receipt-match booleans, safe failure classification and differing field paths without secret values.

## Requested verification decisions

| Verification | Result |
| --- | --- |
| Historical inputs/seal/receipt and exact IDs | PASS at read-only input validation |
| DB configuration fingerprint | FAIL |
| Other four configuration fingerprints | PASS |
| Five stopped states / volume presence | PASS |
| PostgreSQL/Auth/REST/Storage/Kong live health | NOT RUN; preflight stopped execution |
| Loopback API/DB connectivity | NOT RUN |
| Roles/schemas/extensions / HBA / password enforcement | NOT RUN |
| Empty application catalog and Auth-user checks | NOT RUN |
| Runtime IPv4/IPv6/DNS denial and live port checks | NOT RUN |

Static bindings/network restrictions remain sealed, but runtime network/health checks cannot be claimed passed. Production reference was never used as a request target. No production credentials were loaded.

## Next action, shutdown and Stage 2B

Separately authorize read-only investigation of the new DB fingerprint difference and preparation of any justified narrowly scoped correction. Do not retry startup-v3 or rewrite receipts to accept unexplained drift. A later startup requires revalidated configuration and separate authorization.

No shutdown is needed: all five already stopped. If later separately approved runtime needs shutdown, use the sealed startup-v3 owned-ID stop operation with STOP_DIAGNOSTIC_EXACT_IDS_V3 under minimal environment; never prune/reset/delete volumes.

Stage 2B: **NOT READY**. Mandatory startup security preflight failed; all local platform/catalog/authentication/network requirements remain incomplete. No Borealis SQL/migrations/seeds/bookings/users, website, production access, Git commit/push/merge/deploy, Netlify or global Docker changes occurred.
