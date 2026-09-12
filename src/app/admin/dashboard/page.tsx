import Link from 'next/link';
import { AdminEmptyState, AdminPageHeader, StatusBadge } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin/auth';
import { getDashboardOverview, type TodayMetric } from '@/lib/repositories/admin/dashboard';
import { formatMoney } from '@/lib/pricing/format';

const quickActions = [
  ['New booking', '/admin/bookings/new'],
  ['Block dates', '/admin/availability#block-dates'],
  ['Change prices', '/admin/rates'],
  ['Edit website', '/admin/content'],
  ['Upload photos', '/admin/media'],
] as const;

export default async function DashboardPage() {
  const session = await requireAdmin();
  const data = await getDashboardOverview(session);
  return <div className="space-y-8">
    <AdminPageHeader title="Today at Borealis" description="Everything you need for today, without the technical details." actions={<Link href="/" target="_blank" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-center text-sm font-semibold text-slate-800">View website</Link>} />

    <section aria-labelledby="today-heading">
      <h2 id="today-heading" className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-500">Today</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <TodayCard title="Arrivals" metric={data.today.arrivals} />
        <TodayCard title="Departures" metric={data.today.departures} />
        <TodayCard title="Guests staying" metric={data.today.guestsStaying} />
      </div>
    </section>

    <section aria-labelledby="quick-actions-heading">
      <h2 id="quick-actions-heading" className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-500">Quick actions</h2>
      <div className="grid gap-3 min-[430px]:grid-cols-2 lg:grid-cols-5">{quickActions.map(([label, href]) => <Link data-admin-quick-action key={href} href={href} className="flex min-h-16 items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-sm"><span>{label}</span><span aria-hidden="true" className="text-lg text-slate-400">→</span></Link>)}</div>
    </section>

    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(19rem,.6fr)]">
      <section aria-labelledby="upcoming-heading" className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-5">
          <div><h2 id="upcoming-heading" className="text-xl font-bold text-slate-950">Upcoming bookings</h2><p className="mt-1 text-sm text-slate-500">The next five arrivals.</p></div>
          <Link href="/admin/bookings?period=upcoming" className="shrink-0 text-sm font-bold text-[#164b59] underline underline-offset-4">View all</Link>
        </div>
        {data.upcomingBookings.length ? <div className="divide-y divide-slate-100">{data.upcomingBookings.map((booking) => <Link href={`/admin/bookings/${booking.id}`} key={booking.id} className="grid gap-3 p-5 transition hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="text-slate-950">{booking.guestName}</strong><StatusBadge status={booking.status} /></div><p className="mt-1 truncate text-sm text-slate-600">{booking.booking}</p><p className="mt-1 text-xs text-slate-500">{formatDate(booking.checkIn)} → {formatDate(booking.checkOut)} · {booking.reference}</p></div><strong className="text-sm text-slate-900">{formatMoney(booking.total, booking.currency)}</strong></Link>)}</div> : <div className="p-5"><AdminEmptyState title="No upcoming bookings" description="Future bookings will appear here automatically." /></div>}
      </section>

      <section aria-labelledby="attention-heading" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 id="attention-heading" className="text-xl font-bold text-slate-950">Needs attention</h2>
        {data.attention.length ? <div className="mt-4 grid gap-3">{data.attention.map((item) => <Link key={item.label} href={item.href} className="flex min-h-16 items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4"><div><strong className="text-sm text-amber-950">{item.label}</strong><p className="mt-1 text-xs leading-5 text-amber-800">{item.detail}</p></div><span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-sm font-bold text-amber-900">{item.count}</span></Link>)}</div> : <div className="mt-4 rounded-xl bg-emerald-50 p-5"><p className="font-bold text-emerald-900">Everything looks good.</p><p className="mt-1 text-sm leading-6 text-emerald-800">There are no booking or notification issues requiring action.</p></div>}
      </section>
    </div>
  </div>;
}

function TodayCard({ title, metric }: { title: string; metric: TodayMetric }) {
  return <article data-admin-metric className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm font-semibold text-slate-600">{title}</p><p className="mt-3 text-4xl font-bold tracking-tight text-slate-950">{metric.value}</p><p className="mt-2 text-xs text-slate-500">{metric.note}</p></article>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' }).format(new Date(`${value}T00:00:00Z`));
}
