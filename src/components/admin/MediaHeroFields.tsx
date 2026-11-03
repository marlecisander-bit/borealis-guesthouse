'use client';

import Image from 'next/image';
import {useState} from 'react';
import {MediaPicker} from './MediaPicker';
import type {CmsOption} from '@/types/homepage-cms';

export function MediaHeroFields({data,media,desktopName='heroImageId'}:{data:Record<string,string>;media:CmsOption[];desktopName?:string}){
  const[desktop,setDesktop]=useState(media.find(x=>x.id===data[desktopName])?.imageUrl||''),[mobile,setMobile]=useState(media.find(x=>x.id===data.heroMobileImageId)?.imageUrl||'');
  const[points,setPoints]=useState({heroDesktopX:data.heroDesktopX||'50',heroDesktopY:data.heroDesktopY||'50',heroMobileX:data.heroMobileX||'50',heroMobileY:data.heroMobileY||'42'});
  return <fieldset className="col-span-full grid min-w-0 gap-5 sm:grid-cols-2"><legend className="mb-3 font-semibold">Hero images</legend>{(['desktop','mobile'] as const).map(kind=>{
    const phone=kind==='mobile',label=phone?'Mobile hero image':'Desktop hero image',x=phone?'heroMobileX':'heroDesktopX',y=phone?'heroMobileY':'heroDesktopY',url=phone?mobile||desktop:desktop;
    return <div key={kind} className="min-w-0 rounded-xl border border-slate-200 p-4">
      <MediaPicker name={phone?'heroMobileImageId':desktopName} label={label} assets={media} defaultValue={data[phone?'heroMobileImageId':desktopName]||''} onChange={(_,asset)=>(phone?setMobile:setDesktop)(asset?.imageUrl||'')}/>
      <p className="my-3 text-xs text-slate-500">{phone?'Optional. Portrait or tighter composition recommended. Clear to use the desktop image below 768px.':'Landscape recommended. Used from 768px upward.'}</p>
      <div className={`relative overflow-hidden rounded-lg bg-slate-100 ${phone?'mx-auto aspect-[3/4] max-w-60':'aspect-video'}`}>{url?<Image src={url} alt={`${label} crop preview`} fill sizes="(max-width:640px) 90vw, 400px" className="object-cover" style={{objectPosition:`${points[x]}% ${points[y]}%`}}/>:<p className="p-5 text-sm text-slate-500">Using the website fallback image.</p>}</div>
      <label className="mt-4 block text-sm font-semibold">{phone?'Mobile image alternative text':'Desktop image alternative text'}<input name={phone?'heroMobileImageAlt':'heroImageAlt'} defaultValue={data[phone?'heroMobileImageAlt':'heroImageAlt']||''} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal"/><span className="mt-1 block text-xs font-normal text-slate-500">{phone?'Describe the mobile composition, or leave blank to reuse the desktop description.':'Describe the image for visitors using assistive technology.'}</span></label>
      {([x,y] as const).map((name,i)=><label key={name} className="mt-3 block text-xs font-semibold">{label} focal {i?'vertical':'horizontal'} ({points[name]}%)<input name={name} type="range" min="0" max="100" step="1" value={points[name]} onChange={e=>setPoints(p=>({...p,[name]:e.target.value}))} className="mt-2 block w-full"/></label>)}
    </div>;
  })}</fieldset>;
}
