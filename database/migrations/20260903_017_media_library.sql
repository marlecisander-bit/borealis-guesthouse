-- Reusable media library metadata. Existing columns remain canonical:
-- file_path = storage path, title = display name, size_bytes = file size.
ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS storage_bucket TEXT NOT NULL DEFAULT 'public-media',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE public.media_assets SET storage_bucket = 'public-media' WHERE storage_bucket IS NULL;

ALTER TABLE public.media_assets DROP CONSTRAINT IF EXISTS media_assets_storage_bucket_check;
ALTER TABLE public.media_assets ADD CONSTRAINT media_assets_storage_bucket_check
  CHECK (storage_bucket = 'public-media');
ALTER TABLE public.media_assets DROP CONSTRAINT IF EXISTS media_assets_image_size_check;
ALTER TABLE public.media_assets ADD CONSTRAINT media_assets_image_size_check
  CHECK (size_bytes IS NULL OR (size_bytes > 0 AND size_bytes <= 10485760));
ALTER TABLE public.media_assets DROP CONSTRAINT IF EXISTS media_assets_image_mime_check;
ALTER TABLE public.media_assets ADD CONSTRAINT media_assets_image_mime_check
  CHECK (mime_type IS NULL OR mime_type IN ('image/jpeg','image/png','image/webp','image/avif'));

CREATE INDEX IF NOT EXISTS media_assets_admin_library_idx
  ON public.media_assets(property_id, status, created_at DESC);

DROP TRIGGER IF EXISTS set_media_assets_updated_at ON public.media_assets;
CREATE TRIGGER set_media_assets_updated_at BEFORE UPDATE ON public.media_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
