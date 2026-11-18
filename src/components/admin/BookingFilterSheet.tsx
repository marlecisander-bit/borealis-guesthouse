'use client';

import Form from 'next/form';
import { useRef } from 'react';
import type { BookingFilters } from '@/lib/admin/booking-views';

const statuses=['held','pending','awaiting_payment','confirmed','cancelled','checked_in','completed'];
export function BookingFilterSheet({ filters, rooms }: {filters:BookingFilters;rooms:{id:string;name:string}[]}) {
  const dialog=useRef<HTMLDialogElement>(null);
  const trigger=useRef<HTMLButtonElement>(null);
  return <>
    <button ref={trigger} type="button" aria-haspopup="dialog" onClick={()=>dialog.current?.showModal()} className="min-h-11 rounded-lg border border-stone-300 bg-white px-4 text-sm font-bold text-brand">Filters</button>
    <dialog ref={dialog} onClose={()=>trigger.current?.focus({preventScroll:true})} aria-labelledby="booking-filter-title" className="admin-filter-sheet w-full max-w-lg rounded-t-2xl bg-white p-5 backdrop:bg-black/40 sm:rounded-2xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="booking-filter-title" className="text-lg font-bold text-lake">Filter bookings</h2>
        <button type="button" aria-label="Close filters" onClick={()=>dialog.current?.close()} className="size-11 rounded-lg border border-stone-200 text-lg">×</button>
      </div>
      <Form action="/admin/bookings" onSubmit={()=>dialog.current?.close()} className="grid gap-3">
        {(['period','q','date','payment'] as const).map(key=><input key={key} type="hidden" name={key} value={filters[key]||''}/>)}
        <label className="grid gap-1 text-sm font-semibold">Status<select aria-label="Status" name="status" defaultValue={filters.status||''} className="admin-panel-input"><option value="">All statuses</option>{statuses.map(value=><option key={value} value={value}>{value.replaceAll('_',' ')}</option>)}</select></label>
        <label className="grid gap-1 text-sm font-semibold">Room<select aria-label="Room" name="room" defaultValue={filters.room||''} className="admin-panel-input"><option value="">All rooms</option>{rooms.map(room=><option key={room.id} value={room.id}>{room.name}</option>)}</select></label>
        <label className="grid gap-1 text-sm font-semibold">Service date from<input type="date" name="from" defaultValue={filters.from} className="admin-panel-input"/></label>
        <label className="grid gap-1 text-sm font-semibold">Service date to<input type="date" name="to" defaultValue={filters.to} className="admin-panel-input"/></label>
        <button className="mt-2 min-h-12 rounded-lg bg-brand px-4 text-sm font-bold text-white">Apply filters</button>
      </Form>
    </dialog>
  </>;
}
