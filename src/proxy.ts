import { previewEnabled } from '@/lib/readonly-preview/policy';
import { previewServerResponse } from '@/lib/readonly-preview/server-request';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { adminReturnTo } from '@/lib/admin/return-to';
import { fetchSupabase } from '@/lib/supabase/fetch';

export async function proxy(request: NextRequest) {
  if (previewEnabled()) {
    return previewServerResponse(request);
  }
  // Preserve the historical production matcher behavior when preview is off.
  const path = request.nextUrl.pathname;
  if (path.startsWith('/api') || path.startsWith('/_next/static') || path.startsWith('/_next/image') || path.includes('.')) return NextResponse.next();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: fetchSupabase },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const requestedLanguage = request.nextUrl.searchParams.get('lang');
  if (requestedLanguage) {
    const { data: language } = await supabase.from('languages').select('code').eq('enabled', true).ilike('code', requestedLanguage).limit(1).maybeSingle();
    if (language?.code) {
      request.cookies.set('borealis_language', language.code);
      response = NextResponse.next({ request });
      response.cookies.set('borealis_language', language.code, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 });
    }
  }

  const isAdmin = path === '/admin' || path.startsWith('/admin/');
  if (!isAdmin) return response;

  const { data: { user } } = await supabase.auth.getUser();
  const isLogin = path === '/admin/login';
  const requested = adminReturnTo(path + request.nextUrl.search, '/admin/dashboard');
  function adminRedirect(url: URL) {
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
    redirect.headers.set('Cache-Control','private, no-store');
    return redirect;
  }

  if (!user && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = '';
    url.searchParams.set('returnTo', path === '/admin/mfa' ? adminReturnTo(request.nextUrl.searchParams.get('returnTo')) : requested);
    return adminRedirect(url);
  }

  if (user) {
    const { data: profile } = await supabase
      .from('admin_profiles')
      .select('id,role,team_permissions')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!profile && !isLogin) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.search = '';
      url.searchParams.set('error', 'not-authorized');
      return adminRedirect(url);
    }
    if (profile?.team_permissions && path !== '/admin/mfa' && !path.startsWith('/admin/workspace')) {
      const workspace = path.startsWith('/admin/bookings') ? '/bookings'
        : path.startsWith('/admin/availability') ? '/calendar'
        : path.startsWith('/admin/content') ? '/website'
        : path.startsWith('/admin/rooms') ? '/rooms'
        : path.startsWith('/admin/rates') ? '/rates' : '';
      return adminRedirect(new URL('/admin/workspace'+workspace, request.url));
    }
    if (profile && isLogin) {
      return adminRedirect(new URL(adminReturnTo(request.nextUrl.searchParams.get('returnTo')), request.url));
    }
  }

  return response;
}

export const config = { matcher: ['/:path*'] };
