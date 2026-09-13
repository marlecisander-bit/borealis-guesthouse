import {cache} from 'react';
import {createPublicCmsClient} from '@/lib/supabase/public-cms';
import type {TransferRoute} from '@/types/public';

const placeholder='/borealis-placeholder.svg';
type Row={id:string;origin:string;destination:string;slug:string;short_description:string|null;description:string|null;full_description:string|null;cover_media_id:string|null;duration_label:string|null;duration_minutes:number|null;capacity:number|null;service_type:string|null;price:number|string|null;currency:string|null;price_type:string;booking_notice:string|null;active:boolean;is_featured:boolean;bookable:boolean;availability_mode:string;available_days:number[]|null;window_start:string|null;window_end:string|null};

export const getDatabaseTransfers = cache(async function getDatabaseTransfers(limit?:number,selectedIds?:string[]):Promise<TransferRoute[]>{
  try{
    const db=createPublicCmsClient(),base=process.env.NEXT_PUBLIC_SUPABASE_URL||'';
    let query=db.from('transfer_routes').select('id,origin,destination,slug,short_description,description,full_description,cover_media_id,duration_label,duration_minutes,capacity,service_type,price,currency,price_type,booking_notice,active,is_featured,bookable,availability_mode,available_days,window_start,window_end').eq('status','published').eq('is_visible',true).eq('active',true).order('is_featured',{ascending:false}).order('sort_order');
    if(limit)query=query.limit(limit);
    let{data,error}=await query;
    if(limit&&selectedIds?.length&&!data?.some(item=>item.is_featured)){const selected=await query.in('id',selectedIds).limit(selectedIds.length);data=selectedIds.flatMap(id=>{const row=selected.data?.find(item=>item.id===id);return row?[row]:[];}).slice(0,limit);error=selected.error;}
    if(error||!data?.length)return[];
    const rows=data as Row[],routeIds=rows.map(row=>row.id);
    const[images,seo]=await Promise.all([
      db.from('transfer_images').select('transfer_route_id,media_asset_id,sort_order').in('transfer_route_id',routeIds).eq('status','published').eq('is_visible',true).order('sort_order'),
      db.from('seo_metadata').select('entity_id,title,meta_description').eq('entity_type','transfer_route').eq('status','published').in('entity_id',routeIds),
    ]);
    const imageRows=images.data||[],mediaIds=Array.from(new Set([...rows.flatMap(row=>row.cover_media_id?[row.cover_media_id]:[]),...imageRows.map(row=>row.media_asset_id)]));
    const{data:media}=mediaIds.length?await db.from('media_assets').select('id,file_path').in('id',mediaIds).eq('status','published').eq('is_visible',true):{data:[] as {id:string;file_path:string}[]};
    const paths=new Map((media||[]).map(item=>[item.id,item.file_path])),url=(id:string|null)=>id&&paths.get(id)?`${base}/storage/v1/object/public/public-media/${paths.get(id)}`:'';
    return rows.map(row=>{
      const gallery=Array.from(new Set([url(row.cover_media_id),...imageRows.filter(item=>item.transfer_route_id===row.id).map(item=>url(item.media_asset_id))].filter(Boolean)))as string[];
      const meta=(seo.data||[]).find(item=>item.entity_id===row.id);
      return{id:row.id,slug:row.slug,origin:row.origin,destination:row.destination,description:row.short_description||row.description||'',fullDescription:row.full_description||'',duration:row.duration_label||(row.duration_minutes?`${row.duration_minutes} minutes`:'To be confirmed'),capacity:row.capacity,vehicleServiceType:row.service_type||'Transfer service',pricingMethod:row.price_type==='per_passenger'?'per_passenger':row.price_type==='on_request'?'on_request':'fixed_vehicle',currency:row.currency||'EUR',price:row.price===null?null:Number(row.price),bookingNotice:row.booking_notice||'',active:row.active,featured:row.is_featured,bookable:row.bookable,availabilityMode:row.availability_mode==='scheduled'?'scheduled':row.availability_mode==='always'?'always':'on_request',availableDays:row.available_days||[],windowStart:(row.window_start||'').slice(0,5),windowEnd:(row.window_end||'').slice(0,5),image:gallery[0]||placeholder,gallery:gallery.length?gallery:[placeholder],seo:{title:meta?.title||`${row.origin} to ${row.destination} transfer`,description:meta?.meta_description||row.short_description||row.description||'',image:gallery[0]||placeholder}};
    });
  }catch{return[]}
});
