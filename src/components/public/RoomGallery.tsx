'use client';

import Image from 'next/image';
import {ResponsiveHeroImage,type ResponsiveHeroProps} from './ResponsiveHeroImage';
import{useDialogFocus}from'@/hooks/useDialogFocus';
import { useEffect, useState, useRef } from 'react';

export function RoomGallery({ images, roomName, hero }: { images: string[]; roomName: string;hero?:Omit<ResponsiveHeroProps,'desktopImage'> }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const panel=useRef<HTMLDivElement>(null);useDialogFocus(panel,open,()=>setOpen(false));
  useEffect(() => {
    if (!open || images.length < 2) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') setActive((value) => (value + 1) % images.length);
      if (event.key === 'ArrowLeft') setActive((value) => (value - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); };
  }, [images.length, open]);

  const show = (index: number) => { setActive(index); setOpen(true); };
  if (images.length === 0) return null;
  const multiple = images.length > 1;
  return (
    <>
      <div className={`grid gap-3 ${multiple ? 'md:grid-cols-[1.45fr_.55fr] md:grid-rows-2' : ''}`}>
        <button onClick={() => show(0)} className="relative aspect-[4/3] overflow-hidden rounded-3xl text-left md:row-span-2 md:aspect-auto md:min-h-[23rem]" aria-label={`Open gallery for ${roomName}`}>
          {hero?<ResponsiveHeroImage desktopImage={images[0]} {...hero} sizes="(max-width: 767px) 100vw, 70vw" className="object-cover transition-transform duration-500 hover:scale-[1.02]"/>:<Image src={images[0]} alt={`${roomName}, main view`} fill loading="eager" fetchPriority="high" sizes="(max-width: 768px) 100vw, 60vw" className="object-cover transition duration-500 hover:scale-[1.02]" />}
          <span className="absolute bottom-4 left-4 rounded-xl bg-white/90 px-4 py-3 text-xs font-bold text-lake shadow-sm backdrop-blur">Open gallery · {images.length} {multiple ? 'photos' : 'photo'}</span>
        </button>
        {images.slice(1, 3).map((image, index) => <button key={image} onClick={() => show(index + 1)} className={`relative hidden min-h-0 overflow-hidden rounded-3xl md:block ${images.length === 2 ? 'md:row-span-2' : ''}`} aria-label={`View ${index + 2} of ${roomName}`}><Image src={image} alt={`${roomName}, view ${index + 2}`} fill sizes="30vw" className="object-cover transition duration-500 hover:scale-[1.03]" /></button>)}
      </div>
      {open && <div ref={panel} tabIndex={-1} className="fixed inset-0 z-[70] flex flex-col bg-lake/98 p-4 text-white" role="dialog" aria-modal="true" aria-label={`${roomName} gallery`}><div className="flex items-center justify-between py-2"><p className="text-sm">{active + 1} / {images.length}</p><button onClick={() => setOpen(false)} className="grid size-12 place-items-center rounded-full border border-white/30 text-2xl" aria-label="Close gallery">×</button></div><div className="relative flex-1" onClick={() => setOpen(false)} aria-label="Close gallery backdrop"><Image src={images[active]} alt={`${roomName}, gallery image ${active + 1}`} fill sizes="100vw" className="object-contain" onClick={event => event.stopPropagation()} /></div>{multiple && <div className="flex justify-center gap-3 py-3"><button onClick={() => setActive((active - 1 + images.length) % images.length)} className="min-h-12 rounded-full border border-white/30 px-6" aria-label="Previous image">Previous</button><button onClick={() => setActive((active + 1) % images.length)} className="min-h-12 rounded-full border border-white/30 px-6" aria-label="Next image">Next</button></div>}</div>}
    </>
  );
}
