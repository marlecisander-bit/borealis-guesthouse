import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export type AdminRole = 'owner' | 'manager' | 'editor' | 'staff';

export interface AdminSession {
  userId: string;
  email: string;
  role: AdminRole;
  propertyId: string;
}

export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const { data: profile } = await supabase
    .from('admin_profiles')
    .select('role,property_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();
  const { data: legacyAdmin } = profile
    ? { data: null }
    : await supabase
        .from('admin_users')
        .select('role,property_id')
        .ilike('email', user.email)
        .maybeSingle();
  const admin = profile || legacyAdmin;
  if (!admin?.property_id) return null;

  return {
    userId: user.id,
    email: user.email,
    role: (admin.role || 'staff') as AdminRole,
    propertyId: admin.property_id,
  };
});

export async function requireAdmin(roles?: AdminRole[]): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  if (roles && !roles.includes(session.role)) redirect('/admin/dashboard?error=forbidden');
  return session;
}
