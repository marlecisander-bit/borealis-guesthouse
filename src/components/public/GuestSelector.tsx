'use client';

import { useEffect,useRef,useState } from 'react';
import type { OccupancyCounts } from '@/types/booking';
import { occupancyLabel,totalGuests } from '@/lib/booking/occupancy';
import { MAX_BOOKING_GUESTS } from '@/lib/booking/search-criteria';

type GuestSelectorProps={value:OccupancyCounts;onChange:(value:OccupancyCounts)=>void;infantMaxAge?:number;childMaxAge?:number;fieldClassName?:string;submitNames?:boolean};

export function GuestSelector({value,onChange,infantMaxAge=2,childMaxAge=12,fieldClassName='',submitNames=false}:GuestSelectorProps){
  const[open,setOpen]=useState(false),root=useRef<HTMLDivElement>(null),total=totalGuests(value);
  useEffect(()=>{const close=(event:MouseEvent)=>{if(root.current&&!root.current.contains(event.target as Node))setOpen(false)};document.addEventListener('mousedown',close);return()=>document.removeEventListener('mousedown',close)},[]);
  const change=(key:keyof OccupancyCounts,delta:number)=>{const next={...value,[key]:Math.max(0,value[key]+delta)};if(totalGuests(next)<=MAX_BOOKING_GUESTS)onChange(next)};
  const adultError=value.adults<1?'At least one adult is required for bookings with children or infants.':'';
  return <div ref={root} className="relative">
    {submitNames&&<><input type="hidden" name="guests" value={total}/><input type="hidden" name="adults" value={value.adults}/><input type="hidden" name="children" value={value.children}/><input type="hidden" name="infants" value={value.infants}/></>}
    <button type="button" onClick={()=>setOpen(current=>!current)} aria-haspopup="dialog" aria-expanded={open} className={fieldClassName}>
      <span>Guests</span><strong className="block normal-case tracking-normal">{occupancyLabel(value)}</strong>
    </button>
    {open&&<div role="dialog" aria-label="Choose guests" className="fixed inset-x-4 bottom-4 z-50 rounded-2xl bg-white p-5 text-left text-lake shadow-2xl md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-[calc(100%+.5rem)] md:w-80">
      <div className="space-y-4">
        <Counter label="Adults" detail={`Ages ${childMaxAge+1}+`} value={value.adults} onMinus={()=>change('adults',-1)} onPlus={()=>change('adults',1)} plusDisabled={total>=MAX_BOOKING_GUESTS}/>
        <Counter label="Children" detail={`Ages ${infantMaxAge+1}–${childMaxAge}`} value={value.children} onMinus={()=>change('children',-1)} onPlus={()=>change('children',1)} plusDisabled={total>=MAX_BOOKING_GUESTS}/>
        <Counter label="Infants" detail={`Ages 0–${infantMaxAge}`} value={value.infants} onMinus={()=>change('infants',-1)} onPlus={()=>change('infants',1)} plusDisabled={total>=MAX_BOOKING_GUESTS}/>
      </div>
      {adultError&&<p role="alert" className="mt-4 text-xs leading-5 text-red-700">{adultError}</p>}
      <button type="button" onClick={()=>setOpen(false)} className="mt-5 min-h-11 w-full rounded-full bg-brand px-5 text-sm font-bold text-white">Done</button>
    </div>}
  </div>;
}

function Counter({label,detail,value,onMinus,onPlus,plusDisabled}:{label:string;detail:string;value:number;onMinus:()=>void;onPlus:()=>void;plusDisabled:boolean}){
  return <div className="flex items-center justify-between gap-4"><div><strong className="block text-sm">{label}</strong><span className="text-xs text-muted">{detail}</span></div><div className="flex items-center gap-3"><button type="button" onClick={onMinus} disabled={value===0} aria-label={`Remove ${label.toLowerCase()}`} className="grid size-11 place-items-center rounded-full border border-lake/20 text-xl disabled:opacity-35">−</button><output className="w-5 text-center font-bold">{value}</output><button type="button" onClick={onPlus} disabled={plusDisabled} aria-label={`Add ${label.toLowerCase()}`} className="grid size-11 place-items-center rounded-full border border-lake/20 text-xl disabled:opacity-35">+</button></div></div>;
}
