import { Pagination } from '@/components/admin/Pagination';
import Form from 'next/form';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import { adminBookingsRepository } from '@/lib/repositories/admin/bookings';
import { AdminEmptyState, AdminPageHeader, StatusBadge } from '@/components/admin/ui';
import { formatMoney } from '@/lib/pricing/format';

import { bookingDetailHref, bookingListHref, type BookingFilters } from '@/lib/admin/booking-views';
import { BookingFilterSheet } from '@/components/admin/BookingFilterSheet';

const periods=[['upcoming','Upcoming'],['in-house','In house'],['needs-action','Needs action'],['','All'],['current','Current'],['past','Past'],['cancelled','Cancelled'],['arrivals','Arrivals'],['departures','Departures']] as const;
const selectedPeriod=(value:string|undefined)=>periods.find(([key])=>key===(value||''))?.[1];

type BookingRow=Awaited<ReturnType<typeof adminBookingsRepository.list>>['rows'][number];
export default async function BookingsPage({searchParams}:{searchParams:Promise<BookingFilters>}){
  const session=await requireAdmin(['owner','manager','staff']),filters=await searchParams;
  const result=await Promise.all([adminBookingsRepository.list(session,{page:Number(filters.page)||1,query:filters.q,status:filters.status,period:filters.period,roomTypeId:filters.room,from:filters.from,to:filters.to,date:filters.date,payment:filters.payment}),adminBookingsRepository.rooms(session)]).catch(()=>null);
  const header=<AdminPageHeader title="Bookings" actions={<Link prefetch={false} href="/admin/bookings/new" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-4 text-sm font-bold text-white">New booking</Link>}/>;
  if(!result)return <div className="space-y-4">{header}<AdminEmptyState title="Bookings unavailable" description="The booking list could not be loaded." action={<a href={bookingListHref(filters)} className="font-semibold underline">Reload bookings</a>}/></div>;
  const [data,rooms]=result;
  const bookings=data.rows;
  const activeFilters=[filters.status?.replaceAll('_',' '),rooms.find(room=>room.id===filters.room)?.name||filters.room,filters.from&&'From '+filters.from,filters.to&&'To '+filters.to,filters.date,filters.payment==='failed'&&'Failed payment'].filter(Boolean);
  const viewHref=(period:string)=>bookingListHref({...filters,period,date:undefined,page:undefined});
  return <div className="space-y-4 sm:space-y-5">{header}
    <div className="flex flex-wrap gap-2">
      <Form action="/admin/bookings" className="flex min-w-0 flex-1 gap-2">
        {Object.entries(filters).filter(([key,value])=>key!=='q'&&key!=='page'&&typeof value==='string').map(([key,value])=><input key={key} type="hidden" name={key} value={value}/>)}
        <input name="q" type="search" key={filters.q} defaultValue={filters.q} placeholder="Guest or reference" aria-label="Search bookings" className="admin-panel-input flex-1"/>
        <button className="min-h-11 rounded-lg bg-brand px-3 text-sm font-bold text-white">Search</button>
      </Form>
      <BookingFilterSheet key={bookingListHref(filters)} filters={filters} rooms={rooms}/>
    </div>
    <nav aria-label="Booking views" className="flex flex-wrap gap-2">
      {periods.slice(0,3).map(([value,label])=><Link prefetch={false} key={value} href={viewHref(value)} aria-current={filters.period===value?'page':undefined} className={`inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-bold ${filters.period===value?'bg-brand text-white':'border border-stone-300 bg-white text-brand'}`}>{label}</Link>)}
      <details className="relative"><summary className="flex min-h-11 cursor-pointer items-center rounded-lg border border-stone-300 bg-white px-3 text-sm font-semibold text-brand">{periods.slice(3).some(([period])=>period===(filters.period||''))?selectedPeriod(filters.period):'All views'} ▾</summary>
        <div className="absolute right-0 z-20 mt-1 min-w-36 rounded-lg border border-stone-200 bg-white p-1 shadow-lg">{periods.slice(3).map(([value,label])=><Link prefetch={false} key={value} href={viewHref(value)} aria-current={(filters.period||'')===value?'page':undefined} className="admin-tab flex min-h-11 items-center rounded-md px-3 text-sm font-semibold">{label}</Link>)}</div>
      </details>
    </nav>
    {!!activeFilters.length&&<div aria-label="Active booking filters" className="flex flex-wrap gap-2">{activeFilters.map((label,index)=><span key={index} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">{label}</span>)}<Link prefetch={false} href={bookingListHref({q:filters.q,period:filters.period})} className="px-2 py-1 text-xs font-bold text-brand underline">Clear filters</Link></div>}
    {bookings.length?<div className="admin-record-list admin-responsive-bookings"><MobileBookings bookings={bookings} filters={filters}/><div className="admin-record-wide rounded-2xl border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th scope="col" className="px-2 py-3">Reference</th><th scope="col" className="px-2 py-3">Guest</th><th scope="col" className="px-2 py-3">Type</th><th scope="col" className="px-2 py-3">Booking content</th><th scope="col" className="px-2 py-3">Date / time</th><th scope="col" className="px-2 py-3">Quantity</th><th scope="col" className="px-2 py-3">Total</th><th scope="col" className="px-2 py-3">Status</th><th scope="col" className="px-2 py-3">Source</th><th scope="col" className="px-2 py-3">Actions</th></tr></thead><tbody>{bookings.map(booking=><tr key={booking.id} className="border-t border-slate-100"><td className="px-2 py-3 font-bold">{booking.reference}</td><td className="px-2 py-3">{booking.guestName}<span className="block text-xs text-slate-500">{booking.email}</span></td><td className="px-2 py-3 font-semibold">{booking.bookingType}</td><td className="px-2 py-3">{booking.room}</td><td className="px-2 py-3">{booking.checkIn&&booking.checkOut?`${booking.checkIn} → ${booking.checkOut}`:<>{booking.serviceDate||'Not scheduled'}{booking.serviceTime&&<span className="block text-xs text-slate-500">{booking.serviceTime}</span>}</>}</td><td className="px-2 py-3">{booking.quantity||booking.adults+booking.children}</td><td className="px-2 py-3 font-semibold">{formatMoney(booking.total,booking.currency)}</td><td className="px-2 py-3"><StatusBadge status={booking.status}/></td><td className="px-2 py-3 capitalize">{booking.source}</td><td className="px-2 py-3"><Link prefetch={false} href={bookingDetailHref(booking.id,filters)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-300 px-2 text-xs font-bold">Open</Link></td></tr>)}</tbody></table></div></div>:<AdminEmptyState title="No matching bookings" description="New website reservations and manual bookings will appear here." action={<Link prefetch={false} href="/admin/bookings/new" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-4 text-sm font-bold text-white">Add booking</Link>}/>}<Pagination page={data.page} pageSize={data.pageSize} hasNext={data.hasNext} pathname="/admin/bookings" filters={filters}/></div>;
}

function MobileBookings({bookings,filters}:{bookings:BookingRow[];filters:BookingFilters}) {
  return <section aria-label="Bookings" className="admin-record-cards grid gap-3">{bookings.map(booking=><article key={booking.id} className="rounded-xl border border-stone-200 bg-white p-4">
    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1"><h2 className="font-bold text-lake">{booking.guestName}</h2><StatusBadge status={booking.status}/></div>
    <p className="mt-2 text-sm font-semibold text-slate-800">{booking.checkIn&&booking.checkOut?`${booking.checkIn} → ${booking.checkOut}`:`${booking.serviceDate||'Not scheduled'}${booking.serviceTime?` · ${booking.serviceTime}`:''}`}</p>
    <p className="text-sm text-slate-600">{booking.room}</p>
    <details className="mt-2">
      <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-lake">Booking details</summary>
      <dl className="grid grid-cols-2 gap-3 pb-2 text-sm">
        <div><dt className="font-semibold">Reference</dt><dd className="break-words">{booking.reference}</dd></div>
        <div><dt className="font-semibold">Type</dt><dd>{booking.bookingType}</dd></div>
        {booking.email && <div className="col-span-2"><dt className="font-semibold">Email</dt><dd className="break-all">{booking.email}</dd></div>}
        <div><dt className="font-semibold">Quantity</dt><dd>{booking.quantity || booking.adults + booking.children}</dd></div>
        <div><dt className="font-semibold">Total</dt><dd>{formatMoney(booking.total, booking.currency)}</dd></div>
        <div><dt className="font-semibold">Source</dt><dd className="capitalize">{booking.source}</dd></div>
      </dl>
    </details>
    <Link prefetch={false} href={bookingDetailHref(booking.id,filters)} className="mt-3 inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-3 text-sm font-bold text-brand">View booking</Link>
  </article>)}</section>;
}
