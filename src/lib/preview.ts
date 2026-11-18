import 'server-only';
import { draftMode } from 'next/headers';
import { adminSiteContentRepository } from '@/lib/repositories/admin/site-content';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAdminIdentity, getAdminSession } from '@/lib/admin/auth';

export type PreviewType = 'homepage'|'room'|'experience'|'transfer'|'article'|'about'|'contact'|'footer'|'rooms'|'gallery';

export async function authorizePreview(type:PreviewType,value:string|undefined){
  if(!value)return null;
  const mode=await draftMode();
  const session=await getAdminSession();
  if(!session)return null;
  // Existing authenticated CMS preview links remain valid while the central
  // gateway upgrades the session to Next.js draft mode.
  if(type==='homepage'||type==='about'||type==='contact'||type==='footer'||type==='rooms'||type==='gallery')return value===type?{session,id:value,draftMode:mode.isEnabled}:null;
  return value?{session,id:value,draftMode:mode.isEnabled}:null;
}

export function previewHref(type:PreviewType,id:string,returnTo:string){
  const query=new URLSearchParams({type,id,returnTo});
  return `/admin/preview?${query.toString()}`;
}

export async function getWebsiteDraft(key: 'rooms' | 'gallery' | 'contact', requested: string | undefined) {
  if (requested !== key) return null;
  const identity = await getAdminIdentity();
  if (identity?.permissions) {
    if (!identity.permissions.includes('website.draft')) return null;
    const db = await createServerSupabaseClient();
    const {data,error} = await db.rpc('team_workspace',{target_property:identity.propertyId,area:'website.draft',subject:key});
    if (error) return {saved:false,unavailable:true,data:undefined};
    const row = Array.isArray(data) ? data[0] : null;
    const field = key === 'rooms' ? 'introDescription' : key === 'contact' ? 'introduction' : 'description';
    return {saved:Boolean(row?.has_draft), data:typeof row?.draft_copy==='string'?{[field]:row.draft_copy}:undefined};
  }
  const preview = await authorizePreview(key, requested);
  if (!preview || !['owner', 'manager', 'editor'].includes(preview.session.role)) return null;
  try {
    const document = await adminSiteContentRepository.document(preview.session, key);
    const saved = document.publication === 'Draft only' || document.publication === 'Unpublished changes';
    return { saved, data: saved ? document.data : undefined };
  } catch {
    return { saved: false, unavailable: true, data: undefined };
  }
}
