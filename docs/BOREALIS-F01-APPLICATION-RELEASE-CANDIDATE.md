# Borealis F01 — application release candidate

21 October2026, Europe/Tirane. **Version2 font/build gate PASS. Production execution/deployment remains NO-GO pending separate approval and runtime/security gates.** No SQL, live content, Auth/Storage, Git publication, Netlify or Docker change occurred.

## Exact version and publish set

Base remains `745b4aa56589cda5e5d0c8823ccc1cabb055e313`. New private source: `.local/f01-release-local-fonts-v2/source/`. Clean intended publish files: `.local/f01-release-local-fonts-v2/publish-files/`.

- Binary-capable Git diff: `.local/f01-release-local-fonts-v2/F01-local-fonts-v2.patch`; SHA-256 `d643480f1fb8af639f31b22837cd1dc24320e5cecc1045944eb3e8e46f9be8e1`.
- Exact 18-file source manifest: `.local/f01-release-local-fonts-v2/publish-manifest.json`; SHA-256 `e27d02627956c10c994cacd9fd3663cb124bd6d3af9e747fbb1adf80e7a016a8`.
- Candidate revision identity: `F01-RC-local-fonts-v2:e27d02627956c10c994cacd9fd3663cb124bd6d3af9e747fbb1adf80e7a016a8`. This is a source-manifest identity, not an invented Git commit.

The eight F01 files from version1 remain byte-identical in version2. Added only the reviewed layout loader change, seven existing font/provenance/license/metadata files, and the font regression test. The unchanged F01-01 proposal is also included as the required static-test fixture so a fresh checkout can run that test:

- `src/types/site-content-cms.ts`
- `src/lib/admin/cms-documents.ts`
- `src/lib/repositories/admin/site-content.ts`
- `src/lib/repositories/admin/languages.ts`
- `src/services/site-content.ts`
- `src/lib/supabase/fetch.ts`
- `src/app/admin/content/site-actions.ts`
- `tests/cms-draft-protection.test.ts`
- `src/app/layout.tsx`
- `src/app/fonts/cormorantgaramond/CormorantGaramond[wght].ttf`
- `src/app/fonts/cormorantgaramond/METADATA.pb`
- `src/app/fonts/cormorantgaramond/OFL.txt`
- `src/app/fonts/manrope/METADATA.pb`
- `src/app/fonts/manrope/Manrope[wght].ttf`
- `src/app/fonts/manrope/OFL.txt`
- `src/app/fonts/provenance.json`
- `tests/local-fonts.test.ts`
- `docs/security-proposals/phase-a/F01-01-cms-rpc-expand.sql.proposed`

The diff includes the two binary fonts, not merely pointers. Reverse patch applicability and all publish-file hashes pass. Source helpers/tests remain the minimal normal-mode versions: unrelated local preview imports/branches stay excluded. No booking/CMS behavior was changed to fix fonts. Root CSS files, layout metadata/body and other application files retain the published baseline. No dependency, package/lockfile or Next build configuration change was needed.

No `.local/` path, backup, credential, browser profile, receipt or runtime cache is in this publish set. The unchanged F01-01 `.sql.proposed` document is included solely because the candidate regression test reads it. It remains outside migration discovery, is not an execution package and is never invoked by the tests. Build outputs, generated tsconfig/next-env edits and reports are also excluded. Git staging remains empty; no branch/commit/push/deploy occurred. The source-only candidate is not permission to publish the broader dirty canonical tree.

## Font implementation and validation

Reused the existing pinned OFL-licensed assets with no download. `next/font/local` preserves `--font-manrope` and `--font-cormorant`, Manrope200–800, Cormorant400/500/600, normal styles, swap and the established Arial/Times New Roman fallback categories. Both OFL notices, metadata and provenance remain intact. SHA-256 and pinned Git-blob hashes match prior provenance. See the [build report](BOREALIS-F01-RELEASE-BUILD-RESULT.md) for comparison, binary hashes and visual limits.

| Version2 check, Node20.19.5 | Result |
| --- | --- |
| Focused F01 regressions |9/9 PASS |
| Complete minimal candidate unit suite |121/121 PASS; zero skipped |
| Broader canonical unit suite |134/134 PASS; zero skipped |
| Candidate TypeScript / ESLint |PASS |
| Clean normal-mode Next16.3.4 Webpack build |PASS; all networking denied |
| Artifact integrity |497 paths/hashes recorded and rechecked |
| Emitted font integrity |Exactly two TTFs match verified inputs |
| Production preview flags |Absent from child environment, candidate application source and Next configuration |
| Dependencies |22,428 entries identical before/after; no installation/update |
| Canonical application source |Unchanged |

Version1 and its failed Google-Fonts build remain preserved under `.local/f01-production-preflight-v1/`. Its report is preserved in this version's private evidence. This version directly resolves that build blocker; the older canonical-tree build success was not substituted for candidate validation.

## Production requirements and rollback-compatible revision

Future release must use the existing Supabase public URL/key for `rlqyruulxyanfgvnzkpe`, the actual user JWT/SSR session for private CMS RPCs and the intended HTTPS site origin `https://borealisguesthouse.netlify.app`. Do not expose privileged keys in NEXT_PUBLIC settings or add a service-role fallback. Keep BOREALIS_READONLY_PREVIEW and NEXT_PUBLIC_BOREALIS_READONLY_PREVIEW unset; do not deploy private snapshot paths or NEXT_DIST_DIR overrides. Existing integration credentials/settings are outside this font task and were neither read wholesale nor changed. Node20.19.5 is the explicitly tested compatibility runtime; no hosting runtime change occurred.

This v2 source is RPC-compatible after approved expansion. `rollback-candidate.json` binds its exact source/patch identity; **no deployed rollback Git revision exists yet**. After separately approved deployment and acceptance, record and retain the resulting exact compatible commit before F01-02. Do not substitute the old pre-RPC main commit after contraction; retain a tested RPC-compatible release, pause authoring or forward-fix. No automatic restore of broad draft grants is proposed.

The remaining gates are operation-specific recovery-risk acceptance, separately approved guarded F01-00/01 installation, real synthetic authorization/PostgREST/cache/preview acceptance within an approved fixture scope, source-only deployment approval and acceptance, authoring drain and separate F01-02 approval. Expansion alone does not close F01. Netlify automatically publishes main, so a future push is a deployment. All live phases remain unexecuted.
