import { SITE_DOCUMENT_KEYS } from '@/types/site-content-cms';
import { websiteStatus, type WebsiteStatus } from '@/lib/admin/website-status';
import {assertCmsSession,readPrivateCmsDocuments,savePrivateCmsDocument,privateCmsPayload} from '@/lib/admin/cms-documents';
import'server-only';import{createServerSupabaseClient}from'@/lib/supabase/server';import type{AdminSession}from'@/lib/admin/auth';import type{NavigationItem,SiteDocument}from'@/types/site-content-cms';
export const adminSiteContentRepository={async document(s:AdminSession,key:SiteDocument['key']){assertCmsSession(s);const db=await createServerSupabaseClient();const rows=await readPrivateCmsDocuments(db,s,key),row=rows[0];return row?{id:row.id,key:row.document_key,data:privateCmsPayload(row),status:row.draft_data?'draft':row.status,publication:websiteStatus(row.status,Boolean(row.draft_data))}as SiteDocument:{id:'',key,data:{},status:'draft',publication:'Live'}as SiteDocument},async statuses(s:AdminSession):Promise<Record<string,WebsiteStatus>> {
  assertCmsSession(s);
  const db=await createServerSupabaseClient();
  const [documents, draft, hero, navigation]=await Promise.all([
    readPrivateCmsDocuments(db,s).catch(()=>null),
    db.from('homepage_drafts').select('property_id').eq('property_id',s.propertyId).maybeSingle(),
    db.from('homepage_sections').select('status').eq('property_id',s.propertyId).eq('section_key','hero').maybeSingle(),
    db.from('navigation_items').select('status').eq('property_id',s.propertyId).eq('location','header'),
  ]);
  const result:Record<string,WebsiteStatus>=Object.fromEntries(SITE_DOCUMENT_KEYS.map(key=>[key,documents ? 'Live' : 'Status unavailable']));
  for(const row of documents??[])result[row.document_key]=websiteStatus(row.status,Boolean(row.draft_data));
  result.homepage=draft.error||hero.error?'Status unavailable':websiteStatus(hero.data?.status,Boolean(draft.data));
  const menuStatuses=navigation.data?.map(item=>item.status)??[];
  result.navigation=navigation.error?'Status unavailable':websiteStatus(menuStatuses.includes('published')?'published':menuStatuses.includes('draft')?'draft':menuStatuses.includes('archived')?'archived':undefined,false);
  return result;
},async saveDocument(s:AdminSession,key:SiteDocument['key'],data:Record<string,string>,status:'draft'|'published'){assertCmsSession(s);const db=await createServerSupabaseClient();await savePrivateCmsDocument(db,s,key,data,status)},async navigation(s:AdminSession):Promise<NavigationItem[]>{const db=await createServerSupabaseClient(),{data,error}=await db.from('navigation_items').select('id,label,href,location,is_visible,sort_order,status').eq('property_id',s.propertyId).neq('status','archived').order('sort_order');if(error)throw error;return(data||[]).filter(x=>!/^\/about(?:[/?#]|$)/.test(x.href)).map(x=>({id:x.id,label:x.label,href:x.href,location:x.location,visible:x.is_visible,sortOrder:x.sort_order,status:x.status}))},async saveNavigation(s:AdminSession,items:NavigationItem[]){const db=await createServerSupabaseClient(),{error:a}=await db.from('navigation_items').update({status:'archived',is_visible:false,updated_by:s.userId}).eq('property_id',s.propertyId);if(a)throw a;if(items.length){const{error}=await db.from('navigation_items').upsert(items.map(x=>({property_id:s.propertyId,label:x.label,href:x.href,location:x.location,is_visible:x.visible,sort_order:x.sortOrder,status:'published',created_by:s.userId,updated_by:s.userId})),{onConflict:'property_id,location,href'});if(error)throw error}}};
