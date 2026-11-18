import { redirect } from 'next/navigation';
import { requireTeamMember } from '@/lib/admin/team-session';
import { teamWorkspaces } from '@/lib/admin/team-permissions';

export default async function Page() {
  const member=await requireTeamMember();
  const available=teamWorkspaces.filter(area=>member.permissions.includes(area.permission));
  const preferred:Record<string,string>={'Property Manager':'bookings','Availability Operator':'calendar','Bookings Viewer':'bookings','Website Editor':'website','Rooms Editor':'rooms'};
  const item=available.find(area=>area.key===preferred[member.preset || '']) || available[0];
  if(item)redirect('/admin/workspace/'+item.key);
  return <main className="mx-auto max-w-lg space-y-4 p-5">
    <h1 className="text-2xl font-bold">Your Borealis workspace</h1>
    <p>No workspaces are assigned to this account. Ask the property owner to review your access.</p>
  </main>;
}
