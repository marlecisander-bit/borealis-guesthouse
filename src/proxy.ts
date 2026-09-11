import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { fetchSupabase } from '@/lib/supabase/fetch';

export async function proxy(request: NextRequest) {
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

  const isAdmin = request.nextUrl.pathname.startsWith('/admin');
  if (!isAdmin) return response;

  const { data: { user } } = await supabase.auth.getUser();
  const isLogin = request.nextUrl.pathname === '/admin/login';

  if (!user && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = '';
    url.searchParams.set('returnTo', `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profile } = await supabase
      .from('admin_profiles')
      .select('id')
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
      return NextResponse.redirect(url);
    }
    if (profile && isLogin) {
      const returnTo = request.nextUrl.searchParams.get('returnTo');
      const destination = returnTo?.startsWith('/admin') && !returnTo.startsWith('//') ? returnTo : '/admin/dashboard';
      return NextResponse.redirect(new URL(destination, request.url));
    }
  }

  return response;
}

export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'] };
