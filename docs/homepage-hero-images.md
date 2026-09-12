# Dedicated homepage Hero images

Apply database/migrations/20260912_039_homepage_hero_assets.sql in the existing
Supabase project before enabling the new upload controls. It creates the isolated
homepage_hero_assets table and property-scoped Admin policies. It does not migrate,
remove, or modify normal Media Library records, bucket settings, or existing Hero
content. Existing background_media_id and settings.mobileMediaId selections remain
valid until replaced. No database administration credentials were available in the
implementation workspace, so this migration has not been applied remotely.

The public-media bucket and existing property-prefix storage policies are reused.
Verify that its file-size limit permits 24 MB originals and its allowed MIME types
include JPEG, PNG, WebP and AVIF. The application signs a unique upload path and
sends the original File directly to Supabase, avoiding hosted request-body limits.
No browser compression or canvas resizing runs in this workflow. An authenticated
server route validates the image and prepares the variants with Sharp 0.35.4.

Storage paths are generated automatically:
  <property>/hero/<desktop_hero|mobile_hero>/<asset>/original/source.<ext>
  <property>/hero/<desktop_hero|mobile_hero>/<asset>/optimized/<attempt>/<width>.<ext>

Originals are never overwritten or deleted by this workflow. Remove image detaches
the homepage selection; it does not destroy source files. Failed processing keeps
the original and permits retry. Successful finalization is idempotent. Incomplete
variants from a failed attempt are cleaned up, while stale processing leases can
be retried after five minutes. The route requests a Node runtime with a 120-second
maximum; confirm the deployment platform supports its processing duration.

Hero-only processing rules live in src/lib/hero-image-config.ts. WebP output uses
quality 93; each resized variant is derived independently from the original.
Suitable full-size sources up to 4 MB are copied byte-for-byte into the optimized
folder. Desktop widths are 1920, 2560 and 3000; mobile widths are 1080, 1440 and
1600. These lists are capped by source width, never upscaled. EXIF orientation is
normalized for generated variants; originals remain intact. Resizing/encoding uses
Sharp's documented APIs: https://sharp.pixelplumbing.com/api-resize/ and
https://sharp.pixelplumbing.com/api-output/.

The existing Hero settings store desktopHeroAssetId, mobileHeroAssetId,
desktopFocal and mobileFocal. Focal values contain x/y percentages and are validated
by the save action. The action also verifies asset ownership, role-specific type,
and readiness. Draft and public readers resolve the selected prepared assets.
Prepared variants are served directly through picture/srcset, without another
Next.js recompression pass. Legacy Hero images opt into quality 93; the normal
Next.js default stays 75 and normal uploads keep all existing compression rules.

In Homepage > Hero, choose Replace image, upload or drop a photo, inspect its
filename/dimensions/size/aspect ratio, optionally set the focal point, and choose
Use image. Then save the homepage draft or publish. Small photos display a warning
rather than being rejected. Mobile removal uses the desktop image automatically.
Desktop and mobile crop previews are approximate; the source is never cropped.
Native dialogs provide keyboard focus containment and Escape dismissal.

The shared Hero, existing content, overlay, booking functionality, and layout remain
unchanged. Phone composition stays in src/app/homepage-hero.css below 768px, with
100dvh, safe-area padding, and compact booking controls. Focal points override the
previous default desktop (50%, 50%) and mobile (50%, 42%) positions.

Validation includes actual Sharp output, original-byte preservation, no upscaling,
EXIF orientation, upload authorization/property boundaries, desktop/mobile dialog
interactions with mocked storage, and Retina browser source selection. Remote
Supabase upload/publish and real-device Safari checks still require verification
after the migration is applied.
