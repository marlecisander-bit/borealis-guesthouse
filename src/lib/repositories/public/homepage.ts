import 'server-only';

import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { resolvePublicMediaUrl } from '@/lib/media-url';

export type PublishedHomepageHero = {
  headline: string;
  subtitle: string;
  eyebrow: string;
  imageUrl: string | null;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  bookingSearchVisible: boolean;
  visible: boolean;
  sortOrder: number;
};

export const HOMEPAGE_HERO_CACHE_TAG = 'homepage-hero';

async function readPublishedHomepageHero(): Promise<PublishedHomepageHero | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: hero, error } = await db
    .from('homepage_sections')
    .select('property_id,title,subtitle,eyebrow,cta_label,cta_link,background_media_id,settings,is_visible,sort_order')
    .eq('section_key', 'hero')
    .eq('status', 'published')
    .eq('is_visible', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !hero) return null;

  let imageUrl: string | null = null;
  if (hero.background_media_id) {
    const { data: media } = await db
      .from('media_assets')
      .select('file_path,storage_bucket')
      .eq('property_id', hero.property_id)
      .eq('id', hero.background_media_id)
      .eq('status', 'published')
      .eq('is_visible', true)
      .maybeSingle();
    if (media) imageUrl = resolvePublicMediaUrl(media.file_path, media.storage_bucket || undefined);
  }

  const settings = hero.settings && typeof hero.settings === 'object' ? hero.settings as Record<string, unknown> : {};
  return {
    headline: hero.title || '',
    subtitle: hero.subtitle || '',
    eyebrow: hero.eyebrow || '',
    imageUrl,
    primaryCtaLabel: hero.cta_label || '',
    primaryCtaHref: hero.cta_link || '',
    bookingSearchVisible: settings.showBookingSearch !== false,
    visible: hero.is_visible,
    sortOrder: hero.sort_order,
  };
}

export const getPublishedHomepageHero = unstable_cache(
  readPublishedHomepageHero,
  ['published-homepage-hero-v2'],
  { tags: [HOMEPAGE_HERO_CACHE_TAG], revalidate: 300 },
);
