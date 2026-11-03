# Responsive hero images — local implementation, 3 November 2026

Implemented locally; no production migration, content save, upload, commit, push or deployment was performed.

## Coverage and compatibility

- Homepage keeps its existing desktop/mobile asset, legacy media ID and focal fields. Both controls now also offer the existing central Media Library picker and upload workflow. The high-resolution hero upload workflow remains available. Existing sources become the desktop selection without reconfiguration.
- Rooms, Experiences, Explore Koman and Gallery/Discover landing-page hero controls now expose desktop/mobile selections, landscape/portrait guidance, live crop previews, independently editable focal positions and alternative text. The shared Transfers CMS document uses the same controls, but `/transfers` retains its existing redirect to Journey; no redundant hero has been introduced there.
- Explore Koman article editors expose the same controls for their explicit hero selection. Mobile art direction affects the leading gallery image only. Existing desktop hero IDs, card imagery, gallery membership, gallery navigation and article history remain authoritative. Opening the gallery continues to show its established desktop/photo collection.
- Product room/experience/transfer photo collections, ordinary homepage section images and the retired About admin module have not been converted into hero editors. The legacy About page keeps its existing image. Sections without hero images receive no controls.
- Existing CMS draft/public separation, preview authorization, roles and invalidation paths remain in use. Homepage, landing-page and article hero alternative text can be translated. New library selections are checked against property membership; published landing/homepage library selections must be published visible media. Archive protection includes the new published hero references.

## Rendering

`ResponsiveHeroImage` uses framework `getImageProps` inside one native `picture` with one `img`. Below 768px the browser selects the mobile image if present; otherwise it selects desktop. From 768px it selects desktop. Existing homepage derivatives are retained; normal library media uses the existing image optimizer and sizes. Eager/high-priority loading avoids a separate preload that could request the wrong source. There are no CSS-hidden duplicate images. Existing hero container dimensions, text, buttons and overlays are retained. Per-device object positions do not alter dimensions. Mobile alt text falls back to the desktop description or media metadata, and updates with the breakpoint after hydration.

## Migration required before a future release

`database/migrations/20261103_042_article_responsive_hero.sql` adds only `tourism_articles.hero_settings JSONB NOT NULL DEFAULT '{}'` with an object check. It preserves `hero_media_id` as desktop, all rows, RLS and grants. The new application article queries require this column, so verify and apply 042 to the existing project before a later authorized application deployment. Do not replay historical migrations. No migration is needed for homepage or landing CMS JSON fields. This task did not apply 042 to production.

## Verification

- All 229 tests pass, including actual CMS action/public-reader save, replacement/removal, role requirements, draft invalidation separation, image markup, translated article alternatives and mobile media resolution. Existing CMS permission tests remain passing.
- Actual 042 executes against disposable PGlite PostgreSQL fixtures, preserves an existing desktop media ID and RLS, defaults existing rows to empty settings and rejects non-object settings. This is not a hosted PostgreSQL 17.6 migration acceptance run.
- ESLint, TypeScript and production build pass.
- Isolated owner UI fixtures at 390px/1440px exercise central library selection, saving, full reload, replacement, mobile removal, focal persistence and homepage library selection. The fixture uses the actual controls, with local synthetic save/auth/upload boundaries, rather than a live authenticated session.
- Real framework-generated picture markup is exercised in Chromium at 390/667/767/768/1024/1440px, with and without mobile media. All twelve cases request exactly one correct image, use the intended focal position and avoid an image preload. Request interception supplies local landscape/portrait fixture crops of an existing public photo; it does not contact Storage or upload them.
- The locally built application rendered Home, Rooms, Journey, Gallery and Explore Koman at 390x844, 667x375, 768x1024 and 1440x900: twenty cases with one hero image, loaded real existing media, no horizontal overflow or browser page errors. These are read-only public-data checks with existing desktop selections; separate mobile images were exercised in the isolated fixtures instead of changing production settings.
- Screenshots in `.local/responsive-hero/` include admin controls, homepage controls, art-directed results and actual local homepage views. Phone and desktop screenshots were visually inspected.

## Limits

The authenticated browser host was unavailable, so actual signed-in Supabase selection/save/upload and PostgREST acceptance remain unverified. No production content was changed to work around that limit. Article migration/reader behavior has local execution and fixture coverage, not a hosted updated schema. Responsive checks use desktop Chrome viewport emulation, not physical mobile devices. No new production photography or dependencies were added.

Reproduce checks:

```sh
npm test
npm run lint
npx tsc --noEmit
npm run build
BOREALIS_BOOKING_FIXTURE=1 node tools/hero-fixture/browser-tests.mjs
```

The browser script expects a private local fixture photo at `.local/responsive-hero/source.jpg`; use an existing approved photograph. It rejects credential-bearing/hosted environments, blocks external requests, and preserves production content. UI screenshots are labelled as isolated fixtures.
