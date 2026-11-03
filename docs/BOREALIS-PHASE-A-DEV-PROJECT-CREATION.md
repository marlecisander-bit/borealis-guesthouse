# Borealis Phase A — DEV project creation

2026-10-21 (Europe/Tirane). **Creation PASS — one independent hosted security DEV project is created and Healthy. Schema and security-test execution remain disabled.** The owner completed private password entry and project submission. No additional creation attempt was made.

## Verified project identity

| Item | Verified result |
| --- | --- |
| Name | Borealis Security DEV |
| DEV reference | `fnigbernzhnecprlbjpr` |
| DEV API origin | `https://fnigbernzhnecprlbjpr.supabase.co` |
| Organization | `kywcwpvblqjgfhetefxx` |
| Region | `eu-west-1` — West EU (Ireland) |
| Plan / compute | Free / NANO (`t4g.nano`) |
| Status | Healthy in project overview |
| Excluded production reference | `rlqyruulxyanfgvnzkpe` — distinct and forbidden by target guard |

The [DEV overview](https://supabase.com/dashboard/project/fnigbernzhnecprlbjpr) and unfiltered [organization inventory](https://supabase.com/dashboard/org/kywcwpvblqjgfhetefxx) identify the new project separately from production. The inventory now contains exactly those two projects. The dashboard labels the new project's default branch `main PRODUCTION`; that is Supabase's branch label within this new project, not the Borealis production reference. Target isolation uses the exact project reference/origin, never the branch label or project name.

## Free-plan and eligibility confirmation

Before creation, organization billing showed Free, the creation form offered Ireland without an upgrade/payment warning, and the previous owner attestation covered cross-organization Free capacity. The owner submitted the prepared form once. Successful provisioning establishes the slot was accepted; no paid-plan path or second project was used.

After creation, [organization billing](https://supabase.com/dashboard/org/kywcwpvblqjgfhetefxx/billing) still explicitly showed **Free Plan**, **spend cap enabled**, **no payment methods** and **no invoices**. No billing, subscription, paid compute or add-on change was performed by the agent. This meets the current $0 additional-spend boundary; it is not a perpetual pricing guarantee. Free quotas can restrict services and some quotas are shared at organization level, so keep future synthetic work bounded. [Official billing rules](https://supabase.com/docs/guides/platform/billing-on-supabase).

## Services and empty state

The new reference has its own provisioned primary PostgreSQL instance in Ireland and its own Auth/Storage dashboard namespaces. Auth Users showed **no users**; Storage showed the empty **Create a file bucket** state. The public-schema Table Editor displayed the create-table state with no listed application tables; overview reported **No migrations**, **No branches** and **No backups**. No production schema/data/objects/accounts were cloned or copied by this task.

These are provisioning/dashboard checks, not SQL schema, restore, transactional, authentication-login or Storage operation tests. Dashboard service requests/metrics are expected during inspection and do not constitute the prepared security suite. Existing overview warnings were not interpreted as certification or investigated through test execution. Managed platform schemas/services exist; their exact versions, owners and operation helpers still need baseline assessment.

## Credential and integration isolation

The owner supplied the new database password privately. The agent did not read, copy, print or store it, and did not retrieve API/JWT/service-role secrets. No production dotenv, password, JWT secret or API key was copied. Application keys remain blank in the inactive DEV template, so no application or test client is configured to run yet. Separate project identity establishes separate service scope; cryptographic key fingerprints were not independently compared because keys were not retrieved.

DEV-only settings changed and saved: **public signups disabled** and **Email Auth provider disabled**. Anonymous sign-ins and manual identity linking were already disabled; all other listed providers were disabled and no custom provider was configured. No Auth users, roles, memberships or login tests were created. Confirm-email protection was retained. Email login/signups are off; this does not claim every administrative Auth mail endpoint is technically disabled. Future fixture setup must use approved no-send administrative creation and/or verified mail capture before any mail-capable tests.

The [DEV integration settings](https://supabase.com/dashboard/project/fnigbernzhnecprlbjpr/settings/integrations) showed no GitHub repository, an uninstalled Vercel integration and **No connections yet**. No GitHub/Netlify repository or deployment integration was selected, installed or linked. No Netlify account/configuration was accessed; this is not a global inventory of external systems. No email/payment/calendar credentials, feeds, webhooks or schedules were installed by the task. Corresponding local runtime values and execution switches remain blank/disabled. No application is running against this DEV project.

## Ignored DEV configuration and production exclusion

Updated owner-only `.local/phase-a-security-dev-project-v1/`:

- `target-policy.json`: exact verified DEV reference/origin, organization/region, $0 bound and hard production exclusion; SQL/tests/fixtures/application/email/payments/calendar/deployment remain false.
- `development.env.template`: inactive template with only DEV identity/origin, blank keys and blank privileged/provider integrations. It is not an active dotenv file.
- `target_guard.py`: offline exact-target validator plus execution gate. It rejects the production reference, unapproved references, mismatched/ambiguous origins and execution while its switch is disabled.
- `creation-verification.json`, `dev-overview.jpg` and archived pre-verification report: sanitized evidence, no passwords/keys.
- Self-ignoring `.gitignore`: configuration/evidence excluded from Git; owner-only file permissions retained.

Offline guard checks cover the admitted DEV identity, hard production denial even under a tampered policy, foreign/null targets, userinfo, protocol, port, path, query and fragment ambiguity, and disabled execution. These are local safety-helper checks only; **none of the 55 Phase A security cases ran**. No network/database call is made by this helper. Future SQL/test runners must invoke it and use only DEV-bound credentials; no global enforcement over unrelated existing tools/scripts is claimed. Elevated setup credentials must remain separated from ordinary-role tests. Do not point existing unrestricted production-configured test commands at this target implicitly.

## Remaining blockers and exact next authorization

Provisioning is complete; the security-remediation phase remains unvalidated. Required before schema/test execution:

1. Complete the reconciled schema-only baseline: full DDL/defaults, owners, role inheritance, column ACLs, extensions, views and platform configuration are not fully captured.
2. Resolve the recorded eight-key CMS constraint versus ten-key application/RPC contract (`book`, `global`); do not replay migration 037 seeds silently.
3. Inspect actual DEV Storage operation helper/context/version compatibility; creation is not proof the F03 SQL works.
4. Resolve the 10 MiB recorded bucket versus 24 MiB hero UI contract and implement/review authenticated hero upload compatibility separately.
5. Prepare DEV-only ordinary-role credentials, synthetic fixture strategy and mail suppression; re-enable only the specifically reviewed DEV authentication paths when later authorized.
6. Prepare a reviewed schema recovery/restore procedure; the new Free project currently reports no backups.

**Exact next authorization:** prepare and review the reproducible schema-only baseline and guarded DEV-only execution harness for `fnigbernzhnecprlbjpr`, including read-only DEV platform/catalog assessment. Keep application migrations, fixtures and all 55 tests unexecuted until their reviewed package is explicitly authorized. Any new production metadata SQL inventory requires separate read-only authorization; no production change is implied.

No production project was opened or modified during this continuation; only its name/reference appeared in the organization inventory. No production SQL/data/Auth/Storage operation, application migration, synthetic fixture, security-suite execution, Git commit/push/merge, deployment, Netlify change, Docker change or paid billing action occurred. Stopped before schema and test execution as requested.
