import {cache} from 'react';
import {createPublicCmsClient} from '@/lib/supabase/public-cms';
import{createServerSupabaseClient}from'@/lib/supabase/server';
import type{TourismArticle}from'@/types/public';
import type{ArticleBlock}from'@/types/explore-admin';
import{getLanguageContext}from'@/services/translations';

const placeholder='/borealis-placeholder.svg';
type Row={id:string;slug:string;title:string;subtitle:string|null;excerpt:string|null;description:string|null;category_id:string|null;hero_media_id:string|null;gallery_media_ids:string[]|null;content_blocks:ArticleBlock[]|null;author_name:string|null;published_at:string|null;is_featured:boolean;related_article_ids:string[]|null;related_experience_ids:string[]|null;related_transfer_ids:string[]|null};
const unique=(values:(string|null|undefined)[])=>Array.from(new Set(values.filter(Boolean)))as string[];

export const getDatabaseArticles = cache(async function getDatabaseArticles(includeId?:string,limit?:number,selectedIds?:string[]):Promise<TourismArticle[]>{
  try{
    const db=includeId?await createServerSupabaseClient():createPublicCmsClient(),base=process.env.NEXT_PUBLIC_SUPABASE_URL||'';
    let query=db.from('tourism_articles').select('id,slug,title,subtitle,excerpt,description,category_id,hero_media_id,gallery_media_ids,content_blocks,author_name,published_at,is_featured,related_article_ids,related_experience_ids,related_transfer_ids').order('is_featured',{ascending:false}).order('sort_order').order('published_at',{ascending:false});
    query=includeId?query.or(`and(status.eq.published,is_visible.eq.true),id.eq.${includeId}`):query.eq('status','published').eq('is_visible',true);
    if(selectedIds?.length)query=query.in('id',selectedIds);if(limit)query=query.limit(selectedIds?.length||limit);
    const{data,error}=await query;if(error||!data?.length)return[];const candidates=data as Row[],rows=(selectedIds?.length?selectedIds.flatMap(id=>{const row=candidates.find(item=>item.id===id);return row?[row]:[]}):candidates).slice(0,limit||undefined),rowIds=rows.map(row=>row.id);
    let seoQuery=db.from('seo_metadata').select('entity_id,title,meta_description,og_image_id,canonical_override,noindex,status').eq('entity_type','tourism_article').in('entity_id',rowIds);if(!includeId)seoQuery=seoQuery.eq('status','published');
    const[{data:seoRows},language]=await Promise.all([seoQuery,getLanguageContext()]);
    const languageIds=unique([language.defaultLanguage?.id,language.selected?.id]);
    const{data:translationRows}=languageIds.length?await db.from('translations').select('language_id,entity_id,field_name,translated_value').eq('entity_type','tourism_article').eq('status','published').in('entity_id',rowIds).in('language_id',languageIds):{data:[]};
    const blockRefs=(row:Row,type:string)=>unique((row.content_blocks||[]).filter(block=>block.type===type).map(block=>block.relatedId));
    const articleIds=unique(rows.flatMap(row=>row.related_article_ids||[])),experienceIds=unique(rows.flatMap(row=>[...(row.related_experience_ids||[]),...blockRefs(row,'related_experience')])),transferIds=unique(rows.flatMap(row=>[...(row.related_transfer_ids||[]),...blockRefs(row,'related_transfer')])),roomIds=unique(rows.flatMap(row=>blockRefs(row,'related_room')));
    const mediaIds=unique(rows.flatMap(row=>{const meta=(seoRows||[]).find(item=>item.entity_id===row.id);return[row.hero_media_id,meta?.og_image_id,...(row.gallery_media_ids||[]),...(row.content_blocks||[]).flatMap(block=>[block.mediaId,...(block.mediaIds||[])])]}));
    const categoryIds=unique(rows.map(row=>row.category_id));
    const[media,categories,relatedArticles,experiences,transfers,rooms]=await Promise.all([
      mediaIds.length?db.from('media_assets').select('id,alt_text,filename,file_path').in('id',mediaIds).eq('status','published').eq('is_visible',true):Promise.resolve({data:[]}),
      categoryIds.length?db.from('tourism_categories').select('id,title,slug').in('id',categoryIds).eq('status','published').eq('is_visible',true):Promise.resolve({data:[]}),
      articleIds.length?db.from('tourism_articles').select('id,title,slug').in('id',articleIds).eq('status','published').eq('is_visible',true):Promise.resolve({data:[]}),
      experienceIds.length?db.from('experiences').select('id,name,slug').in('id',experienceIds).eq('status','published').eq('is_visible',true):Promise.resolve({data:[]}),
      transferIds.length?db.from('transfer_routes').select('id,origin,destination,slug').in('id',transferIds).eq('status','published').eq('is_visible',true).eq('active',true):Promise.resolve({data:[]}),
      roomIds.length?db.from('room_types').select('id,name,slug').in('id',roomIds).eq('status','published').eq('is_visible',true):Promise.resolve({data:[]}),
    ]);
    const mediaMap=new Map((media.data||[]).map(item=>[item.id,{url:`${base}/storage/v1/object/public/public-media/${item.file_path}`,alt:item.alt_text||item.filename||'Borealis Guest House'}]));
    const related:Record<string,{label:string;href:string}>={};
    for(const item of relatedArticles.data||[])related[item.id]={label:item.title,href:`/explore-koman/${item.slug}`};
    for(const item of experiences.data||[])related[item.id]={label:item.name,href:`/experiences/${item.slug}`};
    for(const item of transfers.data||[])related[item.id]={label:`${item.origin} → ${item.destination}`,href:`/transfers/${item.slug}`};
    for(const item of rooms.data||[])related[item.id]={label:item.name,href:`/rooms/${item.slug}`};
    return rows.map(row=>{
      const category=(categories.data||[]).find(item=>item.id===row.category_id);
      const meta=(seoRows||[]).find(item=>item.entity_id===row.id),hero=mediaMap.get(row.hero_media_id||'');
      const rowMediaIds=unique([row.hero_media_id,...(row.gallery_media_ids||[]),...(row.content_blocks||[]).flatMap(block=>[block.mediaId,...(block.mediaIds||[])])]);
      const gallery=rowMediaIds.flatMap(id=>{const item=mediaMap.get(id);return item?[{id,url:item.url,alt:item.alt}]:[]});
      const wordCount=(row.content_blocks||[]).reduce((sum,block)=>sum+(block.text||block.quote||'').split(/\s+/).filter(Boolean).length,0);
      const values=(languageId?:string)=>Object.fromEntries((translationRows||[]).filter(item=>item.entity_id===row.id&&item.language_id===languageId).map(item=>[item.field_name,item.translated_value])),translated={...values(language.defaultLanguage?.id),...values(language.selected?.id)};
      return{id:row.id,slug:row.slug,title:translated.title||row.title,subtitle:translated.subtitle||row.subtitle||'',excerpt:translated.excerpt||row.excerpt||row.description||'',body:[],blocks:translated.rich_content?[{id:'translated-content',type:'rich_text',text:translated.rich_content}]:row.content_blocks||[],image:hero?.url||placeholder,gallery,featuredGallery:(row.gallery_media_ids||[]).flatMap(id=>{const item=mediaMap.get(id);return item?[{id,url:item.url,alt:item.alt}]:[]}),category:{id:category?.id||'guide',name:category?.title||'Koman guide',slug:category?.slug||'guide'},readTime:`${Math.max(1,Math.ceil(wordCount/220))} min read`,author:row.author_name||'',publishedAt:row.published_at||'',featured:row.is_featured,related,relatedArticleIds:row.related_article_ids||[],relatedExperienceIds:row.related_experience_ids||[],relatedTransferIds:row.related_transfer_ids||[],seo:{title:translated.seo_title||meta?.title||row.title,description:translated.meta_description||meta?.meta_description||row.excerpt||'',ogImage:mediaMap.get(meta?.og_image_id||'')?.url,canonical:meta?.canonical_override||undefined,noindex:meta?.noindex||false}};
    });
  }catch{return[]}
});
