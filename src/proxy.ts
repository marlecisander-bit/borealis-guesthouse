import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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

  const { data: { user } } = await supabase.auth.getUser();
  const isLogin = request.nextUrl.pathname === '/admin/login';

  if (!user && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('returnTo', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (user?.email) {
    const { data: profile } = await supabase
      .from('admin_profiles')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();
    const { data: legacyAdmin } = profile
      ? { data: null }
      : await supabase.from('admin_users').select('id').ilike('email', user.email).maybeSingle();
    const admin = profile || legacyAdmin;
    if (!admin && !isLogin) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('error', 'not-authorized');
      return NextResponse.redirect(url);
    }
    if (admin && isLogin) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/dashboard';
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = { matcher: ['/admin/:path*'] };
