# Application release — 3 November 2026

This candidate combines all local work since published revision `12152981279ac4ac1c259c6c83d73bf687c7b771`, for the existing main → Netlify publishing path.

- Simplified owner navigation, activity/service lists, type-specific editors, media ordering and publication controls.
- Responsive layout fixes, accessible dialog focus/scrolling, contained admin tables, readable long content and notification HTML.
- Owner availability calendar with continuous stay bars, mobile agenda, contextual selection/closure drawers, actual daily summaries and category-based booking prefill.
- Removed the four homepage Explore Koman, transfer, gallery-preview and guest-note sections and their homepage editing/translation connections. Stored legacy content remains intact; homepage publishing no longer archives/recreates retired testimonials.
- Removed About from header/mobile/footer navigation and its admin page, translation and SEO controls. The public URL remains available for existing links; the former editor redirects to Pages.

No database migration, catalogue write, booking, receipt, payment-provider action or notification is part of this release. Incomplete rentals remain disabled and online rental payments remain unavailable. No owner policy or inventory is invented.

Verification includes the full 220-test suite, TypeScript, ESLint, production build, isolated admin/calendar/rental/room workflows and public desktop/mobile rendering. Build-time public metadata (`borealis-release-sha`, `borealis-deploy-id`) allows the published response to be matched to its exact Git revision and immutable Netlify deploy without dashboard access.

See the admin, calendar and responsive audit documents for detailed evidence and coverage limits. Synthetic fixtures do not establish signed-in hosted acceptance. Native browser access is unavailable; positive hosted rental acceptance and physical mobile keyboard/native picker checks remain pending. No synthetic production bookings or simulated receipts should be created to fill those gaps.

Private publication receipts, exact commit/deploy identifiers and post-release smoke results are kept under `.local/application-release-20261103/`. Secrets, dotenv files, backup archives, private logs and screenshots are excluded from Git.
