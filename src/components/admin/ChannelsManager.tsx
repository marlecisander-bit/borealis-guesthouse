import Link from 'next/link';
import { AdminEmptyState,AdminPageHeader,StatusBadge } from '@/components/admin/ui';
import { CopyCalendarUrl } from './CopyCalendarUrl';
import { ExternalCalendarForm } from './ExternalCalendarForm';
import { requireAdmin } from '@/lib/admin/auth';
import { adminChannelsRepository } from '@/lib/repositories/admin/channels';
import { setExternalCalendarEnabled,syncExternalCalendarNow } from '@/app/admin/channels/actions';
import type { CalendarProvider,ExternalCalendarAdmin } from '@/types/channels-admin';

const providerName=(provider:CalendarProvider)=>provider==='booking_com'?'Booking.com':provider==='airbnb'?'Airbnb':'Other';
const formatDate=(value:string|null)=>value?new Intl.DateTimeFormat('en',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)):'Not synchronized yet';

export async function ChannelsManager({provider}:{provider?:CalendarProvider}){
  const session=await requireAdmin(['owner']);let calendars,targets;
  try{[calendars,targets]=await Promise.all([adminChannelsRepository.list(session,provider),adminChannelsRepository.targets(session)]);}
  catch{return <div className="space-y-6"><AdminPageHeader title="Channel calendars" description="Connect external availability through secure iCal feeds."/><AdminEmptyState title="Calendar database update required" description="Run database/migrations/20260904_023_ical_channel_sync.sql in Supabase, then reload this page."/></div>}
  return <div className="space-y-8">
    <AdminPageHeader title={provider==='booking_com'?'Booking.com calendars':'Channel calendars'} description="Import external reservations into Borealis availability and export privacy-safe blocking calendars." actions={provider?<Link href="/admin/channels" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold">All channels</Link>:<Link href="/admin/channels/booking-com" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#9ebfbc] bg-white px-4 text-sm font-semibold text-[#164b59]">Booking.com setup</Link>}/>
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5"><h2 className="text-xl font-bold">Connected calendars</h2><p className="mt-1 text-sm text-slate-500">External events appear automatically in Availability as synchronized blocks.</p></div>
        {calendars.length?<div className="divide-y divide-slate-100">{calendars.map(calendar=><CalendarCard key={calendar.id} calendar={calendar} rooms={targets.rooms} roomTypes={targets.roomTypes} fixedProvider={provider}/>)}</div>:<div className="p-5"><AdminEmptyState title="No channel calendars" description="Add an iCal connection to begin synchronizing external availability."/></div>}
      </section>
      <aside className="rounded-2xl border border-[#c7dddb] bg-[#f8fbfa] p-5 shadow-sm xl:sticky xl:top-6"><h2 className="text-xl font-bold">Add calendar</h2><p className="mb-5 mt-1 text-sm leading-6 text-slate-600">Use the private iCal URL supplied by the channel. For best precision, connect one feed to one physical room.</p><ExternalCalendarForm rooms={targets.rooms} roomTypes={targets.roomTypes} fixedProvider={provider}/></aside>
    </div>
    <section className="rounded-2xl border border-[#c8dddb] bg-[#e8f4f5] p-5 text-sm text-[#285c66]"><h2 className="font-bold">Periodic synchronization</h2><p className="mt-1 leading-6">Manual sync is ready now. Automated sync calls the protected server endpoint with a schedule; no administrator browser needs to remain open.</p></section>
  </div>
}

function CalendarCard({calendar,rooms,roomTypes,fixedProvider}:{calendar:ExternalCalendarAdmin;rooms:{id:string;name:string}[];roomTypes:{id:string;name:string}[];fixedProvider?:CalendarProvider}){
  return <article className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-950">{calendar.name}</h3><StatusBadge status={calendar.enabled?'published':'archived'}/><StatusBadge status={calendar.lastSyncStatus}/></div><p className="mt-2 text-sm text-slate-600">{providerName(calendar.provider)} · {calendar.targetName} · {calendar.direction}</p><p className="mt-1 text-xs text-slate-500">Import source: {calendar.importHost} · {calendar.activeEventCount} active events</p><p className="mt-1 text-xs text-slate-500">Last sync: {formatDate(calendar.lastSyncedAt)}</p>{calendar.lastSyncError&&<p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{calendar.lastSyncError}</p>}</div><div className="flex flex-wrap gap-2">{calendar.direction!=='import'&&<CopyCalendarUrl url={calendar.exportUrl}/>} {calendar.direction!=='export'&&calendar.enabled&&<form action={syncExternalCalendarNow.bind(null,calendar.id)}><button className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#164b59] px-3 text-center text-sm font-bold text-white">Sync now</button></form>}<form action={setExternalCalendarEnabled.bind(null,calendar.id,!calendar.enabled)}><button className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-center text-sm font-semibold">{calendar.enabled?'Disable':'Enable'}</button></form></div></div><details className="mt-4 rounded-xl border border-slate-200 bg-slate-50"><summary className="flex min-h-11 cursor-pointer items-center px-4 text-sm font-bold text-[#164b59]">Edit connection</summary><div className="border-t border-slate-200 p-4"><ExternalCalendarForm calendar={calendar} rooms={rooms} roomTypes={roomTypes} fixedProvider={fixedProvider}/></div></details></article>
}
