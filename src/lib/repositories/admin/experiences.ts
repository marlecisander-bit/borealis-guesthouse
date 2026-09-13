import 'server-only';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AdminSession } from '@/lib/admin/auth';
import type { AdminExperience, ExperienceMediaOption } from '@/types/experiences-admin';
import type { validateExperience } from '@/lib/admin/experience-validation';

type Input = NonNullable<ReturnType<typeof validateExperience>['data']>;
const mediaUrl = (base:string,path:string) => `${base}/storage/v1/object/public/public-media/${path}`;

export const adminExperiencesRepository = {
  async summaries(session:AdminSession,page=1,status='active') {
    const db=await createServerSupabaseClient(),pageSize=24;
    page=Math.max(1,Math.min(10000,Math.floor(page)||1));
    let query=db.from('experiences').select('id,name,cover_media_id,price,currency,is_featured,status',{count:'exact'}).eq('property_id',session.propertyId).order('sort_order').order('id');
    query=status==='archived'?query.eq('status','archived'):query.neq('status','archived');
    const {data,error,count}=await query.range((page-1)*pageSize,page*pageSize-1);if(error)throw error;
    const rows=data||[],ids=rows.map(row=>row.id);
    const {data:images,error:imageError}=ids.length?await db.from('experience_images').select('experience_id,media_asset_id').eq('property_id',session.propertyId).in('experience_id',ids).neq('status','archived').order('sort_order'):{data:[],error:null};
    if(imageError)throw imageError;
    const mediaIds=[...new Set([...rows.map(row=>row.cover_media_id),...(images||[]).map(row=>row.media_asset_id)].filter(Boolean))];
    const {data:media,error:mediaError}=mediaIds.length?await db.from('media_assets').select('id,file_path').eq('property_id',session.propertyId).in('id',mediaIds).neq('status','archived'):{data:[],error:null};
    if(mediaError)throw mediaError;
    const paths=new Map((media||[]).map(asset=>[asset.id,asset.file_path]));
    return {page,pageSize,total:count||0,items:rows.map(row=>{const path=paths.get(row.cover_media_id)||paths.get((images||[]).find(image=>image.experience_id===row.id)?.media_asset_id);return {id:row.id,name:row.name,price:row.price===null?null:Number(row.price),currency:row.currency||'EUR',featured:row.is_featured,status:row.status,imageUrl:path?mediaUrl(process.env.NEXT_PUBLIC_SUPABASE_URL||'',path):''};})};
  },
  async list(session:AdminSession,id?:string):Promise<AdminExperience[]> {
    const db=await createServerSupabaseClient(),base=process.env.NEXT_PUBLIC_SUPABASE_URL||'';
    const [{data,error},{data:images},{data:media},{data:seo}]=await Promise.all([
      db.from('experiences').select('id,name,slug,short_description,full_description,cover_media_id,duration_label,duration_minutes,max_capacity,price,currency,pricing_type,meeting_point,included_items,excluded_items,important_notes,booking_notice,active,is_featured,bookable,book_independently,minimum_quantity,maximum_quantity,booking_cutoff_hours,operating_days,operating_start_time,operating_end_time,slot_interval_minutes,active_date_start,active_date_end,status,sort_order,availability_mode,updated_at').eq('property_id',session.propertyId).order('sort_order').match(id?{id}:{}),
      db.from('experience_images').select('experience_id,media_asset_id,sort_order').eq('property_id',session.propertyId).neq('status','archived').order('sort_order').match(id?{experience_id:id}:{}),
      db.from('media_assets').select('id,file_path').eq('property_id',session.propertyId).neq('status','archived'),
      db.from('seo_metadata').select('entity_id,title,meta_description').eq('property_id',session.propertyId).eq('entity_type','experience').match(id?{entity_id:id}:{}),
    ]);
    if(error)throw error;
    const mediaPaths=new Map((media||[]).map(asset=>[asset.id,asset.file_path]));
    return(data||[]).map(item=>{
      const gallery=(images||[]).filter(image=>image.experience_id===item.id),meta=(seo||[]).find(value=>value.entity_id===item.id);
      const path=mediaPaths.get(item.cover_media_id||'')||mediaPaths.get(gallery[0]?.media_asset_id||'');
      return {id:item.id,name:item.name,slug:item.slug||'',shortDescription:item.short_description||'',fullDescription:item.full_description||'',coverMediaId:item.cover_media_id||'',imageUrl:path?mediaUrl(base,path):'',galleryMediaIds:gallery.map(image=>image.media_asset_id),duration:item.duration_label||(item.duration_minutes?`${item.duration_minutes} minutes`:''),capacity:item.max_capacity,price:item.price===null?null:Number(item.price),currency:item.currency||'EUR',pricingType:item.pricing_type,meetingPoint:item.meeting_point||'',included:item.included_items||[],excluded:item.excluded_items||[],notes:item.important_notes||[],bookingNotice:item.booking_notice||'',active:item.active,featured:item.is_featured,bookable:item.bookable,bookIndependently:item.book_independently??false,minimumQuantity:item.minimum_quantity??1,maximumQuantity:item.maximum_quantity??null,bookingCutoffHours:item.booking_cutoff_hours??0,operatingDays:item.operating_days||[],operatingStartTime:(item.operating_start_time||'').slice(0,5),operatingEndTime:(item.operating_end_time||'').slice(0,5),slotIntervalMinutes:item.slot_interval_minutes??null,activeDateStart:item.active_date_start||'',activeDateEnd:item.active_date_end||'',status:item.status,sortOrder:item.sort_order,availabilityMode:item.availability_mode,seoTitle:meta?.title||'',seoDescription:meta?.meta_description||'',updatedAt:item.updated_at};
    });
  },
  async get(session:AdminSession,id:string){return(await this.list(session,id)).find(item=>item.id===id)||null},
  async media(session:AdminSession):Promise<ExperienceMediaOption[]>{const db=await createServerSupabaseClient(),base=process.env.NEXT_PUBLIC_SUPABASE_URL||'';const{data}=await db.from('media_assets').select('id,filename,alt_text,file_path').eq('property_id',session.propertyId).neq('status','archived').order('sort_order');return(data||[]).map(item=>({id:item.id,label:item.alt_text||item.filename,url:mediaUrl(base,item.file_path)}))},
  async save(session:AdminSession,id:string|null,input:Input){
    const db=await createServerSupabaseClient(),values={property_id:session.propertyId,name:input.name,slug:input.slug,description:input.shortDescription,short_description:input.shortDescription,full_description:input.fullDescription,cover_media_id:input.coverMediaId,duration_label:input.duration,max_capacity:input.capacity,price:input.price,currency:input.currency,pricing_type:input.pricingType,meeting_point:input.meetingPoint,included_items:input.included,excluded_items:input.excluded,important_notes:input.notes,booking_notice:input.bookingNotice,active:input.active,is_featured:input.featured,bookable:input.bookable,book_independently:input.bookIndependently,minimum_quantity:input.minimumQuantity,maximum_quantity:input.maximumQuantity,booking_cutoff_hours:input.bookingCutoffHours,operating_days:input.operatingDays,operating_start_time:input.operatingStartTime||null,operating_end_time:input.operatingEndTime||null,slot_interval_minutes:input.slotIntervalMinutes,active_date_start:input.activeDateStart||null,active_date_end:input.activeDateEnd||null,status:input.status,sort_order:input.sortOrder,availability_mode:input.availabilityMode,updated_by:session.userId,archived_at:null};
    const result=id?await db.from('experiences').update(values).eq('id',id).eq('property_id',session.propertyId).select('id').single():await db.from('experiences').insert({...values,created_by:session.userId}).select('id').single();
    if(result.error)throw result.error;const experienceId=result.data.id;
    await db.from('experience_images').delete().eq('experience_id',experienceId);
    const ids=Array.from(new Set([input.coverMediaId,...input.galleryMediaIds].filter(Boolean)))as string[];
    if(ids.length){const{error}=await db.from('experience_images').insert(ids.map((mediaId,index)=>({property_id:session.propertyId,experience_id:experienceId,media_asset_id:mediaId,sort_order:index,is_cover:mediaId===input.coverMediaId,status:input.status,created_by:session.userId})));if(error)throw error}
    const{error:seoError}=await db.from('seo_metadata').upsert({property_id:session.propertyId,entity_type:'experience',entity_id:experienceId,title:input.seoTitle||input.name,meta_description:input.seoDescription||input.shortDescription,status:input.status,created_by:session.userId,updated_by:session.userId},{onConflict:'property_id,entity_type,entity_id'});if(seoError)throw seoError;return experienceId;
  },
  async status(session:AdminSession,id:string,status:'draft'|'archived'){const db=await createServerSupabaseClient(),archivedAt=status==='archived'?new Date().toISOString():null;const results=await Promise.all([db.from('experiences').update({status,active:status!=='archived',archived_at:archivedAt,updated_by:session.userId}).eq('id',id).eq('property_id',session.propertyId),db.from('experience_images').update({status}).eq('experience_id',id).eq('property_id',session.propertyId),db.from('seo_metadata').update({status,updated_by:session.userId}).eq('entity_type','experience').eq('entity_id',id).eq('property_id',session.propertyId)]);const failed=results.find(result=>result.error);if(failed?.error)throw failed.error},
  async duplicate(session:AdminSession,id:string){const item=await this.get(session,id);if(!item)throw new Error('Experience not found');const duplicate:Input={...item,name:`${item.name} copy`,slug:`${item.slug}-copy-${Date.now().toString().slice(-5)}`,coverMediaId:item.coverMediaId||null,price:item.price,featured:false,active:false,bookIndependently:false,status:'draft'};return this.save(session,null,duplicate)},
};
