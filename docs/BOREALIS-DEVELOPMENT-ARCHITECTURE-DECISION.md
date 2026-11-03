# Borealis development architecture decision

2026-10-20 (Europe/Tirane). Analysis only; implementation is not authorized by this document. Canonical clone: `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

## Decision

**Recommend Option A: the official Supabase CLI for everyday local development. Stop investing in the custom exec-stream relay.** Add Option B only later if shared staging/hosted parity is needed. Keep the current Compose resources stopped and preserved until the supported workflow is proven and cleanup is separately approved.

This recommendation deliberately distinguishes **production separation** from **complete network air-gapping**. A standard CLI Docker network permits outbound access by default; CLI startup does not provide the earlier required create→inspect→start pause. Adopting A therefore requires explicit approval to replace those two earlier architectural requirements with reviewed supported bootstrap, credential isolation and appropriately scoped network enforcement. Nothing here weakens existing controls or authorizes that change automatically.

If absolute container/browser/host zero-egress and pre-execution inspection remain non-negotiable, neither standard A nor hosted B meets those requirements as proposed. C remains a custom engineering project; there is no honest claim that the simpler workflow provides all the previous restrictions for free.

## Comparison

| Criterion | A: official local CLI | B: separate hosted development project | C: custom five-service Compose + relay |
| --- | --- | --- | --- |
| Initial setup | Low infrastructure complexity: installed Docker/pinned CLI, new unlinked workspace, reviewed config | Low local infrastructure; owner creates a new project and approves region/billing/access | High; custom bootstrap, fingerprints, lifecycle and unimplemented transport |
| Local website | Standard local API/DB endpoints; verify actual loopback bindings | Website local, backend remote; internet required | Current published API inaccessible; relay must be implemented/tested |
| Production separation | Separate local DB/keys/volumes; no production link needed | Distinct project/keys/data; strongest with dev-only identity/org access | Separate local DB already exists; production credentials still require host/app isolation |
| Network security | Ordinary bridge egress allowed unless additional tested controls; local-only endpoint does not mean no egress | Explicit network access to dev cloud required; cannot be offline | Internal network denies tested external paths; host transport unresolved |
| Booking/pricing/availability/CMS tests | Full local mutation testing after safe schema/seed; reproducible disposable fixtures | Full dev-project mutation testing, subject to quotas/concurrency/shared state | Possible after transport, bootstrap/parity, schema and seed work |
| Migration workflow | Standard versioned migrations, local reset only after approval | Same SQL must be repaired; reviewed dev-target-only deployment | Same SQL problems plus custom platform ownership |
| Feature compatibility | Supported local Auth/Storage/API and optional local services; still not identical to hosted | Closest hosted platform behavior | Only DB/Auth/REST/Storage/Kong; no running Studio/Realtime/functions/mail/analytics/pooler |
| Codex / VS Code | Standard documented commands behind small local-target guards | Simple env switching but greater credential/remote-target risk | Large custom controller/receipt/relay surface and repeated bespoke troubleshooting |
| Maintenance | Lowest for local schema iteration; pin/review CLI upgrades | Low infrastructure, ongoing billing/security/quota/admin work | Highest; component compatibility, private gateway, lifecycle, normalization and relay |

Official [CLI installation/local operation](https://supabase.com/docs/guides/local-development/cli/getting-started) supports running locally without a hosted link; the [workflow guide](https://supabase.com/docs/guides/local-development/cli-workflows) documents migration/seed replay. Local service initialization is not permission to load this repository's SQL automatically. Current pinned CLI2.121.0 still needs version-specific config review before use; do not assume every new documentation flag exists in it.

## Costs and maintenance

A has no Supabase hosted-project charge for the local stack; it consumes Mac RAM/disk/CPU and Docker use remains subject to Docker Desktop licensing. Infrastructure image downloads and runtime upkeep remain real costs. It avoids hosted inactivity pausing and is the best place for repeatable DB resets/destructive fixture tests against explicitly identified local data.

B may cost $0 if an eligible free-project slot is available. Current official limits include two active Free projects, 500MB DB per project, 1GB file storage, 50,000MAU, 5GB egress and 5GB cached egress; inactivity can pause projects after one week. Free automatic backups are not included. This is ample for modest synthetic development, not a guarantee of capacity, uptime or account eligibility. [Pricing](https://supabase.com/pricing).

Pro starts at $25/month per organization with $10 compute credit; an additional Micro project generally adds about $10/month if that credit is already used. A new Pro organization with one Micro is approximately $25/month before extras/tax/usage; two Micro projects in one Pro organization approximately $35 total. These are estimates, not the user's bill. Paid compute and add-ons can add charges; a spend cap is not a universal bill ceiling. No account plan/free slots were inspected. [Billing model](https://supabase.com/docs/guides/platform/billing-on-supabase), [compute/pricing](https://supabase.com/pricing).

A free dev project generally requires an eligible Free organization; do not assume a project added to an existing Pro organization can individually use Free pricing. Do not move or change production's organization/plan to obtain a dev slot. Hosted B needs independent keys, auth redirects/provider settings, RLS/storage configuration and synthetic seed; it does not eliminate migration work. Disable real recipients/providers/feeds. Local Auth mail capture is preferable for routine auth testing; do not send real email from hosted dev without separate approval.

C has comparable local hardware cost to A plus the largest engineering/maintenance cost. Remaining work includes relay binary/EOF/cancellation cleanup and sandbox tests, exact-ID transport receipts, host API/DB checks, HBA/password verification, complete platform catalog/roles/extensions, runtime egress/host-gateway checks and all application SQL/fixtures. The relay host process has Docker control-plane privilege and adds a novel failure/security boundary. It offers no application-development benefit sufficient to justify this complexity here.

## Enforceable safeguards versus discipline

| Safeguard | What can be enforced | Limit / human dependency |
| --- | --- | --- |
| Separate DB and synthetic data | Independent local volume/project identity or dev cloud project; dev credentials cannot authenticate to production by themselves | Wrong production credentials/URLs still defeat the intent |
| Credential exclusion | Sterile launcher/runtime directory, no production .env files, owner-only ignored local config, explicit dev endpoint/key checks | Git ignore prevents routine commits, not deliberate credential use or all logs |
| CLI local targeting | Fresh unlinked workspace, no CLI access token/production link; allowlisted local commands with explicit local targets | CLI still has remote capabilities; a developer can run it outside the guard |
| Network protection | Verified OS/VM/browser/container egress controls can deny production or all nonlocal traffic; a separate isolated dev VM is another boundary if needed | Standard bridge and URL checks are not a firewall. Host-only sandbox does not constrain Docker VM/browser automatically |
| Deployment separation | Dev runtime has no GitHub/Netlify/deploy credentials; separate low-privilege identity; repository push protection where configured | Branch names/manual promises alone do not stop a push-triggered production deployment |
| Mutation safety | Allow local-only DB mutations against exact identity; RLS tested with anon/auth roles; email/payment/iCal blank | API key presence does not make reads/write-free; application/server actions must remain dev-targeted |

A local project can be created and operated without cloud login/link. With a clean workdir and token-free identity, ordinary local commands can be constrained to local resources. **Unlinked alone cannot guarantee no production access**: app public production key/URL, arbitrary HTTP, saved credentials or browser state are separate paths. Absolute prevention requires enforced network/identity isolation, not merely a project name. Production public keys are not write-safety barriers; RLS and endpoint isolation matter.

Never source production .env.local. Next automatically reads it; a different filename alone is insufficient. Preserve it in the canonical clone, but use a separate clean dev worktree/runtime directory without production dotenv/build output, with a launcher supplying all supported env values (including explicit blank integrations), rejecting hosted endpoints for A and requiring the exact new dev reference for B. Keep local build artifacts separate. A clean worktree needs reviewed Git access and must not introduce publication; no worktree was created here.

No automatic production deployment should be part of development. Keep deploy/Git write credentials out of the dev runtime and require separate explicit publication approval. To technically prevent accidental pushes from this machine/environment, choose read-only Git credentials or stronger account/process restrictions. Inspect current GitHub/Netlify triggers read-only only when separately requested; this task did not inspect or modify remote settings.

## Migration compatibility: shared blocker for all options

Existing database/migrations is not a ready CLI history: date-prefix collisions, duplicate descriptive006/037 labels, legacy schema/helper/RLS ordering, and production-property seed migrations034/035. Keep original SQL intact. Use the existing review-manifest/hashes as input to a reviewed uniquely timestamped migration set; exclude production-specific data seeds and replace them with fictional fixtures. Verify baseline/auth/storage roles/extensions and final schemas locally; do not copy production UUIDs/customer data or pull production schema/history.

First platform startup should have migration/seed replay disabled and an empty active migration directory, verified for the pinned CLI. Supabase documents that start/reset can replay migrations and seed; never point unchecked historical SQL at a new stack. Once reviewed, prove a clean local replay, synthetic property/rooms/rates/availability/CMS/experience/transfer setup and local booking hold/confirmation/cancellation tests. Database reset is a destructive local operation requiring separate approval for exact project/volumes. [Migration workflow](https://supabase.com/docs/guides/local-development/database-migrations), [seed lifecycle](https://supabase.com/docs/guides/local-development/seeding-your-database).

Hosted dev cannot fix broken ordering or hardcoded data assumptions. Use local verified history before dev-project application; remote DB operations must explicitly validate the new dev reference and use an identity with no production privileges.

## Proposed transition from current setup

1. Record approval of A and its changed network/pre-inspection policy. Preserve the current stopped custom stack; do not implement the relay. Continue strict no-production-access scope.
2. Prepare a **new** unlinked official CLI workspace/project ID and separate config/ports/volumes, without reusing custom Compose data. Preserve migration/seed disabled initially. Prepare token-free command guard, isolated app environment and reviewed network boundary. Existing custom IDs remain historical; the new official CLI necessarily creates a different stack.
3. Under separate approval, provision only needed official images and start the standard local stack. Verify actual localhost API/DB access, auth/storage/platform schema, service/network/port behavior and production exclusion. Ordinary CLI create/start replaces the custom stopped-inspection workflow only after approval; no implicit exception.
4. Review derived migration set, then separately approve local SQL and synthetic fixtures. Test RLS, booking inventory/pricing/cancellation and CMS using fictional records. Keep notification/payment/iCal disabled; optional local-only test integrations need separate approval.
5. Separately approve the production-free app worktree/launcher, offline font correction and local app/browser tests. Google Fonts build downloads remain an independent issue; use licensed local font assets/next/font/local only after application source authorization. Do not spend more on the database transport to solve a font dependency.
6. If shared staging is needed, create B later with owner-approved plan/region/dev identity and synthetic data. No production import/link/SQL is needed. Keep local A as the reproducibility/migration test environment.
7. Only after new workflow acceptance, separately approve optional retirement of exact custom containers/images/network/volumes. Preserve diagnostic history first; no prune or broad deletion.

## Resources to preserve now

Read-only verification this task confirmed five stopped custom service containers and all expected volumes. Preserve exact DB3a5d753746d8d1909b95831f47f11acd39160fe0ea771a08fe3ff3379fb2afe7 and existing Auth/REST/Storage/Kong IDs recorded in startup-v4 report. Preserve:

- borealis-local-controlled_db-data and db-config (partial historical bootstrap).
- borealis-local-controlled_db-data-recovery-v1 and db-config-recovery-v1 (initialized platform data).
- borealis-local-controlled_storage-data.
- Internal network borealis-local-only-isolated and cached five official service images/BusyBox.
- Pinned local CLI, original SQL, review migration manifest/copies, synthetic seed drafts, seals/receipts/controllers/probe evidence/reports and production .env.local.

No old volume should be auto-adopted by CLI; doing so would undermine clean reproducibility and platform compatibility assumptions. No containers were started/removed, networks changed or volumes mounted/altered in this decision task.

## Exact approvals required before implementation

1. Approve Option A as the preferred architecture, explicitly replacing custom pre-start per-container inspection and internal-only zero-egress topology with a documented supported-stack security policy. If retaining absolute zero-egress, approve a separate enforceable containment design first; do not silently use a standard egress-enabled bridge.
2. Approve preparation of a new local CLI config/workspace and production-free launcher/environment, still without starting containers or executing SQL. Specify whether constrained egress or complete offline containment is required and where it will be enforced.
3. After review, approve official CLI local image downloads/new containers/volumes/network startup and harmless local checks. No hosted login/link or Borealis SQL included.
4. Separately approve reviewed derived SQL corrections, local migrations, fictional fixtures and local mutation tests; approve any local reset by exact identity.
5. Separately approve font/application source changes and local website/browser testing; no publication/deployment included.
6. If B chosen instead/later, approve a brand-new dev project, organization/region, dev-only access and maximum spend (Free if eligible or explicit paid budget). No production account/plan modification, project creation or charge has been incurred.
7. Optional old-resource cleanup requires exact-resource deletion approval after acceptance. No cleanup is needed to make this analysis useful.

**Outcome:** A best balances safe separate development, migrations, booking/CMS tests and straightforward VS Code/Codex operation. It does not remove the need to repair migration history, isolate Next environment variables or authorize deployment independently. C's custom transport should be paused; B is optional staging, not a prerequisite for routine local development.

No SQL, production access, hosted creation, application source change, Git publication/deployment or Netlify modification occurred. Implementation remains unapproved.
