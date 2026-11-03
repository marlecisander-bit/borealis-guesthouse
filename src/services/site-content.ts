import {cache} from 'react';
import {createPublicCmsClient} from '@/lib/supabase/public-cms';
import'server-only';
import{requireAdmin}from'@/lib/admin/auth';
import{adminSiteContentRepository}from'@/lib/repositories/admin/site-content';
import{getEntityTranslationMap}from'@/services/translations';
import{resolvePublicMediaUrl}from'@/lib/media-url';
import{landingPageDefaults,type LandingPageKey}from'@/lib/landing-page-content';
import type{ContactInfo}from'@/types/public';
import type{LandingPageContent,SiteDocumentKey}from'@/types/site-content-cms';
import type{OccupancyAgePolicy}from'@/types/booking';
const fallback:ContactInfo={email:'',phone:'',phoneLabel:'Contact details unavailable',whatsapp:'',whatsappLabel:'',instagram:'',instagramLabel:'',facebook:'',facebookLabel:'',address:'Koman, Albania',mapsUrl:'',placeholder:true};
export const getSiteDocument = cache(async function getSiteDocument(key:SiteDocumentKey,preview=false){
  // Private reads stay outside the public fallback/cache path. Auth failures propagate.
  if(preview){const session=await requireAdmin(['owner','manager','editor']);const document=await adminSiteContentRepository.document(session,key);return document.data;}
  try{const db=createPublicCmsClient();const{data,error}=await db.from('cms_documents').select('id,data').eq('document_key',key).eq('status','published').returns<{id:string;data:Record<string,string>}[]>().maybeSingle();if(error)return{};const base=data?.data||{};if(!data?.id)return base;const translated=await getEntityTranslationMap('cms_document',[data.id]);return{...base,...translated.get(data.id)}}catch{return{}}
});
export const getLandingPageContent = cache(async function getLandingPageContent(key:LandingPageKey):Promise<LandingPageContent>{const fallback=landingPageDefaults[key];try{const data=await getSiteDocument(key),merged={...fallback,...data,heroImage:''};const mediaId=data.heroImageId||'';if(!/^[0-9a-f-]{36}$/i.test(mediaId))return merged;const db=createPublicCmsClient(),{data:asset}=await db.from('media_assets').select('file_path,storage_bucket,alt_text').eq('id',mediaId).eq('status','published').eq('is_visible',true).maybeSingle();if(!asset?.file_path)return merged;return{...merged,heroImage:resolvePublicMediaUrl(asset.file_path,asset.storage_bucket||undefined),heroImageAlt:data.heroImageAlt||asset.alt_text||fallback.heroImageAlt}}catch{return fallback}});
export const getContactInfo = cache(async function getContactInfo(preview=false):Promise<ContactInfo>{
  const d=await getSiteDocument('contact',preview);
  try{
    const db=createPublicCmsClient();
    const{data:property}=await db.from('properties').select('address_line,location,google_maps_url,phone,whatsapp,email,instagram_url,facebook_url').eq('status','published').order('created_at').limit(1).maybeSingle();
    const hasContent=Object.keys(d).length>0||Boolean(property);
    const phone=property?.phone||d.phone||'',whatsapp=property?.whatsapp||d.whatsapp||'',instagram=property?.instagram_url||d.instagram||'',facebook=property?.facebook_url||'';
    return hasContent?{
      email:property?.email||d.email||fallback.email,
      phone,phoneLabel:phone||'Phone number to be confirmed',
      whatsapp,whatsappLabel:whatsapp?'Message us on WhatsApp':'WhatsApp number to be confirmed',
      instagram,instagramLabel:instagram?'Borealis on Instagram':'Instagram profile to be confirmed',
      facebook,facebookLabel:facebook?'Borealis on Facebook':'Facebook profile to be confirmed',
      address:property?.address_line||property?.location||d.address||fallback.address,
      mapsUrl:property?.google_maps_url||'',placeholder:false,
    }:fallback;
  }catch{
    return Object.keys(d).length?{email:d.email||fallback.email,phone:d.phone||'',phoneLabel:d.phone||'Phone number to be confirmed',whatsapp:d.whatsapp||'',whatsappLabel:d.whatsapp?'Message us on WhatsApp':'WhatsApp number to be confirmed',instagram:d.instagram||'',instagramLabel:d.instagram?'Borealis on Instagram':'Instagram profile to be confirmed',facebook:'',facebookLabel:'',address:d.address||fallback.address,mapsUrl:'',placeholder:false}:fallback;
  }
});
export const getNavigation = cache(async function getNavigation(location:'header'|'footer'){try{const db=createPublicCmsClient(),{data}=await db.from('navigation_items').select('id,label,href').eq('location',location).eq('status','published').eq('is_visible',true).order('sort_order'),rows=data||[],translated=await getEntityTranslationMap('navigation_item',rows.map(x=>x.id));return rows.filter(x=>!/^\/about(?:[/?#]|$)/.test(x.href)).filter(x=>(x.href!=='/transfers'||!rows.some(item=>item.href==='/experiences'))&&(x.href!=='/contact'||!rows.some(item=>item.href==='/gallery'))).map(x=>({label:x.href==='/experiences'||x.href==='/transfers'?'Journey':x.href==='/gallery'||x.href==='/contact'?'Discover':translated.get(x.id)?.label||x.label,href:x.href==='/transfers'?'/experiences':x.href==='/contact'?'/gallery':x.href})).sort((a,b)=>['/','/rooms','/experiences','/explore-koman','/gallery'].indexOf(a.href)-['/','/rooms','/experiences','/explore-koman','/gallery'].indexOf(b.href))}catch{return[]}});
export const getOccupancyAgePolicy = cache(async function getOccupancyAgePolicy():Promise<OccupancyAgePolicy>{
  const fallback={infantMaxAge:2,childMaxAge:12,minimumBookingHolderAge:18};
  try{const db=createPublicCmsClient(),{data:property}=await db.from('properties').select('id').eq('status','published').order('created_at').limit(1).maybeSingle();if(!property)return fallback;const{data}=await db.from('site_settings').select('setting_key,value_number').eq('property_id',property.id).in('setting_key',['infant_max_age','child_max_age','minimum_booking_holder_age']);const value=(key:string,defaultValue:number)=>{const result=data?.find(item=>item.setting_key===key)?.value_number;return result==null?defaultValue:Number(result)};return{infantMaxAge:value('infant_max_age',2),childMaxAge:value('child_max_age',12),minimumBookingHolderAge:value('minimum_booking_holder_age',18)}}catch{return fallback}
});
