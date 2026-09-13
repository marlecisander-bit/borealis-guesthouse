import 'server-only';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { resolvePublicMediaUrl } from '@/lib/media-url';
import type { AdminSession } from '@/lib/admin/auth';
import type { AdminMediaAsset, MediaAsset } from '@/types/media';

const columns = 'id,property_id,storage_bucket,file_path,filename,title,mime_type,file_type,size_bytes,width,height,alt_text,caption,focal_x,focal_y,placement,related_slug,display_order,is_published,status,is_visible,sort_order,created_at,updated_at';

async function publishedReferences(session: AdminSession, ids: string[]): Promise<Set<string>> {
  if(!ids.length)return new Set();
  const db=await createServerSupabaseClient();
  const references=[['site_settings','media_asset_id','is_public'],['content_sections','media_asset_id','is_visible'],['gallery_items','media_asset_id','is_visible'],['room_images','media_asset_id','is_visible'],['experience_images','media_asset_id','is_visible'],['transfer_images','media_asset_id','is_visible'],['tourism_articles','hero_media_id','is_visible'],['tourism_article_images','media_asset_id','is_visible'],['seo_metadata','og_image_id','']] as const;
  const results=await Promise.all(references.map(async([table,column,visible])=>{
    let query=db.from(table).select(column).eq('property_id',session.propertyId).eq('status','published').in(column,ids);
    if(visible)query=query.eq(visible,true);
    const result=await query.returns<Record<string,string>[]>();
    return {...result,column};
  }));
  const homepage=await db.from('homepage_sections').select('background_media_id,settings').eq('property_id',session.propertyId).eq('status','published').eq('is_visible',true);
  // Fail closed on incomplete reads: archiving must never lose its protection.
  if(homepage.error||results.some(result=>result.error||(result.data?.length||0)>=1000))return new Set(ids);
  return new Set([...results.flatMap(result=>(result.data||[]).map(row=>row[result.column])),...(homepage.data||[]).flatMap(row=>[row.background_media_id,row.settings?.mobileMediaId])].filter((id):id is string=>typeof id==='string'));
}

export const adminMediaRepository = {
  async list(session: AdminSession, filters:{page?:number;query?:string;status?:string}={}) {
    const db=await createServerSupabaseClient(),page=Math.max(1,Math.floor(filters.page||1)),pageSize=24;
    let query=db.from('media_assets').select(columns,{count:'exact'}).eq('property_id',session.propertyId).order('created_at',{ascending:false}).order('id');
    if(filters.status==='archived')query=query.eq('status','archived');else if(filters.status!=='all')query=query.neq('status','archived');
    const search=(filters.query||'').replace(/[^\p{L}\p{N} _.-]/gu,' ').trim().slice(0,100);
    if(search)query=query.or(['title','filename','alt_text','caption'].map(field=>field+'.ilike.%'+search+'%').join(','));
    const{data,error,count}=await query.range((page-1)*pageSize,page*pageSize-1);if(error)throw error;
    const rows=(data||[]) as MediaAsset[],referenced=await publishedReferences(session,rows.filter(row=>row.status!=='archived').map(row=>row.id));
    const assets:AdminMediaAsset[]=rows.map(asset=>({...asset,publicUrl:resolvePublicMediaUrl(asset.file_path,asset.storage_bucket),referencedByPublishedContent:referenced.has(asset.id)}));
    return {assets,total:count||0,page,pageSize};
  },
  async options(session: AdminSession) {
    const db=await createServerSupabaseClient();
    const {data,error}=await db.from('media_assets').select('id,title,alt_text,filename,file_path,storage_bucket,status').eq('property_id',session.propertyId).neq('status','archived').order('created_at',{ascending:false});
    if(error)throw error;
    return (data||[]).map(asset=>({...asset,publicUrl:resolvePublicMediaUrl(asset.file_path,asset.storage_bucket)}));
  },
  async update(session: AdminSession, id: string, values: { title: string; altText: string; caption: string }) {
    const db = await createServerSupabaseClient();
    const { error } = await db.from('media_assets').update({ title: values.title || null, alt_text: values.altText || null, caption: values.caption || null, updated_by: session.userId }).eq('id', id).eq('property_id', session.propertyId);
    if (error) throw error;
  },
  async archive(session: AdminSession, id: string) {
    if ((await publishedReferences(session, [id])).has(id)) throw new Error('This image is used by published content. Replace it there before archiving it.');
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
