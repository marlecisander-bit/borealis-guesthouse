import { redirect } from 'next/navigation';
import { adminReturnTo } from '@/lib/admin/return-to';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { OwnerVerification } from '@/components/admin/OwnerVerification';

export default async function Page({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const returnTo = adminReturnTo((await searchParams).returnTo, '/admin/dashboard');
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const setupPath = '/admin/mfa?returnTo=' + encodeURIComponent(returnTo);
    redirect('/admin/login?returnTo=' + encodeURIComponent(setupPath));
  }

  // Use the base membership columns so the owner can enroll before the Team & Access migration.
  const { data: membership } = await supabase
    .from('admin_profiles')
    .select('role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (membership?.role !== 'owner') redirect('/admin/dashboard');

  return <OwnerVerification returnTo={returnTo} />;
}
