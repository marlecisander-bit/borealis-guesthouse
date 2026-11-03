-- Additive only. Apply before releasing the article hero application changes.
-- Not applied by the implementation task. Verify the existing project before execution.
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';
ALTER TABLE public.tourism_articles
  ADD COLUMN hero_settings jsonb NOT NULL DEFAULT '{}'::jsonb
  CONSTRAINT tourism_articles_hero_settings_object CHECK (jsonb_typeof(hero_settings) = 'object');
COMMENT ON COLUMN public.tourism_articles.hero_settings IS
  'Responsive hero media-library selection, per-device alt text and focal percentages. Existing hero_media_id remains desktop source.';
NOTIFY pgrst, 'reload schema';
COMMIT;
