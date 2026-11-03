# Connection recheck after owner installation

2026-10-20 (Europe/Tirane). **Extension installation PASS; isolated automation connection FAIL / not established. Borealis remains stopped.** This update supersedes the installation-pending status below; the original preparation record is preserved.

The supported check-extension-installed.js diagnostic was explicitly scoped with CODEX_CHROMIUM_USER_DATA_DIR to the task-owned isolated directory. It reported the official ChatGPT extension hehggadaopoacecdllhhajmbjkdcmajg installed, registered and enabled in Default, version1.26.1005.11759_0. No normal-profile extension store, cookies or session data was inspected. The recorded isolated Chrome PID/start-time/argv still matches its process record.

Browser discovery before and after diagnostics returned only the pre-existing connection: browser1, extension instance8351b899-0634-4812-9e92-65141f1e58d1. No independently identifiable isolated connection appeared. That result is not proof the isolated instance can be controlled; no tabs were opened or claimed through the existing connection.

The supported native-host diagnostic reports the standard macOS Chrome registration correct, with the expected host name and extension origins. An explicit candidate under the isolated user-data directory was absent. The candidate's absence alone does not establish the failure's root cause or prove that duplicating the manifest would help. No host manifest was copied, repaired or installed; no remote debugging or alternative driver was used. The exact connection failure remains unresolved.

Per the requested fallback boundary, further automation setup has stopped. Screenshot capture, console inspection, loopback test navigation and desktop/mobile viewport control remain NOT RUN in the isolated instance. No harmless test server or Borealis server was started. The isolated Chrome process remains open for the owner; no normal Chrome session was accessed or terminated.

**Recommended acceptance path: manual visual acceptance in this isolated profile**, using the exact seven-page instructions preserved below, after a separately authorized v3-launcher startup and all non-browser preflight checks. This changes only who performs visual inspection; it does not remove session isolation or weaken request/route restrictions. The current task still excludes website startup. A manual preview must remain visibly labeled runtime/visual acceptance pending until observations and server security checks are complete.

Exact next authorization: one controlled startup through the unchanged verified v3 launcher, with the owner manually testing only /, /about, /rooms, /experiences, /transfers, /explore-koman and /gallery in the isolated Chrome profile; agent performs approved local HTTP/security checks and synthetic/intercepted mutation rejection tests, then shuts down only the recorded owned preview process. No production mutation, SQL, rebuild, source/allowlist change, Git publication, Netlify or Docker action is included. The launcher fresh-browser-review assertion must be supported by the established isolated process provenance and owner confirmation of no sign-ins/imports.

---

# Borealis isolated Chrome automation connection

