# Borealis Admin mobile UX audit — 2026-09-12

## Scope and outcome

The Admin presentation layer was audited and refined without changing booking, pricing, occupancy, inventory, payment, cancellation, or notification business logic. Existing responsive implementations were retained where they already met the mobile requirement; changes target the remaining navigation, overflow, touch, calendar, action, and safe-area gaps.

1. **Issues found:** the drawer lacked focus containment and reliable scroll restoration; some filters and row actions became cramped; calendar navigation was dense; a calendar day could not prefill the block form; quick rate menus could overflow; editor bars and media dialogs needed stronger safe-area treatment; numeric inputs did not consistently request the correct phone keyboard.
2. **Horizontal overflow:** Admin containers now propagate `min-width: 0`, long content can wrap, controls are width-bounded, room cards avoid mobile table widths, and narrow content padding is reduced at 359px and below. Desktop-only matrices keep scrolling inside their own container, not the page.
3. **Sidebar/drawer:** the desktop sidebar remains unchanged in behavior. The mobile drawer covers most of the viewport, uses `100dvh`, has 48px navigation rows, highlights the current area, closes on selection/overlay/Escape, locks background scrolling, traps keyboard focus, and restores focus to its trigger.
4. **Top header:** the existing sticky compact header is retained and now respects the top safe-area inset. Menu, section name, notifications, and account controls remain uncluttered.
5. **Card conversions:** bookings already used mobile cards with the desktop table hidden below `md`; rooms, experiences, transfers, SEO, and calendar already had responsive card/list variants. These were retained and their action layouts were refined.
6. **Forms:** mobile inputs/selects/textareas are full width, at least 44px tall, and 16px to prevent iPhone Safari zoom. Existing multi-column editor layouts collapse naturally. Numeric fields receive `numeric` or `decimal` mobile keyboard hints without altering submitted values.
7. **Bookings:** booking list cards retain guest, dates/content, total, source, and explicit status. On detail pages, lifecycle status actions now precede the long booking record on mobile while the existing desktop two-column order is preserved.
8. **Calendar:** mobile dates remain expandable daily cards with explicit text statuses. Previous/next two-week controls are 44px targets, and “Block this date” prefills the existing block-date form. The desktop inventory timeline remains unchanged.
9. **Rooms & Rates:** mobile room images use responsive sizing, room actions use a two-column touch grid, the More menu opens in flow, and quick price editing no longer escapes the card. Existing seasonal rates remain stacked cards; the desktop pricing matrix remains contained to its own horizontal scroller.
10. **Website editor:** audited existing editor layout: content sections stack on mobile, editors do not share a compressed side-by-side preview, and preview remains a separate action. Existing sticky save patterns receive the shared safe-area/action sizing improvements.
11. **Media:** the phone file picker remains the primary workflow with `multiple` selection, queue status, retry/cancel/remove actions, responsive thumbnails, and full-width primary upload actions on mobile.
12. **Dialogs/sheets:** native Admin dialogs become full-screen at phone widths; the media picker uses a large `94dvh` sheet with internal scrolling and safe-area padding; image preview fills the usable phone viewport with an accessible close action.
13. **Sticky actions:** long editor action bars use two equal-width mobile actions, safe-bottom positioning, and existing page bottom padding so controls do not cover the final fields. The translation shortcut is lifted above the editor action bar.
14. **iPhone:** uses `dvh`, 16px fields, safe-area top/bottom insets, scroll-contained sheets, and touch manipulation hints.
15. **Android:** large controls, appropriate numeric keyboards, native file/date pickers, drawer scroll locking, and dynamic viewport sizing apply equally in Chromium-based browsers.
16. **Accessibility:** drawer dialog semantics, Escape handling, focus trap/restoration, explicit button labels, visible focus styles, text status labels, live form messages, and 44px targets are present.
17. **Performance:** existing Next responsive images and thumbnail `sizes` are preserved/improved; the mobile work adds no data requests and no second design system. The lightweight input enhancer only annotates number inputs.
18. **Responsive components introduced:** `AdminMobileInputEnhancer`; the existing `AdminMobileNav`, `AvailabilityBlockForm`, room actions, media picker, and shared Admin CSS were extended rather than duplicated.
19. **Screens tested:** Playwright passed at 320×568, 360×800, 375×812, 390×844, 393×852, 430×932, 768×1024, iPhone 13, Pixel 7, iPad Mini, 844×390 landscape, and 1024×768 touch landscape.
20. **Desktop regression:** Playwright passed at 1024×768, 1280×800, 1440×900, and 1920×1080; TypeScript, ESLint, unit tests, and the Next production build also pass.
21. **Remaining limitation:** browser automation could validate the unauthenticated Admin entry, viewport overflow, input sizing, and console health at all profiles. No test credentials were available, so live authenticated save/confirm/upload operations were not submitted during this audit. Their unchanged business paths are covered by the existing unit/integration suite and the new source-level mobile regression tests, but a final signed-in real-device walkthrough is still recommended before release.

## Validation

- `npx tsc --noEmit` — passed
- `npm run lint` — passed, zero warnings
- `npm test` — passed, 96/96
- `npm run build` — passed
- responsive Admin entry Playwright smoke suite — passed, 16/16 profiles including landscape
