import { resolvePublicMediaUrl } from '@/lib/media-url';
import { fetchPublicCms } from '@/lib/supabase/public-cms';
import 'server-only';
import {cache} from 'react';
import {createClient} from '@supabase/supabase-js';
import {getDatabaseRooms} from '@/services/database-rooms';
import {getDatabaseExperiences} from '@/services/database-experiences';
import {getDatabaseTransfers} from '@/services/database-transfers';
import {getDatabaseArticles} from '@/services/database-articles';
import {getHomepageCms} from '@/services/homepage-cms';
import {getLanguageContext} from '@/services/translations';
import {getSiteDocument} from '@/services/site-content';
import type {AboutContent,Experience,GalleryItem,Property,Room,TourismArticle,TransferRoute} from '@/types/public';

const placeholder='/borealis-placeholder.svg';
function client(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:fetchPublicCms}}):null}
function mediaUrl(path?:string|null){const base=process.env.NEXT_PUBLIC_SUPABASE_URL;return base&&path?`${base}/storage/v1/object/public/public-media/${path}`:placeholder}

async function translations(entityType:string,ids:string[]){const db=client(),language=await getLanguageContext();if(!db||!language.selected||!ids.length)return new Map<string,Record<string,string>>();const languageIds=Array.from(new Set([language.defaultLanguage?.id,language.selected.id].filter(Boolean)))as string[];const{data}=await db.from('translations').select('entity_id,language_id,field_name,translated_value').eq('entity_type',entityType).eq('status','published').in('entity_id',ids).in('language_id',languageIds);const result=new Map<string,Record<string,string>>();for(const id of ids){const rows=(data||[]).filter(row=>row.entity_id===id),values=(languageId?:string)=>Object.fromEntries(rows.filter(row=>row.language_id===languageId).map(row=>[row.field_name,row.translated_value]));result.set(id,{...values(language.defaultLanguage?.id),...values(language.selected.id)})}return result}

const getProperty=cache(async():Promise<Property>=>{const db=client();const empty:Property={name:'Borealis Guest House',tagline:'',description:'',location:'Koman, Albania',heroImage:placeholder,amenities:[],seo:{title:'Borealis Guest House',description:''}};if(!db)return empty;const{data}=await db.from('properties').select('id,name,description,location,address_line').eq('status','published').limit(1).maybeSingle();if(!data)return empty;const [{data:hero},{data:seo},translated]=await Promise.all([db.from('media_assets').select('file_path').eq('status','published').eq('is_visible',true).eq('placement','home_hero').order('sort_order').limit(1).maybeSingle(),db.from('seo_metadata').select('title,meta_description').eq('entity_type','property').eq('entity_id',data.id).eq('status','published').maybeSingle(),translations('property',[data.id])]);const t=translated.get(data.id)||{};return{name:t.name||data.name,tagline:t.subtitle||'',description:t.description||data.description||'',location:data.address_line||data.location||'',heroImage:mediaUrl(hero?.file_path),amenities:[],seo:{title:t.seo_title||seo?.title||data.name,description:t.meta_description||seo?.meta_description||data.description||''}}});

