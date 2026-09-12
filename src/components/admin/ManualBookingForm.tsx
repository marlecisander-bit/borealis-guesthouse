'use client';
import { useActionState, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createManualBooking, type ManualBookingState } from '@/app/admin/bookings/actions';
import { DateRangeCalendar } from '@/components/public/DateRangeCalendar';
import { useDateRangePicker } from '@/hooks/useDateRangePicker';
import { formatDateOnly, type DateRangeValue } from '@/lib/date-range';
import type { ManualBookingRoom } from '@/types/bookings-admin';
import { CalendarIcon } from '@/components/CalendarIcon';

const initial:ManualBookingState={ok:false,message:''};
const input='mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3';

export function ManualBookingForm({rooms}:{rooms:ManualBookingRoom[]}) {
  const [state,action,pending]=useActionState(createManualBooking,initial);
  const router=useRouter();
  const v=(key:string,fallback='')=>state.values?.[key]??fallback;
  const [dates,setDates]=useState<DateRangeValue>({checkIn:v('checkIn'),checkOut:v('checkOut')});
  const changeDates=useCallback((value:DateRangeValue)=>setDates(value),[]);
  const picker=useDateRangePicker({value:dates,onChange:changeDates});
  useEffect(()=>{if(state.ok&&state.id)router.replace(`/admin/bookings/${state.id}`)},[state,router]);

  return <form action={action} className="space-y-6">
    <section className="relative rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-bold">Stay</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field label="Room"><select name="roomTypeId" required defaultValue={v('roomTypeId')} className={input}><option value="">Choose a room</option>{rooms.map(room=><option key={room.id} value={room.id}>{room.name} · up to {room.capacity}</option>)}</select></Field>
        <span/>
        <input type="hidden" name="checkIn" value={dates.checkIn}/><input type="hidden" name="checkOut" value={dates.checkOut}/>
        <DateButton label="Check-in" value={dates.checkIn} onClick={picker.openCheckInPicker} open={picker.open}/>
        <DateButton label="Check-out" value={dates.checkOut} onClick={picker.openCheckOutPicker} open={picker.open}/>
        <DateRangeCalendar value={dates} picker={picker}/>
        <Field label="Adults"><input name="adults" required type="number" min="1" defaultValue={v('adults','1')} className={input}/></Field>
        <Field label="Children"><input name="children" required type="number" min="0" defaultValue={v('children','0')} className={input}/></Field>
        <Field label="Infants"><input name="infants" required type="number" min="0" defaultValue={v('infants','0')} className={input}/></Field>
      </div>
    </section>
    <section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-bold">Primary guest</h2><div className="mt-5 grid gap-5 sm:grid-cols-2"><Field label="First name"><input name="firstName" required defaultValue={v('firstName')} className={input}/></Field><Field label="Last name"><input name="lastName" required defaultValue={v('lastName')} className={input}/></Field><Field label="Email"><input name="email" required type="email" defaultValue={v('email')} className={input}/></Field><Field label="Phone"><input name="phone" required type="tel" defaultValue={v('phone')} className={input}/></Field><Field label="Country (optional)"><input name="country" defaultValue={v('country')} className={input}/></Field></div><Field label="Guest notes (optional)"><textarea name="notes" rows={4} defaultValue={v('notes')} className={`${input} py-3`}/></Field></section>
    <div className="sticky bottom-3 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur"><p role="status" className={state.ok?'text-sm text-emerald-700':'text-sm text-red-700'}>{state.message}</p><button disabled={pending||!rooms.length||!dates.checkIn||!dates.checkOut} className="min-h-11 rounded-lg bg-slate-950 px-5 font-bold text-white disabled:opacity-50">{pending?'Checking and creating…':'Create confirmed booking'}</button></div>
  </form>;
}

function DateButton({label,value,onClick,open}:{label:string;value:string;onClick:()=>void;open:boolean}) { return <button type="button" onClick={onClick} aria-haspopup="dialog" aria-expanded={open} className="block min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800"><span>{label}</span><strong className="mt-1 flex items-center justify-between gap-3 text-base font-medium"><span>{formatDateOnly(value,'numeric')}</span><CalendarIcon className="size-5 shrink-0 text-slate-600"/></strong></button>; }
function Field({label,children}:{label:string;children:React.ReactNode}) { return <label className="block text-sm font-semibold text-slate-800">{label}{children}</label>; }
