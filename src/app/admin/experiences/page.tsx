import { AddServiceMenu } from '@/components/admin/AddServiceMenu';
import { AdminStatusFilter } from '@/components/admin/AdminStatusFilter';
import { Pagination } from '@/components/admin/Pagination';
import { ExperienceRows } from '@/components/admin/ExperienceRows';
import { AdminEmptyState, AdminPageHeader } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin/auth';
import { adminExperiencesRepository } from '@/lib/repositories/admin/experiences';

export default async function ExperiencesPage({ searchParams }: {
  searchParams: Promise<{ status?: string; page?: string; type?: string }>;
}) {
  const session = await requireAdmin();
  const { status = 'active', page = '1', type: requestedType } = await searchParams;
  const type = requestedType === 'rental' ? 'rental' : requestedType === 'all' ? 'all' : 'experience';
  const title = type === 'rental' ? 'Rentals' : type === 'experience' ? 'Experiences' : 'Experiences and rentals';
  const canAdd = session.role !== 'staff';
  const data = await adminExperiencesRepository.summaries(session, Number(page), status, type);

  return <div className="space-y-5">
    <AdminPageHeader title={title} actions={canAdd && <AddServiceMenu canAddTransfer={session.role === 'owner'}/>}/>
    <AdminStatusFilter status={status} kind="publication" type={type}/>
    {data.items.length ? <ExperienceRows items={data.items}/> : <AdminEmptyState title="No services found" description="Change the filter to see other services."/>}
    <Pagination page={data.page} pageSize={data.pageSize} total={data.total} pathname="/admin/experiences" filters={{ status, type }}/>
  </div>;
}
