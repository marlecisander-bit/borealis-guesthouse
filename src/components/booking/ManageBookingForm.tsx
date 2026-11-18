'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { formatMoney } from '@/lib/pricing/format';
import type { BookingManagement, BookingManagementState } from '@/lib/booking/management';

type Action=(state:BookingManagementState,form:FormData)=>Promise<BookingManagementState>;
const initial:BookingManagementState={message:''};
const input='min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3';
const button='min-h-11 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white disabled:opacity-55';

export function ManageBookingForm({booking,action,staff=false}:{booking:BookingManagement;action:Action;staff?:boolean}) {
  const [state,submit,busy]=useActionState(action,initial);
  const operation=useRef(new WeakMap<HTMLFormElement,string>());
  const [dismissed,setDismissed]=useState<string|null>(null);
  useEffect(()=>{if(state.success)operation.current=new WeakMap();},[state]);
  const bindOperation=(form:HTMLFormElement)=>{
    const id=form.elements.namedItem('operationId');
    if(id instanceof HTMLInputElement&&!form.elements.namedItem('version')) {
      const key=operation.current.get(form)||crypto.randomUUID();
      operation.current.set(form,key);
      id.value=key;
    }
  };
  const statuses=booking.status==='cancelled';
  const quote=state.quote?.operationId===dismissed?undefined:state.quote;
  return <div className="space-y-4">
    <div aria-live="polite" className={state.message?'rounded-lg border border-stone-200 bg-white p-3 text-sm':''}>{state.message}</div>
    {statuses&&<p className="font-semibold">This booking is cancelled.</p>}
    {booking.canChange&&<form action={submit} onSubmit={event=>bindOperation(event.currentTarget)} className="grid gap-3 rounded-xl border border-stone-200 bg-white p-4">
      <h3 className="font-bold">Change dates or guest counts</h3>
      {quote?<><p>Revised total <strong>{formatMoney(quote.total,quote.currency)}</strong> · {quote.stay.checkIn} to {quote.stay.checkOut}</p>
        <p className="text-sm">{quote.stay.adults} adults · {quote.stay.children} children · {quote.stay.infants} infants</p>
        {Object.entries(quote.stay).map(([name,value])=><input type="hidden" key={name} name={name} value={value}/>)}
        <input type="hidden" name="version" value={quote.version}/><input type="hidden" name="operationId" value={quote.operationId}/>
        <button name="action" value="modify" className={button} disabled={busy}>Confirm change</button>
        <button type="button" onClick={()=>setDismissed(quote.operationId)} className="min-h-11 text-sm font-bold text-brand underline">Edit proposal</button>
      </>:<>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">Check-in<input className={input} name="checkIn" type="date" required defaultValue={booking.checkIn||''}/></label>
          <label className="grid gap-1 text-sm">Check-out<input className={input} name="checkOut" type="date" required defaultValue={booking.checkOut||''}/></label>
        </div>
        <div className="grid grid-cols-3 gap-2">{(['adults','children','infants'] as const).map(name=><label key={name} className="grid gap-1 text-sm capitalize">{name}<input className={input} name={name} type="number" min={name==='adults'?1:0} max={30} required defaultValue={booking[name]}/></label>)}</div>
        <button name="action" value="quote" className={button} disabled={busy}>Check availability and price</button>
      </>}
    </form>}
    {booking.canCancel&&<form action={submit} onSubmit={event=>bindOperation(event.currentTarget)} className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
      <h3 className="font-bold">Cancel booking</h3>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="confirmed" required className="mt-1"/> I confirm I want to cancel this booking.</label>
      <input name="operationId" type="hidden"/><button name="action" value="cancel" className="min-h-11 rounded-lg border border-red-300 px-4 text-sm font-bold text-red-800" disabled={busy}>Confirm cancellation</button>
    </form>}
    {!staff&&booking.canRequest&&(booking.requestStatus==='pending'?<p className="rounded-lg bg-amber-50 p-3 text-sm">Your request is awaiting review. Your booking remains unchanged.</p>:<form action={submit} onSubmit={event=>bindOperation(event.currentTarget)} className="grid gap-3 rounded-xl border border-stone-200 bg-white p-4">
      <h3 className="font-bold">Request staff review</h3>
      <p className="text-sm text-slate-600">For changes or cancellations outside self-service, tell us what you need. Your booking stays in place while we review your request.</p>
      <label className="grid gap-1 text-sm">Request type<select name="action" className={input}><option value="request_change">Change booking</option><option value="request_cancel">Cancel booking</option></select></label>
      <label className="grid gap-1 text-sm">Request details<textarea name="message" required minLength={3} maxLength={1000} rows={3} className={input}/></label>
      <input name="operationId" type="hidden"/><button className={button} disabled={busy}>Send request</button>
    </form>)}
    {staff&&booking.history.length>0&&<section className="space-y-2"><h3 className="font-bold">Requests and change history</h3>{booking.history.map(event=><article key={event.id} className="rounded-lg border border-stone-200 bg-white p-3 text-sm">
      <p className="font-semibold capitalize">{event.operation.replaceAll('_',' ')}{event.status?' · '+event.status:''} · {event.actorId?'Staff':'Guest'}</p>
      <time dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleDateString('en-GB',{timeZone:'Europe/Tirane'})}</time>
      {event.input.message&&<p className="mt-1 whitespace-pre-wrap">{event.input.message}</p>}
      {event.outcome.previous&&<p>{event.outcome.previous.checkIn} → {event.outcome.previous.checkOut} changed to {event.input.checkIn} → {event.input.checkOut}. Total {formatMoney(event.outcome.previous.total,booking.currency)} → {formatMoney(event.outcome.total||0,booking.currency)}.</p>}
      {event.status==='pending'&&<form action={submit} className="mt-2"><input type="hidden" name="operationId" value={event.id}/><button name="action" value="review" className={button} disabled={busy}>Mark reviewed</button></form>}
    </article>)}</section>}
  </div>;
}
