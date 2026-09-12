import 'server-only';
import { readHeroAssets } from '@/lib/hero-assets';
import type { HeroAsset } from '@/lib/hero-image-config';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getAdminSession } from '@/lib/admin/auth';
import { fetchSupabase } from '@/lib/supabase/fetch';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { homepageKeys, type HomepageReview, type HomepageSection } from '@/types/homepage-cms';

const createClient = (url: string, key: string, options: Parameters<typeof createSupabaseClient>[2]) =>
  createSupabaseClient(url, key, { ...options, global: { ...options?.global, fetch: fetchSupabase } });

const publicHomepageKeys = homepageKeys.filter(key => key !== 'property_highlights');

export interface PublicHomepageCms {
  sections: HomepageSection[];
  reviews: HomepageReview[];
  mediaUrls: Record<string, string>;
  heroAssets: Record<string, HeroAsset>;
}

export async function getHomepageCms(preview = false): Promise<PublicHomepageCms | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const admin = preview ? await getAdminSession() : null;
  const db = admin
    ? await createServerSupabaseClient()
    : createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  if (admin) {
    const { data: draft } = await db.from('homepage_drafts').select('payload').eq('property_id', admin.propertyId).maybeSingle();
    if (draft?.payload) {
      const payload = draft.payload as { sections: HomepageSection[]; reviews: HomepageReview[] };
      const sections = payload.sections.filter(section => section.key !== 'property_highlights');
      const mediaIds = sections.flatMap(section => [section.backgroundMediaId, typeof section.settings.mobileMediaId === 'string' ? section.settings.mobileMediaId : ''].filter(Boolean));
      const mediaResult = mediaIds.length
        ? await db.from('media_assets').select('id,file_path').in('id', mediaIds)
        : { data: [] as { id: string; file_path: string }[] };
      return {
        sections,
        heroAssets: await readHeroAssets(db, sections),
        reviews: payload.reviews,
        mediaUrls: Object.fromEntries((mediaResult.data || []).map(item => [item.id, `${url}/storage/v1/object/public/public-media/${item.file_path}`])),
      };
    }
  }

  let sectionsQuery = db
    .from('homepage_sections')
    .select('id,section_key,title,subtitle,body,eyebrow,cta_label,cta_link,background_media_id,settings,status,is_visible,sort_order')
    .neq('section_key', 'property_highlights')
    .order('sort_order');
  if (!admin) sectionsQuery = sectionsQuery.eq('status', 'published').eq('is_visible', true);
  const { data: sections, error } = await sectionsQuery;
  if (error || !sections?.length) return null;

  const sectionIds = sections.map(row => row.id);
  const mediaIds = sections.flatMap(row => [row.background_media_id, typeof row.settings?.mobileMediaId === 'string' ? row.settings.mobileMediaId : ''].filter(Boolean));
  const [links, reviews, media] = await Promise.all([
    db.from('homepage_section_links').select('section_id,entity_type,entity_id,sort_order').in('section_id', sectionIds).order('sort_order'),
    db.from('reviews').select('id,author_name,origin,quote,status,is_visible,sort_order').eq('source_label', 'homepage_manual').in('status', admin ? ['draft', 'published'] : ['published']).order('sort_order'),
    mediaIds.length
      ? db.from('media_assets').select('id,file_path').in('id', mediaIds)
      : Promise.resolve({ data: [] as { id: string; file_path: string }[] }),
  ]);

  const mapped = sections.map(row => ({
    id: row.id,
    key: row.section_key,
    title: row.title || '',
    subtitle: row.subtitle || '',
    body: row.body || '',
    eyebrow: row.eyebrow || '',
    ctaLabel: row.cta_label || '',
    ctaLink: row.cta_link || '',
    backgroundMediaId: row.background_media_id || '',
    settings: row.settings || {},
    status: row.status,
    visible: row.is_visible,
    sortOrder: row.sort_order,
    links: (links.data || [])
      .filter(item => item.section_id === row.id)
      .map(item => ({ type: item.entity_type, id: item.entity_id, sortOrder: item.sort_order })),
  })) as HomepageSection[];

  return {
    heroAssets: await readHeroAssets(db, mapped),
    sections: publicHomepageKeys.map(key => mapped.find(section => section.key === key)).filter(Boolean) as HomepageSection[],
    reviews: (reviews.data || []).filter(row => admin || row.is_visible).map(row => ({
      id: row.id,
      author: row.author_name || '',
      origin: row.origin || '',
      quote: row.quote,
      visible: row.is_visible,
      sortOrder: row.sort_order,
      status: row.status,
    })),
    mediaUrls: Object.fromEntries((media.data || []).map(row => [row.id, `${url}/storage/v1/object/public/public-media/${row.file_path}`])),
  };
}
