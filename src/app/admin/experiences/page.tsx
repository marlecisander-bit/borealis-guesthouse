import Image from 'next/image';
import Link from 'next/link';
import { ConfirmAction } from '@/components/admin/ConfirmAction';
import { AdminEmptyState, AdminPageHeader, StatusBadge } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin/auth';
import { adminExperiencesRepository } from '@/lib/repositories/admin/experiences';
import { archiveExperience, duplicateExperience, restoreExperience, unpublishExperience } from './actions';

export default async function ExperiencesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await requireAdmin();
  const { status = 'active' } = await searchParams;
  const items = await adminExperiencesRepository.list(session).catch(() => []);
  const filtered = items.filter(item => status === 'archived' ? item.status === 'archived' : item.status !== 'archived');

  return <div className="space-y-8">
    <AdminPageHeader title="Experiences" description="Manage activities guests can discover and book." actions={<Link href="/admin/experiences/new" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white">Add experience</Link>}/>
    <form className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 min-[430px]:grid-cols-[minmax(0,1fr)_auto] min-[430px]:items-end"><label className="text-xs font-bold text-slate-600">Show<select name="status" defaultValue={status} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3"><option value="active">Current experiences</option><option value="archived">Archived experiences</option></select></label><button className="min-h-11 rounded-lg bg-slate-100 px-4 text-sm font-bold">Filter</button></form>
    {filtered.length ? <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">{filtered.map(item => <article key={item.id} className="grid gap-4 border-b border-slate-100 p-5 last:border-0 md:grid-cols-[5rem_1.4fr_.7fr_.7fr_auto] md:items-center">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">{item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="80px" className="object-cover"/>}</div>
      <div><Link href={`/admin/experiences/${item.id}`} className="font-bold hover:underline">{item.name}</Link>{item.featured && <p className="mt-1 text-xs font-semibold text-emerald-700">Featured on website</p>}</div>
      <p className="text-sm">{item.price === null ? 'Price on request' : `${item.currency} ${item.price}`}</p><StatusBadge status={item.status}/>
      <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap"><Link href={`/admin/experiences/${item.id}`} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-3 text-xs font-bold">Edit</Link>{item.status === 'archived' ? <form action={restoreExperience.bind(null, item.id)}><button className="min-h-11 w-full px-3 text-xs font-bold text-emerald-700">Restore</button></form> : <><form action={duplicateExperience.bind(null, item.id)}><button className="min-h-11 w-full px-3 text-xs font-bold">Duplicate</button></form>{item.status === 'published' && <form action={unpublishExperience.bind(null, item.id)}><button className="min-h-11 w-full px-3 text-xs font-bold">Unpublish</button></form>}<ConfirmAction action={archiveExperience.bind(null, item.id)} label="Archive" confirmMessage={`Archive ${item.name}?`}/></>}</div>
    </article>)}</div> : <AdminEmptyState title="No experiences found" description="Add the first experience or change the filter."/>}
  </div>;
}
