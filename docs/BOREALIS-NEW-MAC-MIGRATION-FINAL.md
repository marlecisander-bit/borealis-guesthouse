# Borealis new Mac migration status

2026-10-20 (Europe/Tirane). Canonical repository `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`. Master-task Phase1 preparation only; stopped at its first explicit network-activation approval gate. No new Docker stack/network/image download, SQL, application startup/source changes, hosted resource, production access, Git publication or Netlify change.

## Completed operations

Verified canonical Git repository, main HEAD745b4aa56589cda5e5d0c8823ccc1cabb055e313 and expected GitHub origin. No tracked changes; existing setup reports/local preparation are untracked/ignored. Supplied IDE file is in canonical clone; actual VS Code open-folder root has not independently been confirmed. Original snapshot remains untouched.

Docker CLI/Engine29.8.2 ARM64 reachable; pinned local Supabase CLI2.121.0 SHA2566e8be5fb2802ccdd247d3b47823c31ed8d7e792255048594ba32ee79a55208dc verified. Current official docs and installed help reviewed; no CLI upgrade or Homebrew.

Created `.local/borealis-cli-official` with its own sterile home/tmp and official CLI init, run under OS-denied networking. Fresh config provenance captured; no Cloud login/link. Unique project_id=borealis-cli-dev-20261020. API55421, DB55422, shadow55420, Studio55423, local mail capture55424; optional pooler55429/analytics55427/edge5583 are separate from old stack and disabled where applicable. Migration/seed replay disabled, paths empty, active migrations empty. External secret env references blanked. Default external providers remain disabled; local mail capture only, not real SMTP. Auth signup settings are local future defaults, no users created.

Prepared preparation-manifest.json, prepared-file-manifest.json, NETWORK-POLICY-PENDING.json and check-only preflight.py. No real new local credentials exist until authorized platform startup. Production .env.local preserved and never copied into new workspace. Existing custom five containers are still stopped and all five original/recovery volumes are present. No relay implementation pursued.

An initial CLI help invocation using the real HOME failed trying to write CLI telemetry in the sandbox. It was rerun successfully under a dedicated empty HOME with network denied, as were subsequent init/help commands. No cloud credentials were loaded into the prepared environment. CLI status/start may print local credentials; future output must be captured privately.

## Concrete pending network/security policy

Propose a NEW ordinary bridge named borealis-cli-dev-20261020 with default host binding127.0.0.1, separate local CLI resources/volumes and explicit --network-id. It is **egress-enabled**, not air-gapped. Container internet access is possible; unlinked config/public-key separation is not a production firewall. No production credentials/login/link are supplied; platform external integrations remain off and no website/browser runs at this stage. Only official CLI-required infrastructure image provisioning/local bootstrap and harmless local checks would be permitted after approval. Actual bindings/ownership/health must be inspected, stopping only new project resources on any failure/exposure; never reuse/delete old custom resources.

Accept supported CLI automatic create/start instead of the old per-container pre-execution inspection pause. Loopback default and after-start inspection are not identical to that former guarantee. Read pinned startup code evidence: network-id reaches service builders; port callers may omit host IP, so network default plus actual inspect is required. Default bridge outbound masquerading differs materially from internal=true and needs explicit approval. If zero-egress remains mandatory, decline this activation and prepare an independently enforced VM/container policy instead.

## Blocked / untested

New config runtime/parser/service compatibility, actual new network ports/images, local credentials, API/DB/platform health are untested. CLI init succeeds but does not validate successful stack startup. Port availability checked now, not reserved. Full official service set may need more resources/images than custom five; record exact identities on future provisioning.

Phases2–7 are not executed: local migration replay needs reviewed manifest approval; fixture load/mutations need approval; app workspace/launcher/fonts/source work depends on verified platform/schema; full validation/release audit follows. Per master instruction, no independent later-phase work is advanced past this first approval gate. Existing migration collisions/helper/policy/production data assumptions remain. Existing reports are historical, not current end-to-end readiness evidence.

## Exact next authorization

Approve the documented new **egress-enabled standard local bridge and supported CLI automatic startup policy**, then provision/start only the new unlinked borealis-cli-dev-20261020 platform with separate554xx ports and new resources; retain all old custom containers/volumes/network stopped; migration/seed disabled; no Cloud login/link, application SQL, fixtures, app/browser, production or publishing. Capture secrets privately and perform harmless local health/configuration checks, stopping new project resources on failure. This approval does not include later migration/fixture gates.

If not approving standard egress, specify that zero-egress remains required; no new stack will be activated. Nothing was started automatically. This report is a gated status deliverable, not a claim the full migration is finished.
