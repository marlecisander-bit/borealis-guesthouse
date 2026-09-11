import { draftMode } from 'next/headers';
import { NextRequest,NextResponse } from 'next/server';
export async function GET(request:NextRequest){(await draftMode()).disable();const target=request.nextUrl.searchParams.get('returnTo')||'/admin';return NextResponse.redirect(new URL(target.startsWith('/admin')?target:'/admin',request.url))}
