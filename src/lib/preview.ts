import 'server-only';
import { draftMode } from 'next/headers';
import { getAdminSession } from '@/lib/admin/auth';

export type PreviewType = 'homepage'|'room'|'experience'|'transfer'|'article'|'about'|'contact'|'footer';

export async function authorizePreview(type:PreviewType,value:string|undefined){
  if(!value)return null;
  const mode=await draftMode();
  const session=await getAdminSession();
  if(!session)return null;
  // Existing authenticated CMS preview links remain valid while the central
  // gateway upgrades the session to Next.js draft mode.
  if(type==='homepage'||type==='about'||type==='contact'||type==='footer')return value===type?{session,id:value,draftMode:mode.isEnabled}:null;
  return value?{session,id:value,draftMode:mode.isEnabled}:null;
}

export function previewHref(type:PreviewType,id:string,returnTo:string){
  const query=new URLSearchParams({type,id,returnTo});
  return `/admin/preview?${query.toString()}`;
}
