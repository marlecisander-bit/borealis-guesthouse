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

const adminRoles: AdminRole[] = ['owner', 'manager', 'editor', 'staff'];

export const getCurrentAdmin = cache(async (): Promise<AdminSession | null> => {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const { data: profile, error } = await supabase
    .from('admin_profiles')
    .select('role,property_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error || !profile?.property_id || !adminRoles.includes(profile.role as AdminRole)) return null;

  return {
    userId: user.id,
    email: user.email,
    role: profile.role as AdminRole,
    propertyId: profile.property_id,
  };
});

// Compatibility name used by preview and existing server components.
export const getAdminSession = getCurrentAdmin;

export async function requireAdmin(roles?: AdminRole[]): Promise<AdminSession> {
  const session = await getCurrentAdmin();
  if (!session) redirect('/admin/login?error=not-authorized');
  if (roles && !roles.includes(session.role)) redirect('/admin/dashboard?error=forbidden');
  return session;
}

export async function requireRole(...roles: AdminRole[]): Promise<AdminSession> {
  return requireAdmin(roles);
}
