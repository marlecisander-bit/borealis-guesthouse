'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useMemo } from 'react';
import { useBooking } from '@/hooks/useBooking';
import { mockBookingAddons, mockBookingService } from '@/services/booking';
import type { BookingSelection, GuestInformation } from '@/types/booking';

export function BookingFlow({ initialRoom, initialCheckIn, initialCheckOut, initialGuests }: { initialRoom?: string; initialCheckIn?: string; initialCheckOut?: string; initialGuests?: number }) {
  const { state, dispatch } = useBooking({ checkIn: initialCheckIn, checkOut: initialCheckOut, guests: initialGuests });
  const addonTotal = state.addons.reduce((sum, item) => sum + item.price, 0);
  const total = (state.selectedRoom?.subtotal || 0) + addonTotal;
  const canContinueGuest = state.guest.firstName && state.guest.lastName && state.guest.email;
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  async function search(event: FormEvent) {
    event.preventDefault(); dispatch({ type: 'searching' });
    try {
      const available = await mockBookingService.searchAvailability(state.search); dispatch({ type: 'rooms', value: available });
      const preferred = available.find((item) => item.room.slug === initialRoom); if (preferred) dispatch({ type: 'select-room', value: preferred });
    } catch (error) { dispatch({ type: 'error', value: error instanceof Error ? error.message : 'Availability could not be loaded.' }); }
  }

  async function reviewBooking() {
    if (!state.selectedRoom) return; dispatch({ type: 'holding' });
    const selection: BookingSelection = { search: state.search, room: state.selectedRoom, addons: state.addons, guest: state.guest };
    try { const hold = await mockBookingService.createBookingHold(selection); dispatch({ type: 'hold', value: hold }); dispatch({ type: 'step', value: 4 }); }
    catch { dispatch({ type: 'error', value: 'We could not prepare the booking summary. Please try again.' }); }
  }

  async function confirm() {
    if (!state.hold || !state.selectedRoom) return; dispatch({ type: 'holding' });
    const selection: BookingSelection = { search: state.search, room: state.selectedRoom, addons: state.addons, guest: state.guest };
    try { dispatch({ type: 'confirmed', value: await mockBookingService.createBooking(selection, state.hold) }); }
    catch { dispatch({ type: 'error', value: 'The preview confirmation could not be created.' }); }
  }

  if (state.confirmation) return <Confirmation reference={state.confirmation.reference} />;

  return <div className="pb-28 md:pb-0">
    <div className="mb-8 flex items-center gap-2" aria-label={`Booking step ${state.step} of 4`}>{['Stay','Enhance','Details','Review'].map((label,index)=><div key={label} className="flex flex-1 items-center gap-2"><span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${index+1<=state.step?'bg-lake text-white':'bg-sand/60 text-muted'}`}>{index+1}</span><span className="hidden text-xs font-bold text-muted sm:inline">{label}</span>{index<3&&<span className="h-px flex-1 bg-lake/10"/>}</div>)}</div>
    <div className="grid gap-10 lg:grid-cols-[1fr_23rem] lg:items-start">
      <div className="space-y-5">
        <Panel number="1" title="Dates and guests" open={state.step===1 || !state.selectedRoom} edit={state.step>1 ? ()=>dispatch({type:'step',value:1}) : undefined}>
          <form onSubmit={search} className="grid gap-3 sm:grid-cols-2">
            <Field label="Check-in"><input required min={today} type="date" value={state.search.checkIn} onChange={e=>dispatch({type:'set-search',value:{...state.search,checkIn:e.target.value}})} className="booking-input"/></Field>
            <Field label="Check-out"><input required min={state.search.checkIn||today} type="date" value={state.search.checkOut} onChange={e=>dispatch({type:'set-search',value:{...state.search,checkOut:e.target.value}})} className="booking-input"/></Field>
            <Field label="Guests"><select value={state.search.guests} onChange={e=>dispatch({type:'set-search',value:{...state.search,guests:Number(e.target.value)}})} className="booking-input"><option value={1}>1 guest</option><option value={2}>2 guests</option><option value={3}>3 guests</option><option value={4}>4 guests</option></select></Field>
            <button disabled={state.status==='loading'} className="min-h-16 rounded-xl bg-lake px-6 text-sm font-bold text-white disabled:opacity-60">{state.status==='loading'?'Checking rooms…':'Check availability'}</button>
          </form>
          {state.status==='error'&&<StateMessage title="Something went wrong" copy={state.error||'Please try again.'}/>} 
          {state.status==='empty'&&<StateMessage title="No rooms found" copy="Try different dates or fewer guests. You can also contact us for help."/>}
          {state.rooms.length>0&&<div className="mt-8"><h3 className="font-serif text-3xl text-lake">Available rooms</h3><p className="mt-2 text-sm text-muted">Mock availability and sample rates for this preview.</p><div className="mt-5 space-y-4">{state.rooms.map(item=><button type="button" key={item.room.id} onClick={()=>dispatch({type:'select-room',value:item})} className={`grid w-full grid-cols-[7rem_1fr] gap-4 rounded-2xl p-2 text-left transition sm:grid-cols-[10rem_1fr_auto] ${state.selectedRoom?.room.id===item.room.id?'bg-sand/60 ring-2 ring-green':'bg-ivory hover:bg-sand/35'}`}><div className="relative min-h-28 overflow-hidden rounded-xl"><Image src={item.room.image} alt="" fill sizes="160px" className="object-cover"/></div><div className="py-2"><p className="font-serif text-2xl text-lake">{item.room.name}</p><p className="mt-1 text-xs text-muted">{item.room.viewType} · {item.room.capacity} guests · {item.room.beds}</p><span className="mt-3 inline-block text-sm font-bold text-green">{state.selectedRoom?.room.id===item.room.id?'Selected':'Select room'}</span></div><div className="hidden self-center pr-4 text-right sm:block"><p className="text-xs text-muted">{item.nights} nights</p><p className="font-serif text-2xl text-lake">€{item.subtotal}</p></div></button>)}</div></div>}
        </Panel>

        <Panel number="2" title="Enhance your stay" open={state.step===2} edit={state.step>2 ? ()=>dispatch({type:'step',value:2}) : undefined} summary={state.addons.length ? `${state.addons.length} selected` : 'Optional'}>
          <p className="mb-5 text-sm leading-6 text-muted">Useful additions, never requirements. Prices are sample estimates until live booking is connected.</p>
          <div className="space-y-3">{mockBookingAddons.map(addon=>{const selected=state.addons.some(x=>x.id===addon.id);return <button type="button" key={addon.id} onClick={()=>dispatch({type:'toggle-addon',value:addon})} className={`flex w-full items-center gap-4 rounded-2xl p-5 text-left ${selected?'bg-sand/60 ring-2 ring-green':'bg-ivory'}`}><span className={`grid size-6 shrink-0 place-items-center rounded-md border ${selected?'border-green bg-green text-white':'border-lake/20'}`}>{selected?'✓':''}</span><span className="flex-1"><strong className="block text-lake">{addon.name}</strong><span className="mt-1 block text-xs text-muted">{addon.description}</span></span><strong className="text-lake">€{addon.price}</strong></button>})}</div>
          <button onClick={()=>dispatch({type:'step',value:3})} className="mt-6 min-h-14 w-full rounded-xl bg-lake px-6 text-sm font-bold text-white">Continue to guest details</button>
        </Panel>

        <Panel number="3" title="Guest information" open={state.step===3} edit={state.step>3 ? ()=>dispatch({type:'step',value:3}) : undefined}>
          <GuestForm value={state.guest} onChange={value=>dispatch({type:'set-guest',value})}/>
          <button disabled={!canContinueGuest||state.status==='loading'} onClick={reviewBooking} className="mt-6 min-h-14 w-full rounded-xl bg-lake px-6 text-sm font-bold text-white disabled:opacity-45">Review booking</button>
        </Panel>

        <Panel number="4" title="Review and confirm" open={state.step===4}>
          <p className="text-sm leading-6 text-muted">Review the summary before creating a placeholder confirmation. No payment or real reservation will be made.</p>
          <button onClick={confirm} disabled={state.status==='loading'} className="mt-6 min-h-14 w-full rounded-xl bg-lake px-6 text-sm font-bold text-white disabled:opacity-60">{state.status==='loading'?'Preparing confirmation…':'Confirm preview booking'}</button>
        </Panel>
      </div>
      <Summary state={state} addonTotal={addonTotal} total={total}/>
    </div>
    {state.selectedRoom&&state.step<4&&<div className="fixed inset-x-0 bottom-0 z-30 border-t border-lake/10 bg-white/95 px-4 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_30px_rgba(23,50,77,.12)] backdrop-blur lg:hidden"><div className="mx-auto flex max-w-lg items-center gap-3"><p className="text-xs text-muted">Current total<br/><strong className="text-xl text-lake">€{total}</strong></p><button disabled={state.step===3&&!canContinueGuest} onClick={()=>state.step===3?reviewBooking():dispatch({type:'step',value:state.step===1?2:3})} className="ml-auto min-h-14 flex-1 rounded-full bg-lake px-5 text-sm font-bold text-white disabled:opacity-45">{state.step===3?'Review booking':'Continue'}</button></div></div>}
  </div>;
}

function Panel({number,title,open,edit,summary,children}:{number:string;title:string;open:boolean;edit?:()=>void;summary?:string;children:React.ReactNode}){return <section className={`rounded-[1.5rem] ${open?'bg-white p-5 shadow-sm md:p-8':'bg-ivory p-5'}`}><header className="flex items-center gap-3"><span className={`grid size-8 place-items-center rounded-full text-xs font-bold ${open?'bg-lake text-white':'bg-sand text-lake'}`}>{number}</span><h2 className="font-serif text-2xl text-lake">{title}</h2>{summary&&<span className="ml-auto text-xs text-muted">{summary}</span>}{edit&&<button onClick={edit} className="ml-auto text-xs font-bold text-green underline">Edit</button>}</header>{open&&<div className="mt-6">{children}</div>}</section>}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="rounded-xl bg-ivory px-4 py-3 text-[.7rem] font-bold uppercase tracking-widest text-muted">{label}{children}</label>}
function StateMessage({title,copy}:{title:string;copy:string}){return <div role="status" className="mt-5 rounded-2xl bg-sand/50 p-5"><strong className="text-lake">{title}</strong><p className="mt-1 text-sm text-muted">{copy}</p></div>}
function GuestForm({value,onChange}:{value:GuestInformation;onChange:(value:GuestInformation)=>void}){const input='booking-input rounded-xl bg-ivory px-4';return <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-lake">First name<input required autoComplete="given-name" value={value.firstName} onChange={e=>onChange({...value,firstName:e.target.value})} className={input}/></label><label className="text-sm font-semibold text-lake">Last name<input required autoComplete="family-name" value={value.lastName} onChange={e=>onChange({...value,lastName:e.target.value})} className={input}/></label><label className="text-sm font-semibold text-lake">Email<input required type="email" autoComplete="email" value={value.email} onChange={e=>onChange({...value,email:e.target.value})} className={input}/></label><label className="text-sm font-semibold text-lake">Phone<input type="tel" autoComplete="tel" value={value.phone} onChange={e=>onChange({...value,phone:e.target.value})} className={input}/></label><label className="text-sm font-semibold text-lake sm:col-span-2">Notes (optional)<textarea rows={3} value={value.notes} onChange={e=>onChange({...value,notes:e.target.value})} className={`${input} py-3`}/></label></div>}
function Summary({state,addonTotal,total}:{state:ReturnType<typeof useBooking>['state'];addonTotal:number;total:number}){return <aside className="hidden rounded-[1.75rem] bg-lake p-7 text-white lg:sticky lg:top-6 lg:block"><p className="text-xs font-bold uppercase tracking-widest text-sand">Booking summary</p>{state.selectedRoom?<><h2 className="mt-4 font-serif text-3xl">{state.selectedRoom.room.name}</h2><dl className="mt-6 space-y-3 border-y border-white/15 py-5 text-sm"><Row label="Check-in" value={state.search.checkIn}/><Row label="Check-out" value={state.search.checkOut}/><Row label="Nights" value={String(state.selectedRoom.nights)}/><Row label="Guests" value={String(state.search.guests)}/><Row label="Room subtotal" value={`€${state.selectedRoom.subtotal}`}/><Row label="Experiences & transfers" value={`€${addonTotal}`}/><Row label="Taxes / fees" value="Calculated later"/></dl><div className="flex items-end justify-between pt-6"><span className="text-sm text-white/65">Total before taxes</span><strong className="font-serif text-4xl">€{total}</strong></div><p className="mt-4 text-xs leading-5 text-white/50">Sample pricing only. Final taxes and fees are not yet calculated.</p></>:<p className="mt-5 text-sm leading-6 text-white/60">Choose dates and a room to see your complete stay summary.</p>}</aside>}
function Row({label,value}:{label:string;value:string}){return <div className="flex justify-between gap-4"><dt className="text-white/60">{label}</dt><dd className="text-right font-medium">{value||'—'}</dd></div>}
function Confirmation({reference}:{reference:string}){return <section className="rounded-[2rem] bg-ivory p-8 text-center md:p-14"><span className="mx-auto grid size-16 place-items-center rounded-full bg-green text-2xl text-white">✓</span><p className="eyebrow mt-7">Confirmation placeholder</p><h1 className="mt-3 font-serif text-5xl text-lake">Your preview stay is ready.</h1><p className="mx-auto mt-5 max-w-xl leading-7 text-muted">No real reservation or payment has been created. This screen demonstrates the final booking experience.</p><p className="mt-6 text-sm font-bold text-lake">Reference: {reference}</p><Link href="/" className="mt-8 inline-block rounded-full bg-lake px-7 py-4 text-sm font-bold text-white">Return home</Link></section>}
