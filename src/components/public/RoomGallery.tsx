'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

export function RoomGallery({ images, roomName }: { images: string[]; roomName: string }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
      if (event.key === 'ArrowRight') setActive((value) => (value + 1) % images.length);
      if (event.key === 'ArrowLeft') setActive((value) => (value - 1 + images.length) % images.length);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [images.length, open]);

  const show = (index: number) => { setActive(index); setOpen(true); };
  return (
    <>
      <div className="grid gap-3 md:grid-cols-[1.45fr_.55fr] md:grid-rows-2">
        <button onClick={() => show(0)} className="relative min-h-[28rem] overflow-hidden rounded-[1.75rem] text-left md:row-span-2 md:min-h-[38rem]" aria-label={`Open gallery for ${roomName}`}>
          <Image src={images[0]} alt={`${roomName}, main view`} fill priority sizes="(max-width: 768px) 100vw, 70vw" className="object-cover transition duration-500 hover:scale-[1.02]" />
          <span className="absolute bottom-4 left-4 rounded-xl bg-white/90 px-4 py-3 text-xs font-bold text-lake shadow-sm backdrop-blur">Open gallery · {images.length} photos</span>
        </button>
        {images.slice(1, 3).map((image, index) => <button key={image} onClick={() => show(index + 1)} className="relative hidden min-h-0 overflow-hidden rounded-[1.75rem] md:block" aria-label={`View ${index + 2} of ${roomName}`}><Image src={image} alt={`${roomName}, view ${index + 2}`} fill sizes="30vw" className="object-cover transition duration-500 hover:scale-[1.03]" /></button>)}
      </div>
      {open && <div className="fixed inset-0 z-[70] flex flex-col bg-lake/98 p-4 text-white" role="dialog" aria-modal="true" aria-label={`${roomName} gallery`}><div className="flex items-center justify-between py-2"><p className="text-sm">{active + 1} / {images.length}</p><button onClick={() => setOpen(false)} autoFocus className="grid size-12 place-items-center rounded-full border border-white/30 text-2xl" aria-label="Close gallery">×</button></div><div className="relative flex-1"><Image src={images[active]} alt={`${roomName}, gallery image ${active + 1}`} fill sizes="100vw" className="object-contain" /></div><div className="flex justify-center gap-3 py-3"><button onClick={() => setActive((active - 1 + images.length) % images.length)} className="min-h-12 rounded-full border border-white/30 px-6" aria-label="Previous image">Previous</button><button onClick={() => setActive((active + 1) % images.length)} className="min-h-12 rounded-full border border-white/30 px-6" aria-label="Next image">Next</button></div></div>}
    </>
  );
}
