import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';
import { fetchSupabase } from '@/lib/supabase/fetch';
import type { GlobalSeoSettings } from '@/types/seo-admin';

const fallback: GlobalSeoSettings = {
  defaultTitle: 'Borealis Guest House | Koman, Albania', titleTemplate: '%s | Borealis Guest House',
  defaultDescription: 'A boutique lakeside guesthouse for quiet stays and local experiences in Koman, Albania.',
  defaultOgMediaId: '', defaultOgUrl: '', siteName: 'Borealis Guest House', robotsIndex: true, robotsFollow: true,
};

export const getGlobalSeo = cache(async (): Promise<GlobalSeoSettings> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return fallback;
  try {
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: fetchSupabase } });
    const { data, error } = await db.from('site_settings').select('setting_key,value_text,value_boolean,media_asset_id')
      .in('setting_key', ['seo_default_title','seo_title_template','seo_default_description','seo_default_og','seo_site_name','seo_robots_index','seo_robots_follow'])
      .eq('status', 'published').eq('is_public', true);
    if (error) return fallback;
    const setting = new Map((data || []).map((item) => [item.setting_key, item]));
    const mediaId = setting.get('seo_default_og')?.media_asset_id || '';
    let image = '';
    if (mediaId) {
      const { data: asset } = await db.from('media_assets').select('file_path').eq('id', mediaId).maybeSingle();
      if (asset) image = `${url}/storage/v1/object/public/public-media/${asset.file_path}`;
    }
    const template = setting.get('seo_title_template')?.value_text || fallback.titleTemplate;
    return {
      defaultTitle: setting.get('seo_default_title')?.value_text || fallback.defaultTitle,
      titleTemplate: template.includes('%s') ? template : fallback.titleTemplate,
      defaultDescription: setting.get('seo_default_description')?.value_text || fallback.defaultDescription,
      defaultOgMediaId: mediaId, defaultOgUrl: image,
      siteName: setting.get('seo_site_name')?.value_text || fallback.siteName,
      robotsIndex: setting.get('seo_robots_index')?.value_boolean ?? true,
      robotsFollow: setting.get('seo_robots_follow')?.value_boolean ?? true,
    };
  } catch { return fallback; }
});
