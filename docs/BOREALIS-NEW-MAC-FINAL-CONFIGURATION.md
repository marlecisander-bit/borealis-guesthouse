# Borealis new Mac final configuration

2026-10-20 (Europe/Tirane). Canonical clone `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Public-key validation PASS after local syntax correction. Website startup remains pending preview safeguards; no production change.**

Final validation: removed a duplicated NEXT_PUBLIC_SUPABASE_ANON_KEY= prefix from the ignored local value. The resulting publishable key received HTTP200 from only GET /auth/v1/settings on the exact production project. This establishes acceptance by that project endpoint, not permission to perform writes or proof of every API permission. No key or response body was logged. Privileged/integration credentials remain blank and .env.local remains Git-ignored. No website was started.

The following initial failure history is retained and superseded by the successful validation above. After the owner reported pasting the public key, the value saved on disk in NEXT_PUBLIC_SUPABASE_ANON_KEY was neither a recognized sb_publishable_ key nor a three-segment legacy anon JWT. The validator did not send it to Supabase. No key value, prefix fragment, response body or credential was logged. A recognized JWT must also identify the exact project and anon role before use; payload decoding alone does not verify its signature. Publishable keys need endpoint validation because their project binding cannot be read as a JWT claim.

## Workspace readiness

Canonical clone checked on main, HEAD745b4aa56589cda5e5d0c8823ccc1cabb055e313, with no tracked changes during the configuration preflight. Previous snapshot and all untracked reports preserved. The latest IDE context shows the canonical .env.local open, confirming the intended file is visible; the VS Code open-folder root remains independently unconfirmed. The code --status check returned no usable workspace information. No workspace switch or source edit occurred.

## Environment and key verification

The saved production URL matches https://rlqyruulxyanfgvnzkpe.supabase.co. .env.local remains Git-ignored. Service-role, Resend, Stripe/payment and calendar-sync credentials remain blank. Initial check: public-key format FAIL; Auth settings GET NOT RUN. Final check after correction: publishable format PASS, Auth settings HTTP200. Earlier HTTP401 evidence belongs to the previous audit and must not be presented as a request with this newly reported entry.

Owner action: save the existing public publishable key or legacy anon key as the value of NEXT_PUBLIC_SUPABASE_ANON_KEY in this exact file, not a database password, project reference, access token, secret key or service-role key. Copy the key value only; do not paste it into chat. Save with Command-S and request validation again. No credential rotation is needed or authorized.

## Remaining build and preview preparation

Readiness remains pending successful key verification. Installed Node24.21.0 satisfies the repository's >=20.9.0 engine minimum, but differs from Netlify's configured20.19.5. No runtime was installed/switched or build run. Next16.3.4 environment-variable guidance was read: Next automatically loads root dotenv files and bundles NEXT_PUBLIC values, so environment selection must precede any build. Existing independent build output must not be reused after key changes.

Layout imports Manrope and Cormorant Garamond from next/font/google; prior offline build failure remains a blocker. Either separately approve the required Google font downloads during build, or review licensed local assets and a next/font/local source change. Neither was implemented here.

Controlled read-only preview requires source changes before launch: an explicit local-only mode that rejects booking/contact/admin/calendar/auth mutations, blocks sensitive confirmation/calendar GETs, prevents server actions, uses fresh session-free clients and browser state, and restricts outbound paths to reviewed public CMS reads. Current public-CMS caching is not a security guard. Restrict listener to127.0.0.1, retain blank privileged credentials and use separate NEXT_DIST_DIR artifacts. No preview guard exists yet and no startup command is authorized by this report. The full route-risk inventory remains in BOREALIS-PRODUCTION-SYNC-AND-MIGRATION-AUDIT.md.

## Production Auth redirect proposal — inactive

The previous read-only audit observed Site URL http://localhost:3000 and no redirect URLs. No new Auth inspection was performed after this key validation failed. Proposed exact Site URL replacement: https://borealisguesthouse.netlify.app. Confirm intended recovery/login/email-link flows before execution. Do not add wildcard preview origins or localhost to production merely to unblock local development. No additional redirect entry is justified until an exact callback route is identified; the audit does not establish a callback handler. Preserve the current configuration as rollback evidence before any separately approved edit. No production Auth setting was changed.

## Next authorization and stop point

First correct/save the public key privately and repeat format/project checks plus only GET /auth/v1/settings. Stop on failure. After PASS, separately authorize implementation and offline validation of the local read-only preview mode and the selected font/runtime preparation. Website startup requires subsequent explicit approval. Production Auth Site URL/redirect changes require individual review and approval of the exact entries; migrations, SQL, mutation testing, Git publication and Netlify deployment remain excluded.

No production writes, SQL changes, new project, credential rotation, application start, Docker operation, Git commit/push/merge, Netlify modification or deployment occurred. Only the duplicated variable-name prefix in the ignored local environment was corrected; no other environment values were changed.
