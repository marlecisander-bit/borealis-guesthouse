import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  let credentials: { email?: unknown; password?: unknown };

  try {
    credentials = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid login request.' }, { status: 400 });
  }

  const email = typeof credentials.email === 'string' ? credentials.email.trim() : '';
  const password = typeof credentials.password === 'string' ? credentials.password : '';

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return NextResponse.json(
      { error: 'The email or password is incorrect. Confirm that this user exists in Supabase Authentication.' },
      { status: 401 },
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from('admin_profiles')
    .select('id')
    .eq('user_id', data.user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (profileError || !profile) {
    await supabase.auth.signOut();

    if (profileError) {
      console.error('Admin profile lookup failed after login:', profileError.code);
      return NextResponse.json(
        { error: 'Your account signed in, but its administrator access could not be verified.' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: 'Your credentials are valid, but this account has not been granted Borealis administrator access.' },
      { status: 403 },
    );
  }

  return NextResponse.json({ ok: true });
}
