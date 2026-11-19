import 'server-only';
import { redirect } from 'next/navigation';
import { getAdminIdentity } from './auth';

export async function requireCalendarAccess() {
  const session = await getAdminIdentity();
  if (!session) redirect('/admin/login?returnTo=%2Fadmin%2Favailability');
  const restricted = session.permissions !== null;
  if (restricted ? !session.permissions?.includes('availability.manage') : !['owner', 'manager', 'staff'].includes(session.role)) {
    redirect(restricted ? '/admin/workspace' : '/admin/dashboard?error=forbidden');
  }
  return { session, restricted };
}
