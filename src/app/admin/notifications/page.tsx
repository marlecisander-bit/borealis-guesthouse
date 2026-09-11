import Link from 'next/link';
import { AdminEmptyState, AdminPageHeader } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin/auth';
import { adminNotificationsRepository } from '@/lib/repositories/admin/notifications';
import { markAllNotificationsRead, markNotificationRead } from './actions';

const PAGE_SIZE = 25;

function relativeTime(value: string) {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (Math.abs(seconds) < 60) return formatter.format(seconds, 'second');
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour');
  return formatter.format(Math.round(hours / 24), 'day');
}

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await requireAdmin(['owner', 'manager', 'staff']);
  const requested = Number((await searchParams).page || 1);
  const page = Number.isInteger(requested) && requested > 0 ? requested : 1;
  const data = await adminNotificationsRepository.list(session, page, PAGE_SIZE);
  const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  return <div className="space-y-7">
    <AdminPageHeader title="Notifications" description="Booking activity for this property, with email delivery status." actions={
      data.items.some(item => !item.isRead) ? <form action={markAllNotificationsRead}><button className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#9ebfbc] bg-white px-4 text-sm font-bold text-[#164b59]">Mark all as read</button></form> : undefined
    } />
    {data.items.length ? <section className="overflow-hidden rounded-2xl border border-[#cfe0de] bg-white shadow-sm">
      <div className="divide-y divide-slate-100">{data.items.map(item => <article key={item.id} className={`grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center ${item.isRead ? 'bg-white' : 'bg-[#edf7f5]'}`}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-[#123c45]">{item.title}</h2>{!item.isRead && <span className="rounded-full bg-[#257d86] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-white">New</span>}</div>
          <p className="mt-1 text-sm text-slate-600">{item.message}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500"><time dateTime={item.createdAt}>{relativeTime(item.createdAt)}</time>{item.deliveryStatus && <span className="capitalize">Email: {item.deliveryStatus}</span>}</div>
        </div>
        <div className="flex flex-wrap gap-2">{item.bookingId && <Link href={`/admin/bookings/${item.bookingId}`} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#164b59] px-4 text-sm font-bold text-white">View booking</Link>}{!item.isRead && <form action={markNotificationRead.bind(null, item.id)}><button className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold">Mark read</button></form>}</div>
      </article>)}</div>
    </section> : <AdminEmptyState title="No notifications yet" description="New, cancelled and modified bookings will appear here." />}
    {pages > 1 && <nav aria-label="Notification pages" className="flex items-center justify-between text-sm"><Link aria-disabled={page <= 1} href={`/admin/notifications?page=${Math.max(1, page - 1)}`} className={`rounded-lg border px-4 py-2 ${page <= 1 ? 'pointer-events-none opacity-40' : ''}`}>Previous</Link><span>Page {page} of {pages}</span><Link aria-disabled={page >= pages} href={`/admin/notifications?page=${Math.min(pages, page + 1)}`} className={`rounded-lg border px-4 py-2 ${page >= pages ? 'pointer-events-none opacity-40' : ''}`}>Next</Link></nav>}
  </div>;
}

