import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AdminPageHeader, AdminEmptyState } from '@/components/admin/ui';

export default async function Page() {
  const session=await requireAdmin(['owner','manager','staff']);
  const db=await createServerSupabaseClient();
  const {data,error}=await db.rpc('booking_review_queue',{target_property:session.propertyId});
  const requests=(data||[]) as {booking_id:string;reference:string;operation:string;created_at:string}[];
  return <div className="space-y-4">
    <Link href="/admin/bookings" className="inline-flex min-h-11 items-center text-sm font-bold text-brand">← Bookings</Link>
    <AdminPageHeader title="Guest booking requests" description="Review requested changes and cancellations before acting on the reservation."/>
    {error?<AdminEmptyState title="Could not load requests" description="Refresh to check the queue."/>:requests.length
      ? <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">{requests.map(item=><li key={item.booking_id}><Link href={`/admin/bookings/${item.booking_id}`} className="flex min-h-14 flex-wrap items-center justify-between gap-2 p-4 hover:bg-ivory">
        <strong>{item.reference}</strong><span className="text-sm">{item.operation==='request_cancel'?'Cancellation request':'Change request'}</span>
        <time className="text-xs" dateTime={item.created_at}>{new Date(item.created_at).toLocaleDateString('en-GB',{timeZone:'Europe/Tirane'})}</time>
      </Link></li>)}</ul>:<AdminEmptyState title="No requests awaiting review" description="Guest requests will appear here when submitted."/>}
  </div>;
}
