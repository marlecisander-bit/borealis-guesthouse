import { requireAdmin } from '@/lib/admin/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AdminEmptyState, AdminPageHeader } from '@/components/admin/ui';
import { TeamDirectory, type TeamMember, type TeamRole } from '@/components/admin/TeamDirectory';

export const metadata = {title:'Team & Access | Borealis Admin'};

export default async function Page() {
  const session = await requireAdmin(['owner']);
  const db = await createServerSupabaseClient();
  const [{ data, error }, { data: roles, error: rolesError }] = await Promise.all([
    db.rpc('team_directory', { target_property: session.propertyId }),
    db.rpc('team_role_list', { target_property: session.propertyId }),
  ]);
  return <div className="max-w-4xl space-y-5">
    <AdminPageHeader title="Team & Access" description="Give each person their own login and access to the work they do."/>
    {error || rolesError || !Array.isArray(data) || !Array.isArray(roles) ? <AdminEmptyState title="Team directory unavailable" description="Check the Team & Access migration before using this workspace."/> :
      <TeamDirectory members={data as TeamMember[]} roles={roles as TeamRole[]}/>}
  </div>;
}
