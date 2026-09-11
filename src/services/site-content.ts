import'server-only';
import{createServerSupabaseClient}from'@/lib/supabase/server';
import{getEntityTranslationMap}from'@/services/translations';
import{resolvePublicMediaUrl}from'@/lib/media-url';
import{landingPageDefaults,type LandingPageKey}from'@/lib/landing-page-content';
import type{ContactInfo}from'@/types/public';
import type{LandingPageContent,SiteDocumentKey}from'@/types/site-content-cms';
const fallback:ContactInfo={email:'',phone:'',phoneLabel:'Contact details unavailable',whatsapp:'',whatsappLabel:'',instagram:'',instagramLabel:'',address:'Koman, Albania',mapsUrl:'',placeholder:true};
export async function getSiteDocument(key:SiteDocumentKey,preview=false){try{const db=await createServerSupabaseClient();let query=db.from('cms_documents').select('id,data,draft_data').eq('document_key',key);if(!preview)query=query.eq('status','published');const{data}=await query.maybeSingle(),base=((preview&&data?.draft_data)||data?.data||{})as Record<string,string>;if(!data?.id||preview)return base;const translated=await getEntityTranslationMap('cms_document',[data.id]);return{...base,...translated.get(data.id)}}catch{return{}}}
export async function getLandingPageContent(key:LandingPageKey):Promise<LandingPageContent>{const fallback=landingPageDefaults[key];try{const data=await getSiteDocument(key),merged={...fallback,...data,heroImage:''};const mediaId=data.heroImageId||'';if(!/^[0-9a-f-]{36}$/i.test(mediaId))return merged;const db=await createServerSupabaseClient(),{data:asset}=await db.from('media_assets').select('file_path,storage_bucket,alt_text').eq('id',mediaId).eq('status','published').eq('is_visible',true).maybeSingle();if(!asset?.file_path)return merged;return{...merged,heroImage:resolvePublicMediaUrl(asset.file_path,asset.storage_bucket||undefined),heroImageAlt:data.heroImageAlt||asset.alt_text||fallback.heroImageAlt}}catch{return fallback}}
export async function getContactInfo(preview=false):Promise<ContactInfo>{
  const d=await getSiteDocument('contact',preview);
  try{
    const db=await createServerSupabaseClient();
    const{data:property}=await db.from('properties').select('address_line,location,google_maps_url').eq('status','published').order('created_at').limit(1).maybeSingle();
    const hasContent=Object.keys(d).length>0||Boolean(property);
    return hasContent?{
      email:d.email||fallback.email,
      phone:d.phone||'',phoneLabel:d.phone||'Phone number to be confirmed',
      whatsapp:d.whatsapp||'',whatsappLabel:d.whatsapp?'Message us on WhatsApp':'WhatsApp number to be confirmed',
      instagram:d.instagram||'',instagramLabel:d.instagram?'Borealis on Instagram':'Instagram profile to be confirmed',
      address:property?.address_line||property?.location||d.address||fallback.address,
      mapsUrl:property?.google_maps_url||'',placeholder:false,
    }:fallback;
  }catch{
    return Object.keys(d).length?{email:d.email||fallback.email,phone:d.phone||'',phoneLabel:d.phone||'Phone number to be confirmed',whatsapp:d.whatsapp||'',whatsappLabel:d.whatsapp?'Message us on WhatsApp':'WhatsApp number to be confirmed',instagram:d.instagram||'',instagramLabel:d.instagram?'Borealis on Instagram':'Instagram profile to be confirmed',address:d.address||fallback.address,mapsUrl:'',placeholder:false}:fallback;
  }
}
export async function getNavigation(location:'header'|'footer'){try{const db=await createServerSupabaseClient(),{data}=await db.from('navigation_items').select('id,label,href').eq('location',location).eq('status','published').eq('is_visible',true).order('sort_order'),rows=data||[],translated=await getEntityTranslationMap('navigation_item',rows.map(x=>x.id));return rows.map(x=>({label:translated.get(x.id)?.label||x.label,href:x.href}))}catch{return[]}}
