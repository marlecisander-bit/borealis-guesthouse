# Borealis hosted development preparation

2026-10-20 (Europe/Tirane). Canonical repository `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Preparation complete; no project created.** Read-only Dashboard metadata verifies the selected organization is Free and production is in Ireland. The owner confirmed both organization owners remain below their cross-organization Free-project limits. These facts support creating one additional Free project at $0 under the conditions below. Separate creation authorization remains required; no unconditional future billing guarantee is claimed.

## Verified account metadata

| Item | Finding | Evidence/status |
| --- | --- | --- |
| Production project | borealis-guesthouse; rlqyruulxyanfgvnzkpe | Existing authenticated Dashboard General settings |
| Organization name | marleci@yahoo.com's Org | Dashboard organization header |
| Organization identifier | kywcwpvblqjgfhetefxx | Organization navigation URL |
| Plan | Free | Billing → Subscription Plan |
| Production region | eu-west-1 — West EU (Ireland) | General settings; not inferred from project URL |
| Listed organization projects | One: borealis-guesthouse, NANO | Unfiltered organization Projects list; no paused badge shown |
| Creation region availability | West EU (Ireland), eu-west-1 offered | Unsubmitted New Project region menu |
| Spend cap | Enabled; Dashboard states no extra usage charge | Billing page, unchanged |
| Owner/Admin Free capacity | Both owners below two active Free projects | Owner's explicit confirmation in this conversation; not independently audited across their other organizations |
| New DEV reference/URL/keys | Not allocated | Project has not been created |

The existing Dashboard session was used only for authorized organization, region, plan and creation-eligibility metadata. No table editor, SQL editor, Auth-user list, storage objects, production API keys or database connection was opened. The creation form was inspected without submitting and canceled; the browser was returned to the organization project list. No name/password was entered by this task and no credential was copied from the form.

Account evidence pages: [production General metadata](https://supabase.com/dashboard/project/rlqyruulxyanfgvnzkpe/settings/general), [organization projects](https://supabase.com/dashboard/org/kywcwpvblqjgfhetefxx), [organization billing](https://supabase.com/dashboard/org/kywcwpvblqjgfhetefxx/billing). These require the owner's existing access and are not public evidence.

## Free eligibility and zero-cost boundary

Supabase assigns plans at organization level. This organization is already Free, so a second eligible project need not select paid compute or upgrade. Official rules permit two active Free projects across organizations where a user is Owner/Admin; another owner/admin who has exhausted that allowance can also block creation. One project in this organization alone was therefore insufficient proof. The owner subsequently confirmed both owners are below the limit. The inspected creation form showed no upgrade or quota-blocking notice; that is supporting evidence, not a completed provisioning guarantee. [Billing rules](https://supabase.com/docs/guides/platform/billing-on-supabase), [Free-project eligibility FAQ](https://supabase.com/docs/guides/platform/billing-faq).

**Expected additional charge: $0, conditional on creation remaining on Free with no paid add-ons, upgrade, payment approval or billing change.** No paid compute is required by the reviewed Free creation path. No checkout/payment request was observed. Recheck immediately before submission: exact organization, exact eu-west-1 region, Free eligibility and no charge/upgrade. Stop on any change, payment prompt, exhausted quota or ambiguous cost. Do not treat the spend cap as approval for unrelated purchases or paid features.

A perpetual $0 guarantee cannot be inferred from today's UI: eligibility, member projects or plan may change. Free service can pause or hit quotas. Same-organization usage quotas can affect production availability when exhausted, even with separate databases; development must stay small and monitor shared usage without changing production. This is a residual tradeoff of the owner's same-organization selection. [Current pricing](https://supabase.com/pricing), [billing FAQ](https://supabase.com/docs/guides/platform/billing-faq).

If creation cannot remain unambiguously $0, stop. A separate Free organization is an alternative requiring fresh owner approval and still subject to applicable Free-project capacity. Do not transfer production, alter membership/roles, pause projects or upgrade to obtain capacity.

## Proposed DEV identity and platform configuration

- Name: Borealis Guesthouse DEV; organization kywcwpvblqjgfhetefxx; exact region eu-west-1, not the general Europe auto-placement option.
- Free project with independent generated database password, new project reference, API URL and public key. Never copy production JWT secrets, passwords or service-role keys. The owner should enter/store the new database password privately; no password is needed for preparation.
- Leave optional GitHub integration unconnected: the creation page advertises automatic schema deployments. No repository/deployment linkage is selected.
- Data API may be enabled for application testing; disable automatic exposure of new tables and review explicit grants/RLS before access. Automatic RLS can be enabled for a new DEV project after checking compatibility with reviewed migrations; do not infer RLS correctness from that toggle alone.
- Auth initially unused: disable signups/providers/real delivery in DEV before testing. No test users yet. Future email/password flows require a reviewed delivery-suppression or test-provider plan; leaving hosted default SMTP in place is not proof of no email.
- Storage initially empty, no production buckets/objects imported; prepare only reviewed bucket/policy definitions later. Public media exposure requires explicit policy review.
- No real SMTP/Resend credentials, Stripe/payment providers, calendar feeds, real recipients, webhooks or schedules. Blank environment values alone do not disable every possible database/provider action; review the created DEV project settings before enabling application requests.

## Isolated application workspace prepared

Created ignored owner-only preparation directory `.local/borealis-hosted-dev-preparation` with:

| Artifact | Purpose |
| --- | --- |
| source/ | 304 copied tracked app/public/config files, independent source snapshot |
| source-manifest.json | Per-file SHA-256 of snapshot bytes |
| policy.json | Inactive proposal: exact organization/region, $0 limit, null DEV reference/URL, activation false, production reference blocklist, integrations/deployment/SQL disabled |
| development.env.template | Blank credentials and disabled integration variables; localhost site/app origins only; not an active dotenv file |

Validated snapshot has no .git metadata, .env files, node_modules or .next build output. No database SQL, canonical production dotenv or deployment configuration was copied. Snapshot creation does not install dependencies or start an application. The copied source was checked for the production reference; none found. This focused check is not a complete secret audit. Canonical application source was not edited.

The policy is a preparation record, not a runnable security guard. A production-free launcher remains a prerequisite for website authorization. It must accept only the newly assigned DEV reference and exact HTTPS API host; reject null/placeholders, production reference, alternate hosted targets, inherited cloud/proxy/deploy variables and production keys. Inspect the future public-key project binding where applicable; never log keys. Use a clean HOME, allowlisted environment and independent build directory. Modern publishable keys may not be JWTs, so do not rely solely on JWT parsing.

Supply NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from DEV only; leave SUPABASE_SERVICE_ROLE_KEY unavailable initially. Source review confirms server-service paths throw when that key is absent, so some admin/notification operations will remain unavailable until separately reviewed DEV-only server credentials are approved. Leave RESEND_API_KEY, RESEND_FROM_EMAIL, STRIPE_SECRET_KEY, PAYMENT_PROVIDER_SECRET and ICAL_SYNC_SECRET blank. The current email channel requires Resend credentials; the calendar sync endpoint rejects an absent secret. Do not claim these checks cover all direct integration paths.

The snapshot contains no Git repository and no Netlify configuration or deployment credentials were supplied. This removes ordinary push/deploy capability from that directory, but it is not an OS-level prohibition on other host processes using canonical credentials. Same-organization Dashboard owners still have production access. Use a dev-only runtime without browser/session tokens; enforce network/identity isolation separately if technical prevention of production requests is required. No website can be described as safely launched under an unimplemented launcher.

## Migration preparation and dependencies

Read the existing migration manifest and local development dependency review. All 44 manifest source hashes currently match their recorded source bytes. Forty-two entries are review-required copies; two are excluded production-specific data migrations. No SQL was executed or promoted into active replay.

1. Preserve original database files. Assign unique 14-digit versions in a derived history; filename-only review copies do not establish a valid runnable sequence. Duplicate date prefixes and repeated descriptive 006/037 labels must not determine dependency order by themselves.
2. Establish a fresh DEV Supabase platform baseline and required roles/auth/storage/extensions before application schema. Apply legacy schema only to an empty reviewed target. Canonical migration 001 depends on it.
3. Decide whether media-storage.sql and cms-foundation.sql are still required by consumers; if retained, baseline → media storage → legacy CMS foundation → canonical migrations. Audit surviving legacy email-admin policies against later profile authorization rather than installing overlapping RLS blindly.
4. Order helper functions, enums, tables, constraints and dependent RPCs explicitly. Rate activation depends on 004; experience 032 precedes replacement 033; multi-room 037 precedes occupancy 038. Review function replacements and transaction boundaries; fail on first error.
5. Review anon/authenticated grants and RLS positive/negative cases; test service-role bypass only in DEV under separate approval. Storage bucket policies depend on platform helpers and media schema. Review Realtime publication changes and avoid external side effects.
6. Exclude 20260910_034_family_room_lake_view.sql and 20260910_035_triple_room_lake_view.sql from schema replay: both depend on a production property identity. Create fictional property/room/rate fixtures later, without production UUIDs, people or media. Do not reuse setup-first-admin.sql with its personal-email/live-property assumptions.
7. After separate SQL approval, prove the approved derived history against the exact DEV reference, then independently verify final tables/RPCs/RLS/storage policies. No production schema/history pull or remote reset is included. Synthetic fixtures and mutation scenarios need their own authorization and assumptions review.

Migration status: provenance verified, dependency plan prepared, executable reconstructed SQL NOT approved or validated. Creating DEV does not authorize replay.

## Docker preservation

No Docker command or infrastructure operation was run by this task. Both existing local stacks remain outside this workflow. Preserve all nine official containers, five historical custom containers, the two official volumes, all five custom volumes, both networks, cached images, private logs, attempt markers, seals and diagnostic reports. This report makes no new live Docker-state claim; prior recorded stopped-state evidence remains the baseline. No cleanup, reset, reuse or migration from these volumes is needed for the new hosted project.

## Remaining gates and exact creation authorization

Eligibility is supported by live Dashboard plan/region metadata plus the owner's Free-capacity attestation. Revalidate those transient conditions at submission. No DEV reference/credentials exist yet; launcher enforcement, DEV Auth delivery suppression, storage/RLS review and executable migration reconstruction remain pending.

Required next approval: “Create exactly one Borealis Guesthouse DEV project in organization kywcwpvblqjgfhetefxx, region eu-west-1 (West EU/Ireland), Free plan only, maximum additional spend $0. Stop if any quota, upgrade, payment or paid-add-on prompt appears. Generate independent credentials privately; do not link GitHub, production or deployment. No SQL, users, fixtures or website startup.”

Owner must complete any required private database-password entry or legally binding acceptance at action time. Do not request production credentials. After creation, record the new identity and verify DEV-only settings before separately approving local launcher implementation, reconstructed migrations, synthetic fixtures and website testing. This document is not creation authorization.

No production modifications, customer/booking/Auth-user/storage-object access, credential copying, SQL, project creation, billing change, Docker change, website startup, Git publication or Netlify action occurred.
