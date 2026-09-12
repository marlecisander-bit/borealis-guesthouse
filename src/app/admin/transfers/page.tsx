import Image from 'next/image';
import Link from 'next/link';
import { ConfirmAction } from '@/components/admin/ConfirmAction';
import { AdminEmptyState, AdminPageHeader, StatusBadge } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin/auth';
import { adminTransfersRepository } from '@/lib/repositories/admin/transfers';
import { archiveTransfer, duplicateTransfer, restoreTransfer, unpublishTransfer } from './actions';

export default async function TransfersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await requireAdmin(['owner']);
  const { status = 'active' } = await searchParams;
  const items = await adminTransfersRepository.list(session).catch(() => []);
  const filtered = items.filter(item => status === 'archived' ? item.status === 'archived' : item.status !== 'archived');

  return <div className="space-y-8">
    <AdminPageHeader title="Transfers" description="Manage routes, guest capacity, prices and booking availability." actions={<Link href="/admin/transfers/new" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white">Add transfer</Link>}/>
    <form className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 min-[430px]:grid-cols-[minmax(0,1fr)_auto] min-[430px]:items-end"><label className="text-xs font-bold text-slate-600">Show<select name="status" defaultValue={status} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3"><option value="active">Current transfers</option><option value="archived">Archived transfers</option></select></label><button className="min-h-11 rounded-lg bg-slate-100 px-4 text-sm font-bold">Filter</button></form>
    {filtered.length ? <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">{filtered.map(item => <article key={item.id} className="grid gap-4 border-b border-slate-100 p-5 last:border-0 md:grid-cols-[5rem_1.4fr_.7fr_.7fr_auto] md:items-center">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">{item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="80px" className="object-cover"/>}</div>
      <div><Link href={`/admin/transfers/${item.id}`} className="font-bold hover:underline">{item.origin} → {item.destination}</Link><p className="mt-1 text-xs text-slate-500">{[item.featured && 'Featured on website', item.bookable && 'Available to book'].filter(Boolean).join(' · ')}</p></div>
      <p className="text-sm">{item.price === null ? 'Price on request' : `${item.currency} ${item.price} · ${item.pricingMethod === 'per_passenger' ? 'per passenger' : 'per vehicle'}`}</p><StatusBadge status={item.status}/>
      <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap"><Link href={`/admin/transfers/${item.id}`} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-3 text-xs font-bold">Edit</Link>{item.status === 'archived' ? <form action={restoreTransfer.bind(null, item.id)}><button className="min-h-11 w-full px-3 text-xs font-bold text-emerald-700">Restore</button></form> : <><form action={duplicateTransfer.bind(null, item.id)}><button className="min-h-11 w-full px-3 text-xs font-bold">Duplicate</button></form>{item.status === 'published' && <form action={unpublishTransfer.bind(null, item.id)}><button className="min-h-11 w-full px-3 text-xs font-bold">Unpublish</button></form>}<ConfirmAction action={archiveTransfer.bind(null, item.id)} label="Archive" confirmMessage={`Archive the route from ${item.origin} to ${item.destination}?`}/></>}</div>
    </article>)}</div> : <AdminEmptyState title="No transfers found" description="Add the first transfer or change the filter." action={<Link href="/admin/transfers/new" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white">Add transfer</Link>}/>}
  </div>;
}
