'use client';

import Image from 'next/image';
import Link from 'next/link';
import{useDialogFocus}from'@/hooks/useDialogFocus';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { GalleryItem } from '@/types/public';

export function GalleryExplorer({ items }: { items: GalleryItem[] }) {
  const categories = useMemo(() => ['All', ...Array.from(new Set(items.map(item => item.category)))], [items]);
  const [category, setCategory] = useState('All');
  const visible = category === 'All' ? items : items.filter(item => item.category === category);
  const [active, setActive] = useState<number | null>(null);
  const touchStart = useRef(0);
  const panel=useRef<HTMLDivElement>(null);useDialogFocus(panel,active!==null,()=>setActive(null));
  const move = (direction: number) => setActive(current => current === null ? null : (current + direction + visible.length) % visible.length);

  useEffect(() => {
    if (active === null || visible.length < 2) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') move(1);
      if (event.key === 'ArrowLeft') move(-1);
    };
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('keydown', key); };
  });

  if (!items.length) return <p className="rounded-2xl bg-ivory p-6 text-muted">Photos are coming soon. For a closer look at the guesthouse, <Link href="/rooms" className="font-semibold underline">browse the rooms</Link>.</p>;

  return <>
    {categories.length > 2 && <div className="mb-5 flex gap-2 overflow-x-auto pb-2" aria-label="Gallery categories">
      {categories.map(value => <button key={value} aria-pressed={category === value} onClick={() => { setCategory(value); setActive(null); }} className={`min-h-11 shrink-0 rounded-full px-5 text-sm font-bold ${category === value ? 'bg-lake text-white' : 'bg-ivory text-lake'}`}>{value}</button>)}
    </div>}
    <div className={`gap-4 ${visible.length > 1 ? "columns-1 sm:columns-2 lg:columns-3 lg:gap-5" : "max-w-3xl"}`}>
      {visible.map((item, index) => <figure key={item.id} className="mb-4 break-inside-avoid lg:mb-5">
        <button onClick={() => setActive(index)} className="group relative block w-full overflow-hidden rounded-[1.5rem] text-left" aria-label={`Open image: ${item.alt}`}>
          <Image src={item.src} alt={item.alt} loading={index === 0 ? "eager" : "lazy"} width={item.width && item.height ? item.width : 1200} height={item.width && item.height ? item.height : 900} sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw" className="h-auto w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-lake/80 to-transparent px-5 pb-5 pt-14 text-sm text-white opacity-90">{item.alt}</span>
        </button>
        <figcaption className="sr-only">{item.alt} · {item.category}</figcaption>
      </figure>)}
    </div>
    {active !== null && visible[active] && <div ref={panel} tabIndex={-1} className="fixed inset-0 z-[80] flex flex-col bg-lake/98 p-3 text-white sm:p-4" role="dialog" aria-modal="true" aria-label="Borealis photo gallery" onTouchStart={event => touchStart.current = event.changedTouches[0].clientX} onTouchEnd={event => { const delta = event.changedTouches[0].clientX - touchStart.current; if (visible.length > 1 && Math.abs(delta) > 55) move(delta < 0 ? 1 : -1); }}>
      <header className="flex items-center justify-between"><p className="text-sm">{active + 1} / {visible.length}</p><button onClick={() => setActive(null)} className="grid size-12 place-items-center rounded-full border border-white/25 text-2xl" aria-label="Close lightbox">×</button></header>
      <div className="relative flex-1" onClick={() => setActive(null)} aria-label="Close gallery backdrop">
        <Image src={visible[active].src} alt={visible[active].alt} fill sizes="100vw" className="object-contain" onClick={event => event.stopPropagation()} />
      </div>
      {visible.length > 1 && <footer className="grid grid-cols-2 gap-3 py-3 sm:grid-cols-[auto_1fr_auto] sm:items-center"><button onClick={() => move(-1)} className="min-h-12 rounded-full border border-white/25 px-5" aria-label="Previous image">Previous</button><p className="hidden text-center text-sm text-white/70 sm:block">{visible[active].alt}</p><button onClick={() => move(1)} className="min-h-12 rounded-full border border-white/25 px-5" aria-label="Next image">Next</button></footer>}
    </div>}
  </>;
}
