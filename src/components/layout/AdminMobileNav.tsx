'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from './AdminSidebar';

export function AdminMobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', close);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="min-h-11 rounded-lg border border-[#9ebfbc] bg-[#e8f4f5] px-4 text-sm font-semibold text-[#164b59] lg:hidden" aria-expanded={open} aria-controls="admin-mobile-menu">Menu</button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <button type="button" className="absolute inset-0 bg-[#123b46]/55" onClick={() => setOpen(false)} aria-label="Close navigation" />
          <div id="admin-mobile-menu" className="relative h-full w-[min(20rem,88vw)] shadow-2xl">
            <AdminSidebar onNavigate={() => setOpen(false)} />
            <button type="button" onClick={() => setOpen(false)} className="absolute right-3 top-3 grid size-11 place-items-center rounded-full border border-slate-200 bg-white text-xl" aria-label="Close navigation">×</button>
          </div>
        </div>
      )}
    </>
  );
}
