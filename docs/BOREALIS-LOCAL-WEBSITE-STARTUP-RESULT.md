> Historical startup failure, superseded by the running [image-enabled local preview](BOREALIS-LOCAL-IMAGE-PREVIEW.md). Original evidence below is preserved.

# Borealis local website startup result

2026-10-20 (Europe/Tirane). **BLOCKED at exact artifact-file-set validation; website NOT STARTED. Port3000 is free and the new startup attempt is unused.** No automatic retry, rebuild, cache removal, seal relaxation or production modification occurred.

Prepared a new private launcher revision at .local/readonly-v4-startup-v5, targeting the existing verified v4 source/build. Historical v4 launcher, receipts and consumed attempt/process markers were preserved. A narrow shutdown correction handles a process disappearing during metadata lookup only after PID absence and port release are verified. All13 mocked ownership/shutdown tests passed, including PID reuse/unrelated-process preservation, already-exited, inspection-race and signal-race cases. No website process was spawned by those tests.

The handoff regressions ran8 tests:7 passed; the real-build verification test failed artifact_identity_changed. The standalone check and requested start command also rejected that same gate, before consuming an attempt marker or creating a server. Thus the new revision is preparation evidence only, not a fully verified runnable handoff. No retry was performed after this result.

Read-only investigation found all500 recorded build files present with unchanged hashes and no missing or altered recorded artifacts. One additional file exists:

.next-readonly-preview-v1/cache/fetch-cache/d816d9b673d5a2efaf7607e97d74630c5571b4787737cee4d560c08679f5e6f8

Its path is consistent with Next's fetch cache created during the earlier preview; the exact writer/content was not traced. Cache contents were not read, copied or removed. The prior acceptance checked the500 recorded hashes after shutdown; it did not certify absence of added runtime cache files. The current exact file-set check correctly rejects the extra file.

The continuation preflight independently verified Nodev20.19.5, public-key metadata HTTP200, blank privileged configuration through launcher checks and a free loopback port. A new empty task-owned Chrome profile was created under this revision, with sync/extensions disabled and no imports/sign-ins by the task. No previous browser profile was read or modified. The script printed an overbroad preflight-PASS message before the final launcher check; that message was premature and is superseded by this rejection. The final launcher guard prevented website execution.

A safe reuse plan must account explicitly for runtime-generated cache separately from immutable compiled artifacts, with narrowly tested validation and fresh runtime state. That is beyond the authorized shutdown-only correction, and was not implemented or silently sealed here. No rebuild has been shown necessary. Do not delete caches or accept arbitrary extra files merely to launch.

Next step is a bounded cache-isolation/integrity correction and offline review, retaining the immutable500-file identity and all previous evidence, before another authorized startup command. Do not reset historical markers or weaken route/request/session protections. The existing revision's attempt.json/process.json do not exist.

No live page/browser test, production database mutation, SQL/migration, Auth setting change, Git commit/push/merge/deployment, Netlify or Docker operation occurred. No claim that the website is currently running is made.
