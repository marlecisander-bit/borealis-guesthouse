import Link from 'next/link';
import { AdminEmptyState, AdminPageHeader, StatusBadge } from '@/components/admin/ui';
import { bookingDetailHref } from '@/lib/admin/booking-views';
import { requireAdmin } from '@/lib/admin/auth';
import { getDashboardOverview, type TodayMetric } from '@/lib/repositories/admin/dashboard';

const quickActions = [['New booking','/admin/bookings/new'],['Block dates','/admin/availability#block-dates']] as const;

export default async function DashboardPage() {
  const session=await requireAdmin();
  const data=await getDashboardOverview(session).catch(()=>null);
  if(!data) return <><AdminPageHeader title="Today"/><AdminEmptyState title="Could not load Today" description="Reload the dashboard to check bookings and alerts." action={<a href="/admin/dashboard" className="font-semibold underline">Reload Today</a>}/></>;

  return <div className="space-y-5 sm:space-y-6">
    <AdminPageHeader title="Today at Borealis" description={formatDate(data.date,true)}/>
    <section aria-label="Today's stays" className="admin-today-metrics grid grid-cols-3 gap-2 sm:gap-4">
      <TodayCard title="Arrivals" metric={data.today.arrivals}/>
      <TodayCard title="Departures" metric={data.today.departures}/>
      <TodayCard title="Guests staying" metric={data.today.guestsStaying}/>
    </section>
    <section aria-labelledby="attention-heading" className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
      <h2 id="attention-heading" className="text-lg font-bold text-lake">Needs attention</h2>
      {data.attentionUnavailable&&<p className="mt-2 text-sm text-amber-900" role="status">Some alerts could not be loaded. <a href="/admin/dashboard" className="underline">Reload Today</a></p>}
      {data.attention.length>0?<div className="mt-3 grid gap-2">{data.attention.map(item=><Link key={item.href} href={item.href} className="admin-attention-item flex min-h-14 items-center justify-between gap-3 rounded-xl bg-amber-50 px-3 py-2 text-amber-950">
        <span><strong className="block text-sm">{item.label}</strong><span className="block text-xs">{item.detail}</span></span>
        <strong className="rounded-full bg-white px-3 py-1 text-sm">{item.count}</strong>
      </Link>)}</div>:!data.attentionUnavailable&&<p className="mt-2 text-sm text-slate-600">No open booking or notification issues.</p>}
    </section>
    <Link href="/admin/bookings/requests" className="inline-flex min-h-11 items-center text-sm font-bold text-brand underline">Review guest booking requests</Link>
    <section aria-label="Quick actions" className="grid grid-cols-2 gap-2 sm:gap-4">
      {quickActions.map(([label,href],index)=><Link key={href} href={href} className={`flex min-h-12 items-center justify-center rounded-xl px-3 text-center text-sm font-bold ${index?'border border-stone-300 bg-white text-brand':'bg-brand text-white'}`}>{label}</Link>)}
    </section>
    <section aria-labelledby="upcoming-heading" className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-x-3 border-b border-stone-200 px-4 py-2"><h2 id="upcoming-heading" className="text-lg font-bold text-lake">Next arrivals</h2><Link href="/admin/bookings?period=upcoming" className="inline-flex min-h-11 shrink-0 items-center text-sm font-bold text-brand underline">View all</Link></div>
      {data.arrivalsUnavailable?<p role="status" className="p-4 text-sm text-amber-900">Next arrivals could not be loaded.</p>:data.upcomingBookings.length?<div className="divide-y divide-stone-100">{data.upcomingBookings.map(booking=><Link href={bookingDetailHref(booking.id,{period:'upcoming'})} key={booking.id} className="flex min-h-16 flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3 hover:bg-ivory">
        <div><strong className="block text-lake">{booking.guestName}</strong><span className="block text-sm text-slate-600">{formatDate(booking.checkIn)} · {booking.booking}</span></div><StatusBadge status={booking.status}/>
      </Link>)}</div>:<p className="p-4 text-sm text-slate-600">No upcoming arrivals.</p>}
    </section>
  </div>;
}
function TodayCard({title,metric}:{title:string;metric:TodayMetric}) {
  return <Link data-admin-metric href={metric.href} className="flex min-h-24 min-w-0 flex-col justify-between gap-2 rounded-xl border border-stone-200 bg-white p-2.5 hover:bg-ivory sm:p-4">
    <span className="text-xs font-semibold text-slate-700 sm:text-sm">{title}</span>
    {metric.value===null?<span className="text-xs font-semibold text-amber-900">Unavailable</span>:<strong className="text-2xl text-lake sm:text-3xl">{metric.value}</strong>}
  </Link>;
}
function formatDate(value:string,full=false) {
  return new Intl.DateTimeFormat('en',{timeZone:'UTC',day:'numeric',month:full?'long':'short',weekday:full?'long':undefined,year:full?'numeric':undefined}).format(new Date(value+'T12:00:00Z'));
}