const getRooms = cache(async function getRooms(previewId?:string):Promise<Room[]>{const rows=await getDatabaseRooms(previewId),translated=await translations('room_type',rows.map(row=>row.id));return rows.map(row=>{const t=translated.get(row.id)||{};return{...row,name:t.title||t.name||row.name,description:t.description||row.description,longDescription:t.long_description||t.description||row.longDescription,seo:{...row.seo,title:t.seo_title||row.seo.title,description:t.meta_description||row.seo.description}}})});
const getExperiences = cache(async function getExperiences(previewId?:string,limit?:number,selectedIds?:string[]):Promise<Experience[]>{const rows=await getDatabaseExperiences(previewId,limit,selectedIds),translated=await translations('experience',rows.map(row=>row.id));return rows.map(row=>{const t=translated.get(row.id)||{};return{...row,title:t.title||t.name||row.title,description:t.description||row.description,longDescription:t.long_description||t.description||row.longDescription,seo:{...row.seo,title:t.seo_title||row.seo.title,description:t.meta_description||row.seo.description}}})});
const getTransfers = cache(async function getTransfers(limit?:number,selectedIds?:string[]):Promise<TransferRoute[]>{const rows=await getDatabaseTransfers(limit,selectedIds),translated=await translations('transfer_route',rows.map(row=>row.id));return rows.map(row=>{const t=translated.get(row.id)||{};return{...row,origin:t.origin||row.origin,destination:t.destination||row.destination,description:t.description||row.description,fullDescription:t.full_description||row.fullDescription,seo:{...row.seo,title:t.seo_title||row.seo.title,description:t.meta_description||row.seo.description}}})});
const getExploreArticles = cache(async function getExploreArticles(limit?:number,selectedIds?:string[]):Promise<TourismArticle[]>{return getDatabaseArticles(undefined,limit,selectedIds)});
const getGallery = cache(async function getGallery(): Promise<GalleryItem[]> {
  const db = client();
  if (!db) return [];

  const readAssets = async () => {
    const query = db.from('media_assets')
      .select('id,file_path,storage_bucket,alt_text,title,filename,mime_type,file_type,width,height')
      .eq('status', 'published').eq('is_visible', true)
      .order('created_at', { ascending: false }).order('id');
    const batchSize = 500;
    const first = await query.range(0, batchSize - 1);
    if (first.error || !first.data) return [];
    const assets = [...first.data];
    for (let offset = batchSize; assets.length === offset; offset += batchSize) {
      const { data, error } = await query.range(offset, offset + batchSize - 1);
      if (error || !data?.length) break;
      assets.push(...data);
    }
    return assets;
  };

  const [assets, curated] = await Promise.all([
    readAssets(),
    db.from('gallery_items').select('media_asset_id,title,category').eq('status', 'published')
      .eq('is_visible', true).order('is_featured', { ascending: false }).order('sort_order').order('id'),
  ]);
  const items = new Map<string, GalleryItem>();
  const metadata = new Map<string, { title: string | null; category: string | null }>();
  for (const entry of curated.data || []) {
    if (!metadata.has(entry.media_asset_id)) metadata.set(entry.media_asset_id, entry);
  }

  for (const asset of assets) {
    const mime = asset.mime_type || asset.file_type || '';
    if (!asset.file_path || !(mime.startsWith('image/') || (!mime.includes('/') && /\.(?:jpe?g|png|webp|avif|gif)$/i.test(asset.file_path)))) continue;
    const entry = metadata.get(asset.id);
    items.set(asset.id, {
      id: asset.id,
      src: resolvePublicMediaUrl(asset.file_path, asset.storage_bucket || undefined),
      alt: asset.alt_text || entry?.title || asset.title || 'Borealis Guest House',
      category: entry?.category || 'Borealis',
      width: asset.width || undefined,
      height: asset.height || undefined,
    });
  }

  const ordered: GalleryItem[] = [];
  for (const id of metadata.keys()) {
    const item = items.get(id);
    if (item) ordered.push(item);
    items.delete(id);
  }
  return [...ordered, ...items.values()];
});
const getSiteSettings = cache(async function getSiteSettings(){const db=client();if(!db)return{};const{data}=await db.from('site_settings').select('setting_key,value_text,value_number,value_boolean,media_asset_id').eq('status','published').eq('is_public',true);return Object.fromEntries((data||[]).map(row=>[row.setting_key,row.value_text??row.value_number??row.value_boolean??row.media_asset_id??null]))});
const getAbout = cache(async function getAbout(preview=false):Promise<AboutContent>{const data=await getSiteDocument('about',preview);return{heroEyebrow:data.heroEyebrow||'Our story',heroTitle:data.heroTitle||'About Borealis',heroCopy:data.introduction||'',heroImage:data.heroImage||placeholder,heroImageAlt:data.heroImageAlt||'Borealis Guest House by the lake',sections:[{id:'story',eyebrow:data.storyEyebrow||'Our story',title:data.storyHeading||'',copy:data.storyText||'',image:data.storyImage||placeholder,imageAlt:data.storyImageAlt||data.storyHeading||'Borealis Guest House'},{id:'location',eyebrow:data.locationEyebrow||'Koman',title:data.locationHeading||'',copy:data.locationText||'',image:data.locationImage||placeholder,imageAlt:data.locationImageAlt||data.locationHeading||'Koman landscape'}].filter(section=>section.title||section.copy),philosophyEyebrow:data.philosophyEyebrow||'Hospitality philosophy',philosophyHeading:data.philosophyHeading||'Thoughtful, never formal.',philosophy:(data.philosophy||'').split(/\r?\n/).filter(Boolean),ctaLabel:data.ctaLabel||'Check availability',ctaTarget:data.ctaTarget||'/book'}});

export const publicContentRepository={getProperty,getHomepage:getHomepageCms,getRooms,getRoomBySlug:async(slug:string,previewId?:string)=>(await getRooms(previewId)).find(row=>row.slug===slug),getExperiences,getExperienceBySlug:async(slug:string,previewId?:string)=>(await getExperiences(previewId)).find(row=>row.slug===slug),getTransfers,getTransferBySlug:async(slug:string)=>(await getTransfers()).find(row=>row.slug===slug),getExploreArticles,getExploreArticleBySlug:async(slug:string,previewId?:string)=>(await getDatabaseArticles(previewId)).find(row=>row.slug===slug),getGallery,getSiteSettings,getAbout};
