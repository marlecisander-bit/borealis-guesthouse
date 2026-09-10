'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { GalleryItem } from '@/types/public';

export function GalleryExplorer({ items }: { items: GalleryItem[] }) {
  const categories = useMemo(() => ['All', ...Array.from(new Set(items.map((item) => item.category)))], [items]);
  const [category, setCategory] = useState('All');
  const visible = category === 'All' ? items : items.filter((item) => item.category === category);
  const [active, setActive] = useState<number | null>(null);
  const touchStart = useRef(0);
  const move = (direction: number) => setActive((current) => current === null ? null : (current + direction + visible.length) % visible.length);
  useEffect(() => {
    if (active === null) return;
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') setActive(null); if (event.key === 'ArrowRight') move(1); if (event.key === 'ArrowLeft') move(-1); };
    document.body.style.overflow = 'hidden'; window.addEventListener('keydown', key);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', key); };
  });

  return <>
    <div className="mb-9 flex gap-2 overflow-x-auto pb-2" aria-label="Gallery categories">{categories.map((value)=><button key={value} onClick={()=>{setCategory(value);setActive(null)}} className={`min-h-11 shrink-0 rounded-full px-5 text-sm font-bold ${category===value?'bg-lake text-white':'bg-ivory text-lake'}`}>{value}</button>)}</div>
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 lg:gap-5">
      {visible.map((item,index)=><figure key={item.id} className="mb-4 break-inside-avoid lg:mb-5"><button onClick={()=>setActive(index)} className="group relative block w-full overflow-hidden rounded-[1.5rem] text-left" aria-label={`Open image: ${item.alt}`}><Image src={item.src} alt={item.alt} width={1200} height={index%3===0?1500:900} sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw" className="h-auto w-full object-cover transition duration-700 group-hover:scale-[1.03]"/><span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-lake/80 to-transparent px-5 pb-5 pt-14 text-sm text-white opacity-90">{item.alt}</span></button><figcaption className="sr-only">{item.alt} · {item.category}</figcaption></figure>)}
    </div>
    {active!==null&&visible[active]&&<div className="fixed inset-0 z-[80] flex flex-col bg-lake/98 p-3 text-white sm:p-4" role="dialog" aria-modal="true" aria-label="Borealis photo gallery" onTouchStart={(event)=>touchStart.current=event.changedTouches[0].clientX} onTouchEnd={(event)=>{const delta=event.changedTouches[0].clientX-touchStart.current;if(Math.abs(delta)>55)move(delta<0?1:-1)}}><header className="flex items-center justify-between"><p className="text-sm">{active+1} / {visible.length}</p><button autoFocus onClick={()=>setActive(null)} className="grid size-12 place-items-center rounded-full border border-white/25 text-2xl" aria-label="Close lightbox">×</button></header><div className="relative flex-1"><Image src={visible[active].src} alt={visible[active].alt} fill sizes="100vw" className="object-contain"/></div><footer className="grid grid-cols-2 gap-3 py-3 sm:grid-cols-[auto_1fr_auto] sm:items-center"><button onClick={()=>move(-1)} className="min-h-12 rounded-full border border-white/25 px-5" aria-label="Previous image">Previous</button><p className="hidden text-center text-sm text-white/70 sm:block">{visible[active].alt}</p><button onClick={()=>move(1)} className="min-h-12 rounded-full border border-white/25 px-5" aria-label="Next image">Next</button></footer></div>}
  </>;
}
