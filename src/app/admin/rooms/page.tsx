import Image from 'next/image';
import Link from 'next/link';
import { archiveRoomType,duplicateRoomType,restoreRoomType } from '@/app/admin/rooms/actions';
import { ConfirmAction } from '@/components/admin/ConfirmAction';
import { AdminEmptyState,AdminPageHeader,StatusBadge } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin/auth';
import { formatRoomRate } from '@/lib/pricing/format';
import { adminRoomsRepository } from '@/lib/repositories/admin/rooms';
import type { AdminRoomType } from '@/types/rooms-admin';
import { QuickRoomRateForm } from '@/components/admin/QuickRoomRateForm';

export default async function RoomsPage({searchParams}:{searchParams:Promise<{status?:string}>}){
  const session=await requireAdmin();
  const params=await searchParams;
  const rooms=await adminRoomsRepository.listRoomTypes(session).catch(()=>[]);
  const status=params.status||'active';
  const filtered=rooms.filter(room=>status==='archived'?room.status==='archived':room.status!=='archived');

  return <div className="space-y-8">
    <AdminPageHeader title="Rooms" description="Manage room details, photos, guest limits, prices and availability in one place." actions={<Link href="/admin/rooms/new" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-5 text-center text-sm font-semibold text-white">Add room</Link>}/>
    <RoomFilters status={status}/>
    {filtered.length?<RoomList rooms={filtered}/>:<AdminEmptyState title="No rooms match this filter" description={status==='archived'?'There are no archived rooms.':'Add your first room or view archived rooms.'} action={status==='active'?<Link href="/admin/rooms/new" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white">Add Room</Link>:undefined}/>}
  </div>;
}

function RoomFilters({status}:{status:string}){
  return <form className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
    <label className="text-xs font-bold text-slate-600">Status<select name="status" defaultValue={status} className="ml-2 min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-medium"><option value="active">Active</option><option value="archived">Archived</option></select></label>
    <button className="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-100 px-4 text-sm font-bold">Apply filter</button>
  </form>;
}

function RoomList({rooms}:{rooms:AdminRoomType[]}){
  return <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
    <div className="admin-room-type-grid hidden min-w-[68rem] gap-4 border-b border-slate-200 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 md:grid"><span>Photo</span><span>Room</span><span>Capacity</span><span>Price</span><span>Status</span><span>Actions</span></div>
    {rooms.map(room=><article key={room.id} className="admin-room-type-grid grid gap-4 border-b border-slate-100 p-5 last:border-0 md:min-w-[68rem] md:items-center">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">{room.images[0]?<Image src={room.images.find(item=>item.isFeatured)?.publicUrl||room.images[0].publicUrl} alt="" fill sizes="80px" className="object-cover"/>:<span className="absolute inset-0 grid place-items-center text-xs text-slate-400">No image</span>}</div>
      <div><Link href={`/admin/rooms/${room.id}`} className="font-bold text-slate-950 hover:underline">{room.name}</Link>{room.featured&&<p className="mt-1 text-xs text-slate-500">Featured on the website</p>}</div>
      <div><p className="text-sm text-slate-700">Up to {room.capacity} {room.capacity===1?'guest':'guests'}</p><p className="mt-1 text-xs text-slate-500">{room.inventoryCount} {room.inventoryCount===1?'unit':'units'}</p></div>
      <p className="text-sm font-semibold text-slate-900">{formatRoomRate(room.basePrice,room.currency)}</p>
      <StatusBadge status={room.status}/>
      <div className="flex flex-wrap items-center gap-2"><Link href={`/admin/rooms/${room.id}`} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-3 text-center text-xs font-bold leading-none">Edit</Link>{room.status!=='archived'&&<><QuickRoomRateForm roomId={room.id} roomName={room.name} price={room.basePrice} currency={room.currency} active={room.rateActive}/><Link href="/admin/availability#block-dates" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-3 text-center text-xs font-bold leading-none">Availability</Link></>}{room.status==='archived'?<form action={restoreRoomType.bind(null,room.id)}><button className="inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-center text-xs font-bold leading-none text-emerald-700">Restore</button></form>:<details className="relative"><summary className="inline-flex min-h-11 cursor-pointer list-none items-center justify-center rounded-lg px-3 text-xs font-bold">More</summary><div className="absolute right-0 z-10 mt-2 grid w-40 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"><form action={duplicateRoomType.bind(null,room.id)}><button className="min-h-10 w-full rounded-lg px-3 text-left text-xs font-bold hover:bg-slate-50">Duplicate</button></form><ConfirmAction action={archiveRoomType.bind(null,room.id)} label="Archive" confirmMessage={`Archive ${room.name}? It will be removed from the website and booking availability.`}/></div></details>}</div>
    </article>)}
  </div>;
}
