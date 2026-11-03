# Borealis production release readiness

2026-10-20 (Europe/Tirane). Canonical repository `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`. Master-task Phase1 preparation only; stopped at its first explicit network-activation approval gate. No new Docker stack/network/image download, SQL, application startup/source changes, hosted resource, production access, Git publication or Netlify change.

**NO-GO. No validated application release candidate exists.**

## Current change manifest

Application/database/dependency tracked diff: none. This task added only ignored `.local/borealis-cli-official` preparation and three requested status reports. Detailed preparation file/checksum manifest is `.local/borealis-cli-official/prepared-file-manifest.json`; existing untracked historical reports are not silently part of a release. Environment/home/cache/log files must never be published. Decide later whether reviewed reproducible local tooling/configuration belongs in Git with sanitized examples; local credentials/artifacts never do.

## Completed versus pending audit

Local main HEAD745b4aa56589cda5e5d0c8823ccc1cabb055e313 and expected GitHub origin verified; no tracked changes. Live remote HEAD/main, Netlify linked repository/production branch/triggers/current deployed revision/env names/readiness were NOT inspected in this gated Phase1 run. Prior repository netlify.toml intent is not proof of live configuration. No staging environment assumed. Production DB history was not inspected; separate narrowly scoped read-only authorization is required. No production-connected operation was made.

Node24.21.0 was previously observed locally while repository hosting config pins20.19.5; compatibility/parity still needs rechecking during the authorized release phase. No Netlify configuration changed.

## Release prerequisites and impact

Complete new local platform approval/startup → reviewed local migration manifest approval/replay → fixtures/mutation approval → isolated app/font compatibility work → full lint/types/unit/build/browser/local domain validation. Then perform authorized read-only GitHub/Netlify audit and rewrite the release candidate manifest around final actual source changes. No production schema change is currently proposed or authorized. Font/dev-only changes must be assessed separately from SQL; do not ship local-only endpoint/guard defaults into production.

Current application production compatibility and DB migration impact are UNKNOWN pending validation/history review. Any production SQL requires its own migration-first plan, additive/backward-compatible analysis, backups/recovery checks and explicit owner approval. App rollback does not reverse schema/data changes. Do not infer production schema from local replay or old SQL filenames.

## Future controlled publishing sequence (not authorized)

1. Freeze exact reviewed files/commit candidate and obtain required local checks, production config/DB compatibility and rollback evidence.
2. Verify whether pushing any branch triggers a Netlify production/preview deploy; establish a reviewed publication sequence before pushing. Do not assume push and deploy are separate.
3. If SQL required, approve/apply separately reviewed production migration procedure first at its defined compatibility boundary. Otherwise explicitly record no SQL required.
4. Obtain explicit commit/push/merge/Netlify release authorization for exact revision/site/branch and trigger effects. No such command ran or is authorized here.
5. Perform only approved production smoke checks: public reads/asset/API health and revision/config verification; auth/booking/email/storage/mutation checks need their own scope. Watch errors and stop release on regression.
6. Roll back app to verified previous deployment only through approved process; retain evidence and assess database compatibility separately. Never automatically reset DB.

## Rollback / preservation now

No runtime stack was activated, so no runtime rollback needed. After review, preparation may be archived/removed by exact path; preserve original production dotenv, original SQL, stopped custom resources and previous reports. No broad cleanup/prune or volume deletion. Future new-stack shutdown/cleanup must target its exact project and preserve data unless deletion explicitly approved.

## Required owner action

First approval remains the concrete network/CLI startup policy in NEW-MAC-MIGRATION-FINAL.md. All later milestones and publication remain gated. Do not treat this documentation as a GO or deployment authorization.