2026-10-20 (Europe/Tirane). Canonical repository `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Automation NOT YET VERIFIED: awaiting owner Chrome Web Store installation approval. Borealis NOT STARTED.** Prepared the official extension listing in the existing task-owned Chrome instance. No extension was installed or permission prompt accepted by the agent. Build, launcher, application source and production environment remain unchanged.

## Browser and extension identity

Browser: installed Google Chrome155.0.8059.85, as verified in the prior isolated lifecycle task. Supported Chrome extension configuration was inspected in the installed browser plugin's scripts/extension-ids.json, without reading the normal Chrome profile or its extensions.

Official supported listing: [ChatGPT by OpenAI](https://chromewebstore.google.com/detail/chatgpt/hehggadaopoacecdllhhajmbjkdcmajg).
Extension ID: hehggadaopoacecdllhhajmbjkdcmajg.
The live Web Store listing identifies both provider and developer as OpenAI; reviewed listing version1.26.1005.11759, updated2026-10-15. This is the listing version, not a claim of an installed version in the isolated profile. No third-party mirror, unpacked extension, copied profile files or automation workaround was used.

Connection method: the supported ChatGPT extension/native-host mechanism. Fresh installation may provide an independent discoverable connection, but that outcome is not established until installation and discovery succeed. No native-host repair, remote debugging or alternative driver was enabled.

## Isolated setup prepared for owner action

Reopened only the existing task-owned user-data directory:

`/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse/.local/isolated-browser-readiness-v1/user-data`

Its provenance is the prior exclusive empty-directory creation, independent Chrome lifecycle and no-import evidence. No profile stores were inspected in this task. Startup explicitly supplied this exact path and --disable-sync, plus no-first-run/no-default-browser-check/disable-default-apps. The earlier --disable-extensions test flag was deliberately omitted so a freshly approved official extension can operate; no existing extension was imported.

The newly created process stayed alive and its own argv confirmed the exact isolated profile and absence of remote debugging. It was directed to the exact official Web Store URL, with no Supabase, Netlify, GitHub or production page navigation. A controlled screenshot could not yet be captured because this instance has no verified automation connection. Its actual visible store-page load is therefore not asserted as visually verified.

The isolated Chrome window is intentionally left open for the owner's installation approval. Owned PID/start identity/argv are recorded privately in `.local/isolated-browser-readiness-v1/extension-setup-process.json`; no global Chrome quit was issued. No normal-profile browser tabs or sessions were accessed by the agent.

## Owner handoff

In the newly opened isolated Chrome window, verify the listing is ChatGPT, offered by OpenAI, with the exact extension ID above. Choose Add to Chrome, review Chrome's displayed permissions and complete the installation yourself only if acceptable. Open the extension as directed by its official setup. Keep Chrome synchronization disabled; do not sign into Google, Supabase, GitHub or Netlify. If setup requires an unexpected account, policy override, native-host repair or broader permission, stop and report that prompt rather than improvising.

Tell the agent when installation is complete. Installing into a normal Chrome window would not resolve this isolated-profile requirement. The owner must grant any required extension access at action time; prior permission to prepare the browser is not evidence that this installation has completed.

## Capability results

| Check | Result |
| --- | --- |
| Official extension ID/publisher | PASS: plugin config matches live official listing |
| Task-owned Chrome process/profile argv | PASS |
| Fresh official extension installation | PENDING OWNER |
| Discovery/control of isolated instance | NOT RUN after installation; unavailable before installation |
| New isolated controllable tab | NOT RUN |
| Harmless loopback test navigation | NOT RUN |
| Screenshot and console capture | NOT RUN in isolated instance |
| Desktop/mobile viewport resizing | NOT RUN in isolated instance |
| Normal Chrome sessions | Not accessed or modified by the agent; current broad process comparison not rerun |

No harmless local test server was started while the connection is unavailable. Existing browser-control documentation advertises screenshot/console/viewport capabilities, but availability in another connection is not acceptance evidence for this profile.

## Fallback if the supported connection fails

Stop further automation setup. Keep the isolated profile and never substitute the authenticated normal browser. Manual visual acceptance is the recommended fallback, subject to explicit approval of that changed test procedure and launcher browser-review gate.

After a separately approved website startup through the unchanged v3 launcher:

1. In only the isolated profile, manually open http://127.0.0.1:3000. Do not start npm dev, rebuild, sign in or connect production account sessions.
2. Visit only /, /about, /rooms, /experiences, /transfers, /explore-koman and /gallery. Check actual content, header/navigation/footer and typography. Do not follow booking/contact/admin/detail/calendar links or submit forms.
3. Record each page's visible success/error state and a screenshot. Use Chrome DevTools Console and Network to note errors, font loading and unexpected requests; never copy keys, Auth headers or personal data into the report.
4. Use DevTools responsive mode at a desktop width such as1440 and mobile width390. Check overflow, clipping, navigation and footer. Capture both views. Remote images are currently intentionally blocked; record missing images without changing the allowlist.
5. Leave live mutation checks to the reviewed synthetic/intercepted tests. Do not send requests to real production write functions or test real bookings, authentication, contact, admin, calendar or uploads.
6. Return sanitized observations, then stop only the recorded task-owned preview process and verify port3000 is free. Close only the isolated Chrome window.

These instructions are preparation, not authorization or execution of a manual preview. Browser screenshots alone cannot prove server request purity; runtime guards, headers and process ownership still require their independent checks.

## Next execution boundary

Immediate next step is owner approval of the official extension installation in the prepared isolated instance. After that, discover the new connection and verify tab creation, harmless loopback navigation, screenshot/console and desktop/mobile viewport support without starting Borealis. If safe discovery/attachment fails, use the manual fallback decision rather than remote debugging or native-host changes.

Only after that readiness result, authorize ONE preview through the sealed v3 launcher, the approved seven pages/public-read projections and synthetic/intercepted blocked-request checks, followed by owned shutdown. All original preflight and production-write exclusions remain. No startup approval is inferred from this extension task.

No production database writes, SQL/migrations, Auth settings edits, application source changes, Git publication, Netlify modification or Docker operation occurred. No Borealis website was started.
