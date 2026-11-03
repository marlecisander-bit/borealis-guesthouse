# Borealis — owner development workflow

21 October2026, Europe/Tirane. Use the existing repository, Supabase project and Netlify site. No duplicate database, Docker stack or hosting environment is needed for ordinary website work.

## What to ask

Say what you want in normal language. Examples:

- “Change the homepage hero layout and show me the local result.”
- “Add a room feature to the admin editor and public room page.”
- “Fix this booking error and test the calculation safely.”
- “Add Italian labels and check the language fallback.”
- “Improve the experiences and transfers editor on mobile.”

Codex should inspect the relevant code, follow repository/installed Next guidance, make authorized local changes, run suitable offline checks and explain the result plainly. Existing unrelated changes must be preserved. A routine layout change should not become a new infrastructure project or repeat a completed platform audit.

## The normal task flow

1. Identify the behavior to change and the relevant editor/public reader. Use available context; ask only for a missing decision that materially changes the result.
2. Make the authorized local code change. Keep database/data/configuration requirements separate and explicit. For frontend-only work, complete the local patch and review evidence without asking for infrastructure approval.
3. Run focused safe tests, then the complete check command when appropriate: `python3 scripts/borealis-safe-checks.py`. It creates private reports under `.local/`, denies all test/build networking and starts no server. Do not repeat a passed full suite unless a new change or concern warrants it.
4. Report what changed, what passed and any practical limit. A compiled admin form is not proof it saved correctly to Supabase; mocked bookings are not real booking acceptance. Use a controlled preview only under its actual authorized read/write boundary.
5. If a live database/Auth/Storage write, provider action, Git push or deployment is necessary, first finish the local work and prepare the exact reviewable SQL/source/fixture/release set. Then request the specific approval still missing. Do not ask again for permissions already granted within that scope.
6. After explicit live authorization, run only the bounded approved action, verify the result and stop on failed gates. Preserve evidence and explain any untested behavior. Never add an automatic production implementation after a preparation task.

## Code changes versus live changes

“Add rooms” can mean adding form fields in code or creating actual room records. Code/forms can be prepared and tested locally; live records need the owner's explicit write instruction and the intended values. The same distinction applies to languages, experiences, transfer prices, gallery membership and CMS publication.

A booking fix can begin with calculation/state/retry mocks. Actual hold/confirm/cancel/expiry tests change inventory and need approved synthetic fixtures and integration isolation. No real guest booking should be used to prove a defect.

An admin improvement can be implemented locally while database/RLS compatibility remains pending. Do not deploy the prepared F01 admin/preview changes until the private RPC expansion is installed and accepted. No service-role fallback may be added to make missing RPCs or authorization failures disappear.

Existing Netlify main auto-publishing means a GitHub main push can publish the website. Source review, database changes and deployment are distinct actions. Keep `.local/`, recovery files, browser profiles and credentials out of the release; never use a broad add without reviewing the exact set.

## Current readiness in plain English

- You can request ordinary local website/admin/code improvements now. The safe134-test/type/lint/build workflow passes.
- The database backup and all71 existing public images are locally encrypted and verified. Three pending hero originals were absent and remain unresolved.
- Losing this Mac could still lose recovery access: off-Mac encrypted retention and a separately approved key-recovery method are needed. No key has been exported.
- F02's internal helper permissions remain restricted. F01's local patch is prepared, but the deployed draft-exposure correction is not implemented.
- Before F01 live work, use the [controlled execution checklist](BOREALIS-F01-PRODUCTION-EXECUTION-CHECKLIST.md) and approve the exact SQL, synthetic testing and deployment scope. No duplicate environment is required by this workflow.

Private technical evidence is retained for Codex; the owner does not need to run SQL or handle keys in chat. If Supabase, macOS or another service requires interactive authentication, Codex should request only that minimum secure action and continue the authorized work afterwards.
