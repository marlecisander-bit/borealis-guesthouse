-- Structured Explore Koman editorial CMS. Blocks contain data only; no HTML/scripts.
ALTER TABLE public.tourism_articles
  ADD COLUMN IF NOT EXISTS subtitle TEXT,
  ADD COLUMN IF NOT EXISTS author_name TEXT,
  ADD COLUMN IF NOT EXISTS content_blocks JSONB NOT NULL DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS gallery_media_ids UUID[] NOT NULL DEFAULT '{}'::UUID[],
  ADD COLUMN IF NOT EXISTS related_article_ids UUID[] NOT NULL DEFAULT '{}'::UUID[],
  ADD COLUMN IF NOT EXISTS related_experience_ids UUID[] NOT NULL DEFAULT '{}'::UUID[],
  ADD COLUMN IF NOT EXISTS related_transfer_ids UUID[] NOT NULL DEFAULT '{}'::UUID[];
ALTER TABLE public.tourism_articles DROP CONSTRAINT IF EXISTS tourism_articles_content_blocks_array_check;
ALTER TABLE public.tourism_articles ADD CONSTRAINT tourism_articles_content_blocks_array_check CHECK(jsonb_typeof(content_blocks)='array');
CREATE INDEX IF NOT EXISTS tourism_articles_featured_idx ON public.tourism_articles(property_id,is_featured,published_at DESC) WHERE status='published' AND is_visible;
