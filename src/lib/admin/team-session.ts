import 'server-only';
import { redirect } from 'next/navigation';
import { getAdminIdentity } from './auth';
import type { TeamPermission } from './team-permissions';

export async function requireTeamMember(permission?: TeamPermission) {
  const identity = await getAdminIdentity();
  if (!identity) redirect('/admin/login');
  if (!identity.permissions) redirect('/admin/dashboard');
  if (permission && !identity.permissions.includes(permission)) redirect('/admin/workspace');
  return {...identity,permissions:identity.permissions};
}
