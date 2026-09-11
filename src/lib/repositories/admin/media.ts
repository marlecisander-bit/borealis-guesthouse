import 'server-only';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { resolvePublicMediaUrl } from '@/lib/media-url';
import type { AdminSession } from '@/lib/admin/auth';
import type { AdminMediaAsset, MediaAsset } from '@/types/media';

const columns = 'id,property_id,storage_bucket,file_path,filename,title,mime_type,file_type,size_bytes,width,height,alt_text,caption,focal_x,focal_y,placement,related_slug,display_order,is_published,status,is_visible,sort_order,created_at,updated_at';

async function publishedReferences(session: AdminSession, id: string) {
  const db = await createServerSupabaseClient();
  const checks = await Promise.all([
    db.from('homepage_sections').select('id', { count: 'exact', head: true }).eq('property_id', session.propertyId).eq('background_media_id', id).eq('status', 'published').eq('is_visible', true),
    db.from('site_settings').select('id', { count: 'exact', head: true }).eq('property_id', session.propertyId).eq('media_asset_id', id).eq('status', 'published').eq('is_public', true),
    db.from('content_sections').select('id', { count: 'exact', head: true }).eq('property_id', session.propertyId).eq('media_asset_id', id).eq('status', 'published').eq('is_visible', true),
    db.from('gallery_items').select('id', { count: 'exact', head: true }).eq('property_id', session.propertyId).eq('media_asset_id', id).eq('status', 'published').eq('is_visible', true),
    db.from('room_images').select('id', { count: 'exact', head: true }).eq('property_id', session.propertyId).eq('media_asset_id', id).eq('status', 'published').eq('is_visible', true),
    db.from('experience_images').select('id', { count: 'exact', head: true }).eq('property_id', session.propertyId).eq('media_asset_id', id).eq('status', 'published').eq('is_visible', true),
    db.from('transfer_images').select('id', { count: 'exact', head: true }).eq('property_id', session.propertyId).eq('media_asset_id', id).eq('status', 'published').eq('is_visible', true),
    db.from('tourism_articles').select('id', { count: 'exact', head: true }).eq('property_id', session.propertyId).eq('hero_media_id', id).eq('status', 'published').eq('is_visible', true),
    db.from('tourism_article_images').select('id', { count: 'exact', head: true }).eq('property_id', session.propertyId).eq('media_asset_id', id).eq('status', 'published').eq('is_visible', true),
    db.from('seo_metadata').select('id', { count: 'exact', head: true }).eq('property_id', session.propertyId).eq('og_image_id', id).eq('status', 'published'),
  ]);
  return checks.some(result => (result.count || 0) > 0);
}

export const adminMediaRepository = {
  async list(session: AdminSession): Promise<AdminMediaAsset[]> {
    const db = await createServerSupabaseClient();
    const { data, error } = await db.from('media_assets').select(columns).eq('property_id', session.propertyId).order('created_at', { ascending: false });
    if (error) throw error;
    return Promise.all(((data || []) as MediaAsset[]).map(async asset => ({
      ...asset,
      publicUrl: resolvePublicMediaUrl(asset.file_path, asset.storage_bucket),
      referencedByPublishedContent: asset.status === 'archived' ? false : await publishedReferences(session, asset.id),
    })));
  },
  async update(session: AdminSession, id: string, values: { title: string; altText: string; caption: string }) {
    const db = await createServerSupabaseClient();
    const { error } = await db.from('media_assets').update({ title: values.title || null, alt_text: values.altText || null, caption: values.caption || null, updated_by: session.userId }).eq('id', id).eq('property_id', session.propertyId);
    if (error) throw error;
  },
  async archive(session: AdminSession, id: string) {
    if (await publishedReferences(session, id)) throw new Error('This image is used by published content. Replace it there before archiving it.');
    const db = await createServerSupabaseClient();
    const { error } = await db.from('media_assets').update({ status: 'archived', is_published: false, is_visible: false, archived_at: new Date().toISOString(), updated_by: session.userId }).eq('id', id).eq('property_id', session.propertyId);
    if (error) throw error;
  },
  async restore(session: AdminSession, id: string) {
    const db = await createServerSupabaseClient();
    const { error } = await db.from('media_assets').update({ status: 'published', is_published: true, is_visible: true, archived_at: null, updated_by: session.userId }).eq('id', id).eq('property_id', session.propertyId);
    if (error) throw error;
  },
};
