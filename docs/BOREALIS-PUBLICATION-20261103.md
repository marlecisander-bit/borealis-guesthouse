# Borealis publication — 3 November 2026

Owner authorized publication of all pending changes and the required F01-00/01 database expansion in this conversation.

F01-00 and F01-01 were applied to the existing Supabase project `rlqyruulxyanfgvnzkpe`. Initial guard failures rolled back before schema changes. Read-only comparison proved the five changed function-definition hashes differed only in whitespace; execution copies refreshed those exact hashes while retaining every other guard and the original SQL operations. Private execution receipts remain under `.local/publish-20261103/`.

Independent verification confirmed ten accepted CMS keys, both expected private RPC signatures, postgres ownership, SECURITY DEFINER with empty search_path, and execution granted only to authenticated and postgres. Anonymous and service-role execution of these new RPCs is denied. Existing F02 helper restrictions remain intact. No CMS content, user account or Storage policy was changed. F01-02 privilege contraction was not part of this authorization and was not applied; this release does not claim the entire draft-exposure remediation is complete.

The complete pending application passed 182 unit tests, ESLint, TypeScript and a normal production build. Authenticated browser authoring, real uploads and booking mutations have not been exercised in this release. The local publishable key returned HTTP 401 during REST inspection, so local build success alone does not certify live Data API connectivity.

The existing Netlify site is `borealisguesthouse`, backed by this repository main branch with auto publishing enabled. Hosting environment inventory contains only the two existing public Supabase variables; local preview flags are absent. Private `.local/` artifacts, credentials, runtime caches and environment files remain excluded from Git. Historical preparation reports remain dated records, not current release status.
