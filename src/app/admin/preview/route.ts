import { draftMode } from 'next/headers';
import { NextRequest,NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { PreviewType } from '@/lib/preview';

const types:PreviewType[]=['homepage','room','experience','transfer','article','about','contact','footer'];
const allowedPrefixes=['/','/rooms/','/experiences/','/transfers','/explore-koman/','/about','/contact'];

export async function GET(request:NextRequest){
  await requireAdmin(['owner','manager','editor']);
  const type=request.nextUrl.searchParams.get('type') as PreviewType;
  const id=request.nextUrl.searchParams.get('id')||'';
  const returnTo=request.nextUrl.searchParams.get('returnTo')||'/';
  if(!types.includes(type)||!id||!returnTo.startsWith('/')||!allowedPrefixes.some(prefix=>returnTo===prefix||returnTo.startsWith(prefix)))return NextResponse.json({error:'Invalid preview request.'},{status:400});
  (await draftMode()).enable();
  const url=new URL(returnTo,request.url);url.searchParams.set('preview',id);
  return NextResponse.redirect(url);
}
