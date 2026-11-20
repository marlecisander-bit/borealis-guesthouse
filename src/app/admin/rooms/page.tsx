import { AdminStatusFilter } from '@/components/admin/AdminStatusFilter';
import Image from 'next/image';
import Link from 'next/link';
import { archiveRoomType,duplicateRoomType,restoreRoomType } from '@/app/admin/rooms/actions';
import { ConfirmAction } from '@/components/admin/ConfirmAction';
import { AdminEmptyState,AdminPageHeader,StatusBadge } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin/auth';
import { formatRoomRate } from '@/lib/pricing/format';
import { adminRoomsRepository } from '@/lib/repositories/admin/rooms';
import type { AdminRoomType } from '@/types/rooms-admin';


export default async function RoomsPage({searchParams}:{searchParams:Promise<{status?:string}>}){
  const session=await requireAdmin();
  const params=await searchParams;
  const rooms=await adminRoomsRepository.listRoomTypes(session).catch(()=>[]);
  const status=params.status||'active';
  const filtered=rooms.filter(room=>status==='archived'?room.status==='archived':room.status!=='archived');

  return <div className="space-y-8">
    <AdminPageHeader title="Rooms" description="Manage room details, photos and guest limits, with shortcuts to pricing and availability." actions={<Link prefetch={false} href="/admin/rooms/new" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-5 text-center text-sm font-semibold text-white">Add room</Link>}/>
    <AdminStatusFilter status={status}/>
    {filtered.length?<RoomList rooms={filtered} canOpenCalendar={session.role!=='editor'} canEditRates={session.role==='owner'||session.role==='manager'}/>:<AdminEmptyState title="No rooms match this filter" description={status==='archived'?'There are no archived rooms.':'Add your first room or view archived rooms.'} action={status==='active'?<Link prefetch={false} href="/admin/rooms/new" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white">Add Room</Link>:undefined}/>}
  </div>;
}

function RoomList({rooms,canEditRates,canOpenCalendar}:{rooms:AdminRoomType[];canEditRates:boolean;canOpenCalendar:boolean}){
  return <div className="admin-record-list admin-record-rooms rounded-2xl border border-slate-200 bg-white">
    <div className="admin-record-head border-b border-slate-200 py-3 text-xs font-bold uppercase tracking-wider text-slate-500"><span>Room</span><span>Capacity</span><span>Price</span><span>Status</span><span>Actions</span></div>
    {rooms.map(room=><article key={room.id} className="admin-record-row border-b border-slate-100 last:border-0">
      <div className="admin-record-title"><div className="admin-record-title-image relative h-12 w-16 overflow-hidden rounded-lg bg-slate-100">{room.images[0]?<Image src={room.images.find(item=>item.isFeatured)?.publicUrl||room.images[0].publicUrl} alt="" fill sizes="64px" className="object-cover"/>:<span className="absolute inset-0 grid place-items-center text-xs text-slate-400">No image</span>}</div>
      <div><Link prefetch={false} href={`/admin/rooms/${room.id}`} className="font-bold text-slate-950 hover:underline">{room.name}</Link>{room.featured&&<p className="mt-1 text-xs text-slate-500">Featured on the website</p>}</div></div>
      <div><span className="admin-record-label block text-xs font-semibold text-slate-500">Capacity</span><p className="text-sm text-slate-700">Up to {room.capacity} {room.capacity===1?'guest':'guests'}</p><p className="mt-1 text-xs text-slate-500">{room.inventoryCount} {room.inventoryCount===1?'unit':'units'}</p></div>
      <p className="text-sm font-semibold text-slate-900"><span className="admin-record-label block text-xs text-slate-500">Price</span>{formatRoomRate(room.basePrice,room.currency)}{room.basePrice!==null&&!room.rateActive&&<span className="block text-xs font-normal text-slate-500">Inactive</span>}</p>
      <div><StatusBadge status={room.status}/></div>
      <div className="admin-record-actions"><Link prefetch={false} href={`/admin/rooms/${room.id}`} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-3 text-center text-xs font-bold leading-none">Edit</Link>{room.status!=='archived'&&<>{canEditRates && <Link prefetch={false} href={`/admin/rates#base-rate-${room.id}`} className="min-h-11 rounded-lg border border-slate-300 px-3 text-xs font-bold">Edit rate</Link>}{canOpenCalendar && <Link prefetch={false} href={`/admin/availability?view=type&room=${encodeURIComponent('type:' + room.id)}`} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-3 text-center text-xs font-bold leading-none">Availability</Link>}</>}{room.status==='archived'?<form action={restoreRoomType.bind(null,room.id)}><button className="inline-flex min-h-11 w-full items-center justify-center rounded-lg px-3 text-center text-xs font-bold leading-none text-emerald-700">Restore</button></form>:<details className="relative"><summary className="inline-flex min-h-11 w-full cursor-pointer list-none items-center justify-center rounded-lg border border-slate-300 px-3 text-xs font-bold">More</summary><div className="admin-record-menu mt-2 grid gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"><form action={duplicateRoomType.bind(null,room.id)}><button className="min-h-11 w-full rounded-lg px-3 text-center text-xs font-bold hover:bg-slate-50">Duplicate</button></form><ConfirmAction action={archiveRoomType.bind(null,room.id)} label="Archive" confirmMessage={`Archive ${room.name}? It will be removed from the website and booking availability.`}/></div></details>}</div>
    </article>)}
  </div>;
}
