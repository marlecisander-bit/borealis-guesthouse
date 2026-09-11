import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';
import { fetchSupabase } from '@/lib/supabase/fetch';
import { getRoomPriceFromMap } from '@/services/pricing';
const images={room:'/borealis-placeholder.svg'};
import type { Room } from '@/types/public';

type TypeRow={id:string;slug:string;name:string;short_description:string|null;long_description:string|null;capacity:number;bed_configuration:string|null;size_sqm:number|null;view_type:string|null;is_featured:boolean};
type ImageRow={room_type_id:string;sort_order:number;is_featured:boolean;media_assets:{file_path:string}|null};
type SeoRow={entity_id:string;title:string|null;meta_description:string|null;og_title:string|null;og_description:string|null;canonical_override:string|null;noindex:boolean|null};

export const getDatabaseRooms=cache(async(includeId?:string):Promise<Room[]>=>{
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key)return[];
  try{
    const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:fetchSupabase}});
    const[{data:types,error},{data:imageRows},{data:links},{data:amenities},{data:seo}]=await Promise.all([
      includeId?db.from('room_types').select('id,slug,name,short_description,long_description,capacity,bed_configuration,size_sqm,view_type,is_featured').or(`and(status.eq.published,is_visible.eq.true),id.eq.${includeId}`).order('is_featured',{ascending:false}).order('sort_order'):db.from('room_types').select('id,slug,name,short_description,long_description,capacity,bed_configuration,size_sqm,view_type,is_featured').eq('status','published').eq('is_visible',true).order('is_featured',{ascending:false}).order('sort_order'),
      db.from('room_images').select('room_type_id,sort_order,is_featured,media_assets(file_path)').eq('status','published').eq('is_visible',true).order('sort_order'),
      db.from('room_type_amenities').select('room_type_id,amenity_id'),
      db.from('amenities').select('id,name,icon').eq('status','published').eq('is_visible',true),
      db.from('seo_metadata').select('entity_id,title,meta_description,og_title,og_description,canonical_override,noindex').eq('entity_type','room_type').eq('status','published'),
    ]);
    if(error||!types)return[];
    const prices=await getRoomPriceFromMap((types as TypeRow[]).map(row=>row.id));
    return(types as TypeRow[]).map(row=>{
      const roomImages=((imageRows||[]) as unknown as ImageRow[]).filter(item=>item.room_type_id===row.id&&item.media_assets).sort((a,b)=>Number(b.is_featured)-Number(a.is_featured)||a.sort_order-b.sort_order).map(item=>`${url}/storage/v1/object/public/public-media/${item.media_assets!.file_path}`);
      const price=prices.get(row.id);const meta=((seo||[]) as SeoRow[]).find(item=>item.entity_id===row.id);const ids=(links||[]).filter(item=>item.room_type_id===row.id).map(item=>item.amenity_id);
      return{id:row.id,slug:row.slug,name:row.name,eyebrow:row.is_featured?'Featured room':'Stay at Borealis',description:row.short_description||'',longDescription:row.long_description||row.short_description||'',image:roomImages[0]||images.room,gallery:roomImages.length?roomImages:[images.room],priceFrom:price?.amount??null,currency:price?.currency??'EUR',capacity:row.capacity,beds:row.bed_configuration||'Bed details available on request',size:row.size_sqm?`${row.size_sqm} m²`:'Size available on request',viewType:row.view_type||'Borealis view',amenities:(amenities||[]).filter(item=>ids.includes(item.id)).map(item=>({id:item.id,name:item.name,icon:item.icon||undefined})),seo:{title:meta?.title||row.name,description:meta?.meta_description||row.short_description||row.name,ogTitle:meta?.og_title||undefined,ogDescription:meta?.og_description||undefined,canonical:meta?.canonical_override||undefined,noindex:meta?.noindex||false}};
    });
  }catch{return[]}
});
