# Borealis F01 — release build result

21 October2026, Europe/Tirane. **PASS — the minimal F01 version2 release candidate builds without Google Fonts downloads.** No production implementation, SQL, CMS/Auth/Storage mutation, server startup, publication/deployment, Netlify/Docker change or new infrastructure environment occurred.

## Difference and correction

Version1 inherited the published layout's `next/font/google` Manrope/Cormorant loaders. It failed under OS network denial when trying fonts.googleapis.com. The previously successful local-font implementation already existed in canonical source and the prior verified font-build evidence. Read the F01 preflight/release/expansion/cutover documents, the existing font-build/provenance report and installed Next16.3.4 font reference before applying it.

Version2 starts from the same published Git commit plus the exact eight-file minimal F01 patch. Reused the canonical local loader declarations and font folder byte-for-byte. Only `layout.tsx`, font assets/notices/metadata/provenance and `tests/local-fonts.test.ts` were added to the approved F01 publish scope. The existing F01-01 `.sql.proposed` document is included unchanged solely as a required static-test fixture, outside migration discovery; no SQL is executed. No new font was fetched, no subsetting/conversion occurred, no new dependency was introduced and no CMS/booking logic changed.

| Font contract | Preserved implementation |
| --- | --- |
| Manrope |Manrope[wght].ttf; normal;200–800; `--font-manrope`; swap; Arial fallback |
| Cormorant Garamond |CormorantGaramond[wght].ttf; normal faces400/500/600; `--font-cormorant`; swap; Times New Roman fallback |
| Layout/CSS |Same html classes, stylesheet imports, CSS/body/metadata outside loader declarations; no CSS file diff |
| Italics |Existing CSS synthesis retained; no new italic asset |
| Build configuration |Published Next configuration unchanged; normal production mode, no preview flags |

Both families retain SIL OFL1.1 notices. Source provenance remains google/fonts commit `47d54ca1ebb14fd864695f1d39dc734f39017c33`; all six original asset/notice/metadata SHA-256 and Git-blob digests pass. The retained provenance JSON provides exact URLs, byte counts and hashes; those URLs were not requested in this task.

| Binary | SHA-256 |
| --- | --- |
| Manrope,164700bytes |`3ae11c49db0455a3cc33e37d380f20fdb8c7f8b41dc07625c177e3d87a9d6ae6` |
| Cormorant Garamond,1195560bytes |`b20b7d9626dd956b2c5e558692ad328b1f19e3275e2782db4fa07670d83f35e0` |

Typography family/weight/style/CSS contracts match the previously verified implementation. Pixel-identical browser rendering was not tested: no server/browser acceptance ran. As recorded previously, fallback metrics and pinned font revisions can differ from dynamically served Google CSS; full variable TTFs are larger than Latin WOFF2 subsets. No visual redesign or unsupported claim of pixel equivalence is made.

## Fresh verification

Source and logs: `.local/f01-release-local-fonts-v2/`. Node executable version20.19.5 and its recorded SHA-256 were verified. Next16.3.4, existing lockfile and22,428 dependency entries were reused. A separate APFS clone matches canonical dependencies before and after. No package installation occurred.

All test/build commands used a sterile allowlisted environment and macOS `sandbox-exec` with `deny network*` for the process tree, without local/external exceptions. No dotenv file or deployment/provider/service credential was supplied; only the public Supabase build configuration and HTTPS origin were provided. Logs redact the public key. Build prerender fallback is not live CMS-content acceptance.

- Focused F01 tests:9 PASS.
- Entire candidate suite:121 PASS,0 failed/skipped, including two font regressions. This is the full minimal source candidate's suite.
- Broader canonical suite:134 PASS,0 failed/skipped. Its additional local preview tests remain outside the intended minimal release.
- Candidate TypeScript noEmit/incremental off:PASS.
- Candidate ESLint source/tests/Next configuration:PASS.
- Exactly one clean `next build --webpack`:exit0, normal production mode, no prior output directory, no networking. No failed build/retry in v2.
- Exactly497 generated artifact files/links recorded and independently rechecked; no older500-file seal was reused or relaxed.
- Exactly two emitted TTFs have the same hashes as the inputs. Generated font CSS contains local media URLs and both variables; face weights are200–800,400,500,600. It contains no Google Fonts host references.
- Candidate preview markers are absent in application source, Next configuration and build environment. No preview modules were introduced.
- Publish-source hashes, binary-capable Git diff applicability, dependency hashes and canonical source invariance pass. Only expected compiler changes to private-snapshot tsconfig.json/next-env.d.ts occurred; they are excluded from publication.

Build completed at11:44:16 Europe/Tirane (09:44:16 UTC). Historical candidate/build/receipt files were preserved. No listener or normal development server started. The497-file output belongs to this minimal candidate, not to the earlier preview/canonical500-file builds.

## Exact identity and publication boundary

| Artifact | SHA-256 |
| --- | --- |
|18-file publish-manifest.json |`e27d02627956c10c994cacd9fd3663cb124bd6d3af9e747fbb1adf80e7a016a8` |
| Binary Git patch |`d643480f1fb8af639f31b22837cd1dc24320e5cecc1045944eb3e8e46f9be8e1` |
|497-file build-artifacts.json |`f983f0a320eb9a9af89f1d13103fbb59f459711665b8f838780559c9f89bf5d9` |

The [updated candidate report](BOREALIS-F01-APPLICATION-RELEASE-CANDIDATE.md) lists every intended source, font and license file. Per-file hashes, exact source diff, source-before-build manifest, build logs/results and final-integrity evidence remain private, Git-ignored. The publish folder contains only the 18 reviewed application/test/font/static-fixture files; private artifacts are excluded. Nothing was staged, committed or pushed. No hosting configuration or production environment was changed.

## Remaining production gates

**Font/build blocker: RESOLVED. Overall F01 production implementation/deployment: still NO-GO until separately authorized and accepted.** Pending: explicit operation-specific recovery-risk acceptance; approval/application of guarded F01-00/01; real SQL/JWT/PostgREST/property/role/save/publish/cache tests using separately approved synthetic fixtures; compatible application deployment and runtime acceptance; authoring maintenance/drain; separate F01-02 contraction and anonymous draft-denial acceptance. No schema/data behavior has been proved by compilation alone.

The exact v2 manifest identifies a prospective RPC-compatible recovery release; it is not a deployed Git revision. Record the actual accepted deployed commit before contraction. Do not roll back to a pre-RPC app or restore broad anonymous draft permissions. The local-only backup/unverified-restore risks remain as documented; no backup key export or off-Mac copy occurred here.
