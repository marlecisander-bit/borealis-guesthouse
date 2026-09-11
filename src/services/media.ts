import { cache } from 'react';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { fetchSupabase } from '@/lib/supabase/fetch';
import type { MediaAsset } from '@/types/media';
const createClient=(url:string,key:string,options:Parameters<typeof createSupabaseClient>[2])=>createSupabaseClient(url,key,{...options,global:{...options?.global,fetch:fetchSupabase}});

export interface PublicMediaAsset extends MediaAsset {
  publicUrl: string;
}

export const getPublicMedia = cache(async (): Promise<PublicMediaAsset[]> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase.from('media_assets').select('id,property_id,file_path,alt_text,title,file_type,size_bytes,placement,related_slug,display_order,is_published,created_at').eq('is_published', true).order('display_order', { ascending: true }).order('created_at', { ascending: false });
    if (error || !data) return [];
    return (data as MediaAsset[]).map((asset) => ({ ...asset, publicUrl: supabase.storage.from('public-media').getPublicUrl(asset.file_path).data.publicUrl }));
  } catch {
    return [];
  }
});
