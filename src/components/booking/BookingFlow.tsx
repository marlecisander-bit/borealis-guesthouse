'use client';

import Image from 'next/image';
import { FormEvent, useCallback, useEffect, useRef } from 'react';
import {useRouter} from 'next/navigation';
import { useBooking } from '@/hooks/useBooking';
import { bookingService } from '@/services/booking';
import type { AvailableRoom, BookingAddon, BookingSelection, GuestInformation, StaySearch } from '@/types/booking';
import {formatMoney} from '@/lib/pricing/format';
import {DateRangeCalendar} from '@/components/public/DateRangeCalendar';
import {useDateRangePicker} from '@/hooks/useDateRangePicker';
import {addDateOnlyDays,formatDateOnly,type DateRangeValue} from '@/lib/date-range';
import {MAX_BOOKING_GUESTS,bookingSearchKey,bookingSearchUrl,validateBookingSearch} from '@/lib/booking/search-criteria';
import {CalendarIcon} from '@/components/CalendarIcon';

export function BookingFlow({ initialRoom, initialCheckIn, initialCheckOut, initialGuests, initialTransfer, initialExperience, bookingMode, autoSearch=false, addons }: { initialRoom?: string; initialCheckIn?: string; initialCheckOut?: string; initialGuests?: number; initialTransfer?: string; initialExperience?:string; bookingMode?:string; autoSearch?:boolean; addons:BookingAddon[] }) {
  const router=useRouter();
  const { state, dispatch } = useBooking({ checkIn: initialCheckIn, checkOut: initialCheckOut, guests: initialGuests });
  const requestSequence=useRef(0),lastAutomaticSearch=useRef(''),lastRouteSearch=useRef<string|null>(null);
  const changeSearch=useCallback((value:StaySearch)=>{requestSequence.current+=1;dispatch({type:'set-search',value})},[dispatch]);
  const changeDates=useCallback((dates:DateRangeValue)=>changeSearch({...state.search,...dates}),[changeSearch,state.search]);
  const datePicker=useDateRangePicker({value:state.search,onChange:changeDates,minimumNights:state.selectedRoom?.minimumStay||1});
  const addonTotal = state.addons.reduce((sum, item) => sum + item.price*(item.perGuest?item.quantity:1), 0);
  const total = (state.selectedRoom?.subtotal || 0) + addonTotal;
  const canContinueGuest = Boolean(state.guest.firstName&&state.guest.lastName&&state.guest.email&&state.guest.phone&&state.guest.adults>0&&state.guest.children>=0&&state.guest.adults+state.guest.children===state.search.guests);
  const initialAddonApplied=useRef('');
  useEffect(()=>{const requested=initialTransfer||initialExperience;if(!requested||initialAddonApplied.current===requested)return;const addon=addons.find(item=>item.id===requested||item.bookingKey===requested);if(addon){dispatch({type:'toggle-addon',value:{...addon,date:addon.type==='transfer'&&addon.direction==='departure'?state.search.checkOut:state.search.checkIn,quantity:state.search.guests}});initialAddonApplied.current=requested}},[addons,initialExperience,initialTransfer,state.search.checkIn,state.search.checkOut,state.search.guests,dispatch]);

  const runAvailability=useCallback(async(criteria:StaySearch,syncUrl:boolean)=>{
    const requestId=++requestSequence.current,key=bookingSearchKey(criteria);
    dispatch({type:'searching'});
    if(syncUrl){
      lastAutomaticSearch.current=key;
      router.replace(bookingSearchUrl(criteria,{room:initialRoom,transfer:initialTransfer,experience:initialExperience,mode:bookingMode}),{scroll:false});
    }
    try{
      const available=await bookingService.searchAvailability(criteria);
      if(requestId!==requestSequence.current)return;
      const ordered=initialRoom?[...available].sort((a,b)=>Number(b.room.slug===initialRoom)-Number(a.room.slug===initialRoom)):available;
      dispatch({type:'rooms',value:ordered});
    }catch(error){
      if(requestId===requestSequence.current)dispatch({type:'error',value:error instanceof Error?error.message:'Availability could not be loaded.'});
    }
  },[bookingMode,dispatch,initialExperience,initialRoom,initialTransfer,router]);

  useEffect(()=>{
    const criteria=autoSearch?validateBookingSearch({checkIn:initialCheckIn,checkOut:initialCheckOut,guests:initialGuests}):null;
    const routeKey=criteria?bookingSearchKey(criteria):'blank';
    if(lastRouteSearch.current===routeKey)return;
    lastRouteSearch.current=routeKey;
    if(!criteria){requestSequence.current+=1;lastAutomaticSearch.current='';dispatch({type:'set-search',value:{checkIn:'',checkOut:'',guests:2}});return}
    dispatch({type:'set-search',value:criteria});
    if(lastAutomaticSearch.current===routeKey)return;
    lastAutomaticSearch.current=routeKey;
    void runAvailability(criteria,false);
  },[autoSearch,dispatch,initialCheckIn,initialCheckOut,initialGuests,runAvailability]);

  async function search(event: FormEvent) {
    event.preventDefault();
    const criteria=validateBookingSearch(state.search);
    if(!criteria){dispatch({type:'error',value:`Choose valid future check-in and check-out dates and between 1 and ${MAX_BOOKING_GUESTS} guests.`});return}
    await runAvailability(criteria,true);
  }

  function reviewBooking() {
    if (!state.selectedRoom || !canContinueGuest) return;
    dispatch({ type: 'step', value: 4 });
  }

  async function confirm() {
    if (!state.selectedRoom) return; dispatch({ type: 'holding' });
    const selection: BookingSelection = { search: state.search, room: state.selectedRoom, addons: state.addons, guest: state.guest };
    try { const hold=await bookingService.createBookingHold(selection);dispatch({type:'hold',value:hold});const confirmation=await bookingService.createBooking(selection,hold);dispatch({type:'confirmed',value:confirmation});router.replace(`/booking/confirmation/${confirmation.token}`); }
    catch(error) { dispatch({ type: 'error', value: error instanceof Error?error.message:'The reservation could not be created.' }); }
  }

  if (state.confirmation) return <Confirmation reference={state.confirmation.reference} />;

  return <div className="pb-28 md:pb-0">
    <div className="mb-8 flex items-center gap-2" aria-label={`Booking step ${state.step} of 4`}>{['Stay','Enhance','Details','Review'].map((label,index)=><div key={label} className="flex flex-1 items-center gap-2"><span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${index+1<=state.step?'bg-lake text-white':'bg-sand/60 text-muted'}`}>{index+1}</span><span className="hidden text-xs font-bold text-muted sm:inline">{label}</span>{index<3&&<span className="h-px flex-1 bg-lake/10"/>}</div>)}</div>
    <div className="grid gap-10 lg:grid-cols-[1fr_23rem] lg:items-start">
      <div className="space-y-5">
        <Panel number="1" title="Dates and guests" open={state.step===1 || !state.selectedRoom} edit={state.step>1 ? ()=>dispatch({type:'step',value:1}) : undefined}>
          <form onSubmit={search} className="relative grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={datePicker.openCheckInPicker} className="rounded-xl bg-ivory px-4 py-3 text-left text-[.7rem] font-bold uppercase tracking-widest text-muted" aria-haspopup="dialog" aria-expanded={datePicker.open}><span>Check-in</span><strong className="booking-date-value">{formatDateOnly(state.search.checkIn,'numeric')}<CalendarIcon className="booking-date-icon"/></strong></button>
            <button type="button" onClick={datePicker.openCheckOutPicker} className="rounded-xl bg-ivory px-4 py-3 text-left text-[.7rem] font-bold uppercase tracking-widest text-muted" aria-haspopup="dialog" aria-expanded={datePicker.open}><span>Check-out</span><strong className="booking-date-value">{formatDateOnly(state.search.checkOut,'numeric')}<CalendarIcon className="booking-date-icon"/></strong></button>
            <DateRangeCalendar value={state.search} picker={datePicker}/>
            <Field label="Guests"><select value={state.search.guests} onChange={e=>changeSearch({...state.search,guests:Number(e.target.value)})} className="booking-input">{Array.from({length:MAX_BOOKING_GUESTS},(_,index)=>index+1).map(value=><option key={value} value={value}>{value} {value===1?'guest':'guests'}</option>)}</select></Field>
            <button disabled={state.status==='loading'} className="min-h-16 rounded-xl bg-lake px-6 text-sm font-bold text-white disabled:opacity-60">{state.status==='loading'?'Checking rooms…':'Check availability'}</button>
          </form>
          {state.status==='error'&&<StateMessage title="Something went wrong" copy={state.error||'Please try again.'}/>} 
          {state.status==='empty'&&<StateMessage title="No rooms found" copy="Try different dates or fewer guests. You can also contact us for help."/>}
          {state.rooms.length>0&&<div className="mt-8"><h3 className="font-serif text-3xl text-lake">Available rooms</h3><p className="mt-2 text-sm text-muted">Rates are calculated for your selected dates.</p><div className="mt-5 space-y-4">{state.rooms.map(item=><button type="button" key={item.room.id} onClick={()=>dispatch({type:'select-room',value:item})} className={`grid w-full grid-cols-[7rem_1fr] gap-4 rounded-2xl p-2 text-left transition sm:grid-cols-[10rem_1fr_auto] ${state.selectedRoom?.room.id===item.room.id?'bg-sand/60 ring-2 ring-green':'bg-ivory hover:bg-sand/35'}`}><div className="relative min-h-28 overflow-hidden rounded-xl"><Image src={item.room.image} alt="" fill sizes="160px" className="object-cover"/></div><div className="py-2"><p className="font-serif text-2xl text-lake">{item.room.name}</p><p className="mt-1 text-xs text-muted">{item.room.viewType} · {item.room.capacity} guests · {item.room.beds}</p><span className="mt-3 inline-block text-sm font-bold text-green">{state.selectedRoom?.room.id===item.room.id?'Selected':'Select room'}</span></div><div className="hidden self-center pr-4 text-right sm:block"><p className="text-xs text-muted">{item.nights} nights</p><p className="font-serif text-2xl text-lake">{formatMoney(item.subtotal,item.currency)}</p></div></button>)}</div></div>}
        </Panel>

        <Panel number="2" title="Enhance your stay" open={state.step===2} edit={state.step>2 ? ()=>dispatch({type:'step',value:2}) : undefined} summary={state.addons.length ? `${state.addons.length} selected` : 'Optional'}>
          <p className="mb-7 text-sm leading-6 text-muted">Experiences and transportation are optional. Dates, capacity and prices are checked again when you confirm.</p>
          <AddonSection title="Experiences" empty="No experiences are available for online booking right now." addons={addons.filter(x=>x.type==='experience')} selected={state.addons} checkIn={state.search.checkIn} checkOut={state.search.checkOut} guests={state.search.guests} initialTransfer={initialTransfer} dispatch={dispatch}/>
          <AddonSection title="Transportation" empty="No transportation options are available for online booking right now." addons={addons.filter(x=>x.type==='transfer'&&(!x.capacity||x.capacity>=state.search.guests))} selected={state.addons} checkIn={state.search.checkIn} checkOut={state.search.checkOut} guests={state.search.guests} initialTransfer={initialTransfer} dispatch={dispatch}/>
          <button onClick={()=>dispatch({type:'step',value:3})} className="mt-7 min-h-14 w-full rounded-xl bg-lake px-6 text-sm font-bold text-white">{state.addons.length?'Continue to guest details':'Skip and continue'}</button>
        </Panel>

        <Panel number="3" title="Guest information" open={state.step===3} edit={state.step>3 ? ()=>dispatch({type:'step',value:3}) : undefined}>
          <GuestForm value={state.guest} onChange={value=>dispatch({type:'set-guest',value})}/>
          <button disabled={!canContinueGuest||state.status==='loading'} onClick={reviewBooking} className="mt-6 min-h-14 w-full rounded-xl bg-lake px-6 text-sm font-bold text-white disabled:opacity-45">Review booking</button>
        </Panel>

        <Panel number="4" title="Review and confirm" open={state.step===4}>
          {state.selectedRoom&&<ReviewPackage room={state.selectedRoom} addons={state.addons} guest={state.guest} search={state.search}/>}
          <p className="mt-6 text-sm leading-6 text-muted">Availability, capacity and every price will be checked server-side when you confirm. No payment will be taken.</p>
          {state.status==='error'&&<StateMessage title="Please review your selections" copy={state.error||'The package could not be confirmed.'}/>}
          <button onClick={confirm} disabled={state.status==='loading'} className="mt-6 min-h-14 w-full rounded-xl bg-lake px-6 text-sm font-bold text-white disabled:opacity-60">{state.status==='loading'?'Preparing confirmation…':'Confirm reservation request'}</button>
        </Panel>
      </div>
      <Summary state={state} addonTotal={addonTotal} total={total}/>
    </div>
    {state.selectedRoom&&state.step<4&&<div className="safe-bottom-bar fixed inset-x-0 bottom-0 z-30 border-t border-lake/10 bg-white/95 px-4 pt-3 shadow-[0_-8px_30px_rgba(23,50,77,.12)] backdrop-blur lg:hidden"><div className="mx-auto flex max-w-lg items-center gap-3"><p className="text-xs text-muted">Current total<br/><strong className="text-xl text-lake">{formatMoney(total,state.selectedRoom?.currency||'EUR')}</strong></p><button disabled={state.step===3&&!canContinueGuest} onClick={()=>state.step===3?reviewBooking():dispatch({type:'step',value:state.step===1?2:3})} className="ml-auto min-h-14 flex-1 rounded-full bg-lake px-5 text-sm font-bold text-white disabled:opacity-45">{state.step===3?'Review booking':'Continue'}</button></div></div>}
  </div>;
}

function Panel({number,title,open,edit,summary,children}:{number:string;title:string;open:boolean;edit?:()=>void;summary?:string;children:React.ReactNode}){return <section className={`rounded-[1.5rem] ${open?'bg-white p-5 shadow-sm md:p-8':'bg-ivory p-5'}`}><header className="flex items-center gap-3"><span className={`grid size-8 place-items-center rounded-full text-xs font-bold ${open?'bg-lake text-white':'bg-sand text-lake'}`}>{number}</span><h2 className="font-serif text-2xl text-lake">{title}</h2>{summary&&<span className="ml-auto text-xs text-muted">{summary}</span>}{edit&&<button onClick={edit} className="ml-auto text-xs font-bold text-green underline">Edit</button>}</header>{open&&<div className="mt-6">{children}</div>}</section>}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="rounded-xl bg-ivory px-4 py-3 text-[.7rem] font-bold uppercase tracking-widest text-muted">{label}{children}</label>}
function StateMessage({title,copy}:{title:string;copy:string}){return <div role="status" className="mt-5 rounded-2xl bg-sand/50 p-5"><strong className="text-lake">{title}</strong><p className="mt-1 text-sm text-muted">{copy}</p></div>}
function AddonSection({title,empty,addons,selected,checkIn,checkOut,guests,initialTransfer,dispatch}:{title:string;empty:string;addons:BookingAddon[];selected:BookingAddon[];checkIn:string;checkOut:string;guests:number;initialTransfer?:string;dispatch:ReturnType<typeof useBooking>['dispatch']}){
  const selectedOf=(addon:BookingAddon)=>selected.find(item=>item.type===addon.type&&item.id===addon.id);
  const lastExperienceDay=checkOut?addDateOnlyDays(checkOut,-1):'';
  return <section className="mt-7 first:mt-0"><h3 className="eyebrow mb-3">{title}</h3>{addons.length?<div className="space-y-4">{addons.map(addon=>{const current=selectedOf(addon),choice=current||{...addon,date:addon.type==='transfer'&&addon.direction==='departure'?checkOut:checkIn,quantity:guests};return <article key={`${addon.type}:${addon.id}`} className={`overflow-hidden rounded-2xl ${current?'bg-sand/60 ring-2 ring-green':'bg-ivory'} ${initialTransfer===addon.id&&!current?'ring-1 ring-green/40':''}`}><div className="grid gap-4 p-4 sm:grid-cols-[7rem_1fr_auto]"><div className="relative min-h-24 overflow-hidden rounded-xl"><Image src={addon.image} alt="" fill sizes="112px" className="object-cover"/></div><div><strong className="block text-lake">{addon.name}</strong><span className="mt-1 block text-xs leading-5 text-muted">{addon.description}</span><span className="mt-2 block text-xs font-semibold text-muted">{addon.duration}{addon.capacity?` · Up to ${addon.capacity}`:''}</span></div><div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end"><strong className="text-lake">{addon.priceLabel||formatMoney(addon.price,'EUR')}{addon.perGuest?' / person':''}</strong><button type="button" onClick={()=>dispatch({type:'toggle-addon',value:choice})} className={`min-h-11 rounded-full px-5 text-sm font-bold ${current?'border border-lake/20 bg-white text-lake':'bg-lake text-white'}`}>{current?'Remove':'Add'}</button></div></div>{current&&<div className="grid gap-3 border-t border-lake/10 p-4 sm:grid-cols-3"><label className="text-xs font-bold uppercase tracking-wide text-muted">Date<input type="date" required min={checkIn} max={addon.type==='experience'?lastExperienceDay:checkOut} value={current.date} onChange={event=>dispatch({type:'update-addon',value:{...current,date:event.target.value}})} className="booking-input mt-2 rounded-xl bg-white px-3"/></label><label className="text-xs font-bold uppercase tracking-wide text-muted">{addon.type==='transfer'?'Pickup time':'Time (optional)'}<input type="time" min={addon.windowStart} max={addon.windowEnd} value={current.time} onChange={event=>dispatch({type:'update-addon',value:{...current,time:event.target.value}})} className="booking-input mt-2 rounded-xl bg-white px-3"/></label><label className="text-xs font-bold uppercase tracking-wide text-muted">{addon.type==='transfer'?'Passengers':'Participants'}<input type="number" min={1} max={addon.capacity||guests} value={current.quantity} onChange={event=>dispatch({type:'update-addon',value:{...current,quantity:Number(event.target.value)}})} className="booking-input mt-2 rounded-xl bg-white px-3"/></label></div>}</article>})}</div>:<p className="rounded-2xl bg-ivory p-5 text-sm text-muted">{empty}</p>}</section>;
}
function ReviewPackage({room,addons,guest,search}:{room:AvailableRoom;addons:BookingAddon[];guest:GuestInformation;search:StaySearch}){
  const experiences=addons.filter(item=>item.type==='experience'),transfers=addons.filter(item=>item.type==='transfer'),sum=(items:BookingAddon[])=>items.reduce((total,item)=>total+item.price*(item.perGuest?item.quantity:1),0),experienceTotal=sum(experiences),transferTotal=sum(transfers),total=room.subtotal+experienceTotal+transferTotal;
  return <div className="space-y-6"><ReviewSection title="Your stay"><ReviewLine label={room.room.name} detail={`${search.checkIn} → ${search.checkOut} · ${room.nights} nights · ${search.guests} guests`} price={formatMoney(room.subtotal,room.currency)}/></ReviewSection><ReviewSection title="Experiences">{experiences.length?experiences.map(item=><ReviewLine key={item.id} label={item.name} detail={`${item.date}${item.time?` · ${item.time}`:''} · ${item.quantity} participant${item.quantity===1?'':'s'}`} price={formatMoney(item.price*(item.perGuest?item.quantity:1),room.currency)}/>):<p className="text-sm text-muted">None selected</p>}</ReviewSection><ReviewSection title="Transportation">{transfers.length?transfers.map(item=><ReviewLine key={item.id} label={item.name} detail={`${item.date}${item.time?` · ${item.time}`:''} · ${item.quantity} passenger${item.quantity===1?'':'s'}`} price={formatMoney(item.price*(item.perGuest?item.quantity:1),room.currency)}/>):<p className="text-sm text-muted">None selected</p>}</ReviewSection><ReviewSection title="Guest details"><p className="font-semibold text-lake">{guest.firstName} {guest.lastName}</p><p className="mt-1 text-sm text-muted">{guest.email} · {guest.phone}</p></ReviewSection><section className="rounded-2xl bg-lake p-5 text-white"><p className="text-xs font-bold uppercase tracking-widest text-sand">Price summary</p><dl className="mt-4 space-y-2 text-sm"><Row label="Stay" value={formatMoney(room.subtotal,room.currency)}/><Row label="Experiences" value={formatMoney(experienceTotal,room.currency)}/><Row label="Transportation" value={formatMoney(transferTotal,room.currency)}/><Row label="Taxes and fees" value={formatMoney(0,room.currency)}/></dl><div className="mt-4 flex items-end justify-between border-t border-white/15 pt-4"><span>Total</span><strong className="font-serif text-3xl">{formatMoney(total,room.currency)}</strong></div><p className="mt-3 text-xs text-white/60">Payment: pay at property · payment pending</p></section></div>;
}
function ReviewSection({title,children}:{title:string;children:React.ReactNode}){return <section className="border-b border-lake/10 pb-5"><h3 className="text-xs font-bold uppercase tracking-widest text-muted">{title}</h3><div className="mt-3 space-y-3">{children}</div></section>}
function ReviewLine({label,detail,price}:{label:string;detail:string;price:string}){return <div className="flex justify-between gap-4"><div><p className="font-semibold text-lake">{label}</p><p className="mt-1 text-xs text-muted">{detail}</p></div><strong className="shrink-0 text-lake">{price}</strong></div>}
function GuestForm({value,onChange}:{value:GuestInformation;onChange:(value:GuestInformation)=>void}){const input='booking-input rounded-xl bg-ivory px-4';return <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-lake">First name<input required autoComplete="given-name" value={value.firstName} onChange={e=>onChange({...value,firstName:e.target.value})} className={input}/></label><label className="text-sm font-semibold text-lake">Last name<input required autoComplete="family-name" value={value.lastName} onChange={e=>onChange({...value,lastName:e.target.value})} className={input}/></label><label className="text-sm font-semibold text-lake">Email<input required type="email" autoComplete="email" value={value.email} onChange={e=>onChange({...value,email:e.target.value})} className={input}/></label><label className="text-sm font-semibold text-lake">Phone<input required type="tel" autoComplete="tel" value={value.phone} onChange={e=>onChange({...value,phone:e.target.value})} className={input}/></label><label className="text-sm font-semibold text-lake">Adults<input required type="number" min={1} value={value.adults} onChange={e=>onChange({...value,adults:Number(e.target.value)})} className={input}/></label><label className="text-sm font-semibold text-lake">Children<input required type="number" min={0} value={value.children} onChange={e=>onChange({...value,children:Number(e.target.value)})} className={input}/></label><label className="text-sm font-semibold text-lake sm:col-span-2">Country (optional)<input autoComplete="country-name" value={value.country} onChange={e=>onChange({...value,country:e.target.value})} className={input}/></label><p className="text-xs text-muted sm:col-span-2">Adults and children must equal the {value.adults+value.children} guest total selected above.</p><label className="text-sm font-semibold text-lake sm:col-span-2">Special requests (optional)<textarea rows={3} value={value.notes} onChange={e=>onChange({...value,notes:e.target.value})} className={`${input} py-3`}/></label></div>}
function Summary({state,addonTotal,total}:{state:ReturnType<typeof useBooking>['state'];addonTotal:number;total:number}){const experienceTotal=state.addons.filter(x=>x.type==='experience').reduce((sum,item)=>sum+item.price*(item.perGuest?item.quantity:1),0),transferTotal=addonTotal-experienceTotal;return <aside className="hidden rounded-[1.75rem] bg-lake p-7 text-white lg:sticky lg:top-6 lg:block"><p className="text-xs font-bold uppercase tracking-widest text-sand">Booking summary</p>{state.selectedRoom?<><h2 className="mt-4 font-serif text-3xl">{state.selectedRoom.room.name}</h2><dl className="mt-6 space-y-3 border-y border-white/15 py-5 text-sm"><Row label="Check-in" value={state.search.checkIn}/><Row label="Check-out" value={state.search.checkOut}/><Row label="Nights" value={String(state.selectedRoom.nights)}/><Row label="Guests" value={String(state.search.guests)}/><Row label="Room subtotal" value={formatMoney(state.selectedRoom.subtotal,state.selectedRoom.currency)}/><Row label="Experiences" value={formatMoney(experienceTotal,state.selectedRoom.currency)}/><Row label="Transportation" value={formatMoney(transferTotal,state.selectedRoom.currency)}/></dl><div className="flex items-end justify-between pt-6"><span className="text-sm text-white/65">Current total</span><strong className="font-serif text-4xl">{formatMoney(total,state.selectedRoom?.currency||'EUR')}</strong></div><p className="mt-4 text-xs leading-5 text-white/50">No taxes or fees have been added.</p></>:<p className="mt-5 text-sm leading-6 text-white/60">Choose dates and a room to see your complete stay summary.</p>}</aside>}
function Row({label,value}:{label:string;value:string}){return <div className="flex justify-between gap-4"><dt className="text-white/60">{label}</dt><dd className="text-right font-medium">{value||'—'}</dd></div>}
function Confirmation({reference}:{reference:string}){return <section className="rounded-[2rem] bg-ivory p-8 text-center md:p-14"><span className="mx-auto grid size-16 place-items-center rounded-full bg-green text-2xl text-white">✓</span><p className="eyebrow mt-7">Reservation saved</p><h1 className="mt-3 font-serif text-5xl text-lake">Opening your confirmation…</h1><p className="mt-6 text-sm font-bold text-lake">Reference: {reference}</p></section>}
