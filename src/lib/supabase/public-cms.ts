import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { fetchSupabase } from './fetch';

// Only explicitly public CMS readers use this client. Booking, pricing, inventory,
// Admin and preview clients continue using uncached, authenticated requests.
export const PUBLIC_CMS_TAG = 'public-cms';
const tables = new Set(['properties', 'cms_documents', 'navigation_items', 'languages', 'translations', 'homepage_sections', 'homepage_section_links', 'homepage_hero_assets', 'reviews', 'media_assets', 'gallery_items', 'room_types', 'room_images', 'room_type_amenities', 'amenities', 'experiences', 'experience_images', 'transfer_routes', 'transfer_images', 'tourism_articles', 'tourism_article_images', 'tourism_categories', 'seo_metadata', 'page_seo', 'site_settings']);

export function fetchPublicCms(input: RequestInfo | URL, init?: RequestInit) {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  const table = url.pathname.split('/rest/v1/')[1];
  const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
  if (method !== 'GET' || !table || !tables.has(table)) return fetchSupabase(input, { ...init, cache: 'no-store' });
  return fetchSupabase(input, { ...init, cache: 'force-cache', next: { revalidate: 300, tags: [PUBLIC_CMS_TAG, `public-cms:${table}`] } } as RequestInit);
}

function makeClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch: fetchPublicCms },
  });
}

let client: ReturnType<typeof makeClient> | undefined;
export function createPublicCmsClient() { return client ??= makeClient(); }
